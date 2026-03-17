"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

export default function AdminMembersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState<any>(null);
    const [selectedUserDefaulters, setSelectedUserDefaulters] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showDocModal, setShowDocModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}users`),
                fetch(`${API_BASE_URL}admin/dashboard-stats`)
            ]);

            const userData = await usersRes.json();
            const statsData = await statsRes.json();

            if (usersRes.ok) {
                setUsers(Array.isArray(userData.data) ? userData.data : (userData.data ? [userData.data] : []));
            }
            if (statsRes.ok) {
                setStats(statsData);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
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

    const fetchUserDefaulters = async (user: any) => {
        setSelectedUser(user);
        setModalLoading(true);
        setShowModal(true);
        try {
            const res = await fetch(`${API_BASE_URL}admin/member-defaulters/${user._id}`);
            const data = await res.json();
            if (res.ok) {
                setSelectedUserDefaulters(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching member defaulters:", error);
        } finally {
            setModalLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!Array.isArray(users)) return [];
        return users.filter(user => {
            const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm) ||
                user.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.state?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [users, searchTerm, statusFilter]);

    const pendingCount = Array.isArray(users) ? users.filter(u => u.status === "0").length : 0;

    return (
        <AdminPortalContainer title="Member Registry Database">
            <div className="space-y-12">
                {/* Member Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Entities', count: users.length, icon: '🏢', color: 'bg-emerald-500' },
                        { label: 'Active Members', count: users.filter(u => u.status === '1').length, icon: '✅', color: 'bg-blue-500' },
                        { label: 'Pending Review', count: pendingCount, icon: '⏳', color: 'bg-amber-500' },
                        { label: 'Restricted', count: users.filter(u => u.status === '2').length, icon: '🚫', color: 'bg-rose-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex items-center gap-6 group hover:shadow-2xl transition-all">
                            <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-900">{stat.count}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Member Listing Table */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-[#1b5e20] px-10 py-8 flex flex-col md:flex-row justify-between md:items-center gap-6 text-white">
                        <div>
                            <h3 className="text-xl font-black tracking-tight uppercase tracking-widest font-serif italic">Master Registry Database</h3>
                            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">Found {filteredUsers.length} results matching filter</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, city..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/10 border border-white/20 rounded-2xl px-12 py-3 text-sm font-black text-white placeholder-white/40 outline-none focus:bg-white focus:text-gray-900 focus:border-white transition-all w-80 uppercase"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">🔎</span>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-sm font-black text-white outline-none focus:bg-white focus:text-gray-900 transition-all cursor-pointer uppercase"
                            >
                                <option className="text-gray-900" value="all">All Members</option>
                                <option className="text-gray-900" value="1">Verified Only</option>
                                <option className="text-gray-900" value="0">Pending Review</option>
                                <option className="text-gray-900" value="2">Blacklisted</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-10 py-6">Member Identity</th>
                                    <th className="px-10 py-6">Nexus Jurisdiction</th>
                                    <th className="px-10 py-6 text-center">Compliance Docs</th>
                                    <th className="px-10 py-6 text-right">Master Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 uppercase">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <div className="animate-spin h-8 w-8 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-sm font-black text-gray-400 animate-pulse tracking-widest uppercase">Synchronizing Records...</p>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f0f9f0] to-white flex items-center justify-center text-[#1b5e20] font-black text-xl border border-[#1b5e20]/10 shadow-sm group-hover:from-[#1b5e20] group-hover:to-[#0a1f0a] group-hover:text-white transition-all duration-500">
                                                    {user.name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-black text-gray-900 tracking-tight group-hover:text-[#1b5e20] transition-colors italic">{user.name}</p>
                                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${user.status === '0' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            user.status === '1' ? 'bg-emerald-50 text-[#1b5e20] border-emerald-200' :
                                                                'bg-rose-50 text-rose-700 border-rose-200'
                                                            }`}>
                                                            {user.status === '0' ? 'Pending Audit' : user.status === '1' ? 'Authorized' : 'Blacklisted'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 lowercase font-bold">
                                                        <span className="text-[10px] text-gray-400">{user.email}</span>
                                                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                                        <span className="text-[10px] text-gray-400">{user.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="space-y-1 font-black">
                                                <p className="text-sm text-gray-700 uppercase italic tracking-tighter">{user.district || 'N/A'}</p>
                                                <p className="text-[10px] text-[#4caf50] tracking-widest">{user.state || 'Unknown territory'}</p>
                                            </div>
                                        </td>

                                        <td className="px-10 py-8 text-center">
                                            <button
                                                onClick={() => { setSelectedUser(user); setShowDocModal(true); }}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-[#1b5e20]/10 text-gray-400 hover:text-[#1b5e20] rounded-xl border border-gray-100 transition-all font-black text-[9px] uppercase tracking-[0.2em]"
                                            >
                                                <span>📁</span> {user.businessDocuments?.length || 0} Records
                                            </button>
                                        </td>

                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-3 items-center">
                                                {user.status === '0' ? (
                                                    <>
                                                        <button onClick={() => handleAction(user._id, 'rejected')} className="px-6 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-rose-100 shadow-sm active:scale-95">
                                                            Reject
                                                        </button>
                                                        <button onClick={() => handleAction(user._id, 'approved')} className="px-6 py-2.5 bg-[#1b5e20] text-white hover:bg-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95">
                                                            Verify
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {user.status === '1' ? (
                                                            <button
                                                                onClick={() => handleAction(user._id, 'rejected')}
                                                                className="px-6 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-rose-100 shadow-sm active:scale-95"
                                                            >
                                                                Restrict
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAction(user._id, 'approved')}
                                                                className="px-6 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-emerald-100 shadow-sm active:scale-95"
                                                            >
                                                                Restore
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => fetchUserDefaulters(user)}
                                                            className="px-6 py-2.5 bg-[#1b5e20] text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 hover:bg-black"
                                                        >
                                                            Ledger
                                                        </button>
                                                        <button
                                                            onClick={() => router.push(`/admin/user-details/${user._id}`)}
                                                            className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-gray-200 active:scale-95"
                                                        >
                                                            Audit
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="py-32 text-center text-gray-400">
                                            <div className="text-5xl mb-6 opacity-20 animate-pulse">📂</div>
                                            <p className="text-sm font-black uppercase tracking-[0.3em]">Void: No matching records found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Defaulter Table Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1b5e20] px-10 py-8 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-black tracking-tight uppercase">Defaulter Master Ledger</h3>
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Authorized Access: {selectedUser?.name}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {modalLoading ? (
                                <div className="py-24 text-center">
                                    <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Decrypting Records...</p>
                                </div>
                            ) : selectedUserDefaulters.length > 0 ? (
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            <th className="px-6 py-2">Entity</th>
                                            <th className="px-6 py-2 text-rose-600">Defaulted</th>
                                            <th className="px-6 py-2 text-emerald-600">Recovered</th>
                                            <th className="px-6 py-2">System Status</th>
                                            <th className="px-6 py-2 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="uppercase font-black text-gray-700">
                                        {selectedUserDefaulters.map((report) => (
                                            <tr key={report._id} className="bg-gray-50/50 hover:bg-gray-50 transition-all rounded-2xl shadow-sm italic">
                                                <td className="px-6 py-5 rounded-l-2xl">
                                                    <p className="text-sm">{report.defaulter_name}</p>
                                                    <p className="text-[9px] text-[#4caf50] tracking-widest uppercase mt-0.5">{report.industry}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm text-rose-600">₹ {report.default_amount.toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm text-emerald-600">₹ {(report.default_amount - (report.outstanding_amount || 0)).toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] border font-black ${report.status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                        {report.status === 1 ? 'Authorized' : 'Pending Audit'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right rounded-r-2xl text-xs text-gray-400">
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-24 text-center">
                                    <div className="text-5xl mb-6 opacity-20">🛡️</div>
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Zero Infractions Recorded</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-12 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-black transition-all shadow-2xl active:scale-95"
                            >
                                Secure Console
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {showDocModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1b5e20] px-10 py-8 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-black tracking-tight uppercase tracking-widest">Compliance Audit Records</h3>
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Found {selectedUser?.businessDocuments?.length || 0} Assets for {selectedUser?.name}</p>
                            </div>
                            <button onClick={() => setShowDocModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all">✕</button>
                        </div>

                        <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
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
                                                    <p className="text-[9px] uppercase text-gray-400 tracking-[0.3em]">Compliance Asset #{idx + 1}</p>
                                                    <p className="text-xs text-gray-900 mt-2 truncate max-w-[200px] uppercase italic">{doc.split('/').pop()}</p>
                                                </div>
                                                <a
                                                    href={docUrl}
                                                    target="_blank"
                                                    className="w-full text-center py-3 bg-white text-[#1b5e20] text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl border border-green-100 shadow-sm hover:bg-[#1b5e20] hover:text-white transition-all shadow-emerald-900/5 group-hover:shadow-xl group-hover:shadow-emerald-900/10"
                                                >
                                                    Inspect Asset
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-20 text-center uppercase tracking-widest">
                                    <div className="text-6xl mb-6 opacity-20">📂</div>
                                    <p className="text-sm font-black text-gray-400">Zero Compliance Assets Archived</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-100 flex justify-end gap-4">
                            <button onClick={() => setShowDocModal(false)} className="px-12 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-black transition-all shadow-2xl active:scale-95">Safe Exit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Reason Modal */}
            {showRejectionModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-rose-600 px-10 py-8 text-white font-serif">
                            <h3 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
                                <span className="text-2xl">🚫</span> Deny Protocol
                            </h3>
                            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mt-2 italic font-sans">Authority Check Required</p>
                        </div>

                        <div className="p-10 space-y-8 font-sans">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Restriction Rationale <span className="opacity-30 italic font-medium lowercase">(Explain refusal)</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Briefly state compliance failure points..."
                                    className="w-full h-40 bg-gray-50 border border-gray-100 rounded-3xl p-6 text-sm font-bold text-gray-700 placeholder:text-gray-300 outline-none focus:border-rose-500 focus:bg-white transition-all shadow-inner resize-none tracking-tight"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setShowRejectionModal(false);
                                        setProcessingUserId(null);
                                        setRejectionReason("");
                                    }}
                                    className="px-6 py-4 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-200 transition-all active:scale-95 shadow-sm"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={() => {
                                        if (processingUserId) {
                                            handleAction(processingUserId, 'rejected', rejectionReason);
                                        }
                                    }}
                                    className="px-6 py-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-700 transition-all shadow-2xl shadow-rose-900/30 active:scale-95"
                                >
                                    Confirm Deny
                                </button>
                            </div>
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
