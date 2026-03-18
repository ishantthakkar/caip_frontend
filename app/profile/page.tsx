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
    const [locations, setLocations] = useState<any>(null);
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
            fetchLocations();
        }
    }, [router]);

    const fetchLocations = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}locations`);
            const data = await res.json();
            setLocations(data.states || []);
        } catch (error) {
            console.error("Error fetching locations:", error);
        }
    };

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
                <div className="animate-spin h-12 w-12 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
            </div>
        );
    }

    const states = (locations || []);
    const districts = states.find((s: any) => s.state === formData.state)?.districts || [];
    const subDistricts = districts.find((d: any) => d.district === formData.district)?.subDistricts || [];

    return (
        <MemberPortalContainer title="Profile" skipMembershipCheck={true}>
            <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-10">
                {/* Left Sidebar: Profile Card */}
                <div className="w-full lg:w-[350px] shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                        {/* Header Image section */}
                        <div className="h-32 bg-gradient-to-br from-[#4a90e2] to-[#2b5876] relative">
                            <div className="absolute top-2 right-2 text-white/50 cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="relative pt-14 pb-8 px-8 flex flex-col items-center flex-1">
                            {/* Avatar */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-white bg-gray-100 shadow-sm overflow-hidden flex items-center justify-center">
                                <span className="text-gray-300 text-6xl">👤</span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-8">{user.name || "User Name"}</h3>

                            <div className="w-full space-y-4 mb-10">
                                {[
                                    { label: 'Member ID', value: user.memberId || 'CAIP08' },
                                    { label: 'Email', value: user.email || 'testcompany@' },
                                    { label: 'Phone', value: user.phone || '9876543210' },
                                    { label: 'Membership Status', value: user.membership_status === '1' ? 'Active' : 'Pending', valueClass: user.membership_status === '1' ? 'text-green-600' : 'text-amber-500' },
                                    { label: 'Membership Expiry Date', value: 'November 04, 2026' }, // Placeholder based on SS
                                ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-semibold">{item.label} :</span>
                                        <span className={`font-bold ${item.valueClass || 'text-gray-800'}`}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Stats Summary Area at Bottom */}
                            <div className="mt-auto w-full pt-8 border-t border-gray-100 grid grid-cols-2 text-center divide-x divide-gray-100">
                                <div>
                                    <p className="text-xl font-bold text-gray-800">28</p>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Searches</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-800">5</p>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">Defaulter<br />Reported</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Main Form Area */}
                <div className="flex-1 space-y-6">
                    {/* Dark Green Tabs Area */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-[#1b5e20] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('membership')}
                            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'membership' ? 'bg-[#1b5e20] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Membership
                        </button>
                    </div>

                    {activeTab === 'overview' ? (
                        <div className="space-y-6">
                            {/* Summary Text Section */}
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Summary</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Welcome to your CAIP profile! Here, you can manage your business details, track your activity, and stay updated on defaulter reports. As a valued member of the Chamber for Agri Input Protection, your contributions help create a more secure and transparent agricultural trade ecosystem. Ensure your profile is up-to-date for a seamless experience in reporting defaulters, checking credit status, and managing your membership.
                                </p>
                            </div>

                            {/* Business Information Section */}
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-bold text-[#4caf50]">Business Information</h3>
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="flex items-center gap-2 bg-[#1b5e20] text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-green-800 transition-all shadow-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                        Edit
                                    </button>
                                </div>

                                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {[
                                        { label: 'Company Name*', key: 'companyName' },
                                        { label: 'Business Type', key: 'businessType', isSelect: true, options: ['Manufacturer', 'Distributor', 'Retailer', 'Wholesaler'] },
                                        { label: 'GST Number*', key: 'gst' },
                                        { label: 'Years in Business', key: 'yearsInBusiness' },
                                        { label: 'CIN Number', key: 'cinNumber' },
                                        { label: 'PAN Number*', key: 'pan' }
                                    ].map((field: any) => (
                                        <div key={field.key} className="space-y-1.5 flex flex-col">
                                            <label className="text-sm font-bold text-gray-700">{field.label}</label>
                                            {field.isSelect ? (
                                                <select
                                                    disabled={!isEditing}
                                                    value={formData[field.key] || ''}
                                                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                                    className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] appearance-none disabled:opacity-100 disabled:bg-gray-50/30 h-[42px]`}
                                                >
                                                    <option value="">Select Business Type</option>
                                                    {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    readOnly={!isEditing}
                                                    value={formData[field.key] || ''}
                                                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                                    placeholder={`Enter ${field.label.replace('*', '')}`}
                                                    className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] ${!isEditing ? 'bg-gray-50/30' : ''}`}
                                                />
                                            )}
                                        </div>
                                    ))}

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-sm font-bold text-gray-700">State*</label>
                                        <select
                                            disabled={!isEditing}
                                            value={formData.state || ''}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value, district: '', subDistrict: '' })}
                                            className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] appearance-none disabled:opacity-100 disabled:bg-gray-50/30`}
                                        >
                                            <option value="">Select State</option>
                                            {states.map((s: any) => <option key={s.state} value={s.state}>{s.state}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-sm font-bold text-gray-700">District*</label>
                                        <select
                                            disabled={!isEditing}
                                            value={formData.district || ''}
                                            onChange={(e) => setFormData({ ...formData, district: e.target.value, subDistrict: '' })}
                                            className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] appearance-none disabled:opacity-100 disabled:bg-gray-50/30`}
                                        >
                                            <option value="">Select District</option>
                                            {districts.map((d: any) => <option key={d.district} value={d.district}>{d.district}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-sm font-bold text-gray-700">Sub District*</label>
                                        <select
                                            disabled={!isEditing}
                                            value={formData.subDistrict || ''}
                                            onChange={(e) => setFormData({ ...formData, subDistrict: e.target.value })}
                                            className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] appearance-none disabled:opacity-100 disabled:bg-gray-50/30`}
                                        >
                                            <option value="">Select Sub District</option>
                                            {subDistricts.map((sd: any) => <option key={sd} value={sd}>{sd}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-sm font-bold text-gray-700">Pin Code*</label>
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={formData.pinCode || ''}
                                            onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                                            placeholder="Enter Pin Code"
                                            className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] ${!isEditing ? 'bg-gray-50/30' : ''}`}
                                        />
                                    </div>

                                    <div className="space-y-1.5 flex flex-col md:col-span-1">
                                        <label className="text-sm font-bold text-gray-700">Business Address*</label>
                                        <textarea
                                            readOnly={!isEditing}
                                            value={formData.businessAddress || ''}
                                            onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                                            placeholder="Enter Business Address"
                                            rows={1}
                                            className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] resize-none ${!isEditing ? 'bg-gray-50/30' : ''}`}
                                        />
                                    </div>

                                    <div className="space-y-1.5 flex flex-col md:col-span-1">
                                        <label className="text-sm font-bold text-gray-700">Industry</label>
                                        <select
                                            disabled={!isEditing}
                                            value={formData.industry || ''}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] appearance-none disabled:opacity-100 disabled:bg-gray-50/30`}
                                        >
                                            <option value="Agriculture">Agriculture</option>
                                            <option value="Chemicals">Chemicals</option>
                                            <option value="Fertilizers">Fertilizers</option>
                                        </select>
                                    </div>

                                    {/* Contact Information Section */}
                                    <div className="col-span-full pt-8 mt-4 border-t border-gray-100/50">
                                        <h3 className="text-lg font-bold text-[#4caf50] mb-6">Contact Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            {[
                                                { label: 'Company Email*', key: 'companyEmail', placeholder: 'testcompany@gmail.com' },
                                                { label: 'Alternate Contact Person', key: 'alternateContactPerson', placeholder: 'Enter Contact Person Name' },
                                                { label: 'Company Phone Number*', key: 'companyPhoneNumber', placeholder: '9876543210' },
                                                { label: 'Alternate Contact Number', key: 'alternateContactNumber', placeholder: 'Enter Contact Number' }
                                            ].map((field) => (
                                                <div key={field.key} className="space-y-1.5 flex flex-col">
                                                    <label className="text-sm font-bold text-gray-700">{field.label}</label>
                                                    <input
                                                        type="text"
                                                        readOnly={!isEditing}
                                                        value={formData[field.key] || ''}
                                                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                                        placeholder={field.placeholder}
                                                        className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] ${!isEditing ? 'bg-gray-50/30' : ''}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Additional Business Details Section */}
                                    <div className="col-span-full pt-8 mt-4 border-t border-gray-100/50">
                                        <h3 className="text-lg font-bold text-[#4caf50] mb-6">Additional Business Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-1.5 flex flex-col">
                                                <label className="text-sm font-bold text-gray-700">Website URL</label>
                                                <input
                                                    type="text"
                                                    readOnly={!isEditing}
                                                    value={formData.websiteUrl || ''}
                                                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                                    placeholder="Enter Website URL"
                                                    className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] ${!isEditing ? 'bg-gray-50/30' : ''}`}
                                                />
                                            </div>
                                            <div className="space-y-1.5 flex flex-col">
                                                <label className="text-sm font-bold text-gray-700">Upload Business Documents</label>
                                                <div className={`relative w-full border ${isEditing ? 'border-[#4caf50] border-dashed' : 'border-gray-200'} rounded-lg py-2 px-4 flex items-center gap-3 transition-colors ${!isEditing ? 'bg-gray-50/30' : 'bg-green-50/20'}`}>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        disabled={!isEditing}
                                                        onChange={(e) => setBusinessDocs(e.target.files)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-default"
                                                    />
                                                    <button type="button" className="bg-gray-100 px-3 py-1.5 rounded text-xs font-bold text-gray-600 border border-gray-200">Choose files</button>
                                                    <span className="text-xs text-gray-400 font-medium overflow-hidden whitespace-nowrap overflow-ellipsis">
                                                        {businessDocs ? `${businessDocs.length} files selected` : 'No file chosen'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-1 font-semibold">Upload GST Certificate, Trade License, etc.</p>

                                                {/* Document List with Icons */}
                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    {/* Display merged documents from both fields if they exist */}
                                                    {[...(formData.businessDocuments || []), ...(formData.businessDocument ? [formData.businessDocument] : [])].map((doc: string, idx: number) => {
                                                        const isPdf = doc.toLowerCase().endsWith('.pdf');
                                                        return (
                                                            <div key={idx} className="group relative flex items-center gap-3 bg-white border border-gray-100 p-2 rounded-xl shadow-sm hover:border-green-200 transition-all min-w-[140px]">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                                                    {isPdf ? (
                                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></svg>
                                                                    ) : (
                                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col min-w-0 pr-2">
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isPdf ? 'PDF' : 'IMAGE'}</span>
                                                                    <a href={`${ASSETS_BASE_URL}uploads/${doc}`} target="_blank" className="text-[11px] font-bold text-gray-700 truncate hover:text-green-600 transition-colors">
                                                                        View File
                                                                    </a>
                                                                </div>
                                                                {isEditing && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (confirm('Remove this document?')) {
                                                                                const newDocs = (formData.businessDocuments || []).filter((d: string) => d !== doc);
                                                                                setFormData({ ...formData, businessDocuments: newDocs, businessDocument: formData.businessDocument === doc ? '' : formData.businessDocument });
                                                                            }
                                                                        }}
                                                                        className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
                                        <div className="col-span-full pt-8 mt-6 border-t border-gray-100 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="bg-green-600 text-white px-10 py-3 rounded-lg font-bold text-sm shadow-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {saving ? 'Saving...' : 'Update Details'}
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                            {plans.map((plan: any) => (
                                <div key={plan._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:border-green-600/30 transition-colors">
                                    <div className="bg-[#1b5e20] p-6 text-white text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{plan.duration} Validity</p>
                                        <h4 className="text-xl font-bold">{plan.name}</h4>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="mb-6 text-center">
                                            <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                                            <span className="text-gray-400 font-medium ml-2 text-sm">/ {plan.duration}</span>
                                        </div>
                                        <ul className="space-y-3 flex-1 mb-8">
                                            {plan.features?.map((f: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-xs font-semibold text-gray-600">
                                                    <span className="text-green-600 mt-1">✓</span> {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => purchaseMembership(plan._id)}
                                            disabled={purchasing || user.membership_status === '1'}
                                            className="w-full bg-[#1b5e20] text-white py-3 rounded-lg font-bold text-xs shadow-sm hover:bg-green-700 transition-all disabled:opacity-30"
                                        >
                                            {user.membership_status === '1' ? 'Current Plan' : 'Buy Now'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MemberPortalContainer>
    );
}
