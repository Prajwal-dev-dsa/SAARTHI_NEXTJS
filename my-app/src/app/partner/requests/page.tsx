"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { MapPin, Navigation, Clock, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

export default function RideRequestsPage() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // --- Fetch Initial Requests ---
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/partner/requests");
      setRequests(res.data.requests || []);
    } catch (error) {
      console.error("Failed to load requests", error);
      showAlert("Failed to load requests. Please refresh.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // --- INSTANT SYNC WITH NAVBAR ---
  useEffect(() => {
    if (!isLoading) {
      // Instantly push the exact length of the list to the Navbar dot
      window.dispatchEvent(new CustomEvent('update_pending_count', { detail: requests.length }));
    }
  }, [requests, isLoading]);

  // --- Socket Initialisation & Listeners ---
  useEffect(() => {
    if (!user?.id) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("register_partner", user.id);
    });

    // Listen for Instant New Requests
    newSocket.on("new_ride_request", () => {
      showAlert("New ride request received!", "success");
      fetchRequests(); // Refresh the list instantly
    });

    // Listen for Instant User Cancellations
    newSocket.on("ride_cancelled", (data) => {
      setRequests(prev => prev.filter(req => req.id !== data.bookingId));
      showAlert("A user cancelled their request.", "error");
    });

    return () => { newSocket.disconnect(); };
  }, [user?.id, showAlert]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  // --- Accept & Reject Actions ---
  const handleAccept = async (id: string, userId: string) => {
    setProcessingId(id);
    try {
      await axios.post("/api/partner/requests/accept", { bookingId: id });

      // Instantly notify User and Navbar
      if (socket) {
        socket.emit("ride_accepted", { userId, bookingId: id });
        socket.emit("ride_accepted", { partnerId: user?.id });
      }

      showAlert("Ride accepted! Navigating to bookings...", "success");
      setRequests(prev => prev.filter(req => req.id !== id));

      // Navigate to bookings immediately
      router.push("/partner/bookings");

    } catch (error) {
      showAlert("Failed to accept ride.", "error");
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, userId: string) => {
    setProcessingId(id);
    try {
      await axios.post("/api/partner/requests/reject", { bookingId: id });

      // Instantly notify User and Navbar
      if (socket) {
        socket.emit("ride_rejected", { userId, bookingId: id });
        socket.emit("ride_rejected", { partnerId: user?.id });
      }

      showAlert("Ride rejected.", "success");
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (error) {
      showAlert("Failed to reject ride.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-[#050505] font-sans transition-colors duration-300 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

      <div className="sticky top-0 z-50 w-full pb-12 bg-black text-white shadow-md">
        <Navbar onLoginClick={() => { }} />
      </div>

      <div className="max-w-[1000px] mx-auto px-6 pb-12 md:pb-24">

        {/* Updated Header with Back Button Alignment */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 mt-10 flex items-start gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shrink-0 mt-1">
            <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tight mb-2">Ride Requests</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Manage incoming ride requests and respond in real time.</p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-black dark:text-white" />
            <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Loading Requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-100 dark:border-gray-900 shadow-sm">
            <RefreshCw className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="font-bold text-black dark:text-white mb-1">No Pending Requests</h3>
            <p className="text-xs text-gray-500">You're all caught up. Keep the app open to receive new rides.</p>
            <button onClick={fetchRequests} className="mt-6 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform">
              Refresh
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {requests.map((req, index) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, x: 20 }} transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-900 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row justify-between gap-6 hover:border-gray-200 dark:hover:border-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="relative pl-10 space-y-8">
                      <div className="absolute left-[19px] top-3 bottom-5 w-0.5 bg-gray-200 dark:bg-gray-800" />

                      <div className="relative z-10">
                        <div className="absolute left-[-40px] top-0 w-8 h-8 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-800">
                          <MapPin className="w-4 h-4 text-black dark:text-white" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup Location</p>
                        <p className="font-bold text-sm text-black dark:text-white leading-relaxed pr-4">{req.pickUpAddress}</p>
                      </div>

                      <div className="relative z-10">
                        <div className="absolute left-[-40px] top-0 w-8 h-8 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-800">
                          <Navigation className="w-4 h-4 text-black dark:text-white" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Drop Location</p>
                        <p className="font-bold text-sm text-black dark:text-white leading-relaxed pr-4">{req.dropAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-8 text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">{formatDateTime(req.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-start md:items-end shrink-0 border-t md:border-t-0 pt-6 md:pt-0 border-gray-100 dark:border-gray-900">
                    <div className="mb-6 md:mb-0 text-left md:text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Fare</p>
                      <div className="flex items-start md:justify-end">
                        <span className="text-sm text-gray-400 font-bold mt-1 mr-1">₹</span>
                        <span className="text-3xl font-black text-black dark:text-white tracking-tight">{req.fare}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={() => handleReject(req.id, req.userId)}
                        disabled={processingId !== null}
                        className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-800 font-bold text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAccept(req.id, req.userId)}
                        disabled={processingId !== null}
                        className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                      >
                        {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept Ride"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}