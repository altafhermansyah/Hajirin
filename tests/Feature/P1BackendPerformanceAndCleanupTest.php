<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Jobs\SendEventBroadcastNotificationsJob;
use App\Jobs\SendEventCancelledNotificationsJob;
use App\Mail\EmailOtpMail;
use App\Mail\EventBroadcastMail;
use App\Mail\EventCancelledAttendeeMail;
use App\Models\Category;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Role;
use App\Models\Ticket;
use App\Models\TicketPrice;
use App\Models\TicketType;
use App\Models\User;
use App\Support\Format;
use Database\Seeders\CategorySeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class P1BackendPerformanceAndCleanupTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_syncs_role_id_and_verifies_seed_emails(): void
    {
        $this->seed(DatabaseSeeder::class);

        $adminRoleId = Role::idForCode(Role::ADMIN);
        $eoRoleId = Role::idForCode(Role::EO);
        $userRoleId = Role::idForCode(Role::USER);

        $admin = User::where('email', 'admin@hajirin.com')->firstOrFail();
        $eo = User::where('email', 'eo@hajirin.com')->firstOrFail();
        $peserta = User::where('email', 'peserta@hajirin.com')->firstOrFail();
        $eventSeedEo = User::where('email', 'eo@techinnovation.com')->firstOrFail();

        $this->assertSame($adminRoleId, $admin->role_id);
        $this->assertSame($eoRoleId, $eo->role_id);
        $this->assertSame($userRoleId, $peserta->role_id);
        $this->assertSame($eoRoleId, $eventSeedEo->role_id);

        $this->assertNotNull($admin->email_verified_at);
        $this->assertNotNull($eo->email_verified_at);
        $this->assertNotNull($peserta->email_verified_at);
        $this->assertNotNull($eventSeedEo->email_verified_at);
    }

    public function test_category_page_filters_category_in_sql_even_with_over_100_events_in_other_category(): void
    {
        $this->seed(CategorySeeder::class);

        $eo = User::factory()->eo()->create();
        $categories = Category::orderBy('id')->take(2)->get();
        $firstCategory = $categories[0];
        $secondCategory = $categories[1];

        $bulkRows = [];
        $now = now();
        for ($i = 1; $i <= 105; $i++) {
            $bulkRows[] = [
                'id' => (string) str()->uuid(),
                'eo_id' => $eo->id,
                'category_id' => $firstCategory->id,
                'title' => "Event Kategori Satu {$i}",
                'slug' => "event-kategori-satu-{$i}",
                'description' => 'Deskripsi event kategori pertama untuk pengujian filter SQL.',
                'event_type' => 'ONLINE',
                'online_url' => 'https://zoom.us/j/111222333',
                'starts_at' => $now->copy()->addDays(1)->addMinutes($i),
                'ends_at' => $now->copy()->addDays(1)->addHours(2)->addMinutes($i),
                'status' => 'PUBLISHED',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('events')->insert($bulkRows);

        $targetEvent = new Event([
            'eo_id' => $eo->id,
            'category_id' => $secondCategory->id,
            'title' => 'Event Target Kategori Kedua',
            'slug' => 'event-target-kategori-kedua',
            'description' => 'Event kategori kedua yang dimulai paling akhir namun harus tetap tampil saat difilter.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/999888777',
            'starts_at' => $now->copy()->addDays(30),
            'ends_at' => $now->copy()->addDays(30)->addHours(2),
        ]);
        $targetEvent->forceFill(['status' => 'PUBLISHED'])->save();

        $this->get("/kategori/{$secondCategory->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('events', 1)
                ->where('events.0.slug', 'event-target-kategori-kedua')
            );
    }

    public function test_broadcast_and_event_cancellation_dispatch_queued_jobs_and_reach_transfer_recipients(): void
    {
        $this->seed(CategorySeeder::class);

        $eo = User::factory()->eo()->create();
        $buyer = User::factory()->create(['email' => 'buyer@example.com']);
        $recipient = User::factory()->create(['name' => 'Penerima Transfer', 'email' => 'holder@example.com']);
        $category = Category::firstOrFail();

        $event = new Event([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Konser Queued Notification',
            'slug' => 'konser-queued-notification',
            'description' => 'Acara untuk menguji job notifikasi broadcast dan pembatalan event.',
            'event_type' => 'OFFLINE',
            'city' => 'Bandung',
            'venue_name' => 'Sabuga',
            'address' => 'Jl. Tamansari No. 73',
            'starts_at' => now()->addDays(5),
            'ends_at' => now()->addDays(5)->addHours(3),
        ]);
        $event->forceFill(['status' => 'PUBLISHED'])->save();

        $ticketType = new TicketType([
            'event_id' => $event->id,
            'name' => 'Festival Pass',
            'initial_quota' => 50,
            'quota' => 49,
            'max_per_order' => 5,
        ]);
        $ticketType->forceFill(['status' => 'ACTIVE'])->save();

        $ticketPrice = new TicketPrice([
            'ticket_type_id' => $ticketType->id,
            'name' => 'Resmi',
            'price' => 100000,
        ]);
        $ticketPrice->forceFill(['status' => 'ACTIVE'])->save();

        $order = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-20261127-JOB001',
            'status' => 'PAID',
            'total_amount' => 100000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'ticket_price_id' => $ticketPrice->id,
            'quantity' => 1,
            'unit_price' => 100000,
        ]);

        // Tiket sudah ditransfer ke $recipient (holder_user_id != orders.user_id)
        Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'holder_user_id' => $recipient->id,
            'ticket_code' => 'HJR-TKT-2026-TRNS0001',
            'attendee_name' => $recipient->name,
            'attendee_email' => $recipient->email,
            'status' => 'ACTIVE',
        ]);

        // 1. Broadcast men-dispatch job setelah commit
        Queue::fake();
        $this->actingAs($eo)->post('/eo/broadcasts', [
            'event_id' => $event->id,
            'title' => 'Perubahan Jam Open Gate',
            'message' => 'Open gate dimajukan 30 menit lebih awal untuk seluruh pemegang tiket.',
            'send_email' => true,
        ])->assertSessionHas('success');

        Queue::assertPushed(SendEventBroadcastNotificationsJob::class);

        // 2. Eksekusi langsung job broadcast menjangkau penerima transfer (holder_user_id)
        Mail::fake();
        (new SendEventBroadcastNotificationsJob(
            eventId: $event->id,
            eventTitle: $event->title,
            eventSlug: $event->slug,
            announcementTitle: 'Perubahan Jam Open Gate',
            announcementMessage: 'Open gate dimajukan 30 menit lebih awal.',
            organizerName: 'EO Resmi',
            sendEmail: true,
        ))->handle();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $recipient->id,
            'type' => 'EVENT_UPDATED',
        ]);
        Mail::assertQueued(EventBroadcastMail::class, fn (EventBroadcastMail $mail) => $mail->hasTo('holder@example.com'));

        // 3. Pembatalan event men-dispatch SendEventCancelledNotificationsJob & mengirim notifikasi + email ke holder
        Queue::fake();
        $this->actingAs($eo)->post("/eo/events/{$event->id}/cancel", [
            'cancellation_reason' => 'Force majeure cuaca ekstrem di lokasi acara.',
        ])->assertSessionHas('success');

        Queue::assertPushed(SendEventCancelledNotificationsJob::class);

        Mail::fake();
        (new SendEventCancelledNotificationsJob(
            eventId: $event->id,
            eventTitle: $event->title,
            eventDate: Format::wib($event->starts_at),
            cancellationReason: 'Force majeure cuaca ekstrem di lokasi acara.',
        ))->handle();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $recipient->id,
            'type' => 'EVENT_CANCELLED',
        ]);
        Mail::assertQueued(EventCancelledAttendeeMail::class, fn (EventCancelledAttendeeMail $mail) => $mail->hasTo('holder@example.com'));
    }

    public function test_email_otp_mail_implements_should_queue_and_admin_counts_are_cached(): void
    {
        $this->assertTrue(is_subclass_of(EmailOtpMail::class, ShouldQueue::class));

        $admin = User::factory()->admin()->create();
        Cache::forget(HandleInertiaRequests::ADMIN_COUNTS_CACHE_KEY);

        $this->actingAs($admin)->get('/admin/dashboard')->assertOk();

        $this->assertTrue(Cache::has(HandleInertiaRequests::ADMIN_COUNTS_CACHE_KEY));
        $this->assertSame('Rp150.000', Format::rupiah(150000));
        $this->assertSame('Gratis', Format::rupiah(0, freeLabel: true));
    }
}
