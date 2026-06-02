"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { Clock, Phone, Car, Loader2 } from "lucide-react";
import { STATUS_LABEL } from "@/lib/rideStatuses";

const ActiveRideMap = dynamic(() => import("@/components/ActiveRideMap"), { ssr: false });

export default function UserActiveRide() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get("id");

    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [socket, setSocket] = useState<Socket | null>(null);
    const [liveDriverLoc, setLiveDriverLoc] = useState<{ lat: number, lng: number } | null>(null);

    // 1. Fetch initial booking details & start polling
    useEffect(() => {
        if (!bookingId) {
            router.push("/user/bookings");
            return;
        }

        const fetchRideDetails = async () => {
            try {
                const res = await axios.get(`/api/ride/active?id=${bookingId}`);
                setBooking(res.data.booking);
            } catch (error) {
                console.error("Failed to load ride", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRideDetails();

        // Keep checking for bookingStatus changes (e.g., driver arrives, completes ride)
        const interval = setInterval(fetchRideDetails, 5000);
        return () => clearInterval(interval);
    }, [bookingId, router]);

    // 2. Listen to Live Socket GPS Updates from the Driver!
    useEffect(() => {
        if (!booking?.partnerId) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        newSocket.on("connect", () => console.log("Rider Tracking Socket Connected"));

        // When the server bounces the driver's location, catch it here
        newSocket.on("driver_location_updated", (data) => {
            // Ensure we are only tracking OUR driver, not someone else's!
            if (data.partnerId === booking.partnerId) {
                setLiveDriverLoc({ lat: data.lat, lng: data.lng });
            }
        });

        return () => { newSocket.disconnect(); };
    }, [booking?.partnerId]);


    if (isLoading || !booking) {
        return <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#050505]"><Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" /></div>;
    }

    const currentStatus = STATUS_LABEL[booking.bookingStatus] || STATUS_LABEL.IDLE;

    // --- Parse Locations Safely ---
    const parseLoc = (locObj: any) => {
        if (!locObj || !locObj.coordinates) return null;
        const lng = locObj.coordinates[0];
        const lat = locObj.coordinates[1];
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;
        if (lat === 0 && lng === 0) return null;
        return { lat, lng };
    };

    const initialDriverLoc = parseLoc(booking.partner?.location);
    const pickupLoc = parseLoc(booking.pickUpLocation);
    const dropLoc = parseLoc(booking.dropLocation);

    if (!pickupLoc || !dropLoc) {
        return <div className="p-10 text-center text-red-500 font-bold">Location data corrupted for this booking.</div>;
    }

    // priority: 1. Live Socket GPS -> 2. Initial DB GPS -> 3. Fallback to Pickup
    const safeDriverLoc = liveDriverLoc || initialDriverLoc || pickupLoc;

    return (
        <main className="h-screen w-full flex flex-col lg:flex-row bg-gray-50 dark:bg-[#050505] font-sans overflow-hidden">

            {/* LEFT: Map Area */}
            <div className="flex-1 relative h-[50vh] lg:h-full">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 shadow-xl px-5 py-2.5 rounded-full flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.dot} animate-pulse`} />
                        <span className="font-bold text-sm text-black dark:text-white">{currentStatus.label}</span>
                    </motion.div>
                </div>
                <ActiveRideMap driverLoc={safeDriverLoc} pickupLoc={pickupLoc} dropLoc={dropLoc} />
            </div>

            {/* RIGHT: User Panel */}
            <div className="w-full lg:w-[400px] h-[50vh] lg:h-full bg-white dark:bg-[#0a0a0a] flex flex-col border-t lg:border-l border-gray-100 dark:border-gray-900 shadow-2xl z-20">

                <div className="p-6 bg-black dark:bg-[#111] text-white flex justify-between items-center">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Ride Tracker</p>
                        <h2 className="text-2xl font-black">Active Ride</h2>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">ETA</p>
                                <p className="font-black text-lg text-black dark:text-white">-- min</p>
                            </div>
                        </div>
                        <div className="bg-black dark:bg-[#111] border border-black dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4 text-white">
                            <span className="text-lg text-gray-400 font-black">₹</span>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Fare</p>
                                <p className="font-black text-lg text-white">{booking.fare}</p>
                            </div>
                        </div>
                    </div>

                    {/* Driver Card */}
                    <div className="bg-black dark:bg-[#111] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 text-white shadow-lg mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="relative">
                                <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center">
                                    <Car className="w-6 h-6 text-gray-400" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-lg capitalize">{booking.partner?.name || "Driver"}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{booking.vehicle?.model}</p>
                            </div>
                        </div>
                        <div className="bg-gray-900 rounded-xl py-3 text-center text-sm font-black tracking-widest uppercase">
                            {booking.vehicle?.vehicleNumber}
                        </div>
                    </div>

                    <div className="grid grid-cols-1">
                        <button onClick={() => window.open(`tel:${booking.partnerMobileNumber}`)} className="bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 text-black dark:text-white font-bold py-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4" /> Call Driver
                        </button>
                    </div>

                </div>
            </div>
        </main>
    );
}