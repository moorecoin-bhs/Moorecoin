// Site-wide banner module
// Reads /config/banner from Firestore and renders a dismissible top banner.
// Document shape:
// {
//   message: string,
//   linkUrl?: string,
//   variant?: 'info'|'success'|'warning'|'danger'|'promo',
//   active?: boolean,
//   dismissible?: boolean,
//   version?: number,      // bump to re-show for everyone
//   updatedAt?: timestamp,
//   updatedBy?: { uid, name, email }
// }

import { app } from "./app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const BANNER_DOC_PATH = ["config", "banner"]; // collection/doc segments
const LS_KEY = (v) => `moorecoin_banner_dismiss_v${v || 0}`;

function ensureStyles() {
  if (document.getElementById("mc-banner-styles")) return;
  const style = document.createElement("style");
  style.id = "mc-banner-styles";
  style.textContent = `
  .site-banner{position:sticky;top:0;width:100%;z-index:1200;box-sizing:border-box}
  .site-banner-inner{display:flex;gap:10px;align-items:center;justify-content:center;padding:10px 16px;border-bottom:1px solid transparent;font-weight:600;letter-spacing:.2px}
  .site-banner a{color:inherit;text-decoration:underline}
  .site-banner .banner-close{margin-left:auto;appearance:none;border:0;background:transparent;color:inherit;opacity:.8;cursor:pointer;font-weight:700;font-size:16px;line-height:1;padding:4px 6px;border-radius:6px}
  .site-banner .banner-close:hover{opacity:1;background:rgba(0,0,0,.08)}

  /* Variants */
  .banner-info{background:#22324a;color:#d8e6ff;border-color:#2a3b56}
  .banner-success{background:#153b2b;color:#bff3df;border-color:#194734}
  .banner-warning{background:#3b2f15;color:#ffe3b8;border-color:#4a3a19}
  .banner-danger{background:#3b1b1b;color:#ffd5d5;border-color:#4a2222}
  .banner-promo{background:#241d3b;color:#e5d9ff;border-color:#2b2247}
  `;
  document.head.appendChild(style);
}

function renderBanner(data) {
  if (!data || data.active === false) return removeBanner();
  const message = (data.message || "").trim();
  if (!message) return removeBanner();
  const version = typeof data.version === "number" ? data.version : 1;
  const dismissible = data.dismissible !== false; // default true
  if (dismissible && localStorage.getItem(LS_KEY(version)))
    return removeBanner();

  ensureStyles();
  const id = "site-banner";
  let root = document.getElementById(id);
  if (!root) {
    root = document.createElement("div");
    root.id = id;
    root.className = "site-banner";
    // Insert as first child for sticky to sit at top
    document.body.prepend(root);
  }
  const variant = (data.variant || "promo").toLowerCase();
  root.className = `site-banner banner-${variant}`;
  const inner = document.createElement("div");
  inner.className = "site-banner-inner";
  const span = document.createElement("span");
  span.textContent = message;
  if (data.linkUrl) {
    const a = document.createElement("a");
    a.href = data.linkUrl;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.marginLeft = "8px";
    a.textContent = "Learn more";
    span.append(" ");
    span.append(a);
  }
  inner.append(span);
  if (dismissible) {
    const btn = document.createElement("button");
    btn.className = "banner-close";
    btn.setAttribute("aria-label", "Dismiss banner");
    btn.textContent = "×";
    btn.addEventListener("click", () => {
      try {
        localStorage.setItem(LS_KEY(version), String(Date.now()));
      } catch {}
      removeBanner();
    });
    inner.append(btn);
  }
  root.replaceChildren(inner);
}

function removeBanner() {
  const el = document.getElementById("site-banner");
  if (el) el.remove();
}

function main() {
  try {
    const db = getFirestore(app);
    const ref = doc(db, ...BANNER_DOC_PATH);
    // Live updates for instant admin edits
    onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) renderBanner(snap.data());
        else removeBanner();
      },
      (err) => {
        console.warn("Banner snapshot failed", err);
      },
    );
  } catch (e) {
    console.warn("Banner init error", e);
  }
}

// Defer until DOM ready so we can prepend safely
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
