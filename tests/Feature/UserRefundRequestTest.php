<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Refund;
use App\Models\Ticket;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserRefundRequestTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{user: User, order: Order, ticket: Ticket}
     */
    private function createOrderFixture(float $totalAmount = 150000, string $orderStatus = 'PAID', string $ticketStatus = 'ACTIVE'): array
    {
        $eo = User::factory()->eo()->create();
        $buyer = User::factory()->create();

        $category = Category::create([
            'name' => 'Seminar '.Str::random(4),
            'slug' => 'seminar-'.strtolower(Str::random(5)),
            'icon' => 'users',
        ]);

        $event = Event::create([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Tech Summit Test',
            'slug' => 'tech-summit-'.strtolower(Str::random(6)),
            'description' => 'Acara seminar uji coba refund.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://example.com/live',
            'starts_at' => now()->addDays(7),
            'ends_at' => now()->addDays(7)->addHours(3),
            'status' => 'PUBLISHED',
        ]);

        $ticketType = TicketType::create([
            'event_id' => $event->id,
            'name' => 'Reguler',
            'initial_quota' => 100,
            'quota' => 99,
            'status' => 'ACTIVE',
        ]);

        $order = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-TEST-'.strtoupper(Str::random(6)),
            'status' => $orderStatus,
            'total_amount' => $totalAmount,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => $orderStatus === 'PAID' ? now() : null,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 1,
            'unit_price' => $totalAmount,
        ]);

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'ticket_code' => 'HJR-TKT-'.strtoupper(Str::random(8)),
            'attendee_name' => $buyer->name,
            'attendee_email' => $buyer->email,
            'status' => $ticketStatus,
            'checked_in_at' => $ticketStatus === 'USED' ? now() : null,
            'checked_in_by' => $ticketStatus === 'USED' ? $eo->id : null,
        ]);

        return [
            'user' => $buyer,
            'order' => $order,
            'ticket' => $ticket,
        ];
    }

    public function test_owner_can_submit_refund_request_and_see_pending_status(): void
    {
        ['user' => $buyer, 'order' => $order] = $this->createOrderFixture();

        $this->actingAs($buyer)
            ->get("/orders/{$order->order_reference}")
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Order/Detail')
                ->where('canRequestRefund', true)
                ->where('refund', null)
            );

        $this->actingAs($buyer)
            ->post("/orders/{$order->order_reference}/refund", [
                'reason' => 'Saya berhalangan hadir karena jadwal ujian kampus bersamaan.',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('refunds', [
            'order_id' => $order->id,
            'requested_by' => $buyer->id,
            'status' => 'PENDING',
            'amount' => '150000.00',
        ]);

        $this->actingAs($buyer)
            ->get("/orders/{$order->order_reference}")
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Order/Detail')
                ->where('canRequestRefund', false)
                ->where('refund.status', 'PENDING')
            );
    }

    public function test_short_reason_and_duplicate_active_refund_are_rejected(): void
    {
        ['user' => $buyer, 'order' => $order] = $this->createOrderFixture();

        $this->actingAs($buyer)
            ->post("/orders/{$order->order_reference}/refund", [
                'reason' => 'Batal',
            ])
            ->assertSessionHasErrors(['reason']);

        $this->actingAs($buyer)
            ->post("/orders/{$order->order_reference}/refund", [
                'reason' => 'Berhalangan hadir karena ada tugas mendadak dari kantor.',
            ])
            ->assertSessionHas('success');

        $this->actingAs($buyer)
            ->post("/orders/{$order->order_reference}/refund", [
                'reason' => 'Mengajukan ulang sebelum diproses oleh administrator.',
            ])
            ->assertSessionHasErrors(['refund']);

        $this->assertSame(1, Refund::query()->where('order_id', $order->id)->count());
    }

    public function test_refund_is_blocked_for_other_users_free_orders_and_used_tickets(): void
    {
        ['order' => $paidOrder] = $this->createOrderFixture(150000, 'PAID', 'ACTIVE');
        $otherUser = User::factory()->create();

        $this->actingAs($otherUser)
            ->post("/orders/{$paidOrder->order_reference}/refund", [
                'reason' => 'Mencoba mengajukan refund atas pesanan orang lain.',
            ])
            ->assertStatus(404);

        ['user' => $freeBuyer, 'order' => $freeOrder] = $this->createOrderFixture(0, 'PAID', 'ACTIVE');
        $this->actingAs($freeBuyer)
            ->post("/orders/{$freeOrder->order_reference}/refund", [
                'reason' => 'Ingin mengajukan refund untuk tiket gratis.',
            ])
            ->assertSessionHasErrors(['refund']);

        ['user' => $usedBuyer, 'order' => $usedOrder] = $this->createOrderFixture(150000, 'PAID', 'USED');
        $this->actingAs($usedBuyer)
            ->post("/orders/{$usedOrder->order_reference}/refund", [
                'reason' => 'Ingin mengajukan refund padahal tiket sudah check-in.',
            ])
            ->assertSessionHasErrors(['refund']);
    }

    public function test_user_can_resubmit_refund_after_rejection(): void
    {
        ['user' => $buyer, 'order' => $order] = $this->createOrderFixture();
        $admin = User::factory()->admin()->create();

        Refund::create([
            'order_id' => $order->id,
            'requested_by' => $buyer->id,
            'processed_by' => $admin->id,
            'amount' => $order->total_amount,
            'reason' => 'Alasan pertama kurang lengkap.',
            'resolution_note' => 'Mohon jelaskan kendala lebih rinci.',
            'status' => 'REJECTED',
            'requested_at' => now()->subHour(),
            'processed_at' => now()->subMinutes(30),
        ]);

        $this->actingAs($buyer)
            ->get("/orders/{$order->order_reference}")
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Order/Detail')
                ->where('canRequestRefund', true)
                ->where('refund.status', 'REJECTED')
                ->where('refund.resolutionNote', 'Mohon jelaskan kendala lebih rinci.')
            );

        $this->actingAs($buyer)
            ->post("/orders/{$order->order_reference}/refund", [
                'reason' => 'Saya mengalami kendala kesehatan mendadak sehingga tidak dapat menghadiri acara.',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('refunds', [
            'order_id' => $order->id,
            'status' => 'PENDING',
        ]);
    }
}
