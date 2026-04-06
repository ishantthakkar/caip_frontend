"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import dynamic from 'next/dynamic';
import { API_BASE_URL } from '@/config/apiConfig';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// Dynamically import the Map component to avoid SSR issues with Leaflet
const IndiaMap = dynamic(() => import('@/components/IndiaMap'), {
    ssr: false,
    loading: () => <div className="min-h-[400px] bg-sky-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
    </div>
});

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [cardTimeframes, setCardTimeframes] = useState(['all', 'all', 'all', 'all', 'all']); // box1, box2, box3, trend, industry
    const [activeMenu, setActiveMenu] = useState<string | number | null>(null);
    const [summaryData, setSummaryData] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) fetchDashboardStats(token);
    }, []);

    const updateCardTimeframe = async (index: number, tf: string) => {
        const newTfs = [...cardTimeframes];
        newTfs[index] = tf;
        setCardTimeframes(newTfs);
        setActiveMenu(null);

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}member/dashboard-stats?timeframe=${tf}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                if (index <= 2) {
                    setSummaryData((prev: any) => {
                        const updated = { ...prev };
                        if (index === 0) updated.totalReported = data.summary.totalReported;
                        if (index === 1) updated.totalAmount = data.summary.totalAmount;
                        if (index === 2) updated.totalRecovered = data.summary.totalRecovered;
                        return updated;
                    });
                } else if (index === 3) {
                    setStats((prev: any) => ({ ...prev, searchTrend: data.searchTrend }));
                } else if (index === 4) {
                    setStats((prev: any) => ({ ...prev, industryDist: data.industryDist }));
                }
            }
        } catch (error) { console.error(error); }
    };

    const fetchDashboardStats = async (token: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}member/dashboard-stats?timeframe=all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/');
                return;
            }
            const data = await res.json();
            setStats(data);
            setSummaryData(data.summary);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    if (!stats || !summaryData) return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center flex-col gap-4">
            <div className="animate-spin h-12 w-12 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
            <p className="text-sm font-bold text-gray-500 animate-pulse">Synchronizing Analytics...</p>
        </div>
    );

    return (
        <MemberPortalContainer title="Dashboard">
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Identifier Subheader */}
                <div className="text-center py-4 border-b border-gray-100 flex items-center justify-center gap-4">
                    <div className="w-8 h-8 hover:scale-110 transition-transform duration-300">
                        <img src="/images/caip_logo.png" alt="CAIP Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-[16px] font-semibold text-gray-600 tracking-tight">CAIP - Chamber for Agri Input Protection</h2>
                </div>

                {/* Row 1: Trend & Stats */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Trend Chart (3/4 width) */}
                    <div className="xl:col-span-3 bg-white rounded-xl shadow-lg border border-gray-100/50 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center justify-between text-white">
                            <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-3">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                                </svg>
                                {cardTimeframes[3] === 'all' ? 'Defaulter Search Trend (2026)' : `Searching Activity (${cardTimeframes[3].toUpperCase()})`}
                            </h3>
                            <div className="relative">
                                <button
                                    onClick={() => setActiveMenu(activeMenu === 'trend' ? null : 'trend')}
                                    className="w-8 h-7 flex items-center justify-center border border-white/20 rounded-md hover:bg-white/10 transition-all text-[10px]"
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
                                                    onClick={() => updateCardTimeframe(3, opt.value)}
                                                    className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${cardTimeframes[3] === opt.value ? 'text-[#1b5e20] font-black bg-green-50/50' : 'text-gray-600 font-medium'}`}
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
                                    const trendData = stats.searchTrend || [];
                                    const fullData = months.map((m, i) => {
                                        const monthNum = i + 1;
                                        const entry = trendData.find((d: any) => d.month === monthNum);
                                        return { label: m, count: entry ? entry.count : 0 };
                                    });
                                    const maxCount = 500;
                                    return (
                                        <>
                                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none -left-12">
                                                {[500, 400, 300, 200, 100, 0].map((val) => (
                                                    <div key={val} className="flex items-center gap-3 w-[calc(100%+48px)]">
                                                        <span className="text-[14px] font-medium text-gray-400 w-9 text-right tabular-nums">{val}</span>
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
                                                    </div>
                                                );
                                            })}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="space-y-6">
                        {[
                            {
                                title: 'Total Defaulters Reported',
                                val: summaryData?.totalReported || 0,
                                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                            },
                            {
                                title: 'Total Default Amount',
                                val: `₹ ${(summaryData?.totalAmount || 0).toLocaleString()}`,
                                icon: <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M6 3h12" />
                                    <path d="M6 8h12" />
                                    <path d="M6 13h6a4 4 0 0 0 0-8" />
                                    <path d="M6 13l8 8" />
                                </svg>
                            },
                            {
                                title: 'Total Amount Recovered',
                                val: `₹ ${(summaryData?.totalRecovered || 0).toLocaleString()}`,
                                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                            }
                        ].map((s, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-md border border-gray-100 group relative flex flex-col">
                                <div className="bg-[#1b5e20] px-5 py-3 flex items-center justify-between text-white rounded-t-xl">
                                    <h4 className="text-[16px] font-semibold tracking-tight flex items-center gap-2.5">
                                        {s.icon}
                                        {s.title}
                                    </h4>
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveMenu(activeMenu === i ? null : i)}
                                            className="w-8 h-7 flex items-center justify-center border border-white/20 rounded-md hover:bg-white/10 transition-all text-[10px]"
                                        >
                                            •••
                                        </button>

                                        {activeMenu === i && (
                                            <>
                                                <div className="fixed inset-0 z-30" onClick={() => setActiveMenu(null)}></div>
                                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                    {[
                                                        { label: 'All', value: 'all' },
                                                        { label: 'Today', value: 'today' },
                                                        { label: 'Last 7 Days', value: 'last7days' },
                                                        { label: 'This Month', value: 'thisMonth' },
                                                        { label: 'Last Month', value: 'lastMonth' }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => updateCardTimeframe(i, opt.value)}
                                                            className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${cardTimeframes[i] === opt.value ? 'text-[#1b5e20] font-black bg-green-50/50' : 'text-gray-600 font-medium'}`}
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
                                    <p className="text-[32px] font-bold text-gray-900 tracking-tight leading-none">{s.val}</p>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-3 flex items-center gap-2">
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row 2: Activities & Reported (Side-by-Side) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* Recent Activities */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <h3 className="text-[16px] font-semibold tracking-tight">Recent Activities</h3>
                        </div>
                        <div className="p-4 md:p-5">
                            <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                                <table className="w-full text-center border-collapse">
                                    <thead className="bg-[#051a02] text-white">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">#</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Activity Type</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                        {(stats?.recentActivities || []).length > 0 ? (stats.recentActivities.slice(0, 5).map((act: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                                <td className="px-4 py-3 font-semibold text-gray-900">{act.activityType}</td>
                                                <td className="px-4 py-3 text-gray-400 text-[12px]">{new Date(act.createdAt).toLocaleString('en-GB')}</td>
                                            </tr>
                                        ))) : (
                                            <tr><td colSpan={3} className="px-4 py-8 text-gray-400 italic">No recent activity.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* My Reported Defaulters */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <h3 className="text-[16px] font-semibold tracking-tight">My Reported Defaulters</h3>
                        </div>
                        <div className="p-4 md:p-5">
                            <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                                <table className="w-full text-center border-collapse">
                                    <thead className="bg-[#051a02] text-white">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">#</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Defaulter Name</th>
                                            <th className="px-4 py-3 text-[13px] font-semibold tracking-tight">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                        {(stats?.myReports || []).length > 0 ? (stats.myReports.slice(0, 5).map((def: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                                <td className="px-4 py-3 font-semibold text-gray-900 line-clamp-1">{def.defaulter_name}</td>
                                                <td className="px-4 py-3 font-semibold text-red-600">₹ {(def.default_amount || 0).toLocaleString()}</td>
                                            </tr>
                                        ))) : (
                                            <tr><td colSpan={3} className="px-4 py-8 text-gray-400 italic">No reports.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Remaining Rows in Full Width Stack */}
                <div className="space-y-8 mt-6">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-visible flex flex-col pt-0">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center justify-between text-white rounded-t-xl">
                            <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                {cardTimeframes[4] === 'all' ? `Type of Defaulters (${new Date().getFullYear()})` : `Industry Distribution (${cardTimeframes[4].toUpperCase()})`}
                            </h3>
                            <div className="relative">
                                <button
                                    onClick={() => setActiveMenu(activeMenu === 'industry' ? null : 'industry')}
                                    className="w-8 h-7 flex items-center justify-center border border-white/20 rounded-md hover:bg-white/10 transition-all text-[10px]"
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
                                                    onClick={() => updateCardTimeframe(4, opt.value)}
                                                    className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${cardTimeframes[4] === opt.value ? 'text-[#1b5e20] font-black bg-green-50/50' : 'text-gray-600 font-medium'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="p-4 md:p-6 flex flex-col items-center justify-center">
                            {(() => {
                                const industryData = stats.industryDist || [];
                                const total = industryData.reduce((acc: number, curr: any) => acc + curr.value, 0);
                                if (total === 0) return <div className="py-16 text-gray-400 italic">No industry data.</div>;

                                const getColor = (name: string) => {
                                    const colors: any = {
                                        'Agriculture': '#ff6384',
                                        'Agrochemicals & Fertilizers': '#36a2eb',
                                        'Seed Suppliers': '#ffce56',
                                        'Farming Equipment': '#4bc0c0'
                                    };
                                    return colors[name] || '#9966ff'; // Default to 'Others' color
                                };

                                const chartData = {
                                    labels: industryData.map((s: any) => s.name),
                                    datasets: [{
                                        data: industryData.map((s: any) => s.value),
                                        backgroundColor: industryData.map((s: any) => getColor(s.name)),
                                        borderWidth: 2,
                                        borderColor: '#ffffff',
                                    }],
                                };
                                const chartOptions = {
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'right' as const,
                                            labels: { font: { family: "'Outfit', sans-serif", size: 13 }, color: '#666', padding: 20 }
                                        },
                                        tooltip: { enabled: true, backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, cornerRadius: 8 }
                                    },
                                    maintainAspectRatio: false,
                                };
                                return <div className="w-full max-w-[500px] h-[280px] relative">
                                    <Pie data={chartData} options={chartOptions} />
                                </div>;
                            })()}
                        </div>
                    </div>

                    {/* State-wise Insights */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 1a3 3 0 006 0V7m0 1a3 3 0 006 0V7M4 21V10m5 11V10m5 11V10m5 11V10" /></svg>
                            <h3 className="text-[16px] font-semibold tracking-tight">State-wise Defaulter Insights</h3>
                        </div>
                        <div className="p-0 flex flex-col lg:flex-row border-t border-gray-50">
                            <div className="lg:w-1/2 min-h-[400px] border-r border-gray-50 bg-[#fbfcfd]">
                                <IndiaMap stateInsights={stats?.stateInsights || []} />
                            </div>
                            <div className="lg:w-1/2 p-4 md:p-6">
                                <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                                    <table className="w-full text-center border-collapse">
                                        <thead className="bg-[#051a02] text-white">
                                            <tr className="divide-x divide-white/5">
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">State</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Total Defaulters</th>
                                                <th className="px-4 py-3 text-[12px] font-semibold tracking-tight">Total Default Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                            {(stats?.stateInsights || []).map((row: any, i: number) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors divide-x divide-gray-50">
                                                    <td className="px-4 py-3 font-semibold text-gray-900">{row.state}</td>
                                                    <td className="px-4 py-3 font-semibold text-[#1b5e20]">{row.count}</td>
                                                    <td className="px-4 py-3 font-semibold text-red-600">₹ {(row.amount || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search History */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <h3 className="text-[16px] font-semibold tracking-tight">Defaulter Search History</h3>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                                <table className="w-full text-center border-collapse">
                                    <thead className="bg-[#051a02] text-white">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-4 py-3 text-[15px] font-semibold tracking-tight w-12">#</th>
                                            <th className="px-4 py-3 text-[15px] font-semibold tracking-tight">Name</th>
                                            <th className="px-4 py-3 text-[15px] font-semibold tracking-tight">GST</th>
                                            <th className="px-4 py-3 text-[15px] font-semibold tracking-tight">PAN</th>
                                            <th className="px-4 py-3 text-[15px] font-semibold tracking-tight">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                        {(stats?.searchHistory || []).map((log: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors divide-x divide-gray-50">
                                                <td className="px-4 py-3">{i + 1}</td>
                                                <td className="px-4 py-3">{log.filters?.name || '---'}</td>
                                                <td className="px-4 py-3 text-[15px]">{log.filters?.gst || '---'}</td>
                                                <td className="px-4 py-3 text-[15px]">{log.filters?.pan || '---'}</td>
                                                <td className="px-4 py-3 text-[15px]">₹ {log.filters?.default_amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MemberPortalContainer>
    );
}