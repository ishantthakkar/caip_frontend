"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DetailRow = ({ label, value, icon, isHighlights = false, isStatus = false }: any) => (
    <div className="flex gap-4 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isHighlights ? 'bg-emerald-50 text-[#1b5e20]' : 'bg-gray-50 text-gray-400'}`}>
            {icon}
        </div>
        <div className="flex flex-col min-w-0">
            <label className="text-[13px] font-medium text-gray-400 tracking-tight leading-none mb-1.5">{label}</label>
            <div className={`text-[15px] font-medium tracking-tight truncate ${isHighlights ? 'text-[#1b5e20] font-bold' : 'text-gray-900'} ${isStatus ? 'bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-full inline-block w-fit text-[12px] font-bold' : ''}`}>
                {value}
            </div>
        </div>
    </div>
);

export default function SearchHistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    // Pagination & Search
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchHistory();
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}defaulter/search-history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setHistory(data.data || []);
        } catch (error) {
            console.error("History fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered data based on search
    const filteredHistory = history.filter(log => {
        const searchStr = searchQuery.toLowerCase();
        return (
            log.filters?.name?.toLowerCase().includes(searchStr) ||
            log.filters?.gst?.toLowerCase().includes(searchStr) ||
            log.filters?.pan?.toLowerCase().includes(searchStr) ||
            log.user_id?.name?.toLowerCase().includes(searchStr) ||
            log.filters?.state?.toLowerCase().includes(searchStr) ||
            log.filters?.district?.toLowerCase().includes(searchStr)
        );
    });

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const selectedData = selectedLog?.defaulter_id || selectedLog?.resultData || {};

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

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
            'Address': ['address', 'defaulter_address'],
            'Member Name': ['member_name']
        };

        Object.entries(filterMap).forEach(([label, keys]: [string, string[]]) => {
            if (keys.some((key: string) => filters[key] && filters[key].toString().trim() !== '')) {
                fields.push(label);
            }
        });

        return fields.length > 0 ? fields.join(', ') : 'Combined Filters';
    };

    const getPaymentRecoveryStatus = (def: any) => {
        if (!def) return { label: 'Not Found', color: 'bg-gray-50 text-gray-400 border-gray-100' };
        if (def.isSettled) return { label: 'Settled', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };

        const defaultAmt = Number(def.default_amount) || 0;
        const outstandingAmt = def.outstanding_amount !== undefined ? Number(def.outstanding_amount) : defaultAmt;

        if (outstandingAmt === 0) return { label: 'Full Paid', color: 'bg-green-50 text-green-700 border-green-200' };
        if (outstandingAmt > 0 && outstandingAmt < defaultAmt) return { label: 'Partial Paid', color: 'bg-orange-50 text-orange-700 border-orange-200' };
        return { label: 'Not Paid', color: 'bg-red-50 text-red-700 border-red-200' };
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
    </div>;

    return (
        <MemberPortalContainer title="Search History">
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-800">Search History</h2>
                    <button onClick={() => router.back()} className="bg-black text-white px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold hover:bg-gray-800">
                        <span className="text-lg">⬅</span> Back
                    </button>
                </div>

                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header Controls */}
                    <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">Show</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-green-600 font-bold"
                            >
                                {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                            <span className="text-xs font-bold text-gray-500">entries</span>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search in history..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-green-600 font-medium"
                            />
                            <svg className="absolute left-3 top-2.5 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#0a2f0a] text-white">
                                <tr>
                                    <th className="px-3 py-3 text-[10px] font-bold text-center border-r border-gray-700 w-10">#</th>
                                    <th className="px-3 py-3 text-[10px] font-bold text-center border-r border-gray-700 min-w-[90px]">Date</th>
                                    <th className="px-3 py-3 text-[10px] font-bold border-r border-gray-700 min-w-[80px]">Time</th>
                                    <th className="px-3 py-3 text-[10px] font-bold border-r border-gray-700 min-w-[120px]">Search Field</th>
                                    <th className="px-3 py-3 text-[10px] font-bold border-r border-gray-700 min-w-[120px]">Reported By</th>
                                    <th className="px-3 py-3 text-[10px] font-bold border-r border-gray-700 min-w-[180px]">Defaulter Firm Name</th>
                                    <th className="px-3 py-3 text-[10px] font-bold border-r border-gray-700 min-w-[140px]">GST</th>
                                    <th className="px-4 py-3 text-[10px] font-bold border-r border-gray-700 min-w-[150px]">CIN</th>
                                    <th className="px-3 py-3 text-[10px] font-bold border-r border-gray-700 min-w-[100px]">State</th>
                                    <th className="px-3 py-3 text-[10px] font-bold border-r border-gray-700 min-w-[100px]">District</th>
                                    <th className="px-3 py-3 text-[10px] font-bold border-r border-gray-700 min-w-[100px]">Sub District</th>
                                    <th className="px-3 py-3 text-[10px] font-bold border-r border-gray-700 min-w-[100px]">City/Town/Village</th>
                                    <th className="px-3 py-3 text-[10px] font-bold text-center border-r border-gray-700 min-w-[70px]">Matches</th>
                                    <th className="px-3 py-3 text-[10px] font-bold text-center border-r border-gray-700 min-w-[100px]">Outstanding</th>
                                    <th className="px-3 py-3 text-[10px] font-bold text-center border-r border-gray-700 min-w-[100px]">Payment Status</th>
                                    <th className="px-3 py-3 text-[10px] font-bold text-center border-r border-gray-700 min-w-[80px]">Defaulter Status</th>
                                    <th className="px-3 py-3 text-[10px] font-bold text-center min-w-[100px]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentItems.map((record, i) => {
                                    const displayData = record.defaulter_id || record.resultData || {};
                                    const filters = record.filters || {};

                                    return (
                                        <tr key={i} className="hover:bg-gray-50 bg-white transition-colors text-[11px] font-medium text-gray-700">
                                            <td className="px-3 py-4 text-center border-r border-gray-100">{indexOfFirstItem + i + 1}</td>
                                            <td className="px-3 py-4 text-center border-r border-gray-100 whitespace-nowrap">
                                                {new Date(record.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')}
                                            </td>
                                            <td className="px-3 py-4 text-center border-r border-gray-100 whitespace-nowrap">
                                                {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </td>
                                            <td className="px-3 py-4 border-r border-gray-100 font-bold text-green-700 bg-green-50/20">{getSearchField(filters)}</td>
                                            <td className="px-3 py-4 border-r border-gray-100">{record.user_id?.name || 'Local Member'}</td>
                                            <td className="px-3 py-4 border-r border-gray-100 uppercase">{displayData.defaulter_name || displayData.name || filters.name || '-'}</td>
                                            <td className="px-3 py-4 border-r border-gray-100 uppercase">{displayData.gst_number || displayData.gst || filters.gst || '-'}</td>
                                            <td className="px-3 py-4 border-r border-gray-100 uppercase">{displayData.cin_number || displayData.cin || filters.cin || '-'}</td>
                                            <td className="px-3 py-4 border-r border-gray-100">{displayData.state || filters.state || '-'}</td>
                                            <td className="px-3 py-4 border-r border-gray-100">{displayData.district || filters.district || '-'}</td>
                                            <td className="px-3 py-4 border-r border-gray-100">{displayData.cities || displayData.subDistrict || filters.subDistrict || '-'}</td>
                                            <td className="px-3 py-4 border-r border-gray-100 uppercase">{displayData.city || filters.city || '-'}</td>
                                            <td className="px-3 py-4 text-center border-r border-gray-100">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-[13px] font-bold ${Number(record.resultCount) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                        {record.resultCount || (record.defaulter_id ? 1 : 0)}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400">RECORDS</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-center border-r border-gray-100">
                                                {(() => {
                                                    const defaultAmt = Number(displayData.default_amount || filters.default_amount) || 0;
                                                    const outstanding = displayData.outstanding_amount !== undefined
                                                        ? Number(displayData.outstanding_amount)
                                                        : (filters.outstanding_amount !== undefined ? Number(filters.outstanding_amount) : defaultAmt);
                                                    return (
                                                        <span className="text-[12px] font-bold text-gray-900 font-sans">
                                                            ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-3 py-4 text-center border-r border-gray-100">
                                                {(() => {
                                                    const paymentStatus = getPaymentRecoveryStatus(displayData);
                                                    return (
                                                        <span className={`px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap border ${paymentStatus.color}`}>
                                                            {paymentStatus.label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-3 py-4 text-center border-r border-gray-100">
                                                <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase inline-block whitespace-nowrap">
                                                    Defaulter
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedLog(record);
                                                        setShowDetails(true);
                                                    }}
                                                    className="bg-[#46c1e1] text-white px-4 py-1.5 rounded text-[10px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1 mx-auto"
                                                >
                                                    <span>👁 VIEW</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredHistory.length === 0 && (
                        <div className="p-20 text-center bg-white">
                            <p className="text-gray-400 text-sm font-semibold italic">No search entries found matching your criteria.</p>
                        </div>
                    )}

                    {/* Footer Controls */}
                    {filteredHistory.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-xs font-bold text-gray-500">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredHistory.length)} of {filteredHistory.length} entries
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" /></svg>
                                </button>

                                <div className="flex items-center gap-1 mx-2">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const page = i + 1;
                                        // Show first, last, and current +/- 1
                                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${currentPage === page ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-white border border-transparent hover:border-gray-200'}`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                            return <span key={page} className="text-gray-400 text-[10px]">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {showDetails && selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(false)}></div>
                        <div className="relative bg-[#fbfcff] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-500">
                            {/* Modal Header */}
                            <div className="px-8 py-5 bg-[#1b5e20] flex items-center justify-between text-white shadow-lg relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-white/10 rounded-xl">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] font-bold tracking-tight">Defaulter Record Details</h3>
                                    </div>
                                </div>
                                <button onClick={() => setShowDetails(false)} className="text-white/40 hover:text-white transition-all bg-white/10 p-2 rounded-xl">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto no-scrollbar flex-1 space-y-10">
                                {/* Section 1: Defaulter Company Details */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-[#1b5e20] rounded-full"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Defaulter Company Details</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                        <DetailRow label="Defaulter Firm name" value={selectedData.defaulter_name || selectedData.name || selectedLog.filters?.name || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>} />
                                        <DetailRow label="Type of Defaulter" value={selectedData.industry || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" /></svg>} />
                                        <DetailRow label="GST" value={selectedData.gst_number || selectedData.gst || selectedLog.filters?.gst || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>} />
                                        <DetailRow label="CIN" value={selectedData.cin_number || selectedData.cin || selectedLog.filters?.cin || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
                                    </div>
                                </div>

                                {/* Section: Owners/Partners Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-slate-400 rounded-full"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Owners/Partners Details</h4>
                                    </div>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                        <table className="w-full text-left font-sans">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">#</th>
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">Name</th>
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">PAN</th>
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">Aadhar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedData.defaulter_persons && selectedData.defaulter_persons.length > 0 ? (
                                                    selectedData.defaulter_persons.map((p: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-[14px] font-bold">{(idx + 1).toString().padStart(2, '0')}</td>
                                                            <td className="px-6 py-4 text-[14px] font-bold text-gray-900">{p.name || 'N/A'}</td>
                                                            <td className="px-6 py-4 text-[13px] font-mono font-medium text-gray-600">{p.pan || 'N/A'}</td>
                                                            <td className="px-6 py-4 text-[13px] font-mono font-medium text-gray-600">{p.aadhar || 'N/A'}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-8 text-center text-[13px] font-medium text-gray-400 italic">No owner/partner details recorded.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Section 2: Contact & Location */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-[#ffcd1e] rounded-full"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Contact & Address</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                        <DetailRow label="Mobile" value={selectedData.mobile_number || selectedData.mobile || selectedLog.filters?.mobile || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>} />
                                        <DetailRow label="Email" value={selectedData.email_id || selectedData.email || selectedLog.filters?.email || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>} />
                                        <DetailRow label="State" value={selectedData.state || selectedLog.filters?.state || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>} />
                                        <DetailRow label="District" value={selectedData.district || selectedLog.filters?.district || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" /><path d="M10 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" /><path d="M2 7h20" /></svg>} />
                                        <DetailRow label="Sub district" value={selectedData.cities || selectedData.subDistrict || selectedLog.filters?.subDistrict || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15.5 5.5-3 3-3-3" /><path d="m15.5 11.5-3 3-3-3" /><path d="m15.5 17.5-3 3-3-3" /></svg>} />
                                        <DetailRow label="City/Town/Village" value={selectedData.city || selectedLog.filters?.city || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" /></svg>} />
                                        <div className="col-span-full pt-2">
                                            <DetailRow label="Full address" value={selectedData.defaulter_address || selectedData.address || selectedLog.filters?.address || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Financial Status */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-[#1b5e20] rounded-full opacity-50"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Financial Status</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                        <DetailRow label="Default amount" value={`₹${Number(selectedData.default_amount || 0).toLocaleString()}`} isHighlights icon={
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
                                        <DetailRow label="Outstanding" value={`₹${Number(selectedData.outstanding_amount ? selectedData.outstanding_amount : selectedData.default_amount || 0).toLocaleString()}`} isHighlights icon={
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
                                        <DetailRow label="Date of default" value={selectedData.date_of_default ? new Date(selectedData.date_of_default).toLocaleDateString() : 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
                                        <DetailRow label="Financial year" value={selectedData.financial_year || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>} />
                                        <div className="col-span-full">
                                            <DetailRow label="Reason for default" value={selectedData.reason_description || selectedData.reason || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h.01" /><path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" /><path d="M12 9v4" /></svg>} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5: Report Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-emerald-100 rounded-full"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Report Information</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                        <DetailRow label="Reported By" value={selectedData.user_id?.companyName || selectedData.user_id?.name || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                                    </div>
                                </div>

                                {/* Section: Settlement Details */}
                                {selectedData.isSettled && (
                                    <div className="space-y-6 animate-in fade-in duration-700">
                                        <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
                                            <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                                            <h4 className="text-[15px] font-bold text-emerald-900 tracking-tight flex items-center gap-2">
                                                Settlement Details
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12 p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                                            <DetailRow label="Settled Amount" value={`₹${Number(selectedData.settledAmount || 0).toLocaleString()}`} isHighlights icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>} />
                                            <DetailRow label="Settled By" value={selectedData.settledBy || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                                            <DetailRow label="Settlement Date" value={selectedData.settlementDate ? new Date(selectedData.settlementDate).toLocaleDateString() : 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
                                        </div>
                                    </div>
                                )}

                                {/* Section 6: Documents */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-slate-200 rounded-full"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Documents</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {selectedData.attachment_documents && selectedData.attachment_documents.length > 0 ? (
                                            selectedData.attachment_documents.map((doc: string, idx: number) => {
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
                                                <p className="text-[13px] font-medium">No Documents.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 7: Payment Records */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-blue-100 rounded-full"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Payment Records</h4>
                                    </div>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">#</th>
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">Payment Date</th>
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(() => {
                                                    const displayedPayments = (selectedData.payments || []).filter((p: any) => p.type !== 'settlement');
                                                    if (displayedPayments.length === 0) return (
                                                        <tr>
                                                            <td colSpan={3} className="px-6 py-12 text-center text-[13px] font-medium text-gray-400 italic">No recovery payments synchronized yet.</td>
                                                        </tr>
                                                    );
                                                    return displayedPayments.map((p: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-[14px] font-bold">{(idx + 1).toString().padStart(2, '0')}</td>
                                                            <td className="px-6 py-4 text-[14px] font-medium leading-tight text-center sm:text-left">
                                                                {new Date(p.date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 text-[14px] font-bold text-right text-[#1b5e20]">₹{Number(p.amount).toLocaleString()}</td>
                                                        </tr>
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] selection:bg-none">
                                <button onClick={() => setShowDetails(false)} className="px-10 py-3 bg-[#1b5e20] text-white rounded-xl text-[14px] font-bold shadow-xl shadow-[#1b5e20]/20 hover:bg-[#144317] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MemberPortalContainer>
    );
}
