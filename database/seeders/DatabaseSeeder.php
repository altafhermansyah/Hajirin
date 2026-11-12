<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::unguarded(function (): void {
            // Admin Account
            $admin = User::updateOrCreate(
                ['email' => 'admin@hajirin.com'],
                [
                    'name' => 'Altaf Muhammad Hermansyah',
                    'phone' => '081110001001',
                    'password' => 'password',
                    'role' => 'ADMIN',
                ]
            );

            // Event Organizer Account
            $eo = User::updateOrCreate(
                ['email' => 'eo@hajirin.com'],
                [
                    'name' => 'Shobiburrahmat Al Fahruz',
                    'phone' => '081110002002',
                    'password' => 'password',
                    'role' => 'EO',
                ]
            );

            $hasApprovedEoApp = DB::table('eo_applications')
                ->where('user_id', $eo->id)
                ->where('status', 'APPROVED')
                ->exists();

            if (! $hasApprovedEoApp) {
                DB::table('eo_applications')->insert([
                    'id' => Str::uuid()->toString(),
                    'user_id' => $eo->id,
                    'organization_name' => 'Hajirin Official Organizer',
                    'contact_phone' => '081110002002',
                    'portfolio_url' => 'https://instagram.com/hajirin.official',
                    'document_path' => 'eo-documents/verified-seed-eo.pdf',
                    'reason' => 'Akun resmi penyelenggara event utama platform Hajirin Indonesia.',
                    'status' => 'APPROVED',
                    'reviewed_by' => $admin->id,
                    'reviewed_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Peserta / User Account
            User::updateOrCreate(
                ['email' => 'peserta@hajirin.com'],
                [
                    'name' => 'Ahmad Maulana Nugroho',
                    'phone' => '081110003003',
                    'password' => 'password',
                    'role' => 'USER',
                ]
            );
        });

        $this->call([
            CategorySeeder::class,
            EventSeeder::class,
        ]);
    }
}
