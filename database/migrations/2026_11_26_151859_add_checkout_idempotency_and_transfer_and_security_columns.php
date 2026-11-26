<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('orders', 'idempotency_key')) {
                $table->string('idempotency_key', 64)->nullable()->after('order_reference');
            }

            if (! Schema::hasColumn('orders', 'attendee_name')) {
                $table->string('attendee_name', 100)->nullable()->after('total_amount');
            }

            if (! Schema::hasColumn('orders', 'attendee_email')) {
                $table->string('attendee_email', 255)->nullable()->after('attendee_name');
            }

            if (! Schema::hasColumn('orders', 'attendee_phone')) {
                $table->string('attendee_phone', 25)->nullable()->after('attendee_email');
            }

            $table->unique(['user_id', 'idempotency_key'], 'uq_orders_user_idempotency');
        });

        Schema::table('tickets', function (Blueprint $table): void {
            if (! Schema::hasColumn('tickets', 'holder_user_id')) {
                $table->uuid('holder_user_id')->nullable()->after('order_item_id');

                $table->foreign('holder_user_id', 'fk_tickets_holder_user')
                    ->references('id')
                    ->on('users')
                    ->nullOnDelete();

                $table->index('holder_user_id', 'idx_tickets_holder_user');
            }
        });

        // Backfill pemegang tiket eksisting dari orders.user_id
        DB::statement('
            UPDATE tickets
            SET holder_user_id = orders.user_id
            FROM orders
            WHERE tickets.order_id = orders.id
              AND tickets.holder_user_id IS NULL
        ');

        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'password_changed_at')) {
                $table->timestamp('password_changed_at')->nullable()->after('password');
            }
        });

        if (! Schema::hasTable('ticket_transfers')) {
            Schema::create('ticket_transfers', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->uuid('ticket_id');
                $table->uuid('from_user_id');
                $table->uuid('to_user_id')->nullable();
                $table->string('recipient_name', 100);
                $table->string('recipient_email', 255);
                $table->string('code_hash', 255);
                $table->string('token', 64)->unique();
                $table->string('status', 20)->default('PENDING');
                $table->unsignedSmallInteger('attempts')->default(0);
                $table->timestamp('expires_at');
                $table->timestamp('accepted_at')->nullable();
                $table->timestamps();

                $table->foreign('ticket_id', 'fk_ticket_transfers_ticket')
                    ->references('id')
                    ->on('tickets')
                    ->cascadeOnDelete();

                $table->foreign('from_user_id', 'fk_ticket_transfers_from_user')
                    ->references('id')
                    ->on('users')
                    ->cascadeOnDelete();

                $table->foreign('to_user_id', 'fk_ticket_transfers_to_user')
                    ->references('id')
                    ->on('users')
                    ->nullOnDelete();

                $table->index('ticket_id', 'idx_ticket_transfers_ticket');
                $table->index('from_user_id', 'idx_ticket_transfers_from_user');
                $table->index('recipient_email', 'idx_ticket_transfers_recipient_email');
                $table->index('status', 'idx_ticket_transfers_status');
                $table->index('expires_at', 'idx_ticket_transfers_expires_at');
            });

            DB::statement("
                CREATE UNIQUE INDEX uq_ticket_transfers_pending_ticket
                ON ticket_transfers (ticket_id)
                WHERE status = 'PENDING'
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_transfers');

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'password_changed_at')) {
                $table->dropColumn('password_changed_at');
            }
        });

        Schema::table('tickets', function (Blueprint $table): void {
            if (Schema::hasColumn('tickets', 'holder_user_id')) {
                $table->dropForeign('fk_tickets_holder_user');
                $table->dropIndex('idx_tickets_holder_user');
                $table->dropColumn('holder_user_id');
            }
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropUnique('uq_orders_user_idempotency');

            foreach (['idempotency_key', 'attendee_name', 'attendee_email', 'attendee_phone'] as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
