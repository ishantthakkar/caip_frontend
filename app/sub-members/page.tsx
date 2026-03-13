"use client";

import React, { useState, useEffect } from 'react';
import MemberSidebar from '@/components/MemberSidebar';
import MemberHeader from '@/components/MemberHeader';
import { API_BASE_URL } from '@/config/apiConfig';
import { useRouter } from 'next/navigation';

export default function SubMembersPage() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [subMembers, setSubMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        email: '',
        phone: ''
    });
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchSubMembers(parsedUser._id);
    }, []);

    const fetchSubMembers = async (parentId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}sub-members/list/${parentId}`);
            const data = await response.json();
            if (response.ok) {
                setSubMembers(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching sub-members:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const url = editingMember 
            ? `${API_BASE_URL}sub-members/update/${editingMember._id}`
            : `${API_BASE_URL}sub-members/create`;
        
        const method = editingMember ? 'PUT' : 'POST';
        const body = editingMember 
            ? { ...formData }
            : { ...formData, parentId: user._id };

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();

            if (response.ok) {
                setShowModal(false);
                setEditingMember(null);
                setFormData({ firstName: '', email: '', phone: '' });
                fetchSubMembers(user._id);
            } else {
                alert(data.msg || "Operation failed");
            }
        } catch (error) {
            alert("Network error occurred");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this sub-member?")) return;
        try {
            const response = await fetch(`${API_BASE_URL}sub-members/delete/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchSubMembers(user._id);
            }
        } catch (error) {
            alert("Delete failed");
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}sub-members/toggle-status/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parentId: user._id })
            });
            if (response.ok) {
                fetchSubMembers(user._id);
            }
        } catch (error) {
            alert("Toggle status failed");
        }
    };

    const openEditModal = (member: any) => {
        setEditingMember(member);
        setFormData({
            firstName: member.firstName,
            email: member.email,
            phone: member.phone
        });
        setShowModal(true);
    };

    return (
        <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                body { font-family: 'Outfit', sans-serif; }
                .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); }
                .shimmer { background: linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%); background-size: 200% 100%; animation: shimmer 2s infinite; }
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            `}</style>

            <MemberSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Background Blobs */}
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[35%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none"></div>

                <MemberHeader user={user} title="Sub-Member Management" isCollapsed={isCollapsed} />
                
                <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 relative z-10">
                    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        
                        {/* Hero Header */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold tracking-widest uppercase border border-emerald-100 shadow-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Identity Management Console
                                </div>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-[#0f172a] tracking-tight leading-tight">
                                    Staff <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Architecture</span>
                                </h1>
                            </div>
                            
                            <button
                                onClick={() => { setEditingMember(null); setFormData({ firstName: '', email: '', phone: '' }); setShowModal(true); }}
                                disabled={subMembers.length >= 5}
                                className="group relative overflow-hidden px-8 py-4 bg-[#1b5e20] text-white rounded-2xl shadow-xl shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="relative flex items-center gap-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Add Sub-Member</span>
                                </div>
                            </button>
                        </div>

                        {/* Protocol Information */}
                        <div className="bg-white/50 backdrop-blur-sm border border-emerald-100 rounded-3xl p-8 flex items-center gap-6 shadow-sm">
                            <div className="h-16 w-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-200">ℹ️</div>
                            <div>
                                <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Master Protocol Rules</h4>
                                <p className="text-slate-500 font-medium mt-1">Maximum 5 slots available. Only one sub-member can be active at any given time for system security.</p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Usage</p>
                                <p className="text-2xl font-black text-emerald-600">{subMembers.length} <span className="text-slate-300">/ 5</span></p>
                            </div>
                        </div>

                        {/* Tabular Section */}
                        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative">
                            {loading && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                    <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full"></div>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/80 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Details</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {subMembers.length > 0 ? subMembers.map((member) => (
                                            <tr key={member._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shadow-sm ${member.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                            {member.firstName[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-bold text-slate-900 leading-none">{member.firstName}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">ID: {member._id.slice(-8).toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-semibold text-slate-600">{member.email}</p>
                                                        <p className="text-[11px] font-black text-emerald-600 tracking-widest">{member.phone}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <button 
                                                        onClick={() => toggleStatus(member._id)}
                                                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${member.isActive 
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-emerald-600 hover:border-emerald-100'
                                                        }`}
                                                    >
                                                        {member.isActive ? '● Active' : '○ Offline'}
                                                    </button>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => openEditModal(member)}
                                                            className="p-2.5 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white border border-slate-100 rounded-xl shadow-sm transition-all"
                                                        >
                                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(member._id)}
                                                            className="p-2.5 bg-white text-red-600 hover:bg-red-600 hover:text-white border border-slate-100 rounded-xl shadow-sm transition-all"
                                                        >
                                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="py-24 text-center">
                                                    <div className="text-4xl mb-4 grayscale opacity-20">👥</div>
                                                    <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Zero Identities Detected</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal - Polished */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 relative">
                        {/* Modal Header */}
                        <div className="relative h-64 bg-slate-900 flex flex-col items-center justify-center text-center p-12 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/40 to-teal-500/40 opacity-50"></div>
                            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/20 rounded-full blur-[80px]"></div>
                            
                            <h3 className="relative text-3xl font-black text-white tracking-tight">{editingMember ? 'Sync Identity' : 'Provision Account'}</h3>
                            <p className="relative text-emerald-300/60 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Node Control Protocol v2.5</p>
                            
                            <button 
                                onClick={() => setShowModal(false)}
                                className="absolute top-10 right-10 w-12 h-12 rounded-2xl bg-white/10 hover:bg-slate-800 flex items-center justify-center transition-all text-white border border-white/5 active:scale-90"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrUpdate} className="p-12 -mt-12 relative bg-white rounded-t-[3.5rem] space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Identity Display Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        </div>
                                        <input 
                                            type="text" required placeholder="Ex: Alex Johnson" value={formData.firstName}
                                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] pl-16 pr-8 py-5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-100 focus:bg-white transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Secure Email Gateway</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                        </div>
                                        <input 
                                            type="email" required placeholder="alex@company.com" value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] pl-16 pr-8 py-5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-100 focus:bg-white transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Encrypted Mobile Line</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                        </div>
                                        <input 
                                            type="text" required placeholder="9876543210" value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] pl-16 pr-8 py-5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-100 focus:bg-white transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl shadow-slate-900/30 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                {editingMember ? 'Update Protocol' : 'Activate Member'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
