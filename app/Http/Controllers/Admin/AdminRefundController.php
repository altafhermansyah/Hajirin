<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProcessRefundRequest;
use App\Mail\RefundStatusMail;
use App\Models\Refund;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminRefundController extends Controller
{
    /**
     * Tampilkan antrean permohonan pengembalian dana (Refund Management).
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $statusFilter = strtoupper((string) $request->input('status', 'PENDING'));

        // Statistik
        $counts = DB::table('refunds')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending")
            ->selectRaw("COUNT(CASE WHEN status IN ('APPROVED', 'COMPLETED') THEN 1 END) as approved")
            ->selectRaw("COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected")
            ->selectRaw("COALESCE(SUM(CASE WHEN status IN ('APPROVED', 'COMPLETED') THEN amount ELSE 0 END), 0) as total_refunded")
            ->first();

        $query = Refund::query()
            ->with([
                'order:id,order_reference,total_amount,status,event_id,user_id,created_at',
                'order.event:id,title,venue_name,eo_id',
                'order.event.eo:id,name',
                'requestedByUser:id,name,email,phone',
                'processedByUser:id,name',
            ]);

        // Filter Pencarian
        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $lower = '%'.mb_strtolower($search).'%';
                $q->whereRaw('LOWER(reason) LIKE ?', [$lower])
                    ->orWhereHas('order', function ($oq) use ($lower): void {
                        $oq->whereRaw('LOWER(order_reference) LIKE ?', [$lower])
                            ->orWhereHas('event', function ($eq) use ($lower): void {
                                $eq->whereRaw('LOWER(title) LIKE ?', [$lower]);
                            });
                    })
                    ->orWhereHas('requestedByUser', function ($uq) use ($lower): void {
                        $uq->whereRaw('LOWER(name) LIKE ?', [$lower])
                            ->orWhereRaw('LOWER(email) LIKE ?', [$lower]);
                    });
            });
        }

        // Filter Status
        if (in_array($statusFilter, ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'], true)) {
            $query->where('status', $statusFilter);
        }

        $query->orderByRaw("CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END")
            ->orderByDesc('requested_at');

        $paginated = $query->paginate(10)->withQueryString();

        $eoIds = $paginated->getCollection()
            ->pluck('order.event.eo_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $eoOrgNames = $eoIds !== []
            ? DB::table('eo_applications')
                ->whereIn('user_id', $eoIds)
                ->where('status', 'APPROVED')
                ->pluck('organization_name', 'user_id')
            : collect();

        $refunds = $paginated->through(function (Refund $refund) use ($eoOrgNames) {
            $eoId = $refund->order?->event?->eo_id;
            $amount = (float) $refund->amount;

            return [
                'id' => $refund->id,
                'orderId' => $refund->order_id,
                'orderReference' => $refund->order?->order_reference ?? '-',
                'orderTotalAmount' => (float) ($refund->order?->total_amount ?? 0),
                'amount' => $amount,
                'amountFormatted' => 'Rp'.number_format($amount, 0, ',', '.'),
                'reason' => $refund->reason,
                'proofPath' => $refund->proof_path,
                'resolutionNote' => $refund->resolution_note,
                'status' => $refund->status,
                'requestedAtFormatted' => Carbon::parse($refund->requested_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB',
                'processedAtFormatted' => $refund->processed_at ? Carbon::parse($refund->processed_at)->locale('id')->translatedFormat('d M Y, H:i').' WIB' : null,
                'applicant' => [
                    'id' => $refund->requestedByUser?->id,
                    'name' => $refund->requestedByUser?->name ?? 'Pemohon',
                    'email' => $refund->requestedByUser?->email ?? '-',
                    'phone' => $refund->requestedByUser?->phone ?? '-',
                ],
                'reviewerName' => $refund->processedByUser?->name,
                'event' => [
                    'id' => $refund->order?->event?->id,
                    'title' => $refund->order?->event?->title ?? '-',
                    'organizerName' => ($eoId ? ($eoOrgNames[$eoId] ?? null) : null) ?? $refund->order?->event?->eo?->name ?? '-',
                ],
            ];
        });

        return Inertia::render('Admin/Refunds/Index', [
            'refunds' => $refunds,
            'stats' => [
                'total' => (int) ($counts->total ?? 0),
                'pending' => (int) ($counts->pending ?? 0),
                'approved' => (int) ($counts->approved ?? 0),
                'rejected' => (int) ($counts->rejected ?? 0),
                'totalRefundedFormatted' => 'Rp'.number_format((float) ($counts->total_refunded ?? 0), 0, ',', '.'),
            ],
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
            ],
        ]);
    }

    /**
     * Setujui permohonan pengembalian dana dan batalkan tiket terkait.
     */
    public function approve(ProcessRefundRequest $request, string $id): RedirectResponse
    {
        $admin = $request->user();
        $validated = $request->validated();
        $resolutionNote = $validated['resolution_note'] ?? 'Pengembalian dana telah diverifikasi dan disetujui oleh Administrator.';

        DB::transaction(function () use ($admin, $id, $resolutionNote): void {
            $refund = Refund::with(['order.items.ticketType', 'order.tickets', 'order.event', 'requestedByUser'])
                ->where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($refund->status !== 'PENDING') {
                throw ValidationException::withMessages([
                    'refund' => 'Permohonan pengembalian dana ini sudah pernah diproses sebelumnya.',
                ]);
            }

            $refund->forceFill([
                'status' => 'APPROVED',
                'resolution_note' => $resolutionNote,
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ])->save();

            // Batalkan tiket pada order
            if ($refund->order) {
                foreach ($refund->order->tickets as $ticket) {
                    $ticket->forceFill(['status' => 'CANCELLED'])->save();
                }

                // Kembalikan kuota tiket
                foreach ($refund->order->items as $item) {
                    if ($item->ticketType) {
                        $newQuota = min((int) $item->ticketType->initial_quota, (int) ($item->ticketType->quota + $item->quantity));
                        $item->ticketType->forceFill(['quota' => $newQuota])->save();
                    }
                }

                // Tandai order CANCELLED jika refund penuh
                if ((float) $refund->amount >= (float) $refund->order->total_amount) {
                    $refund->order->forceFill(['status' => 'CANCELLED'])->save();
                }
            }

            $amountFormatted = 'Rp'.number_format((float) $refund->amount, 0, ',', '.');

            // Kirim notifikasi ke pemohon
            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $refund->requested_by,
                'type' => 'REFUND_UPDATED',
                'title' => 'Pengembalian Dana Disetujui!',
                'message' => "Permohonan pengembalian dana sebesar {$amountFormatted} untuk pesanan #{$refund->order?->order_reference} telah disetujui. Catatan: {$resolutionNote}",
                'action_url' => '/dashboard',
                'created_at' => now(),
            ]);

            if ($refund->requestedByUser) {
                Mail::to($refund->requestedByUser->email)->send(
                    (new RefundStatusMail(
                        applicantName: $refund->requestedByUser->name,
                        orderReference: $refund->order?->order_reference ?? '-',
                        eventTitle: $refund->order?->event?->title ?? 'Event Hajirin',
                        amountFormatted: $amountFormatted,
                        approved: true,
                        resolutionNote: $resolutionNote,
                    ))->afterCommit()
                );
            }
        });

        return back()->with('success', 'Permohonan pengembalian dana berhasil disetujui dan tiket terkait telah dibatalkan.');
    }

    /**
     * Tolak permohonan pengembalian dana.
     */
    public function reject(ProcessRefundRequest $request, string $id): RedirectResponse
    {
        $admin = $request->user();
        $validated = $request->validated();

        if (empty($validated['resolution_note'])) {
            throw ValidationException::withMessages([
                'resolution_note' => 'Alasan penolakan pengembalian dana wajib diisi.',
            ]);
        }

        DB::transaction(function () use ($admin, $id, $validated): void {
            $refund = Refund::with(['order.event', 'requestedByUser'])
                ->where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($refund->status !== 'PENDING') {
                throw ValidationException::withMessages([
                    'refund' => 'Permohonan pengembalian dana ini sudah pernah diproses sebelumnya.',
                ]);
            }

            $refund->forceFill([
                'status' => 'REJECTED',
                'resolution_note' => $validated['resolution_note'],
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ])->save();

            // Kirim notifikasi
            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'user_id' => $refund->requested_by,
                'type' => 'REFUND_UPDATED',
                'title' => 'Permohonan Pengembalian Dana Belum Disetujui',
                'message' => "Permohonan refund untuk pesanan #{$refund->order?->order_reference} belum dapat disetujui. Catatan: {$validated['resolution_note']}",
                'action_url' => '/dashboard',
                'created_at' => now(),
            ]);

            if ($refund->requestedByUser) {
                Mail::to($refund->requestedByUser->email)->send(
                    (new RefundStatusMail(
                        applicantName: $refund->requestedByUser->name,
                        orderReference: $refund->order?->order_reference ?? '-',
                        eventTitle: $refund->order?->event?->title ?? 'Event Hajirin',
                        amountFormatted: 'Rp'.number_format((float) $refund->amount, 0, ',', '.'),
                        approved: false,
                        resolutionNote: $validated['resolution_note'],
                    ))->afterCommit()
                );
            }
        });

        return back()->with('success', 'Permohonan pengembalian dana telah ditolak dengan catatan evaluasi.');
    }
}
