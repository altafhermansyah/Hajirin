<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
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
     * Tampilkan halaman formulir atur ulang kata sandi baru.
     */
    public function createReset(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => (string) $request->query('email', ''),
        ]);
    }

    /**
     * Simpan kata sandi baru berdasarkan token reset yang valid.
     */
    public function resetPassword(ResetPasswordRequest $request): RedirectResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => 'Tautan reset kata sandi tidak valid atau telah kedaluwarsa. Silakan ajukan permintaan ulang.',
            ]);
        }

        return redirect()
            ->route('home')
            ->with('success', 'Kata sandi Anda berhasil diperbarui. Silakan masuk menggunakan kata sandi baru.');
    }
}
