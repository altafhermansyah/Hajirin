<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminCategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_users_cannot_access_category_management(): void
    {
        $user = User::factory()->create();
        $eo = User::factory()->eo()->create();

        $this->get('/admin/categories')->assertRedirect('/');
        $this->actingAs($user)->get('/admin/categories')->assertStatus(403);
        $this->actingAs($eo)->get('/admin/categories')->assertStatus(403);
        $this->actingAs($user)->post('/admin/categories', ['name' => 'Teknologi'])->assertStatus(403);
    }

    public function test_admin_can_view_search_and_paginate_categories(): void
    {
        $this->seed(CategorySeeder::class);
        $admin = User::factory()->admin()->create();

        for ($i = 1; $i <= 5; $i++) {
            Category::create([
                'name' => "Kategori Ekstra {$i}",
                'slug' => "kategori-ekstra-{$i}",
                'icon' => 'tag',
            ]);
        }

        $this->actingAs($admin)
            ->get('/admin/categories')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Categories/Index')
                ->has('categories.data', 10)
                ->where('categories.total', 13)
                ->has('stats')
                ->has('filters')
            );

        $this->actingAs($admin)
            ->get('/admin/categories?search=musik')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Categories/Index')
                ->has('categories.data', 1)
                ->where('categories.data.0.slug', 'musik')
                ->where('filters.search', 'musik')
            );
    }

    public function test_admin_can_create_category_with_auto_slug_and_validation(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post('/admin/categories', [
                'name' => 'Teknologi & AI',
                'icon' => 'sparkles',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('categories', [
            'name' => 'Teknologi & AI',
            'slug' => 'teknologi-ai',
            'icon' => 'sparkles',
        ]);

        // Duplikat nama dan ikon tidak valid harus ditolak
        $this->actingAs($admin)
            ->post('/admin/categories', [
                'name' => 'Teknologi & AI',
                'icon' => 'invalid-icon',
            ])
            ->assertSessionHasErrors(['name', 'slug', 'icon']);
    }

    public function test_admin_can_update_category(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::create([
            'name' => 'Kuliner',
            'slug' => 'kuliner',
            'icon' => 'tag',
        ]);

        $this->actingAs($admin)
            ->put("/admin/categories/{$category->id}", [
                'name' => 'Kuliner Nusantara',
                'slug' => 'kuliner-nusantara',
                'icon' => 'tent-tree',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Kuliner Nusantara',
            'slug' => 'kuliner-nusantara',
            'icon' => 'tent-tree',
        ]);
    }

    public function test_admin_can_delete_unused_category_but_cannot_delete_used_category(): void
    {
        $admin = User::factory()->admin()->create();
        $eo = User::factory()->eo()->create();

        $unused = Category::create([
            'name' => 'Sementara',
            'slug' => 'sementara',
            'icon' => 'tag',
        ]);

        $used = Category::create([
            'name' => 'Konser',
            'slug' => 'konser',
            'icon' => 'headphones',
        ]);

        Event::create([
            'eo_id' => $eo->id,
            'category_id' => $used->id,
            'title' => 'Konser Uji Coba',
            'slug' => 'konser-uji-coba',
            'description' => 'Deskripsi konser uji coba.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://example.com/konser',
            'starts_at' => now()->addDays(5),
            'ends_at' => now()->addDays(5)->addHours(2),
        ]);

        // Kategori yang masih dipakai event harus ditolak
        $this->actingAs($admin)
            ->delete("/admin/categories/{$used->id}")
            ->assertSessionHasErrors(['category']);

        $this->assertDatabaseHas('categories', ['id' => $used->id]);

        // Kategori yang tidak dipakai boleh dihapus
        $this->actingAs($admin)
            ->delete("/admin/categories/{$unused->id}")
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('categories', ['id' => $unused->id]);
    }
}
