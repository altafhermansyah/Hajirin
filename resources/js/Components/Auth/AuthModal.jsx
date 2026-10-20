import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { InputGroup } from '../ui/Input';
import { Label } from '../ui/Label';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AuthModal({
    isOpen,
    onClose,
    initialView = 'login', // 'login' | 'register'
    onSuccess,
}) {
    const [view, setView] = useState(initialView);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [remember, setRemember] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Sync initial view when modal opens
    useEffect(() => {
        if (isOpen) {
            setView(initialView);
            setErrors({});
            setGeneralError('');
            setSuccessMessage('');
        }
    }, [isOpen, initialView]);

    const handleSwitchView = (newView) => {
        if (newView === view) return;
        setView(newView);
        setErrors({});
        setGeneralError('');
        setSuccessMessage('');
    };

    const getCsrfToken = () => {
        const tokenMeta = document.querySelector('meta[name="csrf-token"]');
        return tokenMeta ? tokenMeta.getAttribute('content') : '';
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setGeneralError('');
        setSuccessMessage('');

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    email,
                    password,
                    remember,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                } else {
                    setGeneralError(data.message || 'Email atau kata sandi tidak cocok.');
                }
                setLoading(false);
                return;
            }

            setSuccessMessage('Berhasil masuk! Mengalihkan...');
            if (onSuccess) {
                onSuccess(data.user);
            }

            setTimeout(() => {
                window.location.reload();
            }, 800);
        } catch (err) {
            setGeneralError('Terjadi gangguan koneksi. Silakan coba kembali.');
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!agreedToTerms) {
            setErrors(prev => ({ ...prev, terms: ['Harap setujui Syarat & Ketentuan'] }));
            return;
        }

        setLoading(true);
        setErrors({});
        setGeneralError('');
        setSuccessMessage('');

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                } else {
                    setGeneralError(data.message || 'Gagal mendaftar. Periksa data Anda.');
                }
                setLoading(false);
                return;
            }

            setSuccessMessage('Pendaftaran berhasil! Mengalihkan...');
            if (onSuccess) {
                onSuccess(data.user);
            }

            setTimeout(() => {
                window.location.reload();
            }, 800);
        } catch (err) {
            setGeneralError('Terjadi kesalahan server saat mendaftar.');
            setLoading(false);
        }
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
                        className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 cursor-pointer select-none text-xs sm:text-sm ${view === 'login'
                                ? 'bg-white text-gray-900 shadow-sm font-bold'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Masuk
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSwitchView('register')}
                        className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 cursor-pointer select-none text-xs sm:text-sm ${view === 'register'
                                ? 'bg-white text-gray-900 shadow-sm font-bold'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Daftar Akun
                    </button>
                </div>

                {/* Alerts */}
                {generalError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start space-x-2.5 text-xs text-red-600">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{generalError}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start space-x-2.5 text-xs text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{successMessage}</span>
                    </div>
                )}

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
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    error={!!errors.email}
                                />
                                {errors.email && (
                                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.email[0]}
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    error={!!errors.password}
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
                                {errors.password && (
                                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.password[0]}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    loading={loading}
                                    className="w-full h-11 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <span>Masuk Sekarang</span>
                                    {!loading && <ArrowRight className="w-4 h-4" />}
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
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                    error={!!errors.name}
                                />
                                {errors.name && (
                                    <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.name[0]}</p>
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
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    error={!!errors.email}
                                />
                                {errors.email && (
                                    <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.email[0]}</p>
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    error={!!errors.password}
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
                                {errors.password && (
                                    <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.password[0]}</p>
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
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
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
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="w-4 h-4 mt-0.5 text-[#1D4ED8] border-gray-300 rounded focus:ring-[#1D4ED8] cursor-pointer"
                                    />
                                    <label htmlFor="reg-terms" className="ml-2 text-xs text-gray-600 cursor-pointer select-none leading-relaxed">
                                        Saya menyetujui <a href="#" className="text-[#1D4ED8] font-medium hover:underline">Ketentuan Layanan</a> & <a href="#" className="text-[#1D4ED8] font-medium hover:underline">Kebijakan Privasi</a>
                                    </label>
                                </div>
                                {errors.terms && (
                                    <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.terms[0]}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    loading={loading}
                                    className="w-full h-11 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <span>Daftar Sekarang</span>
                                    {!loading && <ArrowRight className="w-4 h-4" />}
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
