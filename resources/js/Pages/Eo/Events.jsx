import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import EoLayout from '../../Layouts/EoLayout';
import EoEventsTable from '../../Components/eo/EoEventsTable';
import { Card, eoButtonClass } from '../../Components/eo/Primitives';
import { Plus } from 'lucide-react';

export default function EoEvents({
    organizerName = '',
    stats = {},
    myEvents = [],
}) {
    const { flash } = usePage().props;

    return (
        <EoLayout title="Event Saya" organizerName={organizerName}>
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
                        Event Saya
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Kelola seluruh event, status publikasi, kuota tiket, dan pengajuan review Anda.
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

            <EoEventsTable
                myEvents={myEvents}
                stats={stats}
                captionId="eo-my-events-caption"
            />
        </EoLayout>
    );
}
