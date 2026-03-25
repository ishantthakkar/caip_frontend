"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
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

    const filteredSubMembers = useMemo(() => {
        if (!searchTerm) return subMembers;
        const lowTerm = searchTerm.toLowerCase();
        return subMembers.filter(m =>
            m.firstName?.toLowerCase().includes(lowTerm) ||
            m.email?.toLowerCase().includes(lowTerm) ||
            m.phone?.toLowerCase().includes(lowTerm)
        );
    }, [subMembers, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSubMembers.slice(start, start + itemsPerPage);
    }, [filteredSubMembers, currentPage]);

    const fetchSubMembers = async (parentId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}sub-members/list/${parentId}`);
            const data = await response.json();
            if (response.ok) {
                setSubMembers(data.data || []);
                setCurrentPage(1); // Reset to first page
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
                        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Staff management</h2>
                    </div>

                    <button
                        onClick={() => { setEditingMember(null); setFormData({ firstName: '', email: '', phone: '' }); setShowModal(true); }}
                        disabled={subMembers.length >= (user?.subMemberLimit || 0)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#1b5e20] text-white rounded-xl font-bold text-[13px] shadow-sm hover:bg-[#2e7d32] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                        Add sub-member
                    </button>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 flex flex-col md:flex-row md:items-center gap-6 shadow-md transition-all duration-300">
                    <div className="h-14 w-14 bg-green-50 text-[#1b5e20] rounded-xl flex shrink-0 items-center justify-center text-2xl border border-green-100">
                        👥
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-800">Account Limits</h4>
                        <p className="text-sm text-gray-500 mt-1 max-w-2xl text-justify">
                            Your current membership plan allows for up to <strong>{user?.subMemberLimit || 0} sub-member slots</strong>.
                            {(user?.subMemberLimit || 0) === 0 && <span className="text-red-500 font-bold ml-1 italic"> (Please purchase a membership to add staff)</span>}
                        </p>
                    </div>
                    <div className="md:ml-auto text-left md:text-right bg-[#f8fafc] p-4 rounded-xl border border-gray-100 w-full md:w-auto min-w-[160px]">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Usage status</p>
                        <p className="text-2xl font-black text-[#1b5e20]">{subMembers.length} <span className="text-gray-300 text-lg">/ {user?.subMemberLimit || 0}</span></p>
                    </div>
                </div>                {/* Search Bar */}
                <div className="relative group max-w-md">
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#1b5e20] text-sm shadow-sm transition-all focus:ring-1 focus:ring-[#1b5e20]/20"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1b5e20] transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </span>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
                        </div>
                    )}

                    <div className="overflow-x-auto p-4 md:p-5">
                        <div className="overflow-hidden rounded-lg border border-gray-50 shadow-sm">
                            <table className="w-full text-center border-collapse">
                                <thead className="bg-[#051a02] text-white">
                                    <tr className="divide-x divide-white/5">
                                        <th className="px-6 py-3 text-[12px] font-semibold tracking-tight">Name</th>
                                        <th className="px-6 py-3 text-[12px] font-semibold tracking-tight">Email</th>
                                        <th className="px-6 py-3 text-[12px] font-semibold tracking-tight">Phone</th>
                                        <th className="px-6 py-3 text-[12px] font-semibold tracking-tight">Status</th>
                                        <th className="px-6 py-3 text-[12px] font-semibold tracking-tight">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                    {paginatedData.length > 0 ? paginatedData.map((member) => (
                                        <tr key={member._id} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4 justify-center">
                                                    <div className="text-left">
                                                        <p className="font-semibold text-gray-900 leading-tight">{member.firstName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <p className="font-semibold text-gray-800">{member.email}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <p className="text-[12px] font-semibold text-[#1b5e20]">{member.phone}</p>

                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleStatus(member._id)}
                                                    className={`px-3 py-0.5 rounded-full text-[11px] font-semibold transition-all border ${member.isActive
                                                        ? 'bg-green-50 text-[#1b5e20] border-green-100 shadow-sm'
                                                        : 'bg-red-50 text-red-600 border-red-100'
                                                        }`}
                                                >
                                                    {member.isActive ? 'Active' : 'Disabled'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(member)}
                                                        className="p-2 text-gray-400 hover:bg-green-50 hover:text-[#1b5e20] rounded-lg transition-all"
                                                        title="Edit details"
                                                    >
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(member._id)}
                                                        className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                                                        title="Delete member"
                                                    >
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <div className="text-4xl mb-3 opacity-20">👤</div>
                                                <p className="text-[14px] font-semibold text-gray-400 italic">
                                                    {searchTerm ? 'No matching sub-members found.' : 'No sub-members identified in your database.'}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Section */}
                        {filteredSubMembers.length > itemsPerPage && (
                            <div className="flex flex-col sm:flex-row items-center justify-between px-2 pt-6 gap-4">
                                <p className="text-[13px] font-medium text-gray-500">
                                    Showing <span className="text-gray-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredSubMembers.length)}</span> of <span className="text-gray-900 font-bold">{filteredSubMembers.length}</span> entries
                                </p>

                                <div className="flex items-center gap-1">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="px-4 py-2 text-[13px] font-medium text-gray-400 hover:text-[#1b5e20] disabled:opacity-30 transition-all font-sans"
                                    >
                                        Previous
                                    </button>

                                    <div className="flex items-center">
                                        {Array.from({ length: Math.ceil(filteredSubMembers.length / itemsPerPage) }, (_, i) => i + 1).map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded text-[13px] font-bold transition-all ${currentPage === pageNum
                                                    ? 'bg-[#1b5e20] text-white shadow-md'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        disabled={currentPage === Math.ceil(filteredSubMembers.length / itemsPerPage)}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="px-4 py-2 text-[13px] font-medium text-gray-400 hover:text-[#1b5e20] disabled:opacity-30 transition-all font-sans"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#051a02]/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        {/* Modal Header */}
                        <div className="bg-[#1b5e20] p-6 text-white flex justify-between items-center relative overflow-hidden">
                            <h3 className="text-[18px] font-bold tracking-tight relative z-10">{editingMember ? 'Edit sub-member' : 'Add sub-member'}</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-white/70 hover:text-white transition-colors relative z-10"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-6">
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[13px] font-bold text-gray-700 ml-1">Sub-Member name</label>
                                <input
                                    type="text" required placeholder="Enter sub member name" value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-3 px-4 outline-none text-[14px] font-medium transition-all focus:border-[#1b5e20] focus:bg-white shadow-sm"
                                />
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[13px] font-bold text-gray-700 ml-1">Email</label>
                                <input
                                    type="email" required placeholder="Enter Email" value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-3 px-4 outline-none text-[14px] font-medium transition-all focus:border-[#1b5e20] focus:bg-white shadow-sm"
                                />
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[13px] font-bold text-gray-700 ml-1">Phone number</label>
                                <input
                                    type="text" required placeholder="+91 XXXXX XXXXX" value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-3 px-4 outline-none text-[14px] font-medium transition-all focus:border-[#1b5e20] focus:bg-white shadow-sm"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white bg-[#1b5e20] hover:bg-[#2e7d32] transition-colors shadow-lg active:scale-95"
                                >
                                    {editingMember ? 'Save changes' : 'Create member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MemberPortalContainer>
    );
}
