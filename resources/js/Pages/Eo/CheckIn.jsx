import React, { useEffect, useRef, useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import EoLayout from '../../Layouts/EoLayout';
import {
    Card,
    CardHeader,
    EoButton,
    eoButtonClass,
    StatusBadge,
    StatCard,
} from '../../Components/eo/Primitives';
import {
    Camera,
    CheckCircle2,
    Keyboard,
    QrCode,
    Ticket,
    Users,
} from 'lucide-react';

const RESULT_TONES = {
    success: { dot: 'success', heading: 'Check-in berhasil' },
    already_used: { dot: 'warning', heading: 'Tiket sudah terpakai' },
    invalid: { dot: 'danger', heading: 'Tiket tidak valid' },
};

export default function EoCheckIn({
    organizerName,
    events = [],
    selectedEventId = '',
    stats = {},
    recentCheckIns = [],
    checkinResult = null,
}) {
    const [mode, setMode] = useState('manual');
    const [cameraStatus, setCameraStatus] = useState('idle');
    const [cameraError, setCameraError] = useState('');
    const [isScanningSubmitting, setIsScanningSubmitting] = useState(false);

    const inputRef = useRef(null);
    const videoRef = useRef(null);
    const lastScanRef = useRef({ code: '', at: 0 });
    const isScanningSubmittingRef = useRef(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        ticket_code: '',
        event_id: selectedEventId || '',
    });

    useEffect(() => {
        setData('event_id', selectedEventId || '');
    }, [selectedEventId]);

    useEffect(() => {
        if (mode === 'manual') {
            inputRef.current?.focus();
        }
    }, [mode]);

    useEffect(() => {
        if (mode !== 'camera') {
            setCameraStatus('idle');
            setCameraError('');
            return;
        }

        if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setCameraStatus('unsupported');
            setCameraError('Browser ini tidak mendukung akses kamera. Gunakan input manual atau scanner USB.');
            return;
        }

        if (!('BarcodeDetector' in window)) {
            setCameraStatus('unsupported');
            setCameraError(
                'Pemindaian QR kamera otomatis belum didukung di browser ini. Gunakan mode Input Kode / Scanner USB.'
            );
            return;
        }

        let cancelled = false;
        let stream = null;
        let timerId = null;

        const startScanner = async () => {
            setCameraStatus('starting');
            setCameraError('');

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
                setCameraStatus('active');

                const tick = async () => {
                    if (cancelled || !videoRef.current) return;

                    if (
                        videoRef.current.readyState >= 2 &&
                        !isScanningSubmittingRef.current
                    ) {
                        try {
                            const codes = await detector.detect(videoRef.current);
                            const rawValue = codes[0]?.rawValue?.trim();

                            if (rawValue) {
                                const now = Date.now();
                                const isDuplicate =
                                    lastScanRef.current.code === rawValue &&
                                    now - lastScanRef.current.at < 2500;

                                if (!isDuplicate) {
                                    lastScanRef.current = { code: rawValue, at: now };
                                    isScanningSubmittingRef.current = true;
                                    setIsScanningSubmitting(true);

                                    router.post(
                                        '/eo/check-in',
                                        {
                                            ticket_code: rawValue,
                                            event_id: selectedEventId || null,
                                        },
                                        {
                                            preserveScroll: true,
                                            onFinish: () => {
                                                isScanningSubmittingRef.current = false;
                                                setIsScanningSubmitting(false);
                                            },
                                        }
                                    );
                                }
                            }
                        } catch {
                            // Abaikan frame yang gagal didekode dan lanjutkan ke frame berikutnya
                        }
                    }

                    if (!cancelled) {
                        timerId = setTimeout(tick, 250);
                    }
                };

                timerId = setTimeout(tick, 250);
            } catch {
                if (!cancelled) {
                    setCameraStatus('error');
                    setCameraError(
                        'Izin kamera ditolak atau kamera tidak tersedia. Gunakan mode Input Kode / Scanner USB.'
                    );
                }
            }
        };

        startScanner();

        return () => {
            cancelled = true;
            isScanningSubmittingRef.current = false;
            setIsScanningSubmitting(false);
            if (timerId) clearTimeout(timerId);
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [mode, selectedEventId]);

    const handleEventChange = (nextEventId) => {
        const query = nextEventId ? { event_id: nextEventId } : {};
        router.get('/eo/check-in', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        clearErrors();

        post('/eo/check-in', {
            preserveScroll: true,
            onSuccess: () => {
                reset('ticket_code');
                inputRef.current?.focus();
            },
            onFinish: () => {
                inputRef.current?.focus();
            },
        });
    };

    const attendanceRate = stats.attendanceRate ?? 0;
    const resultTone = checkinResult
        ? RESULT_TONES[checkinResult.outcome] || RESULT_TONES.invalid
        : null;

    return (
        <EoLayout title="Check-in E-Tiket" organizerName={organizerName}>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Check-in E-Tiket Hari-H
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Pindai QR code atau masukkan kode e-tiket untuk memverifikasi kehadiran peserta.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label htmlFor="checkin-event-filter" className="sr-only">
                        Pilih event untuk check-in
                    </label>
                    <select
                        id="checkin-event-filter"
                        value={selectedEventId || ''}
                        onChange={(e) => handleEventChange(e.target.value)}
                        className="h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                    >
                        <option value="">Semua event aktif</option>
                        {events.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                                {ev.title}
                            </option>
                        ))}
                    </select>

                    <Link
                        href={
                            selectedEventId
                                ? `/eo/attendees?event_id=${selectedEventId}`
                                : '/eo/attendees'
                        }
                        className={eoButtonClass('outline', 'md')}
                    >
                        <Users className="size-4" strokeWidth={1.75} aria-hidden="true" />
                        Daftar Peserta
                    </Link>
                </div>
            </div>

            {/* 3 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Total tiket valid"
                    icon={Ticket}
                    value={stats.totalValidTickets ?? 0}
                    valueSuffix="tiket"
                    subtext="Pesanan lunas siap check-in"
                />

                <StatCard
                    label="Sudah check-in"
                    icon={CheckCircle2}
                    value={stats.checkedInCount ?? 0}
                    valueSuffix={`(${attendanceRate}%)`}
                    progress={attendanceRate}
                />

                <StatCard
                    label="Belum hadir"
                    icon={QrCode}
                    value={stats.remainingCount ?? 0}
                    valueSuffix="tiket"
                    subtext="Menunggu verifikasi di pintu masuk"
                />
            </div>

            {/* Main Grid: Scanner Panel + Recent Check-ins */}
            <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
                {/* Scanner & Verification Panel */}
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                        <div className="flex items-center gap-6 border-b border-gray-200 px-5">
                            <button
                                type="button"
                                aria-pressed={mode === 'manual'}
                                onClick={() => setMode('manual')}
                                className={`py-3 border-b-2 text-sm font-medium inline-flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer ${
                                    mode === 'manual'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Keyboard className="size-4" strokeWidth={1.75} aria-hidden="true" />
                                Input Kode / Scanner USB
                            </button>
                            <button
                                type="button"
                                aria-pressed={mode === 'camera'}
                                onClick={() => setMode('camera')}
                                className={`py-3 border-b-2 text-sm font-medium inline-flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer ${
                                    mode === 'camera'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Camera className="size-4" strokeWidth={1.75} aria-hidden="true" />
                                Kamera QR
                            </button>
                        </div>

                        <div className="p-5">
                            {mode === 'manual' ? (
                                <form onSubmit={handleManualSubmit} className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="ticket-code-input"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Kode E-Tiket
                                        </label>
                                        <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
                                            <input
                                                ref={inputRef}
                                                id="ticket-code-input"
                                                name="ticket_code"
                                                type="text"
                                                autoComplete="off"
                                                required
                                                value={data.ticket_code}
                                                onChange={(e) =>
                                                    setData('ticket_code', e.target.value)
                                                }
                                                placeholder="Contoh: HJR-TKT-2026-AB12CD34"
                                                className="flex-1 h-10 px-3 rounded-md border border-gray-200 bg-white font-mono text-sm text-gray-900 uppercase placeholder:normal-case placeholder:font-sans placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                                            />
                                            <EoButton
                                                type="submit"
                                                variant="primary"
                                                size="md"
                                                disabled={processing}
                                                className="h-10 px-4"
                                            >
                                                {processing ? 'Memverifikasi...' : 'Verifikasi Check-in'}
                                            </EoButton>
                                        </div>
                                        <p className="mt-1.5 text-xs text-gray-500">
                                            Arahkan scanner barcode USB ke kolom ini atau ketik kode tiket lalu tekan Enter.
                                        </p>
                                        {errors.ticket_code && (
                                            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                                                {errors.ticket_code}
                                            </p>
                                        )}
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-3">
                                    {cameraStatus === 'active' || cameraStatus === 'starting' ? (
                                        <div className="space-y-2">
                                            <div className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-200 bg-gray-900">
                                                <video
                                                    ref={videoRef}
                                                    muted
                                                    playsInline
                                                    className="size-full object-cover"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-600">
                                                {cameraStatus === 'starting'
                                                    ? 'Mengaktifkan kamera perangkat...'
                                                    : isScanningSubmitting
                                                    ? 'Memverifikasi tiket terdeteksi...'
                                                    : 'Arahkan QR Code e-tiket peserta ke tengah kamera.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border border-gray-200 bg-gray-50 p-5 text-center space-y-3">
                                            <Camera
                                                className="mx-auto size-5 text-gray-400"
                                                strokeWidth={1.75}
                                                aria-hidden="true"
                                            />
                                            <p className="text-sm font-medium text-gray-900">
                                                Kamera QR tidak aktif
                                            </p>
                                            <p className="text-xs text-gray-600 max-w-md mx-auto">
                                                {cameraError}
                                            </p>
                                            <EoButton
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setMode('manual')}
                                            >
                                                Gunakan Input Kode / Scanner USB
                                            </EoButton>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Verification Result Box */}
                    {checkinResult && resultTone && (
                        <Card
                            role="status"
                            aria-live="polite"
                            className="p-5 space-y-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <StatusBadge
                                    tone={resultTone.dot}
                                    label={resultTone.heading}
                                    className="font-medium text-gray-900"
                                />
                                {checkinResult.ticket?.ticketCode && (
                                    <span className="font-mono text-xs text-gray-500">
                                        {checkinResult.ticket.ticketCode}
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-gray-700">
                                {checkinResult.message}
                            </p>

                            {checkinResult.ticket && (
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-t border-gray-200 pt-3 text-xs">
                                    <div>
                                        <dt className="text-gray-500">Nama peserta</dt>
                                        <dd className="font-medium text-gray-900">
                                            {checkinResult.ticket.attendeeName}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Kategori tiket</dt>
                                        <dd className="font-medium text-gray-900">
                                            {checkinResult.ticket.ticketTypeName}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Event</dt>
                                        <dd className="font-medium text-gray-900">
                                            {checkinResult.ticket.eventTitle}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Referensi pesanan</dt>
                                        <dd className="font-mono text-gray-900">
                                            {checkinResult.ticket.orderReference}
                                        </dd>
                                    </div>
                                    {checkinResult.ticket.checkedInAtFormatted && (
                                        <div>
                                            <dt className="text-gray-500">Waktu check-in</dt>
                                            <dd className="font-medium text-gray-900">
                                                {checkinResult.ticket.checkedInAtFormatted}
                                            </dd>
                                        </div>
                                    )}
                                    {checkinResult.ticket.checkedInByName && (
                                        <div>
                                            <dt className="text-gray-500">Diverifikasi oleh</dt>
                                            <dd className="font-medium text-gray-900">
                                                {checkinResult.ticket.checkedInByName}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            )}
                        </Card>
                    )}
                </div>

                {/* Recent Check-ins Log */}
                <Card as="section" className="overflow-hidden">
                    <CardHeader
                        title="Riwayat Check-in Terbaru"
                        description="Peserta yang baru saja diverifikasi masuk."
                    />

                    {recentCheckIns.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {recentCheckIns.map((item) => (
                                <div
                                    key={item.id}
                                    className="px-5 py-3.5 flex items-start justify-between gap-4"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {item.attendeeName}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-600 truncate">
                                            {item.eventTitle} · {item.ticketTypeName}
                                        </p>
                                        <p className="mt-1 font-mono text-xs text-gray-500">
                                            {item.ticketCode}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <StatusBadge
                                            tone="success"
                                            label="Hadir"
                                            className="text-xs justify-end"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {item.checkedInAtFormatted}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 px-6 text-center">
                            <QrCode
                                className="mx-auto size-5 text-gray-400 mb-2"
                                strokeWidth={1.75}
                                aria-hidden="true"
                            />
                            <p className="text-sm font-medium text-gray-900">
                                Belum ada peserta yang check-in
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Hasil pemindaian QR atau input kode tiket akan tercatat langsung di sini.
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </EoLayout>
    );
}
