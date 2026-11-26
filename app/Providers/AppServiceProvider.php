<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('auth-login', function (Request $request): Limit {
            $key = Str::transliterate(Str::lower($request->string('email')).'|'.$request->ip());

            return Limit::perMinute(5)->by($key);
        });

        RateLimiter::for('auth-register', function (Request $request): Limit {
            return Limit::perMinute(5)->by((string) $request->ip());
        });

        RateLimiter::for('password-reset', function (Request $request): Limit {
            $key = Str::transliterate(Str::lower($request->string('email')).'|'.$request->ip());

            return Limit::perMinute(5)->by($key);
        });

        RateLimiter::for('checkout', function (Request $request): Limit {
            return Limit::perMinute(15)->by((string) ($request->user()?->id ?: $request->ip()));
        });

        RateLimiter::for('uploads', function (Request $request): Limit {
            return Limit::perMinute(10)->by((string) ($request->user()?->id ?: $request->ip()));
        });

        RateLimiter::for('user-actions', function (Request $request): Limit {
            return Limit::perMinute(30)->by((string) ($request->user()?->id ?: $request->ip()));
        });

        RateLimiter::for('otp-send', function (Request $request): Limit {
            return Limit::perMinute(3)->by((string) ($request->user()?->id ?: $request->ip()));
        });

        RateLimiter::for('otp-verify', function (Request $request): Limit {
            return Limit::perMinute(10)->by((string) ($request->user()?->id ?: $request->ip()));
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $token): MailMessage {
            $resetUrl = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            $expireMinutes = (int) config(
                'auth.passwords.'.config('auth.defaults.passwords', 'users').'.expire',
                60
            );

            return (new MailMessage)
                ->subject('Atur Ulang Kata Sandi Akun Hajirin Anda')
                ->view('emails.auth.reset-password', [
                    'userName' => $notifiable->name ?? 'Pengguna',
                    'resetUrl' => $resetUrl,
                    'expireMinutes' => $expireMinutes,
                ]);
        });
    }
}
