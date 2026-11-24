<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncEventStatuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hajirin:sync-event-statuses';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sinkronkan status event PUBLISHED -> ONGOING -> COMPLETED sesuai jadwal acara';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = now();

        $ongoingCount = DB::table('events')
            ->where('status', 'PUBLISHED')
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>', $now)
            ->update([
                'status' => 'ONGOING',
                'updated_at' => $now,
            ]);

        $completedCount = DB::table('events')
            ->whereIn('status', ['PUBLISHED', 'ONGOING'])
            ->where('ends_at', '<=', $now)
            ->update([
                'status' => 'COMPLETED',
                'updated_at' => $now,
            ]);

        $this->info("Status event disinkronkan: {$ongoingCount} ONGOING, {$completedCount} COMPLETED.");

        return self::SUCCESS;
    }
}
