<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name', 50);
            $table->string('description', 255)->nullable();
            $table->timestamps();
        });

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

        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('role_id')
                ->nullable()
                ->after('role')
                ->constrained('roles')
                ->restrictOnDelete();
        });

        DB::statement('UPDATE users SET role_id = roles.id FROM roles WHERE roles.code = users.role::text');

        $defaultRoleId = (int) DB::table('roles')->where('code', 'USER')->value('id');

        DB::statement("ALTER TABLE users ALTER COLUMN role_id SET DEFAULT {$defaultRoleId}");
        DB::statement('ALTER TABLE users ALTER COLUMN role_id SET NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('role_id');
        });

        Schema::dropIfExists('roles');
    }
};
