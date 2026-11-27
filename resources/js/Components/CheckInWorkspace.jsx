import React, { useEffect, useRef, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Card,
    CardHeader,
    EoButton,
    StatusBadge,
    StatCard,
} from './eo/Primitives';
import { playCheckInFeedback } from '../lib/checkinFeedback';
import {
    Camera,
    CheckCircle2,
    Clock,
    Keyboard,
    Lock,
    QrCode,
    Search,
    Ticket,
    Volume2,
    VolumeX,
} from 'lucide-react';

function formatCountdown(remainingMs) {
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');

    if (days > 0) {
        return `${days} hari ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

const RESULT_TONES = {
    success: { dot: 'success', heading: 'Check-in berhasil' },
    already_used: { dot: 'warning', heading: 'Tiket sudah terpakai' },
    invalid: { dot: 'danger', heading: 'Tiket tidak valid' },
};

const MUTE_STORAGE_KEY = 'hajirin_checkin_muted';

export default function CheckInWorkspace({
    endpoint = '/eo/check-in',
    heading = 'Check-in E-Tiket Hari-H',
    description = 'Pindai QR code, masukkan kode tiket, atau cari nama peserta untuk memverifikasi kehadiran.',
    events = [],
    selectedEventId = '',
    searchQuery = '',
    searchResults = [],
    stats = {},
    recentCheckIns = [],
    checkinResult = null,
    headerActions = null,
}) {
    const [mode, setMode] = useState('manual');
    const [cameraStatus, setCameraStatus] = useState('idle');
    const [cameraError, setCameraError] = useState('');
    const [isScanningSubmitting, setIsScanningSubmitting] = useState(false);
    const [submittingCode, setSubmittingCode] = useState(null);
    const [attendeeSearch, setAttendeeSearch] = useState(searchQuery || '');
    const [nowMs, setNowMs] = useState(() => Date.now());
    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
        } catch {
            return false;
        }
    });

    const selectedEvent = events.find((ev) => ev.id === selectedEventId) || null;
    const opensAtMs = selectedEvent?.checkInOpensAtIso
        ? Date.parse(selectedEvent.checkInOpensAtIso)
        : null;
    const endsAtMs = selectedEvent?.endsAtIso ? Date.parse(selectedEvent.endsAtIso) : null;
    const isBeforeGateOpen = Boolean(opensAtMs && nowMs < opensAtMs);
    const isAfterGateClosed = Boolean(endsAtMs && nowMs > endsAtMs);
    const isSelectedEventLocked = Boolean(selectedEvent && (isBeforeGateOpen || isAfterGateClosed));
    const isSelectedEventLockedRef = useRef(isSelectedEventLocked);
    isSelectedEventLockedRef.current = isSelectedEventLocked;

    useEffect(() => {
        if (!selectedEvent || !opensAtMs) return undefined;
        const interval = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [selectedEvent?.id, opensAtMs]);

    const inputRef = useRef(null);
    const searchInputRef = useRef(null);
    const videoRef = useRef(null);
    const lastScanRef = useRef({ code: '', at: 0 });
    const isScanningSubmittingRef = useRef(false);
    const lastFeedbackStampRef = useRef(null);
    const isFirstSearchRender = useRef(true);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        ticket_code: '',
        event_id: selectedEventId || '',
    });

    useEffect(() => {
        setData('event_id', selectedEventId || '');
    }, [selectedEventId]);

    useEffect(() => {
        setAttendeeSearch(searchQuery || '');
    }, [searchQuery]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const canAutoFocus = window.matchMedia('(min-width: 768px) and (pointer: fine)').matches;
        if (!canAutoFocus) return;

        if (mode === 'manual') {
            inputRef.current?.focus();
        } else if (mode === 'search') {
            searchInputRef.current?.focus();
        }
    }, [mode]);

    useEffect(() => {
        if (!checkinResult) return;

        const stamp =
            checkinResult.eventTimestamp ??
            `${checkinResult.outcome}:${checkinResult.message}`;

        if (lastFeedbackStampRef.current === stamp) {
            return;
        }

        lastFeedbackStampRef.current = stamp;
        playCheckInFeedback(checkinResult.outcome, isMuted);
    }, [checkinResult, isMuted]);

    useEffect(() => {
        if (isFirstSearchRender.current) {
            isFirstSearchRender.current = false;
            return;
        }

        const trimmed = attendeeSearch.trim();
        if (trimmed === (searchQuery || '')) return;
        if (trimmed.length === 1) return;

        const timer = setTimeout(() => {
            const query = {};
            if (selectedEventId) query.event_id = selectedEventId;
            if (trimmed.length >= 2) query.q = trimmed;

            router.get(endpoint, query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [attendeeSearch, selectedEventId, endpoint]);

    useEffect(() => {
        if (mode !== 'camera') {
            setCameraStatus('idle');
            setCameraError('');
            return;
        }

        if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setCameraStatus('unsupported');
            setCameraError(
                'Browser ini tidak mendukung akses kamera. Gunakan mode Input Kode / Scanner USB atau Cari Peserta.'
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

                let detectQr = null;

                if ('BarcodeDetector' in window) {
                    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
                    detectQr = async (videoEl) => {
                        const codes = await detector.detect(videoEl);
                        return codes[0]?.rawValue?.trim() || '';
                    };
                } else {
                    const { default: jsQR } = await import('jsqr');
                    if (cancelled) return;

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });

                    detectQr = async (videoEl) => {
                        if (!ctx || !videoEl.videoWidth || !videoEl.videoHeight) return '';
                        const maxDim = 640;
                        const scale = Math.min(1, maxDim / Math.max(videoEl.videoWidth, videoEl.videoHeight));
                        const w = Math.max(1, Math.round(videoEl.videoWidth * scale));
                        const h = Math.max(1, Math.round(videoEl.videoHeight * scale));
                        if (canvas.width !== w || canvas.height !== h) {
                            canvas.width = w;
                            canvas.height = h;
                        }
                        ctx.drawImage(videoEl, 0, 0, w, h);
                        const imageData = ctx.getImageData(0, 0, w, h);
                        const decoded = jsQR(imageData.data, w, h, {
                            inversionAttempts: 'dontInvert',
                        });
                        return decoded?.data?.trim() || '';
                    };
                }

                setCameraStatus('active');

                const tick = async () => {
                    if (cancelled || !videoRef.current) return;

                    if (
                        videoRef.current.readyState >= 2 &&
                        !isScanningSubmittingRef.current &&
                        !isSelectedEventLockedRef.current
                    ) {
                        try {
                            const rawValue = await detectQr(videoRef.current);

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
                                        endpoint,
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
                        'Izin kamera ditolak atau kamera tidak tersedia. Gunakan Input Kode / Scanner USB atau Cari Peserta.'
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
    }, [mode, selectedEventId, endpoint]);

    const toggleMute = () => {
        setIsMuted((prev) => {
            const next = !prev;
            try {
                window.localStorage.setItem(MUTE_STORAGE_KEY, next ? '1' : '0');
            } catch {
                // Abaikan jika storage tidak tersedia
            }
            return next;
        });
    };

    const handleEventChange = (nextEventId) => {
        const query = {};
        if (nextEventId) query.event_id = nextEventId;
        if (attendeeSearch.trim().length >= 2) query.q = attendeeSearch.trim();

        router.get(endpoint, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        clearErrors();

        post(endpoint, {
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

    const handleQuickCheckIn = (ticketCode) => {
        setSubmittingCode(ticketCode);
        router.post(
            endpoint,
            {
                ticket_code: ticketCode,
                event_id: selectedEventId || null,
                q: attendeeSearch.trim().length >= 2 ? attendeeSearch.trim() : null,
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmittingCode(null),
            }
        );
    };

    const attendanceRate = stats.attendanceRate ?? 0;
    const resultTone = checkinResult
        ? RESULT_TONES[checkinResult.outcome] || RESULT_TONES.invalid
        : null;

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{heading}</h1>
                    <p className="mt-1 text-sm text-gray-600">{description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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

                    <EoButton
                        variant="outline"
                        size="md"
                        onClick={toggleMute}
                        aria-pressed={!isMuted}
                        title={isMuted ? 'Aktifkan suara beep validasi' : 'Bisukan suara beep validasi'}
                    >
                        {isMuted ? (
                            <VolumeX className="size-4 text-gray-500" strokeWidth={1.75} aria-hidden="true" />
                        ) : (
                            <Volume2 className="size-4 text-gray-700" strokeWidth={1.75} aria-hidden="true" />
                        )}
                        <span>{isMuted ? 'Suara bisu' : 'Suara aktif'}</span>
                    </EoButton>

                    {headerActions}
                </div>
            </div>

            {/* Status Gerbang & Countdown Validasi Check-in */}
            {selectedEvent && (
                <Card
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isBeforeGateOpen
                            ? 'border-amber-200 bg-amber-50/70'
                            : isAfterGateClosed
                              ? 'border-rose-200 bg-rose-50/70'
                              : 'border-emerald-200 bg-emerald-50/60'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border ${
                                isBeforeGateOpen
                                    ? 'border-amber-200 bg-white text-amber-600'
                                    : isAfterGateClosed
                                      ? 'border-rose-200 bg-white text-rose-600'
                                      : 'border-emerald-200 bg-white text-emerald-600'
                            }`}
                        >
                            {isSelectedEventLocked ? (
                                <Lock className="size-4" aria-hidden="true" />
                            ) : (
                                <Clock className="size-4" aria-hidden="true" />
                            )}
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-gray-900">
                                {isBeforeGateOpen
                                    ? 'Gerbang Check-in Belum Dibuka'
                                    : isAfterGateClosed
                                      ? 'Waktu Check-in Event Telah Berakhir'
                                      : 'Gerbang Check-in Sedang Dibuka'}
                            </p>
                            <p className="text-xs text-gray-600">
                                {isBeforeGateOpen
                                    ? `Validasi tiket untuk "${selectedEvent.title}" dibuka mulai ${selectedEvent.checkInOpensAtFormatted} (3 jam sebelum acara dimulai).`
                                    : isAfterGateClosed
                                      ? `Jadwal pelaksanaan "${selectedEvent.title}" telah selesai sehingga pemindaian check-in ditutup.`
                                      : `Acara "${selectedEvent.title}" sudah memasuki jendela check-in (dimulai ${selectedEvent.startsAtFormatted}).`}
                            </p>
                        </div>
                    </div>

                    {isBeforeGateOpen && opensAtMs && (
                        <div className="shrink-0 rounded-lg border border-amber-200 bg-white px-3.5 py-2 text-left sm:text-right">
                            <p className="text-[11px] font-medium text-amber-700">
                                Dibuka dalam
                            </p>
                            <p className="font-mono text-sm font-bold text-gray-900 tabular-nums">
                                {formatCountdown(opensAtMs - nowMs)}
                            </p>
                        </div>
                    )}
                </Card>
            )}

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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr] items-start">
                {/* Scanner & Verification Panel */}
                <div className="min-w-0 space-y-4">
                    <Card className="overflow-hidden">
                        <div className="grid grid-cols-3 border-b border-gray-200 sm:flex sm:items-center sm:gap-6 sm:px-5">
                            <button
                                type="button"
                                aria-pressed={mode === 'manual'}
                                onClick={() => setMode('manual')}
                                className={`min-h-11 px-2 sm:px-0 py-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 cursor-pointer ${
                                    mode === 'manual'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Keyboard className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                                <span>
                                    Input Kode<span className="hidden sm:inline"> / Scanner USB</span>
                                </span>
                            </button>
                            <button
                                type="button"
                                aria-pressed={mode === 'camera'}
                                onClick={() => setMode('camera')}
                                className={`min-h-11 px-2 sm:px-0 py-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 cursor-pointer ${
                                    mode === 'camera'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Camera className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                                <span>Kamera QR</span>
                            </button>
                            <button
                                type="button"
                                aria-pressed={mode === 'search'}
                                onClick={() => setMode('search')}
                                className={`min-h-11 px-2 sm:px-0 py-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 cursor-pointer ${
                                    mode === 'search'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Search className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                                <span>Cari Peserta</span>
                            </button>
                        </div>

                        <div className="p-5">
                            {mode === 'manual' && (
                                <form onSubmit={handleManualSubmit} action={endpoint} method="POST" className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="ticket-code-input"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Kode e-tiket
                                        </label>
                                        <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
                                            <input
                                                ref={inputRef}
                                                id="ticket-code-input"
                                                name="ticket_code"
                                                type="text"
                                                autoComplete="off"
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                spellCheck={false}
                                                required
                                                value={data.ticket_code}
                                                onChange={(e) => setData('ticket_code', e.target.value)}
                                                aria-describedby="ticket-code-help"
                                                placeholder="Contoh: HJR-TKT-2026-AB12CD34"
                                                className="flex-1 h-11 sm:h-10 px-3 rounded-md border border-gray-200 bg-white font-mono text-base sm:text-sm text-gray-900 uppercase placeholder:normal-case placeholder:font-sans placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                                            />
                                            <EoButton
                                                type="submit"
                                                variant="primary"
                                                size="md"
                                                disabled={processing || isSelectedEventLocked}
                                                className="h-11 sm:h-10 px-4"
                                            >
                                                {processing
                                                    ? 'Memverifikasi...'
                                                    : isAfterGateClosed
                                                      ? 'Check-in Ditutup'
                                                      : isBeforeGateOpen
                                                        ? 'Gerbang Belum Dibuka'
                                                        : 'Verifikasi Check-in'}
                                            </EoButton>
                                        </div>
                                        <p id="ticket-code-help" className="mt-1.5 text-xs text-gray-500">
                                            Arahkan scanner barcode USB ke kolom ini atau ketik kode tiket lalu tekan Enter.
                                        </p>
                                        {errors.ticket_code && (
                                            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                                                {errors.ticket_code}
                                            </p>
                                        )}
                                    </div>
                                </form>
                            )}

                            {mode === 'camera' && (
                                <div className="space-y-3">
                                    {cameraStatus === 'active' || cameraStatus === 'starting' ? (
                                        <div className="space-y-2">
                                            <div className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-200 bg-gray-900">
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                    className="size-full object-cover"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-600">
                                                {isAfterGateClosed
                                                    ? 'Pemindaian dinonaktifkan karena waktu check-in acara telah berakhir.'
                                                    : isBeforeGateOpen
                                                      ? 'Pemindaian otomatis dijeda hingga gerbang check-in dibuka (3 jam sebelum acara dimulai).'
                                                      : cameraStatus === 'starting'
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
                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                <EoButton
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setMode('manual')}
                                                >
                                                    Input Kode / USB
                                                </EoButton>
                                                <EoButton
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setMode('search')}
                                                >
                                                    Cari Nama Peserta
                                                </EoButton>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === 'search' && (
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="checkin-attendee-search"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Cari peserta (nama, email, atau kode tiket)
                                        </label>
                                        <div className="relative mt-1.5">
                                            <Search
                                                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none"
                                                strokeWidth={1.75}
                                                aria-hidden="true"
                                            />
                                            <input
                                                ref={searchInputRef}
                                                id="checkin-attendee-search"
                                                type="search"
                                                autoComplete="off"
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                spellCheck={false}
                                                value={attendeeSearch}
                                                onChange={(e) => setAttendeeSearch(e.target.value)}
                                                aria-describedby="checkin-search-help"
                                                placeholder="Ketik minimal 2 karakter nama atau email peserta..."
                                                className="w-full h-11 sm:h-10 pl-9 pr-3 rounded-md border border-gray-200 bg-white text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                                            />
                                        </div>
                                        <p id="checkin-search-help" className="mt-1.5 text-xs text-gray-500">
                                            Gunakan pencarian ini sebagai alternatif jika ponsel peserta mati atau QR tidak terbaca.
                                        </p>
                                    </div>

                                    {attendeeSearch.trim().length >= 2 && (
                                        <div className="rounded-md border border-gray-200 divide-y divide-gray-200">
                                            {searchResults.length > 0 ? (
                                                searchResults.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {item.attendeeName}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {item.attendeeEmail} · {item.ticketTypeName}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-gray-500">
                                                                <span className="font-mono text-gray-700">
                                                                    {item.ticketCode}
                                                                </span>{' '}
                                                                · {item.eventTitle}
                                                            </p>
                                                        </div>

                                                        <div className="shrink-0">
                                                            {item.status === 'ACTIVE' ? (
                                                                <EoButton
                                                                    variant="primary"
                                                                    size="sm"
                                                                    disabled={
                                                                        submittingCode === item.ticketCode ||
                                                                        isSelectedEventLocked
                                                                    }
                                                                    onClick={() => handleQuickCheckIn(item.ticketCode)}
                                                                >
                                                                    {submittingCode === item.ticketCode
                                                                        ? 'Memproses...'
                                                                        : isAfterGateClosed
                                                                          ? 'Ditutup'
                                                                          : isBeforeGateOpen
                                                                            ? 'Belum Dibuka'
                                                                            : 'Check-in'}
                                                                </EoButton>
                                                            ) : (
                                                                <div className="text-right">
                                                                    <StatusBadge
                                                                        tone="success"
                                                                        label="Sudah check-in"
                                                                        className="text-xs"
                                                                    />
                                                                    {item.checkedInAtFormatted && (
                                                                        <p className="mt-0.5 text-xs text-gray-500">
                                                                            {item.checkedInAtFormatted}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-6 text-center text-xs text-gray-500">
                                                    Tidak ada peserta yang cocok dengan "{attendeeSearch.trim()}".
                                                </div>
                                            )}
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

                            <p className="text-sm text-gray-700">{checkinResult.message}</p>

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
                <Card as="section" className="min-w-0 overflow-hidden">
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
                                        <p className="mt-1 text-xs text-gray-500">
                                            <span className="font-mono">{item.ticketCode}</span>
                                            {item.checkedInByName && item.checkedInByName !== '-'
                                                ? ` · Petugas: ${item.checkedInByName}`
                                                : ''}
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
        </>
    );
}
