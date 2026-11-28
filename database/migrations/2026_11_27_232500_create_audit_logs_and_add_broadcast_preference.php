<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->foreignUuid('actor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('action', 80)->index();
                $table->string('subject_type', 60)->nullable();
                $table->string('subject_id', 64)->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->jsonb('metadata')->nullable();
                $table->timestampTz('created_at')->useCurrent()->index();

                $table->index(['subject_type', 'subject_id']);
                $table->index('actor_id');
            });
        }

        if (! Schema::hasColumn('users', 'broadcast_emails_enabled')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->boolean('broadcast_emails_enabled')->default(true);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');

        if (Schema::hasColumn('users', 'broadcast_emails_enabled')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropColumn('broadcast_emails_enabled');
            });
        }
    }
};
