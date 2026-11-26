@extends('emails.layouts.hajirin', [
    'subject' => "{$code} adalah kode verifikasi Hajirin Anda",
    'categoryLabel' => 'Keamanan Akun',
    'preheader' => "Gunakan kode {$code} untuk menyelesaikan {$purposeLabel}. Berlaku {$expiresInMinutes} menit.",
])

@section('content')
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        {{ $purposeLabel }}
    </h1>
    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.65;color:#334155;">
        Halo <strong>{{ $userName }}</strong>, masukkan 6 digit kode verifikasi berikut pada halaman Hajirin untuk mengonfirmasi alamat email Anda:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
        <tr>
            <td align="center" style="background-color:#F8FAFC;border:1px dashed #CBD5E1;border-radius:10px;padding:20px 16px;">
                <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:0.3em;color:#0D1B2A;">
                    {{ $code }}
                </span>
            </td>
        </tr>
    </table>

    <p style="margin:0 0 10px 0;font-size:13px;line-height:1.6;color:#475569;">
        Kode ini berlaku selama <strong>{{ $expiresInMinutes }} menit</strong> dan hanya dapat digunakan satu kali.
    </p>
    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748B;">
        Demi keamanan akun Anda, jangan pernah membagikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari tim Hajirin. Jika Anda tidak meminta kode ini, Anda dapat mengabaikan email ini.
    </p>
@endsection
