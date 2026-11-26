import { useEffect, useId, useRef, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { CheckCircle2, Mail, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Dialog';
import { Button } from '../ui/Button';

export default function EmailVerificationModal({
    open,
    onClose,
    email = '',
    onVerified,
}) {
    const [cooldown, setCooldown] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const [hasSentCode, setHasSentCode] = useState(false);
    const [sendStatus, setSendStatus] = useState(null);
    const inputRef = useRef(null);
    const inputId = useId();
    const hintId = useId();

    const otpForm = useForm({
        code: '',
    });

    useEffect(() => {
        if (!open) return;
        otpForm.clearErrors();
        setSendStatus(null);
    }, [open]);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const timer = window.setInterval(() => {
            setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [cooldown]);

    const handleVerify = (e) => {
        e.preventDefault();
        otpForm.post('/email/otp/verify', {
            preserveScroll: true,
            onSuccess: () => {
                otpForm.reset();
                setHasSentCode(false);
                setSendStatus(null);
                setCooldown(0);
                onVerified?.();
                onClose?.();
            },
        });
    };

    const handleSendCode = () => {
        if (isSending || cooldown > 0) return;

        setIsSending(true);
        setSendStatus(null);
        otpForm.clearErrors();

        router.post(
            '/email/otp/send',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setHasSentCode(true);
                    setCooldown(60);
                    setSendStatus(`Kode verifikasi 6 digit telah dikirim ke ${email}.`);
                    window.setTimeout(() => {
                        inputRef.current?.focus();
                    }, 50);
                },
                onError: (errors) => {
                    if (errors.code) {
                        otpForm.setError('code', errors.code);
                    }
                },
                onFinish: () => setIsSending(false),
            }
        );
    };

    return (
        <Modal
            open={open}
            onClose={() => {
                if (!otpForm.processing && !isSending) onClose?.();
            }}
            title="Verifikasi Alamat Email"
            description="Ikuti 2 langkah singkat berikut untuk memverifikasi akun sebelum checkout tiket atau mendaftar Event Organizer."
            maxWidth="max-w-md"
        >
            <form onSubmit={handleVerify} className="space-y-4">
                {/* Langkah 1: Kirim Kode OTP */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 space-y-3">
                    <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-blue text-[11px] font-semibold text-white">
                            1
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900">
                                Kirim kode OTP ke email akunmu
                            </p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600 truncate">
                                <Mail className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                                <span className="truncate font-medium text-slate-800">{email}</span>
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant={hasSentCode ? 'outline' : 'primary'}
                        size="sm"
                        loading={isSending}
                        disabled={isSending || cooldown > 0}
                        onClick={handleSendCode}
                        className="w-full"
                    >
                        {hasSentCode ? (
                            <RefreshCw
                                className={`size-3.5 ${isSending ? 'animate-spin' : ''}`}
                                aria-hidden="true"
                            />
                        ) : (
                            <Send className="size-3.5" aria-hidden="true" />
                        )}
                        <span>
                            {isSending
                                ? 'Mengirim Kode...'
                                : cooldown > 0
                                  ? `Kirim Ulang Kode (${cooldown}d)`
                                  : hasSentCode
                                    ? 'Kirim Ulang Kode ke Email'
                                    : 'Kirim Kode ke Email'}
                        </span>
                    </Button>

                    {sendStatus && (
                        <p
                            role="status"
                            className="flex items-start gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-medium text-emerald-800"
                        >
                            <CheckCircle2
                                className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                                aria-hidden="true"
                            />
                            <span>{sendStatus} Periksa kotak masuk atau folder spam.</span>
                        </p>
                    )}
                </div>

                {/* Langkah 2: Masukkan Kode OTP */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                            2
                        </span>
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor={inputId}
                                className="block text-xs font-semibold text-slate-900"
                            >
                                Masukkan 6 digit kode verifikasi
                            </label>
                            <p id={hintId} className="mt-0.5 text-xs text-slate-500">
                                Ketik 6 digit angka dari email tanpa spasi (berlaku 10 menit).
                            </p>
                        </div>
                    </div>

                    <input
                        ref={inputRef}
                        id={inputId}
                        name="code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="\d{6}"
                        maxLength={6}
                        required
                        aria-describedby={hintId}
                        aria-invalid={Boolean(otpForm.errors.code)}
                        value={otpForm.data.code}
                        onChange={(e) => {
                            const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                            otpForm.setData('code', digitsOnly);
                            if (otpForm.errors.code) otpForm.clearErrors('code');
                        }}
                        placeholder="000000"
                        className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 text-center font-mono text-xl font-semibold tracking-[0.35em] text-slate-900 placeholder:text-slate-300 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                    />

                    {otpForm.errors.code && (
                        <p role="alert" className="text-xs font-medium text-rose-600">
                            {otpForm.errors.code}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={otpForm.processing || isSending}
                        onClick={() => onClose?.()}
                    >
                        Nanti Saja
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        loading={otpForm.processing}
                        disabled={otpForm.data.code.length !== 6}
                    >
                        <ShieldCheck className="size-4" aria-hidden="true" />
                        <span>Verifikasi Email</span>
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
