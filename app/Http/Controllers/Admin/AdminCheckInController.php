<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminCheckInController extends Controller
{
    /**
     * Tampilkan pemberitahuan bahwa presensi check-in e-tiket dikelola oleh EO dan Event Staff.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('Admin/CheckIn/Index');
    }

    /**
     * Verifikasi kode tiket dan catat kehadiran check-in secara atomik.
     */
    public function store(Request $request): RedirectResponse
    {
        $admin = $request->user();

        $request->validate([
            'ticket_code' => ['required', 'string', 'max:100'],
            'event_id' => ['nullable', 'string'],
        ], [
            'ticket_code.required' => 'Kode e-tiket wajib diisi atau dipindai.',
        ]);

        $ticketCode = strtoupper(trim((string) $request->input('ticket_code')));
        $selectedEventId = $request->input('event_id');

        $result = DB::transaction(function () use ($admin, $ticketCode, $selectedEventId): array {
            $ticket = Ticket::with(['order.event.eo', 'orderItem.ticketType', 'checkedInByUser'])
                ->where('ticket_code', $ticketCode)
                ->lockForUpdate()
                ->first();

            if (! $ticket || ! $ticket->order || ! $ticket->order->event) {
                return [
                    'outcome' => 'invalid',
                    'message' => "Kode e-tiket {$ticketCode} tidak ditemukan di sistem.",
                    'ticket' => null,
                ];
            }

            $order = $ticket->order;
            $event = $order->event;

            $organizerName = DB::table('eo_applications')
                ->where('user_id', $event->eo_id)
                ->where('status', 'APPROVED')
                ->value('organization_name') ?? $event->eo?->name ?? 'EO Platform';

            $ticketPayload = [
                'ticketCode' => $ticket->ticket_code,
                'attendeeName' => $ticket->attendee_name,
                'attendeeEmail' => $ticket->attendee_email,
                'eventTitle' => $event->title,
                'organizerName' => $organizerName,
                'ticketTypeName' => $ticket->orderItem?->ticketType?->name ?? 'Tiket Masuk',
                'orderReference' => $order->order_reference,
            ];

            if (! empty($selectedEventId) && $event->id !== $selectedEventId) {
                return [
                    'outcome' => 'invalid',
                    'message' => "Tiket ini terdaftar untuk event \"{$event->title}\", bukan event yang sedang difilter.",
                    'ticket' => $ticketPayload,
                ];
            }

            if ($order->status !== 'PAID') {
                return [
                    'outcome' => 'invalid',
                    'message' => 'Pesanan untuk e-tiket ini belum lunas atau telah dibatalkan.',
                    'ticket' => $ticketPayload,
                ];
            }

            if (! in_array($event->status, ['PUBLISHED', 'ONGOING', 'COMPLETED'], true)) {
                return [
                    'outcome' => 'invalid',
                    'message' => "Check-in tidak dapat dilakukan karena status event saat ini adalah {$event->status}.",
                    'ticket' => $ticketPayload,
                ];
            }

            if ($ticket->status === 'CANCELLED') {
                return [
                    'outcome' => 'invalid',
                    'message' => 'E-tiket ini telah dibatalkan (VOID/CANCELLED) dan tidak berlaku lagi.',
                    'ticket' => $ticketPayload,
                ];
            }

            if ($ticket->status === 'USED') {
                $checkedInAt = $ticket->checked_in_at
                    ? Carbon::parse($ticket->checked_in_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                    : '-';
                $checkerName = $ticket->checkedInByUser?->name ?? 'Petugas / Admin';

                return [
                    'outcome' => 'already_used',
                    'message' => "E-tiket sudah pernah check-in pada {$checkedInAt} oleh {$checkerName}.",
                    'ticket' => $ticketPayload,
                ];
            }

            $windowError = $event->checkInWindowError();
            if ($windowError !== null) {
                return [
                    'outcome' => 'invalid',
                    'message' => $windowError,
                    'ticket' => $ticketPayload,
                ];
            }

            // Catat check-in berhasil & batalkan undangan transfer PENDING bila ada
            $now = now();
            $ticket->forceFill([
                'status' => 'USED',
                'checked_in_at' => $now,
                'checked_in_by' => $admin->id,
            ])->save();

            DB::table('ticket_transfers')
                ->where('ticket_id', $ticket->id)
                ->where('status', 'PENDING')
                ->update([
                    'status' => 'CANCELLED',
                    'updated_at' => $now,
                ]);

            return [
                'outcome' => 'success',
                'message' => "Check-in berhasil! Selamat datang, {$ticket->attendee_name}.",
                'ticket' => array_merge($ticketPayload, [
                    'checkedInAt' => $now->copy()->timezone(config('app.timezone'))->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                ]),
            ];
        });

        return back()->with('checkin_result', $result);
    }
}
