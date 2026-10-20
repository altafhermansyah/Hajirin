<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('uuidv7()'));
            $table->uuid('order_id');
            $table->uuid('ticket_type_id');
            $table->uuid('ticket_price_id')->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 14, 2);
            $table->decimal('subtotal', 14, 2)->storedAs('quantity * unit_price');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('order_id', 'fk_order_item_order')
                ->references('id')->on('orders')
                ->cascadeOnDelete();

            $table->foreign('ticket_type_id', 'fk_order_item_ticket_type')
                ->references('id')->on('ticket_types')
                ->restrictOnDelete();

            $table->foreign('ticket_price_id', 'fk_order_item_ticket_price')
                ->references('id')->on('ticket_prices')
                ->restrictOnDelete();

            $table->index('order_id', 'idx_order_items_order');
            $table->index('ticket_type_id', 'idx_order_items_ticket_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
