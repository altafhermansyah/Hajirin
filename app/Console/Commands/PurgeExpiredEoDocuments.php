<?php

namespace App\Console\Commands;

use App\Support\AuditLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PurgeExpiredEoDocuments extends Command
{
    /**
     * @var string
     */
    protected $signature = 'hajirin:purge-eo-documents {--days=30 : Retensi berkas verifikasi EO setelah ditinjau (dalam hari)}';

    /**
     * @var string
     */
    protected $description = 'Hapus berkas dokumen KTP/legalitas EO yang sudah selesai ditinjau melewati masa retensi.';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days);

        $expiredApplications = DB::table('eo_applications')
            ->whereIn('status', ['APPROVED', 'REJECTED'])
            ->whereNotNull('reviewed_at')
            ->where('reviewed_at', '<', $cutoff)
            ->where('document_path', '!=', '')
            ->get(['id', 'document_path']);

        $purgedCount = 0;

        foreach ($expiredApplications as $application) {
            if (is_string($application->document_path) && $application->document_path !== '') {
                Storage::disk('local')->delete($application->document_path);
            }

            DB::table('eo_applications')
                ->where('id', $application->id)
                ->update([
                    'document_path' => '',
                    'updated_at' => now(),
                ]);

            $purgedCount++;
        }

        if ($purgedCount > 0) {
            AuditLog::record(
                action: 'eo_documents.purged',
                subjectType: 'eo_application',
                metadata: [
                    'purged_count' => $purgedCount,
                    'retention_days' => $days,
                ],
            );
        }

        $this->info("Berhasil membersihkan {$purgedCount} berkas dokumen EO melewati retensi {$days} hari.");

        return self::SUCCESS;
    }
}
