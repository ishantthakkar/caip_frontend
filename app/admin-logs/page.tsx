"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';

export default function AdminActivityLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activityFilter, setActivityFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}admin/activity-logs`, {
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
        let result = logs;

        // Filter by Activity Type
        if (activityFilter !== 'all') {
            result = result.filter(log => {
                const type = log.activityType?.toLowerCase() || '';
                switch (activityFilter) {
                    case 'Defaulter Search': return type.includes('search');
                    case 'Defaulter Report': return type.includes('report');
                    case 'Recovery Amount Added': return type.includes('payment') || type.includes('recovery');
                    case 'Membership Renewal': return type.includes('membership') || type.includes('renewal');
                    case 'Report Downloaded': return type.includes('download');
                    case 'System Login': return type.includes('login');
                    case 'System Logout': return type.includes('logout');
                    case 'Sub-Member Added': return type.includes('sub-member added') || type.includes('sub-member created');
                    case 'Sub-Member Deactivated': return type.includes('sub-member deactivated') || type.includes('sub-member disabled');
                    case 'Password Change': return type.includes('password');
                    case 'Profile Update': return type.includes('profile');
                    default: return true;
                }
            });
        }

        // Filter by Search Term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(log =>
                (log.userName && log.userName.toLowerCase().includes(term)) ||
                (log.userRole && log.userRole.toLowerCase().includes(term)) ||
                (log.activityType && log.activityType.toLowerCase().includes(term)) ||
                (log.details && log.details.toLowerCase().includes(term)) ||
                (log.ipAddress && log.ipAddress.includes(term))
            );
        }

        return result;
    }, [searchTerm, activityFilter, logs]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activityFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <AdminPortalContainer title="System activity trace">
            <div className="space-y-12 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">Activity Log</h2>
                        <p className="text-xs font-bold text-[#1b5e20] mt-1 tracking-wider opacity-70">CAIP</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                        <select
                            value={activityFilter}
                            onChange={(e) => setActivityFilter(e.target.value)}
                            className="w-full md:w-60 bg-white border-2 border-gray-100 rounded-[1.5rem] px-6 py-4 text-sm font-black text-gray-800 outline-none focus:border-[#1b5e20] transition-all shadow-xl shadow-gray-100 italic"
                        >
                            <option value="all">All activities</option>
                            <option value="Defaulter Search">Defaulter search</option>
                            <option value="Defaulter Report">Defaulter report</option>
                            <option value="Recovery Amount Added">Recovery amount added</option>
                            <option value="Membership Renewal">Membership renewal</option>
                            <option value="Report Downloaded">Report downloaded</option>
                            <option value="System Login">System login</option>
                            <option value="System Logout">System logout</option>
                            <option value="Sub-Member Added">Sub-member added</option>
                            <option value="Sub-Member Deactivated">Sub-member deactivated</option>
                            <option value="Password Change">Password change</option>
                            <option value="Profile Update">Profile update</option>
                        </select>

                        <div className="relative flex-1 lg:w-96 group">
                            <input
                                type="text"
                                placeholder="Search by identity, event or terminal IP..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border-2 border-gray-100 rounded-[1.5rem] pl-14 pr-6 py-4 text-sm font-black text-gray-800 outline-none focus:border-[#1b5e20] transition-all shadow-xl shadow-gray-100 group-hover:shadow-2xl italic placeholder:text-gray-300 placeholder:not-italic placeholder:lowercase"
                            />
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-focus-within:bg-[#1b5e20] group-focus-within:text-white transition-all">
                                🔎
                            </div>
                        </div>
                        <button
                            onClick={fetchLogs}
                            className="bg-white p-4 rounded-[1.5rem] border-2 border-gray-100 shadow-lg hover:bg-gray-50 active:scale-95 transition-all text-xl"
                            title="Force refresh data"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col min-h-[700px]">
                    <div className="bg-[#1b5e20] px-10 py-8 flex justify-between items-center text-white">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shadow-inner">
                                📜
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-widest font-serif italic">Activity Log</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-6 py-3 bg-black/20 rounded-2xl border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-[10px] font-black tracking-wider">{filteredLogs.length} Total events recorded</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto p-4 custom-scrollbar">
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 tracking-wider">
                                    <th className="px-8 py-4">Chronology</th>
                                    <th className="px-8 py-4">Actor entity</th>
                                    <th className="px-8 py-4">Event orbit</th>
                                    <th className="px-8 py-4">Transaction details</th>
                                    <th className="px-8 py-4 text-right">Terminal identity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-0 italic">
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-8 py-6 px-10"><div className="h-12 bg-gray-50 rounded-2xl w-full"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedLogs.length > 0 ? (
                                    paginatedLogs.map((log) => (
                                        <tr key={log._id} className="group hover:bg-gray-50/80 transition-all rounded-3xl cursor-default">
                                            <td className="px-8 py-6 rounded-l-[1.5rem] bg-gray-50/50 group-hover:bg-white transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-900 tracking-tighter">
                                                        {new Date(log.createdAt).toLocaleDateString('en-GB')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#1b5e20] not-italic tracking-wider mt-0.5">
                                                        {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#1b5e20] text-sm font-black transition-transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#1b5e20]/10">
                                                        {log.userName?.[0] || 'A'}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-black text-gray-800 block truncate max-w-[150px]">{log.userName}</span>
                                                        <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-md bg-gray-400 opacity-60 not-italic tracking-wider">{log.userRole || 'Admin'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex px-4 py-2 rounded-xl text-[10px] font-black tracking-wider border not-italic shadow-sm ${log.activityType?.toLowerCase().includes('login') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    log.activityType?.toLowerCase().includes('logout') ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                        log.activityType?.toLowerCase().includes('update') || log.activityType?.toLowerCase().includes('status') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                            'bg-[#1b5e20]/5 text-[#1b5e20] border-[#1b5e20]/10'
                                                    }`}>
                                                    {log.activityType}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 min-w-[300px]">
                                                <p className="text-xs font-bold text-gray-500 line-clamp-2 leading-relaxed" title={log.details}>
                                                    {log.details}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-right rounded-r-[1.5rem] bg-gray-50/50 group-hover:bg-white transition-colors">
                                                <span className="text-[10px] font-black text-gray-400 font-mono tracking-wider bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm not-italic group-hover:text-[#1b5e20] transition-colors">
                                                    {log.ipAddress}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-64 text-center text-gray-400">
                                            <div className="text-7xl mb-8 opacity-10 animate-pulse">📡</div>
                                            <p className="text-sm font-black tracking-wider italic">No Record Found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {!loading && filteredLogs.length > 0 && (
                        <div className="mt-auto p-10 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <span className="text-[11px] font-black text-gray-400 tracking-wider font-serif">
                                Event trace <span className="text-[#1b5e20]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-[#1b5e20]">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of <span className="text-[#1b5e20]">{filteredLogs.length}</span> recorded signals
                            </span>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-6 py-3 rounded-2xl bg-white border-2 border-gray-100 text-[10px] font-black tracking-wider hover:border-[#1b5e20] hover:text-[#1b5e20] disabled:opacity-30 transition-all shadow-sm active:scale-95"
                                >
                                    Previous
                                </button>

                                <div className="flex gap-2">
                                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                                        const pageNum = idx + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-12 h-12 rounded-2xl text-[11px] font-black transition-all shadow-lg ${currentPage === pageNum
                                                    ? 'bg-[#1b5e20] text-white shadow-[#1b5e20]/20'
                                                    : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-[#1b5e20] hover:text-[#1b5e20]'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-6 py-3 rounded-2xl bg-[#1b5e20] text-white text-[10px] font-black tracking-wider hover:bg-black disabled:opacity-30 transition-all shadow-xl shadow-[#1b5e20]/20 active:scale-95"
                                >
                                    Next phase
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 3px solid #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </AdminPortalContainer>
    );
}
