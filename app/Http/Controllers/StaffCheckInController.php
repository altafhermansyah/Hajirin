<?php

namespace App\Http\Controllers;

use App\Http\Requests\StaffCheckInTicketRequest;
use App\Models\Event;
use App\Support\TicketCheckIn;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StaffCheckInController extends Controller
{
    /**
     * Tampilkan portal check-in khusus staff yang ditugaskan pada event aktif.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isActive()) {
            abort(403, 'Akun Anda tidak aktif.');
        }

        $now = now()->timezone(config('app.timezone'));
        $events = DB::table('event_staff')
            ->join('events', 'events.id', '=', 'event_staff.event_id')
            ->where('event_staff.user_id', $user->id)
            ->where('event_staff.role', 'CHECKIN')
            ->whereIn('events.status', ['PUBLISHED', 'ONGOING', 'COMPLETED'])
            ->orderByDesc('events.starts_at')
            ->get(['events.id', 'events.title', 'events.status', 'events.starts_at', 'events.ends_at'])
            ->map(function ($event) use ($now): array {
                $startsAt = Carbon::parse($event->starts_at)->timezone(config('app.timezone'));
                $endsAt = Carbon::parse($event->ends_at)->timezone(config('app.timezone'));
                $opensAt = $startsAt->copy()->subHours(Event::CHECKIN_OPEN_HOURS_BEFORE);

                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'status' => $event->status,
                    'startsAtFormatted' => $startsAt->copy()->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                    'startsAtIso' => $startsAt->toIso8601String(),
                    'endsAtIso' => $endsAt->toIso8601String(),
                    'checkInOpensAtIso' => $opensAt->toIso8601String(),
                    'checkInOpensAtFormatted' => $opensAt->copy()->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                    'isCheckInOpen' => $now->greaterThanOrEqualTo($opensAt) && $now->lessThanOrEqualTo($endsAt),
                    'isCheckInClosed' => $now->greaterThan($endsAt),
                ];
            });

        if ($events->isEmpty()) {
            abort(403, 'Anda tidak terdaftar sebagai staff check-in pada event aktif mana pun.');
        }

        $assignedEventIds = $events->pluck('id')->all();

        $rawEventId = trim((string) $request->query('event_id', ''));
        $selectedEventId = ($rawEventId !== '' && Str::isUuid($rawEventId) && in_array($rawEventId, $assignedEventIds, true))
            ? $rawEventId
            : null;

        $scopedEventIds = $selectedEventId ? [$selectedEventId] : $assignedEventIds;

        $ticketStats = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->whereIn('orders.event_id', $scopedEventIds)
            ->where('orders.status', 'PAID')
            ->whereIn('tickets.status', ['ACTIVE', 'USED'])
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
            ->whereIn('orders.event_id', $scopedEventIds)
            ->where('tickets.status', 'USED')
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
            ->map(fn ($row): array => [
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

        $searchQuery = trim((string) $request->query('q', ''));
        $searchResults = [];

        if (mb_strlen($searchQuery) >= 2) {
            $like = '%'.strtolower($searchQuery).'%';

            // Hanya ambil informasi check-in non-finansial (tanpa harga atau nominal transaksi)
            $searchResults = DB::table('tickets')
                ->join('orders', 'orders.id', '=', 'tickets.order_id')
                ->join('events', 'events.id', '=', 'orders.event_id')
                ->join('order_items', 'order_items.id', '=', 'tickets.order_item_id')
                ->join('ticket_types', 'ticket_types.id', '=', 'order_items.ticket_type_id')
                ->whereIn('orders.event_id', $scopedEventIds)
                ->where('orders.status', 'PAID')
                ->whereIn('tickets.status', ['ACTIVE', 'USED'])
                ->where(function (Builder $sub) use ($like): void {
                    $sub->whereRaw('LOWER(tickets.attendee_name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(tickets.attendee_email) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(tickets.ticket_code) LIKE ?', [$like]);
                })
                ->select(
                    'tickets.id',
                    'tickets.ticket_code',
                    'tickets.attendee_name',
                    'tickets.attendee_email',
                    'tickets.status',
                    'tickets.checked_in_at',
                    'events.id as event_id',
                    'events.title as event_title',
                    'ticket_types.name as ticket_type_name'
                )
                ->orderByRaw("CASE WHEN tickets.status = 'ACTIVE' THEN 0 ELSE 1 END")
                ->orderBy('tickets.attendee_name')
                ->limit(15)
                ->get()
                ->map(fn ($row): array => [
                    'id' => $row->id,
                    'ticketCode' => $row->ticket_code,
                    'attendeeName' => $row->attendee_name,
                    'attendeeEmail' => $row->attendee_email,
                    'status' => $row->status,
                    'eventId' => $row->event_id,
                    'eventTitle' => $row->event_title,
                    'ticketTypeName' => $row->ticket_type_name,
                    'checkedInAtFormatted' => $row->checked_in_at
                        ? Carbon::parse($row->checked_in_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                        : null,
                ])
                ->all();
        }

        return Inertia::render('Staff/CheckIn', [
            'events' => $events,
            'selectedEventId' => $selectedEventId ?? '',
            'searchQuery' => $searchQuery,
            'searchResults' => $searchResults,
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
            'backUrl' => $user->isEo() ? '/eo/dashboard' : '/dashboard',
        ]);
    }

    /**
     * Verifikasi dan catat check-in e-tiket secara atomik oleh staff yang ditugaskan.
     */
    public function store(StaffCheckInTicketRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $selectedEventId = $validated['event_id'] ?? null;

        $hasAnyAssignment = DB::table('event_staff')
            ->where('user_id', $user->id)
            ->where('role', 'CHECKIN')
            ->exists();

        if (! $hasAnyAssignment) {
            abort(403, 'Anda tidak terdaftar sebagai staff check-in pada event mana pun.');
        }

        $result = TicketCheckIn::verifyByCode(
            actor: $user,
            rawTicketCode: $validated['ticket_code'],
            selectedEventId: $selectedEventId,
            authorizeEvent: function (Event $event) use ($user): ?string {
                $isAssigned = DB::table('event_staff')
                    ->where('event_id', $event->id)
                    ->where('user_id', $user->id)
                    ->where('role', 'CHECKIN')
                    ->exists();

                return $isAssigned
                    ? null
                    : 'Anda tidak memiliki izin check-in untuk event pada e-tiket ini.';
            },
        );

        return redirect()
            ->route('staff.check-in.index', array_filter([
                'event_id' => $selectedEventId,
                'q' => trim((string) $request->input('q', '')) ?: null,
            ]))
            ->with('checkin_result', $result);
    }
}
