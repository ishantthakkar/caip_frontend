"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function MemberSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [defaulterOpen, setDefaulterOpen] = useState(pathname.includes('/defaulter'));
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setIsPending(user.membership_status === "0");
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const menuItems = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        },
        {
            name: 'Defaulter Management',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
            hasSub: true,
            subItems: [
                { name: 'Add Record', path: '/defaulter/add' },
                { name: 'Defaulters List', path: '/defaulter/list' },
                { name: 'Search Defaulters', path: '/defaulter/search' },
                { name: 'Search History', path: '/defaulter/history' }
            ]
        },
        {
            name: 'Sub-Member Management',
            path: '/sub-members',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        },
        {
            name: 'Reports',
            path: '/reports',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        },
        {
            name: 'Activity Log',
            path: '/logs',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        }
    ];

    return (
        <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-full overflow-y-auto no-scrollbar hidden md:flex shrink-0">
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-50 flex items-center justify-center">
                <img src="/images/caip_logo.png" alt="CAIP Logo" className="h-16 w-auto object-contain" />
            </div>

            <div className="p-6">
                <nav className="space-y-2">
                    {menuItems.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                            {!item.hasSub ? (
                                <Link
                                    href={item.path || '#'}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl text-base font-bold transition-all ${pathname === item.path ? 'text-[#1b5e20] bg-green-50' : 'text-gray-500 hover:text-[#1b5e20] hover:bg-gray-50'}`}
                                >
                                    <span className={pathname === item.path ? 'text-[#1b5e20]' : 'text-gray-400'}>{item.icon}</span>
                                    {item.name}
                                </Link>
                            ) : (
                                <div className="space-y-1">
                                    <div
                                        onClick={() => setDefaulterOpen(!defaulterOpen)}
                                        className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl text-base font-bold transition-all cursor-pointer ${pathname.includes('/defaulter') || defaulterOpen ? 'text-[#1b5e20] bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {item.icon}
                                            {item.name} +
                                        </div>
                                    </div>
                                    {defaulterOpen && (
                                        <div className="pl-12 space-y-1">
                                            {item.subItems?.map((sub, sIdx) => (
                                                <Link
                                                    key={sIdx}
                                                    href={sub.path}
                                                    className={`block py-2 text-sm font-bold transition-all ${pathname === sub.path ? 'text-[#1b5e20]' : 'text-gray-400 hover:text-[#1b5e20]'}`}
                                                >
                                                    • {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-gray-50">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
