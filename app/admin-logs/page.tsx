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
        <AdminPortalContainer title="Activity Log">
            <div className="space-y-12 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Activity Log</h2>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                        <select
                            value={activityFilter}
                            onChange={(e) => setActivityFilter(e.target.value)}
                            className="w-full md:w-60 bg-white border-2 border-gray-100 rounded-[1.5rem] px-6 py-4 text-sm font-black text-gray-800 outline-none focus:border-agri-green-primary transition-all shadow-xl shadow-gray-100 italic"
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
                                className="w-full bg-white border-2 border-gray-100 rounded-[1.5rem] pl-14 pr-6 py-4 text-sm font-black text-gray-800 outline-none focus:border-agri-green-primary transition-all shadow-xl shadow-gray-100 group-hover:shadow-2xl italic placeholder:text-gray-300 placeholder:not-italic placeholder:lowercase"
                            />
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-focus-within:bg-agri-green-primary group-focus-within:text-white transition-all">
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
                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 flex flex-col flex-1 overflow-hidden transition-all">

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-agri-green-primary text-white">
                                <tr className="text-[10px] font-black text-white/90 border-b border-white/10 uppercase tracking-wider">
                                    <th className="px-4 py-4 min-w-[140px]">Timestamp</th>
                                    <th className="px-4 py-4 min-w-[120px]">Member</th>
                                    <th className="px-4 py-4 min-w-[100px]">Member ID</th>
                                    <th className="px-4 py-4 min-w-[150px]">Company Name</th>
                                    <th className="px-4 py-4 min-w-[100px]">User Type</th>
                                    <th className="px-4 py-4 min-w-[120px]">Activity Type</th>
                                    <th className="px-4 py-4 min-w-[250px]">Details</th>
                                    <th className="px-4 py-4 text-right">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={8} className="px-4 py-6"><div className="h-12 bg-gray-50 rounded-lg w-full"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedLogs.length > 0 ? (
                                    paginatedLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 group">
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-gray-900">
                                                        {new Date(log.createdAt).toLocaleDateString('en-GB')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-600 tracking-wider">
                                                        {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-[11px] font-bold text-gray-800">{log.userName || '-'}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase tracking-tighter">
                                                    {log.memberId || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-[11px] font-bold text-gray-700">{log.companyName || '-'}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-tight">{log.userRole || 'Member'}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-[11px] font-bold text-gray-900">{log.activityType || '-'}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-[11px] font-medium text-gray-600 leading-relaxed" title={log.details}>
                                                    {log.details}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-[10px] font-mono font-bold text-gray-400">
                                                    {log.ipAddress}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-64 text-center text-gray-400">
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
                        <div className="px-10 py-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 mt-auto">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                showing signals {Math.min(filteredLogs.length, (currentPage - 1) * itemsPerPage + 1)} OF {filteredLogs.length}
                            </span>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-black text-[10px] uppercase tracking-widest text-gray-500 shadow-sm active:scale-95"
                                >
                                    Previous
                                </button>

                                <div className="flex items-center gap-1.5 ">
                                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                                        const pageNum = idx + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all shadow-sm ${currentPage === pageNum ? 'bg-agri-green-primary text-white shadow-lg shadow-emerald-900/20' : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-agri-green-primary'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-black text-[10px] uppercase tracking-widest text-gray-500 shadow-sm active:scale-95"
                                >
                                    Next
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
