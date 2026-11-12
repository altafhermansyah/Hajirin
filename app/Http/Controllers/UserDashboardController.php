<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class UserDashboardController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->role === 'ADMIN') {
            return redirect()->route('admin.dashboard');
        }

        if ($request->user()?->role === 'EO') {
            return redirect()->route('eo.dashboard');
        }

        $userId = $request->user()->id;

        $upcomingEventCount = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('orders.user_id', $userId)
            ->where('orders.status', 'PAID')
            ->where('tickets.status', 'ACTIVE')
            ->where('events.starts_at', '>=', now())
            ->distinct()
            ->count('events.id');

        $recentOrders = DB::table('orders')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->where('orders.user_id', $userId)
            ->select(
                'orders.id',
                'orders.order_reference',
                'orders.status',
                'orders.total_amount',
                'orders.created_at',
                'events.title'
            )
            ->latest('orders.created_at')
            ->limit(10)
            ->get();

        $myTickets = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->join('events', 'events.id', '=', 'orders.event_id')
            ->join('order_items', 'order_items.id', '=', 'tickets.order_item_id')
            ->join('ticket_types', 'ticket_types.id', '=', 'order_items.ticket_type_id')
            ->where('orders.user_id', $userId)
            ->where('orders.status', 'PAID')
            ->select(
                'tickets.id',
                'tickets.ticket_code',
                'tickets.attendee_name',
                'tickets.attendee_email',
                'tickets.status as ticket_status',
                'tickets.created_at',
                'orders.order_reference',
                'events.id as event_id',
                'events.title as event_title',
                'events.slug as event_slug',
                'events.starts_at',
                'events.ends_at',
                'events.venue_name',
                'events.address',
                'events.banner_path',
                'events.event_type',
                'ticket_types.name as ticket_type_name'
            )
            ->orderByDesc('tickets.created_at')
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'ticketCode' => $ticket->ticket_code,
                    'attendeeName' => $ticket->attendee_name,
                    'attendeeEmail' => $ticket->attendee_email,
                    'status' => $ticket->ticket_status,
                    'orderReference' => $ticket->order_reference,
                    'eventTitle' => $ticket->event_title,
                    'eventSlug' => $ticket->event_slug,
                    'eventDate' => Carbon::parse($ticket->starts_at)->locale('id')->translatedFormat('l, d F Y • H:i').' WIB',
                    'eventLocation' => $ticket->venue_name ?: ($ticket->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                    'eventAddress' => $ticket->address,
                    'banner' => $ticket->banner_path ?: '/images/events/tech_hero.jpg',
                    'ticketType' => $ticket->ticket_type_name,
                ];
            });

        $latestEoApplication = DB::table('eo_applications')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->first();

        $eoApplicationData = $latestEoApplication ? [
            'id' => $latestEoApplication->id,
            'organizationName' => $latestEoApplication->organization_name,
            'contactPhone' => $latestEoApplication->contact_phone,
            'portfolioUrl' => $latestEoApplication->portfolio_url,
            'reason' => $latestEoApplication->reason,
            'status' => $latestEoApplication->status,
            'rejectionReason' => $latestEoApplication->rejection_reason,
            'documentUrl' => $latestEoApplication->document_path
                ? Storage::disk('local')->temporaryUrl($latestEoApplication->document_path, now()->addMinutes(15))
                : null,
            'createdAt' => Carbon::parse($latestEoApplication->created_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB',
            'reviewedAt' => $latestEoApplication->reviewed_at
                ? Carbon::parse($latestEoApplication->reviewed_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB'
                : null,
        ] : null;

        return Inertia::render('Dashboard', [
            'dashboard' => [
                'orderCount' => DB::table('orders')->where('user_id', $userId)->count(),
                'ticketCount' => DB::table('tickets')
                    ->join('orders', 'orders.id', '=', 'tickets.order_id')
                    ->where('orders.user_id', $userId)
                    ->where('orders.status', 'PAID')
                    ->where('tickets.status', 'ACTIVE')
                    ->count(),
                'upcomingEventCount' => $upcomingEventCount,
                'recentOrders' => $recentOrders,
                'myTickets' => $myTickets,
                'eoApplication' => $eoApplicationData,
            ],
        ]);
    }
}
