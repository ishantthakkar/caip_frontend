"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/apiConfig';

const FormInput = ({ label, name, type = "text", placeholder, required = false, className = "", onChange, value, error, readOnly = false }: any) => {
    return (
        <div className={`mb-4 ${className}`}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                readOnly={readOnly}
                className={`w-full px-4 py-2.5 text-sm border ${error ? 'border-red-400' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-agri-green-primary/20 focus:border-agri-green-primary transition-all text-gray-700 placeholder:text-gray-300 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} shadow-sm`}
            />
            {error && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{error}</p>}
        </div>
    );
};

export default function VerifyOtpPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [registrationData, setRegistrationData] = useState<any>(null);

    useEffect(() => {
        const data = sessionStorage.getItem('pendingRegistration');
        if (data) {
            setRegistrationData(JSON.parse(data));
        } else {
            router.replace('/register');
        }
    }, [router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOtp(e.target.value);
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!otp) {
            setError("OTP is required");
            return;
        }

        if (!registrationData) {
            setMessage({ type: 'error', text: 'Registration data lost. Please register again.' });
            return;
        }

        setLoading(true);
        setMessage(null);
        setError(null);

        // create FormData again from the saved object
        const formData = new FormData();
        Object.entries(registrationData.fields).forEach(([key, value]) => {
            formData.append(key, value as string);
        });

        // Add the files back
        if (registrationData.files && registrationData.files.length > 0) {
            registrationData.files.forEach((fileObj: any) => {
                // Convert base64 back to blob
                const byteString = atob(fileObj.data.split(',')[1]);
                const mimeString = fileObj.data.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });

                // Append as file
                formData.append('businessDocuments', blob, fileObj.name);
            });
        }

        // Add the OTP to the formData
        formData.append('otp', otp);

        try {
            const response = await fetch(`${API_BASE_URL}register`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Registration successful! Membership request is currently awaiting admin approval.' });
                sessionStorage.removeItem('pendingRegistration');
                setTimeout(() => {
                    router.replace('/login');
                }, 4000);
            } else {
                setMessage({ type: 'error', text: data.msg || 'Registration failed.' });
                setLoading(false);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'A network error occurred.' });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col font-sans overflow-hidden bg-gray-50">
            <div className="container mx-auto px-4 flex-1 flex flex-col pt-12 pb-10 relative z-10">
                <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                    <div className="w-full max-w-md relative z-10">
                        {message && (
                            <div className={`mb-4 p-3 border text-sm font-medium rounded-lg text-center shadow-sm animate-in fade-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-50 text-agri-green-primary border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="mb-6 text-center">
                            <Link href="/" className="inline-block mb-4">
                                <img src="/images/caip_logo.png" alt="CAIP Logo" className="mx-auto h-[70px] drop-shadow-sm" />
                            </Link>
                            <div className="bg-agri-green-primary text-center px-4 py-3.5 rounded-2xl shadow-sm">
                                <h4 className="text-white m-0 font-bold text-lg tracking-wide">Chamber for Agri Input Protection</h4>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden mb-8">
                            <div className="bg-agri-green-primary p-5 text-center">
                                <h5 className="text-white text-xl font-semibold mb-1">Verify OTP</h5>
                                <p className="text-white/80 text-sm m-0">
                                    Please enter the OTP sent to your phone.
                                </p>
                            </div>
                            <div className="p-6 md:p-8">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="text-center mb-4">
                                            <h4 className="text-sm font-bold text-gray-800">Verify Your Identity</h4>
                                            <p className="text-xs text-gray-500 mt-1">Please enter the 6-digit OTP sent to your phone number.</p>
                                        </div>
                                        <div className="max-w-xs mx-auto">
                                            <FormInput label="Enter OTP" name="otp" placeholder="Enter 6-digit OTP" required error={error} value={otp} onChange={handleInputChange} />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full bg-agri-green-primary hover:bg-agri-green-700 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-agri-green-950/20 transition-all transform active:scale-[0.98] uppercase text-xs flex items-center justify-center gap-2 cursor-pointer ${loading ? 'opacity-70' : ''}`}
                                    >
                                        {loading ? (
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : 'Verify & Register'}
                                    </button>

                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => router.push('/register')}
                                            disabled={loading}
                                            className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-wide inline-flex justify-center items-center gap-1"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                            Back to Edit Details
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
