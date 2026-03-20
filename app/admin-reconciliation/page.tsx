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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Filters Section */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-12 items-end gap-6">
                        <div className="lg:col-span-5 space-y-2 w-full">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Advanced Search</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search by Transaction ID, Member Name, or Company..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-gray-800 outline-none focus:border-[#1b5e20] focus:bg-white transition-all italic"
                                />
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
                            </div>
                        </div>

                        <div className="lg:col-span-3 space-y-2 w-full">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Range</label>
                            <div className="relative group">
                                <select
                                    value={selectedRange}
                                    onChange={(e) => handleRangeChange(e.target.value)}
                                    className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-800 outline-none focus:border-[#1b5e20] focus:bg-white transition-all appearance-none cursor-pointer italic"
                                >
                                    <option value="all">All</option>
                                    <option value="today">Today</option>
                                    <option value="yesterday">Yesterday</option>
                                    <option value="last7">Last 7 Days</option>
                                    <option value="last30">Last 30 Days</option>
                                    <option value="thisMonth">This Month</option>
                                    <option value="lastMonth">Last Month</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</span>
                            </div>
                        </div>

                        {selectedRange === 'custom' && (
                            <div className="lg:col-span-4 flex gap-4 w-full">
                                <div className="space-y-2 flex-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Start Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl px-6 py-3.5 text-xs font-bold text-gray-800 outline-none focus:border-[#1b5e20] focus:bg-white transition-all uppercase tracking-tighter"
                                    />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">End Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl px-6 py-3.5 text-xs font-bold text-gray-800 outline-none focus:border-[#1b5e20] focus:bg-white transition-all uppercase tracking-tighter"
                                    />
                                </div>
                            </div>
                        )}

                        {selectedRange !== 'custom' && (
                            <div className="lg:col-span-4 flex items-center gap-4 text-emerald-600 animate-in fade-in zoom-in duration-300">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                    <span className="text-xl">📅</span>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Reporting Period</span>
                                        <span className="text-xs font-bold whitespace-nowrap">
                                            {selectedRange === 'all' ? 'Indefinite' : `${dateRange.start} → ${dateRange.end}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-[#1b5e20] text-white">
                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10">
                                    <th className="px-8 py-6">Transaction Date</th>
                                    <th className="px-8 py-6">Member ID</th>
                                    <th className="px-8 py-6">Member Name</th>
                                    <th className="px-8 py-6">Company Name</th>
                                    <th className="px-8 py-6">Transaction ID</th>
                                    <th className="px-8 py-6">Plan Info</th>
                                    <th className="px-8 py-6">Amount</th>
                                    <th className="px-8 py-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={8} className="px-8 py-6"><div className="h-10 bg-gray-50 rounded-xl w-full"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedItems.length > 0 ? (
                                    paginatedItems.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col whitespace-nowrap">
                                                    <span className="text-xs font-bold text-gray-800">
                                                        {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] font-black text-gray-400">
                                                        {new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-black text-[#1b5e20] bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 uppercase tracking-tighter">
                                                    {tx.user_id?.memberId || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-gray-900 tracking-tight whitespace-nowrap">
                                                    {tx.user_id?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                    {tx.user_id?.companyName || 'System'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">
                                                    {tx.txNo}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col whitespace-nowrap">
                                                    <span className="text-xs font-bold text-gray-700">{tx.plan_id?.name || 'Custom Plan'}</span>
                                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.15em]">{tx.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-gray-900 whitespace-nowrap">₹ {(tx.amount || 0).toLocaleString('en-IN')}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${tx.status === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-48 text-center text-gray-300">
                                            <div className="text-7xl mb-6 opacity-20">🪙</div>
                                            <p className="text-sm font-black uppercase tracking-[0.2em] italic">No Transactions Recorded</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-10 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                                Page {currentPage} OF {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-6 py-2 rounded-xl bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-6 py-2 rounded-xl bg-[#1b5e20] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#144317] disabled:opacity-30 transition-all shadow-md active:scale-95"
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
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 2px solid #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </AdminPortalContainer>
    );
}
