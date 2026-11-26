<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordChangedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    /**
     * @var list<int>
     */
    public array $backoff = [5, 30, 120];

    public function __construct(
        public string $userName,
        public string $changedAtFormatted,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kata Sandi Akun Hajirin Anda Telah Diperbarui',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.auth.password-changed',
        );
    }
}
