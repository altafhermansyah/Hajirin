<?php

namespace App\Http\Controllers;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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

        if (! str_starts_with($mimeType, 'image/')) {
            return $file->store($directory, $disk);
        }

        $realPath = $file->getRealPath();
        $dimensions = $realPath ? @getimagesize($realPath) : false;

        if ($dimensions === false || $dimensions[0] <= 0 || $dimensions[1] <= 0) {
            throw ValidationException::withMessages([
                'image' => 'Berkas gambar tidak valid atau rusak. Unggah ulang berkas JPG, PNG, atau WebP yang valid.',
            ]);
        }

        $rawWidth = (int) $dimensions[0];
        $rawHeight = (int) $dimensions[1];

        // Cegah pixel flood sebelum GD mengalokasikan bitmap di memori
        if ($rawWidth > 10000 || $rawHeight > 10000 || ($rawWidth * $rawHeight) > 40_000_000) {
            throw ValidationException::withMessages([
                'image' => 'Dimensi gambar terlalu besar. Gunakan gambar maksimal 10.000×10.000 piksel.',
            ]);
        }

        if (! function_exists('imagecreatefromstring') || ! function_exists('imagewebp')) {
            throw ValidationException::withMessages([
                'image' => 'Pemrosesan gambar tidak tersedia di server saat ini.',
            ]);
        }

        $source = @imagecreatefromstring($file->get());

        if ($source === false) {
            throw ValidationException::withMessages([
                'image' => 'Berkas gambar gagal dibaca atau rusak. Gunakan berkas JPG, PNG, atau WebP yang valid.',
            ]);
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
            throw ValidationException::withMessages([
                'image' => 'Berkas gambar gagal diproses. Silakan unggah ulang gambar yang valid.',
            ]);
        }

        $path = trim($directory, '/').'/'.Str::random(40).'.webp';
        Storage::disk($disk)->put($path, $webpBytes);

        return $path;
    }
}
