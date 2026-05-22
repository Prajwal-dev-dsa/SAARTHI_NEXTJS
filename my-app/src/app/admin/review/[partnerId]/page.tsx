"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  ArrowLeft, Car, Landmark, FileText, CheckCircle2,
  XCircle, Clock, ExternalLink, Loader2
} from "lucide-react";
import { useAlert } from "@/context/AlertContext";

export default function AdminReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert } = useAlert();
  const partnerId = params.partnerId as string;

  // Data State
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal States
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch Partner Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/admin/review/${partnerId}`);
        setData(response.data);
      } catch (error) {
        showAlert("Failed to load partner details.", "error");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };
    if (partnerId) fetchData();
  }, [partnerId, router, showAlert]);

  // Action Handler
  const handleAction = async (action: "APPROVE" | "REJECTE") => {
    if (action === "REJECTE" && !rejectReason.trim()) {
      showAlert("Please provide a rejection reason.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      await axios.post(`/api/admin/review/${partnerId}`, { action, reason: rejectReason });
      showAlert(`Partner successfully ${action.toLowerCase()}d!`, "success");
      router.push("/"); // Send admin back to dashboard
    } catch (error: any) {
      showAlert(error.response?.data?.error || "Failed to process action", "error");
      setIsProcessing(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" />
      </div>
    );
  }

  const vehicle = data.vehicles?.[0] || {};
  const bank = data.bankDetails || {};
  const docs = data.documents || {};

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans pb-20">

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-900 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-black dark:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white leading-tight">{data.name}</h1>
            <p className="text-xs text-gray-500">{data.email}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center space-x-2
          ${data.partnerStatus === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : ""}
          ${data.partnerStatus === "APPROVED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}
          ${data.partnerStatus === "REJECTED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : ""}
        `}>
          {data.partnerStatus === "PENDING" && <Clock className="w-4 h-4" />}
          {data.partnerStatus === "APPROVED" && <CheckCircle2 className="w-4 h-4" />}
          {data.partnerStatus === "REJECTED" && <XCircle className="w-4 h-4" />}
          <span>{data.partnerStatus}</span>
        </div>
      </header>

      {/* Content Grid */}
      <div className="max-w-[1200px] mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Vehicle & Docs) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Vehicle Card */}
          <section className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-900 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-6 text-black dark:text-white">
              <Car className="w-5 h-5" />
              <h2 className="text-lg font-bold">Vehicle Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Type</p>
                <p className="font-semibold text-black dark:text-white">{vehicle.type || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Registration Number</p>
                <p className="font-semibold text-black dark:text-white uppercase">{vehicle.vehicleNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Model</p>
                <p className="font-semibold text-black dark:text-white">{vehicle.model || "N/A"}</p>
              </div>
            </div>
          </section>

          {/* Documents Card */}
          <section className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-900 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-6 text-black dark:text-white">
              <FileText className="w-5 h-5" />
              <h2 className="text-lg font-bold">Documents</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Document Helper Component */}
              {[
                { title: "Aadhaar Card", url: docs.aadharCardUrl },
                { title: "Registration (RC)", url: docs.rcUrl },
                { title: "Driving License", url: docs.drivingLicenseUrl },
              ].map((doc, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-center text-gray-600 dark:text-gray-300">
                    {doc.title}
                  </div>
                  <div className="h-40 bg-gray-100 dark:bg-[#111] relative group flex items-center justify-center">
                    {doc.url ? (
                      <>
                        <img src={doc.url} alt={doc.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity" />
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black text-white text-xs font-bold px-4 py-2 rounded-full flex items-center space-x-2">
                            <span>View Full</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </a>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">Not Uploaded</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (Bank & Action Panel) */}
        <div className="space-y-6">

          {/* Bank Details */}
          <section className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-900 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-6 text-black dark:text-white">
              <Landmark className="w-5 h-5" />
              <h2 className="text-lg font-bold">Bank Details</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                <span className="text-sm text-gray-500">Account Holder</span>
                <span className="font-semibold text-black dark:text-white text-right">{bank.accountHolderName || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                <span className="text-sm text-gray-500">Account No.</span>
                <span className="font-semibold text-black dark:text-white text-right">{bank.accountNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                <span className="text-sm text-gray-500">IFSC Code</span>
                <span className="font-semibold text-black dark:text-white text-right uppercase">{bank.ifscCode || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">UPI ID</span>
                <span className="font-semibold text-black dark:text-white text-right">{bank.upiId || "-"}</span>
              </div>
            </div>
          </section>

          {/* Admin Action Panel (Only show if still PENDING) */}
          {data.partnerStatus === "PENDING" && (
            <section className="bg-white dark:bg-[#0a0a0a] border border-blue-100 dark:border-blue-900/30 rounded-3xl p-6 shadow-xl shadow-blue-900/5 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-2 text-black dark:text-white">
                  <CheckCircle2 className="w-5 h-5" />
                  <h2 className="text-lg font-bold">Admin Check</h2>
                </div>
                <p className="text-xs text-gray-500 mb-6">Verify all documents carefully before making a final decision.</p>

                <div className="space-y-3">
                  <button
                    onClick={() => setIsApproveModalOpen(true)}
                    className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity"
                  >
                    Approve Partner
                  </button>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    className="w-full bg-white dark:bg-[#0a0a0a] text-black dark:text-white border border-gray-200 dark:border-gray-800 font-bold py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {/* APPROVE MODAL */}
        {isApproveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsApproveModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-[#0a0a0a] rounded-4xl p-8 max-w-sm w-full relative z-10 shadow-2xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-black text-black dark:text-white mb-2">Approve Partner?</h3>
              <p className="text-sm text-gray-500 mb-8">Confirm all information has been strictly verified. This user will immediately become an active partner.</p>
              <div className="flex space-x-3">
                <button onClick={() => setIsApproveModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-800 font-bold text-black dark:text-white">Cancel</button>
                <button onClick={() => handleAction("APPROVE")} disabled={isProcessing} className="flex-1 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold disabled:opacity-50">
                  {isProcessing ? "Saving..." : "Yes, Approve"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* REJECT MODAL */}
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRejectModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-[#0a0a0a] rounded-4xl p-8 max-w-md w-full relative z-10 shadow-2xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-black text-black dark:text-white mb-2">Reject Partner</h3>
              <p className="text-sm text-gray-500 mb-4">Please provide a clear reason for rejection so the partner can correct it.</p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Aadhaar card image is blurry..."
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white resize-none h-32 mb-6"
              />

              <div className="flex space-x-3">
                <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-800 font-bold text-black dark:text-white">Cancel</button>
                <button onClick={() => handleAction("REJECTE")} disabled={isProcessing} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                  {isProcessing ? "Processing..." : "Reject"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}