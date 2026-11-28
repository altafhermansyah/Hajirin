<?php

namespace Tests\Feature;

use App\Mail\OrderConfirmedMail;
use App\Mail\PasswordChangedMail;
use App\Mail\TicketTransferCompletedMail;
use App\Mail\TicketTransferInviteMail;
use App\Models\Bookmark;
use App\Models\Category;
use App\Models\EoApplication;
use App\Models\Event;
use App\Models\EventStaff;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Refund;
use App\Models\Ticket;
use App\Models\TicketPrice;
use App\Models\TicketTransfer;
use App\Models\TicketType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FeatureExpansionAndSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function makeCategory(): Category
    {
        return Category::create([
            'name' => 'Musik '.Str::random(4),
            'slug' => 'musik-'.strtolower(Str::random(5)),
            'icon' => 'music',
        ]);
    }

    /**
     * @return array{0: Event, 1: TicketType, 2: TicketPrice}
     */
    private function makeEventWithTicket(
        User $eo,
        float $price = 150000,
        ?Carbon $startsAt = null,
        ?Carbon $endsAt = null,
        string $title = 'Voksganza Live 2026',
        string $city = 'Bandung',
    ): array {
        $category = $this->makeCategory();
        $start = $startsAt ?? now()->addDays(5);
        $end = $endsAt ?? $start->copy()->addHours(4);

        $event = Event::create([
            'eo_id' => $eo->id,
            'category_id' => $category->id,
            'title' => $title,
            'slug' => Str::slug($title).'-'.strtolower(Str::random(5)),
            'description' => 'Acara spektakuler untuk pengujian menyeluruh platform Hajirin.',
            'event_type' => 'OFFLINE',
            'city' => $city,
            'venue_name' => 'Sabuga Convention Hall',
            'address' => 'Jl. Tamansari No. 73, '.$city,
            'starts_at' => $start,
            'ends_at' => $end,
            'status' => 'PUBLISHED',
        ]);

        $ticketType = TicketType::create([
            'event_id' => $event->id,
            'name' => 'Festival Pass',
            'initial_quota' => 20,
            'quota' => 20,
            'max_per_order' => 5,
            'status' => 'ACTIVE',
        ]);

        $ticketPrice = TicketPrice::create([
            'ticket_type_id' => $ticketType->id,
            'name' => 'Regular',
            'price' => $price,
            'status' => 'ACTIVE',
        ]);

        return [$event, $ticketType, $ticketPrice];
    }

    public function test_application_timezone_is_wib_and_password_changed_email_uses_jakarta_time(): void
    {
        $this->assertSame('Asia/Jakarta', config('app.timezone'));

        Mail::fake();
        $frozenTime = Carbon::create(2026, 11, 26, 21, 22, 0, 'Asia/Jakarta');
        $this->travelTo($frozenTime);

        $user = User::factory()->create([
            'name' => 'Rina WIB',
            'email' => 'rina@example.com',
        ]);

        $token = Password::broker()->createToken($user);

        $this->actingAs($user)
            ->post('/reset-password', [
                'token' => $token,
                'email' => 'rina@example.com',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ])
            ->assertRedirect(route('dashboard').'#profil');

        Mail::assertQueued(PasswordChangedMail::class, function (PasswordChangedMail $mail): bool {
            return $mail->hasTo('rina@example.com')
                && str_contains($mail->changedAtFormatted, '21:22 WIB');
        });
    }

    public function test_eo_organization_name_and_avatar_are_consistent_across_all_public_and_user_pages(): void
    {
        Storage::fake('public');

        $eoUser = User::factory()->eo()->create([
            'name' => 'Nama Pribadi User Biasa',
            'email' => 'eo-voksganza@example.com',
            'phone' => '081234567890',
        ]);

        EoApplication::forceCreate([
            'user_id' => $eoUser->id,
            'organization_name' => 'Voksganza Official',
            'contact_phone' => '081234567890',
            'document_path' => 'eo-documents/voksganza.pdf',
            'reason' => 'Penyelenggara festival musik Voksganza.',
            'status' => 'APPROVED',
            'reviewed_at' => now()->subDay(),
        ]);

        // Unggah logo/foto profil EO -> harus terkonversi WebP dan tersimpan di users.avatar_path
        $logo = UploadedFile::fake()->image('voksganza-logo.png', 900, 900);
        $this->actingAs($eoUser)
            ->post('/eo/profile', [
                'organization_name' => 'Voksganza Official',
                'contact_phone' => '081234567890',
                'portfolio_url' => 'https://voksganza.id',
                'avatar' => $logo,
            ])
            ->assertRedirect('/eo/profile')
            ->assertSessionHas('success');

        $eoUser->refresh();
        $this->assertNotNull($eoUser->avatar_path);
        $this->assertStringEndsWith('.webp', $eoUser->avatar_path);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $eoUser->avatar_path));

        [$event, $ticketType, $ticketPrice] = $this->makeEventWithTicket($eoUser, 100000, now()->addDays(5), null, 'Voksganza Music Fest', 'Malang');

        // 1. Beranda
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('events.0.organizer', 'Voksganza Official')
            );

        // 2. Kategori
        $this->get('/kategori')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('events.0.organizer', 'Voksganza Official')
            );

        // 3. Nearby (termasuk kota dinamis Malang)
        $this->get('/event-terdekat?city=Malang')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('events.0.organizer', 'Voksganza Official')
                ->where('availableCities', fn ($cities) => collect($cities)->contains('Malang'))
            );

        // 4. Event Detail (menampilkan organization_name dan organizer_avatar)
        $this->get("/event/{$event->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('eventData.organizer', 'Voksganza Official')
                ->where('eventData.organizer_avatar', $eoUser->avatar_path)
            );

        // 5. Bookmark, Invoice & E-Tiket
        $buyer = User::factory()->create();
        Bookmark::create(['user_id' => $buyer->id, 'event_id' => $event->id]);

        $order = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-VOKS-0001',
            'status' => 'PAID',
            'total_amount' => 100000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $item = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'ticket_price_id' => $ticketPrice->id,
            'quantity' => 1,
            'unit_price' => 100000,
        ]);
        Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'holder_user_id' => $buyer->id,
            'ticket_code' => 'HJR-TKT-2026-VOKS0001',
            'attendee_name' => $buyer->name,
            'attendee_email' => $buyer->email,
            'status' => 'ACTIVE',
        ]);

        $this->actingAs($buyer)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('dashboard.bookmarkedEvents.0.organizer', 'Voksganza Official')
            );

        $this->actingAs($buyer)
            ->get("/orders/{$order->order_reference}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('event.organizer', 'Voksganza Official')
            );

        $this->actingAs($buyer)
            ->get("/my-tickets/{$order->order_reference}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('event.organizer', 'Voksganza Official')
            );
    }

    public function test_registration_requires_valid_phone_and_normalizes_separators(): void
    {
        // Tanpa nomor HP ditolak
        $this->post('/register', [
            'name' => 'Tanpa HP',
            'email' => 'nohp@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'terms' => true,
        ])->assertSessionHasErrors('phone');

        // Nomor HP mengandung huruf ditolak
        $this->post('/register', [
            'name' => 'Huruf HP',
            'email' => 'hurufhp@example.com',
            'phone' => '081234ABCD',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'terms' => true,
        ])->assertSessionHasErrors('phone');

        // Nomor HP terlalu pendek ditolak
        $this->post('/register', [
            'name' => 'Pendek HP',
            'email' => 'pendek@example.com',
            'phone' => '08123',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'terms' => true,
        ])->assertSessionHasErrors('phone');

        // Nomor HP dengan spasi/strip dinormalisasi dan diterima
        $this->post('/register', [
            'name' => 'Budi Lengkap',
            'email' => 'budi.lengkap@example.com',
            'phone' => '+62 812-3456-7890',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'terms' => true,
        ])->assertRedirect('/');

        $this->assertDatabaseHas('users', [
            'email' => 'budi.lengkap@example.com',
            'phone' => '6281234567890',
        ]);
    }

    public function test_check_in_window_enforces_three_hours_before_starts_at_until_ends_at(): void
    {
        $eo = User::factory()->eo()->create();
        $staff = User::factory()->create();
        $admin = User::factory()->admin()->create();
        $buyer = User::factory()->create();

        // Event masih 5 jam lagi (> 3 jam sebelum starts_at) -> HARUS DITOLAK
        [$futureEvent, $futureType] = $this->makeEventWithTicket(
            $eo,
            100000,
            now()->addHours(5),
            now()->addHours(9),
            'Konser Masih Lama'
        );

        EventStaff::create([
            'event_id' => $futureEvent->id,
            'user_id' => $staff->id,
            'role' => 'CHECKIN',
        ]);

        $futureOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $futureEvent->id,
            'order_reference' => 'HJR-GATE-001',
            'status' => 'PAID',
            'total_amount' => 100000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $futureItem = OrderItem::create([
            'order_id' => $futureOrder->id,
            'ticket_type_id' => $futureType->id,
            'quantity' => 1,
            'unit_price' => 100000,
        ]);
        $futureTicket = Ticket::create([
            'order_id' => $futureOrder->id,
            'order_item_id' => $futureItem->id,
            'holder_user_id' => $buyer->id,
            'ticket_code' => 'HJR-TKT-2026-EARLY001',
            'attendee_name' => $buyer->name,
            'attendee_email' => $buyer->email,
            'status' => 'ACTIVE',
        ]);

        // EO check-in ditolak
        $this->actingAs($eo)
            ->post('/eo/check-in', ['ticket_code' => $futureTicket->ticket_code])
            ->assertRedirect();
        $this->assertSame('invalid', session('checkin_result')['outcome']);
        $this->assertStringContainsString('3 jam sebelum acara dimulai', session('checkin_result')['message']);
        $this->assertSame('ACTIVE', $futureTicket->fresh()->status);

        // Staff check-in ditolak
        $this->actingAs($staff)
            ->post('/staff/check-in', ['ticket_code' => $futureTicket->ticket_code])
            ->assertRedirect();
        $this->assertSame('invalid', session('checkin_result')['outcome']);
        $this->assertSame('ACTIVE', $futureTicket->fresh()->status);

        // Admin check-in ditolak
        $this->actingAs($admin)
            ->post('/admin/scanner', ['ticket_code' => $futureTicket->ticket_code])
            ->assertRedirect();
        $this->assertSame('invalid', session('checkin_result')['outcome']);
        $this->assertSame('ACTIVE', $futureTicket->fresh()->status);

        // Halaman scanner EO mengirimkan checkInOpensAtIso & isCheckInOpen = false
        $this->actingAs($eo)
            ->get("/eo/check-in?event_id={$futureEvent->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('events.0.isCheckInOpen', false)
                ->has('events.0.checkInOpensAtIso')
            );

        // Majukan jadwal event ke 2 jam dari sekarang (masuk jendela H-3 jam) -> DITERIMA
        $futureEvent->update([
            'starts_at' => now()->addHours(2),
            'ends_at' => now()->addHours(6),
        ]);

        $this->actingAs($eo)
            ->post('/eo/check-in', ['ticket_code' => $futureTicket->ticket_code])
            ->assertRedirect();
        $this->assertSame('success', session('checkin_result')['outcome']);
        $this->assertSame('USED', $futureTicket->fresh()->status);

        // Event yang sudah lewat ends_at -> DITOLAK
        [$endedEvent, $endedType] = $this->makeEventWithTicket(
            $eo,
            100000,
            now()->subHours(5),
            now()->subHour(),
            'Konser Sudah Selesai'
        );
        $endedOrder = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $endedEvent->id,
            'order_reference' => 'HJR-GATE-002',
            'status' => 'PAID',
            'total_amount' => 100000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $endedItem = OrderItem::create([
            'order_id' => $endedOrder->id,
            'ticket_type_id' => $endedType->id,
            'quantity' => 1,
            'unit_price' => 100000,
        ]);
        $endedTicket = Ticket::create([
            'order_id' => $endedOrder->id,
            'order_item_id' => $endedItem->id,
            'holder_user_id' => $buyer->id,
            'ticket_code' => 'HJR-TKT-2026-ENDED001',
            'attendee_name' => $buyer->name,
            'attendee_email' => $buyer->email,
            'status' => 'ACTIVE',
        ]);

        $this->actingAs($eo)
            ->post('/eo/check-in', ['ticket_code' => $endedTicket->ticket_code])
            ->assertRedirect();
        $this->assertSame('invalid', session('checkin_result')['outcome']);
        $this->assertStringContainsString('telah berakhir', session('checkin_result')['message']);
    }

    public function test_mock_payment_idempotency_timer_confirmation_cancel_and_lazy_expiration(): void
    {
        Mail::fake();
        $eo = User::factory()->eo()->create();
        $buyer = User::factory()->create(['email' => 'pembeli-mock@example.com']);
        [$event, $ticketType, $ticketPrice] = $this->makeEventWithTicket($eo, 150000);

        $idempotencyKey = (string) Str::uuid();
        $payload = [
            'event_id' => $event->id,
            'ticket_type_id' => $ticketType->id,
            'ticket_price_id' => $ticketPrice->id,
            'quantity' => 2,
            'payment_method' => 'transfer',
            'attendee_name' => 'Pembeli Mock',
            'attendee_email' => 'pembeli-mock@example.com',
            'attendee_phone' => '081234567890',
            'idempotency_key' => $idempotencyKey,
        ];

        // 1. Submit pertama -> buat order PENDING, tahan 2 kuota
        $res1 = $this->actingAs($buyer)->post('/checkout', $payload);
        $order = Order::where('user_id', $buyer->id)->firstOrFail();
        $res1->assertRedirect(route('orders.pay', $order->order_reference));

        $this->assertSame('PENDING', $order->status);
        $this->assertSame(18, $ticketType->fresh()->quota);
        $this->assertSame(0, Ticket::where('order_id', $order->id)->count());
        Mail::assertNotQueued(OrderConfirmedMail::class);

        // 2. Submit kedua dengan idempotency_key yang sama -> TIDAK boleh buat order kedua atau potong kuota lagi
        $res2 = $this->actingAs($buyer)->post('/checkout', $payload);
        $res2->assertRedirect(route('orders.pay', $order->order_reference));
        $this->assertSame(1, Order::where('user_id', $buyer->id)->count());
        $this->assertSame(18, $ticketType->fresh()->quota);

        // 3. Halaman /orders/{ref}/pay menampilkan metode BANK_TRANSFER + VA number + expiresAtIso
        $this->actingAs($buyer)
            ->get("/orders/{$order->order_reference}/pay")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Order/Pay')
                ->where('order.status', 'PENDING')
                ->where('payment.method', 'BANK_TRANSFER')
                ->where('payment.qrisPayload', fn (string $qris): bool => strlen($qris) <= 106)
                ->has('payment.vaNumber')
                ->has('order.expiresAtIso')
            );

        // 4. Konfirmasi pembayaran demo -> PAID, 2 tiket diterbitkan, email dikirim
        $this->actingAs($buyer)
            ->post("/orders/{$order->order_reference}/confirm-payment")
            ->assertRedirect(route('my-tickets.show', $order->order_reference));

        $this->assertSame('PAID', $order->fresh()->status);
        $this->assertSame(2, Ticket::where('order_id', $order->id)->count());
        $this->assertSame($buyer->id, Ticket::where('order_id', $order->id)->first()->holder_user_id);
        Mail::assertQueued(OrderConfirmedMail::class, 1);

        // 5. Konfirmasi ulang pada order PAID -> idempoten (tidak menerbitkan tiket ganda)
        $this->actingAs($buyer)
            ->post("/orders/{$order->order_reference}/confirm-payment")
            ->assertRedirect(route('my-tickets.show', $order->order_reference));
        $this->assertSame(2, Ticket::where('order_id', $order->id)->count());

        // 6. Pembatalan order PENDING -> status CANCELLED & kuota kembali
        $cancelPayload = array_merge($payload, [
            'quantity' => 3,
            'idempotency_key' => (string) Str::uuid(),
        ]);
        $this->actingAs($buyer)->post('/checkout', $cancelPayload)->assertRedirect();
        $pendingToCancel = Order::where('id', '!=', $order->id)->firstOrFail();
        $this->assertSame(15, $ticketType->fresh()->quota);

        $this->actingAs($buyer)
            ->post("/orders/{$pendingToCancel->order_reference}/cancel")
            ->assertRedirect(route('orders.show', $pendingToCancel->order_reference));
        $this->assertSame('CANCELLED', $pendingToCancel->fresh()->status);
        $this->assertSame(18, $ticketType->fresh()->quota);

        // 7. Lazy expiration saat melewati 15 menit -> status EXPIRED & kuota kembali, konfirmasi ditolak
        $expirePayload = array_merge($payload, [
            'quantity' => 4,
            'idempotency_key' => (string) Str::uuid(),
        ]);
        $this->actingAs($buyer)->post('/checkout', $expirePayload)->assertRedirect();
        $overdueOrder = Order::whereNotIn('id', [$order->id, $pendingToCancel->id])->firstOrFail();
        $this->assertSame(14, $ticketType->fresh()->quota);

        $overdueOrder->forceFill(['expires_at' => now()->subMinute()])->save();

        $this->actingAs($buyer)
            ->post("/orders/{$overdueOrder->order_reference}/confirm-payment")
            ->assertRedirect(route('orders.pay', $overdueOrder->order_reference))
            ->assertSessionHas('error');

        $this->assertSame('EXPIRED', $overdueOrder->fresh()->status);
        $this->assertSame(18, $ticketType->fresh()->quota);
        $this->assertSame(0, Ticket::where('order_id', $overdueOrder->id)->count());

        // 8. Tiket gratis langsung PAID tanpa halaman pembayaran PENDING
        [$freeEvent, $freeType, $freePrice] = $this->makeEventWithTicket($eo, 0, now()->addDays(6), null, 'Webinar Gratis');
        $this->actingAs($buyer)
            ->post('/checkout', [
                'event_id' => $freeEvent->id,
                'ticket_type_id' => $freeType->id,
                'ticket_price_id' => $freePrice->id,
                'quantity' => 1,
                'payment_method' => 'qris',
                'attendee_name' => 'Peserta Gratis',
                'attendee_email' => $buyer->email,
                'attendee_phone' => '081234567890',
                'idempotency_key' => (string) Str::uuid(),
            ])
            ->assertSessionHas('order_success');

        $freeOrder = Order::where('event_id', $freeEvent->id)->firstOrFail();
        $this->assertSame('PAID', $freeOrder->status);
        $this->assertSame(1, Ticket::where('order_id', $freeOrder->id)->count());
    }

    public function test_hybrid_ticket_transfer_rotates_qr_code_and_transfers_ownership(): void
    {
        Mail::fake();
        $eo = User::factory()->eo()->create();
        $sender = User::factory()->create(['name' => 'Pengirim Asli', 'email' => 'pengirim@example.com']);
        $stranger = User::factory()->create(['name' => 'Orang Lain', 'email' => 'asing@example.com']);

        [$event, $ticketType] = $this->makeEventWithTicket($eo, 200000);

        $order = Order::create([
            'user_id' => $sender->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-TRF-0001',
            'status' => 'PAID',
            'total_amount' => 200000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $item = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 1,
            'unit_price' => 200000,
        ]);
        $ticket = Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'holder_user_id' => $sender->id,
            'ticket_code' => 'HJR-TKT-2026-OLDQR001',
            'attendee_name' => $sender->name,
            'attendee_email' => $sender->email,
            'status' => 'ACTIVE',
        ]);

        // Transfer ke email sendiri ditolak
        $this->actingAs($sender)
            ->post("/tickets/{$ticket->id}/transfer", [
                'recipient_name' => 'Diri Sendiri',
                'recipient_email' => 'pengirim@example.com',
            ])
            ->assertSessionHasErrors('recipient_email');

        // Transfer ke email yang BELUM punya akun Hajirin -> BERHASIL mengirim undangan + kode 6 karakter
        $this->actingAs($sender)
            ->post("/tickets/{$ticket->id}/transfer", [
                'recipient_name' => 'Calon Penerima',
                'recipient_email' => 'penerima-baru@example.com',
            ])
            ->assertSessionHas('success');

        $plainCode = null;
        Mail::assertQueued(TicketTransferInviteMail::class, function (TicketTransferInviteMail $mail) use (&$plainCode): bool {
            $plainCode = $mail->payload['transferCode'] ?? null;

            return $mail->hasTo('penerima-baru@example.com')
                && is_string($plainCode)
                && strlen($plainCode) === 6;
        });

        $transfer = TicketTransfer::where('ticket_id', $ticket->id)->firstOrFail();
        $this->assertSame('PENDING', $transfer->status);
        $this->assertNotSame($plainCode, $transfer->code_hash);
        $this->assertTrue(Hash::check((string) $plainCode, $transfer->code_hash));

        // Guest dapat membuka halaman klaim untuk melihat instruksi login/daftar
        $this->get("/ticket-transfers/{$transfer->token}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Ticket/AcceptTransfer')
                ->where('transfer.status', 'PENDING')
                ->where('emailMatches', false)
            );

        // User lain (email tidak cocok) gagal mengklaim walaupun tahu kode
        $this->actingAs($stranger)
            ->post("/ticket-transfers/{$transfer->token}/accept", ['code' => $plainCode])
            ->assertSessionHasErrors('code');

        // Penerima mendaftar / memiliki akun dengan email yang cocok
        $recipient = User::factory()->create([
            'name' => 'Siti Penerima',
            'email' => 'penerima-baru@example.com',
            'phone' => '081399990000',
        ]);

        // Kode salah ditolak dan menambah attempts
        $this->actingAs($recipient)
            ->post("/ticket-transfers/{$transfer->token}/accept", ['code' => 'ZZZZZZ'])
            ->assertSessionHasErrors('code');
        $this->assertSame(1, $transfer->fresh()->attempts);

        // Kode benar -> klaim sukses, rotasi QR code, kepemilikan berpindah!
        $this->actingAs($recipient)
            ->post("/ticket-transfers/{$transfer->token}/accept", ['code' => strtolower((string) $plainCode)])
            ->assertRedirect(route('my-tickets.show', $order->order_reference))
            ->assertSessionHas('success');

        $ticket->refresh();
        $transfer->refresh();

        $this->assertSame('ACCEPTED', $transfer->status);
        $this->assertSame($recipient->id, $transfer->to_user_id);
        $this->assertSame($recipient->id, $ticket->holder_user_id);
        $this->assertSame('Siti Penerima', $ticket->attendee_name);
        $this->assertSame('penerima-baru@example.com', $ticket->attendee_email);
        $this->assertNotSame('HJR-TKT-2026-OLDQR001', $ticket->ticket_code);
        $this->assertStringStartsWith('HJR-TKT-', $ticket->ticket_code);

        Mail::assertQueued(TicketTransferCompletedMail::class, 2);

        // Penerima melihat tiket di Dashboard dan halaman detail e-tiket
        $this->actingAs($recipient)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('dashboard.myTickets', 1)
                ->where('dashboard.myTickets.0.isTransferredIn', true)
            );

        $this->actingAs($recipient)
            ->get("/my-tickets/{$order->order_reference}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('order.isOrderBuyer', false)
                ->where('tickets.0.ticketCode', $ticket->ticket_code)
                ->where('tickets.0.isHeldByMe', true)
            );

        // Pengirim melihat QR sudah dimask ('DITRANSFER') dan tidak bisa refund pesanan ini lagi
        $this->actingAs($sender)
            ->get("/my-tickets/{$order->order_reference}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('tickets.0.isTransferredOut', true)
                ->where('tickets.0.ticketCode', 'DITRANSFER')
            );

        $this->actingAs($sender)
            ->post("/orders/{$order->order_reference}/refund", [
                'reason' => 'Ingin membatalkan tiket yang sudah ditransfer.',
            ])
            ->assertSessionHasErrors('refund');
    }

    public function test_sender_can_cancel_pending_ticket_transfer(): void
    {
        Mail::fake();
        $eo = User::factory()->eo()->create();
        $sender = User::factory()->create(['email' => 'cancel-sender@example.com']);
        [$event, $ticketType] = $this->makeEventWithTicket($eo, 100000);

        $order = Order::create([
            'user_id' => $sender->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-TRF-CNCL',
            'status' => 'PAID',
            'total_amount' => 100000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $item = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 1,
            'unit_price' => 100000,
        ]);
        $ticket = Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'holder_user_id' => $sender->id,
            'ticket_code' => 'HJR-TKT-2026-CNCL001',
            'attendee_name' => $sender->name,
            'attendee_email' => $sender->email,
            'status' => 'ACTIVE',
        ]);

        $this->actingAs($sender)
            ->post("/tickets/{$ticket->id}/transfer", [
                'recipient_name' => 'Rekan',
                'recipient_email' => 'rekan-cancel@example.com',
            ])
            ->assertSessionHas('success');

        $transfer = TicketTransfer::where('ticket_id', $ticket->id)->firstOrFail();

        $this->actingAs($sender)
            ->delete("/ticket-transfers/{$transfer->id}")
            ->assertSessionHas('success');

        $this->assertSame('CANCELLED', $transfer->fresh()->status);
    }

    public function test_unified_profile_password_reset_export_data_and_account_deletion_flows(): void
    {
        Notification::fake();
        Mail::fake();

        // 1. Unified profile password reset link validation + authenticated reset page access
        $cleanUser = User::factory()->create([
            'name' => 'Pengguna Bersih',
            'email' => 'bersih@example.com',
            'phone' => '081234567890',
        ]);

        // Email tidak cocok ditolak
        $this->actingAs($cleanUser)
            ->post('/profile/password-reset-link', ['email' => 'salah@example.com'])
            ->assertSessionHasErrors('email');

        // Email cocok -> sukses
        $this->actingAs($cleanUser)
            ->post('/profile/password-reset-link', ['email' => 'bersih@example.com'])
            ->assertSessionHas('password_reset_status');

        $token = Password::broker()->createToken($cleanUser);

        // User yang sedang login dapat membuka halaman /reset-password/{token}
        $this->actingAs($cleanUser)
            ->get("/reset-password/{$token}?email=bersih@example.com")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Auth/ResetPassword'));

        // 2. Ekspor Data Pribadi JSON tanpa kebocoran password hash
        $exportResponse = $this->actingAs($cleanUser)->get('/profile/export-data');
        $exportResponse->assertOk();
        $exportResponse->assertHeader('content-type', 'application/json; charset=UTF-8');

        $exported = json_decode($exportResponse->streamedContent(), true);
        $this->assertIsArray($exported);
        $this->assertSame('bersih@example.com', $exported['account']['email']);
        $this->assertArrayNotHasKey('password', $exported['account']);
        $this->assertArrayNotHasKey('remember_token', $exported['account']);
        $this->assertArrayHasKey('orders', $exported);
        $this->assertArrayHasKey('tickets', $exported);
        $this->assertArrayHasKey('ticket_transfers', $exported);

        // 3. Delete Account: konfirmasi salah ditolak
        $this->actingAs($cleanUser)
            ->delete('/profile', [
                'email' => 'bersih@example.com',
                'confirmation' => 'hapus akun',
            ])
            ->assertSessionHasErrors('confirmation');

        // 4. Delete Account: akun bersih tanpa transaksi -> HARD DELETE + Clear-Site-Data
        $cleanUserId = $cleanUser->id;
        $deleteClean = $this->actingAs($cleanUser)->delete('/profile', [
            'email' => 'bersih@example.com',
            'confirmation' => 'HAPUS AKUN',
        ]);

        $deleteClean->assertRedirect(route('home'));
        $deleteClean->assertHeader('Clear-Site-Data', '"cookies", "storage"');
        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['id' => $cleanUserId]);

        // 5. Delete Account: akun dengan riwayat transaksi -> PII SCRUBBING (anonimisasi) + order utuh
        $eo = User::factory()->eo()->create();
        [$event, $ticketType] = $this->makeEventWithTicket($eo, 150000);

        $buyerWithHistory = User::factory()->create([
            'name' => 'Pembeli Histori',
            'email' => 'histori@example.com',
            'phone' => '081200009999',
        ]);

        $paidOrder = Order::create([
            'user_id' => $buyerWithHistory->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-DEL-0001',
            'status' => 'PAID',
            'total_amount' => 150000,
            'attendee_name' => 'Pembeli Histori',
            'attendee_email' => 'histori@example.com',
            'attendee_phone' => '081200009999',
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);

        $deleteBuyer = $this->actingAs($buyerWithHistory)->delete('/profile', [
            'email' => 'histori@example.com',
            'confirmation' => 'HAPUS AKUN',
        ]);

        $deleteBuyer->assertRedirect(route('home'));
        $this->assertGuest();

        $buyerWithHistory->refresh();
        $this->assertSame('Pengguna Terhapus', $buyerWithHistory->name);
        $this->assertStringEndsWith('@deleted.hajirin.local', $buyerWithHistory->email);
        $this->assertNull($buyerWithHistory->phone);
        $this->assertSame('SUSPENDED', $buyerWithHistory->status);
        $this->assertDatabaseHas('orders', [
            'id' => $paidOrder->id,
            'total_amount' => 150000,
            'attendee_name' => 'Pengguna Terhapus',
        ]);

        // 6. Delete Account ditolak untuk ADMIN dan EO dengan event PUBLISHED aktif
        $admin = User::factory()->admin()->create(['email' => 'admin-del@example.com']);
        $this->actingAs($admin)
            ->delete('/profile', [
                'email' => 'admin-del@example.com',
                'confirmation' => 'HAPUS AKUN',
            ])
            ->assertSessionHasErrors('account');

        $this->actingAs($eo)
            ->delete('/profile', [
                'email' => $eo->email,
                'confirmation' => 'HAPUS AKUN',
            ])
            ->assertSessionHasErrors('account');

        // 7. Delete Account ditolak bila masih memiliki Refund PENDING
        $refundUser = User::factory()->create(['email' => 'refund-pending@example.com']);
        $refundOrder = Order::create([
            'user_id' => $refundUser->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-DEL-REF1',
            'status' => 'PAID',
            'total_amount' => 150000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        Refund::create([
            'order_id' => $refundOrder->id,
            'requested_by' => $refundUser->id,
            'amount' => 150000,
            'reason' => 'Sedang menunggu proses refund dari admin.',
            'status' => 'PENDING',
            'requested_at' => now(),
        ]);

        $this->actingAs($refundUser)
            ->delete('/profile', [
                'email' => 'refund-pending@example.com',
                'confirmation' => 'HAPUS AKUN',
            ])
            ->assertSessionHasErrors('account');
    }

    public function test_staff_who_checked_in_tickets_and_transfer_recipient_can_delete_account_without_db_violation(): void
    {
        $eo = User::factory()->eo()->create();
        $buyer = User::factory()->create(['email' => 'buyer-audit@example.com']);
        $staff = User::factory()->create([
            'name' => 'Staff Gerbang',
            'email' => 'staff-audit@example.com',
            'phone' => '081211112222',
        ]);
        $recipient = User::factory()->create([
            'name' => 'Penerima Transfer',
            'email' => 'recipient-del@example.com',
            'phone' => '081233334444',
        ]);

        [$event, $ticketType] = $this->makeEventWithTicket($eo, 100000, now()->addHour(), now()->addHours(4));

        EventStaff::create([
            'event_id' => $event->id,
            'user_id' => $staff->id,
            'role' => 'CHECKIN',
        ]);

        $order = Order::create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-AUDIT-001',
            'status' => 'PAID',
            'total_amount' => 200000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $item = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 2,
            'unit_price' => 100000,
        ]);

        $usedTicket = Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'holder_user_id' => $buyer->id,
            'ticket_code' => 'HJR-TKT-2026-STAFFCK1',
            'attendee_name' => $buyer->name,
            'attendee_email' => $buyer->email,
            'status' => 'USED',
            'checked_in_at' => now(),
            'checked_in_by' => $staff->id,
        ]);

        $transferredTicket = Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'holder_user_id' => $recipient->id,
            'ticket_code' => 'HJR-TKT-2026-RECPDEL1',
            'attendee_name' => $recipient->name,
            'attendee_email' => $recipient->email,
            'attendee_phone' => $recipient->phone,
            'status' => 'ACTIVE',
        ]);

        // 1. Staff yang pernah melakukan check-in tidak boleh crash (chk_ticket_checkin_data) saat hapus akun
        $this->actingAs($staff)
            ->delete('/profile', [
                'email' => 'staff-audit@example.com',
                'confirmation' => 'HAPUS AKUN',
            ])
            ->assertRedirect(route('home'));

        $staff->refresh();
        $this->assertSame('Pengguna Terhapus', $staff->name);
        $this->assertSame('SUSPENDED', $staff->status);
        $this->assertSame($staff->id, $usedTicket->fresh()->checked_in_by);

        // 2. Penerima transfer yang menghapus akun tidak boleh mengembalikan tiket ke pembeli asli dan PII tiketnya harus dibersihkan
        $this->actingAs($recipient)
            ->delete('/profile', [
                'email' => 'recipient-del@example.com',
                'confirmation' => 'HAPUS AKUN',
            ])
            ->assertRedirect(route('home'));

        $recipient->refresh();
        $transferredTicket->refresh();
        $this->assertSame('Pengguna Terhapus', $recipient->name);
        $this->assertSame($recipient->id, $transferredTicket->holder_user_id);
        $this->assertSame('Pengguna Terhapus', $transferredTicket->attendee_name);
        $this->assertNull($transferredTicket->attendee_phone);
    }

    public function test_transfer_privacy_hides_rotated_qr_and_recipient_phone_from_sender_and_hides_invoice_total_from_recipient(): void
    {
        Mail::fake();
        $eo = User::factory()->eo()->create();
        $sender = User::factory()->create(['name' => 'Pengirim Dua', 'email' => 'sender2@example.com', 'phone' => '081111111111']);
        $recipient = User::factory()->create(['name' => 'Penerima Dua', 'email' => 'recipient2@example.com', 'phone' => '089988776655']);

        [$event, $ticketType] = $this->makeEventWithTicket($eo, 150000);

        $order = Order::create([
            'user_id' => $sender->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-PRIV-002',
            'status' => 'PAID',
            'total_amount' => 300000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $item = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 2,
            'unit_price' => 150000,
        ]);
        $keptTicket = Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'holder_user_id' => $sender->id,
            'ticket_code' => 'HJR-TKT-2026-KEPT0001',
            'attendee_name' => $sender->name,
            'attendee_email' => $sender->email,
            'attendee_phone' => $sender->phone,
            'status' => 'ACTIVE',
        ]);
        $transferredTicket = Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'holder_user_id' => $sender->id,
            'ticket_code' => 'HJR-TKT-2026-SEND0002',
            'attendee_name' => $sender->name,
            'attendee_email' => $sender->email,
            'attendee_phone' => $sender->phone,
            'status' => 'ACTIVE',
        ]);

        // Transfer hanya 1 dari 2 tiket
        $this->actingAs($sender)
            ->post("/tickets/{$transferredTicket->id}/transfer", [
                'recipient_name' => $recipient->name,
                'recipient_email' => $recipient->email,
            ])
            ->assertSessionHas('success');

        $plainCode = null;
        Mail::assertQueued(TicketTransferInviteMail::class, function (TicketTransferInviteMail $mail) use (&$plainCode): bool {
            $plainCode = $mail->payload['transferCode'] ?? null;

            return true;
        });

        $transfer = TicketTransfer::where('ticket_id', $transferredTicket->id)->firstOrFail();

        $this->actingAs($recipient)
            ->post("/ticket-transfers/{$transfer->token}/accept", ['code' => $plainCode])
            ->assertRedirect(route('my-tickets.show', $order->order_reference));

        $transferredTicket->refresh();

        // 1. Export data pengirim TIDAK boleh membocorkan QR baru milik penerima maupun nomor HP penerima
        $senderExport = json_decode(
            $this->actingAs($sender)->get('/profile/export-data')->streamedContent(),
            true
        );
        $exportedCodes = collect($senderExport['tickets'])->pluck('ticket_code')->all();
        $this->assertSame([$keptTicket->ticket_code], $exportedCodes);
        $this->assertNotContains($transferredTicket->ticket_code, $exportedCodes);

        // 2. Halaman e-tiket pengirim menyamarkan QR dan nomor HP penerima
        $this->actingAs($sender)
            ->get("/my-tickets/{$order->order_reference}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('tickets', 2)
                ->where('tickets.1.isTransferredOut', true)
                ->where('tickets.1.ticketCode', 'DITRANSFER')
                ->where('tickets.1.attendeePhone', '-')
            );

        // 3. Halaman e-tiket penerima hanya melihat 1 tiket miliknya dan tidak melihat total tagihan/referensi bayar pembeli asli
        $this->actingAs($recipient)
            ->get("/my-tickets/{$order->order_reference}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('tickets', 1)
                ->where('tickets.0.ticketCode', $transferredTicket->ticket_code)
                ->where('order.isOrderBuyer', false)
                ->where('order.totalAmount', null)
                ->where('order.formattedTotalAmount', null)
                ->where('order.paymentReference', null)
            );
    }

    public function test_pending_transfer_blocks_refund_and_is_cancelled_when_ticket_is_checked_in(): void
    {
        Mail::fake();
        $eo = User::factory()->eo()->create();
        $sender = User::factory()->create(['email' => 'pending-trf-sender@example.com']);
        [$event, $ticketType] = $this->makeEventWithTicket($eo, 120000, now()->addHour(), now()->addHours(4));

        $order = Order::create([
            'user_id' => $sender->id,
            'event_id' => $event->id,
            'order_reference' => 'HJR-TRF-PEND1',
            'status' => 'PAID',
            'total_amount' => 120000,
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);
        $item = OrderItem::create([
            'order_id' => $order->id,
            'ticket_type_id' => $ticketType->id,
            'quantity' => 1,
            'unit_price' => 120000,
        ]);
        $ticket = Ticket::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'holder_user_id' => $sender->id,
            'ticket_code' => 'HJR-TKT-2026-PENDCK01',
            'attendee_name' => $sender->name,
            'attendee_email' => $sender->email,
            'status' => 'ACTIVE',
        ]);

        $this->actingAs($sender)
            ->post("/tickets/{$ticket->id}/transfer", [
                'recipient_name' => 'Calon Rekan',
                'recipient_email' => 'calon-rekan@example.com',
            ])
            ->assertSessionHas('success');

        $transfer = TicketTransfer::where('ticket_id', $ticket->id)->firstOrFail();

        // Refund ditolak selama transfer PENDING masih aktif
        $this->actingAs($sender)
            ->post("/orders/{$order->order_reference}/refund", [
                'reason' => 'Ingin refund saat transfer masih pending.',
            ])
            ->assertSessionHasErrors('refund');

        // Ketika tiket di-check-in oleh EO, transfer PENDING otomatis dibatalkan
        $this->actingAs($eo)
            ->post('/eo/check-in', ['ticket_code' => $ticket->ticket_code])
            ->assertRedirect();

        $this->assertSame('USED', $ticket->fresh()->status);
        $this->assertSame('CANCELLED', $transfer->fresh()->status);
    }

    public function test_authenticated_user_cannot_reset_different_accounts_password_and_remember_token_rotates(): void
    {
        Mail::fake();
        $userA = User::factory()->create([
            'email' => 'user-a@example.com',
            'remember_token' => 'old-remember-token-aaa',
        ]);
        $userB = User::factory()->create([
            'email' => 'user-b@example.com',
            'password' => Hash::make('OriginalPassB123!'),
        ]);

        $tokenForB = Password::broker()->createToken($userB);

        // User A yang sedang login ditolak jika mencoba mereset password milik User B
        $this->actingAs($userA)
            ->post('/reset-password', [
                'token' => $tokenForB,
                'email' => 'user-b@example.com',
                'password' => 'HijackedPass123!',
                'password_confirmation' => 'HijackedPass123!',
            ])
            ->assertSessionHasErrors('email')
            ->assertSessionMissing('password_reset_completed');

        $this->assertTrue(Hash::check('OriginalPassB123!', $userB->fresh()->password));

        // User A mereset password sendiri -> sukses & remember_token berotasi
        $tokenForA = Password::broker()->createToken($userA);
        $this->actingAs($userA)
            ->post('/reset-password', [
                'token' => $tokenForA,
                'email' => 'user-a@example.com',
                'password' => 'FreshPassA123!',
                'password_confirmation' => 'FreshPassA123!',
            ])
            ->assertRedirect(route('dashboard').'#profil')
            ->assertSessionHas('password_reset_completed', true);

        $userA->refresh();
        $this->assertTrue(Hash::check('FreshPassA123!', $userA->password));
        $this->assertNotSame('old-remember-token-aaa', $userA->remember_token);
        $this->assertNotNull($userA->password_changed_at);
    }
}
