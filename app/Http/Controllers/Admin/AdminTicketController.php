<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminTicketController extends Controller
{
    /**
     * Tampilkan direktori seluruh tiket peserta di platform.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $statusFilter = strtoupper((string) $request->input('status', 'ALL'));
        $eventIdFilter = (string) $request->input('event_id', 'ALL');
        $sort = (string) $request->input('sort', 'latest');

        // Statistik Tiket (1 query agregat kondisional)
        $ticketStats = DB::table('tickets')
            ->selectRaw('COUNT(*) as total_tickets')
            ->selectRaw("COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_tickets")
            ->selectRaw("COUNT(CASE WHEN status = 'USED' THEN 1 END) as used_tickets")
            ->selectRaw("COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_tickets")
            ->first();

        $totalTickets = (int) ($ticketStats->total_tickets ?? 0);
        $activeTickets = (int) ($ticketStats->active_tickets ?? 0);
        $usedTickets = (int) ($ticketStats->used_tickets ?? 0);
        $cancelledTickets = (int) ($ticketStats->cancelled_tickets ?? 0);

        $query = Ticket::query()
            ->with([
                'order:id,order_reference,user_id,event_id,status,created_at',
                'order.user:id,name,email,phone',
                'order.event:id,title,eo_id,venue_name,starts_at',
                'order.event.eo:id,name',
                'orderItem.ticketType:id,name',
                'checkedInByUser:id,name',
            ]);

        // Filter Pencarian
        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $lower = '%'.mb_strtolower($search).'%';
                $q->whereRaw('LOWER(ticket_code) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(attendee_name) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(attendee_email) LIKE ?', [$lower])
                    ->orWhere('attendee_phone', 'LIKE', $lower)
                    ->orWhereHas('order', function ($oq) use ($lower): void {
                        $oq->whereRaw('LOWER(order_reference) LIKE ?', [$lower])
                            ->orWhereHas('event', function ($eq) use ($lower): void {
                                $eq->whereRaw('LOWER(title) LIKE ?', [$lower]);
                            });
                    });
            });
        }

        // Filter Status
        if (in_array($statusFilter, ['ACTIVE', 'USED', 'CANCELLED'], true)) {
            $query->where('status', $statusFilter);
        }

        // Filter Event
        if ($eventIdFilter !== 'ALL' && $eventIdFilter !== '') {
            $query->whereHas('order', function ($oq) use ($eventIdFilter): void {
                $oq->where('event_id', $eventIdFilter);
            });
        }

        // Pengurutan
        match ($sort) {
            'oldest' => $query->orderBy('created_at', 'asc'),
            'code_asc' => $query->orderBy('ticket_code', 'asc'),
            default => $query->orderByDesc('created_at'),
        };

        $paginated = $query->paginate(10)->withQueryString();

        $eoIds = $paginated->getCollection()
            ->pluck('order.event.eo_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $eoOrgNames = $eoIds !== []
            ? DB::table('eo_applications')
                ->whereIn('user_id', $eoIds)
                ->where('status', 'APPROVED')
                ->pluck('organization_name', 'user_id')
            : collect();

        $tickets = $paginated->through(function (Ticket $ticket) use ($eoOrgNames) {
            $eoId = $ticket->order?->event?->eo_id;

            return [
                'id' => $ticket->id,
                'ticketCode' => $ticket->ticket_code,
                'status' => $ticket->status,
                'attendeeName' => $ticket->attendee_name,
                'attendeeEmail' => $ticket->attendee_email,
                'attendeePhone' => $ticket->attendee_phone ?: '-',
                'checkedInAtFormatted' => $ticket->checked_in_at ? Carbon::parse($ticket->checked_in_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('d M Y, H:i').' WIB' : null,
                'checkedInBy' => $ticket->checkedInByUser?->name,
                'ticketTypeName' => $ticket->orderItem?->ticketType?->name ?? 'Tiket Masuk',
                'orderReference' => $ticket->order?->order_reference,
                'orderStatus' => $ticket->order?->status,
                'event' => [
                    'id' => $ticket->order?->event?->id,
                    'title' => $ticket->order?->event?->title ?? '-',
                    'organizerName' => ($eoId ? ($eoOrgNames[$eoId] ?? null) : null) ?? $ticket->order?->event?->eo?->name ?? '-',
                    'venueName' => $ticket->order?->event?->venue_name ?? '-',
                    'startsAtFormatted' => $ticket->order?->event?->starts_at ? Carbon::parse($ticket->order->event->starts_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('d M Y, H:i').' WIB' : '-',
                ],
                'createdAtFormatted' => Carbon::parse($ticket->created_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('d M Y, H:i').' WIB',
            ];
        });

        $eventOptions = Event::select('id', 'title')
            ->orderBy('title')
            ->limit(50)
            ->get();

        return Inertia::render('Admin/Tickets/Index', [
            'tickets' => $tickets,
            'stats' => [
                'totalTickets' => $totalTickets,
                'activeTickets' => $activeTickets,
                'usedTickets' => $usedTickets,
                'cancelledTickets' => $cancelledTickets,
            ],
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'event_id' => $eventIdFilter,
                'sort' => $sort,
            ],
            'eventOptions' => $eventOptions,
        ]);
    }

    /**
     * Lakukan Check-in manual atas tiket oleh Admin.
     */
    public function checkIn(Request $request, string $id): RedirectResponse
    {
        $admin = $request->user();

        $ticket = Ticket::where('id', $id)->firstOrFail();

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

        $now = now();
        DB::transaction(function () use ($ticket, $admin, $now): void {
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
        });

        return back()->with('success', "Tiket {$ticket->ticket_code} ({$ticket->attendee_name}) berhasil di-check-in.");
    }
}
