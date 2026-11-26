<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'Hajirin Ticketing' }}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#0F172A;-webkit-font-smoothing:antialiased;">
    @if(!empty($preheader))
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{{ $preheader }}</div>
    @endif

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
                    {{-- Header --}}
                    <tr>
                        <td style="background-color:#0D1B2A;padding:22px 28px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size:18px;font-weight:700;letter-spacing:0.06em;color:#FFFFFF;">
                                        HAJIRIN
                                    </td>
                                    @if(!empty($categoryLabel))
                                        <td align="right" style="font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#94A3B8;">
                                            {{ $categoryLabel }}
                                        </td>
                                    @endif
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:28px;">
                            @yield('content')
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:18px 28px;font-size:12px;line-height:1.6;color:#64748B;">
                            <p style="margin:0 0 6px 0;">
                                Email ini dikirim otomatis oleh sistem <strong>Hajirin</strong> ({{ config('app.url') }}). Mohon tidak membalas langsung ke alamat ini.
                            </p>
                            <p style="margin:0;color:#94A3B8;">
                                &copy; {{ date('Y') }} Hajirin Ticketing &amp; Event Management. Seluruh hak cipta dilindungi.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
