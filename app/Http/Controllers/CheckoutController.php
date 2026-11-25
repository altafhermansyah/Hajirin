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

        // 2. Ambil semua tipe tiket aktif untuk event ini
        $allTicketTypes = TicketType::where('event_id', $event->id)
            ->where('status', 'ACTIVE')
            ->where('quota', '>', 0)
            ->with(['activePrice'])
            ->get();

        if ($allTicketTypes->isEmpty()) {
            abort(404, 'Maaf, seluruh tiket untuk event ini sudah habis.');
        }

        // Parse query items jika ada pilihan banyak tiket (misal ?items=[{"ticket_id":"...","qty":2}])
        $itemsQuery = $request->query('items');
        $selectedItemsMap = [];
        if (! empty($itemsQuery)) {
            $parsed = is_string($itemsQuery) ? json_decode($itemsQuery, true) : $itemsQuery;
            if (is_array($parsed)) {
                foreach ($parsed as $it) {
                    $tId = $it['ticket_id'] ?? $it['ticket_type_id'] ?? null;
                    $q = (int) ($it['qty'] ?? $it['quantity'] ?? 0);
                    if ($tId && $q > 0) {
                        $selectedItemsMap[$tId] = $q;
                    }
                }
            }
        }

        // Tipe tiket utama (fallback atau dari query ticket_id)
        $primaryTicketType = $ticketTypeId
            ? $allTicketTypes->firstWhere('id', $ticketTypeId) ?? $allTicketTypes->first()
            : $allTicketTypes->first();

        // Jika tidak ada multi items dari query, buat dari ticket_id dan qty
        if (empty($selectedItemsMap)) {
            $maxPerOrder = max(1, (int) ($primaryTicketType->max_per_order ?: 10));
            $maxQty = $primaryTicketType->quota > 0 ? min($primaryTicketType->quota, $maxPerOrder) : 1;
            $selectedItemsMap[$primaryTicketType->id] = max(1, min($requestedQty, $maxQty));
        }

        // Format daftar tiket yang tersedia untuk event ini beserta kuantitas terpilih
        $ticketTypesList = $allTicketTypes->map(function ($tt) use ($selectedItemsMap, $priceId) {
            $ticketPrice = ($priceId && $tt->activePrice?->id === $priceId)
                ? $tt->activePrice
                : $tt->activePrice;

            $unitPrice = (float) ($ticketPrice?->price ?? 0);
            $qty = $selectedItemsMap[$tt->id] ?? 0;
            $maxPerOrder = max(1, (int) ($tt->max_per_order ?: 10));
            $maxQty = min((int) $tt->quota, $maxPerOrder);

            return [
                'id' => $tt->id,
                'price_id' => $ticketPrice?->id,
                'name' => $tt->name,
                'description' => $tt->description,
                'quota' => (int) $tt->quota,
                'max_qty' => $maxQty,
                'unit_price' => $unitPrice,
                'formatted_unit_price' => $unitPrice > 0 ? 'Rp'.number_format($unitPrice, 0, ',', '.') : 'Gratis',
                'selected_quantity' => $qty,
            ];
        });

        // Hitung total harga dan total kuantitas dari semua tiket terpilih
        $totalAmount = 0;
        $totalQuantity = 0;
        foreach ($ticketTypesList as $tItem) {
            if ($tItem['selected_quantity'] > 0) {
                $totalAmount += $tItem['unit_price'] * $tItem['selected_quantity'];
                $totalQuantity += $tItem['selected_quantity'];
            }
        }

        // Untuk backward compatibility dengan prop 'ticket'
        $primaryPrice = $primaryTicketType->activePrice;
        $primaryUnitPrice = (float) ($primaryPrice?->price ?? 0);
        $primaryQty = $selectedItemsMap[$primaryTicketType->id] ?? 1;

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
                'image' => $event->banner_path ?: '/images/events/tech_hero.webp',
                'event_type' => $event->event_type,
            ],
            // Backward compatibility untuk tes dan single selection
            'ticket' => [
                'id' => $primaryTicketType->id,
                'price_id' => $primaryPrice?->id,
                'name' => $primaryTicketType->name,
                'description' => $primaryTicketType->description,
                'quota' => (int) $primaryTicketType->quota,
                'unit_price' => $primaryUnitPrice,
                'formatted_unit_price' => $primaryUnitPrice > 0 ? 'Rp'.number_format($primaryUnitPrice, 0, ',', '.') : 'Gratis',
            ],
            'ticketTypes' => $ticketTypesList,
            'initialQuantity' => $totalQuantity > 0 ? $totalQuantity : $primaryQty,
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

        // Normalisasi items (apakah kirim multi-ticket 'items' atau single ticket 'ticket_type_id')
        $itemsToProcess = [];
        if (! empty($validated['items']) && is_array($validated['items'])) {
            $itemsToProcess = $validated['items'];
        } else {
            $itemsToProcess = [
                [
                    'ticket_type_id' => $validated['ticket_type_id'],
                    'ticket_price_id' => $validated['ticket_price_id'] ?? null,
                    'quantity' => (int) $validated['quantity'],
                ],
            ];
        }

        $orderData = DB::transaction(function () use ($user, $validated, $itemsToProcess) {
            $event = Event::where('id', $validated['event_id'])
                ->where('status', 'PUBLISHED')
                ->firstOrFail();

            $totalAmount = 0;
            $totalQuantity = 0;
            $processedItems = [];

            // 1. Kunci dan validasi kuota setiap jenis tiket
            foreach ($itemsToProcess as $item) {
                $qty = (int) ($item['quantity'] ?? 0);
                if ($qty <= 0) {
                    continue;
                }

                $ticketType = TicketType::where('id', $item['ticket_type_id'])
                    ->where('event_id', $event->id)
                    ->where('status', 'ACTIVE')
                    ->where(fn ($query) => $query->whereNull('sale_start')->orWhere('sale_start', '<=', now()))
                    ->where(fn ($query) => $query->whereNull('sale_end')->orWhere('sale_end', '>=', now()))
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($ticketType->quota < $qty) {
                    throw ValidationException::withMessages([
                        'quantity' => "Maaf, sisa kuota tiket '{$ticketType->name}' tidak mencukupi (tersisa {$ticketType->quota}).",
                    ]);
                }

                $ticketPriceQuery = TicketPrice::where('ticket_type_id', $ticketType->id)
                    ->where('status', 'ACTIVE')
                    ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                    ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()));

                $ticketPrice = ! empty($item['ticket_price_id'])
                    ? $ticketPriceQuery->where('id', $item['ticket_price_id'])->firstOrFail()
                    : $ticketPriceQuery->first();

                $unitPrice = (float) ($ticketPrice?->price ?? 0);
                $subtotal = $unitPrice * $qty;

                // Kurangi kuota
                $ticketType->decrement('quota', $qty);

                $totalAmount += $subtotal;
                $totalQuantity += $qty;

                $processedItems[] = [
                    'ticket_type' => $ticketType,
                    'ticket_price' => $ticketPrice,
                    'unit_price' => $unitPrice,
                    'quantity' => $qty,
                    'subtotal' => $subtotal,
                ];
            }

            if (empty($processedItems)) {
                throw ValidationException::withMessages([
                    'quantity' => 'Pilih minimal satu tiket untuk melanjutkan pemesanan.',
                ]);
            }

            // 2. Buat Order
            $orderReference = 'HJR-'.date('Ymd').'-'.strtoupper(Str::random(6));

            $order = Order::create([
                'user_id' => $user->id,
                'event_id' => $event->id,
                'order_reference' => $orderReference,
                'status' => 'PAID', // Simulasi instan langsung lunas
                'total_amount' => $totalAmount,
                'expires_at' => now()->addMinutes(15),
                'paid_at' => now(),
            ]);

            // 3. Buat OrderItem & Terbitkan E-Tiket per peserta
            $allTicketNames = [];
            $tickets = [];

            foreach ($processedItems as $pItem) {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'ticket_type_id' => $pItem['ticket_type']->id,
                    'ticket_price_id' => $pItem['ticket_price']?->id,
                    'quantity' => $pItem['quantity'],
                    'unit_price' => $pItem['unit_price'],
                ]);

                $allTicketNames[] = $pItem['ticket_type']->name.' ('.$pItem['quantity'].'x)';

                for ($i = 1; $i <= $pItem['quantity']; $i++) {
                    $ticketCode = 'HJR-TKT-'.date('Y').'-'.strtoupper(Str::random(8));

                    $ticket = Ticket::create([
                        'order_id' => $order->id,
                        'order_item_id' => $orderItem->id,
                        'ticket_code' => $ticketCode,
                        'attendee_name' => $validated['attendee_name'],
                        'attendee_email' => $validated['attendee_email'],
                        'attendee_phone' => $validated['attendee_phone'] ?? $user->phone,
                        'status' => 'ACTIVE',
                    ]);

                    $tickets[] = [
                        'code' => $ticket->ticket_code,
                        'attendee_name' => $ticket->attendee_name,
                        'attendee_email' => $ticket->attendee_email,
                        'attendee_phone' => $ticket->attendee_phone,
                        'ticket_type_name' => $pItem['ticket_type']->name,
                    ];
                }
            }

            // 4. Catat Payment
            $paymentMethod = $totalAmount <= 0
                ? 'FREE'
                : match ($validated['payment_method'] ?? 'qris') {
                    'qris' => 'QRIS',
                    'transfer' => 'BANK_TRANSFER',
                    'card' => 'CARD',
                    default => 'MOCK',
                };

            Payment::create([
                'order_id' => $order->id,
                'payment_reference' => 'PAY-'.date('Ymd').'-'.strtoupper(Str::random(8)),
                'method' => $paymentMethod,
                'status' => 'SUCCESS',
                'amount' => $totalAmount,
                'paid_at' => now(),
            ]);

            // 5. Catat Notifikasi untuk Pengguna
            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $user->id,
                'type' => 'PAYMENT_SUCCESS',
                'title' => 'Pembayaran Tiket Berhasil!',
                'message' => 'Pesanan '.$order->order_reference.' untuk event '.$event->title.' telah berhasil dibayar. E-tiket sudah aktif.',
                'action_url' => '/dashboard#tiket',
                'created_at' => now(),
            ]);

            return [
                'order_reference' => $order->order_reference,
                'event_title' => $event->title,
                'event_date' => Carbon::parse($event->starts_at)->locale('id')->translatedFormat('l, d F Y'),
                'event_location' => $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                'ticket_name' => implode(', ', $allTicketNames),
                'quantity' => $totalQuantity,
                'total_amount' => $totalAmount > 0 ? 'Rp'.number_format($totalAmount, 0, ',', '.') : 'Gratis',
                'primary_ticket_code' => $tickets[0]['code'] ?? $order->order_reference,
                'tickets' => $tickets,
            ];
        });

        return back()->with('order_success', $orderData);
    }
}
