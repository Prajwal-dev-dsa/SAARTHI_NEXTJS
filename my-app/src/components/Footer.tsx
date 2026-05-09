"use client";

import { motion, Variants } from "framer-motion";
import { Send, MapPin, Mail, Phone, Car } from "lucide-react";

// --- CUSTOM SOCIAL ICONS ---
const FacebookIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

// --- ANIMATION VARIANTS ---
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Footer() {
    return (
        <footer className="w-full bg-[#0a0a0a] dark:bg-[#1a1a1a] text-white pt-20 pb-8 transition-colors duration-300">
            <div className="max-w-[1400px] mx-auto px-6 md:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.5 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full bg-white dark:bg-[#050505] text-black dark:text-white rounded-4xl p-8 md:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between border border-gray-100 dark:border-gray-800 transition-colors duration-300 mb-16 lg:mb-20"
                >
                    <div className="flex flex-col mb-6 lg:mb-0 max-w-lg">
                        <div className="flex items-center space-x-3 mb-3">
                            <Send className="w-6 h-6 text-black dark:text-white" />
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Join the Saarthi Family</h2>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Get the latest updates, exclusive deals, and travel tips delivered straight to your inbox.
                        </p>
                    </div>

                    <div className="w-full lg:w-auto flex-1 max-w-md flex items-center bg-gray-50 dark:bg-[#111] rounded-full p-1.5 border border-gray-200 dark:border-gray-800 focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-all">
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            className="w-full px-5 py-3 bg-transparent text-sm focus:outline-none placeholder-gray-400 dark:text-white"
                        />
                        <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-bold text-sm hover:opacity-80 transition-opacity whitespace-nowrap">
                            Subscribe
                        </button>
                    </div>
                </motion.div>

                {/* --- MAIN FOOTER LINKS --- */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.1 }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">

                        {/* Column 1: Branding & Socials */}
                        <motion.div variants={itemVariants} className="flex flex-col space-y-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                                    <Car className="w-6 h-6 text-black" />
                                </div>
                                <h2 className="text-2xl font-black tracking-widest uppercase">Saarthi</h2>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                                Premium vehicle booking delivered to your doorstep. We ensure quality, speed, and the best rides for your daily needs.
                            </p>

                            {/* Social Icons */}
                            <div className="flex space-x-3">
                                {[FacebookIcon, TwitterIcon, InstagramIcon, LinkedinIcon].map((Icon, index) => (
                                    <motion.a
                                        key={index}
                                        href="#"
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors duration-300"
                                    >
                                        <Icon className="w-4 h-4" />
                                    </motion.a>
                                ))}
                            </div>
                        </motion.div>

                        {/* Column 2: Quick Links */}
                        <motion.div variants={itemVariants} className="flex flex-col space-y-5">
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-[2px] bg-white"></div>
                                <h3 className="font-bold text-lg">Quick Links</h3>
                            </div>
                            <ul className="flex flex-col space-y-3">
                                {["Home", "Bookings", "About Us", "Delivery Areas", "Track Ride"].map((item) => (
                                    <li key={item} className="flex items-center space-x-2 group cursor-pointer w-fit">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 group-hover:bg-white transition-colors"></span>
                                        <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Column 3: Categories */}
                        <motion.div variants={itemVariants} className="flex flex-col space-y-5">
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-[2px] bg-white"></div>
                                <h3 className="font-bold text-lg">Categories</h3>
                            </div>
                            <ul className="flex flex-col space-y-3">
                                {["City Rides", "Outstation Travel", "Heavy Cargo", "Premium Fleet", "Corporate Rentals"].map((item) => (
                                    <li key={item} className="flex items-center space-x-2 group cursor-pointer w-fit">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 group-hover:bg-white transition-colors"></span>
                                        <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Column 4: Contact Us */}
                        <motion.div variants={itemVariants} className="flex flex-col space-y-5">
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-[2px] bg-white"></div>
                                <h3 className="font-bold text-lg">Contact Us</h3>
                            </div>

                            <div className="flex items-start space-x-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <p className="text-sm text-gray-400 group-hover:text-white transition-colors mt-1">
                                    123 Market Street, Tech City,<br />Innovation Hub, India 834001
                                </p>
                            </div>

                            <div className="flex items-center space-x-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <p className="text-sm text-gray-400 group-hover:text-white transition-colors">
                                    +91 98765 43210
                                </p>
                            </div>

                            <div className="flex items-center space-x-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <p className="text-sm text-gray-400 group-hover:text-white transition-colors">
                                    support@saarthi.com
                                </p>
                            </div>
                        </motion.div>

                    </div>

                    {/* BOTTOM SECTION: Copyright, Links, and Payment Badges */}
                    <motion.div
                        variants={itemVariants}
                        className="pt-8 border-t border-white/10 flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0"
                    >
                        {/* Copyright */}
                        <div className="text-sm text-gray-400 text-center lg:text-left">
                            © {new Date().getFullYear()} <span className="font-bold text-white">Saarthi.</span> Made with ❤️ in India.
                        </div>

                        {/* Legal Links */}
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                        </div>

                        {/* Payment Badges */}
                        <div className="flex space-x-3">
                            {["VISA", "MC", "UPI"].map((badge) => (
                                <div key={badge} className="px-3 py-1.5 border border-white/20 rounded text-[10px] font-bold tracking-wider text-gray-400 hover:text-white hover:border-white/50 transition-colors cursor-default">
                                    {badge}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </motion.div>
            </div>
        </footer>
    );
}