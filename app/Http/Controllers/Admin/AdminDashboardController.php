<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectEoApplicationRequest;
use App\Http\Requests\Admin\RejectEventRequest;
use App\Models\EoApplication;
use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Display the admin platform dashboard overview.
     */
    public function index(Request $request): Response
    {
        $userStats = DB::table('users')
            ->selectRaw('COUNT(*) as total_users')
            ->selectRaw("COUNT(CASE WHEN role = 'USER' THEN 1 END) as total_peserta")
            ->selectRaw("COUNT(CASE WHEN role = 'EO' THEN 1 END) as total_eo")
            ->selectRaw("COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as total_admin")
            ->first();

        $eventStats = DB::table('events')
            ->selectRaw('COUNT(*) as total_events')
            ->selectRaw("COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published_events")
            ->selectRaw("COUNT(CASE WHEN status = 'PENDING_REVIEW' THEN 1 END) as pending_events")
            ->selectRaw("COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_events")
            ->selectRaw("COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_events")
            ->first();

        $eoApplications = DB::table('eo_applications')
            ->join('users', 'users.id', '=', 'eo_applications.user_id')
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
                'users.name as applicant_name',
                'users.email as applicant_email',
                'reviewers.name as reviewer_name'
            )
            ->orderByRaw("CASE WHEN eo_applications.status = 'PENDING' THEN 0 ELSE 1 END")
            ->orderByDesc('eo_applications.created_at')
            ->get()
            ->map(function ($app) {
                return [
                    'id' => $app->id,
                    'user_id' => $app->user_id,
                    'applicant_name' => $app->applicant_name,
                    'applicant_email' => $app->applicant_email,
                    'organization_name' => $app->organization_name,
                    'contact_phone' => $app->contact_phone,
                    'portfolio_url' => $app->portfolio_url,
                    'reason' => $app->reason,
                    'status' => $app->status,
                    'rejection_reason' => $app->rejection_reason,
                    'reviewer_name' => $app->reviewer_name,
                    'document_url' => $app->document_path
                        ? Storage::disk('local')->temporaryUrl($app->document_path, now()->addMinutes(15))
                        : null,
                    'created_at_formatted' => Carbon::parse($app->created_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                    'reviewed_at_formatted' => $app->reviewed_at
                        ? Carbon::parse($app->reviewed_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                        : null,
                ];
            });

        $pendingEoApplications = $eoApplications->where('status', 'PENDING')->count();

        $totalQuotaSubquery = DB::table('ticket_types')
            ->whereColumn('ticket_types.event_id', 'events.id')
            ->where('ticket_types.status', 'ACTIVE')
            ->selectRaw('COALESCE(SUM(ticket_types.initial_quota), 0)');

        $ticketTypesCountSubquery = DB::table('ticket_types')
            ->whereColumn('ticket_types.event_id', 'events.id')
            ->where('ticket_types.status', 'ACTIVE')
            ->selectRaw('COUNT(ticket_types.id)');

        $minPriceSubquery = DB::table('ticket_prices')
            ->join('ticket_types', 'ticket_types.id', '=', 'ticket_prices.ticket_type_id')
            ->whereColumn('ticket_types.event_id', 'events.id')
            ->where('ticket_types.status', 'ACTIVE')
            ->where('ticket_prices.status', 'ACTIVE')
            ->selectRaw('COALESCE(MIN(ticket_prices.price), 0)');

        $eventsForModeration = DB::table('events')
            ->join('categories', 'categories.id', '=', 'events.category_id')
            ->join('users as organizers', 'organizers.id', '=', 'events.eo_id')
            ->leftJoin('eo_applications', function ($join) {
                $join->on('eo_applications.user_id', '=', 'events.eo_id')
                    ->where('eo_applications.status', '=', 'APPROVED');
            })
            ->whereIn('events.status', ['PENDING_REVIEW', 'PUBLISHED', 'REJECTED'])
            ->select(
                'events.id',
                'events.title',
                'events.slug',
                'events.description',
                'events.event_type',
                'events.city',
                'events.venue_name',
                'events.online_url',
                'events.starts_at',
                'events.banner_path',
                'events.status',
                'events.rejection_reason',
                'events.created_at',
                'categories.name as category_name',
                'organizers.name as organizer_user_name',
                'organizers.email as organizer_email',
                'eo_applications.organization_name'
            )
            ->addSelect([
                'total_quota' => $totalQuotaSubquery,
                'ticket_types_count' => $ticketTypesCountSubquery,
                'min_price' => $minPriceSubquery,
            ])
            ->orderByRaw("CASE WHEN events.status = 'PENDING_REVIEW' THEN 0 ELSE 1 END")
            ->orderByDesc('events.created_at')
            ->limit(25)
            ->get()
            ->map(function ($event) {
                $minPrice = (float) ($event->min_price ?? 0);

                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'slug' => $event->slug,
                    'description' => $event->description,
                    'category' => $event->category_name,
                    'eventType' => $event->event_type,
                    'location' => $event->event_type === 'ONLINE'
                        ? 'Online Event'
                        : (($event->city ? $event->city.' · ' : '').($event->venue_name ?? '-')),
                    'startsAtFormatted' => Carbon::parse($event->starts_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                    'banner' => $event->banner_path ?: '/images/events/tech_hero.jpg',
                    'status' => $event->status,
                    'rejectionReason' => $event->rejection_reason,
                    'organizerName' => $event->organization_name ?: $event->organizer_user_name,
                    'organizerEmail' => $event->organizer_email,
                    'totalQuota' => (int) ($event->total_quota ?? 0),
                    'ticketTypesCount' => (int) ($event->ticket_types_count ?? 0),
                    'priceLabel' => $minPrice > 0 ? 'Mulai Rp'.number_format($minPrice, 0, ',', '.') : 'Gratis',
                ];
            });

        $recentUsers = DB::table('users')
            ->select('id', 'name', 'email', 'phone', 'role', 'created_at')
            ->latest('created_at')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalUsers' => (int) ($userStats->total_users ?? 0),
                'totalPeserta' => (int) ($userStats->total_peserta ?? 0),
                'totalEo' => (int) ($userStats->total_eo ?? 0),
                'totalAdmin' => (int) ($userStats->total_admin ?? 0),
                'totalEvents' => (int) ($eventStats->total_events ?? 0),
                'publishedEvents' => (int) ($eventStats->published_events ?? 0),
                'pendingEvents' => (int) ($eventStats->pending_events ?? 0),
                'draftEvents' => (int) ($eventStats->draft_events ?? 0),
                'rejectedEvents' => (int) ($eventStats->rejected_events ?? 0),
                'pendingEoApplications' => $pendingEoApplications,
            ],
            'eoApplications' => $eoApplications,
            'eventsForModeration' => $eventsForModeration,
            'recentUsers' => $recentUsers,
        ]);
    }

    /**
     * Setujui pengajuan akun Event Organizer (EO) dan ubah role pengguna menjadi EO.
     */
    public function approveEoApplication(Request $request, string $id): RedirectResponse
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
                'message' => "Selamat! Pengajuan organisasi {$application->organization_name} telah disetujui oleh Admin. Akun Anda kini resmi berstatus Event Organizer.",
                'action_url' => '/eo/dashboard',
                'created_at' => now(),
            ]);
        });

        return back()->with('success', 'Pengajuan Event Organizer berhasil disetujui dan role pengguna telah diperbarui menjadi EO.');
    }

    /**
     * Tolak pengajuan akun Event Organizer (EO) beserta alasan penolakannya.
     */
    public function rejectEoApplication(RejectEoApplicationRequest $request, string $id): RedirectResponse
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
                'message' => "Pengajuan organisasi {$application->organization_name} belum dapat disetujui. Alasan: {$validated['rejection_reason']}",
                'action_url' => '/dashboard#pengajuan-eo',
                'created_at' => now(),
            ]);
        });

        return back()->with('success', 'Pengajuan Event Organizer telah ditolak beserta catatan evaluasi untuk pemohon.');
    }

    /**
     * Setujui event berstatus PENDING_REVIEW agar tayang publik (PUBLISHED).
     */
    public function approveEvent(Request $request, string $id): RedirectResponse
    {
        $admin = $request->user();

        DB::transaction(function () use ($admin, $id): void {
            $event = Event::where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($event->status !== 'PENDING_REVIEW') {
                throw ValidationException::withMessages([
                    'event' => 'Hanya event berstatus Menunggu Review yang dapat disetujui.',
                ]);
            }

            $event->forceFill([
                'status' => 'PUBLISHED',
                'rejection_reason' => null,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ])->save();

            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $event->eo_id,
                'type' => 'EVENT_APPROVED',
                'title' => 'Event Anda Telah Disetujui & Tayang!',
                'message' => "Selamat! Event \"{$event->title}\" telah disetujui oleh Tim Moderator Admin dan kini resmi tayang di katalog publik Hajirin.",
                'action_url' => "/event/{$event->slug}",
                'created_at' => now(),
            ]);
        });

        return back()->with('success', 'Event berhasil disetujui dan kini resmi tayang di katalog publik.');
    }

    /**
     * Tolak pengajuan event beserta catatan revisi untuk penyelenggara (EO).
     */
    public function rejectEvent(RejectEventRequest $request, string $id): RedirectResponse
    {
        $admin = $request->user();
        $validated = $request->validated();

        DB::transaction(function () use ($admin, $id, $validated): void {
            $event = Event::where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($event->status !== 'PENDING_REVIEW') {
                throw ValidationException::withMessages([
                    'rejection_reason' => 'Hanya event berstatus Menunggu Review yang dapat ditolak.',
                ]);
            }

            $event->forceFill([
                'status' => 'REJECTED',
                'rejection_reason' => $validated['rejection_reason'],
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ])->save();

            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $event->eo_id,
                'type' => 'EVENT_REJECTED',
                'title' => 'Event Memerlukan Revisi Sebelum Tayang',
                'message' => "Event \"{$event->title}\" belum dapat ditayangkan. Catatan Moderator: {$validated['rejection_reason']}",
                'action_url' => "/eo/events/{$event->id}/edit",
                'created_at' => now(),
            ]);
        });

        return back()->with('success', 'Event telah dikembalikan ke EO beserta catatan revisi.');
    }
}
