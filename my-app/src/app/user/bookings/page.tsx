"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
    Car, Calendar, User, Phone,
    ChevronRight, Loader2, RefreshCw, CarFront, Bike, Package, Truck,
    ChevronDown
} from "lucide-react";
import Navbar from "@/components/Navbar";

const VEHICLE_ICONS: Record<string, any> = {
    BIKE: Bike, AUTO: CarFront, CAR: Car, LOADING: Package, TRUCK: Truck,
};

export default function UserBookingsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get("/api/user/bookings");
            setBookings(res.data.bookings || []);
        } catch (error) {
            console.error("Failed to load bookings");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredBookings = bookings.filter(b => {
        if (filter === "ALL") return true;
        if (filter === "ACTIVE") return ["IDLE", "REQUESTED", "AWAITING_PAYMENT", "CONFIRMED", "STARTED"].includes(b.bookingStatus);
        if (filter === "COMPLETED") return b.bookingStatus === "COMPLETED";
        if (filter === "CANCELLED") return ["CANCELLED", "REJECTED", "EXPIRED"].includes(b.bookingStatus);
        return true;
    });

    const getStatusColor = (status: string) => {
        if (["COMPLETED"].includes(status)) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
        if (["CANCELLED", "REJECTED", "EXPIRED"].includes(status)) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    };

    const getPaymentColor = (status: string) => {
        if (status === "PAID" || status === "CASH") return "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400";
        return "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400";
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans transition-colors duration-300">
            <div className="bg-black text-white">
                <Navbar onLoginClick={() => { }} />
            </div>

            <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12 md:py-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
                                <Car className="w-5 h-5 text-white dark:text-black" />
                            </div>
                            <h1 className="text-3xl font-black text-black dark:text-white tracking-tight">My Bookings</h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium ml-1">{bookings.length} total rides found</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative w-full md:w-auto"
                    >
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="appearance-none bg-white dark:bg-[#0e0e0e] border border-gray-200 dark:border-gray-800 text-black dark:text-white pl-5 pr-12 py-3 rounded-xl outline-none font-bold text-sm shadow-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all w-full cursor-pointer h-[46px]"
                        >
                            <option value="ALL">All Rides</option>
                            <option value="ACTIVE">Active Rides</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled / Expired</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500 dark:text-gray-400">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </motion.div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-black dark:text-white" />
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-100 dark:border-gray-900 shadow-sm text-center px-6">
                        <RefreshCw className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-4" />
                        <h3 className="font-bold text-black dark:text-white mb-1">No Bookings Found</h3>
                        <p className="text-xs text-gray-500">You don't have any rides in this category.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {filteredBookings.map((booking, i) => {
                                const Icon = VEHICLE_ICONS[booking.vehicle?.type] || Car;
                                const isActive = ["REQUESTED", "AWAITING_PAYMENT", "CONFIRMED", "STARTED"].includes(booking.bookingStatus);

                                return (
                                    <motion.div
                                        key={booking.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white dark:bg-[#0e0e0e] border border-gray-100 dark:border-gray-900 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                                    >
                                        {/* Header */}
                                        <div className="p-6 border-b border-gray-50 dark:border-gray-900/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-sm text-black dark:text-white uppercase tracking-wider">{booking.partner?.name || "Assigning..."}</h3>
                                                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-[10px] mt-0.5 font-bold tracking-widest gap-1">
                                                        <Phone className="w-3 h-3" /> {booking.partnerMobileNumber || "Pending"}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border ${getStatusColor(booking.bookingStatus)}`}>
                                                {booking.bookingStatus.replace("_", " ")}
                                            </span>
                                        </div>

                                        {/* Body */}
                                        <div className="p-6">
                                            <div className="flex items-center gap-2 mb-6">
                                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg"><Icon className="w-4 h-4 text-black dark:text-white" /></div>
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{booking.vehicle?.model || "Standard"} • {booking.vehicle?.vehicleNumber || "N/A"}</span>
                                            </div>

                                            <div className="relative pl-6 space-y-6">
                                                <div className="absolute left-[9px] top-2 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-800" />
                                                <div className="relative z-10">
                                                    <div className="absolute left-[-26px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#0e0e0e]" />
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup</p>
                                                    <p className="font-bold text-sm text-black dark:text-white line-clamp-1">{booking.pickUpAddress}</p>
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="absolute left-[-26px] top-1 w-3 h-3 bg-red-500 rounded-sm border-2 border-white dark:border-[#0e0e0e]" />
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Drop</p>
                                                    <p className="font-bold text-sm text-black dark:text-white line-clamp-1">{booking.dropAddress}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                                        {new Date(booking.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment:</span>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getPaymentColor(booking.paymentStatus)}`}>
                                                        {booking.paymentStatus}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className="text-xl font-black text-black dark:text-white">₹{booking.fare}</span>
                                                {isActive && (
                                                    <button
                                                        onClick={() => router.push(`/user/ride/active?id=${booking.id}`)}
                                                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                    >
                                                        Track Ride <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </main>
    );
}