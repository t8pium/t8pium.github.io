(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  const world = document.createElement("div");
  world.className = "logo-ink-world";
  world.setAttribute("aria-hidden", "true");
  world.innerHTML = `
    <div class="market-line">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path class="line-main" d="M0 585 C90 530 145 545 220 492 S360 415 455 448 S610 520 700 436 S835 306 942 342 S1080 465 1180 385 S1330 220 1440 260" />
        <path class="line-red" d="M0 690 C120 630 190 668 280 602 S440 518 545 550 S705 630 810 560 S952 438 1044 480 S1195 598 1290 525 S1390 430 1440 450" />
      </svg>
    </div>
    <div class="candles" aria-hidden="true"></div>
    <div class="logo-scene">
      <span class="logo-glow"></span>
      <span class="logo-core"></span>
      <span class="logo-face"></span>
    </div>
    <div class="ink-spill" aria-hidden="true"></div>
    <span class="ink-pool"></span>
  `;
  document.body.prepend(world);

  const scene = world.querySelector(".logo-scene");
  const depthCount = 16;
  for (let i = depthCount; i >= 1; i -= 1) {
    const layer = document.createElement("span");
    layer.className = "logo-depth";
    layer.style.setProperty("--d", `${i * 1.15}px`);
    layer.style.setProperty("--a", `${Math.max(0.08, 0.62 - i * 0.027)}`);
    scene.prepend(layer);
  }

  const candles = world.querySelector(".candles");
  const candleSet = [
    [44, 24, 18, "#26a69a"], [82, 34, 28, "#ef5350"], [55, 42, 20, "#26a69a"],
    [118, 28, 46, "#26a69a"], [64, 64, 32, "#ef5350"], [92, 35, 25, "#26a69a"],
    [38, 26, 34, "#ef5350"], [140, 46, 56, "#26a69a"], [78, 34, 62, "#26a69a"],
    [104, 52, 40, "#ef5350"], [58, 38, 44, "#26a69a"], [126, 26, 68, "#26a69a"],
    [72, 46, 30, "#ef5350"], [96, 60, 42, "#ef5350"], [48, 28, 22, "#26a69a"],
    [132, 36, 72, "#26a69a"], [68, 52, 36, "#ef5350"], [90, 28, 58, "#26a69a"]
  ];
  candleSet.forEach(([body, wickTop, wickBottom, color], index) => {
    const candle = document.createElement("i");
    candle.style.setProperty("--body", `${body}px`);
    candle.style.setProperty("--wick-top", `${wickTop}px`);
    candle.style.setProperty("--wick-bottom", `${wickBottom}px`);
    candle.style.setProperty("--candle", color);
    candle.style.transform = `translateY(${Math.sin(index * 1.7) * 54}px)`;
    candles.appendChild(candle);
  });

  const spill = world.querySelector(".ink-spill");
  const dripSet = [
    [12, 18, 260, -8, 44], [22, 34, 440, 5, 32], [31, 11, 310, -3, 52], [43, 42, 560, 7, 26],
    [50, 22, 390, -6, 40], [58, 15, 650, 4, 58], [68, 30, 510, -9, 35], [77, 13, 300, 6, 48], [88, 25, 470, -4, 28]
  ];
  dripSet.forEach(([x, w, h, skew, drop]) => {
    const drip = document.createElement("i");
    drip.style.setProperty("--x", `${x}%`);
    drip.style.setProperty("--w", `${w}px`);
    drip.style.setProperty("--h", `${h}px`);
    drip.style.setProperty("--skew", `${skew}deg`);
    drip.style.setProperty("--drop", `${drop}px`);
    spill.appendChild(drip);
  });

  let raf = 0;
  let px = 0;
  let py = 0;

  function updateScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const raw = Math.min(1, Math.max(0, window.scrollY / max));
    const progress = Math.pow(raw, 0.72);
    root.style.setProperty("--ink-progress", progress.toFixed(4));
  }

  function scheduleScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      updateScroll();
    });
  }

  window.addEventListener("scroll", scheduleScroll, { passive: true });
  window.addEventListener("resize", scheduleScroll, { passive: true });

  if (!reduced) {
    let pointerRaf = 0;
    window.addEventListener("pointermove", (event) => {
      px = event.clientX - window.innerWidth / 2;
      py = event.clientY - window.innerHeight / 2;
      if (pointerRaf) return;
      pointerRaf = requestAnimationFrame(() => {
        pointerRaf = 0;
        root.style.setProperty("--pointer-x", (px / 18).toFixed(2));
        root.style.setProperty("--pointer-y", (py / 18).toFixed(2));
      });
    }, { passive: true });
  }

  updateScroll();
})();
