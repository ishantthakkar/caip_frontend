"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/apiConfig';

interface MemberHeaderProps {
    user: any;
    title?: string;
    isCollapsed?: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export default function MemberHeader({ user, title = "Dashboard", isCollapsed = false, setIsCollapsed }: MemberHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [subMember, setSubMember] = useState<any>(null);

    useEffect(() => {
        const smData = localStorage.getItem('subMember');
        if (smData) setSubMember(JSON.parse(smData));
    }, []);

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
        <header className="h-14 flex items-center justify-between px-6 shadow-md relative z-50 rounded-full bg-agri-gold-secondary mx-2 mt-1">
            <div className="flex items-center gap-6">
                {/* Navbar Left: Hamburger(only if collapsed) + Home + Title */}
                <div className="flex items-center gap-3">
                    {isCollapsed && (
                        <button
                            onClick={() => setIsCollapsed(false)}
                            className="text-black hover:bg-black/10 p-2 rounded-lg transition-all animate-in zoom-in-75 duration-300"
                            title="Open Sidebar"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    )}
                    <Link href="/dashboard" className={`text-black hover:opacity-75 transition-opacity ${!isCollapsed ? 'ml-2' : ''}`} title="Home">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </Link>
                </div>
                <h1 className="text-xl font-bold text-black tracking-tight">{title}</h1>
            </div>

            <div className="flex items-center gap-6">
                {/* Notification Bell */}
                <div className="relative group cursor-pointer p-2 hover:bg-black/10 rounded-full transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                </div>

                {/* Profile Section with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 cursor-pointer group py-1.5 px-3 hover:bg-black/10 rounded-full transition-all"
                    >
                        <div className="w-9 h-9 rounded-full bg-white shadow-sm overflow-hidden flex items-center justify-center border border-gray-100">
                            <span className="text-gray-400 text-lg">👤</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-black whitespace-nowrap">
                                {subMember ? subMember.firstName : (user?.name || 'Member')}
                            </span>
                            <svg className={`w-3 h-3 text-black transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </div>
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                            <div className="px-6 py-4 border-b border-gray-50 mb-2">
                                <p className="text-[10px] font-bold text-gray-400">Signed in as</p>
                                <p className="text-sm font-bold text-gray-800 truncate">{user?.email || (subMember ? subMember.phone : user?.phone)}</p>
                            </div>
                            {!subMember && (
                                <Link
                                    href="/profile"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="flex items-center gap-4 px-6 py-3 text-sm font-bold text-gray-700 hover:text-agri-green-primary hover:bg-gray-50 transition-all"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    My Profile
                                </Link>
                            )}

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all text-left"
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
