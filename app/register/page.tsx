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
            <label className="text-[10px] font-bold text-gray-700 ml-1">
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
            {options && options.map((opt: any, index: number) => {
                const val = typeof opt === 'string' ? opt : (opt.state || opt.district || opt.subDistrict || opt.city || opt.name || index);
                return <option key={`${val}-${index}`} value={val}>{val}</option>;
            })}
        </select>
        {error && <p className="text-[9px] text-red-500 font-bold ml-1">{error}</p>}
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
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        companyName: '',
        gst: '',
        pan: '',
        email: '',
        businessAddress: ''
    });
    const [isGstFetching, setIsGstFetching] = useState(false);
    const [pendingLocation, setPendingLocation] = useState<any>(null);

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
                setFormData(prev => ({
                    ...prev,
                    companyName: data.lgnm || data.tradeNam || prev.companyName,
                    businessAddress: data.pradr?.adr || prev.businessAddress,
                }));

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
        if (!formData.get('name')) newErrors.name = "Full Name is required";
        if (!formData.get('email')) newErrors.email = "Email is required";
        if (!formData.get('companyName')) newErrors.companyName = "Company Name is required";
        if (!formData.get('gst')) newErrors.gst = "GST is required";
        if (!formData.get('pan')) newErrors.pan = "PAN is required";
        if (!selectedState) newErrors.state = "State is required";
        if (!selectedDistrict) newErrors.district = "District is required";
        if (!selectedSubDistrict) newErrors.subDistrict = "Sub District is required";
        if (!selectedCity) newErrors.city = "City is required";
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
        formData.set('city', selectedCity);

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
                                <p className="text-xs font-bold text-gray-800 tracking-[0.2em] mt-2">Registration Protocol Complete</p>
                            </div>
                            <p className="text-sm font-medium text-gray-600">
                                Moving you to secure login console...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <FormInput label="Name" name="name" placeholder="Full Name" required error={errors.name} value={formData.name} onChange={handleInputChange} />
                                <FormInput label="Phone" name="phone" placeholder="Enter Phone" required error={errors.phone} value={formData.phone} onChange={handleInputChange} />

                                <FormInput label="Company Name" name="companyName" placeholder="Company Name" required error={errors.companyName} value={formData.companyName} onChange={handleInputChange} />
                                
                                <div className="flex items-end gap-2">
                                    <FormInput 
                                        label="GST" 
                                        name="gst" 
                                        placeholder="GST" 
                                        required 
                                        error={errors.gst} 
                                        className="flex-1"
                                        value={formData.gst}
                                        onChange={handleInputChange}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleGstFetch}
                                        disabled={isGstFetching}
                                        className="mb-1.5 h-[42px] px-4 bg-[#1b5e20] text-white rounded-lg text-[10px] font-bold hover:bg-green-900 transition-all disabled:opacity-50 shadow-sm"
                                    >
                                        {isGstFetching ? '...' : 'FETCH'}
                                    </button>
                                </div>

                                <FormInput label="Pan" name="pan" placeholder="PAN" required error={errors.pan} value={formData.pan} onChange={handleInputChange} />
                                <FormInput label="Email" name="email" type="email" placeholder="Email" required error={errors.email} value={formData.email} onChange={handleInputChange} />

                                <FormSelect
                                    label="State"
                                    name="state"
                                    value={selectedState}
                                    onChange={(e: any) => setSelectedState(e.target.value)}
                                    options={states}
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
                                    onChange={(e: any) => { setSelectedSubDistrict(e.target.value); setSelectedCity(""); }}
                                    options={subDistricts}
                                    placeholder="Select Sub District"
                                    required
                                    error={errors.subDistrict}
                                />
                                <FormSelect
                                    label="City"
                                    name="city"
                                    value={selectedCity}
                                    onChange={(e: any) => setSelectedCity(e.target.value)}
                                    options={cities.length > 0 ? cities : []}
                                    placeholder="Select City"
                                    required
                                    error={errors.city}
                                />

                                <div className="md:col-span-2">
                                    <FormInput 
                                        label="Business Address" 
                                        name="businessAddress" 
                                        placeholder="Full address will be autofilled from GST" 
                                        value={formData.businessAddress} 
                                        onChange={handleInputChange} 
                                    />
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-700 ml-1">
                                        Business Documents (Upload multiple if needed)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            name="businessDocuments"
                                            multiple
                                            accept=".pdf,image/*"
                                            className="w-full border border-blue-100 py-3 px-4 rounded-xl text-[10px] text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-all shadow-sm"
                                        />
                                        <p className="text-[9px] text-gray-400 mt-1.5 ml-1">
                                            Supports multiple PDF and Image files
                                        </p>
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
