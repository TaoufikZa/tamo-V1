import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { order_id, status, amount, ...rest } = body;

        // 1. Update Supabase Orders Table using Admin Client (Bypasses RLS safely)
        const { error: supabaseError } = await supabaseAdmin
            .from("orders")
            .update({ status, amount })
            .eq("id", order_id);

        if (supabaseError) {
            console.error("Supabase Admin update error:", supabaseError);
            throw supabaseError;
        }

        // 2. Notify n8n Webhook
        const webhookUrl = process.env.N8N_MERCHANT_REPLY_WEBHOOK_URL;
        if (!webhookUrl) {
            console.warn("Merchant reply webhook not configured in ENV. Skipping n8n notify.");
        } else {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_id, status, amount, ...rest }),
            });

            if (!response.ok) {
                console.error("n8n webhook failed:", response.status);
                // We shouldn't fail the whole request if just n8n fails, the DB updated successfully.
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Merchant Reply API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
