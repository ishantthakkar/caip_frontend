"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MemberHeader from './MemberHeader';
import MemberSidebar from './MemberSidebar';

interface MemberPortalContainerProps {
    children: React.ReactNode;
    title?: string;
    showFullWidth?: boolean;
    skipMembershipCheck?: boolean;
}

export default function MemberPortalContainer({
    children,
    title = "Dashboard",
    showFullWidth = false,
    skipMembershipCheck = false
}: MemberPortalContainerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/');
        } else {
            // JWT Expiration check
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp * 1000 < Date.now()) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/');
                    return;
                }
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/');
                return;
            }

            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            if (!skipMembershipCheck && parsedUser.membership_status === "0") {
                router.push('/profile');
            } else {
                setLoading(false);
            }
        }
    }, [router, skipMembershipCheck]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900 overflow-hidden">
            <MemberHeader user={user} title={title} />

            <div className="flex flex-1 overflow-hidden">
                <MemberSidebar />

                <main className={`flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc] ${showFullWidth ? 'w-full' : 'max-w-[1920px] mx-auto w-full'}`}>
                    <div className="p-6 lg:p-10 pb-20">
                        {children}
                    </div>
                </main>
            </div>

            <footer className="h-10 bg-white border-t border-gray-100 flex items-center justify-between px-10 text-gray-400 text-[10px] font-bold relative z-40">
                <p>© 2026 Chamber for Agri Input Protection</p>
                <div className="flex items-center gap-6">
                    <p className="text-gray-400 font-medium">Ver 2.0.4 - Industrial</p>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <p className="text-green-600">Secure Live</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
