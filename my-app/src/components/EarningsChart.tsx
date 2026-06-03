"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Star, TrendingUp, Zap } from "lucide-react";

interface EarningsData {
    chartData: { date: string; amount: number }[];
    weeklyTotal: number;
    dailyAvg: number;
    todayAmount: number;
    bestDay: { date: string; amount: number };
}

export default function EarningsChart({ data, title }: { data: EarningsData | null, title: string }) {
    if (!data) return null;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl border border-gray-800">
                    <p className="mb-1 text-gray-400">{payload[0].payload.date}</p>
                    <p>₹ {payload[0].value.toFixed(2)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#0a0a0a] rounded-4xl p-8 border border-gray-100 dark:border-gray-900 shadow-sm w-full">

            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-3 inline-block">
                        {title}
                    </span>
                    <h2 className="text-2xl font-black text-black dark:text-white">Daily Earnings</h2>
                    <p className="text-sm text-gray-500 font-medium">Last 7 days performance</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Weekly Total</p>
                    <h3 className="text-3xl font-black text-black dark:text-white">₹{data.weeklyTotal.toFixed(2)}</h3>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                        <Star className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Best Day</span>
                    </div>
                    <p className="text-xl font-black text-black dark:text-white">₹{data.bestDay.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">{data.bestDay.date}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Daily Avg</span>
                    </div>
                    <p className="text-xl font-black text-black dark:text-white">₹{data.dailyAvg.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">per day</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                        <Zap className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Today</span>
                    </div>
                    <p className="text-xl font-black text-black dark:text-white">₹{data.todayAmount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Earned so far</p>
                </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-gray-800" opacity={0.5} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} tickFormatter={(val) => `₹${val}`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                            {data.chartData.map((entry, index) => {
                                const isToday = index === data.chartData.length - 1;
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        className={`transition-all duration-300 outline-none ${isToday
                                                ? "fill-green-500"
                                                : "fill-black/15 dark:fill-white/10 hover:fill-black/30 dark:hover:fill-white/20"
                                            }`}
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}