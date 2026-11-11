<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Display the admin platform dashboard overview.
     */
    public function index(Request $request): Response
    {
        $totalUsers = DB::table('users')->count();
        $totalPeserta = DB::table('users')->where('role', 'USER')->count();
        $totalEo = DB::table('users')->where('role', 'EO')->count();
        $totalAdmin = DB::table('users')->where('role', 'ADMIN')->count();

        $totalEvents = DB::table('events')->count();
        $publishedEvents = DB::table('events')->where('status', 'PUBLISHED')->count();
        $pendingEvents = DB::table('events')->where('status', 'PENDING_REVIEW')->count();
        $draftEvents = DB::table('events')->where('status', 'DRAFT')->count();

        $pendingEoApplications = DB::table('eo_applications')->where('status', 'PENDING')->count();

        $totalOrders = DB::table('orders')->count();
        $totalRevenue = (float) (DB::table('orders')->where('status', 'PAID')->sum('total_amount') ?? 0);
        $totalTicketsSold = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->where('orders.status', 'PAID')
            ->count();

        $recentUsers = DB::table('users')
            ->select('id', 'name', 'email', 'role', 'created_at')
            ->latest('created_at')
            ->limit(5)
            ->get();

        $pendingEoList = DB::table('eo_applications')
            ->join('users', 'users.id', '=', 'eo_applications.user_id')
            ->where('eo_applications.status', 'PENDING')
            ->select(
                'eo_applications.id',
                'eo_applications.reason',
                'eo_applications.created_at',
                'users.name as user_name',
                'users.email as user_email'
            )
            ->latest('eo_applications.created_at')
            ->limit(5)
            ->get();

        $pendingEventsList = DB::table('events')
            ->join('users', 'users.id', '=', 'events.eo_id')
            ->where('events.status', 'PENDING_REVIEW')
            ->select(
                'events.id',
                'events.title',
                'events.starts_at',
                'events.created_at',
                'users.name as eo_name'
            )
            ->latest('events.created_at')
            ->limit(5)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalUsers' => $totalUsers,
                'totalPeserta' => $totalPeserta,
                'totalEo' => $totalEo,
                'totalAdmin' => $totalAdmin,
                'totalEvents' => $totalEvents,
                'publishedEvents' => $publishedEvents,
                'pendingEvents' => $pendingEvents,
                'draftEvents' => $draftEvents,
                'pendingEoApplications' => $pendingEoApplications,
                'totalOrders' => $totalOrders,
                'totalRevenue' => $totalRevenue,
                'totalTicketsSold' => $totalTicketsSold,
            ],
            'recentUsers' => $recentUsers,
            'pendingEoList' => $pendingEoList,
            'pendingEventsList' => $pendingEventsList,
        ]);
    }
}
