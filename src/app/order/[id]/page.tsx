import { createClient } from "@supabase/supabase-js";
import OrderClient from "./OrderClient";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Initialize Supabase Client (Server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

export default async function OrderPage({ params }: { params: { id: string } }) {
    const { id } = params;

    const { data, error } = await supabase
        .from("orders")
        .select("id, shop_id, audio_url, status, customer_name, customer_phone, latitude, longitude, amount")
        .eq("id", id)
        .single();

    if (error || !data) {
        console.error("Error fetching order:", error);
        return (
            <div className="flex flex-col items-center justify-center p-8 flex-1 text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Order Not Found</h2>
                <a href="/" className="text-tamo-dark underline">Return Home</a>
            </div>
        );
    }

    const order = data as Order;

    return <OrderClient initialOrder={order} id={id} />;
}