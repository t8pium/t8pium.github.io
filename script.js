document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const nav = document.getElementById("nav");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  const themeToggle = document.getElementById("themeToggle");
  const sections = [...document.querySelectorAll("main section[id]")];
  const links = [...document.querySelectorAll(".nav__link")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const storage = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* Storage can be unavailable in private or locked-down browsers. */
      }
    }
  };

  function closeMenu() {
    if (!hamburger || !navLinks) return;
    navLinks.classList.remove("open");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open navigation menu");
    body.classList.remove("menu-open");
    nav?.classList.remove("menu-open");
  }

  function openMenu() {
    if (!hamburger || !navLinks) return;
    navLinks.classList.add("open");
    hamburger.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.setAttribute("aria-label", "Close navigation menu");
    body.classList.add("menu-open");
    nav?.classList.add("menu-open");
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const shouldOpen = !navLinks.classList.contains("open");
      if (shouldOpen) openMenu();
      else closeMenu();
    });

    links.forEach((link) => link.addEventListener("click", closeMenu));

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!navLinks.contains(target) && !hamburger.contains(target)) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  function updateNavState() {
    nav?.classList.toggle("scrolled", window.scrollY > 18);
  }

  window.addEventListener("scroll", updateNavState, { passive: true });
  updateNavState();

  function applyTheme(theme) {
    const light = theme === "light";
    body.classList.toggle("light", light);
    themeToggle?.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    window.heroSceneRefresh?.();
  }

  const preferredTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  applyTheme(storage.get("portfolio-theme") || preferredTheme);

  themeToggle?.addEventListener("click", () => {
    const nextTheme = body.classList.contains("light") ? "dark" : "light";
    applyTheme(nextTheme);
    storage.set("portfolio-theme", nextTheme);
  });

  if (sections.length && links.length) {
    const highlight = () => {
      const offset = window.innerHeight * 0.42;
      let current = sections[0].id;

      sections.forEach((section) => {
        if (window.scrollY >= section.offsetTop - offset) current = section.id;
      });

      links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
      });
    };

    window.addEventListener("scroll", highlight, { passive: true });
    window.addEventListener("resize", highlight);
    highlight();
  }

  const revealEls = [...document.querySelectorAll(".reveal, .reveal-delay")];

  if (reduceMotion.matches) {
    revealEls.forEach((el) => el.classList.add("visible"));
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -70px 0px", threshold: 0.08 }
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      const navHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight + 2;
      window.scrollTo({ top, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  });

  initHeroScene(reduceMotion);
});

function initHeroScene(reduceMotion) {
  const canvas = document.getElementById("heroScene");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let nodes = [];
  let animationFrame = 0;
  let resizeTimer = 0;
  const pointer = { x: 0, y: 0, active: false };

  function cssVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  function toRgba(color, alpha) {
    if (color.startsWith("#")) {
      const value = color.slice(1);
      const full = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
      const number = Number.parseInt(full, 16);
      const red = (number >> 16) & 255;
      const green = (number >> 8) & 255;
      const blue = number & 255;
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    if (color.startsWith("rgb(")) {
      return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
    }

    return color;
  }

  function createNodes() {
    const count = Math.min(76, Math.max(34, Math.floor((width * height) / 18000)));
    nodes = Array.from({ length: count }, (_, index) => {
      const band = index % 5;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.26,
        vy: (Math.random() - 0.5) * 0.26,
        radius: 1.4 + Math.random() * 2.5,
        band
      };
    });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    createNodes();
    draw(0);
  }

  function drawBackgroundRoutes(accent, accentTwo, accentThree) {
    const routes = [
      { y: height * 0.24, color: accentTwo, width: 0.24 },
      { y: height * 0.48, color: accent, width: 0.32 },
      { y: height * 0.72, color: accentThree, width: 0.2 }
    ];

    routes.forEach((route, routeIndex) => {
      context.beginPath();
      context.lineWidth = route.width;
      context.strokeStyle = toRgba(route.color, 0.3);

      for (let x = width * 0.38; x <= width + 40; x += 34) {
        const wave = Math.sin((x * 0.012) + routeIndex) * 26;
        const y = route.y + wave;
        if (x === width * 0.38) context.moveTo(x, y);
        else context.lineTo(x, y);
      }

      context.stroke();
    });
  }

  function draw() {
    const accent = cssVar("--accent");
    const accentTwo = cssVar("--accent-2");
    const accentThree = cssVar("--accent-3");
    const border = cssVar("--border-strong");

    context.clearRect(0, 0, width, height);
    drawBackgroundRoutes(accent, accentTwo, accentThree);

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];

      if (!reduceMotion.matches) {
        a.x += a.vx;
        a.y += a.vy;

        if (pointer.active) {
          const px = pointer.x - a.x;
          const py = pointer.y - a.y;
          const distance = Math.hypot(px, py) || 1;
          if (distance < 220) {
            a.x -= (px / distance) * 0.16;
            a.y -= (py / distance) * 0.16;
          }
        }

        if (a.x < -20) a.x = width + 20;
        if (a.x > width + 20) a.x = -20;
        if (a.y < -20) a.y = height + 20;
        if (a.y > height + 20) a.y = -20;
      }

      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > 132) continue;

        const alpha = (1 - distance / 132) * 0.18;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.strokeStyle = toRgba(border, alpha);
        context.lineWidth = 0.8;
        context.stroke();
      }
    }

    nodes.forEach((node) => {
      const color = node.band === 0 ? accent : node.band === 2 ? accentThree : accentTwo;
      context.beginPath();
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fillStyle = toRgba(color, node.band === 0 ? 0.6 : 0.42);
      context.fill();
    });

    if (!reduceMotion.matches) {
      animationFrame = requestAnimationFrame(draw);
    }
  }

  function refresh() {
    cancelAnimationFrame(animationFrame);
    draw();
  }

  window.heroSceneRefresh = refresh;

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  });

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", () => {
      cancelAnimationFrame(animationFrame);
      resize();
    });
  }

  resize();
}
