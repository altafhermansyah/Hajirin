@extends('emails.layouts.hajirin', [
    'subject' => "[{$eventTitle}] {$announcementTitle}",
    'categoryLabel' => 'Pengumuman Event',
    'preheader' => $announcementTitle,
])

@section('content')
    <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748B;">
        Pengumuman dari {{ $organizerName }}
    </p>
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        {{ $announcementTitle }}
    </h1>
    <p style="margin:0 0 14px 0;font-size:13px;color:#475569;">
        Halo <strong>{{ $recipientName }}</strong>, berikut pengumuman resmi untuk peserta acara <strong>{{ $eventTitle }}</strong>:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin:0 0 22px 0;">
        <tr>
            <td style="padding:18px 20px;font-size:14px;line-height:1.7;color:#0F172A;white-space:pre-line;">{{ $announcementMessage }}</td>
        </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td style="border-radius:8px;background-color:#1D4ED8;">
                <a href="{{ url('/event/' . $eventSlug) }}" style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                    Lihat Halaman Event
                </a>
            </td>
        </tr>
    </table>
@endsection
