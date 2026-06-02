"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

const driverIconHtml = `
  <div id="car-marker" style="width:52px; height:52px; display:flex; align-items:center; justify-content:center; transform-origin:center; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); filter: drop-shadow(0 6px 18px rgba(0,0,0,0.5));">
    <div style="background:#0a0a0a; width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 3px #fff,0 0 5px #0a0a0a,0 8px 28px rgba(0,0,0,0.5);">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 11L6.5 6.5H17.5L19 11" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="3" y="11" width="18" height="7" rx="2" stroke="white" stroke-width="1.6"/>
        <circle cx="7.5" cy="18.5" r="1.5" fill="white"/>
        <circle cx="16.5" cy="18.5" r="1.5" fill="white"/>
        <path d="M3 14H21" stroke="white" stroke-width="1" opacity="0.35"/>
      </svg>
    </div>
  </div>
`;

const driverIcon = new L.DivIcon({
    html: driverIconHtml,
    className: "",
    iconSize: [52, 52],
    iconAnchor: [26, 26],
});

const createLabelIcon = (text: string) => new L.DivIcon({
    html: `<div style="background:#000; color:#fff; font-size:11px; font-weight:900; padding:6px 14px; border-radius:24px; border:2px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,0.3); white-space:nowrap; width:max-content; transform: translate(-50%, -50%); display:flex; align-items:center; justify-content:center;">${text}</div>`,
    className: "",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
});

const MapUpdater = ({ driverLoc, pickupLoc, dropLoc }: any) => {
    const map = useMap();
    useEffect(() => {
        if (!driverLoc || !pickupLoc || !dropLoc) return;
        const bounds = L.latLngBounds([driverLoc, pickupLoc, dropLoc]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }, [driverLoc, pickupLoc, dropLoc, map]);
    return null;
};

const getDistanceInMeters = (loc1: any, loc2: any) => {
    const R = 6371e3;
    const lat1 = loc1.lat * Math.PI / 180;
    const lat2 = loc2.lat * Math.PI / 180;
    const deltaLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const deltaLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function ActiveRideMap({ driverLoc, pickupLoc, dropLoc }: { driverLoc: any, pickupLoc: any, dropLoc: any }) {
    const [driverToPickupRoute, setDriverToPickupRoute] = useState<any[]>([]);
    const [pickupToDropRoute, setPickupToDropRoute] = useState<any[]>([]);

    useEffect(() => {
        if (!driverLoc || !pickupLoc || !dropLoc) return;

        const fetchRoute = async (start: any, end: any, setRouteFn: any) => {
            if (getDistanceInMeters(start, end) <= 20) {
                setRouteFn([[start.lat, start.lng]]);
                return;
            }
            try {
                const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson`);
                if (res.data.routes && res.data.routes.length > 0) {
                    setRouteFn(res.data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]));
                } else {
                    setRouteFn([[start.lat, start.lng], [end.lat, end.lng]]);
                }
            } catch (err) {
                setRouteFn([[start.lat, start.lng], [end.lat, end.lng]]);
            }
        };

        fetchRoute(driverLoc, pickupLoc, setDriverToPickupRoute);
        fetchRoute(pickupLoc, dropLoc, setPickupToDropRoute);

    }, [driverLoc, pickupLoc, dropLoc]);

    if (!driverLoc || !pickupLoc || !dropLoc) return <div className="h-full w-full bg-gray-100 animate-pulse" />;

    return (
        <div className="h-full w-full relative z-0">
            <MapContainer center={driverLoc} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <MapUpdater driverLoc={driverLoc} pickupLoc={pickupLoc} dropLoc={dropLoc} />
                <Polyline positions={driverToPickupRoute} pathOptions={{ color: "#333", weight: 4, dashArray: "10, 10" }} />
                <Polyline positions={pickupToDropRoute} pathOptions={{ color: "#000", weight: 5 }} />
                <Marker position={driverLoc} icon={driverIcon} />
                <Marker position={pickupLoc} icon={createLabelIcon("PICKUP")} />
                <Marker position={dropLoc} icon={createLabelIcon("DROP")} />
            </MapContainer>
        </div>
    );
}