@extends('emails.layouts.hajirin', [
    'subject' => $approved ? 'Pengajuan EO Disetujui' : 'Pembaruan Pengajuan EO',
    'categoryLabel' => 'Verifikasi EO',
    'preheader' => $approved
        ? "Pengajuan organisasi {$organizationName} telah disetujui."
        : "Pengajuan organisasi {$organizationName} memerlukan perbaikan data.",
])

@section('content')
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        {{ $approved ? 'Pengajuan Event Organizer Disetujui' : 'Pengajuan Event Organizer Belum Disetujui' }}
    </h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#334155;">
        Halo <strong>{{ $applicantName }}</strong>,
    </p>

    @if($approved)
        <p style="margin:0 0 18px 0;font-size:14px;line-height:1.65;color:#334155;">
            Selamat! Pengajuan verifikasi untuk organisasi <strong>{{ $organizationName }}</strong> telah disetujui oleh Tim Admin Hajirin. Akun Anda kini resmi berstatus <strong>Event Organizer (EO)</strong> dan siap membuat event serta menjual tiket.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
            <tr>
                <td style="border-radius:8px;background-color:#1D4ED8;">
                    <a href="{{ url('/eo/dashboard') }}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                        Buka Creator Studio EO
                    </a>
                </td>
            </tr>
        </table>
    @else
        <p style="margin:0 0 14px 0;font-size:14px;line-height:1.65;color:#334155;">
            Pengajuan verifikasi untuk organisasi <strong>{{ $organizationName }}</strong> belum dapat kami setujui saat ini.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;margin:0 0 20px 0;">
            <tr>
                <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#991B1B;">
                    <strong>Catatan Evaluasi Admin:</strong><br>
                    {{ $rejectionReason }}
                </td>
            </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td style="border-radius:8px;background-color:#0D1B2A;">
                    <a href="{{ url('/eo-applications/create') }}" style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                        Perbarui &amp; Ajukan Ulang
                    </a>
                </td>
            </tr>
        </table>
    @endif
@endsection
