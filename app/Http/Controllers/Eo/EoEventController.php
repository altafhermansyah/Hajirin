<?php

namespace App\Http\Controllers\Eo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Eo\CancelEoEventRequest;
use App\Http\Requests\Eo\StoreEoEventRequest;
use App\Http\Requests\Eo\UpdateEoEventRequest;
use App\Models\Category;
use App\Models\Event;
use App\Models\TicketPrice;
use App\Models\TicketType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EoEventController extends Controller
{
    /**
     * Tampilkan halaman formulir pembuatan event dan jenis tiket baru.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();

        $approvedApplication = DB::table('eo_applications')
            ->where('user_id', $user->id)
            ->where('status', 'APPROVED')
            ->first();

        return Inertia::render('Eo/EventForm', [
            'mode' => 'create',
            'organizerName' => $approvedApplication->organization_name ?? $user->name,
            'categories' => Category::orderBy('name')->get(['id', 'name', 'slug']),
            'event' => null,
        ]);
    }

    /**
     * Simpan event baru beserta daftar jenis tiket dan harga ke database.
     */
    public function store(StoreEoEventRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $bannerPath = '/images/events/tech_hero.jpg';
        if ($request->hasFile('banner')) {
            $storedPath = $request->file('banner')->store('banners', 'public');
            $bannerPath = '/storage/'.$storedPath;
        }

        $baseSlug = Str::slug($validated['title']);
        $slug = $baseSlug ?: 'event-hajirin';
        if (Event::where('slug', $slug)->exists()) {
            $slug = $slug.'-'.strtolower(Str::random(5));
        }

        $isOffline = $validated['event_type'] === 'OFFLINE';

        DB::transaction(function () use ($user, $validated, $bannerPath, $slug, $isOffline): void {
            $event = new Event([
                'eo_id' => $user->id,
                'category_id' => (int) $validated['category_id'],
                'title' => $validated['title'],
                'slug' => $slug,
                'description' => $validated['description'],
                'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
                'event_type' => $validated['event_type'],
                'city' => $isOffline ? $validated['city'] : null,
                'venue_name' => $isOffline ? $validated['venue_name'] : null,
                'address' => $isOffline ? $validated['address'] : null,
                'online_url' => ! $isOffline ? $validated['online_url'] : null,
                'starts_at' => $validated['starts_at'],
                'ends_at' => $validated['ends_at'],
                'banner_path' => $bannerPath,
            ]);

            $event->forceFill([
                'status' => $validated['submit_action'],
            ])->save();

            foreach ($validated['tickets'] as $tick) {
                $quota = (int) $tick['quota'];

                $ticketType = new TicketType([
                    'event_id' => $event->id,
                    'name' => $tick['name'],
                    'description' => $tick['description'] ?? null,
                    'initial_quota' => $quota,
                    'quota' => $quota,
                    'max_per_order' => (int) $tick['max_per_order'],
                    'sale_start' => ! empty($tick['sale_start']) ? $tick['sale_start'] : null,
                    'sale_end' => ! empty($tick['sale_end']) ? $tick['sale_end'] : null,
                ]);
                $ticketType->forceFill(['status' => 'ACTIVE'])->save();

                $ticketPrice = new TicketPrice([
                    'ticket_type_id' => $ticketType->id,
                    'name' => ! empty($tick['price_tier_name']) ? $tick['price_tier_name'] : 'Harga Resmi',
                    'price' => (float) $tick['price'],
                ]);
                $ticketPrice->forceFill(['status' => 'ACTIVE'])->save();
            }
        });

        $message = $validated['submit_action'] === 'PENDING_REVIEW'
            ? 'Event dan daftar tiket berhasil dibuat serta telah diajukan ke Admin untuk moderasi.'
            : 'Event dan daftar tiket berhasil disimpan sebagai Draft.';

        return redirect()->route('eo.dashboard')->with('success', $message);
    }

    /**
     * Tampilkan halaman edit event dan manajemen jenis tiket.
     */
    public function edit(Request $request, string $id): Response
    {
        $user = $request->user();

        $event = Event::with([
            'ticketTypes' => fn ($query) => $query->where('status', 'ACTIVE')->orderBy('created_at')->with('activePrice'),
        ])->findOrFail($id);

        if ($event->eo_id !== $user->id) {
            abort(403, 'Akses ditolak: Anda bukan penyelenggara event ini.');
        }

        $approvedApplication = DB::table('eo_applications')
            ->where('user_id', $user->id)
            ->where('status', 'APPROVED')
            ->first();

        return Inertia::render('Eo/EventForm', [
            'mode' => 'edit',
            'organizerName' => $approvedApplication->organization_name ?? $user->name,
            'categories' => Category::orderBy('name')->get(['id', 'name', 'slug']),
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
                'category_id' => $event->category_id,
                'description' => $event->description,
                'terms_and_conditions' => $event->terms_and_conditions ?? '',
                'event_type' => $event->event_type,
                'city' => $event->city ?? '',
                'venue_name' => $event->venue_name ?? '',
                'address' => $event->address ?? '',
                'online_url' => $event->online_url ?? '',
                'starts_at' => $event->starts_at ? $event->starts_at->format('Y-m-d\TH:i') : '',
                'ends_at' => $event->ends_at ? $event->ends_at->format('Y-m-d\TH:i') : '',
                'banner_path' => $event->banner_path,
                'status' => $event->status,
                'rejection_reason' => $event->rejection_reason,
                'tickets' => $event->ticketTypes->map(function (TicketType $ticket) {
                    $soldCount = max(0, $ticket->initial_quota - $ticket->quota);

                    return [
                        'id' => $ticket->id,
                        'name' => $ticket->name,
                        'description' => $ticket->description ?? '',
                        'quota' => $ticket->initial_quota,
                        'remaining_quota' => $ticket->quota,
                        'sold_count' => $soldCount,
                        'max_per_order' => $ticket->max_per_order,
                        'sale_start' => $ticket->sale_start ? $ticket->sale_start->format('Y-m-d\TH:i') : '',
                        'sale_end' => $ticket->sale_end ? $ticket->sale_end->format('Y-m-d\TH:i') : '',
                        'price' => (float) ($ticket->activePrice?->price ?? 0),
                        'price_tier_name' => $ticket->activePrice?->name ?? 'Harga Resmi',
                    ];
                })->values(),
            ],
        ]);
    }

    /**
     * Perbarui data event beserta konfigurasi jenis tiket dan tier harganya.
     */
    public function update(UpdateEoEventRequest $request, string $id): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        DB::transaction(function () use ($request, $user, $validated, $id): void {
            $event = Event::where('id', $id)->lockForUpdate()->firstOrFail();

            if ($event->eo_id !== $user->id) {
                abort(403, 'Akses ditolak: Anda bukan penyelenggara event ini.');
            }

            if ($event->status === 'CANCELLED') {
                throw ValidationException::withMessages([
                    'title' => 'Event yang telah dibatalkan tidak dapat diubah kembali.',
                ]);
            }

            $bannerPath = $event->banner_path;
            if ($request->hasFile('banner')) {
                $storedPath = $request->file('banner')->store('banners', 'public');
                $bannerPath = '/storage/'.$storedPath;
            }

            $isOffline = $validated['event_type'] === 'OFFLINE';

            $event->fill([
                'category_id' => (int) $validated['category_id'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
                'event_type' => $validated['event_type'],
                'city' => $isOffline ? $validated['city'] : null,
                'venue_name' => $isOffline ? $validated['venue_name'] : null,
                'address' => $isOffline ? $validated['address'] : null,
                'online_url' => ! $isOffline ? $validated['online_url'] : null,
                'starts_at' => $validated['starts_at'],
                'ends_at' => $validated['ends_at'],
                'banner_path' => $bannerPath,
            ]);

            $newStatus = $event->status;
            $rejectionReason = $event->rejection_reason;

            if ($validated['submit_action'] === 'PENDING_REVIEW') {
                $newStatus = 'PENDING_REVIEW';
                $rejectionReason = null;
            } elseif ($validated['submit_action'] === 'DRAFT' && $event->status !== 'PUBLISHED') {
                $newStatus = 'DRAFT';
            }

            $event->forceFill([
                'status' => $newStatus,
                'rejection_reason' => $rejectionReason,
            ])->save();

            $existingTickets = TicketType::where('event_id', $event->id)
                ->lockForUpdate()
                ->get();

            $existingById = $existingTickets->keyBy('id');
            $existingByName = $existingTickets->keyBy('name');
            $keptTicketIds = [];

            foreach ($validated['tickets'] as $index => $tick) {
                $matchedTicket = null;
                if (! empty($tick['id']) && $existingById->has($tick['id'])) {
                    $matchedTicket = $existingById->get($tick['id']);
                } elseif ($existingByName->has($tick['name'])) {
                    $matchedTicket = $existingByName->get($tick['name']);
                }

                $newInitialQuota = (int) $tick['quota'];
                $tierName = ! empty($tick['price_tier_name']) ? $tick['price_tier_name'] : 'Harga Resmi';

                if ($matchedTicket) {
                    $soldCount = max(0, $matchedTicket->initial_quota - $matchedTicket->quota);
                    if ($newInitialQuota < $soldCount) {
                        throw ValidationException::withMessages([
                            "tickets.{$index}.quota" => "Kuota total untuk tiket '{$tick['name']}' tidak boleh kurang dari jumlah tiket yang sudah terjual ({$soldCount} tiket).",
                        ]);
                    }

                    $matchedTicket->fill([
                        'name' => $tick['name'],
                        'description' => $tick['description'] ?? null,
                        'initial_quota' => $newInitialQuota,
                        'quota' => $newInitialQuota - $soldCount,
                        'max_per_order' => (int) $tick['max_per_order'],
                        'sale_start' => ! empty($tick['sale_start']) ? $tick['sale_start'] : null,
                        'sale_end' => ! empty($tick['sale_end']) ? $tick['sale_end'] : null,
                    ]);
                    $matchedTicket->forceFill(['status' => 'ACTIVE'])->save();

                    $activePrice = TicketPrice::where('ticket_type_id', $matchedTicket->id)
                        ->orderByDesc('created_at')
                        ->first();

                    if ($activePrice) {
                        $activePrice->fill([
                            'name' => $tierName,
                            'price' => (float) $tick['price'],
                        ]);
                        $activePrice->forceFill(['status' => 'ACTIVE'])->save();
                    } else {
                        $newPrice = new TicketPrice([
                            'ticket_type_id' => $matchedTicket->id,
                            'name' => $tierName,
                            'price' => (float) $tick['price'],
                        ]);
                        $newPrice->forceFill(['status' => 'ACTIVE'])->save();
                    }

                    $keptTicketIds[] = $matchedTicket->id;
                } else {
                    $ticketType = new TicketType([
                        'event_id' => $event->id,
                        'name' => $tick['name'],
                        'description' => $tick['description'] ?? null,
                        'initial_quota' => $newInitialQuota,
                        'quota' => $newInitialQuota,
                        'max_per_order' => (int) $tick['max_per_order'],
                        'sale_start' => ! empty($tick['sale_start']) ? $tick['sale_start'] : null,
                        'sale_end' => ! empty($tick['sale_end']) ? $tick['sale_end'] : null,
                    ]);
                    $ticketType->forceFill(['status' => 'ACTIVE'])->save();

                    $ticketPrice = new TicketPrice([
                        'ticket_type_id' => $ticketType->id,
                        'name' => $tierName,
                        'price' => (float) $tick['price'],
                    ]);
                    $ticketPrice->forceFill(['status' => 'ACTIVE'])->save();

                    $keptTicketIds[] = $ticketType->id;
                }
            }

            foreach ($existingTickets as $oldTicket) {
                if (! in_array($oldTicket->id, $keptTicketIds, true)) {
                    $hasOrders = DB::table('order_items')
                        ->where('ticket_type_id', $oldTicket->id)
                        ->exists();

                    if ($hasOrders) {
                        $oldTicket->forceFill(['status' => 'INACTIVE'])->save();
                    } else {
                        $oldTicket->delete();
                    }
                }
            }
        });

        $message = $validated['submit_action'] === 'PENDING_REVIEW'
            ? 'Perubahan event & tiket berhasil disimpan dan diajukan ke Admin untuk ditinjau.'
            : 'Perubahan data event dan jenis tiket berhasil diperbarui.';

        return redirect()->route('eo.dashboard')->with('success', $message);
    }

    /**
     * Ajukan event berstatus DRAFT atau REJECTED ke Admin untuk ditinjau (PENDING_REVIEW).
     */
    public function submitForReview(Request $request, string $id): RedirectResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user, $id): void {
            $event = Event::where('id', $id)->lockForUpdate()->firstOrFail();

            if ($event->eo_id !== $user->id) {
                abort(403, 'Akses ditolak: Anda bukan penyelenggara event ini.');
            }

            if (! in_array($event->status, ['DRAFT', 'REJECTED'], true)) {
                throw ValidationException::withMessages([
                    'event' => 'Hanya event berstatus Draft atau Ditolak yang dapat diajukan untuk review.',
                ]);
            }

            $activeTicketsCount = TicketType::where('event_id', $event->id)
                ->where('status', 'ACTIVE')
                ->count();

            if ($activeTicketsCount === 0) {
                throw ValidationException::withMessages([
                    'event' => 'Event harus memiliki minimal 1 jenis tiket aktif sebelum diajukan ke Admin.',
                ]);
            }

            $event->forceFill([
                'status' => 'PENDING_REVIEW',
                'rejection_reason' => null,
            ])->save();
        });

        return back()->with('success', 'Event berhasil diajukan ke Tim Moderator Admin untuk ditinjau.');
    }

    /**
     * Batalkan penyelenggaraan event beserta alasan pembatalan resmi.
     */
    public function cancel(CancelEoEventRequest $request, string $id): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        DB::transaction(function () use ($user, $validated, $id): void {
            $event = Event::where('id', $id)->lockForUpdate()->firstOrFail();

            if ($event->eo_id !== $user->id) {
                abort(403, 'Akses ditolak: Anda bukan penyelenggara event ini.');
            }

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
        });

        return back()->with('success', 'Penyelenggaraan event telah resmi dibatalkan.');
    }
}
