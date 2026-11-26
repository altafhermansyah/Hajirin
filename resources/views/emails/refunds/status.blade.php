@extends('emails.layouts.hajirin', [
    'subject' => $approved ? 'Pengembalian Dana Disetujui' : 'Pembaruan Pengajuan Refund',
    'categoryLabel' => 'Pengembalian Dana',
    'preheader' => "Status permohonan refund untuk pesanan #{$orderReference}.",
])

@section('content')
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        {{ $approved ? 'Pengembalian Dana Disetujui' : 'Permohonan Refund Belum Disetujui' }}
    </h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#334155;">
        Halo <strong>{{ $applicantName }}</strong>, berikut hasil verifikasi permohonan pengembalian dana Anda:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin:0 0 18px 0;">
        <tr>
            <td style="padding:16px 18px;font-size:13px;line-height:1.6;color:#334155;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="padding:3px 0;color:#64748B;width:130px;">No. Pesanan</td>
                        <td style="padding:3px 0;font-weight:600;font-family:ui-monospace,monospace;">#{{ $orderReference }}</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 0;color:#64748B;">Acara</td>
                        <td style="padding:3px 0;font-weight:600;">{{ $eventTitle }}</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 0;color:#64748B;">Nominal Refund</td>
                        <td style="padding:3px 0;font-weight:700;color:#0F172A;">{{ $amountFormatted }}</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 0;color:#64748B;">Status</td>
                        <td style="padding:3px 0;font-weight:700;color:{{ $approved ? '#047857' : '#BE123C' }};">
                            {{ $approved ? 'Disetujui' : 'Ditolak' }}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:{{ $approved ? '#ECFDF5' : '#FEF2F2' }};border:1px solid {{ $approved ? '#A7F3D0' : '#FECACA' }};border-radius:8px;margin:0 0 20px 0;">
        <tr>
            <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:{{ $approved ? '#065F46' : '#991B1B' }};">
                <strong>Catatan Administrator:</strong><br>
                {{ $resolutionNote }}
            </td>
        </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td style="border-radius:8px;background-color:#1D4ED8;">
                <a href="{{ url('/orders/' . $orderReference) }}" style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                    Lihat Detail Pesanan
                </a>
            </td>
        </tr>
    </table>
@endsection
