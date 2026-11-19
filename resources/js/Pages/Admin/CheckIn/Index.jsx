import React, { useEffect, useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    QrCode,
    Camera,
    Keyboard,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Users,
    Ticket,
    Check,
    Search,
    ChevronDown,
    Building2,
    Calendar,
    Clock,
    RefreshCw,
    Sparkles,
    ShieldCheck,
} from 'lucide-react';

export default function AdminCheckInIndex({
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

    // Camera Scanner Lifecycle
    useEffect(() => {
        if (mode !== 'camera') {
            setCameraStatus('idle');
            setCameraError('');
            return;
        }

        if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setCameraStatus('unsupported');
            setCameraError('Browser ini tidak mendukung akses kamera. Gunakan input manual atau scanner barcode USB.');
            return;
        }

        if (!('BarcodeDetector' in window)) {
            setCameraStatus('unsupported');
            setCameraError(
                'Fitur pendeteksi QR otomatis dari kamera tidak didukung di browser ini. Silakan gunakan Mode Input / Barcode Scanner.'
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

                setCameraStatus('active');

                // Inisialisasi BarcodeDetector QR
                // @ts-ignore
                const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

                const scanLoop = async () => {
                    if (cancelled || !videoRef.current || videoRef.current.readyState < 2) {
                        timerId = setTimeout(scanLoop, 200);
                        return;
                    }

                    try {
                        const barcodes = await detector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            const raw = (barcodes[0].rawValue || '').trim();
                            const now = Date.now();

                            if (raw && !isScanningSubmittingRef.current) {
                                if (lastScanRef.current.code !== raw || now - lastScanRef.current.at > 3000) {
                                    lastScanRef.current = { code: raw, at: now };
                                    handleScannedCode(raw);
                                }
                            }
                        }
                    } catch {
                        // Ignore detection errors in loop
                    }

                    if (!cancelled) {
                        timerId = setTimeout(scanLoop, 250);
                    }
                };

                scanLoop();
            } catch (err) {
                if (!cancelled) {
                    setCameraStatus('error');
                    setCameraError(
                        err.name === 'NotAllowedError'
                            ? 'Akses izin kamera ditolak. Berikan izin di browser untuk memindai QR secara langsung.'
                            : 'Gagal mengakses kamera perangkat: ' + (err.message || 'Unknown error')
                    );
                }
            }
        };

        startScanner();

        return () => {
            cancelled = true;
            if (timerId) clearTimeout(timerId);
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [mode, selectedEventId]);

    const handleScannedCode = (rawCode) => {
        isScanningSubmittingRef.current = true;
        setIsScanningSubmitting(true);
        clearErrors();

        router.post(
            '/admin/scanner',
            {
                ticket_code: rawCode,
                event_id: selectedEventId || '',
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    isScanningSubmittingRef.current = false;
                    setIsScanningSubmitting(false);
                },
            }
        );
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!data.ticket_code.trim()) return;

        post('/admin/scanner', {
            preserveScroll: true,
            onSuccess: () => {
                reset('ticket_code');
                inputRef.current?.focus();
            },
        });
    };

    const handleEventChange = (newEventId) => {
        const queryParams = {};
        if (newEventId) {
            queryParams.event_id = newEventId;
        }

        router.get('/admin/scanner', queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AdminLayout title="Check-in Scanner Platform">
            <Head title="Check-in Scanner - Admin Hajirin" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="size-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <QrCode className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                                    Check-In Scanner
                                </h1>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                    <ShieldCheck className="size-3.5" />
                                    Super Admin Gate
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Verifikasi e-tiket Hari-H untuk seluruh event di platform Hajirin secara instan.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Event Selector Dropdown */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="text-xs font-bold text-slate-500 shrink-0">Filter Event:</span>
                    <div className="relative min-w-60">
                        <select
                            value={selectedEventId}
                            onChange={(e) => handleEventChange(e.target.value)}
                            className="w-full h-10 pl-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 hover:border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition appearance-none cursor-pointer truncate shadow-xs"
                        >
                            <option value="">Semua Event Aktif Platform</option>
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.title} ({ev.startsAtFormatted})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Attendance Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tiket Valid */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiket Valid Terbayar</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalValidTickets || 0}</h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Tiket terkonfirmasi lunas</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Ticket className="size-6" />
                    </div>
                </div>

                {/* Hadir / Check-In */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peserta Telah Hadir</p>
                        <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.checkedInCount || 0}</h3>
                        <p className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" />
                            Telah dipindai di gerbang
                        </p>
                    </div>
                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Users className="size-6" />
                    </div>
                </div>

                {/* Sisa Belum Hadir */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Belum Masuk Lokasi</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.remainingCount || 0}</h3>
                        <p className="text-xs text-amber-600 mt-1 font-medium">Menunggu kedatangan</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="size-6" />
                    </div>
                </div>

                {/* Rasio Kehadiran */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat Kehadiran</p>
                            <span className="text-xs font-black text-blue-600">{stats.attendanceRate || 0}%</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">
                            {stats.attendanceRate || 0}%
                        </h3>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 overflow-hidden">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, stats.attendanceRate || 0))}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Check-in Live Result Feedback Banner */}
            {checkinResult && (
                <div
                    className={`p-5 rounded-2xl border shadow-sm transition-all animate-scale-in ${
                        checkinResult.outcome === 'success'
                            ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 text-emerald-950'
                            : checkinResult.outcome === 'already_used'
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-950'
                            : 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-300 text-rose-950'
                    }`}
                >
                    <div className="flex items-start gap-4">
                        <div
                            className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                                checkinResult.outcome === 'success'
                                    ? 'bg-emerald-600 text-white'
                                    : checkinResult.outcome === 'already_used'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-rose-600 text-white'
                            }`}
                        >
                            {checkinResult.outcome === 'success' && <CheckCircle2 className="size-7" />}
                            {checkinResult.outcome === 'already_used' && <AlertTriangle className="size-7" />}
                            {checkinResult.outcome === 'invalid' && <XCircle className="size-7" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-black tracking-tight">
                                    {checkinResult.outcome === 'success'
                                        ? 'CHECK-IN BERHASIL!'
                                        : checkinResult.outcome === 'already_used'
                                        ? 'TIKET SUDAH DIGUNAKAN!'
                                        : 'TIKET TIDAK VALID!'}
                                </h3>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        checkinResult.outcome === 'success'
                                            ? 'bg-emerald-200 text-emerald-900'
                                            : checkinResult.outcome === 'already_used'
                                            ? 'bg-amber-200 text-amber-900'
                                            : 'bg-rose-200 text-rose-900'
                                    }`}
                                >
                                    {checkinResult.outcome}
                                </span>
                            </div>

                            <p className="text-sm font-medium mt-1 leading-relaxed">
                                {checkinResult.message}
                            </p>

                            {/* Ticket Card Details if available */}
                            {checkinResult.ticket && (
                                <div className="mt-3.5 p-3.5 rounded-xl bg-white/80 backdrop-blur-xs border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-700">
                                    <div>
                                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                                            Nama Peserta
                                        </span>
                                        <strong className="text-slate-900 font-extrabold text-sm truncate block">
                                            {checkinResult.ticket.attendeeName}
                                        </strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                                            Event Terkait
                                        </span>
                                        <span className="font-bold text-slate-800 truncate block">
                                            {checkinResult.ticket.eventTitle}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                                            Jenis Tiket
                                        </span>
                                        <span className="font-bold text-slate-800 truncate block">
                                            {checkinResult.ticket.ticketTypeName}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                                            Kode E-Tiket
                                        </span>
                                        <span className="font-mono font-bold text-blue-700 truncate block">
                                            {checkinResult.ticket.ticketCode}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Input & Controls Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Scanner Control Box */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                    <div>
                        <h3 className="font-extrabold text-base text-slate-900">Alat Pemindai E-Tiket</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pilih metode pemindaian yang paling efisien untuk gerbang masuk acara.
                        </p>
                    </div>

                    {/* Mode Toggle Switcher */}
                    <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200/80">
                        <button
                            type="button"
                            onClick={() => setMode('manual')}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                                mode === 'manual'
                                    ? 'bg-white text-blue-700 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Keyboard className="size-4" />
                            <span>Input / Scanner USB</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('camera')}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                                mode === 'camera'
                                    ? 'bg-white text-blue-700 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Camera className="size-4" />
                            <span>Kamera QR Scanner</span>
                        </button>
                    </div>

                    {/* Mode 1: Manual / USB Barcode Scanner */}
                    {mode === 'manual' && (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Kode E-Tiket Peserta <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={data.ticket_code}
                                        onChange={(e) => setData('ticket_code', e.target.value.toUpperCase())}
                                        placeholder="Contoh: HJR-TKT-2026-XXXXXXXX"
                                        autoComplete="off"
                                        autoFocus
                                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/70 font-mono text-sm uppercase text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition"
                                    />
                                    <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-slate-400 pointer-events-none" />
                                </div>
                                {errors.ticket_code && (
                                    <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.ticket_code}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !data.ticket_code.trim()}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="size-4" />
                                <span>{processing ? 'Memverifikasi...' : 'Verifikasi & Check-In'}</span>
                            </button>

                            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 text-xs text-blue-900 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <Sparkles className="size-3.5 text-blue-600" />
                                    <span>Dukungan Scanner USB Fisik:</span>
                                </p>
                                <p className="text-[11px] leading-relaxed text-blue-800">
                                    Anda dapat menyambungkan alat barcode scanner USB genggam ke laptop/PC. Letakkan kursor pada kotak teks di atas, lalu tembakkan laser scanner ke tiket peserta. Sistem akan langsung memprosesnya secara otomatis.
                                </p>
                            </div>
                        </form>
                    )}

                    {/* Mode 2: Camera QR Scanner */}
                    {mode === 'camera' && (
                        <div className="space-y-4">
                            <div className="relative aspect-4/3 w-full rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-800">
                                <video
                                    ref={videoRef}
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />

                                {/* Camera Target Overlay */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="size-52 border-2 border-dashed border-blue-400 rounded-3xl relative animate-pulse flex items-center justify-center">
                                        <div className="size-2 rounded-full bg-blue-500" />
                                    </div>
                                </div>

                                {cameraStatus === 'starting' && (
                                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                                        <RefreshCw className="size-6 animate-spin text-blue-400" />
                                        <span className="text-xs font-semibold">Mengaktifkan kamera perangkat...</span>
                                    </div>
                                )}

                                {isScanningSubmitting && (
                                    <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                                        <CheckCircle2 className="size-8 text-emerald-400 animate-bounce" />
                                        <span className="text-xs font-bold">Memverifikasi kode e-tiket...</span>
                                    </div>
                                )}
                            </div>

                            {cameraError && (
                                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
                                    <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                                    <p className="leading-relaxed">{cameraError}</p>
                                </div>
                            )}

                            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                                Arahkan kode QR tiket peserta ke dalam kotak bingkai kamera di atas untuk verifikasi otomatis.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Recent Check-ins Feed */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-extrabold text-base text-slate-900">Riwayat Check-In Terkini</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Daftar 15 peserta terakhir yang berhasil melakukan verifikasi gerbang.
                            </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            Live Feed
                        </span>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th scope="col" className="px-5 py-3.5">Peserta</th>
                                    <th scope="col" className="px-5 py-3.5">Event & Kategori</th>
                                    <th scope="col" className="px-5 py-3.5">Kode Tiket</th>
                                    <th scope="col" className="px-5 py-3.5">Waktu Masuk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {recentCheckIns.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-5 py-16 text-center text-slate-400">
                                            <Users className="mx-auto size-10 text-slate-300 mb-2" />
                                            <p className="font-bold text-slate-700 text-sm">Belum ada aktivitas check-in</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Hasil check-in tiket yang berhasil dipindai akan otomatis muncul di sini.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    recentCheckIns.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-3">
                                                <p className="font-bold text-slate-800">{item.attendeeName}</p>
                                                <p className="text-[11px] text-slate-400">Petugas: {item.checkedInByName}</p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className="font-semibold text-slate-800 truncate max-w-xs">{item.eventTitle}</p>
                                                <span className="inline-block mt-0.5 px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                    {item.ticketTypeName}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="font-mono font-bold text-blue-700 text-[11px]">
                                                    {item.ticketCode}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-500 font-medium">
                                                {item.checkedInAtFormatted}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
