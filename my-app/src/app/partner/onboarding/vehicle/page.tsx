"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Bike, Car, Truck, Package, CarFront, Loader2 } from "lucide-react";
import axios from "axios";
import { useAlert } from "@/context/AlertContext";


const VEHICLE_TYPES = [
    { id: "BIKE", label: "Bike", sub: "2 wheeler", icon: Bike },
    { id: "AUTO", label: "Auto", sub: "3 wheeler ride", icon: CarFront },
    { id: "CAR", label: "Car", sub: "4 wheeler ride", icon: Car },
    { id: "LOADING", label: "Loading", sub: "Small goods", icon: Package },
    { id: "TRUCK", label: "Truck", sub: "Heavy transport", icon: Truck },
];

export default function VehicleDetailsPage() {
    const router = useRouter();
    const { showAlert } = useAlert();

    // Form State
    const [selectedVehicle, setSelectedVehicle] = useState("LOADING");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");

    // Loading States
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- AXIOS GET API: Fetch existing data on page load ---
    useEffect(() => {
        const fetchVehicleData = async () => {
            try {
                const response = await axios.get("/api/onboarding/vehicle");
                if (response.data?.vehicle) {
                    setSelectedVehicle(response.data.vehicle.type);
                    setVehicleNumber(response.data.vehicle.vehicleNumber);
                    setVehicleModel(response.data.vehicle.model);
                }
            } catch (error) {
                console.error("Failed to fetch vehicle data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVehicleData();
    }, []);

    // --- AXIOS POST API: Submit data to the backend ---
    const handleSubmit = async () => {
        // Basic validation before hitting the API
        if (!vehicleNumber.trim() || !vehicleModel.trim()) {
            showAlert("Please fill in all vehicle details.", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            await axios.post("/api/onboarding/vehicle", {
                type: selectedVehicle,
                vehicleNumber: vehicleNumber,
                model: vehicleModel,
            });

            showAlert("Vehicle Details Submitted Successfully!", "success");
            router.push("/partner/onboarding/documents");

        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "A network error occurred. Please try again.";
            showAlert(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show a full-screen spinner while checking the database initially
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-gray-50 dark:bg-[#050505] flex justify-center items-center py-6 md:py-12 px-4 transition-colors duration-300">
            <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] rounded-4xl shadow-xl border border-gray-100 dark:border-gray-900 overflow-hidden relative h-[83vh] flex flex-col">

                {/* Header */}
                <div className="pt-8 px-8 pb-4 relative z-10 bg-white dark:bg-[#0a0a0a]">
                    <button
                        onClick={() => router.back()}
                        className="absolute left-8 top-8 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center mt-2">
                        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Step 1 of 3</p>
                        <h1 className="text-2xl font-black text-black dark:text-white">Vehicle Details</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add your vehicle information</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 md:pb-28 hide-scrollbar">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Vehicle Type</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                            {VEHICLE_TYPES.map((v) => {
                                const isSelected = selectedVehicle === v.id;
                                return (
                                    <div
                                        key={v.id}
                                        onClick={() => setSelectedVehicle(v.id)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all duration-300 ${isSelected ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg" : "bg-transparent text-black dark:text-white border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600"}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isSelected ? "bg-white/20 dark:bg-black/10" : "bg-gray-50 dark:bg-white/5"}`}>
                                            <v.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold">{v.label}</span>
                                        <span className={`text-[10px] ${isSelected ? "text-gray-300 dark:text-gray-600" : "text-gray-500"}`}>{v.sub}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Vehicle Number</label>
                                <input
                                    type="text"
                                    value={vehicleNumber}
                                    onChange={(e) => setVehicleNumber(e.target.value)}
                                    placeholder="MH12AB1234"
                                    className="border-b border-gray-200 dark:border-gray-800 py-2 bg-transparent text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors placeholder-gray-300 dark:placeholder-gray-700 uppercase"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Vehicle Model</label>
                                <input
                                    type="text"
                                    value={vehicleModel}
                                    onChange={(e) => setVehicleModel(e.target.value)}
                                    placeholder="Tata Ace"
                                    className="border-b border-gray-200 dark:border-gray-800 py-2 bg-transparent text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors placeholder-gray-300 dark:placeholder-gray-700"
                                />
                            </div>
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
                        <span>{isSubmitting ? "Submitting..." : "Submit for Approval"}</span>
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
        </div>
    );
}