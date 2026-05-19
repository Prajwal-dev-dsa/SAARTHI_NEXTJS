"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, CreditCard, Landmark, Phone, AtSign, Loader2 } from "lucide-react";
import axios from "axios";
import { useAlert } from "@/context/AlertContext";

export default function BankDetailsPage() {
    const router = useRouter();
    const { showAlert } = useAlert();

    // Form States
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifsc, setIfsc] = useState("");
    const [mobile, setMobile] = useState("");
    const [upi, setUpi] = useState("");

    // Loading States
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- GET API: Fetch existing data ---
    useEffect(() => {
        const fetchBankData = async () => {
            try {
                const response = await axios.get("/api/onboarding/bank");
                if (response.data) {
                    if (response.data.bankDetails) {
                        setAccountName(response.data.bankDetails.accountHolderName || "");
                        setAccountNumber(response.data.bankDetails.accountNumber || "");
                        setIfsc(response.data.bankDetails.ifscCode || "");
                        setUpi(response.data.bankDetails.upiId || "");
                    }
                    if (response.data.phone) {
                        setMobile(response.data.phone);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch bank data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBankData();
    }, []);

    // --- POST API: Submit/Update data ---
    const handleSubmit = async () => {
        // Basic Frontend Validation
        if (!accountName.trim() || !accountNumber.trim() || !ifsc.trim() || !mobile.trim()) {
            showAlert("Please fill in all required fields.", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            await axios.post("/api/onboarding/bank", {
                accountHolderName: accountName,
                accountNumber: accountNumber,
                ifscCode: ifsc,
                mobileNumber: mobile,
                upiId: upi,
            });

            showAlert("Bank Setup Complete! Welcome to Saarthi.", "success");

            // Route them to their new Partner Dashboard
            router.push("/");

        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Failed to save bank details. Please try again.";
            showAlert(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-gray-50 dark:bg-[#050505] flex justify-center items-center py-6 md:py-12 px-4 transition-colors duration-300">
            <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] rounded-4xl shadow-xl border border-gray-100 dark:border-gray-900 overflow-hidden relative h-[70vh] md:h-[85vh] max-h-[750px] flex flex-col">

                {/* Header */}
                <div className="pt-8 px-8 pb-4 relative z-10 bg-white dark:bg-[#0a0a0a]">
                    <button
                        onClick={() => router.back()}
                        className="absolute left-8 top-8 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center mt-2">
                        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Step 3 of 3</p>
                        <h1 className="text-2xl font-black text-black dark:text-white">Bank & Payout Setup</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Used for partner payouts</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 hide-scrollbar">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-5">

                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Account holder name</label>
                            <div className="flex items-center border-b border-gray-200 dark:border-gray-800 pb-2 focus-within:border-black dark:focus-within:border-white transition-colors">
                                <CheckCircle2 className="w-4 h-4 text-gray-400 mr-3" />
                                <input
                                    type="text"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    placeholder="As per bank records"
                                    className="w-full bg-transparent outline-none text-sm text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bank account number</label>
                            <div className="flex items-center border-b border-gray-200 dark:border-gray-800 pb-2 focus-within:border-black dark:focus-within:border-white transition-colors">
                                <CreditCard className="w-4 h-4 text-gray-400 mr-3" />
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    placeholder="Enter account number"
                                    className="w-full bg-transparent outline-none text-sm text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">IFSC code</label>
                            <div className="flex items-center border-b border-gray-200 dark:border-gray-800 pb-2 focus-within:border-black dark:focus-within:border-white transition-colors">
                                <Landmark className="w-4 h-4 text-gray-400 mr-3" />
                                <input
                                    type="text"
                                    value={ifsc}
                                    onChange={(e) => setIfsc(e.target.value)}
                                    placeholder="HDFC0001234"
                                    className="w-full bg-transparent outline-none text-sm text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700 uppercase"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mobile number</label>
                            <div className="flex items-center border-b border-gray-200 dark:border-gray-800 pb-2 focus-within:border-black dark:focus-within:border-white transition-colors">
                                <Phone className="w-4 h-4 text-gray-400 mr-3" />
                                <input
                                    type="tel"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    placeholder="10 digit mobile number"
                                    className="w-full bg-transparent outline-none text-sm text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">UPI ID (optional)</label>
                            <div className="flex items-center border-b border-gray-200 dark:border-gray-800 pb-2 focus-within:border-black dark:focus-within:border-white transition-colors">
                                <AtSign className="w-4 h-4 text-gray-400 mr-3" />
                                <input
                                    type="text"
                                    value={upi}
                                    onChange={(e) => setUpi(e.target.value)}
                                    placeholder="name@upi"
                                    className="w-full bg-transparent outline-none text-sm text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
                                />
                            </div>
                        </div>

                        <div className="flex items-start space-x-2 mt-4 text-gray-400">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            <p className="text-xs leading-relaxed">Bank details are verified before first payout. This usually takes 24-48 hours.</p>
                        </div>
                    </motion.div>
                </div>

                {/* Footer Button */}
                <div className="absolute bottom-0 left-0 w-full p-8 bg-linear-to-t from-white via-white dark:from-[#0a0a0a] dark:via-[#0a0a0a] to-transparent pt-12 pointer-events-none z-20">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl hover:opacity-80 transition-opacity shadow-xl pointer-events-auto disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span>{isSubmitting ? "Finalizing Setup..." : "Complete Setup"}</span>
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
        </div>
    );
}