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
    const [showAvatarEdit, setShowAvatarEdit] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
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
                if (!['businessDocuments', 'profileImage', 'attachment_documents', 'payments', 'user_id', '_id', 'createdAt', 'updatedAt', '__v'].includes(key)) {
                    if (formData[key] !== null && formData[key] !== undefined) {
                        data.append(key, formData[key]);
                    }
                }
            });

            // Append business documents if any
            if (businessDocs) {
                Array.from(businessDocs).forEach(file => {
                    data.append('businessDocuments', file);
                });
            }

            // Append profile image if any
            if (avatarFile) {
                data.append('profileImage', avatarFile);
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
                window.dispatchEvent(new Event('user-update'));
                setIsEditing(false);
                setShowAvatarEdit(false);
                setBusinessDocs(null);
                setAvatarFile(null);
                setAvatarPreview(null);
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


    return (
        <MemberPortalContainer title="Profile" skipMembershipCheck={true}>
            <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-10">
                {/* Left Sidebar: Profile Card */}
                <div className="w-full lg:w-[350px] shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                        {/* Header Image section */}
                        {/* Header Image section */}
                        <div className="h-32 bg-gradient-to-br from-[#4a90e2] to-[#2b5876] relative">
                            <button
                                onClick={() => setShowAvatarEdit(true)}
                                className="absolute top-2 right-2 text-white/50 hover:text-white transition-colors cursor-pointer p-2 rounded-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>
                        </div>

                        {/* Profile Info */}
                        <div className="relative pt-14 pb-8 px-8 flex flex-col items-center flex-1">
                            {/* Avatar */}
                            <div
                                onClick={() => setShowAvatarEdit(true)}
                                className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group"
                            >
                                <img
                                    src={user.profileImage ? `${ASSETS_BASE_URL}uploads/${user.profileImage}` : (avatarPreview || "/default-avatar.jpg")}
                                    alt="Profile"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-8">{user.name || "User Name"}</h3>

                            <div className="w-full space-y-4 mb-10">
                                {[
                                    { label: 'Member ID', value: user.memberId || 'CAIP08' },
                                    { label: 'Email', value: user.email || 'testcompany@' },
                                    { label: 'Phone', value: user.phone || '9876543210' },
                                    { label: 'Membership Status', value: user.membership_status === '1' ? 'Active' : 'Pending', valueClass: user.membership_status === '1' ? 'text-green-600' : 'text-amber-500' },
                                    ...(user.membership_status === '1' ? [
                                        {
                                            label: 'Membership Expiry Date',
                                            value: user.membershipExpiry === 'Lifetime'
                                                ? 'Lifetime'
                                                : (user.membershipExpiry && user.membershipExpiry !== 'N/A'
                                                    ? new Date(user.membershipExpiry).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })
                                                    : 'N/A')
                                        }
                                    ] : []),
                                ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-semibold">{item.label} :</span>
                                        <span className={`font-bold ${item.valueClass || 'text-gray-800'}`}>{item.value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-semibold">Aadhar :</span>
                                    <span className="font-bold text-gray-800">{user.aadhar || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-semibold">PAN :</span>
                                    <span className="font-bold text-gray-800">{user.pan || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Stats Summary Area at Bottom */}
                            <div className="mt-auto w-full pt-8 border-t border-gray-100 grid grid-cols-2 text-center divide-x divide-gray-100">
                                <div>
                                    <p className="text-xl font-bold text-gray-800">{user?.searchCount || 0}</p>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Searches</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-800">{user?.reportCount || 0}</p>
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

                                </div>

                                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {[
                                        { label: 'Company Name', key: 'companyName' },
                                        { label: 'GST', key: 'gst' },
                                        { label: 'CIN', key: 'cinNumber' },
                                        { label: 'PAN', key: 'pan' },
                                        { label: 'Aadhar Number', key: 'aadhar' }
                                    ].map((field: any) => (
                                        <div key={field.key} className="space-y-1.5 flex flex-col">
                                            <label className="text-sm font-bold text-gray-700">{field.label}</label>
                                            <input
                                                type="text"
                                                readOnly={!isEditing}
                                                value={formData[field.key] || ''}
                                                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                                placeholder={`Enter ${field.label.replace('*', '')}`}
                                                className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] ${!isEditing ? 'bg-gray-50/30' : ''}`}
                                            />
                                        </div>
                                    ))}

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-sm font-bold text-gray-700">State</label>
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
                                            className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] appearance-none disabled:opacity-100 disabled:bg-gray-50/30`}
                                        >
                                            <option value="">Select State</option>
                                            {states.map((s: any) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-sm font-bold text-gray-700">District</label>
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
                                            className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] appearance-none disabled:opacity-100 disabled:bg-gray-50/30`}
                                        >
                                            <option value="">Select District</option>
                                            {districts.map((d: any) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-sm font-bold text-gray-700">Sub District</label>
                                        <select
                                            disabled={!isEditing}
                                            value={formData.subDistrict || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, subDistrict: val, city: '' });
                                                fetchCities(formData.state, formData.district, val);
                                                setCities([]);
                                            }}
                                            className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] appearance-none disabled:opacity-100 disabled:bg-gray-50/30`}
                                        >
                                            <option value="">Select Sub District</option>
                                            {subDistricts.map((sd: any) => <option key={sd} value={sd}>{sd}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-sm font-bold text-gray-700">City/Village/Town</label>
                                        <select
                                            disabled={!isEditing}
                                            value={formData.city || ''}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] appearance-none disabled:opacity-100 disabled:bg-gray-50/30`}
                                        >
                                            <option value="">Select City/Village/Town</option>
                                            {cities.map((c: any) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-sm font-bold text-gray-700">Pincode</label>
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
                                        <label className="text-sm font-bold text-gray-700">Business Address</label>
                                        <textarea
                                            readOnly={!isEditing}
                                            value={formData.businessAddress || ''}
                                            onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                                            placeholder="Enter Business Address"
                                            rows={3}
                                            className={`w-full bg-white border ${isEditing ? 'border-[#4caf50]' : 'border-gray-200'} rounded-lg py-2.5 px-4 outline-none text-sm font-medium transition-colors focus:border-[#1b5e20] resize-none ${!isEditing ? 'bg-gray-50/30' : ''}`}
                                        />
                                    </div>


                                    {/* Contact Information Section */}
                                    <div className="col-span-full pt-8 mt-4 border-t border-gray-100/50">
                                        <h3 className="text-lg font-bold text-[#4caf50] mb-6">Contact Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            {[
                                                { label: 'Company Email', key: 'companyEmail', placeholder: 'testcompany@gmail.com' },
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
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {user.membership_status === '1' && (
                                <div className="bg-white rounded-2xl shadow-sm border-2 border-green-600/20 overflow-hidden">
                                    <div className="bg-[#1b5e20] p-6 text-white flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Your Currently Active Plan</p>
                                            <h4 className="text-xl font-bold">{user.planName || "Active Membership"}</h4>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-right">
                                            <p className="text-[10px] font-bold uppercase opacity-60">Expires On</p>
                                            <p className="text-sm font-bold">
                                                {user.membershipExpiry === 'Lifetime'
                                                    ? 'Lifetime Validity'
                                                    : new Date(user.membershipExpiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-2xl text-green-600">🛡️</div>
                                            <div>
                                                <h5 className="font-bold text-gray-800">Membership Benefits</h5>
                                                <p className="text-xs text-gray-400 font-medium tracking-tight">Features unlocked with your current subscription</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(user.membershipBenefits || []).map((benefit: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                                                    <div className="w-6 h-6 bg-[#1b5e20] text-white rounded-full flex items-center justify-center text-[10px] shrink-0">✓</div>
                                                    <span className="text-sm font-semibold text-gray-700">{benefit}</span>
                                                </div>
                                            ))}
                                            {(user.membershipBenefits || []).length === 0 && (
                                                <div className="col-span-full py-4 text-center text-gray-400 italic text-sm">
                                                    No specific benefits listed for this plan.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 py-2">
                                <div className="flex-1 h-px bg-gray-100"></div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Available Upgrade Plans</h4>
                                <div className="flex-1 h-px bg-gray-100"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                {plan.benefits?.map((f: string, i: number) => (
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
                        </div>
                    )}
                </div>
            </div>
            {showAvatarEdit && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                        <div className="px-6 py-4 bg-[#1b5e20] text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                <h3 className="text-lg font-bold">Edit Profile</h3>
                            </div>
                            <button onClick={() => setShowAvatarEdit(false)} className="hover:rotate-90 transition-transform">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-8 space-y-6">

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Profile Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full border-2 border-gray-100 overflow-hidden shrink-0">
                                        <img
                                            src={avatarPreview || (user.profileImage ? `${ASSETS_BASE_URL}uploads/${user.profileImage}` : "/default-avatar.jpg")}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="relative flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setAvatarFile(file);
                                                    setAvatarPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center text-[11px] font-bold text-gray-400 group-hover:border-green-300">
                                            {avatarFile ? avatarFile.name : "Choose Profile Image"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAvatarEdit(false)}
                                    className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-2.5 rounded-xl bg-[#1b5e20] text-white font-bold text-sm shadow-lg hover:bg-green-800 transition-all disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MemberPortalContainer>
    );
}
