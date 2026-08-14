"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import Link from 'next/link';
import { API_BASE_URL } from '@/config/apiConfig';
import Swal from 'sweetalert2';

export default function AddDefaulterPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [states, setStates] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [subDistricts, setSubDistricts] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [errors, setErrors] = useState<any>({});

    const [formData, setFormData] = useState({
        defaulter_name: '', mobile_number: '', email_id: '', gst_number: '', pan_number: '', cin_number: '', aadhar_number: '', state: '', district: '', cities: '', city: '', financial_year: '', default_amount: '', industry: '', date_of_default: '', reason_description: '', defaulter_address: '', court_complex_name: '', case_type: '', case_number: '', case_year: '', case_status: '',
        defaulter_persons: [{ name: '', pan: '', aadhar: '' }],
        legal_status_taken: false
    });

    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    // Duplicate search logic
    useEffect(() => {
        const timer = setTimeout(() => {
            const { gst_number, pan_number, mobile_number, defaulter_address, defaulter_name } = formData;
            if (gst_number.length > 5 || pan_number.length > 5 || mobile_number.length === 10 || defaulter_address.length > 10 || defaulter_name.length > 3) {
                checkDuplicates();
            } else {
                setDuplicateWarning(null);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [formData.gst_number, formData.pan_number, formData.mobile_number, formData.defaulter_address, formData.defaulter_name]);

    const checkDuplicates = async () => {
        try {
            const token = localStorage.getItem('token');
            const q = new URLSearchParams();
            if (formData.gst_number) q.append('gst', formData.gst_number.trim().toUpperCase());
            if (formData.pan_number) q.append('pan', formData.pan_number.trim().toUpperCase());
            if (formData.mobile_number) q.append('mobile', formData.mobile_number.trim());
            if (formData.defaulter_address) q.append('address', formData.defaulter_address.trim());
            if (formData.defaulter_name) q.append('name', formData.defaulter_name.trim());

            if (q.toString()) {
                const res = await fetch(`${API_BASE_URL}defaulter/check-duplicate?${q.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.exists) {
                    setDuplicateWarning(`This ${data.field} has been previously reported by another member.`);
                } else {
                    setDuplicateWarning(null);
                }
            }
        } catch (e) {
            console.error("Duplicate check failure:", e);
        }
    };

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
            Swal.fire({
                title: "Action Required",
                text: "Please enter a GST number first",
                icon: "warning",
                confirmButtonColor: "#1b5e20"
            });
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
                    defaulter_name: data.legal_name || data.trade_name || prev.defaulter_name,
                    defaulter_address: data.address || prev.defaulter_address,
                    pan_number: panFromGst || prev.pan_number,
                }));
            } else {
                Swal.fire({
                    title: "Registration Failed",
                    text: result.msg || "Invalid GST number",
                    icon: "error",
                    confirmButtonColor: "#1b5e20"
                });
            }
        } catch (error) {
            console.error("GST Fetch error:", error);
            Swal.fire({
                title: "Connection Error",
                text: "Error connecting to GST service",
                icon: "error",
                confirmButtonColor: "#1b5e20"
            });
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

    const validateAll = () => {
        const newErrors: any = {};
        if (!formData.defaulter_name) newErrors.defaulter_name = "Required";
        if (!formData.mobile_number || !validateMobile(formData.mobile_number)) newErrors.mobile_number = "Enter 10-digit mobile";
        if (!formData.gst_number || !validateGst(formData.gst_number)) newErrors.gst_number = "Valid GST required";
        if (!formData.state) newErrors.state = "Required";
        if (!formData.district) newErrors.district = "Required";
        if (!formData.cities) newErrors.cities = "Required";
        if (!formData.city) newErrors.city = "Required";
        if (!formData.defaulter_address) newErrors.defaulter_address = "Required";
        if (!formData.financial_year) newErrors.financial_year = "Required";
        if (!formData.email_id || !validateEmail(formData.email_id)) newErrors.email_id = "Valid email required";

        // CIN Number Validation (Optional, but must be 21 chars if filled)
        if (formData.cin_number && !validateCin(formData.cin_number)) {
            newErrors.cin_number = "CIN must be 21 characters";
        }

        if (!formData.date_of_default) newErrors.date_of_default = "Required";
        if (!formData.default_amount || parseFloat(formData.default_amount) <= 0) newErrors.default_amount = "Valid amount required";
        if (!formData.industry) newErrors.industry = "Required";
        if (!formData.reason_description) newErrors.reason_description = "Reason is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({
            ...prev,
            [name]: finalValue,
            ...(name === 'state' ? { district: '', cities: '', city: '' } : {}),
            ...(name === 'district' ? { cities: '', city: '' } : {}),
            ...(name === 'cities' ? { city: '' } : {})
        }));
    };

    const handlePersonChange = (index: number, field: string, value: string) => {
        const updatedPersons = [...formData.defaulter_persons];
        (updatedPersons[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, defaulter_persons: updatedPersons }));
    };

    const addPerson = () => {
        setFormData(prev => ({
            ...prev,
            defaulter_persons: [...prev.defaulter_persons, { name: '', pan: '', aadhar: '' }]
        }));
    };

    const removePerson = (index: number) => {
        if (formData.defaulter_persons.length > 1) {
            const updatedPersons = formData.defaulter_persons.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, defaulter_persons: updatedPersons }));
        } else {
            // Just clear the first person instead of removing
            setFormData(prev => ({ ...prev, defaulter_persons: [{ name: '', pan: '', aadhar: '' }] }));
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validateAll()) {
            Swal.fire({
                title: "Incomplete Form",
                text: "Please fill all required fields correctly before submitting.",
                icon: "warning",
                confirmButtonColor: "#1b5e20"
            });
            return;
        }

        const result = await Swal.fire({
            title: "Report Defaulter?",
            text: "Are you sure you want to report this defaulter?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#1b5e20",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, report it!"
        });

        if (result.isConfirmed) {
            performSubmission();
        }
    };

    const performSubmission = async () => {
        setSaving(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'defaulter_persons') {
                    data.append(key, JSON.stringify(formData.defaulter_persons));
                } else {
                    data.append(key, (formData as any)[key]);
                }
            });
            if (selectedFiles) Array.from(selectedFiles).forEach(file => data.append('attachment_documents', file));

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}defaulter/report`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            if (response.ok) {
                Swal.fire({
                    title: "Success!",
                    text: "Defaulter reported successfully.",
                    icon: "success",
                    confirmButtonColor: "#1b5e20"
                }).then(() => {
                    router.push('/defaulter/list');
                });
            } else {
                const resData = await response.json();
                Swal.fire({
                    title: "Submission Failed",
                    text: resData.msg || "Failed to report defaulter. Please check your data.",
                    icon: "error",
                    confirmButtonColor: "#1b5e20"
                });
            }
        } catch (error) {
            console.error("Submission error:", error);
            Swal.fire({
                title: "Process Error",
                text: "An unexpected error occurred during submission. Please try again.",
                icon: "error",
                confirmButtonColor: "#1b5e20"
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <MemberPortalContainer title="Report New Defaulter">
            <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-10">
                <Link href="/defaulter/list" className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 transition-all mb-4 group bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    <span className="text-xs font-black tracking-widest ">Back</span>
                </Link>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800  tracking-tight">Add Defaulter</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-10">
                        {duplicateWarning && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                                <p className="text-xs font-semibold text-blue-700 tracking-tight">
                                    {duplicateWarning}
                                </p>
                            </div>
                        )}

                        {/* Section 1: Defaulter Information */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-800  tracking-tight">1. Defaulter Firm Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">GST<span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input type="text" name="gst_number" value={formData.gst_number} onChange={handleInputChange} className={`flex-1 border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm font-medium ${errors.gst_number ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Gst Identification No" />
                                        <button
                                            type="button"
                                            onClick={handleGstFetch}
                                            disabled={isGstFetching}
                                            className="px-4 py-2 bg-[#1b5e20] text-white rounded-lg text-[10px] font-bold hover:bg-green-900 transition-all disabled:opacity-50 shadow-sm"
                                        >
                                            {isGstFetching ? '...' : 'FETCH'}
                                        </button>
                                    </div>
                                    {errors.gst_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.gst_number}</p>}
                                </div>
                                <div className="space-y-1.5 col-span-full md:col-span-1">
                                    <label className="text-xs font-semibold text-gray-600">Defaulter Firm Name<span className="text-red-500">*</span></label>
                                    <input type="text" name="defaulter_name" value={formData.defaulter_name} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm font-medium ${errors.defaulter_name ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Enter name" />
                                    {errors.defaulter_name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.defaulter_name}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Mobile<span className="text-red-500">*</span></label>
                                    <input type="text" name="mobile_number" value={formData.mobile_number} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm font-medium ${errors.mobile_number ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="10-digit mobile" maxLength={10} />
                                    {errors.mobile_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.mobile_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Email Address<span className="text-red-500">*</span></label>
                                    <input type="email" name="email_id" value={formData.email_id} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm font-medium ${errors.email_id ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Email ID" />
                                    {errors.email_id && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.email_id}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">CIN</label>
                                    <input type="text" name="cin_number" value={formData.cin_number} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm font-medium ${errors.cin_number ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="21-character CIN No" maxLength={21} />
                                    {errors.cin_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.cin_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Type of Defaulter<span className="text-red-500">*</span></label>
                                    <select name="industry" value={formData.industry} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white ${errors.industry ? 'border-red-500 bg-red-50 font-bold' : 'border-gray-200 font-medium'}`}>
                                        <option value="">Select Type of Defaulter</option>
                                        <option value="Dealer / Distributor">Dealer / Distributor</option>
                                        <option value="Company">Company</option>
                                    </select>
                                    {errors.industry && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.industry}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Financial Year of Default<span className="text-red-500">*</span></label>
                                    <select name="financial_year" value={formData.financial_year} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white ${errors.financial_year ? 'border-red-500' : 'border-gray-200'}`}>
                                        <option value="">Select Financial Year</option>
                                        {Array.from({ length: 15 }).map((_, i) => {
                                            const year = 2025 - i;
                                            const label = `${year}-${(year + 1).toString().slice(-2)}`;
                                            return <option key={label} value={label}>{label}</option>
                                        })}
                                    </select>
                                    {errors.financial_year && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.financial_year}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">State<span className="text-red-500">*</span></label>
                                    <select name="state" value={formData.state} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white ${errors.state ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                                        <option value="">Select State</option>
                                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.state && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.state}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">District<span className="text-red-500">*</span></label>
                                    <select name="district" value={formData.district} onChange={handleInputChange} disabled={!formData.state} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white ${errors.district ? 'border-red-500 bg-red-50' : 'border-gray-200'} disabled:opacity-50`}>
                                        <option value="">Select District</option>
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    {errors.district && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.district}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Sub-District<span className="text-red-500">*</span></label>
                                    <select name="cities" value={formData.cities} onChange={handleInputChange} disabled={!formData.district} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white ${errors.cities ? 'border-red-500 bg-red-50' : 'border-gray-200'} disabled:opacity-50`}>
                                        <option value="">Select Sub-District</option>
                                        {subDistricts.map(sd => <option key={sd} value={sd}>{sd}</option>)}
                                    </select>
                                    {errors.cities && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.cities}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">City / Town /Village<span className="text-red-500">*</span></label>
                                    <select name="city" value={formData.city} onChange={handleInputChange} disabled={!formData.cities} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white ${errors.city ? 'border-red-500 bg-red-50' : 'border-gray-200'} disabled:opacity-50`}>
                                        <option value="">Select City</option>
                                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    {errors.city && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.city}</p>}
                                </div>
                                <div className="col-span-full space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Defaulter Address<span className="text-red-500">*</span></label>
                                    <textarea name="defaulter_address" value={formData.defaulter_address} onChange={handleInputChange} rows={2} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm font-medium ${errors.defaulter_address ? 'border-red-500 bg-red-50' : 'border-gray-100'}`} placeholder="Enter complete office/home address" />
                                    {errors.defaulter_address && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.defaulter_address}</p>}
                                </div>
                            </div>

                            {/* Multiple Persons Segment */}
                            <div className="mt-8 pt-8 border-t border-gray-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-gray-700">Defaulter Personal Information</h4>
                                    <button
                                        type="button"
                                        onClick={addPerson}
                                        className="text-[10px] font-black text-green-700 bg-green-50 px-3 py-1.5 rounded-full hover:bg-green-100 transition-all flex items-center gap-1.5"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        ADD PERSON
                                    </button>
                                </div>

                                {formData.defaulter_persons.map((person, index) => (
                                    <div key={index} className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 relative group animate-in slide-in-from-top-2 duration-300">
                                        {formData.defaulter_persons.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removePerson(index)}
                                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-500 tracking-wider">Person Name</label>
                                                <input
                                                    type="text"
                                                    value={person.name}
                                                    onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-lg py-2 px-3 outline-none focus:border-green-600 text-sm bg-white"
                                                    placeholder="Full Name"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-500 tracking-wider">Person PAN</label>
                                                <input
                                                    type="text"
                                                    value={person.pan}
                                                    onChange={(e) => handlePersonChange(index, 'pan', e.target.value.toUpperCase())}
                                                    className="w-full border border-gray-200 rounded-lg py-2 px-3 outline-none focus:border-green-600 text-sm bg-white"
                                                    placeholder="PAN Number"
                                                    maxLength={10}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-500 tracking-wider">Person Aadhar</label>
                                                <input
                                                    type="text"
                                                    value={person.aadhar}
                                                    onChange={(e) => handlePersonChange(index, 'aadhar', e.target.value.replace(/\D/g, ''))}
                                                    className="w-full border border-gray-200 rounded-lg py-2 px-3 outline-none focus:border-green-600 text-sm bg-white"
                                                    placeholder="12-digit Aadhar"
                                                    maxLength={12}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Default Details */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-green-700  tracking-widest border-b border-green-100 pb-2">2. Default Amount Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Date of Default<span className="text-red-500">*</span></label>
                                    <input type="date" name="date_of_default" value={formData.date_of_default} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-red-600 text-sm ${errors.date_of_default ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} max={new Date().toISOString().split('T')[0]} />
                                    {errors.date_of_default && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.date_of_default}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Default Amount (₹)<span className="text-red-500">*</span></label>
                                    <input type="number" name="default_amount" value={formData.default_amount} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm ${errors.default_amount ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="0.00" />
                                    {errors.default_amount && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.default_amount}</p>}
                                </div>
                                <div className="col-span-full space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Reason/Description<span className="text-red-500">*</span></label>
                                    <textarea name="reason_description" value={formData.reason_description} onChange={handleInputChange} rows={5} className={`w-full border rounded-lg py-3 px-4 outline-none focus:border-green-600 text-sm font-medium leading-relaxed ${errors.reason_description ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Explain the default incident..." />
                                    {errors.reason_description && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.reason_description}</p>}
                                </div>
                            </div>
                        </div>
                        {/* Section 3: Supporting Documents */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-green-700 tracking-widest border-b border-green-100 pb-2">3. Supporting Documents</h3>
                            <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600 font-black">Supporting Evidence (Max 3 files)</label>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => setSelectedFiles(e.target.files)}
                                        className="w-full border border-dashed border-gray-300 rounded-xl py-8 px-4 text-xs font-bold text-gray-400 bg-gray-50 hover:bg-white hover:border-green-300 transition-all text-center cursor-pointer"
                                    />
                                    <p className="text-[10px] text-gray-400 text-center tracking-widest font-black">PDF, JPG, or PNG (Max 5MB each)</p>
                                </div>
                            </div>
                        </div>


                        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-gray-100">
                            <div className="flex items-center gap-3 group cursor-pointer">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        name="legal_status_taken"
                                        id="legal_status_taken"
                                        checked={formData.legal_status_taken}
                                        onChange={handleInputChange}
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-green-600 checked:bg-green-600 transition-all"
                                    />
                                    <svg className="absolute h-3.5 w-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 stroke-current stroke-[4]" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <label htmlFor="legal_status_taken" className="text-sm font-bold text-gray-500 group-hover:text-gray-800 transition-colors cursor-pointer select-none">
                                    Legal action taken
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto min-w-[200px] bg-[#1b5e20] text-white font-black py-3.5 px-10 rounded-xl shadow-xl shadow-green-900/20 hover:bg-green-800 hover:scale-[1.02] active:scale-95 transition-all text-xs  tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MemberPortalContainer>
    );
}
