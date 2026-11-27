<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Tambahkan index pada kolom foreign key yang sering di-join atau difilter.
     */
    public function up(): void
    {
        DB::statement('CREATE INDEX IF NOT EXISTS idx_bookmarks_event_id ON bookmarks (event_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_order_items_ticket_price_id ON order_items (ticket_price_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_ticket_transfers_to_user_id ON ticket_transfers (to_user_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_events_reviewed_by ON events (reviewed_by)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_eo_applications_reviewed_by ON eo_applications (reviewed_by)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_refunds_processed_by ON refunds (processed_by)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_bookmarks_event_id');
        DB::statement('DROP INDEX IF EXISTS idx_order_items_ticket_price_id');
        DB::statement('DROP INDEX IF EXISTS idx_ticket_transfers_to_user_id');
        DB::statement('DROP INDEX IF EXISTS idx_events_reviewed_by');
        DB::statement('DROP INDEX IF EXISTS idx_eo_applications_reviewed_by');
        DB::statement('DROP INDEX IF EXISTS idx_refunds_processed_by');
    }
};
