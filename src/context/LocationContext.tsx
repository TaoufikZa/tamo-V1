"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface LocationContextType {
    lat: number | null;
    lng: number | null;
    address: string | null;
    setLocation: (lat: number, lng: number, address?: string | null) => void;
    clearLocation: () => void;
    isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initial load from localStorage
        const savedLat = localStorage.getItem("tamo_latitude");
        const savedLng = localStorage.getItem("tamo_longitude");
        const savedAddr = localStorage.getItem("tamo_address");

        if (savedLat && savedLng) {
            setLat(parseFloat(savedLat));
            setLng(parseFloat(savedLng));
        }
        if (savedAddr) {
            setAddress(savedAddr);
        }
        setIsLoading(false);
    }, []);

    const setLocation = (newLat: number, newLng: number, newAddress?: string | null) => {
        setLat(newLat);
        setLng(newLng);
        localStorage.setItem("tamo_latitude", newLat.toString());
        localStorage.setItem("tamo_longitude", newLng.toString());

        if (newAddress !== undefined) {
            setAddress(newAddress);
            if (newAddress) {
                localStorage.setItem("tamo_address", newAddress);
            } else {
                localStorage.removeItem("tamo_address");
            }
        }
    };

    const clearLocation = () => {
        setLat(null);
        setLng(null);
        setAddress(null);
        localStorage.removeItem("tamo_latitude");
        localStorage.removeItem("tamo_longitude");
        localStorage.removeItem("tamo_address");
    };

    return (
        <LocationContext.Provider value={{ lat, lng, address, setLocation, clearLocation, isLoading }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
}
