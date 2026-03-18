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
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {reportType === 'My Defaulter Report' ? 'Defaulter Report' : 'Search Report'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {reportType === 'My Defaulter Report' ? 'Overview of defaulters you have reported' : 'History of defaulters you have searched for'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col w-full sm:w-auto">
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Report Type</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full sm:w-56 bg-white border border-blue-200 rounded-lg py-2 px-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm font-semibold text-gray-700 shadow-sm"
                            >
                                <option value="My Defaulter Report">My Defaulter Report</option>
                                <option value="Search Report">Search Report</option>
                            </select>
                        </div>

                        <div className="h-10 w-px bg-gray-200 hidden sm:block mx-1"></div>

                        <div className="flex flex-col w-full sm:w-auto">
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Date Range</label>
                            <select
                                value={filterOption}
                                onChange={(e) => setFilterOption(e.target.value)}
                                className="w-full sm:w-40 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-100 text-sm font-semibold text-gray-700"
                            >
                                {dateFilterOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {filterOption === 'Custom Range' && (
                            <div className="flex flex-col w-full sm:w-auto">
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Custom Dates</label>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 outline-none focus:border-green-600 text-sm font-semibold text-gray-700 h-[38px]"
                                    />
                                    <span className="text-gray-400 font-bold">to</span>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 outline-none focus:border-green-600 text-sm font-semibold text-gray-700 h-[38px]"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="h-10 w-px bg-gray-200 hidden sm:block mx-1"></div>

                        <div className="flex flex-col w-full sm:w-auto">
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Search</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-48 bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-100 text-sm font-semibold text-gray-700"
                                />
                                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        {reportType === 'My Defaulter Report' ? (
                            <table className="w-full text-left">
                                <thead className="bg-[#1b5e20] text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Defaulter Company Name</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Outstanding</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-sm font-bold text-gray-400">Loading records...</td>
                                        </tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-sm font-bold text-gray-400">No records found.</td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-900">{item.defaulter_name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold">GST: {item.gst_number || 'N/A'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                                    ₹{Number(item.default_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold">
                                                    ₹{Number(item.outstanding_amount || item.default_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === 1 ? 'bg-green-100 text-green-700' :
                                                        item.status === 2 ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {item.status === 1 ? 'Approved' : item.status === 2 ? 'Rejected' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedReport(item)}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-[#1b5e20] text-white">
                                    <tr>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border-r border-green-800">Search Date</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border-r border-green-800 text-center">GST</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border-r border-green-800 text-center">PAN</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border-r border-green-800 text-center">CIN</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border-r border-green-800 text-center">Name</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border-r border-green-800 text-center">Defaulter Found</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border-r border-green-800 text-center">Default Amount</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center">Report Count</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="py-20 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">Loading history...</td>
                                        </tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-20 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">No search records found.</td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, i) => {
                                            const f = item.filters || {};
                                            return (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                                    <td className="px-4 py-4 text-[11px] font-bold text-gray-600 border-r border-gray-100">
                                                        {new Date(item.createdAt).toISOString().split('T')[0]}
                                                    </td>
                                                    <td className="px-4 py-4 text-[11px] font-semibold text-gray-600 border-r border-gray-100 text-center uppercase">
                                                        {f.gst || f.gst_number || '-'}
                                                    </td>
                                                    <td className="px-4 py-4 text-[11px] font-semibold text-gray-600 border-r border-gray-100 text-center uppercase">
                                                        {f.pan || f.pan_number || '-'}
                                                    </td>
                                                    <td className="px-4 py-4 text-[11px] font-semibold text-gray-600 border-r border-gray-100 text-center uppercase">
                                                        {f.cin || f.cin_number || '-'}
                                                    </td>
                                                    <td className="px-4 py-4 text-[11px] font-bold text-gray-700 border-r border-gray-100 text-center">
                                                        {f.name || f.defaulter_name || '-'}
                                                    </td>
                                                    <td className="px-4 py-4 text-center border-r border-gray-100">
                                                        <span className={`text-[10px] font-black uppercase transition-all ${item.resultCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {item.resultCount > 0 ? 'Yes' : 'No'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-[11px] font-black text-gray-800 border-r border-gray-100 text-center">
                                                        ₹{item.resultCount > 0 ? (Number(f.default_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0'}
                                                    </td>
                                                    <td className="px-4 py-4 text-[11px] font-bold text-gray-600 text-center">
                                                        {item.resultCount || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* Pagination Controls */}
                    {!loading && activeData.length > 0 && (
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-gray-50 mt-auto">
                            <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, activeData.length)} of {activeData.length} entries</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                >
                                    Prev
                                </button>
                                {Array.from({ length: totalPages }).map((_, idx) => {
                                    const pageNum = idx + 1;
                                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 py-1 rounded-md text-sm font-bold transition-colors ${currentPage === pageNum ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                        return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                                    }
                                    return null;
                                })}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Defaulter Details</h3>
                                <p className="text-xs text-gray-500">Reported on {new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400">Defaulter Company Name</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedReport.defaulter_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400">Date of Default</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedReport.date_of_default ? new Date(selectedReport.date_of_default).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400">Mobile Number</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedReport.mobile_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400">Email</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedReport.email_id || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-xs font-bold text-gray-800 mb-3">Identifiers</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-gray-400">GST</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedReport.gst_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-gray-400">PAN</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedReport.pan_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-gray-400">CIN</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedReport.cin_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-gray-400">Aadhar</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedReport.aadhar_number || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400">State</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedReport.state || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400">District</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedReport.district || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400">Sub-District</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedReport.cities || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400">Industry</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedReport.industry || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400">Financial Year</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedReport.financial_year || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 flex gap-6 bg-red-50 p-4 rounded-xl border border-red-100">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-red-400">Defaulter Amount</p>
                                    <p className="text-lg font-black text-red-600">
                                        ₹{Number(selectedReport.default_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-red-500">Outstanding Amount</p>
                                    <p className="text-lg font-black text-red-700">
                                        ₹{Number(selectedReport.outstanding_amount ?? selectedReport.default_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
