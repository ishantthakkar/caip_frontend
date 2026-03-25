"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

export default function AdminMembersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalSearchTerm, setModalSearchTerm] = useState('');
    const [subSearchTerm, setSubSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState<any>(null);
    const [selectedUserDefaulters, setSelectedUserDefaulters] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showDocModal, setShowDocModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showSubModal, setShowSubModal] = useState(false);
    const [selectedSubMembers, setSelectedSubMembers] = useState<any[]>([]);
    const [subModalLoading, setSubModalLoading] = useState(false);
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const [usersRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}admin/dashboard-stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const userData = await usersRes.json();
            const statsData = await statsRes.json();

            if (usersRes.ok) {
                setUsers(Array.isArray(userData.data) ? userData.data : (userData.data ? [userData.data] : []));
            }
            if (statsRes.ok) {
                setStats(statsData);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, action: string, reason: string = "") => {
        const status = action === 'approved' ? 1 : 2;

        if (status === 2 && !showRejectionModal) {
            setProcessingUserId(userId);
            setShowRejectionModal(true);
            setRejectionReason("");
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}user/change-staus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, status, rejectionReason: reason }),
            });

            if (response.ok) {
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: status.toString(), rejectionReason: reason } : u));
                setShowRejectionModal(false);
                setProcessingUserId(null);
                setRejectionReason("");
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
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
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

    const fetchSubMembers = async (user: any) => {
        setSelectedUser(user);
        setSubModalLoading(true);
        setShowSubModal(true);
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}sub-members/list/${user._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setSelectedSubMembers(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching sub-members:", error);
        } finally {
            setSubModalLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!Array.isArray(users)) return [];
        return users.filter(user => {
            if (user.status === '0') return false; // Exclude pending members

            const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm) ||
                user.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.state?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [users, searchTerm, statusFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const pendingCount = Array.isArray(users) ? users.filter(u => u.status === "0").length : 0;

    return (
        <AdminPortalContainer title="Member Management">
            <div className="space-y-6">
                
                {/* Member Listing Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#1b5e20] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
                        <div className="flex items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <h3 className="text-[16px] font-semibold tracking-tight">Members List</h3>
                        </div>
                        <div className="relative w-full md:w-80">
                            <input
                                type="text"
                                placeholder="Search by name, email, city..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-9 pr-4 text-sm font-medium text-white placeholder-white/40 outline-none focus:bg-white focus:text-black focus:border-white transition-all shadow-sm"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="11" y2="11"/></svg>
                            </span>
                        </div>
                    </div>

                    <div className="p-4 md:p-5">
                        <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[1800px]">
                                    <thead className="bg-[#051a02] text-white sticky top-0 z-10">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Member ID</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Defaulter</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Name</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Email</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Phone</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Company Name</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Membership Type</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Membership Status</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Expiry Date</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Status</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Searches</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Sub-Member</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-medium text-gray-600 border-b border-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={13} className="py-24 text-center">
                                                <div className="animate-spin h-8 w-8 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                <p className="text-sm font-bold text-gray-400 animate-pulse tracking-widest uppercase">Loading records...</p>
                                            </td>
                                        </tr>
                                    ) : paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-4 py-3 text-sm">
                                                {user.memberId || user._id?.slice(-8).toUpperCase()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => fetchUserDefaulters(user)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors cursor-pointer"
                                                >
                                                    View Defaulters
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                                            <td className="px-4 py-3 text-sm lowercase text-gray-500">{user.email}</td>
                                            <td className="px-4 py-3 text-sm">{user.phone}</td>
                                            <td className="px-4 py-3 text-sm">{user.companyName || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-green-50 text-emerald-700 text-[11px] font-semibold rounded-full border border-green-100">
                                                    Standard Membership
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${user.status === '1' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                    {user.status === '1' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                {user.membershipExpiry ? new Date(user.membershipExpiry).toLocaleDateString('en-GB') : '12/05/2026'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${user.status === '1' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                    {user.status === '1' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center">{user.searches || '0'}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => fetchSubMembers(user)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors cursor-pointer"
                                                >
                                                    View
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right bg-white group-hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleAction(user._id, user.status === '1' ? 'rejected' : 'approved')}
                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${user.status === '1'
                                                            ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white'
                                                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white'}`}
                                                    >
                                                        {user.status === '1' ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={13} className="py-32 text-center text-gray-400">
                                                <div className="text-5xl mb-6 opacity-20">📂</div>
                                                <p className="text-sm font-bold tracking-widest uppercase">No matching records found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {!loading && filteredUsers.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Page {currentPage} of {totalPages} <span className="mx-2 opacity-30">•</span> {filteredUsers.length} Members Found
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }).map((_, idx) => {
                                            const pageNum = idx + 1;
                                            if (totalPages > 5 && (pageNum > 1 && pageNum < totalPages) && (pageNum < currentPage - 1 || pageNum > currentPage + 1)) {
                                                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="text-gray-300">...</span>;
                                                return null;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${currentPage === pageNum ? 'bg-[#1b5e20] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Defaulter Table Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-[95vw] lg:max-w-7xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-[#1b5e20] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
                            <div className="flex items-center gap-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <h3 className="text-lg font-bold tracking-tight">Defaulter List</h3>
                            </div>
                            
                            <div className="flex items-center gap-4 flex-1 md:max-w-xl">
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        placeholder="Search by company, mobile, GST, PAN..."
                                        value={modalSearchTerm}
                                        onChange={(e) => setModalSearchTerm(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-9 pr-4 text-sm font-medium text-white placeholder-white/40 outline-none focus:bg-white focus:text-black focus:border-white transition-all shadow-sm"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="11" y2="11"/></svg>
                                    </span>
                                </div>
                                <button
                                    onClick={() => { setShowModal(false); setModalSearchTerm(''); }}
                                    className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all flex-shrink-0 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 md:p-6 overflow-hidden flex flex-col flex-1">
                            <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm flex flex-col flex-1">
                                <div className="overflow-x-auto overflow-y-auto max-h-full custom-scrollbar">
                                    {modalLoading ? (
                                        <div className="py-24 text-center">
                                            <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-sm font-bold text-gray-400 tracking-wider animate-pulse uppercase">Loading records...</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse min-w-[2800px]">
                                            <thead className="bg-[#051a02] text-white sticky top-0 z-10">
                                                <tr className="divide-x divide-white/5">
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">#</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Reported By</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Date of Default</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Defaulter Company Name</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Mobile Number</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Email ID</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">GST</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">PAN</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">CIN</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Aadhar</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">State</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">District</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Sub District</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Industry</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Financial Year</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Default Amount</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Outstanding Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                                                {selectedUserDefaulters.filter(r => 
                                                    r.defaulter_name?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                                                    r.gst_number?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                                                    r.pan_number?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                                                    r.mobile?.includes(modalSearchTerm)
                                                ).length > 0 ? (
                                                    selectedUserDefaulters
                                                        .filter(r => 
                                                            r.defaulter_name?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                                                            r.gst_number?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                                                            r.pan_number?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                                                            r.mobile?.includes(modalSearchTerm)
                                                        )
                                                        .map((report, i) => (
                                                            <tr key={report._id} className="hover:bg-gray-50/50 transition-colors divide-x divide-gray-50">
                                                                <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{report.user_id?.name || '---'}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                                    {report.date_of_default ? new Date(report.date_of_default).toLocaleDateString('en-GB') : '-'}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm font-bold text-gray-900">{report.defaulter_name}</td>
                                                                <td className="px-4 py-3 text-sm">{report.mobile || '-'}</td>
                                                                <td className="px-4 py-3 text-sm lowercase">{report.email || '-'}</td>
                                                                <td className="px-4 py-3 text-sm font-mono">{report.gst_number || '-'}</td>
                                                                <td className="px-4 py-3 text-sm font-mono">{report.pan_number || '-'}</td>
                                                                <td className="px-4 py-3 text-sm font-mono">{report.cin_number || '-'}</td>
                                                                <td className="px-4 py-3 text-sm font-mono">{report.aadhar_number || '-'}</td>
                                                                <td className="px-4 py-3 text-sm">{report.state || '-'}</td>
                                                                <td className="px-4 py-3 text-sm">{report.district || '-'}</td>
                                                                <td className="px-4 py-3 text-sm">{report.sub_district || '-'}</td>
                                                                <td className="px-4 py-3 text-sm">
                                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded border border-gray-200">
                                                                        {report.industry || 'General'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-center">{report.financial_year || '-'}</td>
                                                                <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                                                                    ₹ {report.default_amount?.toLocaleString() || '0'}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-right font-bold text-amber-600">
                                                                    ₹ {report.outstanding_amount?.toLocaleString() || '0'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={17} className="py-32 text-center text-gray-400">
                                                            <div className="text-5xl mb-6 opacity-20">📂</div>
                                                            <p className="text-sm font-bold tracking-widest uppercase">No defaulters found</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Sub-Member Modal */}
            {showSubModal && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-[95vw] lg:max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-[#1b5e20] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
                            <div className="flex items-center gap-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                <h3 className="text-lg font-bold tracking-tight">Sub-member registry</h3>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => { setShowSubModal(false); setSubSearchTerm(''); }}
                                    className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all flex-shrink-0 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 md:p-6 overflow-hidden flex flex-col flex-1">
                            <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm flex flex-col flex-1">
                                <div className="overflow-x-auto overflow-y-auto max-h-full custom-scrollbar">
                                    {subModalLoading ? (
                                        <div className="py-24 text-center">
                                            <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-sm font-bold text-gray-400 tracking-wider animate-pulse uppercase">Retrieving records...</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-[#051a02] text-white sticky top-0 z-10">
                                                <tr className="divide-x divide-white/5">
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Name</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Email</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Phone</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Status</th>
                                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Registered On</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                                                {selectedSubMembers.filter(sub => 
                                                    `${sub.firstName} ${sub.lastName}`.toLowerCase().includes(subSearchTerm.toLowerCase()) ||
                                                    sub.email?.toLowerCase().includes(subSearchTerm.toLowerCase()) ||
                                                    sub.phone?.includes(subSearchTerm)
                                                ).length > 0 ? (
                                                    selectedSubMembers
                                                        .filter(sub => 
                                                            `${sub.firstName} ${sub.lastName}`.toLowerCase().includes(subSearchTerm.toLowerCase()) ||
                                                            sub.email?.toLowerCase().includes(subSearchTerm.toLowerCase()) ||
                                                            sub.phone?.includes(subSearchTerm)
                                                        )
                                                        .map((sub, i) => (
                                                            <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors divide-x divide-gray-50">
                                                                <td className="px-4 py-3 text-sm text-gray-900 font-bold">{sub.firstName} {sub.lastName || ''}</td>
                                                                <td className="px-4 py-3 text-sm lowercase text-gray-500">{sub.email}</td>
                                                                <td className="px-4 py-3 text-sm">{sub.phone}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${sub.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                                                        {sub.isActive ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-right text-gray-400">
                                                                    {new Date(sub.createdAt).toLocaleDateString('en-GB')}
                                                                </td>
                                                            </tr>
                                                        ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-24 text-center text-gray-400">
                                                            <div className="text-5xl mb-6 opacity-20">👥</div>
                                                            <p className="text-sm font-bold tracking-widest uppercase">No sub-members found</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {showDocModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1b5e20] px-10 py-8 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-black tracking-tight tracking-widest">Compliance audit records</h3>
                                <p className="text-[10px] font-black text-white/60 tracking-wider mt-1">Found {selectedUser?.businessDocuments?.length || 0} assets for {selectedUser?.name}</p>
                            </div>
                            <button onClick={() => setShowDocModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all">✕</button>
                        </div>

                        <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {selectedUser?.businessDocuments?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-8">
                                    {selectedUser.businessDocuments.map((doc: string, idx: number) => {
                                        const isPdf = doc.toLowerCase().endsWith('.pdf');
                                        const docUrl = `${ASSETS_BASE_URL}${doc}`;
                                        return (
                                            <div key={idx} className="group relative bg-gray-50 rounded-3xl border border-gray-100 p-8 flex flex-col items-center justify-center gap-6 hover:shadow-2xl transition-all hover:bg-white">
                                                <div className="text-6xl group-hover:scale-110 transition-transform">
                                                    {isPdf ? '📄' : '🖼️'}
                                                </div>
                                                <div className="text-center font-black">
                                                    <p className="text-[9px] text-gray-400 tracking-wider">Compliance asset #{idx + 1}</p>
                                                    <p className="text-xs text-gray-900 mt-2 truncate max-w-[200px] italic">{doc.split('/').pop()}</p>
                                                </div>
                                                <a
                                                    href={docUrl}
                                                    target="_blank"
                                                    className="w-full text-center py-3 bg-white text-[#1b5e20] text-[9px] font-black tracking-[0.3em] rounded-2xl border border-green-100 shadow-sm hover:bg-[#1b5e20] hover:text-white transition-all shadow-emerald-900/5 group-hover:shadow-xl group-hover:shadow-emerald-900/10"
                                                >
                                                    Inspect Asset
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-20 text-center tracking-wider">
                                    <div className="text-6xl mb-6 opacity-20">📂</div>
                                    <p className="text-sm font-black text-gray-400">Zero compliance assets archived</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-100 flex justify-end gap-4">
                            <button onClick={() => setShowDocModal(false)} className="px-12 py-4 bg-gray-900 text-white text-[10px] font-black tracking-wider rounded-2xl hover:bg-black transition-all shadow-2xl active:scale-95">Safe exit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Reason Modal */}
            {showRejectionModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-rose-600 px-10 py-8 text-white font-serif">
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                                <span className="text-2xl">🚫</span> Deny protocol
                            </h3>
                            <p className="text-[10px] font-black text-white/70 tracking-wider mt-2 italic font-sans">Authority check required</p>
                        </div>

                        <div className="p-10 space-y-8 font-sans">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 tracking-wider ml-1">
                                    Restriction rationale <span className="opacity-30 italic font-medium lowercase">(Explain refusal)</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Briefly state compliance failure points..."
                                    className="w-full h-40 bg-gray-50 border border-gray-100 rounded-3xl p-6 text-sm font-bold text-gray-700 placeholder:text-gray-300 outline-none focus:border-rose-500 focus:bg-white transition-all shadow-inner resize-none tracking-tight"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setShowRejectionModal(false);
                                        setProcessingUserId(null);
                                        setRejectionReason("");
                                    }}
                                    className="px-6 py-4 bg-gray-100 text-gray-500 text-[10px] font-black tracking-wider rounded-2xl hover:bg-gray-200 transition-all active:scale-95 shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (processingUserId) {
                                            handleAction(processingUserId, 'rejected', rejectionReason);
                                        }
                                    }}
                                    className="px-6 py-4 bg-rose-600 text-white text-[10px] font-black tracking-wider rounded-2xl hover:bg-rose-700 transition-all shadow-2xl shadow-rose-900/30 active:scale-95"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; background-clip: content-box; }
            `}</style>
        </AdminPortalContainer>
    );
}
