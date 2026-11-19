<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminOrderController extends Controller
{
    /**
     * Tampilkan direktori seluruh transaksi dan pesanan tiket platform.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $statusFilter = strtoupper((string) $request->input('status', 'ALL'));
        $eventIdFilter = (string) $request->input('event_id', 'ALL');
        $sort = (string) $request->input('sort', 'latest');

        // Statistik Keseluruhan
        $totalOrders = Order::count();
        $paidOrdersCount = Order::where('status', 'PAID')->count();
        $pendingOrdersCount = Order::where('status', 'PENDING')->count();
        $cancelledOrdersCount = Order::whereIn('status', ['CANCELLED', 'EXPIRED'])->count();
        $totalRevenue = (float) Order::where('status', 'PAID')->sum('total_amount');

        $query = Order::query()
            ->with([
                'user:id,name,email,phone',
                'event:id,title,eo_id,slug,venue_name,starts_at',
                'event.eo:id,name',
                'items.ticketType:id,name',
                'payment:id,order_id,method,status,amount,paid_at',
                'tickets:id,order_id,status,ticket_code',
            ]);

        // Filter Pencarian
        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $lower = '%'.mb_strtolower($search).'%';
                $q->whereRaw('LOWER(order_reference) LIKE ?', [$lower])
                    ->orWhereHas('user', function ($uq) use ($lower): void {
                        $uq->whereRaw('LOWER(name) LIKE ?', [$lower])
                            ->orWhereRaw('LOWER(email) LIKE ?', [$lower])
                            ->orWhere('phone', 'LIKE', $lower);
                    })
                    ->orWhereHas('event', function ($eq) use ($lower): void {
                        $eq->whereRaw('LOWER(title) LIKE ?', [$lower]);
                    });
            });
        }

        // Filter Status Pesanan
        if (in_array($statusFilter, ['PAID', 'PENDING', 'CANCELLED', 'EXPIRED'], true)) {
            $query->where('status', $statusFilter);
        }

        // Filter Event
        if ($eventIdFilter !== 'ALL' && $eventIdFilter !== '') {
            $query->where('event_id', $eventIdFilter);
        }

        // Sorting
        match ($sort) {
            'oldest' => $query->orderBy('created_at', 'asc'),
            'highest_amount' => $query->orderByDesc('total_amount'),
            'lowest_amount' => $query->orderBy('total_amount', 'asc'),
            default => $query->orderByDesc('created_at'),
        };

        $paginated = $query->paginate(10)->withQueryString();

        $orders = $paginated->through(function (Order $order) {
            $totalAmount = (float) $order->total_amount;
            $ticketCount = $order->tickets->count();
            $activeTicketCount = $order->tickets->where('status', 'ACTIVE')->count();
            $usedTicketCount = $order->tickets->where('status', 'USED')->count();

            $itemsSummary = $order->items->map(function ($item) {
                return [
                    'ticketTypeName' => $item->ticketType?->name ?? 'Tiket Masuk',
                    'quantity' => $item->quantity,
                    'unitPrice' => (float) $item->unit_price,
                    'unitPriceFormatted' => (float) $item->unit_price > 0 ? 'Rp'.number_format((float) $item->unit_price, 0, ',', '.') : 'Gratis',
                ];
            });

            return [
                'id' => $order->id,
                'orderReference' => $order->order_reference,
                'status' => $order->status,
                'totalAmount' => $totalAmount,
                'totalAmountFormatted' => $totalAmount > 0 ? 'Rp'.number_format($totalAmount, 0, ',', '.') : 'Gratis',
                'createdAt' => $order->created_at?->toISOString(),
                'createdAtFormatted' => Carbon::parse($order->created_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                'paidAtFormatted' => $order->paid_at ? Carbon::parse($order->paid_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB' : null,
                'expiresAtFormatted' => $order->expires_at ? Carbon::parse($order->expires_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB' : null,
                'buyer' => [
                    'id' => $order->user?->id,
                    'name' => $order->user?->name ?? 'Pengguna',
                    'email' => $order->user?->email ?? '-',
                    'phone' => $order->user?->phone ?? '-',
                ],
                'event' => [
                    'id' => $order->event?->id,
                    'title' => $order->event?->title ?? 'Event Tidak Ditemukan',
                    'organizerName' => $order->event?->eo?->name ?? '-',
                    'venueName' => $order->event?->venue_name ?? '-',
                    'eventDateFormatted' => $order->event?->starts_at ? Carbon::parse($order->event->starts_at)->locale('id')->translatedFormat('d M Y') : '-',
                ],
                'payment' => [
                    'method' => $order->payment?->method ?? 'MOCK',
                    'status' => $order->payment?->status ?? ($order->status === 'PAID' ? 'SUCCESS' : 'PENDING'),
                ],
                'ticketSummary' => [
                    'totalTickets' => $ticketCount,
                    'activeTickets' => $activeTicketCount,
                    'usedTickets' => $usedTicketCount,
                ],
                'items' => $itemsSummary,
                'tickets' => $order->tickets->map(function (Ticket $ticket) {
                    return [
                        'id' => $ticket->id,
                        'ticketCode' => $ticket->ticket_code,
                        'status' => $ticket->status,
                    ];
                }),
            ];
        });

        // List event untuk dropdown filter
        $eventOptions = Event::select('id', 'title')
            ->orderBy('title')
            ->limit(50)
            ->get();

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'stats' => [
                'totalOrders' => $totalOrders,
                'paidOrdersCount' => $paidOrdersCount,
                'pendingOrdersCount' => $pendingOrdersCount,
                'cancelledOrdersCount' => $cancelledOrdersCount,
                'totalRevenueFormatted' => 'Rp'.number_format($totalRevenue, 0, ',', '.'),
            ],
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'event_id' => $eventIdFilter,
                'sort' => $sort,
            ],
            'eventOptions' => $eventOptions,
        ]);
    }

    /**
     * Konfirmasi pembayaran manual pesanan menjadi PAID.
     */
    public function markAsPaid(Request $request, string $id): RedirectResponse
    {
        $admin = $request->user();

        DB::transaction(function () use ($id): void {
            $order = Order::with('tickets', 'payment')->where('id', $id)->lockForUpdate()->firstOrFail();

            if ($order->status === 'PAID') {
                throw ValidationException::withMessages([
                    'order' => 'Pesanan ini sudah berstatus LUNAS (PAID).',
                ]);
            }

            $order->forceFill([
                'status' => 'PAID',
                'paid_at' => now(),
            ])->save();

            // Perbarui payment jika ada
            if ($order->payment) {
                $order->payment->forceFill([
                    'status' => 'SUCCESS',
                    'paid_at' => now(),
                ])->save();
            } else {
                Payment::create([
                    'order_id' => $order->id,
                    'payment_reference' => 'ADMIN-CONFIRM-'.strtoupper(Str::random(6)),
                    'method' => 'MANUAL_VERIFIED',
                    'status' => 'SUCCESS',
                    'amount' => $order->total_amount,
                    'paid_at' => now(),
                ]);
            }

            // Pastikan tiket berstatus ACTIVE
            foreach ($order->tickets as $ticket) {
                if ($ticket->status !== 'USED') {
                    $ticket->forceFill(['status' => 'ACTIVE'])->save();
                }
            }

            // Kirim notifikasi
            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $order->user_id,
                'type' => 'PAYMENT_SUCCESS',
                'title' => 'Pembayaran Tiket Berhasil Dikonfirmasi!',
                'message' => "Pembayaran untuk pesanan #{$order->order_reference} telah diverifikasi dan dikonfirmasi oleh Administrator. E-Tiket Anda kini aktif.",
                'action_url' => '/dashboard',
                'created_at' => now(),
            ]);
        });

        return back()->with('success', 'Pesanan berhasil dikonfirmasi sebagai LUNAS (PAID) dan e-tiket telah diaktifkan.');
    }
}
