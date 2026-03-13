"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { API_BASE_URL } from '@/config/apiConfig';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [step, setStep] = useState<'enter_mobile' | 'enter_otp'>('enter_mobile');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');

    useEffect(() => {
        // Check if we just redirected from a successful registration
        if (searchParams.get('message') === 'registered') {
            setSuccessMessage('Register successful! Admin will give you approval, then you can login.');
            // Clear the message after 8 seconds
            const timer = setTimeout(() => setSuccessMessage(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep('enter_otp');
                setSuccessMessage('OTP sent successfully (Static OTP: 123456)');
            } else {
                setError(data.msg || 'Invalid mobile number or approval pending');
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                if (data.subMember) {
                    localStorage.setItem('subMember', JSON.stringify(data.subMember));
                    router.push('/dashboard');
                } else if (data.user.membership_status === "1") {
                    router.push('/dashboard');
                } else {
                    router.push('/profile');
                }
            } else {
                setError(data.msg || 'Invalid OTP');
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center font-sans overflow-hidden">
            {/* Background with blurred agriculture and network pattern */}
            <div
                className="absolute inset-0 bg-cover bg-center scale-110 blur-[2px]"
                style={{
                    backgroundImage: 'url("/images/login_bg_final.jpg")',
                    opacity: 0.9
                }}
            />
            {/* Network Pattern Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="absolute inset-0 bg-white/10 pointer-events-none" />

            {/* Main Content Container */}
            <div className="relative z-10 w-full max-w-md flex flex-col items-center px-4 -mt-10">

                {/* Logo */}
                <div className="w-24 h-24 mb-6 drop-shadow-lg scale-100 hover:scale-105 transition-transform duration-500">
                    <img src="/images/caip_logo.png" alt="CAIP Logo" className="w-full h-full object-contain" />
                </div>

                {/* Title Bar */}
                <div className="bg-[#1b5e20] text-white px-8 py-3 rounded-xl mb-8 shadow-2xl border border-white/20">
                    <h1 className="text-lg font-bold tracking-wide text-center">Chamber for Agri Input Protection</h1>
                </div>

                {/* Login Card */}
                <div className="w-full bg-white rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden relative">

                    {error && (
                        <div className="absolute top-0 left-0 right-0 z-50 p-3 bg-red-600 text-white text-[11px] font-bold text-center animate-in fade-in slide-in-from-top duration-300">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="absolute top-0 left-0 right-0 z-50 p-3 bg-green-600 text-white text-[11px] font-bold text-center animate-in fade-in slide-in-from-top duration-300">
                            {successMessage}
                        </div>
                    )}

                    {/* Card Header */}
                    <div className="bg-[#2e7d32] p-6 text-center">
                        <h2 className="text-xl font-bold text-white mb-1">
                            {step === 'enter_mobile' ? 'Member Login' : 'OTP Verification'}
                        </h2>
                        <p className="text-white/80 text-[10px] font-medium tracking-tight">
                            {step === 'enter_mobile' 
                                ? 'Sign in with your mobile number to continue.' 
                                : `Verification code sent to +91 ${phone}`}
                        </p>
                    </div>

                    {/* Card Body */}
                    <div className="p-8">
                        {step === 'enter_mobile' ? (
                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 ml-1">
                                        Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs border-r pr-2 border-gray-100">+91</div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="Enter 10 digit mobile number"
                                            required
                                            className="w-full border border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 py-3 pl-12 pr-4 rounded-lg outline-none transition-all text-sm text-gray-600 placeholder:text-gray-300 shadow-sm font-bold tracking-widest"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || phone.length !== 10}
                                    className={`w-full bg-[#1b5e20] hover:bg-[#2e7d32] text-white font-bold py-3.5 rounded-lg shadow-lg shadow-green-950/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${loading || phone.length !== 10 ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Verifying...
                                        </>
                                    ) : 'Get OTP'}
                                </button>
                                
                                <p className="text-center text-[11px] font-semibold text-gray-500 pt-2">
                                    If you want to become a member, <Link href="/register" className="text-blue-500 hover:underline">Register here</Link>
                                </p>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="space-y-2 text-center">
                                    <label className="text-xs font-bold text-gray-700">Enter 6-Digit OTP</label>
                                    <div className="flex justify-center gap-2 mt-2">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="······"
                                            required
                                            className="w-full max-w-[200px] border border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 py-3 text-center rounded-lg outline-none transition-all text-2xl font-black text-gray-800 tracking-[0.5em] placeholder:text-gray-200 shadow-sm"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold mt-2">Static OTP for Testing: 123456</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className={`w-full bg-[#1b5e20] hover:bg-[#2e7d32] text-white font-bold py-3.5 rounded-lg shadow-lg shadow-green-950/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${loading || otp.length !== 6 ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Verifying OTP...
                                        </>
                                    ) : 'Verify & Login'}
                                </button>

                                <button 
                                    type="button" 
                                    onClick={() => setStep('enter_mobile')}
                                    className="w-full text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors py-2"
                                >
                                    Change Mobile Number
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Bar */}
            <footer className="fixed bottom-0 left-0 right-0 bg-[#ffd600] py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
                <p className="text-xs font-bold text-gray-800 tracking-tight">
                    © 2026 Chamber for Agri Input Protection
                </p>
                <p className="text-xs font-bold text-gray-800 tracking-tight mt-2 md:mt-0">
                    Crafted with ❤️ by <a href="#" className="text-blue-600 hover:underline">Metizsoft Solution Private Limited</a>
                </p>
            </footer>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#2e7d32]">
                <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
