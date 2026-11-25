<?php

namespace App\Http\Controllers;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

abstract class Controller
{
    /**
     * Simpan file unggahan dengan konversi otomatis ke WebP dan resize proporsional untuk gambar.
     * File non-gambar (seperti PDF) disimpan apa adanya.
     */
    protected function storeOptimizedImage(
        UploadedFile $file,
        string $directory,
        string $disk = 'public',
        int $maxWidth = 1600,
        int $quality = 80,
    ): string {
        $mimeType = $file->getMimeType() ?? '';

        if (! str_starts_with($mimeType, 'image/') || ! function_exists('imagecreatefromstring') || ! function_exists('imagewebp')) {
            return $file->store($directory, $disk);
        }

        $source = @imagecreatefromstring($file->get());

        if ($source === false) {
            return $file->store($directory, $disk);
        }

        if ($mimeType === 'image/jpeg' && function_exists('exif_read_data') && $file->getRealPath()) {
            $exif = @exif_read_data($file->getRealPath());
            $orientation = (int) ($exif['Orientation'] ?? 1);

            $angle = match ($orientation) {
                3 => 180,
                6 => -90,
                8 => 90,
                default => 0,
            };

            if ($angle !== 0) {
                $rotated = imagerotate($source, $angle, 0);

                if ($rotated !== false) {
                    $source = $rotated;
                }
            }
        }

        $width = imagesx($source);
        $height = imagesy($source);
        $target = $source;

        if ($width > $maxWidth && $width > 0 && $height > 0) {
            $newHeight = max(1, (int) round(($height * $maxWidth) / $width));
            $resized = imagecreatetruecolor($maxWidth, $newHeight);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
            imagefill($resized, 0, 0, $transparent);
            imagecopyresampled($resized, $source, 0, 0, 0, 0, $maxWidth, $newHeight, $width, $height);
            $target = $resized;
        } else {
            if (! imageistruecolor($target)) {
                imagepalettetotruecolor($target);
            }
            imagealphablending($target, true);
            imagesavealpha($target, true);
        }

        ob_start();
        $encoded = imagewebp($target, null, $quality);
        $webpBytes = ob_get_clean();

        if (! $encoded || $webpBytes === false || $webpBytes === '') {
            return $file->store($directory, $disk);
        }

        $path = trim($directory, '/').'/'.Str::random(40).'.webp';
        Storage::disk($disk)->put($path, $webpBytes);

        return $path;
    }
}
