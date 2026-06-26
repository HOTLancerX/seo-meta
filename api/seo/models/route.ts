import { NextResponse } from "next/server";
import { Settings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const settings = await Settings();
        const apiKey = settings.seo_openai_key || "";
        const apiUrl = settings.seo_api_url || "https://api.openai.com/v1/chat/completions";

        if (!apiKey) {
            return NextResponse.json({
                error: "API key not configured. Add it in SEO Meta Settings.",
            }, { status: 400 });
        }

        // Derive models endpoint from chat completions URL
        // e.g. https://openrouter.ai/api/v1/chat/completions → https://openrouter.ai/api/v1/models
        // e.g. https://api.openai.com/v1/chat/completions → https://api.openai.com/v1/models
        const modelsUrl = apiUrl.replace(/\/chat\/completions\/?$/, "/models");

        const response = await fetch(modelsUrl, {
            headers: { Authorization: `Bearer ${apiKey}` },
            cache: "no-store",
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Models API error:", err);
            return NextResponse.json({
                error: `Failed to fetch models (HTTP ${response.status}). Check your API key and URL.`,
            }, { status: 502 });
        }

        const data = await response.json();
        const models: string[] = (data.data ?? [])
            .map((m: any) => m.id)
            .filter((id: string) => typeof id === "string")
            .sort();

        return NextResponse.json({ models });
    } catch (error) {
        console.error("SEO models fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
