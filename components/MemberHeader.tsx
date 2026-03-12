"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MemberHeaderProps {
    user: any;
    title?: string;
}

export default function MemberHeader({ user, title = "Dashboard" }: MemberHeaderProps) {
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <header className="h-14 bg-[#ffd600] flex items-center justify-between px-6 shadow-sm border-b border-black/5 shrink-0 relative z-50">
            <div className="flex items-center gap-4">
                <div className="bg-white/20 p-1.5 rounded-lg">
                    {/* Placeholder for menu toggle or logo */}
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
            </div>

            <div className="flex items-center gap-6">
                {/* Notification Bell */}
                <div className="relative cursor-pointer hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#ffd600]">
                        3
                    </div>
                </div>

                {/* Profile Section with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 cursor-pointer group hover:bg-black/5 py-1 px-3 rounded-full transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                            <span className="text-gray-400 text-lg">👤</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800 group-hover:text-black">{user?.name || 'User'}</span>
                        <svg className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                            <div className="px-6 py-2 border-b border-gray-50 mb-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CAIP</p>
                            </div>

                            {/* {[
                                { name: 'Add Record', path: '/defaulter/add' },
                                { name: 'My Filings', path: '/defaulter/list' },
                                { name: 'Global Search', path: '/defaulter/search' },
                                { name: 'Search History', path: '/defaulter/history' }
                            ].map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="flex items-center gap-3 px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-[#1b5e20] hover:bg-green-50/50 transition-all"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                    {item.name}
                                </Link>
                            ))}

                            <div className="h-px bg-gray-50 my-2 mx-4"></div> */}

                            <Link
                                href="/profile"
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center gap-4 px-6 py-3 text-sm font-bold text-gray-700 hover:text-[#1b5e20] hover:bg-green-50/50 transition-all"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                My Profile
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
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
