<?php

namespace Tests\Feature;

use App\Models\EoApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminOrganizerManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $eo;

    private User $user;

    private function createEoApplication(array $attributes = []): EoApplication
    {
        return EoApplication::create(array_merge([
            'user_id' => $this->user->id,
            'organization_name' => 'Komunitas Kreatif Pemuda',
            'contact_phone' => '08987654321',
            'portfolio_url' => 'https://kreatifpemuda.org',
            'document_path' => 'eo-documents/sample_legalitas.pdf',
            'reason' => 'Kami ingin mengadakan seminar edukasi dan workshop keahlian digital.',
            'status' => 'PENDING',
        ], $attributes));
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@hajirin.com',
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
        ]);

        $this->eo = User::factory()->create([
            'name' => 'Event Master EO',
            'email' => 'eo@hajirin.com',
            'role' => 'EO',
            'status' => 'ACTIVE',
        ]);

        $this->user = User::factory()->create([
            'name' => 'Peserta Biasa',
            'email' => 'user@hajirin.com',
            'role' => 'USER',
            'status' => 'ACTIVE',
        ]);
    }

    public function test_guests_cannot_access_organizers_or_applications(): void
    {
        $response1 = $this->get('/admin/organizers');
        $response1->assertRedirect('/');

        $response2 = $this->get('/admin/organizers/applications');
        $response2->assertRedirect('/');
    }

    public function test_regular_users_and_eos_cannot_access_admin_organizers(): void
    {
        $responseUser = $this->actingAs($this->user)->get('/admin/organizers');
        $responseUser->assertForbidden();

        $responseEo = $this->actingAs($this->eo)->get('/admin/organizers');
        $responseEo->assertForbidden();
    }

    public function test_admin_can_view_organizers_directory(): void
    {
        // Hubungkan EO dengan aplikasi yang disetujui
        $this->createEoApplication([
            'user_id' => $this->eo->id,
            'organization_name' => 'PT Kreasi Festival Nusantara',
            'contact_phone' => '081234567890',
            'portfolio_url' => 'https://kreasifest.id',
            'reason' => 'Ingin menyelenggarakan festival musik tahunan',
            'status' => 'APPROVED',
            'reviewed_by' => $this->admin->id,
            'reviewed_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/organizers');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Organizers/Index')
            ->has('organizers.data', 1)
            ->where('organizers.data.0.name', 'Event Master EO')
            ->where('organizers.data.0.organizationName', 'PT Kreasi Festival Nusantara')
            ->where('organizers.data.0.isVerified', true)
            ->has('stats')
            ->where('stats.totalEo', 1)
            ->has('filters')
        );
    }

    public function test_admin_can_filter_organizers_by_status_and_verification(): void
    {
        // Create suspended EO
        $suspendedEo = User::factory()->create([
            'name' => 'Suspended Organizer',
            'role' => 'EO',
            'status' => 'SUSPENDED',
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/organizers?status=SUSPENDED');
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('organizers.data', 1)
            ->where('organizers.data.0.name', 'Suspended Organizer')
        );
    }

    public function test_admin_can_view_applications_queue(): void
    {
        $this->createEoApplication([
            'user_id' => $this->user->id,
            'organization_name' => 'Komunitas Kreatif Pemuda',
            'contact_phone' => '08987654321',
            'portfolio_url' => 'https://kreatifpemuda.org',
            'reason' => 'Kami ingin mengadakan seminar edukasi dan workshop keahlian digital.',
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/organizers/applications');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Organizers/Applications')
            ->has('applications.data', 1)
            ->where('applications.data.0.organizationName', 'Komunitas Kreatif Pemuda')
            ->where('applications.data.0.applicantName', 'Peserta Biasa')
            ->where('applications.data.0.status', 'PENDING')
            ->where('stats.pending', 1)
        );
    }

    public function test_admin_can_approve_pending_application(): void
    {
        $application = $this->createEoApplication([
            'user_id' => $this->user->id,
            'organization_name' => 'Komunitas Kreatif Pemuda',
            'contact_phone' => '08987654321',
            'portfolio_url' => 'https://kreatifpemuda.org',
            'reason' => 'Mengadakan pameran karya tahunan mahasiswa.',
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($this->admin)
            ->post("/admin/organizers/applications/{$application->id}/approve");

        $response->assertSessionHas('success');

        // Verifikasi aplikasi disetujui
        $this->assertDatabaseHas('eo_applications', [
            'id' => $application->id,
            'status' => 'APPROVED',
            'reviewed_by' => $this->admin->id,
        ]);

        // Verifikasi role user berubah menjadi EO
        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'role' => 'EO',
        ]);

        // Verifikasi notifikasi terkirim ke pemohon
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'type' => 'EO_APPLICATION_UPDATED',
        ]);
    }

    public function test_admin_cannot_approve_already_reviewed_application(): void
    {
        $application = $this->createEoApplication([
            'user_id' => $this->user->id,
            'organization_name' => 'Komunitas Kreatif Pemuda',
            'contact_phone' => '08987654321',
            'portfolio_url' => 'https://kreatifpemuda.org',
            'reason' => 'Mengadakan pameran karya tahunan.',
            'status' => 'APPROVED',
            'reviewed_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->post("/admin/organizers/applications/{$application->id}/approve");

        $response->assertSessionHasErrors('application');
    }

    public function test_admin_can_reject_pending_application_with_reason(): void
    {
        $application = $this->createEoApplication([
            'user_id' => $this->user->id,
            'organization_name' => 'Komunitas Belum Jelas',
            'contact_phone' => '08123444444',
            'reason' => 'Ingin coba-coba bikin event di website ini.',
            'status' => 'PENDING',
        ]);

        $rejectionReason = 'Dokumen legalitas tidak lengkap dan identitas organisasi belum memenuhi kriteria platform.';

        $response = $this->actingAs($this->admin)
            ->post("/admin/organizers/applications/{$application->id}/reject", [
                'rejection_reason' => $rejectionReason,
            ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('eo_applications', [
            'id' => $application->id,
            'status' => 'REJECTED',
            'rejection_reason' => $rejectionReason,
            'reviewed_by' => $this->admin->id,
        ]);

        // Role user tetap USER
        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'role' => 'USER',
        ]);

        // Notifikasi penolakan tercatat
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'type' => 'EO_APPLICATION_UPDATED',
        ]);
    }

    public function test_rejection_requires_valid_reason_with_min_10_characters(): void
    {
        $application = $this->createEoApplication([
            'user_id' => $this->user->id,
            'organization_name' => 'Komunitas Belum Jelas',
            'contact_phone' => '08123444444',
            'reason' => 'Ingin coba-coba bikin event.',
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($this->admin)
            ->post("/admin/organizers/applications/{$application->id}/reject", [
                'rejection_reason' => 'Kurang', // less than 10 chars
            ]);

        $response->assertSessionHasErrors('rejection_reason');
    }

    public function test_admin_can_toggle_organizer_active_and_suspended_status(): void
    {
        $this->assertEquals('ACTIVE', $this->eo->status);

        // Suspend EO
        $response1 = $this->actingAs($this->admin)
            ->patch("/admin/organizers/{$this->eo->id}/toggle-status");

        $response1->assertSessionHas('success');
        $this->assertDatabaseHas('users', [
            'id' => $this->eo->id,
            'status' => 'SUSPENDED',
        ]);

        // Reactivate EO
        $response2 = $this->actingAs($this->admin)
            ->patch("/admin/organizers/{$this->eo->id}/toggle-status");

        $response2->assertSessionHas('success');
        $this->assertDatabaseHas('users', [
            'id' => $this->eo->id,
            'status' => 'ACTIVE',
        ]);
    }

    public function test_admin_can_revoke_organizer_role(): void
    {
        $this->assertEquals('EO', $this->eo->role);

        $response = $this->actingAs($this->admin)
            ->post("/admin/organizers/{$this->eo->id}/revoke", [
                'reason' => 'Pelanggaran ketentuan operasional tiket event.',
            ]);

        $response->assertSessionHas('success');

        // Role berubah jadi USER
        $this->assertDatabaseHas('users', [
            'id' => $this->eo->id,
            'role' => 'USER',
        ]);

        // Notifikasi pencabutan hak akses tersimpan
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->eo->id,
            'type' => 'EO_APPLICATION_UPDATED',
        ]);
    }

    public function test_admin_can_view_application_document(): void
    {
        Storage::fake('local');
        $file = UploadedFile::fake()->create('ktp_legalitas.pdf', 500, 'application/pdf');
        $path = $file->store('eo-documents', 'local');

        $application = $this->createEoApplication([
            'user_id' => $this->user->id,
            'organization_name' => 'Komunitas Dokumen Valid',
            'contact_phone' => '08123456789',
            'document_path' => $path,
            'reason' => 'Verifikasi keaslian dokumen identitas dan organisasi.',
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($this->admin)
            ->get("/admin/organizers/applications/{$application->id}/document");

        $response->assertOk();
    }
}
