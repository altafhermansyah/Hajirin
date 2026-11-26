<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketTransferCompletedMail extends Mailable implements ShouldQueue
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
        $isRecipient = (bool) ($this->payload['isRecipient'] ?? false);

        return new Envelope(
            subject: $isRecipient
                ? "E-Tiket Berhasil Diklaim: {$eventTitle}"
                : "Transfer E-Tiket Telah Diterima: {$eventTitle}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.tickets.transfer-completed',
            with: $this->payload,
        );
    }
}
