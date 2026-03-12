"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AdminSidebarProps {
    pendingCount: number;
}

export default function AdminSidebar({ pendingCount }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin-login');
    };

    const navItems = [
        { label: 'Dashboard Home', href: '/admin-dashboard', icon: '📊' },
        { label: 'Member Registry', href: '/admin-members', icon: '📋' },
        { label: 'Member Requests', href: '/member-requests', icon: '👥', badge: pendingCount },
    ];

    return (
        <aside className="w-80 bg-[#0a1f0a] flex flex-col shadow-2xl shrink-0 sticky top-0 h-screen z-50">
            <div className="p-8 flex flex-col items-center border-b border-white/5">
                <div className="w-20 h-20 bg-white rounded-2xl p-3 flex items-center justify-center shadow-lg mb-4 hover:scale-110 transition-transform duration-300">
                    <img src="/images/caip_logo.png" alt="CAIP Logo" className="w-full h-full object-contain" />
                </div>
                <div className="text-center">
                    <h1 className="text-sm font-black tracking-widest text-white">Admin Portal</h1>
                    <p className="text-[9px] font-bold text-[#4caf50] mt-1 tracking-widest">Global Authority Management</p>
                </div>
            </div>

            <nav className="flex-1 p-6 space-y-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border border-transparent ${isActive
                                ? 'bg-[#1b5e20] text-white shadow-xl border-white/10 font-bold tracking-tight text-sm'
                                : 'hover:bg-white/5 text-gray-400 font-bold tracking-tight text-sm group hover:border-white/5'
                                }`}
                        >
                            <span className={`text-lg ${!isActive && 'group-hover:scale-110 transition-transform'}`}>{item.icon}</span>
                            <span>{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-[#ffd600] text-[#0a1f0a]' : 'bg-[#ffd600] text-[#0a1f0a]'
                                    }`}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-8">
                <button
                    onClick={handleLogout}
                    className="w-full bg-white/5 hover:bg-red-600/20 hover:text-red-500 text-gray-400 font-black py-4 rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-3 tracking-wide text-xs shadow-lg"
                >
                    <span>🚪</span> Terminal Exit
                </button>
            </div>
        </aside>
    );
}
