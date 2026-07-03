/* Cinematic background scene.
   Builds a static DOM once (grid, chart, candle fields, orbit rings, HUD
   arcs, glass panels, ribbons, crosshair, and a 7-layer dimensional logo),
   then only ever writes three CSS custom properties from rAF-throttled
   scroll/pointer listeners: --scroll-progress, --pointer-x, --pointer-y.
   No canvas, no per-frame DOM creation, no layout thrash. */
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const root = document.documentElement;

  const world = document.createElement("div");
  world.className = "atmosphere";
  world.setAttribute("aria-hidden", "true");
  world.innerHTML = `
    <div class="atmo-grid"></div>
    <div class="atmo-vignette"></div>
    <div class="candle-field candle-field--far"></div>
    <div class="axis-ticks"></div>
    <svg class="atmo-chart" viewBox="0 0 1440 900" preserveAspectRatio="none">
      <line class="marker" x1="0" y1="360" x2="1440" y2="360" />
      <line class="marker" x1="0" y1="560" x2="1440" y2="560" />
      <path class="line-a" d="M0 585 C90 530 145 545 220 492 S360 415 455 448 S610 520 700 436 S835 306 942 342 S1080 465 1180 385 S1330 220 1440 260" />
      <path class="line-b" d="M0 690 C120 630 190 668 280 602 S440 518 545 550 S705 630 810 560 S952 438 1044 480 S1195 598 1290 525 S1390 430 1440 450" />
      <circle class="price-dot" cx="1440" cy="260" r="3.5" />
    </svg>
    <div class="candle-field candle-field--near"></div>
    <div class="scene">
      <div class="orbit-ring orbit-ring--a"></div>
      <div class="orbit-ring orbit-ring--b"></div>
      <svg class="hud-arcs" viewBox="0 0 200 200">
        <path class="arc-a" d="M170 100 A70 70 0 0 1 100 170" />
        <path class="arc-b" d="M30 100 A70 70 0 0 1 62 40" />
      </svg>
      <div class="panel panel--a"></div>
      <div class="panel panel--b"></div>
      <div class="panel panel--c"></div>
      <div class="ribbon ribbon--a"></div>
      <div class="ribbon ribbon--b"></div>
      <div class="logo-scene">
        <span class="logo-bloom"></span>
        <span class="logo-shadow"></span>
        <span class="logo-mark"></span>
        <span class="logo-ao"></span>
        <span class="logo-rim"></span>
        <span class="logo-sheen"></span>
        <span class="logo-specular"></span>
      </div>
      <div class="crosshair"><i class="crosshair__h"></i><i class="crosshair__v"></i></div>
    </div>
  `;
  document.body.prepend(world);

  // one-time DOM setup below — all static, nothing built per frame

  const farCandles = world.querySelector(".candle-field--far");
  const farSet = [
    26, 40, 18, 52, 30, 44, 22, 58, 34, 20, 46, 28, 50, 24, 38, 16,
    42, 30, 54, 20, 36, 48, 26, 44, 32, 22, 40, 28
  ];
  farSet.forEach((body, i) => {
    const c = document.createElement("i");
    c.style.setProperty("--body", `${body}px`);
    c.style.setProperty("--wick", `${Math.round(body * 0.4)}px`);
    c.style.setProperty("--tone", i % 5 === 0 ? "var(--rose)" : "var(--cyan)");
    farCandles.appendChild(c);
  });

  const nearCandles = world.querySelector(".candle-field--near");
  const nearSet = [34, 58, 40, 72, 46, 64, 30, 80, 52, 38, 66, 44, 56, 70];
  nearSet.forEach((body, i) => {
    const c = document.createElement("i");
    c.style.setProperty("--body", `${body}px`);
    c.style.setProperty("--wick", `${Math.round(body * 0.35)}px`);
    c.style.setProperty("--tone", i % 4 === 0 ? "var(--rose)" : "var(--lime)");
    nearCandles.appendChild(c);
  });

  const axis = world.querySelector(".axis-ticks");
  ["68,240", "67,910", "67,585", "67,260", "66,935", "66,610"].forEach((label) => {
    const t = document.createElement("span");
    t.textContent = label;
    axis.appendChild(t);
  });

  let scrollRaf = 0;
  function applyScroll() {
    scrollRaf = 0;
    // Use full-page progress. The old version reached 1 after ~one viewport,
    // which made the whole background scene fade away after a couple scrolls.
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    root.style.setProperty("--scroll-progress", progress.toFixed(4));
  }
  function scheduleScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(applyScroll);
  }

  window.addEventListener("scroll", scheduleScroll, { passive: true });
  window.addEventListener("resize", scheduleScroll, { passive: true });

  if (!reducedMotion && finePointer) {
    let px = 0;
    let py = 0;
    let pointerRaf = 0;
    window.addEventListener("pointermove", (event) => {
      px = event.clientX / window.innerWidth - 0.5;
      py = event.clientY / window.innerHeight - 0.5;
      if (pointerRaf) return;
      pointerRaf = requestAnimationFrame(() => {
        pointerRaf = 0;
        root.style.setProperty("--pointer-x", (px * 2).toFixed(3));
        root.style.setProperty("--pointer-y", (py * 2).toFixed(3));
      });
    }, { passive: true });
  }

  applyScroll();
})();
