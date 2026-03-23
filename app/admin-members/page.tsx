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
            <div className="space-y-12">

                {/* Member Listing Table */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Members List</h2>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-80">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, city..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-green-600 text-sm shadow-sm transition-all"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[1800px]">
                                <thead className="bg-agri-green-primary text-white sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Member ID</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Defaulter</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Name</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Email</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Phone</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Company Name</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Membership Type</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Membership Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Expiry Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Searches</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Sub-Member</th>
                                        <th className="px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/90 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={13} className="py-24 text-center">
                                                <div className="animate-spin h-8 w-8 border-4 border-agri-green-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                                <p className="text-sm font-bold text-gray-400 animate-pulse tracking-widest uppercase">Loading records...</p>
                                            </td>
                                        </tr>
                                    ) : paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-5 text-sm">
                                                {user.memberId || user._id?.slice(-8).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-5">
                                                <button
                                                    onClick={() => fetchUserDefaulters(user)}
                                                    className="text-[#1F58C7] hover:text-green-700 text-xs font-bold underline decoration-1 underline-offset-4 transition-colors"
                                                >
                                                    View Defaulters
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-900">{user.name}</td>
                                            <td className="px-6 py-5 text-xs lowercase text-gray-500">{user.email}</td>
                                            <td className="px-6 py-5 text-sm">{user.phone}</td>
                                            <td className="px-6 py-5 text-sm">{user.companyName || '-'}</td>
                                            <td className="px-6 py-5">
                                                <span className="px-2.5 py-1 bg-green-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md border border-green-100">
                                                    Standard Membership
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${user.status === '1' ? 'bg-green-50 text-emerald-700 border-green-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {user.status === '1' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-400">{user.membershipExpiry || '12/05/2026'}</td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${user.status === '1' ? 'bg-green-50 text-emerald-700 border-green-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {user.status === '1' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-center">{user.searches || '0'}</td>
                                            <td className="px-6 py-5">
                                                <button
                                                    onClick={() => fetchSubMembers(user)}
                                                    className="text-[#1F58C7] hover:text-green-700 text-xs font-bold underline decoration-1 underline-offset-4 transition-colors"
                                                >
                                                    View
                                                </button>
                                            </td>
                                            <td className="px-10 py-5 text-right right-0 bg-white group-hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleAction(user._id, user.status === '1' ? 'rejected' : 'approved')}
                                                        className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-2 ${user.status === '1'
                                                            ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white'
                                                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white'}`}
                                                    >
                                                        {user.status === '1' ? (
                                                            <>🚫 Deactivate</>
                                                        ) : (
                                                            <>✅ Activate</>
                                                        )}
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
                                                    className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${currentPage === pageNum ? 'bg-agri-green-primary text-white shadow-md' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'}`}
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-agri-green-primary px-10 py-8 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-black tracking-tight tracking-widest">Member's defaulters</h3>
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
                                    <div className="animate-spin h-10 w-10 border-4 border-agri-green-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-sm font-black text-gray-400 tracking-wider animate-pulse">Loading records...</p>
                                </div>
                            ) : selectedUserDefaulters.length > 0 ? (
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="text-[10px] font-black text-black-400 tracking-[0.2em]">
                                            <th className="px-6 py-2 font-black">Defaulter Company</th>
                                            <th className="px-6 py-2 font-black">Defaulted Amount</th>
                                            <th className="px-6 py-2 font-black">Recovered</th>
                                            <th className="px-6 py-2 font-black">Approval Status</th>
                                            <th className="px-6 py-2 text-right font-black">Date Reported</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-black text-gray-700">
                                        {selectedUserDefaulters.map((report) => (
                                            <tr key={report._id} className="bg-gray-50/50 hover:bg-gray-50 transition-all rounded-2xl shadow-sm">
                                                <td className="px-6 py-5 rounded-l-2xl">
                                                    <p className="text-sm">{report.defaulter_name}</p>
                                                    <p className="text-[9px] text-[#000] tracking-wider mt-0.5">{report.industry || 'General'}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm text-[#000]">₹ {report.default_amount?.toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm text-[#000]">₹ {(report.default_amount - (report.outstanding_amount || 0)).toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] border font-black ${report.status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                        {report.status === 1 ? 'Approved' : 'Pending Approval'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right rounded-r-2xl text-xs text-gray-400">
                                                    {new Date(report.createdAt).toLocaleDateString('en-GB')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-24 text-center">
                                    <div className="text-5xl mb-6 opacity-20">🛡️</div>
                                    <p className="text-sm font-black text-gray-400 tracking-wider">Zero infractions recorded</p>
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

            {/* Sub-Member Modal */}
            {showSubModal && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-agri-green-primary px-10 py-8 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-black tracking-tight tracking-widest">Sub-member registry</h3>
                                <p className="text-[10px] font-black text-white/60 tracking-wider mt-1">Found {selectedSubMembers.length} linked accounts for {selectedUser?.name}</p>
                            </div>
                            <button
                                onClick={() => setShowSubModal(false)}
                                className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {subModalLoading ? (
                                <div className="py-24 text-center">
                                    <div className="animate-spin h-10 w-10 border-4 border-agri-green-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-sm font-black text-gray-400 tracking-wider animate-pulse">Retrieving entities...</p>
                                </div>
                            ) : selectedSubMembers.length > 0 ? (
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-400 tracking-[0.2em]">
                                            <th className="px-6 py-2">Name</th>
                                            <th className="px-6 py-2">Email</th>
                                            <th className="px-6 py-2">Phone</th>
                                            <th className="px-6 py-2">Status</th>
                                            <th className="px-6 py-2 text-right">Registered On</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-black text-gray-700">
                                        {selectedSubMembers.map((sub) => (
                                            <tr key={sub._id} className="bg-gray-50/50 hover:bg-gray-50 transition-all rounded-2xl shadow-sm italic">
                                                <td className="px-6 py-5 rounded-l-2xl">
                                                    <p className="text-sm">{sub.firstName} {sub.lastName || ''}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-xs lowercase">{sub.email}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-xs">{sub.phone}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] border font-black ${sub.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                                        {sub.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right rounded-r-2xl text-xs text-gray-400">
                                                    {new Date(sub.createdAt).toLocaleDateString('en-GB')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-24 text-center">
                                    <div className="text-5xl mb-6 opacity-20">👥</div>
                                    <p className="text-sm font-black text-gray-400 tracking-wider">No linked sub-members found</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowSubModal(false)}
                                className="px-12 py-4 bg-gray-900 text-white text-[10px] font-black tracking-wider rounded-2xl hover:bg-black transition-all shadow-2xl active:scale-95"
                            >
                                Close ledger
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {showDocModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-agri-green-primary px-10 py-8 flex justify-between items-center text-white">
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
                                                    className="w-full text-center py-3 bg-white text-agri-green-primary text-[9px] font-black tracking-[0.3em] rounded-2xl border border-green-100 shadow-sm hover:bg-agri-green-primary hover:text-white transition-all shadow-emerald-900/5 group-hover:shadow-xl group-hover:shadow-emerald-900/10"
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

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; background-clip: content-box; }
            `}</style>
        </AdminPortalContainer>
    );
}
