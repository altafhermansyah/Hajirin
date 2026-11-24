import React, { useEffect, useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import EoLayout from '../../Layouts/EoLayout';
import {
    Card,
    CardHeader,
    EoButton,
    eoButtonClass,
    NativeModal,
    StatusBadge,
} from '../../Components/eo/Primitives';
import { QrCode, UserCheck, UserPlus } from 'lucide-react';

export default function EoStaff({
    organizerName = '',
    events = [],
    assignableEvents = [],
    selectedEventId = '',
    staffList = [],
}) {
    const { flash } = usePage().props;
    const [revokingStaff, setRevokingStaff] = useState(null);
    const [isRevoking, setIsRevoking] = useState(false);

    const defaultAssignEventId =
        assignableEvents.find((ev) => ev.id === selectedEventId)?.id ||
        assignableEvents[0]?.id ||
        '';

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        event_id: defaultAssignEventId,
        email: '',
    });

    useEffect(() => {
        if (selectedEventId && assignableEvents.some((ev) => ev.id === selectedEventId)) {
            setData('event_id', selectedEventId);
        }
    }, [selectedEventId, assignableEvents]);

    const handleFilterEventChange = (nextEventId) => {
        const query = nextEventId ? { event_id: nextEventId } : {};
        router.get('/eo/staff', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleAssignSubmit = (e) => {
        e.preventDefault();
        clearErrors();

        post('/eo/staff', {
            preserveScroll: true,
            onSuccess: () => {
                reset('email');
            },
        });
    };

    const handleConfirmRevoke = () => {
        if (!revokingStaff) return;

        setIsRevoking(true);
        const query = selectedEventId ? `?event_id=${selectedEventId}` : '';

        router.delete(`/eo/staff/${revokingStaff.id}${query}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsRevoking(false);
                setRevokingStaff(null);
            },
        });
    };

    return (
        <EoLayout title="Staff Event" organizerName={organizerName}>
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

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Staff Event
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Tugaskan akun pengguna terdaftar sebagai petugas check-in khusus untuk event tertentu.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={
                            selectedEventId
                                ? `/eo/check-in?event_id=${selectedEventId}`
                                : '/eo/check-in'
                        }
                        className={eoButtonClass('outline', 'md')}
                    >
                        <QrCode className="size-4" strokeWidth={1.75} aria-hidden="true" />
                        Buka Scanner Check-in
                    </Link>
                </div>
            </div>

            {/* Form Penugasan Staff */}
            <Card as="section" className="overflow-hidden">
                <CardHeader
                    title="Tugaskan Staff Check-in"
                    description="Staff hanya mendapat akses verifikasi e-tiket pada event yang dipilih dan tidak dapat melihat laporan keuangan."
                />

                {assignableEvents.length > 0 ? (
                    <form
                        action="/eo/staff"
                        method="POST"
                        onSubmit={handleAssignSubmit}
                        className="p-5 sm:p-6 space-y-4"
                    >
                        <fieldset className="grid gap-4 md:grid-cols-[1fr_1.2fr_auto] items-start">
                            <legend className="sr-only">
                                Formulir penugasan staff event via email
                            </legend>

                            <div>
                                <label
                                    htmlFor="staff-event-select"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Event <span className="text-red-600">*</span>
                                </label>
                                <select
                                    id="staff-event-select"
                                    name="event_id"
                                    required
                                    value={data.event_id}
                                    onChange={(e) => setData('event_id', e.target.value)}
                                    className="mt-1.5 w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                                >
                                    {assignableEvents.map((ev) => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.title}
                                        </option>
                                    ))}
                                </select>
                                {errors.event_id && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {errors.event_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="staff-email-input"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Email akun panitia <span className="text-red-600">*</span>
                                </label>
                                <input
                                    id="staff-email-input"
                                    name="email"
                                    type="email"
                                    required
                                    maxLength={255}
                                    autoComplete="email"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    aria-describedby="staff-email-help"
                                    placeholder="panitia@contoh.com"
                                    className="mt-1.5 w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                                />
                                <p id="staff-email-help" className="mt-1 text-xs text-gray-500">
                                    Masukkan email lengkap akun yang sudah terdaftar di Hajirin. Petugas otomatis menerima notifikasi tugas.
                                </p>
                                {errors.email && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="md:pt-[26px]">
                                <EoButton
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    disabled={processing}
                                    className="w-full md:w-auto"
                                >
                                    <UserPlus className="size-4" strokeWidth={1.75} aria-hidden="true" />
                                    {processing ? 'Menambahkan...' : 'Tambah Staff'}
                                </EoButton>
                            </div>
                        </fieldset>
                    </form>
                ) : (
                    <div className="p-6 text-center text-sm text-gray-500">
                        Buat event aktif terlebih dahulu sebelum menugaskan staff check-in.
                    </div>
                )}
            </Card>

            {/* Daftar Staff Aktif */}
            <Card as="section" className="overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            Daftar Staff Terdaftar
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Mencabut akses akan langsung menutup Portal Staff tanpa menghapus riwayat check-in historis.
                        </p>
                    </div>

                    <div className="w-full sm:w-64">
                        <label htmlFor="staff-filter-event" className="sr-only">
                            Filter staff berdasarkan event
                        </label>
                        <select
                            id="staff-filter-event"
                            value={selectedEventId || ''}
                            onChange={(e) => handleFilterEventChange(e.target.value)}
                            className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                        >
                            <option value="">Semua event ({staffList.length})</option>
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div
                    tabIndex={0}
                    role="region"
                    aria-labelledby="eo-staff-table-caption"
                    className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                    <table className="w-full text-left text-sm">
                        <caption id="eo-staff-table-caption" className="sr-only">
                            Daftar staff check-in yang ditugaskan pada event organisasi
                        </caption>
                        <thead className="border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-600">
                            <tr>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Petugas
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Event
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Peran
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Tiket diverifikasi
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Ditambahkan
                                </th>
                                <th scope="col" className="py-3 px-5 text-right font-medium">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {staffList.length > 0 ? (
                                staffList.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50/70 transition-colors"
                                    >
                                        <td className="py-3.5 px-5 align-top">
                                            <p className="text-sm font-medium text-gray-900">
                                                {item.userName}
                                            </p>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                {item.userEmail}
                                            </p>
                                            {item.userStatus !== 'ACTIVE' && (
                                                <div className="mt-1">
                                                    <StatusBadge
                                                        tone="danger"
                                                        label="Akun dinonaktifkan"
                                                        className="text-xs"
                                                    />
                                                </div>
                                            )}
                                        </td>

                                        <td className="py-3.5 px-5 align-top">
                                            <p className="text-sm text-gray-900">
                                                {item.eventTitle}
                                            </p>
                                        </td>

                                        <td className="py-3.5 px-5 align-top">
                                            <StatusBadge tone="success" label="Check-in" />
                                        </td>

                                        <td className="py-3.5 px-5 align-top text-sm text-gray-900 tabular-nums">
                                            {item.checkedInCount} tiket
                                        </td>

                                        <td className="py-3.5 px-5 align-top text-xs text-gray-500">
                                            {item.assignedAtFormatted}
                                        </td>

                                        <td className="py-3.5 px-5 align-top text-right">
                                            <EoButton
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => setRevokingStaff(item)}
                                            >
                                                Cabut akses
                                            </EoButton>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 px-5 text-center">
                                        <UserCheck
                                            className="mx-auto size-5 text-gray-400 mb-2"
                                            strokeWidth={1.75}
                                            aria-hidden="true"
                                        />
                                        <p className="text-sm font-medium text-gray-900">
                                            Belum ada staff yang ditugaskan
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Tambahkan panitia melalui formulir di atas agar mereka dapat membantu check-in di Hari-H.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal Konfirmasi Cabut Akses Staff */}
            <NativeModal
                open={Boolean(revokingStaff)}
                onClose={() => !isRevoking && setRevokingStaff(null)}
                titleId="revoke-staff-title"
                title="Konfirmasi Cabut Akses Staff"
            >
                {revokingStaff && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Cabut izin check-in untuk{' '}
                            <span className="font-medium text-gray-900">
                                {revokingStaff.userName}
                            </span>{' '}
                            ({revokingStaff.userEmail}) pada event{' '}
                            <span className="font-medium text-gray-900">
                                {revokingStaff.eventTitle}
                            </span>
                            ?
                        </p>
                        <p className="text-xs text-gray-500">
                            Akses ke Portal Staff akan langsung dihentikan, sedangkan riwayat tiket yang sudah diverifikasi tetap tersimpan.
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <EoButton
                                variant="outline"
                                size="md"
                                disabled={isRevoking}
                                onClick={() => setRevokingStaff(null)}
                            >
                                Batal
                            </EoButton>
                            <EoButton
                                variant="danger"
                                size="md"
                                disabled={isRevoking}
                                onClick={handleConfirmRevoke}
                            >
                                {isRevoking ? 'Mencabut...' : 'Cabut Akses'}
                            </EoButton>
                        </div>
                    </div>
                )}
            </NativeModal>
        </EoLayout>
    );
}
