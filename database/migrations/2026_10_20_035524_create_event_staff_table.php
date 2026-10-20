<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_staff', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('uuidv7()'));
            $table->uuid('event_id');
            $table->uuid('user_id');
            $table->enum('role', ['CHECKIN'])->default('CHECKIN');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('event_id', 'fk_event_staff_event')
                ->references('id')->on('events')
                ->cascadeOnDelete();

            $table->foreign('user_id', 'fk_event_staff_user')
                ->references('id')->on('users')
                ->cascadeOnDelete();

            $table->unique(['event_id', 'user_id'], 'uq_event_staff_event_user');

            $table->index('event_id', 'idx_event_staff_event');
            $table->index('user_id', 'idx_event_staff_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_staff');
    }
};
