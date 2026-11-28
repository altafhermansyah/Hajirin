<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Format;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuditLogController extends Controller
{
    /**
     * Tampilkan halaman Log Audit sistem untuk Administrator (read-only).
     */
    public function __invoke(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $actionFilter = trim((string) $request->input('action', 'ALL'));

        $counts = DB::table('audit_logs')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('COUNT(CASE WHEN created_at >= ? THEN 1 END) as today', [now()->startOfDay()])
            ->selectRaw("COUNT(CASE WHEN action IN ('eo_document.viewed', 'attendees.exported', 'account.exported', 'account.deleted', 'eo_documents.purged') THEN 1 END) as pii_access")
            ->selectRaw("COUNT(CASE WHEN action IN ('user.status_changed', 'eo.revoked', 'event.moderated', 'event.cancelled', 'eo_application.reviewed', 'order.marked_paid', 'refund.approved', 'refund.rejected') THEN 1 END) as moderation")
            ->first();

        $query = DB::table('audit_logs')
            ->leftJoin('users as actors', 'actors.id', '=', 'audit_logs.actor_id')
            ->select(
                'audit_logs.id',
                'audit_logs.actor_id',
                'audit_logs.action',
                'audit_logs.subject_type',
                'audit_logs.subject_id',
                'audit_logs.ip_address',
                'audit_logs.metadata',
                'audit_logs.created_at',
                'actors.name as actor_name',
                'actors.email as actor_email',
                'actors.role as actor_role',
            );

        if ($actionFilter !== '' && $actionFilter !== 'ALL') {
            $query->where('audit_logs.action', $actionFilter);
        }

        if ($search !== '') {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], mb_strtolower($search));
            $pattern = "%{$escaped}%";

            $query->where(function ($q) use ($pattern): void {
                $q->whereRaw('LOWER(audit_logs.action) LIKE ?', [$pattern])
                    ->orWhereRaw('LOWER(COALESCE(audit_logs.subject_id, \'\')) LIKE ?', [$pattern])
                    ->orWhereRaw('LOWER(COALESCE(audit_logs.ip_address, \'\')) LIKE ?', [$pattern])
                    ->orWhereRaw('LOWER(COALESCE(actors.name, \'\')) LIKE ?', [$pattern])
                    ->orWhereRaw('LOWER(COALESCE(actors.email, \'\')) LIKE ?', [$pattern]);
            });
        }

        $paginated = $query
            ->orderByDesc('audit_logs.created_at')
            ->paginate(15)
            ->withQueryString();

        $logs = $paginated->through(function (object $row): array {
            $metadata = is_string($row->metadata)
                ? json_decode($row->metadata, true)
                : (is_array($row->metadata) ? $row->metadata : null);

            return [
                'id' => $row->id,
                'action' => $row->action,
                'subjectType' => $row->subject_type,
                'subjectId' => $row->subject_id,
                'ipAddress' => $row->ip_address ?: '-',
                'metadata' => is_array($metadata) ? $metadata : null,
                'createdAtFormatted' => Format::wib($row->created_at),
                'actor' => [
                    'name' => $row->actor_name ?: 'Sistem / Akun Terhapus',
                    'email' => $row->actor_email ?: '-',
                    'role' => $row->actor_role,
                ],
            ];
        });

        $availableActions = DB::table('audit_logs')
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action')
            ->values()
            ->all();

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs' => $logs,
            'availableActions' => $availableActions,
            'stats' => [
                'total' => (int) ($counts->total ?? 0),
                'today' => (int) ($counts->today ?? 0),
                'piiAccess' => (int) ($counts->pii_access ?? 0),
                'moderation' => (int) ($counts->moderation ?? 0),
            ],
            'filters' => [
                'search' => $search,
                'action' => $actionFilter,
            ],
        ]);
    }
}
