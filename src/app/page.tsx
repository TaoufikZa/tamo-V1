"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamically import Map component to prevent SSR errors
const MapSelector = dynamic(() => import("./components/MapSelector"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-8 flex-1 mt-20 text-center">
      <div className="w-16 h-16 bg-tamo-lime rounded-full animate-pulse mb-6 shadow-lg"></div>
      <p className="font-bold text-xl text-tamo-dark">جاري تحميل الخريطة...</p>
      <p className="text-gray-500 font-medium">Chargement de la carte...</p>
    </div>
  )
});

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
  const [view, setView] = useState<"list" | "map">("map");
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // 1. Capture customer data from URL and persist to localStorage
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");

    if (name) localStorage.setItem("tamo_customer_name", name);
    if (phone) localStorage.setItem("tamo_customer_phone", phone);

    // 2. Check if location is already set
    const lat = localStorage.getItem("tamo_latitude");
    const lng = localStorage.getItem("tamo_longitude");

    if (lat && lng) {
      setView("list");
      // Restore cached address if available
      const saved = localStorage.getItem("tamo_address");
      if (saved) setAddress(saved);
    } else {
      setView("map");
    }
    setLoading(false);
  }, [searchParams]);

  const handleConfirmLocation = async (lat: number, lng: number) => {
    localStorage.setItem("tamo_latitude", lat.toString());
    localStorage.setItem("tamo_longitude", lng.toString());
    // Reverse geocode to get street address
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`
      );
      const data = await res.json();
      const addr =
        data.address?.road ||
        data.address?.suburb ||
        data.address?.neighbourhood ||
        data.display_name?.split(",")[0] ||
        "";
      if (addr) {
        localStorage.setItem("tamo_address", addr);
        setAddress(addr);
      }
    } catch {
      // Geocode failed — no address shown, that's fine
    }
    setView("list");
  };

  const handleChangeLocation = () => {
    localStorage.removeItem("tamo_latitude");
    localStorage.removeItem("tamo_longitude");
    localStorage.removeItem("tamo_address");
    setAddress(null);
    setView("map");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 flex-1 mt-20 text-center">
        <div className="w-16 h-16 bg-tamo-lime rounded-full animate-pulse mb-6 shadow-lg"></div>
        <p className="font-bold text-xl text-tamo-dark">جاري التحميل...</p>
        <p className="text-gray-500 font-medium">Chargement...</p>
      </div>
    );
  }

  if (view === "map") {
    return <MapSelector onConfirm={handleConfirmLocation} />;
  }

  return (
    <div className="flex flex-col p-4 flex-1">
      {/* Location Header */}
      <div
        onClick={handleChangeLocation}
        className="mb-8 p-4 bg-tamo-light rounded-2xl flex items-center justify-between border border-tamo-dark/5 active:scale-[0.98] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-tamo-dark rounded-full flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-tamo-lime">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-tamo-dark line-clamp-1">
              {address || "موقع التوصيل المحدد"}
            </span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              {address ? "Adresse de livraison" : "Position de livraison définie"}
            </span>
          </div>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-black text-tamo-dark shadow-sm border border-gray-100 flex flex-col items-center">
          <span>تغيير</span>
          <span className="opacity-50">MODIFIER</span>
        </div>
      </div>
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
