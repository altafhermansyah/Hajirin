<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class InAppNotification
{
    /**
     * Kirim satu notifikasi in-app ke pengguna tertentu.
     */
    public static function send(
        string $userId,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
    ): void {
        DB::table('notifications')->insert([
            'id' => Str::uuid()->toString(),
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'created_at' => now(),
        ]);
    }

    /**
     * Kirim notifikasi in-app secara massal menggunakan chunk untuk menghindari query raksasa.
     *
     * @param  iterable<int, string>  $userIds
     */
    public static function sendMany(
        iterable $userIds,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
    ): void {
        $now = now();
        $buffer = [];

        foreach ($userIds as $userId) {
            $buffer[] = [
                'id' => Str::uuid()->toString(),
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'action_url' => $actionUrl,
                'created_at' => $now,
            ];

            if (count($buffer) >= 200) {
                DB::table('notifications')->insert($buffer);
                $buffer = [];
            }
        }

        if ($buffer !== []) {
            DB::table('notifications')->insert($buffer);
        }
    }
}
