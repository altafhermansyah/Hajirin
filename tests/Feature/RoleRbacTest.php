<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleRbacTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_roles_exist_and_users_link_to_roles_table(): void
    {
        $this->assertDatabaseHas('roles', ['code' => Role::USER]);
        $this->assertDatabaseHas('roles', ['code' => Role::EO]);
        $this->assertDatabaseHas('roles', ['code' => Role::ADMIN]);

        $admin = User::factory()->admin()->create();
        $eo = User::factory()->eo()->create();
        $user = User::factory()->create();

        $this->assertSame(Role::ADMIN, $admin->roleRecord->code);
        $this->assertSame(Role::EO, $eo->roleRecord->code);
        $this->assertSame(Role::USER, $user->roleRecord->code);
        $this->assertTrue($admin->roleRecord->users->contains($admin));
    }

    public function test_updating_role_and_role_id_stays_synchronized(): void
    {
        $user = User::factory()->create();
        $eoRole = Role::query()->where('code', Role::EO)->firstOrFail();
        $adminRole = Role::query()->where('code', Role::ADMIN)->firstOrFail();

        $user->forceFill(['role' => Role::EO])->save();
        $this->assertSame($eoRole->id, $user->fresh()->role_id);
        $this->assertTrue($user->fresh()->isEo());

        $user->forceFill(['role_id' => $adminRole->id])->save();
        $this->assertSame(Role::ADMIN, $user->fresh()->role);
        $this->assertTrue($user->fresh()->isAdmin());
    }

    public function test_rbac_middleware_enforces_access_based_on_roles_table(): void
    {
        $user = User::factory()->create();
        $eo = User::factory()->eo()->create();
        $admin = User::factory()->admin()->create();

        $this->get('/admin/categories')->assertRedirect('/');
        $this->get('/eo/dashboard')->assertRedirect('/');

        $this->actingAs($user)->get('/admin/categories')->assertStatus(403);
        $this->actingAs($user)->get('/eo/dashboard')->assertStatus(403);

        $this->actingAs($eo)->get('/admin/categories')->assertStatus(403);
        $this->actingAs($eo)->get('/eo/dashboard')->assertStatus(200);

        $this->actingAs($admin)->get('/admin/categories')->assertStatus(200);
        $this->actingAs($admin)->get('/eo/dashboard')->assertStatus(403);
    }
}
