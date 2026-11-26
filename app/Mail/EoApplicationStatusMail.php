<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EoApplicationStatusMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    /**
     * @var list<int>
     */
    public array $backoff = [5, 30, 120];

    public function __construct(
        public string $applicantName,
        public string $organizationName,
        public bool $approved,
        public ?string $rejectionReason = null,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->approved
            ? "Pengajuan Event Organizer \"{$this->organizationName}\" Disetujui - Hajirin"
            : "Pembaruan Pengajuan Event Organizer \"{$this->organizationName}\" - Hajirin";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.eo.application-status',
        );
    }
}
