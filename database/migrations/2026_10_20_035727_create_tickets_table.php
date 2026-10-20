<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('uuidv7()'));
            $table->uuid('order_id');
            $table->uuid('order_item_id');
            $table->string('ticket_code', 40)->unique();
            $table->string('attendee_name', 100);
            $table->string('attendee_email', 255);
            $table->enum('status', ['ACTIVE', 'USED', 'CANCELLED'])->default('ACTIVE');
            $table->timestampTz('checked_in_at')->nullable();
            $table->uuid('checked_in_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('order_id', 'fk_ticket_order')
                ->references('id')->on('orders')
                ->restrictOnDelete();

            $table->foreign('order_item_id', 'fk_ticket_order_item')
                ->references('id')->on('order_items')
                ->restrictOnDelete();

            $table->foreign('checked_in_by', 'fk_ticket_checked_in_by')
                ->references('id')->on('users')
                ->nullOnDelete();

            $table->index('order_id', 'idx_tickets_order');
            $table->index('order_item_id', 'idx_tickets_order_item');
            $table->index('status', 'idx_tickets_status');
            $table->index('checked_in_by', 'idx_tickets_checked_in_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
