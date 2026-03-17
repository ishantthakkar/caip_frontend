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

    const [filters, setFilters] = useState({
        gst: '', pan: '', cin: '', aadhar: '', name: '', address: '', state: '', district: '', subDistrict: ''
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
            setLocations(data.states || []);
        } catch (error) {
            console.error("Error fetching locations:", error);
        }
    };

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
        setFilters({ gst: '', pan: '', cin: '', aadhar: '', name: '', address: '', state: '', district: '', subDistrict: '' });
        setHasSearched(false);
        setDefaulters([]);
        setError('');
        setShowAdvanced(false);
    };

    const handleFilterChange = (field: string, value: string) => {
        setError('');
        setFilters(prev => ({
            ...prev,
            [field]: value,
            ...(field === 'state' ? { district: '', subDistrict: '' } : {}),
            ...(field === 'district' ? { subDistrict: '' } : {})
        }));
    };

    const handleViewClick = (def: any) => {
        setSelectedDefaulter(def);
        setShowDetails(true);
    };

    const districts = locations.find(s => s.state === filters.state)?.districts || [];
    const subDistricts = districts.find((d: any) => d.district === filters.district)?.subDistricts || [];

    return (
        <MemberPortalContainer title="Search Defaulter">
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Search Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Global Search</h2>
                            <p className="text-xs text-gray-500">Search for defaulters by GST, PAN, Mobile, or Name</p>
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
                                { label: 'GST Number', name: 'gst', placeholder: 'Enter GST' },
                                { label: 'PAN Number', name: 'pan', placeholder: 'Enter PAN' },
                                { label: 'CIN Number', name: 'cin', placeholder: 'Enter CIN' },
                                { label: 'Aadhar Card', name: 'aadhar', placeholder: 'Enter Aadhar' },
                                { label: 'Company Name', name: 'name', placeholder: 'Search by Company Name' },
                                { label: 'Location/Address', name: 'address', placeholder: 'Search by Location' }
                            ].map((f) => (
                                <div key={f.name} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">{f.label}</label>
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
                                {showAdvanced ? "Basic Search Mode" : "Advanced Filters (Location)"}
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-50 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">State</label>
                                    <select
                                        value={filters.state}
                                        onChange={(e) => handleFilterChange('state', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm appearance-none"
                                    >
                                        <option value="">All States</option>
                                        {locations.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">District</label>
                                    <select
                                        value={filters.district}
                                        onChange={(e) => handleFilterChange('district', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm appearance-none"
                                        disabled={!filters.state}
                                    >
                                        <option value="">All Districts</option>
                                        {districts.map((d: any) => <option key={d.district} value={d.district}>{d.district}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Sub-District</label>
                                    <select
                                        value={filters.subDistrict}
                                        onChange={(e) => handleFilterChange('subDistrict', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm appearance-none"
                                        disabled={!filters.district}
                                    >
                                        <option value="">All Sub-Districts</option>
                                        {subDistricts.map((sd: any) => <option key={sd} value={sd}>{sd}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={searching}
                                className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-lg shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                            >
                                {searching ? "Searching..." : "Search Records"}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-6 py-2.5 border border-gray-200 text-gray-500 font-semibold rounded-lg hover:bg-gray-50 transition-all text-sm"
                            >
                                Clear All
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {!hasSearched ? (
                        <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm animate-in fade-in duration-500">
                            <h3 className="text-sm font-semibold text-gray-400">Enter search criteria above to see results.</h3>
                        </div>
                    ) : defaulters.length === 0 ? (
                        <div className="bg-white rounded-xl p-16 text-center border border-red-50 shadow-sm">
                            <h3 className="text-sm font-bold text-red-500">No records found matching your search.</h3>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-green-600 px-6 py-3">
                                <span className="text-white text-xs font-bold uppercase tracking-widest leading-none">Search Results: {defaulters.length} Match(es)</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reported By</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reporting Company</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Defaulter Company</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">GST No.</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">PAN No.</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">CIN No.</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aadhar No.</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Location</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {defaulters.map((def, i) => (
                                            <tr key={def._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-xs text-gray-500">{i + 1}</td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-gray-700">{def.user_id?.name || 'N/A'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-green-700">{def.user_id?.companyName || 'Verified Member'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-900">{def.defaulter_name}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-gray-600 line-clamp-2 max-w-[150px]">{def.defaulter_address || 'N/A'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-gray-500 font-mono">{def.gst_number || '-'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-gray-500 font-mono">{def.pan_number || '-'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-gray-500 font-mono">{def.cin_number || '-'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-gray-500 font-mono">{def.aadhar_number || '-'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className="text-[11px] font-bold text-gray-700">{def.district}, {def.state}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase border border-red-100">
                                                        Defaulter
                                                    </span>
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {showDetails && selectedDefaulter && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(false)}></div>
                        <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-300">
                            {/* Header */}
                            <div className="px-8 py-5 bg-[#0a1f0a] flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">👥</span>
                                    <h3 className="text-lg font-bold tracking-tight">Defaulter Details</h3>
                                </div>
                                <button onClick={() => setShowDetails(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
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
                                        <InfoItem icon="📅" label="Financial Year" value={selectedDefaulter.financial_year || '-'} />
                                        <InfoItem icon="📉" label="Outstanding" value={(selectedDefaulter.outstanding_amount || selectedDefaulter.default_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} />
                                        <InfoItem icon="🏭" label="Industry" value={selectedDefaulter.industry || '-'} />
                                        <InfoItem icon="👤" label="Reported By" value={selectedDefaulter.user_id?.companyName || selectedDefaulter.user_id?.name || 'Verified Member'} />
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
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                                            <span className="px-3 py-1 bg-green-500 text-white rounded-full text-[10px] font-bold uppercase mt-1 inline-block">
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
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
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
                                        <span className="w-10 h-10 bg-[#0a1f0a] text-white rounded-xl flex items-center justify-center text-sm">💰</span>
                                        Payment Records
                                    </h4>
                                    <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-xl overflow-hidden">
                                        <table className="w-full text-center">
                                            <thead>
                                                <tr className="bg-[#0a1f0a] text-white">
                                                    <th className="px-6 py-5 text-xs font-black uppercase border-r border-white/10">#</th>
                                                    <th className="px-6 py-5 text-base font-bold border-r border-white/10">Payment Date</th>
                                                    <th className="px-6 py-5 text-base font-bold">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(selectedDefaulter.payments || []).map((p: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50/80 transition-all">
                                                        <td className="px-6 py-5 text-sm font-bold text-gray-400 border-r border-gray-50">{idx + 1}</td>
                                                        <td className="px-6 py-5 text-sm font-semibold text-gray-600 border-r border-gray-50">{new Date(p.date).toISOString().split('T')[0]}</td>
                                                        <td className="px-6 py-5 text-sm font-black text-gray-800">{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                ))}
                                                {(selectedDefaulter.payments || []).length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-10 text-xs font-bold text-gray-400 italic">No payments recorded yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 bg-gray-50 border-t flex justify-end">
                                <button onClick={() => setShowDetails(false)} className="bg-gray-400 text-white px-8 py-2 rounded-lg font-bold hover:bg-gray-500 transition-all shadow-md">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MemberPortalContainer>
    );
}
