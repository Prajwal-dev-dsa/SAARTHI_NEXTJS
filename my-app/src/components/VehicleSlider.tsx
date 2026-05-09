"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CarFront, Bike, Car, Truck, Bus, Hash } from "lucide-react";

const CATEGORIES = [
    { id: 1, tag: "POPULAR", title: "All Vehicles", desc: "Browse the full fleet", icon: CarFront },
    { id: 2, tag: "QUICK", title: "Bikes", desc: "Fast & affordable rides", icon: Bike },
    { id: 3, tag: "COMFORT", title: "Cars", desc: "Comfortable city travel", icon: Car },
    { id: 4, tag: "PREMIUM", title: "SUVs", desc: "Premium & spacious", icon: CarFront },
    { id: 5, tag: "FAMILY", title: "Vans", desc: "Family & group transport", icon: Bus },
    { id: 6, tag: "CARGO", title: "Trucks", desc: "Heavy & commercial transport", icon: Truck },
];

export default function VehicleSlider() {
    const sliderRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (sliderRef.current) {
            const scrollAmount = direction === "left" ? -350 : 350;
            sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    return (
        <section className="w-full bg-white dark:bg-[#050505] py-20 px-6 md:px-16 transition-colors duration-300">
            <div className="max-w-[1400px] mx-auto">

                {/* TOP HEADER SECTION */}
                <div className="flex flex-col md:flex-row justify-between md:items-end mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-8 h-[2px] bg-gray-300 dark:bg-gray-700"></div>
                            <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
                                Fleet
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white leading-tight mb-4">
                            Vehicles <br />
                            <span className="relative inline-block pb-2">
                                Categories
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: false, amount: "some" }}
                                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                                    className="absolute left-0 bottom-0 w-full h-px bg-black dark:bg-white origin-left"
                                />
                            </span>
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Choose the ride that fits your journey
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.5 }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                        className="hidden md:flex space-x-3"
                    >
                        <button
                            onClick={() => scroll("left")}
                            className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-150"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-150"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>

                {/* SLIDER CONTAINER */}
                <div
                    ref={sliderRef}
                    className="flex overflow-x-auto gap-6 pb-10 snap-x snap-mandatory pt-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {CATEGORIES.map((category, index) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.2 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            whileHover={{ scale: 1.03, y: -6 }}
                            whileTap={{ scale: 0.98 }}
                            className="group min-w-[280px] md:min-w-[320px] snap-start shrink-0 bg-white dark:bg-[#0f0f0f] hover:bg-black dark:hover:bg-white border border-gray-100 dark:border-gray-800 rounded-4xl p-8 shadow-sm transition-colors duration-150 cursor-pointer"
                        >
                            <div className="inline-flex items-center space-x-1 bg-gray-50 dark:bg-white/5 group-hover:bg-gray-800 dark:group-hover:bg-gray-200 px-3 py-1.5 rounded-full mb-8 transition-colors duration-150">
                                <Hash className="w-3 h-3 text-gray-400 group-hover:text-gray-300 dark:group-hover:text-gray-600 transition-colors duration-150" />
                                <span className="text-[10px] font-bold tracking-widest text-gray-500 dark:text-gray-400 group-hover:text-gray-300 dark:group-hover:text-gray-600 transition-colors duration-150">
                                    {category.tag}
                                </span>
                            </div>

                            <div className="w-14 h-14 bg-gray-50 dark:bg-white/10 group-hover:bg-gray-800 dark:group-hover:bg-gray-200 rounded-2xl flex items-center justify-center mb-8 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors duration-150">
                                <category.icon className="w-6 h-6" />
                            </div>

                            <h3 className="text-2xl font-black text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-2 transition-colors duration-150">
                                {category.title}
                            </h3>
                            <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300 dark:group-hover:text-gray-600 transition-colors duration-150">
                                {category.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* BOTTOM STATS */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="flex flex-wrap items-center gap-y-4 gap-x-8 mt-4 text-sm"
                >
                    <div className="text-gray-500 dark:text-gray-400">
                        <span className="font-black text-black dark:text-white mr-1 text-base">6+</span>
                        Categories
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        <span className="font-black text-black dark:text-white mr-1 text-base">10+</span>
                        Vehicle types
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        <span className="font-black text-black dark:text-white mr-1 text-base">24/7</span>
                        Availability
                    </div>
                </motion.div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        ::-webkit-scrollbar {
          display: none;
        }
      `}} />
        </section>
    );
}