<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCheckoutRequest;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Ticket;
use App\Models\TicketPrice;
use App\Models\TicketType;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    /**
     * Tampilkan halaman checkout pemesanan tiket.
     */
    public function show(Request $request): Response
    {
        $eventSlug = $request->query('event');
        $ticketTypeId = $request->query('ticket_id');
        $priceId = $request->query('price_id');
        $requestedQty = (int) $request->query('qty', 1);

        // 1. Cari data event yang berstatus PUBLISHED dari database
        $event = Event::with('category')
            ->where('slug', $eventSlug)
            ->where('status', 'PUBLISHED')
            ->firstOrFail();

        // 2. Cari tipe tiket aktif yang masih memiliki kuota
        $ticketTypeQuery = TicketType::where('event_id', $event->id)
            ->where('status', 'ACTIVE')
            ->where('quota', '>', 0);

        $ticketType = $ticketTypeId
            ? $ticketTypeQuery->where('id', $ticketTypeId)->firstOrFail()
            : $ticketTypeQuery->firstOrFail();

        // 3. Ambil harga tiket aktif sesuai price_id (jika ada)
        $ticketPriceQuery = TicketPrice::where('ticket_type_id', $ticketType->id)
            ->where('status', 'ACTIVE');

        $ticketPrice = $priceId
            ? $ticketPriceQuery->where('id', $priceId)->firstOrFail()
            : $ticketPriceQuery->first();

        $unitPrice = (float) ($ticketPrice?->price ?? 0);
        $maxQty = $ticketType->quota > 0 ? min($ticketType->quota, 5) : 1;
        $quantity = max(1, min($requestedQty, $maxQty));
        $totalAmount = $unitPrice * $quantity;

        $startDate = Carbon::parse($event->starts_at)->locale('id');
        $endDate = Carbon::parse($event->ends_at)->locale('id');

        return Inertia::render('Event/Checkout', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
                'category' => $event->category?->name ?? 'Acara',
                'date' => $startDate->translatedFormat('l, d F Y'),
                'time' => $startDate->format('H:i').' - '.$endDate->format('H:i').' WIB',
                'location' => $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                'address' => $event->address ?: '',
                'image' => $event->banner_path ?: '/images/events/tech_hero.jpg',
                'event_type' => $event->event_type,
            ],
            'ticket' => [
                'id' => $ticketType->id,
                'price_id' => $ticketPrice?->id,
                'name' => $ticketType->name,
                'description' => $ticketType->description,
                'quota' => (int) $ticketType->quota,
                'unit_price' => $unitPrice,
                'formatted_unit_price' => $unitPrice > 0 ? 'Rp'.number_format($unitPrice, 0, ',', '.') : 'Gratis',
            ],
            'initialQuantity' => $quantity,
            'total_amount' => $totalAmount,
            'formatted_total_amount' => $totalAmount > 0 ? 'Rp'.number_format($totalAmount, 0, ',', '.') : 'Gratis',
            'orderSuccess' => session('order_success'),
        ]);
    }

    /**
     * Proses transaksi pemesanan tiket dan simpan ke database.
     */
    public function store(StoreCheckoutRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = $request->user();

        $orderData = DB::transaction(function () use ($user, $validated) {
            // 1. Ambil Event yang berstatus PUBLISHED
            $event = Event::where('id', $validated['event_id'])
                ->where('status', 'PUBLISHED')
                ->firstOrFail();

            // 2. Kunci (lock) baris ticket_type yang ACTIVE dan dalam periode penjualan
            $ticketType = TicketType::where('id', $validated['ticket_type_id'])
                ->where('event_id', $event->id)
                ->where('status', 'ACTIVE')
                ->where(fn ($query) => $query->whereNull('sale_start')->orWhere('sale_start', '<=', now()))
                ->where(fn ($query) => $query->whereNull('sale_end')->orWhere('sale_end', '>=', now()))
                ->lockForUpdate()
                ->firstOrFail();

            if ($ticketType->quota < $validated['quantity']) {
                throw ValidationException::withMessages([
                    'quantity' => 'Maaf, sisa kuota tiket tidak mencukupi untuk jumlah tiket yang dipesan.',
                ]);
            }

            // 3. Ambil Harga Tiket yang ACTIVE dan dalam periode berlaku
            $ticketPriceQuery = TicketPrice::where('ticket_type_id', $ticketType->id)
                ->where('status', 'ACTIVE')
                ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()));

            $ticketPrice = ! empty($validated['ticket_price_id'])
                ? $ticketPriceQuery->where('id', $validated['ticket_price_id'])->firstOrFail()
                : $ticketPriceQuery->first();

            $unitPrice = (float) ($ticketPrice?->price ?? 0);
            $totalAmount = $unitPrice * $validated['quantity'];

            // 4. Kurangi kuota tiket
            $ticketType->decrement('quota', $validated['quantity']);

            // 5. Buat Order
            $orderReference = 'HJR-'.date('Ymd').'-'.strtoupper(Str::random(6));

            $order = Order::create([
                'user_id' => $user->id,
                'event_id' => $event->id,
                'order_reference' => $orderReference,
                'status' => 'PAID', // Di alur simulasi instan ini, langsung sukses terbayar
                'total_amount' => $totalAmount,
                'expires_at' => now()->addMinutes(15),
                'paid_at' => now(),
            ]);

            // 6. Buat Order Item (subtotal otomatis terisi oleh generated column PostgreSQL)
            $orderItem = OrderItem::create([
                'order_id' => $order->id,
                'ticket_type_id' => $ticketType->id,
                'ticket_price_id' => $ticketPrice?->id,
                'quantity' => $validated['quantity'],
                'unit_price' => $unitPrice,
            ]);

            // 7. Terbitkan E-Tiket per peserta sesuai kuantitas
            $tickets = [];
            for ($i = 1; $i <= $validated['quantity']; $i++) {
                $ticketCode = 'HJR-TKT-'.date('Y').'-'.strtoupper(Str::random(8));

                $ticket = Ticket::create([
                    'order_id' => $order->id,
                    'order_item_id' => $orderItem->id,
                    'ticket_code' => $ticketCode,
                    'attendee_name' => $validated['attendee_name'],
                    'attendee_email' => $validated['attendee_email'],
                    'status' => 'ACTIVE',
                ]);

                $tickets[] = [
                    'code' => $ticket->ticket_code,
                    'attendee_name' => $ticket->attendee_name,
                    'attendee_email' => $ticket->attendee_email,
                ];
            }

            // 8. Catat Payment
            Payment::create([
                'order_id' => $order->id,
                'method' => 'MOCK',
                'status' => 'SUCCESS',
                'amount' => $totalAmount,
                'paid_at' => now(),
            ]);

            // 9. Catat Notifikasi untuk Pengguna
            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $user->id,
                'type' => 'PAYMENT_SUCCESS',
                'title' => 'Pembayaran Tiket Berhasil!',
                'message' => 'Pesanan '.$order->order_reference.' untuk event '.$event->title.' telah berhasil dibayar. E-tiket sudah aktif.',
                'created_at' => now(),
            ]);

            return [
                'order_reference' => $order->order_reference,
                'event_title' => $event->title,
                'event_date' => Carbon::parse($event->starts_at)->locale('id')->translatedFormat('l, d F Y'),
                'event_location' => $event->venue_name ?: 'Online Event',
                'ticket_name' => $ticketType->name,
                'quantity' => $validated['quantity'],
                'total_amount' => $totalAmount > 0 ? 'Rp'.number_format($totalAmount, 0, ',', '.') : 'Gratis',
                'tickets' => $tickets,
            ];
        });

        return back()->with('order_success', $orderData);
    }
}
