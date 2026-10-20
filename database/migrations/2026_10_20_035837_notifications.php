<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('uuidv7()'));
            $table->uuid('user_id');
            $table->enum('type', [
                'PAYMENT_SUCCESS',
                'PAYMENT_FAILED',
                'TICKET_AVAILABLE',
                'EVENT_UPDATED',
                'EVENT_CANCELLED',
                'REFUND_UPDATED',
                'EO_APPLICATION_UPDATED',
                'EVENT_APPROVED',
                'EVENT_REJECTED',
            ]);
            $table->string('title', 200);
            $table->text('message');
            $table->timestampTz('read_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('user_id', 'fk_notification_user')
                ->references('id')->on('users')
                ->cascadeOnDelete();

            $table->index('user_id', 'idx_notifications_user');
            $table->index(['user_id', 'read_at'], 'idx_notifications_unread');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
