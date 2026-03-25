"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
    const pathname = usePathname();
    const [admin, setAdmin] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminUser');

        if (!token) {
            router.push('/admin-login');
        } else {
            // JWT Expiration check
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp * 1000 < Date.now()) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    router.push('/admin-login');
                    return;
                }
            } catch (e) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                router.push('/admin-login');
                return;
            }

            if (adminData) {
                setAdmin(JSON.parse(adminData));
            } else {
                setAdmin({ name: 'Admin' });
            }
            
            // Fetch pending count
            fetchPendingCount(token);
            setLoading(false);
        }
    }, [router]);

    const fetchPendingCount = async (token: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data.data)) {
                const count = data.data.filter((u: any) => u.status === "0").length;
                setPendingCount(count);
            }
        } catch (error) {
            console.error("Error fetching pending count:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#f8fafc] flex font-sans text-slate-900 overflow-hidden">
            <AdminSidebar 
                isCollapsed={isCollapsed} 
                setIsCollapsed={setIsCollapsed} 
                pendingCount={pendingCount}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="px-4 pt-4">
                    <AdminHeader admin={admin} title={title} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                </div>

                <main className={`flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc] transition-all duration-300 ${showFullWidth ? 'w-full' : 'max-w-[1920px] mx-auto w-full'}`}>
                    <div className="p-6 lg:p-10 pb-20">
                        {children}
                    </div>
                </main>

                <footer className="h-10 bg-white border-t border-gray-100 flex items-center justify-between px-10 text-gray-400 text-[10px] font-bold relative z-40">
                    <p>© 2026 Chamber for Agri Input Protection</p>
                    <div className="flex items-center gap-6">
                        <p className="text-gray-400 font-medium">Ver 2.0.4 - Administrative</p>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <p className="text-green-600">Secure Live</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
