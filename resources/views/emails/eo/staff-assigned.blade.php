@extends('emails.layouts.hajirin', [
    'subject' => 'Penugasan Staff Check-in: ' . $eventTitle,
    'categoryLabel' => 'Penugasan Staff',
    'preheader' => "Anda ditugaskan sebagai staff check-in untuk {$eventTitle}.",
])

@section('content')
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        Anda Ditugaskan Sebagai Staff Check-in
    </h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#334155;">
        Halo <strong>{{ $staffName }}</strong>, penyelenggara <strong>{{ $organizerName }}</strong> telah menunjuk akun Anda sebagai petugas scanner check-in untuk acara berikut:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin:0 0 20px 0;">
        <tr>
            <td style="padding:16px 18px;font-size:13px;line-height:1.6;color:#334155;">
                <p style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#0F172A;">{{ $eventTitle }}</p>
                <p style="margin:0;color:#64748B;">Jadwal Acara: <strong style="color:#0F172A;">{{ $eventDate }}</strong></p>
            </td>
        </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td style="border-radius:8px;background-color:#1D4ED8;">
                <a href="{{ url('/staff/check-in?event_id=' . $eventId) }}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                    Buka Portal Staff Check-in
                </a>
            </td>
        </tr>
    </table>
@endsection
