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
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlatformOperationsAndAuthTest extends TestCase
{
    use RefreshDatabase;

    private function makeCategory(): Category
    {
        return Category::create([
            'name' => 'Teknologi '.Str::random(4),
            'slug' => 'teknologi-'.strtolower(Str::random(5)),
            'icon' => 'sparkles',
        ]);
    }

    public function test_custom_inertia_error_pages_render_for_404_and_403(): void
    {
        $this->get('/halaman-tidak-ditemukan-sama-sekali')
            ->assertStatus(404)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Error')
                ->where('status', 404)
            );

        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/admin/dashboard')
            ->assertStatus(403)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Error')
                ->where('status', 403)
            );
    }

    public function test_expire_pending_orders_command_expires_overdue_orders_and_restores_quota(): void
    {
        $eo = User::factory()->eo()->create();
        $buyer = User::factory()->create();
        $category = $this->makeCategory();

        $event = Event::create([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Konser Scheduler Test',
            'slug' => 'konser-scheduler-'.strtolower(Str::random(5)),
            'description' => 'Event uji coba kedaluwarsa pesanan.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://example.com/live',
            'starts_at' => now()->addDays(5),
            'ends_at' => now()->addDays(5)->addHours(3),
            'status' => 'PUBLISHED',
        ]);

        $ticketType = TicketType::create([
            'event_id' => $event->id,
            'name' => 'VIP',
            'initial_quota' => 50,
            'quota' => 45,
            'status' => 'ACTIVE',
        ]);

        $expiredOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-EXP-001',
            'status' => 'PENDING',
            'total_amount' => 300000,
            'expires_at' => now()->subMinutes(5),
        ]);

        OrderItem::create([
            'order_id' => $expiredOrder->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 3,
            'unit_price' => 100000,
        ]);

        Payment::create([
            'order_id' => $expiredOrder->id,
            'payment_reference' => 'PAY-EXP-001',
            'method' => 'QRIS',
            'status' => 'PENDING',
            'amount' => 300000,
        ]);

        $activePendingOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-ACTIVE-002',
            'status' => 'PENDING',
            'total_amount' => 200000,
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->artisan('hajirin:expire-pending-orders')->assertSuccessful();

        $this->assertSame('EXPIRED', $expiredOrder->fresh()->status);
        $this->assertSame('PENDING', $activePendingOrder->fresh()->status);
        $this->assertSame(48, (int) $ticketType->fresh()->quota);
        $this->assertDatabaseHas('payments', [
            'order_id' => $expiredOrder->id,
            'status' => 'FAILED',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $buyer->id,
            'type' => 'PAYMENT_FAILED',
        ]);
    }

    public function test_sync_event_statuses_command_transitions_ongoing_and_completed_events(): void
    {
        $eo = User::factory()->eo()->create();
        $category = $this->makeCategory();

        $ongoingEvent = Event::create([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Event Sedang Berlangsung',
            'slug' => 'event-ongoing-'.strtolower(Str::random(5)),
            'description' => 'Event sedang berlangsung.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://example.com/ongoing',
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addHour(),
            'status' => 'PUBLISHED',
        ]);

        $completedEvent = Event::create([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Event Sudah Selesai',
            'slug' => 'event-completed-'.strtolower(Str::random(5)),
            'description' => 'Event sudah selesai.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://example.com/done',
            'starts_at' => now()->subHours(5),
            'ends_at' => now()->subHour(),
            'status' => 'PUBLISHED',
        ]);

        $futureEvent = Event::create([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Event Mendatang',
            'slug' => 'event-future-'.strtolower(Str::random(5)),
            'description' => 'Event belum dimulai.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://example.com/future',
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(2)->addHours(2),
            'status' => 'PUBLISHED',
        ]);

        $this->artisan('hajirin:sync-event-statuses')->assertSuccessful();

        $this->assertSame('ONGOING', $ongoingEvent->fresh()->status);
        $this->assertSame('COMPLETED', $completedEvent->fresh()->status);
        $this->assertSame('PUBLISHED', $futureEvent->fresh()->status);
    }

    public function test_eo_can_broadcast_announcement_only_to_active_attendees_of_own_event(): void
    {
        $eo = User::factory()->eo()->create();
        $otherEo = User::factory()->eo()->create();
        $attendeeOne = User::factory()->create();
        $attendeeTwo = User::factory()->create();
        $cancelledAttendee = User::factory()->create();
        $category = $this->makeCategory();

        $event = Event::create([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Workshop Laravel 13',
            'slug' => 'workshop-laravel-13',
            'description' => 'Workshop intensif.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://example.com/zoom',
            'starts_at' => now()->addDays(3),
            'ends_at' => now()->addDays(3)->addHours(3),
            'status' => 'PUBLISHED',
        ]);

        $ticketType = TicketType::create([
            'event_id' => $event->id,
            'name' => 'Reguler',
            'initial_quota' => 100,
            'quota' => 97,
            'status' => 'ACTIVE',
        ]);

        foreach ([$attendeeOne, $attendeeTwo] as $idx => $buyer) {
            $order = Order::create([
                'user_id' => $buyer->id,
                'event_id' => $event->id,
                'order_reference' => 'HJR-BC-'.$idx,
                'status' => 'PAID',
                'total_amount' => 50000,
                'expires_at' => now()->addMinutes(15),
                'paid_at' => now(),
            ]);

            $item = OrderItem::create([
                'order_id' => $order->id,
                'ticket_type_id' => $ticketType->id,
                'quantity' => 1,
                'unit_price' => 50000,
            ]);

            Ticket::create([
                'order_id' => $order->id,
                'order_item_id' => $item->id,
                'ticket_code' => 'HJR-TKT-BC-'.$idx,
                'attendee_name' => $buyer->name,
                'attendee_email' => $buyer->email,
                'status' => 'ACTIVE',
            ]);
        }

        // Peserta dengan tiket dibatalkan tidak boleh menerima pengumuman
        $cancelledOrder = Order::create([
            'user_id' => $cancelledAttendee->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-BC-CANCEL',
            'status' => 'PAID',
            'total_amount' => 50000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);

        $cancelledItem = OrderItem::create([
            'order_id' => $cancelledOrder->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 1,
            'unit_price' => 50000,
        ]);

        Ticket::create([
            'order_id' => $cancelledOrder->id,
            'order_item_id' => $cancelledItem->id,
            'ticket_code' => 'HJR-TKT-BC-CANCEL',
            'attendee_name' => $cancelledAttendee->name,
            'attendee_email' => $cancelledAttendee->email,
            'status' => 'CANCELLED',
        ]);

        // EO lain tidak bisa broadcast ke event milik EO ini
        $this->actingAs($otherEo)
            ->post('/eo/broadcasts', [
                'event_id' => $event->id,
                'title' => 'Pengumuman Tidak Sah',
                'message' => 'Mencoba mengirim pengumuman ke event penyelenggara lain.',
            ])
            ->assertStatus(404);

        $this->actingAs($eo)
            ->post('/eo/broadcasts', [
                'event_id' => $event->id,
                'title' => 'Link Zoom & Materi',
                'message' => 'Pintu masuk ruang Zoom dibuka 30 menit sebelum acara dimulai.',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame(
            2,
            DB::table('notifications')->where('type', 'EVENT_UPDATED')->count()
        );
        $this->assertDatabaseHas('notifications', [
            'user_id' => $attendeeOne->id,
            'type' => 'EVENT_UPDATED',
        ]);
        $this->assertDatabaseMissing('notifications', [
            'user_id' => $cancelledAttendee->id,
            'type' => 'EVENT_UPDATED',
        ]);
    }

    public function test_guest_can_request_and_complete_password_reset(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'resetme@example.com',
            'password' => Hash::make('old-password-123'),
        ]);

        $this->get('/forgot-password')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->component('Auth/ForgotPassword'));

        $this->post('/forgot-password', ['email' => 'resetme@example.com'])
            ->assertRedirect()
            ->assertSessionHas('status');

        Notification::assertSentTo($user, ResetPasswordNotification::class);

        $token = Password::broker()->createToken($user);

        $this->get("/reset-password/{$token}?email=resetme@example.com")
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/ResetPassword')
                ->where('token', $token)
                ->where('email', 'resetme@example.com')
            );

        $this->post('/reset-password', [
            'token' => 'token-salah',
            'email' => 'resetme@example.com',
            'password' => 'new-password-456',
            'password_confirmation' => 'new-password-456',
        ])->assertSessionHasErrors(['email']);

        $this->post('/reset-password', [
            'token' => $token,
            'email' => 'resetme@example.com',
            'password' => 'new-password-456',
            'password_confirmation' => 'new-password-456',
        ])
            ->assertRedirect(route('home'))
            ->assertSessionHas('success');

        $this->assertTrue(Hash::check('new-password-456', $user->fresh()->password));
    }

    public function test_admin_global_search_returns_cross_entity_matches_and_blocks_non_admins(): void
    {
        $admin = User::factory()->admin()->create();
        $regularUser = User::factory()->create([
            'name' => 'Budi Nusantara',
            'email' => 'budi.nusantara@example.com',
        ]);
        $eo = User::factory()->eo()->create([
            'name' => 'Nusantara EO',
            'email' => 'eo.nusantara@example.com',
        ]);
        $category = $this->makeCategory();

        $event = Event::create([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Festival Nusantara 2026',
            'slug' => 'festival-nusantara-2026',
            'description' => 'Festival budaya nusantara.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://example.com/nusantara',
            'starts_at' => now()->addDays(14),
            'ends_at' => now()->addDays(14)->addHours(4),
            'status' => 'PUBLISHED',
        ]);

        Order::create([
            'user_id' => $regularUser->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-NUSANTARA-77',
            'status' => 'PAID',
            'total_amount' => 100000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);

        $this->actingAs($regularUser)->get('/admin/search?q=nusantara')->assertStatus(403);

        $this->actingAs($admin)
            ->getJson('/admin/search?q=a')
            ->assertStatus(200)
            ->assertExactJson([
                'events' => [],
                'orders' => [],
                'organizers' => [],
                'users' => [],
            ]);

        $this->actingAs($admin)
            ->getJson('/admin/search?q=nusantara')
            ->assertStatus(200)
            ->assertJsonCount(1, 'events')
            ->assertJsonCount(1, 'orders')
            ->assertJsonCount(1, 'organizers')
            ->assertJsonPath('events.0.label', 'Festival Nusantara 2026')
            ->assertJsonPath('orders.0.label', 'HJR-NUSANTARA-77');
    }
}
