<?php

namespace Tests\Feature;

use App\Models\EoApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EoApplicationAndDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_user_can_submit_eo_application_with_verification_document(): void
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'role' => 'USER',
        ]);

        $file = UploadedFile::fake()->create('berkas-eo-lengkap.pdf', 512, 'application/pdf');

        $response = $this->actingAs($user)->post('/eo-applications', [
            'organization_name' => 'Nusantara Live Promotor',
            'contact_phone' => '081234567899',
            'portfolio_url' => 'https://instagram.com/nusantaralive',
            'document' => $file,
            'reason' => 'Kami ingin menyelenggarakan konser musik tahunan dan workshop kreatif untuk mahasiswa.',
        ]);

        $response->assertSessionHasNoErrors();

        $application = EoApplication::where('user_id', $user->id)->firstOrFail();
        $this->assertEquals('PENDING', $application->status);
        $this->assertEquals('Nusantara Live Promotor', $application->organization_name);
        $this->assertEquals('081234567899', $application->contact_phone);

        Storage::disk('local')->assertExists($application->document_path);

        // Pengajuan duplikat saat masih PENDING harus ditolak
        $duplicateResponse = $this->actingAs($user)->post('/eo-applications', [
            'organization_name' => 'Organisasi Kedua',
            'contact_phone' => '081234567899',
            'document' => UploadedFile::fake()->create('berkas-2.pdf', 200, 'application/pdf'),
            'reason' => 'Pengajuan ganda yang seharusnya ditolak oleh validasi sistem.',
        ]);

        $duplicateResponse->assertSessionHasErrors(['organization_name']);
    }

    public function test_admin_can_reject_and_approve_eo_application(): void
    {
        Storage::fake('local');

        $admin = User::factory()->create(['role' => 'ADMIN']);
        $applicant = User::factory()->create(['role' => 'USER']);

        $application = EoApplication::create([
            'user_id' => $applicant->id,
            'organization_name' => 'Komunitas Kreatif Kampus',
            'contact_phone' => '081399998888',
            'portfolio_url' => 'https://instagram.com/kreatifkampus',
            'document_path' => 'eo-documents/sample.pdf',
            'reason' => 'Menyelenggarakan festival seni dan seminar teknologi kampus setiap semester.',
        ]);

        // 1. Admin tolak pengajuan dengan alasan
        $rejectResponse = $this->actingAs($admin)->post("/admin/eo-applications/{$application->id}/reject", [
            'rejection_reason' => 'Foto KTP pada berkas PDF kurang jelas, mohon unggah ulang.',
        ]);

        $rejectResponse->assertSessionHasNoErrors();
        $application->refresh();
        $applicant->refresh();

        $this->assertEquals('REJECTED', $application->status);
        $this->assertEquals('USER', $applicant->role);

        // 2. Pemohon mengajukan ulang setelah ditolak
        $reapplyResponse = $this->actingAs($applicant)->post('/eo-applications', [
            'organization_name' => 'Komunitas Kreatif Kampus Official',
            'contact_phone' => '081399998888',
            'portfolio_url' => 'https://instagram.com/kreatifkampus',
            'document' => UploadedFile::fake()->create('berkas-revisi.pdf', 400, 'application/pdf'),
            'reason' => 'Menyelenggarakan festival seni dan seminar teknologi kampus dengan berkas yang sudah diperjelas.',
        ]);

        $reapplyResponse->assertSessionHasNoErrors();
        $newApplication = EoApplication::where('user_id', $applicant->id)
            ->where('status', 'PENDING')
            ->firstOrFail();

        // 3. Admin menyetujui pengajuan baru
        $approveResponse = $this->actingAs($admin)->post("/admin/eo-applications/{$newApplication->id}/approve");
        $approveResponse->assertSessionHasNoErrors();

        $newApplication->refresh();
        $applicant->refresh();

        $this->assertEquals('APPROVED', $newApplication->status);
        $this->assertEquals($admin->id, $newApplication->reviewed_by);
        $this->assertEquals('EO', $applicant->role);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $applicant->id,
            'type' => 'EO_APPLICATION_UPDATED',
        ]);
    }

    public function test_eo_role_access_and_redirects_work_properly(): void
    {
        $regularUser = User::factory()->create(['role' => 'USER']);
        $eoUser = User::factory()->create([
            'email' => 'organizer@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'EO',
        ]);

        EoApplication::forceCreate([
            'user_id' => $eoUser->id,
            'organization_name' => 'Harmoni Musik Indonesia',
            'contact_phone' => '081277776666',
            'document_path' => 'eo-documents/harmoni.pdf',
            'reason' => 'Promotor konser musik nusantara.',
            'status' => 'APPROVED',
            'reviewed_at' => now(),
        ]);

        // 1. User biasa ditolak mengakses /eo/dashboard
        $this->actingAs($regularUser)
            ->get('/eo/dashboard')
            ->assertStatus(403);

        // 2. EO yang membuka /dashboard diarahkan otomatis ke /eo/dashboard
        $this->actingAs($eoUser)
            ->get('/dashboard')
            ->assertRedirect('/eo/dashboard');

        // 3. EO dapat mengakses /eo/dashboard dan menerima prop lengkap
        $this->actingAs($eoUser)
            ->get('/eo/dashboard')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Eo/Dashboard')
                ->where('organizerProfile.organizationName', 'Harmoni Musik Indonesia')
                ->has('stats')
                ->has('myEvents')
                ->has('recentOrders')
            );
    }
}
