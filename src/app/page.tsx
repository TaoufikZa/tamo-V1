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
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [loading, setLoading] = useState(true);

  const requestLocation = () => {
    setLoading(true);
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        localStorage.setItem("tamo_latitude", latitude.toString());
        localStorage.setItem("tamo_longitude", longitude.toString());
        setLocationStatus("granted");
        setLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationStatus("denied");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    // 1. Capture customer data from URL and persist to localStorage
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");

    if (name) localStorage.setItem("tamo_customer_name", name);
    if (phone) localStorage.setItem("tamo_customer_phone", phone);

    // Initial check: if we already have location in state or permission might already be granted
    // We attempt an immediate silent check
    navigator.permissions?.query({ name: 'geolocation' as PermissionName }).then(result => {
      if (result.state === 'granted') {
        requestLocation();
      } else {
        setLoading(false);
      }
    }).catch(() => {
      // Fallback for browsers that don't support permissions API query for geolocation
      setLoading(false);
    });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 flex-1 mt-20 text-center">
        <div className="w-16 h-16 bg-tamo-lime rounded-full animate-pulse mb-6 shadow-lg"></div>
        <p className="font-bold text-xl text-tamo-dark">جاري التحميل...</p>
        <p className="text-gray-500 font-medium">Chargement...</p>
      </div>
    );
  }

  if (locationStatus !== "granted") {
    return (
      <div className="flex flex-col items-center justify-center p-8 flex-1 bg-white text-center">
        <div className="w-24 h-24 bg-tamo-light rounded-full flex items-center justify-center text-tamo-dark mb-8 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-tamo-dark mb-2">الموقع مطلوب</h2>
        <h3 className="text-lg font-medium text-gray-500 mb-6 uppercase tracking-tight">Localisation requise</h3>

        <div className="space-y-2 mb-10">
          <p className="text-gray-600 font-medium leading-relaxed px-4">
            يرجى السماح بالوصول إلى موقعك لرؤية المتاجر القريبة منك
          </p>
          <p className="text-gray-400 text-sm italic">
            Veuillez autoriser l&apos;accès à votre position pour voir les boutiques à proximité
          </p>
        </div>

        <button
          onClick={requestLocation}
          className="w-full max-w-xs h-20 bg-tamo-dark text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center"
        >
          <span className="text-xl">تفعيل الموقع</span>
          <span className="text-sm font-normal text-gray-400">Activer la localisation</span>
        </button>

        {locationStatus === "denied" && (
          <p className="mt-6 text-red-500 text-sm font-medium animate-bounce px-6">
            تعذر الوصول إلى الموقع. يرجى تفعيل GPS في إعدادات المتصفح.
            <br />
            <span className="text-xs">Accès refusé. Veuillez activer le GPS dans les réglages.</span>
          </p>
        )}
      </div>
    );
  }

  if (locationStatus === "granted") {
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

  return null;
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
