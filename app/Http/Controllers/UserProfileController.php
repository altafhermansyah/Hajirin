<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteAccountRequest;
use App\Http\Requests\SendProfilePasswordResetRequest;
use App\Models\Order;
use App\Support\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
     * Perbarui data profil user terautentikasi (termasuk nomor HP wajib dan unggah foto profil).
     * Pengubahan kata sandi kini disatukan melalui tautan reset email.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $rawPhone = $request->input('phone');
        if (is_string($rawPhone)) {
            $request->merge([
                'phone' => preg_replace('/[\s\-\.\(\)\+]+/', '', trim($rawPhone)),
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'regex:/^[0-9]{9,15}$/'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'name.max' => 'Nama lengkap maksimal 100 karakter.',
            'phone.required' => 'Nomor WhatsApp / HP wajib diisi untuk kelengkapan data diri.',
            'phone.regex' => 'Nomor WhatsApp / HP harus berupa 9 sampai 15 digit angka, tidak boleh mengandung huruf atau simbol.',
            'avatar.image' => 'File foto profil harus berupa file gambar.',
            'avatar.mimes' => 'Format foto harus berupa JPG, PNG, atau WEBP.',
            'avatar.max' => 'Ukuran file foto profil maksimal 5MB.',
        ]);

        $updateData = [
            'name' => trim($validated['name']),
            'phone' => $validated['phone'],
        ];

        // Unggah foto profil baru dari perangkat
        if ($request->hasFile('avatar')) {
            if ($user->avatar_path && Str::startsWith($user->avatar_path, '/storage/avatars/')) {
                $oldPath = str_replace('/storage/', '', $user->avatar_path);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $this->storeOptimizedImage($request->file('avatar'), 'avatars', 'public', 512, 82);
            $updateData['avatar_path'] = '/storage/'.$path;
        }

        $user->update($updateData);

        return back()->with('success', 'Profil kamu berhasil diperbarui.');
    }

    /**
     * Kirim tautan pengaturan ulang kata sandi ke email akun yang sedang login.
     */
    public function sendPasswordResetLink(SendProfilePasswordResetRequest $request): RedirectResponse
    {
        $user = $request->user();
        $inputEmail = $request->validated('email');

        if (mb_strtolower($inputEmail) !== mb_strtolower($user->email)) {
            throw ValidationException::withMessages([
                'email' => 'Alamat email harus sesuai dengan email akun yang sedang masuk ('.$user->email.').',
            ]);
        }

        $status = Password::sendResetLink(['email' => $user->email]);

        if ($status === Password::RESET_THROTTLED) {
            throw ValidationException::withMessages([
                'email' => 'Terlalu banyak permintaan kirim tautan. Silakan tunggu beberapa saat sebelum mencoba lagi.',
            ]);
        }

        return back()
            ->with('password_reset_status', 'Tautan ganti kata sandi telah dikirim ke '.$user->email.'. Silakan buka kotak masuk email Anda untuk menyelesaikan perubahan kata sandi.')
            ->with('success', 'Tautan ganti kata sandi telah dikirim ke email Anda.');
    }

    /**
     * Perbarui preferensi komunikasi email pengumuman dari penyelenggara event.
     */
    public function updatePreferences(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'broadcast_emails_enabled' => ['required', 'boolean'],
        ]);

        $enabled = (bool) $validated['broadcast_emails_enabled'];

        $request->user()->forceFill([
            'broadcast_emails_enabled' => $enabled,
        ])->save();

        return back()->with(
            'success',
            $enabled
                ? 'Email pengumuman dari penyelenggara event telah diaktifkan.'
                : 'Email pengumuman dari penyelenggara event telah dinonaktifkan.'
        );
    }

    /**
     * Ekspor seluruh data pribadi pengguna dalam format JSON yang dapat diunduh.
     */
    public function exportData(Request $request): StreamedResponse
    {
        $user = $request->user();
        $userId = $user->id;

        AuditLog::record(
            action: 'account.exported',
            actorId: $userId,
            subjectType: 'user',
            subjectId: $userId,
        );

        $orders = DB::table('orders')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('orders.user_id', $userId)
            ->orderByDesc('orders.created_at')
            ->get([
                'orders.id',
                'orders.order_reference',
                'orders.status',
                'orders.total_amount',
                'orders.attendee_name',
                'orders.attendee_email',
                'orders.attendee_phone',
                'orders.paid_at',
                'orders.created_at',
                'events.title as event_title',
                'events.slug as event_slug',
            ]);

        $orderIds = $orders->pluck('id')->all();

        $payments = $orderIds !== []
            ? DB::table('payments')
                ->whereIn('order_id', $orderIds)
                ->orderByDesc('created_at')
                ->get(['id', 'order_id', 'payment_reference', 'method', 'status', 'amount', 'paid_at', 'created_at'])
            : collect();

        $tickets = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->whereRaw('COALESCE(tickets.holder_user_id, orders.user_id) = ?', [$userId])
            ->orderByDesc('tickets.created_at')
            ->get([
                'tickets.id',
                'tickets.ticket_code',
                'tickets.attendee_name',
                'tickets.attendee_email',
                'tickets.attendee_phone',
                'tickets.status',
                'tickets.checked_in_at',
                'tickets.created_at',
                'orders.order_reference',
                'events.title as event_title',
            ]);

        $ticketTransfers = DB::table('ticket_transfers')
            ->where('from_user_id', $userId)
            ->orWhere('to_user_id', $userId)
            ->orderByDesc('created_at')
            ->get([
                'id',
                'ticket_id',
                'from_user_id',
                'to_user_id',
                'recipient_name',
                'recipient_email',
                'status',
                'expires_at',
                'accepted_at',
                'created_at',
            ]);

        $refunds = DB::table('refunds')
            ->where('requested_by', $userId)
            ->orderByDesc('requested_at')
            ->get(['id', 'order_id', 'amount', 'reason', 'status', 'resolution_note', 'requested_at', 'processed_at']);

        $eoApplications = DB::table('eo_applications')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get(['id', 'organization_name', 'contact_phone', 'portfolio_url', 'reason', 'status', 'rejection_reason', 'reviewed_at', 'created_at']);

        $bookmarks = DB::table('bookmarks')
            ->join('events', 'events.id', '=', 'bookmarks.event_id')
            ->where('bookmarks.user_id', $userId)
            ->orderByDesc('bookmarks.created_at')
            ->get(['events.id as event_id', 'events.title as event_title', 'events.slug as event_slug', 'bookmarks.created_at as bookmarked_at']);

        $notifications = DB::table('notifications')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit(200)
            ->get(['id', 'type', 'title', 'message', 'read_at', 'created_at']);

        $exportPayload = [
            'exported_at' => now()->timezone(config('app.timezone'))->toIso8601String(),
            'timezone' => config('app.timezone'),
            'account' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'status' => $user->status ?? 'ACTIVE',
                'avatar_path' => $user->avatar_path,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'password_changed_at' => $user->password_changed_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'orders' => $orders->values()->all(),
            'payments' => $payments->values()->all(),
            'tickets' => $tickets->values()->all(),
            'ticket_transfers' => $ticketTransfers->values()->all(),
            'refunds' => $refunds->values()->all(),
            'eo_applications' => $eoApplications->values()->all(),
            'bookmarks' => $bookmarks->values()->all(),
            'notifications' => $notifications->values()->all(),
        ];

        $filename = 'hajirin-data-pribadi-'.now()->timezone(config('app.timezone'))->format('Y-m-d').'.json';

        return response()->streamDownload(function () use ($exportPayload): void {
            echo json_encode($exportPayload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }, $filename, [
            'Content-Type' => 'application/json; charset=UTF-8',
        ]);
    }

    /**
     * Hapus akun pengguna secara mandiri (Hard Delete jika bersih, PII Scrubbing jika memiliki histori finansial).
     */
    public function destroy(DeleteAccountRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (mb_strtolower($validated['email']) !== mb_strtolower($user->email)) {
            throw ValidationException::withMessages([
                'email' => 'Alamat email konfirmasi tidak cocok dengan akun Anda.',
            ]);
        }

        if ($user->isAdmin()) {
            throw ValidationException::withMessages([
                'account' => 'Akun Administrator tidak dapat dihapus melalui pengaturan mandiri.',
            ]);
        }

        if ($user->isEo()) {
            $hasActiveEvents = DB::table('events')
                ->where('eo_id', $user->id)
                ->whereIn('status', ['PUBLISHED', 'ONGOING', 'PENDING_REVIEW'])
                ->exists();

            if ($hasActiveEvents) {
                throw ValidationException::withMessages([
                    'account' => 'Akun EO tidak dapat dihapus selama masih memiliki event berstatus PUBLISHED, ONGOING, atau PENDING_REVIEW.',
                ]);
            }
        }

        $hasPendingRefund = DB::table('refunds')
            ->where('requested_by', $user->id)
            ->where('status', 'PENDING')
            ->exists();

        if ($hasPendingRefund) {
            throw ValidationException::withMessages([
                'account' => 'Akun tidak dapat dihapus saat masih ada pengajuan pengembalian dana (refund) berstatus PENDING.',
            ]);
        }

        $originalEmail = $user->email;
        $avatarPath = $user->avatar_path;
        $eoDocumentPaths = DB::table('eo_applications')
            ->where('user_id', $user->id)
            ->whereNotNull('document_path')
            ->pluck('document_path')
            ->all();

        $deletedUserId = $user->id;
        $wasHardDeleted = false;

        DB::transaction(function () use ($user, $originalEmail, &$wasHardDeleted): void {
            // 1. Batalkan pesanan PENDING dan kembalikan kuota tiket
            $pendingOrders = Order::query()
                ->with(['items.ticketType'])
                ->where('user_id', $user->id)
                ->where('status', 'PENDING')
                ->lockForUpdate()
                ->get();

            foreach ($pendingOrders as $pendingOrder) {
                $pendingOrder->forceFill(['status' => 'CANCELLED'])->save();

                DB::table('payments')
                    ->where('order_id', $pendingOrder->id)
                    ->where('status', 'PENDING')
                    ->update([
                        'status' => 'FAILED',
                        'updated_at' => now(),
                    ]);

                foreach ($pendingOrder->items as $item) {
                    if (! $item->ticketType) {
                        continue;
                    }

                    $ticketType = $item->ticketType()->lockForUpdate()->first();
                    if (! $ticketType) {
                        continue;
                    }

                    $restoredQuota = min(
                        (int) $ticketType->initial_quota,
                        (int) $ticketType->quota + (int) $item->quantity
                    );

                    $ticketType->forceFill(['quota' => $restoredQuota])->save();
                }
            }

            // 2. Gugurkan transfer tiket PENDING yang dibuat user
            DB::table('ticket_transfers')
                ->where('from_user_id', $user->id)
                ->where('status', 'PENDING')
                ->update([
                    'status' => 'CANCELLED',
                    'updated_at' => now(),
                ]);

            // 3. Bersihkan data non-finansial milik user
            DB::table('bookmarks')->where('user_id', $user->id)->delete();
            DB::table('notifications')->where('user_id', $user->id)->delete();
            DB::table('email_verification_codes')->where('user_id', $user->id)->delete();
            DB::table('password_reset_tokens')->where('email', $originalEmail)->delete();
            DB::table('event_staff')->where('user_id', $user->id)->delete();

            // 4. Cek keterikatan histori finansial / audit / kepemilikan tiket aktif (ON DELETE RESTRICT & CHECK constraints)
            $hasAuditOrFinancialHistory = DB::table('orders')->where('user_id', $user->id)->exists()
                || DB::table('events')->where('eo_id', $user->id)->exists()
                || DB::table('refunds')->where('requested_by', $user->id)->exists()
                || DB::table('tickets')->where('checked_in_by', $user->id)->exists()
                || DB::table('tickets')->where('holder_user_id', $user->id)->exists();

            $anonymizedEmail = 'deleted-'.Str::uuid()->toString().'@deleted.hajirin.local';

            // Anonimkan data penerima pada histori transfer tiket (termasuk yang hanya cocok via email)
            DB::table('ticket_transfers')
                ->where(function ($query) use ($user, $originalEmail): void {
                    $query->where('to_user_id', $user->id)
                        ->orWhereRaw('LOWER(recipient_email) = ?', [mb_strtolower($originalEmail)]);
                })
                ->update([
                    'recipient_name' => 'Pengguna Terhapus',
                    'recipient_email' => $anonymizedEmail,
                    'updated_at' => now(),
                ]);

            if (! $hasAuditOrFinancialHistory) {
                $user->delete();
                $wasHardDeleted = true;
            } else {
                // PII Scrubbing / Anonimisasi agar pembukuan EO, audit check-in & Admin tetap utuh
                $user->forceFill([
                    'name' => 'Pengguna Terhapus',
                    'email' => $anonymizedEmail,
                    'phone' => null,
                    'avatar_path' => null,
                    'password' => Hash::make(Str::random(40)),
                    'remember_token' => null,
                    'status' => 'SUSPENDED',
                ])->save();

                // Anonimkan dokumen/kontak pengajuan EO milik user
                DB::table('eo_applications')
                    ->where('user_id', $user->id)
                    ->update([
                        'contact_phone' => '-',
                        'portfolio_url' => null,
                        'document_path' => '',
                        'reason' => 'Data pengajuan telah dianonimkan sesuai permintaan penghapusan akun.',
                        'updated_at' => now(),
                    ]);

                DB::table('orders')
                    ->where('user_id', $user->id)
                    ->update([
                        'attendee_name' => 'Pengguna Terhapus',
                        'attendee_email' => $anonymizedEmail,
                        'attendee_phone' => null,
                        'updated_at' => now(),
                    ]);

                // Sapu seluruh tiket yang dipegang user ATAU tiket lama (holder_user_id NULL) pada order milik user
                DB::table('tickets')
                    ->where(function ($query) use ($user): void {
                        $query->where('holder_user_id', $user->id)
                            ->orWhere(function ($legacy) use ($user): void {
                                $legacy->whereNull('holder_user_id')
                                    ->whereIn('order_id', function ($sub) use ($user): void {
                                        $sub->select('id')
                                            ->from('orders')
                                            ->where('user_id', $user->id);
                                    });
                            });
                    })
                    ->update([
                        'attendee_name' => 'Pengguna Terhapus',
                        'attendee_email' => $anonymizedEmail,
                        'attendee_phone' => null,
                        'updated_at' => now(),
                    ]);
            }
        });

        // Hapus berkas avatar & dokumen KTP/legalitas EO setelah transaksi commit berhasil
        if ($avatarPath && Str::startsWith($avatarPath, '/storage/avatars/')) {
            $oldPath = str_replace('/storage/', '', $avatarPath);
            Storage::disk('public')->delete($oldPath);
        }

        foreach ($eoDocumentPaths as $docPath) {
            if (is_string($docPath) && $docPath !== '') {
                Storage::disk('local')->delete($docPath);
            }
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        AuditLog::record(
            action: 'account.deleted',
            actorId: $wasHardDeleted ? null : $deletedUserId,
            subjectType: 'user',
            subjectId: $deletedUserId,
            metadata: [
                'mode' => $wasHardDeleted ? 'hard_delete' : 'anonymized',
                'purged_eo_documents' => count($eoDocumentPaths),
            ],
        );

        return redirect()
            ->route('home')
            ->with('success', 'Akun Anda telah berhasil dihapus. Terima kasih telah menggunakan Hajirin.')
            ->header('Clear-Site-Data', '"cookies", "storage"');
    }
}
