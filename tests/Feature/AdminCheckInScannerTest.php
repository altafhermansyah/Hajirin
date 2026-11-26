<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Ticket;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminCheckInScannerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $eo;

    private User $buyer;

    private Event $event;

    private TicketType $ticketType;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
        ]);

        $this->eo = User::factory()->create([
            'role' => 'EO',
            'status' => 'ACTIVE',
        ]);

        $this->buyer = User::factory()->create([
            'role' => 'USER',
            'status' => 'ACTIVE',
        ]);

        $category = Category::create([
            'name' => 'Konser Musik',
            'slug' => 'konser-musik',
        ]);

        $this->event = Event::create([
            'eo_id' => $this->eo->id,
            'category_id' => $category->id,
            'title' => 'Soundwave Festival 2026',
            'slug' => 'soundwave-festival-2026',
            'description' => 'Festival konser musik spektakuler di Surabaya.',
            'event_type' => 'OFFLINE',
            'starts_at' => now()->addHour(),
            'ends_at' => now()->addHours(5),
            'city' => 'Surabaya',
            'venue_name' => 'Grand City Hall',
            'address' => 'Jl. Walikota Mustajab No. 1, Surabaya',
            'status' => 'PUBLISHED',
        ]);

        $this->ticketType = TicketType::create([
            'event_id' => $this->event->id,
            'name' => 'Festival Pass',
            'initial_quota' => 100,
            'quota' => 100,
            'status' => 'ACTIVE',
        ]);
    }

    private function createTicket(
        string $ticketStatus = 'ACTIVE',
        string $orderStatus = 'PAID',
        ?Event $event = null
    ): Ticket {
        $targetEvent = $event ?? $this->event;

        $order = Order::create([
            'user_id' => $this->buyer->id,
            'event_id' => $targetEvent->id,
            'order_reference' => 'HJR-ORD-'.strtoupper(uniqid()),
            'status' => $orderStatus,
            'total_amount' => 150000.00,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => $orderStatus === 'PAID' ? now() : null,
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $this->ticketType->id,
            'quantity' => 1,
            'unit_price' => 150000.00,
        ]);

        Payment::create([
            'order_id' => $order->id,
            'payment_reference' => 'PAY-'.uniqid(),
            'method' => 'MOCK',
            'status' => $orderStatus === 'PAID' ? 'SUCCESS' : 'PENDING',
            'amount' => 150000.00,
            'paid_at' => $orderStatus === 'PAID' ? now() : null,
        ]);

        return Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'ticket_code' => 'TKT-'.strtoupper(uniqid()),
            'attendee_name' => 'Budi Santoso',
            'attendee_email' => 'budi@example.com',
            'attendee_phone' => '081234567890',
            'status' => $ticketStatus,
            'checked_in_at' => $ticketStatus === 'USED' ? now()->subMinutes(10) : null,
            'checked_in_by' => $ticketStatus === 'USED' ? $this->admin->id : null,
        ]);
    }

    public function test_guests_and_regular_users_cannot_access_admin_scanner(): void
    {
        $this->get('/admin/scanner')->assertRedirect('/');

        $this->actingAs($this->buyer)
            ->get('/admin/scanner')
            ->assertForbidden();

        $this->actingAs($this->eo)
            ->get('/admin/scanner')
            ->assertForbidden();
    }

    public function test_admin_can_view_scanner_page_with_active_events_and_stats(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/scanner');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/CheckIn/Index')
        );
    }

    public function test_admin_can_successfully_check_in_active_ticket(): void
    {
        $ticket = $this->createTicket('ACTIVE');

        $response = $this->actingAs($this->admin)
            ->from('/admin/scanner')
            ->post('/admin/scanner', [
                'ticket_code' => $ticket->ticket_code,
            ]);

        $response->assertRedirect('/admin/scanner');
        $response->assertSessionHas('checkin_result', function (array $result) use ($ticket) {
            return $result['outcome'] === 'success'
                && $result['ticket']['ticketCode'] === $ticket->ticket_code
                && str_contains($result['message'], 'Check-in berhasil');
        });

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'status' => 'USED',
            'checked_in_by' => $this->admin->id,
        ]);

        $freshTicket = $ticket->fresh();
        $this->assertNotNull($freshTicket->checked_in_at);
    }

    public function test_admin_scanning_already_used_ticket_returns_already_used_outcome(): void
    {
        $ticket = $this->createTicket('USED');

        $response = $this->actingAs($this->admin)
            ->from('/admin/scanner')
            ->post('/admin/scanner', [
                'ticket_code' => $ticket->ticket_code,
            ]);

        $response->assertRedirect('/admin/scanner');
        $response->assertSessionHas('checkin_result', function (array $result) {
            return $result['outcome'] === 'already_used'
                && str_contains($result['message'], 'sudah pernah check-in');
        });
    }

    public function test_admin_scanning_cancelled_ticket_returns_invalid_outcome(): void
    {
        $ticket = $this->createTicket('CANCELLED');

        $response = $this->actingAs($this->admin)
            ->from('/admin/scanner')
            ->post('/admin/scanner', [
                'ticket_code' => $ticket->ticket_code,
            ]);

        $response->assertRedirect('/admin/scanner');
        $response->assertSessionHas('checkin_result', function (array $result) {
            return $result['outcome'] === 'invalid'
                && str_contains($result['message'], 'dibatalkan');
        });
    }

    public function test_admin_scanning_unpaid_order_ticket_returns_invalid_outcome(): void
    {
        $ticket = $this->createTicket('ACTIVE', 'PENDING');

        $response = $this->actingAs($this->admin)
            ->from('/admin/scanner')
            ->post('/admin/scanner', [
                'ticket_code' => $ticket->ticket_code,
            ]);

        $response->assertRedirect('/admin/scanner');
        $response->assertSessionHas('checkin_result', function (array $result) {
            return $result['outcome'] === 'invalid'
                && str_contains($result['message'], 'belum lunas');
        });
    }

    public function test_admin_scanning_non_existent_ticket_returns_invalid_outcome(): void
    {
        $response = $this->actingAs($this->admin)
            ->from('/admin/scanner')
            ->post('/admin/scanner', [
                'ticket_code' => 'NON-EXISTENT-CODE',
            ]);

        $response->assertRedirect('/admin/scanner');
        $response->assertSessionHas('checkin_result', function (array $result) {
            return $result['outcome'] === 'invalid'
                && str_contains($result['message'], 'tidak ditemukan');
        });
    }

    public function test_admin_scanning_ticket_with_mismatched_event_filter_returns_invalid_outcome(): void
    {
        $category = Category::first();
        $otherEvent = Event::create([
            'eo_id' => $this->eo->id,
            'category_id' => $category->id,
            'title' => 'Other Tech Summit 2026',
            'slug' => 'other-tech-summit-2026',
            'description' => 'Konferensi teknologi terkini.',
            'event_type' => 'OFFLINE',
            'starts_at' => now()->addDays(8),
            'ends_at' => now()->addDays(8)->addHours(6),
            'city' => 'Jakarta',
            'venue_name' => 'JCC Senayan',
            'address' => 'Jl. Gatot Subroto No. 12',
            'status' => 'PUBLISHED',
        ]);

        // Ticket created for $this->event
        $ticket = $this->createTicket('ACTIVE', 'PAID', $this->event);

        // Scan with filter set to $otherEvent->id
        $response = $this->actingAs($this->admin)
            ->from('/admin/scanner')
            ->post('/admin/scanner', [
                'ticket_code' => $ticket->ticket_code,
                'event_id' => $otherEvent->id,
            ]);

        $response->assertRedirect('/admin/scanner');
        $response->assertSessionHas('checkin_result', function (array $result) {
            return $result['outcome'] === 'invalid'
                && str_contains($result['message'], 'bukan event yang sedang difilter');
        });
    }
}
