<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_prices', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('uuidv7()'));
            $table->uuid('ticket_type_id');
            $table->string('name', 100);
            $table->decimal('price', 14, 2);
            $table->timestampTz('starts_at')->nullable();
            $table->timestampTz('ends_at')->nullable();
            $table->enum('status', ['ACTIVE', 'INACTIVE'])->default('ACTIVE');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('ticket_type_id', 'fk_ticket_price_ticket_type')
                ->references('id')->on('ticket_types')
                ->cascadeOnDelete();

            $table->unique(['ticket_type_id', 'name'], 'uq_ticket_price_name');

            $table->index('ticket_type_id', 'idx_ticket_prices_ticket_type');
            $table->index(['starts_at', 'ends_at'], 'idx_ticket_prices_period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_prices');
    }
};
