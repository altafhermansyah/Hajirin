<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refunds', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('uuidv7()'));
            $table->uuid('order_id');
            $table->uuid('requested_by');
            $table->uuid('processed_by')->nullable();
            $table->decimal('amount', 14, 2);
            $table->text('reason');
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'])->default('PENDING');
            $table->timestampTz('requested_at')->useCurrent();
            $table->timestampTz('processed_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('order_id', 'fk_refund_order')
                ->references('id')->on('orders')
                ->restrictOnDelete();

            $table->foreign('requested_by', 'fk_refund_requester')
                ->references('id')->on('users')
                ->restrictOnDelete();

            $table->foreign('processed_by', 'fk_refund_processor')
                ->references('id')->on('users')
                ->nullOnDelete();

            $table->index('order_id', 'idx_refunds_order');
            $table->index('status', 'idx_refunds_status');
            $table->index('requested_by', 'idx_refunds_requested_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};
