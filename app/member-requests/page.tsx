"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

export default function MemberRequestsPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState<any>(null);
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
        const token = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminUser');

        if (!token || !adminData) {
            router.push('/admin-login');
        } else {
            setAdmin(JSON.parse(adminData));
            fetchUsers();
        }
    }, [router]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}users`);
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

        // If rejecting and modal isn't open yet, open it
        if (status === 2 && !showRejectionModal) {
            setProcessingUserId(userId);
            setShowRejectionModal(true);
            setRejectionReason("");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}user/change-staus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    if (!admin) return null;

    const pendingCount = Array.isArray(users) ? users.filter(u => u.status === "0").length : 0;

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans">
            <AdminSidebar pendingCount={pendingCount} />

            <main className="flex-1 flex flex-col min-h-screen">
                <header className="px-12 py-8 flex justify-between items-center bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-[#f0f9f0] flex items-center justify-center text-xl shadow-inner">👥</div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Access Requests</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Verification Sub-Protocol</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm font-black text-gray-900">{admin.name}</p>
                            <p className="text-[10px] text-[#1b5e20] font-black uppercase tracking-widest">Root Administrator</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-[#1b5e20] flex items-center justify-center text-white text-xl font-black shadow-xl border-4 border-white">
                            {admin.name[0]}
                        </div>
                    </div>
                </header>

                <div className="p-12 space-y-12">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="bg-[#1b5e20] px-10 py-8 flex flex-col md:flex-row justify-between md:items-center gap-6 text-white">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Active Request Queue</h3>
                                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">Found {filteredUsers.length} pending protocol entries</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Search applicants..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-white/10 border border-white/20 rounded-2xl px-12 py-3 text-sm text-white placeholder-white/40 outline-none focus:bg-white focus:text-gray-900 focus:border-white transition-all w-80"
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">🔎</span>
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-sm font-bold text-white outline-none focus:bg-white focus:text-gray-900 transition-all cursor-pointer"
                                >
                                    <option className="text-gray-900" value="0">Pending only</option>
                                    <option className="text-gray-900" value="1">Approved entries</option>
                                    <option className="text-gray-900" value="2">Rejected entries</option>
                                    <option className="text-gray-900" value="all">Full Queue</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-4 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                        <th className="px-10 py-6">Applicant Credentials</th>
                                        <th className="px-10 py-6">Proposed Territory</th>
                                        <th className="px-10 py-6">Compliance Hash</th>
                                        <th className="px-10 py-6">Identity Docs</th>
                                        <th className="px-10 py-6 text-center">Protocol Status</th>
                                        <th className="px-10 py-6 text-right">Master Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <div className="animate-spin h-8 w-8 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                <p className="text-sm font-bold text-gray-400 animate-pulse">Syncing with registry...</p>
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-[#f0f9f0] flex items-center justify-center text-[#1b5e20] font-black text-lg border border-[#1b5e20]/10 group-hover:bg-[#1b5e20] group-hover:text-white transition-all duration-300">
                                                        {user.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black text-gray-900 tracking-tight">{user.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold text-gray-400 lowercase">{user.email}</span>
                                                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                                            <span className="text-[10px] font-bold text-gray-400">{user.phone}</span>
                                                        </div>
                                                        {user.status === '2' && user.rejectionReason && (
                                                            <div className="mt-2 flex items-start gap-1.5 max-w-[200px]">
                                                                <span className="text-[10px] mt-0.5">⚠️</span>
                                                                <p className="text-[10px] font-bold text-rose-500 italic bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                                                                    Reason: {user.rejectionReason}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <p className="text-sm font-black text-gray-700">{user.district}, {user.state}</p>
                                                <p className="text-[10px] text-[#4caf50] font-black uppercase mt-1 tracking-widest">{user.subDistrict || 'Regional'}</p>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="text-[10px] space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    <p className="font-black text-gray-400 uppercase tracking-tighter flex justify-between">GST: <span className="text-gray-900 font-mono ml-2 italic">{user.gst}</span></p>
                                                    <p className="font-black text-gray-400 uppercase tracking-tighter flex justify-between">PAN: <span className="text-gray-900 font-mono ml-2 italic">{user.pan}</span></p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <button
                                                    onClick={() => { setSelectedUser(user); setShowDocModal(true); }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-[#1b5e20]/10 text-gray-400 hover:text-[#1b5e20] rounded-xl border border-gray-100 transition-all font-bold text-[10px] uppercase tracking-widest"
                                                >
                                                    <span>📁</span> {user.businessDocuments?.length || 0} Files
                                                </button>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className={`inline-flex px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${user.status === '0' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    user.status === '1' ? 'bg-emerald-50 text-[#1b5e20] border-emerald-200' :
                                                        'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                    {user.status === '0' ? 'Protocol Pending' : user.status === '1' ? 'System Approved' : 'Rejected'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end gap-3 items-center">
                                                    {user.status === '0' ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleAction(user._id, 'rejected')}
                                                                className="px-6 py-2.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100 active:scale-95 shadow-sm"
                                                            >
                                                                Reject
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(user._id, 'approved')}
                                                                className="px-6 py-2.5 bg-[#1b5e20]/10 text-[#1b5e20] text-[10px] font-black uppercase rounded-xl hover:bg-[#1b5e20] hover:text-white transition-all border border-[#1b5e20]/20 active:scale-95 shadow-sm"
                                                            >
                                                                Verify Entry
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                                            Protocol Logged
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center text-gray-400">
                                                <p className="text-sm font-black uppercase tracking-[0.2em] animate-pulse">Void: No Requests Found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <footer className="mt-auto bg-white/80 py-8 px-12 border-t border-gray-100 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Secure Administrative Protocol • Verification Module Active</p>
                </footer>
            </main>

            {/* Document Preview Modal */}
            {showDocModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1b5e20] px-10 py-8 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Compliance Documents</h3>
                                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">Verification Ledger for {selectedUser?.name}</p>
                            </div>
                            <button onClick={() => setShowDocModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all">✕</button>
                        </div>

                        <div className="p-10">
                            {selectedUser?.businessDocuments?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-6">
                                    {selectedUser.businessDocuments.map((doc: string, idx: number) => {
                                        const isPdf = doc.toLowerCase().endsWith('.pdf');
                                        const docUrl = `${ASSETS_BASE_URL}${doc}`;
                                        return (
                                            <div key={idx} className="group relative bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-4 hover:border-[#1b5e20] hover:bg-[#1b5e20]/5 transition-all">
                                                <div className="text-5xl">
                                                    {isPdf ? '📄' : '🖼️'}
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Document #{idx + 1}</p>
                                                    <p className="text-xs font-bold text-gray-700 mt-1 truncate max-w-[150px]">{doc.split('/').pop()}</p>
                                                </div>
                                                <a
                                                    href={docUrl}
                                                    target="_blank"
                                                    className="px-6 py-2 bg-white text-[#1b5e20] text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-200 shadow-sm hover:bg-[#1b5e20] hover:text-white transition-all"
                                                >
                                                    View Entity
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="text-5xl mb-6 opacity-20">📂</div>
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Documents Uploaded by Applicant</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setShowDocModal(false)} className="px-10 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95">Close Ledger</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Rejection Reason Modal */}
            {showRejectionModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-rose-600 px-10 py-8 text-white">
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                                <span className="text-2xl">🚫</span> Rejection Rationale
                            </h3>
                            <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-2">Log context for current action</p>
                        </div>

                        <div className="p-10 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Reason for Rejection <span className="opacity-50 italic font-medium">(Optional)</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter reason for rejection here... (e.g., Incomplete documentation, mismatch in GST/PAN records)"
                                    className="w-full h-40 bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-rose-500 focus:bg-white transition-all shadow-inner resize-none font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setShowRejectionModal(false);
                                        setProcessingUserId(null);
                                        setRejectionReason("");
                                    }}
                                    className="px-6 py-4 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (processingUserId) {
                                            handleAction(processingUserId, 'rejected', rejectionReason);
                                        }
                                    }}
                                    className="px-6 py-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20 active:scale-95"
                                >
                                    Log Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
