<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationBellTest extends TestCase
{
    use RefreshDatabase;

    private function insertNotification(User $user, array $overrides = []): string
    {
        $id = Str::uuid()->toString();

        DB::table('notifications')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'type' => 'PAYMENT_SUCCESS',
            'title' => 'Pembayaran Tiket Berhasil!',
            'message' => 'Pesanan Anda telah terverifikasi.',
            'action_url' => '/dashboard#tiket',
            'read_at' => null,
            'created_at' => now(),
            ...$overrides,
        ]);

        return $id;
    }

    public function test_guests_receive_null_notifications_and_cannot_hit_notification_endpoints(): void
    {
        $this->get('/')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->where('notifications', null));

        $this->post('/notifications/read-all')->assertRedirect('/');
        $this->post('/notifications/'.Str::uuid()->toString().'/read')->assertRedirect('/');
    }

    public function test_authenticated_user_receives_only_their_own_notifications_and_unread_count(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->insertNotification($user, ['title' => 'Notifikasi Belum Dibaca', 'created_at' => now()]);
        $this->insertNotification($user, [
            'title' => 'Notifikasi Sudah Dibaca',
            'read_at' => now()->subMinutes(5),
            'created_at' => now()->subMinutes(10),
        ]);
        $this->insertNotification($otherUser, ['title' => 'Milik Orang Lain']);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->where('notifications.unreadCount', 1)
                ->has('notifications.items', 2)
                ->where('notifications.items.0.title', 'Notifikasi Belum Dibaca')
                ->where('notifications.items.0.isRead', false)
                ->where('notifications.items.1.title', 'Notifikasi Sudah Dibaca')
                ->where('notifications.items.1.isRead', true)
            );
    }

    public function test_user_can_mark_single_notification_as_read_and_follow_safe_action_url(): void
    {
        $user = User::factory()->create();
        $id = $this->insertNotification($user, ['action_url' => '/dashboard#tiket']);

        $this->actingAs($user)
            ->post("/notifications/{$id}/read")
            ->assertRedirect('/dashboard#tiket');

        $this->assertNotNull(DB::table('notifications')->where('id', $id)->value('read_at'));
    }

    public function test_external_action_url_does_not_open_redirect(): void
    {
        $user = User::factory()->create();
        $id = $this->insertNotification($user, ['action_url' => 'https://evil.example/phish']);

        $this->actingAs($user)
            ->from('/dashboard')
            ->post("/notifications/{$id}/read")
            ->assertRedirect('/dashboard');

        $this->assertNotNull(DB::table('notifications')->where('id', $id)->value('read_at'));
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->insertNotification($user);
        $this->insertNotification($user);
        $otherId = $this->insertNotification($otherUser);

        $this->actingAs($user)
            ->from('/dashboard')
            ->post('/notifications/read-all')
            ->assertRedirect('/dashboard');

        $this->assertSame(
            0,
            DB::table('notifications')->where('user_id', $user->id)->whereNull('read_at')->count()
        );
        $this->assertNull(DB::table('notifications')->where('id', $otherId)->value('read_at'));
    }

    public function test_user_cannot_mark_other_users_notification_or_invalid_uuid(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $otherId = $this->insertNotification($otherUser);

        $this->actingAs($user)
            ->post("/notifications/{$otherId}/read")
            ->assertStatus(404);

        $this->actingAs($user)
            ->post('/notifications/not-a-valid-uuid/read')
            ->assertStatus(404);

        $this->assertNull(DB::table('notifications')->where('id', $otherId)->value('read_at'));
    }
}
