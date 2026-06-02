"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { X, Send, Sparkles, Loader2 } from "lucide-react";

interface RideChatProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    currentUserId: string;
    otherUserId: string;
    otherUserName: string;
    role: "USER" | "PARTNER";
    socket: any;
}

export default function RideChat({ isOpen, onClose, bookingId, currentUserId, otherUserId, otherUserName, role, socket }: RideChatProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Chat History on mount
    useEffect(() => {
        if (!isOpen) return;
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`/api/chat/history?bookingId=${bookingId}`);
                setMessages(res.data.messages || []);
                fetchSuggestions(res.data.messages || []);
            } catch (error) {
                console.error("Failed to load chat history");
            }
        };
        fetchHistory();
    }, [isOpen, bookingId]);

    // 2. Listen for Real-Time Messages
    useEffect(() => {
        if (!socket || !isOpen) return;

        const messageListener = (newMessage: any) => {
            if (newMessage.bookingId === bookingId) {
                setMessages(prev => [...prev, newMessage]);

                // If the OTHER person sent a message, fetch new AI suggestions based on it!
                if (newMessage.senderId !== currentUserId) {
                    fetchSuggestions([...messages, newMessage]);
                }
            }
        };

        socket.on("receive_message", messageListener);
        return () => { socket.off("receive_message", messageListener); };
    }, [socket, isOpen, bookingId, messages, currentUserId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, suggestions]);

    // 3. Fetch AI Suggestions
    const fetchSuggestions = async (currentMessages: any[]) => {
        setIsLoadingSuggestions(true);
        try {
            const res = await axios.post("/api/chat/suggestions", {
                messages: currentMessages,
                userRole: role
            });
            setSuggestions(res.data.suggestions || []);
        } catch (error) {
            console.error("Failed to load suggestions");
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    // 4. Send Message Function
    const sendMessage = (text: string) => {
        if (!text.trim() || !socket) return;

        const messageData = {
            bookingId,
            senderId: currentUserId,
            receiverId: otherUserId,
            content: text,
            senderRole: role
        };

        socket.emit("send_message", messageData);
        setInputValue("");
        setSuggestions([]);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[600px] bg-white dark:bg-[#0a0a0a] z-100 md:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-[#111] flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-black dark:text-white capitalize">{otherUserName}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Online</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full text-black dark:text-white hover:scale-105 transition-transform">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="h-full flex items-center justify-center text-center">
                                <p className="text-sm text-gray-400 font-medium">No messages yet.<br />Say hello!</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => {
                            const isMe = msg.senderId === currentUserId;

                            const timeString = new Date(msg.created_at || new Date()).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={msg.id || idx}
                                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                >
                                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl flex flex-col shadow-sm ${isMe ? "bg-black dark:bg-white text-white dark:text-black rounded-br-sm" : "bg-gray-100 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-800 rounded-bl-sm"}`}>

                                        {/* Message Content */}
                                        <span className="text-sm font-medium leading-relaxed pr-2">
                                            {msg.content}
                                        </span>

                                        {/* Timestamp */}
                                        <span className={`text-[9px] font-bold self-end mt-1 tracking-wider ${isMe ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"}`}>
                                            {timeString}
                                        </span>

                                    </div>
                                </motion.div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* AI Suggestions & Input Area */}
                    <div className="bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-gray-900 flex flex-col pb-safe">

                        {/* AI Suggestions Scroll Bar */}
                        <div className="w-full overflow-x-auto no-scrollbar py-3 px-4 border-b border-gray-50 dark:border-gray-900 flex gap-2">
                            {isLoadingSuggestions ? (
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gemini is thinking...
                                </div>
                            ) : (
                                suggestions.map((sug, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => sendMessage(sug)}
                                        className="shrink-0 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                    >
                                        <Sparkles className="w-3 h-3" /> {sug}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Input Box */}
                        <div className="p-4 flex gap-3 items-center">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                                placeholder="Message..."
                                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                            <button
                                onClick={() => sendMessage(inputValue)}
                                disabled={!inputValue.trim()}
                                className="bg-black dark:bg-white text-white dark:text-black w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform shrink-0 shadow-lg"
                            >
                                <Send className="w-5 h-5 ml-1" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}