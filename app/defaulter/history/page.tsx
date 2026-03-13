"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: any }) => (
    <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm flex-shrink-0 mt-1">{icon}</div>
        <div className="min-w-0">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                {label}: <span className="text-gray-700 font-medium ml-1 normal-case">{value}</span>
            </p>
        </div>
    </div>
);

export default function SearchHistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    
    // Pagination & Search
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchHistory();
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

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
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
                            <svg className="absolute left-3 top-2.5 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#0a2f0a] text-white">
                                <tr>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase text-center border-r border-gray-700 w-10">#</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase text-center border-r border-gray-700 min-w-[90px]">Date</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase text-center border-r border-gray-700 min-w-[80px]">Time</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase border-r border-gray-700 min-w-[120px]">Reported By</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase border-r border-gray-700 min-w-[180px]">Defaulter Company Name</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase border-r border-gray-700 min-w-[140px]">GST Number</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase border-r border-gray-700 min-w-[120px]">PAN Number</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase border-r border-gray-700 min-w-[150px]">CIN Number</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase border-r border-gray-700 min-w-[140px]">Aadhar Number</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase border-r border-gray-700 min-w-[100px]">State</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase border-r border-gray-700 min-w-[100px]">District</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase border-r border-gray-700 min-w-[100px]">Sub District</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase text-center border-r border-gray-700 min-w-[80px]">Status</th>
                                    <th className="px-3 py-3 text-[10px] font-bold uppercase text-center min-w-[100px]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentItems.map((log, i) => (
                                    <tr key={i} className="hover:bg-gray-50 bg-white transition-colors text-[11px] font-medium text-gray-700">
                                        <td className="px-3 py-4 text-center border-r border-gray-100">{indexOfFirstItem + i + 1}</td>
                                        <td className="px-3 py-4 text-center border-r border-gray-100 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')}
                                        </td>
                                        <td className="px-3 py-4 text-center border-r border-gray-100 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </td>
                                        <td className="px-3 py-4 border-r border-gray-100">{log.user_id?.name || 'Local Member'}</td>
                                        <td className="px-3 py-4 border-r border-gray-100 uppercase">{log.filters?.name || '-'}</td>
                                        <td className="px-3 py-4 border-r border-gray-100 uppercase">{log.filters?.gst || '-'}</td>
                                        <td className="px-3 py-4 border-r border-gray-100 uppercase">{log.filters?.pan || '-'}</td>
                                        <td className="px-3 py-4 border-r border-gray-100 uppercase">{log.filters?.cin || '-'}</td>
                                        <td className="px-3 py-4 border-r border-gray-100 uppercase">{log.filters?.aadhar || '-'}</td>
                                        <td className="px-3 py-4 border-r border-gray-100">{log.filters?.state || '-'}</td>
                                        <td className="px-3 py-4 border-r border-gray-100">{log.filters?.district || '-'}</td>
                                        <td className="px-3 py-4 border-r border-gray-100">{log.filters?.subDistrict || '-'}</td>
                                        <td className="px-3 py-4 text-center border-r border-gray-100">
                                            <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-[9px] font-bold border border-green-100 uppercase inline-block">
                                                Approved
                                            </span>
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedLog(log);
                                                    setShowDetails(true);
                                                }}
                                                className="bg-[#46c1e1] text-white px-4 py-1.5 rounded text-[10px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1 mx-auto"
                                            >
                                                <span>👁 VIEW</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
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
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {showDetails && selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(false)}></div>
                        <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-300">
                            {/* Header */}
                            <div className="px-8 py-5 bg-[#0a1f0a] flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">👥</span>
                                    <h3 className="text-lg font-bold tracking-tight">Defaulter Details</h3>
                                </div>
                                <button onClick={() => setShowDetails(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-0 overflow-y-auto no-scrollbar">
                                {/* Section 1: Main Info */}
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                                    <div className="space-y-4">
                                        <InfoItem icon="👤" label="Defaulter Company Name" value={selectedLog.filters?.name || '-'} />
                                        <InfoItem icon="📞" label="Mobile" value={selectedLog.filters?.mobile || '-'} />
                                        <InfoItem icon="✉️" label="Email" value={selectedLog.filters?.email || '-'} />
                                        <InfoItem icon="🔢" label="GST" value={selectedLog.filters?.gst || '-'} />
                                        <InfoItem icon="💳" label="PAN" value={selectedLog.filters?.pan || '-'} />
                                        <InfoItem icon="🆔" label="CIN" value={selectedLog.filters?.cin || '-'} />
                                        <InfoItem icon="🛡️" label="Aadhar" value={selectedLog.filters?.aadhar || '-'} />
                                        <InfoItem icon="🏠" label="Defaulter Address" value={selectedLog.filters?.address || '-'} />
                                    </div>
                                    <div className="space-y-4">
                                        <InfoItem icon="📍" label="State" value={selectedLog.filters?.state || '-'} />
                                        <InfoItem icon="🏢" label="District" value={selectedLog.filters?.district || '-'} />
                                        <InfoItem icon="🗾" label="Sub District" value={selectedLog.filters?.subDistrict || '-'} />
                                        <InfoItem icon="📅" label="Financial Year" value={selectedLog.filters?.financial_year || '-'} />
                                        <InfoItem icon="📉" label="Outstanding" value={Number(selectedLog.filters?.outstanding_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} />
                                        <InfoItem icon="🏭" label="Industry" value={selectedLog.filters?.industry || '-'} />
                                        <InfoItem icon="👤" label="Reported By" value={selectedLog.filters?.reported_by || selectedLog.user_id?.name || 'Verified Member'} />
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Section 2: Financial/Reason */}
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                    <InfoItem icon="💵" label="Default Amount" value={Number(selectedLog.filters?.default_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} />
                                    <InfoItem icon="📅" label="Date of Default" value={selectedLog.filters?.date_of_default ? new Date(selectedLog.filters.date_of_default).toISOString().split('T')[0] : '-'} />
                                    <InfoItem icon="⚠️" label="Reason" value={selectedLog.filters?.reason || 'Search Snapshot'} />
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm">✅</div>
                                        <div>
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                                            <span className="px-3 py-1 bg-green-500 text-white rounded-full text-[10px] font-bold uppercase mt-1 inline-block">
                                                Approved
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Section 3: Legal Info */}
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                    <InfoItem icon="🏛️" label="Court Complex Name" value={selectedLog.filters?.court_complex_name || '-'} />
                                    <InfoItem icon="🔢" label="Case Number" value={selectedLog.filters?.case_number || '-'} />
                                    <InfoItem icon="⚖️" label="Case Type" value={selectedLog.filters?.case_type || '-'} />
                                    <InfoItem icon="📅" label="Case Year" value={selectedLog.filters?.case_year || '-'} />
                                    <InfoItem icon="💼" label="Case Status" value={selectedLog.filters?.case_status || '-'} />
                                </div>

                                <hr className="border-gray-100" />

                                {/* Section 4: Documents */}
                                <div className="p-8">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                                        <span>📄</span> Documents
                                    </h4>
                                    {selectedLog.filters?.attachment_documents && selectedLog.filters.attachment_documents.length > 0 ? (
                                        <div className="flex flex-wrap gap-3">
                                            {selectedLog.filters.attachment_documents.map((doc: string, idx: number) => {
                                                const isPdf = doc.toLowerCase().endsWith('.pdf');
                                                return (
                                                    <a key={idx} href={`${ASSETS_BASE_URL}uploads/${doc}`} target="_blank" className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-lg text-xs font-bold text-green-700 hover:bg-green-50 transition-all flex items-center gap-3 group">
                                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                                            {isPdf ? (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></svg>
                                                            ) : (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                                            )}
                                                        </div>
                                                        <span className="group-hover:translate-x-0.5 transition-transform">Document {idx + 1}</span>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">No documents attached.</p>
                                    )}
                                </div>

                                <hr className="border-gray-100" />

                                {/* Section 5: Payment Records */}
                                <div className="p-8 bg-gray-50/50">
                                    <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                                        <span className="w-10 h-10 bg-[#0a1f0a] text-white rounded-xl flex items-center justify-center text-sm">💰</span>
                                        Payment Records
                                    </h4>
                                    {selectedLog.filters?.payments && selectedLog.filters.payments.length > 0 ? (
                                        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-xl overflow-hidden">
                                            <table className="w-full text-center">
                                                <thead>
                                                    <tr className="bg-[#0a1f0a] text-white">
                                                        <th className="px-6 py-5 text-xs font-black uppercase border-r border-white/10">#</th>
                                                        <th className="px-6 py-5 text-base font-bold border-r border-white/10">Payment Date</th>
                                                        <th className="px-6 py-5 text-base font-bold">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {selectedLog.filters.payments.map((p: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-50/80 transition-all">
                                                            <td className="px-6 py-5 text-sm font-bold text-gray-400 border-r border-gray-50">{idx + 1}</td>
                                                            <td className="px-6 py-5 text-sm font-semibold text-gray-600 border-r border-gray-50">{new Date(p.date).toISOString().split('T')[0]}</td>
                                                            <td className="px-6 py-5 text-sm font-black text-gray-800">{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-xl overflow-hidden text-center p-10">
                                            <p className="text-xs text-gray-400 italic">No payments recorded for this entry.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 bg-gray-50 border-t flex justify-end">
                                <button onClick={() => setShowDetails(false)} className="bg-gray-400 text-white px-8 py-2 rounded-lg font-bold hover:bg-gray-500 transition-all shadow-md">
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
