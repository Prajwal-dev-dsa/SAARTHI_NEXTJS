"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Clock, Phone, MessageSquare, User, Loader2 } from "lucide-react";
import { STATUS_LABEL } from "@/lib/rideStatuses";
import RideChat from "@/components/RideChat";
import { io, Socket } from "socket.io-client";

const ActiveRideMap = dynamic(() => import("@/components/ActiveRideMap"), { ssr: false });

export default function PartnerActiveRide() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get("id");
    const { user } = useSelector((state: RootState) => state.auth);

    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [liveDriverLoc, setLiveDriverLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);

    const [isChatOpen, setIsChatOpen] = useState(false);

    // 1. Fetch initial booking details
    useEffect(() => {
        if (!bookingId) {
            router.push("/partner/dashboard");
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
    }, [bookingId, router]);

    // Setup Socket for Chat Connection
    useEffect(() => {
        if (!user?.id) return;
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";
        const newSocket = io(socketUrl);

        newSocket.on("connect", () => {
            newSocket.emit("register_partner", user.id);
        });

        setSocket(newSocket);
        return () => { newSocket.disconnect(); };
    }, [user?.id]);

    useEffect(() => {
        if (!navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setLiveDriverLoc({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => console.warn("Local Map GPS Warning:", error.message),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);


    if (isLoading || !booking) {
        return <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#050505]"><Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" /></div>;
    }

    const currentStatus = STATUS_LABEL[booking.bookingStatus] || STATUS_LABEL.IDLE;

    // 3. Ultra-Safe Location Parser
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
        return <div className="p-10 text-center text-red-500 font-bold">Location data missing for this booking.</div>;
    }

    // Use live GPS if available, otherwise DB location, otherwise pickup location
    const safeDriverLoc = liveDriverLoc || initialDriverLoc || pickupLoc;

    return (
        <main className="h-screen w-full flex flex-col lg:flex-row bg-gray-50 dark:bg-[#050505] font-sans overflow-hidden">
            <div className="flex-1 relative h-[50vh] lg:h-full">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 shadow-xl px-5 py-2.5 rounded-full flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.dot} animate-pulse`} />
                        <span className="font-bold text-sm text-black dark:text-white">{currentStatus.label}</span>
                    </motion.div>
                </div>
                <ActiveRideMap driverLoc={safeDriverLoc} pickupLoc={pickupLoc} dropLoc={dropLoc} />
            </div>

            <div className="w-full lg:w-[400px] h-[50vh] lg:h-full bg-white dark:bg-[#0a0a0a] flex flex-col border-t lg:border-l border-gray-100 dark:border-gray-900 shadow-2xl z-20">
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

                <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
                    <div>
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
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Your Fare</p>
                                    <p className="font-black text-lg text-white">{booking.partnerAmount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black dark:bg-[#111] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 text-white shadow-lg mb-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center">
                                        <User className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-lg capitalize">{booking.user?.name || "Rider"}</h3>
                                    <div className="bg-white text-black text-[10px] font-black px-2 py-0.5 rounded uppercase w-max mt-1 tracking-wider">
                                        {booking.paymentStatus === "CASH" ? "Cash Ride" : "Paid Online"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-auto">
                        <button onClick={() => window.open(`tel:${booking.userMobileNumber}`)} className="bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 text-black dark:text-white font-bold py-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4" /> Call
                        </button>
                        <button onClick={() => setIsChatOpen(true)} className="bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Message
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Modal Component */}
            <RideChat
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                bookingId={booking.id}
                currentUserId={user?.id || ""}
                otherUserId={booking.userId}
                otherUserName={booking.user?.name || "Rider"}
                role="PARTNER"
                socket={socket}
            />

        </main>
    );
}