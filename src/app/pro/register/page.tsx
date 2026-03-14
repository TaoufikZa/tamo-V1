"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

const MapSelector = dynamic(() => import("../../components/MapSelector"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-10 h-10 bg-tamo-lime rounded-full animate-pulse mb-3"></div>
            <p className="text-sm font-medium text-tamo-dark">جاري تحميل الخريطة...</p>
        </div>
    ),
});

const CATEGORIES = [
    { value: "grocery", ar: "بقالة", fr: "Grocery" },
    { value: "butcher", ar: "جزار", fr: "Butcher" },
    { value: "snack", ar: "مأكولات سريعة", fr: "Snack" },
    { value: "pharmacy", ar: "صيدلية", fr: "Pharmacy" },
    { value: "other", ar: "أخرى", fr: "Other" },
];

function RegisterForm() {
    const searchParams = useSearchParams();
    const [phone, setPhone] = useState("");
    const [shopName, setShopName] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [category, setCategory] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const p = searchParams.get("phone") || "";
        setPhone(p);
    }, [searchParams]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleMapConfirm = (lat: number, lng: number) => {
        setLocation({ lat, lng });
        setShowMap(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!shopName.trim()) return setError("يرجى إدخال اسم المتجر / Veuillez entrer le nom de la boutique");
        if (!ownerName.trim()) return setError("يرجى إدخال اسم المالك / Veuillez entrer le nom du propriétaire");
        if (!category) return setError("يرجى اختيار الفئة / Veuillez choisir une catégorie");
        if (!photo) return setError("يرجى إرفاق صورة المتجر / Veuillez ajouter une photo");
        if (!location) return setError("يرجى تحديد موقع المتجر / Veuillez sélectionner la position");

        setSending(true);
        try {
            const formData = new FormData();
            formData.append("phone", phone);
            formData.append("shop_name", shopName);
            formData.append("owner_name", ownerName);
            formData.append("category", category);
            formData.append("latitude", location.lat.toString());
            formData.append("longitude", location.lng.toString());
            formData.append("status", "pending");
            formData.append("photo", photo);

            const res = await fetch(
                "https://tamoit.app.n8n.cloud/webhook/tamo-pro-register",
                { method: "POST", body: formData }
            );

            if (!res.ok) throw new Error("Server error");
            setSuccess(true);
        } catch {
            setError("حدث خطأ، يرجى المحاولة مجدداً / Une erreur est survenue, veuillez réessayer");
        } finally {
            setSending(false);
        }
    };

    // Show map full-screen when selecting location
    if (showMap) {
        return <MapSelector onConfirm={handleMapConfirm} />;
    }

    // Success state
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <div className="w-20 h-20 bg-tamo-lime rounded-full flex items-center justify-center mb-6 shadow-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10 text-tamo-dark">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-tamo-dark mb-2">تم إرسال طلبك!</h2>
                <p className="text-gray-500 font-bold text-sm uppercase tracking-wide mb-6">Demande envoyée !</p>
                <p className="text-gray-600 leading-relaxed">
                    تم إرسال طلبك بنجاح. سنقوم بمراجعته والتواصل معك قريباً.
                </p>
                <p className="text-gray-400 text-sm italic mt-2">
                    Votre demande a été envoyée avec succès. Nous l&apos;examinerons et vous contacterons sous peu.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1">
            {/* Page Header */}
            <div className="px-5 pt-6 pb-4 text-center border-b border-gray-100">
                <h1 className="text-2xl font-black text-tamo-dark">انضم كتاجر</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Rejoindre en tant que marchand</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 flex-1">

                {/* WhatsApp Number — Read-only */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-black text-tamo-dark uppercase tracking-wider">
                        رقم الواتساب <span className="opacity-50 font-bold normal-case">/ Numéro WhatsApp</span>
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        readOnly
                        className="w-full h-12 px-4 bg-gray-100 rounded-xl text-gray-500 font-mono font-bold text-sm border border-gray-200 cursor-not-allowed"
                    />
                </div>

                {/* Shop Name */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-black text-tamo-dark uppercase tracking-wider">
                        اسم المتجر <span className="opacity-50 font-bold normal-case">/ Nom de la boutique</span>
                    </label>
                    <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="ex: Hanout Brahim"
                        className="w-full h-12 px-4 bg-white rounded-xl text-tamo-dark font-bold text-sm border border-gray-200 focus:border-tamo-dark focus:outline-none transition-colors"
                    />
                </div>

                {/* Owner Name */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-black text-tamo-dark uppercase tracking-wider">
                        اسم المالك <span className="opacity-50 font-bold normal-case">/ Nom du propriétaire</span>
                    </label>
                    <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="ex: Brahim Alaoui"
                        className="w-full h-12 px-4 bg-white rounded-xl text-tamo-dark font-bold text-sm border border-gray-200 focus:border-tamo-dark focus:outline-none transition-colors"
                    />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-black text-tamo-dark uppercase tracking-wider">
                        الفئة <span className="opacity-50 font-bold normal-case">/ Catégorie</span>
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-12 px-4 bg-white rounded-xl text-tamo-dark font-bold text-sm border border-gray-200 focus:border-tamo-dark focus:outline-none transition-colors appearance-none"
                    >
                        <option value="" disabled>اختر / Choisir...</option>
                        {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.ar} / {c.fr}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Shop Photo */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-black text-tamo-dark uppercase tracking-wider">
                        صورة المتجر <span className="opacity-50 font-bold normal-case">/ Photo de la boutique</span>
                    </label>
                    <label className="relative cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        {photoPreview ? (
                            <div className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-tamo-dark">
                                <Image src={photoPreview} alt="Shop preview" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">تغيير / Changer</span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-36 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-tamo-dark transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                </svg>
                                <span className="text-xs font-bold">أضف صورة / Ajouter une photo</span>
                            </div>
                        )}
                    </label>
                </div>

                {/* Location Selector */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-black text-tamo-dark uppercase tracking-wider">
                        موقع المتجر <span className="opacity-50 font-bold normal-case">/ Position de la boutique</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        className={`w-full h-14 rounded-xl font-bold text-sm flex items-center gap-3 px-4 border-2 transition-all active:scale-[0.98] ${location
                            ? "bg-tamo-dark text-tamo-lime border-tamo-dark"
                            : "bg-white text-tamo-dark border-gray-200 hover:border-tamo-dark"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        <div className="flex flex-col items-start text-left">
                            {location ? (
                                <>
                                    <span>تم تحديد الموقع ✓</span>
                                    <span className="text-[9px] opacity-70 font-bold">
                                        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span>تحديد موقع المتجر</span>
                                    <span className="text-[9px] opacity-60 font-bold uppercase tracking-wide">Sélectionner la position</span>
                                </>
                            )}
                        </div>
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold text-center leading-relaxed">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={sending}
                    className="w-full h-16 bg-tamo-dark text-tamo-lime rounded-2xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex flex-col items-center justify-center border border-tamo-lime/20 mt-2 disabled:opacity-70"
                >
                    {sending ? (
                        <>
                            <span className="text-base">جاري الإرسال...</span>
                            <span className="text-[9px] opacity-60 uppercase tracking-widest">Envoi en cours...</span>
                        </>
                    ) : (
                        <>
                            <span>إرسال الطلب</span>
                            <span className="text-[9px] opacity-70 font-bold uppercase tracking-widest">Envoyer la demande</span>
                        </>
                    )}
                </button>

                <div className="h-6" /> {/* bottom spacing */}
            </form>
        </div>
    );
}

export default function ProRegisterPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center flex-1 p-8">
                <div className="w-12 h-12 bg-tamo-lime rounded-full animate-pulse mb-4"></div>
                <p className="text-tamo-dark font-bold">جاري التحميل...</p>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
