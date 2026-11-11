<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Menampilkan halaman kategori secara dinamis berdasarkan parameter URL.
     * Jika tidak ada parameter yang diberikan, default-nya adalah 'Semua'.
     */
    public function index(string $type = 'Semua'): Response
    {
        $formattedType = ucfirst(strtolower($type));

        $minPrices = DB::table('ticket_prices')
            ->join('ticket_types', 'ticket_types.id', '=', 'ticket_prices.ticket_type_id')
            ->where('ticket_types.status', 'ACTIVE')
            ->where('ticket_prices.status', 'ACTIVE')
            ->groupBy('ticket_types.event_id')
            ->selectRaw('ticket_types.event_id, MIN(ticket_prices.price) as min_price')
            ->pluck('min_price', 'ticket_types.event_id');

        $events = DB::table('events')
            ->join('categories', 'events.category_id', '=', 'categories.id')
            ->join('users', 'events.eo_id', '=', 'users.id')
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
                'users.name as organizer_name'
            )
            ->orderBy('events.starts_at')
            ->get()
            ->map(function ($event) use ($minPrices) {
                $minPrice = $minPrices[$event->id] ?? null;
                $numericPrice = $minPrice !== null ? (float) $minPrice : 0;

                return [
                    'id' => $event->id,
                    'slug' => $event->slug,
                    'category' => $event->category_name,
                    'tag' => strtoupper($event->category_name),
                    'title' => $event->title,
                    'date' => Carbon::parse($event->starts_at)->locale('id')->translatedFormat('D, d M Y • H:i').' WIB',
                    'location' => $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                    'organizer' => $event->organizer_name,
                    'price' => $numericPrice > 0 ? 'Rp'.number_format($numericPrice, 0, ',', '.') : 'Gratis',
                    'image' => $event->banner_path ?: '/images/events/tech_hero.jpg',
                ];
            });

        return Inertia::render('Kategori/Index', [
            'initialCategory' => $formattedType,
            'events' => $events,
        ]);
    }
}
