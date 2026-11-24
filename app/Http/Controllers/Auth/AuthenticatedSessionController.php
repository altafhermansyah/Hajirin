<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // shortcut: explicit email vs password login errors per project UX choice; switch to generic auth error before public production to prevent email enumeration
        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower($validated['email'])])
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['Alamat email ini belum terdaftar di Hajirin. Periksa kembali email Anda atau daftar akun baru.'],
            ]);
        }

        if (! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Kata sandi yang Anda masukkan salah. Silakan coba lagi atau gunakan Lupa kata sandi.'],
            ]);
        }

        if ($user->isSuspended()) {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda sedang ditangguhkan (suspended) oleh Administrator platform.'],
            ]);
        }

        Auth::login($user, (bool) ($validated['remember'] ?? false));
        $request->session()->regenerate();

        if ($user->isAdmin()) {
            return redirect()->intended('/admin/dashboard');
        }

        if ($user->isEo()) {
            return redirect()->intended('/eo/dashboard');
        }

        return redirect()->intended(url()->previous() ?: '/');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
