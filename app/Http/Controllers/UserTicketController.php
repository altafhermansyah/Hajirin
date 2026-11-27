<?php

namespace App\Http\Controllers;

use App\Models\Refund;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserTicketController extends Controller
{
    /**
     * Tampilkan halaman detail tiket yang dimiliki pengguna beserta QR code dan opsi transfer tiket.
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
            ->where(function ($query) use ($userId): void {
                $query->where('orders.user_id', $userId)
                    ->orWhereExists(function ($sub) use ($userId): void {
                        $sub->select(DB::raw(1))
                            ->from('tickets')
                            ->whereColumn('tickets.order_id', 'orders.id')
                            ->where('tickets.holder_user_id', $userId);
                    });
            })
            ->select(
                'orders.id as order_id',
                'orders.user_id as order_buyer_id',
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
                'events.status as event_status',
                'events.description as event_description',
                'events.terms_and_conditions as event_terms',
                'events.starts_at as event_starts_at',
                'events.ends_at as event_ends_at',
                'events.venue_name',
                'events.city as event_city',
                'events.address as event_address',
                'events.online_url as event_online_url',
                'events.event_type',
                'events.banner_path as event_banner',
                DB::raw('COALESCE(eo_applications.organization_name, organizers.name) as organizer_name'),
                'organizers.email as organizer_email'
            )
            ->first();

        if (! $order) {
            return redirect()->route('dashboard')->with('error', 'Pesanan tiket tidak ditemukan.');
        }

        $isOrderBuyer = $order->order_buyer_id === $userId;

        $ticketsQuery = DB::table('tickets')
            ->join('order_items', 'order_items.id', '=', 'tickets.order_item_id')
            ->join('ticket_types', 'ticket_types.id', '=', 'order_items.ticket_type_id')
            ->where('tickets.order_id', $order->order_id);

        // Penerima transfer hanya melihat tiket yang memang dipegangnya (tidak membocorkan tiket pembeli asli)
        if (! $isOrderBuyer) {
            $ticketsQuery->where('tickets.holder_user_id', $userId);
        }

        $rawTickets = $ticketsQuery
            ->select(
                'tickets.id',
                'tickets.holder_user_id',
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

        $ticketIds = $rawTickets->pluck('id')->all();

        $pendingTransfers = $ticketIds !== []
            ? DB::table('ticket_transfers')
                ->whereIn('ticket_id', $ticketIds)
                ->where('status', 'PENDING')
                ->where('expires_at', '>', now())
                ->get()
                ->keyBy('ticket_id')
            : collect();

        $acceptedTransfers = $ticketIds !== []
            ? DB::table('ticket_transfers')
                ->whereIn('ticket_id', $ticketIds)
                ->where('status', 'ACCEPTED')
                ->orderByDesc('accepted_at')
                ->get()
                ->groupBy('ticket_id')
                ->map->first()
            : collect();

        $hasActiveRefund = Refund::query()
            ->where('order_id', $order->order_id)
            ->whereIn('status', ['PENDING', 'APPROVED', 'COMPLETED'])
            ->exists();

        $eventEndedOrCancelled = $order->event_status === 'CANCELLED'
            || Carbon::parse($order->event_ends_at)->isPast();

        $tickets = $rawTickets->map(function ($t, $index) use (
            $order,
            $userId,
            $pendingTransfers,
            $acceptedTransfers,
            $hasActiveRefund,
            $eventEndedOrCancelled
        ) {
            $unitPrice = (float) $t->unit_price;
            $effectiveHolderId = $t->holder_user_id ?: $order->order_buyer_id;
            $isHeldByMe = $effectiveHolderId === $userId;
            $isTransferredOut = ! $isHeldByMe;

            $pending = $pendingTransfers->get($t->id);
            $accepted = $acceptedTransfers->get($t->id);

            $canTransfer = $isHeldByMe
                && $order->order_status === 'PAID'
                && $t->ticket_status === 'ACTIVE'
                && ! $eventEndedOrCancelled
                && ! $hasActiveRefund
                && $pending === null;

            return [
                'id' => $t->id,
                'ticketNumber' => $index + 1,
                'ticketCode' => $isTransferredOut ? 'DITRANSFER' : $t->ticket_code,
                'attendeeName' => $t->attendee_name,
                'attendeeEmail' => $t->attendee_email,
                'attendeePhone' => $isTransferredOut ? '-' : ($t->attendee_phone ?: '-'),
                'typeName' => $t->ticket_type_name,
                'typeDescription' => $t->ticket_type_description ?: 'Akses masuk sesuai ketentuan tiket.',
                'status' => $t->ticket_status,
                'isHeldByMe' => $isHeldByMe,
                'isTransferredOut' => $isTransferredOut,
                'transferredToName' => $isTransferredOut ? ($accepted?->recipient_name ?? $t->attendee_name) : null,
                'transferredToEmail' => $isTransferredOut ? ($accepted?->recipient_email ?? $t->attendee_email) : null,
                'pendingTransfer' => $pending && $pending->from_user_id === $userId ? [
                    'id' => $pending->id,
                    'recipientName' => $pending->recipient_name,
                    'recipientEmail' => $pending->recipient_email,
                    'expiresAtFormatted' => Carbon::parse($pending->expires_at)
                        ->timezone(config('app.timezone'))
                        ->locale('id')
                        ->translatedFormat('d M Y, H:i').' WIB',
                ] : null,
                'canTransfer' => $canTransfer,
                'checkedInAt' => $t->checked_in_at
                    ? Carbon::parse($t->checked_in_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('d F Y, H:i').' WIB'
                    : null,
                'unitPrice' => $unitPrice,
                'formattedPrice' => $unitPrice > 0 ? 'Rp'.number_format($unitPrice, 0, ',', '.') : 'Gratis',
            ];
        })->values();

        $totalAmount = (float) $order->total_amount;

        $orderData = [
            'orderReference' => $order->order_reference,
            'status' => $order->order_status,
            'totalAmount' => $isOrderBuyer ? $totalAmount : null,
            'formattedTotalAmount' => $isOrderBuyer
                ? ($totalAmount > 0 ? 'Rp'.number_format($totalAmount, 0, ',', '.') : 'Gratis')
                : null,
            'createdAt' => Carbon::parse($order->order_created_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
            'paidAt' => $isOrderBuyer && $order->paid_at
                ? Carbon::parse($order->paid_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('l, d F Y • H:i').' WIB'
                : '-',
            'paymentMethod' => $isOrderBuyer ? ($order->payment_method ?: ($totalAmount <= 0 ? 'FREE' : 'QRIS')) : null,
            'paymentReference' => $isOrderBuyer ? ($order->payment_reference ?: '-') : null,
            'totalTickets' => $tickets->count(),
            'isOrderBuyer' => $isOrderBuyer,
        ];

        $eventData = [
            'id' => $order->event_id,
            'title' => $order->event_title,
            'slug' => $order->event_slug,
            'description' => $order->event_description,
            'terms' => $order->event_terms,
            'startsAt' => $order->event_starts_at,
            'dateFormatted' => Carbon::parse($order->event_starts_at)->timezone(config('app.timezone'))->locale('id')->translatedFormat('l, d F Y').' WIB',
            'timeFormatted' => Carbon::parse($order->event_starts_at)->timezone(config('app.timezone'))->format('H:i').' WIB',
            'location' => $order->venue_name ?: ($order->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
            'city' => $order->event_city ?: '',
            'address' => $order->event_address ?: '',
            'onlineUrl' => $order->order_status === 'PAID' && $order->event_type === 'ONLINE'
                ? $order->event_online_url
                : null,
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
