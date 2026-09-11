import React from "react";
import ReactDOM from "react-dom/client";

import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "./index.css";


// ======================================================
// GLOBAL WHEEL GUARD
// Stop the browser from stepping number inputs when the
// user scrolls over them — consistent behaviour on every
// page. React attaches onWheel as a PASSIVE listener, so
// preventDefault() inside it is ignored; instead we add a
// native non-passive listener on document in the capture
// phase, and only block the default when the wheel target
// is a number input.
// ======================================================

document.addEventListener(
    "wheel",
    (e) => {
        const el = e.target;
        if (
            el &&
            el.tagName === "INPUT" &&
            el.type === "number"
        ) {
            e.preventDefault();
        }
    },
    { capture: true, passive: false }
);


ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <React.StrictMode>
        <LanguageProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </LanguageProvider>
    </React.StrictMode>
);