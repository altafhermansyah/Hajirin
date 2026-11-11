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
        $userStats = DB::table('users')
            ->selectRaw('COUNT(*) as total_users')
            ->selectRaw("COUNT(CASE WHEN role = 'USER' THEN 1 END) as total_peserta")
            ->selectRaw("COUNT(CASE WHEN role = 'EO' THEN 1 END) as total_eo")
            ->selectRaw("COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as total_admin")
            ->first();

        $eventStats = DB::table('events')
            ->selectRaw('COUNT(*) as total_events')
            ->selectRaw("COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published_events")
            ->selectRaw("COUNT(CASE WHEN status = 'PENDING_REVIEW' THEN 1 END) as pending_events")
            ->selectRaw("COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_events")
            ->first();

        $pendingEoApplications = DB::table('eo_applications')
            ->where('status', 'PENDING')
            ->count();

        $recentUsers = DB::table('users')
            ->select('id', 'name', 'email', 'role', 'created_at')
            ->latest('created_at')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalUsers' => (int) ($userStats->total_users ?? 0),
                'totalPeserta' => (int) ($userStats->total_peserta ?? 0),
                'totalEo' => (int) ($userStats->total_eo ?? 0),
                'totalAdmin' => (int) ($userStats->total_admin ?? 0),
                'totalEvents' => (int) ($eventStats->total_events ?? 0),
                'publishedEvents' => (int) ($eventStats->published_events ?? 0),
                'pendingEvents' => (int) ($eventStats->pending_events ?? 0),
                'draftEvents' => (int) ($eventStats->draft_events ?? 0),
                'pendingEoApplications' => $pendingEoApplications,
            ],
            'recentUsers' => $recentUsers,
        ]);
    }
}
