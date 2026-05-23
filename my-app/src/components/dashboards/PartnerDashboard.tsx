"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Check, Lock, Clock, AlertOctagon, ArrowRight, Video, Loader2 } from "lucide-react";
import Navbar from "../Navbar";
import axios from "axios";
import { useAlert } from "../../context/AlertContext";

const ONBOARDING_STEPS = [
  { id: 1, title: "Vehicle", url: "/partner/onboarding/vehicle" },
  { id: 2, title: "Documents", url: "/partner/onboarding/documents" },
  { id: 3, title: "Bank", url: "/partner/onboarding/bank" },
  { id: 4, title: "Review", url: null },
  { id: 5, title: "Video KYC", url: null },
  { id: 6, title: "Pricing", url: null },
  { id: 7, title: "Final Review", url: null },
  { id: 8, title: "Live", url: null },
];

export default function PartnerDashboard() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const user = useSelector((state: RootState) => state.auth.user);
  const dbStep = user?.partnerOnboardingSteps || 0;
  const partnerStatus = user?.partnerStatus || "PENDING";
  const rejectReason = user?.rejectReason || null;

  const [mounted, setMounted] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => setMounted(true), []);

  // --- NEW RETRY FUNCTION ---
  const handleRetryKyc = async () => {
    setIsRetrying(true);
    try {
      await axios.post("/api/partner/video-kyc/retry");
      showAlert("Retry requested! An executive will call you soon.", "success");
    } catch (error) {
      showAlert("Failed to request retry. Please try again.", "error");
    } finally {
      setIsRetrying(false);
    }
  };

  const progressPercentage = (Math.min(dbStep, ONBOARDING_STEPS.length - 1) / (ONBOARDING_STEPS.length - 1)) * 100;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-300 font-sans">

      <div className="bg-black text-white">
        <Navbar onLoginClick={() => { }} />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tight mb-2">
            Partner Onboarding
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Complete all steps to activate your account
          </p>
        </motion.div>

        {/* The Stepper Card */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-900 rounded-4xl shadow-xl p-8 md:p-12 overflow-x-auto hide-scrollbar mb-8">
          <div className="min-w-[800px] relative flex items-center justify-between mt-4 mb-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full z-0 overflow-hidden w-full">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: mounted ? `${progressPercentage}%` : "0%" }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-black dark:bg-white"
              />
            </div>

            {ONBOARDING_STEPS.map((step, index) => {
              const isCompleted = index < dbStep;
              const isActive = index === dbStep;
              const isLocked = index > dbStep;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 + 0.3, type: "spring" }}
                    onClick={() => {
                      if (isCompleted && step.url) router.push(step.url);
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${isCompleted ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black cursor-pointer hover:scale-110 shadow-lg" : ""}
                      ${isActive ? "bg-white dark:bg-[#0a0a0a] border-black dark:border-white text-black dark:text-white shadow-xl scale-110" : ""}
                      ${isLocked ? "bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700" : ""}
                    `}
                  >
                    {isCompleted && <Check className="w-5 h-5" />}
                    {isActive && <span className="font-bold text-lg">{step.id}</span>}
                    {isLocked && <Lock className="w-4 h-4" />}
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 + 0.4 }}
                    className={`absolute -bottom-8 text-xs font-bold whitespace-nowrap ${(isCompleted || isActive) ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-600"}`}
                  >
                    {step.title}
                  </motion.span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- DYNAMIC ALERTS --- */}
        <AnimatePresence>

          {/* STEP 4: DOCUMENT REVIEW ALERTS */}
          {mounted && dbStep >= 3 && partnerStatus !== "APPROVED" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: 0.5, type: "spring" }}>
              {partnerStatus === "PENDING" && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-4xl p-6 md:p-8 flex items-start md:items-center space-x-6 shadow-sm mb-6">
                  <div className="w-14 h-14 shrink-0 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center"><Clock className="w-7 h-7 text-amber-600 dark:text-amber-500" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400">Documents under review</h3>
                    <p className="text-amber-700 dark:text-amber-600/80 mt-1 text-sm md:text-base leading-relaxed">Our admin team is currently verifying your documents. We will notify you once approved!</p>
                  </div>
                </div>
              )}
              {partnerStatus === "REJECTED" && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-4xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between space-y-6 md:space-y-0 md:space-x-6 shadow-sm mb-6">
                  <div className="flex items-start md:items-center space-x-6">
                    <div className="w-14 h-14 shrink-0 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center"><AlertOctagon className="w-7 h-7 text-red-600 dark:text-red-500" /></div>
                    <div>
                      <h3 className="text-lg font-bold text-red-900 dark:text-red-400">Application Requires Update</h3>
                      <p className="text-red-700 dark:text-red-400/80 mt-1 text-sm md:text-base font-medium">Reason: <span className="text-red-900 dark:text-red-300 font-bold">{rejectReason || "Please review your submitted documents and try again."}</span></p>
                    </div>
                  </div>
                  <button onClick={() => router.push("/partner/onboarding/documents")} className="shrink-0 w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2">
                    <span>Update Documents</span><ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 5: VIDEO KYC ALERTS */}
          {mounted && partnerStatus === "APPROVED" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: 0.3, type: "spring" }}>

              {user?.videoKycStatus === "PENDING" && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-4xl p-6 md:p-8 flex items-start md:items-center space-x-6 shadow-sm">
                  <div className="w-14 h-14 shrink-0 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center"><Clock className="w-7 h-7 text-blue-600 dark:text-blue-500 animate-pulse" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-400">Step 1 Complete! Waiting for Video KYC</h3>
                    <p className="text-blue-700 dark:text-blue-600/80 mt-1 text-sm md:text-base leading-relaxed">Your documents are approved. Please stay on this page. An executive will initiate your Video KYC call shortly.</p>
                  </div>
                </div>
              )}

              {user?.videoKycStatus === "IN_PROGRESS" && (
                <div className="bg-green-500 dark:bg-green-600 rounded-4xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between space-y-6 md:space-y-0 md:space-x-6 shadow-xl shadow-green-500/20 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-start md:items-center space-x-6 text-white">
                    <div className="w-14 h-14 shrink-0 bg-white/20 rounded-full flex items-center justify-center"><Video className="w-7 h-7 text-white" /></div>
                    <div>
                      <h3 className="text-xl font-black">Incoming KYC Call</h3>
                      <p className="text-green-50 mt-1 text-sm md:text-base font-medium">Our executive has started the room. Please ensure your camera and microphone are ready.</p>
                    </div>
                  </div>
                  <button onClick={() => router.push(`/video-kyc/${user.videoKycRoomId}`)} className="shrink-0 w-full md:w-auto bg-white text-green-700 hover:bg-gray-50 font-black py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center space-x-2">
                    <span>Join Video Call</span><ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* --- NEW: VIDEO KYC REJECTED BANNER --- */}
              {user?.videoKycStatus === "REJECTED" && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-4xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between space-y-6 md:space-y-0 md:space-x-6 shadow-sm">
                  <div className="flex items-start md:items-center space-x-6">
                    <div className="w-14 h-14 shrink-0 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                      <AlertOctagon className="w-7 h-7 text-red-600 dark:text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-900 dark:text-red-400">Video KYC Rejected</h3>
                      <p className="text-red-700 dark:text-red-400/80 mt-1 text-sm md:text-base font-medium">
                        Reason: <span className="text-red-900 dark:text-red-300 font-bold">{user.videoKycRejectReason || "Verification failed."}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRetryKyc}
                    disabled={isRetrying}
                    className="shrink-0 w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isRetrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Request Retry</span>}
                    {!isRetrying && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}