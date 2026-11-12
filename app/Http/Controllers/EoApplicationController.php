<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEoApplicationRequest;
use App\Models\EoApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EoApplicationController extends Controller
{
    /**
     * Simpan pengajuan pendaftaran akun menjadi Event Organizer (EO).
     */
    public function store(StoreEoApplicationRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $hasActiveOrApprovedApplication = EoApplication::where('user_id', $user->id)
            ->whereIn('status', ['PENDING', 'APPROVED'])
            ->exists();

        if ($hasActiveOrApprovedApplication) {
            throw ValidationException::withMessages([
                'organization_name' => 'Anda sudah memiliki pengajuan Event Organizer yang sedang diproses atau telah disetujui.',
            ]);
        }

        $documentPath = $request->file('document')->store('eo-documents', 'local');

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
