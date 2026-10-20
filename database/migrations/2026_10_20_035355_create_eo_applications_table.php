<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eo_applications', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('uuidv7()'));
            $table->uuid('user_id');
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->text('reason')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestampTz('reviewed_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('user_id', 'fk_eo_application_user')
                ->references('id')->on('users')
                ->cascadeOnDelete();

            $table->foreign('reviewed_by', 'fk_eo_application_reviewer')
                ->references('id')->on('users')
                ->nullOnDelete();

            $table->index('user_id', 'idx_eo_applications_user');
            $table->index('status', 'idx_eo_applications_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eo_applications');
    }
};
