"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';

export default function AdminActivityLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activityFilter, setActivityFilter] = useState('all');
    const [selectedCompany, setSelectedCompany] = useState('all');
    const [activeTab, setActiveTab] = useState<'admin' | 'member'>('admin');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
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

    const companies = useMemo(() => {
        const unique = Array.from(new Set(logs.map(log => log.companyName).filter(Boolean)));
        return unique.filter(c => c.toUpperCase() !== 'ADMIN' && c.toUpperCase() !== 'SYSTEM').sort();
    }, [logs]);

    const filteredLogs = useMemo(() => {
        let result = logs;

        // NEW: Filter by Tab (Role)
        if (activeTab === 'admin') {
            result = result.filter(log => log.userRole === 'admin');
        } else {
            result = result.filter(log => log.userRole !== 'admin');
        }

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

        // Filter by Company
        if (selectedCompany !== 'all') {
            result = result.filter(log => log.companyName === selectedCompany);
        }

        // Filter by Search Term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(log =>
                (log.userName && log.userName.toLowerCase().includes(term)) ||
                (log.userRole && log.userRole.toLowerCase().includes(term)) ||
                (log.activityType && log.activityType.toLowerCase().includes(term)) ||
                (log.details && log.details.toLowerCase().includes(term)) ||
                (log.ipAddress && log.ipAddress.includes(term)) ||
                (log.memberId && log.memberId.toLowerCase().includes(term))
            );
        }

        return result;
    }, [searchTerm, activityFilter, selectedCompany, logs, activeTab]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activityFilter, selectedCompany, activeTab]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <AdminPortalContainer title="Activity Log">
            <div className="space-y-6">
                {/* Tabs Switcher */}
                <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
                    <button
                        onClick={() => setActiveTab('admin')}
                        className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-3 transition-all ${
                            activeTab === 'admin' 
                            ? 'bg-[#1b5e20] text-white border-b-2 border-green-800' 
                            : 'text-gray-500 hover:bg-gray-50 border-transparent'
                        }`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        Admin Logs
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'admin' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {logs.filter(l => l.userRole === 'admin').length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('member')}
                        className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-3 transition-all ${
                            activeTab === 'member' 
                            ? 'bg-[#1b5e20] text-white border-b-2 border-green-800' 
                            : 'text-gray-500 hover:bg-gray-50 border-transparent'
                        }`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Member Logs
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'member' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {logs.filter(l => l.userRole !== 'admin').length}
                        </span>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Search and Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                            <div className="lg:col-span-2 space-y-1.5">
                                <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Activity type</label>
                                <select
                                    value={activityFilter}
                                    onChange={(e) => setActivityFilter(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all cursor-pointer"
                                >
                                    <option value="all">All activities</option>
                                    <option value="Defaulter Search">Defaulter search</option>
                                    <option value="Defaulter Report">Defaulter report</option>
                                    <option value="Recovery Amount Added">Recovery amount added</option>
                                    <option value="Membership Renewal">Membership renewal</option>
                                    <option value="System Login">System login</option>
                                    <option value="System Logout">System logout</option>
                                    <option value="Sub-Member Added">Sub-member added</option>
                                    <option value="Sub-Member Deactivated">Sub-member deactivated</option>
                                    <option value="Profile Update">Profile update</option>
                                </select>
                            </div>

                            <div className="lg:col-span-3 space-y-1.5">
                                <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Company</label>
                                <select
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all cursor-pointer"
                                >
                                    <option value="all">All Companies</option>
                                    {companies.map(company => (
                                        <option key={company} value={company}>{company}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="lg:col-span-6 space-y-1.5">
                                <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Search records</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by name, role, event or IP address..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-10 pr-4 py-2 text-[15px] font-normal text-black placeholder-gray-400 outline-none focus:border-[#1b5e20] transition-all"
                                    />
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                </div>
                            </div>

                            <div className="lg:col-span-1">
                                <button
                                    onClick={fetchLogs}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-gray-500 hover:text-[#1b5e20] hover:bg-green-50 transition-all flex items-center justify-center shadow-sm active:scale-95"
                                    title="Refresh Data"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            <h3 className="text-sm font-bold tracking-tight">
                                {activeTab === 'admin' ? 'Admin Activity Audit' : 'Member Activity Audit'}
                            </h3>
                        </div>

                        <div className="p-4 md:p-5">
                            <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                                <div className="overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[1400px]">
                                        <thead className="sticky top-0 z-10 bg-[#051a02] text-white">
                                            <tr className="divide-x divide-white/5">
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Timestamp</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Member</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Member Id</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Company Name</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">User Type</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Activity Type</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Details</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">IP Address</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={8} className="py-24 text-center">
                                                        <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                        <p className="text-sm font-medium text-gray-500 animate-pulse">Loading Audit Logs...</p>
                                                    </td>
                                                </tr>
                                            ) : paginatedLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="py-32 text-center text-gray-400">
                                                        <p className="text-sm font-medium tracking-widest uppercase">No Activities Found</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedLogs.map((log, i) => (
                                                    <tr key={log._id || i} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex flex-col">
                                                                <span className="text-[13px] font-bold text-gray-900 leading-none">
                                                                    {new Date(log.createdAt).toLocaleDateString('en-GB')}
                                                                </span>
                                                                <span className="text-[11px] font-medium text-emerald-600 mt-1">
                                                                    {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-[14px] font-normal text-gray-900">{log.userName || '-'}</td>
                                                        <td className="px-4 py-3.5">
                                                            <span className="text-[12px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                                                                {log.memberId || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{log.companyName || '-'}</td>
                                                        <td className="px-4 py-3.5">
                                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{log.userRole || 'Member'}</span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-[14px] font-medium text-gray-900">{log.activityType || '-'}</td>
                                                        <td className="px-4 py-3.5">
                                                            <p className="text-[13px] font-normal text-gray-600 line-clamp-1 group-hover:line-clamp-none transition-all duration-300 max-w-md">
                                                                {log.details}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-[12px] text-gray-400">
                                                            {log.ipAddress}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {!loading && filteredLogs.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-white mt-auto">
                                <span className="text-[12px] font-medium text-gray-500">
                                    Showing <span className="font-bold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of <span className="font-bold text-gray-900">{filteredLogs.length}</span> entries
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                                    >
                                        Previous
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }).map((_, idx) => {
                                            const pageNum = idx + 1;
                                            if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all ${currentPage === pageNum ? 'bg-[#1b5e20] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                                return <span key={pageNum} className="text-gray-300">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminPortalContainer>
    );
}
