import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import EoLayout from '../../Layouts/EoLayout';
import {
    Card,
    CardHeader,
    EoButton,
    StatusBadge,
} from '../../Components/eo/Primitives';

export default function EoProfile({
    organizerName = '',
    profile = {},
}) {
    const { flash } = usePage().props;

    const { data, setData, put, processing, errors } = useForm({
        organization_name: profile.organizationName || '',
        contact_phone: profile.contactPhone || '',
        portfolio_url: profile.portfolioUrl || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put('/eo/profile', {
            preserveScroll: true,
        });
    };

    return (
        <EoLayout title="Profil Organisasi" organizerName={organizerName}>
            {flash?.success && (
                <Card
                    role="status"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-900"
                >
                    <span
                        className="size-2 shrink-0 rounded-full bg-green-600"
                        aria-hidden="true"
                    />
                    <p className="font-medium">{flash.success}</p>
                </Card>
            )}

            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Profil Organisasi
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                    Kelola identitas penyelenggara yang tampil pada halaman event publik dan kontak PIC resmi Anda.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
                {/* Form Informasi Organisasi */}
                <Card as="section" className="overflow-hidden">
                    <CardHeader
                        title="Identitas Organisasi"
                        description="Perubahan akan langsung diperbarui pada halaman event milik organisasi Anda."
                    />

                    <form
                        action="/eo/profile"
                        method="POST"
                        onSubmit={handleSubmit}
                        className="p-5 sm:p-6 space-y-5"
                    >
                        <fieldset className="space-y-4">
                            <legend className="sr-only">
                                Formulir identitas dan kontak resmi penyelenggara
                            </legend>

                            <div>
                                <label
                                    htmlFor="organization_name"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Nama organisasi / brand EO <span className="text-red-600">*</span>
                                </label>
                                <input
                                    id="organization_name"
                                    name="organization_name"
                                    type="text"
                                    required
                                    maxLength={150}
                                    autoComplete="organization"
                                    value={data.organization_name}
                                    onChange={(e) => setData('organization_name', e.target.value)}
                                    aria-describedby="organization_name_help"
                                    className="mt-1.5 w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                                />
                                <p id="organization_name_help" className="mt-1 text-xs text-gray-500">
                                    Nama ini tampil sebagai penyelenggara resmi di setiap halaman detail event.
                                </p>
                                {errors.organization_name && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {errors.organization_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="contact_phone"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Kontak PIC / WhatsApp <span className="text-red-600">*</span>
                                </label>
                                <input
                                    id="contact_phone"
                                    name="contact_phone"
                                    type="tel"
                                    required
                                    maxLength={25}
                                    autoComplete="tel"
                                    inputMode="tel"
                                    value={data.contact_phone}
                                    onChange={(e) => setData('contact_phone', e.target.value)}
                                    placeholder="0812xxxxxxxx"
                                    className="mt-1.5 w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 tabular-nums placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                                />
                                {errors.contact_phone && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {errors.contact_phone}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="portfolio_url"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Tautan portofolio atau media sosial
                                </label>
                                <input
                                    id="portfolio_url"
                                    name="portfolio_url"
                                    type="url"
                                    maxLength={255}
                                    autoComplete="url"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    value={data.portfolio_url}
                                    onChange={(e) => setData('portfolio_url', e.target.value)}
                                    aria-describedby="portfolio_url_help"
                                    placeholder="https://instagram.com/organisasi"
                                    className="mt-1.5 w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                                />
                                <p id="portfolio_url_help" className="mt-1 text-xs text-gray-500">
                                    Opsional. Sertakan protokol https:// jika mencantumkan situs atau akun media sosial resmi.
                                </p>
                                {errors.portfolio_url && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {errors.portfolio_url}
                                    </p>
                                )}
                            </div>
                        </fieldset>

                        <div className="flex items-center justify-end border-t border-gray-200 pt-4">
                            <EoButton
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={processing}
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </EoButton>
                        </div>
                    </form>
                </Card>

                {/* Akun PIC & Verifikasi */}
                <Card as="section" className="overflow-hidden">
                    <CardHeader
                        title="Akun & Verifikasi"
                        description="Data akun penanggung jawab dan status verifikasi organizer."
                    />

                    <div className="px-5 py-2">
                        <dl className="divide-y divide-gray-200 text-sm">
                            <div className="py-3 flex items-baseline justify-between gap-4">
                                <dt className="text-gray-500">Status</dt>
                                <dd>
                                    <StatusBadge tone="success" label="Terverifikasi" />
                                </dd>
                            </div>

                            <div className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                <dt className="text-gray-500">Penanggung jawab</dt>
                                <dd className="font-medium text-gray-900 sm:text-right">
                                    {profile.accountName || '-'}
                                </dd>
                            </div>

                            <div className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                <dt className="text-gray-500">Email akun</dt>
                                <dd className="font-medium text-gray-900 sm:text-right truncate">
                                    {profile.accountEmail || '-'}
                                </dd>
                            </div>

                            <div className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                <dt className="text-gray-500">Disetujui sejak</dt>
                                <dd className="font-medium text-gray-900 sm:text-right">
                                    {profile.verifiedAt || '-'}
                                </dd>
                            </div>
                        </dl>

                        {profile.reason && (
                            <div className="border-t border-gray-200 py-3">
                                <p className="text-xs font-medium text-gray-500">
                                    Catatan pengajuan awal
                                </p>
                                <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                                    {profile.reason}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </EoLayout>
    );
}
