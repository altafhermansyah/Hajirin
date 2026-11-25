<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\EoApplication;
use App\Models\Event;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Database\Seeders\EventSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PerformanceAndOptimizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_renders_dynamic_database_sections_and_handles_empty_catalog(): void
    {
        // 1. Katalog kosong tetap merender Home dengan array kosong tanpa crash
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Home')
                ->where('events', [])
                ->where('heroEvents', [])
                ->where('featuredEvents', [])
                ->where('popularEvents', [])
                ->where('availableCities', [])
            );

        // 2. Setelah seeding, seluruh section Home terisi dari database
        $this->seed(CategorySeeder::class);
        $this->seed(EventSeeder::class);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Home')
                ->has('events')
                ->has('heroEvents', 4)
                ->has('featuredEvents', 4)
                ->has('popularEvents', 4)
                ->has('availableCities')
                ->has('categories.0.events_count')
                ->has('heroEvents.0.description')
                ->has('popularEvents.0.remainingQuota')
            );
    }

    public function test_avatar_and_event_banner_uploads_are_converted_to_webp_and_resized(): void
    {
        Storage::fake('public');
        $this->seed(CategorySeeder::class);

        $user = User::factory()->create();
        $avatar = UploadedFile::fake()->image('avatar-besar.png', 1200, 1200);

        $this->actingAs($user)
            ->post('/profile', [
                'name' => $user->name,
                'avatar' => $avatar,
            ])
            ->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertNotNull($user->avatar_path);
        $this->assertStringEndsWith('.webp', $user->avatar_path);

        $relativeAvatarPath = str_replace('/storage/', '', $user->avatar_path);
        Storage::disk('public')->assertExists($relativeAvatarPath);

        $avatarMeta = getimagesizefromstring((string) Storage::disk('public')->get($relativeAvatarPath));
        $this->assertNotFalse($avatarMeta);
        $this->assertSame(IMAGETYPE_WEBP, $avatarMeta[2]);
        $this->assertLessThanOrEqual(512, $avatarMeta[0]);

        // Banner event EO ukuran besar di-resize ke max lebar 1600px dan dikonversi ke WebP
        $eo = User::factory()->eo()->create();
        $category = Category::firstOrFail();
        $banner = UploadedFile::fake()->image('poster-konser.jpg', 2400, 1200);

        $this->actingAs($eo)
            ->post('/eo/events', [
                'title' => 'Konser WebP Otomatis 2026',
                'category_id' => $category->id,
                'description' => 'Deskripsi konser musik untuk menguji konversi poster menjadi format WebP.',
                'event_type' => 'OFFLINE',
                'city' => 'Bandung',
                'venue_name' => 'Sabuga ITB',
                'address' => 'Jl. Tamansari No. 73, Bandung',
                'starts_at' => now()->addDays(15)->format('Y-m-d H:i:s'),
                'ends_at' => now()->addDays(15)->addHours(4)->format('Y-m-d H:i:s'),
                'banner' => $banner,
                'submit_action' => 'DRAFT',
                'tickets' => [
                    [
                        'name' => 'Reguler',
                        'quota' => 100,
                        'max_per_order' => 4,
                        'price' => 75000,
                    ],
                ],
            ])
            ->assertSessionHasNoErrors();

        $event = Event::where('eo_id', $eo->id)->firstOrFail();
        $this->assertStringEndsWith('.webp', (string) $event->banner_path);

        $relativeBannerPath = str_replace('/storage/', '', (string) $event->banner_path);
        Storage::disk('public')->assertExists($relativeBannerPath);

        $bannerMeta = getimagesizefromstring((string) Storage::disk('public')->get($relativeBannerPath));
        $this->assertNotFalse($bannerMeta);
        $this->assertSame(IMAGETYPE_WEBP, $bannerMeta[2]);
        $this->assertLessThanOrEqual(1600, $bannerMeta[0]);
    }

    public function test_eo_application_converts_image_document_to_webp_and_keeps_pdf_unchanged(): void
    {
        Storage::fake('local');

        $imageApplicant = User::factory()->create(['role' => 'USER']);
        $imageDoc = UploadedFile::fake()->image('ktp-organisasi.png', 1800, 1200);

        $this->actingAs($imageApplicant)
            ->post('/eo-applications', [
                'organization_name' => 'Komunitas Gambar EO',
                'contact_phone' => '081234567890',
                'document' => $imageDoc,
                'reason' => 'Kami menyelenggarakan event komunitas rutin setiap bulan di Jakarta.',
            ])
            ->assertSessionHasNoErrors();

        $imgApp = EoApplication::where('user_id', $imageApplicant->id)->firstOrFail();
        $this->assertStringEndsWith('.webp', $imgApp->document_path);
        Storage::disk('local')->assertExists($imgApp->document_path);

        $pdfApplicant = User::factory()->create(['role' => 'USER']);
        $pdfDoc = UploadedFile::fake()->create('legalitas.pdf', 300, 'application/pdf');

        $this->actingAs($pdfApplicant)
            ->post('/eo-applications', [
                'organization_name' => 'Komunitas PDF EO',
                'contact_phone' => '081298765432',
                'document' => $pdfDoc,
                'reason' => 'Kami menyelenggarakan seminar teknologi dan workshop pengembangan web.',
            ])
            ->assertSessionHasNoErrors();

        $pdfApp = EoApplication::where('user_id', $pdfApplicant->id)->firstOrFail();
        $this->assertStringEndsWith('.pdf', $pdfApp->document_path);
        Storage::disk('local')->assertExists($pdfApp->document_path);
    }

    public function test_named_rate_limiters_throttle_login_per_email_and_protect_profile_uploads(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'email' => 'target@example.com',
                'password' => 'salah-terus',
            ])->assertStatus(302);
        }

        // Percobaan ke-6 untuk email+IP yang sama harus ditolak 429
        $this->post('/login', [
            'email' => 'target@example.com',
            'password' => 'salah-terus',
        ])->assertStatus(429);

        // Email lain di IP yang sama tetap diizinkan (tidak ikut terblokir jaringan Wi-Fi bersama)
        $this->post('/login', [
            'email' => 'pengguna-lain@example.com',
            'password' => 'salah-terus',
        ])->assertStatus(302);

        // Upload / update profil dibatasi 10/menit per user
        $user = User::factory()->create();
        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($user)
                ->put('/profile', ['name' => "Nama {$i}"])
                ->assertStatus(302);
        }

        $this->actingAs($user)
            ->put('/profile', ['name' => 'Nama Ke Sebelas'])
            ->assertStatus(429);
    }
}
