"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';

const dateFilterOptions = [
    'All', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Custom Range'
];

export default function CombinedReportsPage() {
    const [reportType, setReportType] = useState('My Defaulter Report');
    const [reports, setReports] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    const [filterOption, setFilterOption] = useState('All');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
        setSearchTerm('');
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');

                if (reportType === 'My Defaulter Report') {
                    const response = await fetch(`${API_BASE_URL}defaulter/my-reports`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setReports(data.data || []);
                    }
                } else {
                    const response = await fetch(`${API_BASE_URL}defaulter/search-history`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setHistory(data.data || []);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [reportType]); // refetch when reportType changes

    useEffect(() => {
        setCurrentPage(1);
    }, [filterOption, customStart, customEnd, searchTerm]);

    const filterByDateAndSearch = (items: any[], isHistory: boolean) => {
        let filtered = [...items];

        if (filterOption !== 'All') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter(item => {
                const itemDate = new Date(item.createdAt);
                const iDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

                let dateMatch = true;
                switch (filterOption) {
                    case 'Today':
                        dateMatch = iDate.getTime() === today.getTime(); break;
                    case 'Yesterday':
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        dateMatch = iDate.getTime() === yesterday.getTime(); break;
                    case 'Last 7 Days':
                        const last7 = new Date(today);
                        last7.setDate(last7.getDate() - 7);
                        dateMatch = iDate >= last7; break;
                    case 'Last 30 Days':
                        const last30 = new Date(today);
                        last30.setDate(last30.getDate() - 30);
                        dateMatch = iDate >= last30; break;
                    case 'This Month':
                        dateMatch = iDate.getMonth() === today.getMonth() && iDate.getFullYear() === today.getFullYear(); break;
                    case 'Last Month':
                        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                        dateMatch = iDate >= lastMonth && iDate <= endOfLastMonth; break;
                    case 'Custom Range':
                        if (customStart && customEnd) {
                            const start = new Date(customStart);
                            start.setHours(0, 0, 0, 0);
                            const end = new Date(customEnd);
                            end.setHours(23, 59, 59, 999);
                            dateMatch = itemDate >= start && itemDate <= end;
                        }
                        break;
                }
                return dateMatch;
            });
        }

        if (searchTerm.trim() !== '') {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(item => {
                if (isHistory) {
                    const f = item.filters || {};
                    const valuesStr = Object.values(f).filter(v => typeof v === 'string').join(' ').toLowerCase();
                    return valuesStr.includes(lowerTerm);
                } else {
                    return (
                        (item.defaulter_name && item.defaulter_name.toLowerCase().includes(lowerTerm)) ||
                        (item.gst_number && item.gst_number.toLowerCase().includes(lowerTerm)) ||
                        (item.pan_number && item.pan_number.toLowerCase().includes(lowerTerm)) ||
                        (item.cin_number && item.cin_number.toLowerCase().includes(lowerTerm)) ||
                        (item.aadhar_number && item.aadhar_number.toLowerCase().includes(lowerTerm)) ||
                        (item.mobile_number && item.mobile_number.toLowerCase().includes(lowerTerm)) ||
                        (item.email_id && item.email_id.toLowerCase().includes(lowerTerm))
                    );
                }
            });
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const filteredReports = useMemo(() => filterByDateAndSearch(reports, false), [reports, filterOption, customStart, customEnd, searchTerm]);
    const filteredHistory = useMemo(() => filterByDateAndSearch(history, true), [history, filterOption, customStart, customEnd, searchTerm]);

    const activeData = reportType === 'My Defaulter Report' ? filteredReports : filteredHistory;
    const totalPages = Math.max(1, Math.ceil(activeData.length / itemsPerPage));
    const paginatedData = activeData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <MemberPortalContainer title="Reports">
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col xl:flex-row items-end justify-between gap-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all duration-300">
                    <div className="w-full xl:w-auto mb-4 xl:mb-0 text-left">
                        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight leading-none mb-1.5 flex items-center gap-2.5">
                            <span className="w-1.5 h-6 bg-[#1b5e20] rounded-full"></span>
                            {reportType === 'My Defaulter Report' ? 'Defaulter Report' : 'Search Report'}
                        </h2>
                        <p className="text-[13px] font-medium text-gray-400 pl-4 border-l border-gray-100">
                            {reportType === 'My Defaulter Report' ? 'Overview of defaulters you have reported' : 'History of defaulters you have searched for'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full xl:w-auto flex-1 xl:max-w-4xl">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-gray-400 ml-1">Report Type</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2.5 px-3 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-100 text-[13px] font-semibold text-gray-700 shadow-sm transition-all"
                            >
                                <option value="My Defaulter Report">My Defaulter Report</option>
                                <option value="Search Report">Search Report</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-gray-400 ml-1">Date Range Filter</label>
                            <select
                                value={filterOption}
                                onChange={(e) => setFilterOption(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2.5 px-3 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-100 text-[13px] font-semibold text-gray-700 shadow-sm transition-all"
                            >
                                {dateFilterOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {filterOption === 'Custom Range' ? (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-bold text-gray-400 ml-1">Custom Dates</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2.5 px-3 outline-none focus:border-green-600 text-[12px] font-bold text-gray-700 h-[42px]"
                                    />
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2.5 px-3 outline-none focus:border-green-600 text-[12px] font-bold text-gray-700 h-[42px]"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-bold text-gray-400 ml-1">Quick Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search records..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-100 text-[13px] font-semibold text-gray-700 shadow-sm transition-all"
                                    />
                                    <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        )}

                        {filterOption === 'Custom Range' && (
                             <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-bold text-gray-400 ml-1">Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search records..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-100 text-[13px] font-semibold text-gray-700 shadow-sm transition-all"
                                    />
                                    <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#1b5e20] px-6 py-4 flex items-center justify-between text-white">
                        <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            {reportType === 'My Defaulter Report' ? 'My Reported Defaulters' : 'Defaulter Search History'}
                        </h3>
                        <div className="text-white/40 text-xs font-black tracking-widest cursor-pointer hover:text-white transition-colors">•••</div>
                    </div>

                    <div className="p-4 md:p-6">
                        <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                            <div className="overflow-x-auto">
                                {reportType === 'My Defaulter Report' ? (
                                    <table className="w-full text-center border-collapse">
                                        <thead className="bg-[#051a02] text-white">
                                            <tr className="divide-x divide-white/5">
                                                <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Date</th>
                                                <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Defaulter Company Name</th>
                                                <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Amount</th>
                                                <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Outstanding</th>
                                                <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Status</th>
                                                <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="py-20 text-center text-gray-400 italic">Synchronizing records...</td>
                                                </tr>
                                            ) : paginatedData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-20 text-center text-gray-400 italic">No records found.</td>
                                                </tr>
                                            ) : (
                                                paginatedData.map((item, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-gray-400">
                                                            {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col items-center">
                                                                <span className="font-semibold text-gray-900 leading-tight">{item.defaulter_name}</span>
                                                                <span className="text-[12px] text-gray-400 font-medium">GST: {item.gst_number || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                                            ₹{Number(item.default_amount).toLocaleString('en-IN')}
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-red-600">
                                                            ₹{Number(item.outstanding_amount || item.default_amount).toLocaleString('en-IN')}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${item.status === 1 ? 'bg-green-50 text-green-700 border-green-100' :
                                                                item.status === 2 ? 'bg-red-50 text-red-700 border-red-100' :
                                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                                }`}>
                                                                {item.status === 1 ? 'Approved' : item.status === 2 ? 'Rejected' : 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={() => setSelectedReport(item)}
                                                                className="px-3 py-1 bg-[#1b5e20] text-white hover:bg-[#2e7d32] rounded-md text-[11px] font-semibold transition-all shadow-sm"
                                                            >
                                                                View Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="w-full text-center border-collapse">
                                        <thead className="bg-[#051a02] text-white">
                                            <tr className="divide-x divide-white/5">
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Search Date</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">GST</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">PAN</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">CIN</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Name</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Records Identified</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Default Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={7} className="py-20 text-center text-gray-400 italic">Fetching history...</td>
                                                </tr>
                                            ) : paginatedData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-20 text-center text-gray-400 italic">No search records available.</td>
                                                </tr>
                                            ) : (
                                                paginatedData.map((item, i) => {
                                                    const f = item.filters || {};
                                                    return (
                                                        <tr key={i} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors">
                                                            <td className="px-4 py-3 text-gray-400">
                                                                {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                                            </td>
                                                            <td className="px-4 py-3 font-mono text-[12px] uppercase text-gray-500">
                                                                {f.gst || f.gst_number || '---'}
                                                            </td>
                                                            <td className="px-4 py-3 font-mono text-[12px] uppercase text-gray-500">
                                                                {f.pan || f.pan_number || '---'}
                                                            </td>
                                                            <td className="px-4 py-3 font-mono text-[12px] uppercase text-gray-500">
                                                                {f.cin || f.cin_number || '---'}
                                                            </td>
                                                            <td className="px-4 py-3 font-semibold text-gray-900">
                                                                {f.name || f.defaulter_name || '---'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 rounded-full font-semibold text-[11px] ${item.resultCount > 0 ? 'bg-green-50 text-agri-green-primary border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                                    {item.resultCount || 0} Records
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 font-semibold text-red-600">
                                                                ₹{item.resultCount > 0 ? (Number(f.default_amount || 0)).toLocaleString('en-IN') : '0'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Pagination Controls */}
                        {!loading && activeData.length > 0 && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                                <span className="text-[13px] font-medium text-gray-500">
                                    Showing <span className="text-gray-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900 font-bold">{Math.min(currentPage * itemsPerPage, activeData.length)}</span> of <span className="text-gray-900 font-bold">{activeData.length}</span> entries
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[12px] font-bold text-gray-600 shadow-sm"
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
                                                        className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all shadow-sm ${currentPage === pageNum ? 'bg-[#ffcd1e] text-[#1b5e20] border-[#ffcd1e]' : 'bg-white border border-gray-200 hover:border-green-600 text-gray-600'}`}
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
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[12px] font-bold text-gray-600 shadow-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
                        {/* Modal Header */}
                        <div className="bg-[#1b5e20] p-5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[16px] tracking-tight">Defaulter Record Details</h3>
                                    <p className="text-[11px] text-white/60 font-medium">Report generated on {new Date(selectedReport.createdAt).toLocaleDateString('en-GB')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Company Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-gray-400">Defaulter Company Name</p>
                                    <p className="text-[15px] font-bold text-gray-900 leading-tight">{selectedReport.defaulter_name || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-gray-400">Date of Default</p>
                                    <p className="text-[14px] font-semibold text-gray-800">{selectedReport.date_of_default ? new Date(selectedReport.date_of_default).toLocaleDateString('en-GB') : 'N/A'}</p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-gray-400 flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                                        Mobile Number
                                    </p>
                                    <p className="text-[13px] font-semibold text-gray-700">{selectedReport.mobile_number || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-gray-400 flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                        Email Address
                                    </p>
                                    <p className="text-[13px] font-semibold text-gray-700">{selectedReport.email_id || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Identifiers Grid */}
                            <div className="space-y-3">
                                <h4 className="text-[12px] font-bold text-[#1b5e20] tracking-wide uppercase">Business Identifiers</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'GST', val: selectedReport.gst_number },
                                        { label: 'PAN', val: selectedReport.pan_number },
                                        { label: 'CIN', val: selectedReport.cin_number },
                                        { label: 'Aadhar', val: selectedReport.aadhar_number }
                                    ].map((id, i) => (
                                        <div key={i} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                            <p className="text-[10px] font-black text-gray-400 mb-1">{id.label}</p>
                                            <p className="text-[12px] font-bold text-gray-800 tabular-nums">{id.val || 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Location & Industry */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-3">
                                    <h4 className="text-[12px] font-bold text-[#1b5e20] tracking-wide uppercase">Location Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400">State</p>
                                            <p className="text-[12px] font-semibold text-gray-800">{selectedReport.state || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400">District</p>
                                            <p className="text-[12px] font-semibold text-gray-800">{selectedReport.district || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-[12px] font-bold text-[#1b5e20] tracking-wide uppercase">Industry Context</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400">Industry</p>
                                            <p className="text-[12px] font-semibold text-gray-800">{selectedReport.industry || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400">Financial Year</p>
                                            <p className="text-[12px] font-semibold text-gray-800">{selectedReport.financial_year || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="mt-8 flex items-center justify-between gap-6 bg-[#fffbeb] p-5 rounded-xl border border-amber-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Total Reported Amount</p>
                                    <p className="text-[22px] font-black text-amber-800 tabular-nums">
                                        ₹{Number(selectedReport.default_amount || 0).toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="w-px h-12 bg-amber-200"></div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-1">Current Outstanding</p>
                                    <p className="text-[24px] font-black text-red-700 tabular-nums">
                                        ₹{Number(selectedReport.outstanding_amount ?? selectedReport.default_amount).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MemberPortalContainer>
    );
}
