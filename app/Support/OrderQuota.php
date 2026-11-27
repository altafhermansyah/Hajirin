<?php

namespace App\Support;

use App\Models\Order;
use App\Models\TicketType;

final class OrderQuota
{
    /**
     * Kembalikan kuota seluruh item tiket pada pesanan dengan urutan lock yang konsisten
     * dan dibatasi tidak melebihi initial_quota. Harus dipanggil di dalam DB::transaction().
     */
    public static function restoreForOrder(Order $order): void
    {
        $items = $order->relationLoaded('items')
            ? $order->items
            : $order->items()->get();

        if ($items->isEmpty()) {
            return;
        }

        $ticketTypeIds = $items
            ->pluck('ticket_type_id')
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        if ($ticketTypeIds === []) {
            return;
        }

        $lockedTypes = TicketType::whereIn('id', $ticketTypeIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        foreach ($items as $item) {
            $ticketType = $lockedTypes->get($item->ticket_type_id);
            if (! $ticketType) {
                continue;
            }

            $newQuota = min(
                (int) $ticketType->initial_quota,
                (int) $ticketType->quota + (int) $item->quantity
            );

            $ticketType->forceFill(['quota' => $newQuota])->save();
        }
    }
}
