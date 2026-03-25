"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import Link from 'next/link';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InfoItem = ({ icon, label, value, isBold = false }: { icon: any, label: string, value: any, isBold?: boolean }) => (
    <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm flex-shrink-0 shadow-sm border border-gray-100">{icon}</div>
        <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1 leading-none">{label}</p>
            <p className={`text-[14px] text-gray-600 break-words leading-relaxed ${isBold ? 'font-bold text-[#1b5e20]' : 'font-medium'}`}>{value || '-'}</p>
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

    // New high-precision location states
    const [districts, setDistricts] = useState<string[]>([]);
    const [subDistricts, setSubDistricts] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

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
            setLocations(data.states.map((s: any) => s.state) || []);
        } catch (error) {
            console.error("Error fetching locations:", error);
        }
    };

    const fetchDistricts = async (state: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}districts?state=${encodeURIComponent(state)}`);
            const data = await res.json();
            setDistricts(data.districts || []);
        } catch (error) { console.error(error); }
    };

    const fetchSubDistricts = async (state: string, district: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}sub-districts?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
            const data = await res.json();
            setSubDistricts(data.subDistricts || []);
        } catch (error) { console.error(error); }
    };

    const fetchCities = async (state: string, district: string, subDistrict: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}cities?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&subDistrict=${encodeURIComponent(subDistrict)}`);
            const data = await res.json();
            setCities(data.cities || []);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        if (showEdit && editForm.state) {
            fetchDistricts(editForm.state);
        }
    }, [showEdit, editForm.state]);

    useEffect(() => {
        if (showEdit && editForm.state && editForm.district) {
            fetchSubDistricts(editForm.state, editForm.district);
        }
    }, [showEdit, editForm.district]);

    useEffect(() => {
        if (showEdit && editForm.state && editForm.district && editForm.cities) {
            fetchCities(editForm.state, editForm.district, editForm.cities);
        }
    }, [showEdit, editForm.cities]);

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

        if (outstandingAmt === 0) return { label: 'Paid', color: 'bg-green-100 text-[#1b5e20]' };
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


    const handleExportPDF = async () => {
        try {
            const doc = new jsPDF('landscape');

            // Header Texts
            doc.setFontSize(18);
            doc.setTextColor(27, 94, 32); // #1b5e20
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
                headStyles: { fillColor: [27, 94, 32], textColor: 255, fontSize: 8 },
                styles: { fontSize: 8 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                didDrawPage: (data) => {
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();

                    // BACKGROUND WATERMARKS
                    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
                    doc.setFontSize(14);
                    doc.setTextColor(200, 0, 0);

                    const watermarkText = `${memberName.toString().toUpperCase()} | ID: ${memberId} `;
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
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                    <div className="flex-1 w-full xl:w-auto">
                        <div className="relative group max-w-xl">
                            <input
                                type="text"
                                placeholder="Search by name, GST or region..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#1b5e20] text-sm shadow-sm transition-all focus:ring-1 focus:ring-[#1b5e20]/20"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1b5e20] transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
                        <button
                            onClick={handleExportPDF}
                            className="bg-white text-rose-600 border border-rose-100 px-5 py-2.5 rounded-xl hover:bg-rose-50 transition-all flex items-center gap-2.5 shadow-sm text-sm font-semibold whitespace-nowrap"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" /></svg>
                            Export PDF
                        </button>
                        <Link href="/defaulter/add" className="bg-[#1b5e20] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#144317] transition-all shadow-md shadow-[#1b5e20]/10 whitespace-nowrap flex items-center gap-2">
                            <span>+</span> Add New Report
                        </Link>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <h3 className="text-[16px] font-semibold tracking-tight">My Reported Defaulters</h3>
                    </div>
                    <div className="p-4 md:p-5">
                        <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-center border-collapse">
                                    <thead className="bg-[#051a02] text-white">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-5 py-4 text-[13px] font-semibold tracking-tight text-left">Defaulter Name</th>
                                            <th className="px-5 py-4 text-[13px] font-semibold tracking-tight">Reported On</th>
                                            <th className="px-5 py-4 text-[13px] font-semibold tracking-tight">Amount</th>
                                            <th className="px-5 py-4 text-[13px] font-semibold tracking-tight">Outstanding</th>
                                            <th className="px-5 py-4 text-[13px] font-semibold tracking-tight text-center">Status</th>
                                            <th className="px-5 py-4 text-[13px] font-semibold tracking-tight">Recovery Status</th>
                                            <th className="px-5 py-4 text-[13px] font-semibold tracking-tight">Recovery Amount</th>
                                            <th className="px-5 py-4 text-[13px] font-semibold tracking-tight text-center">Payment</th>
                                            <th className="px-5 py-4 text-[13px] font-semibold tracking-tight text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                        {paginatedData.map((def, i) => {
                                            const recovery = getRecoveryStatus(def);
                                            const isPaid = Number(def.outstanding_amount === undefined ? def.default_amount : def.outstanding_amount) === 0;
                                            const totalPaid = (def.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                                            return (
                                                <tr key={def._id} className="hover:bg-gray-50/50 divide-x divide-gray-50 transition-colors">
                                                    <td className="px-5 py-4 text-left">
                                                        <span className={`font-semibold ${isPaid ? 'text-[#1b5e20]' : 'text-gray-900'}`}>{def.defaulter_name}</span>
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-400">{new Date(def.createdAt).toLocaleDateString('en-GB')}</td>
                                                    <td className="px-5 py-4 font-semibold text-gray-900 font-mono">₹{Number(def.default_amount).toLocaleString('en-IN')}</td>
                                                    <td className="px-5 py-4 font-semibold text-red-600 font-mono">₹{Number(def.outstanding_amount === undefined ? def.default_amount : def.outstanding_amount).toLocaleString('en-IN')}</td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${def.status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                def.status === 2 ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                            }`}>
                                                            {def.status === 1 ? 'Approved' : def.status === 2 ? 'Rejected' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${recovery.color}`}>
                                                            {recovery.label.replace(' Paid', '')}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-[#1b5e20] font-mono">
                                                        ₹{totalPaid.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <button
                                                            onClick={() => handlePaymentClick(def)}
                                                            disabled={def.status !== 1 || isPaid}
                                                            className="text-[11px] text-[#1b5e20] font-black uppercase tracking-widest hover:underline disabled:opacity-30 disabled:no-underline whitespace-nowrap"
                                                        >
                                                            + Add Payment
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {isWithin24Hours(def.createdAt) && !isPaid && (
                                                                <button
                                                                    onClick={() => handleEditClick(def)}
                                                                    className="px-2.5 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors border border-amber-100 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                                                                    Edit
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleViewClick(def)}
                                                                className="px-2.5 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                                View
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {paginatedData.length === 0 && (
                                            <tr>
                                                <td colSpan={9} className="py-24 text-center text-gray-400">
                                                    <div className="text-4xl mb-3 opacity-20">📂</div>
                                                    <p className="text-sm font-medium">No records found matching your search.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {processedData.length > itemsPerPage && (
                            <div className="flex items-center justify-between px-2 pt-6 pb-2 border-t border-gray-100 mt-4">
                                <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest leading-none">
                                    Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, processedData.length)}</span> of <span className="text-gray-900">{processedData.length}</span> Records
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 hover:border-[#ffcd1e] hover:text-[#1b5e20] disabled:opacity-30 transition-all shadow-sm active:scale-95"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        {Array.from({ length: Math.min(5, Math.ceil(processedData.length / itemsPerPage)) }, (_, i) => i + 1).map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === pageNum
                                                    ? 'bg-[#ffcd1e] text-[#1b5e20] shadow-md shadow-[#ffcd1e]/20'
                                                    : 'border border-gray-100 text-gray-400 bg-white hover:border-[#ffcd1e] hover:text-[#1b5e20]'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        disabled={currentPage === Math.ceil(processedData.length / itemsPerPage)}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 hover:border-[#ffcd1e] hover:text-[#1b5e20] disabled:opacity-30 transition-all shadow-sm active:scale-95"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View Modal */}
            {showDetails && selectedDefaulter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(false)}></div>
                    <div className="relative bg-[#fbfcff] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-500">
                        {/* Modal Header */}
                        <div className="px-8 py-5 bg-[#1b5e20] flex items-center justify-between text-white shadow-lg relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-white/10 rounded-xl">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-[18px] font-bold tracking-tight uppercase">Defaulter record details</h3>
                                    <p className="text-white/60 text-[12px] font-medium tracking-tight">Full archival data and recovery synchronization tracking</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="text-white/40 hover:text-white transition-all bg-white/10 p-2 rounded-xl">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10">
                            {/* Section 1: Defaulter Company Details */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#1b5e20] rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Defaulter company details</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Company name" value={selectedDefaulter.defaulter_name} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>} />
                                    <DetailRow label="Industry" value={selectedDefaulter.industry} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" /></svg>} />
                                    <DetailRow label="Gst number" value={selectedDefaulter.gst_number} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>} />
                                    <DetailRow label="Pan number" value={selectedDefaulter.pan_number || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="14" x="3" y="5" rx="2" /><path d="M3 10h18" /><path d="M7 15h.01" /><path d="M11 15h2" /></svg>} />
                                    <DetailRow label="Cin number" value={selectedDefaulter.cin_number || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
                                    <DetailRow label="Aadhar number" value={selectedDefaulter.aadhar_number || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z" /></svg>} />
                                </div>
                            </div>

                            {/* Section 2: Contact & Location */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#ffcd1e] rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Contact & location</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Mobile" value={selectedDefaulter.mobile_number} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>} />
                                    <DetailRow label="Email" value={selectedDefaulter.email_id} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>} />
                                    <DetailRow label="State" value={selectedDefaulter.state} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>} />
                                    <DetailRow label="District" value={selectedDefaulter.district} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" /><path d="M10 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" /><path d="M2 7h20" /></svg>} />
                                    <DetailRow label="Sub district" value={selectedDefaulter.sub_district || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15.5 5.5-3 3-3-3" /><path d="m15.5 11.5-3 3-3-3" /><path d="m15.5 17.5-3 3-3-3" /></svg>} />
                                    <DetailRow label="City" value={selectedDefaulter.city || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" /></svg>} />
                                    <div className="col-span-full pt-2">
                                        <DetailRow label="Full address" value={selectedDefaulter.defaulter_address} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Financial Status */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#1b5e20] rounded-full opacity-50"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Financial status</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Default amount" value={`₹${Number(selectedDefaulter.default_amount).toLocaleString()}`} isHighlights icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>} />
                                    <DetailRow label="Outstanding" value={`₹${Number(selectedDefaulter.outstanding_amount || selectedDefaulter.default_amount).toLocaleString()}`} isHighlights icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} />
                                    <DetailRow label="Date of default" value={selectedDefaulter.default_date ? new Date(selectedDefaulter.default_date).toLocaleDateString() : 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
                                    <DetailRow label="Financial year" value={selectedDefaulter.financial_year || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>} />
                                    <div className="col-span-full">
                                        <DetailRow label="Reason for default" value={selectedDefaulter.description || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h.01" /><path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" /><path d="M12 9v4" /></svg>} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Legal & Proceedings */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-gray-300 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Legal & proceedings</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Court name" value={selectedDefaulter.court_name || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 20v-4l-4-4-4-4-4 4-4 4v4H2" /><path d="M6 12v.01" /><path d="M18 12v.01" /><path d="M12 6v.01" /></svg>} />
                                    <DetailRow label="Case number" value={selectedDefaulter.case_number || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>} />
                                    <DetailRow label="Case type" value={selectedDefaulter.case_type || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>} />
                                    <DetailRow label="Case year" value={selectedDefaulter.case_year || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
                                    <DetailRow label="Legal status" value={selectedDefaulter.legal_status || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>} />
                                </div>
                            </div>

                            {/* Section 5: Report Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-emerald-100 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Report information</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                    <DetailRow label="Reported by" value={selectedDefaulter.reporter_name || 'Member Portal'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                                    <DetailRow label="Verification status" value={selectedDefaulter.status || 'Pending'} isStatus icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /><path d="m9 12 2 2 4-4" /></svg>} />
                                </div>
                            </div>

                            {/* Section 6: Documents */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-slate-200 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Documents</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {selectedDefaulter.attachment_documents?.length > 0 ? (
                                        selectedDefaulter.attachment_documents.map((doc: string, idx: number) => {
                                            const isPdf = doc.toLowerCase().endsWith('.pdf');
                                            return (
                                                <a
                                                    key={idx}
                                                    href={`${ASSETS_BASE_URL}uploads/${doc}`}
                                                    target="_blank"
                                                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-[#1b5e20] hover:bg-emerald-50/10 transition-all group shadow-sm"
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPdf ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                                        {isPdf ? (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                        ) : (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-bold text-gray-900 truncate">Document {idx + 1}</span>
                                                        <span className="text-[11px] font-medium text-gray-400 capitalize">{doc.split('.').pop()} file</span>
                                                    </div>
                                                </a>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full py-8 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
                                            <p className="text-[13px] font-medium">No verified documents available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 7: Payment Records */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-blue-100 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Payment records</h4>
                                </div>
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest">#</th>
                                                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest">Payment date</th>
                                                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedDefaulter.payments?.length > 0 ? (
                                                selectedDefaulter.payments.map((p: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-[14px] font-bold text-gray-400">{(idx + 1).toString().padStart(2, '0')}</td>
                                                        <td className="px-6 py-4 text-[14px] font-medium text-gray-900">{new Date(p.date).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 text-[14px] font-bold text-[#1b5e20] text-right">₹{Number(p.amount).toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-12 text-center text-[13px] font-medium text-gray-400 italic">No recovery payments synchronized yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] selection:bg-none">
                            <button onClick={() => setShowDetails(false)} className="px-10 py-3 bg-[#1b5e20] text-white rounded-xl text-[14px] font-bold shadow-xl shadow-[#1b5e20]/20 hover:bg-[#144317] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
                                Close Access
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && selectedDefaulter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEdit(false)}></div>
                    <div className="relative bg-[#fbfcff] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-500">
                        {/* Modal Header */}
                        <div className="px-8 py-5 bg-[#1b5e20] flex items-center justify-between text-white shadow-lg relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-white/10 rounded-xl">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-[18px] font-bold tracking-tight">Edit defaulter record</h3>
                                    <p className="text-white/60 text-[12px] font-medium tracking-tight">Review and synchronize information across all modules</p>
                                </div>
                            </div>
                            <button onClick={() => setShowEdit(false)} className="text-white/40 hover:text-white transition-all bg-white/10 p-2 rounded-xl">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                            {/* Section 1: Identity Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#1b5e20] rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Identity information</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    <FormInput label="Defaulter company name" name="defaulter_name" value={editForm.defaulter_name} onChange={handleInputChange} />
                                    <FormInput label="Contact number" name="mobile_number" value={editForm.mobile_number} onChange={handleInputChange} />
                                    <FormInput label="Email address" name="email_id" value={editForm.email_id} onChange={handleInputChange} type="email" />
                                    <FormInput label="Gst number" name="gst_number" value={editForm.gst_number} onChange={handleInputChange} />
                                    <FormInput label="Pan number" name="pan_number" value={editForm.pan_number} onChange={handleInputChange} />
                                    <FormInput label="Cin number" name="cin_number" value={editForm.cin_number} onChange={handleInputChange} />
                                    <FormInput label="Aadhar number" name="aadhar_number" value={editForm.aadhar_number} onChange={handleInputChange} />
                                    <FormInput label="Industry" name="industry" value={editForm.industry} onChange={handleInputChange} isSelect options={['Agriculture', 'Agrochemicals & Fertilizers', 'Seed Suppliers', 'Farming Equipment', 'Others']} />
                                </div>
                            </div>

                            {/* Section 2: Jurisdiction & Location */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#ffcd1e] rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Jurisdiction & location</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                    <FormInput label="State" name="state" value={editForm.state} onChange={handleInputChange} isSelect options={locations} />
                                    <FormInput label="District" name="district" value={editForm.district} onChange={handleInputChange} isSelect options={districts} disabled={!editForm.state} />
                                    <FormInput label="Sub district" name="cities" value={editForm.cities} onChange={handleInputChange} isSelect options={subDistricts} disabled={!editForm.district} />
                                    <FormInput label="City" name="city" value={editForm.city} onChange={handleInputChange} isSelect options={cities} disabled={!editForm.cities} />
                                    <div className="col-span-full">
                                        <FormInput label="Full address" name="defaulter_address" value={editForm.defaulter_address} onChange={handleInputChange} isTextArea />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Financial Defaults */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#1b5e20] rounded-full opacity-50"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Financial defaults</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                    <FormInput label="Default amount" name="default_amount" value={editForm.default_amount} onChange={handleInputChange} type="number" />
                                    <FormInput label="Outstanding amount" name="outstanding_amount" value={editForm.outstanding_amount} onChange={handleInputChange} type="number" />
                                    <FormInput label="Financial year" name="financial_year" value={editForm.financial_year} onChange={handleInputChange} isSelect options={Array.from({ length: 10 }).map((_, i) => { const yr = 2025 - i; return `${yr}-${(yr + 1).toString().slice(-2)}`; })} />
                                    <FormInput label="Date of default" name="default_date" value={editForm.default_date} onChange={handleInputChange} type="date" />
                                    <div className="col-span-full">
                                        <FormInput label="Reason / description" name="description" value={editForm.description} onChange={handleInputChange} isTextArea />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Legal Proceedings (Optional) */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-gray-300 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Legal proceedings (optional)</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <FormInput label="Court name" name="court_name" value={editForm.court_name} onChange={handleInputChange} />
                                    <FormInput label="Case number" name="case_number" value={editForm.case_number} onChange={handleInputChange} />
                                    <FormInput label="Case type" name="case_type" value={editForm.case_type} onChange={handleInputChange} />
                                    <FormInput label="Case year" name="case_year" value={editForm.case_year} onChange={handleInputChange} />
                                    <FormInput label="Legal status" name="legal_status" value={editForm.legal_status} onChange={handleInputChange} isSelect options={['No Legal Action', 'Notice Served', 'Case Filed', 'In Court', 'Decree Awarded', 'Others']} />
                                </div>
                                <div className="col-span-full space-y-2 pt-2">
                                    <label className="text-[13px] font-medium text-gray-500 tracking-tight px-1">Add new documents</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => setEditFiles(e.target.files)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-white group-hover:border-[#1b5e20] group-hover:bg-emerald-50/10 transition-all flex items-center justify-center gap-4">
                                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[#1b5e20] group-hover:text-white transition-all shrink-0">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                            </div>
                                            <p className="text-[13px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors">Replace current attachments</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] selection:bg-none">
                            <button type="button" onClick={() => setShowEdit(false)} className="px-6 py-3 text-[14px] font-bold text-gray-400 hover:text-gray-900 transition-all">Discard Changes</button>
                            <button onClick={handleUpdate} disabled={saving} className="px-8 py-3 bg-[#1b5e20] text-white rounded-xl text-[14px] font-bold shadow-xl shadow-[#1b5e20]/20 hover:bg-[#144317] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3">
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Synchronizing...
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                                        Commit Updates
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayment && selectedDefaulter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !processingPayment && setShowPayment(false)}></div>
                    <div className="relative bg-[#fbfcff] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 bg-[#1b5e20] text-white flex items-center justify-between">
                            <h3 className="text-[18px] font-semibold flex items-center gap-3">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/90">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v8" />
                                    <path d="M8 12h8" />
                                </svg>
                                Add recovery payment
                            </h3>
                            <button onClick={() => setShowPayment(false)} className="text-white/40 hover:text-white transition-all bg-white/10 p-2 rounded-lg">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="px-8 py-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between text-[13px] text-emerald-800 font-medium">
                            <span className="truncate max-w-[55%]">Defaulter: <span className="font-bold">{selectedDefaulter.defaulter_name}</span></span>
                            <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-full text-[12px] font-bold">Outstanding: ₹{(Number(selectedDefaulter.outstanding_amount || selectedDefaulter.default_amount) || 0).toLocaleString()}</span>
                        </div>

                        <form onSubmit={handleSavePayments} className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                            <div className="space-y-6">
                                {paymentRows.map((row, idx) => (
                                    <div key={idx} className="p-6 bg-white rounded-2xl border border-gray-100 space-y-5 relative shadow-sm group">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[13px] font-medium text-gray-500 tracking-tight pl-1">Payment Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={row.amount}
                                                onChange={(e) => handlePaymentRowChange(idx, 'amount', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-[#1b5e20] focus:bg-white text-[15px] font-medium transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[13px] font-medium text-gray-500 tracking-tight pl-1">Date of Payment</label>
                                            <input
                                                type="date"
                                                value={row.date}
                                                onChange={(e) => handlePaymentRowChange(idx, 'date', e.target.value)}
                                                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-[#1b5e20] focus:bg-white text-[15px] font-medium transition-all"
                                                required
                                            />
                                        </div>
                                        {paymentRows.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePaymentRow(idx)}
                                                className="w-full bg-rose-50 text-rose-600 py-2.5 rounded-xl text-[12px] font-bold hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-rose-100/50"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                Discard Entry
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddPaymentRow}
                                className="px-6 py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl text-[12px] font-bold tracking-wider hover:border-[#1b5e20] hover:text-[#1b5e20] hover:bg-emerald-50/30 transition-all flex items-center gap-3 w-full justify-center group"
                            >
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-lg group-hover:bg-[#1b5e20] group-hover:text-white transition-all">+</div>
                                Add Another Payment
                            </button>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processingPayment}
                                    className="bg-[#1b5e20] text-white px-10 py-3.5 rounded-2xl font-bold tracking-wide text-[14px] shadow-lg shadow-[#1b5e20]/20 hover:bg-[#144317] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3"
                                >
                                    {processingPayment ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Recording...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                                            Save Payments
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </MemberPortalContainer>
    );
}

const FormInput = ({ label, name, value, onChange, type = 'text', isTextArea = false, isSelect = false, options = [], disabled = false }: any) => {
    return (
        <div className="space-y-1.5 flex flex-col">
            <label className="text-[14px] font-medium text-gray-500 tracking-tight px-1">{label}</label>
            {isTextArea ? (
                <textarea
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    disabled={disabled}
                    rows={4}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-medium focus:border-[#1b5e20] focus:bg-white outline-none transition-all shadow-sm resize-none"
                />
            ) : isSelect ? (
                <div className="relative">
                    <select
                        name={name}
                        value={value || ''}
                        onChange={onChange}
                        disabled={disabled}
                        className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl px-5 py-3.5 text-[15px] font-medium focus:border-[#1b5e20] focus:bg-white outline-none transition-all shadow-sm appearance-none disabled:opacity-50"
                    >
                        <option value="">Select option</option>
                        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                </div>
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    disabled={disabled}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-5 py-3.5 text-[15px] font-medium focus:border-[#1b5e20] focus:bg-white outline-none transition-all shadow-sm disabled:opacity-50"
                />
            )}
        </div>
    );
};

const DetailRow = ({ label, value, icon, isHighlights = false, isStatus = false }: any) => (
    <div className="flex gap-4 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isHighlights ? 'bg-emerald-50 text-[#1b5e20]' : 'bg-gray-50 text-gray-400'}`}>
            {icon}
        </div>
        <div className="flex flex-col min-w-0">
            <label className="text-[13px] font-medium text-gray-400 tracking-tight leading-none mb-1.5">{label}</label>
            <div className={`text-[15px] font-medium tracking-tight truncate ${isHighlights ? 'text-[#1b5e20] font-bold' : 'text-gray-900'} ${isStatus ? 'bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-full inline-block w-fit text-[12px] font-bold' : ''}`}>
                {value}
            </div>
        </div>
    </div>
);
