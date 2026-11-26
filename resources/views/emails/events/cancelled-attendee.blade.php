@extends('emails.layouts.hajirin', [
    'subject' => 'Pemberitahuan Pembatalan Event: ' . $eventTitle,
    'categoryLabel' => 'Pembatalan Event',
    'preheader' => "Event {$eventTitle} telah dibatalkan. Lihat panduan pengembalian dana untuk pesanan #{$orderReference}.",
])

@section('content')
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#0F172A;">
        Pemberitahuan Pembatalan Acara
    </h1>
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.65;color:#334155;">
        Halo <strong>{{ $recipientName }}</strong>, dengan berat hati kami menginformasikan bahwa event <strong>{{ $eventTitle }}</strong> ({{ $eventDate }}) untuk pesanan <strong>#{{ $orderReference }}</strong> telah dibatalkan.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;margin:0 0 20px 0;">
        <tr>
            <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#92400E;">
                <strong>Alasan Pembatalan:</strong><br>
                {{ $cancellationReason }}
            </td>
        </tr>
    </table>

    <p style="margin:0 0 18px 0;font-size:13px;line-height:1.6;color:#475569;">
        Anda dapat mengajukan pengembalian dana (refund) langsung dari halaman detail pesanan Anda di Hajirin.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td style="border-radius:8px;background-color:#1D4ED8;">
                <a href="{{ url('/orders/' . $orderReference) }}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                    Buka Detail Pesanan &amp; Refund
                </a>
            </td>
        </tr>
    </table>
@endsection
