"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface LocationMapProps {
    onConfirm: (lat: number, lng: number) => void;
    initialCenter?: [number, number];
}

// Helper to bridge the map instance to the parent
function MapController({
    onMapReady,
    onMove
}: {
    onMapReady: (map: L.Map) => void;
    onMove: (lat: number, lng: number) => void;
}) {
    const map = useMap();

    useEffect(() => {
        if (map) {
            onMapReady(map);
        }
    }, [map, onMapReady]);

    useMapEvents({
        moveend: () => {
            const center = map.getCenter();
            onMove(center.lat, center.lng);
        },
    });

    return null;
}

export default function LocationMap({ onConfirm, initialCenter = [33.5731, -7.5898] }: LocationMapProps) {
    const [map, setMap] = useState<L.Map | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number }>({
        lat: initialCenter[0],
        lng: initialCenter[1],
    });

    useEffect(() => {
        // Fix for default marker icons (browser-only)
        if (typeof window !== "undefined") {
            // @ts-expect-error - Leaflet icon private property access
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            });
        }
    }, []);

    const handleLocate = () => {
        if (map) {
            map.locate().on("locationfound", (e) => {
                map.flyTo(e.latlng, 16);
            });
        }
    };

    return (
        <div className="relative w-screen h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Map Content */}
            <div className="relative flex-1">
                <MapContainer
                    center={initialCenter}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController
                        onMapReady={setMap}
                        onMove={(lat, lng) => setCoords({ lat, lng })}
                    />
                </MapContainer>

                {/* Stationary Center Pin */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none mb-1 shadow-2xl">
                    <div className="relative flex flex-col items-center">
                        {/* Custom SVG Pin for high polish */}
                        <div className="w-10 h-10 flex items-center justify-center bg-tamo-dark rounded-full border-4 border-white shadow-xl">
                            <div className="w-3 h-3 bg-tamo-lime rounded-full"></div>
                        </div>
                        <div className="w-1 h-3 bg-tamo-dark -mt-1 shadow-sm"></div>
                        <div className="w-4 h-1.5 bg-black/30 rounded-full blur-[2px] mt-1 pr-1"></div>
                    </div>
                </div>

                {/* Auto Locate Button */}
                <button
                    onClick={handleLocate}
                    type="button"
                    className="absolute bottom-6 right-6 z-[1000] w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-tamo-dark active:scale-95 transition-all border border-gray-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                </button>
            </div>

            {/* Footer Controls */}
            <div className="p-8 bg-white rounded-t-[40px] shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.2)] z-[1001] flex flex-col items-center">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-6"></div>
                <h3 className="text-xl font-bold text-tamo-dark mb-1 text-center">حدد موقع التوصيل</h3>
                <p className="text-gray-500 text-sm mb-8 uppercase tracking-tight font-bold text-center">Lieu de livraison</p>

                <button
                    onClick={() => onConfirm(coords.lat, coords.lng)}
                    type="button"
                    className="w-full h-20 bg-tamo-dark text-tamo-lime rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all flex flex-col items-center justify-center border border-tamo-lime/20"
                >
                    <span className="text-xl font-black">تأكيد الموقع</span>
                    <span className="text-xs font-bold opacity-80 uppercase tracking-widest mt-0.5">Confirmer la position</span>
                </button>
            </div>
        </div>
    );
}

