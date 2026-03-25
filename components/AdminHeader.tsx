"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/apiConfig';

interface AdminHeaderProps {
    admin: any;
    title?: string;
    isCollapsed?: boolean;
    setIsCollapsed: (c: boolean) => void;
}

interface Alert {
    _id: string;
    message_title: string;
    message_content: string;
    createdAt: string;
    read_by: string[];
}

export default function AdminHeader({ admin, title = "Admin Dashboard", isCollapsed = false, setIsCollapsed }: AdminHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const alertRef = useRef<HTMLDivElement>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchAlerts();
        // Refresh alerts every minute
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) return;
            const res = await fetch(`${API_BASE_URL}admin/alerts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) {
                const list = result.data || [];
                setAlerts(list);

                const adminUser = localStorage.getItem('adminUser');
                const aid = adminUser ? JSON.parse(adminUser).id : null;
                const unread = list.filter((a: Alert) => !a.read_by.includes(aid)).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error("Alert catch error:", error);
        }
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${API_BASE_URL}admin/alerts-readall`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchAlerts();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (alertRef.current && !alertRef.current.contains(event.target as Node)) {
                setIsAlertOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getHeaderIcon = () => {
        const iconProps = { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "text-black" };
        
        if (pathname === '/admin-dashboard') return <svg {...iconProps}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
        if (pathname.includes('/admin-members')) return <svg {...iconProps}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
        if (pathname.includes('/admin-reports')) return <svg {...iconProps}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>;
        if (pathname.includes('/member-requests')) return <svg {...iconProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg>;
        if (pathname.includes('/admin-reconciliation')) return <svg {...iconProps}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;
        
        return <svg {...iconProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            if (token) {
                await fetch(`${API_BASE_URL}auth/log-logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        } catch (e) { }

        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin-login');
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${String(hours).padStart(2, '0')}:${minutes}${ampm}`;
    };

    return (
        <header className="h-12 bg-[#ffd600] flex items-center justify-between px-3.5 shadow-md rounded-xl relative z-50">
            <div className="flex items-center gap-3">
                {isCollapsed && (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 hover:bg-black/5 rounded-lg text-black transition-all active:scale-90"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="18" x2="20" y2="18" />
                        </svg>
                    </button>
                )}
                <div className={`flex items-center gap-3 ${isCollapsed ? 'pl-0' : 'pl-1.5'}`}>
                    {getHeaderIcon()}
                    <h1 className="text-[17px] text-black tracking-tight font-bold uppercase">{title}</h1>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Notification Bell (Personal Alerts for Admin) */}
                <div className="relative" ref={alertRef}>
                    <div
                        onClick={() => setIsAlertOpen(!isAlertOpen)}
                        className="cursor-pointer hover:scale-110 transition-transform relative"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-600 rounded-full flex items-center justify-center text-[9px] text-white border-2 border-[#ffd600] font-black">
                                {unreadCount}
                            </div>
                        )}
                    </div>

                    {isAlertOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-50 bg-white">
                                <h3 className="text-sm font-bold text-gray-800">Admin Alerts</h3>
                                <button
                                    onClick={markAllRead}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    Clear all
                                </button>
                            </div>

                            <div className="max-h-72 overflow-y-auto bg-white custom-scrollbar">
                                {alerts.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400">
                                        <p className="text-[10px] font-bold uppercase tracking-widest italic">No alerts yet</p>
                                    </div>
                                ) : (
                                    alerts.map((a) => (
                                        <div
                                            key={a._id}
                                            className={`px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!a.read_by.includes(admin?.id) ? 'bg-blue-50/20' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{a.message_title}</h4>
                                                <span className="text-[9px] font-medium text-gray-400">{formatTime(a.createdAt)}</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                                {a.message_content}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <Link
                                href="/admin-alerts"
                                className="block w-full text-center py-4 bg-white border-t border-gray-50 text-xs font-bold text-blue-600 hover:bg-gray-50 transition-all font-sans"
                            >
                                View All Alerts...
                            </Link>
                        </div>
                    )}
                </div>

                {/* Profile Section */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 cursor-pointer group py-1 px-1 pr-6 rounded-full transition-all"
                    >
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                            <span className="text-black font-black text-sm">{admin?.name?.[0]?.toUpperCase() || 'A'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-black whitespace-nowrap font-sans font-bold uppercase">
                                {admin?.name || 'Admin'}
                            </span>
                        </div>
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                            <div className="px-6 py-2 border-b border-gray-50 mb-2">
                                <p className="text-[10px] text-black uppercase tracking-widest font-sans font-bold">CAIP</p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-all font-sans font-bold"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
