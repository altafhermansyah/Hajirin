import React from 'react';
import { Link } from '@inertiajs/react';
import EoLayout from '../../Layouts/EoLayout';
import CheckInWorkspace from '../../Components/CheckInWorkspace';
import { eoButtonClass } from '../../Components/eo/Primitives';
import { UserCheck, Users } from 'lucide-react';

export default function EoCheckIn({
    organizerName,
    events = [],
    selectedEventId = '',
    searchQuery = '',
    searchResults = [],
    stats = {},
    recentCheckIns = [],
    checkinResult = null,
}) {
    return (
        <EoLayout title="Check-in E-Tiket" organizerName={organizerName}>
            <CheckInWorkspace
                endpoint="/eo/check-in"
                heading="Check-in E-Tiket Hari-H"
                description="Pindai QR code, masukkan kode tiket, atau cari nama peserta untuk memverifikasi kehadiran."
                events={events}
                selectedEventId={selectedEventId}
                searchQuery={searchQuery}
                searchResults={searchResults}
                stats={stats}
                recentCheckIns={recentCheckIns}
                checkinResult={checkinResult}
                headerActions={
                    <>
                        <Link
                            href={
                                selectedEventId
                                    ? `/eo/staff?event_id=${selectedEventId}`
                                    : '/eo/staff'
                            }
                            className={eoButtonClass('outline', 'md')}
                        >
                            <UserCheck className="size-4" strokeWidth={1.75} aria-hidden="true" />
                            Staff Event
                        </Link>
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
                    </>
                }
            />
        </EoLayout>
    );
}
