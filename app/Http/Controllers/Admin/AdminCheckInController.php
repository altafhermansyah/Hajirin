<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\TicketCheckIn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminCheckInController extends Controller
{
    /**
     * Tampilkan pemberitahuan bahwa presensi check-in e-tiket dikelola oleh EO dan Event Staff.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('Admin/CheckIn/Index');
    }

    /**
     * Verifikasi kode tiket dan catat kehadiran check-in secara atomik.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'ticket_code' => ['required', 'string', 'max:100'],
            'event_id' => ['nullable', 'string'],
        ], [
            'ticket_code.required' => 'Kode e-tiket wajib diisi atau dipindai.',
        ]);

        $result = TicketCheckIn::verifyByCode(
            actor: $request->user(),
            rawTicketCode: (string) $request->input('ticket_code'),
            selectedEventId: $request->input('event_id'),
            authorizeEvent: fn (): ?string => null,
            allowedEventStatuses: ['PUBLISHED', 'ONGOING', 'COMPLETED'],
            includeOrganizerName: true,
            eventMismatchLabel: 'difilter',
        );

        return back()->with('checkin_result', $result);
    }
}
