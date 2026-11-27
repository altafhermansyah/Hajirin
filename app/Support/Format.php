<?php

namespace App\Support;

use Carbon\Carbon;
use DateTimeInterface;

final class Format
{
    /**
     * Format nominal angka ke format mata uang Rupiah Indonesia.
     */
    public static function rupiah(float|int $amount, bool $freeLabel = false): string
    {
        $numeric = (float) $amount;

        if ($freeLabel && $numeric <= 0) {
            return 'Gratis';
        }

        return 'Rp'.number_format($numeric, 0, ',', '.');
    }

    /**
     * Format tanggal/waktu ke zona waktu aplikasi (WIB) menggunakan lokal Bahasa Indonesia.
     */
    public static function wib(DateTimeInterface|string $date, string $format = 'd M Y, H:i'): string
    {
        return Carbon::parse($date)
            ->timezone(config('app.timezone'))
            ->locale('id')
            ->translatedFormat($format).' WIB';
    }
}
