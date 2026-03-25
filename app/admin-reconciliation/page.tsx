"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';

export default function AdminReconciliationPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    useEffect(() => {
        fetchTransactions();
    }, [dateRange]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            let url = `${API_BASE_URL}admin/reconciliation`;

            const params = new URLSearchParams();
            if (dateRange.start) params.append('startDate', dateRange.start);
            if (dateRange.end) params.append('endDate', dateRange.end);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setTransactions(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = useMemo(() => {
        if (!searchTerm.trim()) return transactions;
        const term = searchTerm.toLowerCase();
        return transactions.filter(tx =>
            tx.txNo.toLowerCase().includes(term) ||
            (tx.user_id?.name || '').toLowerCase().includes(term) ||
            (tx.user_id?.companyName || '').toLowerCase().includes(term) ||
            (tx.user_id?.memberId || '').toLowerCase().includes(term)
        );
    }, [searchTerm, transactions]);

    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
    const paginatedItems = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Calculate Stats
    const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const successCount = transactions.filter(tx => tx.status === 'Success').length;

    const [selectedRange, setSelectedRange] = useState('all');

    const handleRangeChange = (range: string) => {
        setSelectedRange(range);
        const today = new Date();
        let start = '';
        let end = '';

        switch (range) {
            case 'today':
                start = today.toISOString().split('T')[0];
                end = start;
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                start = yesterday.toISOString().split('T')[0];
                end = start;
                break;
            case 'last7':
                const last7 = new Date(today);
                last7.setDate(today.getDate() - 7);
                start = last7.toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];
                break;
            case 'last30':
                const last30 = new Date(today);
                last30.setDate(today.getDate() - 30);
                start = last30.toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];
                break;
            case 'thisMonth':
                start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];
                break;
            case 'lastMonth':
                const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                start = firstOfLastMonth.toISOString().split('T')[0];
                end = lastOfLastMonth.toISOString().split('T')[0];
                break;
            case 'all':
            default:
                start = '';
                end = '';
                break;
        }

        if (range !== 'custom') {
            setDateRange({ start, end });
        }
    };

    return (
        <AdminPortalContainer title="Payment Reconciliation">
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
                        <div className="lg:col-span-5 space-y-1.5 flex flex-col">
                            <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Advanced search</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search Transaction ID, Member, or Company..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-10 pr-4 py-2.5 text-[15px] font-normal text-black placeholder-gray-400 outline-none focus:border-[#1b5e20] transition-all focus:bg-white shadow-sm"
                                />
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            </div>
                        </div>

                        <div className={`${selectedRange === 'custom' ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-1.5 flex flex-col`}>
                            <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Period</label>
                            <div className="relative">
                                <select
                                    value={selectedRange}
                                    onChange={(e) => handleRangeChange(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-[15px] font-normal text-black outline-none focus:border-[#1b5e20] transition-all focus:bg-white shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="all">All Records</option>
                                    <option value="today">Today</option>
                                    <option value="yesterday">Yesterday</option>
                                    <option value="last7">Last 7 Days</option>
                                    <option value="last30">Last 30 Days</option>
                                    <option value="thisMonth">This Month</option>
                                    <option value="lastMonth">Last Month</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>

                        {selectedRange === 'custom' ? (
                            <div className="lg:col-span-4 grid grid-cols-2 gap-3 items-end">
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Start</label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-[14px] font-normal outline-none focus:border-[#1b5e20] transition-all focus:bg-white shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">End</label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-[14px] font-normal outline-none focus:border-[#1b5e20] transition-all focus:bg-white shadow-sm"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="lg:col-span-3 flex items-center">
                                <div className="px-4 py-2.5 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-2.5 w-full">
                                    <svg className="text-emerald-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/60 leading-none mb-0.5">Active interval</span>
                                        <span className="text-[12px] font-bold text-emerald-700 whitespace-nowrap">
                                            {selectedRange === 'all' ? 'All historical records' : `${dateRange.start} → ${dateRange.end}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        <h3 className="text-sm font-bold tracking-tight">Payment Reconciliation Ledger</h3>
                    </div>

                    <div className="p-4 md:p-5">
                        <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                            <div className="overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[1200px]">
                                    <thead className="sticky top-0 z-10 bg-[#051a02] text-white">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Transaction date</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Member id</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Member name</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Company name</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Transaction id</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Plan info</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Amount</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 border-b border-gray-50 bg-white">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="py-24 text-center">
                                                    <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                    <p className="text-sm font-medium text-gray-500 animate-pulse">Fetching Transaction Ledger...</p>
                                                </td>
                                            </tr>
                                        ) : paginatedItems.length > 0 ? (
                                            paginatedItems.map((tx) => (
                                                <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[14px] font-bold text-gray-900 leading-tight">
                                                                {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                                                {new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-0.5 bg-green-50 text-[11px] font-bold text-[#1b5e20] rounded-lg border border-green-100 uppercase tracking-tight">
                                                            {tx.user_id?.memberId || 'SYSTEM'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[14px] font-bold text-gray-900 tracking-tight">
                                                            {tx.user_id?.name || '---'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[13px] font-bold text-emerald-700/70 capitalize">
                                                            {tx.user_id?.companyName || '---'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[13px] font-mono font-medium text-gray-500 uppercase">
                                                            {tx.txNo}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[14px] font-bold text-gray-700 leading-tight">{tx.plan_id?.name || 'Enterprise'}</span>
                                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{tx.type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[15px] font-bold text-gray-900">₹ {(tx.amount || 0).toLocaleString('en-IN')}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-tight uppercase border ${
                                                            tx.status === 'Success' 
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                                : 'bg-rose-50 text-rose-600 border-rose-100'
                                                        }`}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="py-24 text-center text-gray-400">
                                                    <p className="text-sm font-medium tracking-widest uppercase italic">No Transactions Identified</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Pagination Footer */}
                    {!loading && filteredTransactions.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-white mt-auto">
                            <span className="text-[12px] font-medium text-gray-500">
                                Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
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
                                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; background-clip: content-box; }
            `}</style>
        </AdminPortalContainer>
    );
}
