<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\EoApplication;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Ticket;
use App\Models\TicketTransfer;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EdgeCaseSecurityAndIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private function createEventWithStatus(User $eo, string $status): Event
    {
        $category = Category::first() ?? Category::create([
            'name' => 'Teknologi',
            'slug' => 'teknologi',
            'icon' => 'sparkles',
        ]);

        return Event::create([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => "Event {$status} ".Str::random(4),
            'slug' => 'event-'.strtolower($status).'-'.strtolower(Str::random(6)),
            'description' => 'Deskripsi event untuk pengujian edge case.',
            'event_type' => 'OFFLINE',
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(2)->addHours(3),
            'city' => 'Jakarta',
            'venue_name' => 'Balai Kartini',
            'address' => 'Jl. Gatot Subroto No. 37',
            'status' => $status,
            'rejection_reason' => $status === 'REJECTED' ? 'Perlu revisi kelengkapan deskripsi.' : null,
        ]);
    }

    public function test_cancelled_tickets_are_reported_as_cancelled_not_used_on_user_dashboard(): void
    {
        $eo = User::factory()->eo()->create();
        $buyer = User::factory()->create();
        $event = $this->createEventWithStatus($eo, 'PUBLISHED');

        $ticketType = TicketType::create([
            'event_id' => $event->id,
            'name' => 'Reguler',
            'description' => 'Tiket masuk reguler',
            'quota' => 20,
            'initial_quota' => 20,
            'max_per_order' => 5,
            'status' => 'ACTIVE',
        ]);

        $order = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-CANCEL-'.strtoupper(Str::random(5)),
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
            'holder_user_id' => $buyer->id,
            'ticket_code' => 'HJR-TKT-CNL-'.strtoupper(Str::random(5)),
            'attendee_name' => $buyer->name,
            'attendee_email' => $buyer->email,
            'attendee_phone' => '081234567890',
            'status' => 'CANCELLED',
        ]);

        $this->actingAs($buyer)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('dashboard.myTickets.0.status', 'CANCELLED')
            );
    }

    public function test_unverified_user_cannot_see_or_claim_incoming_ticket_transfer(): void
    {
        $eo = User::factory()->eo()->create();
        $sender = User::factory()->create();
        $unverifiedRecipient = User::factory()->unverified()->create([
            'email' => 'penerima-belum-verif@example.com',
        ]);
        $event = $this->createEventWithStatus($eo, 'PUBLISHED');

        $ticketType = TicketType::create([
            'event_id' => $event->id,
            'name' => 'VIP',
            'description' => 'Akses VIP',
            'quota' => 10,
            'initial_quota' => 10,
            'max_per_order' => 5,
            'status' => 'ACTIVE',
        ]);

        $order = Order::create([
            'user_id' => $sender->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-TRF-'.strtoupper(Str::random(5)),
            'status' => 'PAID',
            'total_amount' => 150000,
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 1,
            'unit_price' => 150000,
        ]);

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'holder_user_id' => $sender->id,
            'ticket_code' => 'HJR-TKT-TRF-'.strtoupper(Str::random(5)),
            'attendee_name' => $sender->name,
            'attendee_email' => $sender->email,
            'attendee_phone' => '081234567890',
            'status' => 'ACTIVE',
        ]);

        $transfer = TicketTransfer::create([
            'ticket_id' => $ticket->id,
            'from_user_id' => $sender->id,
            'recipient_name' => $unverifiedRecipient->name,
            'recipient_email' => $unverifiedRecipient->email,
            'token' => Str::random(40),
            'code_hash' => Hash::make('ABC123'),
            'status' => 'PENDING',
            'attempts' => 0,
            'expires_at' => now()->addHours(24),
        ]);

        $this->actingAs($unverifiedRecipient)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('dashboard.incomingTransfers', 0)
            );

        $this->actingAs($unverifiedRecipient)
            ->post("/ticket-transfers/{$transfer->token}/accept", [
                'code' => 'ABC123',
            ])
            ->assertSessionHasErrors('email_verification');

        $this->assertSame('PENDING', $transfer->fresh()->status);
        $this->assertSame(0, (int) $transfer->fresh()->attempts);
    }

    public function test_register_and_forgot_password_normalize_email_casing(): void
    {
        Notification::fake();

        User::factory()->create([
            'email' => 'budi@example.com',
        ]);

        $this->post('/register', [
            'name' => 'Budi Duplikat',
            'email' => '  BUDI@Example.COM ',
            'phone' => '081234567890',
            'password' => 'SecretPass123!',
            'password_confirmation' => 'SecretPass123!',
            'terms' => true,
        ])->assertSessionHasErrors('email');

        $this->post('/forgot-password', [
            'email' => '  BUDI@Example.COM ',
        ])->assertSessionHas('status');
    }

    public function test_bookmark_blocks_draft_and_rejected_events_but_allows_public_and_ongoing_events(): void
    {
        $eo = User::factory()->eo()->create();
        $user = User::factory()->create();

        $draftEvent = $this->createEventWithStatus($eo, 'DRAFT');
        $rejectedEvent = $this->createEventWithStatus($eo, 'REJECTED');
        $ongoingEvent = $this->createEventWithStatus($eo, 'ONGOING');

        $this->actingAs($user)
            ->post("/events/{$draftEvent->slug}/bookmark")
            ->assertNotFound();

        $this->actingAs($user)
            ->post("/events/{$rejectedEvent->id}/bookmark")
            ->assertNotFound();

        $this->assertDatabaseMissing('bookmarks', [
            'user_id' => $user->id,
            'event_id' => $draftEvent->id,
        ]);

        $this->actingAs($user)
            ->post("/events/{$ongoingEvent->slug}/bookmark")
            ->assertRedirect();

        $this->assertDatabaseHas('bookmarks', [
            'user_id' => $user->id,
            'event_id' => $ongoingEvent->id,
        ]);
    }

    public function test_registration_requires_terms_consent_and_records_terms_accepted_at(): void
    {
        $this->post('/register', [
            'name' => 'Tanpa Consent',
            'email' => 'noconsent@example.com',
            'phone' => '081234567890',
            'password' => 'SecretPass123!',
            'password_confirmation' => 'SecretPass123!',
        ])->assertSessionHasErrors('terms');

        $this->post('/register', [
            'name' => 'Dengan Consent',
            'email' => 'withconsent@example.com',
            'phone' => '081234567890',
            'password' => 'SecretPass123!',
            'password_confirmation' => 'SecretPass123!',
            'terms' => true,
        ])->assertRedirect('/');

        $user = User::where('email', 'withconsent@example.com')->firstOrFail();
        $this->assertNotNull($user->terms_accepted_at);
    }

    public function test_account_deletion_scrubs_eo_documents_transfers_and_legacy_null_holder_tickets(): void
    {
        Storage::fake('local');

        $eo = User::factory()->eo()->create();
        $sender = User::factory()->create();
        $targetUser = User::factory()->create([
            'email' => 'hapus-pii@example.com',
            'password' => Hash::make('MySecret123!'),
        ]);
        $event = $this->createEventWithStatus($eo, 'PUBLISHED');

        $ticketType = TicketType::create([
            'event_id' => $event->id,
            'name' => 'Reguler',
            'description' => 'Tiket reguler',
            'quota' => 20,
            'initial_quota' => 20,
            'max_per_order' => 5,
            'status' => 'ACTIVE',
        ]);

        // Dokumen KTP/legalitas EO milik user
        $docPath = 'eo-documents/ktp-hapus-pii.webp';
        Storage::disk('local')->put($docPath, 'fake-ktp-bytes');
        $eoApp = EoApplication::create([
            'user_id' => $targetUser->id,
            'organization_name' => 'Komunitas Lama',
            'contact_phone' => '081299990000',
            'document_path' => $docPath,
            'reason' => 'Ingin membuat acara komunitas lokal di Bandung.',
            'status' => 'REJECTED',
            'rejection_reason' => 'Dokumen buram',
        ]);

        // Order PAID dengan tiket lama (holder_user_id = NULL)
        $order = Order::create([
            'user_id' => $targetUser->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-DEL-'.strtoupper(Str::random(5)),
            'status' => 'PAID',
            'total_amount' => 100000,
            'attendee_name' => $targetUser->name,
            'attendee_email' => $targetUser->email,
            'attendee_phone' => '081299990000',
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 1,
            'unit_price' => 100000,
        ]);

        $legacyTicket = Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'holder_user_id' => null,
            'ticket_code' => 'HJR-TKT-LEG-'.strtoupper(Str::random(5)),
            'attendee_name' => $targetUser->name,
            'attendee_email' => $targetUser->email,
            'attendee_phone' => '081299990000',
            'status' => 'USED',
            'checked_in_at' => now(),
            'checked_in_by' => $eo->id,
        ]);

        // Transfer masuk yang mencantumkan email user
        $transfer = TicketTransfer::create([
            'ticket_id' => $legacyTicket->id,
            'from_user_id' => $sender->id,
            'to_user_id' => $targetUser->id,
            'recipient_name' => $targetUser->name,
            'recipient_email' => $targetUser->email,
            'token' => Str::random(40),
            'code_hash' => Hash::make('XYZ789'),
            'status' => 'EXPIRED',
            'attempts' => 0,
            'expires_at' => now()->subDay(),
        ]);

        $this->actingAs($targetUser)
            ->delete('/profile', [
                'email' => $targetUser->email,
                'password' => 'MySecret123!',
                'confirmation' => 'HAPUS AKUN',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('home'));

        Storage::disk('local')->assertMissing($docPath);
        $this->assertSame('', $eoApp->fresh()->document_path);
        $this->assertSame('-', $eoApp->fresh()->contact_phone);
        $this->assertSame('Pengguna Terhapus', $legacyTicket->fresh()->attendee_name);
        $this->assertStringEndsWith('@deleted.hajirin.local', $legacyTicket->fresh()->attendee_email);
        $this->assertSame('Pengguna Terhapus', $transfer->fresh()->recipient_name);
        $this->assertStringEndsWith('@deleted.hajirin.local', $transfer->fresh()->recipient_email);
    }
}
