import { addHook, type PluginMeta } from "@/hook";
import { Text, Tags, Textarea } from "@/components/ui";

// ─── Plugin metadata ───
export const PLUGINS: PluginMeta = {
    nx: "com.system.seo-meta",
    name: "seo meta",
    version: "1.0.0",
    description: "SEO system plugin",
    author: "System",
    path: "@/plugin/seo-meta/index",
    icon: "solar:chart-bold",
    color: "from-sky-500 to-blue-600",
};

/**
 * Register all hooks for this plugin.
 * Called by PluginList.reregisterHooks() after the gate is armed.
 */
export function register() {
    // ─── Post form fields ───
    addHook("post.form", [
        {
            key: "seo_meta_title",
            label: "SEO Title",
            type: "",
            style: "left",
            position: 9991,
            component: Text,
        },
        {
            key: "seo_meta_description",
            label: "SEO Description",
            type: "",
            style: "left",
            position: 9992,
            component: Textarea,
        },
        {
            key: "seo_meta_keyword",
            label: "SEO Keyword",
            type: "",
            style: "left",
            position: 9993,
            component: Tags,
        },
    ], PLUGINS.nx);

    // ─── Cat form fields ───
    addHook("cat.form", [
        {
            key: "seo_meta_title",
            label: "SEO Title",
            type: "",
            style: "left",
            position: 9991,
            component: Text,
        },
        {
            key: "seo_meta_description",
            label: "SEO Description",
            type: "",
            style: "left",
            position: 9992,
            component: Textarea,
        },
        {
            key: "seo_meta_keyword",
            label: "SEO Keyword",
            type: "",
            style: "left",
            position: 9993,
            component: Tags,
        },
    ], PLUGINS.nx);

    addHook("admin.nav", [
        {
            key: "1",
            icon: "solar:chart-bold",
            label: "Plugin List",
            slug: "plugin",
            parent: "",
            position: 1,
        },
        {
            key: "2",
            icon: "solar:chart-bold",
            label: "Plugin add",
            slug: "plugin/list",
            parent: "1",
            position: 1,
        },
    ], PLUGINS.nx);
}
