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
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [errors, setErrors] = useState<any>({});

    const [formData, setFormData] = useState({
        defaulter_name: '', mobile_number: '', email_id: '', gst_number: '', pan_number: '', cin_number: '', aadhar_number: '', state: '', district: '', cities: '', financial_year: '2025-2026', default_amount: '', industry: '', date_of_default: '', reason_description: '', defaulter_address: '', court_complex_name: '', case_type: '', case_number: '', case_year: '', case_status: ''
    });

    useEffect(() => {
        fetchLocations();
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

    const validateGst = (gst: string) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
    const validatePan = (pan: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
    const validateMobile = (mobile: string) => /^[0-9]{10}$/.test(mobile);
    const validateAadhar = (aadhar: string) => /^[0-9]{12}$/.test(aadhar);
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validateCin = (cin: string) => cin.length === 21;

    const validateStep1 = () => {
        const newErrors: any = {};
        if (!formData.defaulter_name) newErrors.defaulter_name = "Required";
        if (!formData.mobile_number || !validateMobile(formData.mobile_number)) newErrors.mobile_number = "Enter 10-digit mobile";
        if (!formData.gst_number || !validateGst(formData.gst_number)) newErrors.gst_number = "Valid GST required";
        if (!formData.pan_number || !validatePan(formData.pan_number)) newErrors.pan_number = "Valid PAN required";
        if (!formData.state) newErrors.state = "Required";
        if (!formData.district) newErrors.district = "Required";
        if (!formData.cities) newErrors.cities = "Required";
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
            ...(name === 'state' ? { district: '', cities: '' } : {}),
            ...(name === 'district' ? { cities: '' } : {})
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

    const districts = locations.find(s => s.state === formData.state)?.districts || [];
    const subDistricts = districts.find((d: any) => d.district === formData.district)?.subDistricts || [];

    return (
        <MemberPortalContainer title="Report New Defaulter">
            <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-10">
                <Link href="/defaulter/list" className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 transition-all mb-4 group bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    <span className="text-xs font-black uppercase tracking-widest">Back to List</span>
                </Link>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
                    <div className="bg-gray-50 px-8 py-6 flex items-center justify-between border-b border-gray-200">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">
                                {step === 1 ? 'Step 1: Defaulter Information' : step === 2 ? 'Step 2: Financial Details' : 'Step 3: Legal & Supporting Documents'}
                            </h2>
                            <p className="text-xs text-gray-500 font-medium mt-1">Progress: {step} of 3</p>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3].map(s => (
                                <div key={s} className={`w-8 h-1.5 rounded-full ${step >= s ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                            ))}
                        </div>
                    </div>

                    <form className="p-8 flex-1 flex flex-col justify-between">
                        {step === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5 col-span-full md:col-span-1">
                                    <label className="text-xs font-semibold text-gray-600">Company / Business Name*</label>
                                    <input type="text" name="defaulter_name" value={formData.defaulter_name} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm ${errors.defaulter_name ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Enter name" />
                                    {errors.defaulter_name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.defaulter_name}</p>}
                                </div>
                                <div className="space-y-1.5 col-span-full md:col-span-1">
                                    <label className="text-xs font-semibold text-gray-600">Contact Number*</label>
                                    <input type="text" name="mobile_number" value={formData.mobile_number} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm ${errors.mobile_number ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="10-digit mobile" />
                                    {errors.mobile_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.mobile_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">GST Number*</label>
                                    <input type="text" name="gst_number" value={formData.gst_number} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm ${errors.gst_number ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Gst Identification No" />
                                    {errors.gst_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.gst_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Email Address*</label>
                                    <input type="email" name="email_id" value={formData.email_id} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm ${errors.email_id ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Email ID" />
                                    {errors.email_id && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.email_id}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">PAN Number*</label>
                                    <input type="text" name="pan_number" value={formData.pan_number} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm ${errors.pan_number ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Permanent Account No" />
                                    {errors.pan_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.pan_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">CIN Number*</label>
                                    <input type="text" name="cin_number" value={formData.cin_number} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm ${errors.cin_number ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="21-character CIN No" maxLength={21} />
                                    {errors.cin_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.cin_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">State*</label>
                                    <select name="state" value={formData.state} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white ${errors.state ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                                        <option value="">Select State</option>
                                        {locations.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                                    </select>
                                    {errors.state && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.state}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">District*</label>
                                    <select name="district" value={formData.district} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white ${errors.district ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                                        <option value="">Select District</option>
                                        {districts.map((d: any) => <option key={d.district} value={d.district}>{d.district}</option>)}
                                    </select>
                                    {errors.district && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.district}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">City / Sub-District*</label>
                                    <select name="cities" value={formData.cities} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white ${errors.cities ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                                        <option value="">Select Location</option>
                                        {subDistricts.map((sd: any) => <option key={sd} value={sd}>{sd}</option>)}
                                    </select>
                                    {errors.cities && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.cities}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Aadhar Number*</label>
                                    <input type="text" name="aadhar_number" value={formData.aadhar_number} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm ${errors.aadhar_number ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="12-digit Aadhar No" maxLength={12} />
                                    {errors.aadhar_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.aadhar_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Industry Sector</label>
                                    <select name="industry" value={formData.industry} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white border-gray-200`}>
                                        <option value="">Select Industry</option>
                                        <option value="Agriculture">Agriculture</option>
                                        <option value="Agrochemicals & Fertilizers">Agrochemicals & Fertilizers</option>
                                        <option value="Seed Suppliers">Seed Suppliers</option>
                                        <option value="Farming Equipment">Farming Equipment</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Financial Year</label>
                                    <select name="financial_year" value={formData.financial_year} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white font-bold border-gray-200`}>
                                        <option value="">Select Financial Year</option>
                                        {Array.from({ length: 15 }).map((_, i) => {
                                            const year = 2025 - i;
                                            const label = `${year}-${(year + 1).toString().slice(-2)}`;
                                            return <option key={label} value={label}>{label}</option>
                                        })}
                                    </select>
                                </div>
                                <div className="col-span-full space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Full Address*</label>
                                    <textarea name="defaulter_address" value={formData.defaulter_address} onChange={handleInputChange} rows={2} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm ${errors.defaulter_address ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Enter complete office/home address" />
                                    {errors.defaulter_address && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.defaulter_address}</p>}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Date of Default*</label>
                                    <input type="date" name="date_of_default" value={formData.date_of_default} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-red-600 text-sm ${errors.date_of_default ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} />
                                    {errors.date_of_default && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.date_of_default}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Initial Default Amount (₹)*</label>
                                    <input type="number" name="default_amount" value={formData.default_amount} onChange={handleInputChange} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm font-semibold ${errors.default_amount ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="0.00" />
                                    {errors.default_amount && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.default_amount}</p>}
                                </div>
                                <div className="col-span-full space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Describe the Case / Reason*</label>
                                    <textarea name="reason_description" value={formData.reason_description} onChange={handleInputChange} rows={6} className={`w-full border rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm leading-relaxed ${errors.reason_description ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Briefly explain the nature of default..." />
                                    {errors.reason_description && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.reason_description}</p>}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Court Name (If filed)</label>
                                    <input type="text" name="court_complex_name" value={formData.court_complex_name} onChange={handleInputChange} className="w-full border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm" placeholder="e.g. District Court" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Case / Suite Number</label>
                                    <input type="text" name="case_number" value={formData.case_number} onChange={handleInputChange} className="w-full border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm" placeholder="Case ID" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Supporting Documents (Max 3)</label>
                                    <input type="file" multiple onChange={(e) => setSelectedFiles(e.target.files)} className="w-full border border-dashed border-gray-300 rounded-lg py-6 px-4 text-xs font-bold text-gray-400 bg-gray-50 hover:bg-white transition-all text-center" />
                                    <p className="text-[10px] text-gray-400 text-center">PDF, JPG, or PNG (Max 5MB each)</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600">Current Legal Status</label>
                                    <select name="case_status" value={formData.case_status} onChange={handleInputChange} className="w-full border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 text-sm bg-white">
                                        <option value="">Select Status</option>
                                        <option value="Notice Issued">Notice Issued</option>
                                        <option value="Under Review">Under Review</option>
                                        <option value="Warrant Issued">Warrant Issued</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
                            {step > 1 && (
                                <button type="button" onClick={() => setStep(s => s - 1)} className="w-full sm:w-auto px-8 py-2.5 border border-gray-200 text-gray-500 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                    Back
                                </button>
                            )}
                            {step < 3 ? (
                                <button type="button" onClick={handleNextStep} className="w-full sm:w-auto flex-1 bg-green-600 text-white font-bold py-2.5 rounded-lg shadow-sm hover:bg-green-700 transition-colors text-sm">
                                    Continue
                                </button>
                            ) : (
                                <button type="button" onClick={() => handleSubmit()} disabled={saving} className="w-full flex-1 bg-green-600 text-white font-bold py-2.5 rounded-lg shadow-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-2">
                                    {saving ? "Submitting..." : "Report Defaulter"}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </MemberPortalContainer>
    );
}
