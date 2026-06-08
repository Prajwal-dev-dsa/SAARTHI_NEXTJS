"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Phone, MessageSquare, User, Loader2, CheckCircle2, Home, ArrowLeft, XCircle } from "lucide-react";
import { STATUS_LABEL } from "@/lib/rideStatuses";
import RideChat from "@/components/RideChat";
import { useAlert } from "@/context/AlertContext";
import { io, Socket } from "socket.io-client";

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

function PartnerActiveRideContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get("id");
    const { user } = useSelector((state: RootState) => state.auth);
    const { showAlert } = useAlert();

    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [liveDriverLoc, setLiveDriverLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [otpValues, setOtpValues] = useState(["", "", "", ""]);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);

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
        if (!bookingId) {
            router.push("/");
            showAlert("No active ride found", "error")
            return;
        }
        fetchRideDetails();
    }, [bookingId, router]);

    // REAL-TIME SOCKET CONNECTION
    useEffect(() => {
        if (!user?.id) return;
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        newSocket.on("connect", () => newSocket.emit("register_partner", user.id));
        newSocket.on("ride_updated", () => fetchRideDetails());

        // Instant Notification if Rider Cancels
        newSocket.on("ride_cancelled", (data) => {
            if (data.bookingId === bookingId) {
                fetchRideDetails();
                showAlert("The rider has cancelled this booking.", "error");
            }
        });

        return () => { newSocket.disconnect(); };
    }, [user?.id, bookingId, showAlert]);

    useEffect(() => {
        if (!navigator.geolocation || !socket || !user?.id) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setLiveDriverLoc({ lat, lng });
                socket.emit("update_location", { userId: user.id, lat, lng });
            },
            (err) => console.warn("GPS Warning:", err.message),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [socket, user?.id]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otpValues];
        newOtp[index] = value.slice(-1);
        setOtpValues(newOtp);
        if (value !== "" && index < 3) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && otpValues[index] === "" && index > 0) otpRefs.current[index - 1]?.focus();
    };

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 4).replace(/\D/g, "");
        if (pastedData) {
            const newOtp = [...otpValues];
            for (let i = 0; i < pastedData.length; i++) newOtp[i] = pastedData[i];
            setOtpValues(newOtp);
            otpRefs.current[Math.min(pastedData.length, 3)]?.focus();
        }
    };

    const sendOtp = async (type: "PICKUP" | "DROP") => {
        setIsProcessing(true);
        try {
            await axios.post("/api/ride/otp/send", { bookingId, type });
            socket?.emit("ride_updated", { partnerId: booking.partnerId, userId: booking.userId });
            showAlert(`OTP successfully sent to rider for ${type}`, "success");
            fetchRideDetails();
        } catch (error) {
            showAlert("Failed to send OTP. Please try again.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const verifyOtp = async (type: "PICKUP" | "DROP") => {
        const otpStr = otpValues.join("");
        if (otpStr.length !== 4) return showAlert("Please enter 4 digit OTP", "error");

        setIsVerifying(true);
        try {
            await axios.post("/api/ride/otp/verify", { bookingId, type, otp: otpStr });
            socket?.emit("ride_updated", { partnerId: booking.partnerId, userId: booking.userId });
            showAlert(`${type} Verified successfully!`, "success");
            setOtpValues(["", "", "", ""]);
            fetchRideDetails();
        } catch (error: any) {
            showAlert(error.response?.data?.error || "Invalid OTP", "error");
        } finally {
            setIsVerifying(false);
        }
    };

    if (isLoading || !booking) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#050505]"><Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" /></div>;

    const currentStatus = STATUS_LABEL[booking.bookingStatus] || STATUS_LABEL.IDLE;
    const isCompleted = booking.bookingStatus === "COMPLETED";
    const isCancelled = booking.bookingStatus === "CANCELLED" || booking.bookingStatus === "REJECTED";

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
            
            {/* Floating Top Left Back Button Overlay */}
            {(!isCompleted && !isCancelled) && (
                <div className="absolute top-6 left-6 z-40">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#111] shadow-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
                    </button>
                </div>
            )}

            {/* MAP SECTION */}
            <div className={`absolute inset-0 z-0 lg:relative lg:flex-1 lg:h-full lg:order-last ${(isCompleted || isCancelled) ? "hidden" : "block"}`}>
                <div className="absolute top-12 lg:top-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 shadow-xl px-6 py-3 rounded-full flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${currentStatus.dot} animate-pulse shadow-[0_0_10px_currentColor]`} />
                        <span className="font-black text-sm text-black dark:text-white uppercase tracking-wider">{currentStatus.label}</span>
                    </motion.div>
                </div>
                {pickupLoc && dropLoc && <ActiveRideMap driverLoc={safeDriverLoc} pickupLoc={pickupLoc} dropLoc={dropLoc} />}
            </div>

            {/* PANEL SECTION */}
            <div className={`
                absolute bottom-0 left-0 w-full z-20 pointer-events-none flex justify-center
                lg:relative lg:h-full lg:pointer-events-auto lg:order-first lg:shadow-[10px_0_40px_rgba(0,0,0,0.05)]
                ${(isCompleted || isCancelled) ? "lg:w-full h-full z-50 bg-white dark:bg-[#0a0a0a] pointer-events-auto" : "lg:w-[450px]"}
            `}>
                <div className={`
                    w-full bg-white dark:bg-[#0a0a0a] pointer-events-auto flex flex-col transition-transform duration-500
                    rounded-t-4xl lg:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none
                    ${(isCompleted || isCancelled) ? "h-full justify-center max-h-full" : "max-h-[55vh] lg:max-h-none lg:h-full"}
                `}>

                    {isCancelled ? (
                        // CANCELLED RIDE
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto w-full h-full">
                            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.4)]">
                                    <XCircle className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Ride Cancelled</p>
                            <h2 className="text-4xl font-black text-black dark:text-white mb-2">Ride Cancelled</h2>
                            <p className="text-gray-500 mb-10 text-sm">The rider has cancelled this journey. You can safely return to your dashboard to accept new rides.</p>

                            <div className="w-full bg-gray-50 dark:bg-[#111] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Status Update</p>
                                <h3 className="text-2xl font-black text-red-600 dark:text-red-500 mb-6 mt-2">Cancelled by Rider</h3>
                                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <span className="text-xs font-bold text-gray-500">Action Required</span>
                                    <button onClick={() => router.push("/partner/requests")} className="bg-white dark:bg-black text-black dark:text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border border-gray-200 dark:border-gray-800">Go to Pending Requests</button>
                                </div>
                            </div>

                            <button onClick={() => router.push("/")} className="w-full mt-4 bg-black dark:bg-white text-white dark:text-black font-bold py-5 rounded-2xl transition-transform hover:scale-105 shadow-xl flex justify-center items-center gap-2">
                                <Home className="w-5 h-5" /> Return Home
                            </button>
                        </motion.div>
                    ) : isCompleted ? (
                        // COMPLETED RIDE
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto w-full h-full">
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Trip Complete</p>
                            <h2 className="text-4xl font-black text-black dark:text-white mb-2">Ride Completed !</h2>
                            <p className="text-gray-500 mb-10 text-sm">You have successfully dropped the customer.</p>

                            <div className="w-full bg-gray-50 dark:bg-[#111] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Fare Collected</p>
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
                        // ACTIVE RIDE BOTTOM SHEET
                        <>
                            <div className="w-full flex justify-center pt-4 pb-2 shrink-0 lg:hidden">
                                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 pb-6 lg:pt-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-black dark:text-white leading-none">{currentStatus.label}</h2>
                                        <p className="text-sm text-gray-500 font-medium mt-1">
                                            {booking.bookingStatus === "CONFIRMED" ? "Drive to the pickup location" : "Drive to destination"}
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
                                                <h3 className="font-black text-xl capitalize">{booking.user?.name || "Rider"}</h3>
                                                <div className="bg-white/10 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase w-max mt-1 tracking-wider border border-white/10">
                                                    {booking.paymentStatus === "CASH" ? "Cash Ride" : "Paid Online"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Your Fare</p>
                                            <p className="font-black text-xl text-green-400">₹{booking.partnerAmount}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => window.open(`tel:${booking.userMobileNumber}`)} className="flex-1 bg-white text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                                            <Phone className="w-4 h-4" /> Call
                                        </button>
                                        <button onClick={() => setIsChatOpen(true)} className="flex-1 bg-gray-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors border border-gray-700">
                                            <MessageSquare className="w-4 h-4" /> Message
                                        </button>
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

                                <div className="mt-auto">
                                    <AnimatePresence mode="wait">
                                        {booking.bookingStatus === "CONFIRMED" && !booking.pickUpOtp && (
                                            <motion.button key="pickup-send" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                onClick={() => sendOtp("PICKUP")} disabled={isProcessing}
                                                className="w-full bg-black dark:bg-white text-white dark:text-black font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2"
                                            >
                                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "I've Arrived at Pickup"}
                                            </motion.button>
                                        )}

                                        {booking.bookingStatus === "STARTED" && !booking.dropOtp && (
                                            <motion.button key="drop-send" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                onClick={() => sendOtp("DROP")} disabled={isProcessing}
                                                className="w-full bg-black dark:bg-white text-white dark:text-black font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2"
                                            >
                                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "I've Reached Drop Location"}
                                            </motion.button>
                                        )}

                                        {((booking.bookingStatus === "CONFIRMED" && !!booking.pickUpOtp) || (booking.bookingStatus === "STARTED" && !!booking.dropOtp)) && (
                                            <motion.div key="verify-box" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-center shadow-inner">
                                                <h3 className="font-black text-black dark:text-white mb-1">Enter {booking.bookingStatus === "CONFIRMED" ? "Pickup" : "Drop"} OTP</h3>
                                                <p className="text-xs text-gray-500 mb-5">Ask the rider for the 4-digit code.</p>

                                                <div className="flex justify-center gap-3 mb-6">
                                                    {otpValues.map((digit, index) => (
                                                        <input key={index} ref={(el) => { otpRefs.current[index] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                                                            onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} onPaste={handleOtpPaste} disabled={isVerifying}
                                                            className="w-12 h-14 text-center text-xl font-black bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white shadow-sm"
                                                        />
                                                    ))}
                                                </div>
                                                <button onClick={() => verifyOtp(booking.bookingStatus === "CONFIRMED" ? "PICKUP" : "DROP")} disabled={isVerifying || otpValues.join("").length !== 4} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                                                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : (booking.bookingStatus === "CONFIRMED" ? "Verify & Start Ride" : "Verify & Complete")}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {!isCompleted && !isCancelled && <RideChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} bookingId={booking.id} currentUserId={user?.id || ""} otherUserId={booking.userId} otherUserName={booking.user?.name || "Rider"} role="PARTNER" socket={socket} />}
        </main>
    );
}

export default function PartnerActiveRide() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#050505]"><Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" /></div>}>
            <PartnerActiveRideContent />
        </Suspense>
    );
}