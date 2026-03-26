"use client";

import React, { useState, useEffect } from 'react';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';

interface AlertItem {
    _id: string;
    message_title: string;
    message_content: string;
    createdAt: string;
    read_by: string[];
}

export default function AdminAlertsPage() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [admin, setAdmin] = useState<any>(null);

    useEffect(() => {
        const adminData = localStorage.getItem('adminUser');
        if (adminData) setAdmin(JSON.parse(adminData));
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}admin/alerts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setAlerts(data.data || []);
        } catch (error) {
            console.error("Fetch alerts error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAlerts = alerts.filter(a =>
        a.message_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.message_content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
    const paginatedAlerts = filteredAlerts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes}:${ampm}`;
    };

    return (
        <AdminPortalContainer title="Admin Notifications">
            <div className="space-y-6">
                {/* Search Header */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Notifications</h2>

                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#ffd600] transition-all"
                        />
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                </div>

                {/* Alerts Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black text-[#eee]">
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest border-r border-white/10 w-16">#</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest border-r border-white/10">Title</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest border-r border-white/10">Message</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest w-48 whitespace-nowrap">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-sans">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold animate-pulse tracking-widest text-xs">Loading Records...</td>
                                    </tr>
                                ) : paginatedAlerts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold italic tracking-widest text-[10px]">No Notification found</td>
                                    </tr>
                                ) : (
                                    paginatedAlerts.map((a, idx) => (
                                        <tr key={a._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-xs font-black text-gray-300 border-r border-gray-50">
                                                {(currentPage - 1) * itemsPerPage + idx + 1}
                                            </td>
                                            <td className="px-6 py-4 border-r border-gray-50 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {!a.read_by.includes(admin?.id) && (
                                                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shrink-0" />
                                                    )}
                                                    <span className={`text-sm font-bold  tracking-tight ${!a.read_by.includes(admin?.id) ? 'text-black' : 'text-black'}`}>
                                                        {a.message_title}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-r border-gray-50">
                                                <p className="text-xs font-bold leading-relaxed line-clamp-2 tracking-tight group-hover:line-clamp-none transition-all">
                                                    {a.message_content}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-black opacity-30"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                    <span className="text-[11px] font-black text-gray-700 font-sans">
                                                        {formatDateTime(a.createdAt)}
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
                        <div className="px-6 py-6 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {paginatedAlerts.length} item(s) on this page
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="p-2 rounded-2xl bg-white border border-gray-100 text-gray-500 disabled:opacity-30 hover:bg-black hover:text-[#ffd600] transition-all font-bold shadow-sm"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6" /></svg>
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-10 h-10 rounded-2xl text-[10px] font-black transition-all shadow-sm ${currentPage === i + 1 ? 'bg-black text-[#ffd600]' : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="p-2 rounded-2xl bg-white border border-gray-100 text-gray-500 disabled:opacity-30 hover:bg-black hover:text-[#ffd600] transition-all font-bold shadow-sm"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminPortalContainer>
    );
}
