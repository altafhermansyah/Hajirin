<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $schema = file_get_contents(database_path('schema/hajirin.sql'));

        if ($schema === false) {
            throw new RuntimeException('The Hajirin PostgreSQL schema file could not be read.');
        }

        DB::unprepared($schema);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP TABLE IF EXISTS notifications, refunds, payments, tickets, order_items, orders,
                ticket_prices, ticket_types, event_staff, events, categories, eo_applications, users CASCADE;

            DROP FUNCTION IF EXISTS set_updated_at();

            DROP TYPE IF EXISTS notification_type, refund_status, payment_status, payment_method,
                ticket_status, order_status, ticket_price_status, event_staff_role, event_status,
                event_type, eo_application_status, user_role CASCADE;
            SQL);
    }
};
