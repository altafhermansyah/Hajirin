import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import CheckInWorkspace from '../../Components/CheckInWorkspace';
import NotificationBell from '../../Components/NotificationBell';
import LogoutConfirmDialog from '../../Components/LogoutConfirmDialog';
import { eoButtonClass } from '../../Components/eo/Primitives';
import { ArrowLeft, LogOut } from 'lucide-react';

export default function StaffCheckIn({
    events = [],
    selectedEventId = '',
    searchQuery = '',
    searchResults = [],
    stats = {},
    recentCheckIns = [],
    checkinResult = null,
    backUrl = '/dashboard',
}) {
    const { auth } = usePage().props;
    const user = auth?.user || { name: 'Staff Event', email: '' };
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);

    return (
        <div className="min-h-dvh bg-gray-50 text-gray-900 font-sans flex flex-col">
            <Head title="Portal Check-in Staff - Hajirin" />

            <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <Link href={backUrl} className="flex items-center gap-2.5 shrink-0">
                        <img src="/hajirin_icon.svg" alt="Hajirin" className="h-7 w-auto" />
                        <div className="leading-tight">
                            <span className="text-sm font-semibold text-gray-900 block">
                                Hajirin
                            </span>
                            <span className="text-xs text-gray-500 block">
                                Portal Staff Check-in
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <NotificationBell />

                    <div className="hidden sm:block text-right leading-tight">
                        <p className="text-sm font-medium text-gray-900 max-w-44 truncate">
                            {user.name}
                        </p>
                        <p className="text-xs text-gray-500">Staff Check-in</p>
                    </div>

                    <Link href={backUrl} className={eoButtonClass('outline', 'sm')}>
                        <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                        <span className="hidden sm:inline">Kembali</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsLogoutOpen(true)}
                        className={`${eoButtonClass('outline', 'sm')} cursor-pointer`}
                        title="Keluar Akun"
                        aria-label="Keluar Akun"
                    >
                        <LogOut className="size-3.5 text-gray-500" strokeWidth={1.75} aria-hidden="true" />
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </div>
            </header>

            <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
                <CheckInWorkspace
                    endpoint="/staff/check-in"
                    heading="Portal Check-in Staff"
                    description="Verifikasi kehadiran peserta khusus untuk event yang ditugaskan kepada Anda."
                    events={events}
                    selectedEventId={selectedEventId}
                    searchQuery={searchQuery}
                    searchResults={searchResults}
                    stats={stats}
                    recentCheckIns={recentCheckIns}
                    checkinResult={checkinResult}
                />
            </main>

            <footer className="px-6 py-4 border-t border-gray-200 bg-white text-xs text-gray-500 mt-auto">
                <p>© 2026 Hajirin - Portal Verifikasi Kehadiran Staff Event.</p>
            </footer>

            <LogoutConfirmDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen} />
        </div>
    );
}
