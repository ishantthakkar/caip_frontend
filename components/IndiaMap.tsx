"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icons in Next.js
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

// Dynamic import with SSR disabled
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

const STATE_COORDINATES: { [key: string]: [number, number] } = {
    "Andaman and Nicobar Islands": [11.7401, 92.6586],
    "Andhra Pradesh": [15.9129, 79.74],
    "Arunachal Pradesh": [28.218, 94.7278],
    "Assam": [26.2006, 92.9376],
    "Bihar": [25.0961, 85.3131],
    "Chandigarh": [30.7333, 76.7794],
    "Chhattisgarh": [21.2787, 81.8661],
    "Dadra and Nagar Haveli and Daman and Diu": [20.1809, 73.0169],
    "Delhi": [28.6139, 77.209],
    "Goa": [15.2993, 74.124],
    "Gujarat": [22.2587, 71.1924],
    "Haryana": [29.0588, 76.0856],
    "Himachal Pradesh": [31.1048, 77.1734],
    "Jammu and Kashmir": [33.7782, 76.5762],
    "Jharkhand": [23.6102, 85.2799],
    "Karnataka": [15.3173, 75.7139],
    "Kerala": [10.8505, 76.2711],
    "Ladakh": [34.1526, 77.577],
    "Lakshadweep": [10.5667, 72.6417],
    "Madhya Pradesh": [22.9734, 78.6569],
    "Maharashtra": [19.7507, 75.7139],
    "Manipur": [24.6637, 93.9063],
    "Meghalaya": [25.467, 91.3662],
    "Mizoram": [23.1645, 92.9376],
    "Nagaland": [26.1584, 94.5624],
    "Odisha": [20.9517, 85.0985],
    "Puducherry": [11.9416, 79.8083],
    "Punjab": [31.1471, 75.3412],
    "Rajasthan": [27.0238, 74.2179],
    "Sikkim": [27.533, 88.5122],
    "Tamil Nadu": [11.1271, 78.6569],
    "Telangana": [18.1124, 79.0193],
    "Tripura": [23.9408, 91.9882],
    "Uttar Pradesh": [26.8467, 80.9462],
    "Uttarakhand": [30.0668, 79.0193],
    "West Bengal": [22.9868, 87.855]
};

interface IndiaMapProps {
    stateInsights: any[];
}

const IndiaMap: React.FC<IndiaMapProps> = ({ stateInsights }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-sky-50">
                <div className="animate-spin h-8 w-8 border-4 border-[#1b5e20] border-t-transparent rounded-full font-black"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            <MapContainer
                center={[22.3511, 78.6677]}
                zoom={5}
                scrollWheelZoom={false}
                className="w-full h-full rounded-[2rem] z-10"
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {stateInsights.map((insight, index) => {
                    const coords = STATE_COORDINATES[insight.state];
                    if (coords) {
                        return (
                            <Marker key={index} position={coords}>
                                <Popup>
                                    <div className="p-2">
                                        <h4 className="font-black text-[10px] uppercase tracking-widest text-[#1b5e20] mb-1">{insight.state}</h4>
                                        <p className="text-[12px] font-black text-gray-900 border-b border-gray-100 pb-1 mb-1">
                                            Defaulters: {insight.count}
                                        </p>
                                        <p className="text-[12px] font-black text-red-600">
                                            Amount: ₹{insight.amount.toLocaleString()}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    }
                    return null;
                })}
            </MapContainer>

            {/* Absolute UI labels for states with high counts (overlaying the map for premium feel) */}
            <div className="absolute top-4 left-4 z-[20] pointer-events-none space-y-2">
                {stateInsights.slice(0, 3).map((insight, i) => (
                    <div key={i} className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-red-500 animate-pulse' : 'bg-[#1b5e20]'}`}></span>
                        <div>
                            <p className="text-[8px] font-black uppercase text-gray-900 leading-none">{insight.state}</p>
                            <p className="text-[7px] font-bold text-gray-500 uppercase mt-0.5">{insight.count} Incident(s)</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Map Control Guide */}
            <div className="absolute top-4 right-4 z-[20] flex flex-col gap-2">
                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl shadow-black/5 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    GEOSPATIAL INTEL v3.0
                </div>
            </div>
        </div>
    );
};

export default IndiaMap;
