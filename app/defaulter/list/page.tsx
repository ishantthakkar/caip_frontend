"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MemberPortalContainer from '@/components/MemberPortalContainer';
import Link from 'next/link';
import { API_BASE_URL, ASSETS_BASE_URL } from '@/config/apiConfig';

const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: any }) => (
    <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">{icon}</div>
        <div className="min-w-0">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                {label}: <span className="text-gray-600 lowercase font-medium ml-1">{value}</span>
            </p>
        </div>
    </div>
);

export default function MemberDefaulterListPage() {
    const [defaulters, setDefaulters] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // UI & Modal States
    const [selectedDefaulter, setSelectedDefaulter] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);
    const [editFiles, setEditFiles] = useState<FileList | null>(null);

    // Payment States
    const [showPayment, setShowPayment] = useState(false);
    const [paymentRows, setPaymentRows] = useState<any[]>([{ amount: '', date: '' }]);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetchMyReports();
        fetchLocations();

        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    }, []);

    const fetchMyReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}defaulter/my-reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
                return;
            }

            const data = await response.json();
            if (response.ok) setDefaulters(data.data || []);
        } catch (error) {
            console.error("Error fetching reports:", error);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}locations`);
            const data = await res.json();
            setLocations(data.states || []);
        } catch (error) {
            console.error("Error fetching locations:", error);
        }
    };

    const handleEditClick = (def: any) => {
        setSelectedDefaulter(def);
        setEditForm({ ...def });
        setEditFiles(null);
        setShowEdit(true);
    };

    const handleViewClick = (def: any) => {
        setSelectedDefaulter(def);
        setShowDetails(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditForm((prev: any) => ({
            ...prev,
            [name]: value,
            ...(name === 'state' ? { district: '', cities: '' } : {}),
            ...(name === 'district' ? { cities: '' } : {})
        }));
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            Object.keys(editForm).forEach(key => {
                if (key !== 'attachment_documents' && key !== 'payments' && key !== 'user_id' && key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v') {
                    formData.append(key, editForm[key]);
                }
            });

            if (editFiles) {
                Array.from(editFiles).forEach(file => {
                    formData.append('attachment_documents', file);
                });
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}defaulter/update/${selectedDefaulter._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert("Record updated successfully!");
                setShowEdit(false);
                fetchMyReports();
            }
        } catch (error) {
            console.error("Update error:", error);
        } finally {
            setSaving(false);
        }
    };

    const processedData = useMemo(() => {
        if (!searchTerm) return defaulters;
        const low = searchTerm.toLowerCase();
        return defaulters.filter(d =>
            d.defaulter_name?.toLowerCase().includes(low) ||
            d.gst_number?.toLowerCase().includes(low) ||
            d.district?.toLowerCase().includes(low)
        );
    }, [defaulters, searchTerm]);

    const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getRecoveryStatus = (def: any) => {
        const defaultAmt = Number(def.default_amount) || 0;
        const outstandingAmt = def.outstanding_amount !== undefined ? Number(def.outstanding_amount) : defaultAmt;
        const totalPaid = (def.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        if (outstandingAmt === 0) return { label: 'Paid', color: 'bg-green-100 text-green-700' };
        if (totalPaid > 0) return { label: 'Partially Paid', color: 'bg-blue-50 text-blue-600' };
        return { label: 'Not Paid', color: 'bg-red-50 text-red-600' };
    };

    const handlePaymentClick = (def: any) => {
        setSelectedDefaulter(def);
        setPaymentRows([{ amount: '', date: new Date().toISOString().split('T')[0] }]);
        setShowPayment(true);
    };

    const handleAddPaymentRow = () => {
        setPaymentRows([...paymentRows, { amount: '', date: new Date().toISOString().split('T')[0] }]);
    };

    const handleRemovePaymentRow = (index: number) => {
        setPaymentRows(paymentRows.filter((_, i) => i !== index));
    };

    const handlePaymentRowChange = (index: number, field: string, value: string) => {
        const newRows = [...paymentRows];
        newRows[index][field] = value;
        setPaymentRows(newRows);
    };

    const handleSavePayments = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDefaulter) return;

        const validPayments = paymentRows.filter(p => p.amount && p.date);
        if (validPayments.length === 0) {
            alert("Please add at least one valid payment amount and date.");
            return;
        }

        setProcessingPayment(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}defaulter/add-payment/${selectedDefaulter._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ payments: validPayments })
            });

            if (res.ok) {
                alert("Payments recorded successfully!");
                setShowPayment(false);
                fetchMyReports();
            } else {
                const data = await res.json();
                alert(data.msg || "Error saving payments");
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Failed to save payments");
        } finally {
            setProcessingPayment(false);
        }
    };

    const districtsList = locations.find(s => s.state === editForm.state)?.districts || [];

    return (
        <MemberPortalContainer title="My Reported Defaulters">
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Defaulter Records</h2>
                        <p className="text-sm text-gray-500">View and manage your filed reports</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-72">
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-green-600 text-sm"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        </div>
                        <Link href="/defaulter/add" className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm">
                            + Add New
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Defaulter Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reported On</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Outstanding</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recovery Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recovery Amount</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedData.map((def, i) => {
                                    const recovery = getRecoveryStatus(def);
                                    return (
                                        <tr key={def._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-gray-900">{def.defaulter_name}</p>
                                                <p className="text-[11px] text-gray-400">{def.gst_number || 'PAN: ' + def.pan_number}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(def.createdAt).toLocaleDateString('en-GB')}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{Number(def.default_amount).toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-red-600">₹{Number(def.outstanding_amount || def.default_amount).toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${def.status === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {def.status === 1 ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${recovery.color}`}>
                                                    {recovery.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                                                ₹{((def.payments || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handlePaymentClick(def)}
                                                    disabled={Number(def.outstanding_amount) === 0}
                                                    className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-800 disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    <span className="text-sm">+</span> Add Payment
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEditClick(def)} disabled={Number(def.outstanding_amount) === 0} className="bg-orange-400 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded hover:bg-orange-500 transition-all shadow-sm disabled:opacity-30">Edit</button>
                                                    <button onClick={() => handleViewClick(def)} className="bg-[#0051a8] text-white text-[10px] font-black uppercase px-3 py-1.5 rounded hover:bg-[#003d80] transition-all shadow-sm">View</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {paginatedData.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="py-20 text-center text-gray-400 text-sm">
                                            No records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {processedData.length > itemsPerPage && (
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-xs text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} records</p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <button
                                disabled={currentPage === Math.ceil(processedData.length / itemsPerPage)}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {showDetails && selectedDefaulter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(false)}></div>
                    <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-300">
                        {/* Header */}
                        <div className="px-8 py-5 bg-[#0a1f0a] flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">👥</span>
                                <h3 className="text-lg font-bold tracking-tight">Defaulter Details</h3>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-0 overflow-y-auto no-scrollbar">
                            {/* Section 1: Main Info */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                                <div className="space-y-4">
                                    <InfoItem icon="👤" label="Defaulter Company Name" value={selectedDefaulter.defaulter_name} />
                                    <InfoItem icon="📞" label="Mobile" value={selectedDefaulter.mobile_number} />
                                    <InfoItem icon="✉️" label="Email" value={selectedDefaulter.email_id || '-'} />
                                    <InfoItem icon="🔢" label="GST" value={selectedDefaulter.gst_number || '-'} />
                                    <InfoItem icon="💳" label="PAN" value={selectedDefaulter.pan_number || '-'} />
                                    <InfoItem icon="🆔" label="CIN" value={selectedDefaulter.cin_number || '-'} />
                                    <InfoItem icon="🛡️" label="Aadhar" value={selectedDefaulter.aadhar_number || '-'} />
                                    <InfoItem icon="🏠" label="Defaulter Address" value={selectedDefaulter.defaulter_address || '-'} />
                                </div>
                                <div className="space-y-4">
                                    <InfoItem icon="📍" label="State" value={selectedDefaulter.state} />
                                    <InfoItem icon="🏢" label="District" value={selectedDefaulter.district} />
                                    <InfoItem icon="🗾" label="Sub District" value={selectedDefaulter.cities || '-'} />
                                    <InfoItem icon="📅" label="Financial Year" value={selectedDefaulter.financial_year || '-'} />
                                    <InfoItem icon="📉" label="Outstanding" value={(selectedDefaulter.outstanding_amount || selectedDefaulter.default_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} />
                                    <InfoItem icon="🏭" label="Industry" value={selectedDefaulter.industry || '-'} />
                                    <InfoItem icon="👤" label="Reported By" value={user?.companyName || user?.name || 'Local Member'} />
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 2: Financial/Reason */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                <InfoItem icon="💵" label="Default Amount" value={Number(selectedDefaulter.default_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} />
                                <InfoItem icon="📅" label="Date of Default" value={selectedDefaulter.date_of_default ? new Date(selectedDefaulter.date_of_default).toISOString().split('T')[0] : '-'} />
                                <InfoItem icon="⚠️" label="Reason" value={selectedDefaulter.reason_description} />
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm">✅</div>
                                    <div>
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                                        <span className="px-3 py-1 bg-green-500 text-white rounded-full text-[10px] font-bold uppercase mt-1 inline-block">
                                            {selectedDefaulter.status === 1 ? 'Approved' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 3: Legal Info */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                <InfoItem icon="🏛️" label="Court Complex Name" value={selectedDefaulter.court_complex_name || '-'} />
                                <InfoItem icon="🔢" label="Case Number" value={selectedDefaulter.case_number || '-'} />
                                <InfoItem icon="⚖️" label="Case Type" value={selectedDefaulter.case_type || '-'} />
                                <InfoItem icon="📅" label="Case Year" value={selectedDefaulter.case_year || '-'} />
                                <InfoItem icon="💼" label="Case Status" value={selectedDefaulter.case_status || '-'} />
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 4: Documents */}
                            <div className="p-8">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                                    <span>📄</span> Documents
                                </h4>
                                {selectedDefaulter.attachment_documents && selectedDefaulter.attachment_documents.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {selectedDefaulter.attachment_documents.map((doc: string, idx: number) => {
                                            const isPdf = doc.toLowerCase().endsWith('.pdf');
                                            return (
                                                <a key={idx} href={`${ASSETS_BASE_URL}uploads/${doc}`} target="_blank" className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-lg text-xs font-bold text-green-700 hover:bg-green-50 transition-all flex items-center gap-3 group">
                                                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                                        {isPdf ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></svg>
                                                        ) : (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                                        )}
                                                    </div>
                                                    <span className="group-hover:translate-x-0.5 transition-transform">Document {idx + 1}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No documents attached.</p>
                                )}
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 5: Payment Records */}
                            <div className="p-8 bg-gray-50/50">
                                <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 bg-[#0a1f0a] text-white rounded-xl flex items-center justify-center text-sm">💰</span>
                                    Payment Records
                                </h4>
                                <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-xl overflow-hidden">
                                    <table className="w-full text-center">
                                        <thead>
                                            <tr className="bg-[#0a1f0a] text-white">
                                                <th className="px-6 py-5 text-xs font-black uppercase border-r border-white/10">#</th>
                                                <th className="px-6 py-5 text-base font-bold border-r border-white/10">Payment Date</th>
                                                <th className="px-6 py-5 text-base font-bold">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(selectedDefaulter.payments || []).map((p: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50/80 transition-all">
                                                    <td className="px-6 py-5 text-sm font-bold text-gray-400 border-r border-gray-50">{idx + 1}</td>
                                                    <td className="px-6 py-5 text-sm font-semibold text-gray-600 border-r border-gray-50">{new Date(p.date).toISOString().split('T')[0]}</td>
                                                    <td className="px-6 py-5 text-sm font-black text-gray-800">{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}
                                            {(selectedDefaulter.payments || []).length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-10 text-xs font-bold text-gray-400 italic">No payments recorded yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 bg-gray-50 border-t flex justify-end">
                            <button onClick={() => setShowDetails(false)} className="bg-gray-400 text-white px-8 py-2 rounded-lg font-bold hover:bg-gray-500 transition-all shadow-md">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && selectedDefaulter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowEdit(false)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-8 py-4 bg-[#0a1f0a] border-b flex items-center justify-between text-white">
                            <h3 className="font-bold">Edit Defaulter Record</h3>
                            <button onClick={() => setShowEdit(false)} className="text-white/60 hover:text-white transition-all">✕</button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                            {/* Section 1: Basic Identity */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">1. Identity Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Defaulter Company Name</label>
                                        <input type="text" name="defaulter_name" value={editForm.defaulter_name} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Number</label>
                                        <input type="text" name="mobile_number" value={editForm.mobile_number} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Email Address</label>
                                        <input type="email" name="email_id" value={editForm.email_id} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">GST Number</label>
                                        <input type="text" name="gst_number" value={editForm.gst_number} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">PAN Number</label>
                                        <input type="text" name="pan_number" value={editForm.pan_number} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">CIN Number</label>
                                        <input type="text" name="cin_number" value={editForm.cin_number} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Aadhar Number</label>
                                        <input type="text" name="aadhar_number" value={editForm.aadhar_number} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Industry</label>
                                        <select name="industry" value={editForm.industry} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50">
                                            <option value="">Select Industry</option>
                                            <option value="Agriculture">Agriculture</option>
                                            <option value="Agrochemicals & Fertilizers">Agrochemicals & Fertilizers</option>
                                            <option value="Seed Suppliers">Seed Suppliers</option>
                                            <option value="Farming Equipment">Farming Equipment</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Address & Location */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">2. Jurisdiction & Location</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">State</label>
                                        <select name="state" value={editForm.state} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50">
                                            <option value="">Select State</option>
                                            {locations.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">District</label>
                                        <select name="district" value={editForm.district} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50">
                                            <option value="">Select District</option>
                                            {districtsList.map((d: any) => <option key={d.district} value={d.district}>{d.district}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Sub District</label>
                                        <select name="cities" value={editForm.cities} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50">
                                            <option value="">Select City</option>
                                            {(districtsList.find((d: any) => d.district === editForm.district)?.subDistricts || []).map((sd: any) => <option key={sd} value={sd}>{sd}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-full space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Full Address</label>
                                        <textarea name="defaulter_address" value={editForm.defaulter_address} onChange={handleInputChange} rows={2} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Financials */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">3. Financial Defaults</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Default Amount</label>
                                        <input type="number" name="default_amount" value={editForm.default_amount} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Outstanding Amount</label>
                                        <input type="number" name="outstanding_amount" value={editForm.outstanding_amount} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold text-red-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Financial Year</label>
                                        <select name="financial_year" value={editForm.financial_year} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50">
                                            <option value="">Select Year</option>
                                            {Array.from({ length: 10 }).map((_, i) => {
                                                const yr = 2025 - i;
                                                const val = `${yr}-${(yr + 1).toString().slice(-2)}`;
                                                return <option key={val} value={val}>{val}</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date of Default</label>
                                        <input type="date" name="date_of_default" value={editForm.date_of_default ? new Date(editForm.date_of_default).toISOString().split('T')[0] : ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="col-span-full space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason / Description</label>
                                        <textarea name="reason_description" value={editForm.reason_description} onChange={handleInputChange} rows={3} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Legal Information */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">4. Legal Proceedings (Optional)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Court Name</label>
                                        <input type="text" name="court_complex_name" value={editForm.court_complex_name || ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Case Number</label>
                                        <input type="text" name="case_number" value={editForm.case_number || ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Case Type</label>
                                        <input type="text" name="case_type" value={editForm.case_type || ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Case Year</label>
                                        <input type="text" name="case_year" value={editForm.case_year || ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Legal Status</label>
                                        <select name="case_status" value={editForm.case_status || ''} onChange={handleInputChange} className="w-full border rounded-lg py-2.5 px-4 focus:border-green-600 outline-none text-sm bg-gray-50/50 font-bold">
                                            <option value="">Select Status</option>
                                            <option value="Notice Issued">Notice Issued</option>
                                            <option value="Under Review">Under Review</option>
                                            <option value="Warrant Issued">Warrant Issued</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Add New Documents</label>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => setEditFiles(e.target.files)}
                                            className="w-full border border-dashed border-gray-300 rounded-lg py-2 px-3 text-[10px] font-bold text-gray-400 bg-gray-50 hover:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={saving} className="w-full bg-[#1b5e20] text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-black transition-all disabled:opacity-50 mt-8 shadow-xl">
                                {saving ? "Synchronizing..." : "Commit Updates"}
                            </button>
                        </form>

                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayment && selectedDefaulter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !processingPayment && setShowPayment(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 bg-[#1b5e20] text-white flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <span>💼</span> Add Recovery Payment
                            </h3>
                            <button onClick={() => setShowPayment(false)} className="text-white/60 hover:text-white transition-colors">✕</button>
                        </div>

                        <div className="p-4 bg-gray-50 border-b flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
                            <span>Defaulter: {selectedDefaulter.defaulter_name}</span>
                            <span className="text-red-600">Pending: ₹{(Number(selectedDefaulter.outstanding_amount) || 0).toLocaleString()}</span>
                        </div>

                        <form onSubmit={handleSavePayments} className="p-6">
                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {paymentRows.map((row, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4 relative">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[11px] font-black text-gray-400 uppercase">Payment Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={row.amount}
                                                onChange={(e) => handlePaymentRowChange(idx, 'amount', e.target.value)}
                                                placeholder="Enter amount"
                                                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 font-bold"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[11px] font-black text-gray-400 uppercase">Date of Payment</label>
                                            <input
                                                type="date"
                                                value={row.date}
                                                onChange={(e) => handlePaymentRowChange(idx, 'date', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none focus:border-green-600 font-bold"
                                                required
                                            />
                                        </div>
                                        {paymentRows.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePaymentRow(idx)}
                                                className="w-full bg-red-500/10 text-red-500 py-2 rounded-lg text-[11px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                🗑️ Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddPaymentRow}
                                className="mt-4 px-4 py-2 bg-[#1b5e20] text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2"
                            >
                                <span className="text-lg">+</span> Add Another Payment
                            </button>

                            <div className="mt-8 pt-6 border-t flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processingPayment}
                                    className="bg-[#1b5e20] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {processingPayment ? "Recording..." : "Save Payments"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MemberPortalContainer>
    );
}
