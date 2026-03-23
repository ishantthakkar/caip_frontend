"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL } from '@/config/apiConfig';

interface MembershipPlan {
    _id: string;
    name: string;
    price: number;
    duration: string;
    benefits: string[];
    subMemberLimit: number;
    createdAt?: string;
}

const MembershipPlansPage = () => {
    const [plans, setPlans] = useState<MembershipPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        duration: '',
        benefits: '',
        subMemberLimit: ''
    });

    // Search and Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchPlans = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}membership-plans`);
            const data = await response.json();
            if (response.ok) {
                setPlans(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Filtering and Pagination Logic
    const filteredPlans = useMemo(() => {
        if (!searchTerm.trim()) return plans;
        const lowerTerm = searchTerm.toLowerCase();
        return plans.filter(plan =>
            plan.name.toLowerCase().includes(lowerTerm) ||
            plan.duration.toLowerCase().includes(lowerTerm)
        );
    }, [plans, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredPlans.length / itemsPerPage));
    const paginatedPlans = filteredPlans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleOpenModal = (plan: MembershipPlan | null = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                price: plan.price.toString(),
                duration: plan.duration,
                benefits: Array.isArray(plan.benefits) ? plan.benefits.join(', ') : plan.benefits,
                subMemberLimit: plan.subMemberLimit.toString()
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                price: '',
                duration: '',
                benefits: '',
                subMemberLimit: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');

        const method = editingPlan ? 'PUT' : 'POST';
        const url = editingPlan
            ? `${API_BASE_URL}admin/membership-plans/${editingPlan._id}`
            : `${API_BASE_URL}admin/membership-plans`;

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price),
                    subMemberLimit: Number(formData.subMemberLimit)
                })
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchPlans();
            } else {
                alert("Operation failed");
            }
        } catch (error) {
            console.error("Error submitting plan:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;

        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(`${API_BASE_URL}admin/membership-plans/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchPlans();
            }
        } catch (error) {
            console.error("Error deleting plan:", error);
        }
    };

    return (
        <AdminPortalContainer title="Membership Plans">
            <div className="flex flex-col gap-6 font-sans">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Membership Plan</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search plans..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-agri-green-primary focus:ring-4 focus:ring-green-500/5 text-xs font-bold text-gray-700 w-full md:w-64 transition-all shadow-sm"
                            />
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </span>
                        </div>

                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-agri-green-primary hover:bg-agri-green-600 text-white px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-green-900/10 transition-all active:scale-95 shrink-0"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add New Plan
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-agri-green-primary text-white">
                                    <th className="px-6 py-4 text-[10px] font-black text-white/90 border-b border-white/10">Plan Details</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-white/90 border-b border-white/10">Benefits</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-white/90 border-b border-white/10">Pricing</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-white/90 border-b border-white/10">Duration</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-white/90 border-b border-white/10 text-center">Sub-Members</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-white/90 border-b border-white/10">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-xs font-bold text-gray-400 uppercase animate-pulse">
                                            Loading Plan Data...
                                        </td>
                                    </tr>
                                ) : paginatedPlans.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-xs font-bold text-gray-400 uppercase">
                                            {searchTerm ? "No plans match your search" : "No plans defined"}
                                        </td>
                                    </tr>
                                ) : paginatedPlans.map((plan) => (
                                    <tr key={plan._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-bold text-gray-900">{plan.name}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {(Array.isArray(plan.benefits) ? plan.benefits : [plan.benefits]).map((benefit, i) => (
                                                    <span key={i} className="px-2.5 py-1 bg-green-50 text-[10px] font-black text-emerald-700 rounded-lg border border-green-100 uppercase whitespace-nowrap">
                                                        {benefit}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-black text-gray-900 italic">₹{plan.price}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                                                {plan.duration}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm font-bold text-gray-900">{plan.subMemberLimit}</span>
                                            <span className="text-[9px] font-bold text-gray-400 block uppercase mt-1">Founding Limit</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(plan)}
                                                    className="p-2.5 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all border border-blue-100 shadow-sm active:scale-90"
                                                    title="Edit Plan"
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(plan._id)}
                                                    className="p-2.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-100 shadow-sm active:scale-90"
                                                    title="Delete Plan"
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {!loading && filteredPlans.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                        const pageNum = idx + 1;
                                        // Simple logic to show only few pages if many exist
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

            {/* Plan Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto pt-20 pb-20">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-agri-green-primary p-6 text-white relative">
                            <h2 className="text-xl font-bold">{editingPlan ? 'Update Plan' : 'Create New Plan'}</h2>
                            <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-1">Membership Configuration Console</p>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Plan Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-agri-green-primary focus:ring-4 focus:ring-green-500/5 outline-none transition-all"
                                        placeholder="e.g. Standard Member"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Price (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-agri-green-primary focus:ring-4 focus:ring-green-500/5 outline-none transition-all"
                                            placeholder="3000"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Duration</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-agri-green-primary focus:ring-4 focus:ring-green-500/5 outline-none transition-all"
                                            placeholder="e.g. 1 Year"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Sub-Member Limit</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.subMemberLimit}
                                        onChange={(e) => setFormData({ ...formData, subMemberLimit: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-agri-green-primary focus:ring-4 focus:ring-green-500/5 outline-none transition-all"
                                        placeholder="5"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Benefits (Comma Separated)</label>
                                    <textarea
                                        required
                                        value={formData.benefits}
                                        onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-agri-green-primary focus:ring-4 focus:ring-green-500/5 outline-none transition-all h-24 no-scrollbar"
                                        placeholder="Feature 1, Feature 2, Feature 3..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-agri-green-primary hover:bg-agri-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-900/10 transition-all active:scale-[0.98] mt-4"
                            >
                                {editingPlan ? 'Update Plan' : 'Create Plan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminPortalContainer>
    );
};

export default MembershipPlansPage;
