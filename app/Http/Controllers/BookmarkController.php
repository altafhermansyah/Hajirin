<?php

namespace App\Http\Controllers;

use App\Models\Bookmark;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BookmarkController extends Controller
{
    /**
     * Toggle status bookmark pada suatu event.
     */
    public function toggle(Request $request, string $event): JsonResponse|RedirectResponse
    {
        $user = $request->user();

        $eventModel = Str::isUuid($event)
            ? Event::where('id', $event)->first()
            : null;

        if (! $eventModel) {
            $eventModel = Event::where('slug', $event)->firstOrFail();
        }

        $bookmark = Bookmark::where('user_id', $user->id)
            ->where('event_id', $eventModel->id)
            ->first();

        if ($bookmark) {
            $bookmark->delete();
            $bookmarked = false;
            $message = 'Event berhasil dihapus dari daftar simpanan.';
        } else {
            Bookmark::firstOrCreate([
                'user_id' => $user->id,
                'event_id' => $eventModel->id,
            ]);
            $bookmarked = true;
            $message = 'Penanda telah berhasil dan tersimpan di halaman bookmark!';
        }

        if ($request->wantsJson()) {
            return response()->json([
                'status' => 'success',
                'bookmarked' => $bookmarked,
                'message' => $message,
                'eventId' => $eventModel->id,
                'eventSlug' => $eventModel->slug,
            ]);
        }

        return back()->with('success', $message);
    }
}
