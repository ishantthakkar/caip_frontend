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
        <MemberPortalContainer title="Sub-Member Management">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Staff Management</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage secondary access accounts for your organization.</p>
                    </div>
                    
                    <button
                        onClick={() => { setEditingMember(null); setFormData({ firstName: '', email: '', phone: '' }); setShowModal(true); }}
                        disabled={subMembers.length >= 5}
                        className="flex items-center gap-2 px-6 py-3 bg-[#1b5e20] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                        Add Sub-Member
                    </button>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 flex flex-col md:flex-row md:items-center gap-6 shadow-sm">
                    <div className="h-14 w-14 bg-green-50 text-[#1b5e20] rounded-lg flex shrink-0 items-center justify-center text-2xl border border-green-100">
                        👥
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-800">Account Limits</h4>
                        <p className="text-sm text-gray-500 mt-1 max-w-2xl">Maximum 5 slots available. Only one sub-member can be active at any given time for system security. Sub-members can access the dashboard and perform searches.</p>
                    </div>
                    <div className="md:ml-auto text-left md:text-right bg-gray-50 p-4 rounded-xl border border-gray-100 w-full md:w-auto">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Usage</p>
                        <p className="text-2xl font-black text-[#1b5e20]">{subMembers.length} <span className="text-gray-300 text-lg">/ 5</span></p>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#1b5e20] text-gray-300 uppercase">
                                <tr className="divide-x divide-white/5 border-t border-white/10">
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">Profile</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest">Contact Details</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-600">
                                {subMembers.length > 0 ? subMembers.map((member) => (
                                    <tr key={member._id} className="hover:bg-gray-50 divide-x divide-gray-50">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border border-gray-100 ${member.isActive ? 'bg-green-50 text-[#1b5e20]' : 'bg-gray-100 text-gray-400'}`}>
                                                    {member.firstName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 leading-none">{member.firstName}</p>
                                                    <p className="text-xs text-gray-400 mt-1 font-mono">ID: {member._id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-gray-700">{member.email}</p>
                                                <p className="text-xs font-bold text-[#1b5e20]">{member.phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button 
                                                onClick={() => toggleStatus(member._id)}
                                                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border transition-all ${member.isActive 
                                                    ? 'bg-green-50 text-[#1b5e20] border-green-200' 
                                                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-[#1b5e20] hover:border-green-200'
                                                }`}
                                            >
                                                {member.isActive ? 'Active' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button 
                                                    onClick={() => openEditModal(member)}
                                                    className="p-2 text-gray-400 hover:bg-gray-100 hover:text-[#1b5e20] rounded-lg transition-all"
                                                >
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(member._id)}
                                                    className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                                                >
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="text-4xl mb-3 opacity-20">👤</div>
                                            <p className="text-sm font-bold text-gray-400">No Sub-Members Found</p>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-[#1b5e20] p-6 text-white flex justify-between items-center">
                            <h3 className="text-lg font-bold">{editingMember ? 'Edit Sub-Member' : 'Add Sub-Member'}</h3>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-white/70 hover:text-white transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-5">
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-sm font-bold text-gray-700">Name</label>
                                <input 
                                    type="text" required placeholder="Enter Name" value={formData.firstName}
                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20]"
                                />
                            </div>
                            
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-sm font-bold text-gray-700">Email Address</label>
                                <input 
                                    type="email" required placeholder="Enter Email" value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20]"
                                />
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-sm font-bold text-gray-700">Phone Number</label>
                                <input 
                                    type="text" required placeholder="Enter Phone" value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20]"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 rounded-lg font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-lg font-bold text-sm text-white bg-[#1b5e20] hover:bg-green-800 transition-colors shadow-sm"
                                >
                                    {editingMember ? 'Save Changes' : 'Create Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MemberPortalContainer>
    );
}
