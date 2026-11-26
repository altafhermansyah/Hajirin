<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\VerifyEmailOtpRequest;
use App\Mail\EmailOtpMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EmailVerificationOtpController extends Controller
{
    private const OTP_EXPIRES_MINUTES = 10;

    private const OTP_RESEND_COOLDOWN_SECONDS = 60;

    private const OTP_MAX_ATTEMPTS = 5;

    /**
     * Buat kode OTP 6 digit baru (disimpan sebagai hash) lalu kirim sinkron ke email user.
     */
    public static function issueAndSend(
        User $user,
        string $purpose = 'VERIFY_EMAIL',
        string $purposeLabel = 'Verifikasi Alamat Email',
    ): string {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::transaction(function () use ($user, $purpose, $code): void {
            DB::table('email_verification_codes')
                ->where('user_id', $user->id)
                ->where('purpose', $purpose)
                ->delete();

            DB::table('email_verification_codes')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $user->id,
                'email' => $user->email,
                'purpose' => $purpose,
                'code_hash' => Hash::make($code),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(self::OTP_EXPIRES_MINUTES),
                'created_at' => now(),
            ]);
        });

        Mail::to($user->email)->send(new EmailOtpMail(
            userName: $user->name,
            code: $code,
            expiresInMinutes: self::OTP_EXPIRES_MINUTES,
            purposeLabel: $purposeLabel,
        ));

        return $code;
    }

    /**
     * Kirim atau kirim ulang kode OTP verifikasi ke alamat email pengguna saat ini.
     */
    public function send(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return back()->with('success', 'Alamat email Anda sudah terverifikasi.');
        }

        $latest = DB::table('email_verification_codes')
            ->where('user_id', $user->id)
            ->where('purpose', 'VERIFY_EMAIL')
            ->orderByDesc('created_at')
            ->first();

        if ($latest) {
            $cooldownEndsAt = Carbon::parse($latest->created_at)->addSeconds(self::OTP_RESEND_COOLDOWN_SECONDS);

            if ($cooldownEndsAt->isFuture()) {
                $waitSeconds = max(1, (int) ceil(now()->diffInSeconds($cooldownEndsAt, false)));

                throw ValidationException::withMessages([
                    'code' => "Mohon tunggu {$waitSeconds} detik sebelum meminta kode verifikasi baru.",
                ]);
            }
        }

        self::issueAndSend($user);

        return back()->with(
            'success',
            "Kode verifikasi 6 digit telah dikirim ke {$user->email}. Kode berlaku 10 menit."
        );
    }

    /**
     * Verifikasi kode OTP 6 digit yang dimasukkan oleh pengguna.
     */
    public function verify(VerifyEmailOtpRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return back()->with('success', 'Alamat email Anda sudah terverifikasi.');
        }

        $code = (string) $request->validated('code');

        $record = DB::table('email_verification_codes')
            ->where('user_id', $user->id)
            ->where('purpose', 'VERIFY_EMAIL')
            ->orderByDesc('created_at')
            ->first();

        if (! $record) {
            throw ValidationException::withMessages([
                'code' => 'Belum ada kode verifikasi aktif. Silakan klik Kirim Kode terlebih dahulu.',
            ]);
        }

        if (Carbon::parse($record->expires_at)->isPast()) {
            DB::table('email_verification_codes')->where('id', $record->id)->delete();

            throw ValidationException::withMessages([
                'code' => 'Kode verifikasi sudah kedaluwarsa. Silakan kirim ulang kode baru.',
            ]);
        }

        if (! Hash::check($code, (string) $record->code_hash)) {
            $nextAttempts = ((int) $record->attempts) + 1;

            if ($nextAttempts >= self::OTP_MAX_ATTEMPTS) {
                DB::table('email_verification_codes')->where('id', $record->id)->delete();

                throw ValidationException::withMessages([
                    'code' => 'Terlalu banyak percobaan salah (maksimal 5x). Kode telah dihanguskan, silakan kirim ulang kode baru.',
                ]);
            }

            DB::table('email_verification_codes')
                ->where('id', $record->id)
                ->update(['attempts' => $nextAttempts]);

            $remaining = self::OTP_MAX_ATTEMPTS - $nextAttempts;

            throw ValidationException::withMessages([
                'code' => "Kode verifikasi tidak cocok. Sisa kesempatan: {$remaining}x.",
            ]);
        }

        DB::transaction(function () use ($user): void {
            $user->forceFill([
                'email_verified_at' => now(),
            ])->save();

            DB::table('email_verification_codes')
                ->where('user_id', $user->id)
                ->where('purpose', 'VERIFY_EMAIL')
                ->delete();
        });

        return back()->with(
            'success',
            'Alamat email berhasil diverifikasi! Akun Anda kini siap untuk transaksi tiket dan pengajuan EO.'
        );
    }
}
