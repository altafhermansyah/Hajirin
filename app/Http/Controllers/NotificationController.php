<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    /**
     * Tandai satu notifikasi milik pengguna sebagai telah dibaca dan arahkan ke tautan terkait bila ada.
     */
    public function markAsRead(Request $request, string $id): RedirectResponse
    {
        if (! Str::isUuid($id)) {
            abort(404);
        }

        $userId = $request->user()->id;

        $notification = DB::table('notifications')
            ->where('id', $id)
            ->where('user_id', $userId)
            ->first(['id', 'action_url', 'read_at']);

        if (! $notification) {
            abort(404);
        }

        if ($notification->read_at === null) {
            DB::table('notifications')
                ->where('id', $id)
                ->where('user_id', $userId)
                ->update(['read_at' => now()]);
        }

        $actionUrl = is_string($notification->action_url) ? trim($notification->action_url) : '';

        if ($actionUrl !== '' && str_starts_with($actionUrl, '/') && ! str_starts_with($actionUrl, '//')) {
            return redirect($actionUrl);
        }

        return back();
    }

    /**
     * Tandai seluruh notifikasi belum dibaca milik pengguna sebagai telah dibaca.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        DB::table('notifications')
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back();
    }
}
