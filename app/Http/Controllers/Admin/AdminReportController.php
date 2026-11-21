<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminReportController extends Controller
{
    /**
     * Persentase komisi bagi hasil platform dari omset penjualan tiket (5%).
     */
    public const PLATFORM_FEE_PERCENTAGE = 0.05;

    /**
     * Tampilkan halaman utama Laporan & Keuangan Platform.
     */
    public function index(Request $request): Response
    {
        $reportData = $this->calculateFinancialData($request);

        $categories = Category::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Admin/Reports/Index', array_merge($reportData, [
            'categories' => $categories,
            'filters' => [
                'period' => $request->query('period', 'all'),
                'category_id' => $request->query('category_id', ''),
                'search' => $request->query('search', ''),
            ],
        ]));
    }

    /**
     * Tampilkan halaman khusus cetak / ekspor ke format PDF.
     */
    public function exportPdf(Request $request): Response
    {
        $reportData = $this->calculateFinancialData($request);

        return Inertia::render('Admin/Reports/Print', array_merge($reportData, [
            'generatedAtFormatted' => now()->locale('id')->translatedFormat('d F Y, H:i').' WIB',
            'generatedBy' => $request->user()->name,
            'periodLabel' => $this->getPeriodLabel($request->query('period', 'all')),
        ]));
    }

    /**
     * Hitung metrik keuangan, rekapitulasi event, dan riwayat transaksi.
     *
     * @return array<string, mixed>
     */
    private function calculateFinancialData(Request $request): array
    {
        $period = $request->query('period', 'all');
        $categoryId = $request->query('category_id');
        $search = trim((string) $request->query('search', ''));

        // Filter tanggal pada query orders
        $dateFilterCallback = function (Builder $query, string $dateColumn) use ($period): void {
            if ($period === 'this_month') {
                $query->whereBetween($dateColumn, [now()->startOfMonth(), now()->endOfMonth()]);
            } elseif ($period === 'last_30_days') {
                $query->where($dateColumn, '>=', now()->subDays(30));
            } elseif ($period === 'this_year') {
                $query->whereBetween($dateColumn, [now()->startOfYear(), now()->endOfYear()]);
            }
        };

        // 1. Ringkasan Keseluruhan (KPI Global)
        $globalOrderStats = DB::table('orders')
            ->where('status', 'PAID')
            ->when($period !== 'all', fn (Builder $q) => $dateFilterCallback($q, 'orders.paid_at'))
            ->selectRaw('COALESCE(SUM(total_amount), 0) as gross_revenue')
            ->selectRaw('COUNT(id) as total_paid_orders')
            ->first();

        $grossRevenue = (float) ($globalOrderStats->gross_revenue ?? 0);
        $totalPaidOrders = (int) ($globalOrderStats->total_paid_orders ?? 0);

        // Total Tiket Terjual
        $totalTicketsSold = (int) DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->where('orders.status', 'PAID')
            ->whereIn('tickets.status', ['ACTIVE', 'USED'])
            ->when($period !== 'all', fn (Builder $q) => $dateFilterCallback($q, 'orders.paid_at'))
            ->count('tickets.id');

        // Total Pengembalian Dana (Refund) yang Disetujui
        $refundStats = DB::table('refunds')
            ->where('status', 'APPROVED')
            ->when($period !== 'all', fn (Builder $q) => $dateFilterCallback($q, 'refunds.processed_at'))
            ->selectRaw('COALESCE(SUM(amount), 0) as total_refunds')
            ->selectRaw('COUNT(id) as total_refund_count')
            ->first();

        $totalRefunds = (float) ($refundStats->total_refunds ?? 0);
        $totalRefundCount = (int) ($refundStats->total_refund_count ?? 0);

        // Perhitungan Komisi Platform & Hak Bersih EO
        $netGmv = max(0.0, $grossRevenue - $totalRefunds);
        $platformCommission = round($netGmv * self::PLATFORM_FEE_PERCENTAGE, 2);
        $netEoSettlement = max(0.0, $netGmv - $platformCommission);

        // 2. Rekapitulasi Penjualan per Event
        $eventsQuery = DB::table('events')
            ->join('users as organizers', 'organizers.id', '=', 'events.eo_id')
            ->join('categories', 'categories.id', '=', 'events.category_id')
            ->when(! empty($categoryId), fn (Builder $q) => $q->where('events.category_id', $categoryId))
            ->when(! empty($search), function (Builder $q) use ($search) {
                $q->where(function (Builder $sub) use ($search) {
                    $sub->where('events.title', 'ILIKE', "%{$search}%")
                        ->orWhere('organizers.name', 'ILIKE', "%{$search}%");
                });
            });

        // Subquery agregasi pesanan lunas per event
        $eventSales = DB::table('orders')
            ->where('orders.status', 'PAID')
            ->when($period !== 'all', fn (Builder $q) => $dateFilterCallback($q, 'orders.paid_at'))
            ->groupBy('orders.event_id')
            ->selectRaw('orders.event_id')
            ->selectRaw('COALESCE(SUM(orders.total_amount), 0) as event_gross_amount')
            ->selectRaw('COUNT(orders.id) as event_orders_count')
            ->get()
            ->keyBy('event_id');

        // Subquery tiket per event
        $eventTicketCounts = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->where('orders.status', 'PAID')
            ->whereIn('tickets.status', ['ACTIVE', 'USED'])
            ->when($period !== 'all', fn (Builder $q) => $dateFilterCallback($q, 'orders.paid_at'))
            ->groupBy('orders.event_id')
            ->selectRaw('orders.event_id, COUNT(tickets.id) as tickets_count')
            ->pluck('tickets_count', 'event_id');

        // Subquery refund per event
        $eventRefunds = DB::table('refunds')
            ->join('orders', 'orders.id', '=', 'refunds.order_id')
            ->where('refunds.status', 'APPROVED')
            ->when($period !== 'all', fn (Builder $q) => $dateFilterCallback($q, 'refunds.processed_at'))
            ->groupBy('orders.event_id')
            ->selectRaw('orders.event_id, COALESCE(SUM(refunds.amount), 0) as event_refund_amount')
            ->pluck('event_refund_amount', 'event_id');

        $eventsList = $eventsQuery
            ->select(
                'events.id',
                'events.title',
                'events.status',
                'events.starts_at',
                'categories.name as category_name',
                'organizers.name as organizer_name'
            )
            ->orderByDesc('events.starts_at')
            ->get()
            ->map(function ($event) use ($eventSales, $eventTicketCounts, $eventRefunds) {
                $salesData = $eventSales->get($event->id);
                $gross = (float) ($salesData->event_gross_amount ?? 0);
                $refund = (float) ($eventRefunds[$event->id] ?? 0);
                $net = max(0.0, $gross - $refund);
                $fee = round($net * self::PLATFORM_FEE_PERCENTAGE, 2);
                $payout = max(0.0, $net - $fee);
                $ticketsSold = (int) ($eventTicketCounts[$event->id] ?? 0);

                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'organizerName' => $event->organizer_name,
                    'categoryName' => $event->category_name,
                    'status' => $event->status,
                    'startsAtFormatted' => Carbon::parse($event->starts_at)->locale('id')->translatedFormat('d M Y'),
                    'ticketsSold' => $ticketsSold,
                    'grossRevenue' => $gross,
                    'grossRevenueFormatted' => 'Rp'.number_format($gross, 0, ',', '.'),
                    'refundAmount' => $refund,
                    'refundAmountFormatted' => 'Rp'.number_format($refund, 0, ',', '.'),
                    'netRevenue' => $net,
                    'netRevenueFormatted' => 'Rp'.number_format($net, 0, ',', '.'),
                    'platformCommission' => $fee,
                    'platformCommissionFormatted' => 'Rp'.number_format($fee, 0, ',', '.'),
                    'netEoPayout' => $payout,
                    'netEoPayoutFormatted' => 'Rp'.number_format($payout, 0, ',', '.'),
                ];
            });

        // 3. Transaksi Finansial Lunas Terbaru (10 transaksi)
        $recentTransactions = DB::table('orders')
            ->join('users', 'users.id', '=', 'orders.user_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->leftJoin('payments', 'payments.order_id', '=', 'orders.id')
            ->where('orders.status', 'PAID')
            ->select(
                'orders.id',
                'orders.order_reference',
                'orders.total_amount',
                'orders.paid_at',
                'users.name as buyer_name',
                'events.title as event_title',
                'payments.method as payment_method'
            )
            ->orderByDesc('orders.paid_at')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'orderReference' => $row->order_reference,
                'buyerName' => $row->buyer_name,
                'eventTitle' => $row->event_title,
                'paymentMethod' => strtoupper((string) ($row->payment_method ?: 'QRIS')),
                'amount' => (float) $row->total_amount,
                'amountFormatted' => 'Rp'.number_format((float) $row->total_amount, 0, ',', '.'),
                'paidAtFormatted' => Carbon::parse($row->paid_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB',
            ]);

        return [
            'summary' => [
                'grossRevenue' => $grossRevenue,
                'grossRevenueFormatted' => 'Rp'.number_format($grossRevenue, 0, ',', '.'),
                'totalRefunds' => $totalRefunds,
                'totalRefundsFormatted' => 'Rp'.number_format($totalRefunds, 0, ',', '.'),
                'totalRefundCount' => $totalRefundCount,
                'netGmv' => $netGmv,
                'netGmvFormatted' => 'Rp'.number_format($netGmv, 0, ',', '.'),
                'platformCommission' => $platformCommission,
                'platformCommissionFormatted' => 'Rp'.number_format($platformCommission, 0, ',', '.'),
                'commissionRate' => (self::PLATFORM_FEE_PERCENTAGE * 100).'%',
                'netEoSettlement' => $netEoSettlement,
                'netEoSettlementFormatted' => 'Rp'.number_format($netEoSettlement, 0, ',', '.'),
                'totalPaidOrders' => $totalPaidOrders,
                'totalTicketsSold' => $totalTicketsSold,
            ],
            'eventReports' => $eventsList,
            'recentTransactions' => $recentTransactions,
        ];
    }

    /**
     * Terjemahkan key periode ke label manusia.
     */
    private function getPeriodLabel(string $period): string
    {
        return match ($period) {
            'this_month' => 'Bulan Ini ('.now()->locale('id')->translatedFormat('F Y').')',
            'last_30_days' => '30 Hari Terakhir',
            'this_year' => 'Tahun Ini ('.now()->year.')',
            default => 'Semua Periode Transaksi',
        };
    }
}
