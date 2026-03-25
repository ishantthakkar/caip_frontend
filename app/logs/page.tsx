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
        <MemberPortalContainer title="Activity History">
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row items-end justify-between gap-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all duration-300">
                    <div className="w-full xl:w-auto mb-4 xl:mb-0 text-left">
                        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight leading-none mb-1.5 flex items-center gap-2.5">
                            <span className="w-1.5 h-6 bg-[#1b5e20] rounded-full"></span>
                            System Activity Log
                        </h2>
                        <p className="text-[13px] font-medium text-gray-400 pl-4 border-l border-gray-100">
                            Audit trail of all administrative and system interactions
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto flex-1 xl:max-w-md">
                        <div className="relative w-full">
                            <input 
                                type="text" 
                                placeholder="Search by user, activity or IP..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-[13px] font-semibold text-gray-700 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-100 transition-all shadow-sm"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#1b5e20] px-6 py-4 flex items-center justify-between text-white">
                        <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Activity History
                        </h3>
                        <div className="text-white/40 text-xs font-black tracking-widest cursor-pointer hover:text-white transition-colors">•••</div>
                    </div>

                    <div className="p-4 md:p-6">
                        <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-center border-collapse">
                                    <thead className="bg-[#051a02] text-white">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Timestamp</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">User</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Activity Type</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Details</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                        {loading ? (
                                            Array.from({ length: 8 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-50 rounded w-full"></div></td>
                                                </tr>
                                            ))
                                        ) : paginatedLogs.length > 0 ? (
                                            paginatedLogs.map((log) => (
                                                <tr key={log._id} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-semibold text-gray-900">
                                                                {new Date(log.createdAt).toLocaleDateString('en-GB')}
                                                            </span>
                                                            <span className="text-[12px] font-medium text-gray-400 mt-0.5">
                                                                {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2.5">
                                                            <div className="w-7 h-7 rounded bg-[#1b5e20]/10 flex items-center justify-center text-[#1b5e20] text-[11px] font-black border border-[#1b5e20]/20">
                                                                {log.userName?.[0] || 'U'}
                                                            </div>
                                                            <span className="font-semibold text-gray-900">{log.userName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                            log.activityType?.includes('Login') ? 'bg-green-50 text-green-700 border-green-100' :
                                                            log.activityType?.includes('Logout') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                            log.activityType?.includes('Update') ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            'bg-gray-50 text-gray-600 border-gray-200'
                                                        }`}>
                                                            {log.activityType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <p className="text-[14px] font-medium text-gray-500 line-clamp-1 leading-relaxed" title={log.details}>
                                                            {log.details}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-400 font-mono text-[12px]">
                                                        {log.ipAddress}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center text-gray-400 italic">No activity matching your criteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination Footer */}
                        {!loading && filteredLogs.length > 0 && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 font-bold">
                                <span className="text-[13px] font-medium text-gray-500">
                                    Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of <span className="text-gray-900">{filteredLogs.length}</span> events
                                </span>
                                
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-bold text-gray-600 disabled:opacity-40 transition-all shadow-sm"
                                    >
                                        Prev
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }).map((_, idx) => {
                                            const pageNum = idx + 1;
                                            if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all shadow-sm ${
                                                            currentPage === pageNum 
                                                            ? 'bg-[#ffcd1e] text-[#1b5e20] border-[#ffcd1e]' 
                                                            : 'bg-white border border-gray-200 text-gray-600 hover:border-green-600'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                                return <span key={pageNum} className="px-1 text-gray-400 font-bold">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-bold text-gray-600 disabled:opacity-40 transition-all shadow-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MemberPortalContainer>
    );
}
