"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// Dynamically import IndiaMap to avoid SSR issues
const IndiaMap = dynamic(() => import('@/components/IndiaMap'), {
    ssr: false,
    loading: () => <div className="min-h-[400px] bg-sky-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-agri-green-primary border-t-transparent rounded-full font-black"></div>
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
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}admin/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Error fetching admin stats:", error);
        }
    };

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

    const handleAction = async (userId: string, action: string) => {
        const status = action === 'approved' ? 1 : 2;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}user/change-staus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}admin/member-defaulters/${user._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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

    if (!stats || !stats.summary) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center flex-col gap-4">
                <div className="animate-spin h-12 w-12 border-4 border-agri-green-primary border-t-transparent rounded-full font-black"></div>
                <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-[0.2em]">Initializing Administrative Nexus...</p>
            </div>
        );
    }

    return (
        <AdminPortalContainer title="Dashboard">
            <div className="space-y-12">
                {/* Metric Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        {
                            title: 'Total Defaulters',
                            val: stats.summary.totalReported,
                            icon: (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="17" y2="12" /><line x1="17" y1="16" x2="17.01" y2="16" />
                                </svg>
                            ),
                            color: 'bg-red-500'
                        },
                        {
                            title: 'Total Defaulters Amount',
                            val: `₹ ${stats.summary.totalAmount.toLocaleString()}`,
                            icon: (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 3h12" />
                                    <path d="M6 8h12" />
                                    <path d="m6 13 8.5 8" />
                                    <path d="M6 13h3" />
                                    <path d="M9 13c6.667 0 6.667-10 0-10" />
                                </svg>
                            ),
                            color: 'bg-amber-600'
                        },
                        {
                            title: 'Total Recovery Amount',
                            val: `₹ ${stats.summary.totalRecovered.toLocaleString()}`,
                            icon: (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ),
                            color: 'bg-emerald-600'
                        },
                        {
                            title: 'Total Members',
                            val: users.length,
                            icon: (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            ),
                            color: 'bg-blue-600'
                        }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex items-center gap-6 group hover:shadow-2xl transition-all">
                            <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                {s.icon}
                            </div>
                            <div>
                                <p className="text-2xl font-black text-black tracking-tighter">{s.val}</p>
                                <p className="text-[10px] font-bold text-black tracking-wider">{s.title}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bar Graph: Search Trend */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-agri-green-primary px-10 py-6 text-white flex justify-between items-center">
                        <h3 className="text-lg font-black tracking-tight flex items-center gap-4">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="12" width="4" height="9"></rect><rect x="10" y="7" width="4" height="14"></rect><rect x="17" y="3" width="4" height="18"></rect></svg> Global Search Trend ({new Date().getFullYear()})
                        </h3>
                    </div>
                    <div className="p-12 min-h-[400px]">
                        <div className="flex-1 flex items-end gap-4 md:gap-7 relative border-b border-gray-100 pb-2 h-[300px]">
                            {(() => {
                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                const fullData = months.map((m, i) => {
                                    const entry = stats.searchTrend?.find((d: any) => d.month === (i + 1));
                                    return { label: m, count: entry ? entry.count : 0 };
                                });
                                const maxCount = Math.max(...fullData.map(d => d.count), 500);

                                return (
                                    <>
                                        {/* Grid Lines with Y-Axis Labels */}
                                        <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none -left-12">
                                            {[0, 1, 2, 3, 4].map((i) => (
                                                <div key={i} className="flex items-center gap-3 w-[calc(100%+48px)]">
                                                    <span className="text-[10px] font-bold text-black w-9 text-right tabular-nums">
                                                        {Math.round(maxCount - (i * (maxCount / 4)))}
                                                    </span>
                                                    <div className="flex-1 border-t border-gray-100 flex-grow"></div>
                                                </div>
                                            ))}
                                        </div>

                                        {fullData.map((data, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end z-10">
                                                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg z-20 shadow-2xl whitespace-nowrap pointer-events-none">
                                                    {data.count} Global Searches
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                </div>
                                                <div
                                                    style={{ height: `${(data.count / maxCount) * 100}%` }}
                                                    className="w-full max-w-[45px] bg-gradient-to-t from-agri-green-950 to-agri-green-primary rounded-t-xl transition-all duration-700 ease-out group-hover:from-agri-green-primary group-hover:to-agri-gold-secondary group-hover:scale-x-110 shadow-lg"
                                                ></div>
                                                <span className="absolute -bottom-8 text-[11px] font-black text-black tracking-tighter group-hover:text-agri-green-primary">{data.label}</span>
                                            </div>
                                        ))}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Row: Latest Defaulters & Industry Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Latest Reported Defaulters Table */}
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-agri-green-primary px-10 py-6 text-white">
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-4">
                                <span>⚠️</span> Latest Reported Defaulters
                            </h3>
                        </div>
                        <div className="p-8 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-agri-green-primary text-gray-300 uppercase">
                                    <tr className="divide-x divide-white/5 border-t border-white/10">
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest">#</th>
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest">Defaulter Company</th>
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest">Reported By</th>
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest text-center">Defaulted</th>
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest text-right">Recovered</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats.recentReports?.length > 0 ? stats.recentReports.map((report: any, i: number) => (
                                        <tr key={report._id} className="hover:bg-gray-50 divide-x divide-gray-50 transition-all">
                                            <td className="px-6 py-5 text-black text-xs">{i + 1}</td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm text-black truncate max-w-[150px]">{report.defaulter_name}</p>
                                                <p className="text-[9px] text-black tracking-wider">{report.industry || 'General'}</p>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-black">{report.user_id?.name || 'N/A'}</td>
                                            <td className="px-6 py-5 text-sm text-center text-black">₹ {report.default_amount?.toLocaleString()}</td>
                                            <td className="px-6 py-5 text-sm text-right text-black">₹ {(report.default_amount - (report.outstanding_amount || 0)).toLocaleString()}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="py-12 text-center text-black italic font-black">No recent reports logged</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Defaulter Industry Types Chart */}
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-agri-green-primary px-10 py-6 text-white">
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-4">
                                <span>🥗</span> Defaulter Industry Types
                            </h3>
                        </div>
                        <div className="p-10 flex-1 flex flex-col items-center justify-center">
                            {(() => {
                                const industryData = stats.industryDist || [];
                                const total = industryData.reduce((acc: number, curr: any) => acc + curr.value, 0);

                                if (total === 0) {
                                    return (
                                        <div className="text-center py-10">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                                                <span className="text-2xl opacity-20">📊</span>
                                            </div>
                                            <p className="text-xs font-bold text-black tracking-wider">No sector data</p>
                                        </div>
                                    );
                                }

                                const chartData = {
                                    labels: industryData.map((s: any) => s.name),
                                    datasets: [
                                        {
                                            data: industryData.map((s: any) => s.value),
                                            backgroundColor: ['#ff5274', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#00bcd4'],
                                            borderWidth: 2,
                                            borderColor: '#ffffff',
                                        },
                                    ],
                                };

                                const chartOptions = {
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'top' as const,
                                            labels: {
                                                boxWidth: 12,
                                                boxHeight: 12,
                                                padding: 20,
                                                font: {
                                                    family: "'Inter', sans-serif",
                                                    size: 11,
                                                    weight: 'bold' as const
                                                },
                                                color: '#666',
                                            }
                                        },
                                        tooltip: {
                                            enabled: true,
                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                            padding: 12,
                                            titleFont: { family: "'Inter', sans-serif", size: 11 },
                                            bodyFont: { family: "'Inter', sans-serif", size: 12, weight: 'bold' as const },
                                            cornerRadius: 12,
                                        }
                                    },
                                    maintainAspectRatio: false,
                                };

                                return (
                                    <div className="w-full h-[300px] relative">
                                        <Pie data={chartData} options={chartOptions} />
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Middle Row: State-wise Insights (Map + Table) */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-agri-green-primary px-10 py-6 text-white flex justify-between items-center">
                        <h3 className="text-lg font-black tracking-tight flex items-center gap-4">
                            <span>📍</span> State-Wise Defaulter Insights
                        </h3>
                        <button className="text-white/40 hover:text-white transition-colors">•••</button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="p-8 border-r border-gray-100 min-h-[500px] relative">
                            <IndiaMap stateInsights={stats.stateInsights || []} />
                        </div>
                        <div className="p-8 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-agri-green-primary text-gray-300">
                                    <tr className="divide-x divide-white/5 border-t border-white/10">
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest">State</th>
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest text-center">Entries</th>
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest text-center">Debt</th>
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest text-right">Recovered</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats.stateInsights?.map((insight: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50 divide-x divide-gray-50 transition-all">
                                            <td className="px-6 py-5 text-sm text-black">{insight.state}</td>
                                            <td className="px-6 py-5 text-center text-sm text-black">{insight.count}</td>
                                            <td className="px-6 py-5 text-center text-sm text-black">₹ {insight.amount?.toLocaleString()}</td>
                                            <td className="px-6 py-5 text-right text-sm text-black">₹ {insight.recovered?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Transaction History */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-agri-green-primary px-10 py-6 text-white">
                        <h3 className="text-lg font-black tracking-tight flex items-center gap-4">
                            <span>📄</span> Transaction History
                        </h3>
                    </div>
                    <div className="p-8 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-agri-green-primary text-gray-300">
                                <tr className="divide-x divide-white/5 border-t border-white/10">
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">#</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">TX ID</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">Member</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">Company</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-bold">
                                {(stats.transactions || []).map((tx: any, i: number) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 divide-x divide-gray-50 transition-all">
                                        <td className="px-6 py-5 text-black text-xs">{i + 1}</td>
                                        <td className="px-6 py-5 text-xs text-black font-mono">{tx.txNo}</td>
                                        <td className="px-6 py-5 text-sm text-black font-black">{tx.member}</td>
                                        <td className="px-6 py-5 text-sm text-black">{tx.company}</td>
                                        <td className="px-6 py-5 text-sm text-black font-black">₹ {tx.amount.toLocaleString()}.00</td>
                                        <td className="px-6 py-5 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black ${tx.type.includes('New') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
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
                {/* <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-agri-green-primary px-10 py-8 flex flex-col md:flex-row justify-between md:items-center gap-6 text-white">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-black tracking-tight">Master Member Registry</h3>
                            <div className="flex items-center gap-4 mt-1 font-bold">
                                <p className="text-xs text-white/60 tracking-wider">Full compliance management</p>
                                <div className="w-1 h-1 rounded-full bg-white/40"></div>
                                <Link href="/admin-members" className="text-xs text-agri-gold-secondary hover:text-white transition-colors tracking-wider underline decoration-2 underline-offset-4">View all registry</Link>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search entities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/10 border border-white/20 rounded-2xl px-12 py-3 text-sm font-black text-white placeholder-white/40 outline-none focus:bg-white focus:text-black focus:border-white transition-all w-72"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">🔎</span>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-sm font-black text-white outline-none focus:bg-white focus:text-black transition-all cursor-pointer"
                            >
                                <option className="text-black" value="all">All profiles</option>
                                <option className="text-black" value="0">Review needed</option>
                                <option className="text-black" value="1">Verified</option>
                                <option className="text-black" value="2">Blacklisted</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-black tracking-wider bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-10 py-6">Entity credentials</th>
                                    <th className="px-10 py-6">Geographic jurisdiction</th>
                                    <th className="px-10 py-6 text-center">Reporting count</th>
                                    <th className="px-10 py-6 text-right">Master actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-[#f0f9f0] flex items-center justify-center text-agri-green-primary font-black text-lg border border-agri-green-primary/10 group-hover:bg-agri-green-primary group-hover:text-white transition-all">
                                                    {user.name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-black truncate max-w-[250px] italic">{user.name}</p>
                                                    <p className="text-[10px] font-bold text-black lowercase">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="text-sm font-bold text-black">{user.district}, {user.state}</p>
                                            <p className="text-[10px] text-black font-black mt-1 tracking-wider">{user.subDistrict || 'Global'}</p>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className="text-sm font-black text-agri-green-primary bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                                                {user.reportCount || 0} Reports
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end gap-3 items-center">
                                                {user.status === '0' ? (
                                                    <button onClick={() => handleAction(user._id, 'approved')} className="px-6 py-2 bg-agri-green-primary text-white text-[10px] font-black rounded-xl hover:bg-black transition-all shadow-lg active:scale-95">Verify entity</button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => fetchUserDefaulters(user)}
                                                            className="px-6 py-2 bg-agri-green-primary text-white text-[10px] font-black rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
                                                        >
                                                            Inspect ledger
                                                        </button>
                                                        <Link href={`/admin-members`} className="px-6 py-2 bg-gray-50 text-black text-[10px] font-black rounded-xl border border-gray-200 hover:bg-gray-200 hover:text-black transition-all">Audit</Link>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div> */}
            </div>

            {/* Defaulter Table Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-agri-green-primary px-10 py-8 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Defaulter Master Ledger</h3>
                                <p className="text-[10px] font-black text-white/60 tracking-wider mt-1">Authorized access: {selectedUser?.name}</p>
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
                                    <div className="animate-spin h-10 w-10 border-4 border-agri-green-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-sm font-black text-black tracking-wider animate-pulse">Decrypting records...</p>
                                </div>
                            ) : selectedUserDefaulters.length > 0 ? (
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead className="bg-agri-green-primary text-gray-300 uppercase">
                                        <tr className="divide-x divide-white/5 border-t border-white/10">
                                            <th className="px-6 py-2 text-xs font-bold tracking-widest uppercase">Entity</th>
                                            <th className="px-6 py-2 text-xs font-bold tracking-widest uppercase">Registration</th>
                                            <th className="px-6 py-2 text-xs font-bold tracking-widest uppercase text-rose-300">Defaulted</th>
                                            <th className="px-6 py-2 text-xs font-bold tracking-widest uppercase text-emerald-300">Recovered</th>
                                            <th className="px-6 py-2 text-xs font-bold tracking-widest uppercase">System status</th>
                                            <th className="px-6 py-2 text-xs font-bold tracking-widest uppercase text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedUserDefaulters.map((report) => (
                                            <tr key={report._id} className="bg-gray-50/50 hover:bg-gray-50 divide-x divide-gray-200/50 transition-all rounded-2xl">
                                                <td className="px-6 py-5 rounded-l-2xl">
                                                    <p className="text-sm font-black text-black italic">{report.defaulter_name}</p>
                                                    <p className="text-[9px] font-bold text-black tracking-tighter mt-0.5">{report.industry}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-xs font-bold font-mono text-black tracking-tighter">{report.gst_number || report.pan_number || 'Internal-ID'}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-black text-rose-600 tracking-tight italic">₹ {report.default_amount.toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-black text-emerald-600 tracking-tight italic">₹ {(report.default_amount - (report.outstanding_amount || 0)).toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-wider border ${report.status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                        {report.status === 1 ? 'Authorized' : 'Pending audit'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right rounded-r-2xl">
                                                    <p className="text-xs font-black text-black">{new Date(report.createdAt).toLocaleDateString()}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-24 text-center">
                                    <div className="text-5xl mb-6 opacity-20 animate-bounce">🛡️</div>
                                    <p className="text-sm font-black text-black tracking-wider">Zero infractions recorded</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-12 py-4 bg-gray-900 text-white text-[10px] font-black tracking-wider rounded-2xl hover:bg-black transition-all shadow-2xl active:scale-95"
                            >
                                Secure console
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
