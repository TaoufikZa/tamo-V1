"use client";

import { useState, useMemo } from "react";

// Data Type
interface Order {
    id: string;
    shop_id: string;
    audio_url: string;
    status: "pending" | "pricing" | "accepted" | "rejected";
    customer_name: string;
    customer_phone: string;
    latitude: number | null;
    longitude: number | null;
    amount?: number;
}

export default function OrderClient({ initialOrder, id }: { initialOrder: Order, id: string }) {
    const [order, setOrder] = useState<Order>(initialOrder);
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 3. Browser Cache Busting: Memoizeed to only change when the URL itself changes
    // This prevents the audio from resetting while the merchant is typing the price.
    const audioSrc = useMemo(() => `${order.audio_url}?cb=${Date.now()}`, [order.audio_url]);


    const handleAcceptOrder = () => {
        setOrder({ ...order, status: "pricing" });
    };

    const handleDeclineOrder = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/merchant-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: id,
                    shop_id: order.shop_id,
                    status: "rejected",
                    amount: 0,
                    customer_name: order.customer_name,
                    customer_phone: order.customer_phone
                }),
            });

            if (response.ok) {
                setOrder({ ...order, status: "rejected" });
            } else {
                alert("Order saved, but failed to notify customer.");
            }
        } catch (error) {
            console.error("Process error:", error);
            alert("An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleValidatePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = Number(amount);
        if (!amount || isNaN(numericAmount)) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/merchant-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: id,
                    shop_id: order.shop_id,
                    status: "accepted",
                    amount: numericAmount,
                    customer_name: order.customer_name,
                    customer_phone: order.customer_phone
                }),
            });

            if (response.ok) {
                setOrder({ ...order, status: "accepted" });
            } else {
                alert("Order saved, but failed to notify customer.");
            }
        } catch (error) {
            console.error("Process error:", error);
            alert("An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (order.status === "accepted") {
        return (
            <div className="flex flex-col items-center justify-center p-8 flex-1 bg-white text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-tamo-dark mb-4">تم قبول الطلب! / Acceptée</h2>
                <p className="text-gray-600 font-medium text-lg leading-relaxed">
                    تم إخطار الزبون عبر واتساب <br />
                    le client a été notifié.
                </p>
                <div className="mt-4 p-4 bg-tamo-light rounded-xl">
                    <span className="text-2xl font-bold text-tamo-dark">{amount || order.amount || ""} DH</span>
                </div>
            </div>
        );
    }

    if (order.status === "rejected") {
        return (
            <div className="flex flex-col items-center justify-center p-8 flex-1 bg-white text-center">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-tamo-dark mb-4">تم إلغاء الطلب / Rejetée</h2>
                <p className="text-gray-600 font-medium text-center">
                    سيتم إخطار الزبون بعدم التوفر <br />
                    Le client sera informé.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 p-6 bg-white">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-tamo-dark flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-tamo-lime animate-pulse"></span>
                        طلب جديد
                    </h2>
                    <p className="text-xs text-gray-400 font-medium ml-5">Nouvelle commande</p>
                </div>
                <span className="text-gray-400 text-sm font-mono pt-1">#{id.slice(0, 5)}</span>
            </div>

            <div className="flex flex-col flex-1">
                <div className="w-full flex flex-col mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                            <p className="text-gray-500 font-bold mb-0.5">زبون / Client</p>
                            {order.customer_name && (
                                <p className="text-tamo-dark font-medium text-lg capitalize">{order.customer_name}</p>
                            )}
                        </div>
                        {order.latitude && order.longitude && (
                            <a
                                href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-tamo-lime bg-tamo-dark px-4 py-3 rounded-xl text-xs font-bold shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                </svg>
                                الموقع / GPS
                            </a>
                        )}
                    </div>

                    <div className="flex flex-col border-t pt-4 border-gray-100">
                        <p className="text-gray-500 font-bold mb-1 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                            </svg>
                            طلب صوتي
                        </p>
                        <p className="text-xs text-gray-400 mb-4 ml-7">Message vocal</p>
                    </div>
                    <audio
                        key={order.audio_url} // 2. React State / Component Re-mounting
                        controls
                        preload="metadata"
                        src={audioSrc}
                        className="w-full"
                    />
                    <div className="mt-4 text-center">
                        <a href={audioSrc} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-tamo-dark underline font-medium">
                            Audio not playing? Open in new tab
                        </a>
                    </div>
                </div>

                {order.status === "pending" && (
                    <div className="flex gap-4 mt-auto">
                        <button onClick={handleDeclineOrder} className="px-4 h-24 rounded-2xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors flex-1 flex flex-col items-center justify-center">
                            <span className="text-lg">إلغاء</span>
                            <span className="text-sm font-normal opacity-70">Annuler</span>
                        </button>
                        <button onClick={handleAcceptOrder} className="px-4 h-24 rounded-2xl font-bold text-tamo-dark bg-tamo-lime hover:scale-[1.02] active:scale-95 transition-transform flex-[2] shadow-md flex flex-col items-center justify-center">
                            <span className="text-xl">قبول الطلب</span>
                            <span className="text-sm font-normal opacity-80">Accepter</span>
                        </button>
                    </div>
                )}

                {order.status === "pricing" && (
                    <form onSubmit={handleValidatePrice} className="flex flex-col mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex flex-col items-center mb-4">
                            <label htmlFor="amount" className="text-tamo-dark font-bold text-lg">السعر الإجمالي</label>
                            <p className="text-gray-500 text-sm">Montant total</p>
                        </div>
                        <div className="relative mb-8">
                            <input
                                id="amount"
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="00.00"
                                className="w-full p-4 text-center text-3xl rounded-xl border-2 border-gray-200 focus:border-tamo-lime focus:outline-none focus:ring-4 focus:ring-tamo-lime/20 transition-all font-mono font-bold"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">DH</span>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button type="submit" disabled={isSubmitting || !amount} className={`w-full h-24 rounded-2xl font-bold transition-all text-white bg-tamo-dark shadow-lg flex flex-col items-center justify-center ${isSubmitting || !amount ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"}`}>
                                <span className="text-xl leading-tight">تأكيد وإرسال</span>
                                <span className="text-sm font-normal text-gray-400 mt-1">Valider et Envoyer</span>
                            </button>

                            <button type="button" onClick={() => setOrder({ ...order, status: "pending" })} className="p-4 text-gray-500 font-bold text-center underline decoration-2 underline-offset-4">
                                إلغاء / Annuler
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
