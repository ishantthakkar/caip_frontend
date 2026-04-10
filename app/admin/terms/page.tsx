"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';
import Swal from 'sweetalert2';

export default function AdminTermsPage() {
    const [terms, setTerms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<any>({ title: '', content: '', status: 'Draft', file: null });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const filteredTerms = useMemo(() => {
        return terms.filter(t =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [terms, searchTerm]);

    const totalPages = Math.ceil(filteredTerms.length / itemsPerPage);
    const paginatedTerms = filteredTerms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        fetchTerms();
    }, []);

    const fetchTerms = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}admin/terms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setTerms(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (targetStatus: string) => {
        if (!formData.title.trim()) {
            Swal.fire({ icon: 'error', title: 'Title Required', text: 'Please enter a title.' });
            return;
        }

        if (!editingId && !formData.file) {
            Swal.fire({ icon: 'error', title: 'File Required', text: 'Please select a document file.' });
            return;
        }

        if (targetStatus === 'Published') {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "Publishing these terms will make them effective immediately for all users. You won't be able to edit or delete them later.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#1b5e20',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, Publish Now!'
            });

            if (!result.isConfirmed) return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `${API_BASE_URL}admin/terms/${editingId}` : `${API_BASE_URL}admin/terms`;

            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('status', targetStatus);
            submitData.append('content', formData.content);
            if (formData.file) {
                submitData.append('file', formData.file);
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: submitData
            });

            if (res.ok) {
                setIsModalOpen(false);
                setFormData({ title: '', content: '', status: 'Draft', file: null });
                setEditingId(null);
                fetchTerms();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string, status: string) => {
        if (status === 'Published') {
            Swal.fire({ icon: 'error', title: 'Action Denied', text: 'Cannot delete published terms.' });
            return;
        }

        const result = await Swal.fire({
            title: 'Delete Terms?',
            text: "Are you sure you want to permanently delete this draft?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}admin/terms/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchTerms();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AdminPortalContainer title="Terms & Conditions Management">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Search by title or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none transition-all"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                    <button
                        onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ title: '', content: '', status: 'Draft', file: null }); }}
                        className="bg-[#1b5e20] text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm hover:bg-green-700 transition-all flex items-center gap-2 shrink-0 active:scale-95"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Add New T&C
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#051a02] text-white">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold">Publish Date</th>
                                <th className="px-6 py-4 text-xs font-bold">Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-600">
                            {paginatedTerms.map((t) => (
                                <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(t.createdAt))}</td>
                                    <td className="px-6 py-4 font-bold text-black-900">{t.title}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${t.status === 'Published' ? 'bg-green-100 text-green-700' :
                                            t.status === 'Archived' ? 'bg-gray-100 text-black-500' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-4">
                                            {t.file && (
                                                <a
                                                    href={`${ASSETS_BASE_URL}uploads/${t.file}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold transition-all text-xs mr-2"
                                                    title="View Document"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    View PDF
                                                </a>
                                            )}

                                            {t.status === 'Draft' ? (
                                                <>
                                                    <button
                                                        onClick={() => { setEditingId(t._id); setFormData({ title: t.title, content: t.content, status: t.status, file: null }); setIsModalOpen(true); }}
                                                        className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t._id, t.status)}
                                                        className="text-red-600 font-bold hover:text-red-700 transition-colors border-l border-gray-100 pl-4"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded"></span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedTerms.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                            <p className="text-sm font-bold tracking-widest uppercase">No T&C documents found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!loading && filteredTerms.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <span className="text-[12px] font-bold text-gray-500">
                                Showing <span className="text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredTerms.length)}</span> of <span className="text-gray-900">{filteredTerms.length}</span> documents
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
                                                    className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all ${currentPage === pageNum ? 'bg-[#1b5e20] text-white shadow-md scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
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

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-xl relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#1b5e20] p-6 text-white text-center">
                            <h3 className="text-xl font-bold">{editingId ? 'Edit T&C Document' : 'Upload New T&C Document'}</h3>
                        </div>
                        <div className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-sm"
                                    placeholder="Enter T&C Title (e.g. Terms of Service v2.0)"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Upload Document (PDF/Word)</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-semibold text-sm cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                                    />
                                </div>
                                {editingId && <p className="text-[10px] text-gray-400 mt-2 italic px-1">Note: Upload to replace current file, or leave blank to keep existing.</p>}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg font-bold text-gray-500 hover:bg-gray-50 transition-colors text-xs order-3 sm:order-1">Cancel</button>
                                <button type="button" onClick={() => handleSave('Draft')} className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg font-bold shadow-md hover:bg-gray-700 transition-all text-xs order-2 sm:order-2">Save as Draft</button>
                                <button type="button" onClick={() => handleSave('Published')} className="flex-1 px-4 py-2.5 bg-[#1b5e20] text-white rounded-lg font-bold shadow-md hover:bg-green-700 transition-all text-xs order-1 sm:order-3">Publish Now</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminPortalContainer>
    );
}
