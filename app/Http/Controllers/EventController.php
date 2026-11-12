<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EventController extends Controller
{
    public function show(string $slug)
    {
        // 1. Ambil Data Event beserta relasi Kategori dan EO
        $event = DB::table('events')
            ->join('categories', 'events.category_id', '=', 'categories.id')
            ->join('users', 'events.eo_id', '=', 'users.id')
            ->leftJoin('eo_applications', function ($join) {
                $join->on('eo_applications.user_id', '=', 'users.id')
                    ->where('eo_applications.status', '=', 'APPROVED');
            })
            ->select(
                'events.*',
                'categories.name as category_name',
                'categories.slug as category_slug',
                DB::raw('COALESCE(eo_applications.organization_name, users.name) as organizer'),
                'users.email as organizer_email'
            )
            ->where('events.slug', $slug)
            ->where('events.status', 'PUBLISHED')
            ->first();

        abort_if(! $event, 404);

        // 2. Ambil Data Tipe Tiket beserta Harganya (1 harga aktif termurah per tipe tiket)
        $ticketsData = DB::table('ticket_types')
            ->leftJoin('ticket_prices', function ($join) {
                $join->on('ticket_types.id', '=', 'ticket_prices.ticket_type_id')
                    ->where('ticket_prices.status', '=', 'ACTIVE');
            })
            ->where('ticket_types.event_id', $event->id)
            ->where('ticket_types.status', 'ACTIVE')
            ->select(
                'ticket_types.id as id',
                'ticket_types.name as name',
                'ticket_types.description as desc',
                'ticket_types.quota',
                'ticket_prices.id as price_id',
                'ticket_prices.price'
            )
            ->orderBy('ticket_prices.price', 'asc')
            ->get()
            ->unique('id')
            ->values()
            ->map(function ($t) {
                $numericPrice = (float) ($t->price ?? 0);

                return [
                    'id' => $t->id,
                    'priceId' => $t->price_id,
                    'name' => $t->name,
                    'desc' => $t->desc ?: 'Akses penuh ke acara dan seluruh sesi terkait.',
                    'quota' => (int) $t->quota,
                    'rawPrice' => $numericPrice,
                    'price' => $numericPrice > 0 ? 'Rp'.number_format($numericPrice, 0, ',', '.') : 'Gratis',
                    'status' => (int) $t->quota > 0 ? 'Tersedia' : 'Habis',
                ];
            });

        // 3. Hitung harga tiket termurah untuk label "Mulai Dari" tanpa query tambahan
        $minPriceVal = $ticketsData->whereNotNull('priceId')->min('rawPrice');
        $minPrice = $minPriceVal !== null
            ? ((float) $minPriceVal > 0 ? 'Rp'.number_format((float) $minPriceVal, 0, ',', '.') : 'Gratis')
            : 'Gratis';

        // 4. Format Tanggal dan Waktu menggunakan Carbon Indonesia
        $startDate = Carbon::parse($event->starts_at)->locale('id');
        $endDate = Carbon::parse($event->ends_at)->locale('id');

        $formattedDate = $startDate->translatedFormat('l, d F Y');
        $formattedTime = $startDate->format('H:i').' - '.$endDate->format('H:i').' WIB';

        // 5. Syarat dan Ketentuan Acara (gunakan terms_and_conditions dari DB jika diisi oleh EO)
        $customTerms = ! empty($event->terms_and_conditions)
            ? array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $event->terms_and_conditions))))
            : [];

        $terms = count($customTerms) > 0 ? $customTerms : [
            'E-tiket yang telah dibeli sah dan valid hanya untuk 1 orang per barcode/QR code.',
            'Tiket yang sudah dibeli bersifat non-refundable (tidak dapat diuangkan kembali) kecuali acara dibatalkan oleh penyelenggara.',
            'Peserta wajib menunjukkan e-tiket digital atau tercetak beserta kartu identitas (KTP/SIM/Paspor) saat check-in di lokasi.',
            'Dilarang membawa senjata tajam, zat terlarang, atau barang berbahaya ke dalam area acara.',
            'Penyelenggara berhak menolak masuk pengunjung yang tidak mematuhi protokol keamanan atau tata tertib acara.',
        ];

        // 6. Data Event Terkait / Rekomendasi (Subquery harga aktif termurah tanpa N+1 query)
        $minPriceSubquery = DB::table('ticket_prices')
            ->join('ticket_types', 'ticket_types.id', '=', 'ticket_prices.ticket_type_id')
            ->whereColumn('ticket_types.event_id', 'events.id')
            ->where('ticket_types.status', 'ACTIVE')
            ->where('ticket_prices.status', 'ACTIVE')
            ->selectRaw('MIN(ticket_prices.price)');

        $relatedEvents = DB::table('events')
            ->join('categories', 'events.category_id', '=', 'categories.id')
            ->join('users', 'events.eo_id', '=', 'users.id')
            ->where('events.id', '!=', $event->id)
            ->where('events.status', 'PUBLISHED')
            ->select(
                'events.id',
                'events.title',
                'events.slug',
                'events.banner_path as image',
                'events.starts_at',
                'events.venue_name as place',
                'categories.name as category',
                'users.name as organizer'
            )
            ->addSelect(['min_price' => $minPriceSubquery])
            ->limit(4)
            ->get()
            ->map(function ($re) {
                $rawMin = $re->min_price;

                $priceText = $rawMin !== null
                    ? ((float) $rawMin > 0 ? 'Rp'.number_format((float) $rawMin, 0, ',', '.') : 'Gratis')
                    : 'Gratis';

                $cDate = Carbon::parse($re->starts_at)->locale('id');

                return [
                    'id' => $re->id,
                    'title' => $re->title,
                    'slug' => $re->slug,
                    'image' => $re->image,
                    'date' => $cDate->translatedFormat('D, d M Y • H:i').' WIB',
                    'place' => $re->place,
                    'category' => $re->category,
                    'organizer' => $re->organizer,
                    'price' => $priceText,
                ];
            });

        // 7. Format data untuk dikirim ke Inertia React
        $eventData = [
            'id' => $event->id,
            'title' => $event->title,
            'slug' => $event->slug,
            'category' => $event->category_name,
            'category_slug' => $event->category_slug,
            'event_type' => $event->event_type,
            'date' => $formattedDate,
            'time' => $formattedTime,
            'starts_at' => $event->starts_at,
            'ends_at' => $event->ends_at,
            'location' => $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Segera Diumumkan'),
            'fullAddress' => $event->address ?: ($event->event_type === 'ONLINE' ? 'Diselenggarakan secara daring. Tautan meeting akan dikirim via email dan e-tiket.' : '-'),
            'online_url' => $event->online_url,
            'organizer' => $event->organizer,
            'organizer_email' => $event->organizer_email,
            'price' => $minPrice,
            'raw_min_price' => $minPriceVal,
            'image' => $event->banner_path ?: '/images/events/tech_hero.jpg',
            'description' => $event->description,
            'terms' => $terms,
            'tickets' => $ticketsData,
        ];

        return Inertia::render('Event/Detail', [
            'eventData' => $eventData,
            'eventSlug' => $slug,
            'relatedEvents' => $relatedEvents,
        ]);
    }
}
