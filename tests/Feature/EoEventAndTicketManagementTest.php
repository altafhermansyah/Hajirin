<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\TicketPrice;
use App\Models\TicketType;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EoEventAndTicketManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CategorySeeder::class);
    }

    public function test_eo_can_create_offline_event_with_multiple_ticket_types_and_prices(): void
    {
        Storage::fake('public');

        $eo = User::factory()->eo()->create();
        $category = Category::firstOrFail();

        $this->actingAs($eo)
            ->get('/eo/events/create')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Eo/EventForm')
                ->where('mode', 'create')
            );

        $banner = UploadedFile::fake()->image('konferensi-ai.jpg', 1200, 675);

        $response = $this->actingAs($eo)->post('/eo/events', [
            'title' => 'Konferensi AI & Cloud Nusantara 2026',
            'category_id' => $category->id,
            'description' => 'Konferensi tahunan praktisi kecerdasan buatan dan arsitektur cloud skala besar di Indonesia.',
            'terms_and_conditions' => 'Wajib membawa identitas resmi saat registrasi ulang.',
            'event_type' => 'OFFLINE',
            'city' => 'Jakarta Selatan',
            'venue_name' => 'Balai Kartini Exhibition Center',
            'address' => 'Jl. Gatot Subroto Kav. 37, Kuningan, Jakarta Selatan',
            'starts_at' => '2026-12-10 09:00:00',
            'ends_at' => '2026-12-10 17:00:00',
            'banner' => $banner,
            'submit_action' => 'PENDING_REVIEW',
            'tickets' => [
                [
                    'name' => 'Early Bird Pass',
                    'price_tier_name' => 'Presale 1',
                    'description' => 'Tiket masuk konferensi utama.',
                    'quota' => 50,
                    'max_per_order' => 3,
                    'sale_start' => '2026-11-01 08:00:00',
                    'sale_end' => '2026-11-30 23:59:00',
                    'price' => 150000,
                ],
                [
                    'name' => 'VIP Executive Pass',
                    'price_tier_name' => 'Harga Resmi',
                    'description' => 'Kursi baris depan, akses VIP lounge, dan makan siang.',
                    'quota' => 20,
                    'max_per_order' => 2,
                    'sale_start' => '',
                    'sale_end' => '',
                    'price' => 500000,
                ],
            ],
        ]);

        $response->assertRedirect('/eo/dashboard');
        $response->assertSessionHas('success');

        $event = Event::where('eo_id', $eo->id)->firstOrFail();
        $this->assertSame('PENDING_REVIEW', $event->status);
        $this->assertSame('Jakarta Selatan', $event->city);

        $this->assertDatabaseHas('ticket_types', [
            'event_id' => $event->id,
            'name' => 'Early Bird Pass',
            'initial_quota' => 50,
            'quota' => 50,
            'max_per_order' => 3,
            'status' => 'ACTIVE',
        ]);

        $this->assertDatabaseHas('ticket_types', [
            'event_id' => $event->id,
            'name' => 'VIP Executive Pass',
            'initial_quota' => 20,
            'quota' => 20,
            'max_per_order' => 2,
            'status' => 'ACTIVE',
        ]);

        $earlyBird = TicketType::where('event_id', $event->id)->where('name', 'Early Bird Pass')->firstOrFail();
        $this->assertDatabaseHas('ticket_prices', [
            'ticket_type_id' => $earlyBird->id,
            'name' => 'Presale 1',
            'price' => 150000,
            'status' => 'ACTIVE',
        ]);
    }

    public function test_event_location_and_time_validation_constraints_are_enforced(): void
    {
        $eo = User::factory()->eo()->create();
        $category = Category::firstOrFail();

        $this->actingAs($eo)->post('/eo/events', [
            'title' => 'Event Invalid',
            'category_id' => $category->id,
            'description' => 'Deskripsi cukup panjang lebih dari dua puluh karakter.',
            'event_type' => 'OFFLINE',
            'city' => '',
            'venue_name' => '',
            'address' => '',
            'starts_at' => '2026-12-10 17:00:00',
            'ends_at' => '2026-12-10 09:00:00',
            'submit_action' => 'DRAFT',
            'tickets' => [
                [
                    'name' => 'Reguler',
                    'quota' => 20,
                    'max_per_order' => 5,
                    'price' => 50000,
                ],
                [
                    'name' => 'Reguler',
                    'quota' => 30,
                    'max_per_order' => 5,
                    'price' => 75000,
                ],
            ],
        ])->assertSessionHasErrors([
            'city',
            'venue_name',
            'address',
            'ends_at',
            'tickets.0.name',
            'tickets.1.name',
        ]);
    }

    public function test_eo_can_edit_event_update_tickets_and_preserve_sold_count(): void
    {
        $eo = User::factory()->eo()->create();
        $category = Category::firstOrFail();

        $event = new Event([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Workshop Design System',
            'slug' => 'workshop-design-system',
            'description' => 'Belajar merancang design system skalabel untuk aplikasi enterprise.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/999888777',
            'starts_at' => '2026-12-15 13:00:00',
            'ends_at' => '2026-12-15 16:00:00',
            'banner_path' => '/images/events/design_hero.jpg',
        ]);
        $event->forceFill(['status' => 'DRAFT'])->save();

        // Buat tiket yang sudah terjual 10 dari kuota awal 50 (sisa 40)
        $ticket = new TicketType([
            'event_id' => $event->id,
            'name' => 'Webinar Pass',
            'description' => 'Akses Zoom + rekaman.',
            'initial_quota' => 50,
            'quota' => 40,
            'max_per_order' => 5,
        ]);
        $ticket->forceFill(['status' => 'ACTIVE'])->save();

        $price = new TicketPrice([
            'ticket_type_id' => $ticket->id,
            'name' => 'Harga Resmi',
            'price' => 75000,
        ]);
        $price->forceFill(['status' => 'ACTIVE'])->save();

        // Gagal jika kuota diturunkan di bawah jumlah tiket terjual (10)
        $this->actingAs($eo)->put("/eo/events/{$event->id}", [
            'title' => 'Workshop Design System Updated',
            'category_id' => $category->id,
            'description' => 'Belajar merancang design system skalabel untuk aplikasi enterprise modern.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/999888777',
            'starts_at' => '2026-12-15 13:00:00',
            'ends_at' => '2026-12-15 16:00:00',
            'submit_action' => 'DRAFT',
            'tickets' => [
                [
                    'id' => $ticket->id,
                    'name' => 'Webinar Pass',
                    'quota' => 5,
                    'max_per_order' => 5,
                    'price' => 75000,
                ],
            ],
        ])->assertSessionHasErrors('tickets.0.quota');

        // Berhasil jika kuota dinaikkan menjadi 80 (sisa otomatis menjadi 80 - 10 = 70)
        $this->actingAs($eo)->put("/eo/events/{$event->id}", [
            'title' => 'Workshop Design System Updated',
            'category_id' => $category->id,
            'description' => 'Belajar merancang design system skalabel untuk aplikasi enterprise modern.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/999888777',
            'starts_at' => '2026-12-15 13:00:00',
            'ends_at' => '2026-12-15 16:00:00',
            'submit_action' => 'PENDING_REVIEW',
            'tickets' => [
                [
                    'id' => $ticket->id,
                    'name' => 'Webinar Pass',
                    'quota' => 80,
                    'max_per_order' => 5,
                    'price' => 85000,
                    'price_tier_name' => 'Batch 2',
                ],
            ],
        ])->assertRedirect('/eo/dashboard');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'title' => 'Workshop Design System Updated',
            'status' => 'PENDING_REVIEW',
        ]);

        $this->assertDatabaseHas('ticket_types', [
            'id' => $ticket->id,
            'initial_quota' => 80,
            'quota' => 70,
        ]);

        $this->assertDatabaseHas('ticket_prices', [
            'ticket_type_id' => $ticket->id,
            'name' => 'Batch 2',
            'price' => 85000,
        ]);
    }

    public function test_idor_protection_prevents_other_eo_from_modifying_foreign_event(): void
    {
        $eoOwner = User::factory()->eo()->create();
        $eoOther = User::factory()->eo()->create();
        $category = Category::firstOrFail();

        $event = new Event([
            'eo_id' => $eoOwner->id,
            'category_id' => $category->id,
            'title' => 'Event Milik EO Pertama',
            'slug' => 'event-milik-eo-pertama',
            'description' => 'Deskripsi acara milik EO pertama yang dilindungi otorisasi.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://meet.google.com/abc-defg-hij',
            'starts_at' => '2026-12-20 10:00:00',
            'ends_at' => '2026-12-20 12:00:00',
        ]);
        $event->forceFill(['status' => 'DRAFT'])->save();

        $this->actingAs($eoOther)->get("/eo/events/{$event->id}/edit")->assertForbidden();
        $this->actingAs($eoOther)->post("/eo/events/{$event->id}/submit")->assertForbidden();
        $this->actingAs($eoOther)->post("/eo/events/{$event->id}/cancel", [
            'cancellation_reason' => 'Coba batalkan event milik EO lain secara tidak sah.',
        ])->assertForbidden();
    }

    public function test_admin_can_approve_and_reject_events_with_notifications(): void
    {
        $admin = User::factory()->admin()->create();
        $eo = User::factory()->eo()->create();
        $category = Category::firstOrFail();

        $event = new Event([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Konser Akustik Senja 2026',
            'slug' => 'konser-akustik-senja-2026',
            'description' => 'Pertunjukan musik akustik sore hari bersama musisi independen tanah air.',
            'event_type' => 'OFFLINE',
            'city' => 'Bandung',
            'venue_name' => 'Amphitheater Dago Tea House',
            'address' => 'Jl. Bukit Dago Utara No. 53, Bandung',
            'starts_at' => '2026-12-25 15:30:00',
            'ends_at' => '2026-12-25 21:00:00',
        ]);
        $event->forceFill(['status' => 'PENDING_REVIEW'])->save();

        $ticket = new TicketType([
            'event_id' => $event->id,
            'name' => 'Festival Pass',
            'initial_quota' => 100,
            'quota' => 100,
            'max_per_order' => 4,
        ]);
        $ticket->forceFill(['status' => 'ACTIVE'])->save();

        $price = new TicketPrice([
            'ticket_type_id' => $ticket->id,
            'name' => 'Harga Resmi',
            'price' => 100000,
        ]);
        $price->forceFill(['status' => 'ACTIVE'])->save();

        // 1. Admin meminta revisi (REJECTED)
        $this->actingAs($admin)->post("/admin/events/{$event->id}/reject", [
            'rejection_reason' => 'Mohon lengkapi informasi penukaran tiket fisik pada deskripsi acara.',
        ])->assertRedirect();

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'status' => 'REJECTED',
            'rejection_reason' => 'Mohon lengkapi informasi penukaran tiket fisik pada deskripsi acara.',
            'reviewed_by' => $admin->id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $eo->id,
            'type' => 'EVENT_REJECTED',
        ]);

        // 2. EO mengajukan ulang ke PENDING_REVIEW
        $this->actingAs($eo)->post("/eo/events/{$event->id}/submit")->assertRedirect();

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'status' => 'PENDING_REVIEW',
            'rejection_reason' => null,
        ]);

        // 3. Admin menyetujui event (PUBLISHED)
        $this->actingAs($admin)->post("/admin/events/{$event->id}/approve")->assertRedirect();

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'status' => 'PUBLISHED',
            'reviewed_by' => $admin->id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $eo->id,
            'type' => 'EVENT_APPROVED',
        ]);

        // 4. Event kini dapat diakses di halaman katalog publik
        $this->get('/event/konser-akustik-senja-2026')->assertOk();
    }
}
