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
    <div className="flex items-start gap-4 group">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg flex-shrink-0 transition-all group-hover:scale-110 group-hover:bg-agri-green-50 shadow-sm border border-slate-100">
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-2">
                {label}
            </p>
            <p className="text-sm font-bold text-slate-700 leading-tight">
                {value || '---'}
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
        <MemberPortalContainer title="Defaulter Lookup Portal">
            <div className="space-y-8 animate-in fade-in duration-500">
                
                {/* Search Form Card */}
                <div className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden">
                    <div className="bg-agri-green-primary px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            </div>
                            <div>
                                <h2 className="text-[16px] font-bold text-white tracking-tight">Defaulter Global Search</h2>
                                <p className="text-xs font-medium text-white/60">Cross-reference tax identity across the ecosystem</p>
                            </div>
                        </div>
                        <Link 
                            href="/defaulter/history" 
                            className="bg-white/10 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-white/20 transition-all shadow-sm flex items-center gap-2 border border-white/20"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
                            Search History
                        </Link>
                    </div>

                    <form onSubmit={handleSearch} className="p-8 space-y-8">
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-lg text-xs font-bold flex items-center gap-3">
                                <span className="text-lg">⚠️</span> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: 'Gst Number', name: 'gst', placeholder: 'Enter Gst Number' },
                                { label: 'Pan Number', name: 'pan', placeholder: 'Enter Pan Number' },
                                { label: 'Cin Number', name: 'cin', placeholder: 'Enter Cin Number' },
                                { label: 'Aadhar Card', name: 'aadhar', placeholder: 'Enter Aadhar card' },
                                { label: 'Company Name', name: 'name', placeholder: 'Search by Company Name' },
                                { label: 'Location/Address', name: 'address', placeholder: 'Search by Location' }
                            ].map((f) => (
                                <div key={f.name} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">{f.label}</label>
                                    <input
                                        type="text"
                                        name={f.name}
                                        value={(filters as any)[f.name]}
                                        onChange={(e) => handleFilterChange(f.name, e.target.value)}
                                        placeholder={f.placeholder}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-agri-green-primary focus:bg-white transition-all text-sm font-semibold text-slate-700 shadow-sm"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="px-6 py-3 bg-slate-50 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-100 transition-all flex items-center gap-4 border border-slate-200 shadow-sm"
                            >
                                <div className="p-1 px-2.5 bg-agri-green-primary rounded-md text-white text-base font-black">
                                    {showAdvanced ? "−" : "+"}
                                </div>
                                {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters (Location)"}
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">State</label>
                                    <select
                                        value={filters.state}
                                        onChange={(e) => handleFilterChange('state', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-agri-green-primary focus:bg-white transition-all text-sm font-semibold text-slate-700 appearance-none shadow-sm cursor-pointer"
                                    >
                                        <option value="">All States</option>
                                        {locations.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">District</label>
                                    <select
                                        value={filters.district}
                                        onChange={(e) => handleFilterChange('district', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-agri-green-primary focus:bg-white transition-all text-sm font-semibold text-slate-700 appearance-none shadow-sm cursor-pointer disabled:opacity-50"
                                        disabled={!filters.state}
                                    >
                                        <option value="">All Districts</option>
                                        {districts.map((d: any) => <option key={d.district} value={d.district}>{d.district}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Sub-District</label>
                                    <select
                                        value={filters.subDistrict}
                                        onChange={(e) => handleFilterChange('subDistrict', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-agri-green-primary focus:bg-white transition-all text-sm font-semibold text-slate-700 appearance-none shadow-sm cursor-pointer disabled:opacity-50"
                                        disabled={!filters.district}
                                    >
                                        <option value="">All Sub-Districts</option>
                                        {subDistricts.map((sd: any) => <option key={sd} value={sd}>{sd}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={searching}
                                className="flex-[2] bg-agri-green-primary text-white font-bold py-4 rounded-lg shadow-xl shadow-green-900/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                {searching ? "Searching Database..." : "Execute Search Query"}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex-1 px-6 py-4 border border-slate-200 text-slate-500 font-bold rounded-lg hover:bg-slate-50 transition-all text-sm active:scale-95"
                            >
                                Reset Form
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {!hasSearched ? (
                        <div className="bg-white rounded-lg p-20 text-center border border-slate-100 shadow-sm animate-in fade-in duration-700">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl text-slate-200">🔍</span>
                            </div>
                            <h3 className="text-xs font-bold text-slate-400">Ready for search inquiry</h3>
                        </div>
                    ) : defaulters.length === 0 ? (
                        <div className="bg-white rounded-lg p-20 text-center border border-rose-100 shadow-sm bg-rose-50/10">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
                                <span className="text-4xl text-rose-300">🚫</span>
                            </div>
                            <h3 className="text-xs font-black text-rose-500 mb-2">No Records Found</h3>
                            <p className="text-xs text-rose-400 font-medium">Verify your search parameters and try again.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden">
                            <div className="bg-agri-green-primary px-8 py-5 flex items-center justify-between">
                                <h3 className="text-[16px] font-bold text-white tracking-tight flex items-center gap-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                    Search Matches Found: {defaulters.length}
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/80 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-5 text-xs font-bold text-slate-400 text-center">#</th>
                                            <th className="px-6 py-5 text-xs font-bold text-slate-400">Source Entity</th>
                                            <th className="px-6 py-5 text-xs font-bold text-slate-400">Defaulter Profile</th>
                                            <th className="px-6 py-5 text-xs font-bold text-slate-400">Tax Identifiers</th>
                                            <th className="px-6 py-5 text-xs font-bold text-slate-400 text-center">Jurisdiction</th>
                                            <th className="px-6 py-5 text-xs font-bold text-slate-400 text-center">Risk Status</th>
                                            <th className="px-6 py-5 text-xs font-bold text-slate-400 text-center">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {defaulters.map((def, i) => (
                                            <tr key={def._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-6 text-xs font-bold text-slate-400 text-center">{i + 1}</td>
                                                <td className="px-6 py-6 border-r border-slate-50/50">
                                                    <p className="text-xs font-black text-slate-800 tracking-tight mb-1">{def.user_id?.name || '---'}</p>
                                                    <p className="text-xs font-bold text-agri-green-primary">{def.user_id?.companyName || 'Verified Member'}</p>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="text-sm font-black text-slate-900 tracking-tight group-hover:text-agri-green-primary transition-colors mb-1">{def.defaulter_name}</p>
                                                    <p className="text-xs text-slate-400 font-medium italic truncate max-w-[200px]">{def.defaulter_address || 'Address Not Provided'}</p>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-slate-300">Gst:</span>
                                                            <span className="text-xs font-bold text-slate-600 font-mono tracking-tighter">{def.gst_number || '---'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-slate-300">Pan:</span>
                                                            <span className="text-xs font-bold text-slate-600 font-mono tracking-tighter">{def.pan_number || '---'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center border-l border-slate-50/50">
                                                    <p className="text-xs font-bold text-slate-700 mb-1">{def.district || 'N/A'}</p>
                                                    <p className="text-[10px] font-black text-slate-400">{def.state}</p>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className="bg-rose-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black shadow-sm">
                                                        Defaulter
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <button
                                                        onClick={() => handleViewClick(def)}
                                                        className="bg-agri-green-primary text-white p-3 rounded-lg hover:scale-110 active:scale-95 transition-all shadow-md shadow-green-900/10 flex items-center justify-center mx-auto hover:brightness-110 group-hover:bg-agri-gold-secondary group-hover:text-black"
                                                        title="View Comprehensive Details"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
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

                {/* Details Modal */}
                {showDetails && selectedDefaulter && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <div 
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
                            onClick={() => setShowDetails(false)}
                        ></div>
                        <div className="relative bg-white w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-400">
                            
                            {/* Modal Header */}
                            <div className="px-8 py-6 bg-agri-green-primary flex items-center justify-between text-white border-b border-white/10 shadow-lg">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl border border-white/20 shadow-inner">👤</div>
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight mb-0.5">Defaulter Verification Profile</h3>
                                        <p className="text-xs text-white/60 font-medium">Cross-Industry Compliance Monitoring</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowDetails(false)} 
                                    className="bg-white/10 hover:bg-white/20 p-2.5 rounded-lg transition-all border border-white/10 group active:scale-90"
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:rotate-90 transition-transform duration-300"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 p-0">
                                {/* Section: Essential Identity */}
                                <div className="p-10">
                                    <h4 className="text-xs font-black text-slate-400 mb-8 flex items-center gap-3">
                                        <div className="w-6 h-1 bg-agri-green-primary rounded-full"></div>
                                        Core Identity Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
                                        <InfoItem icon="🏢" label="Company Name" value={selectedDefaulter.defaulter_name} />
                                        <InfoItem icon="📞" label="Mobile Contact" value={selectedDefaulter.mobile_number} />
                                        <InfoItem icon="✉️" label="Email Address" value={selectedDefaulter.email_id || '---'} />
                                        <InfoItem icon="🔢" label="Gst Identifier" value={selectedDefaulter.gst_number || '---'} />
                                        <InfoItem icon="💳" label="Pan Card" value={selectedDefaulter.pan_number || '---'} />
                                        <InfoItem icon="🆔" label="Cin Number" value={selectedDefaulter.cin_number || '---'} />
                                        <InfoItem icon="🛡️" label="Aadhar Identity" value={selectedDefaulter.aadhar_number || '---'} />
                                        <InfoItem icon="🏙️" label="City/Town" value={selectedDefaulter.city || '---'} />
                                        <InfoItem icon="🏭" label="Industry Sector" value={selectedDefaulter.industry || 'General Trade'} />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-200/50 mx-10"></div>

                                {/* Section: Location & Jurisdiction */}
                                <div className="p-10 bg-white/40">
                                    <h4 className="text-xs font-black text-slate-400 mb-8 flex items-center gap-3">
                                        <div className="w-6 h-1 bg-agri-gold-secondary rounded-full"></div>
                                        Jurisdiction & Location
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                        <InfoItem icon="📍" label="Operating State" value={selectedDefaulter.state} />
                                        <InfoItem icon="🏛️" label="Administrative District" value={selectedDefaulter.district} />
                                        <InfoItem icon="🗾" label="Sub-District/Taluka" value={selectedDefaulter.cities || selectedDefaulter.subDistrict || '---'} />
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <InfoItem icon="🏠" label="Registered Office Address" value={selectedDefaulter.defaulter_address} />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-200/50 mx-10"></div>

                                {/* Section: Financial Default Stats */}
                                <div className="p-10">
                                    <h4 className="text-xs font-black text-slate-400 mb-8 flex items-center gap-3">
                                        <div className="w-6 h-1 bg-rose-500 rounded-full"></div>
                                        Financial Delinquency Data
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                        <InfoItem icon="💵" label="Reported Default" value={`₹ ${Number(selectedDefaulter.default_amount).toLocaleString('en-IN')}`} />
                                        <InfoItem icon="📉" label="Current Outstanding" value={`₹ ${(Number(selectedDefaulter.outstanding_amount) || Number(selectedDefaulter.default_amount)).toLocaleString('en-IN')}`} />
                                        <InfoItem icon="📅" label="Occurrence Date" value={selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'} />
                                        <InfoItem icon="👤" label="Reporting Member" value={selectedDefaulter.user_id?.companyName || selectedDefaulter.user_id?.name || 'Verified Member'} />
                                        <div className="lg:col-span-2">
                                            <InfoItem icon="⚠️" label="Delinquency Reason" value={selectedDefaulter.reason_description} />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-10 p-6 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-xl">🛡️</div>
                                            <div>
                                                <p className="text-base font-bold text-slate-800 tracking-tight">System Verification Status</p>
                                                <p className="text-xs text-slate-400 font-medium">Internal compliance audit status</p>
                                            </div>
                                        </div>
                                        <span className={`px-5 py-2 rounded-lg text-xs font-black shadow-md ${selectedDefaulter.status === 1 ? 'bg-agri-green-primary text-white' : 'bg-amber-500 text-white'}`}>
                                            {selectedDefaulter.status === 1 ? 'Approved/Verified' : 'Pending Audit'}
                                        </span>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-200/50 mx-10"></div>

                                {/* Section: Legal Information */}
                                <div className="p-10 bg-white/40">
                                    <h4 className="text-xs font-black text-slate-400 mb-8 flex items-center gap-3">
                                        <div className="w-6 h-1 bg-slate-800 rounded-full"></div>
                                        Legal Proceedings
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                        <InfoItem icon="⚖️" label="Court Complex" value={selectedDefaulter.court_complex_name || 'N/A'} />
                                        <InfoItem icon="🔢" label="Case Filing Number" value={selectedDefaulter.case_number || 'N/A'} />
                                        <InfoItem icon="📜" label="Nature of Case" value={selectedDefaulter.case_type || 'N/A'} />
                                        <InfoItem icon="📅" label="Filing Year" value={selectedDefaulter.case_year || 'N/A'} />
                                        <InfoItem icon="📋" label="Current Legal Status" value={selectedDefaulter.case_status || 'N/A'} />
                                    </div>
                                </div>

                                {/* Section: Attachments */}
                                {selectedDefaulter.attachment_documents && selectedDefaulter.attachment_documents.length > 0 && (
                                    <div className="p-10">
                                        <h4 className="text-xs font-black text-slate-400 mb-6">Evidentiary Documentation</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {selectedDefaulter.attachment_documents.map((doc: string, idx: number) => {
                                                const isPdf = doc.toLowerCase().endsWith('.pdf');
                                                return (
                                                    <a 
                                                        key={idx} 
                                                        href={`${ASSETS_BASE_URL}uploads/${doc}`} 
                                                        target="_blank" 
                                                        className="group bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-3"
                                                    >
                                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${isPdf ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                                            {isPdf ? '📄' : '🖼️'}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-800 leading-tight">Document {idx + 1}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{isPdf ? 'PDF Spec' : 'IMG Stream'}</p>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-agri-green-primary bg-agri-green-50 px-3 py-1 rounded-full group-hover:bg-agri-green-primary group-hover:text-white transition-colors">Download File</span>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Section: Recovery History */}
                                <div className="p-10 bg-slate-100/50">
                                    <h4 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-agri-green-primary text-white rounded-xl shadow-lg flex items-center justify-center text-xl">💸</div>
                                        Financial Recovery Timeline
                                    </h4>
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
                                        <table className="w-full text-center border-collapse">
                                            <thead>
                                                <tr className="bg-agri-green-primary text-white">
                                                    <th className="px-6 py-5 text-xs font-black border-r border-white/10 w-24">#</th>
                                                    <th className="px-6 py-5 text-sm font-bold border-r border-white/10">Transaction Date</th>
                                                    <th className="px-6 py-5 text-sm font-bold text-right pr-12">Recovery Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {(selectedDefaulter.payments || []).length > 0 ? (
                                                    selectedDefaulter.payments.map((p: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-5 text-xs font-black text-slate-400 border-r border-slate-50">{idx + 1}</td>
                                                            <td className="px-6 py-5 text-sm font-bold text-slate-700 border-r border-slate-50">
                                                                {new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                            </td>
                                                            <td className="px-6 py-5 text-base font-black text-agri-green-primary text-right pr-12 tabular-nums">
                                                                ₹ {Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-16 text-center">
                                                            <div className="text-4xl mb-4 opacity-50">🪙</div>
                                                            <p className="text-sm font-bold text-slate-400">No recovery transactions recorded yet.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {(selectedDefaulter.payments || []).length > 0 && (
                                                <tfoot className="bg-slate-50/80 font-bold border-t-2 border-slate-100">
                                                    <tr>
                                                        <td colSpan={2} className="px-10 py-6 text-right text-xs font-black text-slate-500">Total Recovered Amount</td>
                                                        <td className="px-10 py-6 text-lg font-black text-slate-900 text-right pr-12 tabular-nums">
                                                            ₹ {selectedDefaulter.payments.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-10 py-6 bg-slate-50 border-t border-slate-200/50 flex items-center justify-between">
                                <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-agri-green-primary animate-pulse"></span>
                                    Member Verification Successful
                                </div>
                                <button 
                                    onClick={() => setShowDetails(false)} 
                                    className="bg-slate-800 text-white px-12 py-3.5 rounded-lg font-black hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 text-xs"
                                >
                                    Exit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MemberPortalContainer>
    );
}
