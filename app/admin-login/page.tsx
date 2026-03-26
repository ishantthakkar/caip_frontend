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
        <div className="min-h-screen relative flex flex-col font-sans overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url("/images/login_bg_final.jpg")' }}
            />
            {/* Light Overlay to ensure contrast */}
            <div className="absolute inset-0 bg-white opacity-50" />

            {/* Carbon Fiber Texture Overlay */}
            <div
                className="absolute inset-0 bg-repeat opacity-20 pointer-events-none"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}
            />

            <div className="container mx-auto px-4 flex-1 flex flex-col pt-12 pb-10 relative z-10">
                <div className="flex-1 flex flex-col items-center justify-center -mt-10">

                    <div className="w-full max-w-md relative z-10">
                        {/* Error Toast */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-lg text-center shadow-sm animate-in fade-in slide-in-from-top duration-300">
                                {error}
                            </div>
                        )}

                        {/* Top Header Section */}
                        <div className="mb-6 text-center">
                            <div className="inline-block mb-4">
                                <img src="/images/caip_logo.png" alt="CAIP Logo" className="mx-auto h-[70px] drop-shadow-sm" />
                            </div>

                            <div className="bg-agri-green-primary text-center px-4 py-3.5 rounded-2xl shadow-sm">
                                <h4 className="text-white m-0 font-bold text-lg tracking-wide">Chamber for Agri Input Protection</h4>
                            </div>
                        </div>

                        {/* Login Card */}
                        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden mb-8">
                            {/* Card Header */}
                            <div className="bg-agri-green-primary p-5 text-center">
                                <h5 className="text-white text-xl font-semibold mb-1">Admin Login</h5>
                                <p className="text-white/80 text-sm m-0">Sign in to continue to Chamber for Agri Input Protection.</p>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 md:p-8">
                                <form onSubmit={handleAdminLogin} className="space-y-5">
                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-sm font-medium text-gray-700 ml-1">
                                            Admin Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Enter Admin Email"
                                            required
                                            className="w-full border border-gray-300 rounded-md py-2.5 px-4 outline-none text-sm transition-all focus:border-agri-green-primary focus:ring-2 focus:ring-agri-green-primary/10"
                                        />
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-sm font-medium text-gray-700 ml-1">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            placeholder="Enter Password"
                                            required
                                            className="w-full border border-gray-300 rounded-md py-2.5 px-4 outline-none text-sm transition-all focus:border-agri-green-primary focus:ring-2 focus:ring-agri-green-primary/10"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-agri-green-primary text-white font-medium py-2.5 rounded-md hover:bg-agri-green-700 transition-colors disabled:opacity-70 flex justify-center items-center shadow-sm text-sm cursor-pointer"
                                    >
                                        {loading ? (
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : 'Sign In'}
                                    </button>
                                </form>
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
