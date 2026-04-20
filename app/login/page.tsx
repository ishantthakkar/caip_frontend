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
                setSuccessMessage('OTP sent successfully');
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
        setSuccessMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp }),
            });

            const data = await response.json();

            if (response.ok) {
                const accessToken = data.access_token || data.token;
                localStorage.setItem('token', accessToken);
                localStorage.setItem('accessToken', accessToken);
                if (data.refresh_token) {
                    localStorage.setItem('refreshToken', data.refresh_token);
                }
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
        <div className="min-h-screen relative flex flex-col font-sans overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url("/images/login_bg_final.jpg")' }}
            />
            {/* Light Overlay to ensure contrast like the reference .bg-overlay */}
            <div className="absolute inset-0 bg-white opacity-50" />

            {/* Carbon Fiber Texture Overlay */}
            <div
                className="absolute inset-0 bg-repeat opacity-20 pointer-events-none"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}
            />

            <div className="container mx-auto px-4 flex-1 flex flex-col pt-12 pb-10 relative z-10">
                <div className="flex-1 flex flex-col items-center justify-center -mt-10">

                    <div className="w-full max-w-md relative z-10">
                        {/* Error & Success Toasts */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-lg text-center shadow-sm animate-in fade-in slide-in-from-top duration-300">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-50 text-agri-green-primary border border-green-200 text-sm font-medium rounded-lg text-center shadow-sm animate-in fade-in slide-in-from-top duration-300">
                                {successMessage}
                            </div>
                        )}

                        {/* Top Header Section */}
                        <div className="mb-6 text-center">
                            <Link href="/" className="inline-block mb-4">
                                <img src="/images/caip_logo.png" alt="CAIP Logo" className="mx-auto h-[70px] drop-shadow-sm" />
                            </Link>

                            <div className="bg-agri-green-primary text-center px-4 py-3.5 rounded-2xl shadow-sm">
                                <h4 className="text-white m-0 font-bold text-lg tracking-wide">Chamber for Agri Input Protection</h4>
                            </div>
                        </div>

                        {/* Form Card */}
                        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden mb-8">
                            {/* Card Header */}
                            <div className="bg-agri-green-primary p-5 text-center">
                                <h5 className="text-white text-xl font-semibold mb-1">
                                    {step === 'enter_mobile' ? 'Member Login' : 'OTP Verification'}
                                </h5>
                                <p className="text-white/80 text-sm m-0">
                                    {step === 'enter_mobile'
                                        ? 'Sign in to continue to Chamber for Agri Input Protection.'
                                        : `Verification code sent to +91 ${phone}`}
                                </p>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 md:p-8">
                                {step === 'enter_mobile' ? (
                                    <form onSubmit={handleSendOtp}>
                                        <div className="mb-5">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mobile Number <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 font-semibold text-sm border-r border-gray-200 bg-gray-50 rounded-l-md">+91</div>
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                    placeholder="Enter Mobile Number"
                                                    required
                                                    autoFocus
                                                    className="w-full pl-16 pr-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agri-green-primary/20 focus:border-agri-green-primary transition-all text-gray-700"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || phone.length !== 10}
                                            className="w-full bg-agri-green-primary text-white font-medium py-2.5 rounded-md hover:bg-agri-green-700 transition-colors disabled:opacity-70 flex justify-center items-center shadow-sm text-sm cursor-pointer"
                                        >
                                            {loading ? (
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            ) : 'Get OTP'}
                                        </button>

                                        <div className="mt-6 text-center">
                                            <p className="text-sm text-gray-600 mb-0">
                                                If you want to become a member,{' '}
                                                <Link href="/register" className="font-medium text-blue-600 hover:underline">
                                                    Register here
                                                </Link>
                                            </p>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleVerifyOtp}>
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                                Enter 6-Digit OTP
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="······"
                                                required
                                                autoFocus
                                                className="w-full text-center tracking-[0.75em] py-3 text-2xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agri-green-primary/20 focus:border-agri-green-primary transition-all text-gray-800"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || otp.length !== 6}
                                            className="w-full bg-agri-green-primary text-white font-medium py-2.5 rounded-md hover:bg-agri-green-700 transition-colors disabled:opacity-70 flex justify-center items-center shadow-sm text-sm mb-4 cursor-pointer"
                                        >
                                            {loading ? (
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            ) : 'Verify & Login'}
                                        </button>

                                        <div className="text-center mt-2">
                                            <button
                                                type="button"
                                                onClick={() => setStep('enter_mobile')}
                                                className="text-sm font-medium text-blue-600 hover:underline"
                                            >
                                                Re-enter Mobile Number
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer block - Pill Shaped */}
                <div className="w-full pt-4 mt-auto z-10">
                    <div className="bg-agri-gold-secondary rounded-xl py-4 px-6 flex flex-col md:flex-row justify-between items-center text-center shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
                        <div className="mb-2 md:mb-0">
                            <p className="m-0 font-bold text-gray-900 text-[13px]">
                                © {new Date().getFullYear()} Chamber for Agri Input Protection
                            </p>
                        </div>
                        <div>
                            <p className="m-0 font-bold text-gray-900 text-[13px]">
                                Crafted with <span className="text-red-600">❤️</span> by <a href="https://www.metizsoft.com/" target="_blank" rel="noreferrer" className="underline hover:text-black transition-colors">Metizsoft Solution Private Limited</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-agri-green-primary">
                <div className="animate-spin h-10 w-10 border-4 border-current border-t-transparent rounded-full"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

