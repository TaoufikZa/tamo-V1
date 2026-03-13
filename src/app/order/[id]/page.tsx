import { createClient } from "@supabase/supabase-js";
import OrderClient from "./OrderClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export default async function OrderPage({ params }: { params: { id: string } }) {
    const { id } = params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase environment variables are missing.");
        return <div>Configuration error. Please check environment variables.</div>;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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

    return <OrderClient initialOrder={order} id={id} />;
}