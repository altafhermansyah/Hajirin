<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Requests\Admin\RejectEoApplicationRequest;
use App\Mail\EoApplicationStatusMail;
use App\Models\EoApplication;
use App\Models\User;
use App\Support\AuditLog;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminOrganizerController extends Controller
{
    /**
     * Tampilkan halaman direktori seluruh Event Organizer (EO) & analisis performa.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $statusFilter = strtoupper((string) $request->input('status', 'ALL'));
        $verificationFilter = strtoupper((string) $request->input('verification', 'ALL'));
        $sort = (string) $request->input('sort', 'latest');

        // Statistik Keseluruhan EO
        $totalEo = User::where('role', 'EO')->count();
        $activeEo = User::where('role', 'EO')->where(function ($q): void {
            $q->where('status', 'ACTIVE')->orWhereNull('status');
        })->count();
        $suspendedEo = User::where('role', 'EO')->where('status', 'SUSPENDED')->count();

        $pendingApplicationsCount = DB::table('eo_applications')
            ->where('status', 'PENDING')
            ->count();

        $approvedApplicationsCount = DB::table('eo_applications')
            ->where('status', 'APPROVED')
            ->count();

        $totalEventsByEo = DB::table('events')
            ->join('users', 'users.id', '=', 'events.eo_id')
            ->where('users.role', 'EO')
            ->count();

        $totalRevenueByEo = (float) (DB::table('orders')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->join('users', 'users.id', '=', 'events.eo_id')
            ->where('users.role', 'EO')
            ->where('orders.status', 'PAID')
            ->sum('orders.total_amount') ?? 0);

        $totalTicketsSoldByEo = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->join('users', 'users.id', '=', 'events.eo_id')
            ->where('users.role', 'EO')
            ->where('orders.status', 'PAID')
            ->count();

        // Subquery data EO Application
        $eoEventStats = DB::table('events')
            ->groupBy('eo_id')
            ->selectRaw('eo_id, COUNT(id) as events_count')
            ->selectRaw("COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published_events_count");

        $eoRevenueStats = DB::table('orders')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('orders.status', 'PAID')
            ->groupBy('events.eo_id')
            ->selectRaw('events.eo_id, COALESCE(SUM(orders.total_amount), 0) as total_revenue');

        $query = DB::table('users')
            ->leftJoin('eo_applications', function ($join): void {
                $join->on('eo_applications.user_id', '=', 'users.id')
                    ->where('eo_applications.status', '=', 'APPROVED');
            })
            ->leftJoinSub($eoEventStats, 'eo_event_stats', 'eo_event_stats.eo_id', '=', 'users.id')
            ->leftJoinSub($eoRevenueStats, 'eo_revenue_stats', 'eo_revenue_stats.eo_id', '=', 'users.id')
            ->where('users.role', 'EO')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                'users.status',
                'users.created_at',
                'eo_applications.id as application_id',
                'eo_applications.organization_name',
                'eo_applications.portfolio_url',
                'eo_applications.document_path',
                DB::raw('COALESCE(eo_event_stats.events_count, 0) as events_count'),
                DB::raw('COALESCE(eo_event_stats.published_events_count, 0) as published_events_count'),
                DB::raw('COALESCE(eo_revenue_stats.total_revenue, 0) as total_revenue')
            );

        // Filter Pencarian
        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $lower = '%'.mb_strtolower($search).'%';
                $q->whereRaw('LOWER(users.name) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(users.email) LIKE ?', [$lower])
                    ->orWhere('users.phone', 'LIKE', "%{$search}%")
                    ->orWhereRaw('EXISTS (SELECT 1 FROM eo_applications WHERE eo_applications.user_id = users.id AND LOWER(organization_name) LIKE ?)', [$lower]);
            });
        }

        // Filter Status Akun
        if (in_array($statusFilter, ['ACTIVE', 'SUSPENDED'], true)) {
            $query->where('users.status', $statusFilter);
        }

        // Filter Status Verifikasi Dokumen
        if ($verificationFilter === 'VERIFIED') {
            $query->whereExists(function ($q): void {
                $q->select(DB::raw(1))
                    ->from('eo_applications')
                    ->whereColumn('eo_applications.user_id', 'users.id')
                    ->where('eo_applications.status', 'APPROVED');
            });
        } elseif ($verificationFilter === 'UNVERIFIED') {
            $query->whereNotExists(function ($q): void {
                $q->select(DB::raw(1))
                    ->from('eo_applications')
                    ->whereColumn('eo_applications.user_id', 'users.id')
                    ->where('eo_applications.status', 'APPROVED');
            });
        }

        // Pengurutan
        match ($sort) {
            'oldest' => $query->orderBy('users.created_at', 'asc'),
            'name_asc' => $query->orderBy('users.name', 'asc'),
            'most_events' => $query->orderByDesc('events_count'),
            'most_revenue' => $query->orderByDesc('total_revenue'),
            default => $query->orderByDesc('users.created_at'),
        };

        $paginated = $query->paginate(10)->withQueryString();

        $pageEoIds = $paginated->getCollection()->pluck('id')->all();
        $ticketsSoldByEo = $pageEoIds !== []
            ? DB::table('tickets')
                ->join('orders', 'orders.id', '=', 'tickets.order_id')
                ->join('events', 'events.id', '=', 'orders.event_id')
                ->whereIn('events.eo_id', $pageEoIds)
                ->where('orders.status', 'PAID')
                ->groupBy('events.eo_id')
                ->selectRaw('events.eo_id, COUNT(tickets.id) as tickets_sold')
                ->pluck('tickets_sold', 'events.eo_id')
            : collect();

        $organizers = $paginated->through(function ($eo) use ($ticketsSoldByEo) {
            $revenue = (float) ($eo->total_revenue ?? 0);
            $eventsCount = (int) ($eo->events_count ?? 0);
            $publishedCount = (int) ($eo->published_events_count ?? 0);
            $ticketsSold = (int) ($ticketsSoldByEo[$eo->id] ?? 0);
            $isVerified = ! empty($eo->organization_name);

            return [
                'id' => $eo->id,
                'name' => $eo->name,
                'email' => $eo->email,
                'phone' => $eo->phone ?: '-',
                'status' => $eo->status ?? 'ACTIVE',
                'organizationName' => $eo->organization_name ?: $eo->name,
                'portfolioUrl' => $eo->portfolio_url,
                'applicationId' => $eo->application_id,
                'isVerified' => $isVerified,
                'eventsCount' => $eventsCount,
                'publishedEventsCount' => $publishedCount,
                'ticketsSold' => $ticketsSold,
                'revenueFormatted' => 'Rp'.number_format($revenue, 0, ',', '.'),
                'rawRevenue' => $revenue,
                'joinedAtFormatted' => Carbon::parse($eo->created_at)->locale('id')->translatedFormat('d M Y'),
            ];
        });

        return Inertia::render('Admin/Organizers/Index', [
            'organizers' => $organizers,
            'stats' => [
                'totalEo' => $totalEo,
                'activeEo' => $activeEo,
                'suspendedEo' => $suspendedEo,
                'pendingApplicationsCount' => $pendingApplicationsCount,
                'approvedApplicationsCount' => $approvedApplicationsCount,
                'totalEventsByEo' => $totalEventsByEo,
                'totalTicketsSoldByEo' => $totalTicketsSoldByEo,
                'totalRevenueByEoFormatted' => 'Rp'.number_format($totalRevenueByEo, 0, ',', '.'),
            ],
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'verification' => $verificationFilter,
                'sort' => $sort,
            ],
        ]);
    }

    /**
     * Tampilkan antrean verifikasi pengajuan akun Event Organizer (EO Applications & Verification).
     */
    public function applications(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $statusFilter = strtoupper((string) $request->input('status', 'PENDING'));

        $query = DB::table('eo_applications')
            ->join('users as applicants', 'applicants.id', '=', 'eo_applications.user_id')
            ->leftJoin('users as reviewers', 'reviewers.id', '=', 'eo_applications.reviewed_by')
            ->select(
                'eo_applications.id',
                'eo_applications.user_id',
                'eo_applications.organization_name',
                'eo_applications.contact_phone',
                'eo_applications.portfolio_url',
                'eo_applications.document_path',
                'eo_applications.reason',
                'eo_applications.status',
                'eo_applications.rejection_reason',
                'eo_applications.reviewed_at',
                'eo_applications.created_at',
                'applicants.name as applicant_name',
                'applicants.email as applicant_email',
                'applicants.status as applicant_status',
                'reviewers.name as reviewer_name'
            );

        // Status filter
        if (in_array($statusFilter, ['PENDING', 'APPROVED', 'REJECTED'], true)) {
            $query->where('eo_applications.status', $statusFilter);
        }

        // Search filter
        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $lower = '%'.mb_strtolower($search).'%';
                $q->whereRaw('LOWER(eo_applications.organization_name) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(applicants.name) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(applicants.email) LIKE ?', [$lower])
                    ->orWhere('eo_applications.contact_phone', 'LIKE', "%{$search}%");
            });
        }

        $query->orderByRaw("CASE WHEN eo_applications.status = 'PENDING' THEN 0 ELSE 1 END")
            ->orderByDesc('eo_applications.created_at');

        $paginated = $query->paginate(10)->withQueryString();

        $applications = $paginated->through(function ($app) {
            return [
                'id' => $app->id,
                'userId' => $app->user_id,
                'applicantName' => $app->applicant_name,
                'applicantEmail' => $app->applicant_email,
                'applicantStatus' => $app->applicant_status ?? 'ACTIVE',
                'organizationName' => $app->organization_name,
                'contactPhone' => $app->contact_phone,
                'portfolioUrl' => $app->portfolio_url,
                'reason' => $app->reason,
                'status' => $app->status,
                'rejectionReason' => $app->rejection_reason,
                'reviewerName' => $app->reviewer_name,
                'hasDocument' => ! empty($app->document_path),
                'documentUrl' => route('admin.organizers.document', $app->id),
                'createdAtFormatted' => Carbon::parse($app->created_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                'reviewedAtFormatted' => $app->reviewed_at
                    ? Carbon::parse($app->reviewed_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                    : null,
            ];
        });

        // Tab counts
        $counts = DB::table('eo_applications')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending")
            ->selectRaw("COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved")
            ->selectRaw("COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected")
            ->first();

        return Inertia::render('Admin/Organizers/Applications', [
            'applications' => $applications,
            'stats' => [
                'total' => (int) ($counts->total ?? 0),
                'pending' => (int) ($counts->pending ?? 0),
                'approved' => (int) ($counts->approved ?? 0),
                'rejected' => (int) ($counts->rejected ?? 0),
            ],
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
            ],
        ]);
    }

    /**
     * Buka / streaming berkas dokumen verifikasi pengajuan EO secara aman bagi Administrator.
     */
    public function showDocument(string $id): BinaryFileResponse|StreamedResponse
    {
        $application = EoApplication::findOrFail($id);

        if (! $application->document_path || ! Storage::disk('local')->exists($application->document_path)) {
            abort(404, 'Berkas dokumen pengajuan tidak ditemukan di server.');
        }

        AuditLog::record(
            action: 'eo_document.viewed',
            subjectType: 'eo_application',
            subjectId: $application->id,
            metadata: [
                'applicant_user_id' => $application->user_id,
            ],
        );

        return Storage::disk('local')->response($application->document_path);
    }

    /**
     * Setujui pengajuan akun Event Organizer (EO) dan ubah role pengguna menjadi EO.
     */
    public function approveApplication(Request $request, string $id): RedirectResponse
    {
        $admin = $request->user();

        DB::transaction(function () use ($admin, $id): void {
            $application = EoApplication::where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($application->status !== 'PENDING') {
                throw ValidationException::withMessages([
                    'application' => 'Pengajuan EO ini sudah pernah ditinjau sebelumnya.',
                ]);
            }

            $application->forceFill([
                'status' => 'APPROVED',
                'rejection_reason' => null,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ])->save();

            $applicant = User::where('id', $application->user_id)
                ->lockForUpdate()
                ->firstOrFail();

            $applicant->forceFill([
                'role' => 'EO',
                'phone' => $applicant->phone ?: $application->contact_phone,
            ])->save();

            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $applicant->id,
                'type' => 'EO_APPLICATION_UPDATED',
                'title' => 'Pengajuan Event Organizer Disetujui!',
                'message' => "Selamat! Pengajuan organisasi \"{$application->organization_name}\" telah disetujui oleh Administrator. Akun Anda kini resmi berstatus Event Organizer.",
                'action_url' => '/eo/dashboard',
                'created_at' => now(),
            ]);

            Mail::to($applicant->email)->send(
                (new EoApplicationStatusMail(
                    applicantName: $applicant->name,
                    organizationName: $application->organization_name,
                    approved: true,
                ))->afterCommit()
            );
        });

        Cache::forget(HandleInertiaRequests::ADMIN_COUNTS_CACHE_KEY);

        AuditLog::record(
            action: 'eo_application.reviewed',
            actorId: $admin->id,
            subjectType: 'eo_application',
            subjectId: $id,
            metadata: ['decision' => 'APPROVED'],
        );

        return back()->with('success', 'Pengajuan Event Organizer berhasil disetujui dan pengguna resmi berstatus EO.');
    }

    /**
     * Tolak pengajuan akun Event Organizer (EO) beserta alasan penolakan.
     */
    public function rejectApplication(RejectEoApplicationRequest $request, string $id): RedirectResponse
    {
        $admin = $request->user();
        $validated = $request->validated();

        DB::transaction(function () use ($admin, $id, $validated): void {
            $application = EoApplication::where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($application->status !== 'PENDING') {
                throw ValidationException::withMessages([
                    'rejection_reason' => 'Pengajuan EO ini sudah pernah ditinjau sebelumnya.',
                ]);
            }

            $application->forceFill([
                'status' => 'REJECTED',
                'rejection_reason' => $validated['rejection_reason'],
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ])->save();

            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $application->user_id,
                'type' => 'EO_APPLICATION_UPDATED',
                'title' => 'Pengajuan Event Organizer Belum Disetujui',
                'message' => "Pengajuan organisasi \"{$application->organization_name}\" belum dapat disetujui. Catatan evaluasi: {$validated['rejection_reason']}",
                'action_url' => '/dashboard#pengajuan-eo',
                'created_at' => now(),
            ]);

            $applicant = User::find($application->user_id);
            if ($applicant) {
                Mail::to($applicant->email)->send(
                    (new EoApplicationStatusMail(
                        applicantName: $applicant->name,
                        organizationName: $application->organization_name,
                        approved: false,
                        rejectionReason: $validated['rejection_reason'],
                    ))->afterCommit()
                );
            }
        });

        Cache::forget(HandleInertiaRequests::ADMIN_COUNTS_CACHE_KEY);

        AuditLog::record(
            action: 'eo_application.reviewed',
            actorId: $admin->id,
            subjectType: 'eo_application',
            subjectId: $id,
            metadata: ['decision' => 'REJECTED'],
        );

        return back()->with('success', 'Pengajuan Event Organizer telah ditolak beserta catatan evaluasi untuk pemohon.');
    }

    /**
     * Ubah status akun EO antara ACTIVE dan SUSPENDED.
     */
    public function toggleStatus(Request $request, string $id): RedirectResponse
    {
        $user = User::where('id', $id)->where('role', 'EO')->firstOrFail();

        $newStatus = $user->status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

        $payload = ['status' => $newStatus];
        if ($newStatus === 'SUSPENDED') {
            $payload['remember_token'] = Str::random(60);
        }

        $user->forceFill($payload)->save();

        if ($newStatus === 'SUSPENDED') {
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }

        AuditLog::record(
            action: 'user.status_changed',
            actorId: $request->user()?->id,
            subjectType: 'user',
            subjectId: $user->id,
            metadata: ['new_status' => $newStatus, 'role' => 'EO'],
        );

        $label = $newStatus === 'ACTIVE' ? 'diaktifkan kembali' : 'ditangguhkan (suspended)';

        return back()->with('success', "Akun EO {$user->name} berhasil {$label}.");
    }

    /**
     * Cabut hak akses Event Organizer (Demote EO kembali menjadi USER biasa).
     */
    public function revoke(Request $request, string $id): RedirectResponse
    {
        $user = User::where('id', $id)->where('role', 'EO')->firstOrFail();
        $reason = $request->input('reason', 'Hak akses Event Organizer dicabut oleh Administrator platform.');

        DB::transaction(function () use ($user, $reason): void {
            $user->forceFill([
                'role' => 'USER',
            ])->save();

            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $user->id,
                'type' => 'EO_APPLICATION_UPDATED',
                'title' => 'Hak Akses Event Organizer Dicabut',
                'message' => "Hak akses penyelenggara (EO) pada akun Anda telah dicabut oleh Administrator platform. Alasan: {$reason}",
                'action_url' => '/dashboard',
                'created_at' => now(),
            ]);
        });

        AuditLog::record(
            action: 'eo.revoked',
            actorId: $request->user()?->id,
            subjectType: 'user',
            subjectId: $user->id,
            metadata: ['reason' => $reason],
        );

        return back()->with('success', "Hak akses EO untuk {$user->name} berhasil dicabut dan role telah dikembalikan menjadi Peserta (USER).");
    }
}
