"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, UploadCloud, FileText, CheckCircle2, Loader2 } from "lucide-react";
import axios from "axios";
import { useAlert } from "@/context/AlertContext";


// Helper definition to keep rendering clean
const DOC_TYPES = [
    { id: "aadhaar", dbKey: "aadharCardUrl", title: "Aadhaar / ID Proof", sub: "Government issued ID" },
    { id: "license", dbKey: "drivingLicenseUrl", title: "Driving License", sub: "Valid driving license" },
    { id: "rc", dbKey: "rcUrl", title: "Vehicle RC", sub: "Registration Certificate" }
];

export default function DocumentsPage() {
    const router = useRouter();
    const { showAlert } = useAlert();

    // State for files waiting to be uploaded
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        aadhaar: null,
        license: null,
        rc: null
    });

    // State for URLs already in the DB
    const [existingUrls, setExistingUrls] = useState<{ [key: string]: string }>({
        aadharCardUrl: "",
        drivingLicenseUrl: "",
        rcUrl: ""
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- GET API: Fetch existing documents ---
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const response = await axios.get("/api/onboarding/documents");
                if (response.data?.documents) {
                    setExistingUrls({
                        aadharCardUrl: response.data.documents.aadharCardUrl || "",
                        drivingLicenseUrl: response.data.documents.drivingLicenseUrl || "",
                        rcUrl: response.data.documents.rcUrl || ""
                    });
                }
            } catch (error) {
                console.error("Failed to fetch documents", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDocs();
    }, []);

    // Handle local file selection
    const handleFileChange = (id: string, file: File | null) => {
        if (file) {
            setFiles((prev) => ({ ...prev, [id]: file }));
        }
    };

    // --- POST API: Upload to Cloudinary & Save to DB ---
    const handleSubmit = async () => {
        // Validation: Check if every document either has a new File OR an existing URL
        const hasAadhaar = files.aadhaar || existingUrls.aadharCardUrl;
        const hasLicense = files.license || existingUrls.drivingLicenseUrl;
        const hasRc = files.rc || existingUrls.rcUrl;

        if (!hasAadhaar || !hasLicense || !hasRc) {
            showAlert("Please upload all required documents.", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            // Use FormData for file uploads
            const formData = new FormData();
            if (files.aadhaar) formData.append("aadhaar", files.aadhaar);
            if (files.license) formData.append("license", files.license);
            if (files.rc) formData.append("rc", files.rc);

            // Axios automatically sets the correct multipart boundaries when passing FormData
            await axios.post("/api/onboarding/documents", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            showAlert("Documents Secured Successfully!", "success");
            router.push("/partner/onboarding/bank");

        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Upload failed. Please try again.";
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
            <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] rounded-4xl shadow-xl border border-gray-100 dark:border-gray-900 overflow-hidden relative h-[65vh] md:h-[80vh] flex flex-col">

                {/* Header */}
                <div className="pt-8 px-8 pb-4 relative z-10 bg-white dark:bg-[#0a0a0a]">
                    <button
                        onClick={() => router.back()}
                        className="absolute left-8 top-8 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center mt-2">
                        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Step 2 of 3</p>
                        <h1 className="text-2xl font-black text-black dark:text-white">Upload Documents</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Required for verification</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 pb-24 hide-scrollbar">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-4">

                        {DOC_TYPES.map((doc) => {
                            // Check if we have a file queued, OR a URL already saved in the DB
                            const isUploaded = files[doc.id] !== null || existingUrls[doc.dbKey] !== "";

                            return (
                                <label key={doc.id} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between hover:border-black dark:hover:border-white transition-colors cursor-pointer group bg-white dark:bg-[#0a0a0a] relative overflow-hidden">

                                    {/* Hidden File Input */}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)}
                                    />

                                    <div>
                                        <h4 className="font-bold text-sm text-black dark:text-white">{doc.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {files[doc.id] ? files[doc.id]?.name : doc.sub}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <span className={`text-[10px] mb-1 ${isUploaded ? "text-green-500" : "text-gray-400"}`}>
                                            {isUploaded ? "Uploaded" : "Upload"}
                                        </span>

                                        {/* Dynamic Icon: Cloud if empty, Check if uploaded */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isUploaded ? "bg-green-500 text-white" : "bg-black dark:bg-white text-white dark:text-black group-hover:scale-105"}`}>
                                            {isUploaded ? <CheckCircle2 className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}

                        <div className="flex items-start space-x-2 mt-6 text-gray-400">
                            <FileText className="w-4 h-4 shrink-0" />
                            <p className="text-xs">Documents are securely stored and manually verified by our team.</p>
                        </div>
                    </motion.div>
                </div>

                {/* Footer Button */}
                <div className="absolute bottom-0 left-0 w-full p-8 bg-linear-to-t from-white via-white dark:from-[#0a0a0a] dark:via-[#0a0a0a] to-transparent pt-12 pointer-events-none z-20">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl hover:opacity-80 transition-opacity shadow-xl pointer-events-auto disabled:opacity-50 flex justify-center items-center space-x-2"
                    >
                        {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span>{isSubmitting ? "Uploading Securely..." : "Submit Documents"}</span>
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
        </div>
    );
}