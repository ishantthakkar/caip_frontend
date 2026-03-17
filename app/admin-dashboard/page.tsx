"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';

// Dynamically import IndiaMap to avoid SSR issues
const IndiaMap = dynamic(() => import('@/components/IndiaMap'), {
    ssr: false,
    loading: () => <div className="min-h-[400px] bg-sky-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
    </div>
});

export default function AdminDashboardPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUserDefaulters, setSelectedUserDefaulters] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    useEffect(() => {
        const initialFetch = async () => {
            await Promise.all([fetchUsers(), fetchAdminStats()]);
        };
        initialFetch();
    }, []);

    const fetchAdminStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}admin/dashboard-stats`);
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Error fetching admin stats:", error);
        }
    };

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
                user.phone?.includes(searchTerm);
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [users, searchTerm, statusFilter]);

    if (!stats) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center flex-col gap-4">
                <div className="animate-spin h-12 w-12 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
                <p className="text-sm font-bold text-gray-500 animate-pulse">Initializing Administrative Nexus...</p>
            </div>
        );
    }

    return (
        <AdminPortalContainer title="Control Center Overview">
            <div className="space-y-12">
                {/* Metric Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { title: 'Global Defaulters', val: stats.summary.totalReported, icon: '🌍', color: 'bg-emerald-500' },
                        { title: 'Aggregate Default', val: `₹ ${stats.summary.totalAmount.toLocaleString()}`, icon: '💰', color: 'bg-amber-500' },
                        { title: 'Global Recovery', val: `₹ ${stats.summary.totalRecovered.toLocaleString()}`, icon: '✅', color: 'bg-emerald-700' },
                        { title: 'Platform Members', val: users.length, icon: '🏢', color: 'bg-blue-600' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex items-center gap-6 group hover:shadow-2xl transition-all">
                            <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                                {s.icon}
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-900 tracking-tighter">{s.val}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.title}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bar Graph: Search Trend */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-[#1b5e20] px-10 py-6 text-white flex justify-between items-center">
                        <h3 className="text-lg font-black tracking-tight flex items-center gap-4 uppercase">
                            <span>📊</span> Global Search Volume Trend ({new Date().getFullYear()})
                        </h3>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">System Analytics Active</span>
                    </div>
                    <div className="p-12 min-h-[400px]">
                        <div className="flex items-end gap-4 md:gap-7 h-[300px] relative border-b border-gray-100 pb-2">
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-full border-t border-gray-50/50 h-0"></div>)}
                            </div>
                            {(() => {
                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                const fullData = months.map((m, i) => {
                                    const entry = stats.searchTrend?.find((d: any) => d.month === (i + 1));
                                    return { label: m, count: entry ? entry.count : 0 };
                                });
                                const maxCount = Math.max(...fullData.map(d => d.count), 5);
                                return fullData.map((data, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg z-10 shadow-2xl whitespace-nowrap">
                                            {data.count} Global Searches
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                        <div
                                            style={{ height: `${(data.count / maxCount) * 100}%` }}
                                            className="w-full max-w-[45px] bg-gradient-to-t from-[#0a1f0a] to-[#1b5e20] rounded-t-xl transition-all duration-700 ease-out group-hover:from-[#1b5e20] group-hover:to-[#ffd600] group-hover:scale-x-110 shadow-lg"
                                        ></div>
                                        <span className="absolute -bottom-8 text-[11px] font-black text-gray-400 uppercase tracking-tighter group-hover:text-[#1b5e20]">{data.label}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>

                {/* Row: Latest Defaulters & Industry Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Latest Reported Defaulters Table */}
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-10 py-6 text-white">
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-4 uppercase">
                                <span>⚠️</span> Latest Reported Defaulters
                            </h3>
                        </div>
                        <div className="p-8 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                        <th className="px-6 py-4">#</th>
                                        <th className="px-6 py-4">Defaulter Company</th>
                                        <th className="px-6 py-4">Reported By</th>
                                        <th className="px-6 py-4 text-center">Defaulted</th>
                                        <th className="px-6 py-4 text-right">Recovered</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats.recentReports?.length > 0 ? stats.recentReports.map((report: any, i: number) => (
                                        <tr key={report._id} className="hover:bg-gray-50 transition-all font-bold">
                                            <td className="px-6 py-5 text-gray-400 text-xs">{i + 1}</td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm text-gray-900 truncate max-w-[150px] uppercase font-black">{report.defaulter_name}</p>
                                                <p className="text-[9px] text-gray-400 uppercase tracking-widest">{report.industry || 'General'}</p>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-500">{report.user_id?.name || 'N/A'}</td>
                                            <td className="px-6 py-5 text-sm text-center text-rose-600">₹ {report.default_amount?.toLocaleString()}</td>
                                            <td className="px-6 py-5 text-sm text-right text-emerald-600">₹ {(report.default_amount - (report.outstanding_amount || 0)).toLocaleString()}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="py-12 text-center text-gray-400 italic font-black uppercase">No recent reports logged</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Defaulter Industry Types Chart */}
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-10 py-6 text-white">
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-4 uppercase">
                                <span>🥗</span> Defaulter Industry Types
                            </h3>
                        </div>
                        <div className="p-10 flex-1 flex flex-col items-center justify-center">
                            {(() => {
                                const data = stats.industryDist || [];
                                const total = data.reduce((a: any, b: any) => a + b.value, 0);
                                const colors = ['#1b5e20', '#ffd600', '#ff4081', '#00bcd4', '#9c27b0'];
                                let cumulative = 0;
                                return (
                                    <>
                                        <div className="relative w-48 h-48 mb-8">
                                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                                {data.map((item: any, i: number) => {
                                                    const p = (item.value / total) * 100;
                                                    const offset = -cumulative;
                                                    cumulative += p;
                                                    return (
                                                        <circle key={i} cx="18" cy="18" r="15.915" fill="transparent" stroke={colors[i % colors.length]} strokeWidth="6" strokeDasharray={`${p} ${100 - p}`} strokeDashoffset={offset} className="transition-all duration-700 hover:stroke-black cursor-pointer" />
                                                    );
                                                })}
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <p className="text-2xl font-black text-gray-900">{total}</p>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sectors</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 w-full">
                                            {data.map((item: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div style={{ backgroundColor: colors[i % colors.length] }} className="w-2.5 h-2.5 rounded-full"></div>
                                                        <span className="text-[10px] font-black text-gray-700 uppercase">{item.name}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-400">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Middle Row: State-wise Insights (Map + Table) */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#1b5e20] px-10 py-6 text-white flex justify-between items-center">
                        <h3 className="text-lg font-black tracking-tight flex items-center gap-4 uppercase">
                            <span>📍</span> State-wise Defaulter Insights
                        </h3>
                        <button className="text-white/40 hover:text-white transition-colors">•••</button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="p-8 border-r border-gray-100 min-h-[500px] relative">
                            <IndiaMap stateInsights={stats.stateInsights || []} />
                        </div>
                        <div className="p-8 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                        <th className="px-6 py-4">State</th>
                                        <th className="px-6 py-4 text-center">Entries</th>
                                        <th className="px-6 py-4 text-center">Debt</th>
                                        <th className="px-6 py-4 text-right">Recovered</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 font-bold">
                                    {stats.stateInsights?.map((insight: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-all">
                                            <td className="px-6 py-5 text-sm font-black text-gray-900 uppercase italic">{insight.state}</td>
                                            <td className="px-6 py-5 text-center text-sm text-gray-700">{insight.count}</td>
                                            <td className="px-6 py-5 text-center text-sm text-rose-600">₹ {insight.amount?.toLocaleString()}</td>
                                            <td className="px-6 py-5 text-right text-sm text-emerald-600">₹ {insight.recovered?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Transaction History */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-[#1b5e20] px-10 py-6 text-white">
                        <h3 className="text-lg font-black tracking-tight flex items-center gap-4 uppercase">
                            <span>📄</span> Transaction History
                        </h3>
                    </div>
                    <div className="p-8 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-4">#</th>
                                    <th className="px-6 py-4">TX ID</th>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4">Company</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-bold">
                                {(stats.transactions || []).map((tx: any, i: number) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-all italic">
                                        <td className="px-6 py-5 text-gray-400 text-xs">{i + 1}</td>
                                        <td className="px-6 py-5 text-xs text-gray-600 font-mono">{tx.txNo}</td>
                                        <td className="px-6 py-5 text-sm text-gray-900 uppercase font-black">{tx.member}</td>
                                        <td className="px-6 py-5 text-sm text-gray-500">{tx.company}</td>
                                        <td className="px-6 py-5 text-sm text-gray-900 font-black">₹ {tx.amount.toLocaleString()}.00</td>
                                        <td className="px-6 py-5 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${tx.type.includes('New') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Master Member Registry Table */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-[#1b5e20] px-10 py-8 flex flex-col md:flex-row justify-between md:items-center gap-6 text-white">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-black tracking-tight uppercase">Master Member Registry</h3>
                            <div className="flex items-center gap-4 mt-1 font-bold">
                                <p className="text-xs text-white/60 uppercase tracking-widest">Full Compliance Management</p>
                                <div className="w-1 h-1 rounded-full bg-white/40"></div>
                                <Link href="/admin-members" className="text-xs text-[#ffd600] hover:text-white transition-colors uppercase tracking-widest underline decoration-2 underline-offset-4">View All Registry</Link>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search entities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/10 border border-white/20 rounded-2xl px-12 py-3 text-sm font-black text-white placeholder-white/40 outline-none focus:bg-white focus:text-gray-900 focus:border-white transition-all w-72"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">🔎</span>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-sm font-black text-white outline-none focus:bg-white focus:text-gray-900 transition-all cursor-pointer uppercase"
                            >
                                <option className="text-gray-900" value="all">All Profiles</option>
                                <option className="text-gray-900" value="0">Review Needed</option>
                                <option className="text-gray-900" value="1">Verified</option>
                                <option className="text-gray-900" value="2">Blacklisted</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-10 py-6">Entity Credentials</th>
                                    <th className="px-10 py-6">Geographic Jurisdiction</th>
                                    <th className="px-10 py-6 text-center">Reporting Count</th>
                                    <th className="px-10 py-6 text-right">Master Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-[#f0f9f0] flex items-center justify-center text-[#1b5e20] font-black text-lg border border-[#1b5e20]/10 group-hover:bg-[#1b5e20] group-hover:text-white transition-all">
                                                    {user.name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 truncate max-w-[250px] uppercase italic">{user.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 lowercase">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="text-sm font-bold text-gray-700 uppercase">{user.district}, {user.state}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black mt-1 tracking-widest">{user.subDistrict || 'Global'}</p>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className="text-sm font-black text-[#1b5e20] bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                                                {user.reportCount || 0} Reports
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end gap-3 items-center">
                                                {user.status === '0' ? (
                                                    <button onClick={() => handleAction(user._id, 'approved')} className="px-6 py-2 bg-[#1b5e20] text-white text-[10px] font-black uppercase rounded-xl hover:bg-black transition-all shadow-lg active:scale-95">Verify Entity</button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => fetchUserDefaulters(user)}
                                                            className="px-6 py-2 bg-[#1b5e20] text-white text-[10px] font-black uppercase rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
                                                        >
                                                            Inspect Ledger
                                                        </button>
                                                        <Link href={`/admin-members`} className="px-6 py-2 bg-gray-50 text-gray-500 text-[10px] font-black uppercase rounded-xl border border-gray-200 hover:bg-gray-200 hover:text-gray-900 transition-all">Audit</Link>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
                                            <th className="px-6 py-2">Registration</th>
                                            <th className="px-6 py-2 text-rose-600">Defaulted</th>
                                            <th className="px-6 py-2 text-emerald-600">Recovered</th>
                                            <th className="px-6 py-2">System Status</th>
                                            <th className="px-6 py-2 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedUserDefaulters.map((report) => (
                                            <tr key={report._id} className="bg-gray-50/50 hover:bg-gray-50 transition-all rounded-2xl">
                                                <td className="px-6 py-5 rounded-l-2xl">
                                                    <p className="text-sm font-black text-gray-900 uppercase italic">{report.defaulter_name}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{report.industry}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-xs font-bold font-mono text-gray-600 tracking-tighter uppercase">{report.gst_number || report.pan_number || 'Internal-ID'}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-black text-rose-600 tracking-tight italic">₹ {report.default_amount.toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-black text-emerald-600 tracking-tight italic">₹ {(report.default_amount - (report.outstanding_amount || 0)).toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${report.status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                        {report.status === 1 ? 'Authorized' : 'Pending Audit'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right rounded-r-2xl">
                                                    <p className="text-xs font-black text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-24 text-center">
                                    <div className="text-5xl mb-6 opacity-20 animate-bounce">🛡️</div>
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Zero Infractions Recorded</p>
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

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; background-clip: content-box; }
            `}</style>
        </AdminPortalContainer>
    );
}
