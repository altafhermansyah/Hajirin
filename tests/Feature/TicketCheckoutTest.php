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

        // 7. Verifikasi tiket langsung tampil di Dashboard user (1 tiket pass per event sesuai permintaan)
        $dashboardResponse = $this->actingAs($user)->get('/dashboard');
        $dashboardResponse->assertStatus(200);
        $dashboardResponse->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('dashboard.orderCount', 1)
            ->where('dashboard.ticketCount', 2)
            ->has('dashboard.myTickets', 1)
            ->where('dashboard.myTickets.0.quantity', 2)
        );
    }

    public function test_user_cannot_checkout_if_phone_contains_letters(): void
    {
        $user = User::factory()->create();
        $event = Event::where('slug', 'indonesia-tech-conference-2026')->firstOrFail();
        $ticketType = TicketType::where('event_id', $event->id)->where('quota', '>', 0)->firstOrFail();

        $response = $this->actingAs($user)->post('/checkout', [
            'event_id' => $event->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 1,
            'payment_method' => 'qris',
            'attendee_name' => 'Budi Santoso',
            'attendee_email' => 'budi@example.com',
            'attendee_phone' => '0812345ABCDE', // Mengandung huruf
        ]);

        $response->assertSessionHasErrors(['attendee_phone']);
    }

    public function test_user_can_checkout_multiple_different_ticket_types(): void
    {
        $user = User::factory()->create();
        $event = Event::where('slug', 'indonesia-tech-conference-2026')->firstOrFail();

        $tickets = TicketType::where('event_id', $event->id)->where('quota', '>=', 2)->get();
        if ($tickets->count() < 2) {
            $secondTicket = TicketType::create([
                'event_id' => $event->id,
                'name' => 'VIP Access Special',
                'description' => 'Akses VIP',
                'quota' => 20,
                'status' => 'ACTIVE',
            ]);
            $secondTicket->prices()->create([
                'name' => 'Harga VIP',
                'price' => 350000,
                'status' => 'ACTIVE',
            ]);
            $ticket1 = $tickets->first();
            $ticket2 = $secondTicket;
        } else {
            $ticket1 = $tickets[0];
            $ticket2 = $tickets[1];
        }

        $response = $this->actingAs($user)->post('/checkout', [
            'event_id' => $event->id,
            'items' => [
                ['ticket_type_id' => $ticket1->id, 'quantity' => 1, 'ticket_price_id' => $ticket1->activePrice?->id],
                ['ticket_type_id' => $ticket2->id, 'quantity' => 2, 'ticket_price_id' => $ticket2->activePrice?->id],
            ],
            'payment_method' => 'qris',
            'attendee_name' => 'Multi Ticket User',
            'attendee_email' => 'multi@example.com',
            'attendee_phone' => '08987654321',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('order_success');

        $order = Order::where('user_id', $user->id)->firstOrFail();
        $this->assertEquals(2, $order->items()->count());
        $this->assertEquals(3, Ticket::where('order_id', $order->id)->count());

        // Verifikasi dashboard hanya menampilkan 1 tiket pass untuk event tersebut
        $dashboardResponse = $this->actingAs($user)->get('/dashboard');
        $dashboardResponse->assertInertia(fn (Assert $page) => $page
            ->has('dashboard.myTickets', 1)
            ->where('dashboard.myTickets.0.quantity', 3)
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

    public function test_user_can_view_dedicated_my_tickets_detail_page_with_individual_tickets_and_qr(): void
    {
        $user = User::factory()->create();
        $event = Event::where('slug', 'indonesia-tech-conference-2026')->firstOrFail();
        $ticketType = TicketType::where('event_id', $event->id)->where('quota', '>', 2)->firstOrFail();

        $this->actingAs($user)->post('/checkout', [
            'event_id' => $event->id,
            'ticket_type_id' => $ticketType->id,
            'ticket_price_id' => $ticketType->activePrice?->id,
            'quantity' => 2,
            'payment_method' => 'qris',
            'attendee_name' => 'Alice',
            'attendee_email' => 'alice@example.com',
        ]);

        $order = Order::where('user_id', $user->id)->latest('created_at')->firstOrFail();

        $response = $this->actingAs($user)->get("/my-tickets/{$order->order_reference}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Ticket/Detail')
            ->has('order')
            ->has('event')
            ->has('tickets', 2)
            ->where('order.orderReference', $order->order_reference)
            ->where('tickets.0.ticketNumber', 1)
            ->where('tickets.1.ticketNumber', 2)
            ->has('tickets.0.ticketCode')
        );
    }

    public function test_user_can_view_dedicated_order_detail_invoice_page(): void
    {
        $user = User::factory()->create();
        $event = Event::where('slug', 'indonesia-tech-conference-2026')->firstOrFail();
        $ticketType = TicketType::where('event_id', $event->id)->where('quota', '>', 0)->firstOrFail();

        $this->actingAs($user)->post('/checkout', [
            'event_id' => $event->id,
            'ticket_type_id' => $ticketType->id,
            'ticket_price_id' => $ticketType->activePrice?->id,
            'quantity' => 1,
            'payment_method' => 'qris',
            'attendee_name' => 'Bob',
            'attendee_email' => 'bob@example.com',
        ]);

        $order = Order::where('user_id', $user->id)->latest('created_at')->firstOrFail();

        $response = $this->actingAs($user)->get("/orders/{$order->order_reference}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Order/Detail')
            ->has('order')
            ->has('event')
            ->has('items', 1)
            ->where('order.orderReference', $order->order_reference)
            ->where('items.0.ticketName', $ticketType->name)
        );
    }

    public function test_user_cannot_view_another_users_tickets_or_order(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $event = Event::where('slug', 'indonesia-tech-conference-2026')->firstOrFail();
        $ticketType = TicketType::where('event_id', $event->id)->where('quota', '>', 0)->firstOrFail();

        $this->actingAs($user1)->post('/checkout', [
            'event_id' => $event->id,
            'ticket_type_id' => $ticketType->id,
            'ticket_price_id' => $ticketType->activePrice?->id,
            'quantity' => 1,
            'payment_method' => 'qris',
            'attendee_name' => 'Secret',
            'attendee_email' => 'secret@example.com',
        ]);

        $order = Order::where('user_id', $user1->id)->latest('created_at')->firstOrFail();

        // User2 mencoba melihat tiket user1
        $responseTickets = $this->actingAs($user2)->get("/my-tickets/{$order->order_reference}");
        $responseTickets->assertRedirect('/dashboard');

        // User2 mencoba melihat order user1
        $responseOrders = $this->actingAs($user2)->get("/orders/{$order->order_reference}");
        $responseOrders->assertRedirect('/dashboard');
    }
}
