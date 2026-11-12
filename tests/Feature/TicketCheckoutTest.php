<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketType;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Database\Seeders\EventSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TicketCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CategorySeeder::class);
        $this->seed(EventSeeder::class);
    }

    public function test_unauthenticated_user_is_redirected_from_checkout(): void
    {
        $response = $this->get('/checkout');

        $response->assertRedirect('/');
    }

    public function test_authenticated_user_can_view_checkout_page(): void
    {
        $user = User::factory()->create();
        $event = Event::where('slug', 'indonesia-tech-conference-2026')->firstOrFail();
        $ticketType = TicketType::where('event_id', $event->id)->where('quota', '>', 0)->firstOrFail();

        $response = $this->actingAs($user)->get("/checkout?event={$event->slug}&ticket_id={$ticketType->id}&qty=2");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Event/Checkout')
            ->has('event')
            ->has('ticket')
            ->where('event.id', $event->id)
            ->where('ticket.id', $ticketType->id)
            ->where('initialQuantity', 2)
        );
    }

    public function test_user_can_successfully_order_tickets_and_records_are_saved_in_database(): void
    {
        $user = User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
        ]);

        $event = Event::where('slug', 'indonesia-tech-conference-2026')->firstOrFail();
        $ticketType = TicketType::where('event_id', $event->id)->where('quota', '>', 0)->firstOrFail();
        $initialQuota = $ticketType->quota;
        $activePrice = $ticketType->activePrice;

        $orderPayload = [
            'event_id' => $event->id,
            'ticket_type_id' => $ticketType->id,
            'ticket_price_id' => $activePrice?->id,
            'quantity' => 2,
            'payment_method' => 'qris',
            'attendee_name' => 'Budi Santoso',
            'attendee_email' => 'budi@example.com',
            'attendee_phone' => '081234567890',
        ];

        $response = $this->actingAs($user)->post('/checkout', $orderPayload);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('order_success');

        // 1. Verifikasi Order tersimpan di tabel orders
        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'event_id' => $event->id,
            'status' => 'PAID',
        ]);

        $order = Order::where('user_id', $user->id)->firstOrFail();
        $this->assertNotNull($order->order_reference);
        $this->assertNotNull($order->paid_at);

        // 2. Verifikasi OrderItem tersimpan di tabel order_items
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 2,
        ]);

        // 3. Verifikasi E-Tiket (2 buah tiket) tersimpan di tabel tickets
        $tickets = Ticket::where('order_id', $order->id)->get();
        $this->assertCount(2, $tickets);
        foreach ($tickets as $t) {
            $this->assertEquals('ACTIVE', $t->status);
            $this->assertEquals('Budi Santoso', $t->attendee_name);
            $this->assertEquals('budi@example.com', $t->attendee_email);
            $this->assertEquals('081234567890', $t->attendee_phone);
            $this->assertStringStartsWith('HJR-TKT-', $t->ticket_code);
        }

        // 4. Verifikasi Payment tersimpan di tabel payments
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status' => 'SUCCESS',
            'method' => 'QRIS',
        ]);

        // 5. Verifikasi Kuota tiket berkurang
        $ticketType->refresh();
        $this->assertEquals($initialQuota - 2, $ticketType->quota);

        // 6. Verifikasi Notifikasi tercatat di tabel notifications
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'PAYMENT_SUCCESS',
        ]);

        // 7. Verifikasi tiket langsung tampil di Dashboard user
        $dashboardResponse = $this->actingAs($user)->get('/dashboard');
        $dashboardResponse->assertStatus(200);
        $dashboardResponse->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('dashboard.orderCount', 1)
            ->where('dashboard.ticketCount', 2)
            ->has('dashboard.myTickets', 2)
        );
    }

    public function test_user_cannot_order_tickets_if_quota_is_insufficient(): void
    {
        $user = User::factory()->create();
        $event = Event::where('slug', 'indonesia-tech-conference-2026')->firstOrFail();
        $soldOutTicket = TicketType::where('event_id', $event->id)->where('quota', 0)->firstOrFail();

        $response = $this->actingAs($user)->post('/checkout', [
            'event_id' => $event->id,
            'ticket_type_id' => $soldOutTicket->id,
            'quantity' => 1,
            'payment_method' => 'qris',
            'attendee_name' => 'John Doe',
            'attendee_email' => 'john@example.com',
        ]);

        $response->assertSessionHasErrors(['quantity']);
    }

    public function test_user_cannot_order_tickets_for_unpublished_event_or_inactive_price(): void
    {
        $user = User::factory()->create();
        $event = Event::where('slug', 'indonesia-tech-conference-2026')->firstOrFail();
        $ticketType = TicketType::where('event_id', $event->id)->where('quota', '>', 0)->firstOrFail();
        $activePrice = $ticketType->activePrice;

        $activePrice->update(['status' => 'INACTIVE']);

        $response = $this->actingAs($user)->post('/checkout', [
            'event_id' => $event->id,
            'ticket_type_id' => $ticketType->id,
            'ticket_price_id' => $activePrice->id,
            'quantity' => 1,
            'payment_method' => 'qris',
            'attendee_name' => 'John Doe',
            'attendee_email' => 'john@example.com',
        ]);

        $response->assertStatus(404);
    }
}
