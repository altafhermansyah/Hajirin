import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function ResetPassword({ token = '', email = '' }) {
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post('/reset-password', {
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Atur Ulang Kata Sandi - Hajirin" />

            <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col items-center justify-center px-4 py-12">
                <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
                    <img src="/hajirin_icon.svg" alt="Hajirin" className="h-8 w-auto" />
                    <span className="text-xl font-extrabold tracking-tight text-navy">HAJIRIN</span>
                </Link>

                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm space-y-5">
                    <div className="space-y-1.5">
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                            Atur Ulang Kata Sandi
                        </h1>
                        <p className="text-sm text-slate-500">
                            Buat kata sandi baru minimal 8 karakter untuk mengamankan akun Anda.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="reset-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Alamat Email
                            </label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
                                <input
                                    id="reset-email"
                                    name="email"
                                    type="email"
                                    autoComplete="username"
                                    spellCheck={false}
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    required
                                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
                                />
                            </div>
                            {form.errors.email && (
                                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
                                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                                    <span>{form.errors.email}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="reset-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Kata Sandi Baru
                            </label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
                                <input
                                    id="reset-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    enterKeyHint="next"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    required
                                    minLength={8}
                                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {form.errors.password && (
                                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
                                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                                    <span>{form.errors.password}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="reset-password-confirmation" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Konfirmasi Kata Sandi Baru
                            </label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
                                <input
                                    id="reset-password-confirmation"
                                    name="password_confirmation"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    enterKeyHint="done"
                                    value={form.data.password_confirmation}
                                    onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                    placeholder="Ulangi kata sandi baru"
                                    required
                                    minLength={8}
                                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="w-full h-11 rounded-xl bg-brand-blue text-sm font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-60 transition cursor-pointer"
                        >
                            {form.processing ? 'Menyimpan Kata Sandi...' : 'Simpan Kata Sandi Baru'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
