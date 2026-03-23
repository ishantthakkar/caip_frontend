"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import Link from 'next/link';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: any }) => (
    <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">{icon}</div>
        <div className="min-w-0">
            <p className="text-xs font-black text-gray-400 flex items-center gap-1">
                {label}: <span className="text-gray-600 font-medium ml-1">{value}</span>
            </p>
        </div>
    </div>
);

export default function MemberDefaulterListPage() {
    const [defaulters, setDefaulters] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // UI & Modal States
    const [selectedDefaulter, setSelectedDefaulter] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);
    const [editFiles, setEditFiles] = useState<FileList | null>(null);

    // Payment States
    const [showPayment, setShowPayment] = useState(false);
    const [paymentRows, setPaymentRows] = useState<any[]>([{ amount: '', date: '' }]);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isSubMember, setIsSubMember] = useState(false);

    useEffect(() => {
        fetchMyReports();
        fetchLocations();

        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));

        const smData = localStorage.getItem('subMember');
        if (smData) setIsSubMember(true);
    }, []);

    const fetchMyReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}defaulter/my-reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
                return;
            }

            const data = await response.json();
            if (response.ok) setDefaulters(data.data || []);
        } catch (error) {
            console.error("Error fetching reports:", error);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}locations`);
            const data = await res.json();
            setLocations(data.states || []);
        } catch (error) {
            console.error("Error fetching locations:", error);
        }
    };

    const handleEditClick = (def: any) => {
        setSelectedDefaulter(def);
        setEditForm({ ...def });
        setEditFiles(null);
        setShowEdit(true);
    };

    const handleViewClick = (def: any) => {
        setSelectedDefaulter(def);
        setShowDetails(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditForm((prev: any) => ({
            ...prev,
            [name]: value,
            ...(name === 'state' ? { district: '', cities: '', city: '' } : {}),
            ...(name === 'district' ? { cities: '', city: '' } : {}),
            ...(name === 'cities' ? { city: '' } : {})
        }));
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            Object.keys(editForm).forEach(key => {
                if (key !== 'attachment_documents' && key !== 'payments' && key !== 'user_id' && key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v') {
                    formData.append(key, editForm[key]);
                }
            });

            if (editFiles) {
                Array.from(editFiles).forEach(file => {
                    formData.append('attachment_documents', file);
                });
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}defaulter/update/${selectedDefaulter._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert("Record updated successfully!");
                setShowEdit(false);
                fetchMyReports();
            }
        } catch (error) {
            console.error("Update error:", error);
        } finally {
            setSaving(false);
        }
    };

    const processedData = useMemo(() => {
        if (!searchTerm) return defaulters;
        const low = searchTerm.toLowerCase();
        return defaulters.filter(d =>
            d.defaulter_name?.toLowerCase().includes(low) ||
            d.gst_number?.toLowerCase().includes(low) ||
            d.district?.toLowerCase().includes(low)
        );
    }, [defaulters, searchTerm]);

    const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getRecoveryStatus = (def: any) => {
        const defaultAmt = Number(def.default_amount) || 0;
        const outstandingAmt = def.outstanding_amount !== undefined ? Number(def.outstanding_amount) : defaultAmt;
        const totalPaid = (def.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        if (outstandingAmt === 0) return { label: 'Paid', color: 'bg-green-100 text-green-700' };
        if (totalPaid > 0) return { label: 'Partially Paid', color: 'bg-blue-50 text-blue-600' };
        return { label: 'Not Paid', color: 'bg-red-50 text-red-600' };
    };

    const isWithin24Hours = (date: string) => {
        if (!date) return false;
        const recordDate = new Date(date).getTime();
        const now = new Date().getTime();
        const diffInHours = (now - recordDate) / (1000 * 60 * 60);
        return diffInHours <= 24;
    };

    const handlePaymentClick = (def: any) => {
        setSelectedDefaulter(def);
        setPaymentRows([{ amount: '', date: new Date().toISOString().split('T')[0] }]);
        setShowPayment(true);
    };

    const handleAddPaymentRow = () => {
        setPaymentRows([...paymentRows, { amount: '', date: new Date().toISOString().split('T')[0] }]);
    };

    const handleRemovePaymentRow = (index: number) => {
        setPaymentRows(paymentRows.filter((_, i) => i !== index));
    };

    const handlePaymentRowChange = (index: number, field: string, value: string) => {
        const newRows = [...paymentRows];
        newRows[index][field] = value;
        setPaymentRows(newRows);
    };

    const handleSavePayments = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDefaulter) return;

        const validPayments = paymentRows.filter(p => p.amount && p.date);
        if (validPayments.length === 0) {
            alert("Please add at least one valid payment amount and date.");
            return;
        }

        setProcessingPayment(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}defaulter/add-payment/${selectedDefaulter._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ payments: validPayments })
            });

            if (res.ok) {
                alert("Payments recorded successfully!");
                setShowPayment(false);
                fetchMyReports();
            } else {
                const data = await res.json();
                alert(data.msg || "Error saving payments");
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Failed to save payments");
        } finally {
            setProcessingPayment(false);
        }
    };


    const districtsList = locations.find(s => s.state === editForm.state)?.districts || [];

    const handleExportPDF = async () => {
        try {
            const doc = new jsPDF('landscape');

            // Header Texts
            doc.setFontSize(18);
            doc.setTextColor(31, 99, 6); // #1f6306
            doc.text("Member Defaulter Report", 14, 22);

            // Member details
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            const memberName = user?.name || 'Not Available';
            const companyName = user?.companyName || 'Not Available';
            const memberId = user?.memberId || user?._id?.slice(-8).toUpperCase() || 'N/A';
            const memberEmail = user?.email || 'N/A';

            doc.text(`Downloaded By: ${memberName} (${memberId})`, 14, 32);
            doc.text(`Email: ${memberEmail}`, 14, 38);
            doc.text(`Downloaded On: ${new Date().toLocaleString('en-GB')}`, 14, 44);

            // Generate Table
            const tableColumn = [
                "Sr.",
                "Defaulter Company",
                "Reported Date",
                "Amount",
                "Outstanding",
                "GST",
                "PAN",
                "CIN",
                "Aadhar",
                "State",
                "City",
                "District"
            ];

            const tableRows = processedData.map((def, idx) => [
                idx + 1,
                def.defaulter_name || '-',
                new Date(def.createdAt).toLocaleDateString('en-GB'),
                `Rs. ${Number(def.default_amount).toLocaleString('en-IN')}`,
                `Rs. ${Number(def.outstanding_amount || def.default_amount).toLocaleString('en-IN')}`,
                def.gst_number || '-',
                def.pan_number || '-',
                def.cin_number || '-',
                def.aadhar_number || '-',
                def.state || '-',
                def.sub_district || def.cities || '-', // Backward compatibility
                def.city || '-',
                def.district || '-'
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 52,
                theme: 'grid',
                headStyles: { fillColor: [31, 99, 6], textColor: 255, fontSize: 8 },
                styles: { fontSize: 8 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                didDrawPage: (data) => {
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();

                    // BACKGROUND WATERMARKS
                    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
                    doc.setFontSize(14);
                    doc.setTextColor(200, 0, 0);

                    const watermarkText = `${memberName.toUpperCase()} | ID: ${memberId} `;
                    const angle = 45;
                    const stepX = 100;
                    const stepY = 100;

                    // Draw repeated watermark in a grid
                    for (let x = -50; x < pageWidth + 100; x += stepX) {
                        for (let y = -50; y < pageHeight + 100; y += stepY) {
                            doc.text(watermarkText, x, y, { angle });
                        }
                    }

                    doc.setGState(new (doc as any).GState({ opacity: 1 }));

                    // --- FOOTER SECTION ---
                    // Footer warning text
                    const footerText = "This document is intended only for the designated recipient. Unauthorized sharing, distribution, or duplication is strictly prohibited.";
                    doc.setFontSize(9);
                    doc.setTextColor(200, 0, 0);
                    doc.text(footerText, 14, pageHeight - 10);

                    // Page number
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text(`Page ${data.pageNumber}`, pageWidth - 25, pageHeight - 10);
                }
            });

            doc.save('CAIP_Defaulter_Report.pdf');

            // Log the download activity
            const token = localStorage.getItem('token');
            fetch(`${API_BASE_URL}defaulter/log-download`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ details: `Downloaded ${processedData.length} defaulter records as PDF` })
            }).catch(e => console.error("Log download error:", e));

        } catch (err) {
            console.error("PDF Export Error: ", err);
            alert("Failed to export PDF.");
        }
    };

    return (
        <MemberPortalContainer title="My Reported Defaulters">
            <div className="space-y-8 animate-in fade-in duration-500">
                
                {/* Header Actions Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1.5 flex items-center gap-2">
                             <div className="w-2 h-7 bg-agri-gold-secondary rounded-full"></div>
                             Defaulter Records
                        </h2>
                        <p className="text-xs font-bold text-gray-400 tracking-tight">Management console & analytics</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search by name, GST or district..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-lg py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-agri-green-primary/20 focus:border-agri-green-primary text-sm transition-all"
                            />
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-agri-green-primary" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                        
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2.5 bg-white text-rose-600 border-2 border-rose-50 px-5 py-2.5 rounded-lg hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all font-bold text-xs"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></svg>
                            Export Report
                        </button>
                        
                        <Link href="/defaulter/add" className="bg-agri-green-primary text-white px-6 py-2.5 rounded-lg text-xs font-bold tracking-tight hover:bg-agri-green-700 transition-all shadow-md active:scale-95">
                            + Add New
                        </Link>
                    </div>
                </div>

                {/* Redesigned Records Table - Dashboard Style */}
                <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-agri-green-primary px-6 py-4 flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-white tracking-tight flex items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
                            Reported Defaulters Database
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-white/10 text-white px-3 py-1 rounded-full tracking-tight">Total: {processedData.length}</span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 tracking-tight text-center">#</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 tracking-tight leading-none">Defaulter details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 tracking-tight text-center">Financial year</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 tracking-tight text-right">Default amt</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 tracking-tight text-right">Outstanding</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 tracking-tight text-center">Verification</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 tracking-tight text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 tracking-tight text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.map((def, i) => {
                                    const recovery = getRecoveryStatus(def);
                                    const isPaid = Number(def.outstanding_amount === undefined ? def.default_amount : def.outstanding_amount) === 0;
                                    return (
                                        <tr key={def._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5 text-xs font-bold text-slate-400 text-center">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                            <td className="px-6 py-5 min-w-[200px]">
                                                <p className="text-sm font-black text-slate-800 tracking-tight mb-0.5 group-hover:text-agri-green-primary transition-colors">{def.defaulter_name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold font-mono text-slate-500">{def.gst_number || 'GST Not Req.'}</span>
                                                    <span className="text-xs text-slate-300">|</span>
                                                    <span className="text-xs font-medium text-slate-400">{def.district}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">{def.financial_year || '---'}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-bold text-sm text-slate-800 tabular-nums">₹{Number(def.default_amount).toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-5 text-right">
                                                <p className={`text-sm font-black tabular-nums transition-colors ${isPaid ? 'text-agri-green-primary' : 'text-rose-600'}`}>
                                                    ₹{Number(def.outstanding_amount === undefined ? def.default_amount : def.outstanding_amount).toLocaleString('en-IN')}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                 <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-tight ${def.status === 1 ? 'bg-agri-green-50 text-agri-green-primary' :
                                                    def.status === 2 ? 'bg-rose-50 text-rose-600' :
                                                        'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {def.status === 1 ? 'Verified' : def.status === 2 ? 'Rejected' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-tight ${recovery.label === 'Paid' ? 'bg-agri-green-primary text-white' : recovery.label === 'Partially Paid' ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'}`}>
                                                    {recovery.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handlePaymentClick(def)}
                                                        disabled={def.status !== 1 || isPaid}
                                                        className="p-2 rounded-lg bg-agri-green-50 text-agri-green-primary hover:bg-agri-green-primary hover:text-white disabled:opacity-30 disabled:hover:bg-agri-green-50 disabled:hover:text-agri-green-primary transition-all transition-bounce"
                                                        title="Add Payment"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleViewClick(def)} 
                                                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all transition-bounce"
                                                        title="View analytics"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    </button>
                                                    
                                                    {isWithin24Hours(def.updatedAt || def.createdAt) && (
                                                        <button 
                                                            onClick={() => handleEditClick(def)} 
                                                            disabled={isPaid}
                                                            className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white disabled:opacity-30 transition-all transition-bounce"
                                                            title="Edit record"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {paginatedData.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                </div>
                                                <p className="text-sm font-bold text-slate-400 tracking-tight">No matching records detected.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {processedData.length > itemsPerPage && (
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-xs text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} records</p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-gray-50 text-gray-600"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.ceil(processedData.length / itemsPerPage) }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum
                                            ? 'bg-green-600 text-white shadow-md shadow-green-200'
                                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            </div>

                            <button
                                disabled={currentPage === Math.ceil(processedData.length / itemsPerPage)}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-gray-50 text-gray-600"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {showDetails && selectedDefaulter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(false)}></div>
                    <div className="relative bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-300">
                        {/* Header */}
                        <div className="px-8 py-5 bg-agri-green-primary flex items-center justify-between text-white border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                <h3 className="text-[16px] font-bold tracking-tight">Defaulter Profile & Analytics</h3>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-0 overflow-y-auto no-scrollbar">
                            {/* Section 1: Main Info */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                                <div className="space-y-4">
                                    <InfoItem icon="👤" label="Defaulter Company Name" value={selectedDefaulter.defaulter_name} />
                                    <InfoItem icon="📞" label="Mobile" value={selectedDefaulter.mobile_number} />
                                    <InfoItem icon="✉️" label="Email" value={selectedDefaulter.email_id || '-'} />
                                    <InfoItem icon="🔢" label="GST" value={selectedDefaulter.gst_number || '-'} />
                                    <InfoItem icon="💳" label="PAN" value={selectedDefaulter.pan_number || '-'} />
                                    <InfoItem icon="🆔" label="CIN" value={selectedDefaulter.cin_number || '-'} />
                                    <InfoItem icon="🛡️" label="Aadhar" value={selectedDefaulter.aadhar_number || '-'} />
                                    <InfoItem icon="🏠" label="Defaulter Address" value={selectedDefaulter.defaulter_address || '-'} />
                                </div>
                                <div className="space-y-4">
                                    <InfoItem icon="📍" label="State" value={selectedDefaulter.state} />
                                    <InfoItem icon="🏢" label="District" value={selectedDefaulter.district} />
                                    <InfoItem icon="🗾" label="Sub District" value={selectedDefaulter.cities || '-'} />
                                    <InfoItem icon="🏙️" label="City" value={selectedDefaulter.city || '-'} />
                                    <InfoItem icon="📅" label="Financial Year" value={selectedDefaulter.financial_year || '-'} />
                                    <InfoItem icon="📉" label="Outstanding" value={(selectedDefaulter.outstanding_amount || selectedDefaulter.default_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} />
                                    <InfoItem icon="🏭" label="Industry" value={selectedDefaulter.industry || '-'} />
                                    <InfoItem icon="👤" label="Reported By" value={user?.companyName || user?.name || 'Local Member'} />
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 2: Financial/Reason */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                <InfoItem icon="💵" label="Default Amount" value={Number(selectedDefaulter.default_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} />
                                <InfoItem icon="📅" label="Date of Default" value={selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toISOString().split('T')[0] : '-'} />
                                <InfoItem icon="⚠️" label="Reason" value={selectedDefaulter.reason_description} />
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm">✅</div>
                                    <div>
                                        <p className="text-xs font-black text-gray-400">Status</p>
                                        <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold mt-1 inline-block">
                                            {selectedDefaulter.status === 1 ? 'Approved' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 3: Legal Info */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                <InfoItem icon="🏛️" label="Court Complex Name" value={selectedDefaulter.court_complex_name || '-'} />
                                <InfoItem icon="🔢" label="Case Number" value={selectedDefaulter.case_number || '-'} />
                                <InfoItem icon="⚖️" label="Case Type" value={selectedDefaulter.case_type || '-'} />
                                <InfoItem icon="📅" label="Case Year" value={selectedDefaulter.case_year || '-'} />
                                <InfoItem icon="💼" label="Case Status" value={selectedDefaulter.case_status || '-'} />
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 4: Documents */}
                            <div className="p-8">
                                <h4 className="text-xs font-black text-gray-400 mb-4 flex items-center gap-2">
                                    <span>📄</span> Documents
                                </h4>
                                {selectedDefaulter.attachment_documents && selectedDefaulter.attachment_documents.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {selectedDefaulter.attachment_documents.map((doc: string, idx: number) => {
                                            const isPdf = doc.toLowerCase().endsWith('.pdf');
                                            return (
                                                <a key={idx} href={`${ASSETS_BASE_URL}uploads/${doc}`} target="_blank" className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-lg text-xs font-bold text-green-700 hover:bg-green-50 transition-all flex items-center gap-3 group">
                                                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                                        {isPdf ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></svg>
                                                        ) : (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                                        )}
                                                    </div>
                                                    <span className="group-hover:translate-x-0.5 transition-transform">Document {idx + 1}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No documents attached.</p>
                                )}
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 5: Payment Records */}
                            <div className="p-8 bg-gray-50/50">
                                <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-agri-green-primary text-white rounded-lg flex items-center justify-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
                                    </div>
                                    Recovery Payment History
                                </h4>
                                <div className="bg-white rounded-lg border border-gray-100 shadow-xl overflow-hidden">
                                    <table className="w-full text-center">
                                        <thead>
                                            <tr className="bg-agri-green-primary text-white">
                                                <th className="px-6 py-5 text-xs font-black border-r border-white/10">#</th>
                                                <th className="px-6 py-5 text-sm font-bold border-r border-white/10">Payment Date</th>
                                                <th className="px-6 py-5 text-sm font-bold">Credit Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(selectedDefaulter.payments || []).map((p: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50/80 transition-all">
                                                    <td className="px-6 py-5 text-xs font-bold text-slate-400 border-r border-gray-50 tabular-nums">{idx + 1}</td>
                                                    <td className="px-6 py-5 text-sm font-bold text-slate-600 border-r border-gray-50">{new Date(p.date).toISOString().split('T')[0]}</td>
                                                    <td className="px-6 py-5 text-sm font-black text-agri-green-primary tabular-nums">₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}
                                            {(selectedDefaulter.payments || []).length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-12 text-xs font-bold text-gray-300">No matching transactions found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setShowDetails(false)} className="bg-slate-800 text-white px-8 py-2.5 rounded-lg font-bold text-xs tracking-tight hover:bg-black transition-all shadow-md active:scale-95">
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && selectedDefaulter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEdit(false)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300">
                        <div className="px-8 py-5 bg-agri-green-primary flex items-center justify-between text-white border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                <h3 className="text-[16px] font-bold tracking-tight">Edit Defaulter Record</h3>
                            </div>
                            <button onClick={() => setShowEdit(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                            {/* Section 1: Basic Identity */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 border-b pb-2 tracking-tight">1. Identity Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Defaulter Company Name</label>
                                        <input type="text" name="defaulter_name" value={editForm.defaulter_name} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Contact Number</label>
                                        <input type="text" name="mobile_number" value={editForm.mobile_number} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Email Address</label>
                                        <input type="email" name="email_id" value={editForm.email_id} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">GST Number</label>
                                        <input type="text" name="gst_number" value={editForm.gst_number} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">PAN Number</label>
                                        <input type="text" name="pan_number" value={editForm.pan_number} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">CIN Number</label>
                                        <input type="text" name="cin_number" value={editForm.cin_number} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Aadhar Number</label>
                                        <input type="text" name="aadhar_number" value={editForm.aadhar_number} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Industry</label>
                                        <select name="industry" value={editForm.industry} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold">
                                            <option value="">Select Industry</option>
                                            <option value="Agriculture">Agriculture</option>
                                            <option value="Agrochemicals & Fertilizers">Agrochemicals & Fertilizers</option>
                                            <option value="Seed Suppliers">Seed Suppliers</option>
                                            <option value="Farming Equipment">Farming Equipment</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Address & Location */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 border-b pb-2 tracking-tight">2. Jurisdiction & Location</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">State</label>
                                        <select name="state" value={editForm.state} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold">
                                            <option value="">Select State</option>
                                            {locations.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">District</label>
                                        <select name="district" value={editForm.district} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold">
                                            <option value="">Select District</option>
                                            {districtsList.map((d: any) => <option key={d.district} value={d.district}>{d.district}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Sub District</label>
                                        <select name="cities" value={editForm.cities} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold">
                                            <option value="">Select Sub-District</option>
                                            {(districtsList.find((d: any) => d.district === editForm.district)?.subDistricts || []).map((sd: any) => <option key={sd} value={sd}>{sd}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">City</label>
                                        <input type="text" name="city" value={editForm.city || ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="col-span-full space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Full Address</label>
                                        <textarea name="defaulter_address" value={editForm.defaulter_address} onChange={handleInputChange} rows={2} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold" />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Financials */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 border-b pb-2 tracking-tight">3. Financial Defaults</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Default Amount</label>
                                        <input type="number" name="default_amount" value={editForm.default_amount} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Outstanding Amount</label>
                                        <input type="number" name="outstanding_amount" value={editForm.outstanding_amount} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold text-rose-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Financial Year</label>
                                        <select name="financial_year" value={editForm.financial_year} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold">
                                            <option value="">Select Year</option>
                                            {Array.from({ length: 10 }).map((_, i) => {
                                                const yr = 2025 - i;
                                                const val = `${yr}-${(yr + 1).toString().slice(-2)}`;
                                                return <option key={val} value={val}>{val}</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Date of Default</label>
                                        <input type="date" name="date_of_default" value={editForm.date_of_default ? new Date(editForm.date_of_default).toISOString().split('T')[0] : ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold" />
                                    </div>
                                    <div className="col-span-full space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Reason / Description</label>
                                        <textarea name="reason_description" value={editForm.reason_description} onChange={handleInputChange} rows={3} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold" />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Legal Information */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 border-b pb-2 tracking-tight">4. Legal Proceedings (Optional)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Court Name</label>
                                        <input type="text" name="court_complex_name" value={editForm.court_complex_name || ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Case Number</label>
                                        <input type="text" name="case_number" value={editForm.case_number || ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Case Type</label>
                                        <input type="text" name="case_type" value={editForm.case_type || ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Case Year</label>
                                        <input type="text" name="case_year" value={editForm.case_year || ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Legal Status</label>
                                        <select name="case_status" value={editForm.case_status || ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold">
                                            <option value="">Select Status</option>
                                            <option value="Notice Issued">Notice Issued</option>
                                            <option value="Under Review">Under Review</option>
                                            <option value="Warrant Issued">Warrant Issued</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 tracking-tight">Add Documents</label>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => setEditFiles(e.target.files)}
                                            className="w-full border border-dashed border-gray-300 rounded-lg py-2 px-3 text-xs font-bold text-gray-400 bg-gray-50 hover:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={saving} className="w-full bg-agri-green-primary text-white font-bold py-4 rounded-lg hover:bg-black transition-all disabled:opacity-50 mt-8 shadow-xl text-xs tracking-tight">
                                {saving ? "Synchronizing changes..." : "Commit Updates"}
                            </button>
                        </form>

                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayment && selectedDefaulter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !processingPayment && setShowPayment(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 bg-agri-green-primary text-white flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2 text-sm">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
                                Add Recovery Payment
                            </h3>
                            <button onClick={() => setShowPayment(false)} className="text-white/60 hover:text-white transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-4 bg-gray-50 border-b flex items-center justify-between text-xs text-gray-400 font-bold tracking-tight">
                            <span>Defaulter: {selectedDefaulter.defaulter_name}</span>
                            <span className="text-rose-600">Pending: ₹{(Number(selectedDefaulter.outstanding_amount) || 0).toLocaleString()}</span>
                        </div>

                        <form onSubmit={handleSavePayments} className="p-6">
                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {paymentRows.map((row, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4 relative">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-gray-400 tracking-tight">Payment Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={row.amount}
                                                onChange={(e) => handlePaymentRowChange(idx, 'amount', e.target.value)}
                                                placeholder="Enter amount"
                                                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 font-bold"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-gray-400 tracking-tight">Date of Payment</label>
                                            <input
                                                type="date"
                                                value={row.date}
                                                onChange={(e) => handlePaymentRowChange(idx, 'date', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 font-bold"
                                                required
                                            />
                                        </div>
                                        {paymentRows.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePaymentRow(idx)}
                                                className="w-full bg-rose-50 text-rose-600 py-2 rounded-lg text-xs font-bold tracking-tight hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                🗑️ Remove Payment
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddPaymentRow}
                                className="mt-4 px-4 py-2 bg-agri-green-primary text-white rounded-lg text-xs font-bold tracking-tight hover:opacity-90 transition-all flex items-center gap-2"
                            >
                                <span className="text-lg">+</span> Add Another Payment
                            </button>

                            <div className="mt-8 pt-6 border-t flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processingPayment}
                                    className="bg-agri-green-primary text-white px-8 py-3 rounded-lg font-bold tracking-tight text-xs shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {processingPayment ? "Recording payment..." : "Save Recovery Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MemberPortalContainer>
    );
}
