@extends('emails.layouts.hajirin', [
    'subject' => 'Atur Ulang Kata Sandi Akun Hajirin Anda',
    'categoryLabel' => 'Keamanan Akun',
    'preheader' => 'Tautan pengaturan ulang kata sandi Hajirin Anda berlaku selama 60 menit.',
])

@section('content')
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        Permintaan Atur Ulang Kata Sandi
    </h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#334155;">
        Halo <strong>{{ $userName }}</strong>, kami menerima permintaan untuk mengatur ulang kata sandi akun Hajirin Anda. Klik tombol di bawah ini untuk membuat kata sandi baru:
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;">
        <tr>
            <td style="border-radius:8px;background-color:#1D4ED8;">
                <a href="{{ $resetUrl }}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                    Atur Ulang Kata Sandi
                </a>
            </td>
        </tr>
    </table>

    <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#475569;">
        Tautan ini berlaku selama <strong>{{ $expireMinutes }} menit</strong>. Jika Anda tidak merasa meminta pengaturan ulang kata sandi, abaikan email ini dan kata sandi Anda tidak akan berubah.
    </p>

    <p style="margin:16px 0 0 0;padding-top:14px;border-top:1px solid #E2E8F0;font-size:12px;line-height:1.6;color:#64748B;word-break:break-all;">
        Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:<br>
        <a href="{{ $resetUrl }}" style="color:#1D4ED8;">{{ $resetUrl }}</a>
    </p>
@endsection
