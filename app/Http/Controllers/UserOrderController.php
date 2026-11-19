<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            ->leftJoin('payments', 'payments.order_id', '=', 'orders.id')
            ->where('orders.order_reference', $orderReference)
            ->where('orders.user_id', $userId)
            ->select(
                'orders.id as order_id',
                'orders.order_reference',
                'orders.status as order_status',
                'orders.total_amount',
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
                'organizers.name as organizer_name'
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

        // Cek apakah ada tiket aktif yang bisa dilihat
        $ticketCount = DB::table('tickets')
            ->where('order_id', $order->order_id)
            ->count();

        $orderData = [
            'id' => $order->order_id,
            'orderReference' => $order->order_reference,
            'status' => $order->order_status,
            'totalAmount' => $totalAmount,
            'formattedTotalAmount' => $totalAmount > 0 ? 'Rp'.number_format($totalAmount, 0, ',', '.') : 'Gratis',
            'createdAt' => Carbon::parse($order->order_created_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
            'paidAt' => $order->paid_at ? Carbon::parse($order->paid_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB' : '-',
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
            'dateFormatted' => Carbon::parse($order->event_starts_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
            'location' => $order->venue_name ?: ($order->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
            'address' => $order->event_address ?: '',
            'eventType' => $order->event_type,
            'banner' => $order->event_banner ?: '/images/events/tech_hero.jpg',
            'organizer' => $order->organizer_name,
        ];

        return Inertia::render('Order/Detail', [
            'order' => $orderData,
            'event' => $eventData,
            'items' => $items,
        ]);
    }
}
