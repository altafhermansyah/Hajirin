import { useEffect, useId, useRef, useState } from 'react';
import { router, usePage, usePoll } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    Building2,
    CheckCheck,
    CheckCircle2,
    RotateCcw,
    Ticket,
    XCircle,
} from 'lucide-react';

const NOTIFICATION_TYPE_META = {
    PAYMENT_SUCCESS: {
        icon: Ticket,
        tone: 'bg-emerald-50 text-emerald-600',
    },
    EO_APPLICATION_UPDATED: {
        icon: Building2,
        tone: 'bg-blue-50 text-blue-600',
    },
    EVENT_APPROVED: {
        icon: CheckCircle2,
        tone: 'bg-emerald-50 text-emerald-600',
    },
    EVENT_REJECTED: {
        icon: XCircle,
        tone: 'bg-rose-50 text-rose-600',
    },
    EVENT_CANCELLED: {
        icon: AlertTriangle,
        tone: 'bg-amber-50 text-amber-600',
    },
    REFUND_UPDATED: {
        icon: RotateCcw,
        tone: 'bg-indigo-50 text-indigo-600',
    },
};

export default function NotificationBell() {
    const { notifications } = usePage().props;
    const [isOpen, setIsOpen] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [readingId, setReadingId] = useState(null);

    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const panelId = useId();

    const unreadCount = notifications?.unreadCount ?? 0;
    const items = notifications?.items ?? [];

    usePoll(
        60000,
        { only: ['notifications'] },
        { autoStart: Boolean(notifications), keepAlive: false }
    );

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        };

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!notifications) {
        return null;
    }

    const handleMarkAllAsRead = () => {
        if (unreadCount === 0 || isMarkingAll) return;

        setIsMarkingAll(true);
        router.post(
            '/notifications/read-all',
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsMarkingAll(false),
            }
        );
    };

    const handleItemClick = (item) => {
        if (readingId) return;

        setReadingId(item.id);
        setIsOpen(false);
        router.post(
            `/notifications/${item.id}/read`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setReadingId(null),
            }
        );
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-label={
                    unreadCount > 0
                        ? `Notifikasi (${unreadCount} belum dibaca)`
                        : 'Notifikasi'
                }
                className="relative flex size-10 sm:size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition cursor-pointer"
                title="Notifikasi"
            >
                <Bell className="size-4.5" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    id={panelId}
                    role="region"
                    aria-label="Daftar notifikasi"
                    className="fixed inset-x-3 top-18 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden"
                >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">Notifikasi</h3>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                    {unreadCount} baru
                                </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                disabled={isMarkingAll}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 cursor-pointer"
                            >
                                <CheckCheck className="size-3.5" aria-hidden="true" />
                                <span>{isMarkingAll ? 'Memproses...' : 'Tandai semua dibaca'}</span>
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                        {items.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <div className="mx-auto mb-2.5 flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                    <Bell className="size-5" aria-hidden="true" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700">
                                    Belum ada notifikasi
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Pembaruan transaksi, event, dan status pengajuan akan muncul di sini.
                                </p>
                            </div>
                        ) : (
                            items.map((item) => {
                                const meta = NOTIFICATION_TYPE_META[item.type] || {
                                    icon: Bell,
                                    tone: 'bg-slate-100 text-slate-600',
                                };
                                const TypeIcon = meta.icon;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleItemClick(item)}
                                        disabled={readingId === item.id}
                                        className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 cursor-pointer ${
                                            item.isRead ? 'bg-white' : 'bg-blue-50/40'
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}
                                        >
                                            <TypeIcon className="size-4" aria-hidden="true" />
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <p
                                                    className={`text-xs leading-snug ${
                                                        item.isRead
                                                            ? 'font-semibold text-slate-700'
                                                            : 'font-bold text-slate-900'
                                                    }`}
                                                >
                                                    {item.title}
                                                </p>
                                                {!item.isRead && (
                                                    <span
                                                        className="mt-1 size-2 shrink-0 rounded-full bg-blue-600"
                                                        aria-label="Belum dibaca"
                                                    />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {item.message}
                                            </p>
                                            <p className="text-[11px] font-medium text-slate-400 pt-0.5">
                                                {item.timeAgo}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
