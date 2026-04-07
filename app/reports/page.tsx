"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

const dateFilterOptions = [
    'All', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Custom Range'
];

const DetailRow = ({ label, value, icon, isHighlights = false, isStatus = false }: any) => (
    <div className="flex gap-4 min-w-0 text-left">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isHighlights ? 'bg-emerald-50 text-[#1b5e20]' : 'bg-gray-50 text-gray-400'}`}>
            {icon}
        </div>
        <div className="flex flex-col min-w-0">
            <label className="text-[13px] font-medium text-gray-400 tracking-tight leading-none mb-1.5">{label}</label>
            <div className={`text-[15px] font-medium tracking-tight truncate ${isHighlights ? 'text-[#1b5e20] font-bold' : 'text-gray-900'} ${isStatus ? 'bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-full inline-block w-fit text-[12px] font-bold' : ''}`}>
                {value || '-'}
            </div>
        </div>
    </div>
);

const getSearchField = (filters: any): string => {
    if (!filters) return '-';
    const fields: string[] = [];
    const filterMap: Record<string, string[]> = {
        'Company Name': ['name', 'defaulter_name'],
        'GST': ['gst', 'gst_number'],
        'PAN': ['pan', 'pan_number'],
        'CIN': ['cin', 'cin_number'],
        'Aadhar': ['aadhar', 'aadhar_number'],
        'Mobile': ['mobile', 'mobile_number'],
        'State': ['state'],
        'District': ['district'],
        'Sub-District': ['subDistrict'],
        'City': ['city', 'cities'],
        'Address': ['address', 'defaulter_address']
    };

    Object.entries(filterMap).forEach(([label, keys]: [string, string[]]) => {
        if (keys.some((key: string) => filters[key] && filters[key].toString().trim() !== '')) {
            fields.push(label);
        }
    });

    return fields.length > 0 ? fields.join(', ') : '-';
};

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

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    }, []);

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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
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
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight whitespace-nowrap">Date of Default</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight whitespace-nowrap">Defaulter Company Name</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight whitespace-nowrap">Mobile Number</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight whitespace-nowrap">Email ID</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">GST</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">CIN</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Address</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">State</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">District</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight whitespace-nowrap">Sub District</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight whitespace-nowrap">City/Town/Village</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Industry</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight whitespace-nowrap">Financial Year</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight whitespace-nowrap">Default Amount</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight whitespace-nowrap">Outstanding Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={17} className="py-20 text-center text-gray-400 italic">Loading records...</td>
                                                </tr>
                                            ) : paginatedData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={17} className="py-20 text-center text-gray-400 italic">No records found.</td>
                                                </tr>
                                            ) : (
                                                paginatedData.map((item, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {item.date_of_default ? new Date(item.date_of_default).toLocaleDateString('en-GB') : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                                                            {item.defaulter_name}
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px]">
                                                            {item.mobile_number || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px] lowercase">
                                                            {item.email_id || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-[12px] uppercase">
                                                            {item.gst_number || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-[12px] uppercase">
                                                            {item.cin_number || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-[12px] uppercase">
                                                            {item.defaulter_address || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px]">
                                                            {item.state || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px]">
                                                            {item.district || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px]">
                                                            {item.cities || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px]">
                                                            {item.city || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px] capitalize">
                                                            {item.industry || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px]">
                                                            {item.financial_year || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                                                            ₹{Number(item.default_amount).toLocaleString('en-IN')}
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-red-600 whitespace-nowrap">
                                                            ₹{Number(item.outstanding_amount || item.default_amount).toLocaleString('en-IN')}
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
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Search Field</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Defaulter Firm Name</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">GST</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">CIN</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Address</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">State</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">District</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Sub-district</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">City/Town/Village</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Defaulter Found</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Default Amount</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Report Count</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={15} className="py-20 text-center">Loading...</td>
                                                </tr>
                                            ) : paginatedData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={15} className="py-20 text-center">No search records.</td>
                                                </tr>
                                            ) : (
                                                paginatedData.map((item, i) => {
                                                    const f = item.filters || {};
                                                    const r = item.resultData || {};
                                                    const hasResults = (item.resultCount > 0) || !!item.resultData;
                                                    return (
                                                        <tr key={i} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors uppercase">
                                                            <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-bold">
                                                                {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                                            </td>
                                                            <td className="px-4 py-3 font-bold text-green-700 bg-green-50/20 whitespace-nowrap">
                                                                {getSearchField(item.filters)}
                                                            </td>
                                                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                                                                {r.name || f.name || f.defaulter_name || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-[12px]">
                                                                {r.gst || f.gst || f.gst_number || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-[12px]">
                                                                {r.cin || f.cin || f.cin_number || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-[11px] min-w-[150px]">
                                                                {r.address || f.address || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-[12px]">
                                                                {r.state || f.state || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-[12px]">
                                                                {r.district || f.district || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-[12px]">
                                                                {r.subDistrict || f.subDistrict || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-[12px]">
                                                                {r.city || f.cities || f.city || '-'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${hasResults ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                                    {hasResults ? 'YES' : 'NO'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                                                                ₹{hasResults ? (Number(r.default_amount || f.default_amount || 0)).toLocaleString('en-IN') : '0'}
                                                            </td>
                                                            <td className="px-4 py-3 font-bold text-gray-900">
                                                                {hasResults ? (item.resultCount || 1) : '-'}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)}></div>
                    <div className="relative bg-[#fbfcff] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-500 text-left">
                        {/* Modal Header */}
                        <div className="px-8 py-5 bg-[#1b5e20] flex items-center justify-between text-white shadow-lg relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-white/10 rounded-xl">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-[18px] font-bold tracking-tight">Defaulter record details</h3>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="text-white/40 hover:text-white transition-all bg-white/10 p-2 rounded-xl">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10 text-left">
                            {/* Section 1: Defaulter Company Details */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#1b5e20] rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Defaulter company details</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Defaulter Company name" value={selectedReport.resultData?.name || selectedReport.filters?.name} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>} />
                                    <DetailRow label="Industry" value={selectedReport.resultData?.industry} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" /></svg>} />
                                    <DetailRow label="Gst number" value={selectedReport.resultData?.gst || selectedReport.filters?.gst || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>} />
                                    <DetailRow label="Pan number" value={selectedReport.resultData?.pan || selectedReport.filters?.pan || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="14" x="3" y="5" rx="2" /><path d="M3 10h18" /><path d="M7 15h.01" /><path d="M11 15h2" /></svg>} />
                                    <DetailRow label="Cin number" value={selectedReport.resultData?.cin || selectedReport.filters?.cin || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
                                    <DetailRow label="Aadhar number" value={selectedReport.resultData?.aadhar || selectedReport.filters?.aadhar || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z" /></svg>} />
                                </div>
                            </div>

                            {/* Section 2: Contact & Location */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#ffcd1e] rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Contact & Address</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Mobile" value={selectedReport.resultData?.mobile || selectedReport.filters?.mobile} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>} />
                                    <DetailRow label="Email" value={selectedReport.resultData?.email || selectedReport.filters?.email} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>} />
                                    <DetailRow label="State" value={selectedReport.resultData?.state || selectedReport.filters?.state} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>} />
                                    <DetailRow label="District" value={selectedReport.resultData?.district || selectedReport.filters?.district} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" /><path d="M10 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" /><path d="M2 7h20" /></svg>} />
                                    <DetailRow label="Sub district" value={selectedReport.resultData?.subDistrict || selectedReport.filters?.subDistrict || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15.5 5.5-3 3-3-3" /><path d="m15.5 11.5-3 3-3-3" /><path d="m15.5 17.5-3 3-3-3" /></svg>} />
                                    <DetailRow label="City" value={selectedReport.resultData?.city || selectedReport.filters?.city || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" /></svg>} />
                                    <div className="col-span-full pt-2">
                                        <DetailRow label="Full address" value={selectedReport.resultData?.address || selectedReport.filters?.address} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Financial Status */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#1b5e20] rounded-full opacity-50"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Financial status</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Default amount" value={`₹${Number(selectedReport.resultData?.default_amount || 0).toLocaleString()}`} isHighlights icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>} />
                                    <DetailRow label="Outstanding" value={`₹${Number(selectedReport.resultData?.outstanding_amount || selectedReport.resultData?.default_amount || 0).toLocaleString()}`} isHighlights icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} />
                                    <DetailRow label="Date of default" value={selectedReport.resultData?.date_of_default ? new Date(selectedReport.resultData.date_of_default).toLocaleDateString() : 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
                                    <DetailRow label="Financial year" value={selectedReport.resultData?.financial_year || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>} />
                                    <div className="col-span-full">
                                        <DetailRow label="Reason for default" value={selectedReport.resultData?.reason || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h.01" /><path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" /><path d="M12 9v4" /></svg>} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Legal & Proceedings */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-gray-300 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Legal & proceedings</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Court name" value={selectedReport.resultData?.court_complex_name || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 20v-4l-4-4-4-4-4 4-4 4v4H2" /><path d="M6 12v.01" /><path d="M18 12v.01" /><path d="M12 6v.01" /></svg>} />
                                    <DetailRow label="Case number" value={selectedReport.resultData?.case_number || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>} />
                                    <DetailRow label="Case type" value={selectedReport.resultData?.case_type || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>} />
                                    <DetailRow label="Case year" value={selectedReport.resultData?.case_year || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
                                    <DetailRow label="Legal status" value={selectedReport.resultData?.case_status || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>} />
                                </div>
                            </div>

                            {/* Section 5: Report Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-emerald-100 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Report information</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Reported By" value={selectedReport.resultData?.reported_by || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                                </div>
                            </div>

                            {/* Section 6: Documents */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-slate-200 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Documents</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {selectedReport.resultData?.attachment_documents?.length > 0 ? (
                                        selectedReport.resultData.attachment_documents.map((doc: string, idx: number) => {
                                            const isPdf = doc.toLowerCase().endsWith('.pdf');
                                            return (
                                                <a
                                                    key={idx}
                                                    href={`${ASSETS_BASE_URL}uploads/${doc}`}
                                                    target="_blank"
                                                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-[#1b5e20] hover:bg-emerald-50/10 transition-all group shadow-sm"
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPdf ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                                        {isPdf ? (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                        ) : (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-bold text-gray-900 truncate">Document {idx + 1}</span>
                                                        <span className="text-[11px] font-medium text-gray-400 capitalize">{doc.split('.').pop()} file</span>
                                                    </div>
                                                </a>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full py-8 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
                                            <p className="text-[13px] font-medium">No verified documents available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 7: Payment Records */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-blue-100 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Payment records</h4>
                                </div>
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left font-sans">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-4 text-[12px] font-bold tracking-widest uppercase">#</th>
                                                <th className="px-6 py-4 text-[12px] font-bold tracking-widest uppercase">Payment date</th>
                                                <th className="px-6 py-4 text-[12px] font-bold tracking-widest uppercase text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedReport.resultData?.payments?.length > 0 ? (
                                                selectedReport.resultData.payments.map((p: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-[14px] font-bold">{(idx + 1).toString().padStart(2, '0')}</td>
                                                        <td className="px-6 py-4 text-[14px] font-medium">{new Date(p.date).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 text-[14px] font-bold text-[#1b5e20] text-right">₹{Number(p.amount).toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-12 text-center text-[13px] font-medium text-gray-400 italic">No recovery payments synchronized yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] selection:bg-none">
                            <button onClick={() => setSelectedReport(null)} className="px-10 py-3 bg-[#1b5e20] text-white rounded-xl text-[14px] font-bold shadow-xl shadow-[#1b5e20]/20 hover:bg-[#144317] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </MemberPortalContainer>
    );
}
