"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AdminPortalContainer from '@/components/AdminPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: any }) => (
    <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">{icon}</div>
        <div className="min-w-0">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                {label}: <span className="text-gray-600 lowercase font-medium ml-1">{value}</span>
            </p>
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
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 space-y-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Search</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search....."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-gray-800 outline-none focus:border-agri-green-primary focus:bg-white transition-all italic"
                                />
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="bg-emerald-50 px-6 py-4 rounded-2xl border border-emerald-100 text-center">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Total Records</p>
                                <h4 className="text-xl font-black text-emerald-900 leading-none">{processedData.length}</h4>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">State</label>
                            <select
                                value={filters.state}
                                onChange={(e) => setFilters(p => ({ ...p, state: e.target.value, district: '', subDistrict: '', city: '' }))}
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:border-agri-green-primary transition-all"
                            >
                                <option value="">All States</option>
                                {states.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">District</label>
                            <select
                                value={filters.district}
                                disabled={!filters.state}
                                onChange={(e) => setFilters(p => ({ ...p, district: e.target.value, subDistrict: '', city: '' }))}
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:border-agri-green-primary transition-all disabled:opacity-40"
                            >
                                <option value="">All Districts</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Sub-District</label>
                            <select
                                value={filters.subDistrict}
                                disabled={!filters.district}
                                onChange={(e) => setFilters(p => ({ ...p, subDistrict: e.target.value, city: '' }))}
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:border-agri-green-primary transition-all disabled:opacity-40"
                            >
                                <option value="">All Sub-Districts</option>
                                {subDistricts.map(sd => <option key={sd} value={sd}>{sd}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">City/Town/Village</label>
                            <select
                                value={filters.city}
                                disabled={!filters.subDistrict}
                                onChange={(e) => setFilters(p => ({ ...p, city: e.target.value }))}
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:border-agri-green-primary transition-all disabled:opacity-40"
                            >
                                <option value="">All Cities</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Financial Year</label>
                            <select
                                value={filters.financialYear}
                                onChange={(e) => setFilters(p => ({ ...p, financialYear: e.target.value }))}
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:border-agri-green-primary transition-all"
                            >
                                <option value="">All Years</option>
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
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-agri-green-primary text-white">
                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10">
                                    <th className="px-8 py-6">Sr.</th>
                                    <th className="px-8 py-6">Defaulter Name</th>
                                    <th className="px-8 py-6">Reporting Member</th>
                                    <th className="px-8 py-6">Reported Date</th>
                                    <th className="px-8 py-6">Outstanding</th>
                                    <th className="px-8 py-6">Location</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={8} className="px-8 py-6"><div className="h-10 bg-gray-50 rounded-xl w-full"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedItems.length > 0 ? (
                                    paginatedItems.map((def, i) => (
                                        <tr key={def._id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-8 py-6 text-xs font-bold text-gray-400">
                                                {(currentPage - 1) * itemsPerPage + i + 1}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-900 tracking-tight">{def.defaulter_name}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 italic">{def.gst_number || def.pan_number || 'No GST/PAN'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-agri-green-primary uppercase tracking-widest">{def.user_id?.companyName || 'Unknown'}</span>
                                                    <span className="text-[9px] font-bold text-gray-400">ID: {def.user_id?.memberId || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-gray-800">
                                                    {new Date(def.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-rose-600">
                                                    ₹{Number(def.outstanding_amount ?? def.default_amount).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{def.district}</span>
                                                    <span className="text-[9px] font-bold text-gray-400">{def.state}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${def.status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    def.status === 2 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {def.status === 1 ? 'Approved' : def.status === 2 ? 'Rejected' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={() => handleViewClick(def)}
                                                    className="bg-agri-green-primary text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-agri-green-900 transition-all shadow-md active:scale-95 whitespace-nowrap"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-48 text-center text-gray-300">
                                            <div className="text-7xl mb-6 opacity-20">📂</div>
                                            <p className="text-sm font-black uppercase tracking-[0.2em] italic">No Defaulters Found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-10 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                                Page {currentPage} OF {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-6 py-2 rounded-xl bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-6 py-2 rounded-xl bg-agri-green-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-agri-green-900 disabled:opacity-30 transition-all shadow-md active:scale-95"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* View Modal */}
            {showDetails && selectedDefaulter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(false)}></div>
                    <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-300">
                        {/* Header */}
                        <div className="px-10 py-8 bg-agri-green-primary flex items-center justify-between text-white border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">👤</div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tighter">Defaulter Master Record</h3>
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-0.5">Comprehensive audit trail & profile</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all active:scale-90">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-0 overflow-y-auto no-scrollbar bg-gray-50/30">
                            <div className="p-8 lg:p-12 space-y-10">

                                {/* Section 1: Business Profile */}
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                                    <h5 className="text-[10px] font-black text-agri-green-primary uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                        <span className="w-5 h-5 rounded bg-green-50 flex items-center justify-center">💼</span> Business Profile
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                        <InfoItem icon="👤" label="Defaulter Company Name" value={selectedDefaulter.defaulter_name} />
                                        <InfoItem icon="📞" label="Mobile" value={selectedDefaulter.mobile_number} />
                                        <InfoItem icon="✉️" label="Email" value={selectedDefaulter.email_id || '-'} />
                                        <InfoItem icon="🏙️" label="City" value={selectedDefaulter.city || '-'} />
                                        <InfoItem icon="🗾" label="Sub District" value={selectedDefaulter.cities || '-'} />
                                        <InfoItem icon="🏢" label="District" value={selectedDefaulter.district} />
                                        <InfoItem icon="📍" label="State" value={selectedDefaulter.state} />
                                        <InfoItem icon="🏠" label="Full Address" value={selectedDefaulter.defaulter_address || '-'} />
                                    </div>
                                </div>

                                {/* Section 2: Statutory & Reporting */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                                        <h5 className="text-[10px] font-black text-agri-green-primary uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                            <span className="w-5 h-5 rounded bg-green-50 flex items-center justify-center">📜</span> Statutory Info
                                        </h5>
                                        <div className="space-y-6">
                                            <InfoItem icon="🔢" label="GST Number" value={selectedDefaulter.gst_number || '-'} />
                                            <InfoItem icon="💳" label="PAN Number" value={selectedDefaulter.pan_number || '-'} />
                                            <InfoItem icon="🆔" label="CIN Number" value={selectedDefaulter.cin_number || '-'} />
                                            <InfoItem icon="🛡️" label="Aadhar" value={selectedDefaulter.aadhar_number || '-'} />
                                        </div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                                        <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                            <span className="w-5 h-5 rounded bg-rose-50 flex items-center justify-center">📢</span> Reporting Context
                                        </h5>
                                        <div className="space-y-6">
                                            <InfoItem icon="🏭" label="Industry" value={selectedDefaulter.industry || '-'} />
                                            <InfoItem icon="📅" label="Financial Year" value={selectedDefaulter.financial_year || '-'} />
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">👔</div>
                                                <div>
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Reported By</p>
                                                    <span className="text-xs font-black text-agri-green-primary tracking-tighter block">{selectedDefaulter.user_id?.companyName}</span>
                                                    <span className="text-[9px] font-bold text-gray-400 italic">Code: {selectedDefaulter.user_id?.memberId}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm">🛡️</div>
                                                <div>
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">System Status</p>
                                                    <span className={`px-4 py-1 rounded-full text-[9px] font-bold uppercase mt-1 inline-block ${selectedDefaulter.status === 1 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                                        }`}>
                                                        {selectedDefaulter.status === 1 ? 'Approved' : 'Review Required'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Financial Default Details */}
                                <div className="bg-agri-green-primary/[0.02] p-8 rounded-[2.5rem] border-2 border-dashed border-agri-green-primary/10">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="text-center md:text-left">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Original Default</p>
                                            <h4 className="text-3xl font-black text-gray-900 tracking-tighter">₹ {Number(selectedDefaulter.default_amount).toLocaleString('en-IN')}</h4>
                                        </div>
                                        <div className="text-center md:border-x border-gray-100 px-8">
                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Current Outstanding</p>
                                            <h4 className="text-3xl font-black text-rose-600 tracking-tighter">₹ {(selectedDefaulter.outstanding_amount ?? selectedDefaulter.default_amount).toLocaleString('en-IN')}</h4>
                                        </div>
                                        <div className="text-center md:text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Default Date</p>
                                            <h4 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</h4>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-agri-green-primary/10">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Reason for Default</p>
                                        <div className="p-6 bg-white border border-gray-100 rounded-2xl italic text-sm text-gray-600 font-medium leading-relaxed">
                                            " {selectedDefaulter.reason_description} "
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Evidence & Documents */}
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                                    <h5 className="text-[10px] font-black text-agri-green-primary uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                        <span className="w-5 h-5 rounded bg-green-50 flex items-center justify-center">📄</span> Attached Evidence
                                    </h5>
                                    {selectedDefaulter.attachment_documents && selectedDefaulter.attachment_documents.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {selectedDefaulter.attachment_documents.map((doc: string, idx: number) => {
                                                const isPdf = doc.toLowerCase().endsWith('.pdf');
                                                return (
                                                    <a key={idx} href={`${ASSETS_BASE_URL}uploads/${doc}`} target="_blank" className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-agri-green-primary hover:bg-white transition-all group">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${isPdf ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                                            {isPdf ? '📄' : '🖼️'}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-black text-gray-900 group-hover:text-agri-green-primary transition-colors truncate uppercase">DOC_{idx + 1}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase">View Attachment →</span>
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                            <span className="text-4xl opacity-20 block mb-4">🙊</span>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No evidence files provided.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-12 py-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setShowDetails(false)} className="bg-gray-900 text-white px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                                Close Master Record
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
