"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { API_BASE_URL } from '@/config/apiConfig';

const FormInput = ({ label, name, type = "text", placeholder, required = false, className = "", onChange, value, error }: any) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="text-[10px] font-bold text-gray-700 uppercase ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    type={inputType}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className={`w-full border ${error ? 'border-red-400' : 'border-blue-100'} focus:border-blue-400 focus:ring-1 focus:ring-blue-100 py-2.5 px-4 rounded-lg outline-none transition-all text-xs text-gray-600 placeholder:text-gray-300 shadow-sm`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-800 transition-colors"
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        )}
                    </button>
                )}
            </div>
            {error && <p className="text-[9px] text-red-500 font-bold ml-1">{error}</p>}
        </div>
    );
};

const FormSelect = ({ label, name, options, required = false, className = "", value, onChange, placeholder, error }: any) => (
    <div className={`space-y-1.5 ${className}`}>
        <label className="text-[10px] font-bold text-gray-700 uppercase ml-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            name={name}
            required={required}
            value={value}
            onChange={onChange}
            className={`w-full border ${error ? 'border-red-400' : 'border-blue-100'} focus:border-blue-400 focus:ring-1 focus:ring-blue-100 py-2.5 px-4 rounded-lg outline-none transition-all text-xs text-gray-600 shadow-sm bg-white appearance-none`}
        >
            <option value="" disabled>{placeholder || `Select ${label}`}</option>
            {options.map((opt: any) => {
                const val = typeof opt === 'string' ? opt : (opt.state || opt.district || opt);
                return <option key={val} value={val}>{val}</option>;
            })}
        </select>
        {error && <p className="text-[9px] text-red-500 font-bold ml-1">{error}</p>}
    </div>
);

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedState, setSelectedState] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedSubDistrict, setSelectedSubDistrict] = useState("");
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}locations`);
                const data = await response.json();
                if (response.ok) {
                    setLocations(data.states || []);
                }
            } catch (err) {
                console.error("Locations fetch error:", err);
            }
        };
        fetchLocations();
    }, []);

    const districts = locations.find(s => s.state === selectedState)?.districts || [];
    const subDistricts = districts.find((d: any) => d.district === selectedDistrict)?.subDistricts || [];

    const validateForm = (formData: FormData) => {
        const newErrors: any = {};
        if (!formData.get('name')) newErrors.name = "Full Name is required";
        if (!formData.get('email')) newErrors.email = "Email is required";
        if (!formData.get('companyName')) newErrors.companyName = "Company Name is required";
        if (!formData.get('gst')) newErrors.gst = "GST Number is required";
        if (!formData.get('pan')) newErrors.pan = "PAN Number is required";
        if (!selectedState) newErrors.state = "State is required";
        if (!selectedDistrict) newErrors.district = "District is required";
        if (!selectedSubDistrict) newErrors.subDistrict = "Sub District is required";
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

        const formData = new FormData(e.currentTarget);
        const validationErrors = validateForm(formData);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setMessage({ type: 'error', text: 'Please fill all required fields correctly.' });
            return;
        }

        setLoading(true);
        setMessage(null);
        setErrors({});

        formData.set('state', selectedState);
        formData.set('district', selectedDistrict);
        formData.set('subDistrict', selectedSubDistrict);

        try {
            const response = await fetch(`${API_BASE_URL}register`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setIsRegistered(true);
                setMessage({ type: 'success', text: 'Registration successful! Proceeding...' });
                setTimeout(() => {
                    router.replace('/login?message=registered');
                }, 1500);
            } else {
                if (data.msg === "Phone number already exists") {
                    setErrors({ ...errors, phone: "This mobile number is already registered" });
                } else if (data.msg === "Email already exists") {
                    setErrors({ ...errors, email: "This email is already registered" });
                }
                setMessage({ type: 'error', text: data.msg || 'Registration failed.' });
                setLoading(false);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'A network error occurred.' });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center font-sans overflow-hidden py-20">
            {/* Background with blurred agriculture and network pattern */}
            <div
                className="fixed inset-0 bg-cover bg-center scale-110 blur-[2px]"
                style={{
                    backgroundImage: 'url("/images/login_bg_final.jpg")',
                    opacity: 0.9
                }}
            />
            {/* Network Pattern Overlay */}
            <div className="fixed inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="fixed inset-0 bg-white/10 pointer-events-none" />

            {/* Main Content Container */}
            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center px-4">

                {/* Logo */}
                <div className="w-16 h-16 mb-4 drop-shadow-lg scale-100 hover:scale-105 transition-transform duration-500">
                    <img src="/images/caip_logo.png" alt="CAIP Logo" className="w-full h-full object-contain" />
                </div>

                {/* Login Card */}
                <div className="w-full bg-white rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden relative">

                    {message && (
                        <div className={`absolute top-0 left-0 right-0 z-50 p-3 text-white text-[11px] font-bold text-center animate-in fade-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Card Header */}
                    <div className="bg-[#1b5e20] p-6 text-center">
                        <h2 className="text-xl font-bold text-white mb-1">Chamber for Agri Input Protection</h2>
                        <p className="text-white/80 text-[10px] font-medium tracking-tight">
                            Create your account to access defaulter information and exclusive member resources from the Chamber for Agri Input Protection.
                        </p>
                    </div>

                    {/* Card Body */}
                    {isRegistered ? (
                        <div className="p-16 text-center space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-100 shadow-inner">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1b5e20" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Success!</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Registration Protocol Complete</p>
                            </div>
                            <p className="text-sm font-medium text-gray-600">
                                Moving you to secure login console...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <FormInput label="Name" name="name" placeholder="Full Name" required error={errors.name} />
                                <FormInput label="Phone" name="phone" placeholder="Enter Phone" required error={errors.phone} />

                                <FormInput label="Company Name" name="companyName" placeholder="Company Name" required error={errors.companyName} />
                                <FormInput label="GST Number" name="gst" placeholder="GST Registration No" required error={errors.gst} />
                                <FormInput label="Pan" name="pan" placeholder="Permanent Account No" required error={errors.pan} />
                                <FormSelect
                                    label="State"
                                    name="state"
                                    value={selectedState}
                                    onChange={(e: any) => { setSelectedState(e.target.value); setSelectedDistrict(""); setSelectedSubDistrict(""); }}
                                    options={locations}
                                    placeholder="Select State"
                                    required
                                    error={errors.state}
                                />
                                <FormSelect
                                    label="District"
                                    name="district"
                                    value={selectedDistrict}
                                    onChange={(e: any) => { setSelectedDistrict(e.target.value); setSelectedSubDistrict(""); }}
                                    options={districts}
                                    placeholder="Select District"
                                    required
                                    error={errors.district}
                                />
                                <FormSelect
                                    label="Sub District"
                                    name="subDistrict"
                                    value={selectedSubDistrict}
                                    onChange={(e: any) => setSelectedSubDistrict(e.target.value)}
                                    options={subDistricts}
                                    placeholder="Select Sub District"
                                    required
                                    error={errors.subDistrict}
                                />
                                <FormInput label="Email" name="email" type="email" placeholder="Email" required error={errors.email} />

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-700 uppercase ml-1">
                                        Business Document
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            name="businessDocument"
                                            className="w-full border border-blue-100 py-2 px-4 rounded-lg text-[10px] text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-start gap-2 group cursor-pointer" onClick={() => setTermsAgreed(!termsAgreed)}>
                                    <input type="checkbox" checked={termsAgreed} onChange={() => { }} className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 accent-[#1b5e20]" />
                                    <div className="space-y-0.5">
                                        <p className={`text-[10px] font-bold uppercase tracking-tight ${errors.terms ? 'text-red-500' : 'text-gray-800'}`}>
                                            I agree to the <span className="text-green-700 underline">Terms and Conditions</span> of CAIP
                                        </p>
                                        <p className="text-[9px] text-gray-400 font-medium leading-relaxed">
                                            CAIP is a platform dedicated to protecting the interests of the agri-input industry. All data is provided by members, is not owned or controlled by CAIP, and is subject to our privacy guidelines.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full bg-[#3d6e50] hover:bg-[#2d523c] text-white font-bold py-3 rounded-xl shadow-lg transition-all transform active:scale-[0.98] uppercase text-[11px] flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Creating Account...
                                        </>
                                    ) : 'Create My Account'}
                                </button>

                                <p className="mt-6 text-[11px] font-bold text-gray-500">
                                    Already a member? <Link href="/login" className="text-green-700 hover:underline">Log In Now</Link>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Footer Bar */}
            <footer className="fixed bottom-0 left-0 right-0 bg-[#ffd600] py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
                <p className="text-xs font-bold text-gray-800 tracking-tight">
                    © 2026 Chamber for Agri Input Protection
                </p>
                <p className="text-xs font-bold text-gray-800 tracking-tight mt-2 md:mt-0">
                    Crafted with ❤️ by <a href="#" className="text-blue-600 hover:underline">Metizsoft Solution Private Limited</a>
                </p>
            </footer>
        </div>
    );
}
