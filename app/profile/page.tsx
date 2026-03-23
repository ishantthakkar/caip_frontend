"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'membership'>('overview');
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<any[]>([]);
    const [purchasing, setPurchasing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [states, setStates] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [subDistricts, setSubDistricts] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [businessDocs, setBusinessDocs] = useState<FileList | null>(null);

    useEffect(() => {
        setHasMounted(true);
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/');
        } else {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setFormData(parsedUser);

            fetchProfile(token);
            fetchPlans();
            fetchStates();
        }
    }, [router]);

    const fetchPlans = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}membership-plans`);
            const data = await response.json();
            if (response.ok) {
                setPlans(data.data);
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
        }
    };

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

    const fetchProfile = async (token: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/');
                return;
            }

            const data = await response.json();
            if (response.ok) {
                setUser(data.data);
                setFormData(data.data);
                localStorage.setItem('user', JSON.stringify(data.data));

                // Initial load of dependent locations
                if (data.data.state) fetchDistricts(data.data.state);
                if (data.data.state && data.data.district) fetchSubDistricts(data.data.state, data.data.district);
                if (data.data.state && data.data.district && data.data.subDistrict) fetchCities(data.data.state, data.data.district, data.data.subDistrict);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const data = new FormData();

            // Append all non-file fields
            Object.keys(formData).forEach(key => {
                if (key !== 'businessDocuments' && formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });

            // Append files if any
            if (businessDocs) {
                Array.from(businessDocs).forEach(file => {
                    data.append('businessDocuments', file);
                });
            }

            const response = await fetch(`${API_BASE_URL}update-profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            if (response.ok) {
                const resData = await response.json();
                setUser(resData.data);
                setFormData(resData.data);
                localStorage.setItem('user', JSON.stringify(resData.data));
                setIsEditing(false);
                setBusinessDocs(null);
                alert('Profile updated successfully!');
            }
        } catch (error) {
            console.error("Update error:", error);
        } finally {
            setSaving(false);
        }
    };

    const purchaseMembership = async (planId: string) => {
        if (!confirm('Are you sure you want to purchase this plan?')) return;
        setPurchasing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}purchase-membership`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planId })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Membership Activated Successfully!');
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/dashboard');
            } else {
                alert(data.msg || 'Purchase failed');
            }
        } catch (error) {
            console.error("Purchase error:", error);
        } finally {
            setPurchasing(false);
        }
    };

    if (!hasMounted || loading || !user) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-agri-green-primary border-t-transparent rounded-full font-black"></div>
            </div>
        );
    }


    return (
        <MemberPortalContainer title="Profile" skipMembershipCheck={true}>
            <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-10">
                {/* Left Sidebar: Profile Card */}
                <div className="w-full lg:w-[380px] shrink-0">
                    <div className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden flex flex-col h-full sticky top-6">
                        {/* Header Image section */}
                        <div className="h-32 bg-gradient-to-br from-agri-green-primary to-slate-800 relative">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        </div>

                        {/* Profile Info */}
                        <div className="relative pt-16 pb-8 px-8 flex flex-col items-center flex-1">
                            {/* Avatar */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-2xl border-4 border-white bg-slate-50 shadow-lg overflow-hidden flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
                                <span className="text-slate-300 text-6xl">👤</span>
                            </div>

                            <div className="text-center mb-10">
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">{user.companyName || user.name || "Enterprise User"}</h3>
                                <p className="text-xs font-black text-agri-green-primary uppercase tracking-[0.2em] mt-1">{user.businessType || 'Organization Member'}</p>
                            </div>

                            <div className="w-full space-y-5 mb-10">
                                {[
                                    { label: 'Member Identity', value: user.memberId || 'CAIP-PRO' },
                                    { label: 'Primary Email', value: user.email || 'N/A' },
                                    { label: 'Verified Phone', value: user.phone || 'N/A' },
                                    { label: 'Security Status', value: user.membership_status === '1' ? 'Active Account' : 'Pending Verification', valueClass: user.membership_status === '1' ? 'text-agri-green-primary' : 'text-amber-500' },
                                    ...(user.membership_status === '1' ? [
                                        { 
                                            label: 'Expiry Date', 
                                            value: user.membershipExpiry === 'Lifetime' 
                                                ? 'Lifetime Access' 
                                                : (user.membershipExpiry && user.membershipExpiry !== 'N/A' 
                                                    ? new Date(user.membershipExpiry).toLocaleDateString('en-GB', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })
                                                    : '---')
                                        }
                                    ] : []),
                                ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start gap-4 py-3 border-b border-slate-50 last:border-0 grow">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter whitespace-nowrap">{item.label}</span>
                                        <span className={`text-sm font-bold text-right leading-tight ${item.valueClass || 'text-slate-700'}`}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Summary Analytics Area at Bottom */}
                            <div className="mt-auto w-full pt-8 border-t border-slate-100 flex items-center justify-between">
                                <div className="text-center flex-1">
                                    <p className="text-2xl font-black text-slate-800 tabular-nums">28</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">Total inquiries</p>
                                </div>
                                <div className="w-px h-8 bg-slate-100 mx-4"></div>
                                <div className="text-center flex-1">
                                    <p className="text-2xl font-black text-rose-600 tabular-nums">05</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">Claims filed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Main Form Area */}
                <div className="flex-1 space-y-6">
                    {/* Premium Tab Control */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-1.5 flex gap-2">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-agri-green-primary text-white shadow-lg shadow-green-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                            Profile Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('membership')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'membership' ? 'bg-agri-green-primary text-white shadow-lg shadow-green-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                            Membership Control
                        </button>
                    </div>

                    {activeTab === 'overview' ? (
                        <div className="space-y-6">
                            {/* Summary Text Section */}
                            <div className="bg-white p-8 rounded-lg shadow-md border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-agri-green-primary/5 rounded-bl-full -mr-16 -mt-16"></div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3">
                                    <div className="w-8 h-1 bg-agri-green-primary rounded-full"></div>
                                    Organization Statement
                                </h3>
                                <p className="text-sm font-semibold text-slate-500 leading-relaxed relative z-10">
                                    Welcome to your CAIP enterprise portal. This module allows you to synchronize your operational identity, track risk inquiries, and maintain your membership standing. As a stakeholder in the Chamber for Agri Input Protection, your validated data ensures a transparent and secure ecosystem for all agricultural trade participants.
                                </p>
                            </div>

                            {/* Business Information Section */}
                            <div className="bg-white p-8 rounded-lg shadow-md border border-slate-100">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-agri-green-primary/10 rounded-lg flex items-center justify-center text-agri-green-primary">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m12 1a3 3 0 0 1-6 0V7m0-4v14m-12-7h12m7 1v4m0-8V3"/></svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">Business Integrity Details</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95 ${isEditing ? 'bg-slate-800 text-white' : 'bg-agri-green-primary text-white hover:brightness-110'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                        {isEditing ? 'Discard Changes' : 'Modify Profile'}
                                    </button>
                                </div>

                                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {[
                                        { label: 'Legal Company Designation*', key: 'companyName' },
                                        { label: 'Operational Model', key: 'businessType', isSelect: true, options: ['Manufacturer', 'Distributor', 'Retailer', 'Wholesaler'] },
                                        { label: 'Taxation ID (GSTIN)*', key: 'gst' },
                                        { label: 'Industry Experience (Years)', key: 'yearsInBusiness' },
                                        { label: 'Corporate Identity (CIN)', key: 'cinNumber' },
                                        { label: 'Income Tax ID (PAN)*', key: 'pan' }
                                    ].map((field: any) => (
                                        <div key={field.key} className="space-y-1.5 flex flex-col">
                                            <label className="text-xs font-semibold text-slate-500">{field.label}</label>
                                            {field.isSelect ? (
                                                <select
                                                    disabled={!isEditing}
                                                    value={formData[field.key] || ''}
                                                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none text-sm font-semibold text-slate-700 transition-all focus:border-agri-green-primary focus:bg-white appearance-none disabled:opacity-100 disabled:text-slate-400 shadow-sm"
                                                >
                                                    <option value="">Select Category</option>
                                                    {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    readOnly={!isEditing}
                                                    value={formData[field.key] || ''}
                                                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                                    placeholder={`Enter ${field.label.replace('*', '')}`}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none text-sm font-semibold text-slate-700 transition-all focus:border-agri-green-primary focus:bg-white read-only:text-slate-400 shadow-sm"
                                                />
                                            )}
                                        </div>
                                    ))}

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-xs font-semibold text-slate-500">Jurisdiction State*</label>
                                        <select
                                            disabled={!isEditing}
                                            value={formData.state || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, state: val, district: '', subDistrict: '', city: '' });
                                                fetchDistricts(val);
                                                setDistricts([]);
                                                setSubDistricts([]);
                                                setCities([]);
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none text-sm font-semibold text-slate-700 transition-all focus:border-agri-green-primary focus:bg-white shadow-sm"
                                        >
                                            <option value="">Select State</option>
                                            {states.map((s: any) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-xs font-semibold text-slate-500">Operational District*</label>
                                        <select
                                            disabled={!isEditing}
                                            value={formData.district || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, district: val, subDistrict: '', city: '' });
                                                fetchSubDistricts(formData.state, val);
                                                setSubDistricts([]);
                                                setCities([]);
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none text-sm font-semibold text-slate-700 transition-all focus:border-agri-green-primary focus:bg-white shadow-sm"
                                        >
                                            <option value="">Select District</option>
                                            {districts.map((d: any) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-xs font-semibold text-slate-500">Sub-District Division*</label>
                                        <select
                                            disabled={!isEditing}
                                            value={formData.subDistrict || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, subDistrict: val, city: '' });
                                                fetchCities(formData.state, formData.district, val);
                                                setCities([]);
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none text-sm font-semibold text-slate-700 transition-all focus:border-agri-green-primary focus:bg-white shadow-sm"
                                        >
                                            <option value="">Select Sub-District</option>
                                            {subDistricts.map((sd: any) => <option key={sd} value={sd}>{sd}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-xs font-semibold text-slate-500">Regional Locality*</label>
                                        <select
                                            disabled={!isEditing}
                                            value={formData.city || ''}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none text-sm font-semibold text-slate-700 transition-all focus:border-agri-green-primary focus:bg-white shadow-sm"
                                        >
                                            <option value="">Select City/Village</option>
                                            {cities.map((c: any) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-xs font-semibold text-slate-500">Postal Index (PIN)*</label>
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={formData.pinCode || ''}
                                            onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                                            placeholder="Enter PIN"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none text-sm font-semibold text-slate-700 transition-all focus:border-agri-green-primary focus:bg-white shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5 flex flex-col md:col-span-1">
                                        <label className="text-xs font-semibold text-slate-500">Formal Business Address*</label>
                                        <textarea
                                            readOnly={!isEditing}
                                            value={formData.businessAddress || ''}
                                            onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                                            placeholder="Enter Address"
                                            rows={1}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none text-sm font-semibold text-slate-700 transition-all focus:border-agri-green-primary focus:bg-white shadow-sm resize-none"
                                        />
                                    </div>

                                    <div className="space-y-1.5 flex flex-col md:col-span-1">
                                        <label className="text-xs font-semibold text-slate-500">Industry Classification</label>
                                        <select
                                            disabled={!isEditing}
                                            value={formData.industry || ''}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none text-sm font-semibold text-slate-700 transition-all focus:border-agri-green-primary focus:bg-white shadow-sm"
                                        >
                                            <option value="Agriculture">Agriculture Focus</option>
                                            <option value="Agrochemicals & Fertilizers">Agrochemicals & Fertilizers</option>
                                            <option value="Seed Suppliers">Certified Seed Suppliers</option>
                                            <option value="Farming Equipment">Farming Machinery</option>
                                            <option value="Others">Allied Sectors</option>
                                        </select>
                                    </div>

                                    {/* Contact Information Section */}
                                    <div className="col-span-full pt-8 mt-4 border-t border-slate-100">
                                        <h3 className="text-md font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-agri-green-primary rounded-full"></div>
                                            Communication Channels
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            {[
                                                { label: 'Official Correspondence Email*', key: 'companyEmail', placeholder: 'name@organization.com' },
                                                { label: 'Primary Liaison Person', key: 'alternateContactPerson', placeholder: 'Full Name' },
                                                { label: 'Verified Phone Line*', key: 'companyPhoneNumber', placeholder: 'Contact Number' },
                                                { label: 'Secondary Interaction Number', key: 'alternateContactNumber', placeholder: 'Backup Number' }
                                            ].map((field) => (
                                                <div key={field.key} className="space-y-1.5 flex flex-col">
                                                    <label className="text-xs font-semibold text-slate-500">{field.label}</label>
                                                    <input
                                                        type="text"
                                                        readOnly={!isEditing}
                                                        value={formData[field.key] || ''}
                                                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none text-sm font-semibold text-slate-700 transition-all focus:border-agri-green-primary focus:bg-white shadow-sm"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>                                    {/* Additional Business Details Section */}
                                    <div className="col-span-full pt-8 mt-4 border-t border-slate-100">
                                        <h3 className="text-md font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-agri-green-primary rounded-full"></div>
                                            Verification Documents & Web
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-1.5 flex flex-col">
                                                <label className="text-xs font-semibold text-slate-500">Public Website URL</label>
                                                <input
                                                    type="text"
                                                    readOnly={!isEditing}
                                                    value={formData.websiteUrl || ''}
                                                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                                    placeholder="https://..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none text-sm font-semibold text-slate-700 transition-all focus:border-agri-green-primary focus:bg-white shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5 flex flex-col">
                                                <label className="text-xs font-semibold text-slate-500">Corporate Documentation</label>
                                                <div className={`relative w-full border-2 ${isEditing ? 'border-agri-green-primary border-dashed' : 'border-slate-100'} rounded-lg py-3 px-4 flex items-center gap-4 transition-all ${!isEditing ? 'bg-slate-50/50' : 'bg-green-50/20'}`}>
                                                    <input
                                                        type="file" multiple disabled={!isEditing}
                                                        onChange={(e) => setBusinessDocs(e.target.files)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-default"
                                                    />
                                                    <div className="bg-white px-3 py-1.5 rounded-md text-xs font-bold text-slate-600 border border-slate-200 shadow-sm">Selective Audit</div>
                                                    <span className="text-[11px] text-slate-400 font-bold overflow-hidden whitespace-nowrap text-ellipsis">
                                                        {businessDocs ? `${businessDocs.length} files optimized` : 'Awaiting file upload...'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Accepted: GST-C, Trade License, Incorporation Cert.</p>

                                                {/* Document List with Icons */}
                                                <div className="mt-6 flex flex-wrap gap-4">
                                                    {[...(formData.businessDocuments || []), ...(formData.businessDocument ? [formData.businessDocument] : [])].map((doc: string, idx: number) => {
                                                        const isPdf = doc.toLowerCase().endsWith('.pdf');
                                                        return (
                                                            <div key={idx} className="group relative flex items-center gap-3 bg-white border border-slate-100 p-3 rounded-lg shadow-md hover:border-agri-green-primary/50 transition-all min-w-[160px]">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm ${isPdf ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                                                    {isPdf ? (
                                                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                                                                    ) : (
                                                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col min-w-0 pr-2">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isPdf ? 'Audit PDF' : 'Visual ID'}</span>
                                                                    <a href={`${ASSETS_BASE_URL}uploads/${doc}`} target="_blank" className="text-xs font-black text-slate-800 hover:text-agri-green-primary transition-colors truncate">
                                                                        View Identity
                                                                    </a>
                                                                </div>
                                                                {isEditing && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (confirm('Permanently remove this document?')) {
                                                                                const newDocs = (formData.businessDocuments || []).filter((d: string) => d !== doc);
                                                                                setFormData({ ...formData, businessDocuments: newDocs, businessDocument: formData.businessDocument === doc ? '' : formData.businessDocument });
                                                                            }
                                                                        }}
                                                                        className="absolute -top-2 -right-2 bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="col-span-full pt-8 mt-6 border-t border-slate-100 flex justify-end gap-4">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="bg-agri-green-primary text-white px-10 py-3.5 rounded-lg font-bold text-sm shadow-xl shadow-green-900/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {saving ? 'Synchronizing Profile...' : 'Authorize Updates'}
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {user.membership_status === '1' && (
                                <div className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-agri-green-primary/5 rounded-full -mr-32 -mt-32"></div>
                                    <div className="bg-agri-green-primary px-8 py-6 text-white flex items-center justify-between shadow-lg relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Operational Enterprise Status</p>
                                            <h4 className="text-xl font-bold tracking-tight">{user.planName || "Standard Membership Tier"}</h4>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-right border border-white/10">
                                            <p className="text-[10px] font-black uppercase opacity-60">Validation Expiry</p>
                                            <p className="text-sm font-bold tracking-tight">
                                                {user.membershipExpiry === 'Lifetime' 
                                                    ? 'Perpetual Access' 
                                                    : new Date(user.membershipExpiry).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-8 relative z-10">
                                        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-50">
                                            <div className="w-12 h-12 bg-agri-green-primary/10 rounded-xl flex items-center justify-center text-2xl text-agri-green-primary shadow-inner">🏆</div>
                                            <div>
                                                <h5 className="font-bold text-slate-800 tracking-tight">Enterprise Level Privileges</h5>
                                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-tight">Activated Operational Capabilities</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(user.membershipBenefits || []).map((benefit: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-3 bg-slate-50/50 p-4 rounded-lg border border-slate-100/50 hover:bg-white transition-colors">
                                                    <div className="w-5 h-5 bg-agri-green-primary/10 text-agri-green-primary rounded-md flex items-center justify-center text-[10px] shrink-0">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-700">{benefit}</span>
                                                </div>
                                            ))}
                                            {(user.membershipBenefits || []).length === 0 && (
                                                <div className="col-span-full py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                                    <p className="text-sm font-bold text-slate-400 italic">No specific tiered benefits identified for this account level.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 py-4">
                                <div className="flex-1 h-px bg-slate-100"></div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Scalability / Upgrade Management</h4>
                                <div className="flex-1 h-px bg-slate-100"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {plans.map((plan: any) => (
                                <div key={plan._id} className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500">
                                    <div className="bg-slate-50 p-1">
                                        <div className="bg-agri-green-primary px-8 py-5 text-white text-center rounded-md">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">{plan.duration} Cycle</p>
                                            <h4 className="text-lg font-bold tracking-tight">{plan.name}</h4>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col border-t border-slate-50/50">
                                        <div className="mb-8 p-4 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
                                            <span className="text-3xl font-black text-slate-800 tabular-nums">₹{plan.price}</span>
                                            <span className="text-slate-400 font-bold ml-2 text-xs uppercase tracking-tighter">/ {plan.duration}</span>
                                        </div>
                                        <ul className="space-y-4 flex-1 mb-10">
                                            {plan.benefits?.map((f: string, i: number) => (
                                                <li key={i} className="flex items-start gap-4 text-xs font-bold text-slate-600 leading-tight">
                                                    <div className="w-4 h-4 rounded-full bg-agri-green-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-agri-green-primary"><polyline points="20 6 9 17 4 12"/></svg>
                                                    </div>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => purchaseMembership(plan._id)}
                                            disabled={purchasing || user.membership_status === '1'}
                                            className={`w-full py-4 rounded-lg font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] ${user.membership_status === '1' 
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                                : 'bg-agri-green-primary text-white shadow-lg shadow-green-900/10 hover:brightness-110'}`}
                                        >
                                            {user.membership_status === '1' ? 'Current Tier Control' : 'Authorize Provisioning'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
        </MemberPortalContainer>
    );
}
