"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

// Mock Data
const MOCK_SHOPS = [
  { id: "1", name: "Hanout Brahim", type: "Store", distance: "120m", phone: "212600000001", image: "/shop1.png" },
  { id: "2", name: "Khadija Sweets", type: "Home Bakery", distance: "300m", phone: "212600000002", image: "/shop2.png" },
  { id: "3", name: "Epicerie Atlas", type: "Store", distance: "500m", phone: "212600000003", image: "/shop3.png" },
  { id: "taoufik-shop", name: "Taoufik Shop", type: "General Store", distance: "600m", phone: "212601866049", image: "/shop4.png" },
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
        <h2 className="text-xl font-bold mb-6 text-tamo-dark">Shops Near You</h2>

        <div className="grid grid-cols-2 gap-4">
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
              className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden flex flex-col"
            >
              {/* Shop Image */}
              <div className="relative h-32 w-full overflow-hidden bg-gray-100">
                <Image
                  src={shop.image}
                  alt={shop.name}
                  fill
                  sizes="(max-width: 400px) 50vw, 200px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-tamo-dark shadow-sm z-10">
                  {shop.distance}
                </div>
              </div>

              {/* Shop Info */}
              <div className="p-3 flex flex-col flex-1">
                <span className="font-bold text-sm text-tamo-dark line-clamp-1 group-hover:text-tamo-lime transition-colors">
                  {shop.name}
                </span>
                <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-medium">
                  {shop.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
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
