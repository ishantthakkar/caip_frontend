"use client";

import React, { useState, useEffect, useRef } from 'react';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';

interface Member {
    _id: string;
    name: string;
    memberId?: string;
    companyName?: string;
}

interface NotificationItem {
    _id: string;
    member_id: string;
    message_title: string;
    message_content: string;
    sending_time: string;
    createdAt: string;
}

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Filter and Pagination state
    const [tableSearch, setTableSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Multi-select dropdown state for modal
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        message_title: '',
        message_content: '',
        sending_time: new Date().toLocaleDateString('en-CA') + 'T' + new Date().toLocaleTimeString('en-GB').slice(0, 5)
    });

    useEffect(() => {
        fetchData();
        fetchMembers();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}admin/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setNotifications(data.data || []);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setMembers(data.data || []);
        } catch (error) {
            console.error("Error fetching members:", error);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.message_title || !formData.message_content) {
            alert("Please fill in all required fields");
            return;
        }

        if (selectedMemberIds.length === 0) {
            alert("Please select at least one recipient");
            return;
        }

        setSending(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}admin/notification-create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    member_ids: selectedMemberIds,
                    message_title: formData.message_title,
                    message_content: formData.message_content,
                    sending_time: new Date(formData.sending_time).toISOString()
                })
            });

            if (res.ok) {
                alert("Notification dispatched successfully!");
                setFormData({
                    message_title: '',
                    message_content: '',
                    sending_time: new Date().toLocaleDateString('en-CA') + 'T' + new Date().toLocaleTimeString('en-GB').slice(0, 5)
                });
                setSelectedMemberIds([]);
                setShowModal(false);
                fetchData();
            } else {
                const data = await res.json();
                alert(data.msg || "Failed to send notification");
            }
        } catch (error) {
            console.error("Send error:", error);
            alert("Error connecting to server");
        } finally {
            setSending(false);
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.memberId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleMemberSelection = (id: string) => {
        if (id === 'All') {
            if (selectedMemberIds.includes('All')) {
                setSelectedMemberIds([]);
            } else {
                setSelectedMemberIds(['All']);
            }
            return;
        }

        setSelectedMemberIds(prev => {
            if (prev.includes('All')) {
                const allOtherIds = members.map(m => m._id).filter(mid => mid !== id);
                return allOtherIds;
            }

            if (prev.includes(id)) {
                return prev.filter(mid => mid !== id);
            } else {
                const newList = [...prev, id];
                if (newList.length === members.length && members.length > 0) {
                    return ['All'];
                }
                return newList;
            }
        });
    };

    const getSelectionText = () => {
        if (selectedMemberIds.includes('All')) return "-- All Members --";
        if (selectedMemberIds.length === 0) return "Select Members";
        if (selectedMemberIds.length === members.length) return "-- All Members --";
        if (selectedMemberIds.length === 1) {
            const m = members.find(m => m._id === selectedMemberIds[0]);
            return m ? `${m.memberId || 'MEM'} - ${m.name}` : "1 Member Selected";
        }
        return `${selectedMemberIds.length} Members Selected`;
    };

    const formatDateTime = (iso: string) => {
        const d = new Date(iso);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hString = String(hours).padStart(2, '0');
        return `${day}/${month}/${year} ${hString}:${minutes}${ampm}`;
    };

    // Table Filtering and Pagination Logic
    const filteredNotifications = notifications.filter(n =>
        n.message_title.toLowerCase().includes(tableSearch.toLowerCase()) ||
        n.message_content.toLowerCase().includes(tableSearch.toLowerCase())
    );

    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const paginatedNotifications = filteredNotifications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <AdminPortalContainer title="Notifications">
            <div className="space-y-8 animate-in fade-in duration-500">

                {/* High-Density Action Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
                        <div className="lg:col-span-8 space-y-1.5 flex flex-col">
                            <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Filter history</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Filter records by title or content snippet..."
                                    value={tableSearch}
                                    onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-10 pr-4 py-2.5 text-[15px] font-normal text-black placeholder-gray-400 outline-none focus:border-[#1b5e20] transition-all focus:bg-white shadow-sm"
                                />
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </div>
                        </div>

                        <div className="lg:col-span-4 flex justify-end">
                            <button
                                onClick={() => setShowModal(true)}
                                className="w-full lg:w-auto px-6 py-2.5 bg-[#1b5e20] text-white text-[13px] font-bold rounded-lg hover:bg-[#2e7d32] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                Add Notification
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" /><path d="m22 7-7.1 5a2.5 2.5 0 0 1-2.8 0L5 7" /></svg>
                        <h3 className="text-sm font-bold tracking-tight">Notifications List</h3>
                    </div>

                    <div className="p-4 md:p-5">
                        <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                            <div className="overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead className="sticky top-0 z-10 bg-[#051a02] text-white">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight w-16">#</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Recipient type</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Title</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Content</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Send time</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 border-b border-gray-50 bg-white">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="py-24 text-center">
                                                    <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                    <p className="text-sm font-medium text-gray-500 animate-pulse">Syncing Dispatch Logs...</p>
                                                </td>
                                            </tr>
                                        ) : paginatedNotifications.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-24 text-center text-gray-400">
                                                    <p className="text-sm font-medium tracking-widest uppercase italic">No announcements found</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedNotifications.map((n, idx) => (
                                                <tr key={n._id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="text-[14px] font-bold text-gray-400">
                                                            {(currentPage - 1) * itemsPerPage + idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {n.member_id === 'All' ? 'All Members' : 'Specific Members'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[14px] font-bold text-gray-900 tracking-tight">
                                                            {n.message_title}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-[13px] font-normal text-gray-500 max-w-sm truncate">
                                                            {n.message_content}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[13px] font-bold text-gray-600">
                                                            {formatDateTime(n.createdAt)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold tracking-tight uppercase border border-emerald-100">
                                                            SENT
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Pagination Footer */}
                    {!loading && filteredNotifications.length > itemsPerPage && (
                        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-white mt-auto">
                            <span className="text-[12px] font-medium text-gray-500">
                                Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Broadcast Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-[#051a02]/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        {/* Modal Header */}
                        <div className="bg-[#1b5e20] p-6 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 100 16 8 8 0 000-16zM13 7v2h-2V7h2zm0 4v6h-2v-6h2z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-[18px] font-bold tracking-tight relative z-10">Create Notification</h3>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all relative z-10"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSend} className="p-6 md:p-8 space-y-5">
                            {/* Member Selection Dropdown */}
                            <div className="space-y-1.5 flex flex-col" ref={dropdownRef}>
                                <label className="text-[13px] font-bold text-gray-700 ml-1">Dispatch Recipients <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] font-medium flex justify-between items-center cursor-pointer hover:border-[#1b5e20] transition-all shadow-sm"
                                    >
                                        <span className={selectedMemberIds.length > 0 ? "text-gray-900" : "text-gray-400"}>
                                            {getSelectionText()}
                                        </span>
                                        <svg className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>

                                    {isDropdownOpen && (
                                        <div className="absolute z-[110] left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-3 border-b border-gray-50 bg-gray-50/30">
                                                <input
                                                    type="text"
                                                    placeholder="Search member database..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    autoFocus
                                                    className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1b5e20] transition-all"
                                                />
                                            </div>
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                                                <label className="flex items-center gap-3 px-4 py-2 hover:bg-emerald-50 cursor-pointer transition-colors border-b border-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-gray-300 text-[#1b5e20] focus:ring-[#1b5e20] cursor-pointer"
                                                        checked={selectedMemberIds.includes('All')}
                                                        onChange={() => toggleMemberSelection('All')}
                                                    />
                                                    <span className="text-[13px] font-bold text-[#1b5e20]">Select All Members</span>
                                                </label>

                                                {filteredMembers.map(m => (
                                                    <label key={m._id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-gray-300 text-[#1b5e20] focus:ring-[#1b5e20] cursor-pointer"
                                                            checked={selectedMemberIds.includes(m._id) || selectedMemberIds.includes('All')}
                                                            onChange={() => toggleMemberSelection(m._id)}
                                                        />
                                                        <span className="text-[13px] text-gray-700 font-medium">
                                                            {m.memberId || 'MEM'} - {m.name} <span className="text-[11px] text-gray-400 font-normal">({m.companyName || 'N/A'})</span>
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[13px] font-bold text-gray-700 ml-1">Message Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter circular subject..."
                                    value={formData.message_title}
                                    onChange={(e) => setFormData({ ...formData, message_title: e.target.value })}
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-3 px-4 outline-none text-[14px] font-medium transition-all focus:border-[#1b5e20] focus:bg-white shadow-sm"
                                />
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[13px] font-bold text-gray-700 ml-1">Message Content <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={4}
                                    placeholder="Compose notification body..."
                                    value={formData.message_content}
                                    onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-3 px-4 outline-none text-[14px] font-medium transition-all focus:border-[#1b5e20] focus:bg-white shadow-sm resize-none leading-relaxed min-h-[120px]"
                                />
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[13px] font-bold text-gray-700 ml-1">Scheduled Dispatch Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.sending_time}
                                    onChange={(e) => setFormData({ ...formData, sending_time: e.target.value })}
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-3 px-4 outline-none text-[14px] font-medium transition-all focus:border-[#1b5e20] focus:bg-white shadow-sm"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="px-8 py-2.5 rounded-xl font-bold text-[13px] text-white bg-[#1b5e20] hover:bg-[#2e7d32] transition-colors shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {sending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Dispatching...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                            Send
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; background-clip: content-box; }
            `}</style>
        </AdminPortalContainer>
    );
}
