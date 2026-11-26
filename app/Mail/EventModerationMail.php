<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EventModerationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    /**
     * @var list<int>
     */
    public array $backoff = [5, 30, 120];

    public function __construct(
        public string $organizerName,
        public string $eventTitle,
        public string $eventId,
        public string $eventSlug,
        public bool $approved,
        public ?string $rejectionReason = null,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->approved
            ? "Event \"{$this->eventTitle}\" Resmi Tayang di Hajirin"
            : "Event \"{$this->eventTitle}\" Memerlukan Revisi - Hajirin";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.events.moderation-status',
        );
    }
}
