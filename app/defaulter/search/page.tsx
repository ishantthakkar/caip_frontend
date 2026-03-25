"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import dynamic from 'next/dynamic';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

const IndiaMap = dynamic(() => import('@/components/IndiaMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
    </div>
});

const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: any }) => (
    <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm flex-shrink-0 mt-1">{icon}</div>
        <div className="min-w-0">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                {label}: <span className="text-gray-700 font-medium ml-1 normal-case">{value}</span>
            </p>
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
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [cities, setCities] = useState<any[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [subDistricts, setSubDistricts] = useState<string[]>([]);
    const [filters, setFilters] = useState({
        gst: '', pan: '', cin: '', aadhar: '', name: '', address: '', state: '', district: '', subDistrict: '', city: ''
    });

    useEffect(() => {
        fetchLocations();
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    }, []);

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

    const fetchDefaulters = async () => {
        setSearching(true);
        try {
            const token = localStorage.getItem('token');
            const url = new URL(`${API_BASE_URL}defaulter/search`);
            Object.keys(filters).forEach(key => {
                const val = (filters as any)[key];
                if (val) url.searchParams.append(key, val);
            });

            const response = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setDefaulters(data.data || []);
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
            setError('Please enter at least one search criteria.');
            return;
        }
        setError('');
        setHasSearched(true);
        fetchDefaulters();
    };

    const handleReset = () => {
        setFilters({ gst: '', pan: '', cin: '', aadhar: '', name: '', address: '', state: '', district: '', subDistrict: '', city: '' });
        setHasSearched(false);
        setDefaulters([]);
        setError('');
        setShowAdvanced(false);
        setCities([]);
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

    const handleViewClick = (def: any) => {
        setSelectedDefaulter(def);
        setShowDetails(true);
    };

    return (
        <MemberPortalContainer title="Search Defaulter">
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Search Form Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#1b5e20] px-6 py-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            <h2 className="text-[17px] font-bold tracking-tight">Search Defaulter</h2>
                        </div>
                        <Link
                            href="/defaulter/history"
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-2 border border-white/10"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
                            History
                        </Link>
                    </div>

                    <form onSubmit={handleSearch} className="p-8 space-y-8 bg-[#fbfcfd]">
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 shadow-sm">
                                <span className="text-lg">⚠️</span> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: 'GST', name: 'gst', placeholder: 'Enter GST' },
                                { label: 'PAN', name: 'pan', placeholder: 'Enter PAN' },
                                { label: 'CIN', name: 'cin', placeholder: 'Enter CIN' },
                                { label: 'Aadhar', name: 'aadhar', placeholder: 'Enter Aadhar' },
                                { label: 'Company', name: 'name', placeholder: 'Enter Company Name' },
                                { label: 'Address', name: 'address', placeholder: 'Enter Address' }
                            ].map((f) => (
                                <div key={f.name} className="space-y-1.5 flex flex-col">
                                    <label className="text-[14px] font-medium text-gray-500 tracking-tight px-1">{f.label}</label>
                                    <input
                                        type="text"
                                        name={f.name}
                                        value={(filters as any)[f.name]}
                                        onChange={(e) => handleFilterChange(f.name, e.target.value)}
                                        placeholder={f.placeholder}
                                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-[#1b5e20] text-[15px] font-medium shadow-sm transition-all"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="px-6 py-2.5 bg-gray-50 text-gray-600 font-bold text-[13px] rounded-xl hover:bg-gray-100 transition-all flex items-center gap-3 border border-gray-200 shadow-sm active:scale-95"
                            >
                                <div className={`p-1 bg-[#1b5e20] rounded-md transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>
                                {showAdvanced ? "Basic Search Mode" : "Advanced Filters"}
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-4 duration-300">
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[14px] font-medium text-gray-500 tracking-tight px-1">State</label>
                                    <select
                                        value={filters.state}
                                        onChange={(e) => handleFilterChange('state', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-[#1b5e20] text-[15px] font-medium shadow-sm appearance-none"
                                    >
                                        <option value="">All States</option>
                                        {locations.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[14px] font-medium text-gray-500 tracking-tight px-1">District</label>
                                    <select
                                        value={filters.district}
                                        onChange={(e) => handleFilterChange('district', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-[#1b5e20] text-[15px] font-medium shadow-sm appearance-none disabled:bg-gray-50"
                                        disabled={!filters.state}
                                    >
                                        <option value="">All Districts</option>
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[14px] font-medium text-gray-500 tracking-tight px-1">Sub-District</label>
                                    <select
                                        value={filters.subDistrict}
                                        onChange={(e) => handleFilterChange('subDistrict', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-[#1b5e20] text-[15px] font-medium shadow-sm appearance-none disabled:bg-gray-50"
                                        disabled={!filters.district}
                                    >
                                        <option value="">All Sub-Districts</option>
                                        {subDistricts.map(sd => <option key={sd} value={sd}>{sd}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[14px] font-medium text-gray-500 tracking-tight px-1">City/Village</label>
                                    <select
                                        value={filters.city}
                                        onChange={(e) => handleFilterChange('city', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-[#1b5e20] text-[15px] font-medium shadow-sm appearance-none disabled:bg-gray-50"
                                        disabled={!filters.subDistrict}
                                    >
                                        <option value="">All Cities</option>
                                        {cities.map((city: any) => <option key={city} value={city}>{city}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={searching}
                                className="flex-[2] bg-[#1b5e20] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#1b5e20]/20 hover:bg-[#144317] transition-all flex items-center justify-center gap-3 text-[15px] disabled:opacity-50 active:scale-95"
                            >
                                {searching ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                        Search Records
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex-1 px-6 py-3.5 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all text-[14px]"
                            >
                                Clear All
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Section */}
                <div className="space-y-8">
                    {!hasSearched ? (
                        <div className="bg-white rounded-xl p-20 text-center border border-gray-100 shadow-lg animate-in fade-in duration-700">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl opacity-40">🔍</div>
                            <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">Ready to Search</h3>
                            <p className="text-[13px] text-gray-400 mt-2 max-w-sm mx-auto">Enter at least one search criteria above to query the CAIP Defaulter Database.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                            <div className="bg-[#1b5e20] px-6 py-4 flex items-center justify-between text-white">
                                <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                    Search Results: {defaulters.length} Match{defaulters.length !== 1 ? 'es' : ''}
                                </h3>
                                <div className="text-white/40 text-xs font-black tracking-widest uppercase">Database Query Result</div>
                            </div>

                            <div className="p-4 md:p-5">
                                <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-center border-collapse">
                                            <thead className="bg-[#051a02] text-white">
                                                <tr className="divide-x divide-white/5 whitespace-nowrap">
                                                    <th className="px-4 py-4 text-[13px] font-semibold tracking-tight w-12 text-center">#</th>
                                                    <th className="px-4 py-4 text-[13px] font-semibold tracking-tight text-left">Defaulter Company</th>
                                                    <th className="px-4 py-4 text-[13px] font-semibold tracking-tight">Reported By</th>
                                                    <th className="px-4 py-4 text-[13px] font-semibold tracking-tight">Tax Identifiers</th>
                                                    <th className="px-4 py-4 text-[13px] font-semibold tracking-tight">Location</th>
                                                    <th className="px-4 py-4 text-[13px] font-semibold tracking-tight">Status</th>
                                                    <th className="px-4 py-4 text-[13px] font-semibold tracking-tight text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 text-[14px] font-medium text-gray-600 bg-white">
                                                {defaulters.length > 0 ? (
                                                    defaulters.map((def, i) => (
                                                        <tr key={def._id} className="hover:bg-gray-50/50 transition-colors divide-x divide-gray-50">
                                                            <td className="px-4 py-4 text-gray-400">{i + 1}</td>
                                                            <td className="px-4 py-4 text-left">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-gray-900">{def.defaulter_name}</span>
                                                                    <span className="text-[11px] text-gray-400 line-clamp-1 italic max-w-[200px]">{def.defaulter_address || 'Address N/A'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="font-bold text-[#1b5e20]">{def.user_id?.companyName || 'Verified Member'}</span>
                                                                    <span className="text-[11px] text-gray-400">{def.user_id?.name || 'N/A'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    {def.gst_number && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">GST: {def.gst_number}</span>}
                                                                    {def.pan_number && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">PAN: {def.pan_number}</span>}
                                                                    {!def.gst_number && !def.pan_number && <span className="text-[10px] text-gray-400">No Tax ID</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-[13px] font-bold text-gray-800">{def.district || 'N/A'}</span>
                                                                    <span className="text-[11px] text-gray-400">{def.state || 'N/A'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-rose-50 text-rose-600 border border-rose-100">
                                                                    Defaulter
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <button
                                                                    onClick={() => handleViewClick(def)}
                                                                    className="p-1.5 bg-[#1b5e20] text-white rounded-lg hover:bg-[#144317] transition-all shadow-md shadow-[#1b5e20]/10"
                                                                    title="Expand Details"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={7} className="py-24 text-center text-gray-400">
                                                            <div className="text-4xl mb-3 opacity-20">📂</div>
                                                            <p className="text-sm font-bold text-rose-500">No records found matching your rigorous criteria.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Modal */}
                {showDetails && selectedDefaulter && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(false)}></div>
                        <div className="relative bg-[#fbfcff] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-300">
                            {/* Modal Header */}
                            <div className="px-8 py-5 bg-[#1b5e20] flex items-center justify-between text-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg shadow-inner">📜</div>
                                    <div>
                                        <h3 className="text-lg font-bold tracking-tight">Defaulter Verification Profile</h3>
                                        <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-0.5">Global Repository Identity Access</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowDetails(false)} className="text-white/60 hover:text-white transition-all bg-white/10 p-2 rounded-lg">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
                                {/* Section 1: Identity & Location */}
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-[#1b5e20] uppercase tracking-[0.2em] mb-4 border-l-4 border-[#1b5e20] pl-3">Company Identification</h4>
                                        <div className="grid grid-cols-1 gap-5">
                                            <InfoItem icon="🏗️" label="Legal Entity Name" value={selectedDefaulter.defaulter_name} />
                                            <InfoItem icon="📋" label="Tax ID (GST)" value={selectedDefaulter.gst_number || 'NOT PROVIDED'} />
                                            <InfoItem icon="💳" label="PAN Identifier" value={selectedDefaulter.pan_number || 'NOT PROVIDED'} />
                                            <InfoItem icon="🏢" label="CIN Number" value={selectedDefaulter.cin_number || 'NOT PROVIDED'} />
                                            <InfoItem icon="🆔" label="Aadhar Access" value={selectedDefaulter.aadhar_number || 'NOT PROVIDED'} />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-[#1b5e20] uppercase tracking-[0.2em] mb-4 border-l-4 border-[#1b5e20] pl-3">Geographic Presence</h4>
                                        <div className="grid grid-cols-1 gap-5">
                                            <InfoItem icon="📍" label="Operating State" value={selectedDefaulter.state} />
                                            <InfoItem icon="🏙️" label="District / HQ" value={selectedDefaulter.district} />
                                            <InfoItem icon="🗾" label="Detailed Region" value={selectedDefaulter.cities || selectedDefaulter.sub_district || 'N/A'} />
                                            <InfoItem icon="🏠" label="Registered Address" value={selectedDefaulter.defaulter_address || 'Address N/A'} />
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8"><div className="h-px bg-gray-100 flex-1"></div></div>

                                {/* Section 2: Financial Liability */}
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 bg-white">
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-[0.2em] mb-4 border-l-4 border-rose-600 pl-3">Default Metrics</h4>
                                        <div className="grid grid-cols-1 gap-5">
                                            <InfoItem icon="💵" label="Default Principal" value={`₹${Number(selectedDefaulter.default_amount).toLocaleString('en-IN')}`} />
                                            <InfoItem icon="📉" label="Outstanding Due" value={`₹${Number(selectedDefaulter.outstanding_amount || selectedDefaulter.default_amount).toLocaleString('en-IN')}`} />
                                            <InfoItem icon="📅" label="Occurrence Date" value={selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toLocaleDateString('en-GB') : 'N/A'} />
                                            <InfoItem icon="🏗️" label="Industry Sector" value={selectedDefaulter.industry || 'General Industry'} />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] mb-4 border-l-4 border-amber-600 pl-3">Reporting Authority</h4>
                                        <div className="grid grid-cols-1 gap-5">
                                            <InfoItem icon="🛡️" label="Verified Member" value={selectedDefaulter.user_id?.companyName || 'CAIP TRUSTED MEMBER'} />
                                            <InfoItem icon="👤" label="Authorized User" value={selectedDefaulter.user_id?.name || 'Authorized Personnel'} />
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm flex-shrink-0 mt-1">📝</div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Official Reason</p>
                                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 italic text-[12px] text-gray-600 leading-relaxed font-medium">
                                                        "{selectedDefaulter.reason_description || 'No detailed reason provided.'}"
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Document Repository */}
                                <div className="p-8 border-t border-gray-100 bg-[#fbfcfd]">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-[#1b5e20] rounded-full"></span>
                                        Annexed Evidence & Documentation
                                    </h4>
                                    {selectedDefaulter.attachment_documents && selectedDefaulter.attachment_documents.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {selectedDefaulter.attachment_documents.map((doc: string, idx: number) => {
                                                const isPdf = doc.toLowerCase().endsWith('.pdf');
                                                return (
                                                    <a key={idx} href={`${ASSETS_BASE_URL}uploads/${doc}`} target="_blank" className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-[#1b5e20] hover:shadow-md transition-all group">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${isPdf ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'} group-hover:scale-110 transition-transform`}>
                                                            {isPdf ? "📕" : "🖼️"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-gray-900 truncate">Identity Document {idx + 1}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{isPdf ? 'PDF Archive' : 'Image Scan'}</p>
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 text-center">
                                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest italic">Zero Documentation Found in Repository</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                                <button onClick={() => setShowDetails(false)} className="px-10 py-3 bg-gray-900 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/10">
                                    Finalize Review
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
