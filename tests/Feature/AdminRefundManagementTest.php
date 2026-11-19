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
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminRefundManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $eo;

    private User $buyer;

    private Event $event;

    private TicketType $ticketType;

    private Order $order;

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
            'title' => 'Indie Fest 2026',
            'slug' => 'indie-fest-2026',
            'description' => 'Festival musik indie seru di Jakarta.',
            'event_type' => 'OFFLINE',
            'starts_at' => now()->addDays(7),
            'ends_at' => now()->addDays(7)->addHours(4),
            'city' => 'Jakarta',
            'venue_name' => 'Istora Senayan',
            'address' => 'Jl. Pintu Satu Senayan, Jakarta Pusat',
            'status' => 'PUBLISHED',
        ]);

        $this->ticketType = TicketType::create([
            'event_id' => $this->event->id,
            'name' => 'Festival Pass',
            'initial_quota' => 20,
            'quota' => 19,
            'status' => 'ACTIVE',
        ]);

        $this->order = Order::create([
            'user_id' => $this->buyer->id,
            'event_id' => $this->event->id,
            'order_reference' => 'HJR-REF-001',
            'status' => 'PAID',
            'total_amount' => 300000.00,
            'paid_at' => now(),
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $this->order->id,
            'ticket_type_id' => $this->ticketType->id,
            'quantity' => 1,
            'unit_price' => 300000.00,
        ]);

        Ticket::create([
            'order_id' => $this->order->id,
            'order_item_id' => $orderItem->id,
            'ticket_code' => 'TKT-REF-001',
            'attendee_name' => $this->buyer->name,
            'attendee_email' => $this->buyer->email,
            'status' => 'ACTIVE',
        ]);
    }

    private function createRefund(string $status = 'PENDING'): Refund
    {
        return Refund::create([
            'order_id' => $this->order->id,
            'requested_by' => $this->buyer->id,
            'amount' => 300000.00,
            'reason' => 'Acara bertabrakan dengan jadwal ujian kuliah semester akhir.',
            'status' => $status,
            'requested_at' => now(),
        ]);
    }

    public function test_guests_and_regular_users_cannot_access_refunds(): void
    {
        $responseGuest = $this->get('/admin/refunds');
        $responseGuest->assertRedirect('/');

        $responseUser = $this->actingAs($this->buyer)->get('/admin/refunds');
        $responseUser->assertForbidden();
    }

    public function test_admin_can_view_refunds_index(): void
    {
        $this->createRefund('PENDING');

        $response = $this->actingAs($this->admin)->get('/admin/refunds');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Refunds/Index')
            ->has('refunds.data', 1)
            ->where('refunds.data.0.status', 'PENDING')
            ->where('refunds.data.0.amount', 300000)
            ->has('stats')
            ->where('stats.pending', 1)
        );
    }

    public function test_admin_can_approve_pending_refund(): void
    {
        $initialQuota = $this->ticketType->quota;
        $refund = $this->createRefund('PENDING');

        $response = $this->actingAs($this->admin)
            ->post("/admin/refunds/{$refund->id}/approve", [
                'resolution_note' => 'Refund disetujui, dana telah ditransfer via transfer bank.',
            ]);

        $response->assertSessionHas('success');

        // Refund status APPROVED
        $this->assertDatabaseHas('refunds', [
            'id' => $refund->id,
            'status' => 'APPROVED',
            'processed_by' => $this->admin->id,
        ]);

        // Order cancelled
        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'status' => 'CANCELLED',
        ]);

        // Ticket cancelled
        $this->assertDatabaseHas('tickets', [
            'order_id' => $this->order->id,
            'status' => 'CANCELLED',
        ]);

        // Quota incremented
        $this->assertEquals($initialQuota + 1, $this->ticketType->fresh()->quota);

        // Notification sent
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->buyer->id,
            'type' => 'REFUND_UPDATED',
        ]);
    }

    public function test_admin_can_reject_pending_refund_with_reason(): void
    {
        $refund = $this->createRefund('PENDING');

        $response = $this->actingAs($this->admin)
            ->post("/admin/refunds/{$refund->id}/reject", [
                'resolution_note' => 'Permohonan refund ditolak karena diajukan kurang dari batas ketentuan H-3 event.',
            ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('refunds', [
            'id' => $refund->id,
            'status' => 'REJECTED',
            'processed_by' => $this->admin->id,
        ]);

        // Order & Ticket remain active
        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'status' => 'PAID',
        ]);

        $this->assertDatabaseHas('tickets', [
            'order_id' => $this->order->id,
            'status' => 'ACTIVE',
        ]);

        // Notification sent
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->buyer->id,
            'type' => 'REFUND_UPDATED',
        ]);
    }

    public function test_rejection_requires_resolution_note(): void
    {
        $refund = $this->createRefund('PENDING');

        $response = $this->actingAs($this->admin)
            ->post("/admin/refunds/{$refund->id}/reject", [
                'resolution_note' => '',
            ]);

        $response->assertSessionHasErrors('resolution_note');
    }
}
