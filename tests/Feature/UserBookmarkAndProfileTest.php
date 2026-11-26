<?php

namespace Tests\Feature;

use App\Models\Bookmark;
use App\Models\Event;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Database\Seeders\EventSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserBookmarkAndProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CategorySeeder::class);
        $this->seed(EventSeeder::class);
    }

    public function test_authenticated_user_can_bookmark_and_unbookmark_event(): void
    {
        $user = User::factory()->create();
        $event = Event::where('status', 'PUBLISHED')->firstOrFail();

        // 1. Simpan Bookmark
        $response = $this->actingAs($user)->post("/events/{$event->id}/bookmark");
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('bookmarks', [
            'user_id' => $user->id,
            'event_id' => $event->id,
        ]);

        // 2. Unbookmark (Toggle off)
        $response = $this->actingAs($user)->post("/events/{$event->id}/bookmark");
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('bookmarks', [
            'user_id' => $user->id,
            'event_id' => $event->id,
        ]);
    }

    public function test_guest_cannot_bookmark_event(): void
    {
        $event = Event::where('status', 'PUBLISHED')->firstOrFail();

        $response = $this->post("/events/{$event->id}/bookmark");
        $response->assertRedirect('/');

        $responseJson = $this->postJson("/events/{$event->id}/bookmark");
        $responseJson->assertStatus(401);
    }

    public function test_bookmarked_events_appear_on_user_dashboard(): void
    {
        $user = User::factory()->create();
        $event = Event::where('status', 'PUBLISHED')->firstOrFail();

        Bookmark::create([
            'user_id' => $user->id,
            'event_id' => $event->id,
        ]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('dashboard.bookmarkedEvents', 1)
                ->where('dashboard.bookmarkedEvents.0.id', $event->id)
                ->where('dashboard.bookmarkedEvents.0.slug', $event->slug)
            );
    }

    public function test_user_can_update_profile_information(): void
    {
        $user = User::factory()->create([
            'name' => 'Nama Lama',
            'phone' => '0812000000',
        ]);

        $response = $this->actingAs($user)->put('/profile', [
            'name' => 'Nama Baru Hajirin',
            'phone' => '089988776655',
        ]);

        $response->assertSessionHas('success');

        $user->refresh();
        $this->assertSame('Nama Baru Hajirin', $user->name);
        $this->assertSame('089988776655', $user->phone);
    }

    public function test_user_can_update_password(): void
    {
        $user = User::factory()->create([
            'email' => 'gantisandi@example.com',
            'password' => Hash::make('password_lama_123'),
        ]);

        $this->actingAs($user)
            ->post('/profile/password-reset-link', [
                'email' => 'gantisandi@example.com',
            ])
            ->assertSessionHas('password_reset_status');

        $token = Password::broker()->createToken($user);

        $response = $this->actingAs($user)->post('/reset-password', [
            'token' => $token,
            'email' => 'gantisandi@example.com',
            'password' => 'password_baru_456',
            'password_confirmation' => 'password_baru_456',
        ]);

        $response->assertRedirect(route('dashboard').'#profil');
        $response->assertSessionHas('password_reset_completed', true);

        $user->refresh();
        $this->assertTrue(Hash::check('password_baru_456', $user->password));
        $this->assertNotNull($user->password_changed_at);
    }

    public function test_home_page_passes_bookmarked_event_ids(): void
    {
        $user = User::factory()->create();
        $event = Event::where('status', 'PUBLISHED')->firstOrFail();

        Bookmark::create([
            'user_id' => $user->id,
            'event_id' => $event->id,
        ]);

        $this->actingAs($user)
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Home')
                ->has('events')
                ->where('bookmarkedEventIds', [$event->id])
            );
    }

    public function test_event_detail_passes_is_bookmarked_state(): void
    {
        $user = User::factory()->create();
        $event = Event::where('status', 'PUBLISHED')->firstOrFail();

        Bookmark::create([
            'user_id' => $user->id,
            'event_id' => $event->id,
        ]);

        $this->actingAs($user)
            ->get("/event/{$event->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Event/Detail')
                ->where('isBookmarked', true)
            );
    }

    public function test_home_page_events_have_starts_at_field_for_time_filtering(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Home')
                ->has('events')
                ->has('events.0.starts_at')
                ->has('events.0.title')
                ->has('events.0.price')
            );
    }

    public function test_user_profile_update_validates_password_confirmation(): void
    {
        $user = User::factory()->create([
            'email' => 'cekpass@example.com',
        ]);
        $token = Password::broker()->createToken($user);

        $response = $this->actingAs($user)->post('/reset-password', [
            'token' => $token,
            'email' => 'cekpass@example.com',
            'password' => 'newpassword123',
            'password_confirmation' => 'differentpassword',
        ]);

        $response->assertSessionHasErrors('password');
    }

    public function test_user_can_bookmark_using_event_slug_and_receives_success_message(): void
    {
        $user = User::factory()->create();
        $event = Event::where('status', 'PUBLISHED')->firstOrFail();

        $response = $this->actingAs($user)->post("/events/{$event->slug}/bookmark");
        $response->assertSessionHas('success', 'Penanda telah berhasil dan tersimpan di halaman bookmark!');

        $this->assertDatabaseHas('bookmarks', [
            'user_id' => $user->id,
            'event_id' => $event->id,
        ]);
    }

    public function test_bookmarks_route_redirects_to_dashboard_bookmark(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/bookmarks');
        $response->assertRedirect('/dashboard#bookmark');
    }

    public function test_nearby_events_page_can_be_rendered(): void
    {
        $response = $this->get('/event-terdekat');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Event/Nearby')
            ->has('events')
            ->has('availableCities')
            ->where('selectedCity', 'Semua Kota')
        );
    }

    public function test_nearby_events_page_can_filter_by_city(): void
    {
        $response = $this->get('/event-terdekat?city=Jakarta');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Event/Nearby')
            ->where('selectedCity', 'Jakarta')
            ->has('events')
        );
    }

    public function test_user_profile_phone_must_be_numeric_and_rejects_letters(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->put('/profile', [
            'name' => 'Budi Baru',
            'phone' => '081234abcd',
        ]);

        $response->assertSessionHasErrors(['phone']);

        $validResponse = $this->actingAs($user)->put('/profile', [
            'name' => 'Budi Baru',
            'phone' => '081234567890',
        ]);

        $validResponse->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'phone' => '081234567890',
        ]);
    }
}
