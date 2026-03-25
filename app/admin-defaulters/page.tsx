"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: any }) => (
    <div className="flex items-start gap-4 py-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]/20 mt-1.5 flex-shrink-0" />
        <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-500 capitalize tracking-tight leading-none mb-1.5">{label}</p>
            <p className="text-[15px] font-normal text-black break-words">{value || '-'}</p>
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
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                </span>
                            </div>
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
                            <label className="text-[13px] font-bold text-gray-500 capitalize tracking-tight ml-1">Location Type</label>
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <h3 className="text-[16px] font-semibold tracking-tight">Defaulter List</h3>
                    </div>
                    <div className="p-4 md:p-5">
                        <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                            <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[2800px]">
                            <thead className="bg-[#051a02] text-white sticky top-0 z-10">
                                <tr className="divide-x divide-white/5">
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">#</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Defaulter Company Name</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Reported Date</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Reported By</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">GST No</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Pan No</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">CIN No</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Financial Year</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Default Amount</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Outstanding Amount</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-right">Recovery Amount</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Recovery Status</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">State</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">District</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight">Sub District</th>
                                    <th className="px-4 py-3 text-sm font-semibold tracking-tight text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={8} className="px-4 py-8">
                                                <div className="h-4 bg-gray-50 rounded w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : paginatedItems.length > 0 ? (
                                    paginatedItems.map((def, i) => (
                                        <tr key={def._id} className="hover:bg-gray-50/50 transition-colors group divide-x divide-gray-50">
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
                                            <td className="px-4 py-3 text-sm text-gray-800 font-medium text-center whitespace-nowrap uppercase">
                                                {def.gst_number || '---'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-medium text-center whitespace-nowrap uppercase">
                                                {def.pan_number || '---'}
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
                                                ₹{Number(def.recovered_amount || def.recovery_amount || def.recovered || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${def.status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    def.status === 2 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {def.status === 1 ? 'Settled' : def.status === 2 ? 'Rejected' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{def.state}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap uppercase">{def.district}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{def.cities || def.sub_district || '---'}</td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => handleViewClick(def)}
                                                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-emerald-100 active:scale-95 cursor-pointer"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
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
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <h3 className="text-lg font-bold tracking-tight">Defaulter Master Record</h3>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all cursor-pointer">
                                ✕
                            </button>
                        </div>

                        <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar bg-gray-50/50">
                            <div className="space-y-6">
                                {/* Section 1: Business Profile */}
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h5 className="text-[13px] font-semibold text-gray-500 capitalize tracking-tight mb-6 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-[#1b5e20] rounded-full"></span> Business Profile
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <InfoItem icon={null} label="Defaulter Company Name" value={selectedDefaulter.defaulter_name} />
                                        <InfoItem icon={null} label="Mobile" value={selectedDefaulter.mobile_number} />
                                        <InfoItem icon={null} label="Email" value={selectedDefaulter.email_id} />
                                        <InfoItem icon={null} label="State" value={selectedDefaulter.state} />
                                        <InfoItem icon={null} label="District" value={selectedDefaulter.district} />
                                        <InfoItem icon={null} label="Sub District" value={selectedDefaulter.cities || selectedDefaulter.sub_district} />
                                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                            <InfoItem icon={null} label="Defaulter Address" value={selectedDefaulter.defaulter_address} />
                                        </div>
                                    </div>
                                </div>

                                {/* Statutory & Financials */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                        <h5 className="text-[13px] font-semibold text-gray-500 capitalize tracking-tight mb-6 flex items-center gap-2">
                                            <span className="w-1 h-4 bg-[#1b5e20] rounded-full"></span> Statutory Details
                                        </h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <InfoItem icon={null} label="GST" value={selectedDefaulter.gst_number} />
                                            <InfoItem icon={null} label="PAN" value={selectedDefaulter.pan_number} />
                                            <InfoItem icon={null} label="CIN" value={selectedDefaulter.cin_number} />
                                            <InfoItem icon={null} label="Aadhar" value={selectedDefaulter.aadhar_number} />
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                        <h5 className="text-[13px] font-semibold text-gray-500 capitalize tracking-tight mb-6 flex items-center gap-2">
                                            <span className="w-1 h-4 bg-[#1b5e20] rounded-full"></span> Reporting Context
                                        </h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <InfoItem icon={null} label="Industry" value={selectedDefaulter.industry} />
                                            <InfoItem icon={null} label="Financial Year" value={selectedDefaulter.financial_year} />
                                            <div className="col-span-1 sm:col-span-2">
                                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="w-10 h-10 rounded-full bg-[#1b5e20]/10 text-[#1b5e20] flex items-center justify-center text-lg">👤</div>
                                                    <div>
                                                        <p className="text-[11px] font-medium text-gray-500 capitalize tracking-tight">Reported By</p>
                                                        <p className="text-[15px] font-normal text-black capitalize">{selectedDefaulter.user_id?.name || selectedDefaulter.user_id?.companyName}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Abstract */}
                                <div className="bg-[#1b5e20] p-8 rounded-xl text-white shadow-lg shadow-emerald-900/10">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-medium text-white/60 capitalize tracking-tight">Original Default</p>
                                            <h4 className="text-3xl font-light">₹{Number(selectedDefaulter.default_amount).toLocaleString('en-IN')}</h4>
                                        </div>
                                        <div className="space-y-2 md:border-x border-white/10 md:px-8">
                                            <p className="text-[11px] font-medium text-white/60 capitalize tracking-tight">Current Outstanding</p>
                                            <h4 className="text-3xl font-light text-amber-300">₹{(selectedDefaulter.outstanding_amount ?? selectedDefaulter.default_amount).toLocaleString('en-IN')}</h4>
                                        </div>
                                        <div className="space-y-2 text-md-right">
                                            <p className="text-[11px] font-medium text-white/60 capitalize tracking-tight">Default Date</p>
                                            <h4 className="text-2xl font-light">{selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toLocaleDateString('en-GB') : '-'}</h4>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-white/10">
                                        <p className="text-[11px] font-medium text-white/60 capitalize tracking-tight mb-3">Reason for Default</p>
                                        <p className="text-[16px] font-normal leading-relaxed italic text-white/90">
                                            "{selectedDefaulter.reason_description || 'No description provided'}"
                                        </p>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h5 className="text-[13px] font-semibold text-gray-500 capitalize tracking-tight mb-6 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-[#1b5e20] rounded-full"></span> Attached Evidence
                                    </h5>
                                    {selectedDefaulter.attachment_documents && selectedDefaulter.attachment_documents.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {selectedDefaulter.attachment_documents.map((doc: string, idx: number) => {
                                                const isPdf = doc.toLowerCase().endsWith('.pdf');
                                                return (
                                                    <a key={idx} href={`${ASSETS_BASE_URL}uploads/${doc}`} target="_blank" className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-[#1b5e20] hover:bg-white transition-all group">
                                                        <div className={`w-12 h-12 rounded flex items-center justify-center text-xl ${isPdf ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                                            {isPdf ? '📄' : '🖼️'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[12px] font-normal text-black truncate uppercase">DOCUMENT_{idx + 1}</p>
                                                            <p className="text-[10px] font-medium text-gray-400 capitalize group-hover:text-[#1b5e20]">View File →</p>
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center border-2 border-dashed border-gray-50 rounded-xl">
                                            <p className="text-sm font-medium text-gray-400 capitalize tracking-tight">No evidence files provided.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
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
