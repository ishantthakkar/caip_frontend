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

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterOption, customStart, customEnd, searchTerm, reportType]);

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
    }, [members, defaulters, reportType, filterOption, customStart, customEnd, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(activeFilteredData.length / itemsPerPage));
    const paginatedData = activeFilteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <AdminPortalContainer title="Reports">
            <div className="space-y-8 flex-1 flex flex-col">
                {/* Filters Toolbar */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black text-gray-400 mb-2 ml-1 tracking-wider">Report Type</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary focus:ring-1 focus:ring-green-100 text-sm font-black text-gray-700 w-full md:w-56 transition-all"
                            >
                                <option value="Member Report">Member Report</option>
                                <option value="Defaulter Report">Defaulter Report</option>
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[10px] font-black text-gray-400 mb-2 ml-1 tracking-wider">Range</label>
                            <select
                                value={filterOption}
                                onChange={(e) => setFilterOption(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary focus:ring-1 focus:ring-green-100 text-sm font-bold text-gray-700 w-full md:w-48 transition-all"
                            >
                                {dateFilterOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {filterOption === 'Custom Range' && (
                            <div className="flex flex-col animate-in slide-in-from-left duration-300">
                                <label className="text-[10px] font-black text-gray-400 mb-2 ml-1 tracking-wider">Custom Interval</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-agri-green-primary text-xs font-black text-gray-700 shadow-inner"
                                    />
                                    <span className="text-gray-300 font-black">to</span>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-agri-green-primary text-xs font-black text-gray-700 shadow-inner"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col w-full md:w-auto">
                        <label className="text-[10px] font-black text-gray-400 mb-2 ml-1 tracking-wider">Search</label>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-agri-green-primary focus:bg-white text-sm font-bold text-gray-700 w-full md:w-80 transition-all shadow-inner tracking-tight"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">🔎</span>
                        </div>
                    </div>
                </div>

                {/* Report Data Table */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 flex flex-col flex-1 overflow-hidden transition-all">

                    <div className="overflow-x-auto flex-1">
                        {reportType === 'Member Report' ? (
                            <table className="w-full text-left">
                                <thead className="bg-agri-green-primary text-white">
                                    <tr className="text-[10px] font-black tracking-[0.15em] text-white/90 border-b border-white/10">
                                        <th className="px-6 py-4 min-w-[120px]">Member ID</th>
                                        <th className="px-6 py-4 min-w-[180px]">Name</th>
                                        <th className="px-6 py-4 min-w-[180px]">Email</th>
                                        <th className="px-6 py-4 min-w-[120px]">Phone</th>
                                        <th className="px-6 py-4 min-w-[120px]">State</th>
                                        <th className="px-6 py-4 min-w-[120px]">District</th>
                                        <th className="px-6 py-4 min-w-[120px]">Sub District</th>
                                        <th className="px-6 py-4 min-w-[200px]">Organization</th>
                                        <th className="px-6 py-4 min-w-[140px]">Status</th>
                                        <th className="px-6 py-4 min-w-[120px]">Type</th>
                                        <th className="px-6 py-4 min-w-[140px]">Joined On</th>
                                        <th className="px-6 py-4 min-w-[140px]">Expiry</th>
                                        <th className="px-6 py-4 min-w-[120px]">Payment</th>
                                        <th className="px-6 py-4 min-w-[140px]">Method</th>
                                        <th className="px-6 py-4 min-w-[120px] text-center">Reports</th>
                                        <th className="px-6 py-4 min-w-[120px] text-right">Searches</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={16} className="py-32 text-center">
                                                <div className="animate-spin h-10 w-10 border-4 border-agri-green-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                                <p className="text-sm font-black text-gray-400 animate-pulse tracking-widest">Loadning Records...</p>
                                            </td>
                                        </tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={16} className="py-40 text-center text-gray-400">
                                                <div className="text-6xl mb-6 opacity-20">👥</div>
                                                <p className="text-sm font-black tracking-wider">Void Network: Zero active members listed</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, i) => (
                                            <tr key={item._id || i} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-agri-green-primary bg-green-50 px-2 py-1 rounded border border-green-100">{item.memberId || 'N/A'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-900">{item.name}</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    {item.email}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 font-medium">
                                                    {item.phone}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-emerald-700">
                                                    {item.state || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-700 font-medium">
                                                    {item.district || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    {item.subDistrict || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-800">
                                                    {item.companyName || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${item.status === '1' || item.status === 1 ? 'bg-green-600 text-white' :
                                                        item.status === '2' || item.status === 2 ? 'bg-red-600 text-white' :
                                                            'bg-amber-500 text-white'
                                                        }`}>
                                                        {item.status === '1' || item.status === 1 ? 'Active' : item.status === '2' || item.status === 2 ? 'Deactivated' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">
                                                    {item.businessType || 'Member'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                                                    {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                                                    {item.membershipExpiry || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${item.paymentStatus === 'Failed' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                                                        {item.paymentStatus || 'Success'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500 font-medium italic">
                                                    {item.paymentMethod || 'Online'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
                                                        {item.defaultersReported || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                                        {item.searchPerformed || 0}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            // Defaulter Report Table View
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr className="text-[10px] font-black tracking-[0.15em] text-gray-400">
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Defaulter Company</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-right">Outstanding</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 font-black">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center">
                                                <div className="animate-spin h-10 w-10 border-4 border-agri-green-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                                <p className="text-sm font-black text-gray-400 animate-pulse tracking-widest">Loading Records...</p>
                                            </td>
                                        </tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-40 text-center text-gray-400">
                                                <div className="text-6xl mb-6 opacity-20 animate-bounce">🛡️</div>
                                                <p className="text-sm font-black tracking-wider">No Records Found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, i) => {
                                            const isPaid = Number(item.outstanding_amount ?? item.default_amount) === 0;
                                            return (
                                                <tr key={item._id || i} className={`${isPaid ? 'text-green-600' : 'text-black'} hover:bg-gray-50 transition-all border-b border-gray-100 font-semibold`}>
                                                    <td className="px-6 py-4 text-xs opacity-70">
                                                        {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm inherit">{item.defaulter_name}</p>
                                                        <p className="text-[10px] opacity-60 font-medium tracking-wide">GST: {item.gst_number || 'N/A'}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-black text-right">
                                                        ₹{Number(item.default_amount || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-black text-right">
                                                        ₹{Number(item.outstanding_amount ?? item.default_amount).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 1 ? 'bg-green-600 text-white' :
                                                            item.status === 2 ? 'bg-red-600 text-white' :
                                                                'bg-amber-500 text-white'
                                                            }`}>
                                                            {item.status === 1 ? 'Approved' : item.status === 2 ? 'Rejected' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setSelectedDefaulter(item)}
                                                            className="px-4 py-1.5 bg-[#0051a8] text-white hover:bg-[#003d80] rounded text-[10px] font-black uppercase transition-all shadow-sm active:scale-95"
                                                        >
                                                            View
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

                    {/* Pagination Footer */}
                    {!loading && activeFilteredData.length > 0 && (
                        <div className="px-10 py-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 mt-auto">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                Page {currentPage} OF {totalPages} <span className="mx-2 opacity-30">•</span> {activeFilteredData.length} Indexed Assets
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
                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                        const pageNum = idx + 1;
                                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all shadow-sm ${currentPage === pageNum ? 'bg-agri-green-primary text-white shadow-lg shadow-emerald-900/20' : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-agri-green-primary'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <span key={pageNum} className="px-1 text-gray-300 font-black tracking-widest">...</span>;
                                        }
                                        return null;
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

            {/* View Defaulter Data Modal */}
            {selectedDefaulter && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col font-sans animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Defaulter Details</h3>
                                <p className="text-[10px] font-black text-gray-400 tracking-wider mt-1">Reported on {new Date(selectedDefaulter.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={() => setSelectedDefaulter(null)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
                            >
                                <span className="text-2xl">✕</span>
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Entity Info */}
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 tracking-wider mb-1">Defaulter Company Name</p>
                                    <p className="text-base font-bold text-gray-800">{selectedDefaulter.defaulter_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 tracking-wider mb-1">Date of Default</p>
                                    <p className="text-base font-bold text-gray-800">{selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 tracking-wider mb-1">Mobile Number</p>
                                    <p className="text-base font-bold text-gray-800">{selectedDefaulter.mobile_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 tracking-wider mb-1">Email</p>
                                    <p className="text-base font-bold text-gray-800">{selectedDefaulter.email_id || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 w-full" />

                            {/* Identifiers */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-4">Identifiers</h4>
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { label: 'GST', val: selectedDefaulter.gst_number },
                                        { label: 'PAN', val: selectedDefaulter.pan_number },
                                        { label: 'CIN', val: selectedDefaulter.cin_number },
                                        { label: 'AADHAR', val: selectedDefaulter.aadhar_number }
                                    ].map((id, i) => (
                                        <div key={i}>
                                            <p className="text-[9px] font-black text-gray-400 tracking-wider mb-1">{id.label}</p>
                                            <p className="text-sm font-bold text-gray-800">{id.val || 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 w-full" />

                            {/* Location */}
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 tracking-wider mb-1">State</p>
                                    <p className="text-sm font-bold text-gray-800">{selectedDefaulter.state || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 tracking-wider mb-1">District</p>
                                    <p className="text-sm font-bold text-gray-800">{selectedDefaulter.district || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[9px] font-black text-gray-400 tracking-wider mb-1">Sub-District</p>
                                    <p className="text-sm font-bold text-gray-800">{selectedDefaulter.cities || 'Main City'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminPortalContainer>
    );
}

