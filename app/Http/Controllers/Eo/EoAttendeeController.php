<?php

namespace App\Http\Controllers\Eo;

use App\Http\Controllers\Controller;
use App\Support\AuditLog;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EoAttendeeController extends Controller
{
    /**
     * Tampilkan daftar peserta (e-tiket) dan laporan penjualan milik EO.
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
            ->orderByDesc('starts_at')
            ->get(['id', 'title', 'status', 'starts_at'])
            ->map(fn ($event) => [
                'id' => $event->id,
                'title' => $event->title,
                'status' => $event->status,
                'startsAtFormatted' => Carbon::parse($event->starts_at)
                    ->locale('id')
                    ->translatedFormat('d M Y'),
            ]);

        [$selectedEventId, $ticketStatus, $search] = $this->resolveFilters(
            $request,
            $events->pluck('id')->all()
        );

        $orderSummary = DB::table('orders')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('events.eo_id', $eoId)
            ->where('orders.status', 'PAID')
            ->when($selectedEventId, fn (Builder $query) => $query->where('events.id', $selectedEventId))
            ->selectRaw('COALESCE(SUM(orders.total_amount), 0) as total_revenue')
            ->selectRaw('COUNT(orders.id) as paid_orders_count')
            ->first();

        $ticketSummary = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('events.eo_id', $eoId)
            ->where('orders.status', 'PAID')
            ->when($selectedEventId, fn (Builder $query) => $query->where('events.id', $selectedEventId))
            ->selectRaw("COUNT(CASE WHEN tickets.status IN ('ACTIVE', 'USED') THEN 1 END) as total_tickets_sold")
            ->selectRaw("COUNT(CASE WHEN tickets.status = 'USED' THEN 1 END) as checked_in_count")
            ->selectRaw("COUNT(CASE WHEN tickets.status = 'ACTIVE' THEN 1 END) as pending_checkin_count")
            ->first();

        $paidRevenueSubquery = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereColumn('order_items.ticket_type_id', 'ticket_types.id')
            ->where('orders.status', 'PAID')
            ->selectRaw('COALESCE(SUM(order_items.subtotal), 0)');

        $soldCountSubquery = DB::table('tickets')
            ->join('order_items', 'order_items.id', '=', 'tickets.order_item_id')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->whereColumn('order_items.ticket_type_id', 'ticket_types.id')
            ->where('orders.status', 'PAID')
            ->whereIn('tickets.status', ['ACTIVE', 'USED'])
            ->selectRaw('COUNT(tickets.id)');

        $checkedInCountSubquery = DB::table('tickets')
            ->join('order_items', 'order_items.id', '=', 'tickets.order_item_id')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->whereColumn('order_items.ticket_type_id', 'ticket_types.id')
            ->where('orders.status', 'PAID')
            ->where('tickets.status', 'USED')
            ->selectRaw('COUNT(tickets.id)');

        $ticketTypeBreakdown = DB::table('ticket_types')
            ->join('events', 'events.id', '=', 'ticket_types.event_id')
            ->where('events.eo_id', $eoId)
            ->when($selectedEventId, fn (Builder $query) => $query->where('events.id', $selectedEventId))
            ->select(
                'ticket_types.id',
                'ticket_types.name as ticket_type_name',
                'ticket_types.initial_quota',
                'ticket_types.quota as remaining_quota',
                'events.id as event_id',
                'events.title as event_title'
            )
            ->addSelect([
                'revenue' => $paidRevenueSubquery,
                'sold_count' => $soldCountSubquery,
                'checked_in_count' => $checkedInCountSubquery,
            ])
            ->orderByDesc('events.starts_at')
            ->orderBy('ticket_types.name')
            ->get()
            ->map(function ($row) {
                $revenue = (float) ($row->revenue ?? 0);

                return [
                    'id' => $row->id,
                    'eventId' => $row->event_id,
                    'eventTitle' => $row->event_title,
                    'ticketTypeName' => $row->ticket_type_name,
                    'initialQuota' => (int) $row->initial_quota,
                    'remainingQuota' => (int) $row->remaining_quota,
                    'soldCount' => (int) ($row->sold_count ?? 0),
                    'checkedInCount' => (int) ($row->checked_in_count ?? 0),
                    'revenue' => $revenue,
                    'formattedRevenue' => 'Rp'.number_format($revenue, 0, ',', '.'),
                ];
            });

        $attendees = $this->attendeeBaseQuery($eoId, $selectedEventId, $ticketStatus, $search)
            ->orderByDesc('tickets.created_at')
            ->orderBy('tickets.id')
            ->paginate(20)
            ->withQueryString()
            ->through(function ($ticket) {
                $unitPrice = (float) $ticket->unit_price;

                return [
                    'id' => $ticket->id,
                    'ticketCode' => $ticket->ticket_code,
                    'attendeeName' => $ticket->attendee_name,
                    'attendeeEmail' => $ticket->attendee_email,
                    'attendeePhone' => $ticket->attendee_phone ?: '-',
                    'status' => $ticket->status,
                    'checkedInAtFormatted' => $ticket->checked_in_at
                        ? Carbon::parse($ticket->checked_in_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                        : null,
                    'checkedInByName' => $ticket->checked_in_by_name,
                    'orderReference' => $ticket->order_reference,
                    'paymentMethod' => $ticket->payment_method ?: '-',
                    'paidAtFormatted' => $ticket->paid_at
                        ? Carbon::parse($ticket->paid_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                        : '-',
                    'eventId' => $ticket->event_id,
                    'eventTitle' => $ticket->event_title,
                    'ticketTypeName' => $ticket->ticket_type_name,
                    'unitPriceFormatted' => $unitPrice > 0 ? 'Rp'.number_format($unitPrice, 0, ',', '.') : 'Gratis',
                ];
            });

        $totalRevenue = (float) ($orderSummary->total_revenue ?? 0);
        $totalTicketsSold = (int) ($ticketSummary->total_tickets_sold ?? 0);
        $checkedInCount = (int) ($ticketSummary->checked_in_count ?? 0);

        return Inertia::render('Eo/Attendees', [
            'organizerName' => $approvedApplication->organization_name ?? $user->name,
            'events' => $events,
            'filters' => [
                'eventId' => $selectedEventId ?? '',
                'ticketStatus' => $ticketStatus,
                'search' => $search,
            ],
            'summary' => [
                'totalRevenue' => $totalRevenue,
                'formattedRevenue' => 'Rp'.number_format($totalRevenue, 0, ',', '.'),
                'paidOrdersCount' => (int) ($orderSummary->paid_orders_count ?? 0),
                'totalTicketsSold' => $totalTicketsSold,
                'checkedInCount' => $checkedInCount,
                'pendingCheckInCount' => (int) ($ticketSummary->pending_checkin_count ?? 0),
                'attendanceRate' => $totalTicketsSold > 0
                    ? min(100, (int) round(($checkedInCount / $totalTicketsSold) * 100))
                    : 0,
            ],
            'ticketTypeBreakdown' => $ticketTypeBreakdown,
            'attendees' => $attendees,
        ]);
    }

    /**
     * Unduh daftar peserta dan ringkasan penjualan terfilter sebagai CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $eoId = $request->user()->id;
        $ownedEventIds = DB::table('events')
            ->where('eo_id', $eoId)
            ->pluck('id')
            ->all();

        [$selectedEventId, $ticketStatus, $search] = $this->resolveFilters($request, $ownedEventIds);

        $query = $this->attendeeBaseQuery($eoId, $selectedEventId, $ticketStatus, $search)
            ->orderByDesc('tickets.created_at')
            ->orderBy('tickets.id');

        $filename = 'peserta-penjualan-'.now()->format('Ymd-His').'.csv';

        AuditLog::record(
            action: 'attendees.exported',
            actorId: $eoId,
            subjectType: 'event',
            subjectId: $selectedEventId ?: null,
            metadata: [
                'ticket_status' => $ticketStatus,
                'has_search' => $search !== '',
            ],
        );

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            // UTF-8 BOM agar Excel membaca karakter Indonesia dengan benar
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Kode Tiket',
                'Nama Peserta',
                'Email Peserta',
                'Telepon',
                'Event',
                'Kategori Tiket',
                'Harga Satuan',
                'Kode Pesanan',
                'Metode Pembayaran',
                'Status Tiket',
                'Waktu Check-in',
                'Petugas Check-in',
            ]);

            $query->chunk(500, function ($rows) use ($handle): void {
                foreach ($rows as $row) {
                    $statusLabel = match ($row->status) {
                        'USED' => 'Sudah Check-in',
                        'CANCELLED' => 'Dibatalkan',
                        default => 'Siap Check-in',
                    };

                    $checkedInAt = $row->checked_in_at
                        ? Carbon::parse($row->checked_in_at)->locale('id')->translatedFormat('d M Y H:i')
                        : '-';

                    fputcsv($handle, [
                        $this->sanitizeCsvCell((string) $row->ticket_code),
                        $this->sanitizeCsvCell((string) $row->attendee_name),
                        $this->sanitizeCsvCell((string) $row->attendee_email),
                        $this->sanitizeCsvCell((string) ($row->attendee_phone ?: '-')),
                        $this->sanitizeCsvCell((string) $row->event_title),
                        $this->sanitizeCsvCell((string) $row->ticket_type_name),
                        number_format((float) $row->unit_price, 0, '.', ''),
                        $this->sanitizeCsvCell((string) $row->order_reference),
                        $this->sanitizeCsvCell((string) ($row->payment_method ?: '-')),
                        $statusLabel,
                        $checkedInAt,
                        $this->sanitizeCsvCell((string) ($row->checked_in_by_name ?: '-')),
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * @param  array<int, string>  $ownedEventIds
     * @return array{0: ?string, 1: string, 2: string}
     */
    private function resolveFilters(Request $request, array $ownedEventIds): array
    {
        $rawEventId = trim((string) $request->query('event_id', ''));
        $selectedEventId = ($rawEventId !== '' && Str::isUuid($rawEventId) && in_array($rawEventId, $ownedEventIds, true))
            ? $rawEventId
            : null;

        $rawStatus = strtoupper(trim((string) $request->query('ticket_status', 'ALL')));
        $ticketStatus = in_array($rawStatus, ['ALL', 'ACTIVE', 'USED', 'CANCELLED'], true)
            ? $rawStatus
            : 'ALL';

        $search = trim((string) $request->query('search', ''));

        return [$selectedEventId, $ticketStatus, $search];
    }

    private function attendeeBaseQuery(
        string $eoId,
        ?string $selectedEventId,
        string $ticketStatus,
        string $search
    ): Builder {
        $paymentMethodSubquery = DB::table('payments')
            ->whereColumn('payments.order_id', 'orders.id')
            ->where('payments.status', 'SUCCESS')
            ->orderByDesc('payments.created_at')
            ->limit(1)
            ->select('method');

        return DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->join('order_items', 'order_items.id', '=', 'tickets.order_item_id')
            ->join('ticket_types', 'ticket_types.id', '=', 'order_items.ticket_type_id')
            ->leftJoin('users as checker', 'checker.id', '=', 'tickets.checked_in_by')
            ->where('events.eo_id', $eoId)
            ->where('orders.status', 'PAID')
            ->when($selectedEventId, fn (Builder $query) => $query->where('events.id', $selectedEventId))
            ->when($ticketStatus !== 'ALL', fn (Builder $query) => $query->where('tickets.status', $ticketStatus))
            ->when($search !== '', function (Builder $query) use ($search): void {
                $like = '%'.strtolower($search).'%';
                $query->where(function (Builder $sub) use ($like): void {
                    $sub->whereRaw('LOWER(tickets.ticket_code) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(tickets.attendee_name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(tickets.attendee_email) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(orders.order_reference) LIKE ?', [$like]);
                });
            })
            ->select(
                'tickets.id',
                'tickets.ticket_code',
                'tickets.attendee_name',
                'tickets.attendee_email',
                'tickets.attendee_phone',
                'tickets.status',
                'tickets.checked_in_at',
                'tickets.created_at',
                'orders.order_reference',
                'orders.paid_at',
                'order_items.unit_price',
                'events.id as event_id',
                'events.title as event_title',
                'ticket_types.name as ticket_type_name',
                'checker.name as checked_in_by_name'
            )
            ->addSelect(['payment_method' => $paymentMethodSubquery]);
    }

    private function sanitizeCsvCell(string $value): string
    {
        if ($value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }
}
