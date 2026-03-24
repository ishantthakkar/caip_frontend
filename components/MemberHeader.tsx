"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/apiConfig';

interface MemberHeaderProps {
    user: any;
    title?: string;
    isCollapsed?: boolean;
}

export default function MemberHeader({ user, title = "Dashboard", isCollapsed = false }: MemberHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [subMember, setSubMember] = useState<any>(null);

    useEffect(() => {
        const smData = localStorage.getItem('subMember');
        if (smData) setSubMember(JSON.parse(smData));
    }, []);

    const getHeaderIcon = () => {
        if (pathname === '/dashboard') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
        if (pathname.includes('/defaulter/search')) return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
        if (pathname.includes('/defaulter/history')) return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>;
        if (pathname.includes('/defaulter/add')) return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg>;
        if (pathname.includes('/sub-members')) return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
        if (pathname.includes('/logs')) return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
        return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
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

    const handleLogout = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await fetch(`${API_BASE_URL}auth/log-logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (error) {
                console.error("Logout log failed:", error);
            }
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('subMember');
        router.push('/');
    };

    return (
        <header className="h-14 bg-[#ffd600] flex items-center justify-between px-8 shadow-md rounded-full relative z-50">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    {getHeaderIcon()}
                    <h1 className="text-xl text-black tracking-tight font-serif">{title}</h1>
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

                {/* Profile Section with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 cursor-pointer group py-1 px-1 pr-6 rounded-full transition-all"
                    >
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                            <span className="text-gray-400 text-xl">👤</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-black whitespace-nowrap font-serif">
                                {subMember ? `Sub-Member: ${subMember.firstName}` : (user?.name || 'Member')}
                            </span>
                        </div>
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                            <div className="px-6 py-2 border-b border-gray-50 mb-2">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-serif">CAIP</p>
                            </div>

                            {!subMember && (
                                <Link
                                    href="/profile"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="flex items-center gap-4 px-6 py-3 text-sm text-gray-700 hover:text-[#1b5e20] hover:bg-green-50/50 transition-all font-serif"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    My Profile
                                </Link>
                            )}

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-all font-serif"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
