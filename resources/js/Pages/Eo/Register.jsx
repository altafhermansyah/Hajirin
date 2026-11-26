import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '../../Components/Navbar';
import { Building2, ExternalLink, FileCheck2, FileUp, MailWarning } from 'lucide-react';
import { Card } from '../../Components/ui/Card';
import { StatusBadge } from '../../Components/ui/StatusBadge';
import { FlashBanner } from '../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../Components/ui/Button';
import EmailVerificationModal from '../../Components/Auth/EmailVerificationModal';

const STATUS_META = {
    PENDING: { tone: 'warning', label: 'Menunggu Verifikasi Admin' },
    APPROVED: { tone: 'success', label: 'Disetujui' },
    REJECTED: { tone: 'danger', label: 'Perlu Perbaikan Data' },
};

const INPUT_CLASS =
    'mt-1.5 w-full h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition';

export default function EoRegister({ auth, eoApplication = null }) {
    const user = auth?.user || { name: '', email: '', phone: '' };
    const { flash } = usePage().props;
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const isEmailVerified = Boolean(user.email_verified_at);

    const eoForm = useForm({
        organization_name:
            eoApplication?.status === 'REJECTED' ? eoApplication.organizationName || '' : '',
        contact_phone:
            eoApplication?.status === 'REJECTED'
                ? eoApplication.contactPhone || user.phone || ''
                : user.phone || '',
        portfolio_url:
            eoApplication?.status === 'REJECTED' ? eoApplication.portfolioUrl || '' : '',
        document: null,
        reason: eoApplication?.status === 'REJECTED' ? eoApplication.reason || '' : '',
    });

    const handleEoApplicationSubmit = (e) => {
        e.preventDefault();
        if (!isEmailVerified) {
            setIsVerifyModalOpen(true);
            return;
        }
        eoForm.post('/eo-applications', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                eoForm.reset('document');
            },
        });
    };

    const statusMeta = eoApplication
        ? STATUS_META[eoApplication.status] || { tone: 'neutral', label: eoApplication.status }
        : null;

    return (
        <>
            <Head title="Daftar Jadi Event Organizer (EO) - Hajirin" />
            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
                <Navbar auth={auth} />

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 sm:px-8"
                >
                    {flash?.success && <FlashBanner tone="success" message={flash.success} />}
                    {flash?.error && <FlashBanner tone="error" message={flash.error} />}
                    {eoForm.errors.email_verification && (
                        <FlashBanner tone="error" message={eoForm.errors.email_verification} />
                    )}

                    {!isEmailVerified && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950">
                            <div className="flex items-start gap-3">
                                <MailWarning
                                    className="mt-0.5 size-5 shrink-0 text-amber-600"
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="font-semibold text-amber-950">
                                        Verifikasi email diperlukan sebelum mendaftar EO
                                    </p>
                                    <p className="mt-0.5 text-xs text-amber-900/80 leading-relaxed">
                                        Konfirmasi kode OTP 6 digit ke email{' '}
                                        <span className="font-medium text-amber-950">
                                            {user.email}
                                        </span>{' '}
                                        agar notifikasi hasil verifikasi Admin dapat terkirim.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                size="sm"
                                className="shrink-0 self-start sm:self-center"
                                onClick={() => setIsVerifyModalOpen(true)}
                            >
                                Verifikasi Email Sekarang
                            </Button>
                        </div>
                    )}

                    <Card as="section" className="overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-6 py-5 gap-3 bg-white">
                            <div className="flex items-start gap-3.5">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                                    <Building2 className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
                                        Pendaftaran Akun Event Organizer (EO)
                                    </h1>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                        Ajukan akunmu untuk menyelenggarakan acara, mengelola tiket, dan memantau check-in peserta di Hajirin.
                                    </p>
                                </div>
                            </div>

                            {statusMeta && (
                                <div className="self-start sm:self-center shrink-0">
                                    <StatusBadge tone={statusMeta.tone} label={statusMeta.label} />
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            {eoApplication?.status === 'PENDING' ? (
                                <div className="space-y-5">
                                    <FlashBanner
                                        tone="warning"
                                        title="Pengajuanmu Sedang Ditinjau oleh Tim Admin"
                                        message={`Dikirim pada ${eoApplication.createdAt}. Setelah pengajuan disetujui, akunmu akan otomatis beralih menjadi Event Organizer dan memperoleh akses ke Creator Studio EO.`}
                                    />

                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <InfoField
                                            label="Nama Organisasi / EO"
                                            value={eoApplication.organizationName}
                                        />
                                        <InfoField
                                            label="Nomor WhatsApp PIC"
                                            value={eoApplication.contactPhone}
                                        />
                                        <InfoField
                                            label="Tautan Portofolio / Sosmed"
                                            value={eoApplication.portfolioUrl || '-'}
                                        />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-slate-500">
                                            Deskripsi &amp; Rencana Event
                                        </p>
                                        <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                            {eoApplication.reason}
                                        </div>
                                    </div>

                                    {eoApplication.documentUrl && (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-center gap-3">
                                                <FileCheck2
                                                    className="size-5 text-slate-500 shrink-0"
                                                    aria-hidden="true"
                                                />
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        Berkas Verifikasi Identitas &amp; Legalitas
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Tautan aman (Pre-signed URL) berlaku selama 15 menit
                                                    </p>
                                                </div>
                                            </div>
                                            <a
                                                href={eoApplication.documentUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={buttonClass('outline', 'sm')}
                                            >
                                                <span>Lihat Berkas</span>
                                                <ExternalLink
                                                    className="size-3.5 text-slate-400"
                                                    aria-hidden="true"
                                                />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {eoApplication?.status === 'REJECTED' && (
                                        <FlashBanner
                                            tone="error"
                                            title="Pengajuan Sebelumnya Belum Disetujui"
                                            message={`Catatan Admin: ${eoApplication.rejectionReason}. Silakan perbarui data atau berkas verifikasi di bawah ini untuk mengajukan ulang.`}
                                        />
                                    )}

                                    <FlashBanner
                                        tone="info"
                                        message={`Pengajuan terdaftar atas akun ${user.name} (${user.email}). Pastikan data PIC dan berkas verifikasi sesuai agar proses review Admin berjalan cepat.`}
                                    />

                                    <form onSubmit={handleEoApplicationSubmit} className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label
                                                    htmlFor="eo_organization_name"
                                                    className="block text-xs font-medium text-slate-700"
                                                >
                                                    Nama Organisasi / Komunitas / Promotor{' '}
                                                    <span className="text-rose-600">*</span>
                                                </label>
                                                <input
                                                    id="eo_organization_name"
                                                    type="text"
                                                    required
                                                    value={eoForm.data.organization_name}
                                                    onChange={(e) =>
                                                        eoForm.setData(
                                                            'organization_name',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Contoh: Himpunan Mahasiswa Informatika / Nusantara Live"
                                                    className={INPUT_CLASS}
                                                />
                                                {eoForm.errors.organization_name && (
                                                    <p
                                                        role="alert"
                                                        className="mt-1 text-xs text-rose-600"
                                                    >
                                                        {eoForm.errors.organization_name}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="eo_contact_phone"
                                                    className="block text-xs font-medium text-slate-700"
                                                >
                                                    Nomor WhatsApp Penanggung Jawab (PIC){' '}
                                                    <span className="text-rose-600">*</span>
                                                </label>
                                                <input
                                                    id="eo_contact_phone"
                                                    type="text"
                                                    required
                                                    value={eoForm.data.contact_phone}
                                                    onChange={(e) =>
                                                        eoForm.setData(
                                                            'contact_phone',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Contoh: 081234567890"
                                                    className={INPUT_CLASS}
                                                />
                                                {eoForm.errors.contact_phone && (
                                                    <p
                                                        role="alert"
                                                        className="mt-1 text-xs text-rose-600"
                                                    >
                                                        {eoForm.errors.contact_phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label
                                                    htmlFor="eo_portfolio_url"
                                                    className="block text-xs font-medium text-slate-700"
                                                >
                                                    Tautan Media Sosial / Portofolio{' '}
                                                    <span className="text-slate-400 font-normal">
                                                        (Opsional)
                                                    </span>
                                                </label>
                                                <input
                                                    id="eo_portfolio_url"
                                                    type="url"
                                                    value={eoForm.data.portfolio_url}
                                                    onChange={(e) =>
                                                        eoForm.setData(
                                                            'portfolio_url',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="https://instagram.com/nama.organisasi"
                                                    className={INPUT_CLASS}
                                                />
                                                {eoForm.errors.portfolio_url && (
                                                    <p
                                                        role="alert"
                                                        className="mt-1 text-xs text-rose-600"
                                                    >
                                                        {eoForm.errors.portfolio_url}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="eo_document"
                                                    className="block text-xs font-medium text-slate-700"
                                                >
                                                    Berkas Verifikasi Gabungan (KTP/KTM &amp; Legalitas){' '}
                                                    <span className="text-rose-600">*</span>
                                                </label>
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <label
                                                        htmlFor="eo_document"
                                                        className="flex w-full h-10 cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-xs text-slate-600 hover:border-brand-blue hover:bg-white transition"
                                                    >
                                                        <span className="flex items-center gap-2 truncate">
                                                            <FileUp
                                                                className="size-4 text-slate-500 shrink-0"
                                                                aria-hidden="true"
                                                            />
                                                            <span className="truncate font-medium">
                                                                {eoForm.data.document
                                                                    ? eoForm.data.document.name
                                                                    : 'Pilih PDF / JPG / PNG (Maks 5 MB)'}
                                                            </span>
                                                        </span>
                                                        <span className="ml-2 shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
                                                            Pilih
                                                        </span>
                                                    </label>
                                                    <input
                                                        id="eo_document"
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) =>
                                                            eoForm.setData(
                                                                'document',
                                                                e.target.files?.[0] || null
                                                            )
                                                        }
                                                        className="sr-only"
                                                    />
                                                </div>
                                                {eoForm.errors.document && (
                                                    <p
                                                        role="alert"
                                                        className="mt-1 text-xs text-rose-600"
                                                    >
                                                        {eoForm.errors.document}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="eo_reason"
                                                className="block text-xs font-medium text-slate-700"
                                            >
                                                Deskripsi Organisasi &amp; Rencana Event{' '}
                                                <span className="text-rose-600">*</span>
                                            </label>
                                            <textarea
                                                id="eo_reason"
                                                rows={4}
                                                required
                                                value={eoForm.data.reason}
                                                onChange={(e) =>
                                                    eoForm.setData('reason', e.target.value)
                                                }
                                                placeholder="Jelaskan secara singkat profil organisasimu dan jenis event apa yang ingin diselenggarakan di Hajirin (minimal 20 karakter)..."
                                                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                                            />
                                            {eoForm.errors.reason && (
                                                <p role="alert" className="mt-1 text-xs text-rose-600">
                                                    {eoForm.errors.reason}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                                            <p className="text-xs text-slate-500">
                                                Berkas disimpan di Private Storage dan hanya dapat diakses Admin melalui Pre-signed URL.
                                            </p>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                size="md"
                                                loading={eoForm.processing}
                                                className="shrink-0"
                                            >
                                                <Building2 className="size-4" aria-hidden="true" />
                                                <span>
                                                    {eoForm.processing
                                                        ? 'Mengirim Pengajuan...'
                                                        : eoApplication?.status === 'REJECTED'
                                                          ? 'Kirim Ulang Pengajuan EO'
                                                          : 'Kirim Pengajuan EO'}
                                                </span>
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </Card>
                </main>

                <EmailVerificationModal
                    open={isVerifyModalOpen}
                    onClose={() => setIsVerifyModalOpen(false)}
                    email={user.email}
                />
            </div>
        </>
    );
}

function InfoField({ label, value }) {
    return (
        <div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900">
                <span className="truncate block">{value}</span>
            </div>
        </div>
    );
}
