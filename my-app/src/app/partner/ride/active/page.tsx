"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Clock, Phone, MessageSquare, User, Loader2, MapPin, Navigation, CheckCircle2, Home } from "lucide-react";
import { STATUS_LABEL } from "@/lib/rideStatuses";
import RideChat from "@/components/RideChat";
import { useAlert } from "@/context/AlertContext";
import { io, Socket } from "socket.io-client";

const ActiveRideMap = dynamic(() => import("@/components/ActiveRideMap"), { ssr: false });

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
        if (!bookingId) { router.push("/partner/dashboard"); return; }
        fetchRideDetails();
    }, [bookingId, router]);

    useEffect(() => {
        if (!user?.id) return;
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";
        const newSocket = io(socketUrl);

        newSocket.on("connect", () => newSocket.emit("register_partner", user.id));
        newSocket.on("ride_updated", () => fetchRideDetails());

        setSocket(newSocket);
        return () => { newSocket.disconnect(); };
    }, [user?.id]);

    useEffect(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => setLiveDriverLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn("GPS Warning:", err.message),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // --- Premium OTP Input Logic ---
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

    // Action to send OTP to user's email
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

    // Action to verify the OTP entered by driver
    const verifyOtp = async (type: "PICKUP" | "DROP") => {
        const otpStr = otpValues.join("");
        if (otpStr.length !== 4) return showAlert("Please enter 4 digit OTP", "error");

        setIsVerifying(true);
        try {
            await axios.post("/api/ride/otp/verify", { bookingId, type, otp: otpStr });
            socket?.emit("ride_updated", { partnerId: booking.partnerId, userId: booking.userId });
            showAlert(`${type} Verified successfully!`, "success");
            setOtpValues(["", "", "", ""]); // Reset boxes for the next step
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
            {/* MAP SECTION */}
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

            {/* PANEL SECTION */}
            <div className={`${isCompleted ? "w-full" : "w-full lg:w-[450px]"} h-[50vh] lg:h-full bg-white dark:bg-[#0a0a0a] flex flex-col shadow-2xl z-20 transition-all duration-500`}>
                {isCompleted ? (
                    // --- COMPLETED RIDE RECEIPT UI ---
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto w-full">
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

                        <div className="w-full bg-black dark:bg-[#111] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex items-center gap-4 mb-8 text-white">
                            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center"><User className="w-5 h-5 text-gray-400" /></div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Customer</p>
                                <p className="font-bold capitalize">{booking.user?.name}</p>
                            </div>
                        </div>

                        <button onClick={() => router.push("/")} className="w-full bg-transparent border border-gray-200 dark:border-gray-800 text-black dark:text-white font-bold py-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#111] transition-colors flex justify-center items-center gap-2">
                            <Home className="w-4 h-4" /> Back To Home
                        </button>
                    </motion.div>
                ) : (
                    // --- ACTIVE RIDE UI ---
                    <>
                        <div className="p-6 bg-black dark:bg-[#111] text-white flex justify-between items-center">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Driver Panel</p>
                                <h2 className="text-2xl font-black">Active Ride</h2>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-xs font-bold">Live</span>
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
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Your Fare</p>
                                        <p className="font-black text-lg text-white">{booking.partnerAmount}</p>
                                    </div>
                                </div>
                            </div>

                            {/* --- DYNAMIC OTP ACTIONS SECTION --- */}
                            <AnimatePresence mode="wait">
                                {/* 1. SHOW SEND BUTTON BEFORE PICKUP */}
                                {booking.bookingStatus === "CONFIRMED" && !booking.pickUpOtp && (
                                    <motion.button key="pickup-send" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        onClick={() => sendOtp("PICKUP")} disabled={isProcessing}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Pickup OTP"}
                                    </motion.button>
                                )}

                                {/* 2. SHOW INPUT BOXES ONCE PICKUP OTP IS SENT */}
                                {booking.bookingStatus === "CONFIRMED" && !!booking.pickUpOtp && (
                                    <motion.div key="pickup-verify" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-3xl p-6 text-center">
                                        <h3 className="font-black text-blue-700 dark:text-blue-400 mb-1">Enter Pickup OTP</h3>
                                        <p className="text-xs text-blue-600/80 dark:text-blue-300/80 mb-6">Ask the rider for the 4-digit code sent to their email.</p>
                                        <div className="flex justify-center gap-3 mb-6">
                                            {otpValues.map((digit, index) => (
                                                <input key={index} ref={(el) => { otpRefs.current[index] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} onPaste={handleOtpPaste} disabled={isVerifying}
                                                    className="w-12 h-14 text-center text-xl font-black bg-white dark:bg-black border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                                />
                                            ))}
                                        </div>
                                        <button onClick={() => verifyOtp("PICKUP")} disabled={isVerifying || otpValues.join("").length !== 4} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                                            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Start Ride"}
                                        </button>
                                    </motion.div>
                                )}

                                {/* 3. SHOW SEND BUTTON BEFORE DROP */}
                                {booking.bookingStatus === "STARTED" && !booking.dropOtp && (
                                    <motion.button key="drop-send" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        onClick={() => sendOtp("DROP")} disabled={isProcessing}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Drop OTP"}
                                    </motion.button>
                                )}

                                {/* 4. SHOW INPUT BOXES ONCE DROP OTP IS SENT */}
                                {booking.bookingStatus === "STARTED" && !!booking.dropOtp && (
                                    <motion.div key="drop-verify" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-3xl p-6 text-center">
                                        <h3 className="font-black text-green-700 dark:text-green-400 mb-1">Enter Drop OTP</h3>
                                        <p className="text-xs text-green-600/80 dark:text-green-300/80 mb-6">Ask the rider for the final 4-digit completion code.</p>
                                        <div className="flex justify-center gap-3 mb-6">
                                            {otpValues.map((digit, index) => (
                                                <input key={index} ref={(el) => { otpRefs.current[index] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} onPaste={handleOtpPaste} disabled={isVerifying}
                                                    className="w-12 h-14 text-center text-xl font-black bg-white dark:bg-black border border-green-200 dark:border-green-800 text-green-900 dark:text-green-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                                                />
                                            ))}
                                        </div>
                                        <button onClick={() => verifyOtp("DROP")} disabled={isVerifying || otpValues.join("").length !== 4} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                                            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Complete Ride"}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="bg-black dark:bg-[#111] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 text-white shadow-lg mt-auto">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center"><User className="w-6 h-6 text-gray-400" /></div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-lg capitalize">{booking.user?.name || "Rider"}</h3>
                                        <div className="bg-white text-black text-[10px] font-black px-2 py-0.5 rounded uppercase w-max mt-1 tracking-wider">{booking.paymentStatus === "CASH" ? "Cash Ride" : "Paid Online"}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => window.open(`tel:${booking.userMobileNumber}`)} className="bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 text-black dark:text-white font-bold py-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
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

            {!isCompleted && <RideChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} bookingId={booking.id} currentUserId={user?.id || ""} otherUserId={booking.userId} otherUserName={booking.user?.name || "Rider"} role="PARTNER" socket={socket} />}
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