<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_types', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('uuidv7()'));
            $table->uuid('event_id');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->integer('quota');
            $table->timestampTz('sale_start')->nullable();
            $table->timestampTz('sale_end')->nullable();
            $table->enum('status', ['ACTIVE', 'INACTIVE'])->default('ACTIVE');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('event_id', 'fk_ticket_type_event')
                ->references('id')->on('events')
                ->cascadeOnDelete();

            $table->unique(['event_id', 'name'], 'uq_ticket_type_event_name');

            $table->index('event_id', 'idx_ticket_types_event');
            $table->index('status', 'idx_ticket_types_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_types');
    }
};
