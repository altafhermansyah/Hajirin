<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Mail\PasswordChangedMail;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetController extends Controller
{
    /**
     * Tampilkan halaman lupa kata sandi.
     */
    public function createForgot(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Kirim tautan pengaturan ulang kata sandi ke email pengguna.
     */
    public function sendResetLink(ForgotPasswordRequest $request): RedirectResponse
    {
        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_THROTTLED) {
            throw ValidationException::withMessages([
                'email' => 'Terlalu banyak permintaan reset kata sandi. Silakan tunggu beberapa saat sebelum mencoba lagi.',
            ]);
        }

        return back()->with(
            'status',
            'Jika alamat email tersebut terdaftar di Hajirin, tautan untuk mengatur ulang kata sandi telah dikirim.'
        );
    }

    /**
     * Tampilkan halaman formulir atur ulang kata sandi baru (dapat diakses guest maupun user login).
     */
    public function createReset(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => (string) $request->query('email', $request->user()?->email ?? ''),
        ]);
    }

    /**
     * Simpan kata sandi baru berdasarkan token reset yang valid.
     */
    public function resetPassword(ResetPasswordRequest $request): RedirectResponse
    {
        $loggedInUser = $request->user();
        if ($loggedInUser && mb_strtolower($loggedInUser->email) !== mb_strtolower((string) $request->input('email'))) {
            throw ValidationException::withMessages([
                'email' => 'Anda sedang masuk sebagai '.$loggedInUser->email.'. Silakan keluar akun terlebih dahulu jika ingin mengatur ulang kata sandi akun lain.',
            ]);
        }

        $currentSessionId = $request->hasSession() ? $request->session()->getId() : null;

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) use ($loggedInUser, $currentSessionId): void {
                $changedAt = now();
                $user->forceFill([
                    'password' => Hash::make($password),
                    'password_changed_at' => $changedAt,
                    'remember_token' => Str::random(60),
                ])->save();

                // Cabut seluruh sesi perangkat lain agar kredensial lama tidak dapat terus digunakan
                DB::table('sessions')
                    ->where('user_id', $user->id)
                    ->when(
                        $loggedInUser && $loggedInUser->id === $user->id && $currentSessionId !== null,
                        fn ($query) => $query->where('id', '!=', $currentSessionId)
                    )
                    ->delete();

                event(new PasswordReset($user));

                Mail::to($user->email)->send((new PasswordChangedMail(
                    userName: $user->name,
                    changedAtFormatted: $changedAt->copy()->timezone(config('app.timezone'))->locale('id')->translatedFormat('d F Y, H:i').' WIB',
                ))->afterCommit());
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => 'Tautan reset kata sandi tidak valid atau telah kedaluwarsa. Silakan ajukan permintaan ulang.',
            ]);
        }

        if ($loggedInUser) {
            $targetUrl = match ($loggedInUser->role) {
                'EO' => route('eo.profile.show'),
                'ADMIN' => route('admin.dashboard'),
                default => route('dashboard').'#profil',
            };

            return redirect()
                ->to($targetUrl)
                ->with('success', 'Kata sandi Anda berhasil diperbarui.')
                ->with('password_reset_completed', true);
        }

        return redirect()
            ->route('home')
            ->with('success', 'Kata sandi Anda berhasil diperbarui. Silakan masuk menggunakan kata sandi baru.');
    }
}
