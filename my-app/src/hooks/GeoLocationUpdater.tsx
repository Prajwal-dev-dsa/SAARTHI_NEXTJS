"use client";

import { RootState } from "@/store";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";

export default function GeoLocationUpdater() {
    // Grab the logged-in user from Redux
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        // If no user is logged in, do nothing.
        if (!user?.id || user?.role !== "PARTNER") return;

        let socket: Socket;
        let watchId: number;

        // 1. Initialize Socket Connection
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";
        socket = io(socketUrl);

        socket.on("connect", () => {
            console.log("Connected to SAARTHI Live Tracking Server");

            // 2. Register the user immediately to set isOnline: true
            socket.emit("register_partner", user.id);

            // 3. Start watching the GPS location
            if ("geolocation" in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log("GPS Location:", latitude, longitude);
                        // Emit the live location to the server
                        socket.emit("update_location", {
                            partnerId: user.id,
                            lat: latitude,
                            lng: longitude,
                        });
                    },
                    (error) => {
                        console.error("Error watching geolocation:", error.message);
                    },
                    {
                        enableHighAccuracy: false, // Set to false for desktop testing
                        maximumAge: 10000,         // Allow cached locations up to 10 seconds old
                        timeout: 15000,            // Give the browser 15 seconds to find you
                    }
                );
            } else {
                console.error("Geolocation is not supported by this browser.");
            }
        });

        // --- CLEANUP FUNCTION ---
        // This runs automatically when the user leaves the dashboard or closes the app
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            if (socket) socket.disconnect(); // Triggers the backend "disconnect" event!
        };
    }, [user?.id]); // Re-run if the user logs in/out

    return null; // This is a silent background component
}