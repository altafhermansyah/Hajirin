import React, { useState, useEffect, useId } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Dialog, DialogContent } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { InputGroup } from '../ui/Input';
import { Label } from '../ui/Label';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthModal({
    isOpen,
    onClose,
    initialView = 'login', // 'login' | 'register'
    onSuccess,
}) {
    const [view, setView] = useState(initialView);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const titleId = useId();

    const loginForm = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const registerForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (isOpen) {
            setView(initialView);
            loginForm.clearErrors();
            registerForm.clearErrors();
        }
    }, [isOpen, initialView]);

    const handleSwitchView = (newView) => {
        if (newView === view) return;
        setView(newView);
        loginForm.clearErrors();
        registerForm.clearErrors();
    };

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        loginForm.post('/login', {
            preserveScroll: true,
            onSuccess: () => {
                loginForm.reset('password');
                onClose();
                onSuccess?.();
            },
        });
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        if (!agreedToTerms) {
            registerForm.setError('terms', 'Harap setujui Ketentuan Layanan dan Kebijakan Privasi.');
            return;
        }

        registerForm.post('/register', {
            preserveScroll: true,
            onSuccess: () => {
                registerForm.reset('password', 'password_confirmation');
                onClose();
                onSuccess?.();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} ariaLabelledBy={titleId}>
            <DialogContent onClose={onClose} className="p-6 sm:p-7">
                {/* Logo & Header */}
                <div className="flex items-center gap-2.5 mb-5">
                    <img src="/hajirin_icon.svg" alt="Hajirin" className="h-7 w-auto" />
                    <span className="font-extrabold text-xl tracking-tight text-[#0D1B2A]">HAJIRIN</span>
                </div>

                {/* Switcher Tab Segmented Control */}
                <div
                    role="tablist"
                    aria-label="Pilih masuk atau daftar akun"
                    className="flex bg-gray-100/90 p-1 rounded-xl mb-6 text-sm font-medium border border-gray-200/50"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={view === 'login'}
                        onClick={() => handleSwitchView('login')}
                        className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 cursor-pointer select-none text-xs sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                            view === 'login'
                                ? 'bg-white text-gray-900 shadow-sm font-bold'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Masuk
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={view === 'register'}
                        onClick={() => handleSwitchView('register')}
                        className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 cursor-pointer select-none text-xs sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                            view === 'register'
                                ? 'bg-white text-gray-900 shadow-sm font-bold'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Daftar Akun
                    </button>
                </div>

                {/* VIEW: LOGIN */}
                {view === 'login' && (
                    <div className="tab-enter">
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div className="mb-1">
                                <h1 id={titleId} className="text-lg font-bold text-gray-900 tracking-tight">
                                    Selamat Datang Kembali
                                </h1>
                                <p className="text-xs text-gray-500">Masukkan detail akunmu untuk melanjutkan</p>
                            </div>

                            {/* Email */}
                            <div>
                                <Label htmlFor="login-email">Alamat Email</Label>
                                <InputGroup
                                    id="login-email"
                                    name="email"
                                    icon={Mail}
                                    type="email"
                                    autoComplete="username"
                                    spellCheck={false}
                                    enterKeyHint="next"
                                    placeholder="nama@email.com"
                                    value={loginForm.data.email}
                                    onChange={(e) => {
                                        loginForm.setData('email', e.target.value);
                                        if (loginForm.errors.email) loginForm.clearErrors('email');
                                    }}
                                    required
                                    autoFocus
                                    aria-invalid={!!loginForm.errors.email}
                                    aria-describedby={loginForm.errors.email ? 'login-email-error' : undefined}
                                    error={!!loginForm.errors.email}
                                />
                                {loginForm.errors.email && (
                                    <p
                                        id="login-email-error"
                                        role="alert"
                                        className="text-[11px] text-red-600 mt-1.5 flex items-start gap-1.5 font-medium leading-snug"
                                    >
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                                        <span>{loginForm.errors.email}</span>
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <Label htmlFor="login-password" className="mb-0">Kata Sandi</Label>
                                    <Link
                                        href="/forgot-password"
                                        onClick={onClose}
                                        className="text-xs font-semibold text-[#1D4ED8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue rounded"
                                    >
                                        Lupa kata sandi?
                                    </Link>
                                </div>
                                <InputGroup
                                    id="login-password"
                                    name="password"
                                    icon={Lock}
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    enterKeyHint="done"
                                    placeholder="Masukkan kata sandi"
                                    value={loginForm.data.password}
                                    onChange={(e) => {
                                        loginForm.setData('password', e.target.value);
                                        if (loginForm.errors.password) loginForm.clearErrors('password');
                                    }}
                                    required
                                    aria-invalid={!!loginForm.errors.password}
                                    aria-describedby={loginForm.errors.password ? 'login-password-error' : undefined}
                                    error={!!loginForm.errors.password}
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="p-1 rounded text-gray-400 hover:text-gray-700 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer"
                                            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" aria-hidden="true" />
                                            ) : (
                                                <Eye className="w-4 h-4" aria-hidden="true" />
                                            )}
                                        </button>
                                    }
                                />
                                {loginForm.errors.password && (
                                    <p
                                        id="login-password-error"
                                        role="alert"
                                        className="text-[11px] text-red-600 mt-1.5 flex items-start gap-1.5 font-medium leading-snug"
                                    >
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                                        <span>{loginForm.errors.password}</span>
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    loading={loginForm.processing}
                                    className="w-full h-11 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <span>Masuk Sekarang</span>
                                    {!loginForm.processing && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
                                </Button>
                            </div>

                            {/* Footer switch */}
                            <div className="pt-2 text-center text-xs text-gray-500">
                                Belum punya akun Hajirin?{' '}
                                <button
                                    type="button"
                                    onClick={() => handleSwitchView('register')}
                                    className="text-[#1D4ED8] font-bold hover:underline cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                                >
                                    Daftar sekarang
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* VIEW: REGISTER */}
                {view === 'register' && (
                    <div className="tab-enter">
                        <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                            <div className="mb-2">
                                <h1 id={titleId} className="text-lg font-bold text-gray-900 tracking-tight">
                                    Buat Akun Baru
                                </h1>
                                <p className="text-xs text-gray-500">Daftar sekarang untuk mulai pesan tiket event seru</p>
                            </div>

                            {/* Name */}
                            <div>
                                <Label htmlFor="reg-name">Nama Lengkap</Label>
                                <InputGroup
                                    id="reg-name"
                                    name="name"
                                    icon={User}
                                    type="text"
                                    autoComplete="name"
                                    enterKeyHint="next"
                                    placeholder="Nama lengkap kamu"
                                    value={registerForm.data.name}
                                    onChange={(e) => registerForm.setData('name', e.target.value)}
                                    required
                                    autoFocus
                                    aria-invalid={!!registerForm.errors.name}
                                    aria-describedby={registerForm.errors.name ? 'reg-name-error' : undefined}
                                    error={!!registerForm.errors.name}
                                />
                                {registerForm.errors.name && (
                                    <p id="reg-name-error" role="alert" className="text-[11px] text-red-600 mt-1 font-medium">
                                        {registerForm.errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <Label htmlFor="reg-email">Alamat Email</Label>
                                <InputGroup
                                    id="reg-email"
                                    name="email"
                                    icon={Mail}
                                    type="email"
                                    autoComplete="username"
                                    spellCheck={false}
                                    enterKeyHint="next"
                                    placeholder="nama@email.com"
                                    value={registerForm.data.email}
                                    onChange={(e) => registerForm.setData('email', e.target.value)}
                                    required
                                    aria-invalid={!!registerForm.errors.email}
                                    aria-describedby={registerForm.errors.email ? 'reg-email-error' : undefined}
                                    error={!!registerForm.errors.email}
                                />
                                {registerForm.errors.email && (
                                    <p id="reg-email-error" role="alert" className="text-[11px] text-red-600 mt-1 font-medium">
                                        {registerForm.errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <Label htmlFor="reg-password">Kata Sandi</Label>
                                <InputGroup
                                    id="reg-password"
                                    name="password"
                                    icon={Lock}
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    enterKeyHint="next"
                                    placeholder="Minimal 8 karakter"
                                    value={registerForm.data.password}
                                    onChange={(e) => registerForm.setData('password', e.target.value)}
                                    required
                                    aria-invalid={!!registerForm.errors.password}
                                    aria-describedby={registerForm.errors.password ? 'reg-password-error' : undefined}
                                    error={!!registerForm.errors.password}
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="p-1 rounded text-gray-400 hover:text-gray-700 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer"
                                            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" aria-hidden="true" />
                                            ) : (
                                                <Eye className="w-4 h-4" aria-hidden="true" />
                                            )}
                                        </button>
                                    }
                                />
                                {registerForm.errors.password && (
                                    <p id="reg-password-error" role="alert" className="text-[11px] text-red-600 mt-1 font-medium">
                                        {registerForm.errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Password Confirmation */}
                            <div>
                                <Label htmlFor="reg-password-confirm">Konfirmasi Kata Sandi</Label>
                                <InputGroup
                                    id="reg-password-confirm"
                                    name="password_confirmation"
                                    icon={Lock}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    enterKeyHint="done"
                                    placeholder="Ulangi kata sandi"
                                    value={registerForm.data.password_confirmation}
                                    onChange={(e) => registerForm.setData('password_confirmation', e.target.value)}
                                    required
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            className="p-1 rounded text-gray-400 hover:text-gray-700 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer"
                                            aria-label={
                                                showConfirmPassword
                                                    ? 'Sembunyikan konfirmasi kata sandi'
                                                    : 'Tampilkan konfirmasi kata sandi'
                                            }
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="w-4 h-4" aria-hidden="true" />
                                            ) : (
                                                <Eye className="w-4 h-4" aria-hidden="true" />
                                            )}
                                        </button>
                                    }
                                />
                            </div>

                            {/* Terms */}
                            <div className="pt-0.5">
                                <div className="flex items-start">
                                    <input
                                        id="reg-terms"
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => {
                                            setAgreedToTerms(e.target.checked);
                                            if (e.target.checked) {
                                                registerForm.clearErrors('terms');
                                            }
                                        }}
                                        className="w-4 h-4 mt-0.5 text-[#1D4ED8] border-gray-300 rounded focus:ring-[#1D4ED8] cursor-pointer"
                                    />
                                    <label htmlFor="reg-terms" className="ml-2 text-xs text-gray-600 cursor-pointer select-none leading-relaxed">
                                        Saya menyetujui{' '}
                                        <a
                                            href="/syarat-ketentuan"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#1D4ED8] font-medium hover:underline"
                                        >
                                            Ketentuan Layanan
                                        </a>{' '}
                                        &amp;{' '}
                                        <a
                                            href="/kebijakan-privasi"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#1D4ED8] font-medium hover:underline"
                                        >
                                            Kebijakan Privasi
                                        </a>
                                    </label>
                                </div>
                                {registerForm.errors.terms && (
                                    <p role="alert" className="text-[11px] text-red-600 mt-1 font-medium">
                                        {registerForm.errors.terms}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    loading={registerForm.processing}
                                    className="w-full h-11 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <span>Daftar Sekarang</span>
                                    {!registerForm.processing && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
                                </Button>
                            </div>

                            {/* Footer switch */}
                            <div className="pt-2 text-center text-xs text-gray-500">
                                Sudah memiliki akun?{' '}
                                <button
                                    type="button"
                                    onClick={() => handleSwitchView('login')}
                                    className="text-[#1D4ED8] font-bold hover:underline cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                                >
                                    Masuk ke akun
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
