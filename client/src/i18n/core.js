// ======================================================
// i18n CORE — plain JS language state + translate()
// ------------------------------------------------------
// No React dependency. ledgerExport.js and any non-React
// module import { t, getLang } directly. React components
// consume it through LanguageContext (see
// ./LanguageContext.jsx) so they re-render on toggle.
// ======================================================
import { DICT } from "./dictionary";

export const STORAGE_KEY = "pp_lang";
export const LANGS = ["en", "hi"];
export const TITLES = {
    en: "Petrol Pump Management",
    hi: "पेट्रोल पंप प्रबंधन"
};

const PLACEHOLDER_RE = /\{(\w+)\}/g;

let currentLang = "en";

function applyDocumentAttrs(lang) {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.title = TITLES[lang] || TITLES.en;
}

export function getLang() {
    return currentLang;
}

export function initLang() {
    let saved = "en";
    try {
        saved = localStorage.getItem(STORAGE_KEY) || "en";
    } catch {
        /* localStorage unavailable — keep default */
    }
    if (!LANGS.includes(saved)) saved = "en";
    currentLang = saved;
    applyDocumentAttrs(saved);
    return saved;
}

export function setLang(lang) {
    if (!LANGS.includes(lang)) lang = "en";
    currentLang = lang;
    try {
        localStorage.setItem(STORAGE_KEY, lang);
    } catch {
        /* persist failure is non-fatal */
    }
    applyDocumentAttrs(lang);
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pp:langchange"));
    }
    return lang;
}

// Translate an English source string into the current language.
// Unknown strings and English mode return the source verbatim,
// so partial translation is always safe. {placeholders} are
// interpolated in BOTH languages (English only skips the lookup).
export function t(str, opts) {
    if (!str) return str;
    const base =
        currentLang === "hi" && DICT[str] !== undefined
            ? DICT[str]
            : str;
    if (!opts) return base;
    return base.replace(
        PLACEHOLDER_RE,
        (m, k) => (opts[k] !== undefined ? String(opts[k]) : m)
    );
}

export { t as translate };