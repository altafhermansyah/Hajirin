<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): JsonResponse|RedirectResponse
    {
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (! Auth::attempt($credentials, false)) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'message' => 'Email atau kata sandi yang Anda masukkan salah.',
                    'errors' => [
                        'email' => ['Email atau kata sandi yang Anda masukkan salah.'],
                    ],
                ], 422);
            }

            throw ValidationException::withMessages([
                'email' => ['Email atau kata sandi yang Anda masukkan salah.'],
            ]);
        }

        $request->session()->regenerate();

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Berhasil masuk!',
                'user' => Auth::user(),
            ]);
        }

        return redirect()->intended('/');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): JsonResponse|RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Berhasil keluar.',
            ]);
        }

        return redirect('/');
    }
}
