<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsEo
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect('/');
        }

        if ($user->role !== 'EO') {
            abort(403, 'Akses ditolak. Halaman ini hanya dapat diakses oleh Event Organizer resmi di platform Hajirin.');
        }

        return $next($request);
    }
}
