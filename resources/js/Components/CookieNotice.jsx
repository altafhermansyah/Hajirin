import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Cookie } from 'lucide-react';
import { Button } from './ui/Button';

const STORAGE_KEY = 'hajirin_cookie_notice_v1';

export default function CookieNotice() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            if (window.localStorage.getItem(STORAGE_KEY) !== 'accepted') {
                setIsVisible(true);
            }
        } catch {
            // Abaikan jika localStorage tidak tersedia
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        try {
            window.localStorage.setItem(STORAGE_KEY, 'accepted');
        } catch {
            // Abaikan jika localStorage tidak tersedia
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <aside
            role="region"
            aria-label="Pemberitahuan cookie"
            className="print:hidden fixed left-3 right-3 bottom-20 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md z-40 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-4 shadow-lg"
        >
            <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                    <Cookie className="size-4.5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1 space-y-2.5">
                    <p className="text-xs leading-relaxed text-slate-600">
                        Hajirin memakai cookie penting untuk menjaga sesi masuk dan keamanan formulir Anda, tanpa pelacak iklan pihak ketiga.{' '}
                        <Link
                            href="/kebijakan-privasi#cookie"
                            className="font-medium text-brand-blue hover:underline"
                        >
                            Pelajari lebih lanjut
                        </Link>
                    </p>
                    <div className="flex items-center justify-end">
                        <Button type="button" variant="primary" size="sm" onClick={handleDismiss}>
                            Mengerti
                        </Button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
