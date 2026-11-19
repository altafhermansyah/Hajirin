<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminEventManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $eo;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $this->eo = User::factory()->create([
            'role' => 'EO',
        ]);

        $this->category = Category::create([
            'name' => 'Teknologi',
            'slug' => 'teknologi',
        ]);
    }

    public function test_guests_cannot_access_admin_events(): void
    {
        $response = $this->get('/admin/events');

        $response->assertRedirect('/');
    }

    public function test_regular_users_cannot_access_admin_events(): void
    {
        $user = User::factory()->create([
            'role' => 'USER',
        ]);

        $response = $this->actingAs($user)->get('/admin/events');

        $response->assertStatus(403);
    }

    public function test_event_organizers_cannot_access_admin_events(): void
    {
        $response = $this->actingAs($this->eo)->get('/admin/events');

        $response->assertStatus(403);
    }

    public function test_admin_can_view_admin_events_page(): void
    {
        Event::create([
            'eo_id' => $this->eo->id,
            'category_id' => $this->category->id,
            'title' => 'Surabaya Tech Summit 2026',
            'slug' => 'surabaya-tech-summit-2026',
            'description' => 'Konferensi teknologi Surabaya.',
            'event_type' => 'OFFLINE',
            'city' => 'Surabaya',
            'venue_name' => 'Grand City Hall',
            'address' => 'Jl. Walikota Mustajab',
            'starts_at' => now()->addDays(10),
            'ends_at' => now()->addDays(10)->addHours(8),
            'status' => 'PUBLISHED',
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/events');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Events/Index')
            ->has('events.data')
            ->has('categories')
            ->has('stats')
            ->has('filters')
        );
    }

    public function test_admin_can_filter_events_by_status(): void
    {
        Event::create([
            'eo_id' => $this->eo->id,
            'category_id' => $this->category->id,
            'title' => 'Event Menunggu Review',
            'slug' => 'event-menunggu-review',
            'description' => 'Deskripsi event.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/123456789',
            'starts_at' => now()->addDays(5),
            'ends_at' => now()->addDays(5)->addHours(4),
            'status' => 'PENDING_REVIEW',
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/events?status=PENDING_REVIEW');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Events/Index')
            ->where('filters.status', 'PENDING_REVIEW')
        );
    }

    public function test_admin_can_approve_pending_review_event(): void
    {
        $event = Event::create([
            'eo_id' => $this->eo->id,
            'category_id' => $this->category->id,
            'title' => 'Event Baru Siap Tayang',
            'slug' => 'event-baru-siap-tayang',
            'description' => 'Deskripsi acara.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/123456789',
            'starts_at' => now()->addDays(7),
            'ends_at' => now()->addDays(7)->addHours(3),
            'status' => 'PENDING_REVIEW',
        ]);

        $response = $this->actingAs($this->admin)->post("/admin/events/{$event->id}/approve");

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertEquals('PUBLISHED', $event->fresh()->status);
        $this->assertEquals($this->admin->id, $event->fresh()->reviewed_by);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->eo->id,
            'type' => 'EVENT_APPROVED',
        ]);
    }

    public function test_admin_can_reject_pending_review_event_with_reason(): void
    {
        $event = Event::create([
            'eo_id' => $this->eo->id,
            'category_id' => $this->category->id,
            'title' => 'Event Belum Lengkap',
            'slug' => 'event-belum-lengkap',
            'description' => 'Deskripsi acara.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/123456789',
            'starts_at' => now()->addDays(7),
            'ends_at' => now()->addDays(7)->addHours(3),
            'status' => 'PENDING_REVIEW',
        ]);

        $response = $this->actingAs($this->admin)->post("/admin/events/{$event->id}/reject", [
            'rejection_reason' => 'Mohon sertakan susunan rundown dan pembicara secara lebih rinci.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertEquals('REJECTED', $event->fresh()->status);
        $this->assertEquals('Mohon sertakan susunan rundown dan pembicara secara lebih rinci.', $event->fresh()->rejection_reason);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->eo->id,
            'type' => 'EVENT_REJECTED',
        ]);
    }

    public function test_admin_can_cancel_published_event(): void
    {
        $event = Event::create([
            'eo_id' => $this->eo->id,
            'category_id' => $this->category->id,
            'title' => 'Event Yang Dibatalkan',
            'slug' => 'event-yang-dibatalkan',
            'description' => 'Deskripsi acara.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/123456789',
            'starts_at' => now()->addDays(7),
            'ends_at' => now()->addDays(7)->addHours(3),
            'status' => 'PUBLISHED',
        ]);

        $response = $this->actingAs($this->admin)->post("/admin/events/{$event->id}/cancel", [
            'cancellation_reason' => 'Dibatalkan oleh Administrator karena melanggar ketentuan acara komersial.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertEquals('CANCELLED', $event->fresh()->status);
        $this->assertNotNull($event->fresh()->cancelled_at);
        $this->assertEquals('Dibatalkan oleh Administrator karena melanggar ketentuan acara komersial.', $event->fresh()->cancellation_reason);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->eo->id,
            'type' => 'EVENT_CANCELLED',
        ]);
    }

    public function test_admin_can_delete_draft_event(): void
    {
        $event = Event::create([
            'eo_id' => $this->eo->id,
            'category_id' => $this->category->id,
            'title' => 'Event Draft Dihapus',
            'slug' => 'event-draft-dihapus',
            'description' => 'Deskripsi acara.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/123456789',
            'starts_at' => now()->addDays(7),
            'ends_at' => now()->addDays(7)->addHours(3),
            'status' => 'DRAFT',
        ]);

        $response = $this->actingAs($this->admin)->delete("/admin/events/{$event->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('events', [
            'id' => $event->id,
        ]);
    }
}
