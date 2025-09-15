// Moorecoin Easter Eggs — harmless, fun, and opt-in via little secrets :)
// No coins are granted; purely visual/audio-free flair respecting reduced motion.
(function () {
  const STATE = {
    konamiIdx: 0,
    typed: "",
    logoClicks: [],
    retroEnabled: false,
  };

  const KONAMI = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function injectStyles() {
    if (document.getElementById("egg-styles")) return;
    const css = `
      @keyframes egg-fall { to { transform: translateY(110vh) rotate(360deg); opacity: .95; } }
      @keyframes egg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .egg-confetti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 2147483000; }
      .egg-confetti .piece { position: absolute; top: -10vh; will-change: transform, opacity; user-select: none; filter: drop-shadow(0 3px 1px rgba(0,0,0,.25)); }
      .egg-toast { position: fixed; right: 16px; bottom: 16px; max-width: 300px; background: rgba(23,26,31,.96); color: #eaf1ff; border: 1px solid #2f3640; padding: 10px 12px; border-radius: 10px; font: 600 13px/1.35 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; z-index: 2147483600; opacity: 0; transform: translateY(6px); transition: opacity .16s ease, transform .16s ease; box-shadow: 0 10px 30px -10px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04) inset; }
      .egg-toast.show { opacity: 1; transform: translateY(0); }
      .egg-toast a { color: #8db6ff; text-decoration: none; }
      .egg-toast a:hover { text-decoration: underline; }
      .egg-logo-spin { animation: egg-spin .9s linear 1; }
      body.egg-retro { background: radial-gradient(1200px 700px at 10% 10%, #fff0e0, #141414 65%); filter: saturate(1.2) contrast(1.05); }
      body.egg-retro * { image-rendering: pixelated; }
      body.egg-retro h1, body.egg-retro h2, body.egg-retro h3 { text-shadow: 0 2px 0 rgba(0,0,0,.25), 0 0 12px rgba(255,145,77,.25); letter-spacing: .5px; }

      /* Mono mode */
      body.egg-mono { filter: grayscale(1) contrast(1.05); }
      body.egg-mono h1, body.egg-mono h2 { text-shadow: 0 0 0 transparent; }

      /* Disco overlay */
      @keyframes egg-disco { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes egg-strobe { 0%, 82% { opacity: .52; } 88% { opacity: .32; } 100% { opacity: .52; } }
      .egg-disco-overlay {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2147482800;
        opacity: .52; /* was .25 */
        mix-blend-mode: hard-light; /* was overlay */
        background: linear-gradient(60deg, #ff914d, #ff60a8, #3a86ff, #43e97b, #ffe53b, #ff914d);
        background-size: 600% 600%; /* was 400% */
        animation: egg-disco 4.5s cubic-bezier(.4,0,.2,1) infinite, egg-strobe 1.75s ease-in-out infinite; /* was 8s single anim */
        filter: saturate(1.35) contrast(1.18);
        will-change: background-position, opacity, transform;
      }
      @media (prefers-reduced-motion: reduce) {
        .egg-disco-overlay { animation: none; background: linear-gradient(60deg, #ff914d, #3a86ff); opacity: .28; mix-blend-mode: overlay; filter: none; }
      }

      /* Pulses */
      @keyframes egg-pulse { 0%{transform:scale(1); filter:brightness(1);} 50%{transform:scale(1.08); filter:brightness(1.25);} 100%{transform:scale(1); filter:brightness(1);} }
      .egg-pulse { animation: egg-pulse .6s ease; }

      /* Center sheet */
      .egg-sheet { position: fixed; inset: 0; display: grid; place-items: center; z-index: 2147483400; pointer-events: none; }
      .egg-sheet .card { pointer-events: auto; background: rgba(20,22,26,.98); color: #e6edf7; border: 1px solid #2a323b; border-radius: 12px; padding: 14px 16px; box-shadow: 0 18px 50px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04) inset; min-width: 260px; max-width: min(92vw, 420px); }
      .egg-sheet .card h3 { margin: 0 0 8px; font-size: 1rem; }
      .egg-sheet .card p { margin: 0; font-size: .88rem; opacity: .9; }
    `;
    const style = document.createElement("style");
    style.id = "egg-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showToast(msg, ms = 2400) {
    injectStyles();
    const el = document.createElement("div");
    el.className = "egg-toast";
    el.role = "status";
    el.innerHTML = msg;
    document.body.appendChild(el);
    // animate in next frame
    requestAnimationFrame(() => el.classList.add("show"));
    const t = setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 220);
      clearTimeout(t);
    }, ms);
    return el;
  }

  function coinEmoji() {
    const options = ["🪙", "🟡", "💰", "✨"];
    return options[Math.floor(Math.random() * options.length)];
  }

  function launchEmojiConfetti({ symbols, durationMs = 2200, count = 80 }) {
    if (prefersReducedMotion()) {
      showToast("Secret unlocked");
      return;
    }
    injectStyles();
    const wrap = document.createElement("div");
    wrap.className = "egg-confetti";
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.className = "piece";
      const pick = Array.isArray(symbols)
        ? symbols[Math.floor(Math.random() * symbols.length)]
        : (symbols?.() ?? "✨");
      span.textContent = pick;
      const startLeft = Math.random() * 100; // vw
      const delay = Math.random() * 0.8; // s
      const fall = 2 + Math.random() * 1.5; // s
      const size = 16 + Math.random() * 18; // px
      span.style.left = startLeft + "vw";
      span.style.fontSize = size + "px";
      span.style.animation = `egg-fall ${fall}s ease-in ${delay}s 1 both`;
      wrap.appendChild(span);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), durationMs + 2000);
  }

  function launchCoinConfetti(durationMs = 2200, count = 80) {
    launchEmojiConfetti({ symbols: coinEmoji, durationMs, count });
  }

  function toggleRetro(on) {
    injectStyles();
    const enable =
      on !== undefined ? on : !document.body.classList.contains("egg-retro");
    document.body.classList.toggle("egg-retro", enable);
    try {
      localStorage.setItem("egg-retro", enable ? "1" : "0");
    } catch {}
    showToast(enable ? "Retro Mode: ON" : "Retro Mode: OFF");
  }

  function initRetroFromStorage() {
    try {
      STATE.retroEnabled = localStorage.getItem("egg-retro") === "1";
    } catch {
      STATE.retroEnabled = false;
    }
    if (STATE.retroEnabled) toggleRetro(true);
  }

  function isTypingInForm() {
    const ae = document.activeElement;
    if (!ae) return false;
    const tag = ae.tagName?.toLowerCase();
    return tag === "input" || tag === "textarea" || ae.isContentEditable;
  }

  function ensureDiscoOverlay() {
    let el = document.querySelector(".egg-disco-overlay");
    if (!el) {
      el = document.createElement("div");
      el.className = "egg-disco-overlay";
      document.body.appendChild(el);
    }
    return el;
  }

  function toggleMono(on) {
    injectStyles();
    const enable =
      on !== undefined ? on : !document.body.classList.contains("egg-mono");
    document.body.classList.toggle("egg-mono", enable);
    showToast(enable ? "Monochrome: ON" : "Monochrome: OFF");
  }

  function toggleDisco(on) {
    injectStyles();
    const overlay = ensureDiscoOverlay();
    const enable =
      on !== undefined
        ? on
        : overlay.style.display === "none" || overlay.dataset.active !== "1";
    overlay.style.display = enable ? "block" : "none";
    overlay.dataset.active = enable ? "1" : "0";
    showToast(enable ? "Disco Mode: ON" : "Disco Mode: OFF");
  }

  function handleKeydown(e) {
    // Konami detection
    const key = e.key;
    if (KONAMI[STATE.konamiIdx] === key) {
      STATE.konamiIdx++;
      if (STATE.konamiIdx === KONAMI.length) {
        STATE.konamiIdx = 0;
        launchCoinConfetti();
        showToast("Konami! Coin rain achieved. Press Shift+R for Retro Mode.");
      }
    } else {
      // reset if mismatch, but allow repeat start if key was ArrowUp
      STATE.konamiIdx = key === "ArrowUp" ? 1 : 0;
    }

    // Retro hotkey
    if (e.shiftKey && (key === "R" || key === "r") && !isTypingInForm()) {
      toggleRetro();
      return;
    }

    // Mono hotkey
    if (e.shiftKey && (key === "M" || key === "m") && !isTypingInForm()) {
      toggleMono();
      return;
    }

    // Disco hotkey
    if (e.shiftKey && (key === "D" || key === "d") && !isTypingInForm()) {
      toggleDisco();
      return;
    }

    // Hidden phrases when not typing in inputs
    if (isTypingInForm()) return;
    if (key.length === 1) {
      STATE.typed += key.toLowerCase();
      if (STATE.typed.length > 24) STATE.typed = STATE.typed.slice(-24);
      if (STATE.typed.includes("moore")) {
        const facts = [
          "Moore lesson: Compound patience > quick wins.",
          "Moore tip: Own assets, not excuses.",
          "Moorecoin mantra: Small moves, big outcomes.",
        ];
        showToast(facts[Math.floor(Math.random() * facts.length)]);
        STATE.typed = "";
      } else if (STATE.typed.includes("credits")) {
        showToast(
          'Built with curiosity. Peek the code on <a href="https://github.com/moorecoin-bhs/Moorecoin" target="_blank" rel="noopener">GitHub</a>.',
        );
        STATE.typed = "";
      } else if (STATE.typed.includes("stonks")) {
        showToast("Stonks? Risk managed is opportunity unlocked.");
        STATE.typed = "";
      } else if (STATE.typed.includes("retro")) {
        toggleRetro(true);
        STATE.typed = "";
      } else if (STATE.typed.includes("mono")) {
        toggleMono(true);
        STATE.typed = "";
      } else if (STATE.typed.includes("party")) {
        toggleDisco(true);
        STATE.typed = "";
      } else if (STATE.typed.includes("bunny")) {
        showToast(
          "(\u00A0\u2022\u0308\u00A0\u00A0\u2022\u0308\u00A0)\u30CE  \u2514(\u00A0\u30FB\u25E1\u30FB)\u2518  \u273F",
        );
        STATE.typed = "";
      } else if (STATE.typed.includes("idkfa")) {
        showToast("God Mode? Not here—only Discipline Mode.");
        STATE.typed = "";
      } else if (STATE.typed.includes("snow")) {
        launchEmojiConfetti({
          symbols: ["❄️", "✨", "❅", "❆"],
          count: 90,
          durationMs: 2600,
        });
        STATE.typed = "";
      }
    }
  }

  function initLogoClicks() {
    // Try common logo selectors
    const logo =
      document.getElementById("logo") ||
      document.querySelector('img[src*="favicon"]');
    if (!logo) return;
    logo.addEventListener("click", () => {
      const now = Date.now();
      STATE.logoClicks = STATE.logoClicks.filter((t) => now - t < 1500);
      STATE.logoClicks.push(now);
      if (STATE.logoClicks.length >= 5) {
        STATE.logoClicks.length = 0;
        logo.classList.remove("egg-logo-spin");
        // restart animation by forcing reflow
        void logo.offsetWidth;
        logo.classList.add("egg-logo-spin");
        showToast("You found the spinner! ✨");
      }
    });
  }

  function init404Secret() {
    if (!/404\.html(?=$|\?|#)/.test(location.pathname)) return;
    const h1 = document.querySelector("h1");
    if (!h1) return;
    let taps = [];
    h1.style.cursor = "pointer";
    h1.title = "…";
    h1.addEventListener("click", () => {
      const now = Date.now();
      taps = taps.filter((t) => now - t < 1200);
      taps.push(now);
      if (taps.length >= 3) {
        taps.length = 0;
        launchCoinConfetti(2000, 60);
        showToast("Secret portal opening…");
        setTimeout(() => {
          window.location.href = "./index.html";
        }, 1400);
      }
    });
  }

  function initLongPressHints() {
    // Long press the exchange rate area to see a nerd tip
    const rateWrap = document.getElementById("moorecoin-value");
    if (!rateWrap) return;
    let timer = null;
    function start() {
      clear();
      timer = setTimeout(() => {
        showToast(
          "Hint: As total supply grows, exchange rate decays (exp curve).",
        );
      }, 1200);
    }
    function clear() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
    rateWrap.addEventListener("mouseenter", start);
    rateWrap.addEventListener("mouseleave", clear);
    rateWrap.addEventListener("touchstart", start, { passive: true });
    rateWrap.addEventListener("touchend", clear);
    rateWrap.addEventListener("touchcancel", clear);
  }

  function initBalancePulse() {
    const mc = document.getElementById("moorecoins");
    if (!mc) return;
    let clicks = [];
    mc.style.cursor = "pointer";
    mc.title = " "; // subtle hint
    mc.addEventListener("click", () => {
      const now = Date.now();
      clicks = clicks.filter((t) => now - t < 1000);
      clicks.push(now);
      if (clicks.length >= 3) {
        clicks.length = 0;
        mc.classList.remove("egg-pulse");
        void mc.offsetWidth;
        mc.classList.add("egg-pulse");
        const tips = [
          "Tip: Exchange coins for EC, or try a bond for a set ROI.",
          "Pro tip: Keep reserves before you roll the dice.",
          "Hint: Bonds auto-credit at maturity—no manual claim needed.",
        ];
        showToast(tips[Math.floor(Math.random() * tips.length)]);
      }
    });
  }

  function initFooterCredits() {
    const foot = document.getElementById("footer-content");
    if (!foot) return;
    let last = 0;
    foot.addEventListener("dblclick", () => {
      // Prevent spam
      const now = Date.now();
      if (now - last < 600) return;
      last = now;
      injectStyles();
      const sheet = document.createElement("div");
      sheet.className = "egg-sheet";
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML =
        "<h3>Moorecoin Credits</h3><p>Made with curiosity by the Moorecoin team. Stay disciplined, compound often.</p>";
      sheet.appendChild(card);
      document.body.appendChild(sheet);
      function close() {
        sheet.remove();
        document.removeEventListener("keydown", onKey, true);
      }
      function onKey(e) {
        if (e.key === "Escape") close();
      }
      sheet.addEventListener("click", close);
      document.addEventListener("keydown", onKey, true);
      setTimeout(() => {
        card.focus?.();
      }, 10);
      setTimeout(() => {
        try {
          sheet.remove();
        } catch {}
      }, 8000); // auto-dismiss
    });
  }

  function init() {
    injectStyles();
    initRetroFromStorage();
    initLogoClicks();
    init404Secret();
    initLongPressHints();
    initBalancePulse();
    initFooterCredits();
    window.addEventListener("keydown", handleKeydown, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
