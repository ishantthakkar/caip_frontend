"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AdminHeaderProps {
    admin: any;
    title?: string;
    isCollapsed?: boolean;
}

export default function AdminHeader({ admin, title = "Admin Dashboard", isCollapsed = false }: AdminHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const getHeaderIcon = () => {
        if (pathname === '/admin-dashboard') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
        if (pathname.includes('/admin-members')) return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
        if (pathname.includes('/admin-reports')) return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>;
        if (pathname.includes('/member-requests')) return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg>;
        return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin-login');
    };

    return (
        <header className="h-14 bg-[#ffd600] flex items-center justify-between px-8 shadow-md rounded-full relative z-50">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    {getHeaderIcon()}
                    <h1 className="text-xl text-black tracking-tight font-serif uppercase font-black">{title}</h1>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Notification Bell */}
                <div className="relative cursor-pointer hover:scale-110 transition-transform">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white border-2 border-[#ffd600] font-serif">
                        1
                    </div>
                </div>

                {/* Profile Section */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 cursor-pointer group py-1 px-1 pr-6 rounded-full transition-all"
                    >
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                            <span className="text-black font-black text-sm">{admin?.name?.[0] || 'A'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-black whitespace-nowrap font-serif font-black uppercase">
                                Root: {admin?.name || 'Admin'}
                            </span>
                        </div>
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                            <div className="px-6 py-2 border-b border-gray-50 mb-2">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-serif">Authority Central</p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-all font-serif font-bold uppercase"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                System Exit
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
