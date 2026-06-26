import { addHook, type PluginMeta } from "@/hook";
import SeoSettingsPage from "./settings/SeoSettingsPage";
import SEO from "./ui/SEO";

export const PLUGINS: PluginMeta = {
    nx: "com.system.seo-meta",
    name: "seo-meta",
    version: "1.0.0",
    description: "Advanced SEO plugin — AI-powered meta title, description, keywords, and OG image for posts, categories, and users. Like Yoast SEO for WordPress.",
    author: "System",
    path: "https://github.com/HOTLancerX/seo-meta.git",
    icon: "solar:chart-square-bold",
    color: "from-sky-500 to-blue-600",
};

export function register() {
    // ─── Post form ───────────────────────────────────────────────────────────
    addHook("post.form", [
        {
            key: "seo_data",
            label: "SEO — Title, Description, Keywords & Image",
            type: "",
            style: "left",
            position: 9970,
            component: SEO,
        },
    ], PLUGINS.nx);

    // ─── Cat form ────────────────────────────────────────────────────────────
    addHook("cat.form", [
        {
            key: "seo_data",
            label: "SEO — Title, Description, Keywords & Image",
            type: "",
            style: "left",
            position: 9970,
            component: SEO,
        },
    ], PLUGINS.nx);

    // ─── User form ───────────────────────────────────────────────────────────
    addHook("User.form", [
        {
            key: "seo_data",
            label: "SEO — Title, Description, Keywords & Image",
            type: "",
            style: "left",
            position: 9970,
            component: SEO,
        },
    ], PLUGINS.nx);

    // ─── Admin nav ───────────────────────────────────────────────────────────
    addHook("admin.nav", [
        {
            key: "seo-meta",
            label: "SEO Meta",
            icon: "solar:chart-square-bold",
            slug: "seo-meta",
            parent: "",
            position: 55,
        },
    ], PLUGINS.nx);

    // ─── Admin pages ─────────────────────────────────────────────────────────
    addHook("admin.pages", [
        {
            key: "seo-meta",
            label: "SEO Meta Settings",
            type: "seo-meta",
            style: "left",
            position: 10,
            path: SeoSettingsPage,
        },
    ], PLUGINS.nx);
}
