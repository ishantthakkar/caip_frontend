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
        <AdminPortalContainer title="Announcements & Notifications">
            <div className="space-y-6 max-w-7xl mx-auto pb-20 p-6">

                {/* Header Action Block */}
                <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-widest uppercase">Notification</h3>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-8 py-4 bg-[#1b5e20] text-white text-[10px] font-black tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-3"
                    >
                        <span className="text-lg">+</span> Add Notification
                    </button>
                </div>

                {/* Shared Filter Section */}
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Filter records by title or content..."
                            value={tableSearch}
                            onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-12 py-3 text-xs outline-none focus:border-green-600 transition-all font-bold tracking-tight"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-lg">🔍</span>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-center">
                            <thead className="bg-[#1b5e20] text-white">
                                <tr className="text-[11px] font-black tracking-widest text-white uppercase border-b border-gray-800">
                                    <th className="px-6 py-6 border-r border-[#ffffff20]">#</th>
                                    <th className="px-6 py-6 border-r border-[#ffffff20]">Recipient Type</th>
                                    <th className="px-6 py-6 border-r border-[#ffffff20]">Title</th>
                                    <th className="px-6 py-6 border-r border-[#ffffff20]">Content</th>
                                    <th className="px-6 py-6 border-r border-[#ffffff20]">Send Time</th>
                                    <th className="px-6 py-6 border-r border-[#ffffff20]">Status</th>
                                    <th className="px-6 py-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-40 text-center">
                                            <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase animate-pulse">Syncing Communication Log...</p>
                                        </td>
                                    </tr>
                                ) : paginatedNotifications.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-48 text-center text-gray-400">
                                            <div className="text-6xl mb-6 opacity-20">🛡️</div>
                                            <p className="text-[10px] font-black tracking-widest uppercase">No dispatch history located</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedNotifications.map((n, idx) => (
                                        <tr key={n._id} className="hover:bg-gray-50 transition-all border-b border-gray-50">
                                            <td className="px-6 py-5 text-[11px] text-gray-500 border-r border-gray-100 font-bold">
                                                {(currentPage - 1) * itemsPerPage + idx + 1}
                                            </td>
                                            <td className="px-6 py-5 text-[11px] border-r border-gray-100">
                                                <span className="font-bold text-gray-700">
                                                    {n.member_id === 'All' ? 'All Members' : 'Specific Members'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-[11px] border-r border-gray-100 italic font-bold text-gray-800">{n.message_title}</td>
                                            <td className="px-6 py-5 text-[11px] border-r border-gray-100 max-w-xs truncate text-gray-500">{n.message_content}</td>
                                            <td className="px-6 py-5 text-[11px] border-r border-gray-100 whitespace-nowrap text-gray-600 font-bold">{formatDateTime(n.createdAt)}</td>
                                            <td className="px-6 py-5 text-[11px] border-r border-gray-100 border-b-2 border-amber-600/10">
                                                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">sent</span>
                                            </td>
                                            <td className="px-6 py-5 text-[11px] italic text-gray-400 font-semibold uppercase tracking-tighter">Notification send</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {!loading && filteredNotifications.length > itemsPerPage && (
                        <div className="px-10 py-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                Page {currentPage} OF {totalPages} <span className="mx-2 opacity-30">•</span> {filteredNotifications.length} DISPATCH RECORDS
                            </span>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-6 py-2 bg-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-200 hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-400 active:scale-95 flex items-center gap-2"
                                >
                                    <span>←</span> Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-6 py-2 bg-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-200 hover:bg-[#1b5e20] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-400 active:scale-95 flex items-center gap-2"
                                >
                                    Next <span>→</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Broadcast Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1b5e20] px-10 py-8 flex justify-between items-center text-white border-b border-white/10">
                            <div>
                                <h3 className="text-xl font-black tracking-widest uppercase">Create Broadcast</h3>
                                <p className="text-[10px] font-black text-white/50 tracking-widest mt-1">SECURE DISPATCH PROTOCOL</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all">✕</button>
                        </div>

                        <form onSubmit={handleSend} className="p-10 space-y-6">
                            {/* Member Selection Dropdown */}
                            <div className="space-y-1.5" ref={dropdownRef}>
                                <label className="text-[13px] font-bold text-gray-700 tracking-tight">Members <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm flex justify-between items-center cursor-pointer hover:border-gray-300 shadow-sm transition-all"
                                    >
                                        <span className={selectedMemberIds.length > 0 ? "text-gray-900 font-semibold" : "text-gray-300"}>
                                            {getSelectionText()}
                                        </span>
                                        <span className={`text-[10px] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                                    </div>

                                    {isDropdownOpen && (
                                        <div className="absolute z-[110] left-0 right-0 mt-3 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                                            <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                                                <input
                                                    type="text"
                                                    placeholder="Search database..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    autoFocus
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/5 transition-all"
                                                />
                                            </div>
                                            <div className="max-h-64 overflow-y-auto custom-scrollbar py-2">
                                                {/* All Members Toggle */}
                                                <label className="flex items-center gap-4 px-5 py-3 hover:bg-green-50/50 cursor-pointer transition-colors border-b border-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4.5 h-4.5 rounded border-gray-300 text-[#1b5e20] focus:ring-[#1b5e20] cursor-pointer"
                                                        checked={selectedMemberIds.includes('All')}
                                                        onChange={() => toggleMemberSelection('All')}
                                                    />
                                                    <span className="text-[13px] font-bold text-gray-800">-- All Members --</span>
                                                </label>

                                                {/* Individual Records */}
                                                {filteredMembers.map(m => (
                                                    <label key={m._id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4.5 h-4.5 rounded border-gray-300 text-[#1b5e20] focus:ring-[#1b5e20] cursor-pointer"
                                                            checked={selectedMemberIds.includes(m._id) || selectedMemberIds.includes('All')}
                                                            onChange={() => toggleMemberSelection(m._id)}
                                                        />
                                                        <span className="text-[13px] text-gray-700 font-medium">
                                                            {m.memberId || 'MEM'} - {m.name} ({m.companyName || 'CAIP'})
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-bold text-gray-700 tracking-tight">Message Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter subject header..."
                                    value={formData.message_title}
                                    onChange={(e) => setFormData({ ...formData, message_title: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600 shadow-sm transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-bold text-gray-700 tracking-tight">Message Content <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={4}
                                    placeholder="Compose notification body..."
                                    value={formData.message_content}
                                    onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm outline-none focus:border-green-600 shadow-sm transition-all resize-none leading-relaxed"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-bold text-gray-700 tracking-tight">Sending Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.sending_time}
                                    onChange={(e) => setFormData({ ...formData, sending_time: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600 shadow-sm transition-all"
                                />
                            </div>

                            <div className="flex justify-end pt-6">
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="px-14 py-4 bg-[#1b5e20] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                >
                                    {sending ? 'Sending...' : 'Send Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminPortalContainer>
    );
}
