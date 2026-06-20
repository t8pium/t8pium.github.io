document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  injectMotionStyles();
  document.body.classList.add("effects-ready");

  initScrollProgress(reduceMotion);
  initCursorGlow(reduceMotion);
  initSplitWords(reduceMotion);
  initParallax(reduceMotion);
  initSectionState();
  initMagneticTargets(reduceMotion);
});

function injectMotionStyles() {
  if (document.getElementById("motionRuntimeStyles")) return;

  const style = document.createElement("style");
  style.id = "motionRuntimeStyles";
  style.textContent = `
    .hero h1 .word {
      background: linear-gradient(92deg, #ffffff, var(--accent-2) 42%, var(--accent) 74%, var(--accent-3));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    body.light .hero h1 .word {
      background: linear-gradient(92deg, #07111f, #0891b2 42%, #7c3aed 74%, #4d7c0f);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  `;
  document.head.appendChild(style);
}

function initScrollProgress(reduceMotion) {
  const progress = document.getElementById("scrollProgress");
  if (!progress) return;

  function update() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const amount = window.scrollY / max;
    progress.style.transform = `scaleX(${Math.min(1, Math.max(0, amount))})`;
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function initCursorGlow(reduceMotion) {
  const glow = document.getElementById("cursorGlow");
  if (!glow || reduceMotion.matches || window.matchMedia("(pointer: coarse)").matches) return;

  window.addEventListener("pointermove", (event) => {
    glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    glow.classList.add("active");
  }, { passive: true });

  window.addEventListener("pointerleave", () => glow.classList.remove("active"));
}

function initSplitWords(reduceMotion) {
  const splitTargets = [...document.querySelectorAll(".split-words")];
  if (!splitTargets.length) return;

  splitTargets.forEach((target) => {
    if (target.dataset.split === "true") return;

    const original = target.textContent.trim();
    if (!original) return;

    target.dataset.split = "true";
    target.setAttribute("aria-label", original);
    target.innerHTML = original
      .split(/\s+/)
      .map((word, index) => `<span class="word" aria-hidden="true" style="--word-index:${index}">${word}</span>`)
      .join(" ");
  });

  const words = [...document.querySelectorAll(".split-words .word")];

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    words.forEach((word) => word.classList.add("word-in"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll(".word").forEach((word) => word.classList.add("word-in"));
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -10% 0px" });

  splitTargets.forEach((target) => observer.observe(target));
}

function initParallax(reduceMotion) {
  const layers = [...document.querySelectorAll("[data-parallax]")];
  if (!layers.length || reduceMotion.matches) return;

  let ticking = false;

  function update() {
    const viewportCenter = window.innerHeight / 2;

    layers.forEach((layer) => {
      const speed = Number.parseFloat(layer.dataset.speed || "12");
      const rect = layer.getBoundingClientRect();
      const layerCenter = rect.top + rect.height / 2;
      const distance = (layerCenter - viewportCenter) / window.innerHeight;
      const y = Math.max(-72, Math.min(72, distance * speed * -1));
      const rotate = Math.max(-2.5, Math.min(2.5, distance * speed * -0.03));

      layer.style.setProperty("--parallax-y", `${y.toFixed(2)}px`);
      layer.style.setProperty("--parallax-rotate", `${rotate.toFixed(3)}deg`);
    });

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function initSectionState() {
  const sections = [...document.querySelectorAll(".scroll-section")];
  if (!sections.length || !("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-in-view"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-in-view", entry.isIntersecting);
    });
  }, { threshold: 0.22 });

  sections.forEach((section) => observer.observe(section));
}

function initMagneticTargets(reduceMotion) {
  if (reduceMotion.matches || window.matchMedia("(pointer: coarse)").matches) return;

  const targets = [...document.querySelectorAll(".btn, .contact-link, .nav__brand, .theme-toggle")];

  targets.forEach((target) => {
    target.classList.add("magnetic");

    target.addEventListener("pointermove", (event) => {
      const rect = target.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      target.style.setProperty("--magnet-x", `${(x * 0.12).toFixed(2)}px`);
      target.style.setProperty("--magnet-y", `${(y * 0.12).toFixed(2)}px`);
    });

    target.addEventListener("pointerleave", () => {
      target.style.setProperty("--magnet-x", "0px");
      target.style.setProperty("--magnet-y", "0px");
    });
  });
}
