<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('uuidv7()'));
            $table->uuid('user_id');
            $table->uuid('event_id');
            $table->string('order_reference', 30)->unique();
            $table->enum('status', ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED'])->default('PENDING');
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->timestampTz('expires_at')->default(DB::raw("(CURRENT_TIMESTAMP + INTERVAL '15 minutes')"));
            $table->timestampTz('paid_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('user_id', 'fk_order_user')
                ->references('id')->on('users')
                ->restrictOnDelete();

            $table->foreign('event_id', 'fk_order_event')
                ->references('id')->on('events')
                ->restrictOnDelete();

            $table->index('user_id', 'idx_orders_user');
            $table->index('event_id', 'idx_orders_event');
            $table->index('status', 'idx_orders_status');
            $table->index('expires_at', 'idx_orders_expires_at');
            $table->index(['user_id', 'status'], 'idx_orders_user_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
