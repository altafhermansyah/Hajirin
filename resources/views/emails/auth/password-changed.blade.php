@extends('emails.layouts.hajirin', [
    'subject' => 'Kata Sandi Akun Hajirin Anda Telah Diperbarui',
    'categoryLabel' => 'Keamanan Akun',
    'preheader' => 'Kata sandi akun Hajirin Anda baru saja diubah.',
])

@section('content')
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        Kata Sandi Berhasil Diperbarui
    </h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#334155;">
        Halo <strong>{{ $userName }}</strong>, kata sandi untuk akun Hajirin Anda telah berhasil diubah pada <strong>{{ $changedAtFormatted }}</strong>.
    </p>
    <p style="margin:0 0 20px 0;font-size:13px;line-height:1.6;color:#475569;">
        Jika Anda yang melakukan perubahan ini, tidak ada tindakan lanjutan yang diperlukan. Namun jika Anda tidak mengenali aktivitas ini, segera lakukan reset kata sandi melalui tombol di bawah ini.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td style="border-radius:8px;background-color:#0D1B2A;">
                <a href="{{ url('/forgot-password') }}" style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                    Amankan Akun Saya
                </a>
            </td>
        </tr>
    </table>
@endsection
