"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
    ArrowLeft, Bike, Car, Truck, Package,
    MapPin, CheckCircle2, Loader2,
    Phone, Crosshair, Send
} from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import axios from "axios";

// --- Types ---
type VehicleType = "Bike" | "Auto" | "Car" | "Loading" | "Truck";

interface LocationData {
    address: string;
    state: string;
    lat: number;
    lng: number;
}

// --- Data Arrays ---
const VEHICLES: { id: VehicleType; label: string; desc: string; icon: any }[] = [
    { id: "Bike", label: "Bike", desc: "Quick & affordable", icon: Bike },
    { id: "Auto", label: "Auto", desc: "Everyday rides", icon: Car },
    { id: "Car", label: "Car", desc: "Comfort rides", icon: Car },
    { id: "Loading", label: "Loading", desc: "Small cargo", icon: Package },
    { id: "Truck", label: "Truck", desc: "Heavy transport", icon: Truck },
];

const SLIDER_IMAGES = [
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1498887960847-2a5e46312788?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1489824904134-891ab64532f1?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503327431567-3ab5e6e79140?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=1920&auto=format&fit=crop",
];

export default function BookRidePage() {
    const router = useRouter();
    const { showAlert } = useAlert();

    // --- Form States ---
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
    const [mobile, setMobile] = useState("");

    // Origin States
    const [originQuery, setOriginQuery] = useState("");
    const [originData, setOriginData] = useState<LocationData | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    // Destination States
    const [destQuery, setDestQuery] = useState("");
    const [destData, setDestData] = useState<LocationData | null>(null);

    // Autocomplete States
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [activeField, setActiveField] = useState<"origin" | "destination" | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Image Slider State
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // --- Progress Calculation ---
    const isMobileValid = mobile.length === 10 && /^[6-9]\d{9}$/.test(mobile);
    const progressCount = [!!selectedVehicle, isMobileValid, !!originData, !!destData].filter(Boolean).length;

    // --- Background Image Slider Hook ---
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % SLIDER_IMAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // --- On Mount: Auto-Fetch Current Location ---
    useEffect(() => {
        handleAutoLocate();
    }, []);

    // --- GPS Auto-Locate using OpenStreetMap (Nominatim) ---
    const handleAutoLocate = () => {
        if (!navigator.geolocation) {
            showAlert("Geolocation is not supported by your browser.", "error");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const addressData = res.data;

                    if (addressData && addressData.display_name) {
                        const address = addressData.display_name;
                        const state = addressData.address?.state || "unknown";

                        setOriginData({ address, state, lat: latitude, lng: longitude });
                        setOriginQuery(address);
                        setActiveField(null);
                        showAlert("Location pinned successfully!", "success");
                    }
                } catch (error) {
                    showAlert("Failed to decode your location.", "error");
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                showAlert("Please allow location access to auto-fill pickup.", "error");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // --- Debounced Search for OpenStreetMap (leaflet-geosearch) ---
    useEffect(() => {
        const query = activeField === "origin" ? originQuery : destQuery;

        if (!query || query.length < 3 ||
            (activeField === "origin" && query === originData?.address) ||
            (activeField === "destination" && query === destData?.address)) {
            setSuggestions([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const { OpenStreetMapProvider } = await import('leaflet-geosearch');
                // Strict India Filter
                const provider = new OpenStreetMapProvider({
                    params: { countrycodes: 'in', addressdetails: 1 }
                });

                const results = await provider.search({ query });
                setSuggestions(results || []);
            } catch (error) {
                console.error("Geocoding error:", error);
            } finally {
                setIsSearching(false);
            }
        }, 800); // 800ms debounce prevents rate-limiting issues on Nominatim

        return () => clearTimeout(timeoutId);
    }, [originQuery, destQuery, activeField, originData, destData]);

    // --- Select Suggestion ---
    const handleSelectSuggestion = (result: any) => {
        const address = result.label;
        const lat = result.y;
        const lng = result.x;
        const state = result.raw?.address?.state || "unknown";

        if (activeField === "origin") {
            setOriginData({ address, state, lat, lng });
            setOriginQuery(address);
            setDestData(null);
            setDestQuery("");
        } else if (activeField === "destination") {
            setDestData({ address, state, lat, lng });
            setDestQuery(address);
        }

        setActiveField(null);
        setSuggestions([]);
    };

    // --- Fallback: Force Custom Location Entry ---
    const handleCustomLocation = () => {
        const query = activeField === "origin" ? originQuery : destQuery;

        if (activeField === "origin") {
            setOriginData({ address: query, state: "custom", lat: 0, lng: 0 });
            setOriginQuery(query);
            setDestData(null);
            setDestQuery("");
        } else if (activeField === "destination") {
            setDestData({ address: query, state: "custom", lat: 0, lng: 0 });
            setDestQuery(query);
        }

        setActiveField(null);
        setSuggestions([]);
    };

    const handleContinue = () => {
        if (progressCount < 4) {
            showAlert("Please complete all details to continue.", "error");
            return;
        }
        showAlert("Finding your captain...", "success");
        router.push(`/user/search?vehicle=${selectedVehicle}&mobile=${mobile}&oLat=${originData?.lat}&oLng=${originData?.lng}&dLat=${destData?.lat}&dLng=${destData?.lng}&oAddr=${encodeURIComponent(originData?.address || '')}&dAddr=${encodeURIComponent(destData?.address || '')}`);
    };

    const currentQuery = activeField === "origin" ? originQuery : destQuery;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-300 font-sans p-4 lg:p-0 flex items-center justify-center lg:items-stretch lg:justify-start">

            {/* --- BOOKING FORM SIDEBAR --- */}
            <div className="w-full max-w-[400px] lg:max-w-[480px] lg:w-[480px] h-[90vh] lg:h-screen max-h-[850px] lg:max-h-screen bg-white dark:bg-[#0a0a0a] rounded-4xl lg:rounded-none shadow-2xl lg:shadow-[20px_0_40px_-15px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-900 lg:border-0 lg:border-r overflow-hidden flex flex-col relative z-20 shrink-0">

                {/* HEADER */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between bg-white dark:bg-[#0a0a0a] z-20 shrink-0">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-black dark:text-white leading-tight">Book a Ride</h1>
                            <p className="text-xs text-gray-500 font-medium">Fill in the details below</p>
                        </div>
                    </div>

                    <div className="flex space-x-1.5">
                        {[0, 1, 2, 3].map((idx) => (
                            <motion.div
                                key={idx}
                                animate={{ width: idx < progressCount ? 20 : 8 }}
                                className={`h-2 rounded-full transition-colors duration-300 ${idx < progressCount ? "bg-black dark:bg-white" : "bg-gray-300 dark:bg-gray-700"}`}
                            />
                        ))}
                    </div>
                </div>

                {/* SCROLLABLE FORM */}
                <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-10">

                    {/* STEP 1: CHOOSE VEHICLE */}
                    <section>
                        <h2 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white flex items-center justify-center text-[10px]">1</span>
                            Choose Vehicle
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {VEHICLES.map((v) => {
                                const isActive = selectedVehicle === v.id;
                                const Icon = v.icon;
                                return (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVehicle(v.id)}
                                        className={`relative p-4 rounded-2xl border transition-all duration-300 text-left ${isActive ? "bg-black dark:bg-white border-transparent text-white dark:text-black shadow-lg" : "bg-white dark:bg-[#0a0a0a] border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-black dark:text-white"}`}
                                    >
                                        <Icon className="w-6 h-6 mb-3" />
                                        <h3 className="font-bold text-sm leading-tight">{v.label}</h3>
                                        <p className={`text-[10px] mt-1 ${isActive ? "text-gray-300 dark:text-gray-600" : "text-gray-400"}`}>{v.desc}</p>
                                        {isActive && <CheckCircle2 className="absolute top-4 right-4 w-4 h-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* STEP 2: MOBILE */}
                    <section>
                        <h2 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white flex items-center justify-center text-[10px]">2</span>
                            Mobile Number
                        </h2>
                        <div className={`relative rounded-2xl transition-colors border-2 ${isMobileValid ? "border-green-500 bg-green-50/30 dark:bg-green-900/10" : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50"}`}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-500">
                                <Phone className="w-5 h-5" />
                                <span className="text-sm font-bold border-r border-gray-200 dark:border-gray-700 pr-3">+91</span>
                            </div>
                            <input
                                type="tel"
                                placeholder="Enter 10 digit number"
                                value={mobile}
                                onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length === 1 && !/^[6-9]/.test(val)) return;
                                    if (val.length > 10) val = val.slice(0, 10);
                                    setMobile(val);
                                }}
                                className="w-full bg-transparent py-4 pl-24 pr-12 text-sm text-black dark:text-white font-bold focus:outline-none placeholder:font-medium placeholder:text-gray-400"
                            />
                            {isMobileValid && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                        </div>
                    </section>

                    {/* STEP 3 & 4: ROUTE */}
                    <section className="relative">
                        <h2 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white flex items-center justify-center text-[10px]">3</span>
                            Route
                        </h2>

                        <div className="space-y-3 relative">
                            {/* Origin Input */}
                            <div className="relative z-10">
                                <div className={`flex items-center bg-gray-50/50 dark:bg-gray-900/50 border-2 rounded-2xl focus-within:border-black dark:focus-within:border-white transition-colors ${originData ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800'}`}>
                                    <div className="pl-4 pr-2">
                                        <div className="w-3 h-3 rounded-full bg-black dark:bg-white" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter Pickup Location"
                                        value={originQuery}
                                        onChange={(e) => {
                                            setOriginQuery(e.target.value);
                                            setActiveField("origin");
                                            if (originData) setOriginData(null);
                                        }}
                                        onFocus={() => setActiveField("origin")}
                                        className="flex-1 bg-transparent py-4 text-sm font-bold text-black dark:text-white focus:outline-none truncate placeholder:font-medium placeholder:text-gray-400"
                                    />
                                    <button onClick={handleAutoLocate} disabled={isLocating} className="pr-4 pl-2 hover:opacity-70 transition-opacity">
                                        {isLocating ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <Crosshair className="w-5 h-5 text-gray-400" />}
                                    </button>
                                </div>
                            </div>

                            {/* Destination Input */}
                            <div className="relative z-10">
                                <div className={`flex items-center bg-gray-50/50 dark:bg-gray-900/50 border-2 rounded-2xl transition-colors ${!originData ? 'opacity-50 cursor-not-allowed border-gray-100' : 'focus-within:border-black dark:focus-within:border-white border-gray-100 dark:border-gray-800'}`}>
                                    <div className="pl-4 pr-2">
                                        <div className="w-3 h-3 rounded-sm bg-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={originData ? "Where to?" : "Set pickup first"}
                                        value={destQuery}
                                        disabled={!originData}
                                        onChange={(e) => {
                                            setDestQuery(e.target.value);
                                            setActiveField("destination");
                                            if (destData) setDestData(null);
                                        }}
                                        onFocus={() => originData && setActiveField("destination")}
                                        className="flex-1 bg-transparent py-4 text-sm font-bold text-black dark:text-white focus:outline-none truncate disabled:cursor-not-allowed placeholder:font-medium placeholder:text-gray-400"
                                    />
                                    <div className="pr-4 pl-2">
                                        <Send className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Autocomplete Suggestions Floating Window */}
                            <AnimatePresence>
                                {activeField && (suggestions.length > 0 || currentQuery.length > 2) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                        className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                                    >
                                        {isSearching && <div className="h-0.5 w-full bg-gray-50"><div className="h-full bg-black w-1/3 animate-pulse" /></div>}

                                        {/* CUSTOM FALLBACK AT THE TOP */}
                                        {currentQuery.length > 2 && (
                                            <button
                                                onClick={handleCustomLocation}
                                                className="w-full text-left px-5 py-4 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center space-x-3 text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-800"
                                            >
                                                <MapPin className="w-5 h-5 shrink-0" />
                                                <span className="font-bold text-sm truncate">Use "{currentQuery}"</span>
                                            </button>
                                        )}

                                        {/* API Results BELOW */}
                                        {suggestions.map((s: any, i: number) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSelectSuggestion(s)}
                                                className="w-full text-left px-5 py-4 border-b border-gray-50 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex flex-col last:border-0"
                                            >
                                                <span className="font-bold text-sm text-black dark:text-white truncate">
                                                    {s.label.split(',')[0]} {/* Primary Location Name */}
                                                </span>
                                                <span className="text-xs text-gray-500 truncate mt-1">
                                                    {s.label} {/* Full Address */}
                                                </span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                </div>

                {/* FIXED BOTTOM ACTION */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-900 bg-white dark:bg-[#0a0a0a] z-30 shrink-0">
                    <button
                        onClick={handleContinue}
                        disabled={progressCount < 4}
                        className="w-full bg-black dark:bg-white text-white dark:text-black font-black text-base py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform shadow-lg"
                    >
                        Continue
                    </button>
                </div>
            </div>

            {/* DESKTOP HERO SECTION */}
            <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center overflow-hidden">
                <AnimatePresence>
                    <motion.img
                        key={currentImageIndex}
                        src={SLIDER_IMAGES[currentImageIndex]}
                        alt="Driving Dashboard Hero"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </AnimatePresence>
                <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-transparent z-10" />
                <div className="relative z-20 max-w-2xl px-16 text-white w-full">
                    <h1 className="text-6xl xl:text-7xl font-black mb-6 tracking-tight leading-tight">
                        Book Any <br /><span className="text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400">Vehicle.</span>
                    </h1>
                    <p className="text-xl font-medium text-gray-300 max-w-lg leading-relaxed">
                        From daily commutes to heavy transport — all in one platform. Secure, fast, and strictly regulated for your safety.
                    </p>
                    <div className="flex gap-8 mt-12 opacity-60">
                        <Bike className="w-8 h-8" />
                        <Car className="w-8 h-8" />
                        <Truck className="w-8 h-8" />
                    </div>
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