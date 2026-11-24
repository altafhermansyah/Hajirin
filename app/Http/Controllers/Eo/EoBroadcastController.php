<?php

namespace App\Http\Controllers\Eo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Eo\StoreEoBroadcastRequest;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EoBroadcastController extends Controller
{
    /**
     * Kirim pengumuman in-app ke seluruh peserta dengan tiket aktif pada event milik EO.
     */
    public function store(StoreEoBroadcastRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $event = Event::query()
            ->where('id', $validated['event_id'])
            ->where('eo_id', $user->id)
            ->firstOrFail();

        $recipientIds = DB::table('orders')
            ->join('tickets', 'tickets.order_id', '=', 'orders.id')
            ->where('orders.event_id', $event->id)
            ->where('orders.status', 'PAID')
            ->where('tickets.status', '!=', 'CANCELLED')
            ->distinct()
            ->pluck('orders.user_id');

        if ($recipientIds->isEmpty()) {
            throw ValidationException::withMessages([
                'event_id' => 'Belum ada peserta dengan tiket aktif pada event ini untuk dikirimi pengumuman.',
            ]);
        }

        $now = now();
        $title = Str::limit("[{$event->title}] {$validated['title']}", 195, '...');
        $actionUrl = "/event/{$event->slug}";

        DB::transaction(function () use ($recipientIds, $title, $validated, $actionUrl, $now): void {
            foreach ($recipientIds->chunk(200) as $chunk) {
                $rows = $chunk->map(fn (string $recipientId): array => [
                    'id' => Str::uuid()->toString(),
                    'user_id' => $recipientId,
                    'type' => 'EVENT_UPDATED',
                    'title' => $title,
                    'message' => $validated['message'],
                    'action_url' => $actionUrl,
                    'created_at' => $now,
                ])->all();

                DB::table('notifications')->insert($rows);
            }
        });

        return back()->with(
            'success',
            "Pengumuman berhasil dikirim ke {$recipientIds->count()} peserta event \"{$event->title}\"."
        );
    }
}
