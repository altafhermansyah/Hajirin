<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_dashboard(): void
    {
        $response = $this->get('/admin/dashboard');

        $response->assertRedirect('/');
    }

    public function test_regular_user_cannot_access_admin_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'USER',
        ]);

        $response = $this->actingAs($user)->get('/admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_event_organizer_cannot_access_admin_dashboard(): void
    {
        $eo = User::factory()->create([
            'role' => 'EO',
        ]);

        $response = $this->actingAs($eo)->get('/admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_admin_can_view_admin_dashboard(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->has('stats')
            ->has('recentUsers')
        );
    }

    public function test_admin_root_route_redirects_to_dashboard(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertRedirect('/admin/dashboard');
    }

    public function test_admin_login_returns_admin_redirect_url(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'ADMIN',
        ]);

        $response = $this->postJson('/login', [
            'email' => 'admin@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'redirect_url' => '/admin/dashboard',
        ]);
    }

    public function test_admin_accessing_user_dashboard_is_redirected_to_admin_dashboard(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $response = $this->actingAs($admin)->get('/dashboard');

        $response->assertRedirect('/admin/dashboard');
    }

    public function test_regular_user_can_access_user_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'USER',
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('dashboard')
        );
    }
}
