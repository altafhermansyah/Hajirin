<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Ticket;
use App\Models\TicketPrice;
use App\Models\TicketType;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EoAttendeeReportAndCheckInTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CategorySeeder::class);
    }

    public function test_non_eo_users_cannot_access_attendee_report_or_check_in_endpoints(): void
    {
        $regularUser = User::factory()->create(['role' => 'USER']);
        $admin = User::factory()->admin()->create();

        $this->get('/eo/attendees')->assertRedirect('/');
        $this->get('/eo/check-in')->assertRedirect('/');

        $this->actingAs($regularUser)->get('/eo/attendees')->assertForbidden();
        $this->actingAs($regularUser)->get('/eo/attendees/export')->assertForbidden();
        $this->actingAs($regularUser)->get('/eo/check-in')->assertForbidden();
        $this->actingAs($regularUser)->post('/eo/check-in', ['ticket_code' => 'HJR-TKT-2026-TEST0001'])->assertForbidden();

        $this->actingAs($admin)->get('/eo/attendees')->assertForbidden();
        $this->actingAs($admin)->post('/eo/check-in', ['ticket_code' => 'HJR-TKT-2026-TEST0001'])->assertForbidden();
    }

    public function test_eo_attendee_list_and_sales_report_compute_accurate_totals_and_enforce_isolation(): void
    {
        $eoOwner = User::factory()->eo()->create(['name' => 'Promotor Satu']);
        $otherEo = User::factory()->eo()->create(['name' => 'Promotor Dua']);
        $buyer = User::factory()->create();

        [$ownerEvent, $ownerTicketType] = $this->createEventWithTicketType($eoOwner, 'Festival Musik Nusantara', 'PUBLISHED', 150000);
        [$otherEvent, $otherTicketType] = $this->createEventWithTicketType($otherEo, 'Seminar Kompetitor', 'PUBLISHED', 200000);

        // Multi-ticket PAID order (2 x 150.000 = 300.000) — harus terhitung tepat 300.000
        $paidOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $ownerEvent->id,
            'order_reference' => 'HJR-20261113-AAA111',
            'status' => 'PAID',
            'total_amount' => 300000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);

        $paidItem = OrderItem::create([
            'order_id' => $paidOrder->id,
            'ticket_type_id' => $ownerTicketType->id,
            'quantity' => 2,
            'unit_price' => 150000,
        ]);

        Payment::create([
            'order_id' => $paidOrder->id,
            'payment_reference' => 'PAY-20261113-001',
            'method' => 'QRIS',
            'status' => 'SUCCESS',
            'amount' => 300000,
            'paid_at' => now(),
        ]);

        Ticket::create([
            'order_id' => $paidOrder->id,
            'order_item_id' => $paidItem->id,
            'ticket_code' => 'HJR-TKT-2026-ALPHA001',
            'attendee_name' => 'Andi Wijaya',
            'attendee_email' => 'andi@example.com',
            'attendee_phone' => '081111111111',
            'status' => 'ACTIVE',
        ]);

        Ticket::create([
            'order_id' => $paidOrder->id,
            'order_item_id' => $paidItem->id,
            'ticket_code' => 'HJR-TKT-2026-ALPHA002',
            'attendee_name' => 'Budi Santoso',
            'attendee_email' => 'budi@example.com',
            'attendee_phone' => '082222222222',
            'status' => 'USED',
            'checked_in_at' => now()->subMinutes(10),
            'checked_in_by' => $eoOwner->id,
        ]);

        // Pending order harus diabaikan dari laporan penjualan & daftar peserta lunas
        $pendingOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $ownerEvent->id,
            'order_reference' => 'HJR-20261113-PEND01',
            'status' => 'PENDING',
            'total_amount' => 150000,
            'expires_at' => now()->addMinutes(15),
        ]);
        $pendingItem = OrderItem::create([
            'order_id' => $pendingOrder->id,
            'ticket_type_id' => $ownerTicketType->id,
            'quantity' => 1,
            'unit_price' => 150000,
        ]);
        Ticket::create([
            'order_id' => $pendingOrder->id,
            'order_item_id' => $pendingItem->id,
            'ticket_code' => 'HJR-TKT-2026-PEND0001',
            'attendee_name' => 'Peserta Belum Bayar',
            'attendee_email' => 'pending@example.com',
            'status' => 'ACTIVE',
        ]);

        // Order milik EO lain tidak boleh ikut muncul
        $otherOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $otherEvent->id,
            'order_reference' => 'HJR-20261113-OTHER1',
            'status' => 'PAID',
            'total_amount' => 200000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $otherItem = OrderItem::create([
            'order_id' => $otherOrder->id,
            'ticket_type_id' => $otherTicketType->id,
            'quantity' => 1,
            'unit_price' => 200000,
        ]);
        Ticket::create([
            'order_id' => $otherOrder->id,
            'order_item_id' => $otherItem->id,
            'ticket_code' => 'HJR-TKT-2026-OTHER001',
            'attendee_name' => 'Peserta EO Lain',
            'attendee_email' => 'other@example.com',
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($eoOwner)->get('/eo/attendees');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Eo/Attendees')
            ->where('summary.totalRevenue', 300000)
            ->where('summary.paidOrdersCount', 1)
            ->where('summary.totalTicketsSold', 2)
            ->where('summary.checkedInCount', 1)
            ->where('summary.pendingCheckInCount', 1)
            ->where('summary.attendanceRate', 50)
            ->has('ticketTypeBreakdown', 1)
            ->where('ticketTypeBreakdown.0.revenue', 300000)
            ->where('ticketTypeBreakdown.0.soldCount', 2)
            ->has('attendees.data', 2)
        );

        // Filter berdasarkan status USED dan search query + UUID invalid tidak menyebabkan error 500
        $filtered = $this->actingAs($eoOwner)->get('/eo/attendees?ticket_status=USED&search=Budi&event_id=not-a-uuid');

        $filtered->assertOk();
        $filtered->assertInertia(fn (Assert $page) => $page
            ->has('attendees.data', 1)
            ->where('attendees.data.0.ticketCode', 'HJR-TKT-2026-ALPHA002')
        );
    }

    public function test_eo_can_export_filtered_attendees_csv_with_formula_sanitization(): void
    {
        $eoOwner = User::factory()->eo()->create();
        $otherEo = User::factory()->eo()->create();
        $buyer = User::factory()->create();

        [$ownerEvent, $ownerTicketType] = $this->createEventWithTicketType($eoOwner, 'Konferensi Produk', 'PUBLISHED', 100000);
        [$otherEvent, $otherTicketType] = $this->createEventWithTicketType($otherEo, 'Event Rahasia', 'PUBLISHED', 100000);

        $order = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $ownerEvent->id,
            'order_reference' => 'HJR-20261113-CSV001',
            'status' => 'PAID',
            'total_amount' => 100000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $item = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ownerTicketType->id,
            'quantity' => 1,
            'unit_price' => 100000,
        ]);
        Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'ticket_code' => 'HJR-TKT-2026-CSV00001',
            'attendee_name' => '=CMD("calc")',
            'attendee_email' => 'formula@example.com',
            'status' => 'ACTIVE',
        ]);

        $otherOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $otherEvent->id,
            'order_reference' => 'HJR-20261113-CSV999',
            'status' => 'PAID',
            'total_amount' => 100000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $otherItem = OrderItem::create([
            'order_id' => $otherOrder->id,
            'ticket_type_id' => $otherTicketType->id,
            'quantity' => 1,
            'unit_price' => 100000,
        ]);
        Ticket::create([
            'order_id' => $otherOrder->id,
            'order_item_id' => $otherItem->id,
            'ticket_code' => 'HJR-TKT-2026-SECRET99',
            'attendee_name' => 'Rahasia Kompetitor',
            'attendee_email' => 'secret@example.com',
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($eoOwner)->get('/eo/attendees/export');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $content = $response->streamedContent();

        $this->assertStringContainsString('HJR-TKT-2026-CSV00001', $content);
        $this->assertStringContainsString("'=CMD", $content);
        $this->assertStringNotContainsString('HJR-TKT-2026-SECRET99', $content);
    }

    public function test_eo_check_in_verifies_valid_tickets_rejects_duplicates_and_protects_cross_eo_data(): void
    {
        $eoOwner = User::factory()->eo()->create(['name' => 'Petugas EO Satu']);
        $otherEo = User::factory()->eo()->create(['name' => 'Petugas EO Dua']);
        $buyer = User::factory()->create();

        [$publishedEvent, $publishedType] = $this->createEventWithTicketType($eoOwner, 'Tech Summit 2026', 'PUBLISHED', 125000);
        [$secondEvent, $secondType] = $this->createEventWithTicketType($eoOwner, 'Design Workshop', 'PUBLISHED', 50000);
        [$otherEvent, $otherType] = $this->createEventWithTicketType($otherEo, 'Event Eksternal', 'PUBLISHED', 100000);

        $paidOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $publishedEvent->id,
            'order_reference' => 'HJR-20261113-CHK001',
            'status' => 'PAID',
            'total_amount' => 125000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $paidItem = OrderItem::create([
            'order_id' => $paidOrder->id,
            'ticket_type_id' => $publishedType->id,
            'quantity' => 1,
            'unit_price' => 125000,
        ]);
        $validTicket = Ticket::create([
            'order_id' => $paidOrder->id,
            'order_item_id' => $paidItem->id,
            'ticket_code' => 'HJR-TKT-2026-VALID123',
            'attendee_name' => 'Citra Lestari',
            'attendee_email' => 'citra@example.com',
            'status' => 'ACTIVE',
        ]);

        // Tiket dari EO lain
        $otherOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $otherEvent->id,
            'order_reference' => 'HJR-20261113-CHK999',
            'status' => 'PAID',
            'total_amount' => 100000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $otherItem = OrderItem::create([
            'order_id' => $otherOrder->id,
            'ticket_type_id' => $otherType->id,
            'quantity' => 1,
            'unit_price' => 100000,
        ]);
        $otherTicket = Ticket::create([
            'order_id' => $otherOrder->id,
            'order_item_id' => $otherItem->id,
            'ticket_code' => 'HJR-TKT-2026-OTHER999',
            'attendee_name' => 'Peserta Pihak Lain',
            'attendee_email' => 'private@example.com',
            'status' => 'ACTIVE',
        ]);

        // 1. Validasi gagal jika kode kosong
        $this->actingAs($eoOwner)
            ->post('/eo/check-in', ['ticket_code' => ''])
            ->assertSessionHasErrors('ticket_code');

        // 2. Gagal jika event filter yang dipilih tidak cocok dengan tiket
        $wrongEventResponse = $this->actingAs($eoOwner)->post('/eo/check-in', [
            'ticket_code' => 'HJR-TKT-2026-VALID123',
            'event_id' => $secondEvent->id,
        ]);
        $wrongEventResponse->assertRedirect("/eo/check-in?event_id={$secondEvent->id}");
        $wrongEventResult = session('checkin_result');
        $this->assertSame('invalid', $wrongEventResult['outcome']);
        $this->assertSame('ACTIVE', $validTicket->fresh()->status);

        // 3. Check-in tiket valid (lowercase/spasi ditrim & uppercase otomatis)
        $successResponse = $this->actingAs($eoOwner)->post('/eo/check-in', [
            'ticket_code' => '  hjr-tkt-2026-valid123  ',
            'event_id' => $publishedEvent->id,
        ]);
        $successResponse->assertRedirect("/eo/check-in?event_id={$publishedEvent->id}");
        $successResult = session('checkin_result');
        $this->assertSame('success', $successResult['outcome']);
        $this->assertSame('Citra Lestari', $successResult['ticket']['attendeeName']);

        $validTicket->refresh();
        $this->assertSame('USED', $validTicket->status);
        $this->assertNotNull($validTicket->checked_in_at);
        $this->assertSame($eoOwner->id, $validTicket->checked_in_by);

        $firstCheckedInAt = $validTicket->checked_in_at?->toIso8601String();

        // 4. Scan ulang tiket yang sudah USED -> ditolak sebagai already_used & waktu check-in tidak berubah
        $duplicateResponse = $this->actingAs($eoOwner)->post('/eo/check-in', [
            'ticket_code' => 'HJR-TKT-2026-VALID123',
            'event_id' => $publishedEvent->id,
        ]);
        $duplicateResponse->assertRedirect("/eo/check-in?event_id={$publishedEvent->id}");
        $duplicateResult = session('checkin_result');
        $this->assertSame('already_used', $duplicateResult['outcome']);
        $this->assertSame($firstCheckedInAt, $validTicket->fresh()->checked_in_at?->toIso8601String());

        // 5. Scan tiket milik EO lain -> ditolak & tidak membocorkan data peserta
        $crossEoResponse = $this->actingAs($eoOwner)->post('/eo/check-in', [
            'ticket_code' => 'HJR-TKT-2026-OTHER999',
        ]);
        $crossEoResponse->assertRedirect('/eo/check-in');
        $crossEoResult = session('checkin_result');
        $this->assertSame('invalid', $crossEoResult['outcome']);
        $this->assertNull($crossEoResult['ticket']);
        $this->assertSame('ACTIVE', $otherTicket->fresh()->status);

        // 6. Halaman /eo/check-in menampilkan statistik dan riwayat terbaru
        $this->actingAs($eoOwner)
            ->get("/eo/check-in?event_id={$publishedEvent->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Eo/CheckIn')
                ->where('stats.totalValidTickets', 1)
                ->where('stats.checkedInCount', 1)
                ->where('stats.remainingCount', 0)
                ->where('stats.attendanceRate', 100)
                ->has('recentCheckIns', 1)
                ->where('recentCheckIns.0.ticketCode', 'HJR-TKT-2026-VALID123')
            );
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
            'starts_at' => now()->addHour(),
            'ends_at' => now()->addHours(5),
            'banner_path' => '/images/events/tech_hero.webp',
        ]);
        $event->forceFill(['status' => $status])->save();

        $ticketType = new TicketType([
            'event_id' => $event->id,
            'name' => 'Reguler Pass',
            'initial_quota' => 100,
            'quota' => 98,
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
}
