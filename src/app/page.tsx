"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Mock Data
const MOCK_SHOPS = [
  { id: "1", name: "Hanout Brahim", type: "Store", distance: "120m", phone: "212600000001" },
  { id: "2", name: "Khadija Sweets", type: "Home Bakery", distance: "300m", phone: "212600000002" },
  { id: "3", name: "Epicerie Atlas", type: "Store", distance: "500m", phone: "212600000003" },
  { id: "taoufik-shop", name: "Taoufik Shop", type: "General Store", distance: "600m", phone: "212601866049" },
];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locationGranted, setLocationGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Capture customer data from URL and persist to localStorage
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");

    if (name) localStorage.setItem("tamo_customer_name", name);
    if (phone) localStorage.setItem("tamo_customer_phone", phone);

    // Request geolocation on mount
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Success
          setLocationGranted(true);
          setLoading(false);
        },
        (error) => {
          // Error or denied
          console.error("Geolocation error:", error);
          // For demo purposes, we will proceed even if denied so the UI can be seen
          setLocationGranted(true);
          setLoading(false);
        }
      );
    } else {
      // Geolocation not supported
      setLocationGranted(true);
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 flex-1 mt-20">
        <div className="w-16 h-16 bg-tamo-lime rounded-full animate-pulse mb-6 shadow-lg"></div>
        <p className="text-center font-medium text-lg text-tamo-dark">Finding your neighborhood...</p>
      </div>
    );
  }

  if (locationGranted) {
    return (
      <div className="flex flex-col p-4 flex-1">
        <h2 className="text-2xl font-bold mb-6 text-tamo-dark">Shops Near You</h2>

        <div className="flex flex-col space-y-4">
          {MOCK_SHOPS.map((shop) => (
            <div
              key={shop.id}
              onClick={() => {
                const params = new URLSearchParams();
                const name = searchParams.get("name") || localStorage.getItem("tamo_customer_name");
                const phone = searchParams.get("phone") || localStorage.getItem("tamo_customer_phone");
                if (name) params.append("name", name);
                if (phone) params.append("phone", phone);
                const query = params.toString();
                router.push(`/shop/${shop.id}${query ? `?${query}` : ""}`);
              }}
              className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
            >
              <div className="flex flex-col">
                <span className="font-bold text-lg text-tamo-dark">{shop.name}</span>
                <span className="text-sm text-gray-500 mt-1">
                  {shop.type} • {shop.distance}
                </span>
              </div>

              <div className="w-10 h-10 bg-tamo-light rounded-full flex items-center justify-center text-tamo-lime">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-8 flex-1 mt-20">
        <div className="w-16 h-16 bg-tamo-lime rounded-full animate-pulse mb-6 shadow-lg"></div>
        <p className="text-center font-medium text-lg text-tamo-dark">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
