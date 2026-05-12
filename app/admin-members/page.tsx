"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

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
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showSubModal, setShowSubModal] = useState(false);
    const [selectedSubMembers, setSelectedSubMembers] = useState<any[]>([]);
    const [subModalLoading, setSubModalLoading] = useState(false);
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

    const handleAction = async (userId: string, targetAction: string) => {
        const isActivating = targetAction === 'approved';
        const status = isActivating ? 1 : 2;

        const result = await Swal.fire({
            title: isActivating ? 'Activate Member?' : 'Deactivate Member?',
            text: isActivating 
                ? 'This will restore full access for the member. Proceed?' 
                : 'This will immediately suspend the member\'s access to all features. Proceed?',
            icon: isActivating ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonColor: isActivating ? '#1b5e20' : '#d33',
            cancelButtonColor: '#475569',
            confirmButtonText: isActivating ? 'Yes, Activate' : 'Yes, Deactivate',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}user/change-staus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    userId, 
                    status, 
                    rejectionReason: isActivating ? "" : "Account deactivated by administrator." 
                }),
            });

            if (response.ok) {
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: status.toString() } : u));
                Swal.fire({
                    icon: 'success',
                    title: isActivating ? 'Success' : 'Suspended',
                    text: isActivating ? 'Member has been activated.' : 'Member has been deactivated.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                const errorData = await response.json();
                Swal.fire('Error', errorData.msg || 'Action failed', 'error');
            }
        } catch (error) {
            console.error("Error updating status:", error);
            Swal.fire('Error', 'An error occurred while updating the status.', 'error');
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

    const handleExportDefaultersPDF = async () => {
        try {
            const filteredDefaulters = selectedUserDefaulters.filter(r =>
                r.defaulter_name?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                r.gst_number?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                r.pan_number?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                r.mobile?.includes(modalSearchTerm)
            );

            if (filteredDefaulters.length === 0) {
                Swal.fire({
                    title: "No Data",
                    text: "There are no records to export.",
                    icon: "info",
                    confirmButtonColor: "#1b5e20"
                });
                return;
            }

            const doc = new jsPDF('landscape');
            const adminData = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const adminName = adminData.name || 'Administrator';
            const adminId = adminData.id || adminData._id?.slice(-8).toUpperCase() || 'ADMIN';
            const adminEmail = adminData.email || 'N/A';

            // Header Texts
            doc.setFontSize(22);
            doc.setTextColor(27, 94, 32);
            doc.text(`Defaulter Report - ${selectedUser?.name || 'Member Detail'}`, 14, 22);

            // Audit details
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated By: ${adminName} (${adminEmail})`, 14, 32);
            doc.text(`Total Records: ${filteredDefaulters.length}`, 14, 38);
            doc.text(`Exported On: ${new Date().toLocaleString('en-GB')}`, 14, 44);

            // Generate Table
            const tableColumn = [
                "Sr.",
                "Date",
                "Defaulter Firm",
                "Mobile",
                "GST/PAN/CIN",
                "Location",
                "Default Amount",
                "Outstanding",
                "Recovery",
                "Status"
            ];

            const tableRows = filteredDefaulters.map((def, idx) => {
                const dAmount = Number(def.default_amount || 0);
                const oAmount = Number(def.outstanding_amount ?? def.default_amount ?? 0);
                const rAmount = dAmount - oAmount;

                let paymentStatus = 'Not Paid';
                if (oAmount === 0) paymentStatus = 'Full Paid';
                else if (rAmount > 0) paymentStatus = 'Partial Paid';

                return [
                    idx + 1,
                    def.date_of_default ? new Date(def.date_of_default).toLocaleDateString('en-GB') : '-',
                    def.defaulter_name || '-',
                    def.mobile_number || '-',
                    `${def.gst_number || '-'}\n${def.pan_number || '-'}\n${def.cin_number || '-'}`,
                    `${def.state || '-'}\n${def.district || '-'}\n${def.city || '-'}`,
                    `Rs. ${dAmount.toLocaleString('en-IN')}`,
                    `Rs. ${oAmount.toLocaleString('en-IN')}`,
                    `Rs. ${rAmount.toLocaleString('en-IN')}`,
                    paymentStatus
                ];
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 52,
                theme: 'grid',
                headStyles: { fillColor: [27, 94, 32], textColor: 255, fontSize: 7 },
                styles: { fontSize: 7, cellPadding: 2 },
                columnStyles: {
                    0: { cellWidth: 8 },
                    1: { cellWidth: 20 },
                    4: { cellWidth: 35 },
                    9: { cellWidth: 20 }
                },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                didDrawPage: (data) => {
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();

                    // BACKGROUND WATERMARKS
                    doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
                    doc.setFontSize(14);
                    doc.setTextColor(200, 0, 0);

                    const watermarkText = `${adminName.toUpperCase()} | ${adminEmail} | ADMIN AUDIT`;
                    const angle = 45;
                    const stepX = 120;
                    const stepY = 120;

                    for (let x = -50; x < pageWidth + 100; x += stepX) {
                        for (let y = -50; y < pageHeight + 100; y += stepY) {
                            doc.text(watermarkText, x, y, { angle });
                        }
                    }

                    doc.setGState(new (doc as any).GState({ opacity: 1 }));

                    // FOOTER
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text("© CAIP Administrative Platform | Member Defaulters Internal Use Only", 14, pageHeight - 10);
                    doc.text(`Page ${data.pageNumber}`, pageWidth - 25, pageHeight - 10);
                }
            });

            doc.save(`Defaulters_${selectedUser?.name?.replace(/\s+/g, '_') || 'Member'}_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (err) {
            console.error("PDF Export Error: ", err);
            Swal.fire({
                title: "Export Failed",
                text: "An error occurred while generating the PDF.",
                icon: "error",
                confirmButtonColor: "#1b5e20"
            });
        }
    };

    const getMembershipStatus = (user: any) => {
        if (user.status === '2') return 'Rejected'; // Admins might still want to see 'Rejected'
        if (!user.membership_status || user.membership_status === '0') return 'Payment Pending';
        if (user.membershipExpiry === 'Lifetime') return 'Active';
        if (!user.membershipExpiry || user.membershipExpiry === 'N/A') return 'Payment Pending';

        const expiryDate = new Date(user.membershipExpiry);
        if (expiryDate < new Date()) return 'Expired';

        return 'Active';
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

            const mStatus = getMembershipStatus(user);

            const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm) ||
                user.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || mStatus === statusFilter;
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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            <h3 className="text-[16px] font-semibold tracking-tight">Members List</h3>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-4 flex-1 md:max-w-2xl">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Search by name, company, email, city..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-9 pr-4 text-sm font-medium text-white placeholder-white/40 outline-none focus:bg-white focus:text-black focus:border-white transition-all shadow-sm"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" x2="11" y2="11" /></svg>
                                </span>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-sm font-medium text-white outline-none focus:bg-white focus:text-black transition-all cursor-pointer"
                            >
                                <option value="all" className="text-black">All Status</option>
                                <option value="Active" className="text-black">Active</option>
                                <option value="Expired" className="text-black">Expired</option>
                                <option value="Payment Pending" className="text-black">Payment Pending</option>
                                <option value="Rejected" className="text-black">Rejected</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 md:p-5">
                        <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[1800px]">
                                    <thead className="bg-[#051a02] text-white sticky top-0 z-10">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Member ID</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Company Name</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Membership Status</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Member Name</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Contact No</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Email</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Searches</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Defaulters Added</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Actions</th>
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
                                                <td className="px-4 py-3 text-sm font-bold text-gray-900 capitalize">
                                                    {user.memberId || user._id?.slice(-8).toUpperCase()}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-700">{user.companyName || '-'}</td>
                                                <td className="px-4 py-3">
                                                    {(() => {
                                                        const mStatus = getMembershipStatus(user);
                                                        let colorClass = "";
                                                        if (mStatus === 'Active') colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                                        else if (mStatus === 'Expired') colorClass = "bg-rose-50 text-rose-700 border-rose-100";
                                                        else if (mStatus === 'Payment Pending') colorClass = "bg-amber-50 text-amber-700 border-amber-100";
                                                        else colorClass = "bg-gray-50 text-gray-500 border-gray-100";

                                                        return (
                                                            <span className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-tight border ${colorClass}`}>
                                                                {mStatus}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-700">{user.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 font-mono">{user.phone}</td>
                                                <td className="px-4 py-3 text-sm lowercase text-gray-400 font-medium">{user.email}</td>
                                                <td className="px-4 py-3 text-sm text-center font-bold text-[#1b5e20]">{user.searches || '0'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => fetchUserDefaulters(user)}
                                                        className="text-blue-600 hover:text-blue-800 text-[12px] font-bold uppercase tracking-tight transition-colors cursor-pointer"
                                                    >
                                                        View List
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-3 items-center">
                                                        {/* View Profile */}
                                                        <button
                                                            onClick={() => { setSelectedUser(user); setShowDetailsModal(true); }}
                                                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-[#1b5e20] hover:text-white transition-all border border-gray-200 shadow-sm active:scale-95"
                                                            title="View Full Profile"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                        </button>

                                                        {/* View Documents */}
                                                        <button
                                                            onClick={() => { setSelectedUser(user); setShowDocModal(true); }}
                                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm active:scale-95"
                                                            title="Business Documents"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                        </button>

                                                        {/* Active/Inactive Toggle */}
                                                        <div
                                                            onClick={() => handleAction(user._id, user.status === '1' ? 'rejected' : 'approved')}
                                                            className={`relative inline-flex h-5 w-10 items-center rounded-full cursor-pointer transition-colors duration-200 outline-none ${user.status === '1' ? 'bg-[#1b5e20]' : 'bg-gray-300'}`}
                                                            title={user.status === '1' ? 'Deactivate Member' : 'Activate Member'}
                                                        >
                                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm ${user.status === '1' ? 'translate-x-5.5' : 'translate-x-1'}`} />
                                                        </div>
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
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
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
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" x2="11" y2="11" /></svg>
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleExportDefaultersPDF}
                                        className="h-10 bg-white text-rose-600 px-4 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-rose-50 transition-all shrink-0 shadow-sm active:scale-95"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" /></svg>
                                        Export List
                                    </button>
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
                                                        <th className="px-4 py-3 text-sm font-semibold tracking-tight">CIN</th>
                                                        <th className="px-4 py-3 text-sm font-semibold tracking-tight">State</th>
                                                        <th className="px-4 py-3 text-sm font-semibold tracking-tight">District</th>
                                                        <th className="px-4 py-3 text-sm font-semibold tracking-tight">Sub District</th>
                                                        <th className="px-4 py-3 text-sm font-semibold tracking-tight">City/Town/Village</th>
                                                        <th className="px-4 py-3 text-sm font-semibold tracking-tight">Type of Defaulter</th>
                                                        <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Financial Year</th>
                                                        <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Default Amount</th>
                                                        <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Outstanding Amount</th>
                                                        <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Recovery Amount</th>
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
                                                                    <td className="px-4 py-3 text-sm">{report.mobile_number || '-'}</td>
                                                                    <td className="px-4 py-3 text-sm lowercase">{report.email_id || '-'}</td>
                                                                    <td className="px-4 py-3 text-sm font-mono">{report.gst_number || '-'}</td>
                                                                    <td className="px-4 py-3 text-sm font-mono">{report.cin_number || '-'}</td>
                                                                    <td className="px-4 py-3 text-sm">{report.state || '-'}</td>
                                                                    <td className="px-4 py-3 text-sm">{report.district || '-'}</td>
                                                                    <td className="px-4 py-3 text-sm">{report.cities || '-'}</td>
                                                                    <td className="px-4 py-3 text-sm">{report.city || '-'}</td>
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
                                                                    <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600">
                                                                        ₹ {(Number(report.default_amount || 0) - Number(report.outstanding_amount ?? report.default_amount ?? 0)).toLocaleString()}
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
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
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
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                            <div className="bg-[#1b5e20] px-6 py-4 flex justify-between items-center text-white">
                                <div className="flex items-center gap-3">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    <h3 className="text-lg font-bold tracking-tight">Business Documents</h3>
                                </div>
                                <button onClick={() => setShowDocModal(false)} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all cursor-pointer">✕</button>
                            </div>

                            <div className="px-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Aadhar Number</p>
                                        <p className="text-sm font-bold text-gray-800">{selectedUser?.aadhar || 'N/A'}</p>
                                    </div>
                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">🆔</div>
                                </div>
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">PAN Number</p>
                                        <p className="text-sm font-bold text-gray-800">{selectedUser?.pan || 'N/A'}</p>
                                    </div>
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">💳</div>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar bg-gray-50/50">
                                {selectedUser?.businessDocuments?.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {selectedUser.businessDocuments.map((doc: string, idx: number) => {
                                            const isPdf = doc.toLowerCase().endsWith('.pdf');
                                            const docUrl = `${ASSETS_BASE_URL}uploads/${doc}`;
                                            const getDocLabel = (fname: string) => {
                                                const lowerName = fname.toLowerCase();
                                                if (lowerName.includes('mfglicence')) return 'MFG Licence';
                                                if (lowerName.includes('gstcertificate')) return 'GST Certificate';
                                                if (lowerName.includes('aadharcard')) return 'Aadhar Card';
                                                if (lowerName.includes('pancard')) return 'PAN Card';
                                                if (lowerName.includes('seedcertificate')) return 'Seed Certificate';
                                                return `Document ${idx + 1}`;
                                            };

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
                                                        <p className="text-[12px] font-bold text-black truncate uppercase">{getDocLabel(doc)}</p>
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
                                        <DetailItem label="Company Name" value={selectedUser.companyName} />
                                        <DetailItem label="Industry" value={selectedUser.industry} />
                                        <DetailItem label="GST" value={selectedUser.gst} />
                                        <DetailItem label="PAN" value={selectedUser.pan} />
                                        <DetailItem label="CIN" value={selectedUser.cinNumber} />
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
                                        <DetailItem label="Aadhar" value={selectedUser.aadhar} />
                                        <DetailItem label="Contact Number" value={selectedUser.phone} />
                                        <DetailItem label="Company Email" value={selectedUser.companyEmail} />
                                        <DetailItem label="Alt Contact Number" value={selectedUser.alternateContactNumber} />
                                        <DetailItem
                                            label="Membership Status"
                                            value={getMembershipStatus(selectedUser)}
                                            isBadge
                                            status={getMembershipStatus(selectedUser) === 'Active' ? '1' : getMembershipStatus(selectedUser) === 'Payment Pending' ? '0' : '2'}
                                        />
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

            </div>
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
