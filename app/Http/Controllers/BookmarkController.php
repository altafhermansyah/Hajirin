<?php

namespace App\Http\Controllers;

use App\Models\Bookmark;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    /**
     * Toggle status bookmark pada suatu event.
     */
    public function toggle(Request $request, Event $event): JsonResponse|RedirectResponse
    {
        $user = $request->user();

        $bookmark = Bookmark::where('user_id', $user->id)
            ->where('event_id', $event->id)
            ->first();

        if ($bookmark) {
            $bookmark->delete();
            $bookmarked = false;
            $message = 'Event berhasil dihapus dari daftar simpanan.';
        } else {
            Bookmark::create([
                'user_id' => $user->id,
                'event_id' => $event->id,
            ]);
            $bookmarked = true;
            $message = 'Event berhasil disimpan ke profil kamu!';
        }

        if ($request->wantsJson()) {
            return response()->json([
                'status' => 'success',
                'bookmarked' => $bookmarked,
                'message' => $message,
            ]);
        }

        return back()->with('success', $message);
    }
}
