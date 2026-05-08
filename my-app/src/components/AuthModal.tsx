import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, X, Mail, User, Lock, Loader2, ArrowLeft } from "lucide-react";
import { signIn } from "next-auth/react";
import { useAlert } from "../context/AlertContext";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultIsLogin: boolean;
}

export default function AuthModal({ isOpen, onClose, defaultIsLogin }: AuthModalProps) {
    const [step, setStep] = useState<string>(defaultIsLogin ? "LOGIN" : "REGISTER");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", otp: "" });

    // State and Refs specifically for the 6-box OTP UI
    const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { showAlert } = useAlert();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep(defaultIsLogin ? "LOGIN" : "REGISTER");
            setFormData({ name: "", email: "", password: "", otp: "" });
            setOtpValues(["", "", "", "", "", ""]); // Reset OTP boxes
            setShowPassword(false);
        }
    }, [isOpen, defaultIsLogin]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- PREMIUM OTP BOX LOGIC ---
    const handleOtpChange = (index: number, value: string) => {
        // Only allow numbers
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otpValues];
        // Take the last character in case they type multiple quickly
        newOtp[index] = value.slice(-1);
        setOtpValues(newOtp);

        // Update the main form data with the combined string
        setFormData((prev) => ({ ...prev, otp: newOtp.join("") }));

        // Automatically focus the next input if a number was typed
        if (value !== "" && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Automatically focus the previous input on Backspace if current box is empty
        if (e.key === "Backspace" && otpValues[index] === "" && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6).replace(/\D/g, ""); // Extract up to 6 numbers

        if (pastedData) {
            const newOtp = [...otpValues];
            for (let i = 0; i < pastedData.length; i++) {
                newOtp[i] = pastedData[i];
            }
            setOtpValues(newOtp);
            setFormData((prev) => ({ ...prev, otp: newOtp.join("") }));

            // Focus the next empty box, or the last box
            const nextIndex = Math.min(pastedData.length, 5);
            otpRefs.current[nextIndex]?.focus();
        }
    };
    // -----------------------------

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (step === "LOGIN") {
                const result = await signIn("credentials", {
                    email: formData.email,
                    password: formData.password,
                    redirect: false,
                });

                if (result?.error) {
                    if (result.error.includes("verify your email")) {
                        showAlert("Email not verified. Please register again to get a new code.", "error");
                    } else {
                        showAlert("Invalid email or password.", "error");
                    }
                    setIsLoading(false);
                } else {
                    showAlert("Login successful!", "success");
                    window.location.href = "/";
                }
            }

            else if (step === "REGISTER") {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
                });

                if (res.ok) {
                    showAlert("OTP sent to your email!", "success");
                    setStep("VERIFY");
                    setIsLoading(false);
                } else {
                    const data = await res.json();
                    showAlert(data.error || "Registration failed", "error");
                    setIsLoading(false);
                }
            }

            else if (step === "VERIFY") {
                const res = await fetch("/api/auth/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: formData.email, otp: formData.otp }),
                });

                if (res.ok) {
                    showAlert("Email verified! Please log in.", "success");
                    setStep("LOGIN");
                    setIsLoading(false);
                } else {
                    const data = await res.json();
                    showAlert(data.error || "Verification failed", "error");
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.error(error);
            showAlert("Something went wrong. Please try again.", "error");
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        setIsLoading(true);
        signIn("google", { callbackUrl: "/" });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white text-black w-full max-w-md rounded-3xl p-8 relative shadow-2xl overflow-hidden"
                    >
                        {/* Top Navigation Row */}
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                            {step === "VERIFY" || step === "REGISTER" ? (
                                <button
                                    onClick={() => setStep(step === "VERIFY" ? "REGISTER" : "LOGIN")}
                                    disabled={isLoading}
                                    className="text-gray-400 hover:text-black transition-colors disabled:opacity-50"
                                    title="Go Back"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                            ) : (
                                <div className="w-6" /> // Spacer
                            )}

                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="text-gray-400 hover:text-black transition-colors disabled:opacity-50"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="text-center mb-8 mt-6">
                            <h2 className="text-3xl font-black tracking-widest uppercase mb-1">Saarthi</h2>
                            <p className="text-sm text-gray-500">
                                {step === "VERIFY" ? "Verify Your Email" : "Premium Vehicle Booking"}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center space-x-3 border border-gray-300 rounded-xl py-3 hover:bg-gray-50 transition-colors mb-6 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                            <span>Continue with Google</span>
                        </button>

                        <div className="flex items-center text-sm text-gray-400 mb-6">
                            <div className="flex-1 border-t border-gray-200"></div>
                            <span className="px-3">OR</span>
                            <div className="flex-1 border-t border-gray-200"></div>
                        </div>

                        <form onSubmit={handleAuthSubmit} className="flex flex-col">
                            <h3 className="text-lg font-bold mb-4">
                                {step === "LOGIN" && "Login to Account"}
                                {step === "REGISTER" && "Create Account"}
                                {step === "VERIFY" && "Enter Verification Code"}
                            </h3>

                            <AnimatePresence mode="popLayout" initial={false}>
                                {step === "VERIFY" ? (
                                    <motion.div
                                        key="verify-view"
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -50, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="relative mb-6"
                                    >
                                        <p className="text-sm text-gray-500 mb-6">
                                            We've sent a 6-digit code to <span className="font-semibold text-black">{formData.email || "your email"}</span>.
                                        </p>

                                        {/* NEW PREMIUM 6-BOX OTP UI */}
                                        <div className="flex justify-between gap-2 sm:gap-3">
                                            {otpValues.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    ref={(el) => { otpRefs.current[index] = el; }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                    onPaste={handleOtpPaste}
                                                    disabled={isLoading}
                                                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border border-gray-300 rounded-2xl focus:outline-none focus:border-black focus:ring-2 focus:ring-black transition-all disabled:bg-gray-50 disabled:text-gray-400 bg-white text-black shadow-sm"
                                                    required
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="auth-view"
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: 50, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col"
                                    >
                                        <AnimatePresence initial={false}>
                                            {step === "REGISTER" && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                                    animate={{ height: "auto", opacity: 1, marginBottom: 16 }}
                                                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            placeholder="Full Name"
                                                            value={formData.name}
                                                            onChange={handleInputChange}
                                                            disabled={isLoading}
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all disabled:bg-gray-50"
                                                            required={step === "REGISTER"}
                                                        />
                                                        <User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="relative mb-4">
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="Email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                disabled={isLoading || step === "VERIFY"}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all disabled:bg-gray-50"
                                                required
                                            />
                                            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                                        </div>

                                        <div className="relative mb-6">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                placeholder="Password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                disabled={isLoading}
                                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all disabled:bg-gray-50"
                                                required
                                            />
                                            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />

                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={isLoading}
                                                className="absolute right-3 top-3.5 text-gray-400 hover:text-black transition-colors disabled:opacity-50"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-black text-white py-3 rounded-xl font-bold flex justify-center items-center hover:bg-gray-800 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : step === "LOGIN" ? (
                                    "Login"
                                ) : step === "REGISTER" ? (
                                    "Send OTP"
                                ) : (
                                    "Verify & Continue"
                                )}
                            </motion.button>
                        </form>

                        {/* Bottom Toggle Link (Hidden during Verification) */}
                        {step !== "VERIFY" && (
                            <div className="mt-6 text-center text-sm text-gray-500">
                                {step === "LOGIN" ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    type="button"
                                    onClick={() => setStep(step === "LOGIN" ? "REGISTER" : "LOGIN")}
                                    disabled={isLoading}
                                    className="font-bold text-black hover:underline focus:outline-none disabled:opacity-50 disabled:no-underline"
                                >
                                    {step === "LOGIN" ? "Sign up" : "Login"}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}