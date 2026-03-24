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
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">System Activity Log</h2>
                        <p className="text-sm text-gray-500">Audit trail of all administrative and system interactions</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="relative flex-1 md:w-80">
                            <input 
                                type="text" 
                                placeholder="Search by user, activity or IP..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-100 transition-all"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#1b5e20] text-white">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Time</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">User</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Activity</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedLogs.length > 0 ? (
                                    paginatedLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {new Date(log.createdAt).toLocaleDateString('en-GB')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                        {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-700 text-xs font-black border border-green-100 uppercase">
                                                        {log.userName?.[0] || 'U'}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{log.userName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                                    log.activityType?.includes('Login') ? 'bg-green-50 text-green-700 border-green-100' :
                                                    log.activityType?.includes('Logout') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    log.activityType?.includes('Update') ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                    {log.activityType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-gray-600 truncate max-w-[250px]" title={log.details}>
                                                    {log.details}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-bold text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                                    {log.ipAddress}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-32 text-center text-gray-400">
                                            <div className="text-4xl mb-3 opacity-20">📊</div>
                                            <p className="text-xs font-bold uppercase tracking-widest">No activity found matching your search</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {!loading && filteredLogs.length > 0 && (
                        <div className="mt-auto p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} events
                            </span>
                            
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold disabled:opacity-50 transition-all active:scale-95"
                                >
                                    Prev
                                </button>
                                
                                {Array.from({ length: totalPages }).map((_, idx) => {
                                    const pageNum = idx + 1;
                                    // Show first, last, and pages around current
                                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                                                    currentPage === pageNum 
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-200' 
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-green-600 hover:text-green-600'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                        return <span key={pageNum} className="flex items-end pb-1 text-gray-400 px-1">...</span>;
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold disabled:opacity-50 transition-all active:scale-95"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MemberPortalContainer>
    );
}
