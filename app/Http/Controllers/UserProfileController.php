<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class UserProfileController extends Controller
{
    /**
     * Tampilkan halaman profil user (diarahkan ke tab profil dashboard).
     */
    public function show(): RedirectResponse
    {
        return redirect()->to(route('dashboard').'#profil');
    }

    /**
     * Perbarui data profil user terautentikasi (termasuk unggah foto profil dari perangkat).
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'regex:/^[0-9]+$/', 'max:25'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'password' => ['nullable', 'string', Password::defaults(), 'confirmed'],
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'name.max' => 'Nama lengkap maksimal 100 karakter.',
            'phone.regex' => 'Nomor telepon harus berupa angka, tidak boleh mengandung huruf atau simbol.',
            'phone.max' => 'Nomor telepon maksimal 25 digit.',
            'avatar.image' => 'File foto profil harus berupa file gambar.',
            'avatar.mimes' => 'Format foto harus berupa JPG, PNG, atau WEBP.',
            'avatar.max' => 'Ukuran file foto profil maksimal 5MB.',
            'password.min' => 'Password minimal terdiri dari 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
        ];

        // Unggah foto profil baru dari perangkat
        if ($request->hasFile('avatar')) {
            if ($user->avatar_path && Str::startsWith($user->avatar_path, '/storage/avatars/')) {
                $oldPath = str_replace('/storage/', '', $user->avatar_path);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('avatar')->store('avatars', 'public');
            $updateData['avatar_path'] = '/storage/'.$path;
        }

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return back()->with('success', 'Profil kamu berhasil diperbarui.');
    }
}
