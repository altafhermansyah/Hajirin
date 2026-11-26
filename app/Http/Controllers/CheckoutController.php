<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCheckoutRequest;
use App\Mail\AttendeeTicketMail;
use App\Mail\OrderConfirmedMail;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Ticket;
use App\Models\TicketPrice;
use App\Models\TicketType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
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

        $startDate = Carbon::parse($event->starts_at)->timezone(config('app.timezone'))->locale('id');
        $endDate = Carbon::parse($event->ends_at)->timezone(config('app.timezone'))->locale('id');

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
            'idempotencyKey' => (string) Str::uuid(),
            'orderSuccess' => session('order_success'),
        ]);
    }

    /**
     * Proses transaksi pemesanan tiket dengan idempotency key dan alur pembayaran simulasi 15 menit.
     */
    public function store(StoreCheckoutRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email_verification' => 'Silakan verifikasi alamat email akun Anda dengan kode OTP 6 digit terlebih dahulu sebelum melanjutkan pembayaran tiket.',
            ]);
        }

        $idempotencyKey = ! empty($validated['idempotency_key'])
            ? trim((string) $validated['idempotency_key'])
            : null;

        // 1. Cek idempotency key sebelum memulai transaksi baru
        if ($idempotencyKey !== null) {
            $existingOrder = Order::query()
                ->where('user_id', $user->id)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existingOrder) {
                return $this->redirectForExistingOrder($existingOrder);
            }
        }

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

        try {
            $result = DB::transaction(function () use ($user, $validated, $itemsToProcess, $idempotencyKey): array {
                if ($idempotencyKey !== null) {
                    $existing = Order::query()
                        ->where('user_id', $user->id)
                        ->where('idempotency_key', $idempotencyKey)
                        ->lockForUpdate()
                        ->first();

                    if ($existing) {
                        return [
                            'reused' => true,
                            'order' => $existing,
                        ];
                    }
                }

                $event = Event::where('id', $validated['event_id'])
                    ->where('status', 'PUBLISHED')
                    ->firstOrFail();

                $totalAmount = 0;
                $totalQuantity = 0;
                $processedItems = [];

                // Kunci dan validasi kuota setiap jenis tiket
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

                    // Tahan kuota segera untuk mencegah overselling selama jendela 15 menit
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

                $isFree = $totalAmount <= 0;
                $orderReference = 'HJR-'.date('Ymd').'-'.strtoupper(Str::random(6));
                $attendeePhone = $validated['attendee_phone'] ?? $user->phone;

                $order = Order::create([
                    'user_id' => $user->id,
                    'event_id' => $event->id,
                    'order_reference' => $orderReference,
                    'idempotency_key' => $idempotencyKey,
                    'status' => $isFree ? 'PAID' : 'PENDING',
                    'total_amount' => $totalAmount,
                    'attendee_name' => $validated['attendee_name'],
                    'attendee_email' => $validated['attendee_email'],
                    'attendee_phone' => $attendeePhone,
                    'expires_at' => now()->addMinutes(15),
                    'paid_at' => $isFree ? now() : null,
                ]);

                $createdOrderItems = [];
                foreach ($processedItems as $pItem) {
                    $orderItem = OrderItem::create([
                        'order_id' => $order->id,
                        'ticket_type_id' => $pItem['ticket_type']->id,
                        'ticket_price_id' => $pItem['ticket_price']?->id,
                        'quantity' => $pItem['quantity'],
                        'unit_price' => $pItem['unit_price'],
                    ]);
                    $orderItem->setRelation('ticketType', $pItem['ticket_type']);
                    $createdOrderItems[] = $orderItem;
                }

                $paymentMethod = $isFree
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
                    'status' => $isFree ? 'SUCCESS' : 'PENDING',
                    'amount' => $totalAmount,
                    'paid_at' => $isFree ? now() : null,
                ]);

                if ($isFree) {
                    $orderSuccess = $this->issueTicketsAndNotify(
                        $order,
                        $event,
                        $user,
                        $createdOrderItems,
                        $paymentMethod
                    );

                    return [
                        'reused' => false,
                        'is_free' => true,
                        'order' => $order,
                        'order_success' => $orderSuccess,
                    ];
                }

                return [
                    'reused' => false,
                    'is_free' => false,
                    'order' => $order,
                ];
            });
        } catch (UniqueConstraintViolationException) {
            if ($idempotencyKey !== null) {
                $existingOrder = Order::query()
                    ->where('user_id', $user->id)
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();

                if ($existingOrder) {
                    return $this->redirectForExistingOrder($existingOrder);
                }
            }

            throw ValidationException::withMessages([
                'checkout' => 'Permintaan transaksi ganda terdeteksi. Silakan cek riwayat pesanan Anda.',
            ]);
        }

        if ($result['reused']) {
            return $this->redirectForExistingOrder($result['order']);
        }

        if (! empty($result['is_free'])) {
            return back()->with('order_success', $result['order_success']);
        }

        return redirect()
            ->route('orders.pay', $result['order']->order_reference)
            ->with('success', 'Pesanan berhasil dibuat! Selesaikan pembayaran dalam 15 menit sebelum batas waktu habis.');
    }

    /**
     * Tampilkan halaman instruksi pembayaran simulasi dengan countdown 15 menit.
     */
    public function pay(Request $request, string $orderReference): Response|RedirectResponse
    {
        $user = $request->user();

        $order = Order::query()
            ->with(['event', 'items.ticketType', 'payment'])
            ->where('order_reference', $orderReference)
            ->where('user_id', $user->id)
            ->first();

        if (! $order) {
            return redirect()->route('dashboard')->with('error', 'Pesanan tidak ditemukan.');
        }

        // Lazy-expiration: jika sudah melewati batas 15 menit, kedaluwarsakan & kembalikan kuota seketika
        if ($order->status === 'PENDING' && $order->expires_at && $order->expires_at->isPast()) {
            $this->expireOrderAndRestoreQuota($order->id);
            $order->refresh();
            $order->load(['event', 'items.ticketType', 'payment']);
        }

        if ($order->status === 'PAID') {
            return redirect()
                ->route('my-tickets.show', $order->order_reference)
                ->with('success', 'Pesanan ini sudah lunas. E-tiket Anda siap digunakan.');
        }

        $event = $order->event;
        $payment = $order->payment;
        $method = $payment?->method ?? 'QRIS';
        $totalAmount = (float) $order->total_amount;

        // Data simulasi pembayaran realistis sesuai metode pilihan
        $numericHash = sprintf('%010u', crc32($order->order_reference.($payment?->payment_reference ?? '')));
        $vaNumber = '8808'.substr($numericHash, 0, 10).substr(sprintf('%04u', abs(crc32($order->id)) % 10000), 0, 2);
        $qrisPayload = sprintf(
            '00020126220010ID.HAJIRIN0108%s5303360540%d5802ID5907HAJIRIN62%02d%s',
            strtoupper(substr(md5($order->order_reference), 0, 8)),
            (int) round($totalAmount),
            strlen($order->order_reference),
            $order->order_reference
        );

        $startCarbon = Carbon::parse($event->starts_at)->timezone(config('app.timezone'))->locale('id');
        $expiresAt = $order->expires_at
            ? $order->expires_at->copy()->timezone(config('app.timezone'))
            : now()->addMinutes(15);

        return Inertia::render('Order/Pay', [
            'order' => [
                'id' => $order->id,
                'orderReference' => $order->order_reference,
                'status' => $order->status,
                'totalAmount' => $totalAmount,
                'formattedTotalAmount' => $totalAmount > 0 ? 'Rp'.number_format($totalAmount, 0, ',', '.') : 'Gratis',
                'attendeeName' => $order->attendee_name ?: $user->name,
                'attendeeEmail' => $order->attendee_email ?: $user->email,
                'attendeePhone' => $order->attendee_phone ?: ($user->phone ?: '-'),
                'expiresAtIso' => $expiresAt->toIso8601String(),
                'expiresAtFormatted' => $expiresAt->copy()->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                'createdAtFormatted' => Carbon::parse($order->created_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('d M Y, H:i').' WIB',
            ],
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
                'dateFormatted' => $startCarbon->translatedFormat('l, d F Y • H:i').' WIB',
                'location' => $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                'banner' => $event->banner_path ?: '/images/events/tech_hero.webp',
            ],
            'items' => $order->items->map(function (OrderItem $item): array {
                $unitPrice = (float) $item->unit_price;
                $subtotal = (float) ($item->subtotal ?? ($unitPrice * $item->quantity));

                return [
                    'id' => $item->id,
                    'ticketName' => $item->ticketType?->name ?? 'Tiket Acara',
                    'quantity' => (int) $item->quantity,
                    'formattedUnitPrice' => $unitPrice > 0 ? 'Rp'.number_format($unitPrice, 0, ',', '.') : 'Gratis',
                    'formattedSubtotal' => $subtotal > 0 ? 'Rp'.number_format($subtotal, 0, ',', '.') : 'Gratis',
                ];
            })->values(),
            'payment' => [
                'method' => $method,
                'status' => $payment?->status ?? 'PENDING',
                'paymentReference' => $payment?->payment_reference ?? '-',
                'qrisPayload' => $qrisPayload,
                'merchantName' => 'HAJIRIN OFFICIAL',
                'vaNumber' => $vaNumber,
                'vaBanks' => ['BCA Virtual Account', 'Mandiri Virtual Account', 'BRI Virtual Account', 'BNI Virtual Account'],
                'cardAuthRef' => '3DS-'.strtoupper(substr(md5($order->order_reference), 0, 8)),
            ],
            'serverNowIso' => now()->timezone(config('app.timezone'))->toIso8601String(),
        ]);
    }

    /**
     * Konfirmasi simulasi pembayaran demo -> ubah status PAID, terbitkan tiket, dan kirim email.
     */
    public function confirmPayment(Request $request, string $orderReference): RedirectResponse
    {
        $user = $request->user();

        $outcome = DB::transaction(function () use ($user, $orderReference): array {
            $order = Order::query()
                ->with(['event', 'items.ticketType', 'payment'])
                ->where('order_reference', $orderReference)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (! $order) {
                return ['state' => 'not_found'];
            }

            // Idempoten: jika sudah lunas, langsung arahkan ke e-tiket tanpa menerbitkan tiket ganda
            if ($order->status === 'PAID') {
                return ['state' => 'already_paid', 'order' => $order];
            }

            if ($order->status !== 'PENDING') {
                return ['state' => 'invalid_status', 'order' => $order];
            }

            if ($order->expires_at && $order->expires_at->isPast()) {
                $this->expireLockedOrder($order);

                return ['state' => 'expired', 'order' => $order];
            }

            $now = now();
            $order->forceFill([
                'status' => 'PAID',
                'paid_at' => $now,
            ])->save();

            $paymentMethod = $order->payment?->method ?? 'MOCK';

            if ($order->payment) {
                $order->payment->forceFill([
                    'status' => 'SUCCESS',
                    'paid_at' => $now,
                ])->save();
            } else {
                Payment::create([
                    'order_id' => $order->id,
                    'payment_reference' => 'PAY-'.date('Ymd').'-'.strtoupper(Str::random(8)),
                    'method' => $paymentMethod,
                    'status' => 'SUCCESS',
                    'amount' => $order->total_amount,
                    'paid_at' => $now,
                ]);
            }

            $this->issueTicketsAndNotify(
                $order,
                $order->event,
                $user,
                $order->items->all(),
                $paymentMethod
            );

            return ['state' => 'confirmed', 'order' => $order];
        });

        return match ($outcome['state']) {
            'not_found' => redirect()->route('dashboard')->with('error', 'Pesanan tidak ditemukan.'),
            'already_paid' => redirect()
                ->route('my-tickets.show', $orderReference)
                ->with('success', 'Pembayaran pesanan ini sudah terkonfirmasi sebelumnya.'),
            'expired' => redirect()
                ->route('orders.pay', $orderReference)
                ->with('error', 'Batas waktu pembayaran 15 menit telah habis. Kuota tiket telah dikembalikan.'),
            'invalid_status' => redirect()
                ->route('orders.show', $orderReference)
                ->with('error', 'Pesanan ini sudah tidak dapat dibayar.'),
            default => redirect()
                ->route('my-tickets.show', $orderReference)
                ->with('success', 'Pembayaran berhasil dikonfirmasi! E-tiket resmi Anda kini telah aktif.'),
        };
    }

    /**
     * Batalkan pesanan PENDING oleh pengguna dan kembalikan kuota tiket seketika.
     */
    public function cancelPending(Request $request, string $orderReference): RedirectResponse
    {
        $user = $request->user();

        $cancelled = DB::transaction(function () use ($user, $orderReference): string {
            $order = Order::query()
                ->with(['items.ticketType'])
                ->where('order_reference', $orderReference)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (! $order) {
                return 'not_found';
            }

            if ($order->status !== 'PENDING') {
                return 'not_pending';
            }

            $order->forceFill(['status' => 'CANCELLED'])->save();

            DB::table('payments')
                ->where('order_id', $order->id)
                ->where('status', 'PENDING')
                ->update([
                    'status' => 'FAILED',
                    'updated_at' => now(),
                ]);

            $this->restoreQuotasForOrder($order);

            return 'cancelled';
        });

        if ($cancelled === 'not_found') {
            return redirect()->route('dashboard')->with('error', 'Pesanan tidak ditemukan.');
        }

        if ($cancelled === 'not_pending') {
            return redirect()
                ->route('orders.show', $orderReference)
                ->with('error', 'Hanya pesanan yang masih menunggu pembayaran yang dapat dibatalkan.');
        }

        return redirect()
            ->route('orders.show', $orderReference)
            ->with('success', 'Pesanan berhasil dibatalkan dan kuota tiket telah dikembalikan.');
    }

    /**
     * Arahkan ulang dengan aman ketika idempotency key cocok dengan order yang sudah ada.
     */
    private function redirectForExistingOrder(Order $order): RedirectResponse
    {
        if ($order->status === 'PENDING') {
            return redirect()->route('orders.pay', $order->order_reference);
        }

        if ($order->status === 'PAID') {
            return redirect()->route('my-tickets.show', $order->order_reference);
        }

        return redirect()->route('orders.show', $order->order_reference);
    }

    /**
     * Terbitkan tiket, simpan notifikasi, dan antrekan email konfirmasi setelah pembayaran lunas.
     *
     * @param  list<OrderItem>  $orderItems
     * @return array<string, mixed>
     */
    private function issueTicketsAndNotify(
        Order $order,
        Event $event,
        User $user,
        array $orderItems,
        string $paymentMethod
    ): array {
        $attendeeName = $order->attendee_name ?: $user->name;
        $attendeeEmail = $order->attendee_email ?: $user->email;
        $attendeePhone = $order->attendee_phone ?: $user->phone;

        $allTicketNames = [];
        $tickets = [];
        $totalQuantity = 0;

        foreach ($orderItems as $orderItem) {
            $ticketTypeName = $orderItem->ticketType?->name ?? 'Tiket Acara';
            $qty = (int) $orderItem->quantity;
            $totalQuantity += $qty;
            $allTicketNames[] = $ticketTypeName.' ('.$qty.'x)';

            for ($i = 1; $i <= $qty; $i++) {
                $ticketCode = 'HJR-TKT-'.date('Y').'-'.strtoupper(Str::random(8));

                $ticket = Ticket::create([
                    'order_id' => $order->id,
                    'order_item_id' => $orderItem->id,
                    'holder_user_id' => $user->id,
                    'ticket_code' => $ticketCode,
                    'attendee_name' => $attendeeName,
                    'attendee_email' => $attendeeEmail,
                    'attendee_phone' => $attendeePhone,
                    'status' => 'ACTIVE',
                ]);

                $tickets[] = [
                    'code' => $ticket->ticket_code,
                    'attendee_name' => $ticket->attendee_name,
                    'attendee_email' => $ticket->attendee_email,
                    'attendee_phone' => $ticket->attendee_phone,
                    'ticket_type_name' => $ticketTypeName,
                ];
            }
        }

        DB::table('notifications')->insert([
            'id' => Str::uuid()->toString(),
            'user_id' => $user->id,
            'type' => 'PAYMENT_SUCCESS',
            'title' => 'Pembayaran Tiket Berhasil!',
            'message' => 'Pesanan '.$order->order_reference.' untuk event '.$event->title.' telah berhasil dibayar. E-tiket sudah aktif.',
            'action_url' => '/my-tickets/'.$order->order_reference,
            'created_at' => now(),
        ]);

        $startCarbon = Carbon::parse($event->starts_at)->timezone(config('app.timezone'))->locale('id');
        $endCarbon = Carbon::parse($event->ends_at)->timezone(config('app.timezone'))->locale('id');
        $eventLocation = $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan');
        $totalAmount = (float) $order->total_amount;
        $formattedTotal = $totalAmount > 0 ? 'Rp'.number_format($totalAmount, 0, ',', '.') : 'Gratis';
        $ticketSummary = implode(', ', $allTicketNames);

        $mailPayload = [
            'buyerName' => $user->name,
            'attendeeName' => $attendeeName,
            'orderReference' => $order->order_reference,
            'eventTitle' => $event->title,
            'eventSlug' => $event->slug,
            'eventDate' => $startCarbon->translatedFormat('l, d F Y'),
            'eventTime' => $startCarbon->format('H:i').' - '.$endCarbon->format('H:i').' WIB',
            'eventLocation' => $eventLocation,
            'startsAtIso' => $event->starts_at?->toIso8601String() ?? Carbon::parse($event->starts_at)->toIso8601String(),
            'endsAtIso' => $event->ends_at?->toIso8601String() ?? Carbon::parse($event->ends_at)->toIso8601String(),
            'ticketSummary' => $ticketSummary,
            'totalAmountFormatted' => $formattedTotal,
            'paymentMethod' => $paymentMethod,
            'tickets' => $tickets,
            'ticketUrl' => url('/my-tickets/'.$order->order_reference),
            'orderUrl' => url('/orders/'.$order->order_reference),
        ];

        Mail::to($user->email)->send((new OrderConfirmedMail($mailPayload))->afterCommit());

        $normalizedAttendeeEmail = mb_strtolower(trim((string) $attendeeEmail));
        if ($normalizedAttendeeEmail !== '' && $normalizedAttendeeEmail !== mb_strtolower(trim((string) $user->email))) {
            Mail::to($normalizedAttendeeEmail)->send((new AttendeeTicketMail($mailPayload))->afterCommit());
        }

        return [
            'order_reference' => $order->order_reference,
            'event_title' => $event->title,
            'event_date' => $startCarbon->translatedFormat('l, d F Y'),
            'event_location' => $eventLocation,
            'ticket_name' => $ticketSummary,
            'quantity' => $totalQuantity,
            'total_amount' => $formattedTotal,
            'primary_ticket_code' => $tickets[0]['code'] ?? $order->order_reference,
            'tickets' => $tickets,
        ];
    }

    /**
     * Kedaluwarsakan pesanan PENDING dan kembalikan kuota tiket dalam transaksi terkunci.
     */
    private function expireOrderAndRestoreQuota(string $orderId): void
    {
        DB::transaction(function () use ($orderId): void {
            $lockedOrder = Order::query()
                ->with(['items.ticketType', 'event:id,title'])
                ->whereKey($orderId)
                ->lockForUpdate()
                ->first();

            if (! $lockedOrder || $lockedOrder->status !== 'PENDING' || ! $lockedOrder->expires_at?->isPast()) {
                return;
            }

            $this->expireLockedOrder($lockedOrder);
        });
    }

    /**
     * Kedaluwarsakan objek Order yang sudah dikunci (lockForUpdate) di dalam transaksi aktif.
     */
    private function expireLockedOrder(Order $order): void
    {
        $order->forceFill(['status' => 'EXPIRED'])->save();

        DB::table('payments')
            ->where('order_id', $order->id)
            ->where('status', 'PENDING')
            ->update([
                'status' => 'FAILED',
                'updated_at' => now(),
            ]);

        $this->restoreQuotasForOrder($order);

        DB::table('notifications')->insert([
            'id' => Str::uuid()->toString(),
            'user_id' => $order->user_id,
            'type' => 'PAYMENT_FAILED',
            'title' => 'Pesanan Tiket Kedaluwarsa',
            'message' => "Batas waktu pembayaran pesanan {$order->order_reference} untuk event \"{$order->event?->title}\" telah berakhir. Kuota tiket telah dikembalikan.",
            'action_url' => '/dashboard#pesanan',
            'created_at' => now(),
        ]);
    }

    /**
     * Kembalikan kuota setiap item pesanan ke ticket_types secara aman.
     */
    private function restoreQuotasForOrder(Order $order): void
    {
        foreach ($order->items as $item) {
            if (! $item->ticketType) {
                continue;
            }

            $ticketType = $item->ticketType()->lockForUpdate()->first();
            if (! $ticketType) {
                continue;
            }

            $restoredQuota = min(
                (int) $ticketType->initial_quota,
                (int) $ticketType->quota + (int) $item->quantity
            );

            $ticketType->forceFill(['quota' => $restoredQuota])->save();
        }
    }
}
