<?php

namespace App\Jobs;

use App\Mail\EventBroadcastMail;
use App\Support\InAppNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SendEventBroadcastNotificationsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @var list<int>
     */
    public array $backoff = [5, 30, 120];

    public function __construct(
        public string $eventId,
        public string $eventTitle,
        public string $eventSlug,
        public string $announcementTitle,
        public string $announcementMessage,
        public string $organizerName,
        public bool $sendEmail = false,
    ) {}

    public function handle(): void
    {
        $title = Str::limit("[{$this->eventTitle}] {$this->announcementTitle}", 195, '...');
        $actionUrl = "/event/{$this->eventSlug}";

        $recipients = DB::table('orders')
            ->join('tickets', 'tickets.order_id', '=', 'orders.id')
            ->join('users', 'users.id', '=', DB::raw('COALESCE(tickets.holder_user_id, orders.user_id)'))
            ->where('orders.event_id', $this->eventId)
            ->where('orders.status', 'PAID')
            ->where('tickets.status', '!=', 'CANCELLED')
            ->distinct()
            ->get(['users.id', 'users.name', 'users.email', 'users.broadcast_emails_enabled']);

        foreach ($recipients->chunk(200) as $chunk) {
            InAppNotification::sendMany(
                userIds: $chunk->pluck('id')->all(),
                type: 'EVENT_UPDATED',
                title: $title,
                message: $this->announcementMessage,
                actionUrl: $actionUrl,
            );

            if ($this->sendEmail) {
                foreach ($chunk as $recipient) {
                    if (! (bool) ($recipient->broadcast_emails_enabled ?? true)) {
                        continue;
                    }

                    Mail::to($recipient->email)->send(
                        new EventBroadcastMail(
                            recipientName: $recipient->name,
                            eventTitle: $this->eventTitle,
                            eventSlug: $this->eventSlug,
                            announcementTitle: $this->announcementTitle,
                            announcementMessage: $this->announcementMessage,
                            organizerName: $this->organizerName,
                        )
                    );
                }
            }
        }
    }
}
