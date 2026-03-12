"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import dynamic from 'next/dynamic';
import { API_BASE_URL } from '@/config/apiConfig';

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
            <div className="animate-spin h-12 w-12 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
            <p className="text-sm font-bold text-gray-500 animate-pulse">Synchronizing Analytics...</p>
        </div>
    );

    return (
        <MemberPortalContainer title="Dashboard">
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Identifier Subheader */}
                <div className="text-center py-6 border-b border-gray-100 flex items-center justify-center gap-4">
                    <div className="w-10 h-10 hover:scale-110 transition-transform duration-300">
                        <img src="/images/caip_logo.png" alt="CAIP Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-600 tracking-tight">CAIP - Chamber for Agri Input Protection</h2>
                </div>

                {/* Row 1: Trend & Stats */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Trend Chart (2/3 width) */}
                    <div className="xl:col-span-3 bg-white rounded-[2rem] shadow-xl border border-gray-100/50 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-8 py-5 flex items-center justify-between text-white">
                            <h3 className="text-lg font-bold tracking-tight flex items-center gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="12" width="4" height="9" /><rect x="10" y="7" width="4" height="14" /><rect x="17" y="3" width="4" height="18" /></svg>
                                Yearly Search Activity Trend ({new Date().getFullYear()})
                            </h3>
                            <button className="opacity-40 hover:opacity-100 transition-all font-bold">LIVE METRICS</button>
                        </div>
                        <div className="p-10 flex-1 flex flex-col min-h-[400px]">
                            {/* Bar Chart Implementation */}
                            <div className="flex-1 flex items-end gap-3 md:gap-6 relative border-b border-gray-100 pb-2">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="w-full border-t border-gray-50/50 h-0"></div>)}
                                </div>

                                {(() => {
                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const trendData = stats.searchTrend || [];
                                    const fullData = months.map((m, i) => {
                                        const monthNum = i + 1;
                                        const entry = trendData.find((d: any) => d.month === monthNum);
                                        return { label: m, count: entry ? entry.count : 0 };
                                    });

                                    const maxCount = Math.max(...fullData.map(d => d.count), 5); // Fallback to 5 for scale

                                    return fullData.map((data, i) => {
                                        const height = (data.count / maxCount) * 100;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                                {/* Tooltip */}
                                                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg pointer-events-none z-10 whitespace-nowrap shadow-xl">
                                                    {data.count} Searches in {data.label}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                </div>

                                                {/* Bar */}
                                                <div
                                                    style={{ height: `${height}%` }}
                                                    className="w-full max-w-[40px] bg-gradient-to-t from-[#1b5e20] to-[#4caf50] rounded-t-lg transition-all duration-700 ease-out group-hover:to-[#ffd600] group-hover:scale-x-110 shadow-lg relative overflow-hidden"
                                                >
                                                    {/* Gloss Effect */}
                                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>

                                                {/* Label */}
                                                <span className="absolute -bottom-8 text-[11px] font-black text-gray-400 uppercase tracking-tighter transition-colors group-hover:text-[#1b5e20]">
                                                    {data.label}
                                                </span>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                            <div className="mt-10 pt-6 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#1b5e20]"></div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Search Volume</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#ffd600]"></div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Peak Periods</span>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-[#1b5e20] bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest">Analytics Refreshed Every 15m</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="space-y-6">
                        {[
                            { title: 'Total Defaulters Reported', val: stats?.summary?.totalReported || 0, color: '#1b5e20' },
                            { title: 'Total Default Amount', val: `₹ ${(stats?.summary?.totalAmount || 0).toLocaleString()}`, color: '#1b5e20' },
                            { title: 'Total Amount Recovered', val: `₹ ${(stats?.summary?.totalRecovered || 0).toLocaleString()}`, color: '#1b5e20' }
                        ].map((s, i) => (
                            <div key={i} className="bg-white rounded-[1.5rem] shadow-lg border border-gray-100 overflow-hidden group">
                                <div className="bg-[#1b5e20] px-6 py-4 flex items-center justify-between text-white">
                                    <h4 className="text-sm font-bold tracking-tight flex items-center gap-3">
                                        {i === 0 ? '👥' : i === 1 ? '💵' : '✅'}
                                        {s.title}
                                    </h4>
                                    <button className="opacity-40 hover:opacity-100 transition-all translate-x-1">•••</button>
                                </div>
                                <div className="p-8">
                                    <p className="text-3xl font-black text-gray-900 tracking-tighter">{s.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row 2: Activities, Reported, Industries */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-8 py-5 flex items-center gap-4 text-white">
                            <span className="text-xl">⌚</span>
                            <h3 className="text-base font-bold tracking-wider">Recent Activities</h3>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-center border-collapse">
                                <thead className="bg-[#1b5e20] text-gray-300">
                                    <tr className="divide-x divide-white/5 border-t border-white/10 uppercase">
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest">#</th>
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest">Activity Type</th>
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-600">
                                    {[
                                        { type: 'System Login', time: new Date().toLocaleString() },
                                        { type: 'Defaulter Search', time: '11/03/2026, 11:51 AM' },
                                        { type: 'Reported Defaulter', time: '11/03/2026, 11:45 AM' },
                                        { type: 'System Logout', time: '10/03/2026, 06:12 PM' }
                                    ].map((act, i) => (
                                        <tr key={i} className="hover:bg-gray-50 divide-x divide-gray-50">
                                            <td className="px-6 py-4 font-bold">{i + 1}</td>
                                            <td className="px-6 py-4">{act.type}</td>
                                            <td className="px-6 py-4 text-gray-400">{act.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-8 py-5 flex items-center gap-4 text-white">
                            <span className="text-xl">📁</span>
                            <h3 className="text-base font-bold tracking-wider">My Reported Defaulters</h3>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-center border-collapse">
                                <thead className="bg-[#1b5e20] text-gray-300 uppercase">
                                    <tr className="divide-x divide-white/5 border-t border-white/10">
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest">#</th>
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest">Defaulter Name</th>
                                        <th className="px-6 py-4 text-xs font-bold tracking-widest">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-600">
                                    {(stats?.myReports || []).map((def: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50 divide-x divide-gray-50">
                                            <td className="px-6 py-4 font-bold">{i + 1}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{def.defaulter_name}</td>
                                            <td className="px-6 py-4 font-bold text-[#1b5e20]">₹ {(def.default_amount || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-8 py-5 flex items-center gap-4 text-white">
                            <span className="text-xl">🥗</span>
                            <h3 className="text-base font-bold tracking-wider">Defaulter Industry Types ({new Date().getFullYear()})</h3>
                        </div>
                        <div className="p-10 flex-1 flex flex-col items-center justify-center">
                            {(() => {
                                const industryData = stats.industryDist || [];
                                const total = industryData.reduce((acc: number, curr: any) => acc + curr.value, 0);
                                const colors = ['#1b5e20', '#ffd600', '#ff4081', '#00bcd4', '#9c27b0', '#ff9800'];

                                if (total === 0) {
                                    return (
                                        <div className="text-center py-10">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                                                <span className="text-2xl opacity-20">📊</span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Sector Data</p>
                                        </div>
                                    );
                                }

                                let cumulativeOffset = 0;
                                return (
                                    <>
                                        <div className="relative w-48 h-48 mb-10 group">
                                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                                {industryData.map((item: any, i: number) => {
                                                    const percentage = (item.value / total) * 100;
                                                    const strokeDasharray = `${percentage} ${100 - percentage}`;
                                                    const strokeDashoffset = -cumulativeOffset;
                                                    cumulativeOffset += percentage;

                                                    return (
                                                        <circle
                                                            key={i}
                                                            cx="18"
                                                            cy="18"
                                                            r="15.915"
                                                            fill="transparent"
                                                            stroke={colors[i % colors.length]}
                                                            strokeWidth="6"
                                                            strokeDasharray={strokeDasharray}
                                                            strokeDashoffset={strokeDashoffset}
                                                            className="transition-all duration-1000 ease-in-out hover:stroke-black pointer-events-auto cursor-pointer"
                                                        />
                                                    );
                                                })}
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="text-center group-hover:scale-110 transition-transform">
                                                    <p className="text-3xl font-black text-gray-900 leading-none">{total}</p>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Reported</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 px-4">
                                            {industryData.map((item: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2 group cursor-default">
                                                    <div
                                                        style={{ backgroundColor: colors[i % colors.length] }}
                                                        className="w-3 h-3 rounded-full shadow-sm group-hover:scale-125 transition-transform"
                                                    ></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter leading-none">{item.name}</span>
                                                        <span className="text-[9px] font-bold text-gray-400">{((item.value / total) * 100).toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Row 3: Geographic Insights */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-[#1b5e20] px-8 py-5 flex items-center gap-4 text-white">
                        <span className="text-xl">🗺️</span>
                        <h3 className="text-base font-bold tracking-wider">State-wise Defaulter Insights</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="min-h-[400px] relative overflow-hidden">
                            <IndiaMap stateInsights={stats?.stateInsights || []} />
                        </div>
                        <div className="border-l border-gray-50 flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="w-full text-center border-collapse">
                                    <thead className="bg-[#1b5e20] text-gray-300 uppercase">
                                        <tr className="divide-x divide-white/5 border-t border-white/10">
                                            <th className="px-6 py-4 text-xs font-bold tracking-widest">State</th>
                                            <th className="px-6 py-4 text-xs font-bold tracking-widest">Total Defaulters</th>
                                            <th className="px-6 py-4 text-xs font-bold tracking-widest">Total Default Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-600">
                                        {(stats?.stateInsights || []).map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50 divide-x divide-gray-50">
                                                <td className="px-6 py-5 font-bold text-gray-900 tracking-tight">{row.state}</td>
                                                <td className="px-6 py-5 font-black text-[#1b5e20]">{row.count}</td>
                                                <td className="px-6 py-5 font-black text-red-600">₹ {(row.amount || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 4: Search History */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-[#1b5e20] px-8 py-5 flex items-center gap-4 text-white">
                        <span className="text-xl">🔎</span>
                        <h3 className="text-base font-bold tracking-wider">Defaulter Search History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse">
                            <thead className="bg-[#1b5e20] text-gray-300 uppercase">
                                <tr className="divide-x divide-white/5 border-t border-white/10">
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">#</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">Target Name</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">GST Identifier</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">PAN Identification</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">Records Identified</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-600">
                                {(stats?.searchHistory || []).map((log: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50 divide-x divide-gray-50">
                                        <td className="px-6 py-5 font-bold text-gray-900">{i + 1}</td>
                                        <td className="px-6 py-5 font-bold text-gray-700">{log.filters?.name || '---'}</td>
                                        <td className="px-6 py-5 font-mono">{log.filters?.gst || '---'}</td>
                                        <td className="px-6 py-5 font-mono">{log.filters?.pan || '---'}</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-4 py-1.5 rounded-lg font-bold ${log.resultCount > 0 ? 'bg-green-50 text-[#1b5e20]' : 'bg-red-50 text-red-600'}`}>
                                                {log.resultCount} Records
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MemberPortalContainer>
    );
}
