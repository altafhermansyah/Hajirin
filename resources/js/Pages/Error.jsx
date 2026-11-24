import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Home } from 'lucide-react';
import { Button, buttonClass } from '../Components/ui/Button';

const ERROR_COPY = {
    403: {
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk membuka halaman ini.',
    },
    404: {
        title: 'Halaman Tidak Ditemukan',
        description: 'Halaman atau event yang Anda cari tidak tersedia atau telah dipindahkan.',
    },
    419: {
        title: 'Sesi Kedaluwarsa',
        description: 'Sesi halaman Anda telah habis. Silakan muat ulang dan coba kembali.',
    },
    500: {
        title: 'Terjadi Kesalahan Server',
        description: 'Mohon maaf, sistem sedang mengalami kendala. Silakan coba beberapa saat lagi.',
    },
    503: {
        title: 'Layanan Sedang Pemeliharaan',
        description: 'Hajirin sedang dalam pemeliharaan singkat. Silakan kembali beberapa menit lagi.',
    },
};

export default function ErrorPage({ status = 404, message = null }) {
    const copy = ERROR_COPY[status] || {
        title: 'Terjadi Kesalahan',
        description: 'Permintaan tidak dapat diproses saat ini.',
    };

    const resolvedDescription = status === 403 && message ? message : copy.description;

    return (
        <>
            <Head title={`${status} - ${copy.title} | Hajirin`} />

            <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
                <header className="border-b border-slate-200/80">
                    <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                        <Link href="/" className="inline-flex items-center gap-2.5">
                            <img src="/hajirin_icon.svg" alt="Hajirin" className="h-6 w-auto" />
                            <span className="text-base font-semibold tracking-tight text-navy">
                                Hajirin
                            </span>
                        </Link>
                        <span className="text-xs font-mono text-slate-400 tabular-nums">
                            HTTP {status}
                        </span>
                    </div>
                </header>

                <main className="flex-1 flex items-center justify-center px-6 py-16">
                    <div className="w-full max-w-lg">
                        <p className="text-5xl sm:text-6xl font-semibold tracking-tight text-slate-900 tabular-nums">
                            {status}
                        </p>

                        <h1 className="mt-4 text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                            {copy.title}
                        </h1>

                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                            {resolvedDescription}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-2.5">
                            <Link href="/" className={buttonClass('primary', 'md')}>
                                <Home className="size-4" aria-hidden="true" />
                                <span>Kembali ke Beranda</span>
                            </Link>

                            <Button
                                variant="outline"
                                size="md"
                                onClick={() => window.history.back()}
                            >
                                <ArrowLeft className="size-4 text-slate-500" aria-hidden="true" />
                                <span>Halaman Sebelumnya</span>
                            </Button>
                        </div>

                        <div className="mt-10 pt-6 border-t border-slate-200 text-xs text-slate-400">
                            Jika kendala berlanjut, silakan kembali ke halaman utama atau hubungi administrator Hajirin.
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
