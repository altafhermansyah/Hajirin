<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    /**
     * Tampilkan halaman kelola pengguna (User Management).
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $roleFilter = strtoupper((string) $request->input('role', 'ALL'));
        $statusFilter = strtoupper((string) $request->input('status', 'ALL'));
        $sort = (string) $request->input('sort', 'latest');

        // Statistik Pengguna
        $statsRaw = DB::table('users')
            ->selectRaw('COUNT(*) as total_users')
            ->selectRaw("COUNT(CASE WHEN role = 'USER' THEN 1 END) as total_peserta")
            ->selectRaw("COUNT(CASE WHEN role = 'EO' THEN 1 END) as total_eo")
            ->selectRaw("COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as total_admin")
            ->selectRaw("COUNT(CASE WHEN status = 'SUSPENDED' THEN 1 END) as total_suspended")
            ->first();

        $pendingEoCount = DB::table('eo_applications')
            ->where('status', 'PENDING')
            ->count();

        // Subquery aktivitas
        $eventsCountSubquery = DB::table('events')
            ->whereColumn('events.eo_id', 'users.id')
            ->selectRaw('COUNT(events.id)');

        $ticketsCountSubquery = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->whereColumn('orders.user_id', 'users.id')
            ->where('orders.status', 'PAID')
            ->selectRaw('COUNT(tickets.id)');

        $query = DB::table('users')
            ->select('users.id', 'users.name', 'users.email', 'users.phone', 'users.role', 'users.status', 'users.created_at')
            ->addSelect([
                'events_count' => $eventsCountSubquery,
                'tickets_count' => $ticketsCountSubquery,
            ]);

        // Filter Pencarian
        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $lower = '%'.mb_strtolower($search).'%';
                $q->whereRaw('LOWER(users.name) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(users.email) LIKE ?', [$lower])
                    ->orWhere('users.phone', 'LIKE', "%{$search}%")
                    ->orWhereRaw('CAST(users.id AS TEXT) LIKE ?', ["%{$search}%"]);
            });
        }

        // Filter Role
        if (in_array($roleFilter, ['ADMIN', 'EO', 'USER'], true)) {
            $query->where('users.role', $roleFilter);
        }

        // Filter Status
        if (in_array($statusFilter, ['ACTIVE', 'SUSPENDED'], true)) {
            $query->where('users.status', $statusFilter);
        }

        // Urutan
        match ($sort) {
            'oldest' => $query->orderBy('users.created_at', 'asc'),
            'name_asc' => $query->orderBy('users.name', 'asc'),
            'name_desc' => $query->orderBy('users.name', 'desc'),
            default => $query->orderByDesc('users.created_at'),
        };

        $paginated = $query->paginate(10)->withQueryString();

        $users = $paginated->through(function ($u) {
            $status = $u->status ?? 'ACTIVE';

            $activity = match ($u->role) {
                'ADMIN' => 'Platform Owner / Full Access',
                'EO' => ((int) $u->events_count).' Event Dibuat',
                default => ((int) $u->tickets_count).' Tiket Terbeli',
            };

            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone ?: '-',
                'role' => $u->role,
                'status' => $status,
                'activity' => $activity,
                'created_at_formatted' => Carbon::parse($u->created_at)->locale('id')->translatedFormat('d M Y'),
                'raw_created_at' => $u->created_at,
            ];
        });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'stats' => [
                'totalUsers' => (int) ($statsRaw->total_users ?? 0),
                'totalPeserta' => (int) ($statsRaw->total_peserta ?? 0),
                'totalEo' => (int) ($statsRaw->total_eo ?? 0),
                'totalAdmin' => (int) ($statsRaw->total_admin ?? 0),
                'totalSuspended' => (int) ($statsRaw->total_suspended ?? 0),
                'pendingEoCount' => $pendingEoCount,
            ],
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
                'status' => $statusFilter,
                'sort' => $sort,
            ],
        ]);
    }

    /**
     * Simpan pengguna baru dari form tambah user Super Admin.
     */
    public function store(StoreAdminUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'status' => $validated['status'] ?? 'ACTIVE',
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', "Pengguna {$validated['name']} berhasil ditambahkan ke sistem.");
    }

    /**
     * Perbarui data & role pengguna.
     */
    public function update(UpdateAdminUserRequest $request, string $id): RedirectResponse
    {
        $user = User::findOrFail($id);
        $validated = $request->validated();

        // Cegah admin mendemote akunnya sendiri jika dia admin satu-satunya
        if ($user->id === $request->user()->id && $validated['role'] !== 'ADMIN') {
            $adminCount = User::where('role', 'ADMIN')->count();
            if ($adminCount <= 1) {
                throw ValidationException::withMessages([
                    'role' => 'Anda tidak dapat mengubah role akun sendiri karena merupakan satu-satunya Admin di sistem.',
                ]);
            }
        }

        $payload = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
        ];

        if (! empty($validated['status'])) {
            $payload['status'] = $validated['status'];
        }

        if (! empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        $user->forceFill($payload)->save();

        return back()->with('success', "Data pengguna {$user->name} berhasil diperbarui.");
    }

    /**
     * Beralih status pengguna antara ACTIVE dan SUSPENDED.
     */
    public function toggleStatus(Request $request, string $id): RedirectResponse
    {
        $targetUser = User::findOrFail($id);

        if ($targetUser->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => 'Anda tidak dapat menangguhkan (suspend) akun Anda sendiri.',
            ]);
        }

        $newStatus = $targetUser->status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

        $targetUser->forceFill([
            'status' => $newStatus,
        ])->save();

        $label = $newStatus === 'ACTIVE' ? 'diaktifkan kembali' : 'ditangguhkan (suspended)';

        return back()->with('success', "Akun {$targetUser->name} berhasil {$label}.");
    }

    /**
     * Hapus pengguna dari sistem.
     */
    public function destroy(Request $request, string $id): RedirectResponse
    {
        $targetUser = User::findOrFail($id);

        if ($targetUser->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ]);
        }

        try {
            $targetUser->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'user' => 'Pengguna tidak dapat dihapus permanen karena memiliki riwayat transaksi atau event terkait. Silakan gunakan opsi Tangguhkan (Suspend) akun.',
            ]);
        }

        return back()->with('success', "Pengguna {$targetUser->name} berhasil dihapus.");
    }
}
