"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

interface MemberHeaderProps {
    user: any;
    title?: string;
    isCollapsed?: boolean;
    setIsCollapsed: (c: boolean) => void;
}

interface Notification {
    _id: string;
    message_title: string;
    message_content: string;
    createdAt: string;
    read_by: string[];
}

export default function MemberHeader({ user, title = "Dashboard", isCollapsed = false, setIsCollapsed }: MemberHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const [subMember, setSubMember] = useState<any>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const smData = localStorage.getItem('subMember');
        if (smData) setSubMember(JSON.parse(smData));
        fetchNotifications();

        // Refresh notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${API_BASE_URL}member/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) {
                const list = result.data || [];
                setNotifications(list);

                // Derive unread count (not in read_by array)
                const storedUser = localStorage.getItem('user');
                const parsedUser = storedUser ? JSON.parse(storedUser) : null;
                const uid = parsedUser?._id;

                const unread = list.filter((n: Notification) => !n.read_by.includes(uid)).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}member/notifications-readall`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getHeaderIcon = () => {
        if (pathname === '/dashboard') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
        if (pathname.includes('/defaulter/search')) return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
        // ... matching logic truncated for brevity ...
        return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
    };

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
                <div className={`flex items-center gap-3 ${isCollapsed ? 'pl-1.5' : 'pl-3'}`}>
                    {getHeaderIcon()}
                    <h1 className="text-[17px] text-black tracking-tight font-bold">{title}</h1>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                    <div
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
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

                    {/* Notification Drawer - Styled exactly like the image */}
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-50 bg-white">
                                <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
                                <button
                                    onClick={markAllRead}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    Mark all as read
                                </button>
                            </div>

                            <div className="max-h-72 overflow-y-auto bg-white custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400">
                                        <p className="text-[10px] font-bold uppercase tracking-widest">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n._id}
                                            className={`px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read_by.includes(user?._id) ? 'bg-blue-50/20' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{n.message_title}</h4>
                                                <span className="text-[10px] font-medium text-gray-400 font-sans">{formatTime(n.createdAt)}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                {n.message_content}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <Link
                                href="/notifications"
                                className="block w-full text-center py-4 bg-white border-t border-gray-50 text-xs font-bold text-blue-600 hover:bg-gray-50 transition-all font-sans"
                            >
                                View More...
                            </Link>
                        </div>
                    )}
                </div>

                {/* Profile Section with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 cursor-pointer group py-1 px-1 pr-6 rounded-full transition-all"
                    >
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                            <img 
                                src={user?.profileImage ? `${ASSETS_BASE_URL}uploads/${user.profileImage}` : "/default-avatar.jpg"} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-black whitespace-nowrap font-serif font-bold">
                                {subMember ? `Sub-Member: ${subMember.firstName}` : (user?.name || 'Member')}
                            </span>
                        </div>
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                            <div className="px-6 py-2 border-b border-gray-50 mb-2">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-serif font-bold">CAIP</p>
                            </div>

                            {!subMember && (
                                <Link
                                    href="/profile"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="flex items-center gap-4 px-6 py-3 text-sm text-gray-700 hover:text-[#1b5e20] hover:bg-green-50/50 transition-all font-serif font-bold"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    My Profile
                                </Link>
                            )}

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-all font-serif font-bold"
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
