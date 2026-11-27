<?php

namespace App\Support;

use App\Models\Event;
use App\Models\Ticket;
use App\Models\User;
use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class TicketCheckIn
{
    /**
     * Verifikasi dan catat check-in e-tiket berdasarkan kode tiket secara atomik.
     *
     * @param  Closure(Event): ?string  $authorizeEvent  Mengembalikan null jika diizinkan, atau pesan error jika tidak berwenang.
     * @param  list<string>  $allowedEventStatuses
     * @return array{outcome: string, message: string, ticket: ?array<string, mixed>, eventTimestamp: int}
     */
    public static function verifyByCode(
        User $actor,
        string $rawTicketCode,
        ?string $selectedEventId,
        Closure $authorizeEvent,
        array $allowedEventStatuses = ['PUBLISHED', 'ONGOING'],
        bool $includeOrganizerName = false,
        bool $checkWindow = true,
        string $eventMismatchLabel = 'dipilih',
    ): array {
        $ticketCode = strtoupper(trim($rawTicketCode));
        $eventTimestamp = now()->getPreciseTimestamp(3);

        return DB::transaction(function () use (
            $actor,
            $ticketCode,
            $selectedEventId,
            $authorizeEvent,
            $allowedEventStatuses,
            $includeOrganizerName,
            $checkWindow,
            $eventMismatchLabel,
            $eventTimestamp,
        ): array {
            $relations = ['order.event', 'orderItem.ticketType', 'checkedInByUser'];
            if ($includeOrganizerName) {
                $relations[] = 'order.event.eo';
            }

            $ticket = Ticket::with($relations)
                ->where('ticket_code', $ticketCode)
                ->lockForUpdate()
                ->first();

            if (! $ticket || ! $ticket->order || ! $ticket->order->event) {
                return [
                    'outcome' => 'invalid',
                    'message' => "Kode e-tiket {$ticketCode} tidak ditemukan di sistem.",
                    'ticket' => null,
                    'eventTimestamp' => $eventTimestamp,
                ];
            }

            $order = $ticket->order;
            $event = $order->event;

            $authError = $authorizeEvent($event);
            if ($authError !== null) {
                return [
                    'outcome' => 'invalid',
                    'message' => $authError,
                    'ticket' => null,
                    'eventTimestamp' => $eventTimestamp,
                ];
            }

            $ticketPayload = [
                'ticketCode' => $ticket->ticket_code,
                'attendeeName' => $ticket->attendee_name,
                'attendeeEmail' => $ticket->attendee_email,
                'eventTitle' => $event->title,
                'ticketTypeName' => $ticket->orderItem?->ticketType?->name ?? '-',
                'orderReference' => $order->order_reference,
            ];

            if ($includeOrganizerName) {
                $ticketPayload['organizerName'] = DB::table('eo_applications')
                    ->where('user_id', $event->eo_id)
                    ->where('status', 'APPROVED')
                    ->value('organization_name') ?? $event->eo?->name ?? 'EO Platform';
            }

            if (! empty($selectedEventId) && $event->id !== $selectedEventId) {
                return [
                    'outcome' => 'invalid',
                    'message' => "Tiket ini terdaftar untuk event \"{$event->title}\", bukan event yang sedang {$eventMismatchLabel}.",
                    'ticket' => $ticketPayload,
                    'eventTimestamp' => $eventTimestamp,
                ];
            }

            if ($order->status !== 'PAID') {
                return [
                    'outcome' => 'invalid',
                    'message' => 'Pesanan untuk e-tiket ini belum lunas atau telah dibatalkan.',
                    'ticket' => $ticketPayload,
                    'eventTimestamp' => $eventTimestamp,
                ];
            }

            if (! in_array($event->status, $allowedEventStatuses, true)) {
                return [
                    'outcome' => 'invalid',
                    'message' => "Check-in tidak tersedia karena status event saat ini adalah {$event->status}.",
                    'ticket' => $ticketPayload,
                    'eventTimestamp' => $eventTimestamp,
                ];
            }

            if ($ticket->status === 'CANCELLED') {
                return [
                    'outcome' => 'invalid',
                    'message' => 'E-tiket ini sudah dibatalkan dan tidak berlaku lagi.',
                    'ticket' => $ticketPayload,
                    'eventTimestamp' => $eventTimestamp,
                ];
            }

            $hasPendingRefund = DB::table('refunds')
                ->where('order_id', $order->id)
                ->where('status', 'PENDING')
                ->exists();

            if ($hasPendingRefund) {
                return [
                    'outcome' => 'invalid',
                    'message' => 'Check-in ditolak karena pesanan ini sedang dalam proses pengajuan pengembalian dana (refund).',
                    'ticket' => $ticketPayload,
                    'eventTimestamp' => $eventTimestamp,
                ];
            }

            if ($ticket->status === 'USED') {
                $checkedInAt = $ticket->checked_in_at
                    ? Format::wib($ticket->checked_in_at)
                    : '-';
                $checkerName = $ticket->checkedInByUser?->name ?? 'Petugas';

                return [
                    'outcome' => 'already_used',
                    'message' => "E-tiket sudah pernah check-in pada {$checkedInAt} oleh {$checkerName}.",
                    'ticket' => array_merge($ticketPayload, [
                        'checkedInAtFormatted' => $checkedInAt,
                        'checkedInByName' => $checkerName,
                    ]),
                    'eventTimestamp' => $eventTimestamp,
                ];
            }

            if ($checkWindow && method_exists($event, 'checkInWindowError')) {
                $windowError = $event->checkInWindowError();
                if ($windowError !== null) {
                    return [
                        'outcome' => 'invalid',
                        'message' => $windowError,
                        'ticket' => $ticketPayload,
                        'eventTimestamp' => $eventTimestamp,
                    ];
                }
            }

            $now = now();
            $ticket->forceFill([
                'status' => 'USED',
                'checked_in_at' => $now,
                'checked_in_by' => $actor->id,
            ])->save();

            DB::table('ticket_transfers')
                ->where('ticket_id', $ticket->id)
                ->where('status', 'PENDING')
                ->update([
                    'status' => 'CANCELLED',
                    'updated_at' => $now,
                ]);

            $checkedInAt = Format::wib($now);

            return [
                'outcome' => 'success',
                'message' => 'Check-in berhasil diverifikasi. Peserta dipersilakan masuk.',
                'ticket' => array_merge($ticketPayload, [
                    'checkedInAtFormatted' => $checkedInAt,
                    'checkedInByName' => $actor->name,
                ]),
                'eventTimestamp' => $eventTimestamp,
            ];
        });
    }

    /**
     * Verifikasi dan catat check-in manual berdasarkan ID tiket (digunakan Admin).
     */
    public static function verifyById(User $actor, string $ticketId): Ticket
    {
        $checkedTicket = null;

        DB::transaction(function () use ($actor, $ticketId, &$checkedTicket): void {
            $ticket = Ticket::with(['order.event'])
                ->where('id', $ticketId)
                ->lockForUpdate()
                ->firstOrFail();

            $order = $ticket->order;
            $event = $order?->event;

            if (! $order || $order->status !== 'PAID') {
                throw ValidationException::withMessages([
                    'ticket' => 'Pesanan untuk e-tiket ini belum lunas atau telah dibatalkan.',
                ]);
            }

            if (! $event || ! in_array($event->status, ['PUBLISHED', 'ONGOING'], true)) {
                throw ValidationException::withMessages([
                    'ticket' => 'Check-in tidak dapat dilakukan karena status event tidak aktif.',
                ]);
            }

            if ($ticket->status === 'USED') {
                throw ValidationException::withMessages([
                    'ticket' => 'Tiket ini sudah pernah digunakan untuk check-in sebelumnya.',
                ]);
            }

            if ($ticket->status === 'CANCELLED') {
                throw ValidationException::withMessages([
                    'ticket' => 'Tiket ini telah dibatalkan (CANCELLED) dan tidak dapat digunakan untuk check-in.',
                ]);
            }

            $hasPendingRefund = DB::table('refunds')
                ->where('order_id', $order->id)
                ->where('status', 'PENDING')
                ->exists();

            if ($hasPendingRefund) {
                throw ValidationException::withMessages([
                    'ticket' => 'Check-in ditolak karena pesanan ini sedang dalam proses pengajuan pengembalian dana (refund).',
                ]);
            }

            $now = now();
            $ticket->forceFill([
                'status' => 'USED',
                'checked_in_at' => $now,
                'checked_in_by' => $actor->id,
            ])->save();

            DB::table('ticket_transfers')
                ->where('ticket_id', $ticket->id)
                ->where('status', 'PENDING')
                ->update([
                    'status' => 'CANCELLED',
                    'updated_at' => $now,
                ]);

            $checkedTicket = $ticket;
        });

        return $checkedTicket;
    }
}
