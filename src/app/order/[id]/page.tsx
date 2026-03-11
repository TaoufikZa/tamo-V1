"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Mock Data Type
interface Order {
    id: string;
    shop_id: string;
    audio_url: string;
    status: "pending" | "pricing" | "accepted" | "declined";
}

export default function OrderPage({ params }: { params: { id: string } }) {
    const router = useRouter();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Simulate Fetching Data
    useEffect(() => {
        const fetchOrder = async () => {
            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 800));

            setOrder({
                id: params.id,
                shop_id: "1",
                audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                status: "pending",
            });
            setLoading(false);
        };

        fetchOrder();
    }, [params.id]);

    const handleAcceptOrder = () => {
        if (order) {
            setOrder({ ...order, status: "pricing" });
        }
    };

    const handleDeclineOrder = () => {
        if (order) {
            setOrder({ ...order, status: "declined" });
        }
    };

    const handleValidatePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isNaN(Number(amount))) return;

        setIsSubmitting(true);
        // Simulate API call to notify customer
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsSubmitting(false);

        if (order) {
            setOrder({ ...order, status: "accepted" });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 flex-1 mt-20">
                <div className="w-16 h-16 border-4 border-tamo-lime border-t-transparent rounded-full animate-spin mb-6 shadow-lg"></div>
                <p className="text-center font-medium text-lg text-tamo-dark">Loading order details...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center p-8 flex-1 text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Order Not Found</h2>
                <button onClick={() => router.push("/")} className="text-tamo-dark underline">Return Home</button>
            </div>
        );
    }

    // Completion State
    if (order.status === "accepted") {
        return (
            <div className="flex flex-col items-center justify-center p-8 flex-1 bg-white text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-tamo-dark mb-4">
                    Order Accepted!
                </h2>
                <p className="text-gray-600 font-medium text-lg leading-relaxed">
                    The customer has been notified via WhatsApp to prepare <span className="font-bold text-tamo-dark">{amount} DH</span>.
                </p>
            </div>
        );
    }

    // Declined State
    if (order.status === "declined") {
        return (
            <div className="flex flex-col items-center justify-center p-8 flex-1 bg-white text-center">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-tamo-dark mb-4">
                    Order Declined
                </h2>
                <p className="text-gray-600 font-medium">
                    The customer will be notified that you cannot fulfill this order.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 p-6 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-tamo-dark flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-tamo-lime animate-pulse"></span>
                    New Order Received
                </h2>
                <span className="text-gray-400 text-sm font-mono">#{order.id.slice(0, 5)}</span>
            </div>

            <div className="flex flex-col flex-1">
                {/* Listen Phase */}
                <div className="w-full flex flex-col mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <p className="text-gray-500 font-medium mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                        </svg>
                        Customer Audio
                    </p>
                    <audio controls src={order.audio_url} className="w-full" />
                </div>

                {/* Action Phase: Pending -> Accept/Decline */}
                {order.status === "pending" && (
                    <div className="flex gap-4 mt-auto">
                        <button
                            onClick={handleDeclineOrder}
                            className="px-6 py-4 rounded-xl font-bold text-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors flex-1"
                        >
                            Decline
                        </button>
                        <button
                            onClick={handleAcceptOrder}
                            className="px-6 py-4 rounded-xl font-bold text-lg text-tamo-dark bg-tamo-lime hover:scale-[1.02] active:scale-95 transition-transform flex-[2] shadow-md"
                        >
                            Accept Order
                        </button>
                    </div>
                )}

                {/* Pricing Phase -> Input Form */}
                {order.status === "pricing" && (
                    <form onSubmit={handleValidatePrice} className="flex flex-col mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <label htmlFor="amount" className="text-tamo-dark font-bold mb-2">
                            Total Amount
                        </label>
                        <div className="relative mb-6">
                            <input
                                id="amount"
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter total amount (DH)..."
                                className="w-full p-4 pl-6 text-xl rounded-xl border-2 border-gray-200 focus:border-tamo-lime focus:outline-none focus:ring-4 focus:ring-tamo-lime/20 transition-all font-mono"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                DH
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !amount}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all text-white bg-tamo-dark shadow-md ${isSubmitting || !amount ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"
                                }`}
                        >
                            {isSubmitting ? "Notifying..." : "Validate & Notify Customer"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setOrder({ ...order, status: "pending" })}
                            className="mt-4 text-gray-500 font-medium underline"
                        >
                            Cancel
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
