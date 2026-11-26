<?php

namespace App\Http\Controllers\Eo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Eo\UpdateEoProfileRequest;
use App\Models\EoApplication;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EoProfileController extends Controller
{
    /**
     * Tampilkan halaman profil resmi organisasi Event Organizer.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        $approvedApplication = EoApplication::where('user_id', $user->id)
            ->where('status', 'APPROVED')
            ->latest('reviewed_at')
            ->first();

        $organizationName = $approvedApplication->organization_name ?? $user->name;

        return Inertia::render('Eo/Profile', [
            'organizerName' => $organizationName,
            'profile' => [
                'organizationName' => $organizationName,
                'contactPhone' => $approvedApplication->contact_phone ?? $user->phone ?? '',
                'portfolioUrl' => $approvedApplication->portfolio_url ?? '',
                'avatarPath' => $user->avatar_path,
                'reason' => $approvedApplication->reason ?? null,
                'hasApprovedApplication' => $approvedApplication !== null,
                'verifiedAt' => $approvedApplication?->reviewed_at
                    ? Carbon::parse($approvedApplication->reviewed_at)->locale('id')->translatedFormat('d M Y')
                    : null,
                'accountName' => $user->name,
                'accountEmail' => $user->email,
            ],
        ]);
    }

    /**
     * Perbarui identitas resmi organisasi, logo/foto profil, dan kontak PIC Event Organizer.
     */
    public function update(UpdateEoProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $oldAvatarPath = $user->avatar_path;
        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $storedPath = $this->storeOptimizedImage($request->file('avatar'), 'avatars', 'public', 512, 82);
            $avatarPath = '/storage/'.$storedPath;
        }

        DB::transaction(function () use ($user, $validated, $avatarPath): void {
            $approvedApplication = EoApplication::where('user_id', $user->id)
                ->where('status', 'APPROVED')
                ->lockForUpdate()
                ->latest('reviewed_at')
                ->first();

            $organizationName = trim($validated['organization_name']);

            if ($approvedApplication) {
                $approvedApplication->update([
                    'organization_name' => $organizationName,
                    'contact_phone' => trim($validated['contact_phone']),
                    'portfolio_url' => ! empty($validated['portfolio_url'])
                        ? trim($validated['portfolio_url'])
                        : null,
                ]);
            }

            $userUpdate = [
                'phone' => trim($validated['contact_phone']),
            ];

            if (! $approvedApplication) {
                $userUpdate['name'] = $organizationName;
            }

            if ($avatarPath !== null) {
                $userUpdate['avatar_path'] = $avatarPath;
            }

            $user->update($userUpdate);
        });

        // Hapus berkas avatar lama setelah transaksi berhasil commit
        if ($avatarPath !== null && $oldAvatarPath && Str::startsWith($oldAvatarPath, '/storage/avatars/')) {
            $oldPath = str_replace('/storage/', '', $oldAvatarPath);
            Storage::disk('public')->delete($oldPath);
        }

        return redirect()
            ->route('eo.profile.show')
            ->with('success', 'Profil organisasi berhasil diperbarui.');
    }
}
