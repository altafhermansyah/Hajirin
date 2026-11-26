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
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    ...$user->only('id', 'name', 'email', 'phone', 'avatar_path', 'role', 'email_verified_at'),
                    'password_changed_at' => $user->password_changed_at
                        ? $user->password_changed_at->copy()->timezone(config('app.timezone'))->toIso8601String()
                        : null,
                    'password_changed_at_formatted' => $user->password_changed_at
                        ? $user->password_changed_at->copy()->timezone(config('app.timezone'))->locale('id')->translatedFormat('d F Y, H:i').' WIB'
                        : null,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'password_reset_status' => fn () => $request->session()->get('password_reset_status'),
                'password_reset_completed' => fn () => $request->session()->get('password_reset_completed'),
            ],
            'adminCounts' => fn () => $this->resolveAdminCounts($request),
            'notifications' => fn () => $this->resolveNotifications($request),
        ];
    }

    /**
     * Ambil ringkasan angka antrean moderasi Admin dalam satu query gabungan.
     *
     * @return array{pendingApplications: int, pendingEvents: int, pendingRefunds: int}|null
     */
    private function resolveAdminCounts(Request $request): ?array
    {
        if (! $request->user()?->isAdmin()) {
            return null;
        }

        $row = DB::selectOne("
            SELECT
                (SELECT COUNT(*) FROM eo_applications WHERE status = 'PENDING') AS pending_applications,
                (SELECT COUNT(*) FROM events WHERE status = 'PENDING_REVIEW') AS pending_events,
                (SELECT COUNT(*) FROM refunds WHERE status = 'PENDING') AS pending_refunds
        ");

        return [
            'pendingApplications' => (int) ($row->pending_applications ?? 0),
            'pendingEvents' => (int) ($row->pending_events ?? 0),
            'pendingRefunds' => (int) ($row->pending_refunds ?? 0),
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
