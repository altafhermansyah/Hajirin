<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $userName,
        public string $code,
        public int $expiresInMinutes = 10,
        public string $purposeLabel = 'Verifikasi Alamat Email',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "{$this->code} adalah kode verifikasi Hajirin Anda",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.auth.otp',
        );
    }
}
