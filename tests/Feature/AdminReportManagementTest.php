<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Ticket;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminReportManagementTest extends TestCase
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
            'title' => 'Soundwave Music Festival 2026',
            'slug' => 'soundwave-music-festival-2026',
            'description' => 'Konser akbar spektakuler di Surabaya.',
            'event_type' => 'OFFLINE',
            'starts_at' => now()->addDays(10),
            'ends_at' => now()->addDays(10)->addHours(5),
            'city' => 'Surabaya',
            'venue_name' => 'Grand City Hall',
            'address' => 'Jl. Walikota Mustajab No. 1, Surabaya',
            'status' => 'PUBLISHED',
        ]);

        $this->ticketType = TicketType::create([
            'event_id' => $this->event->id,
            'name' => 'VIP Pass',
            'initial_quota' => 100,
            'quota' => 100,
            'status' => 'ACTIVE',
        ]);
    }

    private function createPaidOrder(float $amount = 200000.00): Order
    {
        $order = Order::create([
            'user_id' => $this->buyer->id,
            'event_id' => $this->event->id,
            'order_reference' => 'HJR-FIN-'.strtoupper(uniqid()),
            'status' => 'PAID',
            'total_amount' => $amount,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
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
            'status' => 'SUCCESS',
            'amount' => $amount,
            'paid_at' => now(),
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

    public function test_guests_and_regular_users_cannot_access_reports(): void
    {
        $this->get('/admin/reports')->assertRedirect('/');

        $this->actingAs($this->buyer)
            ->get('/admin/reports')
            ->assertForbidden();

        $this->actingAs($this->eo)
            ->get('/admin/reports')
            ->assertForbidden();
    }

    public function test_admin_can_view_reports_index_with_financial_metrics(): void
    {
        // 2 pesanan paid @ Rp200.000 = Rp400.000 GMV
        $this->createPaidOrder(200000.00);
        $this->createPaidOrder(200000.00);

        $response = $this->actingAs($this->admin)->get('/admin/reports');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reports/Index')
            ->has('summary', fn (Assert $summary) => $summary
                ->where('grossRevenue', 400000)
                ->where('totalPaidOrders', 2)
                ->where('totalTicketsSold', 2)
                ->where('platformCommission', 20000) // 5% of 400.000
                ->where('netEoSettlement', 380000)   // 95% of 400.000
                ->etc()
            )
            ->has('eventReports', 1)
            ->has('recentTransactions', 2)
            ->has('categories', 1)
        );
    }

    public function test_reports_calculate_refund_deductions_correctly(): void
    {
        $order = $this->createPaidOrder(500000.00);

        // Refund approved sebesar Rp100.000
        Refund::create([
            'order_id' => $order->id,
            'requested_by' => $this->buyer->id,
            'processed_by' => $this->admin->id,
            'amount' => 100000.00,
            'reason' => 'Pengajuan refund peserta',
            'status' => 'APPROVED',
            'requested_at' => now()->subDay(),
            'processed_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/reports');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reports/Index')
            ->has('summary', fn (Assert $summary) => $summary
                ->where('grossRevenue', 500000)
                ->where('totalRefunds', 100000)
                ->where('netGmv', 400000)
                ->where('platformCommission', 20000) // 5% of 400.000
                ->where('netEoSettlement', 380000)   // 400.000 - 20.000
                ->etc()
            )
        );
    }

    public function test_admin_can_filter_reports_by_period_and_search(): void
    {
        $this->createPaidOrder(300000.00);

        $response = $this->actingAs($this->admin)
            ->get('/admin/reports?period=this_month&search=Soundwave');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reports/Index')
            ->where('filters.period', 'this_month')
            ->where('filters.search', 'Soundwave')
            ->has('eventReports', 1)
        );
    }

    public function test_admin_can_view_printable_pdf_export_page(): void
    {
        $this->createPaidOrder(250000.00);

        $response = $this->actingAs($this->admin)->get('/admin/reports/export-pdf');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reports/Print')
            ->has('summary')
            ->has('eventReports', 1)
            ->has('generatedAtFormatted')
            ->where('generatedBy', $this->admin->name)
        );
    }
}
