@extends('emails.layouts.hajirin', [
    'subject' => 'Konfirmasi Transfer E-Tiket Hajirin',
    'categoryLabel' => 'Transfer E-Tiket',
    'preheader' => 'Transfer e-tiket untuk acara '.($eventTitle ?? 'Hajirin').' telah selesai.',
])

@section('content')
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        @if(!empty($isRecipient))
            E-Tiket Berhasil Diklaim
        @else
            Transfer E-Tiket Telah Diterima
        @endif
    </h1>

    @if(!empty($isRecipient))
        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#334155;">
            Halo <strong>{{ $recipientName }}</strong>, e-tiket dari <strong>{{ $senderName }}</strong> untuk acara <strong>{{ $eventTitle }}</strong> ({{ $ticketTypeName }}) telah resmi berpindah ke akun Hajirin Anda pada {{ $completedAtFormatted }}.
        </p>
        <p style="margin:0 0 18px 0;font-size:13px;line-height:1.6;color:#475569;">
            Kode QR baru Anda adalah <strong style="font-family:monospace;">{{ $newTicketCode }}</strong>. Kode QR lama sudah dinonaktifkan.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td style="border-radius:8px;background-color:#1D4ED8;">
                    <a href="{{ $ticketUrl }}" style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                        Buka E-Tiket Saya
                    </a>
                </td>
            </tr>
        </table>
    @else
        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#334155;">
            Halo <strong>{{ $senderName }}</strong>, transfer e-tiket untuk acara <strong>{{ $eventTitle }}</strong> ({{ $ticketTypeName }}) telah berhasil diklaim oleh <strong>{{ $recipientName }}</strong> ({{ $recipientEmail }}) pada {{ $completedAtFormatted }}.
        </p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">
            Kode QR sebelumnya di akun Anda kini tidak lagi berlaku karena kepemilikan tiket telah berpindah sepenuhnya ke penerima.
        </p>
    @endif
@endsection
