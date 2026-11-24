<?php

namespace App\Http\Middleware;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user()?->only('id', 'name', 'email', 'phone', 'avatar_path', 'role'),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'adminCounts' => fn () => $request->user()?->isAdmin() ? [
                'pendingApplications' => DB::table('eo_applications')->where('status', 'PENDING')->count(),
                'pendingEvents' => DB::table('events')->where('status', 'PENDING_REVIEW')->count(),
                'pendingRefunds' => DB::table('refunds')->where('status', 'PENDING')->count(),
            ] : null,
            'notifications' => fn () => $this->resolveNotifications($request),
        ];
    }

    /**
     * Ambil ringkasan notifikasi terbaru untuk pengguna yang sedang login.
     *
     * @return array{unreadCount: int, items: list<array<string, mixed>>}|null
     */
    private function resolveNotifications(Request $request): ?array
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        $unreadCount = DB::table('notifications')
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        $items = DB::table('notifications')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(15)
            ->get(['id', 'type', 'title', 'message', 'action_url', 'read_at', 'created_at'])
            ->map(fn (object $item): array => [
                'id' => $item->id,
                'type' => $item->type,
                'title' => $item->title,
                'message' => $item->message,
                'actionUrl' => $item->action_url,
                'isRead' => $item->read_at !== null,
                'timeAgo' => Carbon::parse($item->created_at)->locale('id')->diffForHumans(),
            ])
            ->values()
            ->all();

        return [
            'unreadCount' => $unreadCount,
            'items' => $items,
        ];
    }
}
