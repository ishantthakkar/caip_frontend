"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

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

    const [selectedDefaulterCompany, setSelectedDefaulterCompany] = useState('All');
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
    }, [filterOption, customStart, customEnd, searchTerm, reportType, selectedDefaulterCompany]);

    // Reset company filter on report type change
    useEffect(() => {
        setSelectedDefaulterCompany('All');
    }, [reportType]);

    const defaulterCompanies = useMemo(() => {
        const comps = defaulters.map(d => d.defaulter_name).filter(Boolean);
        return ['All', ...Array.from(new Set(comps)).sort()];
    }, [defaulters]);

    const filterByDateAndSearch = (items: any[], type: string) => {
        let filtered = [...items];

        if (type === 'Member Report') {
            filtered = filtered.filter(item => item.status === '1' || item.status === 1);
        }

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

        // Defaulter Company Filter (for Defaulter Report)
        if (type === 'Defaulter Report' && selectedDefaulterCompany !== 'All') {
            filtered = filtered.filter(item => item.defaulter_name === selectedDefaulterCompany);
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
    }, [members, defaulters, reportType, filterOption, customStart, customEnd, searchTerm, selectedDefaulterCompany]);

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
                                    <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Defaulter Company</label>
                                    <select
                                        value={selectedDefaulterCompany}
                                        onChange={(e) => setSelectedDefaulterCompany(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all cursor-pointer"
                                    >
                                        {defaulterCompanies.map(comp => (
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
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
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
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Company Name</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Name</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Email</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Phone</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">State</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">District</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Sub District</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">City/Town/Village</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Status</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Industry Type</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Joined On</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Membership Expiry</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Membership Payment</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Payment Method</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Defaulter Reported</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Defaulter Searches</th>
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
                                                            <p className="text-sm font-medium tracking-widest ">No Records Found</p>
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
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-900">{item.companyName || 'N/A'}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-900">{item.name}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-600">{item.email}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{item.phone}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-[#1b5e20]">{item.state || 'N/A'}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{item.district || 'N/A'}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{item.city || 'N/A'}</td>
                                                            <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{item.subDistrict || 'N/A'}</td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md inline-block min-w-[90px] ${item.status === '1' || item.status === 1 ? 'bg-green-100 text-green-700 border border-green-200' :
                                                                    item.status === '2' || item.status === 2 ? 'bg-red-100 text-red-700 border border-red-200' :
                                                                        'bg-amber-100 text-amber-700 border border-amber-200'
                                                                    }`}>
                                                                    {item.status === '1' || item.status === 1 ? 'ACTIVE' : item.status === '2' || item.status === 2 ? 'DEACTIVATED' : 'PENDING'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-[13px] font-normal text-gray-600 ">
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
                                        <table className="w-full text-left border-collapse min-w-[2200px]">
                                            <thead className="sticky top-0 z-10 bg-[#051a02] text-white">
                                                <tr className="divide-x divide-white/5 whitespace-nowrap">
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Date</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Defaulter Company</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">GST</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">PAN</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">CIN</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Reported By Person</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Reported By Company</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Default Amount</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Outstanding</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Defaulter Status</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Recovery Status</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">State</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">District</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Sub District</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">City/Town/Village</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 whitespace-nowrap text-[13px] font-medium text-gray-700">
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={16} className="py-24 text-center">
                                                            <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                            <p className="text-sm font-medium text-gray-500 animate-pulse">Loading Defaulter Records...</p>
                                                        </td>
                                                    </tr>
                                                ) : paginatedData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={16} className="py-32 text-center text-gray-400">
                                                            <p className="text-sm font-medium tracking-widest ">No Records Found</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedData.map((item, i) => {
                                                        const isPaid = Number(item.outstanding_amount ?? item.default_amount) === 0;
                                                        return (
                                                            <tr key={item._id || i} className="hover:bg-gray-50/50 transition-colors group divide-x divide-gray-50/50">
                                                                <td className="px-4 py-3.5 text-gray-500 font-normal">
                                                                    {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                                                </td>
                                                                <td className="px-4 py-3.5 font-bold text-gray-900">
                                                                    {item.defaulter_name}
                                                                </td>
                                                                <td className="px-4 py-3.5 font-mono text-gray-500  tracking-tighter">
                                                                    {item.gst_number || '---'}
                                                                </td>
                                                                <td className="px-4 py-3.5 font-mono text-gray-500  tracking-tighter">
                                                                    {item.pan_number || '---'}
                                                                </td>
                                                                <td className="px-4 py-3.5 font-mono text-gray-500  tracking-tighter">
                                                                    {item.cin_number || '---'}
                                                                </td>
                                                                <td className="px-4 py-3.5 font-bold">
                                                                    {item.user_id?.name || '---'}
                                                                </td>
                                                                <td className="px-4 py-3.5 font-bold">
                                                                    {item.user_id?.companyName || '---'}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-right font-bold text-gray-900 font-sans">
                                                                    ₹{Number(item.default_amount || 0).toLocaleString('en-IN')}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-right font-bold text-rose-600 font-sans">
                                                                    ₹{Number(item.outstanding_amount ?? item.default_amount).toLocaleString('en-IN')}
                                                                </td>
                                                                <td className="px-4 py-3.5">
                                                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                                        {isPaid ? 'Not Defaulter' : 'Defaulter'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                                                    {(() => {
                                                                        const dAmount = Number(item.default_amount || 0);
                                                                        const oAmount = Number(item.outstanding_amount ?? item.default_amount ?? 0);
                                                                        const rAmount = dAmount - oAmount;

                                                                        if (oAmount === 0) {
                                                                            return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-600 border-emerald-100">Paid</span>;
                                                                        } else if (rAmount > 0) {
                                                                            return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-600 border-amber-100 ">Partially Paid</span>;
                                                                        } else {
                                                                            return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-rose-50 text-rose-600 border-rose-100">Not Paid</span>;
                                                                        }
                                                                    })()}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-gray-900">
                                                                    {item.state || '---'}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-gray-900 ">
                                                                    {item.district || '---'}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-gray-700">
                                                                    {item.cities || item.sub_district || '---'}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-gray-700">
                                                                    {item.city || '---'}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-center">
                                                                    <button
                                                                        onClick={() => setSelectedDefaulter(item)}
                                                                        className="px-4 py-1.5 bg-gray-50 text-gray-700 text-[11px] font-bold rounded-lg hover:bg-[#1b5e20] hover:text-white transition-all border border-gray-200 shadow-sm active:scale-95  tracking-wider"
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
                    <div className="bg-white w-full max-w-[95vw] lg:max-w-7xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-[#1b5e20] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
                            <div className="flex items-center gap-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                <h3 className="text-lg font-bold tracking-tight">Defaulter Record Details</h3>
                            </div>

                            <button
                                onClick={() => setSelectedDefaulter(null)}
                                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10 bg-white">
                            {/* Section 1: Defaulter Company Details */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#1b5e20] rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Defaulter Company Details</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Defaulter Company name" value={selectedDefaulter.defaulter_name} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>} />
                                    <DetailRow label="Industry" value={selectedDefaulter.industry || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" /></svg>} />
                                    <DetailRow label="GST" value={selectedDefaulter.gst_number} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>} />
                                    <DetailRow label="Pan" value={selectedDefaulter.pan_number || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="14" x="3" y="5" rx="2" /><path d="M3 10h18" /><path d="M7 15h.01" /><path d="M11 15h2" /></svg>} />
                                    <DetailRow label="CIN" value={selectedDefaulter.cin_number || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
                                    <DetailRow label="Aadhar" value={selectedDefaulter.aadhar_number || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z" /></svg>} />
                                </div>
                            </div>

                            {/* Section 2: Contact & Location */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#ffcd1e] rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Contact & Address</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Mobile" value={selectedDefaulter.mobile_number} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>} />
                                    <DetailRow label="Email" value={selectedDefaulter.email_id} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>} />
                                    <DetailRow label="State" value={selectedDefaulter.state} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>} />
                                    <DetailRow label="District" value={selectedDefaulter.district} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" /><path d="M10 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" /><path d="M2 7h20" /></svg>} />
                                    <DetailRow label="Sub District" value={selectedDefaulter.cities || selectedDefaulter.sub_district || '---'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15.5 5.5-3 3-3-3" /><path d="m15.5 11.5-3 3-3-3" /><path d="m15.5 17.5-3 3-3-3" /></svg>} />
                                    <DetailRow label="City/Town/Village" value={selectedDefaulter.city || '---'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" /></svg>} />
                                </div>
                            </div>

                            {/* Section 3: Financial Status */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#1b5e20] rounded-full opacity-50"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Financial status</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Default amount" value={`₹${Number(selectedDefaulter.default_amount).toLocaleString()}`} isHighlights icon={
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M6 4h10" />
                                            <path d="M6 8h10" />
                                            <path d="M6 12h6a4 4 0 0 0 0-8" />
                                            <path d="M10 12l5 8" />
                                        </svg>
                                    } />
                                    <DetailRow label="Outstanding" value={`₹${Number(selectedDefaulter.outstanding_amount ?? selectedDefaulter.default_amount).toLocaleString()}`} isHighlights icon={
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M6 4h10" />
                                            <path d="M6 8h10" />
                                            <path d="M6 12h6a4 4 0 0 0 0-8" />
                                            <path d="M10 12l5 8" />
                                        </svg>
                                    } />
                                    <DetailRow label="Date of default" value={selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toLocaleDateString('en-GB') : 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
                                    <DetailRow label="Financial year" value={selectedDefaulter.financial_year || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>} />
                                    <DetailRow label="Recovery Amount" value={`₹${Number(selectedDefaulter.recovery_amount || 0).toLocaleString()}`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>} />
                                </div>
                            </div>

                            {/* Section 4: Legal & Proceedings */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-gray-300 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Legal & proceedings</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Court name" value={selectedDefaulter.court_complex_name || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 20v-4l-4-4-4-4-4 4-4 4v4H2" /><path d="M6 12v.01" /><path d="M18 12v.01" /><path d="M12 6v.01" /></svg>} />
                                    <DetailRow label="Case number" value={selectedDefaulter.case_number || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>} />
                                    <DetailRow label="Case type" value={selectedDefaulter.case_type || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>} />
                                    <DetailRow label="Case year" value={selectedDefaulter.case_year || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
                                    <DetailRow label="Legal status" value={selectedDefaulter.case_status || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>} />
                                </div>
                            </div>

                            {/* Section 5: Report Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-emerald-100 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Report information</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Report by person" value={selectedDefaulter.user_id?.name || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                                    <DetailRow label="Report by company" value={selectedDefaulter.user_id?.companyName || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>} />
                                </div>
                            </div>

                            {/* Section 6: Documents */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-slate-200 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Documents</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {selectedDefaulter.attachment_documents?.length > 0 ? (
                                        selectedDefaulter.attachment_documents.map((doc: string, idx: number) => {
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
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-blue-100 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Payment records</h4>
                                </div>
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left font-sans text-[14px]">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500  text-[11px] font-bold tracking-wider">
                                                <th className="px-6 py-4">#</th>
                                                <th className="px-6 py-4">Payment date</th>
                                                <th className="px-6 py-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-medium">
                                            {selectedDefaulter.payments?.length > 0 ? (
                                                selectedDefaulter.payments.map((p: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-400">{(idx + 1).toString().padStart(2, '0')}</td>
                                                        <td className="px-6 py-4">{new Date(p.date).toLocaleDateString('en-GB')}</td>
                                                        <td className="px-6 py-4 font-bold text-[#1b5e20] text-right">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-12 text-center text-[13px] font-medium text-gray-400 italic">No Payments.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-white flex justify-end shadow-[0_-10px_40px_rgba(0,0,0,0.03)] selection:bg-none">
                            <button onClick={() => setSelectedDefaulter(null)} className="px-10 py-3 bg-[#1b5e20] text-white rounded-xl text-[14px] font-bold shadow-xl shadow-[#1b5e20]/20 hover:bg-[#144317] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">Close Record</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 2px solid #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </AdminPortalContainer>
    );
}

const DetailRow = ({ label, value, icon, isHighlights = false, isStatus = false }: any) => (
    <div className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 ${isHighlights ? 'bg-emerald-50/40 border border-emerald-100/50' : 'hover:bg-gray-50'}`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${isHighlights ? 'bg-[#1b5e20] text-white' : 'bg-white border border-gray-100 text-[#1b5e20]'}`}>
            {icon}
        </div>
        <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-gray-400  tracking-widest mb-1">{label}</span>
            {isStatus ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold border ${value === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' :
                    value === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                    {value}
                </span>
            ) : (
                <span className={`text-[15px] font-bold truncate ${isHighlights ? 'text-[#1b5e20]' : 'text-gray-900'}`}>
                    {value || '---'}
                </span>
            )}
        </div>
    </div>
);

