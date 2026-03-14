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
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // 1. Capture customer data from URL and persist to localStorage
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");

    if (name) localStorage.setItem("tamo_customer_name", name);
    if (phone) localStorage.setItem("tamo_customer_phone", phone);

    const fetchLocation = async () => {
      try {
        const resp = await fetch("https://ipapi.co/json/");
        const data = await resp.json();

        if (data.latitude && data.longitude) {
          localStorage.setItem("tamo_latitude", data.latitude.toString());
          localStorage.setItem("tamo_longitude", data.longitude.toString());
        } else {
          throw new Error("Invalid IP location data");
        }
      } catch (e) {
        console.warn("Location fetch failed, using fallback (Casablanca):", e);
        // Default to Casablanca: 33.5731, -7.5898
        localStorage.setItem("tamo_latitude", "33.5731");
        localStorage.setItem("tamo_longitude", "-7.5898");
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    fetchLocation();
  }, [searchParams]);

  if (loading || !initialized) {
    return (
      <div className="flex flex-col items-center justify-center p-8 flex-1 mt-20 text-center">
        <div className="w-16 h-16 bg-tamo-lime rounded-full animate-pulse mb-6 shadow-lg"></div>
        <p className="font-bold text-xl text-tamo-dark">جاري البحث عن المتاجر...</p>
        <p className="text-gray-500 font-medium">Recherche des boutiques en cours...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 flex-1">
      <h2 className="text-xl font-bold mb-6 text-tamo-dark text-center">
        متاجر قريبة / Boutiques à proximité
      </h2>

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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-8 flex-1 mt-20">
        <div className="w-16 h-16 bg-tamo-lime rounded-full animate-pulse mb-6 shadow-lg"></div>
        <p className="text-center font-medium text-lg text-tamo-dark">جاري التحميل...</p>
        <p className="text-center text-sm text-gray-500">Chargement...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
