<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

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
            User::updateOrCreate(
                ['email' => 'admin@hajirin.com'],
                [
                    'name' => 'Altaf Muhammad Hermansyah',
                    'password' => 'password',
                    'role' => 'ADMIN',
                ]
            );

            // Event Organizer Account
            User::updateOrCreate(
                ['email' => 'eo@hajirin.com'],
                [
                    'name' => 'Shobiburrahmat Al Fahruz',
                    'password' => 'password',
                    'role' => 'EO',
                ]
            );

            // Peserta / User Account
            User::updateOrCreate(
                ['email' => 'peserta@hajirin.com'],
                [
                    'name' => 'Ahmad Maulana Nugroho',
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
