"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/apiConfig';

interface MemberSidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export default function MemberSidebar({ isCollapsed, setIsCollapsed }: MemberSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [defaulterOpen, setDefaulterOpen] = useState(pathname.includes('/defaulter'));
    const [membershipActive, setMembershipActive] = useState(true);
    const [isSubMember, setIsSubMember] = useState(false);
    const [showRestrictedModal, setShowRestrictedModal] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const subMemberData = localStorage.getItem('subMember');

        if (userData) {
            const user = JSON.parse(userData);

            // Check status
            const status = user.membership_status === "1" || user.membership_status === 1;

            // Check expiry
            let expired = false;
            if (user.membershipExpiry && user.membershipExpiry !== "Lifetime" && user.membershipExpiry !== "N/A") {
                const expiryDate = new Date(user.membershipExpiry);
                const now = new Date();
                if (expiryDate < now) {
                    expired = true;
                }
            }

            const active = status && !expired;
            setMembershipActive(active);

            // AUTO-REDIRECT if on a restricted page (like dashboard)
            if (!active && (pathname === '/dashboard' || pathname.includes('/defaulter') || pathname === '/sub-members' || pathname === '/reports' || pathname === '/logs')) {
                router.push('/profile');
            }
        }
        setIsSubMember(!!subMemberData);
    }, [pathname]);

    const handleLogout = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await fetch(`${API_BASE_URL}auth/log-logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (error) {
                console.error("Logout log failed:", error);
            }
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('subMember');
        router.push('/');
    };

    const handleRestrictedClick = (e: React.MouseEvent) => {
        if (!membershipActive) {
            e.preventDefault();
            setShowRestrictedModal(true);
        }
    };

    const closeAndRedirect = () => {
        setShowRestrictedModal(false);
        router.push('/profile');
    };

    const menuItems = React.useMemo(() => {
        const items = [
            {
                name: 'Dashboard',
                path: '/dashboard',
                restricted: true,
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
            },
            {
                name: 'Defaulter Management',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
                hasSub: true,
                restricted: true,
                subItems: [
                    { name: 'Defaulters Search', path: '/defaulter/search', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
                    { name: 'Defaulters Management', path: '/defaulter/list', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> },
                ]
            },
            {
                name: 'Sub-Member Management',
                path: '/sub-members',
                restricted: true,
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            },
            {
                name: 'Reports',
                path: '/reports',
                restricted: true,
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            },
            {
                name: 'Activity Logs',
                path: '/logs',
                restricted: true,
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            }
        ];

        if (isSubMember) {
            return items.filter(item => item.name !== 'Sub-Member Management');
        }
        return items;
    }, [isSubMember, membershipActive]);

    return (
        <aside className={`${isCollapsed ? 'w-24' : 'w-72'} bg-white border-r border-gray-100 flex flex-col h-full overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent hidden md:flex shrink-0 transition-all duration-300 ease-in-out relative`}>
            {/* Logo Section */}
            <div className={`p-6 border-b border-gray-50 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {isCollapsed ? (
                    <img src="/images/caip_logo.png" alt="CAIP" className="h-10 w-auto object-contain" />
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <img src="/images/caip_logo.png" alt="CAIP Logo" className="h-10 w-auto object-contain" />
                            <span className="text-xl font-black text-[#1b5e20] tracking-tighter">CAIP</span>
                        </div>
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </>
                )}
            </div>

            <div className={`p-4 ${isCollapsed ? 'px-2' : ''}`}>
                <nav className="space-y-2">
                    {menuItems.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                            {!item.hasSub ? (
                                <Link
                                    href={item.path || '#'}
                                    onClick={(e) => item.restricted && handleRestrictedClick(e)}
                                    title={isCollapsed ? item.name : ''}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl text-[17px] font-semibold transition-all ${pathname === item.path ? 'text-[#1b5e20] bg-green-50' : 'text-gray-500 hover:text-[#1b5e20] hover:bg-gray-50'} ${isCollapsed ? 'justify-center px-0' : ''} ${item.restricted && !membershipActive ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <span className={pathname === item.path ? 'text-[#1b5e20]' : 'text-gray-400'}>{item.icon}</span>
                                    {!isCollapsed && <span className="tracking-tight">{item.name}</span>}
                                </Link>
                            ) : (
                                <div className="space-y-1">
                                    <div
                                        onClick={(e) => {
                                            if (item.restricted && !membershipActive) {
                                                handleRestrictedClick(e);
                                                return;
                                            }
                                            if (isCollapsed) {
                                                setIsCollapsed(false);
                                                setDefaulterOpen(true);
                                            } else {
                                                setDefaulterOpen(!defaulterOpen);
                                            }
                                        }}
                                        title={isCollapsed ? item.name : ''}
                                        className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl text-base font-bold transition-all cursor-pointer ${pathname.includes('/defaulter') || (defaulterOpen && !isCollapsed) ? 'text-[#1b5e20] bg-green-50' : 'text-gray-400 hover:bg-gray-50'} ${isCollapsed ? 'justify-center px-0' : ''} ${item.restricted && !membershipActive ? 'opacity-50 grayscale' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {item.icon}
                                            {!isCollapsed && <span className="text-[17px] font-semibold tracking-tight">{item.name}</span>}
                                        </div>
                                        {!isCollapsed && (
                                            <svg className={`w-4 h-4 transition-transform ${defaulterOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path d="m6 9 6 6 6-6" />
                                            </svg>
                                        )}
                                    </div>
                                    {defaulterOpen && !isCollapsed && membershipActive && (
                                        <div className="pl-12 space-y-1.5 mt-2 transition-all animate-in slide-in-from-top-1">
                                            {item.subItems?.map((sub, sIdx) => (
                                                <Link
                                                    key={sIdx}
                                                    href={sub.path}
                                                    className={`flex items-center gap-3 py-2 px-3 rounded-lg text-[14px] font-semibold transition-all ${pathname === sub.path ? 'text-[#1b5e20] bg-green-50/50' : 'text-gray-500 hover:text-[#1b5e20] hover:bg-gray-50/50'}`}
                                                >
                                                    <span className={pathname === sub.path ? 'text-[#1b5e20]' : 'text-gray-400'}>{sub.icon}</span>
                                                    <span className="tracking-tight">{sub.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-gray-50 space-y-3">
                {/* Visual indicator for inactive membership */}
                {!membershipActive && !isCollapsed && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-2">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Account Notice</p>
                        <p className="text-[11px] font-semibold text-gray-600 leading-tight">Membership required for full access.</p>
                        <Link href="/profile" className="inline-block mt-2 text-[10px] font-black text-red-600 underline">Buy Now</Link>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    title={isCollapsed ? "Sign Out" : ""}
                    className={`w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 ${isCollapsed ? 'px-0' : ''}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                    {!isCollapsed && <span>Sign Out</span>}
                </button>
            </div>

            {/* Restricted Access Modal Overlay */}
            {showRestrictedModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1b5e20] p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-white tracking-tight">Membership Required</h3>
                        </div>
                        <div className="p-8 text-center space-y-6">
                            <p className="text-sm font-bold text-gray-500 leading-relaxed">
                                Your membership is either inactive or has expired. Please purchase a membership plan to unlock these features.
                            </p>
                            <button
                                onClick={closeAndRedirect}
                                className="w-full py-4 rounded-2xl bg-[#1b5e20] text-white font-black text-sm shadow-xl hover:bg-green-800 transition-all active:scale-95 shadow-green-100"
                            >
                                Purchase Membership
                            </button>
                            <button
                                onClick={() => setShowRestrictedModal(false)}
                                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
