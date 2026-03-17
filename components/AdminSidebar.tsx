"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AdminSidebarProps {
    pendingCount: number;
    isCollapsed?: boolean;
    setIsCollapsed?: (val: boolean) => void;
}

export default function AdminSidebar({ pendingCount, isCollapsed, setIsCollapsed }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin-login');
    };

    const navItems = [
        { label: 'Control Center', href: '/admin-dashboard', icon: '💎' },
        { label: 'Member Registry', href: '/admin-members', icon: '📋' },
        { label: 'Pending Requests', href: '/member-requests', icon: '👥', badge: pendingCount },
        { label: 'System Reports', href: '/admin-reports', icon: '📈' },
    ];

    return (
        <aside 
            className={`bg-[#0a1f0a] flex flex-col shadow-2xl shrink-0 transition-all duration-300 relative z-50 ${isCollapsed ? 'w-24' : 'w-80'}`}
        >
            {/* Collapse Toggle */}
            <button 
                onClick={() => setIsCollapsed?.(!isCollapsed)}
                className="absolute -right-3 top-24 w-6 h-6 bg-[#ffd600] rounded-full flex items-center justify-center shadow-lg border-2 border-[#1b5e20] z-[60] hover:scale-110 transition-transform"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
                    <path d="m15 18-6-6 6-6"/>
                </svg>
            </button>

            <div className={`p-8 flex flex-col items-center border-b border-white/5 transition-all duration-300 ${isCollapsed ? 'p-4' : 'p-8'}`}>
                <Link href="/admin-dashboard" className={`bg-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300 ${isCollapsed ? 'w-12 h-12 p-1.5' : 'w-24 h-24 p-4'}`}>
                    <img src="/images/caip_logo.png" alt="CAIP Logo" className="w-full h-full object-contain" />
                </Link>
                {!isCollapsed && (
                    <div className="text-center mt-6 animate-in fade-in duration-500">
                        <h1 className="text-xs font-black tracking-[0.3em] text-white uppercase italic">Authority Hub</h1>
                        <p className="text-[8px] font-bold text-[#ffd600] mt-1 tracking-[0.2em] uppercase">Global Management Matrix</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                                isActive 
                                ? 'bg-gradient-to-r from-[#1b5e20] to-[#2d523c] text-white shadow-xl shadow-emerald-900/20' 
                                : 'hover:bg-white/5 text-gray-400'
                            }`}
                        >
                            <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {item.icon}
                            </span>
                            {!isCollapsed && (
                                <span className={`text-sm font-black tracking-tight uppercase transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                                    {item.label}
                                </span>
                            )}
                            
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black shadow-lg animate-in zoom-in duration-300 ${
                                    isActive ? 'bg-[#ffd600] text-[#1b5e20]' : 'bg-[#ffd600] text-[#1b5e20]'
                                } ${isCollapsed ? 'absolute top-2 right-2' : 'ml-auto'}`}>
                                    {item.badge}
                                </span>
                            )}

                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl z-[100]">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className={`p-6 border-t border-white/5 ${isCollapsed ? 'p-4' : 'p-8'}`}>
                <button
                    onClick={handleLogout}
                    className={`w-full group flex items-center justify-center transition-all duration-300 rounded-2xl border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 ${
                        isCollapsed ? 'h-12' : 'h-14 gap-3 bg-white/5'
                    }`}
                >
                    <span className="text-lg group-hover:scale-110 transition-transform">⚙️</span>
                    {!isCollapsed && (
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-red-500 transition-colors">
                            Secure Logout
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
}
