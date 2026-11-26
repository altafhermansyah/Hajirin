<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EventBroadcastMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    /**
     * @var list<int>
     */
    public array $backoff = [5, 30, 120];

    public function __construct(
        public string $recipientName,
        public string $eventTitle,
        public string $eventSlug,
        public string $announcementTitle,
        public string $announcementMessage,
        public string $organizerName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[{$this->eventTitle}] {$this->announcementTitle}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.events.broadcast',
        );
    }
}
