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
    isActive: boolean;
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
    const [errors, setErrors] = useState<any>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Search and Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}admin/all-membership-plans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
        }
        setErrors({});
        setIsSubmitted(false);
        setIsModalOpen(true);
    };

    const validate = () => {
        const newErrors: any = {};
        if (!formData.name.trim()) newErrors.name = "Plan name is required";
        if (!formData.price) newErrors.price = "Price is required";
        if (!formData.duration.trim()) newErrors.duration = "Duration is required";
        if (!formData.subMemberLimit) newErrors.subMemberLimit = "Limit is required";
        if (!formData.benefits.trim()) newErrors.benefits = "Benefits are required";

        if (formData.price && Number(formData.price) < 0) newErrors.price = "Price cannot be negative";
        if (formData.subMemberLimit && Number(formData.subMemberLimit) < 0) newErrors.subMemberLimit = "Limit cannot be negative";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        if (!validate()) return;

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

    const handleToggleStatus = async (id: string, currentIsActive: boolean) => {
        const newStatus = !currentIsActive;
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(`${API_BASE_URL}admin/membership-plans/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: newStatus })
            });

            if (response.ok) {
                fetchPlans();
            }
        } catch (error) {
            console.error("Error toggling status:", error);
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
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Search and Action Toolbar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                        <div className="lg:col-span-8 space-y-1.5 flex flex-col">
                            <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Search plans</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by plan name or duration..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-10 pr-4 py-2 text-[15px] font-normal text-black placeholder-gray-400 outline-none focus:border-[#1b5e20] transition-all focus:bg-white shadow-sm"
                                />
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            </div>
                        </div>

                        <div className="lg:col-span-4 flex justify-end">
                            <button
                                onClick={() => handleOpenModal()}
                                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1b5e20] text-white rounded-lg font-bold text-[13px] shadow-sm hover:bg-[#2e7d32] transition-all active:scale-95"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                                Add New Plan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
                        <h3 className="text-sm font-bold tracking-tight">Active Membership Plans</h3>
                    </div>

                    <div className="p-4 md:p-5">
                        <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                            <div className="overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead className="sticky top-0 z-10 bg-[#051a02] text-white">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Plan Details</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Benefits</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight">Pricing</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight text-center">Duration</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight text-center">Sub-Members</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight text-center">Status</th>
                                            <th className="px-6 py-3 text-sm font-semibold tracking-tight text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 border-b border-gray-50 bg-white">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="py-24 text-center">
                                                    <div className="animate-spin h-10 w-10 border-4 border-[#1b5e20] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                    <p className="text-sm font-medium text-gray-500 animate-pulse">Loading Membership Plans...</p>
                                                </td>
                                            </tr>
                                        ) : paginatedPlans.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-24 text-center text-gray-400">
                                                    <p className="text-sm font-medium tracking-widest uppercase italic">No Plans Identified</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedPlans.map((plan) => (
                                                <tr key={plan._id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="text-[14px] font-bold text-gray-900">{plan.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {(Array.isArray(plan.benefits) ? plan.benefits : [plan.benefits]).map((benefit, i) => (
                                                                <span key={i} className="px-2.5 py-0.5 bg-green-50 text-[11px] font-bold text-emerald-700 rounded-lg border border-green-100 uppercase whitespace-nowrap">
                                                                    {benefit}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[14px] font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-3 py-1 bg-gray-50 text-[11px] font-bold text-gray-500 rounded-full border border-gray-100 uppercase">
                                                            {plan.duration}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-[14px] font-bold text-gray-900">{plan.subMemberLimit}</span>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Slots</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleToggleStatus(plan._id, plan.isActive)}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${plan.isActive ? 'bg-[#1b5e20]' : 'bg-gray-200'}`}
                                                        >
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${plan.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleOpenModal(plan)}
                                                                className="px-3 py-1.5 bg-green-50 text-[#1b5e20] rounded-lg text-[12px] font-bold hover:bg-[#1b5e20] hover:text-white transition-all shadow-sm active:scale-95 border border-green-100"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(plan._id)}
                                                                className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[12px] font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95 border border-rose-100"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {!loading && filteredPlans.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-white mt-auto">
                            <span className="text-[12px] font-medium text-gray-500">
                                Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                        const pageNum = idx + 1;
                                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all ${currentPage === pageNum ? 'bg-[#1b5e20] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <span key={pageNum} className="text-gray-300">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

            {/* Plan Configuration Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-[#051a02]/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        {/* Modal Header */}
                        <div className="bg-[#1b5e20] p-6 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 100 16 8 8 0 000-16zM13 7v2h-2V7h2zm0 4v6h-2v-6h2z"/></svg>
                            </div>
                            <div>
                                <h3 className="text-[18px] font-bold tracking-tight relative z-10">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h3>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-white/70 hover:text-white transition-colors relative z-10 p-2"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[13px] font-bold text-gray-700 ml-1">Plan Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text" placeholder="e.g. Standard Member" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full bg-gray-50/50 border rounded-xl py-3 px-4 outline-none text-[14px] font-medium transition-all focus:bg-white shadow-sm ${errors.name ? 'border-red-500' : 'border-gray-100 focus:border-[#1b5e20]'}`}
                                />
                                {errors.name && <span className="text-red-500 text-[11px] font-bold ml-1">{errors.name}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[13px] font-bold text-gray-700 ml-1">Price (₹) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number" placeholder="3000" value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className={`w-full bg-gray-50/50 border rounded-xl py-3 px-4 outline-none text-[14px] font-medium transition-all focus:bg-white shadow-sm ${errors.price ? 'border-red-500' : 'border-gray-100 focus:border-[#1b5e20]'}`}
                                    />
                                    {errors.price && <span className="text-red-500 text-[11px] font-bold ml-1">{errors.price}</span>}
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[13px] font-bold text-gray-700 ml-1">Duration <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" placeholder="e.g. 1 Year" value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        className={`w-full bg-gray-50/50 border rounded-xl py-3 px-4 outline-none text-[14px] font-medium transition-all focus:bg-white shadow-sm ${errors.duration ? 'border-red-500' : 'border-gray-100 focus:border-[#1b5e20]'}`}
                                    />
                                    {errors.duration && <span className="text-red-500 text-[11px] font-bold ml-1">{errors.duration}</span>}
                                </div>
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[13px] font-bold text-gray-700 ml-1">Sub-Member Limit <span className="text-red-500">*</span></label>
                                <input
                                    type="number" placeholder="5 slots available" value={formData.subMemberLimit}
                                    onChange={(e) => setFormData({ ...formData, subMemberLimit: e.target.value })}
                                    className={`w-full bg-gray-50/50 border rounded-xl py-3 px-4 outline-none text-[14px] font-medium transition-all focus:bg-white shadow-sm ${errors.subMemberLimit ? 'border-red-500' : 'border-gray-100 focus:border-[#1b5e20]'}`}
                                />
                                {errors.subMemberLimit && <span className="text-red-500 text-[11px] font-bold ml-1">{errors.subMemberLimit}</span>}
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[13px] font-bold text-gray-700 ml-1">Benefits <span className="text-red-500">*</span></label>
                                <textarea
                                    placeholder="Feature 1, Feature 2, Feature 3..." value={formData.benefits}
                                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                                    className={`w-full bg-gray-50/50 border rounded-xl py-3 px-4 outline-none text-[14px] font-medium transition-all focus:bg-white shadow-sm min-h-[100px] resize-none ${errors.benefits ? 'border-red-500' : 'border-gray-100 focus:border-[#1b5e20]'}`}
                                />
                                {errors.benefits && <span className="text-red-500 text-[11px] font-bold ml-1">{errors.benefits}</span>}
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white bg-[#1b5e20] hover:bg-[#2e7d32] transition-colors shadow-lg active:scale-95"
                                >
                                    {editingPlan ? 'Save Changes' : 'Create Plan'}
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
};

export default MembershipPlansPage;
