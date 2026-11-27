<?php

namespace App\Jobs;

use App\Mail\EventCancelledAttendeeMail;
use App\Support\InAppNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendEventCancelledNotificationsJob implements ShouldQueue
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
        public string $eventDate,
        public string $cancellationReason,
    ) {}

    public function handle(): void
    {
        $recipients = DB::table('orders')
            ->join('tickets', 'tickets.order_id', '=', 'orders.id')
            ->join('users', 'users.id', '=', DB::raw('COALESCE(tickets.holder_user_id, orders.user_id)'))
            ->where('orders.event_id', $this->eventId)
            ->where('orders.status', 'PAID')
            ->where('tickets.status', '!=', 'CANCELLED')
            ->distinct()
            ->get(['users.id', 'users.name', 'users.email', 'orders.order_reference']);

        $notifiedUserIds = [];

        foreach ($recipients->chunk(200) as $chunk) {
            $newUserIds = $chunk
                ->pluck('id')
                ->unique()
                ->reject(fn (string $userId): bool => isset($notifiedUserIds[$userId]))
                ->values()
                ->all();

            foreach ($newUserIds as $userId) {
                $notifiedUserIds[$userId] = true;
            }

            if ($newUserIds !== []) {
                InAppNotification::sendMany(
                    userIds: $newUserIds,
                    type: 'EVENT_CANCELLED',
                    title: "Event Dibatalkan: {$this->eventTitle}",
                    message: "Event \"{$this->eventTitle}\" ({$this->eventDate}) telah dibatalkan. Alasan: {$this->cancellationReason}",
                    actionUrl: '/dashboard#pesanan',
                );
            }

            foreach ($chunk as $recipient) {
                Mail::to($recipient->email)->send(
                    new EventCancelledAttendeeMail(
                        recipientName: $recipient->name,
                        eventTitle: $this->eventTitle,
                        eventDate: $this->eventDate,
                        cancellationReason: $this->cancellationReason,
                        orderReference: $recipient->order_reference,
                    )
                );
            }
        }
    }
}
