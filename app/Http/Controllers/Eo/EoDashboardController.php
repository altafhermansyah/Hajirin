<?php

namespace App\Http\Controllers\Eo;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EoDashboardController extends Controller
{
    /**
     * Tampilkan halaman utama Dashboard Event Organizer (EO).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $eoId = $user->id;

        $approvedApplication = DB::table('eo_applications')
            ->where('user_id', $eoId)
            ->where('status', 'APPROVED')
            ->first();

        $eventStats = DB::table('events')
            ->where('eo_id', $eoId)
            ->selectRaw('COUNT(*) as total_events')
            ->selectRaw("COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published_events")
            ->selectRaw("COUNT(CASE WHEN status = 'PENDING_REVIEW' THEN 1 END) as pending_events")
            ->selectRaw("COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_events")
            ->selectRaw("COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_events")
            ->selectRaw("COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_events")
            ->first();

        $orderStats = DB::table('orders')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('events.eo_id', $eoId)
            ->selectRaw("COALESCE(SUM(CASE WHEN orders.status = 'PAID' THEN orders.total_amount ELSE 0 END), 0) as total_revenue")
            ->selectRaw("COUNT(CASE WHEN orders.status = 'PAID' THEN 1 END) as paid_orders_count")
            ->first();

        $ticketStats = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('events.eo_id', $eoId)
            ->where('orders.status', 'PAID')
            ->selectRaw("COUNT(CASE WHEN tickets.status IN ('ACTIVE', 'USED') THEN 1 END) as tickets_sold")
            ->selectRaw("COUNT(CASE WHEN tickets.status = 'USED' THEN 1 END) as tickets_checked_in")
            ->first();

        $quotaStats = DB::table('ticket_types')
            ->join('events', 'events.id', '=', 'ticket_types.event_id')
            ->where('events.eo_id', $eoId)
            ->where('ticket_types.status', 'ACTIVE')
            ->selectRaw('COALESCE(SUM(ticket_types.initial_quota), 0) as total_initial_quota')
            ->selectRaw('COALESCE(SUM(ticket_types.quota), 0) as total_remaining_quota')
            ->first();

        $initialQuotaSubquery = DB::table('ticket_types')
            ->whereColumn('ticket_types.event_id', 'events.id')
            ->where('ticket_types.status', 'ACTIVE')
            ->selectRaw('COALESCE(SUM(ticket_types.initial_quota), 0)');

        $remainingQuotaSubquery = DB::table('ticket_types')
            ->whereColumn('ticket_types.event_id', 'events.id')
            ->where('ticket_types.status', 'ACTIVE')
            ->selectRaw('COALESCE(SUM(ticket_types.quota), 0)');

        $ticketsSoldSubquery = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->whereColumn('orders.event_id', 'events.id')
            ->where('orders.status', 'PAID')
            ->whereIn('tickets.status', ['ACTIVE', 'USED'])
            ->selectRaw('COUNT(tickets.id)');

        $eventRevenueSubquery = DB::table('orders')
            ->whereColumn('orders.event_id', 'events.id')
            ->where('orders.status', 'PAID')
            ->selectRaw('COALESCE(SUM(orders.total_amount), 0)');

        $myEvents = DB::table('events')
            ->join('categories', 'categories.id', '=', 'events.category_id')
            ->where('events.eo_id', $eoId)
            ->select(
                'events.id',
                'events.title',
                'events.slug',
                'events.event_type',
                'events.city',
                'events.venue_name',
                'events.starts_at',
                'events.ends_at',
                'events.banner_path',
                'events.status',
                'events.rejection_reason',
                'events.cancellation_reason',
                'categories.name as category_name'
            )
            ->addSelect([
                'initial_quota' => $initialQuotaSubquery,
                'remaining_quota' => $remainingQuotaSubquery,
                'tickets_sold' => $ticketsSoldSubquery,
                'revenue' => $eventRevenueSubquery,
            ])
            ->orderByDesc('events.created_at')
            ->get()
            ->map(function ($event) {
                $revenue = (float) ($event->revenue ?? 0);
                $initialQuota = (int) ($event->initial_quota ?? 0);
                $remainingQuota = (int) ($event->remaining_quota ?? 0);
                $ticketsSold = (int) ($event->tickets_sold ?? 0);

                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'slug' => $event->slug,
                    'category' => $event->category_name,
                    'eventType' => $event->event_type,
                    'city' => $event->city ?: ($event->event_type === 'ONLINE' ? 'Online' : '-'),
                    'location' => $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                    'dateFormatted' => Carbon::parse($event->starts_at)->locale('id')->translatedFormat('d M Y • H:i').' WIB',
                    'banner' => $event->banner_path ?: '/images/events/tech_hero.jpg',
                    'status' => $event->status,
                    'rejectionReason' => $event->rejection_reason,
                    'cancellationReason' => $event->cancellation_reason,
                    'initialQuota' => $initialQuota,
                    'remainingQuota' => $remainingQuota,
                    'ticketsSold' => $ticketsSold,
                    'revenue' => $revenue,
                    'formattedRevenue' => 'Rp'.number_format($revenue, 0, ',', '.'),
                ];
            });

        $recentOrders = DB::table('orders')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->join('users', 'users.id', '=', 'orders.user_id')
            ->where('events.eo_id', $eoId)
            ->select(
                'orders.id',
                'orders.order_reference',
                'orders.status',
                'orders.total_amount',
                'orders.created_at',
                'events.title as event_title',
                'users.name as buyer_name',
                'users.email as buyer_email'
            )
            ->orderByDesc('orders.created_at')
            ->limit(10)
            ->get()
            ->map(function ($order) {
                $amount = (float) $order->total_amount;

                return [
                    'id' => $order->id,
                    'orderReference' => $order->order_reference,
                    'status' => $order->status,
                    'totalAmount' => $amount,
                    'formattedAmount' => $amount > 0 ? 'Rp'.number_format($amount, 0, ',', '.') : 'Gratis',
                    'eventTitle' => $order->event_title,
                    'buyerName' => $order->buyer_name,
                    'buyerEmail' => $order->buyer_email,
                    'createdAtFormatted' => Carbon::parse($order->created_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                ];
            });

        $totalRevenue = (float) ($orderStats->total_revenue ?? 0);

        return Inertia::render('Eo/Dashboard', [
            'organizerProfile' => [
                'organizationName' => $approvedApplication->organization_name ?? $user->name,
                'contactPhone' => $approvedApplication->contact_phone ?? $user->phone ?? '-',
                'portfolioUrl' => $approvedApplication->portfolio_url ?? null,
                'verifiedAt' => $approvedApplication?->reviewed_at
                    ? Carbon::parse($approvedApplication->reviewed_at)->locale('id')->translatedFormat('d M Y')
                    : null,
            ],
            'stats' => [
                'totalEvents' => (int) ($eventStats->total_events ?? 0),
                'publishedEvents' => (int) ($eventStats->published_events ?? 0),
                'pendingEvents' => (int) ($eventStats->pending_events ?? 0),
                'draftEvents' => (int) ($eventStats->draft_events ?? 0),
                'rejectedEvents' => (int) ($eventStats->rejected_events ?? 0),
                'cancelledEvents' => (int) ($eventStats->cancelled_events ?? 0),
                'totalRevenue' => $totalRevenue,
                'formattedRevenue' => 'Rp'.number_format($totalRevenue, 0, ',', '.'),
                'paidOrdersCount' => (int) ($orderStats->paid_orders_count ?? 0),
                'ticketsSold' => (int) ($ticketStats->tickets_sold ?? 0),
                'ticketsCheckedIn' => (int) ($ticketStats->tickets_checked_in ?? 0),
                'totalInitialQuota' => (int) ($quotaStats->total_initial_quota ?? 0),
                'totalRemainingQuota' => (int) ($quotaStats->total_remaining_quota ?? 0),
            ],
            'myEvents' => $myEvents,
            'recentOrders' => $recentOrders,
        ]);
    }
}
