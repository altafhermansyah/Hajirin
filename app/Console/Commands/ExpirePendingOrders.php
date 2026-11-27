<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Support\InAppNotification;
use App\Support\OrderQuota;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpirePendingOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hajirin:expire-pending-orders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kedaluwarsakan pesanan PENDING yang melewati batas waktu dan kembalikan kuota tiket';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $expiredOrderIds = Order::query()
            ->where('status', 'PENDING')
            ->where('expires_at', '<=', now())
            ->orderBy('expires_at')
            ->limit(100)
            ->pluck('id');

        $processedCount = 0;

        foreach ($expiredOrderIds as $orderId) {
            DB::transaction(function () use ($orderId, &$processedCount): void {
                $order = Order::query()
                    ->with(['items.ticketType', 'event:id,title'])
                    ->whereKey($orderId)
                    ->lockForUpdate()
                    ->first();

                if (! $order || $order->status !== 'PENDING' || $order->expires_at->isFuture()) {
                    return;
                }

                $order->forceFill(['status' => 'EXPIRED'])->save();

                DB::table('payments')
                    ->where('order_id', $order->id)
                    ->where('status', 'PENDING')
                    ->update([
                        'status' => 'FAILED',
                        'updated_at' => now(),
                    ]);

                OrderQuota::restoreForOrder($order);

                InAppNotification::send(
                    userId: $order->user_id,
                    type: 'PAYMENT_FAILED',
                    title: 'Pesanan Tiket Kedaluwarsa',
                    message: "Batas waktu pembayaran pesanan {$order->order_reference} untuk event \"{$order->event?->title}\" telah berakhir. Kuota tiket telah dikembalikan.",
                    actionUrl: '/dashboard#pesanan',
                );

                $processedCount++;
            });
        }

        $this->info("Berhasil mengkedaluwarsakan {$processedCount} pesanan PENDING.");

        return self::SUCCESS;
    }
}
