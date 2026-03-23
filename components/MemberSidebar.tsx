"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/apiConfig';

interface MemberSidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export default function MemberSidebar({ isCollapsed, setIsCollapsed }: MemberSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [defaulterOpen, setDefaulterOpen] = useState(pathname.includes('/defaulter'));
    const [isSubMember, setIsSubMember] = useState(false);

    useEffect(() => {
        const subMemberData = localStorage.getItem('subMember');
        setIsSubMember(!!subMemberData);
    }, [pathname]);

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

    const menuItems = React.useMemo(() => {
        const items = [
            {
                name: 'Dashboard',
                path: '/dashboard',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            },
            {
                name: 'Defaulter Management',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
                hasSub: true,
                subItems: [
                    { name: 'Defaulters List', path: '/defaulter/list' },
                    { name: 'Search Defaulters', path: '/defaulter/search' },
                    { name: 'Add New Defaulter', path: '/defaulter/add' },
                ]
            },
            {
                name: 'Sub-Member Management',
                path: '/sub-members',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            },
            {
                name: 'Reports',
                path: '/reports',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            },
            {
                name: 'Activity Log',
                path: '/logs',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/><path d="M12 6v6l4 2"/></svg>
            }
        ];

        if (isSubMember) {
            return items.filter(item => item.name !== 'Sub-Member Management');
        }
        return items;
    }, [isSubMember, pathname]);

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-gray-100 flex flex-col h-full overflow-hidden no-scrollbar hidden md:flex shrink-0 transition-all duration-300 ease-in-out`}>
            {/* Sidebar Header Section - Exact Match with Image */}
            <div className={`h-24 p-6 flex items-center justify-between border-b border-gray-50`}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <img src="/images/caip_logo.png" alt="CAIP Logo" className="w-full h-full object-contain" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-3xl font-bold text-slate-800 tracking-tight animate-in fade-in duration-500">CAIP</span>
                    )}
                </div>
                {!isCollapsed && (
                    <button 
                        onClick={() => setIsCollapsed(true)}
                        className="text-slate-800 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            <div className={`flex-1 overflow-y-auto no-scrollbar p-5 ${isCollapsed ? 'px-2' : ''}`}>
                <nav className="space-y-4">
                    {menuItems.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                            {!item.hasSub ? (
                                <Link
                                    href={item.path || '#'}
                                    className={`flex items-center gap-4 px-5 py-4 transition-all group ${pathname === item.path ? 'bg-slate-50 rounded-2xl text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 rounded-2xl'} ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    <span className={`flex-shrink-0 transition-transform group-hover:scale-110 ${pathname === item.path ? 'text-agri-green-primary' : 'text-agri-green-primary group-hover:text-agri-green-primary'}`}>{item.icon}</span>
                                    {!isCollapsed && <span className="text-lg tracking-tight">{item.name}</span>}
                                </Link>
                            ) : (
                                <div className="space-y-1">
                                    <div
                                        onClick={() => {
                                            if (isCollapsed) {
                                                setIsCollapsed(false);
                                                setDefaulterOpen(true);
                                            } else {
                                                setDefaulterOpen(!defaulterOpen);
                                            }
                                        }}
                                        className={`flex items-center justify-between gap-4 px-5 py-4 transition-all cursor-pointer group ${pathname.includes('/defaulter') ? 'bg-slate-50 rounded-2xl text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 rounded-2xl'} ${isCollapsed ? 'justify-center' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`flex-shrink-0 transition-transform group-hover:scale-110 text-agri-green-primary`}>{item.icon}</span>
                                            {!isCollapsed && <span className="text-lg tracking-tight">{item.name}</span>}
                                        </div>
                                        {!isCollapsed && (
                                            <span className="text-slate-400 font-normal text-2xl">{defaulterOpen ? '−' : '+'}</span>
                                        )}
                                    </div>
                                    {defaulterOpen && !isCollapsed && (
                                        <div className="pl-14 space-y-3 mt-2 animate-in slide-in-from-left-2 duration-300">
                                            {item.subItems?.map((sub, sIdx) => (
                                                <Link
                                                    key={sIdx}
                                                    href={sub.path}
                                                    className={`block py-1 text-sm font-medium transition-all ${pathname === sub.path ? 'text-agri-green-primary' : 'text-slate-400 hover:text-slate-800'}`}
                                                >
                                                    {sub.name}
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

        </aside>
    );
}
