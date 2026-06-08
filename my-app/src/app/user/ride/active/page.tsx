"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { Phone, Car, Loader2, MessageSquare, CheckCircle2, Home, Mail, User, ArrowLeft, XCircle, AlertTriangle } from "lucide-react";
import { STATUS_LABEL } from "@/lib/rideStatuses";
import RideChat from "@/components/RideChat";

const ActiveRideMap = dynamic(() => import("@/components/ActiveRideMap"), { ssr: false });

function calculateETA(lat1: number, lon1: number, lat2: number, lon2: number, speedKmph = 30) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "--";
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    const timeHours = distance / speedKmph;
    const timeMins = Math.round(timeHours * 60);
    return timeMins < 1 ? 1 : timeMins;
}

function UserActiveRideContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get("id");

    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [liveDriverLoc, setLiveDriverLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

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
        newSocket.on("driver_location_updated", (data) => {
            if (data.partnerId === booking.partnerId) {
                setLiveDriverLoc({ lat: data.lat, lng: data.lng });
            }
        });
        newSocket.on("ride_updated", () => fetchRideDetails());

        return () => { newSocket.disconnect(); };
    }, [booking?.partnerId, booking?.userId]);

    // --- Custom Modal Cancel Action ---
    const confirmCancelRide = async () => {
        setIsCancelling(true);
        try {
            await axios.post("/api/user/booking/cancel", { bookingId });
            socket?.emit("ride_cancelled", { partnerId: booking.partnerId, bookingId });
            router.push("/user/bookings");
        } catch (error) {
            console.error("Failed to cancel ride.");
            setIsCancelling(false);
            setShowCancelModal(false);
        }
    };

    if (isLoading || !booking) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#050505]"><Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" /></div>;

    const currentStatus = STATUS_LABEL[booking.bookingStatus] || STATUS_LABEL.IDLE;
    const isCompleted = booking.bookingStatus === "COMPLETED";

    const pendingOtpType = (booking.bookingStatus === "CONFIRMED" && booking.pickUpOtp) ? "Pickup"
        : (booking.bookingStatus === "STARTED" && booking.dropOtp) ? "Drop" : null;

    const parseLoc = (locObj: any) => {
        if (!locObj || !locObj.coordinates) return null;
        if (locObj.coordinates[1] === 0 && locObj.coordinates[0] === 0) return null;
        return { lat: locObj.coordinates[1], lng: locObj.coordinates[0] };
    };

    const pickupLoc = parseLoc(booking.pickUpLocation);
    const dropLoc = parseLoc(booking.dropLocation);
    const safeDriverLoc = liveDriverLoc || parseLoc(booking.partner?.location) || pickupLoc;

    let dynamicEta: string | number = "--";
    if (safeDriverLoc) {
        if (booking.bookingStatus === "CONFIRMED" && pickupLoc) {
            dynamicEta = calculateETA(safeDriverLoc.lat, safeDriverLoc.lng, pickupLoc.lat, pickupLoc.lng);
        } else if (booking.bookingStatus === "STARTED" && dropLoc) {
            dynamicEta = calculateETA(safeDriverLoc.lat, safeDriverLoc.lng, dropLoc.lat, dropLoc.lng);
        }
    }

    return (
        <main className="h-dvh w-full flex flex-col lg:flex-row bg-gray-50 dark:bg-[#050505] font-sans overflow-hidden relative">

            {/* Custom Cancel Modal Overlay */}
            <AnimatePresence>
                {showCancelModal && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-black dark:text-white mb-2">Cancel Ride?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                                {booking.paymentStatus === "CASH"
                                    ? "Are you sure you want to cancel this ride? Your driver is already assigned."
                                    : "Are you sure you want to cancel? Since you paid online, the amount will not be refunded."}
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowCancelModal(false)} disabled={isCancelling} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    No, Keep Ride
                                </button>
                                <button onClick={confirmCancelRide} disabled={isCancelling} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50">
                                    {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Cancel"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {!isCompleted && (
                <div className="absolute top-6 left-6 z-40">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#111] shadow-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
                    </button>
                </div>
            )}

            {/* MAP SECTION */}
            <div className={`absolute inset-0 z-0 lg:relative lg:flex-1 lg:h-full lg:order-last ${isCompleted ? "hidden" : "block"}`}>
                <div className="absolute top-12 lg:top-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 shadow-xl px-5 py-2.5 rounded-full flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.dot} animate-pulse shadow-[0_0_10px_currentColor]`} />
                        <span className="font-bold text-sm text-black dark:text-white uppercase tracking-wider">{currentStatus.label}</span>
                    </motion.div>
                </div>
                {pickupLoc && dropLoc && <ActiveRideMap driverLoc={safeDriverLoc} pickupLoc={pickupLoc} dropLoc={dropLoc} />}
            </div>

            {/* PANEL SECTION */}
            <div className={`
                absolute bottom-0 left-0 w-full z-20 pointer-events-none flex justify-center
                lg:relative lg:h-full lg:pointer-events-auto lg:order-first lg:shadow-[10px_0_40px_rgba(0,0,0,0.05)]
                ${isCompleted ? "lg:w-full h-full z-50 bg-white dark:bg-[#0a0a0a] pointer-events-auto" : "lg:w-[450px]"}
            `}>
                <div className={`
                    w-full bg-white dark:bg-[#0a0a0a] pointer-events-auto flex flex-col transition-transform duration-500
                    rounded-t-4xl lg:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none
                    ${isCompleted ? "h-full justify-center max-h-full" : "max-h-[55vh] lg:max-h-none lg:h-full"}
                `}>

                    {isCompleted ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto w-full h-full">
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

                            <button onClick={() => router.push("/")} className="w-full mt-4 bg-black dark:bg-white text-white dark:text-black font-bold py-5 rounded-2xl transition-transform hover:scale-105 shadow-xl flex justify-center items-center gap-2">
                                <Home className="w-5 h-5" /> Back To Home
                            </button>
                        </motion.div>
                    ) : (
                        <>
                            <div className="w-full flex justify-center pt-4 pb-2 shrink-0 lg:hidden">
                                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 pb-6 lg:pt-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-black dark:text-white leading-none">{currentStatus.label}</h2>
                                        <p className="text-sm text-gray-500 font-medium mt-1">
                                            {booking.bookingStatus === "CONFIRMED" ? "Driver is on the way" : "Heading to destination"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Time</p>
                                        <div className="flex items-center justify-end gap-1 font-black text-xl text-black dark:text-white">
                                            {dynamicEta} <span className="text-sm font-bold text-gray-500">min</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black dark:bg-[#111] rounded-3xl p-5 text-white shadow-xl mb-4 border border-gray-900">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700">
                                                    <User className="w-6 h-6 text-gray-300" />
                                                </div>
                                                <div className="absolute -bottom-1.5 -right-1.5 bg-green-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black uppercase tracking-wider">
                                                    4.9 ★
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl capitalize">{booking.partner?.name || "Driver"}</h3>
                                                <div className="bg-white/10 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase w-max mt-1 tracking-wider border border-white/10">
                                                    {booking.paymentStatus === "CASH" ? "Cash Ride" : "Paid Online"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Total Fare</p>
                                            <p className="font-black text-xl">₹{booking.fare}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => window.open(`tel:${booking.partnerMobileNumber}`)} className="flex-1 bg-white text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                                            <Phone className="w-4 h-4" /> Call
                                        </button>
                                        <button onClick={() => setIsChatOpen(true)} className="flex-1 bg-gray-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors border border-gray-700">
                                            <MessageSquare className="w-4 h-4" /> Message
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white dark:bg-black rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-800">
                                            <Car className="w-5 h-5 text-black dark:text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</p>
                                            <p className="font-bold text-sm text-black dark:text-white capitalize">{booking.vehicle?.model}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-black px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 font-black tracking-widest uppercase text-sm shadow-sm">
                                        {booking.vehicle?.vehicleNumber}
                                    </div>
                                </div>

                                <div className="relative pl-6 space-y-6 py-2 mb-6">
                                    <div className="absolute left-[9px] top-3 bottom-5 w-0.5 bg-gray-200 dark:bg-gray-800" />
                                    <div className="relative z-10">
                                        <div className="absolute left-[-26px] top-1 w-4 h-4 bg-black dark:bg-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a0a0a]">
                                            <div className="w-1 h-1 bg-white dark:bg-black rounded-full" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup</p>
                                        <p className="font-bold text-sm text-black dark:text-white line-clamp-2 pr-4">{booking.pickUpAddress}</p>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="absolute left-[-26px] top-1 w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-sm border-2 border-white dark:border-[#0a0a0a]" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Drop</p>
                                        <p className="font-bold text-sm text-black dark:text-white line-clamp-2 pr-4">{booking.dropAddress}</p>
                                    </div>
                                </div>

                                <AnimatePresence mode="popLayout">
                                    {pendingOtpType && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm mb-4">
                                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center shrink-0">
                                                <Mail className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-red-700 dark:text-red-400">Share {pendingOtpType} OTP</p>
                                                <p className="text-xs font-medium text-red-600/80 dark:text-red-400/80 mt-0.5">Please check your email and share the code with driver.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Trigger Cancel Modal */}
                                <div className="mt-8 flex justify-center pb-4">
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors text-xs font-bold uppercase tracking-widest"
                                    >
                                        <XCircle className="w-4 h-4" /> Cancel Ride
                                    </button>
                                </div>

                            </div>
                        </>
                    )}
                </div>
            </div>

            {!isCompleted && <RideChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} bookingId={booking.id} currentUserId={booking.userId} otherUserId={booking.partnerId} otherUserName={booking.partner?.name || "Driver"} role="USER" socket={socket} />}
        </main>
    );
}

export default function UserActiveRide() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#050505]"><Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" /></div>}>
            <UserActiveRideContent />
        </Suspense>
    );
}