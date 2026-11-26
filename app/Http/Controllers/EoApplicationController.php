<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEoApplicationRequest;
use App\Models\EoApplication;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EoApplicationController extends Controller
{
    /**
     * Tampilkan halaman khusus pendaftaran pengajuan akun Event Organizer (EO).
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user?->role === 'ADMIN') {
            return redirect()->route('admin.dashboard');
        }

        if ($user?->role === 'EO') {
            return redirect()->route('eo.dashboard');
        }

        $latestEoApplication = DB::table('eo_applications')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->first();

        $eoApplicationData = $latestEoApplication ? [
            'id' => $latestEoApplication->id,
            'organizationName' => $latestEoApplication->organization_name,
            'contactPhone' => $latestEoApplication->contact_phone,
            'portfolioUrl' => $latestEoApplication->portfolio_url,
            'reason' => $latestEoApplication->reason,
            'status' => $latestEoApplication->status,
            'rejectionReason' => $latestEoApplication->rejection_reason,
            'documentUrl' => $latestEoApplication->document_path
                ? Storage::disk('local')->temporaryUrl($latestEoApplication->document_path, now()->addMinutes(15))
                : null,
            'createdAt' => Carbon::parse($latestEoApplication->created_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB',
            'reviewedAt' => $latestEoApplication->reviewed_at
                ? Carbon::parse($latestEoApplication->reviewed_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                : null,
        ] : null;

        return Inertia::render('Eo/Register', [
            'eoApplication' => $eoApplicationData,
        ]);
    }

    /**
     * Simpan pengajuan pendaftaran akun menjadi Event Organizer (EO).
     */
    public function store(StoreEoApplicationRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email_verification' => 'Silakan verifikasi alamat email akun Anda dengan kode OTP 6 digit terlebih dahulu sebelum mengajukan akun Event Organizer.',
            ]);
        }

        $hasActiveOrApprovedApplication = EoApplication::where('user_id', $user->id)
            ->whereIn('status', ['PENDING', 'APPROVED'])
            ->exists();

        if ($hasActiveOrApprovedApplication) {
            throw ValidationException::withMessages([
                'organization_name' => 'Anda sudah memiliki pengajuan Event Organizer yang sedang diproses atau telah disetujui.',
            ]);
        }

        $documentPath = $this->storeOptimizedImage($request->file('document'), 'eo-documents', 'local', 1600, 82);

        DB::transaction(function () use ($user, $validated, $documentPath): void {
            EoApplication::create([
                'user_id' => $user->id,
                'organization_name' => $validated['organization_name'],
                'contact_phone' => $validated['contact_phone'],
                'portfolio_url' => $validated['portfolio_url'] ?? null,
                'document_path' => $documentPath,
                'reason' => $validated['reason'],
            ]);

            if (empty($user->phone)) {
                $user->update([
                    'phone' => $validated['contact_phone'],
                ]);
            }
        });

        return back()->with('success', 'Pengajuan akun Event Organizer berhasil dikirim dan sedang ditinjau oleh Admin.');
    }
}
