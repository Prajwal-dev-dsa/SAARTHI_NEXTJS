"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import axios from "axios";
import { ArrowLeft, Navigation, MapPin, Search, RefreshCw, Star, Zap, ArrowRight, Loader2 } from "lucide-react";
import { useAlert } from "@/context/AlertContext";

const Map = dynamic(() => import("../../../components/MapComponent"), { ssr: false });

const VEHICLE_SPEEDS: Record<string, number> = {
    Bike: 25, Auto: 20, Car: 30, Loading: 20, Truck: 15,
};

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showAlert } = useAlert();

    // --- Extracted Params ---
    const vehicle = searchParams.get("vehicle") || "Car";
    const phone = searchParams.get("mobile") || "";

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
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
    const [isFetchingDrivers, setIsFetchingDrivers] = useState(true);

    // --- Fetch Vehicles ---
    const fetchVehicles = async () => {
        setIsFetchingDrivers(true);
        try {
            const res = await axios.post("/api/user/find-vehicles", {
                pickupLat: locations.origin.lat,
                pickupLng: locations.origin.lng,
                vehicleType: vehicle
            });
            setAvailableDrivers(res.data.vehicles || []);
        } catch (error) {
            console.error("Failed to auto-fetch vehicles:", error);
        } finally {
            setIsFetchingDrivers(false);
        }
    };

    // Auto-fetch on load & drag
    useEffect(() => {
        if (locations.origin.lat === 0) return;
        fetchVehicles();
    }, [locations.origin.lat, locations.origin.lng, vehicle]);

    // Initial Loading Screen
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
    }, [searchParams, router, isCustomDestination, showAlert]);

    // --- Reverse Geocoding with OpenStreetMap (Nominatim) ---
    const handleMarkerDragEnd = async (type: "origin" | "destination", lat: number, lng: number) => {
        setIsLoading(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const newAddress = res.data?.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

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

    const handleRouteFetched = (distanceKm: number) => {
        const speedKmph = VEHICLE_SPEEDS[vehicle] || 30;
        const durationMin = (distanceKm / speedKmph) * 60;
        setRouteInfo({ distance: distanceKm, duration: durationMin });
    };

    // --- Book Navigation ---
    const handleBook = (driver: any, estFare: number) => {
        const params = new URLSearchParams({
            pickup: locations.origin.address,
            drop: locations.destination.address,
            vehicle: vehicle,
            driverId: driver.partnerId,
            fare: estFare.toString(),
            oLat: locations.origin.lat.toString(),
            oLng: locations.origin.lng.toString(),
            dLat: locations.destination.lat.toString(),
            dLng: locations.destination.lng.toString(),
            phone: phone
        });

        router.push(`/user/checkout?${params.toString()}`);
    };

    return (
        <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#050505] font-sans transition-colors duration-300">

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
            <div className="h-[85vh] lg:h-[80vh] shrink-0 relative z-10 bg-gray-100 dark:bg-gray-900">
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

                {/* Floating Distance Pill */}
                {!isLoading && routeInfo.distance > 0 && (
                    <div className="absolute bottom-10 left-6 z-40 bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-3 text-sm">
                        <span className="font-black text-black dark:text-white border-r border-gray-200 dark:border-gray-800 pr-3 flex items-center gap-2">
                            <Navigation className="w-4 h-4" />
                            {routeInfo.distance.toFixed(1)} km
                        </span>
                        <span className="font-bold text-gray-600 dark:text-gray-400">~{Math.round(routeInfo.duration)} min</span>
                    </div>
                )}
            </div>

            {/* --- BOTTOM SHEET --- */}
            <div className="bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-gray-900 rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.08)] z-40 relative -mt-6 pt-8 pb-10 flex flex-col flex-1 transition-colors duration-300">

                {/* Fixed Address Section */}
                <div className="px-6 relative ml-2 space-y-6">
                    <div className="absolute left-[7px] top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-800" />

                    <div className="flex items-start gap-5 relative z-10">
                        <div className="w-4 h-4 mt-1 shrink-0 rounded-full bg-black dark:bg-white flex items-center justify-center border-4 border-white dark:border-[#0a0a0a]">
                            <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />
                        </div>
                        <div className="overflow-hidden w-full pr-4">
                            <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Pickup</p>
                            <p className="text-sm font-bold text-black dark:text-white truncate w-full">{locations.origin.address}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-5 relative z-10">
                        <div className="w-4 h-4 mt-1 shrink-0 bg-gray-400 rounded-sm border-4 border-white dark:border-[#0a0a0a]" />
                        <div className="overflow-hidden w-full pr-4">
                            <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Drop</p>
                            <p className="text-sm font-bold text-black dark:text-white truncate w-full">{locations.destination.address}</p>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-900 w-full my-6" />

                {/* --- VEHICLE / NOT FOUND SECTION --- */}
                <div className="px-6">
                    {isFetchingDrivers ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-gray-400" />
                            <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Scanning Area...</p>
                        </div>
                    ) : availableDrivers.length === 0 ? (
                        // NOT FOUND UI
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-6">
                            <div className="w-full text-left mb-8">
                                <h2 className="text-lg font-black text-black dark:text-white">No Nearby Vehicles</h2>
                                <p className="text-xs text-gray-500 mt-1">{vehicle} rides near your pickup</p>
                            </div>

                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-800">
                                <Search className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="font-bold text-black dark:text-white mb-1">Vehicles Not Found</h3>
                            <p className="text-xs text-gray-500 text-center max-w-[250px]">No {vehicle} drivers are available near your pickup right now.</p>

                            <button onClick={fetchVehicles} className="mt-6 flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg">
                                <RefreshCw className="w-4 h-4" /> Retry Search
                            </button>
                        </motion.div>
                    ) : (
                        // AVAILABLE UI
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-4">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-lg font-black text-black dark:text-white">Available</h2>
                                    <p className="text-xs text-gray-500 mt-1">{vehicle} rides near your pickup</p>
                                </div>
                                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-900/30">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Live</span>
                                </div>
                            </div>

                            {/* Horizontal Scroll Cards */}
                            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6 snap-x snap-mandatory">
                                {availableDrivers.map((driver) => {
                                    const imageToUse = driver.leftImageUrl || driver.rightImageUrl || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop";
                                    const estFare = Math.round((driver.baseFare || 50) + ((driver.pricePerKm || 10) * routeInfo.distance));

                                    return (
                                        <div key={driver.partnerId} className="snap-center shrink-0 w-[280px] bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm flex flex-col">

                                            {/* Image & Badges */}
                                            <div className="relative h-40 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800">

                                                <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-transparent z-10" />

                                                <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm z-20">
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-[10px] font-bold text-black dark:text-white">4.8</span>
                                                </div>

                                                <div className="absolute top-3 right-3 bg-black/90 dark:bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm z-20">
                                                    <Zap className="w-3 h-3 text-white dark:text-black" />
                                                    <span className="text-[10px] font-black tracking-widest text-white dark:text-black uppercase">{vehicle}</span>
                                                </div>
                                                <img
                                                    src={imageToUse}
                                                    alt={driver.vehicleModel}
                                                    className="w-full h-full object-cover relative z-0 hover:scale-110 transition-transform duration-700 ease-out"
                                                />
                                            </div>

                                            {/* Vehicle Info */}
                                            <div className="flex justify-between items-center mt-4 mb-4">
                                                <div>
                                                    <h3 className="font-black text-base text-black dark:text-white capitalize">{driver.vehicleModel || "Standard Ride"}</h3>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{driver.vehicleNumber}</p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700">
                                                    <Navigation className="w-3.5 h-3.5 text-gray-400 -rotate-45" />
                                                </div>
                                            </div>

                                            {/* Pricing Breakdown */}
                                            <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-50 dark:border-gray-800/50">
                                                <div>
                                                    <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase mb-1">Per Km</p>
                                                    <p className="font-bold text-sm text-black dark:text-white">₹{driver.pricePerKm || 10}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase mb-1">Waiting</p>
                                                    <p className="font-bold text-sm text-black dark:text-white">₹{driver.waitingCharge || 2}/min</p>
                                                </div>
                                            </div>

                                            {/* Footer Checkout */}
                                            <div className="flex items-center justify-between mt-auto pt-2">
                                                <div>
                                                    <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-0.5">Est. Fare</p>
                                                    <p className="font-black text-2xl text-black dark:text-white tracking-tight">₹{estFare}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleBook(driver, estFare)}
                                                    className="bg-black dark:bg-white text-white dark:text-black font-black text-sm px-6 py-3.5 rounded-xl flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                                                >
                                                    Book <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" />
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}