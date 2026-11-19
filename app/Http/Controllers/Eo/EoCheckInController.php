<?php

namespace App\Http\Controllers\Eo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Eo\CheckInTicketRequest;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EoCheckInController extends Controller
{
    /**
     * Tampilkan halaman scanner QR & verifikasi check-in e-tiket Hari-H.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $eoId = $user->id;

        $approvedApplication = DB::table('eo_applications')
            ->where('user_id', $eoId)
            ->where('status', 'APPROVED')
            ->first();

        $events = DB::table('events')
            ->where('eo_id', $eoId)
            ->whereIn('status', ['PUBLISHED', 'ONGOING', 'COMPLETED'])
            ->orderByDesc('starts_at')
            ->get(['id', 'title', 'status', 'starts_at'])
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
            ->where('events.eo_id', $eoId)
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
            ->join('order_items', 'order_items.id', '=', 'tickets.order_item_id')
            ->join('ticket_types', 'ticket_types.id', '=', 'order_items.ticket_type_id')
            ->leftJoin('users as checker', 'checker.id', '=', 'tickets.checked_in_by')
            ->where('events.eo_id', $eoId)
            ->where('tickets.status', 'USED')
            ->when($selectedEventId, fn (Builder $query) => $query->where('events.id', $selectedEventId))
            ->select(
                'tickets.id',
                'tickets.ticket_code',
                'tickets.attendee_name',
                'tickets.checked_in_at',
                'events.title as event_title',
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
                'ticketTypeName' => $row->ticket_type_name,
                'checkedInByName' => $row->checked_in_by_name ?: '-',
                'checkedInAtFormatted' => Carbon::parse($row->checked_in_at)
                    ->locale('id')
                    ->translatedFormat('d M Y, H:i').' WIB',
            ]);

        return Inertia::render('Eo/CheckIn', [
            'organizerName' => $approvedApplication->organization_name ?? $user->name,
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
     * Verifikasi dan catat check-in e-tiket secara atomik.
     */
    public function store(CheckInTicketRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $ticketCode = strtoupper(trim($validated['ticket_code']));
        $selectedEventId = $validated['event_id'] ?? null;

        $result = DB::transaction(function () use ($user, $ticketCode, $selectedEventId): array {
            $ticket = Ticket::with(['order.event', 'orderItem.ticketType', 'checkedInByUser'])
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

            if ($event->eo_id !== $user->id) {
                return [
                    'outcome' => 'invalid',
                    'message' => 'E-tiket ini bukan milik event yang diselenggarakan organisasi Anda.',
                    'ticket' => null,
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

            if (! empty($selectedEventId) && $event->id !== $selectedEventId) {
                return [
                    'outcome' => 'invalid',
                    'message' => "Tiket ini terdaftar untuk event \"{$event->title}\", bukan event yang sedang dipilih.",
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

            if (! in_array($event->status, ['PUBLISHED', 'ONGOING'], true)) {
                return [
                    'outcome' => 'invalid',
                    'message' => "Check-in tidak tersedia karena status event saat ini adalah {$event->status}.",
                    'ticket' => $ticketPayload,
                ];
            }

            if ($ticket->status === 'CANCELLED') {
                return [
                    'outcome' => 'invalid',
                    'message' => 'E-tiket ini sudah dibatalkan dan tidak berlaku lagi.',
                    'ticket' => $ticketPayload,
                ];
            }

            if ($ticket->status === 'USED') {
                $checkedInAt = $ticket->checked_in_at
                    ? Carbon::parse($ticket->checked_in_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                    : '-';
                $checkerName = $ticket->checkedInByUser?->name ?? 'Petugas';

                return [
                    'outcome' => 'already_used',
                    'message' => "E-tiket sudah pernah check-in pada {$checkedInAt} oleh {$checkerName}.",
                    'ticket' => array_merge($ticketPayload, [
                        'checkedInAtFormatted' => $checkedInAt,
                        'checkedInByName' => $checkerName,
                    ]),
                ];
            }

            $now = now();
            $ticket->update([
                'status' => 'USED',
                'checked_in_at' => $now,
                'checked_in_by' => $user->id,
            ]);

            $checkedInAt = Carbon::parse($now)->locale('id')->translatedFormat('d M Y, H:i').' WIB';

            return [
                'outcome' => 'success',
                'message' => 'Check-in berhasil diverifikasi. Peserta dipersilakan masuk.',
                'ticket' => array_merge($ticketPayload, [
                    'checkedInAtFormatted' => $checkedInAt,
                    'checkedInByName' => $user->name,
                ]),
            ];
        });

        return redirect()
            ->route('eo.check-in.index', array_filter(['event_id' => $selectedEventId]))
            ->with('checkin_result', $result);
    }
}
