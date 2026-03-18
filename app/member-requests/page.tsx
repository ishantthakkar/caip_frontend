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

    const pendingCount = Array.isArray(users) ? users.filter(u => u.status === "0").length : 0;

    return (
        <AdminPortalContainer title="Request For Approval">
            <div className="space-y-12">
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-[#1b5e20] px-10 py-8 flex flex-col md:flex-row justify-between md:items-center gap-6 text-white font-serif">
                        <div>
                            <h3 className="text-xl font-black tracking-widest">Member Approval Requests</h3>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 font-sans not-italic">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/10 border border-white/20 rounded-2xl px-12 py-3 text-sm font-black text-white placeholder-white/40 outline-none focus:bg-white focus:text-gray-900 focus:border-white transition-all w-80"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">🔎</span>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-sm font-black text-white outline-none focus:bg-white focus:text-gray-900 transition-all cursor-pointer"
                            >
                                <option className="text-gray-900" value="0">Pending Requests</option>
                                <option className="text-gray-900" value="1">Approval Entries</option>
                                <option className="text-gray-900" value="2">Denied Requests</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left font-black">
                            <thead className="bg-[#1b5e20] text-white">
                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 border-b border-white/10">
                                    <th className="px-10 py-6">Applicant Credentials</th>
                                    <th className="px-10 py-6">Operational Zone</th>
                                    <th className="px-10 py-6">Compliance Identifiers</th>
                                    <th className="px-10 py-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-sm font-black text-gray-400 animate-pulse tracking-widest">Synchronizing Vault Access...</p>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50/80 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-[#f0f9f0] flex items-center justify-center text-[#1b5e20] font-black text-xl border border-[#1b5e20]/10 group-hover:bg-[#1b5e20] group-hover:text-white transition-all duration-500 shadow-sm">
                                                    {user.name?.[0]}
                                                </div>
                                                <div className="not-italic">
                                                    <p className="text-base font-black text-gray-900 tracking-tight group-hover:text-[#1b5e20] transition-colors">{user.name}</p>
                                                    <div className="flex items-center gap-2 mt-1 lowercase font-bold text-gray-400">
                                                        <span className="text-[10px]">{user.email}</span>
                                                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                                        <span className="text-[10px] font-sans">{user.phone}</span>
                                                    </div>
                                                    {user.status === '2' && user.rejectionReason && (
                                                        <div className="mt-3 flex items-start gap-1.5 max-w-[200px]">
                                                            <p className="text-[9px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 shadow-sm">
                                                                Refusal: {user.rejectionReason}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="not-italic font-black">
                                                <p className="text-sm text-gray-800 tracking-tighter">{user.district || 'Unassigned'}</p>
                                                <p className="text-[9px] text-[#4caf50] mt-1 tracking-wider">{user.state || 'Global'}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="text-[9px] space-y-2 bg-gray-50/80 p-4 rounded-2xl border border-gray-100 group-hover:bg-white transition-all shadow-inner">
                                                <p className="text-gray-400 flex justify-between tracking-wider">GST: <span className="text-gray-900 italic font-mono ml-3">{user.gst || 'Null'}</span></p>
                                                <p className="text-gray-400 flex justify-between tracking-wider">PAN: <span className="text-gray-900 italic font-mono ml-3">{user.pan || 'Null'}</span></p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-3 items-center not-italic">
                                                {user.status === '0' ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAction(user._id, 'rejected')}
                                                            className="px-6 py-3 bg-rose-50 text-rose-600 text-[9px] font-black tracking-wider rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100 active:scale-95 shadow-lg shadow-rose-900/5"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(user._id, 'approved')}
                                                            className="px-10 py-3 bg-[#1b5e20] text-white text-[9px] font-black tracking-wider rounded-xl hover:bg-black transition-all shadow-xl shadow-emerald-900/10 active:scale-95 border-b-2 border-black/20"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-black text-gray-300 bg-gray-50/50 px-6 py-2.5 rounded-xl border border-gray-100 tracking-widest">
                                                        Protocol settled
                                                    </span>
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
                </div>
            </div>

            {/* Document Preview Modal */}
            {showDocModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1b5e20] px-10 py-8 flex justify-between items-center text-white font-serif italic">
                            <div>
                                <h3 className="text-xl font-black tracking-widest">Audit artifacts</h3>
                                <p className="text-[10px] font-black text-white/50 tracking-wider font-sans not-italic mt-1">Found {selectedUser?.businessDocuments?.length || 0} legal assets: {selectedUser?.name}</p>
                            </div>
                            <button onClick={() => setShowDocModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all not-italic">✕</button>
                        </div>

                        <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar font-sans font-black">
                            {selectedUser?.businessDocuments?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-8">
                                    {selectedUser.businessDocuments.map((doc: string, idx: number) => {
                                        const isPdf = doc.toLowerCase().endsWith('.pdf');
                                        const docUrl = `${ASSETS_BASE_URL}${doc}`;
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
                                                    className="w-full text-center py-4 bg-white text-[#1b5e20] text-[9px] font-black tracking-wider rounded-2xl border border-green-100 shadow-sm hover:bg-[#1b5e20] hover:text-white transition-all shadow-emerald-900/5 group-hover:shadow-xl group-hover:shadow-emerald-900/10"
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
