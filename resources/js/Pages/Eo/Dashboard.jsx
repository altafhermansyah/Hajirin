import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import EoLayout from '../../Layouts/EoLayout';
import EoEventsTable from '../../Components/eo/EoEventsTable';
import {
    Card,
    CardHeader,
    eoButtonClass,
    StatCard,
    StatusBadge,
} from '../../Components/eo/Primitives';
import {
    CalendarDays,
    CheckCircle2,
    Plus,
    QrCode,
    Ticket,
    Wallet,
} from 'lucide-react';

export default function EoDashboard({
    organizerProfile = {},
    stats = {},
    myEvents = [],
    recentOrders = [],
}) {
    const { auth, flash } = usePage().props;
    const user = auth?.user || {};

    const occupancyRate =
        stats.totalInitialQuota > 0
            ? Math.min(100, Math.round((stats.ticketsSold / stats.totalInitialQuota) * 100))
            : 0;

    return (
        <EoLayout
            title="Ringkasan Dashboard EO"
            organizerName={organizerProfile.organizationName}
        >
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
                        Dashboard Penyelenggara (EO)
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Pantau penjualan tiket, okupansi kuota, dan publikasi event Anda.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/eo/events/create"
                        className={eoButtonClass('primary', 'md')}
                    >
                        <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
                        Buat Event &amp; Tiket Baru
                    </Link>
                </div>
            </div>

            {/* 4 Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total pendapatan tiket"
                    icon={Wallet}
                    value={stats.formattedRevenue || 'Rp0'}
                    subtext={`Dari ${stats.paidOrdersCount ?? 0} pesanan lunas`}
                />

                <StatCard
                    label="Tiket terjual"
                    icon={Ticket}
                    value={stats.ticketsSold ?? 0}
                    valueSuffix="E-Tiket"
                    subtext={`${stats.ticketsCheckedIn ?? 0} sudah check-in · Sisa ${stats.totalRemainingQuota ?? 0} kuota`}
                />

                <StatCard
                    label="Event diselenggarakan"
                    icon={CalendarDays}
                    value={stats.totalEvents ?? 0}
                    valueSuffix="event"
                    subtext={`${stats.publishedEvents ?? 0} tayang · ${stats.pendingEvents ?? 0} ditinjau · ${stats.draftEvents ?? 0} draft`}
                />

                <StatCard
                    label="Okupansi kapasitas"
                    icon={QrCode}
                    value={`${occupancyRate}%`}
                    valueSuffix="terisi"
                    progress={occupancyRate}
                />
            </div>

            {/* Section: Daftar Event Saya */}
            <EoEventsTable
                myEvents={myEvents}
                stats={stats}
                id="event-saya"
                className="scroll-mt-20"
                captionId="dashboard-events-caption"
            />

            {/* Bottom Grid: Transaksi Terbaru & Profil Organisasi EO */}
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                {/* Transaksi Peserta Terbaru */}
                <Card as="section" id="transaksi" className="overflow-hidden scroll-mt-20">
                    <CardHeader
                        title="Transaksi Pembelian Tiket Terbaru"
                        description="Pesanan tiket masuk dari seluruh event Anda."
                        action={
                            <Link
                                href="/eo/attendees"
                                className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-xs"
                            >
                                Semua peserta →
                            </Link>
                        }
                    />

                    {recentOrders.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-50/70 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-900">
                                            {order.buyerName}{' '}
                                            <span className="font-normal text-xs text-gray-500">
                                                ({order.buyerEmail})
                                            </span>
                                        </p>
                                        <p className="truncate text-xs text-gray-600 mt-0.5">
                                            {order.eventTitle}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Ref:{' '}
                                            <span className="font-mono text-gray-700">
                                                {order.orderReference}
                                            </span>{' '}
                                            · {order.createdAtFormatted}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right flex flex-col items-end gap-1">
                                        <p className="text-sm font-medium text-gray-900 tabular-nums">
                                            {order.formattedAmount}
                                        </p>
                                        <StatusBadge
                                            tone={order.status === 'PAID' ? 'success' : 'warning'}
                                            label={order.status === 'PAID' ? 'Lunas' : order.status}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 px-6 text-center">
                            <Ticket
                                className="mx-auto size-5 text-gray-400 mb-2"
                                strokeWidth={1.75}
                                aria-hidden="true"
                            />
                            <p className="text-sm font-medium text-gray-900">
                                Belum ada transaksi tiket
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Setiap pembelian tiket dari pengunjung akan tampil di sini.
                            </p>
                        </div>
                    )}
                </Card>

                {/* Profil Resmi Organisasi EO */}
                <Card as="section" id="profil-eo" className="overflow-hidden scroll-mt-20">
                    <CardHeader
                        title="Identitas Penyelenggara (EO)"
                        description="Profil resmi yang tampil pada halaman publik acara Anda."
                        action={
                            <Link
                                href="/eo/profile"
                                className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-xs"
                            >
                                Edit profil →
                            </Link>
                        }
                    />
                    <div className="px-5 py-2">
                        <dl className="divide-y divide-gray-200 text-sm">
                            <div className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                <dt className="text-gray-500">Penanggung jawab</dt>
                                <dd className="font-medium text-gray-900 sm:text-right">
                                    {user.name}
                                </dd>
                            </div>

                            <div className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                <dt className="text-gray-500">Email akun</dt>
                                <dd className="font-medium text-gray-900 sm:text-right truncate">
                                    {user.email}
                                </dd>
                            </div>

                            <div className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                <dt className="text-gray-500">Kontak PIC</dt>
                                <dd className="font-medium text-gray-900 tabular-nums sm:text-right">
                                    {organizerProfile.contactPhone || '-'}
                                </dd>
                            </div>

                            <div className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                <dt className="text-gray-500">Portofolio</dt>
                                <dd className="font-medium sm:text-right truncate">
                                    {organizerProfile.portfolioUrl ? (
                                        <a
                                            href={organizerProfile.portfolioUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-xs"
                                        >
                                            Buka tautan ↗
                                        </a>
                                    ) : (
                                        <span className="text-gray-500">-</span>
                                    )}
                                </dd>
                            </div>
                        </dl>

                        <div className="border-t border-gray-200 py-3 flex items-center gap-2 text-xs text-gray-500">
                            <CheckCircle2
                                className="size-4 shrink-0 text-gray-400"
                                strokeWidth={1.75}
                                aria-hidden="true"
                            />
                            <span>
                                Akun Event Organizer terverifikasi
                                {organizerProfile.verifiedAt
                                    ? ` sejak ${organizerProfile.verifiedAt}`
                                    : ''}
                                .
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
        </EoLayout>
    );
}
