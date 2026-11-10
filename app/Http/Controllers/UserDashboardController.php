<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $userId = $request->user()->id;

        $upcomingEvents = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('orders.user_id', $userId)
            ->where('orders.status', 'PAID')
            ->where('tickets.status', 'ACTIVE')
            ->where('events.starts_at', '>=', now())
            ->select('events.id', 'events.title', 'events.starts_at', 'events.venue_name', 'events.event_type')
            ->selectRaw('COUNT(tickets.id) AS ticket_count')
            ->groupBy('events.id', 'events.title', 'events.starts_at', 'events.venue_name', 'events.event_type')
            ->orderBy('events.starts_at')
            ->limit(5)
            ->get();

        $recentOrders = DB::table('orders')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('orders.user_id', $userId)
            ->select('orders.order_reference', 'orders.status', 'orders.total_amount', 'orders.created_at', 'events.title')
            ->latest('orders.created_at')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'dashboard' => [
                'orderCount' => DB::table('orders')->where('user_id', $userId)->count(),
                'ticketCount' => DB::table('tickets')
                    ->join('orders', 'orders.id', '=', 'tickets.order_id')
                    ->where('orders.user_id', $userId)
                    ->where('orders.status', 'PAID')
                    ->where('tickets.status', 'ACTIVE')
                    ->count(),
                'upcomingEvents' => $upcomingEvents,
                'recentOrders' => $recentOrders,
            ],
        ]);
    }
}
