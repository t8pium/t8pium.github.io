(() => {
  const add = (tag, attrs) => {
    if (attrs.href && document.querySelector(`link[href="${attrs.href}"]`)) return;
    const node = document.createElement(tag);
    Object.assign(node, attrs);
    document.head.appendChild(node);
  };
  add('link', { rel: 'stylesheet', href: 'mobile-fix.css?v=1' });
  add('link', { rel: 'stylesheet', href: 'mobile-brand-fix.css?v=9' });
  const style = document.createElement('style');
  style.textContent = `.mobile-hero-logo{display:none!important}a[href="projects/portfolio-cms-manager/"]{display:none!important}@media(min-width:1101px){.notion-gallery--projects{grid-template-columns:repeat(3,minmax(0,1fr))!important}}`;
  document.head.appendChild(style);
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

async function fixRobotCover() {
  try {
    const response = await fetch("https://api.sketchfab.com/v3/models/d45545d7e80742f68fff11aa19ac4631", { mode: "cors" });
    if (!response.ok) return;
    const data = await response.json();
    const images = data && data.thumbnails && data.thumbnails.images ? data.thumbnails.images : [];
    const best = images.filter(x => x && x.url).sort((a, b) => (b.width || 0) - (a.width || 0))[0];
    if (!best || !best.url) return;
    document.querySelectorAll('a[href="projects/robotic-hand/"] img, img[src*="robotic-hand-cover.svg"]').forEach((img) => {
      img.src = best.url;
      img.removeAttribute("srcset");
      img.style.objectFit = "cover";
      img.style.objectPosition = "center center";
      img.style.filter = "none";
    });
  } catch (_) {}
}

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
  sections.forEach((section) => { if (section.offsetTop <= marker) current = section.id; });
  navLinks.forEach((link) => link.classList.toggle("active", link.hash === `#${current}`));
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => { updatePageState(); ticking = false; });
}, { passive: true });

window.addEventListener("resize", () => { if (window.innerWidth > 760) closeMenu(); updatePageState(); });

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

addMobileLogo();
fixRobotCover();
updatePageState();