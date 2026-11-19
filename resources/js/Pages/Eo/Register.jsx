import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    CheckCircle2,
    Clock3,
    ExternalLink,
    FileCheck2,
    FileUp,
    LogOut,
    ShieldCheck,
} from 'lucide-react';

export default function EoRegister({ auth, eoApplication = null }) {
    const user = auth?.user || { name: '', email: '', phone: '' };
    const { flash } = usePage().props;

    const eoForm = useForm({
        organization_name: eoApplication?.status === 'REJECTED' ? (eoApplication.organizationName || '') : '',
        contact_phone: eoApplication?.status === 'REJECTED' ? (eoApplication.contactPhone || user.phone || '') : (user.phone || ''),
        portfolio_url: eoApplication?.status === 'REJECTED' ? (eoApplication.portfolioUrl || '') : '',
        document: null,
        reason: eoApplication?.status === 'REJECTED' ? (eoApplication.reason || '') : '',
    });

    const handleEoApplicationSubmit = (e) => {
        e.preventDefault();
        eoForm.post('/eo-applications', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                eoForm.reset('document');
            },
        });
    };

    return (
        <>
            <Head title="Daftar Jadi Event Organizer (EO) — Hajirin" />
            <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col">
                {/* Top Header */}
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/hajirin_icon.svg" alt="Hajirin" className="h-8 w-auto" />
                            <span className="text-lg font-bold tracking-tight text-navy">HAJIRIN</span>
                        </Link>
                        <span className="hidden h-5 w-px bg-slate-200 sm:inline-block" aria-hidden="true" />
                        <span className="hidden text-xs font-semibold text-slate-500 sm:inline">
                            Pendaftaran Event Organizer (EO)
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <ArrowLeft className="size-3.5" />
                            Kembali ke Dashboard
                        </Link>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                        >
                            <LogOut className="size-3.5" />
                            Keluar
                        </Link>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 sm:px-8 sm:py-10">
                    {flash?.success && (
                        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 shadow-xs">
                            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                            <p className="font-medium">{flash.success}</p>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900 shadow-xs">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                            <p className="font-medium">{flash.error}</p>
                        </div>
                    )}

                    {/* Main Application Card */}
                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7 gap-3 bg-gradient-to-r from-slate-50 to-indigo-50/50">
                            <div className="flex items-start gap-3.5">
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                                    <Building2 className="size-6" />
                                </span>
                                <div>
                                    <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                                        Pendaftaran Akun Event Organizer (EO)
                                    </h1>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                        Ajukan akunmu untuk menyelenggarakan acara, mengelola penjualan tiket, dan memantau check-in peserta di Hajirin.
                                    </p>
                                </div>
                            </div>

                            {eoApplication && (
                                <span
                                    className={`inline-flex items-center gap-1.5 self-start sm:self-center rounded-full px-3 py-1 text-xs font-bold border shrink-0 ${
                                        eoApplication.status === 'PENDING'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : eoApplication.status === 'APPROVED'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                >
                                    <span
                                        className={`size-1.5 rounded-full ${
                                            eoApplication.status === 'PENDING'
                                                ? 'bg-amber-500'
                                                : eoApplication.status === 'APPROVED'
                                                ? 'bg-emerald-500'
                                                : 'bg-red-500'
                                        }`}
                                    />
                                    {eoApplication.status === 'PENDING'
                                        ? 'Menunggu Verifikasi Admin'
                                        : eoApplication.status === 'APPROVED'
                                        ? 'Disetujui'
                                        : 'Perlu Perbaikan Data'}
                                </span>
                            )}
                        </div>

                        <div className="p-5 sm:p-7">
                            {eoApplication?.status === 'PENDING' ? (
                                <div className="space-y-5">
                                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-900">
                                        <Clock3 className="mt-0.5 size-5 shrink-0 text-amber-600" />
                                        <div>
                                            <p className="font-bold">Pengajuanmu Sedang Ditinjau oleh Tim Admin</p>
                                            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                                                Dikirim pada <span className="font-semibold">{eoApplication.createdAt}</span>. Begitu pengajuan disetujui, akunmu akan otomatis beralih menjadi Event Organizer dan memiliki akses penuh ke Dashboard EO.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <InfoField label="Nama Organisasi / EO" value={eoApplication.organizationName} />
                                        <InfoField label="Nomor WhatsApp PIC" value={eoApplication.contactPhone} />
                                        <InfoField label="Tautan Portofolio / Sosmed" value={eoApplication.portfolioUrl || '-'} />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Deskripsi & Rencana Event</p>
                                        <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                            {eoApplication.reason}
                                        </div>
                                    </div>

                                    {eoApplication.documentUrl && (
                                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-center gap-3">
                                                <FileCheck2 className="size-5 text-indigo-600 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">Berkas Verifikasi Identitas & Legalitas</p>
                                                    <p className="text-[11px] text-slate-500">Tautan aman (Pre-signed URL) berlaku selama 15 menit</p>
                                                </div>
                                            </div>
                                            <a
                                                href={eoApplication.documentUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition"
                                            >
                                                Lihat Berkas <ExternalLink className="size-3.5" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {eoApplication?.status === 'REJECTED' && (
                                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4 text-xs sm:text-sm text-red-900">
                                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                                            <div>
                                                <p className="font-bold">Pengajuan Sebelumnya Belum Disetujui</p>
                                                <p className="mt-1 text-xs text-red-800">
                                                    <span className="font-semibold">Catatan Admin:</span> {eoApplication.rejectionReason}
                                                </p>
                                                <p className="mt-1 text-[11px] text-red-700">
                                                    Silakan perbarui data atau berkas verifikasi di bawah ini untuk mengajukan ulang.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/70 p-3.5 text-xs leading-relaxed text-blue-900 border border-blue-100">
                                        <ShieldCheck className="size-4 shrink-0 text-blue-700 mt-0.5" />
                                        <span>
                                            Pengajuan terdaftar atas akun <span className="font-bold">{user.name}</span> ({user.email}). Pastikan data PIC dan berkas verifikasi sesuai agar proses review Admin berjalan cepat.
                                        </span>
                                    </div>

                                    <form onSubmit={handleEoApplicationSubmit} className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor="eo_organization_name" className="block text-xs font-semibold text-slate-700">
                                                    Nama Organisasi / Komunitas / Promotor <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="eo_organization_name"
                                                    type="text"
                                                    required
                                                    value={eoForm.data.organization_name}
                                                    onChange={(e) => eoForm.setData('organization_name', e.target.value)}
                                                    placeholder="Contoh: Himpunan Mahasiswa Informatika / Nusantara Live"
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                                                />
                                                {eoForm.errors.organization_name && (
                                                    <p className="mt-1 text-xs font-medium text-red-600">{eoForm.errors.organization_name}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="eo_contact_phone" className="block text-xs font-semibold text-slate-700">
                                                    Nomor WhatsApp Penanggung Jawab (PIC) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="eo_contact_phone"
                                                    type="text"
                                                    required
                                                    value={eoForm.data.contact_phone}
                                                    onChange={(e) => eoForm.setData('contact_phone', e.target.value)}
                                                    placeholder="Contoh: 081234567890"
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                                                />
                                                {eoForm.errors.contact_phone && (
                                                    <p className="mt-1 text-xs font-medium text-red-600">{eoForm.errors.contact_phone}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor="eo_portfolio_url" className="block text-xs font-semibold text-slate-700">
                                                    Tautan Media Sosial / Portofolio Acara <span className="text-slate-400 font-normal">(Opsional)</span>
                                                </label>
                                                <input
                                                    id="eo_portfolio_url"
                                                    type="url"
                                                    value={eoForm.data.portfolio_url}
                                                    onChange={(e) => eoForm.setData('portfolio_url', e.target.value)}
                                                    placeholder="https://instagram.com/nama.organisasi"
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                                                />
                                                {eoForm.errors.portfolio_url && (
                                                    <p className="mt-1 text-xs font-medium text-red-600">{eoForm.errors.portfolio_url}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="eo_document" className="block text-xs font-semibold text-slate-700">
                                                    Berkas Verifikasi Gabungan (KTP/KTM & Legalitas) <span className="text-red-500">*</span>
                                                </label>
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <label
                                                        htmlFor="eo_document"
                                                        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-600 hover:border-blue-600 hover:bg-blue-50/40 transition"
                                                    >
                                                        <span className="flex items-center gap-2 truncate">
                                                            <FileUp className="size-4 text-blue-700 shrink-0" />
                                                            <span className="truncate font-medium">
                                                                {eoForm.data.document ? eoForm.data.document.name : 'Pilih 1 file PDF / JPG / PNG (Maks 5 MB)'}
                                                            </span>
                                                        </span>
                                                        <span className="ml-2 shrink-0 rounded-md bg-white px-2 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
                                                            Pilih File
                                                        </span>
                                                    </label>
                                                    <input
                                                        id="eo_document"
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => eoForm.setData('document', e.target.files?.[0] || null)}
                                                        className="sr-only"
                                                    />
                                                </div>
                                                {eoForm.errors.document && (
                                                    <p className="mt-1 text-xs font-medium text-red-600">{eoForm.errors.document}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="eo_reason" className="block text-xs font-semibold text-slate-700">
                                                Deskripsi Organisasi & Rencana Event <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                id="eo_reason"
                                                rows={4}
                                                required
                                                value={eoForm.data.reason}
                                                onChange={(e) => eoForm.setData('reason', e.target.value)}
                                                placeholder="Jelaskan secara singkat profil organisasimu dan jenis event apa yang ingin diselenggarakan di Hajirin (minimal 20 karakter)..."
                                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                                            />
                                            {eoForm.errors.reason && (
                                                <p className="mt-1 text-xs font-medium text-red-600">{eoForm.errors.reason}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                                            <p className="text-[11px] text-slate-500">
                                                Berkas disimpan di ruang penyimpanan terenkripsi (Private Storage) dan hanya dapat diakses oleh Admin via Pre-signed URL.
                                            </p>
                                            <button
                                                type="submit"
                                                disabled={eoForm.processing}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-800 disabled:opacity-50 transition shrink-0"
                                            >
                                                <Building2 className="size-4" />
                                                {eoForm.processing
                                                    ? 'Mengirim Pengajuan...'
                                                    : eoApplication?.status === 'REJECTED'
                                                    ? 'Kirim Ulang Pengajuan EO'
                                                    : 'Kirim Pengajuan EO'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}

function InfoField({ label, value }) {
    return (
        <div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-800">
                <span className="truncate block">{value}</span>
            </div>
        </div>
    );
}
