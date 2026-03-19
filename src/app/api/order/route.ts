import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (!webhookUrl) throw new Error("Webhook URL not configured");

        // Forward safely from server to n8n
        const response = await fetch(webhookUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            console.error("Upstream webhook failed:", response.status);
            return NextResponse.json({ error: "Upstream webhook failed" }, { status: response.status });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Order API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
