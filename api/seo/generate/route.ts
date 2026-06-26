import { NextResponse } from "next/server";
import { Settings } from "@/lib/settings";

export const dynamic = "force-dynamic";

interface SeoRequest {
    title: string;
    type?: string;
    description?: string;
    country?: string;
}

interface SeoResult {
    seo_title: string;
    seo_description: string;
    seo_keywords: string;
}

export async function POST(req: Request) {
    try {
        const body: SeoRequest = await req.json();
        const { title, type = "post", description = "", country = "" } = body;

        if (!title?.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const settings = await Settings();
        const apiKey = settings.seo_openai_key || settings.openai_api_key || "";
        const apiUrl = settings.seo_api_url || "https://api.openai.com/v1/chat/completions";
        const siteName = settings.site_title || settings.siteName || "Site";
        const defaultCountry = country || settings.seo_default_country || "";
        const model = settings.seo_ai_model || "gpt-4o-mini";

        if (!apiKey) {
            return NextResponse.json({
                error: "OpenAI API key not configured. Please add it in SEO Meta Settings.",
            }, { status: 400 });
        }

        const contextParts: string[] = [];
        if (type) contextParts.push(`Content type: ${type}`);
        if (defaultCountry) contextParts.push(`Target country: ${defaultCountry}`);
        if (description) contextParts.push(`Existing description: ${description}`);

        const contextLine = contextParts.length > 0
            ? `\nAdditional context:\n${contextParts.join("\n")}`
            : "";

        const systemPrompt = `You are an SEO expert. Generate optimized meta information for a web page.

Rules:
- Title: maximum 60 characters. If a target country is provided, include it naturally (e.g. "iPhone 17 Pro Max in Kenya").
- Description: exactly 150-160 characters. Compelling, with a call to action.
- Keywords: 5-10 relevant keywords, comma-separated.
- The site name is "${siteName}" — do NOT include it in the SEO title (it is appended automatically).
- Return ONLY valid JSON, no markdown, no explanation.

Output format:
{"seo_title": "...", "seo_description": "...", "seo_keywords": "..."}`;

        const userPrompt = `Generate SEO meta for: "${title}"${contextLine}`;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenAI API error:", err);
            return NextResponse.json({
                error: `OpenAI API error (${response.status}). Check your API key.`,
            }, { status: 502 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim() ?? "";

        let result: SeoResult;
        try {
            const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
            result = JSON.parse(cleaned);
        } catch {
            return NextResponse.json({
                error: "Failed to parse AI response. Please try again.",
                raw: content,
            }, { status: 502 });
        }

        return NextResponse.json({
            seo_title: String(result.seo_title || "").slice(0, 80),
            seo_description: String(result.seo_description || "").slice(0, 200),
            seo_keywords: String(result.seo_keywords || ""),
        });
    } catch (error) {
        console.error("SEO generate error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
