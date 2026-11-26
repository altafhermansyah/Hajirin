<?php

namespace App\Http\Controllers;

use App\Http\Requests\AcceptTicketTransferRequest;
use App\Http\Requests\InitiateTicketTransferRequest;
use App\Mail\TicketTransferCompletedMail;
use App\Mail\TicketTransferInviteMail;
use App\Models\Refund;
use App\Models\Ticket;
use App\Models\TicketTransfer;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TicketTransferController extends Controller
{
    /**
     * Inisiasi transfer e-tiket aktif ke email tujuan dengan kode unik 6 karakter.
     */
    public function initiate(InitiateTicketTransferRequest $request, string $ticketId): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $recipientEmail = $validated['recipient_email'];
        $recipientName = $validated['recipient_name'];

        if (mb_strtolower($recipientEmail) === mb_strtolower($user->email)) {
            throw ValidationException::withMessages([
                'recipient_email' => 'Anda tidak dapat mentransfer tiket ke alamat email akun Anda sendiri.',
            ]);
        }

        $transferSummary = DB::transaction(function () use ($user, $ticketId, $recipientName, $recipientEmail): array {
            $ticket = Ticket::query()
                ->with(['order.event', 'orderItem.ticketType'])
                ->whereKey($ticketId)
                ->lockForUpdate()
                ->firstOrFail();

            $order = $ticket->order;
            $event = $order?->event;
            $currentHolderId = $ticket->holder_user_id ?: $order?->user_id;

            if (! $order || ! $event || $currentHolderId !== $user->id) {
                abort(403, 'Anda bukan pemegang sah dari e-tiket ini.');
            }

            if ($order->status !== 'PAID') {
                throw ValidationException::withMessages([
                    'transfer' => 'Hanya tiket dari pesanan berstatus lunas yang dapat ditransfer.',
                ]);
            }

            if ($ticket->status !== 'ACTIVE') {
                throw ValidationException::withMessages([
                    'transfer' => 'Hanya e-tiket berstatus aktif (belum check-in dan tidak dibatalkan) yang dapat ditransfer.',
                ]);
            }

            if ($event->status === 'CANCELLED' || Carbon::parse($event->ends_at)->isPast()) {
                throw ValidationException::withMessages([
                    'transfer' => 'Tiket tidak dapat ditransfer karena acara sudah berakhir atau dibatalkan.',
                ]);
            }

            $hasActiveRefund = Refund::query()
                ->where('order_id', $order->id)
                ->whereIn('status', ['PENDING', 'APPROVED', 'COMPLETED'])
                ->exists();

            if ($hasActiveRefund) {
                throw ValidationException::withMessages([
                    'transfer' => 'Tiket tidak dapat ditransfer karena pesanan sedang atau telah diproses pengembalian dana (refund).',
                ]);
            }

            // Kedaluwarsakan transfer PENDING lama pada tiket ini jika sudah lewat batas 24 jam
            TicketTransfer::query()
                ->where('ticket_id', $ticket->id)
                ->where('status', 'PENDING')
                ->where('expires_at', '<=', now())
                ->update([
                    'status' => 'EXPIRED',
                    'updated_at' => now(),
                ]);

            $hasPendingTransfer = TicketTransfer::query()
                ->where('ticket_id', $ticket->id)
                ->where('status', 'PENDING')
                ->exists();

            if ($hasPendingTransfer) {
                throw ValidationException::withMessages([
                    'transfer' => 'Tiket ini sedang memiliki undangan transfer aktif. Batalkan undangan sebelumnya terlebih dahulu jika ingin mengirim ulang.',
                ]);
            }

            // Buat kode unik 6 karakter (tanpa karakter ambigu 0/O/1/I/L)
            $alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
            $plainCode = '';
            $maxIndex = strlen($alphabet) - 1;
            for ($i = 0; $i < 6; $i++) {
                $plainCode .= $alphabet[random_int(0, $maxIndex)];
            }

            $expiresAt = now()->addHours(TicketTransfer::EXPIRE_HOURS);
            $token = Str::random(48);

            $transfer = new TicketTransfer([
                'ticket_id' => $ticket->id,
                'from_user_id' => $user->id,
                'recipient_name' => $recipientName,
                'recipient_email' => $recipientEmail,
                'code_hash' => Hash::make($plainCode),
                'token' => $token,
                'attempts' => 0,
                'expires_at' => $expiresAt,
            ]);
            $transfer->forceFill(['status' => 'PENDING'])->save();

            $startCarbon = Carbon::parse($event->starts_at)->timezone(config('app.timezone'))->locale('id');
            $endCarbon = Carbon::parse($event->ends_at)->timezone(config('app.timezone'))->locale('id');
            $eventLocation = $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan');
            $expiresFormatted = $expiresAt->copy()->timezone(config('app.timezone'))->locale('id')->translatedFormat('d M Y, H:i').' WIB';

            $claimUrl = route('ticket-transfers.show', $token);

            Mail::to($recipientEmail)->send((new TicketTransferInviteMail([
                'senderName' => $user->name,
                'recipientName' => $recipientName,
                'recipientEmail' => $recipientEmail,
                'eventTitle' => $event->title,
                'ticketTypeName' => $ticket->orderItem?->ticketType?->name ?? 'Tiket Masuk',
                'eventDate' => $startCarbon->translatedFormat('l, d F Y'),
                'eventTime' => $startCarbon->format('H:i').' - '.$endCarbon->format('H:i').' WIB',
                'eventLocation' => $eventLocation,
                'transferCode' => $plainCode,
                'claimUrl' => $claimUrl,
                'expiresAtFormatted' => $expiresFormatted,
            ]))->afterCommit());

            return [
                'recipient_email' => $recipientEmail,
                'expires_at' => $expiresFormatted,
            ];
        });

        return back()->with(
            'success',
            "Undangan transfer tiket dan kode unik 6 karakter telah dikirim ke {$transferSummary['recipient_email']} (berlaku hingga {$transferSummary['expires_at']})."
        );
    }

    /**
     * Batalkan undangan transfer tiket yang masih berstatus PENDING.
     */
    public function cancel(Request $request, string $id): RedirectResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user, $id): void {
            $transfer = TicketTransfer::query()
                ->whereKey($id)
                ->where('from_user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($transfer->status !== 'PENDING') {
                throw ValidationException::withMessages([
                    'transfer' => 'Undangan transfer ini sudah tidak dapat dibatalkan.',
                ]);
            }

            $transfer->forceFill(['status' => 'CANCELLED'])->save();
        });

        return back()->with('success', 'Undangan transfer tiket berhasil dibatalkan. E-tiket tetap aktif di akun Anda.');
    }

    /**
     * Tampilkan halaman klaim transfer tiket (dapat dibuka oleh guest maupun user login).
     */
    public function show(Request $request, string $token): Response
    {
        $transfer = TicketTransfer::query()
            ->with(['ticket.order.event', 'ticket.orderItem.ticketType', 'fromUser:id,name,email'])
            ->where('token', $token)
            ->firstOrFail();

        if ($transfer->status === 'PENDING' && $transfer->expires_at->isPast()) {
            $transfer->forceFill(['status' => 'EXPIRED'])->save();
            $transfer->refresh();
        }

        $user = $request->user();
        $ticket = $transfer->ticket;
        $event = $ticket?->order?->event;
        $emailMatches = $user !== null
            && mb_strtolower($user->email) === mb_strtolower($transfer->recipient_email);

        $startCarbon = $event
            ? Carbon::parse($event->starts_at)->timezone(config('app.timezone'))->locale('id')
            : null;
        $expiresCarbon = $transfer->expires_at->copy()->timezone(config('app.timezone'))->locale('id');

        return Inertia::render('Ticket/AcceptTransfer', [
            'transfer' => [
                'id' => $transfer->id,
                'token' => $transfer->token,
                'status' => $transfer->status,
                'senderName' => $transfer->fromUser?->name ?? 'Pengguna Hajirin',
                'recipientName' => $transfer->recipient_name,
                'recipientEmail' => $transfer->recipient_email,
                'attempts' => (int) $transfer->attempts,
                'maxAttempts' => TicketTransfer::MAX_ATTEMPTS,
                'expiresAtIso' => $expiresCarbon->toIso8601String(),
                'expiresAtFormatted' => $expiresCarbon->translatedFormat('d M Y, H:i').' WIB',
                'acceptedAtFormatted' => $transfer->accepted_at
                    ? $transfer->accepted_at->copy()->timezone(config('app.timezone'))->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                    : null,
            ],
            'event' => $event ? [
                'title' => $event->title,
                'slug' => $event->slug,
                'dateFormatted' => $startCarbon?->translatedFormat('l, d F Y • H:i').' WIB',
                'location' => $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                'banner' => $event->banner_path ?: '/images/events/tech_hero.webp',
                'ticketTypeName' => $ticket?->orderItem?->ticketType?->name ?? 'Tiket Masuk',
            ] : null,
            'emailMatches' => $emailMatches,
            'orderReference' => $transfer->status === 'ACCEPTED' && $emailMatches
                ? $ticket?->order?->order_reference
                : null,
        ]);
    }

    /**
     * Klaim transfer e-tiket dengan kode unik 6 karakter, merotasi QR code, dan memindahkan kepemilikan.
     */
    public function accept(AcceptTicketTransferRequest $request, string $token): RedirectResponse
    {
        $user = $request->user();
        $code = $request->validated('code');

        $outcome = DB::transaction(function () use ($user, $token, $code): array {
            $transfer = TicketTransfer::query()
                ->with(['fromUser'])
                ->where('token', $token)
                ->lockForUpdate()
                ->firstOrFail();

            if ($transfer->status !== 'PENDING') {
                return [
                    'ok' => false,
                    'error' => 'Undangan transfer tiket ini sudah tidak aktif (status: '.$transfer->status.').',
                ];
            }

            if ($transfer->expires_at->isPast()) {
                $transfer->forceFill(['status' => 'EXPIRED'])->save();

                return [
                    'ok' => false,
                    'error' => 'Undangan transfer tiket telah kedaluwarsa. Minta pengirim membuat transfer baru.',
                ];
            }

            if (mb_strtolower($user->email) !== mb_strtolower($transfer->recipient_email)) {
                return [
                    'ok' => false,
                    'error' => "Undangan transfer ini ditujukan untuk email {$transfer->recipient_email}. Silakan masuk menggunakan akun dengan alamat email tersebut.",
                ];
            }

            if ($transfer->attempts >= TicketTransfer::MAX_ATTEMPTS) {
                $transfer->forceFill(['status' => 'EXPIRED'])->save();

                return [
                    'ok' => false,
                    'error' => 'Batas percobaan memasukkan kode unik telah habis. Minta pengirim mengirim ulang undangan transfer.',
                ];
            }

            if (! Hash::check($code, $transfer->code_hash)) {
                $nextAttempts = $transfer->attempts + 1;
                $remaining = max(0, TicketTransfer::MAX_ATTEMPTS - $nextAttempts);

                $update = ['attempts' => $nextAttempts];
                if ($remaining === 0) {
                    $update['status'] = 'EXPIRED';
                }
                $transfer->forceFill($update)->save();

                return [
                    'ok' => false,
                    'error' => $remaining > 0
                        ? "Kode unik transfer tidak sesuai. Sisa percobaan: {$remaining} kali."
                        : 'Kode unik salah terlalu banyak kali. Undangan transfer otomatis dinonaktifkan.',
                ];
            }

            $ticket = Ticket::query()
                ->with(['order.event', 'orderItem.ticketType'])
                ->whereKey($transfer->ticket_id)
                ->lockForUpdate()
                ->firstOrFail();

            $order = $ticket->order;
            $event = $order?->event;

            if (! $order || ! $event || $order->status !== 'PAID' || $ticket->status !== 'ACTIVE') {
                return [
                    'ok' => false,
                    'error' => 'E-tiket sudah tidak aktif atau tidak dapat diklaim lagi.',
                ];
            }

            if ($event->status === 'CANCELLED' || Carbon::parse($event->ends_at)->isPast()) {
                return [
                    'ok' => false,
                    'error' => 'Acara pada tiket ini sudah berakhir atau dibatalkan.',
                ];
            }

            $hasActiveRefund = Refund::query()
                ->where('order_id', $order->id)
                ->whereIn('status', ['PENDING', 'APPROVED', 'COMPLETED'])
                ->exists();

            if ($hasActiveRefund) {
                return [
                    'ok' => false,
                    'error' => 'Tiket ini sedang dalam proses pengembalian dana sehingga tidak dapat diklaim.',
                ];
            }

            // Rotasi kode QR tiket agar kode lama milik pengirim otomatis hangus
            $newTicketCode = 'HJR-TKT-'.date('Y').'-'.strtoupper(Str::random(8));
            $now = now();

            $ticket->update([
                'ticket_code' => $newTicketCode,
                'holder_user_id' => $user->id,
                'attendee_name' => $user->name,
                'attendee_email' => $user->email,
                'attendee_phone' => $user->phone ?: $ticket->attendee_phone,
            ]);

            $transfer->forceFill([
                'status' => 'ACCEPTED',
                'to_user_id' => $user->id,
                'accepted_at' => $now,
            ])->save();

            $completedAtFormatted = $now->copy()->timezone(config('app.timezone'))->locale('id')->translatedFormat('d M Y, H:i').' WIB';
            $ticketTypeName = $ticket->orderItem?->ticketType?->name ?? 'Tiket Masuk';
            $ticketUrl = url('/my-tickets/'.$order->order_reference);

            DB::table('notifications')->insert([
                [
                    'id' => Str::uuid()->toString(),
                    'user_id' => $user->id,
                    'type' => 'TICKET_AVAILABLE',
                    'title' => 'E-Tiket Transfer Berhasil Diklaim!',
                    'message' => "Anda kini resmi memegang e-tiket {$event->title} ({$ticketTypeName}) dengan kode QR baru.",
                    'action_url' => '/my-tickets/'.$order->order_reference,
                    'created_at' => $now,
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'user_id' => $transfer->from_user_id,
                    'type' => 'EVENT_UPDATED',
                    'title' => 'Transfer E-Tiket Telah Diterima',
                    'message' => "E-tiket {$event->title} telah diklaim oleh {$user->name} ({$user->email}).",
                    'action_url' => '/dashboard#tiket',
                    'created_at' => $now,
                ],
            ]);

            $baseMailPayload = [
                'senderName' => $transfer->fromUser?->name ?? 'Pengirim Tiket',
                'recipientName' => $user->name,
                'recipientEmail' => $user->email,
                'eventTitle' => $event->title,
                'ticketTypeName' => $ticketTypeName,
                'completedAtFormatted' => $completedAtFormatted,
                'ticketUrl' => $ticketUrl,
            ];

            Mail::to($user->email)->send((new TicketTransferCompletedMail(array_merge($baseMailPayload, [
                'isRecipient' => true,
                'newTicketCode' => $newTicketCode,
            ])))->afterCommit());

            if ($transfer->fromUser?->email) {
                Mail::to($transfer->fromUser->email)->send((new TicketTransferCompletedMail(array_merge($baseMailPayload, [
                    'isRecipient' => false,
                ])))->afterCommit());
            }

            return [
                'ok' => true,
                'order_reference' => $order->order_reference,
            ];
        });

        if (! $outcome['ok']) {
            throw ValidationException::withMessages([
                'code' => $outcome['error'],
            ]);
        }

        return redirect()
            ->route('my-tickets.show', $outcome['order_reference'])
            ->with('success', 'Selamat! E-tiket berhasil diklaim dengan kode QR baru dan telah masuk ke Tiket Saya.');
    }
}
