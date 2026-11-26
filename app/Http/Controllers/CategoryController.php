<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Menampilkan halaman kategori secara dinamis berdasarkan data kategori dari database.
     * Jika tidak ada parameter yang diberikan, default-nya adalah 'Semua'.
     */
    public function index(string $type = 'semua'): Response
    {
        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon']);

        $normalizedType = mb_strtolower(trim($type));
        $matchedCategory = $normalizedType !== '' && $normalizedType !== 'semua'
            ? $categories->first(fn (Category $category): bool => mb_strtolower($category->slug) === $normalizedType
                || mb_strtolower($category->name) === $normalizedType)
            : null;

        $eventRows = DB::table('events')
            ->join('categories', 'events.category_id', '=', 'categories.id')
            ->join('users', 'events.eo_id', '=', 'users.id')
            ->leftJoin('eo_applications', function ($join): void {
                $join->on('eo_applications.user_id', '=', 'users.id')
                    ->where('eo_applications.status', '=', 'APPROVED');
            })
            ->where('events.status', 'PUBLISHED')
            ->select(
                'events.id',
                'events.title',
                'events.slug',
                'events.starts_at',
                'events.venue_name',
                'events.event_type',
                'events.banner_path',
                'categories.name as category_name',
                'categories.slug as category_slug',
                DB::raw('COALESCE(eo_applications.organization_name, users.name) as organizer_name')
            )
            ->orderBy('events.starts_at')
            ->limit(100)
            ->get();

        $eventIds = $eventRows->pluck('id')->all();

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

        $events = $eventRows
            ->map(function ($event) use ($minPrices) {
                $minPrice = $minPrices[$event->id] ?? null;
                $numericPrice = $minPrice !== null ? (float) $minPrice : 0;

                return [
                    'id' => $event->id,
                    'slug' => $event->slug,
                    'category' => $event->category_name,
                    'category_slug' => $event->category_slug,
                    'tag' => strtoupper($event->category_name),
                    'title' => $event->title,
                    'date' => Carbon::parse($event->starts_at)->locale('id')->translatedFormat('D, d M Y • H:i').' WIB',
                    'location' => $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                    'organizer' => $event->organizer_name,
                    'price' => $numericPrice > 0 ? 'Rp'.number_format($numericPrice, 0, ',', '.') : 'Gratis',
                    'image' => $event->banner_path ?: '/images/events/tech_hero.webp',
                ];
            });

        $bookmarkedEventIds = auth()->check()
            ? DB::table('bookmarks')->where('user_id', auth()->id())->pluck('event_id')->toArray()
            : [];

        return Inertia::render('Kategori/Index', [
            'categories' => $categories,
            'initialCategory' => $matchedCategory?->name ?? 'Semua',
            'initialCategorySlug' => $matchedCategory?->slug ?? 'semua',
            'events' => $events,
            'bookmarkedEventIds' => $bookmarkedEventIds,
        ]);
    }
}
