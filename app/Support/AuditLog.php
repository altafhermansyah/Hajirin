<?php

namespace App\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class AuditLog
{
    /**
     * Catat aksi sensitif (akses PII, finansial, moderasi, dan keamanan) ke tabel audit_logs.
     *
     * @param  array<string, mixed>  $metadata
     */
    public static function record(
        string $action,
        ?string $actorId = null,
        ?string $subjectType = null,
        ?string $subjectId = null,
        array $metadata = [],
        ?string $ipAddress = null,
    ): void {
        $resolvedActorId = $actorId ?? (Auth::id() ? (string) Auth::id() : null);
        $resolvedIp = $ipAddress ?? request()?->ip();

        DB::table('audit_logs')->insert([
            'id' => Str::uuid()->toString(),
            'actor_id' => $resolvedActorId,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'ip_address' => $resolvedIp,
            'metadata' => $metadata !== [] ? json_encode($metadata, JSON_UNESCAPED_UNICODE) : null,
            'created_at' => now(),
        ]);
    }
}
