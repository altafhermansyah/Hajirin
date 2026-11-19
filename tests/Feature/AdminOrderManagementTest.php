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

class AdminOrderManagementTest extends TestCase
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
            'name' => 'Konser & Musik',
            'slug' => 'konser-musik',
        ]);

        $this->event = Event::create([
            'eo_id' => $this->eo->id,
            'category_id' => $category->id,
            'title' => 'Indie Music Fest 2026',
            'slug' => 'indie-music-fest-2026',
            'description' => 'Festival musik indie spektakuler di Surabaya.',
            'event_type' => 'OFFLINE',
            'starts_at' => now()->addDays(10),
            'ends_at' => now()->addDays(10)->addHours(5),
            'city' => 'Surabaya',
            'venue_name' => 'Grand City Convention Hall',
            'address' => 'Jl. Walikota Mustajab No. 1, Surabaya',
            'status' => 'PUBLISHED',
        ]);

        $this->ticketType = TicketType::create([
            'event_id' => $this->event->id,
            'name' => 'VIP Access',
            'initial_quota' => 50,
            'quota' => 50,
            'status' => 'ACTIVE',
        ]);
    }

    private function createOrder(string $status = 'PAID', float $amount = 150000.00): Order
    {
        $this->ticketType->decrement('quota', 1);

        $order = Order::create([
            'user_id' => $this->buyer->id,
            'event_id' => $this->event->id,
            'order_reference' => 'HJR-TEST-'.strtoupper(uniqid()),
            'status' => $status,
            'total_amount' => $amount,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => $status === 'PAID' ? now() : null,
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $this->ticketType->id,
            'quantity' => 1,
            'unit_price' => $amount,
        ]);

        Payment::create([
            'order_id' => $order->id,
            'payment_reference' => 'PAY-'.uniqid(),
            'method' => 'MOCK',
            'status' => $status === 'PAID' ? 'SUCCESS' : 'PENDING',
            'amount' => $amount,
            'paid_at' => $status === 'PAID' ? now() : null,
        ]);

        Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'ticket_code' => 'TKT-'.strtoupper(uniqid()),
            'attendee_name' => $this->buyer->name,
            'attendee_email' => $this->buyer->email,
            'attendee_phone' => '08123456789',
            'status' => 'ACTIVE',
        ]);

        return $order;
    }

    public function test_guests_and_regular_users_cannot_access_orders(): void
    {
        $responseGuest = $this->get('/admin/orders');
        $responseGuest->assertRedirect('/');

        $responseUser = $this->actingAs($this->buyer)->get('/admin/orders');
        $responseUser->assertForbidden();
    }

    public function test_admin_can_view_orders_index(): void
    {
        $this->createOrder('PAID', 250000);

        $response = $this->actingAs($this->admin)->get('/admin/orders');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Orders/Index')
            ->has('orders.data', 1)
            ->where('orders.data.0.status', 'PAID')
            ->where('orders.data.0.totalAmount', 250000)
            ->has('stats')
            ->where('stats.paidOrdersCount', 1)
            ->has('filters')
        );
    }

    public function test_admin_can_filter_orders_by_status(): void
    {
        $this->createOrder('PAID');
        $this->createOrder('PENDING');

        $response = $this->actingAs($this->admin)->get('/admin/orders?status=PENDING');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.status', 'PENDING')
        );
    }

    public function test_admin_can_mark_pending_order_as_paid(): void
    {
        $order = $this->createOrder('PENDING');

        $response = $this->actingAs($this->admin)
            ->patch("/admin/orders/{$order->id}/mark-as-paid");

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'PAID',
        ]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status' => 'SUCCESS',
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->buyer->id,
            'type' => 'PAYMENT_SUCCESS',
        ]);
    }

    public function test_admin_can_view_tickets_index(): void
    {
        $this->createOrder('PAID');

        $response = $this->actingAs($this->admin)->get('/admin/tickets');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Tickets/Index')
            ->has('tickets.data', 1)
            ->where('tickets.data.0.status', 'ACTIVE')
            ->has('stats')
            ->where('stats.activeTickets', 1)
        );
    }

    public function test_admin_can_manual_check_in_ticket(): void
    {
        $order = $this->createOrder('PAID');
        $ticket = $order->tickets->first();

        $response = $this->actingAs($this->admin)
            ->post("/admin/tickets/{$ticket->id}/check-in");

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'status' => 'USED',
            'checked_in_by' => $this->admin->id,
        ]);
    }
}
