"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { API_BASE_URL } from '@/config/apiConfig';

interface AdminPortalContainerProps {
    children: React.ReactNode;
    title?: string;
    showFullWidth?: boolean;
}

export default function AdminPortalContainer({
    children,
    title = "Admin Dashboard",
    showFullWidth = false
}: AdminPortalContainerProps) {
    const router = useRouter();
    const [admin, setAdmin] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminUser');

        if (!token || !adminData) {
            router.push('/admin-login');
        } else {
            setAdmin(JSON.parse(adminData));
            fetchPendingCount();
            setLoading(false);
        }
    }, [router]);

    const fetchPendingCount = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}users`);
            const data = await response.json();
            if (response.ok && Array.isArray(data.data)) {
                setPendingCount(data.data.filter((u: any) => u.status === "0").length);
            }
        } catch (error) {
            console.error("Error fetching pending count:", error);
        }
    };

    if (loading || !admin) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center flex-col gap-4">
                <div className="animate-spin h-12 w-12 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
                <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-[0.2em]">Administrative Handshake...</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#f8fafc] flex font-sans text-slate-900 overflow-hidden">
            <AdminSidebar pendingCount={pendingCount} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="px-6 pt-6">
                    <AdminHeader admin={admin} title={title} isCollapsed={isCollapsed} />
                </div>

                <main className={`flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc] transition-all duration-300 ${showFullWidth ? 'w-full' : 'max-w-[1920px] mx-auto w-full'}`}>
                    <div className="p-6 lg:p-10 pb-20">
                        {children}
                    </div>
                </main>

                <footer className="h-10 bg-white border-t border-gray-100 flex items-center justify-between px-10 text-gray-400 text-[10px] font-bold relative z-40">
                    <p className="uppercase tracking-widest">© 2026 Admin Control Panel | Authority Protocol</p>
                    <div className="flex items-center gap-6 text-[9px] uppercase tracking-widest">
                        <p className="font-black text-gray-300">Auth Tier 1</p>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                            <p className="text-blue-600 font-black">System Live</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
