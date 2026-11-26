<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AttendeeTicketMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    /**
     * @var list<int>
     */
    public array $backoff = [5, 30, 120];

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public array $payload,
    ) {}

    public function envelope(): Envelope
    {
        $title = (string) ($this->payload['eventTitle'] ?? 'Event Hajirin');

        return new Envelope(
            subject: "E-Tiket Anda untuk {$title} - Hajirin",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.orders.attendee-ticket',
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $ics = OrderConfirmedMail::buildIcs($this->payload);

        if ($ics === '') {
            return [];
        }

        return [
            Attachment::fromData(fn (): string => $ics, 'hajirin-event.ics')
                ->withMime('text/calendar; charset=UTF-8; method=PUBLISH'),
        ];
    }
}
