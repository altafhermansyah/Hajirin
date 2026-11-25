<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CancelEventRequest;
use App\Http\Requests\Admin\RejectEventRequest;
use App\Models\Category;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminEventController extends Controller
{
    /**
     * Tampilkan halaman kelola event seluruh platform (Platform Event Management).
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $statusFilter = strtoupper((string) $request->input('status', 'ALL'));
        $categoryFilter = (string) $request->input('category', 'ALL');
        $sort = (string) $request->input('sort', 'latest');

        // Status counts untuk tab filter
        $statusCounts = DB::table('events')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published")
            ->selectRaw("COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft")
            ->selectRaw("COUNT(CASE WHEN status = 'PENDING_REVIEW' THEN 1 END) as pending_review")
            ->selectRaw("COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled")
            ->selectRaw("COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected")
            ->first();

        // Subquery tiket & kuota
        $initialQuotaSubquery = DB::table('ticket_types')
            ->whereColumn('ticket_types.event_id', 'events.id')
            ->where('ticket_types.status', 'ACTIVE')
            ->selectRaw('COALESCE(SUM(ticket_types.initial_quota), 0)');

        $remainingQuotaSubquery = DB::table('ticket_types')
            ->whereColumn('ticket_types.event_id', 'events.id')
            ->where('ticket_types.status', 'ACTIVE')
            ->selectRaw('COALESCE(SUM(ticket_types.quota), 0)');

        $minPriceSubquery = DB::table('ticket_prices')
            ->join('ticket_types', 'ticket_types.id', '=', 'ticket_prices.ticket_type_id')
            ->whereColumn('ticket_types.event_id', 'events.id')
            ->where('ticket_types.status', 'ACTIVE')
            ->where('ticket_prices.status', 'ACTIVE')
            ->selectRaw('COALESCE(MIN(ticket_prices.price), 0)');

        $query = DB::table('events')
            ->join('categories', 'categories.id', '=', 'events.category_id')
            ->join('users as organizers', 'organizers.id', '=', 'events.eo_id')
            ->leftJoin('eo_applications', function ($join): void {
                $join->on('eo_applications.user_id', '=', 'events.eo_id')
                    ->where('eo_applications.status', '=', 'APPROVED');
            })
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
                'events.ends_at',
                'events.banner_path',
                'events.status',
                'events.rejection_reason',
                'events.cancellation_reason',
                'events.created_at',
                'categories.id as category_id',
                'categories.name as category_name',
                'categories.slug as category_slug',
                'organizers.id as eo_id',
                'organizers.name as organizer_name',
                'organizers.email as organizer_email',
                'eo_applications.organization_name'
            )
            ->addSelect([
                'initial_quota' => $initialQuotaSubquery,
                'remaining_quota' => $remainingQuotaSubquery,
                'min_price' => $minPriceSubquery,
            ]);

        // Filter Pencarian
        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $lower = '%'.mb_strtolower($search).'%';
                $q->whereRaw('LOWER(events.title) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(events.venue_name) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(events.city) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(organizers.name) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(eo_applications.organization_name) LIKE ?', [$lower])
                    ->orWhereRaw('CAST(events.id AS TEXT) LIKE ?', ["%{$search}%"]);
            });
        }

        // Filter Status
        if (in_array($statusFilter, ['PUBLISHED', 'DRAFT', 'PENDING_REVIEW', 'CANCELLED', 'REJECTED'], true)) {
            $query->where('events.status', $statusFilter);
        }

        // Filter Kategori
        if ($categoryFilter !== 'ALL' && $categoryFilter !== '') {
            $query->where(function ($q) use ($categoryFilter): void {
                $q->where('categories.slug', $categoryFilter)
                    ->orWhere('categories.id', $categoryFilter);
            });
        }

        // Pengurutan (Sorting)
        match ($sort) {
            'oldest' => $query->orderBy('events.created_at', 'asc'),
            'starts_soon' => $query->orderBy('events.starts_at', 'asc'),
            'title_asc' => $query->orderBy('events.title', 'asc'),
            default => $query->orderByDesc('events.created_at'),
        };

        $paginated = $query->paginate(10)->withQueryString();

        $events = $paginated->through(function ($evt) {
            $initialQuota = (int) ($evt->initial_quota ?? 0);
            $remainingQuota = (int) ($evt->remaining_quota ?? 0);
            $ticketsSold = max(0, $initialQuota - $remainingQuota);
            $soldPercentage = $initialQuota > 0 ? (int) round(($ticketsSold / $initialQuota) * 100) : 0;
            $minPrice = (float) ($evt->min_price ?? 0);

            $startsAt = Carbon::parse($evt->starts_at);

            return [
                'id' => $evt->id,
                'title' => $evt->title,
                'slug' => $evt->slug,
                'description' => $evt->description,
                'category' => $evt->category_name,
                'categorySlug' => $evt->category_slug,
                'eventType' => $evt->event_type,
                'location' => $evt->event_type === 'ONLINE'
                    ? 'Online Event'
                    : (($evt->city ? $evt->city.' · ' : '').($evt->venue_name ?? '-')),
                'venueName' => $evt->venue_name ?: ($evt->event_type === 'ONLINE' ? 'Online' : '-'),
                'city' => $evt->city,
                'startsAtFormatted' => $startsAt->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                'monthBadge' => $startsAt->locale('id')->translatedFormat('M'),
                'dayBadge' => $startsAt->translatedFormat('d'),
                'banner' => $evt->banner_path ?: '/images/events/tech_hero.webp',
                'status' => $evt->status,
                'rejectionReason' => $evt->rejection_reason,
                'cancellationReason' => $evt->cancellation_reason,
                'organizerName' => $evt->organization_name ?: $evt->organizer_name,
                'organizerEmail' => $evt->organizer_email,
                'isVerifiedEo' => ! empty($evt->organization_name),
                'initialQuota' => $initialQuota,
                'ticketsSold' => $ticketsSold,
                'soldPercentage' => $soldPercentage,
                'priceLabel' => $minPrice > 0 ? 'Rp'.number_format($minPrice, 0, ',', '.') : 'Gratis',
            ];
        });

        $categories = Category::orderBy('name')->select('id', 'name', 'slug')->get();

        return Inertia::render('Admin/Events/Index', [
            'events' => $events,
            'categories' => $categories,
            'stats' => [
                'total' => (int) ($statusCounts->total ?? 0),
                'published' => (int) ($statusCounts->published ?? 0),
                'draft' => (int) ($statusCounts->draft ?? 0),
                'pendingReview' => (int) ($statusCounts->pending_review ?? 0),
                'cancelled' => (int) ($statusCounts->cancelled ?? 0),
                'rejected' => (int) ($statusCounts->rejected ?? 0),
            ],
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'category' => $categoryFilter,
                'sort' => $sort,
            ],
        ]);
    }

    /**
     * Setujui event berstatus PENDING_REVIEW agar tayang publik (PUBLISHED).
     */
    public function approve(Request $request, string $id): RedirectResponse
    {
        $admin = $request->user();

        DB::transaction(function () use ($admin, $id): void {
            $event = Event::where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($event->status, ['PENDING_REVIEW', 'DRAFT', 'REJECTED'], true)) {
                throw ValidationException::withMessages([
                    'event' => 'Event ini sudah berada dalam status publikasi atau dibatalkan.',
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
                'title' => 'Event Anda Resmi Tayang!',
                'message' => "Selamat! Event \"{$event->title}\" telah disetujui oleh Administrator dan kini tampil aktif di katalog publik Hajirin.",
                'action_url' => "/event/{$event->slug}",
                'created_at' => now(),
            ]);
        });

        return back()->with('success', 'Event berhasil disetujui dan kini berstatus Published.');
    }

    /**
     * Tolak event dengan catatan revisi untuk penyelenggara (EO).
     */
    public function reject(RejectEventRequest $request, string $id): RedirectResponse
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
                'title' => 'Event Memerlukan Revisi',
                'message' => "Event \"{$event->title}\" ditolak sementara oleh Administrator. Catatan: {$validated['rejection_reason']}",
                'action_url' => "/eo/events/{$event->id}/edit",
                'created_at' => now(),
            ]);
        });

        return back()->with('success', 'Event telah ditolak beserta catatan revisi untuk EO.');
    }

    /**
     * Tarik atau batalkan event (Force Cancel / Take Down) oleh Super Admin.
     */
    public function cancel(CancelEventRequest $request, string $id): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($id, $validated): void {
            $event = Event::where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($event->status === 'CANCELLED') {
                throw ValidationException::withMessages([
                    'cancellation_reason' => 'Event ini sudah dibatalkan sebelumnya.',
                ]);
            }

            $event->forceFill([
                'status' => 'CANCELLED',
                'cancelled_at' => now(),
                'cancellation_reason' => $validated['cancellation_reason'],
            ])->save();

            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $event->eo_id,
                'type' => 'EVENT_CANCELLED',
                'title' => 'Event Ditarik / Dibatalkan oleh Admin',
                'message' => "Event \"{$event->title}\" telah diturunkan dari publikasi oleh Administrator. Alasan: {$validated['cancellation_reason']}",
                'action_url' => '/eo/dashboard',
                'created_at' => now(),
            ]);
        });

        return back()->with('success', 'Event berhasil ditarik dan dibatalkan dari sistem.');
    }

    /**
     * Hapus event (jika belum ada pesanan berbayar).
     */
    public function destroy(string $id): RedirectResponse
    {
        $event = Event::findOrFail($id);

        try {
            $event->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'event' => 'Event ini tidak dapat dihapus permanen karena telah memiliki transaksi atau tiket terkait. Silakan gunakan aksi Batalkan / Take Down.',
            ]);
        }

        return back()->with('success', "Event \"{$event->title}\" berhasil dihapus.");
    }
}
