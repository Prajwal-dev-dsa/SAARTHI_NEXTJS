"use client";

import { useState, useEffect } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    Users, CheckCircle2, Clock, XCircle,
    ChevronRight, Video, CarFront, Loader2, User,
    ChevronDown, LogOut, Moon, Sun
} from "lucide-react";
import axios from "axios";
import { useAlert } from "../../context/AlertContext";

// --- TypeScript Interfaces ---
interface DashboardMetrics {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
}

interface UnderReviewPartner {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    partnerOnboardingSteps: number;
    created_at: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { showAlert } = useAlert();

    // State
    const [metrics, setMetrics] = useState<DashboardMetrics>({ total: 0, approved: 0, pending: 0, rejected: 0 });
    const [queue, setQueue] = useState<UnderReviewPartner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("reviews");

    // Profile Dropdown State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Fetch Data & Check initial theme
    useEffect(() => {
        // Check initial theme from document class
        setIsDarkMode(document.documentElement.classList.contains("dark"));

        const fetchDashboardData = async () => {
            try {
                const response = await axios.get("/api/admin/dashboard");
                if (response.data) {
                    setMetrics(response.data.metrics);
                    setQueue(response.data.underReview);
                }
            } catch (error: any) {
                showAlert("Failed to load admin dashboard data.", "error");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [showAlert]);

    // Theme Toggle Handler
    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove("dark");
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add("dark");
            setIsDarkMode(true);
        }
    };

    // Animation Variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 border border-gray-100 dark:border-gray-900 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgClass}`}>
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">{title}</span>
            </div>
            <div className="text-3xl font-black text-black dark:text-white mt-4">{value}</div>
        </motion.div>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-300 font-sans">

            {/* --- CUSTOM ADMIN NAVBAR --- */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-900 shadow-sm transition-colors duration-300">
                {/* Logo */}
                <div className="flex items-center cursor-pointer" onClick={() => router.push("/")}>
                    <span className="text-2xl font-black tracking-tighter text-black dark:text-white uppercase">SAARTHI</span>
                </div>

                {/* Admin Dropdown Menu */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all"
                    >
                        <User className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Invisible backdrop to close dropdown when clicking outside */}
                    {isProfileOpen && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsProfileOpen(false)}
                        />
                    )}

                    {/* Animated Dropdown Menu */}
                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-3 w-48 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-50"
                            >
                                <div className="p-2 space-y-1">

                                    {/* Theme Toggle Button */}
                                    <button
                                        onClick={() => {
                                            toggleTheme();
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                            <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                                        </div>
                                    </button>

                                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

                                    {/* Logout Button */}
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Log Out</span>
                                    </button>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* --- DASHBOARD CONTENT --- */}
            <div className="max-w-[1200px] mx-auto px-6 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight">Admin Overview</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage partner applications and system health</p>
                    </div>
                </div>

                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">

                    {/* SECTION 1: Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Total Partners" value={metrics.total} icon={Users} colorClass="text-purple-600 dark:text-purple-400" bgClass="bg-purple-50 dark:bg-purple-900/20" />
                        <StatCard title="Approved" value={metrics.approved} icon={CheckCircle2} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-50 dark:bg-blue-900/20" />
                        <StatCard title="Pending" value={metrics.pending} icon={Clock} colorClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-50 dark:bg-amber-900/20" />
                        <StatCard title="Rejected" value={metrics.rejected} icon={XCircle} colorClass="text-red-600 dark:text-red-400" bgClass="bg-red-50 dark:bg-red-900/20" />
                    </div>

                    {/* SECTION 2: Tab Navigation */}
                    <motion.div variants={itemVariants} className="flex overflow-x-auto hide-scrollbar py-2">
                        <div className="flex bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-900 rounded-full p-1.5 shadow-sm">
                            <button
                                onClick={() => setActiveTab("reviews")}
                                className={`flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "reviews" ? "bg-black text-white dark:bg-white dark:text-black shadow-md" : "text-gray-500 hover:text-black dark:hover:text-white"}`}
                            >
                                <Users className="w-4 h-4" />
                                <span>Pending Partner Reviews</span>
                                <span className={`flex items-center justify-center text-[10px] w-5 h-5 rounded-full ${activeTab === "reviews" ? "bg-white text-black dark:bg-black dark:text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                                    {queue.length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab("video")}
                                className={`flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "video" ? "bg-black text-white dark:bg-white dark:text-black shadow-md" : "text-gray-500 hover:text-black dark:hover:text-white"}`}
                            >
                                <Video className="w-4 h-4" />
                                <span>Pending Video KYC</span>
                                <span className={`flex items-center justify-center text-[10px] w-5 h-5 rounded-full ${activeTab === "video" ? "bg-white text-black dark:bg-black dark:text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                                    0
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab("vehicles")}
                                className={`flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "vehicles" ? "bg-black text-white dark:bg-white dark:text-black shadow-md" : "text-gray-500 hover:text-black dark:hover:text-white"}`}
                            >
                                <CarFront className="w-4 h-4" />
                                <span>Pending Vehicle Reviews</span>
                                <span className={`flex items-center justify-center text-[10px] w-5 h-5 rounded-full ${activeTab === "vehicles" ? "bg-white text-black dark:bg-black dark:text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                                    0
                                </span>
                            </button>
                        </div>
                    </motion.div>

                    {/* SECTION 3: Queue List */}
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase">Partner Reviews Queue</h3>
                            <span className="text-xs text-gray-500">{queue.length} items</span>
                        </div>

                        <div className="space-y-3">
                            {queue.length === 0 ? (
                                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-900 rounded-4xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h4 className="text-lg font-bold text-black dark:text-white">All Caught Up!</h4>
                                    <p className="text-sm text-gray-500 mt-1">There are no pending partner applications to review right now.</p>
                                </div>
                            ) : (
                                queue.map((partner) => (
                                    <motion.div
                                        key={partner.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-900 rounded-full p-3 pr-4 flex items-center justify-between shadow-sm hover:border-black dark:hover:border-white transition-colors group"
                                    >
                                        <div className="flex items-center space-x-4">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold flex items-center justify-center text-lg">
                                                {partner.name.charAt(0).toUpperCase()}
                                            </div>

                                            {/* Info */}
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-black dark:text-white">{partner.name}</span>
                                                <span className="text-xs text-gray-500">{partner.email}</span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => router.push(`/admin/review/${partner.id}`)}
                                            className="bg-black dark:bg-white text-white dark:text-black font-bold text-sm px-6 py-2.5 rounded-full flex items-center space-x-2 hover:scale-105 transition-transform"
                                        >
                                            <span>Review</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>

                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </main>
    );
}