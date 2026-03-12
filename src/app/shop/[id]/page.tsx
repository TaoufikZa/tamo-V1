"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// Mock Data
const MOCK_SHOPS = [
    { id: "1", name: "Hanout Brahim", type: "Store", distance: "120m", phone: "212600000001" },
    { id: "2", name: "Khadija Sweets", type: "Home Bakery", distance: "300m", phone: "212600000002" },
    { id: "3", name: "Epicerie Atlas", type: "Store", distance: "500m", phone: "212600000003" },
    { id: "taoufik-shop", name: "Taoufik Shop", type: "General Store", distance: "600m", phone: "212601866049" },
];

export default function ShopPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const shop = MOCK_SHOPS.find((s) => s.id === params.id) || MOCK_SHOPS[0];

    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Audio Recording Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup timer on unmount
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const newAudioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const url = URL.createObjectURL(newAudioBlob);
                setAudioBlob(newAudioBlob);
                setAudioUrl(url);
            };

            setIsRecording(true);
            setRecordingTime(0);
            setAudioUrl(null);
            setAudioBlob(null);
            mediaRecorder.start();

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Microphone access is required to use this feature.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Stop all audio tracks
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
    };

    const handleSendOrder = async () => {
        if (!audioBlob) return;
        setIsSending(true);

        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "order.webm");
            formData.append("shopId", params.id);

            const response = await fetch("https://tamoit.app.n8n.cloud/webhook/a4839bf6-9651-4134-8225-b1c5c0ed6d55", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                setIsSubmitted(true);
            } else {
                console.error("Failed to send order, status:", response.status);
                alert("Failed to send order. Please try again.");
            }
        } catch (error) {
            console.error("Error sending order:", error);
            alert("An error occurred while sending your order. Please try again.");
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

    if (isSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 flex-1 bg-white text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-tamo-dark mb-4">
                    Order Sent to {shop.name}!
                </h2>
                <p className="text-gray-600 font-medium">
                    You can close this page. We will message you on WhatsApp with the total amount.
                </p>
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

                        {isRecording ? (
                            <div className="mt-8 text-2xl font-mono font-bold text-red-500 animate-pulse">
                                {formatTime(recordingTime)}
                            </div>
                        ) : (
                            <p className="mt-8 text-gray-500 font-medium">Tap to start speaking</p>
                        )}
                    </div>
                ) : (
                    // Review / Send State
                    <div className="w-full max-w-sm flex flex-col items-center space-y-8">
                        <p className="text-gray-500 font-medium pb-2 border-b border-gray-100 w-full text-center">
                            Review your order
                        </p>

                        <audio controls src={audioUrl} className="w-full" />

                        <div className="flex flex-col w-full space-y-3 mt-8">
                            <button
                                onClick={handleSendOrder}
                                disabled={isSending}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-transform text-tamo-lime bg-tamo-dark ${isSending ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95 shadow-md"
                                    }`}
                            >
                                {isSending ? "Sending..." : "Send Order"}
                            </button>

                            <button
                                onClick={handleRerecord}
                                disabled={isSending}
                                className="w-full py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 transition-colors hover:bg-gray-200"
                            >
                                Re-record
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
