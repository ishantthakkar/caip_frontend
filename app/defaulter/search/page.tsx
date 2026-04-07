"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import dynamic from 'next/dynamic';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const IndiaMap = dynamic(() => import('@/components/IndiaMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
    </div>
});

const DetailRow = ({ label, value, icon, isHighlights = false, isStatus = false }: any) => (
    <div className="flex gap-4 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isHighlights ? 'bg-emerald-50 text-[#1b5e20]' : 'bg-gray-50 text-gray-400'}`}>
            {icon}
        </div>
        <div className="flex flex-col min-w-0">
            <label className="text-[13px] font-medium text-gray-400 tracking-tight leading-none mb-1.5">{label}</label>
            <div className={`text-[15px] font-medium tracking-tight truncate ${isHighlights ? 'text-[#1b5e20] font-bold' : 'text-gray-900'} ${isStatus ? 'bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-full inline-block w-fit text-[12px] font-bold' : ''}`}>
                {value || '-'}
            </div>
        </div>
    </div>
);

export default function SearchDefaulterPage() {
    const [searching, setSearching] = useState(false);
    const [defaulters, setDefaulters] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);

    // Modal States
    const [selectedDefaulter, setSelectedDefaulter] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showPersons, setShowPersons] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [cities, setCities] = useState<any[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [subDistricts, setSubDistricts] = useState<string[]>([]);
    const [filters, setFilters] = useState({
        gst: '', pan: '', cin: '', aadhar: '', mobile: '', name: '', address: '', state: '', district: '', subDistrict: '', city: '', member_name: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    useEffect(() => {
        fetchLocations();
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));

        // Initial load of latest defaulters
        fetchDefaulters(true);
    }, []);

    const getSearchField = (filters: any) => {
        if (!filters) return '-';
        const fields: string[] = [];
        if (filters.gst) fields.push(`GST: ${filters.gst}`);
        if (filters.pan) fields.push(`PAN: ${filters.pan}`);
        if (filters.cin) fields.push(`CIN: ${filters.cin}`);
        if (filters.aadhar) fields.push(`Aadhar: ${filters.aadhar}`);
        if (filters.mobile) fields.push(`Mobile: ${filters.mobile}`);
        if (filters.name) fields.push(`Name: ${filters.name}`);
        if (filters.state) fields.push(`State: ${filters.state}`);
        return fields.length > 0 ? fields.join(', ') : 'All Records';
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
            if (res.ok) setCities(data.cities || []);
        } catch (error) {
            console.error("Error fetching cities:", error);
        }
    };

    useEffect(() => {
        if (filters.state) {
            fetchDistricts(filters.state);
        }
    }, [filters.state]);

    useEffect(() => {
        if (filters.state && filters.district) {
            fetchSubDistricts(filters.state, filters.district);
        }
    }, [filters.district]);

    useEffect(() => {
        if (filters.state && filters.district && filters.subDistrict) {
            fetchCities(filters.state, filters.district, filters.subDistrict);
        } else {
            setCities([]);
        }
    }, [filters.state, filters.district, filters.subDistrict]);

    const fetchDefaulters = async (isDefaultLoad = false) => {
        setSearching(true);
        try {
            const token = localStorage.getItem('token');
            const url = new URL(`${API_BASE_URL}defaulter/search`);
            Object.keys(filters).forEach(key => {
                const val = (filters as any)[key];
                if (val) url.searchParams.append(key, val);
            });
            if (isDefaultLoad) {
                url.searchParams.append('defaultLoad', 'true');
            }

            const response = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setDefaulters(data.data || []);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const hasFilter = Object.values(filters).some(val => val.trim() !== '');
        if (!hasFilter) {
            setError('Please enter at least one search field.');
            return;
        }
        setError('');
        setHasSearched(true);
        fetchDefaulters(false);
    };

    const handleReset = () => {
        setFilters({ gst: '', pan: '', cin: '', aadhar: '', mobile: '', name: '', address: '', state: '', district: '', subDistrict: '', city: '', member_name: '' });
        setHasSearched(false);
        setDefaulters([]);
        setError('');
        setShowAdvanced(false);
        setCities([]);
        // Re-load default 50 records when clear is clicked
        fetchDefaulters(true);
    };

    const handleDownloadPDF = async () => {
        try {
            const doc = new jsPDF('landscape');

            doc.setFontSize(18);
            doc.setTextColor(27, 94, 32);
            doc.text("Search Results Report", 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            const memberName = user?.name || 'N/A';
            const memberId = user?.memberId || user?._id?.slice(-8).toUpperCase() || 'N/A';

            doc.text(`Downloaded By: ${memberName} (${memberId})`, 14, 32);
            doc.text(`Downloaded On: ${new Date().toLocaleString('en-GB')}`, 14, 38);

            const tableColumn = [
                "Sr.",
                "Defaulter Company",
                "Amount",
                "Outstanding",
                "GST",
                "PAN",
                "CIN / Aadhar",
                "State",
                "District",
                "Sub-District",
                "City/Town/Village",
                "Status"
            ];

            const tableRows = defaulters.map((def, idx) => [
                idx + 1,
                def.defaulter_name || '-',
                `Rs. ${Number(def.default_amount).toLocaleString('en-IN')}`,
                `Rs. ${Number(def.outstanding_amount || def.default_amount).toLocaleString('en-IN')}`,
                def.gst_number || '-',
                def.pan_number || '-',
                def.cin_number || def.aadhar_number || '-',
                def.state || '-',
                def.district || '-',
                def.cities || '-',
                def.city || '-',
                (def.isSettled || Number(def.outstanding_amount ?? def.default_amount) === 0) ? 'CLEARED' : 'PENDING'
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 46,
                theme: 'grid',
                headStyles: { fillColor: [27, 94, 32], textColor: 255, fontSize: 8 },
                styles: { fontSize: 8 },
                didDrawPage: (data) => {
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();

                    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
                    doc.setFontSize(14);
                    doc.setTextColor(200, 0, 0);

                    const watermarkText = `${memberName.toUpperCase()} | ID: ${memberId}`;
                    const angle = 45;
                    for (let x = -50; x < pageWidth + 100; x += 100) {
                        for (let y = -50; y < pageHeight + 100; y += 100) {
                            doc.text(watermarkText, x, y, { angle });
                        }
                    }
                    doc.setGState(new (doc as any).GState({ opacity: 1 }));
                }
            });

            doc.save(`Search_Report_${new Date().getTime()}.pdf`);
        } catch (e) {
            console.error("PDF download error:", e);
            alert("Failed to generate PDF");
        }
    };

    const handleFilterChange = (field: string, value: string) => {
        setError('');
        setFilters(prev => ({
            ...prev,
            [field]: value,
            ...(field === 'state' ? { district: '', subDistrict: '', city: '' } : {}),
            ...(field === 'district' ? { subDistrict: '', city: '' } : {}),
            ...(field === 'subDistrict' ? { city: '' } : {})
        }));
    };

    const getPaymentRecoveryStatus = (def: any) => {
        if (def.isSettled) return { label: 'Settled', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };

        const defaultAmt = Number(def.default_amount) || 0;
        const outstandingAmt = def.outstanding_amount !== undefined ? Number(def.outstanding_amount) : defaultAmt;

        if (outstandingAmt === 0) return { label: 'Full Paid', color: 'bg-green-50 text-green-700 border-green-200' };
        if (outstandingAmt > 0 && outstandingAmt < defaultAmt) return { label: 'Partial Paid', color: 'bg-orange-50 text-orange-700 border-orange-200' };
        return { label: 'Not Paid', color: 'bg-red-50 text-red-700 border-red-200' };
    };

    const handleViewClick = (def: any) => {
        setSelectedDefaulter(def);
        setShowDetails(true);
    };

    const handleViewPersons = (def: any) => {
        setSelectedDefaulter(def);
        setShowPersons(true);
    };

    return (
        <MemberPortalContainer title="Search Defaulter">
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Search Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Search Defaulter</h2>
                        </div>
                        <Link
                            href="/defaulter/history"
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
                            Search History
                        </Link>
                    </div>

                    <form onSubmit={handleSearch} className="p-6 space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: 'GST', name: 'gst', placeholder: 'Enter GST' },
                                { label: 'PAN', name: 'pan', placeholder: 'Enter PAN' },
                                { label: 'CIN', name: 'cin', placeholder: 'Enter CIN' },
                                { label: 'Mobile', name: 'mobile', placeholder: 'Enter Mobile Number' },
                                { label: 'Company', name: 'name', placeholder: 'Search by Company Name' },
                                { label: 'Address', name: 'address', placeholder: 'Search by Address' }
                            ].map((f) => (
                                <div key={f.name} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600 tracking-wider">{f.label}</label>
                                    <input
                                        type="text"
                                        name={f.name}
                                        value={(filters as any)[f.name]}
                                        onChange={(e) => handleFilterChange(f.name, e.target.value)}
                                        placeholder={f.placeholder}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm"
                                    />
                                </div>
                            ))}

                        </div>

                        <div className="flex items-center pt-6 pb-2">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="px-6 py-2.5 bg-green-50 text-green-700 font-bold text-sm rounded-lg hover:bg-green-100 transition-all flex items-center gap-3 border border-green-200/50 shadow-sm active:scale-95"
                            >
                                <div className="p-1 bg-green-600 rounded-md">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>
                                        <path d="M12 5v14M5 12h14" className={showAdvanced ? 'opacity-0' : 'opacity-100'} transition-opacity="true" />
                                        <path d="M5 12h14" />
                                    </svg>
                                </div>
                                {showAdvanced ? "Basic Search Mode" : "Advanced Filters"}
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-50 animate-in slide-in-from-top-2 duration-300">


                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600  tracking-wider">State</label>
                                    <select
                                        value={filters.state}
                                        onChange={(e) => handleFilterChange('state', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm appearance-none"
                                    >
                                        <option value="">Select State</option>
                                        {locations.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600  tracking-wider">District</label>
                                    <select
                                        value={filters.district}
                                        onChange={(e) => handleFilterChange('district', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm appearance-none"
                                        disabled={!filters.state}
                                    >
                                        <option value="">Select Districts</option>
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600  tracking-wider">Sub-District</label>
                                    <select
                                        value={filters.subDistrict}
                                        onChange={(e) => handleFilterChange('subDistrict', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm appearance-none"
                                        disabled={!filters.district}
                                    >
                                        <option value="">Select Sub-Districts</option>
                                        {subDistricts.map(sd => <option key={sd} value={sd}>{sd}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600  tracking-wider">City/Town/Village</label>
                                    <select
                                        value={filters.city}
                                        onChange={(e) => handleFilterChange('city', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm appearance-none"
                                        disabled={!filters.subDistrict}
                                    >
                                        <option value="">Select Cities/Town/Village</option>
                                        {cities.map((city: any) => <option key={city} value={city}>{city}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600 tracking-wider">Reported by Member</label>
                                    <input
                                        type="text"
                                        name="member_name"
                                        value={(filters as any).member_name || ''}
                                        onChange={(e) => handleFilterChange('member_name', e.target.value)}
                                        placeholder="Search by reporting member name..."
                                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={searching}
                                className="w-full sm:w-auto min-w-[160px] bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-md shadow-green-900/10 hover:bg-green-700 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                            >
                                {searching ? "Searching..." : "Search Records"}
                            </button>

                            {hasSearched && defaulters.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleDownloadPDF}
                                    className="w-full sm:w-auto min-w-[180px] bg-[#1b5e20] text-white font-bold py-2.5 px-6 rounded-lg shadow-md shadow-green-900/10 hover:bg-green-800 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                    Search Report PDF
                                </button>
                            )}

                            <div className="flex-1"></div>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-full sm:w-auto px-6 py-2.5 border border-gray-200 text-gray-500 font-bold rounded-lg hover:bg-gray-100 transition-all text-sm"
                            >
                                Clear All
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {defaulters.length === 0 ? (
                        <div className="bg-white rounded-xl p-16 text-center border border-red-50 shadow-sm">
                            <h3 className="text-sm font-bold text-red-500">No records found</h3>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-green-600 px-6 py-3">
                                <span className="text-white text-xs font-bold  tracking-widest leading-none">Defaulter Records: {defaulters.length} Records</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500  tracking-wider">#</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500  tracking-wider">Reported By (Member)</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500  tracking-wider">Reported By (Company)</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500  tracking-wider">Defaulter Company</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500  tracking-wider">Address</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500  tracking-wider">Mobile</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500  tracking-wider">GST</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500  tracking-wider">CIN</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500  tracking-wider">Defaulter Persons</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">State</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">District</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Sub-District</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">City/Town/Village</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Default Amount</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Outstanding Amount</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Recovery Amount</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider text-center">Payment Recovery Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider text-center">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 whitespace-nowrap">
                                        {defaulters
                                            .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                                            .map((def, i) => {
                                                const absoluteIndex = (currentPage - 1) * ITEMS_PER_PAGE + i + 1;
                                                const isPaid = Number(def.outstanding_amount ?? def.default_amount) === 0;
                                                return (
                                                    <tr key={def._id} className={`${isPaid ? 'bg-green-50/50 hover:bg-green-100/50' : 'hover:bg-gray-50/80'} transition-colors`}>

                                                        <td className="px-6 py-4 text-xs text-gray-500">{absoluteIndex}</td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-bold text-gray-700">{def.user_id?.name || 'N/A'}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-bold">{def.user_id?.companyName || 'Verified Member'}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-bold text-gray-900">{def.defaulter_name}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs text-gray-600 line-clamp-2 max-w-[150px] whitespace-normal">{def.defaulter_address || 'N/A'}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs text-gray-600 line-clamp-2 max-w-[150px] whitespace-normal">{def.mobile_number || 'N/A'}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs text-gray-500 font-mono tracking-tighter">{def.gst_number || '-'}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs text-gray-500 font-mono tracking-tighter">{def.cin_number || '-'}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {(() => {
                                                                const validPersons = (def.defaulter_persons || []).filter((p: any) =>
                                                                    (p.name && p.name.trim() !== '') ||
                                                                    (p.pan && p.pan.trim() !== '') ||
                                                                    (p.aadhar && p.aadhar.trim() !== '')
                                                                );

                                                                if (validPersons.length > 0) {
                                                                    return (
                                                                        <button
                                                                            onClick={() => handleViewPersons(def)}
                                                                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-[10px] font-bold hover:bg-gray-200 transition-colors border border-gray-200 flex items-center gap-1.5"
                                                                        >
                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                                                            View ({validPersons.length})
                                                                        </button>
                                                                    );
                                                                }
                                                                return <span className="text-[10px] font-semibold text-gray-400 italic">Not Available</span>;
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-bold text-gray-700">{def.state}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-bold text-gray-700">{def.district}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-bold text-gray-700">{def.cities || def.sub_district || '-'}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-bold text-gray-700">{def.city || '-'}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-[13px] font-bold text-gray-900 font-sans">₹{Number(def.default_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-[13px] font-bold text-gray-900 font-sans">₹{Number(def.outstanding_amount ?? def.default_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-[13px] font-bold text-blue-600 font-sans">₹{((def.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {def.isExternal ? (
                                                                <span className="px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap border bg-gray-50 text-gray-400 border-gray-100">
                                                                    N/A
                                                                </span>
                                                            ) : (() => {
                                                                const paymentStatus = getPaymentRecoveryStatus(def);
                                                                return (
                                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap border ${paymentStatus.color}`}>
                                                                        {paymentStatus.label}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {def.isExternal ? (
                                                                <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded text-[10px] font-bold">
                                                                    Not Reported
                                                                </span>
                                                            ) : (() => {
                                                                const outstanding = Number(def.outstanding_amount === undefined ? def.default_amount : def.outstanding_amount);
                                                                const isCleared = def.isSettled || outstanding === 0;
                                                                return (
                                                                    <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded text-[10px] font-bold">
                                                                        Defaulter
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => handleViewClick(def)}
                                                                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm"
                                                            >
                                                                Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {Math.ceil(defaulters.length / ITEMS_PER_PAGE) > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white text-sm">
                                    <span className="text-gray-500">
                                        Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, defaulters.length)}</span> of <span className="font-semibold text-gray-900">{defaulters.length}</span> entries
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-2 py-1 text-gray-400 font-medium hover:text-gray-700 transition-colors disabled:opacity-40"
                                        >
                                            Previous
                                        </button>

                                        {Array.from({ length: Math.ceil(defaulters.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(pageNum => (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`min-w-[32px] h-[32px] flex items-center justify-center rounded-md font-semibold transition-all ${currentPage === pageNum ? 'bg-[#1b5e20] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(defaulters.length / ITEMS_PER_PAGE), p + 1))}
                                            disabled={currentPage === Math.ceil(defaulters.length / ITEMS_PER_PAGE)}
                                            className="px-2 py-1 text-gray-400 font-medium hover:text-gray-700 transition-colors disabled:opacity-40"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {showDetails && selectedDefaulter && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(false)}></div>
                        <div className="relative bg-[#fbfcff] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-500 text-left">
                            {/* Modal Header */}
                            <div className="px-8 py-5 bg-[#1b5e20] flex items-center justify-between text-white shadow-lg relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-white/10 rounded-xl">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] font-bold tracking-tight">Defaulter Record Details</h3>
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
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Defaulter Company Details</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                        <DetailRow label="Defaulter Firm name" value={selectedDefaulter.defaulter_name} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>} />
                                        <DetailRow label="Type of Defaulter" value={selectedDefaulter.industry} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" /></svg>} />
                                        <DetailRow label="GST" value={selectedDefaulter.gst_number} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>} />
                                        <DetailRow label="CIN" value={selectedDefaulter.cin_number || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
                                    </div>
                                </div>

                                {/* Section: Owners/Partners Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-slate-400 rounded-full"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Owners/Partners Details</h4>
                                    </div>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                        <table className="w-full text-left font-sans">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">#</th>
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">Name</th>
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">PAN</th>
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">Aadhar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedDefaulter.defaulter_persons && selectedDefaulter.defaulter_persons.length > 0 ? (
                                                    selectedDefaulter.defaulter_persons.map((p: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-[14px] font-bold">{(idx + 1).toString().padStart(2, '0')}</td>
                                                            <td className="px-6 py-4 text-[14px] font-bold text-gray-900">{p.name || 'N/A'}</td>
                                                            <td className="px-6 py-4 text-[13px] font-mono font-medium text-gray-600">{p.pan || 'N/A'}</td>
                                                            <td className="px-6 py-4 text-[13px] font-mono font-medium text-gray-600">{p.aadhar || 'N/A'}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-8 text-center text-[13px] font-medium text-gray-400 italic">No owner/partner details recorded.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
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
                                        <DetailRow label="Sub district" value={selectedDefaulter.cities || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15.5 5.5-3 3-3-3" /><path d="m15.5 11.5-3 3-3-3" /><path d="m15.5 17.5-3 3-3-3" /></svg>} />
                                        <DetailRow label="City/Town/Village" value={selectedDefaulter.city || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" /></svg>} />
                                        <div className="col-span-full pt-2">
                                            <DetailRow label="Full address" value={selectedDefaulter.defaulter_address} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Financial Status */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-[#1b5e20] rounded-full opacity-50"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Financial Status</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                        <DetailRow label="Default amount" value={`₹${Number(selectedDefaulter.default_amount).toLocaleString()}`} isHighlights icon={<svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M6 4h10" />
                                            <path d="M6 8h10" />
                                            <path d="M6 12h6a4 4 0 0 0 0-8" />
                                            <path d="M10 12l5 8" />
                                        </svg>} />
                                        <DetailRow label="Outstanding" value={`₹${Number(selectedDefaulter.outstanding_amount || selectedDefaulter.default_amount).toLocaleString()}`} isHighlights icon={<svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M6 4h10" />
                                            <path d="M6 8h10" />
                                            <path d="M6 12h6a4 4 0 0 0 0-8" />
                                            <path d="M10 12l5 8" />
                                        </svg>} />
                                        <DetailRow label="Date of default" value={selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toLocaleDateString() : 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
                                        <DetailRow label="Financial year" value={selectedDefaulter.financial_year || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>} />
                                        <DetailRow label="Legal action taken" value={selectedDefaulter.legal_status_taken ? 'Yes' : 'No'} isStatus icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>} />
                                        <div className="col-span-full">
                                            <DetailRow label="Reason for Default" value={selectedDefaulter.reason_description || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h.01" /><path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" /><path d="M12 9v4" /></svg>} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5: Report Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-emerald-100 rounded-full"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Report Information</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                        <DetailRow label="Report by Person Name" value={selectedDefaulter.user_id?.name || user?.name || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                                        <DetailRow label="Report by Company Name" value={selectedDefaulter.user_id?.companyName || user?.companyName || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>} />
                                    </div>
                                </div>

                                {/* Section: Settlement Details */}
                                {selectedDefaulter.isSettled && (
                                    <div className="space-y-6 animate-in fade-in duration-700">
                                        <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
                                            <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                                            <h4 className="text-[15px] font-bold text-emerald-900 tracking-tight flex items-center gap-2">
                                                Settlement Details
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12 p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                                            <DetailRow label="Settled Amount" value={`₹${Number(selectedDefaulter.settledAmount || 0).toLocaleString()}`} isHighlights icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>} />
                                            <DetailRow label="Settled By" value={selectedDefaulter.settledBy || 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                                            <DetailRow label="Settlement Date" value={selectedDefaulter.settlementDate ? new Date(selectedDefaulter.settlementDate).toLocaleDateString() : 'N/A'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
                                        </div>
                                    </div>
                                )}

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
                                                <p className="text-[13px] font-medium">No Documents</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 7: Payment Records */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-1 h-6 bg-blue-100 rounded-full"></div>
                                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Payment Records</h4>
                                    </div>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                        <table className="w-full text-left font-sans">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">#</th>
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest">Payment Date</th>
                                                    <th className="px-6 py-4 text-[12px] font-bold tracking-widest text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(() => {
                                                    const displayedPayments = (selectedDefaulter.payments || []).filter((p: any) => p.type !== 'settlement');
                                                    if (displayedPayments.length === 0) return (
                                                        <tr>
                                                            <td colSpan={3} className="px-6 py-12 text-center text-[13px] font-medium text-gray-400 italic">No Recovery Payments.</td>
                                                        </tr>
                                                    );
                                                    return displayedPayments.map((p: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-[14px] font-bold">{(idx + 1).toString().padStart(2, '0')}</td>
                                                            <td className="px-6 py-4 text-[14px] font-medium leading-tight text-center sm:text-left">
                                                                {new Date(p.date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 text-[14px] font-bold text-right text-[#1b5e20]">₹{Number(p.amount).toLocaleString()}</td>
                                                        </tr>
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] selection:bg-none">
                                <button onClick={() => setShowDetails(false)} className="px-10 py-3 bg-[#1b5e20] text-white rounded-xl text-[14px] font-bold shadow-xl shadow-[#1b5e20]/20 hover:bg-[#144317] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Persons Modal */}
                {showPersons && selectedDefaulter && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowPersons(false)}></div>
                        <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    Defaulter Persons ({selectedDefaulter.defaulter_name})
                                </h3>
                                <button onClick={() => setShowPersons(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="border border-gray-100 rounded-lg overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">#</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">PAN</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Aadhar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(() => {
                                                const validPersons = (selectedDefaulter.defaulter_persons || []).filter((p: any) =>
                                                    (p.name && p.name.trim() !== '') ||
                                                    (p.pan && p.pan.trim() !== '') ||
                                                    (p.aadhar && p.aadhar.trim() !== '')
                                                );

                                                if (validPersons.length > 0) {
                                                    return validPersons.map((p: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-4 py-3 text-xs text-gray-500">{idx + 1}</td>
                                                            <td className="px-4 py-3 text-xs font-bold text-gray-800">{p.name || 'N/A'}</td>
                                                            <td className="px-4 py-3 text-xs font-mono text-gray-600">{p.pan || 'N/A'}</td>
                                                            <td className="px-4 py-3 text-xs font-mono text-gray-600">{p.aadhar || 'N/A'}</td>
                                                        </tr>
                                                    ));
                                                }
                                                return (
                                                    <tr>
                                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-xs italic">
                                                            No persons listed for this defaulter.
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setShowPersons(false)}
                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </MemberPortalContainer>
    );
}
