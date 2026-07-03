(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  const world = document.createElement("div");
  world.className = "logo-ink-world";
  world.setAttribute("aria-hidden", "true");
  world.innerHTML = `
    <canvas class="ink-canvas"></canvas>
    <div class="logo-scene">
      <div class="logo-stack">
        <span class="logo-black-core"></span>
      </div>
      <span class="logo-face"></span>
      <span class="ink-lip"></span>
    </div>
    <span class="ink-fog"></span>
  `;
  document.body.prepend(world);

  const stack = world.querySelector(".logo-stack");
  const layers = 34;
  for (let i = layers; i >= 1; i -= 1) {
    const layer = document.createElement("span");
    layer.className = "logo-depth";
    const depth = -i * 4.2;
    const shift = i * 0.74;
    layer.style.setProperty("--depth-z", `${depth}px`);
    layer.style.setProperty("--shift-x", `${shift}px`);
    layer.style.setProperty("--shift-y", `${shift * 1.28}px`);
    layer.style.setProperty("--layer-alpha", `${Math.max(0.06, 0.74 - i * 0.018)}`);
    layer.style.setProperty("--layer-brightness", `${Math.max(0.42, 1.02 - i * 0.014)}`);
    stack.appendChild(layer);
  }

  const canvas = world.querySelector(".ink-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const drops = Array.from({ length: 34 }, (_, i) => {
    let x = Math.sin(i * 999.13) * 10000;
    const r1 = x - Math.floor(x);
    x = Math.sin((i + 9) * 731.31) * 10000;
    const r2 = x - Math.floor(x);
    x = Math.sin((i + 23) * 319.17) * 10000;
    const r3 = x - Math.floor(x);
    x = Math.sin((i + 41) * 191.91) * 10000;
    const r4 = x - Math.floor(x);
    return { r1, r2, r3, r4 };
  });

  let width = 0;
  let height = 0;
  let dpr = 1;
  let progress = 0;
  let raf = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function pathDrop(x, y, len, w, bend, alpha) {
    const grad = ctx.createLinearGradient(x, y, x, y + len);
    grad.addColorStop(0, `rgba(0, 0, 0, ${0.82 * alpha})`);
    grad.addColorStop(0.72, `rgba(0, 0, 0, ${0.94 * alpha})`);
    grad.addColorStop(1, `rgba(0, 0, 0, ${0.34 * alpha})`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.36, y);
    ctx.bezierCurveTo(x - w * 0.85 + bend, y + len * 0.22, x - w * 0.48 - bend, y + len * 0.74, x - w * 0.22, y + len);
    ctx.quadraticCurveTo(x, y + len + w * 0.42, x + w * 0.24, y + len);
    ctx.bezierCurveTo(x + w * 0.58 + bend, y + len * 0.72, x + w * 0.88 - bend, y + len * 0.24, x + w * 0.34, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.035 * alpha})`;
    ctx.lineWidth = Math.max(1, w * 0.04);
    ctx.stroke();
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const logoSize = Math.min(Math.max(width * (width < 760 ? 0.88 : 0.52), 280), width < 760 ? 540 : 760);
    const top = width < 760 ? 92 : Math.min(Math.max(height * 0.11, 88), 150);
    const startY = top + logoSize * (width < 760 ? 0.55 : 0.60);
    const centerX = width / 2;
    const active = Math.max(0, progress - 0.025) / 0.975;

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.72 + active * 0.28;

    drops.forEach((drop) => {
      const delay = drop.r4 * 0.46;
      const local = Math.max(0, Math.min(1, (active - delay) / (1 - delay)));
      if (local <= 0) return;

      const spread = logoSize * (0.18 + drop.r2 * 0.62);
      const x = centerX + (drop.r1 - 0.5) * spread;
      const y = startY + (drop.r2 - 0.5) * logoSize * 0.11;
      const len = (height * (0.12 + drop.r3 * 0.95)) * Math.pow(local, 0.82);
      const w = (5 + drop.r2 * 32) * (0.45 + local * 0.86);
      const bend = (drop.r1 - 0.5) * 70 * local;
      pathDrop(x, y, len, w, bend, 0.24 + local * 0.8);

      if (local > 0.38) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(local - 0.38) * 0.32})`;
        ctx.beginPath();
        ctx.ellipse(x + bend * 0.18, y + len + w * 0.28, w * (1.25 + drop.r1), w * (0.42 + drop.r3 * 0.45), drop.r2 * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const pool = Math.max(0, active - 0.42) / 0.58;
    if (pool > 0) {
      const poolY = height * (0.83 - pool * 0.18);
      const grad = ctx.createRadialGradient(centerX, height, width * 0.08, centerX, height, width * (0.42 + pool * 0.28));
      grad.addColorStop(0, `rgba(0, 0, 0, ${0.76 * pool})`);
      grad.addColorStop(0.55, `rgba(0, 0, 0, ${0.46 * pool})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(centerX, height + 20, width * (0.46 + pool * 0.18), height * (0.20 + pool * 0.12), 0, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 18; i += 1) {
        const d = drops[i];
        const x = centerX + (d.r1 - 0.5) * width * 0.82;
        const y = poolY + d.r2 * height * 0.28;
        ctx.fillStyle = `rgba(0, 0, 0, ${0.18 * pool * d.r3})`;
        ctx.beginPath();
        ctx.ellipse(x, y, 12 + d.r2 * 54, 5 + d.r3 * 20, d.r4 * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  }

  function update() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress = Math.min(1, Math.max(0, window.scrollY / max));
    root.style.setProperty("--ink-progress", progress.toFixed(4));
    if (!reduced) draw();
  }

  function requestUpdate() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      update();
    });
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", requestUpdate, { passive: true });
  resize();
  update();
  if (reduced) draw();
})();
