<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRefundRequest;
use App\Models\Order;
use App\Models\Refund;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserOrderController extends Controller
{
    /**
     * Tampilkan halaman detail transaksi pemesanan / invoice resmi.
     */
    public function show(Request $request, string $orderReference): Response|RedirectResponse
    {
        $userId = $request->user()->id;

        $order = DB::table('orders')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->join('users as organizers', 'organizers.id', '=', 'events.eo_id')
            ->leftJoin('eo_applications', function ($join): void {
                $join->on('eo_applications.user_id', '=', 'organizers.id')
                    ->where('eo_applications.status', '=', 'APPROVED');
            })
            ->leftJoin('payments', 'payments.order_id', '=', 'orders.id')
            ->where('orders.order_reference', $orderReference)
            ->where('orders.user_id', $userId)
            ->select(
                'orders.id as order_id',
                'orders.order_reference',
                'orders.status as order_status',
                'orders.total_amount',
                'orders.expires_at',
                'orders.created_at as order_created_at',
                'orders.paid_at',
                'payments.method as payment_method',
                'payments.payment_reference',
                'events.id as event_id',
                'events.title as event_title',
                'events.slug as event_slug',
                'events.starts_at as event_starts_at',
                'events.venue_name',
                'events.address as event_address',
                'events.event_type',
                'events.banner_path as event_banner',
                DB::raw('COALESCE(eo_applications.organization_name, organizers.name) as organizer_name')
            )
            ->first();

        if (! $order) {
            return redirect()->route('dashboard')->with('error', 'Detail transaksi pesanan tidak ditemukan.');
        }

        // Ambil item tiket yang dipesan
        $items = DB::table('order_items')
            ->join('ticket_types', 'ticket_types.id', '=', 'order_items.ticket_type_id')
            ->where('order_items.order_id', $order->order_id)
            ->select(
                'order_items.id',
                'ticket_types.name as ticket_name',
                'order_items.quantity',
                'order_items.unit_price',
                'order_items.subtotal'
            )
            ->get()
            ->map(function ($it) {
                $unitPrice = (float) $it->unit_price;
                $subtotal = (float) $it->subtotal;

                return [
                    'id' => $it->id,
                    'ticketName' => $it->ticket_name,
                    'quantity' => (int) $it->quantity,
                    'unitPrice' => $unitPrice,
                    'formattedUnitPrice' => $unitPrice > 0 ? 'Rp'.number_format($unitPrice, 0, ',', '.') : 'Gratis',
                    'subtotal' => $subtotal,
                    'formattedSubtotal' => $subtotal > 0 ? 'Rp'.number_format($subtotal, 0, ',', '.') : 'Gratis',
                ];
            });

        $totalAmount = (float) $order->total_amount;
        $totalTickets = $items->sum('quantity');

        // Cek jumlah tiket, apakah sudah check-in, atau sudah ditransfer ke pengguna lain
        $ticketSummary = DB::table('tickets')
            ->where('order_id', $order->order_id)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("COUNT(CASE WHEN status = 'USED' THEN 1 END) as used_count")
            ->selectRaw('COUNT(CASE WHEN holder_user_id IS NOT NULL AND holder_user_id <> ? THEN 1 END) as transferred_count', [$userId])
            ->first();

        $ticketCount = (int) ($ticketSummary->total ?? 0);
        $hasUsedTickets = ((int) ($ticketSummary->used_count ?? 0)) > 0;
        $hasTransferredTickets = ((int) ($ticketSummary->transferred_count ?? 0)) > 0;

        $hasPendingTransfers = DB::table('ticket_transfers')
            ->join('tickets', 'tickets.id', '=', 'ticket_transfers.ticket_id')
            ->where('tickets.order_id', $order->order_id)
            ->where('ticket_transfers.status', 'PENDING')
            ->where('ticket_transfers.expires_at', '>', now())
            ->exists();

        $latestRefund = Refund::query()
            ->where('order_id', $order->order_id)
            ->latest('requested_at')
            ->first();

        $hasActiveRefund = $latestRefund !== null
            && in_array($latestRefund->status, ['PENDING', 'APPROVED', 'COMPLETED'], true);

        $refundBlockedReason = null;
        if ($hasActiveRefund) {
            $refundBlockedReason = null;
        } elseif ($order->order_status !== 'PAID') {
            $refundBlockedReason = 'Hanya pesanan yang sudah lunas yang dapat diajukan pengembalian dana.';
        } elseif ($totalAmount <= 0) {
            $refundBlockedReason = 'Pesanan tiket gratis tidak memerlukan pengembalian dana.';
        } elseif ($hasUsedTickets) {
            $refundBlockedReason = 'Tiket pada pesanan ini sudah digunakan untuk check-in sehingga tidak dapat di-refund.';
        } elseif ($hasTransferredTickets) {
            $refundBlockedReason = 'Tiket pada pesanan ini sudah ditransfer ke pengguna lain sehingga tidak dapat di-refund.';
        } elseif ($hasPendingTransfers) {
            $refundBlockedReason = 'Pesanan ini memiliki undangan transfer tiket aktif. Batalkan undangan transfer terlebih dahulu sebelum mengajukan refund.';
        }

        $canRequestRefund = ! $hasActiveRefund && $refundBlockedReason === null;

        $refundData = $latestRefund ? [
            'id' => $latestRefund->id,
            'status' => $latestRefund->status,
            'amountFormatted' => 'Rp'.number_format((float) $latestRefund->amount, 0, ',', '.'),
            'reason' => $latestRefund->reason,
            'resolutionNote' => $latestRefund->resolution_note,
            'requestedAtFormatted' => Carbon::parse($latestRefund->requested_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('d M Y, H:i').' WIB',
            'processedAtFormatted' => $latestRefund->processed_at
                ? Carbon::parse($latestRefund->processed_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                : null,
        ] : null;

        $expiresAt = $order->expires_at ? Carbon::parse($order->expires_at)->timezone(config('app.timezone')) : null;

        $orderData = [
            'id' => $order->order_id,
            'orderReference' => $order->order_reference,
            'status' => $order->order_status,
            'isPending' => $order->order_status === 'PENDING' && ($expiresAt === null || $expiresAt->isFuture()),
            'expiresAtFormatted' => $expiresAt
                ? $expiresAt->copy()->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                : null,
            'totalAmount' => $totalAmount,
            'formattedTotalAmount' => $totalAmount > 0 ? 'Rp'.number_format($totalAmount, 0, ',', '.') : 'Gratis',
            'createdAt' => Carbon::parse($order->order_created_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
            'paidAt' => $order->paid_at ? Carbon::parse($order->paid_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('l, d F Y • H:i').' WIB' : '-',
            'paymentMethod' => $order->payment_method ?: ($totalAmount <= 0 ? 'FREE' : 'QRIS'),
            'paymentReference' => $order->payment_reference ?: '-',
            'totalTickets' => $totalTickets,
            'hasTickets' => $ticketCount > 0,
            'buyerName' => $request->user()->name,
            'buyerEmail' => $request->user()->email,
            'buyerPhone' => $request->user()->phone ?: '-',
        ];

        $eventData = [
            'id' => $order->event_id,
            'title' => $order->event_title,
            'slug' => $order->event_slug,
            'startsAt' => $order->event_starts_at,
            'dateFormatted' => Carbon::parse($order->event_starts_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
            'location' => $order->venue_name ?: ($order->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
            'address' => $order->event_address ?: '',
            'eventType' => $order->event_type,
            'banner' => $order->event_banner ?: '/images/events/tech_hero.webp',
            'organizer' => $order->organizer_name,
        ];

        return Inertia::render('Order/Detail', [
            'order' => $orderData,
            'event' => $eventData,
            'items' => $items,
            'refund' => $refundData,
            'canRequestRefund' => $canRequestRefund,
            'refundBlockedReason' => $refundBlockedReason,
        ]);
    }

    /**
     * Ajukan permohonan pengembalian dana (refund) untuk pesanan milik pengguna.
     */
    public function requestRefund(StoreRefundRequest $request, string $orderReference): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        DB::transaction(function () use ($user, $orderReference, $validated): void {
            $order = Order::query()
                ->where('order_reference', $orderReference)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($order->status !== 'PAID') {
                throw ValidationException::withMessages([
                    'refund' => 'Hanya pesanan berstatus lunas (PAID) yang dapat diajukan pengembalian dana.',
                ]);
            }

            if ((float) $order->total_amount <= 0) {
                throw ValidationException::withMessages([
                    'refund' => 'Pesanan tiket gratis tidak dapat diajukan pengembalian dana.',
                ]);
            }

            $hasUsedTicket = DB::table('tickets')
                ->where('order_id', $order->id)
                ->where('status', 'USED')
                ->exists();

            if ($hasUsedTicket) {
                throw ValidationException::withMessages([
                    'refund' => 'Pengembalian dana tidak dapat diajukan karena tiket pada pesanan ini sudah digunakan untuk check-in.',
                ]);
            }

            $hasTransferredTicket = DB::table('tickets')
                ->where('order_id', $order->id)
                ->whereNotNull('holder_user_id')
                ->where('holder_user_id', '<>', $user->id)
                ->exists();

            if ($hasTransferredTicket) {
                throw ValidationException::withMessages([
                    'refund' => 'Pengembalian dana tidak dapat diajukan karena tiket pada pesanan ini telah ditransfer ke pengguna lain.',
                ]);
            }

            $hasPendingTransfer = DB::table('ticket_transfers')
                ->join('tickets', 'tickets.id', '=', 'ticket_transfers.ticket_id')
                ->where('tickets.order_id', $order->id)
                ->where('ticket_transfers.status', 'PENDING')
                ->where('ticket_transfers.expires_at', '>', now())
                ->exists();

            if ($hasPendingTransfer) {
                throw ValidationException::withMessages([
                    'refund' => 'Pengembalian dana tidak dapat diajukan saat ada undangan transfer tiket yang masih aktif. Batalkan transfer terlebih dahulu.',
                ]);
            }

            $hasExistingRefund = Refund::query()
                ->where('order_id', $order->id)
                ->whereIn('status', ['PENDING', 'APPROVED', 'COMPLETED'])
                ->exists();

            if ($hasExistingRefund) {
                throw ValidationException::withMessages([
                    'refund' => 'Pesanan ini sudah memiliki pengajuan pengembalian dana yang aktif atau telah disetujui.',
                ]);
            }

            $refund = new Refund;
            $refund->forceFill([
                'order_id' => $order->id,
                'requested_by' => $user->id,
                'amount' => $order->total_amount,
                'reason' => $validated['reason'],
                'status' => 'PENDING',
                'requested_at' => now(),
            ])->save();
        });

        return back()->with('success', 'Permohonan pengembalian dana berhasil dikirim dan sedang menunggu peninjauan Administrator.');
    }
}
