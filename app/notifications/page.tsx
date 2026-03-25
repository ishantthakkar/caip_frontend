"use client";

import React, { useState, useEffect } from 'react';
import MemberSidebar from '@/components/MemberSidebar';
import MemberHeader from '@/components/MemberHeader';
import { API_BASE_URL } from '@/config/apiConfig';

interface Notification {
    _id: string;
    message_title: string;
    message_content: string;
    createdAt: string;
    read_by: string[];
}

export default function NotificationsPage() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}member/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) {
                setNotifications(result.data || []);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredNotifications = notifications.filter(n =>
        n.message_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message_content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const paginatedNotifications = filteredNotifications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            // Format to dd/MM/yyyy hh:mm:AM/PM
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            
            let hours = d.getHours();
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            
            return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes}:${ampm}`;
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <MemberSidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
            
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <MemberHeader user={user} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} title="Notifications" />

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Filters Header */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Notification History</h2>
                            
                            <div className="relative w-full md:w-80">
                                <input
                                    type="text"
                                    placeholder="Search notifications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#1b5e20] transition-all"
                                />
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                            </div>
                        </div>

                        {/* Notifications Table */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#1b5e20] text-white">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 w-16 whitespace-nowrap">#</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 whitespace-nowrap">Title</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap w-48">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 font-sans">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold italic animate-pulse">Loading notifications...</td>
                                            </tr>
                                        ) : paginatedNotifications.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold italic uppercase tracking-widest text-[10px]">No notifications found matching your search</td>
                                            </tr>
                                        ) : (
                                            paginatedNotifications.map((n, idx) => (
                                                <tr key={n._id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-4 text-xs font-black text-gray-400 border-r border-gray-50 whitespace-nowrap">
                                                        {(currentPage - 1) * itemsPerPage + idx + 1}
                                                    </td>
                                                    <td className="px-6 py-4 border-r border-gray-50 whitespace-nowrap min-w-[150px]">
                                                        <div className="flex items-center gap-3">
                                                            {!n.read_by.includes(user?._id) && (
                                                                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse shrink-0 shadow-sm" />
                                                            )}
                                                            <span className={`text-sm font-bold tracking-tight ${!n.read_by.includes(user?._id) ? 'text-gray-900' : 'text-gray-600'}`}>
                                                                {n.message_title}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 border-r border-gray-50 min-w-[300px]">
                                                        <p className="text-xs text-gray-500 font-bold leading-relaxed line-clamp-2 italic tracking-tight group-hover:line-clamp-none transition-all">
                                                            {n.message_content}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#1b5e20] opacity-50"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                            <span className="text-[11px] font-black text-gray-700 tracking-tight font-sans">
                                                                {formatDate(n.createdAt)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-6 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                                    <p className="text-xs font-bold text-gray-400">
                                        Showing {paginatedNotifications.length} of {filteredNotifications.length} notifications
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                            className="p-2 rounded-xl bg-white border border-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-all font-bold shadow-sm"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
                                        </button>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-10 h-10 rounded-xl text-xs font-black transition-all shadow-sm ${currentPage === i + 1 ? 'bg-[#1b5e20] text-white' : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                            className="p-2 rounded-xl bg-white border border-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-all font-bold shadow-sm"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
