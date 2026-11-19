<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminCheckInController extends Controller
{
    /**
     * Tampilkan scanner QR & dashboard operasional check-in e-tiket platform bagi Super Admin.
     */
    public function index(Request $request): Response
    {
        $events = Event::select('id', 'title', 'status', 'starts_at')
            ->whereIn('status', ['PUBLISHED', 'ONGOING', 'COMPLETED'])
            ->orderByDesc('starts_at')
            ->get()
            ->map(fn ($event) => [
                'id' => $event->id,
                'title' => $event->title,
                'status' => $event->status,
                'startsAtFormatted' => Carbon::parse($event->starts_at)
                    ->locale('id')
                    ->translatedFormat('d M Y, H:i').' WIB',
            ]);

        $rawEventId = trim((string) $request->query('event_id', ''));
        $selectedEventId = ($rawEventId !== '' && Str::isUuid($rawEventId) && $events->contains('id', $rawEventId))
            ? $rawEventId
            : null;

        $ticketStats = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('orders.status', 'PAID')
            ->whereIn('tickets.status', ['ACTIVE', 'USED'])
            ->when($selectedEventId, fn (Builder $query) => $query->where('events.id', $selectedEventId))
            ->selectRaw('COUNT(tickets.id) as total_valid_tickets')
            ->selectRaw("COUNT(CASE WHEN tickets.status = 'USED' THEN 1 END) as checked_in_count")
            ->selectRaw("COUNT(CASE WHEN tickets.status = 'ACTIVE' THEN 1 END) as remaining_count")
            ->first();

        $totalValid = (int) ($ticketStats->total_valid_tickets ?? 0);
        $checkedIn = (int) ($ticketStats->checked_in_count ?? 0);

        $recentCheckIns = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->join('users as organizers', 'organizers.id', '=', 'events.eo_id')
            ->join('order_items', 'order_items.id', '=', 'tickets.order_item_id')
            ->join('ticket_types', 'ticket_types.id', '=', 'order_items.ticket_type_id')
            ->leftJoin('users as checker', 'checker.id', '=', 'tickets.checked_in_by')
            ->where('tickets.status', 'USED')
            ->when($selectedEventId, fn (Builder $query) => $query->where('events.id', $selectedEventId))
            ->select(
                'tickets.id',
                'tickets.ticket_code',
                'tickets.attendee_name',
                'tickets.checked_in_at',
                'events.title as event_title',
                'organizers.name as organizer_name',
                'ticket_types.name as ticket_type_name',
                'checker.name as checked_in_by_name'
            )
            ->orderByDesc('tickets.checked_in_at')
            ->limit(15)
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'ticketCode' => $row->ticket_code,
                'attendeeName' => $row->attendee_name,
                'eventTitle' => $row->event_title,
                'organizerName' => $row->organizer_name ?? 'EO',
                'ticketTypeName' => $row->ticket_type_name,
                'checkedInByName' => $row->checked_in_by_name ?: 'Administrator',
                'checkedInAtFormatted' => Carbon::parse($row->checked_in_at)
                    ->locale('id')
                    ->translatedFormat('d M Y, H:i').' WIB',
            ]);

        return Inertia::render('Admin/CheckIn/Index', [
            'events' => $events,
            'selectedEventId' => $selectedEventId ?? '',
            'stats' => [
                'totalValidTickets' => $totalValid,
                'checkedInCount' => $checkedIn,
                'remainingCount' => (int) ($ticketStats->remaining_count ?? 0),
                'attendanceRate' => $totalValid > 0
                    ? min(100, (int) round(($checkedIn / $totalValid) * 100))
                    : 0,
            ],
            'recentCheckIns' => $recentCheckIns,
            'checkinResult' => session('checkin_result'),
        ]);
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

            $ticketPayload = [
                'ticketCode' => $ticket->ticket_code,
                'attendeeName' => $ticket->attendee_name,
                'attendeeEmail' => $ticket->attendee_email,
                'eventTitle' => $event->title,
                'organizerName' => $event->eo?->name ?? 'EO Platform',
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

            // Catat check-in berhasil
            $ticket->forceFill([
                'status' => 'USED',
                'checked_in_at' => now(),
                'checked_in_by' => $admin->id,
            ])->save();

            return [
                'outcome' => 'success',
                'message' => "Check-in berhasil! Selamat datang, {$ticket->attendee_name}.",
                'ticket' => array_merge($ticketPayload, [
                    'checkedInAt' => now()->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                ]),
            ];
        });

        return back()->with('checkin_result', $result);
    }
}
