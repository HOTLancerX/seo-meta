"use client";

/**
 * plugin/seo-meta/settings/SeoSettingsPage.tsx
 *
 * Admin settings page for the SEO Meta plugin.
 * Mounted at /admin/seo-meta via addHook("admin.pages", ...) in index.ts.
 *
 * Tabs:
 *   General   — OpenAI API key, model selector, default country
 *   Templates — title/description templates, default OG image
 *   Social    — Twitter Card, Facebook App ID, Google Analytics
 */

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import useSettings from "@/lib/useSettings";
import { xFetch } from "@/lib/express";
import Gallery from "@/components/Gallery";

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({
    label,
    hint,
    value,
    onChange,
    type = "text",
    placeholder = "",
}: {
    label: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            {hint && <p className="text-xs text-gray-500 mb-1.5">{hint}</p>}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
        </div>
    );
}

// ── Model selector with live-fetch (matches ai-chat pattern) ──────────────────

function ModelSelector({
    value,
    onChange,
    apiKey,
}: {
    value: string;
    onChange: (v: string) => void;
    apiKey: string;
}) {
    const [fetchedModels, setFetchedModels] = useState<string[]>([]);
    const [fetching, setFetching]           = useState(false);
    const [fetchError, setFetchError]       = useState("");
    const [showDropdown, setShowDropdown]   = useState(false);

    const fetchModels = async () => {
        if (!apiKey?.trim()) {
            setFetchError("Enter your API key first.");
            return;
        }
        setFetching(true);
        setFetchError("");
        try {
            const res  = await fetch("/api/seo/models", { cache: "no-store" });
            const data = await res.json() as { models?: string[]; error?: string };
            if (!res.ok || data.error) {
                setFetchError(data.error ?? "Failed to fetch models.");
                return;
            }
            setFetchedModels(data.models ?? []);
            setShowDropdown(true);
        } catch {
            setFetchError("Network error while fetching models.");
        } finally {
            setFetching(false);
        }
    };

    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">AI Model</label>
            <p className="text-xs text-gray-500 mb-1.5">
                Type the model ID manually, or click <strong>Fetch Models</strong> to load
                available models from your configured API key.
            </p>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="e.g. gpt-4o-mini"
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                    type="button"
                    onClick={fetchModels}
                    disabled={fetching || !apiKey?.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition disabled:opacity-50 whitespace-nowrap"
                >
                    {fetching
                        ? <Icon icon="svg-spinners:ring-resize" width={14} />
                        : <Icon icon="solar:refresh-bold" width={14} />
                    }
                    Fetch Models
                </button>
            </div>

            {fetchError && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <Icon icon="mdi:alert-circle-outline" width={14} />
                    {fetchError}
                </p>
            )}

            {showDropdown && fetchedModels.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1.5">
                        {fetchedModels.length} model{fetchedModels.length !== 1 ? "s" : ""} found — click to select:
                    </p>
                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-56 overflow-y-auto shadow-sm">
                        {fetchedModels.map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => { onChange(m); setShowDropdown(false); }}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                    value === m
                                        ? "bg-sky-50 text-sky-700 font-medium"
                                        : "hover:bg-gray-50 text-gray-700"
                                }`}
                            >
                                <span className="font-mono text-xs">{m}</span>
                                {value === m && (
                                    <Icon icon="mdi:check" width={14} className="inline ml-2 text-sky-600" />
                                )}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowDropdown(false)}
                        className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
                    >
                        Hide list
                    </button>
                </div>
            )}

            {showDropdown && fetchedModels.length === 0 && !fetching && (
                <p className="mt-1.5 text-xs text-gray-400">No models returned by the provider.</p>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = "general" | "templates" | "social";

const TABS: { key: Tab; label: string; icon: string; description: string }[] = [
    {
        key: "general",
        label: "General",
        icon: "solar:settings-bold",
        description: "OpenAI API key, AI model, and default country for SEO generation.",
    },
    {
        key: "templates",
        label: "Templates",
        icon: "solar:document-text-bold",
        description: "Default title and description templates, and fallback OG image.",
    },
    {
        key: "social",
        label: "Social",
        icon: "solar:share-bold",
        description: "Open Graph, Twitter Card, and social platform settings.",
    },
];

export default function SeoSettingsPage() {
    const { settings, loading } = useSettings();

    // ── General state ────────────────────────────────────────────────────────
    const [apiKey, setApiKey]             = useState("");
    const [apiUrl, setApiUrl]             = useState("https://api.openai.com/v1/chat/completions");
    const [modelName, setModelName]       = useState("gpt-4o-mini");
    const [defaultCountry, setDefaultCountry] = useState("");

    // ── Templates state ──────────────────────────────────────────────────────
    const [titleTemplate, setTitleTemplate]       = useState("");
    const [descTemplate, setDescTemplate]         = useState("");
    const [defaultImage, setDefaultImage]         = useState("");

    // ── Social state ─────────────────────────────────────────────────────────
    const [twitterCard, setTwitterCard]           = useState("summary_large_image");
    const [facebookAppId, setFacebookAppId]       = useState("");
    const [googleAnalytics, setGoogleAnalytics]   = useState("");

    // ── UI state ─────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<Tab>("general");
    const [saving, setSaving]       = useState(false);
    const [message, setMessage]     = useState("");

    // ── Sync from DB ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (loading) return;
        setApiKey(settings.seo_openai_key || "");
        setApiUrl(settings.seo_api_url || "https://api.openai.com/v1/chat/completions");
        setModelName(settings.seo_ai_model || "gpt-4o-mini");
        setDefaultCountry(settings.seo_default_country || "");
        setTitleTemplate(settings.seo_title_template || "");
        setDescTemplate(settings.seo_description_template || "");
        setDefaultImage(settings.seo_default_image || "");
        setTwitterCard(settings.seo_twitter_card || "summary_large_image");
        setFacebookAppId(settings.seo_facebook_app_id || "");
        setGoogleAnalytics(settings.seo_google_analytics || "");
    }, [loading, settings]);

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        setMessage("");
        try {
            const res = await xFetch("/settings", {
                method: "PUT",
                body: JSON.stringify({
                    seo_openai_key:        apiKey,
                    seo_api_url:           apiUrl,
                    seo_ai_model:          modelName,
                    seo_default_country:   defaultCountry,
                    seo_title_template:    titleTemplate,
                    seo_description_template: descTemplate,
                    seo_default_image:     defaultImage,
                    seo_twitter_card:      twitterCard,
                    seo_facebook_app_id:   facebookAppId,
                    seo_google_analytics:  googleAnalytics,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setMessage(`Error: ${data.error ?? "Failed to save"}`);
            } else {
                setMessage("Settings saved!");
                setTimeout(() => setMessage(""), 3000);
            }
        } catch {
            setMessage("Network error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 text-gray-400">
                <Icon icon="svg-spinners:ring-resize" width={32} />
            </div>
        );
    }

    const currentTab = TABS.find((t) => t.key === activeTab) ?? TABS[0];

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">SEO Meta Settings</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Configure AI-powered SEO generation, templates, and social sharing.
                </p>
            </div>

            {/* Toast */}
            {message && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium border ${
                    message.startsWith("Error")
                        ? "bg-red-400/10 text-red-400 border-red-400/25"
                        : "bg-emerald-400/10 text-emerald-400 border-emerald-400/25"
                }`}>
                    {message}
                </div>
            )}

            {/* Tab bar */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-1 overflow-x-auto">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                    isActive
                                        ? "border-sky-500 text-sky-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <Icon icon={tab.icon} width={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <p className="text-sm text-gray-500">{currentTab.description}</p>

            {/* ── General Tab ──────────────────────────────────────────────── */}
            {activeTab === "general" && (
                <div className="space-y-5">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                        <p className="text-sm font-semibold text-gray-800">AI Configuration</p>
                        <p className="text-xs text-gray-500">
                            Works with any OpenAI-compatible API (OpenAI, OpenRouter, Together AI, Groq, etc.).
                        </p>
                        <Field
                            label="API Endpoint URL"
                            hint="The chat completions URL for your AI provider."
                            value={apiUrl}
                            onChange={setApiUrl}
                            placeholder="https://api.openai.com/v1/chat/completions"
                        />
                        <Field
                            label="API Key"
                            hint="Your secret API key. Stored securely in the database."
                            value={apiKey}
                            onChange={setApiKey}
                            type="password"
                            placeholder="sk-..."
                        />
                        <ModelSelector
                            value={modelName}
                            onChange={setModelName}
                            apiKey={apiKey}
                        />
                        <Field
                            label="Default Country"
                            hint="If set, AI will include this country in generated titles (e.g. 'iPhone 17 Pro Max in Kenya')."
                            value={defaultCountry}
                            onChange={setDefaultCountry}
                            placeholder="e.g. Kenya, Bangladesh, UAE"
                        />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                        <div className="flex gap-2">
                            <Icon icon="solar:danger-triangle-bold" width={18} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Security note</p>
                                <p className="mt-0.5 text-xs">
                                    The API key is sent from your server to the AI provider — never exposed to browsers.
                                    Ensure your site is served over HTTPS.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Templates Tab ────────────────────────────────────────────── */}
            {activeTab === "templates" && (
                <div className="space-y-5">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                        <p className="text-sm font-semibold text-gray-800">Default Templates</p>
                        <p className="text-xs text-gray-500">
                            Fallback values used when a page has no SEO data from the plugin.
                        </p>
                        <Field
                            label="Title Template"
                            hint="Default page title when no SEO title is set."
                            value={titleTemplate}
                            onChange={setTitleTemplate}
                            placeholder="e.g. {title} | My Shop"
                        />
                        <Field
                            label="Description Template"
                            hint="Default meta description when no SEO description is set."
                            value={descTemplate}
                            onChange={setDescTemplate}
                            placeholder="e.g. Shop {title} at the best prices"
                        />
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                        <p className="text-sm font-semibold text-gray-800">Default OG Image</p>
                        <p className="text-xs text-gray-500">
                            Fallback Open Graph image when a page has no SEO image set.
                        </p>
                        <Gallery
                            value={defaultImage}
                            onChange={(v) => setDefaultImage(Array.isArray(v) ? (v[0] ?? "") : v)}
                            placeholder="Select default OG image"
                        />
                    </div>
                </div>
            )}

            {/* ── Social Tab ───────────────────────────────────────────────── */}
            {activeTab === "social" && (
                <div className="space-y-5">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                        <p className="text-sm font-semibold text-gray-800">Social Sharing</p>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Twitter Card Type</label>
                            <select
                                value={twitterCard}
                                onChange={(e) => setTwitterCard(e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="summary">Summary</option>
                                <option value="summary_large_image">Summary Large Image</option>
                            </select>
                        </div>
                        <Field
                            label="Facebook App ID"
                            value={facebookAppId}
                            onChange={setFacebookAppId}
                            placeholder="e.g. 123456789"
                        />
                        <Field
                            label="Google Analytics ID"
                            value={googleAnalytics}
                            onChange={setGoogleAnalytics}
                            placeholder="e.g. G-XXXXXXXXXX"
                        />
                    </div>
                </div>
            )}

            {/* Save */}
            <div className="flex justify-end pt-2">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg transition disabled:opacity-55 disabled:cursor-not-allowed"
                >
                    {saving
                        ? <><Icon icon="svg-spinners:ring-resize" width={16} /> Saving…</>
                        : <><Icon icon="solar:check-circle-bold" width={16} /> Save Settings</>
                    }
                </button>
            </div>
        </div>
    );
}
