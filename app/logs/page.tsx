"use client";

import React, { useState, useEffect } from 'react';
import MemberSidebar from '@/components/MemberSidebar';
import MemberHeader from '@/components/MemberHeader';
import { API_BASE_URL } from '@/config/apiConfig';
import { useRouter } from 'next/navigation';

export default function ActivityLogsPage() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(userData));
        fetchLogs();
    }, []);

    useEffect(() => {
        if (logs.length > 0) {
            const term = searchTerm.toLowerCase();
            const filtered = logs.filter(log => 
                log.userName.toLowerCase().includes(term) ||
                log.activityType.toLowerCase().includes(term) ||
                log.details.toLowerCase().includes(term) ||
                log.ipAddress?.includes(term)
            );
            setFilteredLogs(filtered);
        } else {
            setFilteredLogs([]);
        }
    }, [searchTerm, logs]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}member/activity-logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setLogs(data.data || []);
                setFilteredLogs(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans">
             <MemberSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
             
             <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Visual Background Elements */}
                <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-emerald-100/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[25%] h-[25%] bg-blue-100/20 rounded-full blur-[100px] pointer-events-none"></div>

                <MemberHeader user={user} title="Activity History" isCollapsed={isCollapsed} />
                
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10">
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        
                        {/* Title & Exports */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h2 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">Activity History</h2>
                                <p className="text-sm font-medium text-slate-500 mt-1">Audit logs of all system interactions across your organization.</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#1b5e20] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#2d523c] transition-all shadow-lg shadow-emerald-900/10 active:scale-95">
                                    <span className="text-lg">📊</span> Excel
                                </button>
                                <button className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-900/10 active:scale-95">
                                    <span className="text-lg">📄</span> CSV
                                </button>
                                <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/10 active:scale-95">
                                    <span className="text-lg">📕</span> PDF
                                </button>
                            </div>
                        </div>

                        {/* Logs Table Container */}
                        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                            {/* Search Header */}
                            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="relative w-full md:w-80 group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Filter by user, activity or IP..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
                                    />
                                </div>
                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                    Showing {filteredLogs.length} interactions
                                </div>
                            </div>

                            <div className="overflow-x-auto overflow-y-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#0b1b0b] text-white">
                                        <tr>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">#</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Timestamp</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Authorized User</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Activity Type</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Details</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={6} className="px-6 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                                </tr>
                                            ))
                                        ) : filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                                            <tr key={log._id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-5 text-sm font-bold text-slate-400">{(idx + 1).toString().padStart(2, '0')}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700">
                                                            {new Date(log.createdAt).toLocaleDateString('en-GB')}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">
                                                            {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-black">
                                                            {log.userName[0]}
                                                        </div>
                                                        <span className="text-sm font-extrabold text-[#0f172a]">{log.userName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                        log.activityType.includes('Login') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        log.activityType.includes('Logout') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}>
                                                        {log.activityType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-semibold text-slate-600 max-w-xs truncate" title={log.details}>
                                                        {log.details}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-xs font-bold text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                        {log.ipAddress}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-24 text-center">
                                                    <div className="text-5xl mb-4 opacity-20">📂</div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No activity history found matching your filters</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Footer */}
                            {!loading && filteredLogs.length > 0 && (
                                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm font-bold text-slate-500">
                                    <div>Showing 1 to {filteredLogs.length} of {logs.length} organizational events</div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-white hover:text-emerald-600 transition-all disabled:opacity-30" disabled>Previous</button>
                                        <button className="px-4 py-2 bg-[#1b5e20] text-white rounded-xl shadow-lg shadow-emerald-900/10 transition-all">1</button>
                                        <button className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-white hover:text-emerald-600 transition-all disabled:opacity-30" disabled>Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
             </div>
        </div>
    );
}
