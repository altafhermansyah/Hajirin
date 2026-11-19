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

        $upcomingEventCount = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('orders.user_id', $userId)
            ->where('orders.status', 'PAID')
            ->where('tickets.status', 'ACTIVE')
            ->where('events.starts_at', '>=', now())
            ->distinct()
            ->count('events.id');

        $recentOrders = DB::table('orders')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('orders.user_id', $userId)
            ->select(
                'orders.id',
                'orders.order_reference',
                'orders.status',
                'orders.total_amount',
                'orders.created_at',
                'events.title'
            )
            ->latest('orders.created_at')
            ->limit(10)
            ->get();

        $myTickets = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->join('order_items', 'order_items.id', '=', 'tickets.order_item_id')
            ->join('ticket_types', 'ticket_types.id', '=', 'order_items.ticket_type_id')
            ->where('orders.user_id', $userId)
            ->where('orders.status', 'PAID')
            ->select(
                'tickets.id',
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
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'ticketCode' => $ticket->ticket_code,
                    'attendeeName' => $ticket->attendee_name,
                    'attendeeEmail' => $ticket->attendee_email,
                    'status' => $ticket->ticket_status,
                    'orderReference' => $ticket->order_reference,
                    'eventTitle' => $ticket->event_title,
                    'eventSlug' => $ticket->event_slug,
                    'eventDate' => Carbon::parse($ticket->starts_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
                    'eventLocation' => $ticket->venue_name ?: ($ticket->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                    'eventAddress' => $ticket->address,
                    'banner' => $ticket->banner_path ?: '/images/events/tech_hero.jpg',
                    'ticketType' => $ticket->ticket_type_name,
                ];
            });

        $minPrices = DB::table('ticket_prices')
            ->join('ticket_types', 'ticket_types.id', '=', 'ticket_prices.ticket_type_id')
            ->where('ticket_types.status', 'ACTIVE')
            ->where('ticket_prices.status', 'ACTIVE')
            ->groupBy('ticket_types.event_id')
            ->selectRaw('ticket_types.event_id, MIN(ticket_prices.price) as min_price')
            ->pluck('min_price', 'ticket_types.event_id');

        $bookmarkedEvents = DB::table('bookmarks')
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
            ->get()
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
                    'image' => $event->banner_path ?: '/images/events/tech_hero.jpg',
                    'bookmarkedAt' => Carbon::parse($event->bookmarked_at)->locale('id')->diffForHumans(),
                ];
            });

        return Inertia::render('Dashboard', [
            'dashboard' => [
                'orderCount' => DB::table('orders')->where('user_id', $userId)->count(),
                'ticketCount' => DB::table('tickets')
                    ->join('orders', 'orders.id', '=', 'tickets.order_id')
                    ->where('orders.user_id', $userId)
                    ->where('orders.status', 'PAID')
                    ->where('tickets.status', 'ACTIVE')
                    ->count(),
                'upcomingEventCount' => $upcomingEventCount,
                'recentOrders' => $recentOrders,
                'myTickets' => $myTickets,
                'bookmarkedEvents' => $bookmarkedEvents,
            ],
        ]);
    }
}
