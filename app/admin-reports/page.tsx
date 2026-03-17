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
                            start.setHours(0,0,0,0);
                            const end = new Date(customEnd);
                            end.setHours(23,59,59,999);
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
        <AdminPortalContainer title="Master Ledger Intelligence">
            <div className="space-y-8 flex-1 flex flex-col">
                {/* Filters Toolbar */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto">
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-black text-gray-400 mb-2 ml-1 tracking-widest">Target Database</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-[#1b5e20] focus:ring-1 focus:ring-green-100 text-sm font-black text-gray-700 w-full md:w-56 transition-all uppercase"
                            >
                                <option value="Member Report">Member Matrix</option>
                                <option value="Defaulter Report">Defaulter Ledger</option>
                            </select>
                        </div>
                        
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-black text-gray-400 mb-2 ml-1 tracking-widest">Temporal Frame</label>
                            <select
                                value={filterOption}
                                onChange={(e) => setFilterOption(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-[#1b5e20] focus:ring-1 focus:ring-green-100 text-sm font-bold text-gray-700 w-full md:w-48 transition-all uppercase"
                            >
                                {dateFilterOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {filterOption === 'Custom Range' && (
                            <div className="flex flex-col animate-in slide-in-from-left duration-300">
                                <label className="text-[10px] uppercase font-black text-gray-400 mb-2 ml-1 tracking-widest">Custom Interval</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-[#1b5e20] text-xs font-black text-gray-700 shadow-inner"
                                    />
                                    <span className="text-gray-300 font-black">TO</span>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 outline-none focus:border-[#1b5e20] text-xs font-black text-gray-700 shadow-inner"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col w-full md:w-auto">
                        <label className="text-[10px] uppercase font-black text-gray-400 mb-2 ml-1 tracking-widest">Deep Lens Search</label>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Query parameters..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-[#1b5e20] focus:bg-white text-sm font-bold text-gray-700 w-full md:w-80 transition-all shadow-inner uppercase tracking-tight"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">🔎</span>
                        </div>
                    </div>
                </div>

                {/* Report Data Table */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col flex-1 overflow-hidden transition-all">
                    <div className="bg-[#1b5e20] px-10 py-6 text-white flex justify-between items-center font-serif italic">
                        <div>
                            <h3 className="text-xl font-black tracking-widest uppercase">{reportType} DATABASE</h3>
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] font-sans not-italic mt-1">Found {activeFilteredData.length} indexed records</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl not-italic shadow-inner">📊</div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        {reportType === 'Member Report' ? (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-10 py-6">Entity Signature</th>
                                        <th className="px-10 py-6">Digital Axis</th>
                                        <th className="px-10 py-6">Nexus Jurisdiction</th>
                                        <th className="px-10 py-6">Authorization</th>
                                        <th className="px-10 py-6 text-right">Registered</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 uppercase font-bold">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center">
                                                <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                <p className="text-sm font-black text-gray-400 animate-pulse tracking-widest">Aggregating Global Members...</p>
                                            </td>
                                        </tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-40 text-center text-gray-400">
                                                <div className="text-6xl mb-6 opacity-20 animate-bounce">📂</div>
                                                <p className="text-sm font-black uppercase tracking-[0.3em]">Void: Zero matching intelligence</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, i) => (
                                            <tr key={item._id || i} className="hover:bg-gray-50/80 transition-all group">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-[#f0f9f0] flex items-center justify-center text-[#1b5e20] text-xs font-black border border-[#1b5e20]/10 group-hover:bg-[#1b5e20] group-hover:text-white transition-all shadow-sm">
                                                            {item.name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900 group-hover:text-[#1b5e20] italic">{item.name}</p>
                                                            <p className="text-[9px] font-black text-gray-400 tracking-widest mt-0.5">{item.companyName || item.businessType || 'Independent'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 lowercase font-black text-gray-500 text-xs">
                                                    <p>{item.email}</p>
                                                    <p className="mt-0.5 font-sans tracking-tighter">{item.phone}</p>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <p className="text-sm text-gray-800 italic">{item.district || 'Global'}</p>
                                                    <p className="text-[10px] font-black text-[#4caf50] tracking-widest mt-0.5">{item.state}</p>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                                        item.status === '0' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        item.status === '1' ? 'bg-emerald-50 text-[#1b5e20] border-emerald-200' :
                                                        'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        {item.status === '0' ? 'Auditing' : item.status === '1' ? 'Authorized' : 'Blacklisted'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    <p className="text-xs font-black text-gray-400 font-mono tracking-tighter">{new Date(item.createdAt).toLocaleDateString()}</p>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            // Defaulter Report Table View
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-10 py-6">Infraction Target</th>
                                        <th className="px-10 py-6">Reporting Axis</th>
                                        <th className="px-10 py-6">Liability Asset</th>
                                        <th className="px-10 py-6">Outstanding Deficit</th>
                                        <th className="px-10 py-6">System Status</th>
                                        <th className="px-10 py-6 text-right">Audit Trail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 uppercase font-black">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center">
                                                <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                <p className="text-sm font-black text-gray-400 animate-pulse tracking-widest">Decrypting Defaulter Ledgers...</p>
                                            </td>
                                        </tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-40 text-center text-gray-400">
                                                <div className="text-6xl mb-6 opacity-20 animate-bounce">🛡️</div>
                                                <p className="text-sm font-black uppercase tracking-[0.3em]">Clear Horizon: Zero matching infractions</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, i) => (
                                            <tr key={item._id || i} className="hover:bg-gray-50/80 transition-all group">
                                                <td className="px-10 py-6">
                                                    <p className="text-sm text-gray-900 group-hover:text-[#1b5e20] italic transition-colors">{item.defaulter_name}</p>
                                                    <p className="text-[9px] font-black text-gray-400 tracking-widest mt-1">GST-ID: {item.gst_number || 'Internal'}</p>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-[#1b5e20]"></div>
                                                        <p className="text-xs text-gray-600">{item.user_id?.name || 'Unknown'}</p>
                                                    </div>
                                                    <p className="text-[9px] text-gray-400 mt-1 font-mono">{new Date(item.createdAt).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <p className="text-sm text-rose-600 italic tracking-tighter">₹{Number(item.default_amount).toLocaleString('en-IN')}</p>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <p className="text-sm text-red-800 tracking-tighter">₹{Number(item.outstanding_amount ?? item.default_amount).toLocaleString('en-IN')}</p>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                                        item.status === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                        item.status === 2 ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                                                        'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {item.status === 1 ? 'Verified' : item.status === 2 ? 'Rejected' : 'Pending Audit'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    <button 
                                                        onClick={() => setSelectedDefaulter(item)}
                                                        className="px-6 py-2.5 bg-gray-900 text-white hover:bg-black rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95"
                                                    >
                                                        Inspect
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
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
                                                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all shadow-sm ${currentPage === pageNum ? 'bg-[#1b5e20] text-white shadow-lg shadow-emerald-900/20' : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-[#1b5e20]'}`}
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1b5e20] px-10 py-8 flex items-center justify-between text-white font-serif italic">
                            <div>
                                <h3 className="font-black text-2xl tracking-widest uppercase">ENCRYPTED INFRACTION INTEL</h3>
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] font-sans not-italic mt-1">Audit Signature: {selectedDefaulter._id}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedDefaulter(null)}
                                className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all not-italic"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-10 overflow-y-auto custom-scrollbar space-y-10 font-sans uppercase">
                            {/* Priority Intel */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/80 p-8 rounded-[2rem] border border-gray-100 shadow-inner">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black tracking-widest text-[#1b5e20]">Defaulter Entity</p>
                                    <p className="text-xl font-black text-gray-900 tracking-tight italic">{selectedDefaulter.defaulter_name || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black tracking-widest text-[#1b5e20]">Date of Infraction</p>
                                    <p className="text-xl font-black text-gray-900 tracking-tight italic">{selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black tracking-widest text-[#1b5e20]">Nexus Mobile Axis</p>
                                    <p className="text-base font-black text-gray-600 tracking-tighter">{selectedDefaulter.mobile_number || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black tracking-widest text-[#1b5e20]">Nexus Digital Axis</p>
                                    <p className="text-base font-black text-gray-600 tracking-tighter lowercase">{selectedDefaulter.email_id || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Identifiers Grid */}
                            <div className="space-y-6">
                                <h4 className="flex items-center gap-4 text-[11px] font-black tracking-[0.3em] text-gray-300">
                                    <span className="w-8 border-t-2 border-gray-100"></span> INSTITUTIONAL IDENTIFIERS <span className="flex-1 border-t-2 border-gray-100"></span>
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'GST MATRIX', val: selectedDefaulter.gst_number },
                                        { label: 'PAN ANCHOR', val: selectedDefaulter.pan_number },
                                        { label: 'CIN FRAME', val: selectedDefaulter.cin_number },
                                        { label: 'ORIGIN ID', val: selectedDefaulter.aadhar_number }
                                    ].map((id, i) => (
                                        <div key={i} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                                            <p className="text-[9px] font-black text-gray-400 tracking-widest">{id.label}</p>
                                            <p className="text-xs font-black text-gray-900 mt-2 font-mono tracking-tighter">{id.val || 'NULL-REF'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black tracking-[0.3em] text-gray-300">JURISDICTION ANALYTICS</h4>
                                    <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50">
                                        <div className="flex justify-between items-center border-b border-gray-200/50 pb-3">
                                            <span className="text-[10px] font-black text-gray-400 tracking-widest">STATE ORIGIN</span>
                                            <span className="text-sm font-black text-gray-900 italic">{selectedDefaulter.state || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-gray-200/50 pb-3">
                                            <span className="text-[10px] font-black text-gray-400 tracking-widest">DISTRICT SECTOR</span>
                                            <span className="text-sm font-black text-gray-900 italic">{selectedDefaulter.district || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-gray-400 tracking-widest">SUB-NEXUS</span>
                                            <span className="text-sm font-black text-gray-900 italic">{selectedDefaulter.cities || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black tracking-[0.3em] text-gray-300">SECTOR CLASSIFICATION</h4>
                                    <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50">
                                        <div className="flex justify-between items-center border-b border-gray-200/50 pb-3">
                                            <span className="text-[10px] font-black text-gray-400 tracking-widest">INDUSTRY DOMAIN</span>
                                            <span className="text-sm font-black text-gray-900 italic">{selectedDefaulter.industry || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-gray-400 tracking-widest">FISCAL CYCLE</span>
                                            <span className="text-sm font-black text-gray-900 italic">{selectedDefaulter.financial_year || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Impact Bar */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 to-red-900 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition-all"></div>
                                <div className="relative flex gap-8 p-10 bg-white rounded-[2.2rem] border border-rose-100 items-center justify-center overflow-hidden">
                                    <div className="absolute -right-8 -top-8 text-[12rem] text-rose-600/5 italic select-none font-serif">CR</div>
                                    <div className="flex-1 text-center border-r border-rose-100/50 px-4">
                                        <p className="text-[10px] font-black text-rose-400 tracking-[0.4em]">AGGREGATE DEFAULT ASSET</p>
                                        <p className="text-4xl font-black text-rose-600 mt-2 tracking-tighter italic">₹{Number(selectedDefaulter.default_amount || 0).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="flex-1 text-center px-4">
                                        <p className="text-[10px] font-black text-rose-800 tracking-[0.4em]">ACTIVE EXPOSURE DEFICIT</p>
                                        <p className="text-4xl font-black text-rose-900 mt-2 tracking-tighter italic">₹{Number(selectedDefaulter.outstanding_amount ?? selectedDefaulter.default_amount).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-[#1b5e20] animate-pulse"></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reporting Proxy: {selectedDefaulter.user_id?.name || 'Authorized Proxy'}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedDefaulter(null)}
                                className="px-14 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] hover:bg-black transition-all shadow-2xl shadow-gray-900/40 active:scale-95 border-b-4 border-black"
                            >
                                Secure Console
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; background-clip: content-box; }
            `}</style>
        </AdminPortalContainer>
    );
}
