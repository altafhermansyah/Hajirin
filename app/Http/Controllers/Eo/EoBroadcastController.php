<?php

namespace App\Http\Controllers\Eo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Eo\StoreEoBroadcastRequest;
use App\Jobs\SendEventBroadcastNotificationsJob;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EoBroadcastController extends Controller
{
    /**
     * Kirim pengumuman in-app (dan opsional email) ke seluruh peserta dengan tiket aktif pada event milik EO.
     */
    public function store(StoreEoBroadcastRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $sendEmail = $request->boolean('send_email');

        $event = Event::query()
            ->where('id', $validated['event_id'])
            ->where('eo_id', $user->id)
            ->firstOrFail();

        $recipientCount = (int) DB::table('orders')
            ->join('tickets', 'tickets.order_id', '=', 'orders.id')
            ->where('orders.event_id', $event->id)
            ->where('orders.status', 'PAID')
            ->where('tickets.status', '!=', 'CANCELLED')
            ->selectRaw('COUNT(DISTINCT COALESCE(tickets.holder_user_id, orders.user_id)) as total')
            ->value('total');

        if ($recipientCount === 0) {
            throw ValidationException::withMessages([
                'event_id' => 'Belum ada peserta dengan tiket aktif pada event ini untuk dikirimi pengumuman.',
            ]);
        }

        $organizerName = $sendEmail
            ? (DB::table('eo_applications')
                ->where('user_id', $user->id)
                ->where('status', 'APPROVED')
                ->value('organization_name') ?: $user->name)
            : $user->name;

        SendEventBroadcastNotificationsJob::dispatch(
            eventId: $event->id,
            eventTitle: $event->title,
            eventSlug: $event->slug,
            announcementTitle: $validated['title'],
            announcementMessage: $validated['message'],
            organizerName: $organizerName,
            sendEmail: $sendEmail,
        )->afterCommit();

        $suffix = $sendEmail ? ' beserta salinan email.' : '.';

        return back()->with(
            'success',
            "Pengumuman berhasil dikirim ke {$recipientCount} peserta event \"{$event->title}\"{$suffix}"
        );
    }
}
