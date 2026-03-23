"use client";

import React, { useState, useEffect } from 'react';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';
import { useRouter } from 'next/navigation';

export default function SubMembersPage() {
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
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchSubMembers(parsedUser._id);
        
        // Refresh profile to get latest subMemberLimit
        fetchLatestProfile(token);
    }, []);

    const fetchLatestProfile = async (token: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.data);
                localStorage.setItem('user', JSON.stringify(data.data));
            }
        } catch (error) {
            console.error("Error refreshing profile:", error);
        }
    };

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
        <MemberPortalContainer title="Team Management">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Enterprise Staff Controls</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage secondary access accounts and administrative permissions for your organization.</p>
                    </div>

                    <button
                        onClick={() => { setEditingMember(null); setFormData({ firstName: '', email: '', phone: '' }); setShowModal(true); }}
                        disabled={subMembers.length >= (user?.subMemberLimit || 0)}
                        className="flex items-center gap-3 px-8 py-3.5 bg-agri-green-primary text-white rounded-lg font-bold text-sm shadow-xl shadow-green-900/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                        Invite New Member
                    </button>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-lg p-8 border border-slate-100 flex flex-col md:flex-row md:items-center gap-8 shadow-md">
                    <div className="h-16 w-16 bg-slate-50 text-agri-green-primary rounded-xl flex shrink-0 items-center justify-center text-3xl border border-slate-100 shadow-sm">
                        👥
                    </div>
                    <div className="flex-1">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-3">
                            <div className="w-6 h-1 bg-agri-green-primary rounded-full"></div>
                            Account Allocation Details
                        </h4>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed max-w-2xl">
                            Your enterprise plan facilitates up to <strong className="text-slate-900">{user?.subMemberLimit || 0} sub-member slots</strong>. 
                            For enhanced organizational security, only one staff member can be active in the system at any given timestamp. 
                            { (user?.subMemberLimit || 0) === 0 && <span className="text-rose-500 font-bold ml-1 italic"> (Purchase a plan to unlock staff management)</span> }
                        </p>
                    </div>
                    <div className="md:ml-auto text-left md:text-right bg-slate-50 p-6 rounded-xl border border-slate-100 w-full md:w-auto min-w-[180px] shadow-inner">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL CAPACITY</p>
                        <p className="text-3xl font-black text-agri-green-primary tabular-nums">
                            {subMembers.length} <span className="text-slate-300 text-xl font-medium">/ {user?.subMemberLimit || 0}</span>
                        </p>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden relative min-h-[500px] flex flex-col">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
                            <div className="animate-spin h-10 w-10 border-4 border-agri-green-primary border-t-transparent rounded-full font-black"></div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-agri-green-primary text-white">
                                <tr>
                                    <th className="px-8 py-5 text-[14px] font-bold tracking-tight">Organization Profile</th>
                                    <th className="px-8 py-5 text-[14px] font-bold tracking-tight">Verified Contact</th>
                                    <th className="px-8 py-5 text-[14px] font-bold tracking-tight text-center">Security Status</th>
                                    <th className="px-8 py-5 text-[14px] font-bold tracking-tight text-right">Administrative Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {subMembers.length > 0 ? subMembers.map((member) => (
                                    <tr key={member._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shadow-sm border transition-all group-hover:scale-110 ${member.isActive ? 'bg-agri-green-primary/5 text-agri-green-primary border-agri-green-primary/10' : 'bg-slate-100 text-slate-300 border-slate-200'}`}>
                                                    {member.firstName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 leading-none mb-1">{member.firstName}</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">MEMBER ID: <span className="text-slate-600 font-mono tracking-normal">{member._id.slice(-8).toUpperCase()}</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-700">{member.email}</p>
                                                <p className="text-xs font-bold text-agri-green-primary">{member.phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button
                                                onClick={() => toggleStatus(member._id)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95 ${member.isActive
                                                    ? 'bg-agri-green-primary text-white border-agri-green-primary shadow-sm'
                                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-agri-green-primary hover:border-agri-green-primary'
                                                    }`}
                                            >
                                                {member.isActive ? 'Active Access' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => openEditModal(member)}
                                                    className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-agri-green-primary hover:border-agri-green-primary hover:shadow-sm rounded-lg transition-all group-hover:scale-110"
                                                >
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member._id)}
                                                    className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-500 hover:shadow-sm rounded-lg transition-all group-hover:scale-110"
                                                >
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="py-32 text-center">
                                            <div className="text-5xl mb-6 opacity-20 filter grayscale">👤</div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">No team members identified within this project</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-400">
                        {/* Modal Header */}
                        <div className="bg-agri-green-primary px-8 py-6 text-white flex justify-between items-center shadow-lg">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight">Team Profile Configuration</h3>
                                <p className="text-xs text-white/60 font-medium">Provision Secure Operational Access</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all border border-white/10 active:scale-90"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrUpdate} className="p-8 space-y-6">
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-xs font-semibold text-slate-500">Legal Full Name</label>
                                <input
                                    type="text" required placeholder="Enter Name" value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-agri-green-primary focus:bg-white transition-all text-sm font-semibold text-slate-700 shadow-sm"
                                />
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-xs font-semibold text-slate-500">Primary Email Address</label>
                                <input
                                    type="email" required placeholder="name@company.com" value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-agri-green-primary focus:bg-white transition-all text-sm font-semibold text-slate-700 shadow-sm"
                                />
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-xs font-semibold text-slate-500">Verified Contact Phone</label>
                                <input
                                    type="text" required placeholder="+91 XXXXX XXXXX" value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-agri-green-primary focus:bg-white transition-all text-sm font-semibold text-slate-700 shadow-sm"
                                />
                            </div>

                            <div className="pt-6 flex flex-col gap-3">
                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-lg font-bold text-sm text-white bg-agri-green-primary hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-green-900/20"
                                >
                                    {editingMember ? 'Update Profile Credentials' : 'Provision System Access'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="w-full py-4 rounded-lg font-bold text-sm text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
                                >
                                    Exit Configuration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MemberPortalContainer>
    );
}
