@extends('emails.layouts.hajirin', [
    'subject' => 'Undangan Transfer E-Tiket Hajirin',
    'categoryLabel' => 'Transfer E-Tiket',
    'preheader' => ($senderName ?? 'Pengguna Hajirin').' mengirim transfer e-tiket untuk acara '.($eventTitle ?? 'Hajirin').'.',
])

@section('content')
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        Anda Menerima Transfer E-Tiket
    </h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#334155;">
        Halo <strong>{{ $recipientName }}</strong>, <strong>{{ $senderName }}</strong> ingin mentransfer 1 (satu) e-tiket untuk acara berikut kepada Anda:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;border:1px solid #E2E8F0;border-radius:10px;background-color:#F8FAFC;">
        <tr>
            <td style="padding:16px;">
                <p style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#0F172A;">{{ $eventTitle }}</p>
                <p style="margin:0 0 4px 0;font-size:13px;color:#475569;">Jenis Tiket: <strong>{{ $ticketTypeName }}</strong></p>
                <p style="margin:0 0 4px 0;font-size:13px;color:#475569;">Jadwal: {{ $eventDate }} • {{ $eventTime }}</p>
                <p style="margin:0;font-size:13px;color:#475569;">Lokasi: {{ $eventLocation }}</p>
            </td>
        </tr>
    </table>

    <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#475569;">
        Gunakan <strong>Kode Unik Transfer</strong> berikut saat mengklaim tiket (masuk atau daftar akun Hajirin menggunakan email <strong>{{ $recipientEmail }}</strong>):
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;border:1px dashed #94A3B8;border-radius:10px;background-color:#EFF6FF;">
        <tr>
            <td align="center" style="padding:16px;">
                <p style="margin:0 0 4px 0;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#1E40AF;font-weight:600;">Kode Unik Transfer</p>
                <p style="margin:0;font-family:monospace;font-size:28px;letter-spacing:6px;font-weight:800;color:#0F172A;">{{ $transferCode }}</p>
                <p style="margin:6px 0 0 0;font-size:11px;color:#475569;">Berlaku hingga {{ $expiresAtFormatted }}</p>
            </td>
        </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;">
        <tr>
            <td style="border-radius:8px;background-color:#1D4ED8;">
                <a href="{{ $claimUrl }}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                    Klaim E-Tiket Sekarang
                </a>
            </td>
        </tr>
    </table>

    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748B;">
        Demi keamanan, setelah Anda mengklaim tiket ini, kode QR lama milik pengirim otomatis hangus dan kode QR baru akan diterbitkan khusus untuk akun Anda.
    </p>
@endsection
