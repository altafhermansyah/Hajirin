<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Tampilkan beranda publik Hajirin dengan seluruh data dinamis dari database.
     */
    public function __invoke(): Response
    {
        $publishedRows = DB::table('events')
            ->join('categories', 'events.category_id', '=', 'categories.id')
            ->join('users', 'events.eo_id', '=', 'users.id')
            ->leftJoin('eo_applications', function ($join): void {
                $join->on('eo_applications.user_id', '=', 'users.id')
                    ->where('eo_applications.status', '=', 'APPROVED');
            })
            ->whereIn('events.status', ['PUBLISHED', 'ONGOING'])
            ->select(
                'events.id',
                'events.title',
                'events.slug',
                'events.description',
                'events.starts_at',
                'events.ends_at',
                'events.city',
                'events.venue_name',
                'events.event_type',
                'events.banner_path',
                'categories.name as category_name',
                DB::raw('COALESCE(eo_applications.organization_name, users.name) as organizer_name')
            )
            ->orderBy('events.starts_at')
            ->limit(60)
            ->get();

        $eventIds = $publishedRows->pluck('id')->all();

        $minPrices = $eventIds !== []
            ? DB::table('ticket_prices')
                ->join('ticket_types', 'ticket_types.id', '=', 'ticket_prices.ticket_type_id')
                ->whereIn('ticket_types.event_id', $eventIds)
                ->where('ticket_types.status', 'ACTIVE')
                ->where('ticket_prices.status', 'ACTIVE')
                ->groupBy('ticket_types.event_id')
                ->selectRaw('ticket_types.event_id, MIN(ticket_prices.price) as min_price')
                ->pluck('min_price', 'ticket_types.event_id')
            : collect();

        $quotaStats = $eventIds !== []
            ? DB::table('ticket_types')
                ->whereIn('event_id', $eventIds)
                ->where('status', 'ACTIVE')
                ->groupBy('event_id')
                ->selectRaw('event_id, COALESCE(SUM(initial_quota), 0) as initial_quota, COALESCE(SUM(quota), 0) as remaining_quota')
                ->get()
                ->keyBy('event_id')
            : collect();

        $soldCounts = $eventIds !== []
            ? DB::table('tickets')
                ->join('orders', 'orders.id', '=', 'tickets.order_id')
                ->whereIn('orders.event_id', $eventIds)
                ->where('orders.status', 'PAID')
                ->whereIn('tickets.status', ['ACTIVE', 'USED'])
                ->groupBy('orders.event_id')
                ->selectRaw('orders.event_id, COUNT(tickets.id) as sold_count')
                ->pluck('sold_count', 'orders.event_id')
            : collect();

        $publishedEvents = $publishedRows
            ->map(function ($event) use ($minPrices, $quotaStats, $soldCounts): array {
                $minPrice = $minPrices[$event->id] ?? null;
                $numericPrice = $minPrice !== null ? (float) $minPrice : 0;
                $quota = $quotaStats->get($event->id);
                $initialQuota = (int) ($quota->initial_quota ?? 0);
                $remainingQuota = (int) ($quota->remaining_quota ?? 0);
                $ticketsSold = (int) ($soldCounts[$event->id] ?? 0);

                $isSoldOut = $initialQuota > 0 && $remainingQuota === 0;
                $isLowStock = $remainingQuota > 0 && $remainingQuota <= 20;

                if ($isSoldOut) {
                    $statusLabel = 'Tiket Habis';
                    $availability = 'Habis';
                } elseif ($isLowStock) {
                    $statusLabel = 'Hampir Habis';
                    $availability = 'Cepat Habis';
                } elseif ($ticketsSold > 0) {
                    $statusLabel = 'Populer';
                    $availability = 'Tersedia';
                } else {
                    $statusLabel = 'Tiket Tersedia';
                    $availability = 'Tersedia';
                }

                $startsAt = Carbon::parse($event->starts_at)->locale('id');
                $place = $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan');

                if ($event->city && $event->venue_name && ! str_contains(mb_strtolower($event->venue_name), mb_strtolower($event->city))) {
                    $place = $event->venue_name.', '.$event->city;
                }

                return [
                    'id' => $event->id,
                    'slug' => $event->slug,
                    'category' => $event->category_name,
                    'title' => $event->title,
                    'description' => Str::limit(trim(strip_tags((string) $event->description)), 180),
                    'starts_at' => $event->starts_at,
                    'date' => $startsAt->translatedFormat('D, d M Y • H:i').' WIB',
                    'dateShort' => $startsAt->translatedFormat('d M Y'),
                    'place' => $place,
                    'city' => $event->city,
                    'organizer' => $event->organizer_name,
                    'price' => $numericPrice > 0 ? 'Rp'.number_format($numericPrice, 0, ',', '.') : 'Gratis',
                    'image' => $event->banner_path ?: '/images/events/tech_hero.webp',
                    'status' => $statusLabel,
                    'label' => $isLowStock ? 'Hampir Habis' : ($ticketsSold > 0 ? 'Populer' : 'Baru'),
                    'availability' => $availability,
                    'remainingQuota' => $remainingQuota,
                    'ticketsSold' => $ticketsSold,
                ];
            })
            ->values();

        $now = now();
        $upcomingEvents = $publishedEvents->filter(fn (array $event): bool => Carbon::parse($event['starts_at'])->greaterThanOrEqualTo($now));
        $pastPublishedEvents = $publishedEvents
            ->filter(fn (array $event): bool => Carbon::parse($event['starts_at'])->lessThan($now))
            ->reverse();
        $primaryPool = $upcomingEvents->concat($pastPublishedEvents)->values();

        $heroEvents = $primaryPool->take(4)->values();
        $featuredEvents = $primaryPool->take(4)->values();
        $popularEvents = $publishedEvents
            ->sort(function (array $a, array $b): int {
                if ($b['ticketsSold'] !== $a['ticketsSold']) {
                    return $b['ticketsSold'] <=> $a['ticketsSold'];
                }

                return strcmp((string) $a['starts_at'], (string) $b['starts_at']);
            })
            ->take(4)
            ->values();

        $availableCities = $publishedEvents
            ->pluck('city')
            ->filter(fn (?string $city): bool => filled($city))
            ->unique()
            ->sort()
            ->values();

        $categories = DB::table('categories')
            ->leftJoin('events', function ($join): void {
                $join->on('events.category_id', '=', 'categories.id')
                    ->where('events.status', '=', 'PUBLISHED');
            })
            ->groupBy('categories.id', 'categories.name', 'categories.slug', 'categories.icon')
            ->select(
                'categories.id',
                'categories.name',
                'categories.slug',
                'categories.icon',
                DB::raw('COUNT(events.id) as events_count')
            )
            ->orderBy('categories.id')
            ->get();

        $bookmarkedEventIds = auth()->check()
            ? DB::table('bookmarks')->where('user_id', auth()->id())->pluck('event_id')->toArray()
            : [];

        return Inertia::render('Home', [
            'categories' => $categories,
            'events' => $publishedEvents,
            'heroEvents' => $heroEvents,
            'featuredEvents' => $featuredEvents,
            'popularEvents' => $popularEvents,
            'availableCities' => $availableCities,
            'bookmarkedEventIds' => $bookmarkedEventIds,
        ]);
    }
}
