<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSearchController extends Controller
{
    /**
     * Pencarian cepat lintas entitas (event, pesanan, EO, dan pengguna) untuk topbar Admin.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));

        if (mb_strlen($query) < 2) {
            return response()->json([
                'events' => [],
                'orders' => [],
                'organizers' => [],
                'users' => [],
            ]);
        }

        $lower = '%'.mb_strtolower($query).'%';

        $events = DB::table('events')
            ->where(function ($q) use ($lower): void {
                $q->whereRaw('LOWER(title) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(slug) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(COALESCE(city, \'\')) LIKE ?', [$lower]);
            })
            ->orderByDesc('created_at')
            ->limit(4)
            ->get(['id', 'title', 'status', 'city'])
            ->map(fn (object $event): array => [
                'id' => $event->id,
                'label' => $event->title,
                'sublabel' => $event->city ?: 'Online Event',
                'badge' => $event->status,
                'href' => '/admin/events?search='.urlencode($event->title),
            ])
            ->values()
            ->all();

        $orders = DB::table('orders')
            ->join('users', 'users.id', '=', 'orders.user_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where(function ($q) use ($lower): void {
                $q->whereRaw('LOWER(orders.order_reference) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(users.name) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(users.email) LIKE ?', [$lower]);
            })
            ->orderByDesc('orders.created_at')
            ->limit(4)
            ->get([
                'orders.id',
                'orders.order_reference',
                'orders.status',
                'users.name as buyer_name',
                'events.title as event_title',
            ])
            ->map(fn (object $order): array => [
                'id' => $order->id,
                'label' => $order->order_reference,
                'sublabel' => "{$order->buyer_name} • {$order->event_title}",
                'badge' => $order->status,
                'href' => '/admin/orders?search='.urlencode($order->order_reference),
            ])
            ->values()
            ->all();

        $organizers = DB::table('users')
            ->leftJoin('eo_applications', function ($join): void {
                $join->on('eo_applications.user_id', '=', 'users.id')
                    ->where('eo_applications.status', 'APPROVED');
            })
            ->where('users.role', 'EO')
            ->where(function ($q) use ($lower): void {
                $q->whereRaw('LOWER(users.name) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(users.email) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(COALESCE(eo_applications.organization_name, \'\')) LIKE ?', [$lower]);
            })
            ->orderByDesc('users.created_at')
            ->limit(4)
            ->get([
                'users.id',
                'users.name',
                'users.email',
                'eo_applications.organization_name',
            ])
            ->map(fn (object $eo): array => [
                'id' => $eo->id,
                'label' => $eo->organization_name ?: $eo->name,
                'sublabel' => "{$eo->name} ({$eo->email})",
                'badge' => 'EO',
                'href' => '/admin/organizers?search='.urlencode($eo->email),
            ])
            ->values()
            ->all();

        $users = DB::table('users')
            ->where(function ($q) use ($lower): void {
                $q->whereRaw('LOWER(name) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$lower]);
            })
            ->orderByDesc('created_at')
            ->limit(4)
            ->get(['id', 'name', 'email', 'role'])
            ->map(fn (object $u): array => [
                'id' => $u->id,
                'label' => $u->name,
                'sublabel' => $u->email,
                'badge' => $u->role,
                'href' => '/admin/users?search='.urlencode($u->email),
            ])
            ->values()
            ->all();

        return response()->json([
            'events' => $events,
            'orders' => $orders,
            'organizers' => $organizers,
            'users' => $users,
        ]);
    }
}
