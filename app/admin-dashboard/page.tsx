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
    const [cardTimeframes, setCardTimeframes] = useState<any>({
        total_reported: 'all',
        total_amount: 'all',
        total_recovered: 'all',
        total_members: 'all',
        search_trend: 'all',
        industry_dist: 'all'
    });
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [summaryData, setSummaryData] = useState<any>(null);

    useEffect(() => {
        const initialFetch = async () => {
            await Promise.all([fetchUsers(), fetchAdminStats()]);
        };
        initialFetch();
    }, []);

    const updateCardTimeframe = async (key: string, tf: string) => {
        setCardTimeframes((prev: any) => ({ ...prev, [key]: tf }));
        setActiveMenu(null);

        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}admin/dashboard-stats?timeframe=${tf}&card=${key}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                if (key === 'total_reported') {
                    setSummaryData((prev: any) => ({ ...prev, totalReported: data.summary.totalReported }));
                } else if (key === 'total_amount') {
                    setSummaryData((prev: any) => ({ ...prev, totalAmount: data.summary.totalAmount }));
                } else if (key === 'total_recovered') {
                    setSummaryData((prev: any) => ({ ...prev, totalRecovered: data.summary.totalRecovered }));
                } else if (key === 'total_members') {
                    setSummaryData((prev: any) => ({ ...prev, totalMembers: data.summary.totalMembers }));
                } else if (key === 'search_trend') {
                    setStats((prev: any) => ({ ...prev, searchTrend: data.searchTrend }));
                } else if (key === 'industry_dist') {
                    setStats((prev: any) => ({ ...prev, industryDist: data.industryDist }));
                }
            }
        } catch (error) { console.error(error); }
    };

    const fetchAdminStats = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}admin/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(data);
            setSummaryData(data.summary);
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
                <div className="animate-spin h-12 w-12 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
                <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-[0.2em]">Initializing Administrative Nexus...</p>
            </div>
        );
    }

    return (
        <AdminPortalContainer title="Dashboard">
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Identifier Subheader */}
                <div className="text-center py-4 border-b border-gray-100 flex items-center justify-center gap-4">
                    <div className="w-8 h-8 hover:scale-110 transition-transform duration-300">
                        <img src="/images/caip_logo.png" alt="CAIP Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-[16px] font-semibold text-gray-600 tracking-tight">CAIP - Chamber for Agri Input Protection</h2>
                </div>

                {/* Metric Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        {
                            title: 'Total defaulters',
                            val: summaryData?.totalReported || 0,
                            icon: (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="17" y2="12" /><line x1="17" y1="16" x2="17.01" y2="16" />
                                </svg>
                            ),
                        },
                        {
                            key: 'total_amount',
                            title: 'Total defaulters amount',
                            val: `₹ ${(summaryData?.totalAmount || 0).toLocaleString()}`,
                            icon: (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" />
                                </svg>
                            ),
                        },
                        {
                            key: 'total_recovered',
                            title: 'Total recovery amount',
                            val: `₹ ${(summaryData?.totalRecovered || 0).toLocaleString()}`,
                            icon: (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ),
                        },
                        {
                            key: 'total_members',
                            title: 'Total members',
                            val: summaryData?.totalMembers ?? users.length,
                            icon: (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            ),
                        }
                    ].map((s) => (
                        <div key={s.key} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-visible group hover:shadow-lg transition-all relative">
                            <div className="bg-[#1b5e20] px-5 py-3 flex items-center justify-between text-white rounded-t-xl">
                                <h4 className="text-[15px] font-semibold tracking-tight flex items-center gap-2.5 capitalize">
                                    {s.icon}
                                    {s.title}
                                </h4>
                                <div className="relative">
                                    <button
                                        onClick={() => setActiveMenu(activeMenu === s.key ? null : s.key)}
                                        className="w-8 h-7 flex items-center justify-center border border-white/20 rounded-md hover:bg-white/10 transition-all text-xs"
                                    >
                                        •••
                                    </button>
                                    {activeMenu === s.key && (
                                        <>
                                            <div className="fixed inset-0 z-30" onClick={() => setActiveMenu(null)}></div>
                                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-200 origin-top-right text-gray-800">
                                                {[
                                                    { label: 'All', value: 'all' },
                                                    { label: 'Today', value: 'today' },
                                                    { label: 'Last 7 Days', value: 'last7days' },
                                                    { label: 'This Month', value: 'thisMonth' },
                                                    { label: 'Last Month', value: 'lastMonth' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => updateCardTimeframe(s.key, opt.value)}
                                                        className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${cardTimeframes[s.key] === opt.value ? 'text-[#1b5e20] font-black bg-green-50/50' : 'text-gray-600 font-medium'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="p-5">
                                <p className="text-[20px] font-bold text-gray-900 tracking-tight leading-none">{s.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bar Graph: Search Trend */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100/50 overflow-visible flex flex-col">
                    <div className="bg-[#1b5e20] px-6 py-4 flex items-center justify-between text-white rounded-t-xl">
                        <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-3">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                            </svg>
                            {cardTimeframes.search_trend === 'all' ? `Defaulter Search Trend (${new Date().getFullYear()})` : `Searching Activity (${cardTimeframes.search_trend.toUpperCase()})`}
                        </h3>
                        <div className="relative">
                            <button
                                onClick={() => setActiveMenu(activeMenu === 'trend' ? null : 'trend')}
                                className="w-8 h-7 flex items-center justify-center border border-white/20 rounded-md hover:bg-white/10 transition-all text-xs"
                            >
                                •••
                            </button>
                            {activeMenu === 'trend' && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setActiveMenu(null)}></div>
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-200 origin-top-right text-gray-800">
                                        {[
                                            { label: 'All', value: 'all' },
                                            { label: 'Today', value: 'today' },
                                            { label: 'Last 7 Days', value: 'last7days' },
                                            { label: 'This Month', value: 'thisMonth' },
                                            { label: 'Last Month', value: 'lastMonth' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => updateCardTimeframe('search_trend', opt.value)}
                                                className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${cardTimeframes.search_trend === opt.value ? 'text-[#1b5e20] font-black bg-green-50/50' : 'text-gray-600 font-medium'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="pl-16 p-8 pb-10 flex-1 flex flex-col min-h-[350px]">
                        <div className="flex-1 flex items-end gap-1 relative border-b border-gray-100 pb-10">
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
                                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none -left-12">
                                            {[1, 0.8, 0.6, 0.4, 0.2, 0].map((scale) => (
                                                <div key={scale} className="flex items-center gap-3 w-[calc(100%+48px)]">
                                                    <span className="text-[14px] font-medium text-gray-400 w-9 text-right tabular-nums">
                                                        {Math.round(maxCount * scale)}
                                                    </span>
                                                    <div className="flex-1 border-t border-gray-100 flex-grow"></div>
                                                </div>
                                            ))}
                                        </div>

                                        {fullData.map((data, i) => {
                                            const height = (data.count / maxCount) * 100;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end z-10 pt-10">
                                                    <div
                                                        style={{ height: `${Math.max(height, 0)}%`, minHeight: data.count > 0 ? '8px' : '0px' }}
                                                        className="w-1/2 max-w-[28px] bg-[#ffcd1e] rounded-full transition-all duration-700 ease-out shadow-[0_2px_8px_rgba(255,205,30,0.3)] relative"
                                                    />
                                                    <div className="absolute top-full flex flex-col items-center w-full">
                                                        <div className="h-2 w-px bg-gray-100 mb-2"></div>
                                                        <span className="text-[13px] font-medium text-gray-400">{data.label}</span>
                                                    </div>

                                                    {/* Tooltip */}
                                                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg z-20 shadow-2xl whitespace-nowrap pointer-events-none">
                                                        {data.count} Global Searches
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Row: Latest Defaulters & Industry Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Latest Reported Defaulters Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                            <h3 className="text-[16px] font-semibold tracking-tight">Latest Reported Defaulters</h3>
                        </div>
                        <div className="p-4 md:p-5">
                            <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                                <table className="w-full text-center border-collapse">
                                    <thead className="bg-[#051a02] text-white">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">#</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight text-left">Defaulter Company Name</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight text-left">Reported By</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight text-center">Default Amount</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight text-right">Recovered Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                        {stats.recentReports?.length > 0 ? stats.recentReports.slice(0, 5).map((report: any, i: number) => (
                                            <tr key={report._id} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                                <td className="px-4 py-3 text-left">
                                                    <p className="font-semibold text-gray-900 leading-tight truncate max-w-[150px]">{report.defaulter_name}</p>
                                                </td>
                                                <td className="px-4 py-3 text-left">
                                                    <p className="font-semibold text-gray-900 leading-tight">{report.user_id?.name || '---'}</p>
                                                    {report.user_id?.companyName && <p className="text-[10px] text-gray-400 italic">({report.user_id.companyName})</p>}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-red-600">₹ {report.default_amount?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-emerald-600 italic">₹ {(report.default_amount - (report.outstanding_amount || 0)).toLocaleString()}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={5} className="px-4 py-12 text-gray-400 italic">No recent reports logged</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Defaulter Industry Types Chart */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-visible flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center justify-between text-white rounded-t-xl">
                            <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                {cardTimeframes.industry_dist === 'all' ? 'Defaulter Industry Types' : `Industry Distribution (${cardTimeframes.industry_dist.toUpperCase()})`}
                            </h3>
                            <div className="relative">
                                <button
                                    onClick={() => setActiveMenu(activeMenu === 'industry' ? null : 'industry')}
                                    className="w-8 h-7 flex items-center justify-center border border-white/20 rounded-md hover:bg-white/10 transition-all text-xs"
                                >
                                    •••
                                </button>
                                {activeMenu === 'industry' && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setActiveMenu(null)}></div>
                                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-200 origin-top-right text-gray-800">
                                            {[
                                                { label: 'All', value: 'all' },
                                                { label: 'Today', value: 'today' },
                                                { label: 'Last 7 Days', value: 'last7days' },
                                                { label: 'This Month', value: 'thisMonth' },
                                                { label: 'Last Month', value: 'lastMonth' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => updateCardTimeframe('industry_dist', opt.value)}
                                                    className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${cardTimeframes.industry_dist === opt.value ? 'text-[#1b5e20] font-black bg-green-50/50' : 'text-gray-600 font-medium'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="p-6 md:p-8 flex flex-col items-center justify-center">
                            {(() => {
                                const industryData = stats.industryDist || [];
                                const total = industryData.reduce((acc: number, curr: any) => acc + curr.value, 0);

                                if (total === 0) {
                                    return <div className="py-16 text-gray-400 italic">No sector data.</div>;
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
                                            position: 'bottom' as const,
                                            labels: {
                                                boxWidth: 10,
                                                boxHeight: 10,
                                                padding: 15,
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
                                            cornerRadius: 12,
                                        }
                                    },
                                    maintainAspectRatio: false,
                                };

                                return (
                                    <div className="w-full h-[280px] relative">
                                        <Pie data={chartData} options={chartOptions} />
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* State-wise Insights */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#1b5e20] px-6 py-4 flex items-center justify-between text-white">
                        <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            State-Wise Defaulter Insights
                        </h3>
                    </div>
                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                        <div className="lg:w-1/2 p-6 min-h-[450px] bg-[#fbfcfd]">
                            <IndiaMap stateInsights={stats.stateInsights || []} />
                        </div>
                        <div className="lg:w-1/2 p-4 md:p-5">
                            <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                                <table className="w-full text-center border-collapse">
                                    <thead className="bg-[#051a02] text-white">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">State</th>
                                            <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Total Defaulters</th>
                                            <th className="px-4 py-3 text-[12px] font-semibold tracking-tight text-right">Total Default Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                        {(stats.stateInsights || []).map((insight: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-semibold text-gray-900">{insight.state}</td>
                                                <td className="px-4 py-3 text-[#1b5e20] font-bold">{insight.count}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-red-600">₹ {insight.amount?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                        <h3 className="text-[16px] font-semibold tracking-tight">Transaction History</h3>
                    </div>
                    <div className="p-4 md:p-5">
                        <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                            <table className="w-full text-center border-collapse">
                                <thead className="bg-[#051a02] text-white">
                                    <tr className="divide-x divide-white/5">
                                        <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">#</th>
                                        <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Transaction No</th>
                                        <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Member Name</th>
                                        <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Company Name</th>
                                        <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Amount</th>
                                        <th className="px-4 py-3 text-[12px] font-semibold tracking-tight text-right">Transaction Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                    {(stats.transactions || []).map((tx: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-gray-500">{tx.txNo}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">{tx.member}</td>
                                            <td className="px-4 py-3 text-gray-800">{tx.companyName}</td>
                                            <td className="px-4 py-3 font-bold text-gray-900">₹ {tx.amount.toLocaleString()}.00</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${tx.type.includes('New') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <br />
            </div>

            {/* Defaulter Table Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1b5e20] px-10 py-8 flex justify-between items-center text-white">
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
                                    <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-sm font-black text-black tracking-wider animate-pulse">Decrypting records...</p>
                                </div>
                            ) : selectedUserDefaulters.length > 0 ? (
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead className="bg-[#1b5e20] text-gray-300 uppercase">
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
