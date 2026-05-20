"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Check, Lock } from "lucide-react";
import Navbar from "../Navbar";
import { useSession } from "next-auth/react";

// Define the exact flow of your onboarding
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
    const session = useSession();
    console.log(session)
    const router = useRouter();

    // Get the current step from Redux (e.g., if they finished Bank, this should be 3)
    const dbStep = useSelector((state: RootState) => state.auth.user?.partnerOnboardingSteps || 0);

    // To trigger animations on mount
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Calculate progress line percentage based on completed steps
    // (dbStep / total segments) * 100
    const progressPercentage = (Math.min(dbStep, ONBOARDING_STEPS.length - 1) / (ONBOARDING_STEPS.length - 1)) * 100;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-300 font-sans">
            {/* Assuming you want your standard Navbar at the top */}
            <div className="bg-black text-white">
                <Navbar onLoginClick={() => { }} />
            </div>

            <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tight mb-2">
                        Partner Onboarding
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Complete all steps to activate your account
                    </p>
                </motion.div>

                {/* The Premium Stepper Card */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-900 rounded-4xl shadow-xl p-8 md:p-12 overflow-x-auto hide-scrollbar">

                    <div className="min-w-[800px] relative flex items-center justify-between mt-4 mb-8">

                        {/* Background Line (Gray) */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full z-0"></div>

                        {/* Animated Progress Line (Black/White) */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full z-0 overflow-hidden w-full">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: mounted ? `${progressPercentage}%` : "0%" }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                                className="h-full bg-black dark:bg-white"
                            />
                        </div>

                        {/* Step Circles */}
                        {ONBOARDING_STEPS.map((step, index) => {
                            const isCompleted = index < dbStep;
                            const isActive = index === dbStep;
                            const isLocked = index > dbStep;

                            return (
                                <div key={step.id} className="relative z-10 flex flex-col items-center">

                                    {/* Circle */}
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.4, delay: index * 0.1 + 0.3, type: "spring" }}
                                        onClick={() => {
                                            // Only allow routing if the step is completed and has a URL
                                            if (isCompleted && step.url) {
                                                router.push(step.url);
                                            }
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

                                    {/* Label below the circle */}
                                    <motion.span
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.1 + 0.4 }}
                                        className={`absolute -bottom-8 text-xs font-bold whitespace-nowrap
                      ${(isCompleted || isActive) ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-600"}
                    `}
                                    >
                                        {step.title}
                                    </motion.span>

                                </div>
                            );
                        })}

                    </div>
                </div>
            </div>

            {/* Hide scrollbar for the overflowing stepper on small screens */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </main>
    );
}