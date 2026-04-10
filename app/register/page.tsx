"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

const FormInput = ({ label, name, type = "text", placeholder, required = false, className = "", onChange, value, error, readOnly = false }: any) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className={`mb-4 ${className}`}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    type={inputType}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    className={`w-full px-4 py-2.5 text-sm border ${error ? 'border-red-400' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-agri-green-primary/20 focus:border-agri-green-primary transition-all text-gray-700 placeholder:text-gray-300 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} shadow-sm`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-agri-green-primary transition-colors"
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        )}
                    </button>
                )}
            </div>
            {error && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{error}</p>}
        </div>
    );
};

const FormSelect = ({ label, name, options, required = false, className = "", value, onChange, placeholder, error }: any) => (
    <div className={`mb-4 ${className}`}>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            name={name}
            value={value || ''}
            onChange={onChange}
            className={`w-full px-4 py-2.5 text-sm border ${error ? 'border-red-400' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-agri-green-primary/20 focus:border-agri-green-primary transition-all text-gray-700 bg-white shadow-sm appearance-none`}
        >
            <option value="" disabled>{placeholder || `Select ${label}`}</option>
            {options && options.map((opt: any, index: number) => {
                const val = typeof opt === 'string' ? opt : (opt.state || opt.district || opt.subDistrict || opt.city || opt.name || index);
                return <option key={`${val}-${index}`} value={val}>{val}</option>;
            })}
        </select>
        {error && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{error}</p>}
    </div>
);

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [states, setStates] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [subDistricts, setSubDistricts] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedSubDistrict, setSelectedSubDistrict] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedIndustry, setSelectedIndustry] = useState("");
    const [isGstVerified, setIsGstVerified] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        companyName: '',
        gst: '',
        pan: '',
        email: '',
        businessAddress: '',
        companyEmail: '',
        alternateContactNumber: '',
        pinCode: '',
        businessType: '',
        yearsInBusiness: '',
        cinNumber: '',
        companyPhoneNumber: '',
        otp: ''
    });
    const [isGstFetching, setIsGstFetching] = useState(false);
    const [pendingLocation, setPendingLocation] = useState<any>(null);
    const [publishedTerms, setPublishedTerms] = useState<any>(null);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

    useEffect(() => {
        const fetchPublishedTerms = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}terms/published`);
                const data = await res.json();
                if (res.ok) setPublishedTerms(data.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPublishedTerms();
    }, []);

    useEffect(() => {
        const savedDataStr = sessionStorage.getItem('pendingRegistration');
        if (savedDataStr) {
            try {
                const savedData = JSON.parse(savedDataStr);
                if (savedData && savedData.fields) {
                    const fields = savedData.fields;
                    setFormData(prev => ({
                        ...prev,
                        name: fields.name || '',
                        phone: fields.phone || '',
                        companyName: fields.companyName || '',
                        gst: fields.gst || '',
                        pan: fields.pan || '',
                        email: fields.email || '',
                        businessAddress: fields.businessAddress || '',
                        companyEmail: fields.companyEmail || '',
                        alternateContactNumber: fields.alternateContactNumber || '',
                        pinCode: fields.pinCode || '',
                        businessType: fields.businessType || '',
                        yearsInBusiness: fields.yearsInBusiness || '',
                        cinNumber: fields.cinNumber || '',
                        companyPhoneNumber: fields.companyPhoneNumber || ''
                    }));
                    if (fields.industry) setSelectedIndustry(fields.industry);
                    if (fields.state) setSelectedState(fields.state);
                    if (fields.district) {
                        setPendingLocation({
                            district: fields.district,
                            subDistrict: fields.subDistrict,
                            city: fields.city
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to parse saved registration data", e);
            }
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGstFetch = async () => {
        if (!formData.gst) {
            setMessage({ type: 'error', text: 'Please enter a GST number first' });
            return;
        }

        setIsGstFetching(true);
        try {
            const response = await fetch(`${API_BASE_URL}verify-gst/${formData.gst}`);
            const result = await response.json();

            if (response.ok) {
                const { data } = result;
                const extractedPan = formData.gst.length >= 12 ? formData.gst.substring(2, 12).toUpperCase() : '';

                setFormData(prev => ({
                    ...prev,
                    companyName: data.lgnm || data.tradeNames?.[0] || data.tradenames?.[0] || data.tradeName || prev.companyName,
                    businessAddress: data.pradr?.adr || prev.businessAddress,
                    pan: extractedPan || prev.pan,
                }));
                setIsGstVerified(true);

                if (data.pradr?.addr?.stcd) {
                    const gstState = data.pradr.addr.stcd;
                    const matchedState = states.find(s => s.toLowerCase() === gstState.toLowerCase()) || gstState;
                    setSelectedState(matchedState);

                    if (data.pradr.addr.dst) {
                        setPendingLocation({
                            district: data.pradr.addr.dst,
                            subDistrict: data.pradr.addr.st,
                            city: data.pradr.addr.loc
                        });
                    }
                }
                setMessage({ type: 'success', text: 'GST details fetched successfully!' });
            } else {
                setMessage({ type: 'error', text: result.msg || 'Invalid GST number' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'GST verification service unavailable' });
        } finally {
            setIsGstFetching(false);
        }
    };

    useEffect(() => {
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
        fetchStates();
    }, []);

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
        if (selectedState) {
            fetchDistricts(selectedState);
            setSelectedDistrict("");
            setSelectedSubDistrict("");
            setSelectedCity("");
            setDistricts([]);
            setSubDistricts([]);
            setCities([]);
        }
    }, [selectedState]);

    useEffect(() => {
        if (selectedState && selectedDistrict) {
            fetchSubDistricts(selectedState, selectedDistrict);
            setSelectedSubDistrict("");
            setSelectedCity("");
            setSubDistricts([]);
            setCities([]);
        }
    }, [selectedDistrict]);

    useEffect(() => {
        if (selectedState && selectedDistrict && selectedSubDistrict) {
            fetchCities(selectedState, selectedDistrict, selectedSubDistrict);
            setSelectedCity("");
            setCities([]);
        }
    }, [selectedSubDistrict]);

    // Location auto-selection effect
    useEffect(() => {
        if (pendingLocation?.district && districts.length > 0) {
            const matched = districts.find(d => d.toLowerCase() === pendingLocation.district.toLowerCase());
            if (matched) {
                setSelectedDistrict(matched);
                setPendingLocation((prev: any) => ({ ...prev, district: null }));
            }
        }
    }, [districts, pendingLocation]);

    useEffect(() => {
        if (pendingLocation?.subDistrict && subDistricts.length > 0) {
            const matched = subDistricts.find(s => s.toLowerCase() === pendingLocation.subDistrict.toLowerCase());
            if (matched) {
                setSelectedSubDistrict(matched);
                setPendingLocation((prev: any) => ({ ...prev, subDistrict: null }));
            }
        }
    }, [subDistricts, pendingLocation]);

    useEffect(() => {
        if (pendingLocation?.city && cities.length > 0) {
            const matched = cities.find(c => c.toLowerCase() === pendingLocation.city.toLowerCase());
            if (matched) {
                setSelectedCity(matched);
                setPendingLocation(null);
            }
        }
    }, [cities, pendingLocation]);

    const validateForm = (formData: FormData) => {
        const newErrors: any = {};
        if (!selectedIndustry) newErrors.industry = "Industry is required";
        if (!formData.get('name')) newErrors.name = "Full Name is required";
        if (!formData.get('email')) newErrors.email = "Email is required";
        if (!formData.get('companyName')) newErrors.companyName = "Company Name is required";

        const gst = formData.get('gst') as string;
        if (selectedIndustry !== 'Seed Company') {
            if (!gst) {
                newErrors.gst = "GST is required";
            } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) {
                newErrors.gst = "Invalid GST Number format";
            }
        } else if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) {
            newErrors.gst = "Invalid GST Number format";
        }

        const pan = formData.get('pan') as string;
        if (!pan) {
            newErrors.pan = "PAN is required";
        } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
            newErrors.pan = "Invalid PAN Number format";
        }

        const cin = formData.get('cinNumber') as string;
        if (cin && !/^[UL]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(cin)) {
            newErrors.cinNumber = "Invalid CIN Number format";
        }

        if (!selectedState) newErrors.state = "State is required";
        if (!selectedDistrict) newErrors.district = "District is required";
        if (!selectedSubDistrict) newErrors.subDistrict = "Sub District is required";
        if (!selectedCity) newErrors.city = "City is required";
        if (!formData.get('businessAddress')) newErrors.businessAddress = "Business Address is required";

        const phone = formData.get('phone') as string;
        if (!phone) {
            newErrors.phone = "Phone Number is required";
        } else if (!/^\d{10}$/.test(phone)) {
            newErrors.phone = "Enter a valid 10-digit mobile number";
        }

        if (!termsAgreed) newErrors.terms = "You must agree to the Terms";

        return newErrors;
    };

    const [isRegistered, setIsRegistered] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formElement = e.currentTarget;
        const formData = new FormData(formElement);
        const validationErrors = validateForm(formData);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setMessage({ type: 'error', text: 'Please fill all required fields correctly.' });
            return;
        }

        setLoading(true);
        setMessage(null);
        setErrors({});

        try {
            const checkRes = await fetch(`${API_BASE_URL}send-register-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.get('email'),
                    phone: formData.get('phone')
                })
            });
            const checkData = await checkRes.json();
            if (checkRes.ok) {
                setMessage({ type: 'success', text: 'OTP sent successfully. Redirecting...' });

                // Prepare form data for session storage
                const dataToSave: any = {
                    fields: {
                        name: formData.get('name'),
                        phone: formData.get('phone'),
                        companyName: formData.get('companyName'),
                        gst: formData.get('gst'),
                        pan: formData.get('pan'),
                        email: formData.get('email'),
                        businessAddress: formData.get('businessAddress'),
                        companyEmail: formData.get('companyEmail'),
                        alternateContactNumber: formData.get('alternateContactNumber'),
                        pinCode: formData.get('pinCode'),
                        businessType: formData.get('businessType'),
                        yearsInBusiness: formData.get('yearsInBusiness'),
                        cinNumber: formData.get('cinNumber'),
                        companyPhoneNumber: formData.get('companyPhoneNumber'),
                        industry: selectedIndustry,
                        state: selectedState,
                        district: selectedDistrict,
                        subDistrict: selectedSubDistrict,
                        city: selectedCity,
                    },
                    files: []
                };

                // Handle files using FileReader
                const files = formData.getAll('businessDocuments') as File[];
                const validFiles = files.filter(f => f.name && f.size > 0);

                if (validFiles.length > 0) {
                    const filePromises = validFiles.map(file => {
                        return new Promise<{ name: string, type: string, data: string }>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => resolve({
                                name: file.name,
                                type: file.type,
                                data: e.target?.result as string
                            });
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        });
                    });

                    dataToSave.files = await Promise.all(filePromises);
                }

                sessionStorage.setItem('pendingRegistration', JSON.stringify(dataToSave));

                setTimeout(() => {
                    router.push('/verify-otp');
                }, 1000);
            } else {
                if (checkData.msg === "Phone number already exists") {
                    setErrors((prev: any) => ({ ...prev, phone: "This mobile number is already registered" }));
                } else if (checkData.msg === "Email already exists") {
                    setErrors((prev: any) => ({ ...prev, email: "This email is already registered" }));
                }
                setMessage({ type: 'error', text: checkData.msg || 'Failed to send OTP.' });
                setLoading(false);
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'A network error occurred.' });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col font-sans overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url("/images/login_bg_final.jpg")' }}
            />
            {/* Light Overlay to ensure contrast */}
            <div className="absolute inset-0 bg-white opacity-50" />

            {/* Carbon Fiber Texture Overlay */}
            <div
                className="absolute inset-0 bg-repeat opacity-20 pointer-events-none"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}
            />

            <div className="container mx-auto px-4 flex-1 flex flex-col pt-12 pb-10 relative z-10">
                <div className="flex-1 flex flex-col items-center justify-center -mt-10">

                    <div className="w-full max-w-2xl relative z-10">
                        {/* Error & Success Toasts */}
                        {message && (
                            <div className={`mb-4 p-3 border text-sm font-medium rounded-lg text-center shadow-sm animate-in fade-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-50 text-agri-green-primary border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        {/* Top Header Section */}
                        <div className="mb-6 text-center">
                            <Link href="/" className="inline-block mb-4">
                                <img src="/images/caip_logo.png" alt="CAIP Logo" className="mx-auto h-[70px] drop-shadow-sm" />
                            </Link>

                            <div className="bg-agri-green-primary text-center px-4 py-3.5 rounded-2xl shadow-sm">
                                <h4 className="text-white m-0 font-bold text-lg tracking-wide">Chamber for Agri Input Protection</h4>
                            </div>
                        </div>

                        {/* Form Card */}
                        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden mb-8">
                            {/* Card Header */}
                            <div className="bg-agri-green-primary p-5 text-center">
                                <h5 className="text-white text-xl font-semibold mb-1">Membership Registration</h5>
                                <p className="text-white/80 text-sm m-0">
                                    Create your account to join the Chamber for Agri Input Protection.
                                </p>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 md:p-8">
                                {isRegistered ? (
                                    <div className="py-12 text-center">
                                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200 shadow-inner">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1f6306" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
                                        <p className="text-sm font-medium text-gray-600">
                                            Redirecting you to the secure login portal...
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                            <FormInput label="Full Name" name="name" placeholder="John Doe" required error={errors.name} value={formData.name} onChange={handleInputChange} />
                                            <FormSelect
                                                label="Industry"
                                                name="industry"
                                                value={selectedIndustry}
                                                onChange={(e: any) => setSelectedIndustry(e.target.value)}
                                                options={["Pesticide Company", "Fertiliser Company", "Seed Company"]}
                                                placeholder="Select Industry"
                                                required
                                                error={errors.industry}
                                            />

                                            <div className="mb-4">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                                                    GST {selectedIndustry !== 'Seed Company' && <span className="text-red-500">*</span>}
                                                </label>
                                                <div className={`flex bg-white rounded-lg relative shadow-sm overflow-hidden border ${errors.gst ? 'border-red-400' : 'border-gray-200'} focus-within:ring-2 focus-within:ring-agri-green-primary/20 focus-within:border-agri-green-primary transition-all`}>
                                                    <input
                                                        type="text"
                                                        name="gst"
                                                        value={formData.gst}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter GST Number"
                                                        className={`w-full px-4 py-2.5 text-xs focus:outline-none text-gray-700 placeholder:text-gray-300`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleGstFetch}
                                                        disabled={isGstFetching}
                                                        className={`px-4 bg-agri-green-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-agri-green-800 transition-colors disabled:opacity-70 flex items-center justify-center whitespace-nowrap`}
                                                    >
                                                        {isGstFetching ? '...' : 'FETCH'}
                                                    </button>
                                                </div>
                                                {errors.gst && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.gst}</p>}
                                            </div>

                                            <FormInput label="Company Name" name="companyName" placeholder="Business Name" required error={errors.companyName} value={formData.companyName} onChange={handleInputChange} readOnly={isGstVerified} />
                                            <FormInput label="PAN" name="pan" placeholder="PAN Number" required error={errors.pan} value={formData.pan} onChange={handleInputChange} readOnly={isGstVerified} />

                                            <FormInput label="CIN" name="cinNumber" placeholder="CIN Number" value={(formData as any).cinNumber} onChange={handleInputChange} error={errors.cinNumber} />
                                            <FormInput label="Phone Number" name="phone" placeholder="Enter 10-digit number" required error={errors.phone} value={formData.phone} onChange={handleInputChange} />
                                            <FormInput label="Alternate Contact Number" name="alternateContactNumber" placeholder="Optional" value={formData.alternateContactNumber} onChange={handleInputChange} />

                                            <FormInput label="Email" name="email" type="email" placeholder="john@example.com" required error={errors.email} value={formData.email} onChange={handleInputChange} />

                                            <FormInput label="Company Email" name="companyEmail" type="email" placeholder="Optional" value={formData.companyEmail} onChange={handleInputChange} />
                                            <FormInput label="Pincode" name="pinCode" placeholder="Enter Pincode" value={formData.pinCode} onChange={handleInputChange} />

                                            <FormSelect label="State" name="state" value={selectedState} onChange={(e: any) => setSelectedState(e.target.value)} options={states} placeholder="Select State" required error={errors.state} />
                                            <FormSelect label="District" name="district" value={selectedDistrict} onChange={(e: any) => { setSelectedDistrict(e.target.value); setSelectedSubDistrict(""); }} options={districts} placeholder="Select District" required error={errors.district} />
                                            <FormSelect label="Sub District" name="subDistrict" value={selectedSubDistrict} onChange={(e: any) => { setSelectedSubDistrict(e.target.value); setSelectedCity(""); }} options={subDistricts} placeholder="Select Sub District" required error={errors.subDistrict} />
                                            <div className="md:col-span-2">

                                                <FormSelect label="City/Town/Village" name="city" value={selectedCity} onChange={(e: any) => setSelectedCity(e.target.value)} options={cities.length > 0 ? cities : []} placeholder="Select City" required error={errors.city} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <FormInput
                                                    label="Business Address"
                                                    name="businessAddress"
                                                    placeholder="Full address (autofilled via GST optionally)"
                                                    value={formData.businessAddress}
                                                    onChange={handleInputChange}
                                                    readOnly={isGstVerified}
                                                    required
                                                    error={errors.businessAddress}
                                                />
                                            </div>

                                            <div className="mb-4 md:col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                                                    Business Documents (Upload multiple if needed)
                                                </label>
                                                <input
                                                    type="file"
                                                    name="businessDocuments"
                                                    multiple
                                                    accept=".pdf,image/*"
                                                    className="w-full border border-gray-200 py-3 px-4 rounded-lg text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-agri-green-50 file:text-agri-green-700 hover:file:bg-agri-green-100 transition-all shadow-sm bg-white"
                                                />
                                                <p className="text-[10px] text-gray-400 mt-1.5 ml-1 font-medium">Supports multiple PDF and Image files</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 mb-6">
                                            <div className="flex items-start group">
                                                <input
                                                    type="checkbox"
                                                    id="terms"
                                                    checked={termsAgreed}
                                                    onChange={(e) => setTermsAgreed(e.target.checked)}
                                                    className={`mt-1 flex-shrink-0 w-4 h-4 text-agri-green-primary bg-gray-100 border-gray-300 rounded focus:ring-agri-green-primary focus:ring-2 cursor-pointer ${errors.terms ? 'border-red-400' : ''}`}
                                                />
                                                <div className="ml-3">
                                                    <div className="inline-flex items-center flex-wrap">
                                                        <label htmlFor="terms" className="text-sm font-semibold text-gray-800 cursor-pointer group-hover:text-agri-green-800 transition-colors uppercase tracking-tight">
                                                            I agree to the&nbsp;
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { 
                                                                e.preventDefault(); 
                                                                if (publishedTerms?.file) {
                                                                    window.open(`${ASSETS_BASE_URL}uploads/${publishedTerms.file}`, '_blank');
                                                                } else {
                                                                    setIsTermsModalOpen(true); 
                                                                }
                                                            }}
                                                            className="text-agri-green-700 underline text-sm font-semibold uppercase tracking-tight hover:text-agri-green-900 transition-colors"
                                                        >
                                                            Terms and Conditions
                                                        </button>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 mt-1 font-medium leading-relaxed">
                                                        CAIP is a platform dedicated to protecting the interests of the agri-input industry. All data is provided by members and subject to our privacy guidelines.
                                                    </p>
                                                    {errors.terms && <p className="text-xs text-red-500 font-bold mt-1">{errors.terms}</p>}
                                                </div>
                                            </div>
                                        </div>



                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`w-full bg-agri-green-primary hover:bg-agri-green-700 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-agri-green-950/20 transition-all transform active:scale-[0.98] uppercase text-xs flex items-center justify-center gap-2 cursor-pointer ${loading ? 'opacity-70' : ''}`}
                                        >
                                            {loading ? (
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            ) : 'Proceed to Verify'}
                                        </button>

                                        <div className="mt-8 text-center">
                                            <p className="text-sm font-bold text-gray-500 mb-0">
                                                Already a member?{' '}
                                                <Link href="/login" className="font-medium text-blue-600 hover:underline">
                                                    Log In Now
                                                </Link>
                                            </p>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer block - Pill Shaped */}
                <div className="w-full pt-4 mt-auto z-10">
                    <div className="bg-agri-gold-secondary rounded-xl py-4 px-6 flex flex-col md:flex-row justify-between items-center text-center shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
                        <div className="mb-2 md:mb-0">
                            <p className="m-0 font-bold text-gray-900 text-[13px]">
                                © {new Date().getFullYear()} Chamber for Agri Input Protection
                            </p>
                        </div>
                        <div>
                            <p className="m-0 font-bold text-gray-900 text-[13px]">
                                Crafted with <span className="text-red-600">❤️</span> by <a href="https://www.metizsoft.com/" target="_blank" rel="noreferrer" className="underline hover:text-black transition-colors">Metizsoft Solution Private Limited</a>
                            </p>
                        </div>
                    </div>
                </div>
                {/* Terms Modal */}
                {isTermsModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsTermsModalOpen(false)}></div>
                        <div className="bg-white rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[85vh]">
                            <div className="bg-agri-green-primary p-6 text-white text-center flex-shrink-0">
                                <h3 className="text-xl font-bold">{publishedTerms?.title || 'Terms & Conditions'}</h3>
                            </div>
                            <div className="p-8 overflow-y-auto font-medium text-gray-700 text-sm leading-relaxed whitespace-pre-wrap flex-grow custom-scrollbar flex flex-col items-center justify-center">
                                {publishedTerms?.file ? (
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-200">
                                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                        </div>
                                        <p className="text-gray-500 font-bold">Document Version Published</p>
                                        <a
                                            href={`${ASSETS_BASE_URL}uploads/${publishedTerms.file}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase text-xs"
                                        >
                                            VIEW DOCUMENT
                                        </a>
                                    </div>
                                ) : (
                                    publishedTerms?.content || "No terms and conditions have been published yet. Please contact support or try again later."
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-gray-50 flex justify-center">
                                <button
                                    onClick={() => setIsTermsModalOpen(false)}
                                    className="bg-agri-green-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-agri-green-700 transition-all shadow-md"
                                >
                                    CLOSE
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

