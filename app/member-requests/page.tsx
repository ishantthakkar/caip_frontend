"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

export default function MemberRequestsPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('0'); // Default to Pending
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showDocModal, setShowDocModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []));
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsers([]);
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

    const filteredUsers = useMemo(() => {
        if (!Array.isArray(users)) return [];
        return users.filter(user => {
            const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm);
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
        <AdminPortalContainer title="Request For Approval">
            <div className="space-y-12">
                <div className="space-y-6">
                    {/* Search and Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                            <div className="lg:col-span-3 space-y-1.5">
                                <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Request Type</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="0">Pending Requests</option>
                                    <option value="2">Rejected Requests</option>
                                    <option value="all">All Records</option>
                                </select>
                            </div>

                            <div className="lg:col-span-3 space-y-1.5">
                                <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Range</label>
                                <select className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all cursor-pointer">
                                    <option value="">Select Range</option>
                                    <option value="all">All</option>
                                </select>
                            </div>

                            <div className="lg:col-span-6 space-y-1.5">
                                <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Search Members</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by name, email or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-10 pr-4 py-2 text-[15px] font-normal text-black placeholder-gray-400 outline-none focus:border-[#1b5e20] transition-all"
                                    />
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            <h3 className="text-sm font-bold tracking-tight">Member Requests List</h3>
                        </div>

                        <div className="p-4 md:p-5">
                            <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                                <div className="overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[1800px]">
                                        <thead className="sticky top-0 z-10 bg-[#051a02] text-white">
                                            <tr className="divide-x divide-white/5">
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Member Id</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Company Name</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Name</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Email</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Phone</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">State</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">District</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">Sub District</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight">City/Town/Village</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Status</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Type</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Joined On</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Docs</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">View</th>
                                                <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={14} className="py-24 text-center">
                                                        <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                        <p className="text-sm font-medium text-gray-500 animate-pulse">Loading Member Requests...</p>
                                                    </td>
                                                </tr>
                                            ) : paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                                                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-[12px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                                                            {user.memberId || 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-900">{user.companyName || '-'}</td>

                                                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-900">{user.name}</td>
                                                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-600">{user.email}</td>
                                                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{user.phone}</td>
                                                    <td className="px-4 py-3.5 text-[14px] font-normal text-[#1b5e20]">{user.state || '-'}</td>
                                                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{user.district || '-'}</td>
                                                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{user.subDistrict || '-'}</td>
                                                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-700">{user.city || '-'}</td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md inline-block min-w-[90px] ${user.status === '0' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                            user.status === '1' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                                'bg-red-100 text-red-700 border border-red-200'
                                                            }`}>
                                                            {user.status === '0' ? 'PENDING' : user.status === '1' ? 'APPROVED' : 'REJECTED'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center text-[13px] font-normal text-gray-600">Member</td>
                                                    <td className="px-4 py-3.5 text-center text-[13px] font-normal text-gray-600 whitespace-nowrap">
                                                        {new Date(user.createdAt).toLocaleDateString('en-GB')}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <button
                                                            onClick={() => { setSelectedUser(user); setShowDocModal(true); }}
                                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm active:scale-95"
                                                            title="View Documents"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <button
                                                            onClick={() => { setSelectedUser(user); setShowDetailsModal(true); }}
                                                            className="px-3 py-1.5 bg-gray-50 text-gray-700 text-[12px] font-medium rounded-lg hover:bg-[#1b5e20] hover:text-white transition-all border border-gray-200 shadow-sm active:scale-95"
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex justify-end gap-2 items-center">
                                                            {user.status === '0' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleAction(user._id, 'rejected')}
                                                                        className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm active:scale-95"
                                                                        title="Reject"
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleAction(user._id, 'approved')}
                                                                        className="p-2 bg-[#1b5e20] text-white rounded-lg hover:bg-black transition-all shadow-sm active:scale-95"
                                                                        title="Approve"
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={14} className="py-32 text-center text-gray-400">
                                                        <p className="text-sm font-medium tracking-widest">No Requests Found</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {!loading && filteredUsers.length > 0 && (
                                    <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-white">
                                        <span className="text-[12px] font-medium text-gray-500">
                                            Showing <span className="font-bold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-bold text-gray-900">{filteredUsers.length}</span> requests
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                                            >
                                                Previous
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: totalPages }).map((_, idx) => (
                                                    <button
                                                        key={idx + 1}
                                                        onClick={() => setCurrentPage(idx + 1)}
                                                        className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all ${currentPage === idx + 1 ? 'bg-[#1b5e20] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        {idx + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Preview Modal */}
            {showDocModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="bg-[#1b5e20] px-6 py-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                <h3 className="text-lg font-bold tracking-tight">Business Documents</h3>
                            </div>
                            <button onClick={() => setShowDocModal(false)} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all cursor-pointer">✕</button>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar bg-gray-50/50">
                            {selectedUser?.businessDocuments?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {selectedUser.businessDocuments.map((doc: string, idx: number) => {
                                        const isPdf = doc.toLowerCase().endsWith('.pdf');
                                        const docUrl = `${ASSETS_BASE_URL}uploads/${doc}`;
                                        return (
                                            <a
                                                key={idx}
                                                href={docUrl}
                                                target="_blank"
                                                className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-[#1b5e20] transition-all group shadow-sm"
                                            >
                                                <div className={`w-12 h-12 rounded flex items-center justify-center text-xl ${isPdf ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                                    {isPdf ? '📄' : '🖼️'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[12px] font-normal text-black truncate uppercase">DOCUMENT_{idx + 1}</p>
                                                    <p className="text-[10px] font-medium text-gray-400 capitalize group-hover:text-[#1b5e20]">View File →</p>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-white border-2 border-dashed border-gray-100 rounded-xl">
                                    <p className="text-[14px] font-medium text-gray-400 capitalize">No documents uploaded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* View Member Details Modal */}
            {showDetailsModal && selectedUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="bg-[#1b5e20] px-6 py-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">👤</div>
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight">{selectedUser.name}</h3>
                                    <p className="text-[11px] font-medium text-white/60 capitalize mt-0.5">Member ID: {selectedUser.memberId || 'Pending Approval'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all cursor-pointer">✕</button>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8 bg-gray-50/50">
                            {/* Section 1: Entity Details */}
                            <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="text-[13px] font-semibold text-gray-500 capitalize tracking-tight mb-6 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-[#1b5e20] rounded-full"></span> Company Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <DetailItem label="Industry" value={selectedUser.industry} />
                                    <DetailItem label="Company Name" value={selectedUser.companyName} />
                                    <DetailItem label="Company Email" value={selectedUser.companyEmail} />
                                    <DetailItem label="GST" value={selectedUser.gst} />
                                    <DetailItem label="CIN Number" value={selectedUser.cinNumber} />
                                    <DetailItem label="Register Date" value={new Date(selectedUser.createdAt).toLocaleDateString('en-GB')} />
                                </div>
                            </section>

                            {/* Section 2: Primary Member Details */}
                            <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="text-[13px] font-semibold text-gray-500 capitalize tracking-tight mb-6 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-[#1b5e20] rounded-full"></span> Member Info
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <DetailItem label="Full Name" value={selectedUser.name} />
                                    <DetailItem label="Email Address" value={selectedUser.email} />
                                    <DetailItem label="Pan" value={selectedUser.pan} />
                                    <DetailItem label="Contact Number" value={selectedUser.phone} />
                                    <DetailItem label="Alt Contact Number" value={selectedUser.alternateContactNumber} />
                                    <DetailItem label="Membership Status" value={selectedUser.status === '1' ? 'ACTIVE' : selectedUser.status === '2' ? 'REJECTED' : 'PENDING'} isBadge status={selectedUser.status} />
                                </div>
                            </section>

                            {/* Section 3: Geographic Location */}
                            <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="text-[13px] font-semibold text-gray-500 capitalize tracking-tight mb-6 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-[#1b5e20] rounded-full"></span> Location
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <DetailItem label="State" value={selectedUser.state} />
                                    <DetailItem label="District" value={selectedUser.district} />
                                    <DetailItem label="Sub District" value={selectedUser.subDistrict} />
                                    <DetailItem label="City" value={selectedUser.city} />
                                    <DetailItem label="Pin Code" value={selectedUser.pinCode} />
                                    <div className="col-span-full">
                                        <DetailItem label="Registered Address" value={selectedUser.businessAddress} />
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-white flex justify-end">
                            <button onClick={() => setShowDetailsModal(false)} className="px-8 py-2 bg-gray-900 text-white text-[12px] font-bold rounded-lg hover:bg-black transition-all shadow-lg active:scale-95">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Reason Modal */}
            {showRejectionModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-rose-600 px-6 py-4 text-white">
                            <h3 className="text-lg font-bold tracking-tight flex items-center gap-3">
                                <span>🚫</span> Rejection Reason
                            </h3>
                        </div>

                        <div className="p-6 md:p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-gray-500 capitalize ml-1">
                                    Reason for rejection
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Briefly describe the reason for rejection..."
                                    className="w-full h-32 bg-gray-50 border border-gray-100 rounded-lg p-4 text-[15px] font-normal text-gray-700 placeholder:text-gray-400 outline-none focus:border-rose-500 transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setShowRejectionModal(false);
                                        setProcessingUserId(null);
                                        setRejectionReason("");
                                    }}
                                    className="px-6 py-2.5 bg-gray-100 text-gray-600 text-[12px] font-bold rounded-lg hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (processingUserId) {
                                            handleAction(processingUserId, 'rejected', rejectionReason);
                                        }
                                    }}
                                    className="px-6 py-2.5 bg-rose-600 text-white text-[12px] font-bold rounded-lg hover:bg-rose-700 transition-all shadow-md active:scale-95"
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminPortalContainer>
    );
}

const DetailItem = ({ label, value, isBadge = false, status = '0' }: { label: string, value: any, isBadge?: boolean, status?: string }) => (
    <div className="flex items-start gap-4 py-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]/20 mt-1.5 flex-shrink-0" />
        <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-500 capitalize tracking-tight leading-none mb-1.5">{label}</p>
            {isBadge ? (
                <span className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${status === '1' ? 'bg-green-100 text-green-700' : status === '2' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {value || '-'}
                </span>
            ) : (
                <p className="text-[15px] font-normal text-black break-words leading-tight">{value || '-'}</p>
            )}
        </div>
    </div>
);
