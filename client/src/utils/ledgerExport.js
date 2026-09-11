import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { getLang } from "../i18n/core";
import { DICT } from "../i18n/dictionary";


// ======================================================
// I18N CONVENTION
// ------------------------------------------------------
// Only WORDS are translated (via `t`). Numbers stay Latin
// digits, "Rs." prefix is kept in the PDF (Helvetica and
// Noto Devanagari both print it safely), dates stay en-IN.
// For lang === "hi", the Noto Sans Devanagari fonts are
// embedded so Devanagari renders in the PDF. jsPDF 4.x does
// not perform OpenType complex shaping, so for the short
// label vocabulary used here this is accepted as-is.
// ======================================================

// ======================================================
// SHARED FORMATTERS
// ======================================================

function fmt(val) {
    return Number(val || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function fmtDate(str) {
    if (!str) return "-";
    const [y, m, d] = str.split("-");
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
        .toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric"
        });
}

const today = () =>
    new Date().toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
        hour12: true
    });

// "Rs." instead of ₹ — jsPDF Helvetica doesn't support ₹
const rupee = (val) => `Rs. ${fmt(val)}`;


// ======================================================
// DEVANAGARI FONT LOADING (runtime fetch, memoized)
// ======================================================

let fontsCache = null; // { regular, bold } base64 strings | null

function arrayBufferToBase64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = "";
    // Chunked conversion to avoid call-stack overflow on large strings.
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
}

async function ensureDevanagariFonts() {
    if (fontsCache) return fontsCache;
    const base = import.meta.env.BASE_URL || "/";
    try {
        const [reg, bold] = await Promise.all([
            fetch(`${base}fonts/NotoSansDevanagari-Regular.ttf`),
            fetch(`${base}fonts/NotoSansDevanagari-Bold.ttf`)
        ]);
        if (!reg.ok || !bold.ok) return null;
        fontsCache = {
            regular: arrayBufferToBase64(await reg.arrayBuffer()),
            bold: arrayBufferToBase64(await bold.arrayBuffer())
        };
        return fontsCache;
    } catch {
        return null; // fall back to English Helvetica PDF
    }
}

// Shrink font size until text fits maxWidth (overflow guard).
function fitFontSize(doc, text, startSize, maxWidth, minSize = 8) {
    doc.setFontSize(startSize);
    while (doc.getTextWidth(text) > maxWidth && doc.getFontSize() > minSize) {
        doc.setFontSize(doc.getFontSize() - 0.5);
    }
}

// Translate an English source string against an EXPLICIT lang.
// t() in ./core translates against the module-level currentLang;
// these export functions take lang as a parameter, so they use this
// self-contained lookup instead (React may toggle lang mid-call).
const PLACEHOLDER_RE = /\{(\w+)\}/g;

function translateWith(lang, str, vars) {
    if (!str) return str;
    const base =
        lang === "hi" && DICT[str] !== undefined
            ? DICT[str]
            : str;
    if (!vars) return base;
    return base.replace(
        PLACEHOLDER_RE,
        (m, k) => (vars[k] !== undefined ? String(vars[k]) : m)
    );
}


// ======================================================
// LEDGER PDF — DOWNLOAD
// { customer, sales, credits, totals }
// ======================================================

export async function downloadLedgerPdf(statement, lang = getLang()) {

    const { customer, sales = [], credits = [], totals } = statement;

    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // ---- Select font family: Devanagari for Hindi ----
    let fontFamily = "helvetica";
    if (lang === "hi") {
        const ok = await ensureDevanagariFonts();
        if (ok) {
            doc.addFileToVFS("NotoSansDevanagari-Regular.ttf", ok.regular);
            doc.addFileToVFS("NotoSansDevanagari-Bold.ttf", ok.bold);
            doc.addFont("NotoSansDevanagari-Regular.ttf", "NotoDeva", "normal");
            doc.addFont("NotoSansDevanagari-Bold.ttf", "NotoDeva", "bold");
            fontFamily = "NotoDeva";
        }
        // else: fonts unavailable -> English Helvetica fallback
    }

    const translateFor = (str, vars) => translateWith(lang, str, vars);

    const W = doc.internal.pageSize.getWidth();
    const PAGE_PAD = 40;          // left + right margin
    const TABLE_W = W - PAGE_PAD * 2;

    let y = 56;

    // ---- Title bar ----
    doc.setFillColor(15, 23, 42);
    doc.rect(PAGE_PAD, y - 26, TABLE_W, 78, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(19);
    doc.text(`${customer.name}`, W / 2, y + 6, { align: "center" });

    const subtitle = translateFor("LEDGER STATEMENT");
    doc.setFontSize(10);
    doc.setFont(fontFamily, "normal");
    fitFontSize(doc, subtitle, 10, TABLE_W);
    doc.text(subtitle, W / 2, y + 24, { align: "center" });

    const meta = [
        customer.mobile ? `${translateFor("Mobile:")} ${customer.mobile}` : null,
        `${translateFor("Generated:")} ${today()}`
    ].filter(Boolean).join("  |  ");

    doc.setFontSize(9);
    doc.setFont(fontFamily, "normal");
    doc.setTextColor(200, 210, 220);
    doc.text(meta, W / 2, y + 42, { align: "center" });

    y += 92;

    // Shared autoTable defaults — tight padding, no cell overflow
    const SHARED = {
        startY: y,
        theme: "grid",
        tableWidth: TABLE_W,
        margin: { left: PAGE_PAD, right: PAGE_PAD },
        styles: {
            fontSize: 8,
            cellPadding: 4,
            overflow: "ellipsize",
            font: fontFamily
        },
        headStyles: {
            fillColor: [15, 23, 42],
            fontSize: 8,
            fontStyle: "bold",
            cellPadding: 4
        }
    };

    // ---- Summary row ----
    const balance = Number(totals?.netBalance) || 0;
    const balanceText =
        balance > 0
            ? `${rupee(Math.abs(balance))} (${translateFor("due")})`
            : balance < 0
                ? `${rupee(Math.abs(balance))} (${translateFor("overpaid")})`
                : `Rs. 0.00 (${translateFor("clear")})`;

    autoTable(doc, {
        ...SHARED,
        head: [[
            translateFor("TOTAL UDHARI"),
            translateFor("TOTAL PAID"),
            translateFor("NET BALANCE")
        ]],
        body: [[
            rupee(totals?.totalUdhari),
            rupee(totals?.totalCredit),
            balanceText
        ]],
        columnStyles: {
            0: { cellWidth: TABLE_W / 3, halign: "center" },
            1: { cellWidth: TABLE_W / 3, halign: "center" },
            2: { cellWidth: TABLE_W / 3, halign: "center" }
        },
        bodyStyles: {
            fontSize: 10,
            halign: "center",
            textColor: [15, 23, 42],
            fontStyle: "bold",
            cellPadding: 6
        }
    });

    // ---- Udhari Given table ----
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);

    const udhariTitle = translateFor("UDHARI GIVEN");
    fitFontSize(doc, udhariTitle, 11, TABLE_W);
    doc.text(udhariTitle, PAGE_PAD, doc.lastAutoTable.finalY + 28);

    const saleRows = sales.length
        ? sales.map((r) => [
            fmtDate(r.sale_date),
            r.bill_no || "-",
            Number(r.petrol_amount) > 0 ? rupee(r.petrol_amount) : "-",
            Number(r.diesel_amount) > 0 ? rupee(r.diesel_amount) : "-",
            rupee(r.total_amount)
        ])
        : [[translateFor("No udhari records"), "", "", "", ""]];

    autoTable(doc, {
        ...SHARED,
        startY: doc.lastAutoTable.finalY + 38,
        head: [[
            translateFor("Date"),
            translateFor("Bill No"),
            translateFor("Petrol"),
            translateFor("Diesel"),
            translateFor("Total")
        ]],
        body: saleRows,
        foot: sales.length
            ? [[translateFor("Total"), "", "", translateFor("Total Udhari"), rupee(totals?.totalUdhari)]]
            : undefined,
        columnStyles: {
            0: { cellWidth: TABLE_W * 0.20 },
            1: { cellWidth: TABLE_W * 0.15 },
            2: { cellWidth: TABLE_W * 0.22, halign: "right" },
            3: { cellWidth: TABLE_W * 0.22, halign: "right" },
            4: { cellWidth: TABLE_W * 0.21, halign: "right" }
        },
        footStyles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: "bold",
            fontSize: 8
        }
    });

    // ---- Payments Received table ----
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);

    const paymentsTitle = translateFor("PAYMENTS RECEIVED");
    fitFontSize(doc, paymentsTitle, 11, TABLE_W);
    doc.text(paymentsTitle, PAGE_PAD, doc.lastAutoTable.finalY + 28);

    const creditRows = credits.length
        ? credits.map((r) => [
            fmtDate(r.credit_date),
            r.payment_method,
            rupee(r.total_amount)
        ])
        : [[translateFor("No payments received"), "", ""]];

    autoTable(doc, {
        ...SHARED,
        startY: doc.lastAutoTable.finalY + 38,
        head: [[
            translateFor("Date"),
            translateFor("Method"),
            translateFor("Amount")
        ]],
        body: creditRows,
        foot: credits.length
            ? [[translateFor("Total"), translateFor("Total Received"), rupee(totals?.totalCredit)]]
            : undefined,
        columnStyles: {
            0: { cellWidth: TABLE_W * 0.40 },
            1: { cellWidth: TABLE_W * 0.30 },
            2: { cellWidth: TABLE_W * 0.30, halign: "right" }
        },
        footStyles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: "bold",
            fontSize: 8
        }
    });

    // ---- Footer (page number) ----
    const pageCount = doc.getNumberOfPages();
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
            translateFor("Generated by Petrol Pump Management | Page {page} of {count}", {
                page: i,
                count: pageCount
            }),
            W / 2,
            doc.internal.pageSize.getHeight() - 20,
            { align: "center" }
        );
    }

    const fileName =
        `${translateFor("Ledger")}_${String(customer.name).replace(/[^\w]+/g, "_")}.pdf`;

    doc.save(fileName);
}


// ======================================================
// LEDGER DIRECT PRINT
// ======================================================

export function printLedger(statement, lang = getLang()) {

    const { customer, sales = [], credits = [], totals } = statement;

    const isHi = lang === "hi";
    const T = (str, vars) => translateWith(lang, str, vars);

    const balance = Number(totals?.netBalance) || 0;
    const balanceLabel =
        balance > 0 ? T("due") : balance < 0 ? T("overpaid") : T("clear");

    const saleRows = sales.length ? sales.map((r) => `
        <tr>
            <td>${fmtDate(r.sale_date)}</td>
            <td>${r.bill_no || "-"}</td>
            <td class="num">${Number(r.petrol_amount) > 0 ? `Rs. ${fmt(r.petrol_amount)}` : "-"}</td>
            <td class="num">${Number(r.diesel_amount) > 0 ? `Rs. ${fmt(r.diesel_amount)}` : "-"}</td>
            <td class="num strong danger">Rs. ${fmt(r.total_amount)}</td>
        </tr>`).join("")
        : `<tr><td colspan="5" class="empty">${T("No udhari records")}</td></tr>`;

    const creditRows = credits.length ? credits.map((r) => `
        <tr>
            <td>${fmtDate(r.credit_date)}</td>
            <td>${r.payment_method}</td>
            <td class="num strong success">Rs. ${fmt(r.total_amount)}</td>
        </tr>`).join("")
        : `<tr><td colspan="3" class="empty">${T("No payments received")}</td></tr>`;

    const bodyFont = isHi
        ? '"Nirmala UI", "Noto Sans Devanagari", "Mangal", Arial, sans-serif'
        : "Arial, Helvetica, sans-serif";

    const html = `<!DOCTYPE html>
<html lang="${isHi ? "hi" : "en"}">
<head>
<meta charset="utf-8" />
<title>${T("Ledger")} - ${customer.name}</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${bodyFont}; color: #111; padding: 28px; }
    .toolbar { text-align: right; margin-bottom: 14px; }
    .toolbar button {
        padding: 8px 18px; font-size: 13px; font-weight: 600;
        background: #111; color: #fff; border: none; border-radius: 6px; cursor: pointer;
    }
    .toolbar button:hover { background: #333; }
    .head { border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
    .head h1 { font-size: 22px; }
    .head .sub { color: #555; font-size: 12px; margin-top: 4px; }
    .cards { display: flex; gap: 12px; margin-bottom: 22px; }
    .card {
        flex: 1; border: 1px solid #ddd; border-radius: 8px;
        padding: 12px 14px; text-align: center;
    }
    .card .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: .5px; }
    .card .value { font-size: 17px; font-weight: 700; margin-top: 4px; }
    .card.danger .value { color: #b00020; }
    .card.success .value { color: #0a7d33; }
    h2 { font-size: 14px; text-transform: uppercase; margin: 20px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #111; color: #fff; font-size: 11px; text-transform: uppercase; }
    tfoot td { background: #f1f5f9; font-weight: 700; }
    .num { text-align: right; }
    .strong { font-weight: 700; }
    .danger { color: #b00020; }
    .success { color: #0a7d33; }
    .empty { text-align: center; color: #888; }
    .foot { margin-top: 24px; font-size: 10px; color: #888; text-align: center; }
    @media print {
        .toolbar { display: none; }
        body { padding: 0; }
    }
</style>
</head>
<body>
    <div class="toolbar">
        <button onclick="window.print()">${T("Print this page")}</button>
    </div>

    <div class="head">
        <h1>${customer.name}</h1>
        <div class="sub">
            ${T("LEDGER STATEMENT")} |
            ${customer.mobile ? ` ${T("Mobile:")} ${customer.mobile} |` : ""}
            ${T("Generated:")} ${today()}
        </div>
    </div>

    <div class="cards">
        <div class="card danger">
            <div class="label">${T("Total Udhari")}</div>
            <div class="value">Rs. ${fmt(totals?.totalUdhari)}</div>
        </div>
        <div class="card success">
            <div class="label">${T("Total Paid")}</div>
            <div class="value">Rs. ${fmt(totals?.totalCredit)}</div>
        </div>
        <div class="card ${balance > 0 ? "danger" : "success"}">
            <div class="label">${T("Net Balance")} (${balanceLabel})</div>
            <div class="value">Rs. ${fmt(Math.abs(balance))}</div>
        </div>
    </div>

    <h2>${T("UDHARI GIVEN")}</h2>
    <table>
        <thead>
            <tr><th>${T("Date")}</th><th>${T("Bill No")}</th><th class="num">${T("Petrol")}</th><th class="num">${T("Diesel")}</th><th class="num">${T("Total")}</th></tr>
        </thead>
        <tbody>${saleRows}</tbody>
        ${sales.length ? `<tfoot><tr><td colspan="4">${T("Total Udhari")}</td><td class="num danger">Rs. ${fmt(totals?.totalUdhari)}</td></tr></tfoot>` : ""}
    </table>

    <h2>${T("PAYMENTS RECEIVED")}</h2>
    <table>
        <thead>
            <tr><th>${T("Date")}</th><th>${T("Method")}</th><th class="num">${T("Amount")}</th></tr>
        </thead>
        <tbody>${creditRows}</tbody>
        ${credits.length ? `<tfoot><tr><td colspan="2">${T("Total Received")}</td><td class="num success">Rs. ${fmt(totals?.totalCredit)}</td></tr></tfoot>` : ""}
    </table>

    <div class="foot">${T("Generated by Petrol Pump Management - {when}", { when: today() })}</div>

    <script>window.onload = function () { window.print(); };<\/script>
</body>
</html>`;

    // Print inside a hidden iframe
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.appendChild(frame);

    const win = frame.contentWindow;
    frame.onload = () => {
        if (win) { win.focus(); win.print(); }
    };
    frame.srcdoc = html;
}