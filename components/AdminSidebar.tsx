"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AdminSidebarProps {
    pendingCount: number;
    isCollapsed: boolean;
    setIsCollapsed: (val: boolean) => void;
}

export default function AdminSidebar({ pendingCount, isCollapsed, setIsCollapsed }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [adminInitial, setAdminInitial] = useState('A');

    useEffect(() => {
        const adminData = localStorage.getItem('adminUser');
        if (adminData) {
            try {
                const admin = JSON.parse(adminData);
                if (admin.name) setAdminInitial(admin.name[0].toUpperCase());
            } catch (e) {
                console.error("Error parsing admin data", e);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin-login');
    };

    const navItems = [
        {
            label: 'Dashboard',
            href: '/admin-dashboard',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        },
        {
            label: 'Member Management',
            href: '/admin-members',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        },
        {
            label: 'Defaulter List',
            href: '/admin-defaulters',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        },
        {
            label: 'Pending Requests',
            href: '/member-requests',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg>,
            badge: pendingCount
        },
        {
            label: 'System Reports',
            href: '/admin-reports',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        },
        {
            label: 'Activity Logs',
            href: '/admin-logs',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        },
        {
            label: 'Membership Plans',
            href: '/admin-plans',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M12 11V7" /><line x1="8" y1="11" x2="16" y2="11" /></svg>
        },
        {
            label: 'Payment Reconciliation',
            href: '/admin-reconciliation',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><line x1="7" y1="15" x2="12" y2="15" /><line x1="17" y1="15" x2="17" y2="15" /></svg>
        },
        {
            label: 'Notification Management',
            href: '/admin-notifications',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /><path d="M2 8c0-2.21 1.79-4 4-4" /><path d="M22 8c0-2.21-1.79-4-4-4" /></svg>
        },
    ];

    return (
        <aside className={`${isCollapsed ? 'w-24' : 'w-72'} bg-white border-r border-gray-100 flex flex-col h-full overflow-y-auto no-scrollbar hidden md:flex shrink-0 transition-all duration-300 ease-in-out`}>
            {/* Logo Section */}
            <div className={`p-6 border-b border-gray-50 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <img src="/images/caip_logo.png" alt="CAIP Logo" className="h-10 w-auto object-contain" />
                        <span className="text-xl font-bold text-[#1b5e20] tracking-tighter uppercase font-sans italic">CAIP</span>
                    </div>
                )}
                {isCollapsed && <img src="/images/caip_logo.png" alt="CAIP" className="h-10 w-auto object-contain" />}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </div>

            <div className={`p-4 ${isCollapsed ? 'px-2' : ''}`}>
                <nav className="space-y-2">
                    {navItems.map((item, idx) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                title={isCollapsed ? item.label : ''}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-base font-bold transition-all ${isActive ? 'text-[#1b5e20] bg-green-50/80 shadow-sm shadow-green-900/5' : 'text-black hover:text-[#1b5e20] hover:bg-gray-50'} ${isCollapsed ? 'justify-center px-0' : ''}`}
                            >
                                <span className={isActive ? 'text-[#1b5e20]' : 'text-black'}>{item.icon}</span>
                                {!isCollapsed && (
                                    <div className="flex items-center justify-between flex-1">
                                        <span className="text-sm tracking-tight">{item.label}</span>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className="px-2 py-0.5 bg-[#1b5e20] text-white text-[10px] font-bold rounded-full min-w-[20px] text-center">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#1b5e20] text-white text-[8px] font-bold rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-gray-50 flex flex-col gap-4">
                <div className={`flex items-center gap-3 p-3 bg-red-50/50 rounded-2xl border border-red-100/50 ${isCollapsed ? 'justify-center px-0' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-[#2d2d2d] flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-black/20 shrink-0">
                        {adminInitial}
                    </div>
                    {!isCollapsed && (
                        <button
                            onClick={handleLogout}
                            className="flex-1 flex items-center justify-center gap-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white transition-all active:scale-95"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                            <span>Sign Out</span>
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
