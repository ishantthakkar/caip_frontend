"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}member/activity-logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setLogs(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        if (!searchTerm.trim()) return logs;
        const term = searchTerm.toLowerCase();
        return logs.filter(log =>
            (log.userName && log.userName.toLowerCase().includes(term)) ||
            (log.activityType && log.activityType.toLowerCase().includes(term)) ||
            (log.details && log.details.toLowerCase().includes(term)) ||
            (log.ipAddress && log.ipAddress.includes(term))
        );
    }, [searchTerm, logs]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <MemberPortalContainer title="Activity Audit">
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">System Operational Logs</h2>
                        <p className="text-sm font-semibold text-slate-500 mt-1">Comprehensive audit trail of security and administrative interactions</p>
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-96 group">
                            <input
                                type="text"
                                placeholder="Filter by User, Activity, or Network ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-agri-green-primary focus:bg-white focus:ring-4 focus:ring-green-500/5 transition-all shadow-sm"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-agri-green-primary transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-agri-green-primary text-white border-b border-slate-100/10">
                                <tr>
                                    <th className="px-6 py-5 text-[14px] font-bold tracking-tight">Timestamp</th>
                                    <th className="px-6 py-5 text-[14px] font-bold tracking-tight">Operator Identity</th>
                                    <th className="px-6 py-5 text-[14px] font-bold tracking-tight text-center">Activity Type</th>
                                    <th className="px-6 py-5 text-[14px] font-bold tracking-tight">Interaction Details</th>
                                    <th className="px-6 py-5 text-[14px] font-bold tracking-tight text-right">Network ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-6 py-5"><div className="h-5 bg-slate-50 rounded-lg w-full"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedLogs.length > 0 ? (
                                    paginatedLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                                                        {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-xs font-black shadow-inner uppercase grow-0 shrink-0">
                                                        {log.userName?.[0] || 'U'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">{log.userName}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Security Officer</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border ${log.activityType?.includes('Login') ? 'bg-green-50 text-green-700 border-green-100' :
                                                            log.activityType?.includes('Logout') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                log.activityType?.includes('Update') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                    'bg-slate-50 text-slate-600 border-slate-100'
                                                        }`}>
                                                        {log.activityType}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-semibold text-slate-500 leading-relaxed truncate max-w-[300px]" title={log.details}>
                                                    {log.details}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-[11px] font-black text-slate-600 font-mono bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-inner">
                                                    {log.ipAddress}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-40 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-100 grayscale">📊</div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Zero Audit Entries Recovered</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {!loading && filteredLogs.length > 0 && (
                        <div className="mt-auto p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">
                                Recording {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                            </span>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-600 disabled:opacity-30 transition-all active:scale-95 shadow-sm"
                                >
                                    Previous
                                </button>

                                <div className="flex gap-1.5 px-2">
                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                        const pageNum = idx + 1;
                                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-9 h-9 rounded-lg text-xs font-black transition-all shadow-sm ${currentPage === pageNum
                                                            ? 'bg-agri-green-primary text-white shadow-green-900/10'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:border-agri-green-primary hover:text-agri-green-primary'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <span key={pageNum} className="flex items-center text-slate-300 font-black">.</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-600 disabled:opacity-30 transition-all active:scale-95 shadow-sm"
                                >
                                    Proceed
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MemberPortalContainer>
    );
}
