@extends('emails.layouts.hajirin', [
    'subject' => $approved ? 'Event Resmi Tayang' : 'Event Memerlukan Revisi',
    'categoryLabel' => 'Moderasi Event',
    'preheader' => $approved
        ? "Event {$eventTitle} telah disetujui dan tayang di katalog publik Hajirin."
        : "Event {$eventTitle} memerlukan revisi sebelum dapat ditayangkan.",
])

@section('content')
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        {{ $approved ? 'Event Anda Telah Disetujui & Tayang' : 'Event Anda Memerlukan Revisi' }}
    </h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#334155;">
        Halo <strong>{{ $organizerName }}</strong>,
    </p>

    @if($approved)
        <p style="margin:0 0 20px 0;font-size:14px;line-height:1.65;color:#334155;">
            Event <strong>{{ $eventTitle }}</strong> telah lulus moderasi Administrator dan kini resmi tayang di katalog publik Hajirin. Calon peserta sudah dapat membeli tiket sekarang.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td style="border-radius:8px;background-color:#1D4ED8;">
                    <a href="{{ url('/event/' . $eventSlug) }}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                        Lihat Halaman Publik Event
                    </a>
                </td>
            </tr>
        </table>
    @else
        <p style="margin:0 0 14px 0;font-size:14px;line-height:1.65;color:#334155;">
            Event <strong>{{ $eventTitle }}</strong> belum dapat dipublikasikan karena memerlukan penyesuaian berdasarkan evaluasi moderator:
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;margin:0 0 20px 0;">
            <tr>
                <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#991B1B;">
                    <strong>Catatan Moderator:</strong><br>
                    {{ $rejectionReason }}
                </td>
            </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td style="border-radius:8px;background-color:#0D1B2A;">
                    <a href="{{ url('/eo/events/' . $eventId . '/edit') }}" style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                        Edit &amp; Ajukan Ulang Event
                    </a>
                </td>
            </tr>
        </table>
    @endif
@endsection
