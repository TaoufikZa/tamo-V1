"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useLocation } from "@/context/LocationContext";

interface Shop {
    id: string;
    name: string;
    category: string;
    phone: string;
    photo_url: string | null;
}

function ShopPageContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;

    const [shop, setShop] = useState<Shop | null>(null);
    const [shopLoading, setShopLoading] = useState(true);

    useEffect(() => {
        const fetchShop = async () => {
            setShopLoading(true);
            const { data, error } = await supabase
                .from("shops")
                .select("*")
                .eq("id", id)
                .single();

            if (!error && data) {
                setShop(data);
            }
            setShopLoading(false);
        };
        if (id) fetchShop();
    }, [id]);

    // Capture customer data from URL params with localStorage fallback
    const [customerName, setCustomerName] = useState("");

    useEffect(() => {
        const urlName = searchParams.get("name");
        const name = urlName || localStorage.getItem("tamo_customer_name") || "";
        setCustomerName(name);
    }, [searchParams]);

    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    // Location is now pulled from global context
    const { lat: savedLat, lng: savedLng } = useLocation();
    const [recordingTime, setRecordingTime] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Audio Recording Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const mimeTypeRef = useRef<string>("");

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const getSupportedMimeType = () => {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/aac',
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return "";
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 2. Clear Recorder Chunks: Ensure array is empty before starting new recording
            audioChunksRef.current = [];

            // Explicitly check for MediaRecorder support
            if (typeof MediaRecorder === 'undefined') {
                alert("Audio recording is not supported in this browser.");
                return;
            }

            const supportedMimeType = getSupportedMimeType();
            if (!supportedMimeType) {
                alert("No supported audio recording format found in this browser.");
                return;
            }
            mimeTypeRef.current = supportedMimeType;

            const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const newAudioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
                const url = URL.createObjectURL(newAudioBlob);
                setAudioBlob(newAudioBlob);
                setAudioUrl(url);
                // Stop tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            setIsRecording(true);
            setRecordingTime(0);
            setAudioUrl(null);
            setAudioBlob(null);
            // Use a timeslice (100ms) to ensure data is captured reliably on mobile browsers
            mediaRecorder.start(100);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Microphone access is required. Please check your browser permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            // Force data request to ensure all chunks are captured before stopping
            mediaRecorderRef.current.requestData();
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleSendOrder = async () => {
        if (!audioBlob) return;
        setIsSending(true);

        try {
            const formData = new FormData();

            // 1. Robust Metadata Capture
            // Name: Search Params -> LocalStorage (Multiple Keys)
            const finalName = searchParams.get("name") ||
                searchParams.get("customer_name") ||
                localStorage.getItem("tamo_customer_name") ||
                localStorage.getItem("userName") ||
                "";

            // Phone: Search Params -> LocalStorage (Multiple Keys)
            const finalPhone = searchParams.get("phone") ||
                searchParams.get("customer_phone") ||
                localStorage.getItem("tamo_customer_phone") ||
                localStorage.getItem("userPhone") ||
                "";

            // 1. Strict Map-Based Location Validation
            if (savedLat === null || savedLng === null) {
                alert("يرجى تحديد موقع التوصيل أولاً / Veuillez sélectionner un lieu de livraison d'abord");
                router.push("/"); // Redirect to home map
                return;
            }

            // 2. Append the Audio properly: Standard file, not Base64
            const extension = mimeTypeRef.current.includes('mp4') ? 'm4a' : 'webm';
            formData.append("audio", audioBlob, `order.${extension}`);

            // 3. Append the Metadata
            formData.append("shop_id", id);
            formData.append("customer_name", finalName);
            formData.append("customer_phone", finalPhone);
            formData.append("latitude", savedLat.toString());
            formData.append("longitude", savedLng.toString());
            formData.append("status", "pending");
            formData.append("mime_type", mimeTypeRef.current);

            // 4. Debug Logging as requested
            console.log('Submission Payload:', Object.fromEntries(formData));

            const response = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "", {
                method: "POST",
                body: formData,
                // Note: Fetch sets the Boundary automatically when body is FormData
                mode: "cors",
            });

            if (response.ok) {
                // 4. State Reset: Clear everything immediately
                setAudioBlob(null);
                setAudioUrl(null);
                audioChunksRef.current = [];
                setIsSubmitted(true);
            } else {
                console.error("Failed to send order:", response.status);
                alert("Failed to send order. Please try again.");
            }
        } catch (error) {
            console.error("Error sending order:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const handleRerecord = () => {
        setAudioUrl(null);
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (shopLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 flex-1 mt-20">
                <div className="w-16 h-16 border-4 border-tamo-lime border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-center font-medium text-lg text-tamo-dark">جاري التحميل...</p>
                <p className="text-center text-sm text-gray-500">Chargement du magasin...</p>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="flex flex-col items-center justify-center p-8 flex-1 mt-20 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008h-.008v-.008Z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-tamo-dark mb-2">المتجر غير موجود</h2>
                <p className="text-gray-500">Boutique non trouvée</p>
                <button
                    onClick={() => router.push("/")}
                    className="mt-6 px-6 py-2 bg-tamo-dark text-tamo-lime rounded-xl font-bold"
                >
                    العودة للرئيسية / Retour
                </button>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 flex-1 bg-white text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-tamo-dark mb-4">
                    تم إرسال الطلب إلى {shop.name}!
                </h2>
                <div className="space-y-2">
                    <p className="text-gray-600 font-medium">
                        Commande envoyée avec succès !
                    </p>
                    <p className="text-gray-500 text-sm">
                        سنتواصل معك عبر واتساب لتأكيد السعر الإجمالي
                    </p>
                    <p className="text-gray-400 text-xs italic">
                        Nous vous contacterons par WhatsApp pour confirmer le montant total.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 p-4 bg-white">
            {/* Header Area */}
            <div className="flex items-center mb-8 pb-4 border-b border-gray-100">
                <button
                    onClick={() => router.push("/")}
                    className="text-tamo-dark p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                </button>
                <h2 className="text-xl font-bold text-tamo-dark flex-1 text-center pr-8">
                    {shop.name}
                </h2>
            </div>

            {/* Shop Hero Image */}
            <div className="w-full h-48 relative rounded-2xl overflow-hidden mb-6 bg-gray-100 shadow-sm">
                {shop.photo_url ? (
                    <Image
                        src={shop.photo_url}
                        alt={shop.name}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a48.667 48.667 0 0 1 12 0m-12 0V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3.349M3.75 21h16.5" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {!audioUrl ? (
                    // Recording / Idle State
                    <div className="flex flex-col items-center">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-xl ${isRecording
                                ? "bg-tamo-lime animate-pulse text-tamo-dark"
                                : "bg-tamo-lime text-tamo-dark hover:scale-105"
                                }`}
                        >
                            {isRecording ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-16 h-16">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                                </svg>
                            )}
                        </button>

                        <div className="flex flex-col mt-8 items-center text-center">
                            <p className="text-gray-500 font-bold mb-1">إضغط لبدء التسجيل</p>
                            <p className="text-gray-400 text-sm">Appuyez pour enregistrer</p>
                            <p className="text-tamo-dark font-medium text-lg capitalize mt-2">
                                {customerName || ""}
                            </p>
                        </div>
                        {isRecording && (
                            <div className="mt-8 text-2xl font-mono font-bold text-red-500 animate-pulse">
                                {formatTime(recordingTime)}
                            </div>
                        )}
                    </div>
                ) : (
                    // Review / Send State
                    <div className="w-full max-w-sm flex flex-col items-center">
                        <div className="flex flex-col items-center mb-8 pb-4 border-b border-gray-100 w-full">
                            <h2 className="text-xl font-bold text-tamo-dark text-center">يرجى تأكيد طلبك</h2>
                            <p className="text-gray-500 text-sm text-center">Veuillez confirmer votre commande</p>
                        </div>

                        <audio controls src={audioUrl} className="w-full" />

                        <div className="flex flex-col w-full space-y-4 mt-12">
                            <button
                                onClick={handleSendOrder}
                                disabled={isSending}
                                className={`w-full h-24 rounded-2xl font-bold transition-all flex flex-col items-center justify-center text-tamo-lime bg-tamo-dark ${isSending ? "opacity-75 cursor-not-allowed" : "hover:shadow-lg active:scale-95 shadow-md"
                                    }`}
                            >
                                <span className="text-xl leading-tight">أرسل طلبك</span>
                                <span className="text-sm font-normal opacity-80 mt-1">Envoyer</span>
                            </button>

                            <button
                                onClick={handleRerecord}
                                disabled={isSending}
                                className="w-full h-20 rounded-2xl font-bold text-gray-600 bg-gray-100 transition-colors hover:bg-gray-200 flex flex-col items-center justify-center"
                            >
                                <span className="text-lg leading-tight">إعادة التسجيل</span>
                                <span className="text-sm font-normal text-gray-500 mt-1">Réenregistrer</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center p-8 flex-1 mt-20">
                <div className="w-16 h-16 border-4 border-tamo-lime border-t-transparent rounded-full animate-spin mb-6 shadow-lg"></div>
                <p className="text-center font-medium text-lg text-tamo-dark">Loading shop...</p>
            </div>
        }>
            <ShopPageContent />
        </Suspense>
    );
}
