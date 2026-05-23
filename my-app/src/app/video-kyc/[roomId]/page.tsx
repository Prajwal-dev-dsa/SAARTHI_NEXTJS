"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, PhoneOff, Loader2, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import axios from 'axios';
import { useAlert } from '@/context/AlertContext';

export default function VideoKycRoom() {
    const params = useParams();
    const router = useRouter();
    const { showAlert } = useAlert();
    const roomId = params.roomId as string;

    const user = useSelector((state: RootState) => state.auth.user);
    const isAdmin = user?.role === "ADMIN";

    // Call States
    const containerRef = useRef<HTMLDivElement>(null);
    const zpRef = useRef<any>(null);
    const hasInitialized = useRef(false);
    const [isInCall, setIsInCall] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Custom Pre-Join States
    const [isPreJoin, setIsPreJoin] = useState(true);
    const [camEnabled, setCamEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);

    // Modal States
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    // ---------------------------------------------------------
    // ZEGOCLOUD INITIALIZATION
    // ---------------------------------------------------------
    useEffect(() => {
        if (isPreJoin || !containerRef.current || !user || !roomId || hasInitialized.current) return;

        hasInitialized.current = true;

        const initCall = async () => {
            try {
                const appId = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
                const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";

                const uniqueZegoId = `${user.id}_${Math.floor(Math.random() * 10000)}`;

                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                    appId, serverSecret, roomId, uniqueZegoId, user.name || "User"
                );

                const zp = ZegoUIKitPrebuilt.create(kitToken);
                zpRef.current = zp;

                zp.joinRoom({
                    container: containerRef.current,
                    scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
                    showPreJoinView: false,
                    turnOnCameraWhenJoining: camEnabled,
                    turnOnMicrophoneWhenJoining: micEnabled,
                    showScreenSharingButton: false,
                    onJoinRoom: () => {
                        setIsInCall(true);
                    },
                    onLeaveRoom: () => {
                        router.push('/');
                    },
                    onUserLeave: () => {
                        if (zpRef.current) {
                            try { zpRef.current.destroy(); } catch (e) { }
                            zpRef.current = null;
                        }
                        router.push('/');
                    }
                });
            } catch (error) {
                console.error("Zego init failed:", error);
                showAlert("Failed to connect to the secure room.", "error");
            }
        };

        initCall();

        return () => {
            if (zpRef.current) {
                try {
                    zpRef.current.destroy();
                } catch (e) { }
                zpRef.current = null;
            }
        };
    }, [isPreJoin]);

    // ---------------------------------------------------------
    // ADMIN ACTIONS
    // ---------------------------------------------------------
    const handleAction = async (action: "APPROVE" | "REJECT") => {
        if (action === "REJECT" && !rejectReason.trim()) {
            showAlert("Please provide a rejection reason.", "error");
            return;
        }

        setIsProcessing(true);
        try {
            await axios.post("/api/admin/video-kyc/action", { roomId, action, reason: rejectReason });
            showAlert(`Video KYC ${action === "APPROVE" ? "Approved" : "Rejected"} successfully.`, "success");
            router.push('/');
        } catch (error) {
            showAlert("Failed to process action.", "error");
            setIsProcessing(false);
        }
    };

    const handleEndCall = () => {
        router.push('/');
    };

    // ---------------------------------------------------------
    // RENDER LOGIC
    // ---------------------------------------------------------
    if (!user && isPreJoin) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>;

    // --- PHASE 1: CUSTOM PRE-JOIN VIEW ---
    if (isPreJoin) {
        return (
            <main className="fixed inset-0 w-screen h-screen bg-gray-50 dark:bg-[#050505] flex flex-col items-center justify-center transition-colors">
                <header className="absolute top-0 left-0 w-full p-6 z-40">
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">SAARTHI</span>
                        <span className="text-xs text-gray-500 font-medium">Secure Video KYC</span>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 max-w-5xl w-full px-6">
                    <div className="relative w-full md:w-1/2 aspect-4/3 bg-gray-200 dark:bg-gray-900 rounded-4xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-gray-300 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl font-black text-gray-500 dark:text-gray-400">
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Hardware will activate upon joining</p>

                        <div className="absolute bottom-6 left-0 w-full flex justify-center space-x-4">
                            <button onClick={() => setMicEnabled(!micEnabled)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${micEnabled ? 'bg-white text-black hover:bg-gray-100' : 'bg-red-500 text-white'}`}>
                                {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </button>
                            <button onClick={() => setCamEnabled(!camEnabled)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${camEnabled ? 'bg-white text-black hover:bg-gray-100' : 'bg-red-500 text-white'}`}>
                                {camEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 flex flex-col items-start">
                        <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tight mb-2">Secure Video KYC</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">Please ensure your surroundings are well-lit before joining the session.</p>
                        <div className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                            <button onClick={() => setIsPreJoin(false)} className="w-full bg-black dark:bg-white text-white dark:text-black font-black text-lg py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center space-x-2">
                                <span>Join Secure Call</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // --- PHASE 2: LIVE ZEGOCLOUD ROOM ---
    return (
        <main className="fixed inset-0 w-screen h-screen bg-[#111111] overflow-hidden">
            <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-40 pointer-events-none">
                <div className="flex flex-col">
                    <span className="text-2xl font-black text-white uppercase tracking-tighter">SAARTHI</span>
                    <span className="text-xs text-gray-400 font-medium">Secure Video KYC</span>
                </div>
            </header>

            <div ref={containerRef} className="w-full h-full" />

            {/* ADMIN OVERLAY */}
            {isAdmin && isInCall && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-9999 flex items-center space-x-3 bg-black/70 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4">
                    <button onClick={() => setShowApproveModal(true)} className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-colors shadow-lg shadow-green-500/20">
                        <CheckCircle2 className="w-4 h-4" /><span>Approve</span>
                    </button>
                    <button onClick={() => setShowRejectModal(true)} className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 text-sm font-bold px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-colors">
                        <XCircle className="w-4 h-4" /><span>Reject</span>
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-1" />
                    <button onClick={handleEndCall} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-colors">
                        <PhoneOff className="w-4 h-4" /><span>End Call</span>
                    </button>
                </div>
            )}

            {/* MODALS */}
            <AnimatePresence>
                {showApproveModal && (
                    <div className="fixed inset-0 z-10000 flex items-center justify-center px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowApproveModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#1a1a1a] border border-white/10 rounded-4xl p-8 max-w-sm w-full relative z-10 shadow-2xl">
                            <h3 className="text-xl font-black text-white mb-2">Approve Partner?</h3>
                            <p className="text-sm text-gray-400 mb-8">Confirm that the video KYC meets all security requirements. This will move the partner to the Pricing setup.</p>
                            <div className="flex space-x-3">
                                <button onClick={() => setShowApproveModal(false)} className="flex-1 py-3 rounded-xl border border-white/20 font-bold text-white hover:bg-white/5 transition-colors">Cancel</button>
                                <button onClick={() => handleAction("APPROVE")} disabled={isProcessing} className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold disabled:opacity-50 hover:bg-green-600 transition-colors">{isProcessing ? "Processing..." : "Confirm"}</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showRejectModal && (
                    <div className="fixed inset-0 z-10000 flex items-center justify-center px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRejectModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#1a1a1a] border border-white/10 rounded-4xl p-8 max-w-md w-full relative z-10 shadow-2xl">
                            <h3 className="text-xl font-black text-white mb-2">Reject Video KYC</h3>
                            <p className="text-sm text-gray-400 mb-4">Provide a reason so the partner knows what went wrong.</p>
                            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g., Lighting was too poor..." className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-red-500 resize-none h-32 mb-6" />
                            <div className="flex space-x-3">
                                <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 rounded-xl border border-white/20 font-bold text-white hover:bg-white/5 transition-colors">Cancel</button>
                                <button onClick={() => handleAction("REJECT")} disabled={isProcessing} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50">{isProcessing ? "Processing..." : "Reject Partner"}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}