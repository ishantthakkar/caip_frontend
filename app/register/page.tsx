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
        <div className={`mb-4 ${className}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    type={inputType}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className={`w-full px-3 py-2.5 text-sm border ${error ? 'border-red-400' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-agri-green-primary/20 focus:border-agri-green-primary transition-all text-gray-700 placeholder:text-gray-400 bg-white`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-agri-green-primary transition-colors"
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        )}
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
        </div>
    );
};

const FormSelect = ({ label, name, options, required = false, className = "", value, onChange, placeholder, error }: any) => (
    <div className={`mb-4 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            name={name}
            required={required}
            value={value || ''}
            onChange={onChange}
            className={`w-full px-3 py-2.5 text-sm border ${error ? 'border-red-400' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-agri-green-primary/20 focus:border-agri-green-primary transition-all text-gray-700 bg-white`}
        >
            <option value="" disabled>{placeholder || `Select ${label}`}</option>
            {options && options.map((opt: any, index: number) => {
                const val = typeof opt === 'string' ? opt : (opt.state || opt.district || opt.subDistrict || opt.city || opt.name || index);
                return <option key={`${val}-${index}`} value={val}>{val}</option>;
            })}
        </select>
        {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
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
        <div className="min-h-screen relative flex flex-col font-sans overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url("/images/login_bg_final.jpg")' }}
            />
            {/* Light Overlay */}
            <div className="absolute inset-0 bg-white opacity-50" />
            
            {/* Carbon Fiber Texture Overlay */}
            <div
                className="absolute inset-0 bg-repeat opacity-20 pointer-events-none"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}
            />

            <div className="container mx-auto px-4 flex-1 flex flex-col pt-12 pb-10 relative z-10">
                <div className="flex-1 flex flex-col items-center justify-center">
                    
                    <div className="w-full max-w-2xl relative z-10">
                        {/* Error & Success Toasts */}
                        {message && (
                            <div className={`mb-4 p-3 border text-sm font-medium rounded-lg text-center shadow-sm ${message.type === 'success' ? 'bg-green-50 text-agri-green-primary border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        {/* Top Header Section */}
                        <div className="mb-6">
                            <Link href="/" className="block text-center mb-4">
                                <img src="/images/caip_logo.png" alt="CAIP Logo" className="mx-auto h-[60px] md:h-[70px] drop-shadow-sm" />
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
                                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-agri-green-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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
                                            <FormInput label="Phone Number" name="phone" placeholder="Enter 10-digit number" required error={errors.phone} value={formData.phone} onChange={handleInputChange} />
                                            <FormInput label="Company Name" name="companyName" placeholder="Business Name" required error={errors.companyName} value={formData.companyName} onChange={handleInputChange} />
                                            
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    GST <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex bg-white rounded-md relative shadow-sm">
                                                    <input
                                                        type="text"
                                                        name="gst"
                                                        value={formData.gst}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter GST Number"
                                                        required
                                                        className={`w-full px-3 py-2.5 text-sm border ${errors.gst ? 'border-red-400' : 'border-gray-300'} rounded-l-md focus:outline-none focus:ring-2 focus:ring-agri-green-primary/20 focus:border-agri-green-primary transition-all text-gray-700 placeholder:text-gray-400 border-r-0`}
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={handleGstFetch}
                                                        disabled={isGstFetching}
                                                        className={`px-4 bg-agri-green-primary text-white border border-agri-green-primary rounded-r-md text-xs font-semibold hover:bg-agri-green-600 transition-colors disabled:opacity-70 flex items-center justify-center whitespace-nowrap`}
                                                    >
                                                        {isGstFetching ? '...' : 'FETCH'}
                                                    </button>
                                                </div>
                                                {errors.gst && <p className="text-xs text-red-500 font-medium mt-1">{errors.gst}</p>}
                                            </div>

                                            <FormInput label="PAN" name="pan" placeholder="PAN Number" required error={errors.pan} value={formData.pan} onChange={handleInputChange} />
                                            <FormInput label="Email Address" name="email" type="email" placeholder="john@example.com" required error={errors.email} value={formData.email} onChange={handleInputChange} />

                                            <FormSelect label="State" name="state" value={selectedState} onChange={(e: any) => setSelectedState(e.target.value)} options={states} placeholder="Select State" required error={errors.state} />
                                            <FormSelect label="District" name="district" value={selectedDistrict} onChange={(e: any) => { setSelectedDistrict(e.target.value); setSelectedSubDistrict(""); }} options={districts} placeholder="Select District" required error={errors.district} />
                                            <FormSelect label="Sub District" name="subDistrict" value={selectedSubDistrict} onChange={(e: any) => { setSelectedSubDistrict(e.target.value); setSelectedCity(""); }} options={subDistricts} placeholder="Select Sub District" required error={errors.subDistrict} />
                                            <FormSelect label="City" name="city" value={selectedCity} onChange={(e: any) => setSelectedCity(e.target.value)} options={cities.length > 0 ? cities : []} placeholder="Select City" required error={errors.city} />

                                            <div className="md:col-span-2">
                                                <FormInput 
                                                    label="Business Address" 
                                                    name="businessAddress" 
                                                    placeholder="Full address (autofilled via GST optionally)" 
                                                    value={formData.businessAddress} 
                                                    onChange={handleInputChange} 
                                                />
                                            </div>

                                            <div className="mb-4 md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Business Documents (Upload multiple if needed)
                                                </label>
                                                <input
                                                    type="file"
                                                    name="businessDocuments"
                                                    multiple
                                                    accept=".pdf,image/*"
                                                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 border border-gray-300 rounded-md py-2 px-3 bg-white transition-all shadow-sm focus:outline-none"
                                                />
                                                <p className="text-xs text-gray-400 mt-1.5">Supports multiple PDF and Image files</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 mb-6">
                                            <div className="flex items-start">
                                                <input 
                                                    type="checkbox" 
                                                    id="terms"
                                                    checked={termsAgreed} 
                                                    onChange={() => setTermsAgreed(!termsAgreed)}
                                                    className={`mt-1 flex-shrink-0 w-4 h-4 text-agri-green-primary bg-gray-100 border-gray-300 rounded focus:ring-agri-green-primary focus:ring-2 cursor-pointer ${errors.terms ? 'border-red-400' : ''}`} 
                                                />
                                                <div className="ml-3">
                                                    <label htmlFor="terms" className="text-sm font-medium text-gray-700 cursor-pointer">
                                                        I agree to the <span className="text-blue-600 hover:underline">Terms and Conditions</span>
                                                    </label>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        CAIP is a platform dedicated to protecting the interests of the agri-input industry. All data is provided by members and subject to our privacy guidelines.
                                                    </p>
                                                    {errors.terms && <p className="text-xs text-red-500 font-medium mt-1">{errors.terms}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-agri-green-primary text-white font-medium py-3 rounded-md hover:bg-agri-green-600 transition-colors disabled:opacity-70 flex justify-center items-center shadow-sm text-sm"
                                        >
                                            {loading ? (
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            ) : 'Create My Account'}
                                        </button>

                                        <div className="mt-6 text-center">
                                            <p className="text-sm text-gray-600 mb-0">
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

                {/* Bottom Footer block */}
                <div className="w-full mt-auto z-10 pt-4">
                    <div className="bg-agri-gold-secondary rounded-xl py-4 px-5 flex flex-col md:flex-row justify-between items-center text-center shadow-sm">
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
            </div>
        </div>
    );
}
