import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
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
            registerForm.setError('terms', 'Harap setujui Syarat & Ketentuan');
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onClose={onClose} className="p-6 sm:p-7">
                <style>{`
                    @keyframes tabFadeSlide {
                        0% {
                            opacity: 0;
                            transform: translateY(8px);
                        }
                        100% {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .tab-enter {
                        animation: tabFadeSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}</style>

                {/* Logo & Header */}
                <div className="flex items-center space-x-2.5 mb-5">
                    <img src="/hajirin_icon.svg" alt="Hajirin" className="h-7 w-auto" />
                    <span className="font-extrabold text-xl tracking-tight text-[#0D1B2A]">HAJIRIN</span>
                </div>

                {/* Switcher Tab Segmented Control */}
                <div className="flex bg-gray-100/90 p-1 rounded-xl mb-6 text-sm font-medium border border-gray-200/50">
                    <button
                        type="button"
                        onClick={() => handleSwitchView('login')}
                        className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 cursor-pointer select-none text-xs sm:text-sm ${
                            view === 'login'
                                ? 'bg-white text-gray-900 shadow-sm font-bold'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Masuk
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSwitchView('register')}
                        className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 cursor-pointer select-none text-xs sm:text-sm ${
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
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Selamat Datang Kembali</h3>
                                <p className="text-xs text-gray-500">Masukkan detail akunmu untuk melanjutkan</p>
                            </div>

                            {/* Email */}
                            <div>
                                <Label htmlFor="login-email">Alamat Email</Label>
                                <InputGroup
                                    id="login-email"
                                    icon={Mail}
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={loginForm.data.email}
                                    onChange={(e) => loginForm.setData('email', e.target.value)}
                                    required
                                    autoFocus
                                    error={!!loginForm.errors.email}
                                />
                                {loginForm.errors.email && (
                                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                                        <AlertCircle className="w-3 h-3" />
                                        {loginForm.errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <Label htmlFor="login-password" className="mb-0">Kata Sandi</Label>
                                </div>
                                <InputGroup
                                    id="login-password"
                                    icon={Lock}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Masukkan kata sandi"
                                    value={loginForm.data.password}
                                    onChange={(e) => loginForm.setData('password', e.target.value)}
                                    required
                                    error={!!loginForm.errors.password}
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-1 rounded text-gray-400 hover:text-gray-700 transition focus:outline-none"
                                            tabIndex={-1}
                                            aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                                {loginForm.errors.password && (
                                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                                        <AlertCircle className="w-3 h-3" />
                                        {loginForm.errors.password}
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
                                    {!loginForm.processing && <ArrowRight className="w-4 h-4" />}
                                </Button>
                            </div>

                            {/* Footer switch */}
                            <div className="pt-2 text-center text-xs text-gray-500">
                                Belum punya akun Hajirin?{' '}
                                <button
                                    type="button"
                                    onClick={() => handleSwitchView('register')}
                                    className="text-[#1D4ED8] font-bold hover:underline cursor-pointer"
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
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Buat Akun Baru</h3>
                                <p className="text-xs text-gray-500">Daftar sekarang untuk mulai pesan tiket event seru</p>
                            </div>

                            {/* Name */}
                            <div>
                                <Label htmlFor="reg-name">Nama Lengkap</Label>
                                <InputGroup
                                    id="reg-name"
                                    icon={User}
                                    type="text"
                                    placeholder="Nama lengkap kamu"
                                    value={registerForm.data.name}
                                    onChange={(e) => registerForm.setData('name', e.target.value)}
                                    required
                                    autoFocus
                                    error={!!registerForm.errors.name}
                                />
                                {registerForm.errors.name && (
                                    <p className="text-[11px] text-red-500 mt-1 font-medium">{registerForm.errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <Label htmlFor="reg-email">Alamat Email</Label>
                                <InputGroup
                                    id="reg-email"
                                    icon={Mail}
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={registerForm.data.email}
                                    onChange={(e) => registerForm.setData('email', e.target.value)}
                                    required
                                    error={!!registerForm.errors.email}
                                />
                                {registerForm.errors.email && (
                                    <p className="text-[11px] text-red-500 mt-1 font-medium">{registerForm.errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <Label htmlFor="reg-password">Kata Sandi</Label>
                                <InputGroup
                                    id="reg-password"
                                    icon={Lock}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Minimal 8 karakter"
                                    value={registerForm.data.password}
                                    onChange={(e) => registerForm.setData('password', e.target.value)}
                                    required
                                    error={!!registerForm.errors.password}
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-1 rounded text-gray-400 hover:text-gray-700 transition focus:outline-none"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                                {registerForm.errors.password && (
                                    <p className="text-[11px] text-red-500 mt-1 font-medium">{registerForm.errors.password}</p>
                                )}
                            </div>

                            {/* Password Confirmation */}
                            <div>
                                <Label htmlFor="reg-password-confirm">Konfirmasi Kata Sandi</Label>
                                <InputGroup
                                    id="reg-password-confirm"
                                    icon={Lock}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Ulangi kata sandi"
                                    value={registerForm.data.password_confirmation}
                                    onChange={(e) => registerForm.setData('password_confirmation', e.target.value)}
                                    required
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="p-1 rounded text-gray-400 hover:text-gray-700 transition focus:outline-none"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                                        Saya menyetujui <a href="#" className="text-[#1D4ED8] font-medium hover:underline">Ketentuan Layanan</a> & <a href="#" className="text-[#1D4ED8] font-medium hover:underline">Kebijakan Privasi</a>
                                    </label>
                                </div>
                                {registerForm.errors.terms && (
                                    <p className="text-[11px] text-red-500 mt-1 font-medium">{registerForm.errors.terms}</p>
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
                                    {!registerForm.processing && <ArrowRight className="w-4 h-4" />}
                                </Button>
                            </div>

                            {/* Footer switch */}
                            <div className="pt-2 text-center text-xs text-gray-500">
                                Sudah memiliki akun?{' '}
                                <button
                                    type="button"
                                    onClick={() => handleSwitchView('login')}
                                    className="text-[#1D4ED8] font-bold hover:underline cursor-pointer"
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
