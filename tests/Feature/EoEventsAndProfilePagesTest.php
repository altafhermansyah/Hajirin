<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\EoApplication;
use App\Models\Event;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EoEventsAndProfilePagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CategorySeeder::class);
    }

    public function test_non_eo_users_cannot_access_eo_events_or_profile_pages(): void
    {
        $regularUser = User::factory()->create(['role' => 'USER']);
        $admin = User::factory()->admin()->create();

        $this->get('/eo/events')->assertRedirect('/');
        $this->get('/eo/profile')->assertRedirect('/');

        $this->actingAs($regularUser)->get('/eo/events')->assertForbidden();
        $this->actingAs($regularUser)->get('/eo/profile')->assertForbidden();
        $this->actingAs($regularUser)->put('/eo/profile', [
            'organization_name' => 'Test Org',
            'contact_phone' => '08123456789',
        ])->assertForbidden();

        $this->actingAs($admin)->get('/eo/events')->assertForbidden();
        $this->actingAs($admin)->get('/eo/profile')->assertForbidden();
    }

    public function test_eo_events_page_displays_only_owned_events_and_status_counts(): void
    {
        $eoOwner = User::factory()->eo()->create();
        $otherEo = User::factory()->eo()->create();
        $category = Category::firstOrFail();

        $ownerPublished = new Event([
            'eo_id' => $eoOwner->id,
            'category_id' => $category->id,
            'title' => 'Konser Milik EO Sendiri',
            'slug' => 'konser-milik-eo-sendiri',
            'description' => 'Acara musik resmi milik organizer terverifikasi.',
            'event_type' => 'OFFLINE',
            'city' => 'Surabaya',
            'venue_name' => 'Dyandra Convention Center',
            'address' => 'Jl. Basuki Rahmat No. 93',
            'starts_at' => now()->addDays(10),
            'ends_at' => now()->addDays(10)->addHours(3),
        ]);
        $ownerPublished->forceFill(['status' => 'PUBLISHED'])->save();

        $ownerDraft = new Event([
            'eo_id' => $eoOwner->id,
            'category_id' => $category->id,
            'title' => 'Workshop Draft Internal',
            'slug' => 'workshop-draft-internal',
            'description' => 'Draft workshop yang masih disiapkan.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://zoom.us/j/111222333',
            'starts_at' => now()->addDays(20),
            'ends_at' => now()->addDays(20)->addHours(2),
        ]);
        $ownerDraft->forceFill(['status' => 'DRAFT'])->save();

        $foreignEvent = new Event([
            'eo_id' => $otherEo->id,
            'category_id' => $category->id,
            'title' => 'Event Kompetitor Terpisah',
            'slug' => 'event-kompetitor-terpisah',
            'description' => 'Acara milik EO lain.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://meet.google.com/aaa-bbbb-ccc',
            'starts_at' => now()->addDays(12),
            'ends_at' => now()->addDays(12)->addHours(2),
        ]);
        $foreignEvent->forceFill(['status' => 'PUBLISHED'])->save();

        $this->actingAs($eoOwner)
            ->get('/eo/events')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Eo/Events')
                ->where('stats.totalEvents', 2)
                ->where('stats.publishedEvents', 1)
                ->where('stats.draftEvents', 1)
                ->has('myEvents', 2)
                ->where('myEvents.0.title', fn (string $title) => in_array($title, ['Konser Milik EO Sendiri', 'Workshop Draft Internal'], true))
            );
    }

    public function test_eo_can_view_and_update_organization_profile(): void
    {
        $eoUser = User::factory()->eo()->create([
            'name' => 'Siti Aminah',
            'phone' => '08111111111',
        ]);

        $application = EoApplication::forceCreate([
            'user_id' => $eoUser->id,
            'organization_name' => 'Komunitas Kreatif Lama',
            'contact_phone' => '08111111111',
            'portfolio_url' => 'https://instagram.com/kreatiflama',
            'document_path' => 'eo-documents/sample.pdf',
            'reason' => 'Menyelenggarakan acara komunitas kreatif skala regional.',
            'status' => 'APPROVED',
            'reviewed_at' => now()->subDays(3),
        ]);

        $this->actingAs($eoUser)
            ->get('/eo/profile')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Eo/Profile')
                ->where('organizerName', 'Komunitas Kreatif Lama')
                ->where('profile.organizationName', 'Komunitas Kreatif Lama')
                ->where('profile.contactPhone', '08111111111')
                ->where('profile.portfolioUrl', 'https://instagram.com/kreatiflama')
            );

        $this->actingAs($eoUser)
            ->put('/eo/profile', [
                'organization_name' => '',
                'contact_phone' => '081299990000',
                'portfolio_url' => 'bukan-url',
            ])
            ->assertSessionHasErrors(['organization_name', 'portfolio_url']);

        $this->actingAs($eoUser)
            ->put('/eo/profile', [
                'organization_name' => 'Komunitas Kreatif Nusantara',
                'contact_phone' => '081299990000',
                'portfolio_url' => 'https://kreatifnusantara.id',
            ])
            ->assertRedirect('/eo/profile')
            ->assertSessionHas('success');

        $application->refresh();
        $eoUser->refresh();

        $this->assertSame('Komunitas Kreatif Nusantara', $application->organization_name);
        $this->assertSame('081299990000', $application->contact_phone);
        $this->assertSame('https://kreatifnusantara.id', $application->portfolio_url);
        $this->assertSame('081299990000', $eoUser->phone);
    }
}
