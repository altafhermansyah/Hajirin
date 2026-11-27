<?php

namespace Tests\Feature;

use App\Mail\AttendeeTicketMail;
use App\Mail\EmailOtpMail;
use App\Mail\EoApplicationStatusMail;
use App\Mail\EventBroadcastMail;
use App\Mail\EventCancelledAttendeeMail;
use App\Mail\EventModerationMail;
use App\Mail\OrderConfirmedMail;
use App\Mail\PasswordChangedMail;
use App\Mail\RefundStatusMail;
use App\Mail\StaffAssignedMail;
use App\Models\Category;
use App\Models\EoApplication;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Refund;
use App\Models\Ticket;
use App\Models\TicketPrice;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class EmailSystemTest extends TestCase
{
    use RefreshDatabase;

    private function makePublishedEventWithTicket(User $eo): array
    {
        $category = Category::create([
            'name' => 'Konser '.Str::random(4),
            'slug' => 'konser-'.strtolower(Str::random(5)),
            'icon' => 'music',
        ]);

        $event = Event::create([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => 'Hajirin Live Festival',
            'slug' => 'hajirin-live-'.strtolower(Str::random(5)),
            'description' => 'Festival musik dan teknologi di Jakarta.',
            'event_type' => 'OFFLINE',
            'city' => 'Jakarta',
            'venue_name' => 'Istora Senayan',
            'address' => 'Jl. Pintu Satu Senayan, Jakarta',
            'starts_at' => now()->addDays(10),
            'ends_at' => now()->addDays(10)->addHours(4),
            'status' => 'PUBLISHED',
        ]);

        $ticketType = TicketType::create([
            'event_id' => $event->id,
            'name' => 'VIP Pass',
            'initial_quota' => 50,
            'quota' => 50,
            'max_per_order' => 5,
            'status' => 'ACTIVE',
        ]);

        $ticketPrice = TicketPrice::create([
            'ticket_type_id' => $ticketType->id,
            'name' => 'Early Bird',
            'price' => 250000,
            'status' => 'ACTIVE',
        ]);

        return [$event, $ticketType, $ticketPrice];
    }

    public function test_registration_creates_unverified_user_without_auto_sending_and_manual_otp_send_hashes_code(): void
    {
        Mail::fake();

        $response = $this->post('/register', [
            'name' => 'Nadia Pratama',
            'email' => 'nadia@example.com',
            'phone' => '081234567890',
            'password' => 'SecretPass123!',
            'password_confirmation' => 'SecretPass123!',
        ]);

        $response->assertRedirect('/');

        $user = User::where('email', 'nadia@example.com')->firstOrFail();
        $this->assertNull($user->email_verified_at);
        Mail::assertNotQueued(EmailOtpMail::class);

        $this->actingAs($user)
            ->post('/email/otp/send')
            ->assertSessionHas('success');

        $capturedCode = null;
        Mail::assertQueued(EmailOtpMail::class, function (EmailOtpMail $mail) use (&$capturedCode): bool {
            $capturedCode = $mail->code;

            return $mail->hasTo('nadia@example.com') && preg_match('/^\d{6}$/', $mail->code) === 1;
        });

        $record = DB::table('email_verification_codes')
            ->where('user_id', $user->id)
            ->where('purpose', 'VERIFY_EMAIL')
            ->first();

        $this->assertNotNull($record);
        $this->assertNotSame($capturedCode, $record->code_hash);
        $this->assertTrue(Hash::check((string) $capturedCode, $record->code_hash));
    }

    public function test_unverified_user_is_gated_from_checkout_and_eo_application_until_otp_verified(): void
    {
        Mail::fake();
        Storage::fake('local');

        $eo = User::factory()->eo()->create();
        [$event, $ticketType, $ticketPrice] = $this->makePublishedEventWithTicket($eo);
        $unverified = User::factory()->unverified()->create([
            'email' => 'belumverif@example.com',
        ]);

        // Blocked from Checkout
        $this->actingAs($unverified)
            ->post('/checkout', [
                'event_id' => $event->id,
                'ticket_type_id' => $ticketType->id,
                'ticket_price_id' => $ticketPrice->id,
                'quantity' => 1,
                'payment_method' => 'qris',
                'attendee_name' => $unverified->name,
                'attendee_email' => $unverified->email,
                'attendee_phone' => '081234567890',
            ])
            ->assertSessionHasErrors('email_verification');

        // Blocked from EO Application
        $this->actingAs($unverified)
            ->post('/eo-applications', [
                'organization_name' => 'Komunitas Kreatif',
                'contact_phone' => '081234567890',
                'reason' => 'Kami ingin menyelenggarakan konser komunitas di Jakarta Selatan.',
                'document' => UploadedFile::fake()->create('ktp.pdf', 120, 'application/pdf'),
            ])
            ->assertSessionHasErrors('email_verification');

        // Send OTP and verify cooldown enforcement
        $this->actingAs($unverified)
            ->post('/email/otp/send')
            ->assertSessionHas('success');

        Mail::assertQueued(EmailOtpMail::class, 1);

        $this->actingAs($unverified)
            ->post('/email/otp/send')
            ->assertSessionHasErrors('code');

        // Replace code with known leading-zero 6-digit OTP to test wrong attempts + leading-zero verification
        DB::table('email_verification_codes')
            ->where('user_id', $unverified->id)
            ->update([
                'code_hash' => Hash::make('042819'),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(10),
            ]);

        // 4 failed attempts increment attempts; 5th burns the code
        for ($i = 1; $i <= 5; $i++) {
            $this->actingAs($unverified)
                ->post('/email/otp/verify', ['code' => '999999'])
                ->assertSessionHasErrors('code');
        }

        $this->assertDatabaseMissing('email_verification_codes', [
            'user_id' => $unverified->id,
        ]);

        // Expired code fails
        DB::table('email_verification_codes')->insert([
            'id' => Str::uuid()->toString(),
            'user_id' => $unverified->id,
            'email' => $unverified->email,
            'purpose' => 'VERIFY_EMAIL',
            'code_hash' => Hash::make('042819'),
            'attempts' => 0,
            'expires_at' => now()->subMinute(),
            'created_at' => now()->subMinutes(15),
        ]);

        $this->actingAs($unverified)
            ->post('/email/otp/verify', ['code' => '042819'])
            ->assertSessionHasErrors('code');

        // Fresh leading-zero OTP succeeds and unlocks checkout
        DB::table('email_verification_codes')->insert([
            'id' => Str::uuid()->toString(),
            'user_id' => $unverified->id,
            'email' => $unverified->email,
            'purpose' => 'VERIFY_EMAIL',
            'code_hash' => Hash::make('042819'),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
        ]);

        $this->actingAs($unverified)
            ->post('/email/otp/verify', ['code' => '042819'])
            ->assertSessionHas('success');

        $this->assertNotNull($unverified->fresh()->email_verified_at);
        $this->assertDatabaseMissing('email_verification_codes', [
            'user_id' => $unverified->id,
        ]);
    }

    public function test_checkout_queues_order_confirmed_mail_with_ics_and_separate_attendee_ticket_when_email_differs(): void
    {
        $this->freezeTime();
        Mail::fake();

        $eo = User::factory()->eo()->create();
        [$event, $ticketType, $ticketPrice] = $this->makePublishedEventWithTicket($eo);
        $buyer = User::factory()->create(['email' => 'pembeli@example.com']);

        // Case 1: Same email -> Checkout creates PENDING, confirm-payment queues OrderConfirmedMail with .ics
        $this->actingAs($buyer)
            ->post('/checkout', [
                'event_id' => $event->id,
                'ticket_type_id' => $ticketType->id,
                'ticket_price_id' => $ticketPrice->id,
                'quantity' => 1,
                'payment_method' => 'qris',
                'attendee_name' => $buyer->name,
                'attendee_email' => 'pembeli@example.com',
                'attendee_phone' => '081234567890',
            ])
            ->assertRedirect();

        $firstOrder = Order::where('user_id', $buyer->id)->latest('created_at')->firstOrFail();
        $this->actingAs($buyer)
            ->post("/orders/{$firstOrder->order_reference}/confirm-payment")
            ->assertRedirect(route('my-tickets.show', $firstOrder->order_reference));

        Mail::assertQueued(OrderConfirmedMail::class, function (OrderConfirmedMail $mail): bool {
            $mail->assertSeeInHtml('Hajirin Live Festival');
            $mail->assertHasAttachedData(
                OrderConfirmedMail::buildIcs($mail->payload),
                'hajirin-event.ics',
                ['mime' => 'text/calendar; charset=UTF-8; method=PUBLISH']
            );

            return $mail->hasTo('pembeli@example.com');
        });
        Mail::assertNotQueued(AttendeeTicketMail::class);

        // Case 2: Different attendee_email -> OrderConfirmedMail to buyer AND AttendeeTicketMail to friend
        Mail::fake();

        $this->actingAs($buyer)
            ->post('/checkout', [
                'event_id' => $event->id,
                'ticket_type_id' => $ticketType->id,
                'ticket_price_id' => $ticketPrice->id,
                'quantity' => 1,
                'payment_method' => 'qris',
                'attendee_name' => 'Rekan Kerja',
                'attendee_email' => 'rekan@example.com',
                'attendee_phone' => '081299998888',
            ])
            ->assertRedirect();

        $secondOrder = Order::where('user_id', $buyer->id)
            ->where('id', '!=', $firstOrder->id)
            ->latest('created_at')
            ->firstOrFail();

        $this->actingAs($buyer)
            ->post("/orders/{$secondOrder->order_reference}/confirm-payment")
            ->assertRedirect(route('my-tickets.show', $secondOrder->order_reference));

        Mail::assertQueued(OrderConfirmedMail::class, fn (OrderConfirmedMail $mail): bool => $mail->hasTo('pembeli@example.com'));
        Mail::assertQueued(AttendeeTicketMail::class, function (AttendeeTicketMail $mail): bool {
            $mail->assertSeeInHtml('Rekan Kerja');

            return $mail->hasTo('rekan@example.com');
        });
    }

    public function test_admin_moderation_cancellation_refund_staff_broadcast_and_password_change_queue_emails(): void
    {
        Mail::fake();

        $admin = User::factory()->admin()->create();
        $applicant = User::factory()->create(['email' => 'calon-eo@example.com']);
        $eo = User::factory()->eo()->create(['email' => 'eo-aktif@example.com']);
        $attendee = User::factory()->create(['email' => 'peserta@example.com']);
        $staffCandidate = User::factory()->create(['email' => 'staff@example.com']);

        // 1. Admin approves EO application
        $application = EoApplication::create([
            'user_id' => $applicant->id,
            'organization_name' => 'Nusantara Stage',
            'contact_phone' => '081234567890',
            'document_path' => 'eo-documents/sample-ktp.pdf',
            'reason' => 'Penyelenggara event musik independen.',
            'status' => 'PENDING',
        ]);

        $this->actingAs($admin)
            ->post("/admin/eo-applications/{$application->id}/approve")
            ->assertRedirect();

        Mail::assertQueued(EoApplicationStatusMail::class, fn (EoApplicationStatusMail $mail): bool => $mail->hasTo('calon-eo@example.com') && $mail->approved === true);

        // 2. Admin approves & rejects Events
        [$publishedEvent, $ticketType] = $this->makePublishedEventWithTicket($eo);

        $pendingEvent = Event::create([
            'eo_id' => $eo->id,
            'category_id' => $publishedEvent->category_id,
            'title' => 'Seminar Cloud Native',
            'slug' => 'seminar-cloud-'.strtolower(Str::random(5)),
            'description' => 'Workshop cloud native.',
            'event_type' => 'ONLINE',
            'online_url' => 'https://example.com/cloud',
            'starts_at' => now()->addDays(7),
            'ends_at' => now()->addDays(7)->addHours(2),
            'status' => 'PENDING_REVIEW',
        ]);

        $this->actingAs($admin)
            ->post("/admin/events/{$pendingEvent->id}/reject", [
                'rejection_reason' => 'Mohon lengkapi jadwal sesi pembicara.',
            ])
            ->assertRedirect();

        Mail::assertQueued(EventModerationMail::class, fn (EventModerationMail $mail): bool => $mail->hasTo('eo-aktif@example.com') && $mail->approved === false);

        // Create a paid order + active ticket for attendee on $publishedEvent
        $order = Order::create([
            'user_id' => $attendee->id,
            'event_id' => $publishedEvent->id,
            'order_reference' => 'HJR-TEST-9001',
            'status' => 'PAID',
            'total_amount' => 250000,
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 1,
            'unit_price' => 250000,
        ]);

        Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'ticket_code' => 'TKT-9001-AAA',
            'attendee_name' => $attendee->name,
            'attendee_email' => $attendee->email,
            'attendee_phone' => '081234567890',
            'status' => 'ACTIVE',
        ]);

        // 3. EO Broadcast without email vs with email
        $this->actingAs($eo)
            ->post('/eo/broadcasts', [
                'event_id' => $publishedEvent->id,
                'title' => 'Info Open Gate',
                'message' => 'Pintu masuk dibuka mulai pukul 17.00 WIB.',
                'send_email' => false,
            ])
            ->assertRedirect();

        Mail::assertNotQueued(EventBroadcastMail::class);

        $this->actingAs($eo)
            ->post('/eo/broadcasts', [
                'event_id' => $publishedEvent->id,
                'title' => 'Update Rundown Acara',
                'message' => 'Rundown terbaru sudah tersedia di halaman event.',
                'send_email' => true,
            ])
            ->assertRedirect();

        Mail::assertQueued(EventBroadcastMail::class, fn (EventBroadcastMail $mail): bool => $mail->hasTo('peserta@example.com'));

        // 4. EO Staff assignment
        $this->actingAs($eo)
            ->post('/eo/staff', [
                'event_id' => $publishedEvent->id,
                'email' => $staffCandidate->email,
            ])
            ->assertRedirect();

        Mail::assertQueued(StaffAssignedMail::class, fn (StaffAssignedMail $mail): bool => $mail->hasTo('staff@example.com'));

        // 5. Admin Refund approval
        $refund = Refund::create([
            'order_id' => $order->id,
            'requested_by' => $attendee->id,
            'amount' => 250000,
            'reason' => 'Berhalangan hadir karena dinas luar kota.',
            'status' => 'PENDING',
            'requested_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post("/admin/refunds/{$refund->id}/reject", [
                'resolution_note' => 'Pengajuan melewati batas waktu H-3.',
            ])
            ->assertRedirect();

        Mail::assertQueued(RefundStatusMail::class, fn (RefundStatusMail $mail): bool => $mail->hasTo('peserta@example.com') && $mail->approved === false);

        // 6. EO Event cancellation notifies paid attendee
        $this->actingAs($eo)
            ->post("/eo/events/{$publishedEvent->id}/cancel", [
                'cancellation_reason' => 'Force majeure kondisi cuaca ekstrem di lokasi.',
            ])
            ->assertRedirect();

        Mail::assertQueued(EventCancelledAttendeeMail::class, fn (EventCancelledAttendeeMail $mail): bool => $mail->hasTo('peserta@example.com') && $mail->orderReference === 'HJR-TEST-9001');

        // 7. Authenticated password reset sends security alert email
        $resetToken = Password::broker()->createToken($attendee);
        $this->actingAs($attendee)
            ->post('/reset-password', [
                'token' => $resetToken,
                'email' => $attendee->email,
                'password' => 'NewSecurePass123!',
                'password_confirmation' => 'NewSecurePass123!',
            ])
            ->assertRedirect(route('dashboard').'#profil');

        Mail::assertQueued(PasswordChangedMail::class, fn (PasswordChangedMail $mail): bool => $mail->hasTo('peserta@example.com'));
    }

    public function test_branded_password_reset_notification_uses_bahasa_indonesia_hajirin_template(): void
    {
        $user = User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
        ]);

        $notification = new ResetPasswordNotification('sample-reset-token-123');
        $mailMessage = $notification->toMail($user);

        $this->assertSame('Atur Ulang Kata Sandi Akun Hajirin Anda', $mailMessage->subject);
        $this->assertSame('emails.auth.reset-password', $mailMessage->view);

        $rendered = view($mailMessage->view, $mailMessage->viewData)->render();
        $this->assertStringContainsString('Atur Ulang Kata Sandi', $rendered);
        $this->assertStringContainsString('Budi Santoso', $rendered);
        $this->assertStringContainsString('sample-reset-token-123', $rendered);
    }
}
