<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserTicketController extends Controller
{
    /**
     * Tampilkan halaman detail tiket yang telah dibeli beserta semua tiket individual dan kode QR.
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
                'events.description as event_description',
                'events.terms_and_conditions as event_terms',
                'events.starts_at as event_starts_at',
                'events.ends_at as event_ends_at',
                'events.venue_name',
                'events.city as event_city',
                'events.address as event_address',
                'events.event_type',
                'events.banner_path as event_banner',
                'organizers.name as organizer_name',
                'organizers.email as organizer_email'
            )
            ->first();

        if (! $order) {
            return redirect()->route('dashboard')->with('error', 'Pesanan tiket tidak ditemukan.');
        }

        // Ambil semua tiket individual untuk pesanan ini
        $rawTickets = DB::table('tickets')
            ->join('order_items', 'order_items.id', '=', 'tickets.order_item_id')
            ->join('ticket_types', 'ticket_types.id', '=', 'order_items.ticket_type_id')
            ->where('tickets.order_id', $order->order_id)
            ->select(
                'tickets.id',
                'tickets.ticket_code',
                'tickets.attendee_name',
                'tickets.attendee_email',
                'tickets.attendee_phone',
                'tickets.status as ticket_status',
                'tickets.checked_in_at',
                'tickets.created_at',
                'ticket_types.name as ticket_type_name',
                'ticket_types.description as ticket_type_description',
                'order_items.unit_price'
            )
            ->orderBy('tickets.created_at')
            ->get();

        $tickets = $rawTickets->map(function ($t, $index) {
            $unitPrice = (float) $t->unit_price;

            return [
                'id' => $t->id,
                'ticketNumber' => $index + 1,
                'ticketCode' => $t->ticket_code,
                'attendeeName' => $t->attendee_name,
                'attendeeEmail' => $t->attendee_email,
                'attendeePhone' => $t->attendee_phone ?: '-',
                'typeName' => $t->ticket_type_name,
                'typeDescription' => $t->ticket_type_description ?: 'Akses masuk sesuai ketentuan tiket.',
                'status' => $t->ticket_status,
                'checkedInAt' => $t->checked_in_at ? Carbon::parse($t->checked_in_at)->locale('id')->translatedFormat('d F Y, H:i').' WIB' : null,
                'unitPrice' => $unitPrice,
                'formattedPrice' => $unitPrice > 0 ? 'Rp'.number_format($unitPrice, 0, ',', '.') : 'Gratis',
            ];
        });

        $totalAmount = (float) $order->total_amount;

        $orderData = [
            'orderReference' => $order->order_reference,
            'status' => $order->order_status,
            'totalAmount' => $totalAmount,
            'formattedTotalAmount' => $totalAmount > 0 ? 'Rp'.number_format($totalAmount, 0, ',', '.') : 'Gratis',
            'createdAt' => Carbon::parse($order->order_created_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
            'paidAt' => $order->paid_at ? Carbon::parse($order->paid_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB' : '-',
            'paymentMethod' => $order->payment_method ?: ($totalAmount <= 0 ? 'FREE' : 'QRIS'),
            'paymentReference' => $order->payment_reference ?: '-',
            'totalTickets' => $tickets->count(),
        ];

        $eventData = [
            'id' => $order->event_id,
            'title' => $order->event_title,
            'slug' => $order->event_slug,
            'description' => $order->event_description,
            'terms' => $order->event_terms,
            'startsAt' => $order->event_starts_at,
            'dateFormatted' => Carbon::parse($order->event_starts_at)->locale('id')->translatedFormat('l, d F Y').' WIB',
            'timeFormatted' => Carbon::parse($order->event_starts_at)->format('H:i').' WIB',
            'location' => $order->venue_name ?: ($order->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
            'city' => $order->event_city ?: '',
            'address' => $order->event_address ?: '',
            'eventType' => $order->event_type,
            'banner' => $order->event_banner ?: '/images/events/tech_hero.webp',
            'organizer' => $order->organizer_name,
            'organizerEmail' => $order->organizer_email,
        ];

        return Inertia::render('Ticket/Detail', [
            'order' => $orderData,
            'event' => $eventData,
            'tickets' => $tickets,
        ]);
    }
}
