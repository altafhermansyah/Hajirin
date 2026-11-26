<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable()->after('email');
            }

            if (! Schema::hasColumn('users', 'remember_token')) {
                $table->string('remember_token', 100)->nullable()->after('password');
            }
        });

        // Tandai akun lama (hasil seeder/demo) sebagai terverifikasi agar tidak terkunci saat migrasi
        DB::table('users')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);

        if (! Schema::hasTable('email_verification_codes')) {
            Schema::create('email_verification_codes', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->uuid('user_id');
                $table->string('email', 255);
                $table->string('purpose', 40)->default('VERIFY_EMAIL');
                $table->string('code_hash', 255);
                $table->unsignedSmallInteger('attempts')->default(0);
                $table->timestamp('expires_at');
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('user_id')
                    ->references('id')
                    ->on('users')
                    ->cascadeOnDelete();

                $table->index(['user_id', 'purpose'], 'idx_email_otp_user_purpose');
                $table->index('expires_at', 'idx_email_otp_expires_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('email_verification_codes');

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'email_verified_at')) {
                $table->dropColumn('email_verified_at');
            }

            if (Schema::hasColumn('users', 'remember_token')) {
                $table->dropColumn('remember_token');
            }
        });
    }
};
