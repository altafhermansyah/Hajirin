<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EventCancelledAttendeeMail extends Mailable implements ShouldQueue
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
        public string $eventDate,
        public string $cancellationReason,
        public string $orderReference,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pemberitahuan Pembatalan Event: {$this->eventTitle}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.events.cancelled-attendee',
        );
    }
}
