<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\EventStaff;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Refund;
use App\Models\Ticket;
use App\Models\TicketPrice;
use App\Models\TicketType;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class P0SecurityAndFinancialIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CategorySeeder::class);
    }

    public function test_checkout_blocks_null_active_price_enforces_max_per_order_and_allows_legitimate_free_tickets(): void
    {
        $eo = User::factory()->eo()->create();
        $buyer = User::factory()->create(['email_verified_at' => now()]);

        [$event, $paidType, $paidPrice] = $this->createEventWithTicket($eo, 'Konser Validasi Harga', 'PUBLISHED', 150000, maxPerOrder: 2);

        // 1. Jika harga sedang di luar jendela waktu (tidak ada active price), checkout tidak boleh jatuh ke Rp0
        $paidPrice->forceFill(['starts_at' => now()->addDays(2), 'ends_at' => now()->addDays(5)])->save();

        $this->actingAs($buyer)->post('/checkout', [
            'event_id' => $event->id,
            'ticket_type_id' => $paidType->id,
            'quantity' => 1,
            'payment_method' => 'qris',
            'attendee_name' => 'Pembeli Uji',
            'attendee_email' => 'pembeli@example.com',
        ])->assertSessionHasErrors('quantity');

        $this->assertSame(0, Order::count());

        // Aktifkan kembali harga
        $paidPrice->forceFill(['starts_at' => null, 'ends_at' => null])->save();

        // 2. Tolak jumlah melebihi max_per_order (2)
        $this->actingAs($buyer)->post('/checkout', [
            'event_id' => $event->id,
            'ticket_type_id' => $paidType->id,
            'quantity' => 3,
            'payment_method' => 'qris',
            'attendee_name' => 'Pembeli Uji',
            'attendee_email' => 'pembeli@example.com',
        ])->assertSessionHasErrors('quantity');

        // 3. Tolak items dengan ticket_type_id duplikat untuk mengakali max_per_order
        $this->actingAs($buyer)->post('/checkout', [
            'event_id' => $event->id,
            'items' => [
                ['ticket_type_id' => $paidType->id, 'ticket_price_id' => $paidPrice->id, 'quantity' => 2],
                ['ticket_type_id' => $paidType->id, 'ticket_price_id' => $paidPrice->id, 'quantity' => 2],
            ],
            'payment_method' => 'qris',
            'attendee_name' => 'Pembeli Uji',
            'attendee_email' => 'pembeli@example.com',
        ])->assertSessionHasErrors('items.0.ticket_type_id');

        // 4. Tiket gratis resmi (baris ticket_prices aktif dengan price = 0) tetap berjalan normal & langsung PAID
        [$freeEvent, $freeType, $freePrice] = $this->createEventWithTicket($eo, 'Seminar Gratis Resmi', 'PUBLISHED', 0, maxPerOrder: 2);

        $this->actingAs($buyer)->post('/checkout', [
            'event_id' => $freeEvent->id,
            'ticket_type_id' => $freeType->id,
            'ticket_price_id' => $freePrice->id,
            'quantity' => 1,
            'payment_method' => 'qris',
            'attendee_name' => 'Peserta Gratis',
            'attendee_email' => 'gratis@example.com',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('orders', [
            'event_id' => $freeEvent->id,
            'status' => 'PAID',
            'total_amount' => 0,
        ]);
    }

    public function test_admin_financial_report_does_not_double_deduct_full_refunds_and_includes_completed_refunds(): void
    {
        $admin = User::factory()->admin()->create();
        $eo = User::factory()->eo()->create();
        $buyer = User::factory()->create();

        [$event, $ticketType] = $this->createEventWithTicket($eo, 'Konferensi Akuntansi', 'PUBLISHED', 100000);

        // Order 1: PAID Rp100.000
        $this->createOrderWithTicket($buyer, $event, $ticketType, 'PAID', 100000, 'HJR-TKT-2026-FIN00001');

        // Order 2: Full refund APPROVED -> status CANCELLED tetapi paid_at terisi
        [$refundedOrder] = $this->createOrderWithTicket($buyer, $event, $ticketType, 'CANCELLED', 100000, 'HJR-TKT-2026-FIN00002', 'CANCELLED');
        Refund::forceCreate([
            'order_id' => $refundedOrder->id,
            'requested_by' => $buyer->id,
            'amount' => 100000,
            'reason' => 'Berhalangan hadir.',
            'status' => 'APPROVED',
            'processed_by' => $admin->id,
            'processed_at' => now(),
        ]);

        // Order 3: Partial refund COMPLETED Rp40.000 pada order Rp100.000 yang tetap PAID
        [$partialOrder] = $this->createOrderWithTicket($buyer, $event, $ticketType, 'PAID', 100000, 'HJR-TKT-2026-FIN00003');
        Refund::forceCreate([
            'order_id' => $partialOrder->id,
            'requested_by' => $buyer->id,
            'amount' => 40000,
            'reason' => 'Refund parsial.',
            'status' => 'COMPLETED',
            'processed_by' => $admin->id,
            'processed_at' => now(),
        ]);

        // Gross = 300.000, Refunds (APPROVED + COMPLETED) = 140.000, Net GMV = 160.000
        $this->actingAs($admin)
            ->get('/admin/reports')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.grossRevenue', 300000)
                ->where('summary.totalRefunds', 140000)
                ->where('summary.netGmv', 160000)
                ->where('eventReports.0.grossRevenue', 300000)
                ->where('eventReports.0.refundAmount', 140000)
                ->where('eventReports.0.netRevenue', 160000)
            );
    }

    public function test_pending_refund_blocks_check_in_and_used_ticket_blocks_refund_approval(): void
    {
        $admin = User::factory()->admin()->create();
        $eo = User::factory()->eo()->create();
        $staff = User::factory()->create();
        $buyer = User::factory()->create();

        [$event, $ticketType] = $this->createEventWithTicket($eo, 'Event Anti-Fraud', 'ONGOING', 100000, startsAt: now()->subMinutes(10), endsAt: now()->addHours(3));

        $assignment = new EventStaff(['event_id' => $event->id, 'user_id' => $staff->id]);
        $assignment->forceFill(['role' => 'CHECKIN'])->save();

        // Kasus A: Order memiliki refund PENDING -> EO, Staff, dan Admin tidak bisa check-in
        [$orderWithPendingRefund, $ticketA] = $this->createOrderWithTicket($buyer, $event, $ticketType, 'PAID', 100000, 'HJR-TKT-2026-RFND0001');
        Refund::forceCreate([
            'order_id' => $orderWithPendingRefund->id,
            'requested_by' => $buyer->id,
            'amount' => 100000,
            'reason' => 'Minta refund sebelum acara.',
            'status' => 'PENDING',
        ]);

        $this->actingAs($eo)->post('/eo/check-in', ['ticket_code' => $ticketA->ticket_code]);
        $this->assertSame('invalid', session('checkin_result')['outcome']);
        $this->assertSame('ACTIVE', $ticketA->fresh()->status);

        $this->actingAs($staff)->post('/staff/check-in', ['ticket_code' => $ticketA->ticket_code]);
        $this->assertSame('invalid', session('checkin_result')['outcome']);
        $this->assertSame('ACTIVE', $ticketA->fresh()->status);

        $this->actingAs($admin)->post("/admin/tickets/{$ticketA->id}/check-in")
            ->assertSessionHasErrors('ticket');
        $this->assertSame('ACTIVE', $ticketA->fresh()->status);

        // Kasus B: Tiket sudah USED -> AdminRefundController@approve wajib menolak
        [$usedOrder, $usedTicket] = $this->createOrderWithTicket($buyer, $event, $ticketType, 'PAID', 100000, 'HJR-TKT-2026-USED0001', 'USED', $eo->id);
        $refundOnUsed = Refund::forceCreate([
            'order_id' => $usedOrder->id,
            'requested_by' => $buyer->id,
            'amount' => 100000,
            'reason' => 'Coba refund setelah masuk.',
            'status' => 'PENDING',
        ]);

        $this->actingAs($admin)
            ->post("/admin/refunds/{$refundOnUsed->id}/approve", ['resolution_note' => 'Tes'])
            ->assertSessionHasErrors('refund');

        $this->assertSame('PENDING', $refundOnUsed->fresh()->status);
        $this->assertSame('USED', $usedTicket->fresh()->status);
    }

    public function test_admin_mark_as_paid_rejects_expired_and_cancelled_orders(): void
    {
        $admin = User::factory()->admin()->create();
        $eo = User::factory()->eo()->create();
        $buyer = User::factory()->create();

        [$event, $ticketType] = $this->createEventWithTicket($eo, 'Event Anti-Oversell', 'PUBLISHED', 100000);

        $expiredStatusOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-20261127-EXP001',
            'status' => 'EXPIRED',
            'total_amount' => 100000,
            'expires_at' => now()->subMinutes(30),
        ]);

        $pastDuePendingOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-20261127-EXP002',
            'status' => 'PENDING',
            'total_amount' => 100000,
            'expires_at' => now()->subMinute(),
        ]);

        $this->actingAs($admin)
            ->patch("/admin/orders/{$expiredStatusOrder->id}/mark-as-paid")
            ->assertSessionHasErrors('order');

        $this->actingAs($admin)
            ->patch("/admin/orders/{$pastDuePendingOrder->id}/mark-as-paid")
            ->assertSessionHasErrors('order');

        $this->assertSame('EXPIRED', $expiredStatusOrder->fresh()->status);
        $this->assertSame('PENDING', $pastDuePendingOrder->fresh()->status);
    }

    public function test_suspended_user_is_logged_out_by_middleware_and_sessions_are_revoked_on_suspend_and_password_reset(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['status' => 'ACTIVE', 'email' => 'active-user@example.com']);

        // Sisipkan sesi aktif milik user
        DB::table('sessions')->insert([
            'id' => 'sess-user-device-1',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'payload' => 'payload',
            'last_activity' => now()->timestamp,
        ]);

        // Suspend oleh admin menghapus sesi dari tabel sessions
        $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}/toggle-status")
            ->assertSessionHas('success');

        $this->assertSame('SUSPENDED', $user->fresh()->status);
        $this->assertDatabaseMissing('sessions', ['id' => 'sess-user-device-1']);

        // Middleware EnsureUserIsActive memaksa logout user suspended yang mencoba akses route auth
        $this->actingAs($user->fresh())
            ->get('/dashboard')
            ->assertRedirect('/')
            ->assertSessionHas('error');

        $this->assertGuest();

        // Reset password menghapus sesi perangkat lain
        $user->forceFill(['status' => 'ACTIVE'])->save();
        DB::table('sessions')->insert([
            'id' => 'sess-other-device',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.2',
            'user_agent' => 'OtherDevice',
            'payload' => 'payload',
            'last_activity' => now()->timestamp,
        ]);

        $token = Password::createToken($user);

        $this->post('/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'PasswordBaru123!',
            'password_confirmation' => 'PasswordBaru123!',
        ])->assertRedirect('/');

        $this->assertDatabaseMissing('sessions', ['id' => 'sess-other-device']);
    }

    public function test_published_event_sensitive_edit_returns_to_pending_review_and_online_url_is_private_to_paid_ticket_holders(): void
    {
        $eo = User::factory()->eo()->create();
        $buyer = User::factory()->create();
        $category = Category::firstOrFail();

        $startsAt = now()->addDays(10)->startOfMinute();
        $endsAt = now()->addDays(10)->addHours(3)->startOfMinute();

        [$event, $ticketType, $ticketPrice] = $this->createEventWithTicket(
            $eo,
            'Webinar Privat 2026',
            'PUBLISHED',
            75000,
            startsAt: $startsAt,
            endsAt: $endsAt,
            eventType: 'ONLINE',
            onlineUrl: 'https://zoom.us/j/9988776655'
        );

        // 1. Halaman publik /event/{slug} TIDAK membocorkan online_url maupun organizer_email
        $this->get("/event/{$event->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->missing('eventData.online_url')
                ->missing('eventData.organizer_email')
            );

        // 2. Pembeli PAID melihat onlineUrl pada halaman e-tiket /my-tickets/{orderReference}
        [$paidOrder] = $this->createOrderWithTicket($buyer, $event, $ticketType, 'PAID', 75000, 'HJR-TKT-2026-ONLN0001');

        $this->actingAs($buyer)
            ->get("/my-tickets/{$paidOrder->order_reference}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('event.onlineUrl', 'https://zoom.us/j/9988776655')
            );

        // 3. Edit non-sensitif (hanya naikkan kuota) pada event PUBLISHED mempertahankan status PUBLISHED
        $this->actingAs($eo)->put("/eo/events/{$event->id}", [
            'title' => 'Webinar Privat 2026',
            'category_id' => $category->id,
            'description' => 'Acara resmi yang diselenggarakan melalui platform Hajirin untuk peserta terdaftar.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/9988776655',
            'starts_at' => $startsAt->format('Y-m-d H:i:s'),
            'ends_at' => $endsAt->format('Y-m-d H:i:s'),
            'submit_action' => 'KEEP',
            'tickets' => [
                [
                    'id' => $ticketType->id,
                    'name' => $ticketType->name,
                    'quota' => 150,
                    'max_per_order' => 5,
                    'price' => 75000,
                    'price_tier_name' => 'Harga Resmi',
                ],
            ],
        ])->assertRedirect('/eo/dashboard');

        $this->assertSame('PUBLISHED', $event->fresh()->status);

        // 4. Edit sensitif (ubah judul/online_url) pada event PUBLISHED wajib mengembalikan status ke PENDING_REVIEW
        $this->actingAs($eo)->put("/eo/events/{$event->id}", [
            'title' => 'Webinar Privat 2026 (Judul Diubah)',
            'category_id' => $category->id,
            'description' => 'Acara resmi yang diselenggarakan melalui platform Hajirin untuk peserta terdaftar.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://meet.google.com/new-link-xyz',
            'starts_at' => $startsAt->format('Y-m-d H:i:s'),
            'ends_at' => $endsAt->format('Y-m-d H:i:s'),
            'submit_action' => 'DRAFT',
            'tickets' => [
                [
                    'id' => $ticketType->id,
                    'name' => $ticketType->name,
                    'quota' => 150,
                    'max_per_order' => 5,
                    'price' => 75000,
                    'price_tier_name' => 'Harga Resmi',
                ],
            ],
        ])->assertRedirect('/eo/dashboard');

        $this->assertSame('PENDING_REVIEW', $event->fresh()->status);
    }

    public function test_ongoing_events_remain_accessible_on_public_pages_and_non_http_urls_and_corrupt_images_are_rejected(): void
    {
        Storage::fake('public');

        $eo = User::factory()->eo()->create();
        $category = Category::firstOrFail();

        [$ongoingEvent] = $this->createEventWithTicket(
            $eo,
            'Festival Sedang Berlangsung',
            'ONGOING',
            50000,
            startsAt: now()->subHour(),
            endsAt: now()->addHours(4)
        );

        // Event ONGOING tampil di Home, Kategori, Event Terdekat, dan Detail Event (tidak 404)
        $this->get('/')->assertOk();
        $this->get('/kategori')->assertOk();
        $this->get('/event-terdekat')->assertOk();
        $this->get("/event/{$ongoingEvent->slug}")->assertOk();

        // URL non-http(s) seperti smb:// atau file:// ditolak oleh FormRequest
        $this->actingAs($eo)->put('/eo/profile', [
            'organization_name' => 'EO Aman',
            'contact_phone' => '081234567890',
            'portfolio_url' => 'smb://attacker.local/share',
        ])->assertSessionHasErrors('portfolio_url');

        // Gambar korup (MIME image/jpeg palsu) ditolak oleh storeOptimizedImage, tidak disimpan mentah
        $corruptImage = UploadedFile::fake()->createWithContent('corrupt.jpg', "\xFF\xD8\xFF\xE0not-a-valid-jpeg-body");

        $this->actingAs($eo)->post('/eo/events', [
            'title' => 'Event Dengan Gambar Korup',
            'category_id' => $category->id,
            'description' => 'Deskripsi acara minimal dua puluh karakter untuk pengujian upload gambar korup.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/123456789',
            'starts_at' => now()->addDays(5)->format('Y-m-d H:i:s'),
            'ends_at' => now()->addDays(5)->addHours(2)->format('Y-m-d H:i:s'),
            'banner' => $corruptImage,
            'submit_action' => 'DRAFT',
            'tickets' => [
                [
                    'name' => 'Reguler',
                    'quota' => 50,
                    'max_per_order' => 5,
                    'price' => 50000,
                ],
            ],
        ])->assertSessionHasErrors();

        $this->assertDatabaseMissing('events', ['title' => 'Event Dengan Gambar Korup']);
    }

    /**
     * @return array{0: Event, 1: TicketType, 2: TicketPrice}
     */
    private function createEventWithTicket(
        User $eo,
        string $title,
        string $status,
        float $price,
        int $maxPerOrder = 5,
        ?Carbon $startsAt = null,
        ?Carbon $endsAt = null,
        string $eventType = 'OFFLINE',
        ?string $onlineUrl = null,
    ): array {
        $category = Category::firstOrFail();

        $event = new Event([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => $title,
            'slug' => str($title)->slug()->toString().'-'.strtolower(str()->random(5)),
            'description' => 'Acara resmi yang diselenggarakan melalui platform Hajirin untuk peserta terdaftar.',
            'event_type' => $eventType,
            'city' => $eventType === 'OFFLINE' ? 'Jakarta' : null,
            'venue_name' => $eventType === 'OFFLINE' ? 'Gedung Serbaguna' : null,
            'address' => $eventType === 'OFFLINE' ? 'Jl. Sudirman No. 1, Jakarta' : null,
            'online_url' => $eventType === 'ONLINE' ? $onlineUrl : null,
            'starts_at' => $startsAt ?? now()->addDays(5),
            'ends_at' => $endsAt ?? now()->addDays(5)->addHours(4),
            'banner_path' => '/images/events/tech_hero.webp',
        ]);
        $event->forceFill(['status' => $status])->save();

        $ticketType = new TicketType([
            'event_id' => $event->id,
            'name' => 'Reguler Pass',
            'initial_quota' => 100,
            'quota' => 100,
            'max_per_order' => $maxPerOrder,
        ]);
        $ticketType->forceFill(['status' => 'ACTIVE'])->save();

        $ticketPrice = new TicketPrice([
            'ticket_type_id' => $ticketType->id,
            'name' => 'Harga Resmi',
            'price' => $price,
        ]);
        $ticketPrice->forceFill(['status' => 'ACTIVE'])->save();

        return [$event, $ticketType, $ticketPrice];
    }

    /**
     * @return array{0: Order, 1: Ticket}
     */
    private function createOrderWithTicket(
        User $buyer,
        Event $event,
        TicketType $ticketType,
        string $orderStatus,
        float $amount,
        string $ticketCode,
        string $ticketStatus = 'ACTIVE',
        ?string $checkedInBy = null,
    ): array {
        $order = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-'.now()->format('Ymd').'-'.strtoupper(str()->random(6)),
            'status' => $orderStatus,
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

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'holder_user_id' => $buyer->id,
            'ticket_code' => $ticketCode,
            'attendee_name' => $buyer->name,
            'attendee_email' => $buyer->email,
            'status' => $ticketStatus,
            'checked_in_at' => $ticketStatus === 'USED' ? now()->subMinutes(5) : null,
            'checked_in_by' => $ticketStatus === 'USED' ? $checkedInBy : null,
        ]);

        return [$order, $ticket];
    }
}
