"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';

const dateFilterOptions = [
    'All', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Custom Range'
];

export default function AdminReportsPage() {
    const router = useRouter();
    const [reportType, setReportType] = useState('Member Report');
    const [members, setMembers] = useState<any[]>([]);
    const [defaulters, setDefaulters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    // Filters and Pagination
    const [filterOption, setFilterOption] = useState('All');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [selectedMemberCompany, setSelectedMemberCompany] = useState('All');
    const [selectedDefaulter, setSelectedDefaulter] = useState<any | null>(null);

    // Initial load
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const statsRes = await fetch(`${API_BASE_URL}admin/dashboard-stats`);
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Data fetching based on active report type
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (reportType === 'Member Report') {
                    const response = await fetch(`${API_BASE_URL}users`);
                    if (response.ok) {
                        const data = await response.json();
                        setMembers(data.data || []);
                    }
                } else if (reportType === 'Defaulter Report') {
                    const response = await fetch(`${API_BASE_URL}admin/defaulters`);
                    if (response.ok) {
                        const data = await response.json();
                        setDefaulters(data.data || []);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [reportType]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterOption, customStart, customEnd, searchTerm, reportType, selectedMemberCompany]);

    // Reset company filter on report type change
    useEffect(() => {
        setSelectedMemberCompany('All');
    }, [reportType]);

    const reportingMemberCompanies = useMemo(() => {
        const comps = defaulters.map(d => d.user_id?.companyName).filter(Boolean);
        return ['All', ...Array.from(new Set(comps)).sort()];
    }, [defaulters]);

    const filterByDateAndSearch = (items: any[], type: string) => {
        let filtered = [...items];

        // Date Filtering
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

        // Member Company Filter (for Defaulter Report)
        if (type === 'Defaulter Report' && selectedMemberCompany !== 'All') {
            filtered = filtered.filter(item => item.user_id?.companyName === selectedMemberCompany);
        }

        // Text Search
        if (searchTerm.trim() !== '') {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(item => {
                if (type === 'Member Report') {
                    return (
                        (item.name && item.name.toLowerCase().includes(lowerTerm)) ||
                        (item.email && item.email.toLowerCase().includes(lowerTerm)) ||
                        (item.phone && item.phone.toLowerCase().includes(lowerTerm)) ||
                        (item.businessType && item.businessType.toLowerCase().includes(lowerTerm)) ||
                        (item.district && item.district.toLowerCase().includes(lowerTerm)) ||
                        (item.state && item.state.toLowerCase().includes(lowerTerm))
                    );
                } else {
                    return (
                        (item.defaulter_name && item.defaulter_name.toLowerCase().includes(lowerTerm)) ||
                        (item.gst_number && item.gst_number.toLowerCase().includes(lowerTerm)) ||
                        (item.pan_number && item.pan_number.toLowerCase().includes(lowerTerm)) ||
                        (item.cin_number && item.cin_number.toLowerCase().includes(lowerTerm)) ||
                        (item.aadhar_number && item.aadhar_number.toLowerCase().includes(lowerTerm)) ||
                        (item.mobile_number && item.mobile_number.toLowerCase().includes(lowerTerm)) ||
                        (item.email_id && item.email_id.toLowerCase().includes(lowerTerm)) ||
                        (item.state && item.state.toLowerCase().includes(lowerTerm)) ||
                        (item.district && item.district.toLowerCase().includes(lowerTerm))
                    );
                }
            });
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const activeFilteredData = useMemo(() => {
        return filterByDateAndSearch(reportType === 'Member Report' ? members : defaulters, reportType);
    }, [members, defaulters, reportType, filterOption, customStart, customEnd, searchTerm, selectedMemberCompany]);

    const totalPages = Math.max(1, Math.ceil(activeFilteredData.length / itemsPerPage));
    const paginatedData = activeFilteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <AdminPortalContainer title="Reports">
            <div className="space-y-12">
                <div className="space-y-6">
                    {/* Search and Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                            <div className="lg:col-span-3 space-y-1.5">
                                <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Report Type</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all cursor-pointer"
                                >
                                    <option value="Member Report">Member Report</option>
                                    <option value="Defaulter Report">Defaulter Report</option>
                                </select>
                            </div>

                            {reportType === 'Defaulter Report' && (
                                <div className="lg:col-span-3 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Member Company</label>
                                    <select
                                        value={selectedMemberCompany}
                                        onChange={(e) => setSelectedMemberCompany(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all cursor-pointer"
                                    >
                                        {reportingMemberCompanies.map(comp => (
                                            <option key={comp} value={comp}>{comp}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="lg:col-span-3 space-y-1.5">
                                <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Range</label>
                                <select
                                    value={filterOption}
                                    onChange={(e) => setFilterOption(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all cursor-pointer"
                                >
                                    {dateFilterOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            {filterOption === 'Custom Range' && (
                                <div className="lg:col-span-3 space-y-1.5 animate-in slide-in-from-left duration-300">
                                    <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Custom Interval</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={customStart}
                                            onChange={(e) => setCustomStart(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[13px] font-normal text-gray-700 outline-none focus:border-[#1b5e20]"
                                        />
                                        <span className="text-gray-400 text-xs">to</span>
                                        <input
                                            type="date"
                                            value={customEnd}
                                            onChange={(e) => setCustomEnd(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[13px] font-normal text-gray-700 outline-none focus:border-[#1b5e20]"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={`${(reportType === 'Defaulter Report' || filterOption === 'Custom Range') ? 'lg:col-span-3' : 'lg:col-span-6'} space-y-1.5`}>
                                <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Search Records</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, region..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-10 pr-4 py-2 text-[15px] font-normal text-black placeholder-gray-400 outline-none focus:border-[#1b5e20] transition-all"
                                    />
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <h3 className="text-sm font-bold tracking-tight">{reportType} List</h3>
                        </div>

                        <div className="p-4 md:p-5">
                            <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                                <div className="overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar">
                                    {reportType === 'Member Report' ? (
                                        <table className="w-full text-left border-collapse min-w-[1800px]">
                                            <thead className="sticky top-0 z-10 bg-[#051a02] text-white">
                                                <tr className="divide-x divide-white/5">
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Member Id</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Name</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Email</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Phone</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">State</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">District</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Sub District</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Organization</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Status</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Type</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Joined On</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Expiry Date</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Payment</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Method</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Reports</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Searches</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={16} className="py-24 text-center">
                                                            <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                            <p className="text-sm font-medium text-gray-500 animate-pulse">Loading Member Records...</p>
                                                        </td>
                                                    </tr>
                                                ) : paginatedData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={16} className="py-32 text-center text-gray-400">
                                                            <p className="text-sm font-medium tracking-widest uppercase">No Records Found</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedData.map((item, i) => (
                                                        <tr key={item._id || i} className="hover:bg-gray-50/50 transition-colors group">
                                                            <td className="px-4 py-3.5">
                                                                <span className="text-[12px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                                                                    {item.memberId || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-900">{item.name}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-600">{item.email}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{item.phone}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-[#1b5e20]">{item.state || 'N/A'}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{item.district || 'N/A'}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{item.subDistrict || 'N/A'}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-900">{item.companyName || 'N/A'}</td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md inline-block min-w-[90px] ${item.status === '1' || item.status === 1 ? 'bg-green-100 text-green-700 border border-green-200' :
                                                                    item.status === '2' || item.status === 2 ? 'bg-red-100 text-red-700 border border-red-200' :
                                                                        'bg-amber-100 text-amber-700 border border-amber-200'
                                                                    }`}>
                                                                    {item.status === '1' || item.status === 1 ? 'ACTIVE' : item.status === '2' || item.status === 2 ? 'DEACTIVATED' : 'PENDING'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-[13px] font-normal text-gray-600 uppercase">
                                                                {item.businessType || 'Member'}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-[13px] font-normal text-gray-600 whitespace-nowrap">
                                                                {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-[13px] font-normal text-gray-600">
                                                                {item.membershipExpiry === 'Lifetime' 
                                                                    ? 'Lifetime' 
                                                                    : (item.membershipExpiry && item.membershipExpiry !== 'N/A' 
                                                                        ? new Date(item.membershipExpiry).toLocaleDateString('en-GB') 
                                                                        : 'N/A')}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className={`text-[11px] font-bold px-2 py-1 rounded inline-block ${item.paymentStatus === 'Failed' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                                    {item.paymentStatus || 'Success'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-[13px] font-normal text-gray-500 italic">
                                                                {item.paymentMethod || 'Online'}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className="text-[13px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                                                                    {item.defaultersReported || 0}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-right">
                                                                <span className="text-[13px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                                    {item.searchPerformed || 0}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead className="sticky top-0 z-10 bg-[#051a02] text-white">
                                                <tr className="divide-x divide-white/5">
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Date</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Defaulter Company</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Amount</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Outstanding</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Status</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-24 text-center">
                                                            <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                            <p className="text-sm font-medium text-gray-500 animate-pulse">Loading Defaulter Records...</p>
                                                        </td>
                                                    </tr>
                                                ) : paginatedData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-32 text-center text-gray-400">
                                                            <p className="text-sm font-medium tracking-widest uppercase">No Records Found</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedData.map((item, i) => {
                                                        const isPaid = Number(item.outstanding_amount ?? item.default_amount) === 0;
                                                        return (
                                                            <tr key={item._id || i} className="hover:bg-gray-50/50 transition-colors group">
                                                                <td className="px-4 py-3.5 text-[14px] font-normal text-gray-600">
                                                                    {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                                                </td>
                                                                <td className="px-4 py-3.5">
                                                                    <p className="text-[14px] font-normal text-gray-900">{item.defaulter_name}</p>
                                                                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">GST: {item.gst_number || 'N/A'}</p>
                                                                </td>
                                                                <td className="px-4 py-3.5 text-right text-[14px] font-bold text-gray-900">
                                                                    ₹{Number(item.default_amount || 0).toLocaleString('en-IN')}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-right text-[14px] font-bold text-green-700">
                                                                    ₹{Number(item.outstanding_amount ?? item.default_amount).toLocaleString('en-IN')}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-center">
                                                                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md inline-block min-w-[90px] ${item.status === 1 ? 'bg-green-100 text-green-700' :
                                                                        item.status === 2 ? 'bg-red-100 text-red-700' :
                                                                            'bg-amber-100 text-amber-700'
                                                                        }`}>
                                                                        {item.status === 1 ? 'APPROVED' : item.status === 2 ? 'REJECTED' : 'PENDING'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3.5 text-right">
                                                                    <button
                                                                        onClick={() => setSelectedDefaulter(item)}
                                                                        className="px-4 py-1.5 bg-gray-50 text-gray-700 text-[12px] font-medium rounded-lg hover:bg-[#1b5e20] hover:text-white transition-all border border-gray-200 shadow-sm active:scale-95"
                                                                    >
                                                                        View Details
                                                                    </button>
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
                        </div>

                        {!loading && activeFilteredData.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-white mt-auto">
                                <span className="text-[12px] font-medium text-gray-500">
                                    Showing <span className="font-bold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, activeFilteredData.length)}</span> of <span className="font-bold text-gray-900">{activeFilteredData.length}</span> records
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

            {/* View Defaulter Data Modal */}
            {selectedDefaulter && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">🛡️</div>
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight">Defaulter Record</h3>
                                    <p className="text-[11px] font-medium text-white/60 capitalize mt-0.5">Reported on {new Date(selectedDefaulter.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDefaulter(null)} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all cursor-pointer">✕</button>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8 bg-gray-50/50">
                            {/* Section 1: Entity Details */}
                            <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="text-[13px] font-semibold text-gray-500 capitalize tracking-tight mb-6 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-[#1b5e20] rounded-full"></span> Company Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <DetailItem label="Defaulter Company Name" value={selectedDefaulter.defaulter_name} />
                                    <DetailItem label="Date of Default" value={selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toLocaleDateString() : 'N/A'} />
                                    <DetailItem label="Mobile Number" value={selectedDefaulter.mobile_number} />
                                    <DetailItem label="Email ID" value={selectedDefaulter.email_id} />
                                </div>
                            </section>

                            {/* Section 2: Identifiers */}
                            <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="text-[13px] font-semibold text-gray-500 capitalize tracking-tight mb-6 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-[#1b5e20] rounded-full"></span> Identifiers
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <DetailItem label="GST" value={selectedDefaulter.gst_number} />
                                    <DetailItem label="PAN" value={selectedDefaulter.pan_number} />
                                    <DetailItem label="CIN" value={selectedDefaulter.cin_number} />
                                    <DetailItem label="AADHAR" value={selectedDefaulter.aadhar_number} />
                                </div>
                            </section>

                            {/* Section 3: Geographic Location */}
                            <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="text-[13px] font-semibold text-gray-500 capitalize tracking-tight mb-6 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-[#1b5e20] rounded-full"></span> Location
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <DetailItem label="State" value={selectedDefaulter.state} />
                                    <DetailItem label="District" value={selectedDefaulter.district} />
                                    <DetailItem label="Sub District" value={selectedDefaulter.cities || 'Main City'} />
                                </div>
                            </section>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-white flex justify-end">
                            <button onClick={() => setSelectedDefaulter(null)} className="px-8 py-2 bg-gray-900 text-white text-[12px] font-bold rounded-lg hover:bg-black transition-all shadow-lg active:scale-95">Close Record</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPortalContainer>
    );
}

const DetailItem = ({ label, value, isBadge = false, status = '0' }: { label: string, value: any, isBadge?: boolean, status?: string }) => (
    <div className="flex items-start gap-4 py-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]/20 mt-1.5 flex-shrink-0" />
        <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-500 capitalize tracking-tight leading-none mb-1.5">{label}</p>
            {isBadge ? (
                <span className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${status === '1' ? 'bg-green-100 text-green-700' : status === '2' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {value || '-'}
                </span>
            ) : (
                <p className="text-[15px] font-normal text-black break-words leading-tight">{value || '-'}</p>
            )}
        </div>
    </div>
);

