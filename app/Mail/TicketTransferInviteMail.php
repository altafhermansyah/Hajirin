<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketTransferInviteMail extends Mailable implements ShouldQueue
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
        $eventTitle = (string) ($this->payload['eventTitle'] ?? 'Acara Hajirin');

        return new Envelope(
            subject: "Anda Menerima Transfer E-Tiket: {$eventTitle}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.tickets.transfer-invite',
            with: $this->payload,
        );
    }
}
