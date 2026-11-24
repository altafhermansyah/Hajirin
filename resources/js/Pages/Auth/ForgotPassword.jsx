import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

export default function ForgotPassword({ status = null }) {
    const form = useForm({
        email: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post('/forgot-password');
    };

    return (
        <>
            <Head title="Lupa Kata Sandi - Hajirin" />

            <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col items-center justify-center px-4 py-12">
                <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
                    <img src="/hajirin_icon.svg" alt="Hajirin" className="h-8 w-auto" />
                    <span className="text-xl font-extrabold tracking-tight text-navy">HAJIRIN</span>
                </Link>

                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm space-y-5">
                    <div className="space-y-1.5">
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                            Lupa Kata Sandi?
                        </h1>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Masukkan alamat email akun Hajirin Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
                        </p>
                    </div>

                    {status && (
                        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 leading-relaxed">
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{status}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="forgot-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Alamat Email
                            </label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
                                <input
                                    id="forgot-email"
                                    name="email"
                                    type="email"
                                    autoComplete="username"
                                    spellCheck={false}
                                    enterKeyHint="done"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    placeholder="nama@email.com"
                                    required
                                    autoFocus
                                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
                                />
                            </div>
                            {form.errors.email && (
                                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
                                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                                    <span>{form.errors.email}</span>
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="w-full h-11 rounded-xl bg-brand-blue text-sm font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-60 transition cursor-pointer"
                        >
                            {form.processing ? 'Mengirim Tautan...' : 'Kirim Tautan Reset Kata Sandi'}
                        </button>
                    </form>

                    <div className="pt-2 border-t border-slate-100 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-blue transition"
                        >
                            <ArrowLeft className="size-3.5" aria-hidden="true" />
                            <span>Kembali ke Beranda</span>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
