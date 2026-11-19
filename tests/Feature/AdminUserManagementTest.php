<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_user_management(): void
    {
        $response = $this->get('/admin/users');

        $response->assertRedirect('/');
    }

    public function test_regular_users_cannot_access_user_management(): void
    {
        $user = User::factory()->create([
            'role' => 'USER',
        ]);

        $response = $this->actingAs($user)->get('/admin/users');

        $response->assertStatus(403);
    }

    public function test_event_organizers_cannot_access_user_management(): void
    {
        $eo = User::factory()->create([
            'role' => 'EO',
        ]);

        $response = $this->actingAs($eo)->get('/admin/users');

        $response->assertStatus(403);
    }

    public function test_admin_can_view_user_management_page(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        User::factory()->count(3)->create([
            'role' => 'USER',
        ]);

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data')
            ->has('stats')
            ->has('filters')
        );
    }

    public function test_admin_can_filter_users_by_role(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        User::factory()->create([
            'name' => 'Peserta A',
            'role' => 'USER',
        ]);

        User::factory()->create([
            'name' => 'EO B',
            'role' => 'EO',
        ]);

        $response = $this->actingAs($admin)->get('/admin/users?role=EO');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Users/Index')
            ->where('filters.role', 'EO')
        );
    }

    public function test_admin_can_create_new_user(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $response = $this->actingAs($admin)->post('/admin/users', [
            'name' => 'New Staff Admin',
            'email' => 'newstaff@example.com',
            'phone' => '08123456789',
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
            'password' => 'secret12345',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'email' => 'newstaff@example.com',
            'name' => 'New Staff Admin',
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
        ]);

        $createdUser = User::where('email', 'newstaff@example.com')->first();
        $this->assertTrue(Hash::check('secret12345', $createdUser->password));
    }

    public function test_admin_can_update_user_and_role(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@example.com',
            'role' => 'USER',
        ]);

        $response = $this->actingAs($admin)->put("/admin/users/{$user->id}", [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'phone' => '0899999999',
            'role' => 'EO',
            'status' => 'ACTIVE',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'role' => 'EO',
        ]);
    }

    public function test_admin_can_toggle_user_status(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $user = User::factory()->create([
            'role' => 'USER',
            'status' => 'ACTIVE',
        ]);

        // Toggle to SUSPENDED
        $response = $this->actingAs($admin)->patch("/admin/users/{$user->id}/toggle-status");
        $response->assertRedirect();

        $this->assertEquals('SUSPENDED', $user->fresh()->status);

        // Toggle back to ACTIVE
        $response = $this->actingAs($admin)->patch("/admin/users/{$user->id}/toggle-status");
        $response->assertRedirect();

        $this->assertEquals('ACTIVE', $user->fresh()->status);
    }

    public function test_admin_cannot_suspend_or_delete_themselves(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
        ]);

        // Attempt suspend self
        $response = $this->actingAs($admin)->patch("/admin/users/{$admin->id}/toggle-status");
        $response->assertSessionHasErrors(['user']);
        $this->assertEquals('ACTIVE', $admin->fresh()->status);

        // Attempt delete self
        $response = $this->actingAs($admin)->delete("/admin/users/{$admin->id}");
        $response->assertSessionHasErrors(['user']);
        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
        ]);
    }

    public function test_admin_can_delete_user(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $user = User::factory()->create([
            'role' => 'USER',
        ]);

        $response = $this->actingAs($admin)->delete("/admin/users/{$user->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('users', [
            'id' => $user->id,
        ]);
    }

    public function test_suspended_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'email' => 'suspended@example.com',
            'password' => Hash::make('password123'),
            'role' => 'USER',
            'status' => 'SUSPENDED',
        ]);

        $response = $this->post('/login', [
            'email' => 'suspended@example.com',
            'password' => 'password123',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors(['email']);
    }
}
