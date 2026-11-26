<?php

namespace App\Mail;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmedMail extends Mailable implements ShouldQueue
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
        $ref = (string) ($this->payload['orderReference'] ?? '');
        $title = (string) ($this->payload['eventTitle'] ?? 'Event Hajirin');

        return new Envelope(
            subject: "E-Tiket & Invoice Anda Siap - {$title} (#{$ref})",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.orders.confirmed',
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $ics = self::buildIcs($this->payload);

        if ($ics === '') {
            return [];
        }

        return [
            Attachment::fromData(fn (): string => $ics, 'hajirin-event.ics')
                ->withMime('text/calendar; charset=UTF-8; method=PUBLISH'),
        ];
    }

    /**
     * Bangun konten file iCalendar (RFC 5545) agar muncul kartu tambah kalender di Gmail/Apple Mail.
     *
     * @param  array<string, mixed>  $payload
     */
    public static function buildIcs(array $payload): string
    {
        if (empty($payload['startsAtIso']) || empty($payload['endsAtIso'])) {
            return '';
        }

        $escape = static fn (string $text): string => str_replace(
            ['\\', ';', ',', "\r\n", "\n", "\r"],
            ['\\\\', '\;', '\,', '\n', '\n', '\n'],
            $text
        );

        $uid = ($payload['orderReference'] ?? uniqid('hjr-', true)).'@hajirin.id';
        $dtStamp = now()->utc()->format('Ymd\THis\Z');
        $dtStart = Carbon::parse((string) $payload['startsAtIso'])->utc()->format('Ymd\THis\Z');
        $dtEnd = Carbon::parse((string) $payload['endsAtIso'])->utc()->format('Ymd\THis\Z');
        $summary = $escape((string) ($payload['eventTitle'] ?? 'Event Hajirin'));
        $location = $escape((string) ($payload['eventLocation'] ?? 'Hajirin Event'));
        $ticketUrl = (string) ($payload['ticketUrl'] ?? config('app.url'));
        $orderRef = (string) ($payload['orderReference'] ?? '-');
        $description = $escape("E-Tiket Hajirin (#{$orderRef}). Buka e-tiket dan kode QR Anda di: {$ticketUrl}");

        return implode("\r\n", [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Hajirin//Event Ticketing//ID',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            "UID:{$uid}",
            "DTSTAMP:{$dtStamp}",
            "DTSTART:{$dtStart}",
            "DTEND:{$dtEnd}",
            "SUMMARY:{$summary}",
            "LOCATION:{$location}",
            "DESCRIPTION:{$description}",
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ]);
    }
}
