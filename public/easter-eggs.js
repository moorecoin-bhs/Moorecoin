// Moorecoin Easter Eggs — harmless, fun, and opt-in via little secrets :)
// No coins are granted; purely visual/audio-free flair respecting reduced motion.
(function () {
  const STATE = {
    konamiIdx: 0,
    typed: '',
    logoClicks: [],
    retroEnabled: false,
  };

  const KONAMI = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'
  ];

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function injectStyles() {
    if (document.getElementById('egg-styles')) return;
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
    `;
    const style = document.createElement('style');
    style.id = 'egg-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showToast(msg, ms = 2400) {
    injectStyles();
    const el = document.createElement('div');
    el.className = 'egg-toast';
    el.role = 'status';
    el.innerHTML = msg;
    document.body.appendChild(el);
    // animate in next frame
    requestAnimationFrame(() => el.classList.add('show'));
    const t = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 220);
      clearTimeout(t);
    }, ms);
    return el;
  }

  function coinEmoji() {
    // rotate through a few for variety
    const options = ['🪙', '🟡', '💰', '✨'];
    return options[Math.floor(Math.random() * options.length)];
  }

  function launchCoinConfetti(durationMs = 2200, count = 80) {
    if (prefersReducedMotion()) {
      showToast('Hidden unlocked: Konami Mode');
      return;
    }
    injectStyles();
    const wrap = document.createElement('div');
    wrap.className = 'egg-confetti';
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'piece';
      span.textContent = coinEmoji();
      const startLeft = Math.random() * 100; // vw
      const delay = Math.random() * 0.8; // s
      const fall = 2 + Math.random() * 1.5; // s
      const size = 16 + Math.random() * 18; // px
      span.style.left = startLeft + 'vw';
      span.style.fontSize = size + 'px';
      span.style.animation = `egg-fall ${fall}s ease-in ${delay}s 1 both`;
      wrap.appendChild(span);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), durationMs + 2000);
  }

  function toggleRetro(on) {
    injectStyles();
    const enable = on !== undefined ? on : !document.body.classList.contains('egg-retro');
    document.body.classList.toggle('egg-retro', enable);
    try { localStorage.setItem('egg-retro', enable ? '1' : '0'); } catch {}
    showToast(enable ? 'Retro Mode: ON' : 'Retro Mode: OFF');
  }

  function initRetroFromStorage() {
    try { STATE.retroEnabled = localStorage.getItem('egg-retro') === '1'; } catch { STATE.retroEnabled = false; }
    if (STATE.retroEnabled) toggleRetro(true);
  }

  function isTypingInForm() {
    const ae = document.activeElement;
    if (!ae) return false;
    const tag = ae.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || ae.isContentEditable;
  }

  function handleKeydown(e) {
    // Konami detection
    const key = e.key;
    if (KONAMI[STATE.konamiIdx] === key) {
      STATE.konamiIdx++;
      if (STATE.konamiIdx === KONAMI.length) {
        STATE.konamiIdx = 0;
        launchCoinConfetti();
        showToast('Konami! Coin rain achieved. Press Shift+R for Retro Mode.');
      }
    } else {
      // reset if mismatch, but allow repeat start if key was ArrowUp
      STATE.konamiIdx = (key === 'ArrowUp') ? 1 : 0;
    }

    // Retro hotkey
    if ((e.shiftKey && (key === 'R' || key === 'r')) && !isTypingInForm()) {
      toggleRetro();
      return;
    }

    // Hidden phrases when not typing in inputs
    if (isTypingInForm()) return;
    if (key.length === 1) {
      STATE.typed += key.toLowerCase();
      if (STATE.typed.length > 24) STATE.typed = STATE.typed.slice(-24);
      if (STATE.typed.includes('moore')) {
        const facts = [
          'Moore lesson: Compound patience > quick wins.',
          'Moore tip: Own assets, not excuses.',
          'Moorecoin mantra: Small moves, big outcomes.'
        ];
        showToast(facts[Math.floor(Math.random() * facts.length)]);
        STATE.typed = '';
      } else if (STATE.typed.includes('credits')) {
        showToast('Built with curiosity. Peek the code on <a href="https://github.com/moorecoin-bhs/Moorecoin" target="_blank" rel="noopener">GitHub</a>.');
        STATE.typed = '';
      } else if (STATE.typed.includes('stonks')) {
        showToast('Stonks? Risk managed is opportunity unlocked.');
        STATE.typed = '';
      } else if (STATE.typed.includes('retro')) {
        toggleRetro(true);
        STATE.typed = '';
      }
    }
  }

  function initLogoClicks() {
    // Try common logo selectors
    const logo = document.getElementById('logo') || document.querySelector('img[src*="favicon"]');
    if (!logo) return;
    logo.addEventListener('click', () => {
      const now = Date.now();
      STATE.logoClicks = STATE.logoClicks.filter(t => now - t < 1500);
      STATE.logoClicks.push(now);
      if (STATE.logoClicks.length >= 5) {
        STATE.logoClicks.length = 0;
        logo.classList.remove('egg-logo-spin');
        // restart animation by forcing reflow
        void logo.offsetWidth; 
        logo.classList.add('egg-logo-spin');
        showToast('You found the spinner! ✨');
      }
    });
  }

  function init404Secret() {
    if (!/404\.html(?=$|\?|#)/.test(location.pathname)) return;
    const h1 = document.querySelector('h1');
    if (!h1) return;
    let taps = [];
    h1.style.cursor = 'pointer';
    h1.title = '…';
    h1.addEventListener('click', () => {
      const now = Date.now();
      taps = taps.filter(t => now - t < 1200);
      taps.push(now);
      if (taps.length >= 3) {
        taps.length = 0;
        launchCoinConfetti(2000, 60);
        showToast('Secret portal opening…');
        setTimeout(() => { window.location.href = './index.html'; }, 1400);
      }
    });
  }

  function init() {
    injectStyles();
    initRetroFromStorage();
    initLogoClicks();
    init404Secret();
    window.addEventListener('keydown', handleKeydown, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
