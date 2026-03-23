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
        <div className="animate-spin h-8 w-8 border-4 border-agri-green-primary border-t-transparent rounded-full font-black"></div>
    </div>
});

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) fetchDashboardStats(token);
    }, []);

    const fetchDashboardStats = async (token: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}member/dashboard-stats`, {
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
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    if (!stats || !stats.summary) return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center flex-col gap-4">
            <div className="animate-spin h-12 w-12 border-4 border-agri-green-primary border-t-transparent rounded-full font-black"></div>
            <p className="text-sm font-bold text-gray-500 animate-pulse text-center px-4">Synchronizing Member Ecosystem Analytics...</p>
        </div>
    );

    return (
        <MemberPortalContainer title="Dashboard Overview">
            <div className="space-y-10 animate-in fade-in duration-500">

                {/* Dashboard Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-agri-green-50 rounded-lg flex items-center justify-center border border-agri-green-100">
                            <img src="/images/caip_logo.png" alt="CAIP" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 leading-none mb-1">Welcome to CAIP Dashboard</h2>
                            <p className="text-xs font-medium text-gray-500">Chamber for Agri Input Protection - Monitoring & Analytics</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-gray-400">Last Updated</p>
                            <p className="text-xs font-bold text-gray-700">{new Date().toLocaleDateString('en-GB')}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-100 mx-2"></div>
                        <button
                            onClick={() => fetchDashboardStats(localStorage.getItem('token') || '')}
                            className="bg-agri-green-primary text-white p-2.5 rounded-lg hover:bg-agri-green-700 transition-colors shadow-sm"
                            title="Refresh Data"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                        </button>
                    </div>
                </div>

                {/* Redesigned Analytics Flex Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Yearly Trend Chart - Left Span 2 */}
                    <div className="xl:col-span-2 bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-agri-green-primary px-6 py-4 flex items-center justify-between">
                            <h3 className="text-[16px] font-bold text-white tracking-tight flex items-center gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="12" width="4" height="9" /><rect x="10" y="7" width="4" height="14" /><rect x="17" y="3" width="4" height="18" /></svg>
                                Defaulter Search Trend ({new Date().getFullYear()})
                            </h3>
                            <button className="text-white/60 hover:text-white transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                            </button>
                        </div>
                        <div className="p-8 flex-1 flex flex-col min-h-[350px]">
                            <div className="flex-1 flex items-end gap-2 md:gap-4 relative border-b border-gray-100 pb-2">
                                {(() => {
                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const trendData = stats.searchTrend || [];
                                    const fullData = months.map((m, i) => {
                                        const monthNum = i + 1;
                                        const entry = trendData.find((d: any) => d.month === monthNum);
                                        return { label: m, count: entry ? entry.count : 0 };
                                    });
                                    const maxCount = Math.max(...fullData.map(d => d.count), 1);

                                    return fullData.map((data, i) => {
                                        const height = (data.count / maxCount) * 100;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-gray-800 text-white text-xs font-bold py-1 px-2 rounded pointer-events-none z-20 whitespace-nowrap">
                                                    {data.count} Searches
                                                </div>
                                                <div
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                    className={`w-full max-w-[32px] ${height > 0 ? 'bg-agri-gold-secondary' : 'bg-gray-50'} rounded-t-md transition-all duration-500 ease-out group-hover:brightness-110 shadow-sm`}
                                                ></div>
                                                <span className="mt-2 text-xs font-bold text-gray-400 group-hover:text-gray-700">
                                                    {data.label}
                                                </span>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid - Right Span 1 (Vertical List) */}
                    <div className="xl:col-span-1 flex flex-col gap-4">
                        {[
                            {
                                title: 'Total Defaulters Reported',
                                val: stats?.summary?.totalReported || 0,
                                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            },
                            {
                                title: 'Total Default Amount',
                                val: `₹ ${(stats?.summary?.totalAmount || 0).toLocaleString()}`,
                                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
                            },
                            {
                                title: 'Total Amount Recovered',
                                val: `₹ ${(stats?.summary?.totalRecovered || 0).toLocaleString()}`,
                                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 10h18M7 15h1m4 0h1m4 0h1M7 11V3l5-1 5 1v8M3 10V3a1 1 0 0 1 1-1h16a1 1 0 0 1 1-1h16v7" /></svg>
                            }
                        ].map((s, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex flex-col min-h-[160px]">
                                <div className="bg-agri-green-primary py-4 px-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-white opacity-90">{s.icon}</span>
                                        <p className="text-[16px] font-bold text-white tracking-tight leading-none">{s.title}</p>
                                    </div>
                                    <button className="text-white/40 hover:text-white transition-colors">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                                    </button>
                                </div>
                                <div className="p-8 flex-1 flex items-center">
                                    <h3 className="text-3xl font-black text-slate-800 tabular-nums tracking-tight">{s.val}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Second Analytics Section (Pie Chart) */}
                <div className="grid grid-cols-1 gap-8">
                    {/* Industry Distribution Chart */}
                    <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-agri-green-primary px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
                                <h3 className="text-[16px] font-bold text-white tracking-tight">Industry Distribution</h3>
                            </div>
                            <button className="text-white/60 hover:text-white transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                            </button>
                        </div>
                        <div className="p-8 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                            {(() => {
                                const industryData = stats.industryDist || [];
                                const total = industryData.reduce((acc: number, curr: any) => acc + curr.value, 0);

                                if (total === 0) {
                                    return <div className="text-xs font-bold text-gray-300 tracking-tight">No Data Available</div>;
                                }

                                const chartData = {
                                    labels: industryData.map((s: any) => s.name),
                                    datasets: [{
                                        data: industryData.map((s: any) => s.value),
                                        backgroundColor: ['#1f6306', '#388e3c', '#4caf50', '#8bc34a', '#aed581', '#c5e1a5'],
                                        borderWidth: 1,
                                        borderColor: '#ffffff',
                                    }],
                                };

                                const chartOptions = {
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'right' as const,
                                            labels: { boxWidth: 12, padding: 20, font: { size: 12, weight: 'bold' } }
                                        },
                                        tooltip: { enabled: true, backgroundColor: '#1f2937', padding: 10, cornerRadius: 4 }
                                    },
                                    maintainAspectRatio: false,
                                    cutout: '70%',
                                };

                                return (
                                    <div className="w-full max-w-4xl h-[240px] relative">
                                        <Pie data={chartData} options={chartOptions as any} />
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activities */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                Recent Activities
                            </h3>
                            <button className="text-agri-green-primary text-xs font-bold hover:underline">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-400">Type</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-400 text-right">Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(stats?.recentActivities || []).length > 0 ? (stats.recentActivities.slice(0, 5).map((act: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-xs font-bold text-gray-700">{act.activityType}</td>
                                            <td className="px-6 py-4 text-xs text-gray-500 text-right">{new Date(act.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        </tr>
                                    ))) : (
                                        <tr><td colSpan={2} className="px-6 py-10 text-center text-xs text-gray-300 font-bold">No activities found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Reported Defaulters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                My Reported Defaulters
                            </h3>
                            <button className="text-agri-green-primary text-xs font-bold hover:underline">Manage</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-400">Defaulter Name</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-400 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(stats?.myReports || []).length > 0 ? (stats.myReports.slice(0, 5).map((def: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-xs font-bold text-gray-700">{def.defaulter_name}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-agri-green-primary text-right">₹ {(def.default_amount || 0).toLocaleString()}</td>
                                        </tr>
                                    ))) : (
                                        <tr><td colSpan={2} className="px-6 py-10 text-center text-xs text-gray-300 font-bold">No reports found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* State Wise Insights */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                        <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-agri-green-primary"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            State-wise Defaulter Distribution
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="h-[400px] bg-gray-50/50 relative overflow-hidden">
                            <IndiaMap stateInsights={stats?.stateInsights || []} />
                        </div>
                        <div className="border-l border-gray-100 h-[400px] overflow-y-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50 sticky top-0 z-10 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-400">State</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-400 text-center">Count</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-400 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(stats?.stateInsights || []).length > 0 ? (stats.stateInsights.map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-xs font-bold text-gray-700">{row.state}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{row.count}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-red-600 text-right">₹ {(row.amount || 0).toLocaleString()}</td>
                                        </tr>
                                    ))) : (
                                        <tr><td colSpan={3} className="px-6 py-20 text-center text-xs text-gray-300 font-bold">Data processing...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Search History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-agri-green-primary"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
                            Search History
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400">#</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400">Target Name</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400">GST/PAN</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 text-center">Results</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(stats?.searchHistory || []).length > 0 ? (stats.searchHistory.map((log: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors text-xs font-medium text-gray-700">
                                        <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                                        <td className="px-6 py-4 font-bold">{log.filters?.name || '---'}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{log.filters?.gst || log.filters?.pan || '---'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {log.resultCount > 0 ? (
                                                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-bold">{log.resultCount} Results</span>
                                            ) : (
                                                <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">No Results</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))) : (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-xs text-gray-300 font-bold">No search history found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MemberPortalContainer>
    );
}
