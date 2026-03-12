"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

export default function AdminMembersPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState<any>(null);
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

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminUser');

        if (!token || !adminData) {
            router.push('/admin-login');
        } else {
            setAdmin(JSON.parse(adminData));
            fetchData();
        }
    }, [router]);

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

    const handleAction = async (userId: string, action: string) => {
        const status = action === 'approved' ? 1 : 2;
        try {
            const response = await fetch(`${API_BASE_URL}user/change-staus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status }),
            });

            if (response.ok) {
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: status.toString() } : u));
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

    if (!admin) return null;

    const pendingCount = Array.isArray(users) ? users.filter(u => u.status === "0").length : 0;

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans">
            <AdminSidebar pendingCount={pendingCount} />

            <main className="flex-1 flex flex-col min-h-screen">
                <header className="px-12 py-8 flex justify-between items-center bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-[#f0f9f0] flex items-center justify-center text-xl shadow-inner">📋</div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Member Registry</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Database Authority</p>
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

                    {/* Dedicated Member Listing Module */}
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="bg-[#1b5e20] px-10 py-8 flex flex-col md:flex-row justify-between md:items-center gap-6 text-white">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Master Registry Database</h3>
                                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">Found {filteredUsers.length} results matching filter</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, city..."
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
                                        <th className="px-10 py-6">Identity Docs</th>
                                        <th className="px-10 py-6 text-right">Master Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="py-24 text-center">
                                                <div className="animate-spin h-8 w-8 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                <p className="text-sm font-bold text-gray-400 animate-pulse">Synchronizing Records...</p>
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50/50 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f0f9f0] to-white flex items-center justify-center text-[#1b5e20] font-black text-xl border border-[#1b5e20]/10 shadow-sm group-hover:from-[#1b5e20] group-hover:to-[#0a1f0a] group-hover:text-white transition-all duration-500">
                                                        {user.name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-base font-black text-gray-900 tracking-tight group-hover:text-[#1b5e20] transition-colors">{user.name}</p>
                                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${user.status === '0' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                user.status === '1' ? 'bg-emerald-50 text-[#1b5e20] border-emerald-200' :
                                                                    'bg-rose-50 text-rose-700 border-rose-200'
                                                                }`}>
                                                                {user.status === '0' ? 'Pending' : user.status === '1' ? 'Active' : 'Deactivated'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold text-gray-400 lowercase">{user.email}</span>
                                                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                                            <span className="text-[10px] font-bold text-gray-400">{user.phone}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-gray-700">{user.district || 'N/A'}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-4 h-4 text-xs">📍</span>
                                                        <p className="text-[10px] text-[#4caf50] font-black uppercase tracking-widest">{user.state || 'Unknown Territory'}</p>
                                                    </div>
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

                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end gap-3 items-center">
                                                    {user.status === '0' ? (
                                                        <>
                                                            <button onClick={() => handleAction(user._id, 'rejected')} className="px-6 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-rose-100 shadow-sm active:scale-95">
                                                                Reject
                                                            </button>
                                                            <button onClick={() => handleAction(user._id, 'approved')} className="px-6 py-2.5 bg-[#1b5e20]/10 text-[#1b5e20] hover:bg-[#1b5e20] hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-[#1b5e20]/20 shadow-sm active:scale-95">
                                                                Verify
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {user.status === '1' ? (
                                                                <button
                                                                    onClick={() => handleAction(user._id, 'rejected')}
                                                                    className="px-6 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-rose-100 shadow-sm active:scale-95"
                                                                >
                                                                    Deactivate
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAction(user._id, 'approved')}
                                                                    className="px-6 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-emerald-100 shadow-sm active:scale-95"
                                                                >
                                                                    Activate
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => fetchUserDefaulters(user)}
                                                                className="px-6 py-2.5 bg-[#1b5e20] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 hover:bg-black"
                                                            >
                                                                    View Defaulters
                                                            </button>
                                                            <button
                                                                onClick={() => router.push(`/admin/user-details/${user._id}`)}
                                                                className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-gray-200 active:scale-95"
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
                                                <div className="text-5xl mb-6 opacity-20">📂</div>
                                                <p className="text-sm font-bold uppercase tracking-[0.2em]">Void: No matching records found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <footer className="mt-auto bg-white/80 py-8 px-12 border-t border-gray-100 flex justify-between items-center text-gray-400">
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em]">© {new Date().getFullYear()} CAIP Global Oversight Protocol</p>
                    <div className="flex gap-8">
                        <button onClick={fetchData} className="text-[10px] font-black text-[#1b5e20] bg-[#f0f9f0] px-8 py-2.5 rounded-full hover:bg-[#1b5e20] hover:text-white transition-all uppercase tracking-widest shadow-sm">
                            Refresh Protocol
                        </button>
                    </div>
                </footer>
            </main>

            {/* Defaulter Table Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-[#1b5e20] px-10 py-8 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Reported Defaulters</h3>
                                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">Master Ledger for {selectedUser?.name}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {modalLoading ? (
                                <div className="py-24 text-center">
                                    <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Accessing Encrypted Records...</p>
                                </div>
                            ) : selectedUserDefaulters.length > 0 ? (
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            <th className="px-6 py-2">Defaulter Entity</th>
                                            <th className="px-6 py-2">Registration ID</th>
                                            <th className="px-6 py-2 text-rose-600">Defaulted</th>
                                            <th className="px-6 py-2 text-emerald-600">Recovered</th>
                                            <th className="px-6 py-2">Status</th>
                                            <th className="px-6 py-2 text-right">Filed On</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedUserDefaulters.map((report) => (
                                            <tr key={report._id} className="bg-gray-50/50 hover:bg-gray-50 transition-all rounded-2xl">
                                                <td className="px-6 py-5 rounded-l-2xl">
                                                    <p className="text-sm font-black text-gray-900">{report.defaulter_name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{report.industry}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-xs font-bold font-mono text-gray-600">{report.gst_number || report.pan_number || 'N/A'}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-black text-rose-600 tracking-tight">₹ {report.default_amount.toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-black text-emerald-600 tracking-tight">₹ {(report.default_amount - (report.outstanding_amount || 0)).toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${report.status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                        {report.status === 1 ? 'Verified' : 'Pending Audit'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right rounded-r-2xl">
                                                    <p className="text-xs font-bold text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-24 text-center">
                                    <div className="text-5xl mb-6 opacity-20">🛡️</div>
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Defaulters Reported by this Member</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-10 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
                            >
                                Secure Console
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {showDocModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1b5e20] px-10 py-8 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Access Compliance Records</h3>
                                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">Audit Trail for {selectedUser?.name}</p>
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
                                                    Inspect File
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="text-5xl mb-6 opacity-20">📂</div>
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Documents Archived for this Entity</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setShowDocModal(false)} className="px-10 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95">Safe Exit</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
