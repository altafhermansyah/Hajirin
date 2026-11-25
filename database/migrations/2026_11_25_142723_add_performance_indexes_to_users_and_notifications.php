<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at ON notifications (user_id, created_at DESC)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_users_lower_email ON users (LOWER(email))');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_notifications_user_created_at');
        DB::statement('DROP INDEX IF EXISTS idx_users_lower_email');
    }
};
