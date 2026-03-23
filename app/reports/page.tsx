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
        <MemberPortalContainer title="Reports Dashboard">
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* Header & Filters Section */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {reportType === 'My Defaulter Report' ? 'Defaulter Reports' : 'Search Analytics'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {reportType === 'My Defaulter Report' ? 'Analysis of defaulter records submitted by your organization' : 'Detailed history of searching activities and results'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                        <div className="flex flex-col min-w-[200px]">
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 ml-1">Report Category</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 outline-none focus:border-agri-green-primary text-sm font-semibold text-slate-700 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="My Defaulter Report">My Defaulter Report</option>
                                <option value="Search Report">Search Report</option>
                            </select>
                        </div>

                        <div className="h-10 w-px bg-slate-100 hidden lg:block mx-1"></div>

                        <div className="flex flex-col min-w-[150px]">
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 ml-1">Timeline</label>
                            <select
                                value={filterOption}
                                onChange={(e) => setFilterOption(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 outline-none focus:border-agri-green-primary text-sm font-semibold text-slate-700 transition-all cursor-pointer shadow-sm"
                            >
                                {dateFilterOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {filterOption === 'Custom Range' && (
                            <div className="flex flex-col min-w-[300px]">
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 ml-1">Select Dates</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 outline-none focus:border-agri-green-primary text-xs font-bold text-slate-700 h-[42px] transition-all shadow-sm"
                                    />
                                    <span className="text-slate-300 font-black text-[10px]">TO</span>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 outline-none focus:border-agri-green-primary text-xs font-bold text-slate-700 h-[42px] transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="h-10 w-px bg-slate-100 hidden lg:block mx-1"></div>

                        <div className="flex flex-col flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 ml-1">Quick Search</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Company, GST, PAN..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-agri-green-primary text-sm font-semibold text-slate-700 transition-all shadow-sm"
                                />
                                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
                    <div className="overflow-x-auto">
                        {reportType === 'My Defaulter Report' ? (
                            <table className="w-full text-left">
                                <thead className="bg-agri-green-primary text-white">
                                    <tr>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight">Report Date</th>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight">Defaulter Entity</th>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight">Total Amount</th>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight">Outstanding Balance</th>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight">Verification Status</th>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center">
                                                <div className="inline-block w-8 h-8 border-4 border-slate-100 border-t-agri-green-primary rounded-full animate-spin"></div>
                                                <p className="mt-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Retrieving Records...</p>
                                            </td>
                                        </tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center">
                                                <div className="text-4xl mb-4 opacity-20 filter grayscale">📊</div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching report data identified</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                                                <td className="px-8 py-6 text-sm font-bold text-slate-600">
                                                    {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-black text-slate-800 mb-1">{item.defaulter_name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-white bg-slate-400 px-1.5 py-0.5 rounded leading-none">{item.gst_number ? 'GST' : 'PAN'}</span>
                                                        <span className="text-xs font-bold text-slate-400 font-mono tracking-tighter">{item.gst_number || item.pan_number || '---'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-black text-slate-800 tabular-nums">
                                                    ₹{Number(item.default_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-8 py-6 text-sm font-black text-rose-600 tabular-nums">
                                                    ₹{Number(item.outstanding_amount ?? item.default_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest border transition-colors ${item.status === 1 ? 'bg-green-50 text-green-700 border-green-100' :
                                                        item.status === 2 ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                            'bg-amber-50 text-amber-700 border-amber-100'
                                                        }`}>
                                                        {item.status === 1 ? 'Approved' : item.status === 2 ? 'Rejected' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => setSelectedReport(item)}
                                                        className="w-10 h-10 inline-flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-agri-green-primary hover:border-agri-green-primary hover:shadow-sm rounded-lg transition-all group-hover:scale-110"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-agri-green-primary text-white">
                                    <tr>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight">Search Inquiry Date</th>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight">Tax Identifiers</th>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight text-center">Entity Name</th>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight text-center">Risk Discovery</th>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight text-center">Exposure Volume</th>
                                        <th className="px-8 py-5 text-[14px] font-bold tracking-tight text-center">Record Hits</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center">
                                                <div className="inline-block w-8 h-8 border-4 border-slate-100 border-t-agri-green-primary rounded-full animate-spin"></div>
                                            </td>
                                        </tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No past search activities located</td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, i) => {
                                            const f = item.filters || {};
                                            return (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-8 py-6 text-sm font-semibold text-slate-700">
                                                        {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-xs font-bold text-slate-500 font-mono tracking-tighter">GST: {f.gst || f.gst_number || '---'}</p>
                                                            <p className="text-xs font-bold text-slate-400 font-mono tracking-tighter">PAN: {f.pan || f.pan_number || '---'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm font-black text-slate-800 text-center">
                                                        {f.name || f.defaulter_name || '---'}
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest border ${item.resultCount > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                            {item.resultCount > 0 ? 'Risk Found' : 'Clean Profile'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm font-black text-slate-800 text-center tabular-nums">
                                                        ₹{item.resultCount > 0 ? (Number(f.default_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                                                    </td>
                                                    <td className="px-8 py-6 text-sm font-black text-agri-green-primary text-center">
                                                        {item.resultCount || 0}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination Suite */}
                    {!loading && activeData.length > 0 && (
                        <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recording {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, activeData.length)} of {activeData.length} records</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold text-xs disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                    Prev
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                        const pageNum = idx + 1;
                                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-9 h-9 rounded-lg text-xs font-black transition-all ${currentPage === pageNum ? 'bg-agri-green-primary text-white shadow-lg shadow-green-900/20' : 'bg-white border border-slate-200 text-slate-500 hover:border-agri-green-primary hover:text-agri-green-primary'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <span key={pageNum} className="flex items-end pb-1 text-slate-300 px-1 font-black">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold text-xs disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedReport(null)}></div>
                    <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-400">
                        {/* Header */}
                        <div className="px-8 py-6 bg-agri-green-primary flex items-center justify-between text-white shadow-lg">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl border border-white/20">📜</div>
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight mb-0.5">Defaulter Analytics Profile</h3>
                                    <p className="text-xs text-white/60 font-medium">Recorded on {new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all border border-white/10 active:scale-90"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                            </button>
                        </div>

                        <div className="p-10 overflow-y-auto space-y-10 bg-slate-50/30">
                            {/* Identity Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <div className="w-4 h-1 bg-agri-green-primary rounded-full"></div> Entity Name
                                    </label>
                                    <p className="text-sm font-black text-slate-800 leading-tight">{selectedReport.defaulter_name || '---'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <div className="w-4 h-1 bg-agri-green-primary rounded-full"></div> Mobile Contact
                                    </label>
                                    <p className="text-sm font-bold text-slate-700">{selectedReport.mobile_number || '---'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <div className="w-4 h-1 bg-agri-green-primary rounded-full"></div> Occurrence Date
                                    </label>
                                    <p className="text-sm font-bold text-slate-700">{selectedReport.date_of_default ? new Date(selectedReport.date_of_default).toLocaleDateString('en-GB') : '---'}</p>
                                </div>
                            </div>

                            <div className="h-px bg-slate-200/50"></div>

                            {/* Identifiers Card */}
                            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm grid grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Identifier</p>
                                    <p className="text-sm font-black text-slate-700 font-mono tracking-tighter mt-1">{selectedReport.gst_number || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permanent Tax No.</p>
                                    <p className="text-sm font-black text-slate-700 font-mono tracking-tighter mt-1">{selectedReport.pan_number || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate ID</p>
                                    <p className="text-sm font-black text-slate-700 font-mono tracking-tighter mt-1">{selectedReport.cin_number || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aadhar Unique ID</p>
                                    <p className="text-sm font-black text-slate-700 font-mono tracking-tighter mt-1">{selectedReport.aadhar_number || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-rose-600 rounded-xl p-8 text-white flex flex-col md:flex-row gap-8 shadow-xl shadow-rose-900/20">
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Original Default Amount</p>
                                    <p className="text-3xl font-black tabular-nums">₹{Number(selectedReport.default_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="w-px bg-white/10 hidden md:block"></div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Net Outstanding Exposure</p>
                                    <p className="text-3xl font-black tabular-nums">₹{Number(selectedReport.outstanding_amount ?? selectedReport.default_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>

                            {/* Jurisdiction Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Involved Judiciary/Region</label>
                                    <p className="text-sm font-black text-slate-800">{selectedReport.state || 'N/A'}, {selectedReport.district || 'NA'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Delinquency Reason</label>
                                    <p className="text-sm font-semibold text-slate-600 bg-white p-4 rounded-lg border border-slate-100 italic leading-relaxed">"{selectedReport.reason_description || 'Compliance failure during trade cycle'}"</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-10 py-6 bg-slate-50 border-t border-slate-200/50 flex justify-end">
                            <button 
                                onClick={() => setSelectedReport(null)} 
                                className="bg-slate-800 text-white px-10 py-3.5 rounded-lg font-bold text-xs hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10"
                            >
                                Close Audit View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MemberPortalContainer>
    );
}
