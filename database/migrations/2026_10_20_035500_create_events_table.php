<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('uuidv7()'));
            $table->uuid('eo_id');
            $table->foreignId('category_id');
            $table->string('title', 200);
            $table->string('slug', 220)->unique();
            $table->text('description');
            $table->enum('event_type', ['OFFLINE', 'ONLINE']);
            $table->string('venue_name', 200)->nullable();
            $table->text('address')->nullable();
            $table->text('online_url')->nullable();
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->text('banner_path')->nullable();
            $table->enum('status', [
                'DRAFT',
                'PENDING_REVIEW',
                'PUBLISHED',
                'ONGOING',
                'COMPLETED',
                'REJECTED',
                'CANCELLED',
            ])->default('DRAFT');
            $table->text('rejection_reason')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestampTz('reviewed_at')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('eo_id', 'fk_event_eo')
                ->references('id')->on('users')
                ->restrictOnDelete();

            $table->foreign('category_id', 'fk_event_category')
                ->references('id')->on('categories')
                ->restrictOnDelete();

            $table->foreign('reviewed_by', 'fk_event_reviewer')
                ->references('id')->on('users')
                ->nullOnDelete();

            $table->index('eo_id', 'idx_events_eo');
            $table->index('category_id', 'idx_events_category');
            $table->index('status', 'idx_events_status');
            $table->index('starts_at', 'idx_events_starts_at');
            $table->index(['status', 'starts_at'], 'idx_events_status_starts_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
