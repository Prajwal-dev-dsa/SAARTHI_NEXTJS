"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { setUser } from "../../store/authSlice";
import {
  Check, Lock, Clock, AlertOctagon, ArrowRight, Video,
  Loader2, AlertTriangle, UploadCloud, Rocket
} from "lucide-react";
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
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  const user = useSelector((state: RootState) => state.auth.user);
  const dbStep = user?.partnerOnboardingSteps || 0;
  const partnerStatus = user?.partnerStatus || "PENDING";
  const rejectReason = user?.rejectReason || null;

  const [mounted, setMounted] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // --- PRICING MODAL STATES ---
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isFetchingPricing, setIsFetchingPricing] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingData, setPricingData] = useState({
    baseFare: "", pricePerKm: "", waitingCharge: "",
    frontImageUrl: "", backImageUrl: "", leftImageUrl: "", rightImageUrl: ""
  });
  const [pricingFiles, setPricingFiles] = useState<{ [key: string]: File | null }>({
    frontImageUrl: null, backImageUrl: null, leftImageUrl: null, rightImageUrl: null
  });

  useEffect(() => setMounted(true), []);

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

  // --- OPEN MODAL & FETCH DATA ---
  const handleOpenPricingModal = async () => {
    setIsPricingModalOpen(true);
    setIsFetchingPricing(true);
    try {
      const res = await axios.get("/api/partner/vehicle/pricing");
      if (res.data) {
        setPricingData({
          baseFare: res.data.baseFare || "",
          pricePerKm: res.data.pricePerKm || "",
          waitingCharge: res.data.waitingCharge || "",
          frontImageUrl: res.data.frontImageUrl || "",
          backImageUrl: res.data.backImageUrl || "",
          leftImageUrl: res.data.leftImageUrl || "",
          rightImageUrl: res.data.rightImageUrl || "",
        });
      }
    } catch (error) {
      console.error("New user, no pricing data yet.");
    } finally {
      setIsFetchingPricing(false);
    }
  };

  // --- SAVE PRICING DATA ---
  const handleSavePricing = async () => {
    if (!pricingData.baseFare || !pricingData.pricePerKm || !pricingData.waitingCharge) {
      return showAlert("Please fill in all pricing fields accurately.", "error");
    }
    if (!pricingData.frontImageUrl || !pricingData.backImageUrl || !pricingData.leftImageUrl || !pricingData.rightImageUrl) {
      return showAlert("Please upload all 4 vehicle images.", "error");
    }

    setIsSavingPricing(true);
    try {
      const formData = new FormData();
      formData.append("baseFare", pricingData.baseFare);
      formData.append("pricePerKm", pricingData.pricePerKm);
      formData.append("waitingCharge", pricingData.waitingCharge);

      if (pricingFiles.frontImageUrl) formData.append("frontImage", pricingFiles.frontImageUrl);
      if (pricingFiles.backImageUrl) formData.append("backImage", pricingFiles.backImageUrl);
      if (pricingFiles.leftImageUrl) formData.append("leftImage", pricingFiles.leftImageUrl);
      if (pricingFiles.rightImageUrl) formData.append("rightImage", pricingFiles.rightImageUrl);

      await axios.post("/api/partner/vehicle/pricing", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      showAlert("Pricing and images submitted for Final Review!", "success");
      setIsPricingModalOpen(false);

      if (user) {
        dispatch(setUser({
          ...user,
          partnerOnboardingSteps: 6,
          partnerStatus: "PENDING",
          rejectReason: null
        }));
      }
    } catch (error: any) {
      showAlert(error.response?.data?.error || "Failed to save data.", "error");
    } finally {
      setIsSavingPricing(false);
    }
  };

  const progressPercentage = (Math.min(dbStep, ONBOARDING_STEPS.length - 1) / (ONBOARDING_STEPS.length - 1)) * 100;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-300 font-sans pb-20">

      <div className="bg-black text-white">
        <Navbar onLoginClick={() => { }} />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tight mb-2">Partner Onboarding</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Complete all steps to activate your account</p>
        </motion.div>

        {/* The Stepper Card */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-900 rounded-4xl shadow-xl p-8 md:p-12 overflow-x-auto hide-scrollbar mb-8">
          <div className="min-w-[800px] relative flex items-center justify-between mt-4 mb-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full z-0 overflow-hidden w-full">
              <motion.div initial={{ width: "0%" }} animate={{ width: mounted ? `${progressPercentage}%` : "0%" }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} className="h-full bg-black dark:bg-white" />
            </div>

            {ONBOARDING_STEPS.map((step, index) => {
              const isCompleted = index < dbStep;
              const isActive = index === dbStep;
              const isLocked = index > dbStep;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: index * 0.1 + 0.3, type: "spring" }}
                    onClick={() => {
                      if (isCompleted && step.url) router.push(step.url);
                      if ((isCompleted || isActive) && step.id === 6) handleOpenPricingModal();
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${isCompleted ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black cursor-pointer hover:scale-110 shadow-lg" : ""}
                      ${isActive ? "bg-white dark:bg-[#0a0a0a] border-black dark:border-white text-black dark:text-white shadow-xl scale-110 cursor-pointer" : ""}
                      ${isLocked ? "bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700" : ""}
                    `}
                  >
                    {isCompleted && <Check className="w-5 h-5" />}
                    {isActive && <span className="font-bold text-lg">{step.id}</span>}
                    {isLocked && <Lock className="w-4 h-4" />}
                  </motion.div>
                  <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 + 0.4 }} className={`absolute -bottom-8 text-xs font-bold whitespace-nowrap ${(isCompleted || isActive) ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>
                    {step.title}
                  </motion.span>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>

          {/* STEP 4: DOCUMENT REVIEW ALERTS (Only shows if dbStep is exactly 3) */}
          {mounted && dbStep === 3 && (
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

          {/* STEP 5: VIDEO KYC ALERTS (Shows for dbStep 4 or 5) */}
          {mounted && dbStep >= 4 && dbStep < 6 && (
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

          {/* STEP 7: FINAL REVIEW ALERTS (Pending or Rejected) */}
          {mounted && dbStep === 6 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: "spring" }}>

              {partnerStatus !== "REJECTED" && (
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-4xl p-6 md:p-8 flex items-start md:items-center space-x-6 shadow-sm">
                  <div className="w-14 h-14 shrink-0 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center"><Clock className="w-7 h-7 text-purple-600 dark:text-purple-500 animate-pulse" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-purple-900 dark:text-purple-400">Final Vehicle Review Pending</h3>
                    <p className="text-purple-700 dark:text-purple-600/80 mt-1 text-sm md:text-base leading-relaxed">Our admin is reviewing your vehicle images and pricing structure. This is the final step before you go Live!</p>
                  </div>
                </div>
              )}

              {partnerStatus === "REJECTED" && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-4xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between space-y-6 md:space-y-0 md:space-x-6 shadow-sm">
                  <div className="flex items-start md:items-center space-x-6">
                    <div className="w-14 h-14 shrink-0 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center"><AlertOctagon className="w-7 h-7 text-red-600 dark:text-red-500" /></div>
                    <div>
                      <h3 className="text-lg font-bold text-red-900 dark:text-red-400">Vehicle Review Rejected</h3>
                      <p className="text-red-700 dark:text-red-400/80 mt-1 text-sm md:text-base font-medium">Reason: <span className="text-red-900 dark:text-red-300 font-bold">{rejectReason || "Please fix your vehicle images or pricing and try again."}</span></p>
                    </div>
                  </div>
                  <button onClick={handleOpenPricingModal} className="shrink-0 w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2">
                    <span>Update Pricing / Images</span><ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 8: YOU ARE LIVE BANNER! */}
          {mounted && dbStep >= 7 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: "spring" }}>
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-4xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between space-y-6 md:space-y-0 md:space-x-6 shadow-sm">
                <div className="flex items-start md:items-center space-x-6">
                  <div className="w-14 h-14 shrink-0 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                    <Rocket className="w-7 h-7 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-900 dark:text-green-400">You're Live!</h3>
                    <p className="text-green-700 dark:text-green-600/80 mt-1 text-sm md:text-base leading-relaxed">Your vehicle is verified. You are now ready to accept rides and start earning.</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/partner/bookings")}
                  className="shrink-0 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Go to Bookings</span><ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* --- PRICING & IMAGES MODAL --- */}
      <AnimatePresence>
        {isPricingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPricingModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-900 rounded-4xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">

              <div className="p-6 border-b border-gray-100 dark:border-gray-900 sticky top-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-20">
                <h2 className="text-2xl font-black text-black dark:text-white">Pricing & Vehicle Images</h2>
                <p className="text-sm text-gray-500 mt-1">Upload 4 clear angles of your vehicle and set your desired rates.</p>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                {isFetchingPricing ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" /></div>
                ) : (
                  <>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                        <span className="font-bold">Image Guidelines:</span> Ensure images are taken in daylight. The <span className="font-bold underline">Front image MUST clearly show the number plate</span>, otherwise your application will be instantly rejected.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: "frontImageUrl", label: "Front (with Number Plate)" },
                        { key: "backImageUrl", label: "Back / Top" },
                        { key: "leftImageUrl", label: "Left Side" },
                        { key: "rightImageUrl", label: "Right Side" },
                      ].map((imgField) => (
                        <div key={imgField.key} className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">{imgField.label}</span>
                          <div className="relative aspect-video bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-xl flex items-center justify-center overflow-hidden hover:border-black dark:hover:border-white transition-colors group">
                            {pricingData[imgField.key as keyof typeof pricingData] ? (
                              <img src={pricingData[imgField.key as keyof typeof pricingData]} alt={imgField.label} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center p-4">
                                <UploadCloud className="w-6 h-6 text-gray-400 mx-auto mb-2 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                <span className="text-xs text-gray-500 font-medium">Click to upload</span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const fakeUrl = URL.createObjectURL(file);

                                  // Save the string for UI preview
                                  setPricingData({ ...pricingData, [imgField.key]: fakeUrl });

                                  // Save the actual File object for the Axios upload
                                  setPricingFiles({ ...pricingFiles, [imgField.key]: file });
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <hr className="border-gray-100 dark:border-gray-900" />

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                        <span className="font-bold">Pricing Policy:</span> Please enter logical and competitive market rates. Absurdly high prices will result in application rejection.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">Base Fare</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                          <input
                            type="number" placeholder="e.g. 50" min="0"
                            value={pricingData.baseFare} onChange={(e) => setPricingData({ ...pricingData, baseFare: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3.5 pl-10 pr-4 text-black dark:text-white font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">Price Per KM</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                          <input
                            type="number" placeholder="e.g. 12" min="0"
                            value={pricingData.pricePerKm} onChange={(e) => setPricingData({ ...pricingData, pricePerKm: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3.5 pl-10 pr-4 text-black dark:text-white font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">Waiting Charge (Per Minute)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                          <input
                            type="number" placeholder="e.g. 2" min="0"
                            value={pricingData.waitingCharge} onChange={(e) => setPricingData({ ...pricingData, waitingCharge: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3.5 pl-10 pr-4 text-black dark:text-white font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-900 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md flex space-x-3 sticky bottom-0 z-20">
                <button onClick={() => setIsPricingModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-800 font-bold text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">Cancel</button>
                <button
                  onClick={handleSavePricing}
                  disabled={isSavingPricing || isFetchingPricing}
                  className="flex-1 py-3.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold disabled:opacity-50 hover:scale-[1.02] transition-transform"
                >
                  {isSavingPricing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save & Continue"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}