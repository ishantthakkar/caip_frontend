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

    const [isCollapsed, setIsCollapsed] = useState(true);

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
                <div className="animate-spin h-12 w-12 border-4 border-agri-green-primary border-t-transparent rounded-full font-black"></div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#f8fafc] flex font-sans text-slate-900 overflow-hidden">
            <MemberSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="px-6 pt-3 flex-shrink-0">
                    <MemberHeader
                        user={user}
                        title={title}
                        isCollapsed={isCollapsed}
                        setIsCollapsed={setIsCollapsed}
                    />
                </div>

                <main className={`flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc] transition-all duration-300 ${showFullWidth ? 'w-full' : 'max-w-[1920px] mx-auto w-full'}`}>
                    <div className="px-6 pt-3 lg:px-10 lg:pt-5 pb-20">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
