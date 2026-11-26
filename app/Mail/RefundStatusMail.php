<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RefundStatusMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    /**
     * @var list<int>
     */
    public array $backoff = [5, 30, 120];

    public function __construct(
        public string $applicantName,
        public string $orderReference,
        public string $eventTitle,
        public string $amountFormatted,
        public bool $approved,
        public string $resolutionNote,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->approved
            ? "Pengembalian Dana #{$this->orderReference} Disetujui - Hajirin"
            : "Pembaruan Pengajuan Refund #{$this->orderReference} - Hajirin";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.refunds.status',
        );
    }
}
