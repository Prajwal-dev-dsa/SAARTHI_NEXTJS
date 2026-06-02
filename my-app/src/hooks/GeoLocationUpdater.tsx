"use client";

import { RootState } from "@/store";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";

export default function GeoLocationUpdater() {
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        if (!user?.id) return;

        let socket: Socket;
        let watchId: number;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";
        socket = io(socketUrl);

        socket.on("connect", () => {
            console.log("Connected to SAARTHI Live Tracking Server");

            // Register dynamically based on role
            if (user.role === "PARTNER") {
                socket.emit("register_partner", user.id);
            } else {
                socket.emit("register_user", user.id);
            }

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        socket.emit("update_location", { userId: user.id, lat: latitude, lng: longitude });
                    },
                    (err) => console.warn("Initial GPS fetch failed:", err.message),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );

                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        socket.emit("update_location", { userId: user.id, lat: latitude, lng: longitude });
                    },
                    (error) => {
                        if (error.code === error.TIMEOUT) {
                            console.warn("GPS tracking timeout.");
                        } else {
                            console.error("Geolocation Error:", error.message);
                        }
                    },
                    {
                        enableHighAccuracy: true, 
                        maximumAge: 10000,         
                        timeout: 20000,            
                    }
                );
            } else {
                console.error("Geolocation is not supported by this browser.");
            }
        });

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            if (socket) socket.disconnect();
        };
    }, [user?.id, user?.role]); 

    return null; 
}