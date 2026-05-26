"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";

// --- Custom Marker ---
const getCustomIcon = (label: string) => {
    return L.divIcon({
        html: `
            <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 6px 18px rgba(0,0,0,0.22))">
                <div style="background:#0a0a0a;color:#fff;padding:5px 14px;border-radius:100px;font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;font-family:-apple-system,system-ui,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,0.25);">
                    ${label}
                </div>
                <div style="width:2px;height:10px;background:#0a0a0a;opacity:0.4"></div>
                <div style="width:13px;height:13px;background:#0a0a0a;border-radius:50%;border:3px solid #fff;box-shadow:0 0 2px rgba(0,0,0,0.15), 0 3px 10px rgba(0,0,0,0.3);"></div>
            </div>
        `,
        className: "",
        iconAnchor: [10, 45],
    });
};

// --- Component to auto-fit map bounds to route ---
function MapUpdater({ bounds }: { bounds: L.LatLngBounds | null }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [bounds, map]);
    return null;
}

export default function MapComponent({ origin, destination, onRouteFetched, onMarkerDragEnd }: any) {
    const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
    const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

    const originRef = useRef<L.Marker>(null);
    const destRef = useRef<L.Marker>(null);

    // Fetch Route from OSRM
    useEffect(() => {
        const fetchRoute = async () => {
            if (origin.lat === undefined || destination.lat === undefined) return;

            const isCustomFallback = destination.lat === 0 && destination.lng === 0;

            if (isCustomFallback) {
                const fallbackCoords: [number, number][] = [
                    [origin.lat, origin.lng],
                    [origin.lat + 0.01, origin.lng + 0.01]
                ];
                setRouteGeometry(fallbackCoords);
                setBounds(L.latLngBounds(fallbackCoords));
                onRouteFetched(1.5);
                return;
            }

            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
                const res = await axios.get(url);

                if (res.data.routes && res.data.routes.length > 0) {
                    const route = res.data.routes[0];
                    const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);
                    setRouteGeometry(coords);
                    setBounds(L.latLngBounds(coords));
                    onRouteFetched(route.distance / 1000);
                }
            } catch (error) {
                // Expected behaviour for unroutable artificial pins, handled gracefully!
                const fallbackCoords: [number, number][] = [
                    [origin.lat, origin.lng],
                    [destination.lat, destination.lng]
                ];
                setRouteGeometry(fallbackCoords);
                setBounds(L.latLngBounds(fallbackCoords));

                const dist = Math.sqrt(Math.pow(origin.lat - destination.lat, 2) + Math.pow(origin.lng - destination.lng, 2)) * 111;
                onRouteFetched(dist);
            }
        };

        fetchRoute();
    }, [origin.lat, origin.lng, destination.lat, destination.lng]);

    // Memoize drag handlers
    const originDragHandlers = useMemo(() => ({
        dragend() {
            const marker = originRef.current;
            if (marker) {
                const pos = marker.getLatLng();
                onMarkerDragEnd("origin", pos.lat, pos.lng);
            }
        }
    }), [onMarkerDragEnd]);

    const destDragHandlers = useMemo(() => ({
        dragend() {
            const marker = destRef.current;
            if (marker) {
                const pos = marker.getLatLng();
                onMarkerDragEnd("destination", pos.lat, pos.lng);
            }
        }
    }), [onMarkerDragEnd]);

    if (origin.lat === undefined || destination.lat === undefined) return null;

    return (
        <MapContainer
            center={[origin.lat, origin.lng]}
            zoom={13}
            zoomControl={false}
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, zIndex: 0 }}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

            <style jsx global>{`
                .dark .leaflet-tile-pane { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
            `}</style>

            <MapUpdater bounds={bounds} />

            <Marker position={[origin.lat, origin.lng]} icon={getCustomIcon("PICKUP")} draggable={true} eventHandlers={originDragHandlers} ref={originRef} />
            <Marker position={[destination.lat, destination.lng]} icon={getCustomIcon("DROP")} draggable={true} eventHandlers={destDragHandlers} ref={destRef} />

            <Polyline positions={routeGeometry} color="#000000" weight={4} opacity={0.8} />
        </MapContainer>
    );
}