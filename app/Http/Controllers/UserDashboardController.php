<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserDashboardController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->role === 'ADMIN') {
            return redirect()->route('admin.dashboard');
        }

        if ($request->user()?->role === 'EO') {
            return redirect()->route('eo.dashboard');
        }

        $userId = $request->user()->id;

        $ordersQuery = DB::table('orders')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->leftJoin('payments', 'payments.order_id', '=', 'orders.id')
            ->where('orders.user_id', $userId)
            ->select(
                'orders.id',
                'orders.order_reference',
                'orders.status',
                'orders.total_amount',
                'orders.created_at',
                'orders.paid_at',
                'events.title as event_title',
                'events.slug as event_slug',
                'events.starts_at as event_starts_at',
                'events.venue_name',
                'events.event_type',
                'events.address as event_address',
                'events.banner_path as event_banner',
                'payments.method as payment_method',
                'payments.payment_reference'
            )
            ->latest('orders.created_at')
            ->limit(20)
            ->get();

        $orderIds = $ordersQuery->pluck('id')->all();
        $orderItemsByOrder = $orderIds !== []
            ? DB::table('order_items')
                ->join('ticket_types', 'ticket_types.id', '=', 'order_items.ticket_type_id')
                ->whereIn('order_items.order_id', $orderIds)
                ->select(
                    'order_items.id',
                    'order_items.order_id',
                    'order_items.quantity',
                    'order_items.unit_price',
                    'order_items.subtotal',
                    'ticket_types.name as ticket_name'
                )
                ->get()
                ->groupBy('order_id')
            : collect();

        $recentOrders = $ordersQuery->map(function ($order) use ($orderItemsByOrder) {
            $items = ($orderItemsByOrder[$order->id] ?? collect())->map(function ($it) {
                $unitPrice = (float) $it->unit_price;
                $subtotal = (float) $it->subtotal;

                return [
                    'id' => $it->id,
                    'ticketName' => $it->ticket_name,
                    'quantity' => (int) $it->quantity,
                    'unitPrice' => $unitPrice,
                    'formattedUnitPrice' => $unitPrice > 0 ? 'Rp'.number_format($unitPrice, 0, ',', '.') : 'Gratis',
                    'subtotal' => $subtotal,
                    'formattedSubtotal' => $subtotal > 0 ? 'Rp'.number_format($subtotal, 0, ',', '.') : 'Gratis',
                ];
            })->values()->all();

            $totalAmount = (float) $order->total_amount;

            return [
                'id' => $order->id,
                'orderReference' => $order->order_reference,
                'order_reference' => $order->order_reference,
                'status' => $order->status,
                'title' => $order->event_title,
                'total_amount' => $totalAmount,
                'formattedTotalAmount' => $totalAmount > 0 ? 'Rp'.number_format($totalAmount, 0, ',', '.') : 'Gratis',
                'createdAt' => Carbon::parse($order->created_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
                'created_at' => $order->created_at,
                'paidAt' => $order->paid_at ? Carbon::parse($order->paid_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB' : '-',
                'eventTitle' => $order->event_title,
                'eventSlug' => $order->event_slug,
                'eventDate' => Carbon::parse($order->event_starts_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
                'eventLocation' => $order->venue_name ?: ($order->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                'eventAddress' => $order->event_address,
                'eventBanner' => $order->event_banner ?: '/images/events/tech_hero.webp',
                'paymentMethod' => $order->payment_method ?: ($totalAmount <= 0 ? 'FREE' : 'QRIS'),
                'paymentReference' => $order->payment_reference ?: '-',
                'items' => $items,
            ];
        });

        $rawTickets = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->join('order_items', 'order_items.id', '=', 'tickets.order_item_id')
            ->join('ticket_types', 'ticket_types.id', '=', 'order_items.ticket_type_id')
            ->where('orders.user_id', $userId)
            ->where('orders.status', 'PAID')
            ->select(
                'tickets.id',
                'tickets.order_id',
                'tickets.ticket_code',
                'tickets.attendee_name',
                'tickets.attendee_email',
                'tickets.status as ticket_status',
                'tickets.created_at',
                'orders.order_reference',
                'events.id as event_id',
                'events.title as event_title',
                'events.slug as event_slug',
                'events.starts_at',
                'events.ends_at',
                'events.venue_name',
                'events.address',
                'events.banner_path',
                'events.event_type',
                'ticket_types.name as ticket_type_name'
            )
            ->orderByDesc('tickets.created_at')
            ->get();

        // Mengelompokkan tiket berdasarkan pesanan sehingga jika membeli 2 atau 100 tiket,
        // yang tampil adalah 1 tiket pass per event sesuai pesanan pengguna.
        $myTickets = $rawTickets->groupBy('order_reference')->map(function ($orderTickets) {
            $first = $orderTickets->first();
            $totalCount = $orderTickets->count();
            $typeCounts = $orderTickets->groupBy('ticket_type_name')->map->count();
            $typesSummary = $typeCounts->map(fn ($cnt, $name) => "{$name} ({$cnt}x)")->implode(', ');
            $hasActive = $orderTickets->contains('ticket_status', 'ACTIVE');

            return [
                'id' => $first->id,
                'orderId' => $first->order_id,
                'orderReference' => $first->order_reference,
                'ticketCode' => $first->ticket_code,
                'primaryTicketCode' => $first->ticket_code,
                'attendeeName' => $first->attendee_name,
                'attendeeEmail' => $first->attendee_email,
                'status' => $hasActive ? 'ACTIVE' : 'USED',
                'quantity' => $totalCount,
                'ticketType' => $typesSummary ?: $first->ticket_type_name,
                'eventTitle' => $first->event_title,
                'eventSlug' => $first->event_slug,
                'eventDate' => Carbon::parse($first->starts_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
                'eventLocation' => $first->venue_name ?: ($first->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                'eventAddress' => $first->address,
                'banner' => $first->banner_path ?: '/images/events/tech_hero.webp',
                'allTickets' => $orderTickets->map(function ($t, $idx) {
                    return [
                        'id' => $t->id,
                        'ticketNumber' => $idx + 1,
                        'code' => $t->ticket_code,
                        'attendeeName' => $t->attendee_name,
                        'attendeeEmail' => $t->attendee_email,
                        'type' => $t->ticket_type_name,
                        'status' => $t->ticket_status,
                    ];
                })->values()->all(),
            ];
        })->values();

        $bookmarkedRows = DB::table('bookmarks')
            ->join('events', 'events.id', '=', 'bookmarks.event_id')
            ->join('categories', 'categories.id', '=', 'events.category_id')
            ->join('users', 'users.id', '=', 'events.eo_id')
            ->where('bookmarks.user_id', $userId)
            ->where('events.status', 'PUBLISHED')
            ->select(
                'events.id',
                'events.title',
                'events.slug',
                'events.starts_at',
                'events.venue_name',
                'events.event_type',
                'events.banner_path',
                'categories.name as category_name',
                'users.name as organizer_name',
                'bookmarks.created_at as bookmarked_at'
            )
            ->orderByDesc('bookmarks.created_at')
            ->get();

        $bookmarkedEventIds = $bookmarkedRows->pluck('id')->all();

        $minPrices = $bookmarkedEventIds !== []
            ? DB::table('ticket_prices')
                ->join('ticket_types', 'ticket_types.id', '=', 'ticket_prices.ticket_type_id')
                ->whereIn('ticket_types.event_id', $bookmarkedEventIds)
                ->where('ticket_types.status', 'ACTIVE')
                ->where('ticket_prices.status', 'ACTIVE')
                ->groupBy('ticket_types.event_id')
                ->selectRaw('ticket_types.event_id, MIN(ticket_prices.price) as min_price')
                ->pluck('min_price', 'ticket_types.event_id')
            : collect();

        $bookmarkedEvents = $bookmarkedRows
            ->map(function ($event) use ($minPrices) {
                $minPrice = $minPrices[$event->id] ?? null;
                $numericPrice = $minPrice !== null ? (float) $minPrice : 0;

                return [
                    'id' => $event->id,
                    'slug' => $event->slug,
                    'title' => $event->title,
                    'category' => $event->category_name,
                    'organizer' => $event->organizer_name,
                    'date' => Carbon::parse($event->starts_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
                    'place' => $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                    'price' => $numericPrice > 0 ? 'Rp'.number_format($numericPrice, 0, ',', '.') : 'Gratis',
                    'image' => $event->banner_path ?: '/images/events/tech_hero.webp',
                    'bookmarkedAt' => Carbon::parse($event->bookmarked_at)->locale('id')->diffForHumans(),
                ];
            });

        $staffEvents = DB::table('event_staff')
            ->join('events', 'events.id', '=', 'event_staff.event_id')
            ->where('event_staff.user_id', $userId)
            ->where('event_staff.role', 'CHECKIN')
            ->whereIn('events.status', ['PUBLISHED', 'ONGOING'])
            ->orderBy('events.starts_at')
            ->get(['events.id', 'events.title', 'events.status', 'events.starts_at'])
            ->map(fn ($event): array => [
                'id' => $event->id,
                'title' => $event->title,
                'status' => $event->status,
                'startsAtFormatted' => Carbon::parse($event->starts_at)
                    ->locale('id')
                    ->translatedFormat('d M Y, H:i').' WIB',
            ]);

        $now = now();
        $activeTickets = $rawTickets->where('ticket_status', 'ACTIVE');
        $ticketCount = $activeTickets->count();
        $upcomingEventCount = $activeTickets
            ->filter(fn ($ticket): bool => Carbon::parse($ticket->starts_at)->greaterThanOrEqualTo($now))
            ->pluck('event_id')
            ->unique()
            ->count();

        return Inertia::render('Dashboard', [
            'dashboard' => [
                'orderCount' => DB::table('orders')->where('user_id', $userId)->count(),
                'ticketCount' => $ticketCount,
                'upcomingEventCount' => $upcomingEventCount,
                'recentOrders' => $recentOrders,
                'myTickets' => $myTickets,
                'bookmarkedEvents' => $bookmarkedEvents,
                'staffEvents' => $staffEvents,
            ],
        ]);
    }
}
