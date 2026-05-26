"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import axios from "axios";
import { ArrowLeft, Navigation, MapPin } from "lucide-react";
import { useAlert } from "@/context/AlertContext";

const Map = dynamic(() => import("../../../components/MapComponent"), { ssr: false });

const VEHICLE_SPEEDS: Record<string, number> = {
    Bike: 25, Auto: 20, Car: 30, Loading: 20, Truck: 15,
};

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showAlert } = useAlert();

    const vehicle = searchParams.get("vehicle") || "Car";

    // --- Safety Checks & Coordinate Setup ---
    const oLat = parseFloat(searchParams.get("oLat") || "0");
    const oLng = parseFloat(searchParams.get("oLng") || "0");
    let dLat = parseFloat(searchParams.get("dLat") || "0");
    let dLng = parseFloat(searchParams.get("dLng") || "0");

    const isCustomDestination = dLat === 0 && dLng === 0;
    if (isCustomDestination && oLat !== 0) {
        dLat = oLat + 0.01;
        dLng = oLng + 0.01;
    }

    const [locations, setLocations] = useState({
        origin: { lat: oLat, lng: oLng, address: searchParams.get("oAddr") || "" },
        destination: { lat: dLat, lng: dLng, address: searchParams.get("dAddr") || "" },
    });

    const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!searchParams.get("oLat") || !searchParams.get("dLat")) {
            router.push("/user/book");
            return;
        }

        const timer = setTimeout(() => {
            setIsLoading(false);
            if (isCustomDestination) {
                showAlert("Please drag the DROP pin to your exact location.", "success");
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [searchParams, router, isCustomDestination]);

    // --- Reverse Geocoding when Marker is Dragged ---
    const handleMarkerDragEnd = async (type: "origin" | "destination", lat: number, lng: number) => {
        setIsLoading(true);
        try {
            const res = await axios.get(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
            const feature = res.data.features?.[0];
            const newAddress = feature
                ? [feature.properties.name, feature.properties.street, feature.properties.city, feature.properties.state].filter(Boolean).join(", ")
                : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            setLocations(prev => ({
                ...prev,
                [type]: { lat, lng, address: newAddress }
            }));
            showAlert(`${type === "origin" ? "Pickup" : "Drop"} location updated.`, "success");
        } catch (error) {
            showAlert("Failed to get address for new location.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // --- ETA Calculator ---
    const handleRouteFetched = (distanceKm: number) => {
        const speedKmph = VEHICLE_SPEEDS[vehicle] || 30;
        const durationMin = (distanceKm / speedKmph) * 60;
        setRouteInfo({ distance: distanceKm, duration: durationMin });
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col font-sans transition-colors duration-300">

            {/* --- LOADING UI --- */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-gray-50 dark:bg-[#050505] flex flex-col items-center justify-center transition-colors"
                    >
                        <div className="relative mb-6">
                            <div className="w-16 h-16 border-t-2 border-l-2 border-black dark:border-white rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-black dark:text-white" />
                            </div>
                        </div>
                        <h2 className="font-black text-sm tracking-[0.2em] text-black dark:text-white uppercase mb-2">Loading Map</h2>
                        <p className="text-xs text-gray-400 font-medium">Plotting your route...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- TOP FLOATING BACK BUTTON --- */}
            <div className="absolute top-6 left-6 z-40">
                <button onClick={() => router.back()} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-[#111] rounded-full shadow-xl hover:scale-105 transition-transform border border-gray-100 dark:border-gray-800">
                    <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
                </button>
            </div>

            {/* --- MAP CONTAINER --- */}
            <div className="flex-1 relative z-10 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                {!isLoading && (
                    <div className="absolute inset-0">
                        <Map
                            origin={locations.origin}
                            destination={locations.destination}
                            onRouteFetched={handleRouteFetched}
                            onMarkerDragEnd={handleMarkerDragEnd}
                        />
                    </div>
                )}

                {/* --- FLOATING DISTANCE / TIME PILL --- */}
                {!isLoading && routeInfo.distance > 0 && (
                    <div className="absolute bottom-6 left-6 z-40 bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-3 text-sm">
                        <span className="font-black text-black dark:text-white border-r border-gray-200 dark:border-gray-800 pr-3 flex items-center gap-2">
                            <Navigation className="w-4 h-4" />
                            {routeInfo.distance.toFixed(1)} km
                        </span>
                        <span className="font-bold text-gray-600 dark:text-gray-400">~{Math.round(routeInfo.duration)} min</span>
                    </div>
                )}
            </div>

            {/* --- BOTTOM ADDRESS PANEL --- */}
            <div className="bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-gray-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 relative px-6 pt-8 pb-10 transition-colors duration-300">

                <div className="relative ml-2 space-y-6">
                    <div className="absolute left-[7px] top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-800" />

                    <div className="flex items-start gap-5 relative z-10">
                        <div className="w-4 h-4 mt-1 shrink-0 rounded-full bg-black dark:bg-white flex items-center justify-center border-4 border-white dark:border-[#0a0a0a]">
                            <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Pickup</p>
                            <p className="text-sm font-bold text-black dark:text-white leading-relaxed">{locations.origin.address}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-5 relative z-10">
                        <div className="w-4 h-4 mt-1 shrink-0 bg-gray-400 rounded-sm border-4 border-white dark:border-[#0a0a0a]" />
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Drop</p>
                            <p className="text-sm font-bold text-black dark:text-white leading-relaxed">{locations.destination.address}</p>
                        </div>
                    </div>
                </div>

                <button className="w-full mt-8 bg-black dark:bg-white text-white dark:text-black font-black text-lg py-4 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl">
                    Confirm Ride
                </button>
            </div>
        </main>
    );
}