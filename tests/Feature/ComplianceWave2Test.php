<?php

namespace Tests\Feature;

use App\Jobs\SendEventBroadcastNotificationsJob;
use App\Mail\EventBroadcastMail;
use App\Models\Category;
use App\Models\EoApplication;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Ticket;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class ComplianceWave2Test extends TestCase
{
    use RefreshDatabase;

    private function createPublishedEvent(User $eo): array
    {
        $category = Category::first() ?? Category::create([
            'name' => 'Musik',
            'slug' => 'musik',
            'icon' => 'headphones',
        ]);

        $event = Event::create([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Konser Audit '.Str::random(4),
            'slug' => 'konser-audit-'.strtolower(Str::random(6)),
            'description' => 'Event untuk pengujian audit log dan opt-out.',
            'event_type' => 'OFFLINE',
            'starts_at' => now()->addDays(5),
            'ends_at' => now()->addDays(5)->addHours(3),
            'city' => 'Jakarta',
            'venue_name' => 'GBK',
            'address' => 'Senayan, Jakarta',
            'status' => 'PUBLISHED',
        ]);

        $ticketType = TicketType::create([
            'event_id' => $event->id,
            'name' => 'Reguler',
            'description' => 'Tiket masuk',
            'quota' => 50,
            'initial_quota' => 50,
            'max_per_order' => 5,
            'status' => 'ACTIVE',
        ]);

        return [$event, $ticketType];
    }

    public function test_audit_log_records_pii_access_and_moderation_actions(): void
    {
        Storage::fake('local');

        $admin = User::factory()->admin()->create();
        $eo = User::factory()->eo()->create();
        $user = User::factory()->create();

        $docPath = 'eo-documents/audit-ktp.webp';
        Storage::disk('local')->put($docPath, 'fake-ktp');

        $application = EoApplication::create([
            'user_id' => $user->id,
            'organization_name' => 'Audit Org',
            'contact_phone' => '081234567890',
            'document_path' => $docPath,
            'reason' => 'Pengajuan EO untuk pengujian audit log akses KTP.',
            'status' => 'PENDING',
        ]);

        // 1. Admin views EO KTP document
        $this->actingAs($admin)
            ->get("/admin/organizers/applications/{$application->id}/document")
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $admin->id,
            'action' => 'eo_document.viewed',
            'subject_type' => 'eo_application',
            'subject_id' => $application->id,
        ]);

        // 2. EO exports attendee CSV
        $this->actingAs($eo)
            ->get('/eo/attendees/export')
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $eo->id,
            'action' => 'attendees.exported',
            'subject_type' => 'event',
        ]);

        // 3. User exports personal data
        $this->actingAs($user)
            ->get('/profile/export-data')
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $user->id,
            'action' => 'account.exported',
            'subject_type' => 'user',
            'subject_id' => $user->id,
        ]);

        // 4. Admin suspends user
        $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}/toggle-status")
            ->assertRedirect();

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $admin->id,
            'action' => 'user.status_changed',
            'subject_type' => 'user',
            'subject_id' => $user->id,
        ]);
    }

    public function test_user_can_opt_out_of_broadcast_emails_while_keeping_in_app_notifications(): void
    {
        Mail::fake();

        $eo = User::factory()->eo()->create();
        [$event, $ticketType] = $this->createPublishedEvent($eo);

        $optedOutUser = User::factory()->create(['email' => 'optout@example.com']);
        $optedInUser = User::factory()->create(['email' => 'optin@example.com']);

        // Opt-out via endpoint preferensi profil
        $this->actingAs($optedOutUser)
            ->patch('/profile/preferences', [
                'broadcast_emails_enabled' => false,
            ])
            ->assertRedirect();

        $this->assertFalse($optedOutUser->fresh()->broadcast_emails_enabled);

        foreach ([$optedOutUser, $optedInUser] as $attendee) {
            $order = Order::create([
                'user_id' => $attendee->id,
                'event_id' => $event->id,
                'order_reference' => 'HJR-BC-'.strtoupper(Str::random(6)),
                'status' => 'PAID',
                'total_amount' => 100000,
            ]);

            $orderItem = OrderItem::create([
                'order_id' => $order->id,
                'ticket_type_id' => $ticketType->id,
                'quantity' => 1,
                'unit_price' => 100000,
            ]);

            Ticket::create([
                'order_id' => $order->id,
                'order_item_id' => $orderItem->id,
                'holder_user_id' => $attendee->id,
                'ticket_code' => 'HJR-TKT-BC-'.strtoupper(Str::random(6)),
                'attendee_name' => $attendee->name,
                'attendee_email' => $attendee->email,
                'attendee_phone' => '081234567890',
                'status' => 'ACTIVE',
            ]);
        }

        SendEventBroadcastNotificationsJob::dispatchSync(
            eventId: $event->id,
            eventTitle: $event->title,
            eventSlug: $event->slug,
            announcementTitle: 'Info Open Gate',
            announcementMessage: 'Gerbang dibuka pukul 18.00 WIB.',
            organizerName: $eo->name,
            sendEmail: true,
        );

        // Keduanya tetap menerima notifikasi in-app
        $this->assertDatabaseHas('notifications', [
            'user_id' => $optedOutUser->id,
            'type' => 'EVENT_UPDATED',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $optedInUser->id,
            'type' => 'EVENT_UPDATED',
        ]);

        // Hanya user yang opt-in menerima email broadcast
        Mail::assertQueued(EventBroadcastMail::class, fn (EventBroadcastMail $mail): bool => $mail->hasTo('optin@example.com'));
        Mail::assertNotQueued(EventBroadcastMail::class, fn (EventBroadcastMail $mail): bool => $mail->hasTo('optout@example.com'));
    }

    public function test_purge_expired_eo_documents_command_deletes_old_files_and_keeps_recent_ones(): void
    {
        Storage::fake('local');

        $oldApplicant = User::factory()->create();
        $recentApplicant = User::factory()->create();

        $oldPath = 'eo-documents/old-ktp.webp';
        $recentPath = 'eo-documents/recent-ktp.webp';
        Storage::disk('local')->put($oldPath, 'old-bytes');
        Storage::disk('local')->put($recentPath, 'recent-bytes');

        $oldApp = EoApplication::create([
            'user_id' => $oldApplicant->id,
            'organization_name' => 'Old Org',
            'contact_phone' => '081211112222',
            'document_path' => $oldPath,
            'reason' => 'Pengajuan EO lama yang sudah selesai ditinjau.',
            'status' => 'APPROVED',
            'reviewed_at' => now()->subDays(45),
        ]);

        $recentApp = EoApplication::create([
            'user_id' => $recentApplicant->id,
            'organization_name' => 'Recent Org',
            'contact_phone' => '081233334444',
            'document_path' => $recentPath,
            'reason' => 'Pengajuan EO baru yang masih dalam masa retensi.',
            'status' => 'APPROVED',
            'reviewed_at' => now()->subDays(5),
        ]);

        $this->artisan('hajirin:purge-eo-documents', ['--days' => 30])
            ->assertSuccessful();

        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($recentPath);
        $this->assertSame('', $oldApp->fresh()->document_path);
        $this->assertSame($recentPath, $recentApp->fresh()->document_path);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'eo_documents.purged',
            'subject_type' => 'eo_application',
        ]);
    }

    public function test_admin_can_view_and_filter_audit_logs_page_and_non_admin_is_forbidden(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/admin/audit-logs')
            ->assertForbidden();

        // Picu 1 catatan log audit
        $this->actingAs($user)
            ->get('/profile/export-data')
            ->assertOk();

        $this->actingAs($admin)
            ->get('/admin/audit-logs?action=account.exported')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/AuditLogs/Index')
                ->where('filters.action', 'account.exported')
                ->has('logs.data', 1)
                ->where('logs.data.0.action', 'account.exported')
            );
    }
}
