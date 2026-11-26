<?php

namespace App\Http\Controllers\Eo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Eo\StoreEoBroadcastRequest;
use App\Mail\EventBroadcastMail;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
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

        $recipients = DB::table('orders')
            ->join('tickets', 'tickets.order_id', '=', 'orders.id')
            ->join('users', 'users.id', '=', 'orders.user_id')
            ->where('orders.event_id', $event->id)
            ->where('orders.status', 'PAID')
            ->where('tickets.status', '!=', 'CANCELLED')
            ->distinct()
            ->get(['users.id', 'users.name', 'users.email']);

        if ($recipients->isEmpty()) {
            throw ValidationException::withMessages([
                'event_id' => 'Belum ada peserta dengan tiket aktif pada event ini untuk dikirimi pengumuman.',
            ]);
        }

        $now = now();
        $title = Str::limit("[{$event->title}] {$validated['title']}", 195, '...');
        $actionUrl = "/event/{$event->slug}";
        $organizerName = $sendEmail
            ? (DB::table('eo_applications')
                ->where('user_id', $user->id)
                ->where('status', 'APPROVED')
                ->value('organization_name') ?: $user->name)
            : $user->name;

        DB::transaction(function () use ($recipients, $title, $validated, $actionUrl, $now, $sendEmail, $event, $organizerName): void {
            foreach ($recipients->chunk(200) as $chunk) {
                $rows = $chunk->map(fn (object $recipient): array => [
                    'id' => Str::uuid()->toString(),
                    'user_id' => $recipient->id,
                    'type' => 'EVENT_UPDATED',
                    'title' => $title,
                    'message' => $validated['message'],
                    'action_url' => $actionUrl,
                    'created_at' => $now,
                ])->all();

                DB::table('notifications')->insert($rows);

                if ($sendEmail) {
                    foreach ($chunk as $recipient) {
                        Mail::to($recipient->email)->send(
                            (new EventBroadcastMail(
                                recipientName: $recipient->name,
                                eventTitle: $event->title,
                                eventSlug: $event->slug,
                                announcementTitle: $validated['title'],
                                announcementMessage: $validated['message'],
                                organizerName: $organizerName,
                            ))->afterCommit()
                        );
                    }
                }
            }
        });

        $suffix = $sendEmail ? ' beserta salinan email.' : '.';

        return back()->with(
            'success',
            "Pengumuman berhasil dikirim ke {$recipients->count()} peserta event \"{$event->title}\"{$suffix}"
        );
    }
}
