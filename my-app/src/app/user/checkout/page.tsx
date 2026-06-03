"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, Variants, AnimatePresence } from "framer-motion";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
    ArrowLeft, Car, Bike, Truck, Package, CarFront,
    Clock, ShieldCheck, CreditCard, ArrowRight, Loader2,
    XCircle, CheckCircle2, Wallet, Check
} from "lucide-react";
import { useAlert } from "@/context/AlertContext";

const VEHICLE_ICONS: Record<string, any> = {
    Bike: Bike, Auto: CarFront, Car: Car, Loading: Package, Truck: Truck,
};

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showAlert } = useAlert();
    const { user } = useSelector((state: RootState) => state.auth);

    const [isMounted, setIsMounted] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    const [bookingId, setBookingId] = useState<string | null>(null);
    const [bookingStatus, setBookingStatus] = useState<string>("IDLE");
    const [isCheckingState, setIsCheckingState] = useState(true);
    const [isRequesting, setIsRequesting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "online" | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const pickup = searchParams.get("pickup") || "";
    const drop = searchParams.get("drop") || "";
    const vehicle = searchParams.get("vehicle") || "Car";
    const driverId = searchParams.get("driverId") || "";
    const fare = searchParams.get("fare") || "0";
    const oLat = searchParams.get("oLat") || "0";
    const oLng = searchParams.get("oLng") || "0";
    const dLat = searchParams.get("dLat") || "0";
    const dLng = searchParams.get("dLng") || "0";
    const phone = searchParams.get("phone") || "";

    const VehicleIcon = VEHICLE_ICONS[vehicle] || Car;

    // --- Socket Initialization & Listeners ---
    useEffect(() => {
        if (!user?.id) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        newSocket.on("connect", () => {
            newSocket.emit("register_user", user.id);
        });

        // Instant Socket Triggers from Partner
        newSocket.on("ride_accepted", (data) => {
            if (data.bookingId) setBookingStatus("AWAITING_PAYMENT");
        });

        newSocket.on("ride_rejected", (data) => {
            showAlert("Ride was rejected by driver.", "error");
            setBookingStatus("IDLE");
            setBookingId(null);
            setShowPaymentOptions(false);
        });

        return () => { newSocket.disconnect(); };
    }, [user?.id, showAlert]);

    // --- On Load: Check Active Booking ---
    useEffect(() => {
        if (!pickup || !drop || !driverId) {
            router.push("/user/search");
            return;
        }

        const checkCurrentBooking = async () => {
            try {
                const res = await axios.get("/api/user/booking/current");
                if (res.data.booking) {
                    setBookingId(res.data.booking.id);
                    setBookingStatus(res.data.booking.bookingStatus);
                }
            } catch (error) {
                console.error("Failed to fetch initial booking state");
            } finally {
                setIsCheckingState(false);
                setIsMounted(true);
            }
        };

        checkCurrentBooking();
    }, [pickup, drop, driverId, router]);

    // --- 1. Request Ride ---
    const handleRequestRide = async () => {
        setIsRequesting(true);
        const bookingPayload = {
            partnerId: driverId, vehicleType: vehicle, pickUpAddress: pickup, dropAddress: drop,
            pickUpLocation: { lat: parseFloat(oLat), lng: parseFloat(oLng) },
            dropLocation: { lat: parseFloat(dLat), lng: parseFloat(dLng) },
            fare: parseFloat(fare), userMobileNumber: phone,
        };

        try {
            const res = await axios.post("/api/user/booking/create", bookingPayload);
            const booking = res.data.booking;

            setBookingId(booking.id);
            setBookingStatus(booking.bookingStatus);

            if (!res.data.isExisting && socket) {
                // Fire instant request to partner
                socket.emit("new_ride_request", {
                    partnerId: driverId, bookingId: booking.id, pickup, drop, fare, userId: user?.id
                });
                setBookingStatus("REQUESTED");
            }
        } catch (error) {
            showAlert("Failed to request ride.", "error");
        } finally {
            setIsRequesting(false);
        }
    };

    // --- 2. Fallback Polling Logic ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (bookingId && bookingStatus === "REQUESTED") {
            interval = setInterval(async () => {
                try {
                    const res = await axios.get(`/api/user/booking/status?id=${bookingId}`);
                    const newStatus = res.data.status;

                    if (newStatus === "AWAITING_PAYMENT") {
                        setBookingStatus("AWAITING_PAYMENT");
                    } else if (newStatus === "REJECTED" || newStatus === "CANCELLED" || newStatus === "EXPIRED") {
                        showAlert(newStatus === "EXPIRED" ? "Driver response timeout." : "Ride cancelled by driver.", "error");
                        setBookingStatus("IDLE");
                        setBookingId(null);
                        setShowPaymentOptions(false);
                    }
                } catch (error) {
                    console.error("Polling error", error);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [bookingId, bookingStatus, showAlert]);

    // --- 3. Animation Timeout ---
    useEffect(() => {
        if (bookingStatus === "AWAITING_PAYMENT" && !showPaymentOptions) {
            const timer = setTimeout(() => setShowPaymentOptions(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [bookingStatus, showPaymentOptions]);

    // --- 4. Cancel Request ---
    const handleCancelRequest = async () => {
        if (!bookingId) return;
        setIsCancelling(true);
        try {
            await axios.post("/api/user/booking/cancel", { bookingId });

            // Instantly notify partner that user cancelled
            if (socket) {
                socket.emit("ride_cancelled", { partnerId: driverId, bookingId });
            }

            setBookingStatus("IDLE");
            setBookingId(null);
            setShowPaymentOptions(false);
            showAlert("Request Cancelled.", "success");
        } catch (error) {
            showAlert("Failed to cancel.", "error");
        } finally {
            setIsCancelling(false);
        }
    };

    // --- 5. Payment Flow (Cash & Online) ---
    const handleProceedToPayment = async () => {
        if (!paymentMethod) return showAlert("Please select a payment method", "error");
        setIsProcessingPayment(true);

        if (paymentMethod === "online") {
            const res = await loadRazorpayScript();
            if (!res) {
                showAlert("Razorpay SDK failed to load. Are you online?", "error");
                setIsProcessingPayment(false);
                return;
            }

            try {
                const orderData = await axios.post("/api/payment/create", { bookingId });
                const { orderId, amount, currency } = orderData.data;

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: amount,
                    currency: currency,
                    name: "Saarthi Cabs",
                    description: "Ride Payment",
                    order_id: orderId,
                    handler: async function (response: any) {
                        try {
                            await axios.post("/api/payment/verify", {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                bookingId: bookingId
                            });

                            showAlert("Payment Successful!", "success");
                            setIsProcessingPayment(false);
                            setBookingStatus("CONFIRMED");

                        } catch (err: any) {
                            setIsProcessingPayment(false);
                            const msg = err.response?.data?.error || "Payment verification failed";
                            showAlert(msg, "error");
                            if (msg.includes("expired")) {
                                setBookingStatus("IDLE");
                                setBookingId(null);
                                setShowPaymentOptions(false);
                            }
                        }
                    },
                    prefill: { contact: phone || "9999999999" },
                    theme: { color: "#000000" }
                };

                const paymentObject = new (window as any).Razorpay(options);
                paymentObject.on("payment.failed", function () {
                    showAlert("Payment processing failed", "error");
                    setIsProcessingPayment(false);
                });
                paymentObject.open();

            } catch (error: any) {
                setIsProcessingPayment(false);
                const msg = error.response?.data?.error || "Failed to initialize payment";
                showAlert(msg, "error");
                if (msg.includes("expired")) {
                    setBookingStatus("IDLE");
                    setBookingId(null);
                    setShowPaymentOptions(false);
                }
            }

        } else {
            try {
                await axios.post("/api/payment/cash", { bookingId });
                showAlert("Ride Confirmed! Pay with Cash at drop.", "success");
                setBookingStatus("CONFIRMED");
            } catch (error: any) {
                const msg = error.response?.data?.error || "Failed to confirm ride";
                showAlert(msg, "error");
                if (msg.includes("expired")) {
                    setBookingStatus("IDLE");
                    setBookingId(null);
                    setShowPaymentOptions(false);
                }
            } finally {
                setIsProcessingPayment(false);
            }
        }
    };

    if (!isMounted) return null;

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };
    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans transition-colors duration-300 py-10 px-4 md:px-8 flex flex-col items-center justify-center">

            <div className="absolute top-6 left-6 z-40">
                <button onClick={() => router.back()} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-[#111] rounded-full shadow-lg hover:scale-105 transition-transform border border-gray-100 dark:border-gray-800">
                    <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
                </button>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1000px] w-full">

                <motion.div variants={itemVariants} className="mb-10 pl-2 md:pl-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-[2px] bg-black dark:bg-white" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-black dark:text-white uppercase">Booking</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white tracking-tight">Checkout</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Review your ride and confirm</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

                    {/* LEFT CARD: Ride Summary */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-[#0e0e0e] rounded-4xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-900 flex flex-col justify-between min-h-[400px]">
                        <div>
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <p className="text-[10px] font-black tracking-[0.15em] text-gray-400 uppercase mb-2">Selected Vehicle</p>
                                    <h2 className="text-4xl font-black text-black dark:text-white capitalize">{vehicle}</h2>
                                </div>
                                <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 transition-transform duration-300">
                                    <VehicleIcon className="w-8 h-8 text-white dark:text-black" />
                                </div>
                            </div>

                            <div className="relative pl-6 space-y-8">
                                <div className="absolute left-[9px] top-2 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-800" />
                                <div className="relative z-10">
                                    <div className="absolute left-[-26px] top-1 w-3 h-3 bg-black dark:bg-white rounded-full border-2 border-white dark:border-[#0e0e0e] shadow-sm" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup</p>
                                    <p className="font-bold text-sm md:text-base text-black dark:text-white leading-relaxed line-clamp-2 pr-4">{pickup}</p>
                                </div>
                                <div className="relative z-10">
                                    <div className="absolute left-[-26px] top-1 w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-sm border-2 border-white dark:border-[#0e0e0e] shadow-sm" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Drop</p>
                                    <p className="font-bold text-sm md:text-base text-black dark:text-white leading-relaxed line-clamp-2 pr-4">{drop}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800/50 flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black tracking-[0.15em] text-gray-400 uppercase mb-1">Total Fare</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">Includes base + distance charges</p>
                            </div>
                            <div className="flex items-start">
                                <span className="text-xl text-gray-400 font-bold mt-1 mr-1">₹</span>
                                <span className="text-5xl font-black text-black dark:text-white tracking-tight">{fare}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT CARD: Dynamic States */}
                    <div className="bg-white dark:bg-[#0e0e0e] rounded-4xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-900 flex flex-col justify-center min-h-[400px] relative overflow-hidden">

                        {isCheckingState ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-50">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-black dark:text-white" />
                                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Fetching Status</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">

                                {/* STATE 1: IDLE */}
                                {bookingStatus === "IDLE" && (
                                    <motion.div key="idle" variants={itemVariants} initial="hidden" animate="show" exit="exit" className="flex flex-col justify-between h-full">
                                        <div>
                                            <p className="text-[10px] font-black tracking-[0.15em] text-gray-400 uppercase mb-2">Ready to go?</p>
                                            <h2 className="text-3xl font-black text-black dark:text-white mb-8">Confirm Your Ride</h2>
                                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 space-y-6 border border-gray-100 dark:border-gray-800/50">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 flex items-center justify-center shrink-0 shadow-sm"><Clock className="w-3.5 h-3.5 text-gray-500" /></div>
                                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Driver will respond within 2 minutes</p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 flex items-center justify-center shrink-0 shadow-sm"><ShieldCheck className="w-3.5 h-3.5 text-gray-500" /></div>
                                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Verified & insured drivers only</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={handleRequestRide} disabled={isRequesting} className="mt-10 w-full bg-black dark:bg-white text-white dark:text-black font-black text-lg py-5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl disabled:opacity-70 flex items-center justify-center space-x-2">
                                            {isRequesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Request Ride</span>}
                                            {!isRequesting && <ArrowRight className="w-5 h-5" />}
                                        </button>
                                    </motion.div>
                                )}

                                {/* STATE 2: REQUESTED (Finding Driver) */}
                                {bookingStatus === "REQUESTED" && (
                                    <motion.div key="requested" variants={itemVariants} initial="hidden" animate="show" exit="exit" className="flex flex-col items-center justify-center text-center h-full">
                                        <div className="relative w-20 h-20 flex justify-center items-center mb-8">
                                            <div className="w-20 h-20 rounded-full border-4 border-gray-100 dark:border-gray-900 absolute" />
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-20 h-20 rounded-full border-4 border-transparent border-t-black dark:border-t-white absolute" />
                                        </div>
                                        <h3 className="text-2xl font-black text-black dark:text-white mb-2">Finding Your Driver</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">Waiting for driver to accept...</p>
                                        <button onClick={handleCancelRequest} disabled={isCancelling} className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-full text-xs font-bold uppercase tracking-widest disabled:opacity-50">
                                            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                            {isCancelling ? "Cancelling..." : "Cancel Request"}
                                        </button>
                                    </motion.div>
                                )}

                                {/* STATE 3 & 4: AWAITING PAYMENT (Animation -> Options) */}
                                {bookingStatus === "AWAITING_PAYMENT" && (
                                    <motion.div key="payment" variants={itemVariants} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full justify-center">

                                        {/* Progress Bar Animation */}
                                        {!showPaymentOptions ? (
                                            <div className="flex flex-col items-center text-center">
                                                <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center mb-6 border border-green-100 dark:border-green-800">
                                                    <CheckCircle2 className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-2xl font-black text-black dark:text-white mb-2">Driver Accepted</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Preparing payment options...</p>

                                                <div className="w-48 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.5, ease: "easeInOut" }}
                                                        className="h-full bg-black dark:bg-white rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            /* Payment Options Selection */
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black tracking-[0.15em] text-gray-400 uppercase mb-2">Almost There</p>
                                                    <h2 className="text-3xl font-black text-black dark:text-white mb-8">Select Payment Method</h2>

                                                    <div className="space-y-4">
                                                        {/* Cash Option */}
                                                        <div
                                                            onClick={() => setPaymentMethod("cash")}
                                                            className={`p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === "cash" ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-gray-200 dark:border-gray-800 bg-transparent text-black dark:text-white hover:border-gray-300 dark:hover:border-gray-700"}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "cash" ? "bg-white/20 dark:bg-black/10" : "bg-gray-100 dark:bg-gray-900"}`}>
                                                                    <Wallet className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold">Cash</h4>
                                                                    <p className={`text-xs ${paymentMethod === "cash" ? "text-gray-300 dark:text-gray-600" : "text-gray-500"}`}>Pay driver after ride</p>
                                                                </div>
                                                            </div>
                                                            {paymentMethod === "cash" && <Check className="w-5 h-5" />}
                                                        </div>

                                                        {/* Online Option */}
                                                        <div
                                                            onClick={() => setPaymentMethod("online")}
                                                            className={`p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === "online" ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-gray-200 dark:border-gray-800 bg-transparent text-black dark:text-white hover:border-gray-300 dark:hover:border-gray-700"}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "online" ? "bg-white/20 dark:bg-black/10" : "bg-gray-100 dark:bg-gray-900"}`}>
                                                                    <CreditCard className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold">Online Payment</h4>
                                                                    <p className={`text-xs ${paymentMethod === "online" ? "text-gray-300 dark:text-gray-600" : "text-gray-500"}`}>UPI • Card • Netbanking</p>
                                                                </div>
                                                            </div>
                                                            {paymentMethod === "online" && <Check className="w-5 h-5" />}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleProceedToPayment}
                                                    disabled={!paymentMethod || isProcessingPayment}
                                                    className="mt-10 w-full bg-black dark:bg-white text-white dark:text-black font-black text-lg py-5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                                >
                                                    {isProcessingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{paymentMethod === "cash" ? "Confirm Cash Ride" : "Proceed to Payment"}</span>}
                                                    {!isProcessingPayment && <ArrowRight className="w-5 h-5" />}
                                                </button>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}

                                {/* STATE 5: CONFIRMED */}
                                {bookingStatus === "CONFIRMED" && (
                                    <motion.div key="confirmed" variants={itemVariants} initial="hidden" animate="show" exit="exit" className="flex flex-col items-center justify-center text-center h-full">
                                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner border border-gray-100 dark:border-gray-800">
                                            <CheckCircle2 className="w-10 h-10 text-black dark:text-white" />
                                        </div>
                                        <h3 className="text-3xl font-black text-black dark:text-white mb-2">Ride Confirmed!</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 max-w-[250px] leading-relaxed">Your payment is secure. Track your driver live from the ride screen.</p>

                                        <button
                                            onClick={() => router.push(`/user/ride/active?id=${bookingId}`)}
                                            className="bg-black dark:bg-white text-white dark:text-black font-black text-sm px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-xl flex items-center gap-2"
                                        >
                                            Track Your Ride <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </motion.div>
        </main>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}