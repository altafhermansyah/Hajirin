<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicCategoryTabsTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_category_page_loads_dynamic_categories_from_database(): void
    {
        $this->seed(CategorySeeder::class);

        $customCategory = Category::create([
            'name' => 'Teknologi & AI',
            'slug' => 'teknologi-ai',
            'icon' => 'sparkles',
        ]);

        $eo = User::factory()->eo()->create();

        Event::create([
            'eo_id' => $eo->id,
            'category_id' => $customCategory->id,
            'title' => 'AI Builders Conference 2026',
            'slug' => 'ai-builders-conference-2026',
            'description' => 'Konferensi kecerdasan buatan Indonesia.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://example.com/ai-conf',
            'starts_at' => now()->addDays(10),
            'ends_at' => now()->addDays(10)->addHours(4),
            'status' => 'PUBLISHED',
        ]);

        $this->get('/kategori')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Kategori/Index')
                ->where('initialCategorySlug', 'semua')
                ->has('categories', 9)
                ->has('events', 1)
                ->where('events.0.category_slug', 'teknologi-ai')
            );

        $this->get('/kategori/teknologi-ai')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Kategori/Index')
                ->where('initialCategory', 'Teknologi & AI')
                ->where('initialCategorySlug', 'teknologi-ai')
                ->has('bookmarkedEventIds')
            );
    }

    public function test_legal_pages_render_correctly(): void
    {
        $this->get('/syarat-ketentuan')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->component('Legal/Terms'));

        $this->get('/kebijakan-privasi')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->component('Legal/Privacy'));
    }
}
