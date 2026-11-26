@extends('emails.layouts.hajirin', [
    'subject' => 'E-Tiket & Invoice Anda Siap - ' . ($payload['eventTitle'] ?? 'Event Hajirin'),
    'categoryLabel' => 'E-Tiket & Invoice',
    'preheader' => 'Pembayaran lunas untuk ' . ($payload['eventTitle'] ?? 'Event Hajirin') . ' (#' . ($payload['orderReference'] ?? '') . ').',
])

@section('content')
    <h1 style="margin:0 0 10px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        Pembayaran Berhasil &amp; E-Tiket Aktif
    </h1>
    <p style="margin:0 0 20px 0;font-size:14px;line-height:1.65;color:#334155;">
        Halo <strong>{{ $payload['buyerName'] ?? 'Peserta' }}</strong>, terima kasih telah memesan tiket di Hajirin. Berikut rincian pesanan dan daftar kode e-tiket Anda:
    </p>

    {{-- Kartu Detail Event & Pembayaran --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin:0 0 20px 0;">
        <tr>
            <td style="padding:18px 20px;">
                <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748B;">
                    Detail Acara
                </p>
                <p style="margin:0 0 12px 0;font-size:16px;font-weight:700;color:#0F172A;">
                    {{ $payload['eventTitle'] ?? '-' }}
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;line-height:1.6;color:#334155;">
                    <tr>
                        <td style="padding:3px 0;color:#64748B;width:130px;">No. Pesanan</td>
                        <td style="padding:3px 0;font-weight:600;font-family:ui-monospace,monospace;">{{ $payload['orderReference'] ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 0;color:#64748B;">Jadwal</td>
                        <td style="padding:3px 0;">{{ $payload['eventDate'] ?? '-' }} ({{ $payload['eventTime'] ?? '-' }})</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 0;color:#64748B;">Lokasi</td>
                        <td style="padding:3px 0;">{{ $payload['eventLocation'] ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 0;color:#64748B;">Jenis Tiket</td>
                        <td style="padding:3px 0;">{{ $payload['ticketSummary'] ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 0;color:#64748B;">Total Bayar</td>
                        <td style="padding:3px 0;font-weight:700;color:#0F172A;">{{ $payload['totalAmountFormatted'] ?? 'Gratis' }} ({{ $payload['paymentMethod'] ?? 'QRIS' }})</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- Daftar Kode E-Tiket --}}
    @if(!empty($payload['tickets']))
        <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#0F172A;">
            Daftar Kode E-Tiket ({{ count($payload['tickets']) }} Tiket)
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8F0;border-radius:8px;margin:0 0 22px 0;border-collapse:separate;">
            @foreach($payload['tickets'] as $idx => $ticket)
                <tr>
                    <td style="padding:10px 14px;font-size:13px;color:#0F172A;{{ $idx > 0 ? 'border-top:1px solid #E2E8F0;' : '' }}">
                        <strong>{{ $ticket['ticket_type_name'] ?? 'Tiket' }}</strong>
                        <span style="color:#64748B;"> - {{ $ticket['attendee_name'] ?? '-' }}</span>
                    </td>
                    <td align="right" style="padding:10px 14px;font-family:ui-monospace,monospace;font-size:12px;font-weight:700;color:#1D4ED8;{{ $idx > 0 ? 'border-top:1px solid #E2E8F0;' : '' }}">
                        {{ $ticket['code'] ?? '-' }}
                    </td>
                </tr>
            @endforeach
        </table>
    @endif

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
        <tr>
            <td style="border-radius:8px;background-color:#1D4ED8;">
                <a href="{{ $payload['ticketUrl'] ?? url('/dashboard#tiket') }}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                    Buka E-Tiket &amp; Kode QR
                </a>
            </td>
            <td style="width:10px;"></td>
            <td style="border-radius:8px;border:1px solid #CBD5E1;background-color:#FFFFFF;">
                <a href="{{ $payload['orderUrl'] ?? url('/dashboard#pesanan') }}" style="display:inline-block;padding:11px 18px;font-size:13px;font-weight:600;color:#0F172A;text-decoration:none;border-radius:8px;">
                    Lihat Invoice
                </a>
            </td>
        </tr>
    </table>

    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748B;">
        Kami juga melampirkan file kalender <strong>hajirin-event.ics</strong> pada email ini agar Anda dapat langsung menyimpan jadwal acara ke Google Calendar, Apple Calendar, atau Outlook.
    </p>
@endsection
