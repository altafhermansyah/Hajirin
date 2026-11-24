<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\EventStaff;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Ticket;
use App\Models\TicketPrice;
use App\Models\TicketType;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EoStaffAndStaffCheckInTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CategorySeeder::class);
    }

    public function test_eo_staff_management_enforces_authorization_and_validation_rules(): void
    {
        $eoOwner = User::factory()->eo()->create(['email' => 'owner@example.com']);
        $otherEo = User::factory()->eo()->create(['email' => 'other-eo@example.com']);
        $admin = User::factory()->admin()->create(['email' => 'admin@example.com']);
        $regularUser = User::factory()->create(['email' => 'panitia@example.com', 'status' => 'ACTIVE']);
        $suspendedUser = User::factory()->create(['email' => 'suspended@example.com', 'status' => 'SUSPENDED']);

        [$ownerEvent] = $this->createEventWithTicketType($eoOwner, 'Festival Musik 2026', 'PUBLISHED', 120000);
        [$otherEvent] = $this->createEventWithTicketType($otherEo, 'Seminar Kompetitor', 'PUBLISHED', 100000);

        // Guest, USER, dan ADMIN tidak dapat mengakses /eo/staff
        $this->get('/eo/staff')->assertRedirect('/');
        $this->actingAs($regularUser)->get('/eo/staff')->assertForbidden();
        $this->actingAs($admin)->get('/eo/staff')->assertForbidden();
        $this->actingAs($regularUser)->post('/eo/staff', [
            'event_id' => $ownerEvent->id,
            'email' => $regularUser->email,
        ])->assertForbidden();

        // EO tidak dapat menambah staff pada event milik EO lain
        $this->actingAs($eoOwner)->post('/eo/staff', [
            'event_id' => $otherEvent->id,
            'email' => $regularUser->email,
        ])->assertForbidden();

        // Tolak email tidak terdaftar, pemilik event sendiri, admin, dan akun suspended
        $this->actingAs($eoOwner)->post('/eo/staff', [
            'event_id' => $ownerEvent->id,
            'email' => 'tidak-ada@example.com',
        ])->assertSessionHasErrors('email');

        $this->actingAs($eoOwner)->post('/eo/staff', [
            'event_id' => $ownerEvent->id,
            'email' => $eoOwner->email,
        ])->assertSessionHasErrors('email');

        $this->actingAs($eoOwner)->post('/eo/staff', [
            'event_id' => $ownerEvent->id,
            'email' => $admin->email,
        ])->assertSessionHasErrors('email');

        $this->actingAs($eoOwner)->post('/eo/staff', [
            'event_id' => $ownerEvent->id,
            'email' => $suspendedUser->email,
        ])->assertSessionHasErrors('email');

        // Berhasil menugaskan user aktif & mengirim notifikasi in-app
        $this->actingAs($eoOwner)->post('/eo/staff', [
            'event_id' => $ownerEvent->id,
            'email' => '  PANITIA@EXAMPLE.COM  ',
        ])->assertRedirect("/eo/staff?event_id={$ownerEvent->id}")
            ->assertSessionHas('success');

        $assignment = EventStaff::where('event_id', $ownerEvent->id)
            ->where('user_id', $regularUser->id)
            ->firstOrFail();

        $this->assertSame('CHECKIN', $assignment->role);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $regularUser->id,
            'type' => 'EVENT_UPDATED',
            'action_url' => "/staff/check-in?event_id={$ownerEvent->id}",
        ]);

        // Penugasan duplikat pada event yang sama ditolak
        $this->actingAs($eoOwner)->post('/eo/staff', [
            'event_id' => $ownerEvent->id,
            'email' => $regularUser->email,
        ])->assertSessionHasErrors('email');

        // EO lain tidak dapat mencabut staff milik EO pertama
        $this->actingAs($otherEo)
            ->delete("/eo/staff/{$assignment->id}")
            ->assertForbidden();

        // Halaman /eo/staff menampilkan daftar staff yang ditugaskan
        $this->actingAs($eoOwner)
            ->get('/eo/staff')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Eo/Staff')
                ->has('staffList', 1)
                ->where('staffList.0.userEmail', 'panitia@example.com')
            );
    }

    public function test_assigned_staff_can_search_and_check_in_assigned_event_only_and_loses_access_on_revoke(): void
    {
        $eoOwner = User::factory()->eo()->create(['name' => 'Promotor Utama']);
        $otherEo = User::factory()->eo()->create(['name' => 'Promotor Lain']);
        $staffUser = User::factory()->create(['name' => 'Raka Panitia', 'email' => 'raka@example.com']);
        $unassignedUser = User::factory()->create(['email' => 'biasa@example.com']);
        $buyer = User::factory()->create();

        [$assignedEvent, $assignedType] = $this->createEventWithTicketType($eoOwner, 'Tech Summit 2026', 'PUBLISHED', 175000);
        [$foreignEvent, $foreignType] = $this->createEventWithTicketType($otherEo, 'Event Pihak Lain', 'PUBLISHED', 250000);

        $assignedTicket = $this->createPaidTicket($buyer, $assignedEvent, $assignedType, 'HJR-TKT-2026-STAFF001', 'Nadia Putri', 'nadia@example.com', 175000);
        $foreignTicket = $this->createPaidTicket($buyer, $foreignEvent, $foreignType, 'HJR-TKT-2026-FORGN001', 'Rahasia Luar', 'foreign@example.com', 250000);

        // User tanpa penugasan staff ditolak akses /staff/check-in
        $this->actingAs($unassignedUser)->get('/staff/check-in')->assertForbidden();
        $this->actingAs($unassignedUser)->post('/staff/check-in', [
            'ticket_code' => $assignedTicket->ticket_code,
        ])->assertForbidden();

        // EO menugaskan staffUser ke assignedEvent
        $this->actingAs($eoOwner)->post('/eo/staff', [
            'event_id' => $assignedEvent->id,
            'email' => $staffUser->email,
        ])->assertSessionHasNoErrors();

        $assignment = EventStaff::where('event_id', $assignedEvent->id)
            ->where('user_id', $staffUser->id)
            ->firstOrFail();

        // Dashboard user menampilkan staffEvents aktif
        $this->actingAs($staffUser)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('dashboard.staffEvents', 1)
                ->where('dashboard.staffEvents.0.title', 'Tech Summit 2026')
            );

        // Portal staff dapat mencari peserta tanpa mengekspos data finansial (unit_price / total_amount)
        $this->actingAs($staffUser)
            ->get('/staff/check-in?q=Nadia')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Staff/CheckIn')
                ->has('events', 1)
                ->has('searchResults', 1)
                ->where('searchResults.0.ticketCode', 'HJR-TKT-2026-STAFF001')
                ->where('searchResults.0.attendeeName', 'Nadia Putri')
                ->missing('searchResults.0.unitPrice')
                ->missing('searchResults.0.revenue')
                ->missing('summary.totalRevenue')
            );

        // Staff mencoba scan tiket event lain -> ditolak & zero data leak
        $foreignAttempt = $this->actingAs($staffUser)->post('/staff/check-in', [
            'ticket_code' => $foreignTicket->ticket_code,
        ]);
        $foreignAttempt->assertRedirect('/staff/check-in');
        $foreignResult = session('checkin_result');
        $this->assertSame('invalid', $foreignResult['outcome']);
        $this->assertNull($foreignResult['ticket']);
        $this->assertSame('ACTIVE', $foreignTicket->fresh()->status);

        // Staff berhasil check-in tiket event yang ditugaskan -> tercatat checked_in_by = $staffUser->id
        $checkInResponse = $this->actingAs($staffUser)->post('/staff/check-in', [
            'ticket_code' => '  hjr-tkt-2026-staff001 ',
            'event_id' => $assignedEvent->id,
        ]);
        $checkInResponse->assertRedirect("/staff/check-in?event_id={$assignedEvent->id}");
        $checkInResult = session('checkin_result');
        $this->assertSame('success', $checkInResult['outcome']);
        $this->assertSame('Raka Panitia', $checkInResult['ticket']['checkedInByName']);
        $this->assertArrayHasKey('eventTimestamp', $checkInResult);

        $assignedTicket->refresh();
        $this->assertSame('USED', $assignedTicket->status);
        $this->assertNotNull($assignedTicket->checked_in_at);
        $this->assertSame($staffUser->id, $assignedTicket->checked_in_by);

        // Scan ulang ditolak sebagai already_used
        $duplicateResponse = $this->actingAs($staffUser)->post('/staff/check-in', [
            'ticket_code' => $assignedTicket->ticket_code,
            'event_id' => $assignedEvent->id,
        ]);
        $duplicateResponse->assertRedirect("/staff/check-in?event_id={$assignedEvent->id}");
        $this->assertSame('already_used', session('checkin_result')['outcome']);

        // EO melihat jumlah tiket diverifikasi oleh staff di /eo/staff
        $this->actingAs($eoOwner)
            ->get('/eo/staff')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('staffList.0.checkedInCount', 1)
            );

        // EO mencabut akses staff -> akses portal langsung 403, audit checked_in_by historis tetap terjaga
        $this->actingAs($eoOwner)
            ->delete("/eo/staff/{$assignment->id}")
            ->assertRedirect("/eo/staff?event_id={$assignedEvent->id}")
            ->assertSessionHas('success');

        $this->actingAs($staffUser)->get('/staff/check-in')->assertForbidden();
        $this->assertSame($staffUser->id, $assignedTicket->fresh()->checked_in_by);
    }

    /**
     * @return array{0: Event, 1: TicketType}
     */
    private function createEventWithTicketType(
        User $eo,
        string $title,
        string $status,
        float $price
    ): array {
        $category = Category::firstOrFail();

        $event = new Event([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => $title,
            'slug' => str($title)->slug()->toString().'-'.strtolower(str()->random(5)),
            'description' => 'Acara resmi yang diselenggarakan melalui platform Hajirin untuk peserta terdaftar.',
            'event_type' => 'OFFLINE',
            'city' => 'Jakarta',
            'venue_name' => 'Gedung Serbaguna',
            'address' => 'Jl. Sudirman No. 1, Jakarta',
            'starts_at' => now()->addDays(5),
            'ends_at' => now()->addDays(5)->addHours(4),
            'banner_path' => '/images/events/tech_hero.jpg',
        ]);
        $event->forceFill(['status' => $status])->save();

        $ticketType = new TicketType([
            'event_id' => $event->id,
            'name' => 'Reguler Pass',
            'initial_quota' => 100,
            'quota' => 99,
            'max_per_order' => 5,
        ]);
        $ticketType->forceFill(['status' => 'ACTIVE'])->save();

        $ticketPrice = new TicketPrice([
            'ticket_type_id' => $ticketType->id,
            'name' => 'Harga Resmi',
            'price' => $price,
        ]);
        $ticketPrice->forceFill(['status' => 'ACTIVE'])->save();

        return [$event, $ticketType];
    }

    private function createPaidTicket(
        User $buyer,
        Event $event,
        TicketType $ticketType,
        string $ticketCode,
        string $attendeeName,
        string $attendeeEmail,
        float $amount
    ): Ticket {
        $order = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-'.now()->format('Ymd').'-'.strtoupper(str()->random(6)),
            'status' => 'PAID',
            'total_amount' => $amount,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 1,
            'unit_price' => $amount,
        ]);

        return Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'ticket_code' => $ticketCode,
            'attendee_name' => $attendeeName,
            'attendee_email' => $attendeeEmail,
            'status' => 'ACTIVE',
        ]);
    }
}
