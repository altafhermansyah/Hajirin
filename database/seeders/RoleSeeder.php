<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    /**
     * Seed default RBAC roles into the roles table.
     */
    public function run(): void
    {
        $now = now();

        DB::table('roles')->upsert([
            [
                'code' => 'USER',
                'name' => 'Peserta',
                'description' => 'Pengguna terdaftar yang dapat membeli tiket, melihat e-tiket, dan mengajukan akun EO.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => 'EO',
                'name' => 'Event Organizer',
                'description' => 'Penyelenggara event terverifikasi yang dapat mengelola event, tiket, peserta, dan check-in.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => 'ADMIN',
                'name' => 'Administrator',
                'description' => 'Pengelola platform dengan akses penuh ke moderasi, data master, transaksi, dan laporan.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['code'], ['name', 'description', 'updated_at']);
    }
}
