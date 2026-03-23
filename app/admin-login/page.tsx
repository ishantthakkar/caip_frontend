"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/apiConfig';

export default function AdminLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await fetch(`${API_BASE_URL}admin-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store admin token and info in localStorage
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user || { role: 'admin' }));

                // Redirect to admin dashboard
                router.push('/admin-dashboard');
            } else {
                setError(data.msg || 'Invalid admin credentials');
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
                <div className="bg-agri-green-primary text-white px-8 py-3 rounded-xl mb-8 shadow-2xl border border-white/20">
                    <h1 className="text-lg font-bold tracking-wide">Chamber for Agri Input Protection</h1>
                </div>

                {/* Login Card */}
                <div className="w-full bg-white rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden relative">

                    {error && (
                        <div className="absolute top-0 left-0 right-0 z-50 p-3 bg-red-600 text-white text-[11px] font-bold text-center animate-in fade-in slide-in-from-top duration-300">
                            {error}
                        </div>
                    )}

                    {/* Card Header */}
                    <div className="bg-agri-green-600 p-6 text-center">
                        <h2 className="text-xl font-bold text-white mb-1">Admin Login</h2>
                        <p className="text-white/80 text-[10px] font-medium tracking-tight">
                            Authorized personnel access for CAIP administration.
                        </p>
                    </div>

                    {/* Card Body */}
                    <form onSubmit={handleAdminLogin} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 ml-1">
                                Admin Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter Admin Email"
                                required
                                className="w-full border border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 py-3 px-4 rounded-lg outline-none transition-all text-sm text-gray-600 placeholder:text-gray-300 shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-gray-700">
                                    Password <span className="text-red-500">*</span>
                                </label>
                            </div>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Enter Password"
                                    required
                                    className="w-full border border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 py-3 pl-10 pr-10 rounded-lg outline-none transition-all text-sm text-gray-600 placeholder:text-gray-300 shadow-sm"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" /><circle cx="12" cy="12" r="3" /></svg>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-agri-green-primary hover:bg-agri-green-600 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-green-950/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Verifying...
                                </>
                            ) : 'Sign In'}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="text-[10px] font-bold text-agri-green-primary hover:underline uppercase tracking-wider"
                            >
                                Go to Member Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Footer Bar */}
            <footer className="fixed bottom-0 left-0 right-0 bg-agri-gold-secondary py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
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
