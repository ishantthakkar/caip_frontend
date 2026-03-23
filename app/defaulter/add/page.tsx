"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import Link from 'next/link';
import { API_BASE_URL } from '@/config/apiConfig';

export default function AddDefaulterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [states, setStates] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [subDistricts, setSubDistricts] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [errors, setErrors] = useState<any>({});

    const [formData, setFormData] = useState({
        defaulter_name: '', mobile_number: '', email_id: '', gst_number: '', pan_number: '', cin_number: '', aadhar_number: '', state: '', district: '', cities: '', city: '', financial_year: '2025-2026', default_amount: '', industry: '', date_of_default: '', reason_description: '', defaulter_address: '', court_complex_name: '', case_type: '', case_number: '', case_year: '', case_status: ''
    });

    useEffect(() => {
        fetchStates();
    }, []);

    const fetchStates = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}locations`);
            const data = await res.json();
            setStates(data.states.map((s: any) => s.state) || []);
        } catch (error) {
            console.error("Error fetching states:", error);
        }
    };

    const fetchDistricts = async (state: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}districts?state=${encodeURIComponent(state)}`);
            const data = await res.json();
            setDistricts(data.districts || []);
        } catch (error) {
            console.error("Error fetching districts:", error);
        }
    };

    const fetchSubDistricts = async (state: string, district: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}sub-districts?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
            const data = await res.json();
            setSubDistricts(data.subDistricts || []);
        } catch (error) {
            console.error("Error fetching sub-districts:", error);
        }
    };

    const fetchCities = async (state: string, district: string, subDistrict: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}cities?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&subDistrict=${encodeURIComponent(subDistrict)}`);
            const data = await res.json();
            setCities(data.cities || []);
        } catch (error) {
            console.error("Error fetching cities:", error);
        }
    };

    useEffect(() => {
        if (formData.state) {
            fetchDistricts(formData.state);
        }
    }, [formData.state]);

    useEffect(() => {
        if (formData.state && formData.district) {
            fetchSubDistricts(formData.state, formData.district);
        }
    }, [formData.district]);

    useEffect(() => {
        if (formData.state && formData.district && formData.cities) {
            fetchCities(formData.state, formData.district, formData.cities);
        } else {
            setCities([]);
        }
    }, [formData.state, formData.district, formData.cities]);

    const validateGst = (gst: string) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
    const validatePan = (pan: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
    const validateMobile = (mobile: string) => /^[0-9]{10}$/.test(mobile);
    const validateAadhar = (aadhar: string) => /^[0-9]{12}$/.test(aadhar);
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validateCin = (cin: string) => cin.length === 21;

    const [isGstFetching, setIsGstFetching] = useState(false);
    const [pendingLocation, setPendingLocation] = useState<any>(null);

    const handleGstFetch = async () => {
        if (!formData.gst_number) {
            alert("Please enter a GST number first");
            return;
        }

        setIsGstFetching(true);
        try {
            const response = await fetch(`${API_BASE_URL}verify-gst/${formData.gst_number}`);
            const result = await response.json();

            if (response.ok) {
                const { data } = result;
                
                // Extract PAN from GST if possible
                let panFromGst = "";
                if (formData.gst_number.length >= 12) {
                    panFromGst = formData.gst_number.substring(2, 12).toUpperCase();
                }

                setFormData(prev => ({
                    ...prev,
                    defaulter_name: data.lgnm || data.tradeNam || prev.defaulter_name,
                    defaulter_address: data.pradr?.adr || prev.defaulter_address,
                    pan_number: panFromGst || prev.pan_number,
                }));

                if (data.pradr?.addr?.stcd) {
                    const gstState = data.pradr.addr.stcd;
                    const matchedState = states.find(s => s.toLowerCase() === gstState.toLowerCase()) || gstState;
                    
                    setFormData(prev => ({ ...prev, state: matchedState }));
                    
                    if (data.pradr.addr.dst) {
                        setPendingLocation({
                            district: data.pradr.addr.dst,
                            subDistrict: data.pradr.addr.st,
                            city: data.pradr.addr.loc
                        });
                    }
                }
            } else {
                alert(result.msg || "Invalid GST number");
            }
        } catch (error) {
            console.error("GST Fetch error:", error);
            alert("Error connecting to GST service");
        } finally {
            setIsGstFetching(false);
        }
    };

    // Location auto-selection effect
    useEffect(() => {
        if (pendingLocation?.district && districts.length > 0) {
            const matched = districts.find(d => d.toLowerCase() === pendingLocation.district.toLowerCase());
            if (matched) {
                setFormData(prev => ({ ...prev, district: matched }));
                setPendingLocation((prev: any) => ({ ...prev, district: null }));
            }
        }
    }, [districts, pendingLocation]);

    useEffect(() => {
        if (pendingLocation?.subDistrict && subDistricts.length > 0) {
            const matched = subDistricts.find(s => s.toLowerCase() === pendingLocation.subDistrict.toLowerCase());
            if (matched) {
                setFormData(prev => ({ ...prev, cities: matched }));
                setPendingLocation((prev: any) => ({ ...prev, subDistrict: null }));
            }
        }
    }, [subDistricts, pendingLocation]);

    useEffect(() => {
        if (pendingLocation?.city && cities.length > 0) {
            const matched = cities.find(c => c.toLowerCase() === pendingLocation.city.toLowerCase());
            if (matched) {
                setFormData(prev => ({ ...prev, city: matched }));
                setPendingLocation(null);
            }
        }
    }, [cities, pendingLocation]);

    const validateStep1 = () => {
        const newErrors: any = {};
        if (!formData.defaulter_name) newErrors.defaulter_name = "Required";
        if (!formData.mobile_number || !validateMobile(formData.mobile_number)) newErrors.mobile_number = "Enter 10-digit mobile";
        if (!formData.gst_number || !validateGst(formData.gst_number)) newErrors.gst_number = "Valid GST required";
        if (!formData.pan_number || !validatePan(formData.pan_number)) newErrors.pan_number = "Valid PAN required";
        if (!formData.state) newErrors.state = "Required";
        if (!formData.district) newErrors.district = "Required";
        if (!formData.cities) newErrors.cities = "Required";
        if (!formData.city) newErrors.city = "Required";
        if (!formData.defaulter_address) newErrors.defaulter_address = "Required";
        if (!formData.financial_year) newErrors.financial_year = "Required";
        if (!formData.aadhar_number || !validateAadhar(formData.aadhar_number)) newErrors.aadhar_number = "Valid 12-digit Aadhar required";
        if (!formData.email_id || !validateEmail(formData.email_id)) newErrors.email_id = "Valid email required";
        if (!formData.cin_number || !validateCin(formData.cin_number)) newErrors.cin_number = "CIN must be 21 characters";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors: any = {};
        if (!formData.date_of_default) newErrors.date_of_default = "Required";
        if (!formData.default_amount || parseFloat(formData.default_amount) <= 0) newErrors.default_amount = "Valid amount required";
        if (!formData.reason_description) newErrors.reason_description = "Reason is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'state' ? { district: '', cities: '', city: '' } : {}),
            ...(name === 'district' ? { cities: '', city: '' } : {}),
            ...(name === 'cities' ? { city: '' } : {})
        }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, (formData as any)[key]));
            if (selectedFiles) Array.from(selectedFiles).forEach(file => data.append('attachment_documents', file));

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}defaulter/report`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            if (response.ok) {
                alert("Defaulter reported successfully!");
                router.push('/defaulter/list');
            }
        } catch (error) {
            console.error("Submission error:", error);
        } finally {
            setSaving(false);
        }
    };

    // In AddDefaulterPage, the original code used 'cities' for sub-district selection.
    // I'll keep the same field name 'cities' to avoid breaking the backend POST, 
    // but I'll add a fourth level for the actual 'city' if needed. 
    // The user explicitly asked for: state, district, sub-district and city field with dependency
    // So I will update the formData and the UI to show all 4.

    return (
        <MemberPortalContainer title="Report New Defaulter">
            <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-10">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => router.push('/defaulter/list')} className="inline-flex items-center gap-2 text-slate-500 hover:text-agri-green-primary transition-all group bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-xs font-bold">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                        Back to List
                    </button>
                    <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${step === s ? 'bg-agri-green-primary text-white shadow-md' : 'text-gray-300'}`}>
                                STEP {s}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                    <div className="bg-agri-green-primary px-8 py-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                {step === 1 ? 'Defaulter Information' : step === 2 ? 'Financial Details' : 'Legal & Supporting Documents'}
                            </h2>
                            <p className="text-xs text-white/60 font-medium mt-1">Please provide accurate details to report the defaulter</p>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white text-xl">
                            {step === 1 ? '👤' : step === 2 ? '💰' : '📄'}
                        </div>
                    </div>

                    <form className="p-8 flex-1 flex flex-col justify-between">
                        {step === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1.5 col-span-full md:col-span-1">
                                    <label className="text-[11px] font-black text-gray-400">Company / Business Name*</label>
                                    <input type="text" name="defaulter_name" value={formData.defaulter_name} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm transition-all ${errors.defaulter_name ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`} placeholder="Enter name" />
                                    {errors.defaulter_name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.defaulter_name}</p>}
                                </div>
                                <div className="space-y-1.5 col-span-full md:col-span-1">
                                    <label className="text-[11px] font-black text-gray-400">Contact Number*</label>
                                    <input type="text" name="mobile_number" value={formData.mobile_number} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm transition-all ${errors.mobile_number ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`} placeholder="10-digit mobile" />
                                    {errors.mobile_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.mobile_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">GST Number*</label>
                                    <div className="flex gap-2">
                                        <input type="text" name="gst_number" value={formData.gst_number} onChange={handleInputChange} className={`flex-1 border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm transition-all ${errors.gst_number ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`} placeholder="GST No" />
                                        <button type="button" onClick={handleGstFetch} disabled={isGstFetching} className="px-5 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black hover:bg-black transition-all disabled:opacity-50 shadow-md">
                                            {isGstFetching ? '...' : 'FETCH'}
                                        </button>
                                    </div>
                                    {errors.gst_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.gst_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Email Address*</label>
                                    <input type="email" name="email_id" value={formData.email_id} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm transition-all ${errors.email_id ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`} placeholder="Email ID" />
                                    {errors.email_id && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.email_id}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">PAN Number*</label>
                                    <input type="text" name="pan_number" value={formData.pan_number} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm transition-all ${errors.pan_number ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`} placeholder="PAN No" />
                                    {errors.pan_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.pan_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">CIN Number*</label>
                                    <input type="text" name="cin_number" value={formData.cin_number} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm transition-all ${errors.cin_number ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`} placeholder="CIN No" maxLength={21} />
                                    {errors.cin_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.cin_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">State*</label>
                                    <select name="state" value={formData.state} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm bg-white transition-all ${errors.state ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`}>
                                        <option value="">Select State</option>
                                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.state && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.state}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">District*</label>
                                    <select name="district" value={formData.district} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm bg-white transition-all ${errors.district ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`}>
                                        <option value="">Select District</option>
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    {errors.district && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.district}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Sub-District*</label>
                                    <select name="cities" value={formData.cities} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm bg-white transition-all ${errors.cities ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`}>
                                        <option value="">Select Sub-District</option>
                                        {subDistricts.map(sd => <option key={sd} value={sd}>{sd}</option>)}
                                    </select>
                                    {errors.cities && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.cities}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">City / Village / Town*</label>
                                    <select name="city" value={formData.city} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm bg-white transition-all ${errors.city ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`}>
                                        <option value="">Select City</option>
                                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    {errors.city && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.city}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Aadhar Number*</label>
                                    <input type="text" name="aadhar_number" value={formData.aadhar_number} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm transition-all ${errors.aadhar_number ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`} placeholder="12-digit Aadhar No" maxLength={12} />
                                    {errors.aadhar_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.aadhar_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Industry Sector</label>
                                    <select name="industry" value={formData.industry} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm bg-white transition-all border-gray-100 bg-gray-50/30`}>
                                        <option value="">Select Industry</option>
                                        <option value="Agriculture">Agriculture</option>
                                        <option value="Agrochemicals & Fertilizers">Agrochemicals & Fertilizers</option>
                                        <option value="Seed Suppliers">Seed Suppliers</option>
                                        <option value="Farming Equipment">Farming Equipment</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Financial Year*</label>
                                    <select name="financial_year" value={formData.financial_year} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm bg-white transition-all ${errors.financial_year ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`}>
                                        <option value="">Select Financial Year</option>
                                        {Array.from({ length: 15 }).map((_, i) => {
                                            const year = 2025 - i;
                                            const label = `${year}-${(year + 1).toString().slice(-2)}`;
                                            return <option key={label} value={label}>{label}</option>
                                        })}
                                    </select>
                                    {errors.financial_year && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.financial_year}</p>}
                                </div>
                                <div className="col-span-full space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Full Address*</label>
                                    <textarea name="defaulter_address" value={formData.defaulter_address} onChange={handleInputChange} rows={3} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm transition-all ${errors.defaulter_address ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`} placeholder="Enter complete office/home address" />
                                    {errors.defaulter_address && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.defaulter_address}</p>}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Date of Default*</label>
                                    <input type="date" name="date_of_default" value={formData.date_of_default} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm transition-all ${errors.date_of_default ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`} />
                                    {errors.date_of_default && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.date_of_default}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Initial Default Amount (₹)*</label>
                                    <input type="number" name="default_amount" value={formData.default_amount} onChange={handleInputChange} className={`w-full border rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm font-bold transition-all ${errors.default_amount ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`} placeholder="0.00" />
                                    {errors.default_amount && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.default_amount}</p>}
                                </div>
                                <div className="col-span-full space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Describe the Case / Reason*</label>
                                    <textarea name="reason_description" value={formData.reason_description} onChange={handleInputChange} rows={6} className={`w-full border rounded-xl py-4 px-4 outline-none focus:border-agri-green-primary text-sm leading-relaxed transition-all ${errors.reason_description ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/30'}`} placeholder="Briefly explain the nature of default..." />
                                    {errors.reason_description && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.reason_description}</p>}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Court Name (If filed)</label>
                                    <input type="text" name="court_complex_name" value={formData.court_complex_name} onChange={handleInputChange} className="w-full border border-gray-100 bg-gray-50/30 rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm" placeholder="e.g. District Court" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Case / Suite Number</label>
                                    <input type="text" name="case_number" value={formData.case_number} onChange={handleInputChange} className="w-full border border-gray-100 bg-gray-50/30 rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm" placeholder="Case ID" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Supporting Documents (Max 3)</label>
                                    <div className="relative">
                                        <input type="file" multiple onChange={(e) => setSelectedFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        <div className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 px-4 text-center bg-gray-50/30 group-hover:bg-white transition-all">
                                            <div className="text-2xl mb-2 text-gray-300">📤</div>
                                            <p className="text-xs font-bold text-gray-400">Click or drag files to upload</p>
                                            <p className="text-[9px] text-gray-400 mt-1">PDF, JPG, or PNG (Max 5MB each)</p>
                                        </div>
                                    </div>
                                    {selectedFiles && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {Array.from(selectedFiles).map((file, i) => (
                                                <span key={i} className="px-3 py-1 bg-agri-green-50 text-agri-green-primary text-[10px] font-bold rounded-lg border border-agri-green-100">
                                                    {file.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400">Current Legal Status</label>
                                    <select name="case_status" value={formData.case_status} onChange={handleInputChange} className="w-full border border-gray-100 bg-gray-50/30 rounded-xl py-3 px-4 outline-none focus:border-agri-green-primary text-sm bg-white">
                                        <option value="">Select Status</option>
                                        <option value="Notice Issued">Notice Issued</option>
                                        <option value="Under Review">Under Review</option>
                                        <option value="Warrant Issued">Warrant Issued</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="pt-10 flex flex-col sm:flex-row items-center gap-4">
                            {step > 1 && (
                                <button type="button" onClick={() => setStep(s => s - 1)} className="w-full sm:w-auto px-10 py-3.5 border border-gray-200 text-gray-500 font-black rounded-xl hover:bg-gray-50 transition-all text-xs tracking-tight">
                                    BACK
                                </button>
                            )}
                            {step < 3 ? (
                                <button type="button" onClick={handleNextStep} className="w-full sm:w-auto flex-1 bg-agri-green-primary text-white font-black py-4 rounded-xl shadow-lg hover:bg-black transition-all text-xs tracking-tight">
                                    CONTINUE TO NEXT STEP
                                </button>
                            ) : (
                                <button type="button" onClick={() => handleSubmit()} disabled={saving} className="w-full flex-1 bg-agri-green-primary text-white font-black py-4 rounded-xl shadow-xl hover:bg-black transition-all text-xs tracking-tight flex items-center justify-center gap-3">
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            SUBMITTING...
                                        </>
                                    ) : (
                                        <>REPORT DEFAULTER NOW</>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </MemberPortalContainer>
    );
}
