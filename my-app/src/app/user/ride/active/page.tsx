"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { Clock, Phone, Car, Loader2, MessageSquare, MapPin, Navigation, CheckCircle2, Home, Mail } from "lucide-react";
import { STATUS_LABEL } from "@/lib/rideStatuses";
import RideChat from "@/components/RideChat";

const ActiveRideMap = dynamic(() => import("@/components/ActiveRideMap"), { ssr: false });

export default function UserActiveRide() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get("id");

    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [liveDriverLoc, setLiveDriverLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

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

    useEffect(() => {
        if (!bookingId) { router.push("/user/bookings"); return; }
        fetchRideDetails();
        const interval = setInterval(fetchRideDetails, 5000);
        return () => clearInterval(interval);
    }, [bookingId, router]);

    useEffect(() => {
        if (!booking?.partnerId || !booking?.userId) return;
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        newSocket.on("connect", () => newSocket.emit("register_user", booking.userId));
        newSocket.on("driver_location_updated", (data) => { if (data.partnerId === booking.partnerId) setLiveDriverLoc({ lat: data.lat, lng: data.lng }); });
        newSocket.on("ride_updated", () => fetchRideDetails());

        return () => { newSocket.disconnect(); };
    }, [booking?.partnerId, booking?.userId]);


    if (isLoading || !booking) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#050505]"><Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" /></div>;

    const currentStatus = STATUS_LABEL[booking.bookingStatus] || STATUS_LABEL.IDLE;
    const isCompleted = booking.bookingStatus === "COMPLETED";

    // Check if we need to show OTP instructions
    const pendingOtpType = (booking.bookingStatus === "CONFIRMED" && booking.pickUpOtp) ? "Pickup"
        : (booking.bookingStatus === "STARTED" && booking.dropOtp) ? "Drop" : null;

    const parseLoc = (locObj: any) => {
        if (!locObj || !locObj.coordinates) return null;
        if (locObj.coordinates[1] === 0 && locObj.coordinates[0] === 0) return null;
        return { lat: locObj.coordinates[1], lng: locObj.coordinates[0] };
    };

    const initialDriverLoc = parseLoc(booking.partner?.location);
    const pickupLoc = parseLoc(booking.pickUpLocation);
    const dropLoc = parseLoc(booking.dropLocation);
    const safeDriverLoc = liveDriverLoc || initialDriverLoc || pickupLoc;

    return (
        <main className="h-screen w-full flex flex-col lg:flex-row bg-gray-50 dark:bg-[#050505] font-sans overflow-hidden">

            {/* MAP */}
            {!isCompleted && (
                <div className="flex-1 relative h-[50vh] lg:h-full">
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 shadow-xl px-5 py-2.5 rounded-full flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.dot} animate-pulse`} />
                            <span className="font-bold text-sm text-black dark:text-white">{currentStatus.label}</span>
                        </motion.div>
                    </div>
                    {pickupLoc && dropLoc && <ActiveRideMap driverLoc={safeDriverLoc} pickupLoc={pickupLoc} dropLoc={dropLoc} />}
                </div>
            )}

            {/* PANEL */}
            <div className={`${isCompleted ? "w-full" : "w-full lg:w-[450px]"} h-[50vh] lg:h-full bg-white dark:bg-[#0a0a0a] flex flex-col shadow-2xl z-20 transition-all duration-500`}>

                {isCompleted ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto w-full">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Trip Complete</p>
                        <h2 className="text-4xl font-black text-black dark:text-white mb-2">Ride Completed !</h2>
                        <p className="text-gray-500 mb-10 text-sm">You have successfully reached your destination.</p>

                        <div className="w-full bg-gray-50 dark:bg-[#111] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Fare</p>
                            <h3 className="text-5xl font-black text-black dark:text-white mb-6">₹ {booking.fare}</h3>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-800">
                                <span className="text-xs font-bold text-gray-500">Payment Status</span>
                                <span className="bg-white dark:bg-black text-black dark:text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border border-gray-200 dark:border-gray-800">{booking.paymentStatus}</span>
                            </div>
                        </div>

                        <div className="w-full bg-black dark:bg-[#111] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex items-center gap-4 mb-8 text-white">
                            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center"><Car className="w-5 h-5 text-gray-400" /></div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Driver</p>
                                <p className="font-bold capitalize">{booking.partner?.name}</p>
                            </div>
                        </div>

                        <button onClick={() => router.push("/")} className="w-full bg-transparent border border-gray-200 dark:border-gray-800 text-black dark:text-white font-bold py-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#111] transition-colors flex justify-center items-center gap-2">
                            <Home className="w-4 h-4" /> Back To Home
                        </button>
                    </motion.div>
                ) : (
                    <>
                        <div className="p-6 bg-black dark:bg-[#111] text-white flex justify-between items-center">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Ride Tracker</p>
                                <h2 className="text-2xl font-black">Active Ride</h2>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">

                            {/* Address Block */}
                            <div className="relative pl-8 space-y-6 py-2">
                                <div className="absolute left-[11px] top-3 bottom-5 w-0.5 bg-gray-200 dark:bg-gray-800" />
                                <div className="relative z-10">
                                    <div className="absolute left-[-33px] top-0 w-7 h-7 bg-black dark:bg-white rounded-full flex items-center justify-center border-[3px] border-white dark:border-[#0a0a0a] shadow-sm"><MapPin className="w-3 h-3 text-white dark:text-black" /></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup</p>
                                    <p className="font-bold text-sm text-black dark:text-white line-clamp-2 pr-4">{booking.pickUpAddress}</p>
                                </div>
                                <div className="relative z-10">
                                    <div className="absolute left-[-33px] top-0 w-7 h-7 bg-gray-200 dark:bg-gray-800 rounded-sm flex items-center justify-center border-[3px] border-white dark:border-[#0a0a0a] shadow-sm"><Navigation className="w-3 h-3 text-gray-500" /></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Drop</p>
                                    <p className="font-bold text-sm text-black dark:text-white line-clamp-2 pr-4">{booking.dropAddress}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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

                            {/* OTP NOTIFICATION BANNER */}
                            <AnimatePresence mode="popLayout">
                                {pendingOtpType && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-3xl p-6 text-center flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-blue-700 dark:text-blue-400 mb-1">What to do when Driver arrives?</h3>
                                            <p className="text-sm font-bold text-blue-600/80 dark:text-blue-300/80">
                                                When Driver arrives, please check your email for the {pendingOtpType} OTP and share it with your driver to continue.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Driver Card */}
                            <div className="bg-black dark:bg-[#111] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 text-white shadow-lg mt-auto">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="relative">
                                        <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center"><Car className="w-6 h-6 text-gray-400" /></div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-lg capitalize">{booking.partner?.name || "Driver"}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{booking.vehicle?.model}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-900 rounded-xl py-3 text-center text-sm font-black tracking-widest uppercase">{booking.vehicle?.vehicleNumber}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => window.open(`tel:${booking.partnerMobileNumber}`)} className="bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 text-black dark:text-white font-bold py-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                                    <Phone className="w-4 h-4" /> Call
                                </button>
                                <button onClick={() => setIsChatOpen(true)} className="bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Message
                                </button>
                            </div>

                        </div>
                    </>
                )}
            </div>

            {!isCompleted && <RideChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} bookingId={booking.id} currentUserId={booking.userId} otherUserId={booking.partnerId} otherUserName={booking.partner?.name || "Driver"} role="USER" socket={socket} />}
        </main>
    );
}