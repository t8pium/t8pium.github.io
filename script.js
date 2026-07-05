(() => {
  const add = (tag, attrs) => {
    if (attrs.href && document.querySelector(`link[href="${attrs.href}"]`)) return;
    const node = document.createElement(tag);
    Object.assign(node, attrs);
    document.head.appendChild(node);
  };
  add('link', { rel: 'stylesheet', href: 'mobile-fix.css?v=1' });
  add('link', { rel: 'stylesheet', href: 'mobile-brand-fix.css?v=2' });
})();

const header = document.getElementById("siteHeader");
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const progress = document.getElementById("scrollProgress");
const navLinks = [...document.querySelectorAll(".nav-menu a")];
const sections = [...document.querySelectorAll("main section[id]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function addMobileLogo() {
  if (!window.matchMedia("(max-width: 760px)").matches) return;
  if (document.querySelector(".mobile-hero-logo")) return;
  const logo = document.createElement("img");
  logo.className = "mobile-hero-logo";
  logo.src = "assets/logo-mark.svg";
  logo.alt = "";
  logo.setAttribute("aria-hidden", "true");
  document.body.appendChild(logo);
}

function addKeyboardPresserProjectCard() {
  const gallery = document.querySelector(".notion-gallery--projects");
  if (!gallery || document.querySelector('a[href="projects/automatic-keyboard-presser/"]')) return;

  const card = document.createElement("a");
  card.className = "gallery-card gallery-card--automation";
  card.href = "projects/automatic-keyboard-presser/";
  card.setAttribute("aria-label", "Open Automatic Keyboard Presser and Macro Recorder project page");
  card.innerHTML = `<div class="gallery-card__cover"><img src="assets/covers/automatic-keyboard-presser-cover.svg?v=2" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;"></div><div class="gallery-card__body"><span class="gallery-card__type">Desktop automation / macro recorder</span><h3>Automatic Keyboard Presser + Macro Recorder</h3><p>Configurable key combos, hold/repeat modes, and mouse + keyboard recording with replay loops.</p><div class="gallery-card__props"><span>Python</span><span>Tkinter</span><span>pynput</span></div><span class="gallery-card__open">Open &nearr;</span></div>`;
  gallery.appendChild(card);
}

function addPortfolioCmsManagerCard() {
  const gallery = document.querySelector(".notion-gallery--projects");
  if (!gallery || document.querySelector('a[href="projects/portfolio-cms-manager/"]')) return;

  const card = document.createElement("a");
  card.className = "gallery-card gallery-card--image";
  card.href = "projects/portfolio-cms-manager/";
  card.setAttribute("aria-label", "Open Portfolio CMS and Project Gallery Manager project page");
  card.innerHTML = `<div class="gallery-card__cover"><img src="assets/covers/portfolio-cms-manager-cover.svg" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;"></div><div class="gallery-card__body"><span class="gallery-card__type">Static site tooling / desktop app</span><h3>Portfolio CMS / Project Gallery Manager</h3><p>Desktop app that generates portfolio cards, copies cover images, and creates full project pages without hand-editing HTML.</p><div class="gallery-card__props"><span>Python</span><span>customtkinter</span><span>PyInstaller</span></div><span class="gallery-card__open">Open &nearr;</span></div>`;
  gallery.appendChild(card);
}

async function getSketchfabStill() {
  const apiUrl = "https://api.sketchfab.com/v3/models/d45545d7e80742f68fff11aa19ac4631";

  try {
    const response = await fetch(apiUrl, { mode: "cors" });
    if (!response.ok) throw new Error(`Sketchfab API ${response.status}`);

    const data = await response.json();
    const images = data?.thumbnails?.images || [];
    const best = [...images]
      .filter((image) => image?.url)
      .sort((a, b) => (b.width || 0) - (a.width || 0))[0];

    return best?.url || "";
  } catch (error) {
    console.warn("Could not load Sketchfab still thumbnail:", error);
    return "";
  }
}

async function replaceRoboticHandCover() {
  const fallback = "assets/covers/robotic-hand-cover.svg?v=static-fallback";
  const stillUrl = await getSketchfabStill();
  const src = stillUrl || fallback;

  document
    .querySelectorAll('img[src*="robotic-hand-cover.svg"], img[src*="robotic-hand-thumbnail-final.svg"]')
    .forEach((img) => {
      img.src = src;
      img.removeAttribute("srcset");
      img.style.objectFit = "cover";
      img.style.objectPosition = "center center";
    });
}

function replaceInstagramToolkitCover() {
  const card = document.querySelector('a[href="projects/instagram-highlight-toolkit/"]');
  const cover = card?.querySelector(".gallery-card__cover");
  if (!cover) return;

  cover.innerHTML = `<img src="assets/covers/instagram-toolkit-launcher-cover.svg?v=1" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">`;
}

function refreshAutomaticKeyboardCover() {
  document
    .querySelectorAll('img[src*="automatic-keyboard-presser-cover.svg"]')
    .forEach((img) => {
      img.src = "assets/covers/automatic-keyboard-presser-cover.svg?v=2";
      img.removeAttribute("srcset");
      img.style.objectFit = "cover";
      img.style.objectPosition = "center center";
    });
}

addMobileLogo();
addKeyboardPresserProjectCard();
addPortfolioCmsManagerCard();
replaceRoboticHandCover();
replaceInstagramToolkitCover();
refreshAutomaticKeyboardCover();

function closeMenu() {
  if (!navToggle || !navMenu) return;
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.querySelector(".sr-only").textContent = "Open navigation";
  navMenu.classList.remove("open");
  header?.classList.remove("menu-open");
  document.body.classList.remove("no-scroll");
}

navToggle?.addEventListener("click", () => {
  const open = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!open));
  navToggle.querySelector(".sr-only").textContent = open ? "Open navigation" : "Close navigation";
  navMenu?.classList.toggle("open", !open);
  header?.classList.toggle("menu-open", !open);
  document.body.classList.toggle("no-scroll", !open);
});

navLinks.forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

document.addEventListener("click", (event) => {
  if (!navMenu?.classList.contains("open")) return;
  if (event.target instanceof Node && !navMenu.contains(event.target) && !navToggle?.contains(event.target)) closeMenu();
});

function updatePageState() {
  const scrollTop = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? Math.min(scrollTop / scrollable, 1) : 0;

  header?.classList.toggle("scrolled", scrollTop > 12);
  if (progress) progress.style.transform = `scaleX(${ratio})`;

  const marker = scrollTop + window.innerHeight * 0.38;
  let current = sections[0]?.id;
  sections.forEach((section) => {
    if (section.offsetTop <= marker) current = section.id;
  });
  navLinks.forEach((link) => link.classList.toggle("active", link.hash === `#${current}`));
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => {
    updatePageState();
    ticking = false;
  });
}, { passive: true });

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeMenu();
  updatePageState();
});

if (!reducedMotion.matches) {
  let pointerTicking = false;
  window.addEventListener("pointermove", (event) => {
    if (pointerTicking) return;
    pointerTicking = true;
    window.requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
      document.documentElement.style.setProperty("--my", `${event.clientY}px`);
      pointerTicking = false;
    });
  }, { passive: true });
}

const revealItems = document.querySelectorAll(".reveal");

if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -60px", threshold: 0.08 });

  revealItems.forEach((item) => revealObserver.observe(item));
}

updatePageState();