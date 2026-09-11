// ======================================================
// React binding for the i18n core.
// Provides <LanguageProvider>, useLanguage(), useT().
// ======================================================
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    getLang,
    initLang,
    setLang as coreSetLang,
    t as coreT
} from "./core";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {

    const [lang, setLangState] = useState(() => initLang());

    const setLang = useCallback((next) => {
        coreSetLang(next);
        setLangState(getLang());
    }, []);

    // Keep React state in sync if language changes outside React.
    useEffect(() => {
        const sync = () => setLangState(getLang());
        window.addEventListener("pp:langchange", sync);
        return () => window.removeEventListener("pp:langchange", sync);
    }, []);

    const value = useMemo(() => ({
        lang,
        setLang,
        t: coreT
    }), [lang, setLang]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

// Stable `t` reference, so components can just:
//   const t = useT();
// Subscribes to the context so consumers re-render on
// language toggle, while `t` itself is the stable core fn.
export function useT() {
    const { t } = useContext(LanguageContext);
    return t;
}