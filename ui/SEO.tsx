"use client";

import { useState, type KeyboardEvent } from "react";
import { Icon } from "@iconify/react";
import Gallery from "@/components/Gallery";

// ── Tag-style keyword input (like components/ui/Tags) ─────────────────────────

function SeoTagInput({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const tags = value ? value.split(",").filter(Boolean) : [];
    const [input, setInput] = useState("");

    const add = () => {
        const trimmed = input.trim();
        if (!trimmed || tags.includes(trimmed)) return;
        onChange([...tags, trimmed].join(","));
        setInput("");
    };

    const remove = (tag: string) => {
        onChange(tags.filter((t) => t !== tag).join(","));
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
        } else if (e.key === "Backspace" && !input && tags.length) {
            remove(tags[tags.length - 1]);
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-1.5 min-h-[42px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus-within:border-violet-400 bg-white">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => remove(tag)}
                            className="text-violet-400 hover:text-violet-700 transition leading-none"
                            aria-label={`Remove ${tag}`}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={add}
                    className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
                    placeholder={tags.length ? "" : (placeholder || "Add keyword...")}
                />
            </div>
            <span className="text-[11px] text-gray-400">Press Enter or comma to add, Backspace to remove last</span>
        </div>
    );
}

export interface SEOProps {
    name: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options?: { label: string; value: string }[];
    ctx?: Record<string, unknown>;
}

function CharCount({ current, max }: { current: number; max: number }) {
    const pct = max > 0 ? (current / max) * 100 : 0;
    const color =
        pct > 100 ? "text-red-500"
        : pct > 85 ? "text-amber-500"
        : pct > 0 ? "text-emerald-500"
        : "text-gray-400";
    return (
        <span className={`text-[11px] font-mono ${color}`}>
            {current}/{max}
        </span>
    );
}

function SnippetPreview({ title, description, url }: { title: string; description: string; url: string }) {
    const displayTitle = title || "Page Title";
    const displayDesc = description || "Page description will appear here...";
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-1">
            <p className="text-[13px] text-gray-500 truncate">{url || "https://example.com/page"}</p>
            <p className="text-[18px] text-blue-700 font-medium leading-snug truncate hover:underline cursor-pointer">
                {displayTitle}
            </p>
            <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2">
                {displayDesc}
            </p>
        </div>
    );
}

function parseSeoData(value: string) {
    if (!value) return { title: "", desc: "", kw: "", image: "" };
    try {
        const p = JSON.parse(value);
        return {
            title: p.seo_title || "",
            desc: p.seo_description || "",
            kw: p.seo_keywords || "",
            image: p.seo_image || "",
        };
    } catch {
        return { title: value, desc: "", kw: "", image: "" };
    }
}

export default function SEO({ name, label, value, onChange, ctx }: SEOProps) {
    const contentTitle = String(ctx?.title ?? "");
    const contentType = String(ctx?.type ?? "post");
    const baseUrl = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL) || "https://example.com";

    const [seoTitle, setSeoTitle] = useState("");
    const [seoDesc, setSeoDesc] = useState("");
    const [seoKeywords, setSeoKeywords] = useState("");
    const [seoImage, setSeoImage] = useState("");
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState(true);

    const existing = parseSeoData(value);
    const currentTitle = seoTitle || existing.title;
    const currentDesc = seoDesc || existing.desc;
    const currentKw = seoKeywords || existing.kw;
    const currentImage = seoImage || existing.image;

    const emit = (t: string, d: string, k: string, img: string) => {
        onChange(JSON.stringify({ seo_title: t, seo_description: d, seo_keywords: k, seo_image: img }));
    };

    const handleGenerate = async () => {
        if (!contentTitle?.trim()) {
            setError("Please enter a page title first.");
            return;
        }
        setGenerating(true);
        setError("");
        try {
            const res = await fetch("/api/seo/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: contentTitle, type: contentType }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Generation failed");
                return;
            }
            const t = data.seo_title || "";
            const d = data.seo_description || "";
            const k = data.seo_keywords || "";
            setSeoTitle(t);
            setSeoDesc(d);
            setSeoKeywords(k);
            emit(t, d, k, currentImage);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleFieldChange = (field: "title" | "desc" | "kw", val: string) => {
        if (field === "title") setSeoTitle(val);
        else if (field === "desc") setSeoDesc(val);
        else setSeoKeywords(val);
        const t = field === "title" ? val : currentTitle;
        const d = field === "desc" ? val : currentDesc;
        const k = field === "kw" ? val : currentKw;
        emit(t, d, k, currentImage);
    };

    const handleImageChange = (v: string | string[]) => {
        const img = Array.isArray(v) ? (v[0] ?? "") : v;
        setSeoImage(img);
        emit(currentTitle, currentDesc, currentKw, img);
    };

    const handleAutofill = () => {
        if (!contentTitle) return;
        setSeoTitle(contentTitle);
        emit(contentTitle, currentDesc, currentKw, currentImage);
    };

    const slugify = (t: string) =>
        t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const previewUrl = `${baseUrl.replace(/\/+$/, "")}/${contentType}/${slugify(contentTitle)}`;

    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon icon="solar:magic-stick-bold" width={18} className="text-violet-500" />
                    <span className="text-sm font-semibold text-gray-700">{label || "SEO Preview"}</span>
                </div>
                <Icon
                    icon={expanded ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"}
                    width={16}
                    className="text-gray-400"
                />
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-4">
                    <SnippetPreview title={currentTitle} description={currentDesc} url={previewUrl} />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating || !contentTitle?.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold transition hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating ? (
                                <>
                                    <Icon icon="svg-spinners:ring-resize" width={16} />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Icon icon="solar:magic-stick-bold" width={16} />
                                    Generate with AI
                                </>
                            )}
                        </button>
                        {contentTitle?.trim() && (
                            <button
                                type="button"
                                onClick={handleAutofill}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                            >
                                <Icon icon="solar:pen-bold" width={14} />
                                Use Page Title
                            </button>
                        )}
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-gray-600">SEO Title</label>
                                <CharCount current={currentTitle.length} max={60} />
                            </div>
                            <input
                                type="text"
                                value={currentTitle}
                                onChange={(e) => handleFieldChange("title", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400 bg-white"
                                placeholder="Enter SEO title..."
                                maxLength={80}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-gray-600">Meta Description</label>
                                <CharCount current={currentDesc.length} max={160} />
                            </div>
                            <textarea
                                value={currentDesc}
                                onChange={(e) => handleFieldChange("desc", e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400 bg-white resize-none"
                                placeholder="Enter meta description..."
                                maxLength={200}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-gray-600">Keywords</label>
                                <span className="text-[11px] text-gray-400">
                                    {currentKw ? currentKw.split(",").filter((k) => k.trim()).length : 0} keywords
                                </span>
                            </div>
                            <SeoTagInput
                                value={currentKw}
                                onChange={(v) => handleFieldChange("kw", v)}
                                placeholder="Add keyword..."
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600">OG Image</label>
                            <Gallery
                                value={currentImage}
                                onChange={handleImageChange}
                                placeholder="Select OG image"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
