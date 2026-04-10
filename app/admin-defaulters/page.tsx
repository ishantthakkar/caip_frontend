"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

const DetailRow = ({ label, value, icon, isHighlights = false, isStatus = false }: any) => (
    <div className="flex gap-4 min-w-0 text-left">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isHighlights ? 'bg-emerald-50 text-[#1b5e20]' : 'bg-gray-50 text-gray-400'}`}>
            {icon}
        </div>
        <div className="flex flex-col min-w-0">
            <label className="text-[14px] font-bold text-gray-400 tracking-tight leading-none mb-1.5">{label}</label>
            <div className={`text-[15px] font-medium tracking-tight truncate ${isHighlights ? 'text-[#1b5e20] font-bold text-[18px]' : 'text-gray-900'} ${isStatus ? 'bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-full inline-block w-fit text-[12px] font-bold' : ''}`}>
                {value || '-'}
            </div>
        </div>
    </div>
);

export default function AdminDefaulterListPage() {
    const [defaulters, setDefaulters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const [selectedDefaulter, setSelectedDefaulter] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);

    const [states, setStates] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [subDistricts, setSubDistricts] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [filters, setFilters] = useState({
        state: '',
        district: '',
        subDistrict: '',
        city: '',
        financialYear: ''
    });

    useEffect(() => {
        fetchAllDefaulters();
        fetchStates();
    }, []);

    const fetchStates = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}locations`);
            const data = await response.json();
            if (response.ok) {
                setStates(data.states.map((s: any) => s.state) || []);
            }
        } catch (err) {
            console.error("States fetch error:", err);
        }
    };

    const fetchDistricts = async (state: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}districts?state=${encodeURIComponent(state)}`);
            const data = await response.json();
            if (response.ok) setDistricts(data.districts || []);
        } catch (err) {
            console.error("Districts fetch error:", err);
        }
    };

    const fetchSubDistricts = async (state: string, district: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}sub-districts?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
            const data = await response.json();
            if (response.ok) setSubDistricts(data.subDistricts || []);
        } catch (err) {
            console.error("Sub-Districts fetch error:", err);
        }
    };

    const fetchCities = async (state: string, district: string, subDistrict: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}cities?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&subDistrict=${encodeURIComponent(subDistrict)}`);
            const data = await response.json();
            if (response.ok) setCities(data.cities || []);
        } catch (err) {
            console.error("Cities fetch error:", err);
        }
    };

    useEffect(() => {
        if (filters.state) {
            fetchDistricts(filters.state);
            setDistricts([]);
            setSubDistricts([]);
            setCities([]);
        }
    }, [filters.state]);

    useEffect(() => {
        if (filters.state && filters.district) {
            fetchSubDistricts(filters.state, filters.district);
            setSubDistricts([]);
            setCities([]);
        }
    }, [filters.district]);

    useEffect(() => {
        if (filters.state && filters.district && filters.subDistrict) {
            fetchCities(filters.state, filters.district, filters.subDistrict);
            setCities([]);
        }
    }, [filters.subDistrict]);

    const fetchAllDefaulters = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}admin/defaulters`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setDefaulters(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching defaulters:", error);
        } finally {
            setLoading(false);
        }
    };

    const processedData = useMemo(() => {
        let result = defaulters;

        // Global Search
        if (searchTerm.trim()) {
            const low = searchTerm.toLowerCase();
            result = result.filter(d =>
                d.defaulter_name?.toLowerCase().includes(low) ||
                d.gst_number?.toLowerCase().includes(low) ||
                d.district?.toLowerCase().includes(low) ||
                (d.user_id?.companyName || '').toLowerCase().includes(low)
            );
        }

        // Advanced Filters
        if (filters.state) result = result.filter(d => d.state === filters.state);
        if (filters.district) result = result.filter(d => d.district === filters.district);
        if (filters.subDistrict) result = result.filter(d => (d.cities || d.sub_district) === filters.subDistrict);
        if (filters.city) result = result.filter(d => d.city?.toLowerCase().includes(filters.city.toLowerCase()));
        if (filters.financialYear) result = result.filter(d => d.financial_year === filters.financialYear);

        return result;
    }, [defaulters, searchTerm, filters]);

    const paginatedItems = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(processedData.length / itemsPerPage);

    const handleViewClick = (def: any) => {
        setSelectedDefaulter(def);
        setShowDetails(true);
    };

    const handleExportPDF = async () => {
        try {
            if (processedData.length === 0) {
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
            doc.text("Admin - Master Defaulter Report", 14, 22);

            // Audit details
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated By: ${adminName} (${adminEmail})`, 14, 32);
            doc.text(`Total Records: ${processedData.length}`, 14, 38);
            doc.text(`Exported On: ${new Date().toLocaleString('en-GB')}`, 14, 44);

            // Generate Table
            const tableColumn = [
                "Sr.",
                "Reported By (Member)",
                "Reported By (Company)",
                "Defaulter Firm",
                "Address",
                "GST",
                "CIN",
                "Persons",
                "Location (State, Dist, SubDist, City)",
                "Default Amount",
                "Outstanding",
                "Recovery",
                "Payment Status",
                "Status"
            ];

            const tableRows = processedData.map((def, idx) => {
                const dAmount = Number(def.default_amount || 0);
                const oAmount = Number(def.outstanding_amount ?? def.default_amount ?? 0);
                const rAmount = dAmount - oAmount;

                let paymentStatus = 'Not Paid';
                if (oAmount === 0) paymentStatus = 'Full Paid';
                else if (rAmount > 0) paymentStatus = 'Partial Paid';

                const status = (def.isSettled || oAmount === 0) ? 'CLEARED' : 'DEFAULTER';

                return [
                    idx + 1,
                    def.user_id?.name || 'Unknown',
                    def.user_id?.companyName || 'Unknown',
                    def.defaulter_name || '-',
                    def.defaulter_address || '-',
                    def.gst_number || '-',
                    def.cin_number || '-',
                    (def.defaulter_persons || []).length,
                    `${def.state || '-'}\n${def.district || '-'}\n${def.cities || def.sub_district || '-'}\n${def.city || '-'}`,
                    `Rs. ${dAmount.toLocaleString('en-IN')}`,
                    `Rs. ${oAmount.toLocaleString('en-IN')}`,
                    `Rs. ${rAmount.toLocaleString('en-IN')}`,
                    paymentStatus,
                    status
                ];
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 52,
                theme: 'grid',
                headStyles: { fillColor: [27, 94, 32], textColor: 255, fontSize: 6 },
                styles: { fontSize: 6, cellPadding: 1 },
                columnStyles: {
                    0: { cellWidth: 8 },
                    7: { cellWidth: 10 },
                    12: { cellWidth: 15 },
                    13: { cellWidth: 15 }
                },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                didDrawPage: (data) => {
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();

                    // BACKGROUND WATERMARKS
                    doc.setGState(new (doc as any).GState({ opacity: 0.25 }));
                    doc.setFontSize(14);
                    doc.setTextColor(200, 0, 0);

                    const watermarkText = `${adminName.toUpperCase()} | ${adminEmail} | ADMIN ACCESS`;
                    const angle = 45;
                    const stepX = 100;
                    const stepY = 100;

                    for (let x = -50; x < pageWidth + 100; x += stepX) {
                        for (let y = -50; y < pageHeight + 100; y += stepY) {
                            doc.text(watermarkText, x, y, { angle });
                        }
                    }

                    doc.setGState(new (doc as any).GState({ opacity: 1 }));

                    // FOOTER
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text("© CAIP Administrative Platform | Internal Use Only", 14, pageHeight - 10);
                    doc.text(`Page ${data.pageNumber}`, pageWidth - 25, pageHeight - 10);
                }
            });

            doc.save(`CAIP_Admin_Master_Defaulter_Report_${new Date().toISOString().split('T')[0]}.pdf`);

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

    return (
        <AdminPortalContainer title="Defaulter List">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Search & Header */}
                {/* Search & Header */}
                <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1 w-full">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search by defaulter, GST, PAN, district or member..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-10 pr-4 py-2 text-[15px] font-normal text-black outline-none focus:border-[#1b5e20] focus:bg-white transition-all shadow-sm placeholder:text-gray-400"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                </span>
                            </div>
                        </div>
                        <div className="w-full md:w-auto">
                            <button
                                onClick={handleExportPDF}
                                className="w-full md:w-auto bg-white text-rose-600 border border-rose-100 px-6 py-2 rounded-lg hover:bg-rose-50 transition-all flex items-center justify-center gap-2.5 shadow-sm text-sm font-bold whitespace-nowrap active:scale-95 cursor-pointer"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" /></svg>
                                Export PDF
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-50">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">State</label>
                            <select
                                value={filters.state}
                                onChange={(e) => setFilters(p => ({ ...p, state: e.target.value, district: '', subDistrict: '', city: '' }))}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all cursor-pointer"
                            >
                                <option value="">Select state</option>
                                {states.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">District</label>
                            <select
                                value={filters.district}
                                disabled={!filters.state}
                                onChange={(e) => setFilters(p => ({ ...p, district: e.target.value, subDistrict: '', city: '' }))}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all disabled:opacity-40 cursor-pointer"
                            >
                                <option value="">Select District</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Sub-District</label>
                            <select
                                value={filters.subDistrict}
                                disabled={!filters.district}
                                onChange={(e) => setFilters(p => ({ ...p, subDistrict: e.target.value, city: '' }))}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all disabled:opacity-40 cursor-pointer"
                            >
                                <option value="">Select Sub-District</option>
                                {subDistricts.map(sd => <option key={sd} value={sd}>{sd}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">City/Town/Village</label>
                            <select
                                value={filters.city}
                                disabled={!filters.subDistrict}
                                onChange={(e) => setFilters(p => ({ ...p, city: e.target.value }))}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all disabled:opacity-40 cursor-pointer"
                            >
                                <option value="">Select Location Type</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Financial Year</label>
                            <select
                                value={filters.financialYear}
                                onChange={(e) => setFilters(p => ({ ...p, financialYear: e.target.value }))}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[15px] font-normal text-gray-700 outline-none focus:border-[#1b5e20] transition-all cursor-pointer"
                            >
                                <option value="">Select Financial Year</option>
                                {Array.from({ length: 6 }).map((_, i) => {
                                    const yr = 2024 - i;
                                    const val = `${yr}-${(yr + 1).toString().slice(-2)}`;
                                    return <option key={val} value={val}>{val}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#1b5e20] px-6 py-4 flex items-center gap-3 text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        <h3 className="text-[16px] font-semibold tracking-tight">Defaulter List</h3>
                    </div>
                    <div className="p-4 md:p-5">
                        <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                            <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[2800px]">
                                    <thead className="bg-[#051a02] text-white sticky top-0 z-10">
                                        <tr className="divide-x divide-white/5">
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">#</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Defaulter Firm Name</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Reported Date</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Reported By</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Reported By (Company)</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">GST</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">CIN</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Financial Year</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Default Amount</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Outstanding Amount</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Recovery Amount</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Recovery Status</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">State</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">District</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">Sub District</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight">City/Town/Village</th>
                                            <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            Array.from({ length: 8 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={17} className="px-4 py-8">
                                                        <div className="h-4 bg-gray-50 rounded w-full"></div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : paginatedItems.length > 0 ? (
                                            paginatedItems.map((def, i) => {
                                                const isPaid = Number(def.outstanding_amount ?? def.default_amount ?? 0) === 0;
                                                return (
                                                    <tr key={def._id} className={`${isPaid ? 'bg-green-50/50 hover:bg-green-100/50' : 'hover:bg-gray-50/80'} transition-colors group divide-x divide-gray-50`}>

                                                        <td className="px-4 py-3 text-sm text-gray-400 font-medium whitespace-nowrap">
                                                            {(currentPage - 1) * itemsPerPage + i + 1}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap uppercase">
                                                            {def.defaulter_name}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                            {new Date(def.createdAt).toLocaleDateString('en-GB')}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap capitalize">
                                                            {def.user_id?.name || 'Unknown'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap capitalize">
                                                            {def.user_id?.companyName || 'Unknown'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-800 font-medium text-center whitespace-nowrap uppercase">
                                                            {def.gst_number || '---'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-800 font-medium text-center whitespace-nowrap uppercase">
                                                            {def.cin_number || '---'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-800 font-medium text-center whitespace-nowrap">
                                                            {def.financial_year || '---'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                                                            ₹{Number(def.default_amount || 0).toLocaleString('en-IN')}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                                                            ₹{Number(def.outstanding_amount ?? def.default_amount ?? 0).toLocaleString('en-IN')}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                                                            ₹{((def.default_amount || 0) - (def.outstanding_amount ?? def.default_amount ?? 0)).toLocaleString('en-IN')}
                                                        </td>
                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            {(() => {
                                                                const dAmount = Number(def.default_amount || 0);
                                                                const oAmount = Number(def.outstanding_amount ?? def.default_amount ?? 0);
                                                                const rAmount = dAmount - oAmount;

                                                                if (oAmount === 0) {
                                                                    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-600 border-emerald-100">Paid</span>;
                                                                } else if (rAmount > 0) {
                                                                    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-600 border-amber-100">Partial Paid</span>;
                                                                } else {
                                                                    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-rose-50 text-rose-600 border-rose-100">Not Paid</span>;
                                                                }
                                                            })()}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{def.state}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{def.district}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{def.cities || def.sub_district || '---'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{def.city || '---'}</td>
                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleViewClick(def)}
                                                                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-emerald-100 active:scale-95 cursor-pointer"
                                                            >
                                                                View Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="px-8 py-32 text-center text-gray-400">
                                                    <div className="text-5xl mb-6 opacity-20">📂</div>
                                                    <p className="text-sm font-bold tracking-widest uppercase">No Defaulters Found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Page {currentPage} OF {totalPages}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 disabled:opacity-30 transition-all shadow-sm active:scale-95 cursor-pointer"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-1.5 rounded-lg bg-[#1b5e20] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1a4a1c] disabled:opacity-30 transition-all shadow-sm active:scale-95 cursor-pointer"
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

            {/* View Modal */}
            {showDetails && selectedDefaulter && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-[#1b5e20] px-6 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                <h3 className="text-lg font-bold tracking-tight">Defaulter Record</h3>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all cursor-pointer">
                                ✕
                            </button>
                        </div>

                        <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10 bg-white">
                            {/* Section 1: Defaulter Company Details */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#1b5e20] rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Defaulter Company Details</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Defaulter Firm name" value={selectedDefaulter.defaulter_name} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>} />
                                    <DetailRow label="Type of Defaulter" value={selectedDefaulter.industry} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" /></svg>} />
                                    <DetailRow label="GST" value={selectedDefaulter.gst_number} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>} />
                                    <DetailRow label="CIN" value={selectedDefaulter.cin_number || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
                                </div>
                            </div>

                            {/* Section 2: Contact & Location */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#ffcd1e] rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Contact & Address</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Mobile" value={selectedDefaulter.mobile_number} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>} />
                                    <DetailRow label="Email" value={selectedDefaulter.email_id} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>} />
                                    <DetailRow label="State" value={selectedDefaulter.state} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>} />
                                    <DetailRow label="District" value={selectedDefaulter.district} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" /><path d="M10 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" /><path d="M2 7h20" /></svg>} />
                                    <DetailRow label="Sub district" value={selectedDefaulter.cities || selectedDefaulter.sub_district || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15.5 5.5-3 3-3-3" /><path d="m15.5 11.5-3 3-3-3" /><path d="m15.5 17.5-3 3-3-3" /></svg>} />
                                    <DetailRow label="City" value={selectedDefaulter.city || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" /></svg>} />
                                    <div className="col-span-full pt-2">
                                        <DetailRow label="Full address" value={selectedDefaulter.defaulter_address} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>} />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Owners/Partners Information */}
                            {selectedDefaulter.defaulter_persons?.length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-amber-500 rounded-full opacity-50"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Owners/Partners Details</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedDefaulter.defaulter_persons.map((person: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 space-y-3 shadow-sm text-left">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#1b5e20] shadow-sm border border-gray-100">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Person Name</span>
                                                        <span className="text-[14px] font-bold text-gray-900 truncate tracking-tight">{person.name || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PAN</span>
                                                        <span className="text-[13px] font-medium text-gray-700">{person.pan || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aadhar</span>
                                                        <span className="text-[13px] font-medium text-gray-700">{person.aadhar || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section 3: Financial Status */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-[#1b5e20] rounded-full opacity-50"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Financial Status</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Default Amount" value={`₹${Number(selectedDefaulter.default_amount).toLocaleString()}`} icon={
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" ><path d="M6 4h10" /><path d="M6 8h10" /><path d="M6 12h6a4 4 0 0 0 0-8" /><path d="M10 12l5 8" /></svg>
                                    } />
                                    <DetailRow label="Outstanding" value={`₹${Number(selectedDefaulter.outstanding_amount || selectedDefaulter.default_amount).toLocaleString()}`} icon={
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" ><path d="M6 4h10" /><path d="M6 8h10" /><path d="M6 12h6a4 4 0 0 0 0-8" /><path d="M10 12l5 8" /></svg>
                                    } />
                                    <DetailRow label="Date of Default" value={selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toLocaleDateString() : 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
                                    <DetailRow label="Financial Year" value={selectedDefaulter.financial_year || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>} />
                                    <DetailRow label="Legal action taken" value={selectedDefaulter.legal_status_taken ? 'Yes' : 'No'} isStatus icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>} />
                                    <div className="col-span-full">
                                        <DetailRow label="Reason for Default" value={selectedDefaulter.reason_description || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h.01" /><path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" /><path d="M12 9v4" /></svg>} />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Settlement Details */}
                            {selectedDefaulter.isSettled && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
                                        <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                                        <h4 className="text-[15px] font-bold text-emerald-900 tracking-tight">Settlement Details</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12 p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                                        <DetailRow label="Settled Amount" value={`₹${Number(selectedDefaulter.settledAmount || 0).toLocaleString()}`} isHighlights icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>} />
                                        <DetailRow label="Settled By" value={selectedDefaulter.settledBy || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                                        <DetailRow label="Settlement Date" value={selectedDefaulter.settlementDate ? new Date(selectedDefaulter.settlementDate).toLocaleDateString() : 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
                                    </div>
                                </div>
                            )}

                            {/* Section 5: Report Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-emerald-100 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Report Information</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                    <DetailRow label="Report by person name" value={selectedDefaulter.user_id?.name || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                                    <DetailRow label="Report by company name" value={selectedDefaulter.user_id?.companyName || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>} />
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
                                                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-[#1b5e20] hover:bg-emerald-50/10 transition-all group shadow-sm text-left"
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPdf ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                                        {isPdf ? (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                        ) : (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-bold text-gray-900 truncate uppercase">Document {idx + 1}</span>
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
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                    <div className="w-1 h-6 bg-blue-100 rounded-full"></div>
                                    <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Payment Records</h4>
                                </div>
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left font-sans text-[14px]">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-widest">
                                                <th className="px-6 py-4">#</th>
                                                <th className="px-6 py-4">Payment Date</th>
                                                <th className="px-6 py-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-medium">
                                            {selectedDefaulter.payments?.length > 0 ? (
                                                selectedDefaulter.payments.map((p: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-400">{(idx + 1).toString().padStart(2, '0')}</td>
                                                        <td className="px-6 py-4">{new Date(p.date).toLocaleDateString('en-GB')}</td>
                                                        <td className="px-6 py-4 font-bold text-[#1b5e20] text-right">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-12 text-center text-[13px] font-medium text-gray-400 italic">No associated payments recorded.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] selection:bg-none">
                            <button onClick={() => setShowDetails(false)} className="px-10 py-3 bg-[#1b5e20] text-white rounded-xl text-[14px] font-bold shadow-xl shadow-[#1b5e20]/20 hover:bg-[#144317] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 cursor-pointer">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 2px solid #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </AdminPortalContainer>
    );
}
