"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

export default function MemberRequestsPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('0'); // Default to Pending
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showDocModal, setShowDocModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []));
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, action: string, reason: string = "") => {
        const status = action === 'approved' ? 1 : 2;

        if (status === 2 && !showRejectionModal) {
            setProcessingUserId(userId);
            setShowRejectionModal(true);
            setRejectionReason("");
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}user/change-staus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, status, rejectionReason: reason }),
            });

            if (response.ok) {
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: status.toString(), rejectionReason: reason } : u));
                setShowRejectionModal(false);
                setProcessingUserId(null);
                setRejectionReason("");
                alert(`User ${action} successfully.`);
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.msg || 'Failed to update status'}`);
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("An error occurred while updating the status.");
        }
    };

    const filteredUsers = useMemo(() => {
        if (!Array.isArray(users)) return [];
        return users.filter(user => {
            const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm);
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [users, searchTerm, statusFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const pendingCount = Array.isArray(users) ? users.filter(u => u.status === "0").length : 0;

    return (
        <AdminPortalContainer title="Request For Approval">
            <div className="space-y-12">
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-white px-8 py-8 flex flex-wrap items-end gap-8 border-b border-gray-100">
                        <div className="flex-1 min-w-[200px] space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Report Type</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3.5 text-xs font-black text-gray-900 outline-none focus:border-green-500 transition-all appearance-none cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="0">Pending Requests</option>
                                    <option value="1">Approved Members</option>
                                    <option value="2">Rejected Requests</option>
                                    <option value="all">All Records</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
                            </div>
                        </div>

                        <div className="flex-1 min-w-[150px] space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Range</label>
                            <div className="relative">
                                <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3.5 text-xs font-black text-gray-900 outline-none appearance-none">
                                    <option>All</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
                            </div>
                        </div>

                        <div className="flex-[2] min-w-[300px] space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Search</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-12 py-3.5 text-xs font-black text-gray-900 placeholder-gray-300 outline-none focus:border-green-500 transition-all shadow-sm"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">🔎</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left font-black">
                            <thead className="bg-agri-green-primary text-white">
                                <tr className="text-[10px] font-black tracking-[0.2em] text-white/90 border-b border-white/10">
                                    <th className="px-6 py-6 min-w-[120px]">Member ID</th>
                                    <th className="px-6 py-6 min-w-[150px]">Name</th>
                                    <th className="px-6 py-6 min-w-[200px]">Email</th>
                                    <th className="px-6 py-6">Phone</th>
                                    <th className="px-6 py-6">State</th>
                                    <th className="px-6 py-6">District</th>
                                    <th className="px-6 py-6">Sub District</th>
                                    <th className="px-6 py-6 min-w-[150px]">Organization</th>
                                    <th className="px-6 py-6 text-center">Status</th>
                                    <th className="px-6 py-6 text-center">Type</th>
                                    <th className="px-6 py-6 text-center whitespace-nowrap">Joined On</th>
                                    <th className="px-6 py-6 text-center">Docs</th>
                                    <th className="px-6 py-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <div className="animate-spin h-10 w-10 border-4 border-agri-green-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-sm font-black text-gray-400 animate-pulse tracking-widest">Synchronizing Vault Access...</p>
                                        </td>
                                    </tr>
                                ) : paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-all group border-b border-gray-50">
                                        <td className="px-6 py-6">
                                            <p className="text-[11px] font-black text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 text-center tracking-tighter">
                                                {user.memberId || 'PENDING'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-6 text-[11px] font-black text-gray-900 tracking-tight">{user.name}</td>
                                        <td className="px-6 py-6 text-[10px] font-bold text-gray-400">{user.email}</td>
                                        <td className="px-6 py-6 text-[10px] font-bold text-gray-500 font-sans">{user.phone}</td>
                                        <td className="px-6 py-6 text-[10px] font-black text-agri-green-primary tracking-tight">{user.state || '-'}</td>
                                        <td className="px-6 py-6 text-[10px] font-bold text-gray-600">{user.district || '-'}</td>
                                        <td className="px-6 py-6 text-[10px] font-bold text-gray-400 italic">{user.subDistrict || '-'}</td>
                                        <td className="px-6 py-6 text-[10px] font-black text-gray-900">{user.companyName || '-'}</td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`text-[9px] font-black px-4 py-1.5 rounded-lg tracking-widest block mx-auto w-fit italic ${user.status === '0' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                                                    user.status === '1' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' :
                                                        'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                                }`}>
                                                {user.status === '0' ? 'PENDING' : user.status === '1' ? 'APPROVED' : 'REJECTED'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="text-[10px] font-black text-gray-900 text-center tracking-widest uppercase">Member</p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="text-[10px] font-bold text-gray-400 text-center whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString('en-GB')}</p>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <button
                                                onClick={() => { setSelectedUser(user); setShowDocModal(true); }}
                                                className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm"
                                                title="View Documents"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                            </button>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex justify-end gap-2 items-center not-italic">
                                                {user.status === '0' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAction(user._id, 'rejected')}
                                                            className="p-2.5 bg-rose-50 text-rose-600 rounded-lg group/btn hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                                                            title="Reject"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(user._id, 'approved')}
                                                            className="p-2.5 bg-agri-green-primary text-white rounded-lg hover:bg-black transition-all shadow-lg"
                                                            title="Approve"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="py-40 text-center text-gray-400">
                                            <p className="text-sm font-black tracking-widest">No Record Found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && filteredUsers.length > 0 && (
                        <div className="px-10 py-8 border-t border-gray-50 flex items-center justify-between bg-white">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Page {currentPage} of {totalPages} <span className="mx-2 opacity-30">•</span> {filteredUsers.length} Indexed Assets
                            </span>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-8 py-3 rounded-xl border border-gray-100 bg-white text-[10px] font-black tracking-widest text-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 uppercase"
                                >
                                    Previous
                                </button>

                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                        const pageNum = idx + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-agri-green-primary text-white shadow-xl' : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-8 py-3 rounded-xl border border-gray-100 bg-white text-[10px] font-black tracking-widest text-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 uppercase"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Document Preview Modal */}
            {showDocModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-agri-green-primary px-10 py-8 flex justify-between items-center text-white font-serif">
                            <div>
                                <h3 className="text-xl font-black tracking-widest">Bussiness Documents</h3>
                            </div>
                            <button onClick={() => setShowDocModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all not-italic">✕</button>
                        </div>

                        <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar font-sans font-black">
                            {selectedUser?.businessDocuments?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-8">
                                    {selectedUser.businessDocuments.map((doc: string, idx: number) => {
                                        const isPdf = doc.toLowerCase().endsWith('.pdf');
                                        const docUrl = `${ASSETS_BASE_URL}uploads/${doc}`;
                                        return (
                                            <div key={idx} className="group relative bg-gray-50 rounded-3xl border border-gray-100 p-8 flex flex-col items-center justify-center gap-6 hover:shadow-2xl transition-all hover:bg-white">
                                                <div className="text-6xl group-hover:scale-110 transition-transform">
                                                    {isPdf ? '📄' : '🖼️'}
                                                </div>
                                                <div className="text-center font-black">
                                                    <p className="text-[9px] text-gray-400 tracking-wider">Compliance asset #{idx + 1}</p>
                                                    <p className="text-xs text-gray-900 mt-2 truncate max-w-[200px] italic tracking-tighter">{doc.split('/').pop()}</p>
                                                </div>
                                                <a
                                                    href={docUrl}
                                                    target="_blank"
                                                    className="w-full text-center py-4 bg-white text-agri-green-primary text-[9px] font-black tracking-wider rounded-2xl border border-green-100 shadow-sm hover:bg-agri-green-primary hover:text-white transition-all shadow-emerald-900/5 group-hover:shadow-xl group-hover:shadow-emerald-900/10"
                                                >
                                                    Verify Asset
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-24 text-center opacity-30">
                                    <div className="text-7xl mb-6">📂</div>
                                    <p className="text-sm tracking-widest">Zero compliance artifacts uploaded</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setShowDocModal(false)} className="px-14 py-4 bg-gray-900 text-white text-[10px] font-black tracking-wider rounded-[1.5rem] hover:bg-black transition-all shadow-2xl active:scale-95 border-b-4 border-black">Secure console</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Rejection Reason Modal */}
            {showRejectionModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-rose-600 px-10 py-8 text-white font-serif italic">
                            <h3 className="text-xl font-black tracking-widest flex items-center gap-3">
                                <span className="text-2xl not-italic">🚫</span> Registration reject
                            </h3>
                        </div>

                        <div className="p-10 space-y-8 font-sans font-black">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 tracking-wider ml-1">
                                    Reject reason <span className="opacity-30 italic font-medium lowercase">(Detail protocol failure)</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter compliance mismatch data..."
                                    className="w-full h-44 bg-gray-50 border border-gray-100 rounded-[2rem] p-8 text-sm font-bold text-gray-700 placeholder:text-gray-300 outline-none focus:border-rose-500 focus:bg-white transition-all shadow-inner resize-none tracking-tight"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setShowRejectionModal(false);
                                        setProcessingUserId(null);
                                        setRejectionReason("");
                                    }}
                                    className="px-6 py-5 bg-gray-100 text-gray-500 text-[10px] font-black tracking-wider rounded-2xl hover:bg-gray-200 transition-all active:scale-95 shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (processingUserId) {
                                            handleAction(processingUserId, 'rejected', rejectionReason);
                                        }
                                    }}
                                    className="px-6 py-5 bg-rose-600 text-white text-[10px] font-black tracking-wider rounded-2xl hover:bg-rose-700 transition-all shadow-2xl shadow-rose-900/30 active:scale-95"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminPortalContainer>
    );
}
