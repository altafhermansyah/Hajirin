<?php

namespace App\Http\Controllers\Eo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Eo\StoreEventStaffRequest;
use App\Mail\StaffAssignedMail;
use App\Models\Event;
use App\Models\EventStaff;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EoStaffController extends Controller
{
    /**
     * Tampilkan halaman manajemen staff check-in per event milik EO.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $eoId = $user->id;

        $approvedApplication = DB::table('eo_applications')
            ->where('user_id', $eoId)
            ->where('status', 'APPROVED')
            ->first();

        $events = DB::table('events')
            ->where('eo_id', $eoId)
            ->orderByDesc('starts_at')
            ->get(['id', 'title', 'status', 'starts_at'])
            ->map(fn ($event): array => [
                'id' => $event->id,
                'title' => $event->title,
                'status' => $event->status,
                'startsAtFormatted' => Carbon::parse($event->starts_at)
                    ->locale('id')
                    ->translatedFormat('d M Y'),
            ]);

        $assignableEvents = $events
            ->filter(fn (array $event): bool => $event['status'] !== 'CANCELLED')
            ->values();

        $rawEventId = trim((string) $request->query('event_id', ''));
        $selectedEventId = ($rawEventId !== '' && Str::isUuid($rawEventId) && $events->contains('id', $rawEventId))
            ? $rawEventId
            : null;

        $checkedInByStaffSubquery = DB::table('tickets')
            ->join('orders', 'orders.id', '=', 'tickets.order_id')
            ->whereColumn('orders.event_id', 'event_staff.event_id')
            ->whereColumn('tickets.checked_in_by', 'event_staff.user_id')
            ->where('tickets.status', 'USED')
            ->selectRaw('COUNT(tickets.id)');

        $staffList = DB::table('event_staff')
            ->join('events', 'events.id', '=', 'event_staff.event_id')
            ->join('users', 'users.id', '=', 'event_staff.user_id')
            ->where('events.eo_id', $eoId)
            ->when($selectedEventId, fn (Builder $query) => $query->where('event_staff.event_id', $selectedEventId))
            ->select(
                'event_staff.id',
                'event_staff.event_id',
                'event_staff.role',
                'event_staff.created_at',
                'events.title as event_title',
                'events.status as event_status',
                'users.id as user_id',
                'users.name as user_name',
                'users.email as user_email',
                'users.status as user_status'
            )
            ->addSelect([
                'checked_in_count' => $checkedInByStaffSubquery,
            ])
            ->orderByDesc('event_staff.created_at')
            ->get()
            ->map(fn ($row): array => [
                'id' => $row->id,
                'eventId' => $row->event_id,
                'eventTitle' => $row->event_title,
                'eventStatus' => $row->event_status,
                'role' => $row->role,
                'userName' => $row->user_name,
                'userEmail' => $row->user_email,
                'userStatus' => $row->user_status ?? 'ACTIVE',
                'checkedInCount' => (int) ($row->checked_in_count ?? 0),
                'assignedAtFormatted' => Carbon::parse($row->created_at)
                    ->locale('id')
                    ->translatedFormat('d M Y, H:i').' WIB',
            ]);

        return Inertia::render('Eo/Staff', [
            'organizerName' => $approvedApplication->organization_name ?? $user->name,
            'events' => $events,
            'assignableEvents' => $assignableEvents,
            'selectedEventId' => $selectedEventId ?? '',
            'staffList' => $staffList,
        ]);
    }

    /**
     * Tugaskan akun terdaftar sebagai staff check-in pada event milik EO.
     */
    public function store(StoreEventStaffRequest $request): RedirectResponse
    {
        $eoUser = $request->user();
        $validated = $request->validated();
        $email = strtolower(trim($validated['email']));

        $event = Event::where('id', $validated['event_id'])->firstOrFail();

        if ($event->eo_id !== $eoUser->id) {
            abort(403, 'Akses ditolak: Anda bukan penyelenggara event ini.');
        }

        if ($event->status === 'CANCELLED') {
            throw ValidationException::withMessages([
                'event_id' => 'Tidak dapat menambahkan staff pada event yang sudah dibatalkan.',
            ]);
        }

        $targetUser = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $targetUser) {
            throw ValidationException::withMessages([
                'email' => 'Akun dengan email tersebut belum terdaftar di Hajirin. Minta panitia mendaftar akun terlebih dahulu.',
            ]);
        }

        if ($targetUser->id === $eoUser->id) {
            throw ValidationException::withMessages([
                'email' => 'Anda sudah menjadi pemilik event ini dan dapat langsung melakukan check-in.',
            ]);
        }

        if ($targetUser->isAdmin()) {
            throw ValidationException::withMessages([
                'email' => 'Akun Admin tidak dapat ditugaskan sebagai staff event.',
            ]);
        }

        if (! $targetUser->isActive()) {
            throw ValidationException::withMessages([
                'email' => 'Akun tersebut sedang dinonaktifkan (suspended) dan tidak dapat ditugaskan sebagai staff.',
            ]);
        }

        $alreadyAssigned = EventStaff::where('event_id', $event->id)
            ->where('user_id', $targetUser->id)
            ->exists();

        if ($alreadyAssigned) {
            throw ValidationException::withMessages([
                'email' => 'Pengguna tersebut sudah terdaftar sebagai staff untuk event ini.',
            ]);
        }

        $organizerName = DB::table('eo_applications')
            ->where('user_id', $eoUser->id)
            ->where('status', 'APPROVED')
            ->value('organization_name') ?: $eoUser->name;

        DB::transaction(function () use ($event, $targetUser, $organizerName): void {
            $staff = new EventStaff([
                'event_id' => $event->id,
                'user_id' => $targetUser->id,
            ]);
            $staff->forceFill(['role' => 'CHECKIN'])->save();

            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $targetUser->id,
                'type' => 'EVENT_UPDATED',
                'title' => 'Anda Ditugaskan Sebagai Staff Check-in Event',
                'message' => "Penyelenggara menunjuk Anda sebagai staff check-in untuk event \"{$event->title}\". Buka Portal Staff Check-in untuk memindai e-tiket peserta.",
                'action_url' => "/staff/check-in?event_id={$event->id}",
                'created_at' => now(),
            ]);

            Mail::to($targetUser->email)->send(
                (new StaffAssignedMail(
                    staffName: $targetUser->name,
                    organizerName: $organizerName,
                    eventTitle: $event->title,
                    eventDate: Carbon::parse($event->starts_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                    eventId: $event->id,
                ))->afterCommit()
            );
        });

        return redirect()
            ->route('eo.staff.index', ['event_id' => $event->id])
            ->with('success', "{$targetUser->name} berhasil ditambahkan sebagai staff check-in untuk \"{$event->title}\".");
    }

    /**
     * Cabut akses staff check-in dari event milik EO.
     */
    public function destroy(Request $request, string $id): RedirectResponse
    {
        if (! Str::isUuid($id)) {
            abort(404);
        }

        $assignment = EventStaff::with(['event', 'user'])->where('id', $id)->firstOrFail();

        if (! $assignment->event || $assignment->event->eo_id !== $request->user()->id) {
            abort(403, 'Akses ditolak: Anda tidak berwenang mencabut staff event ini.');
        }

        $staffName = $assignment->user?->name ?? 'Staff';
        $eventTitle = $assignment->event->title;
        $eventId = $assignment->event_id;

        $assignment->delete();

        return redirect()
            ->route('eo.staff.index', array_filter(['event_id' => $request->query('event_id', $eventId)]))
            ->with('success', "Akses staff check-in untuk {$staffName} pada \"{$eventTitle}\" telah dicabut.");
    }
}
