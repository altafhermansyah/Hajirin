@extends('emails.layouts.hajirin', [
    'subject' => 'E-Tiket Anda untuk ' . ($payload['eventTitle'] ?? 'Event Hajirin'),
    'categoryLabel' => 'E-Tiket Peserta',
    'preheader' => 'Anda terdaftar sebagai peserta untuk ' . ($payload['eventTitle'] ?? 'Event Hajirin') . '.',
])

@section('content')
    <h1 style="margin:0 0 10px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        E-Tiket Acara Anda Sudah Siap
    </h1>
    <p style="margin:0 0 20px 0;font-size:14px;line-height:1.65;color:#334155;">
        Halo <strong>{{ $payload['attendeeName'] ?? 'Peserta' }}</strong>, tiket untuk acara berikut telah dipesankan atas nama Anda oleh <strong>{{ $payload['buyerName'] ?? 'Pemesan' }}</strong> melalui Hajirin.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin:0 0 20px 0;">
        <tr>
            <td style="padding:18px 20px;">
                <p style="margin:0 0 10px 0;font-size:16px;font-weight:700;color:#0F172A;">
                    {{ $payload['eventTitle'] ?? '-' }}
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;line-height:1.6;color:#334155;">
                    <tr>
                        <td style="padding:3px 0;color:#64748B;width:120px;">Jadwal</td>
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
                </table>
            </td>
        </tr>
    </table>

    @if(!empty($payload['tickets']))
        <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#0F172A;">
            Kode E-Tiket Check-in Anda
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8F0;border-radius:8px;margin:0 0 20px 0;border-collapse:separate;">
            @foreach($payload['tickets'] as $idx => $ticket)
                <tr>
                    <td style="padding:10px 14px;font-size:13px;color:#0F172A;{{ $idx > 0 ? 'border-top:1px solid #E2E8F0;' : '' }}">
                        <strong>{{ $ticket['ticket_type_name'] ?? 'Tiket' }}</strong>
                    </td>
                    <td align="right" style="padding:10px 14px;font-family:ui-monospace,monospace;font-size:12px;font-weight:700;color:#1D4ED8;{{ $idx > 0 ? 'border-top:1px solid #E2E8F0;' : '' }}">
                        {{ $ticket['code'] ?? '-' }}
                    </td>
                </tr>
            @endforeach
        </table>
    @endif

    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748B;">
        Tunjukkan kode tiket di atas kepada petugas check-in saat tiba di lokasi acara. Lampiran <strong>hajirin-event.ics</strong> disertakan untuk menyimpan jadwal ke kalender Anda.
    </p>
@endsection
