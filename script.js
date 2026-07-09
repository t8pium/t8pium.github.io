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

function forceApResults() {
  const apCard = document.querySelector('.ap-card');
  if (!apCard) return;

  const label = apCard.querySelector('.label');
  if (label) label.textContent = 'Advanced Placement results';

  const count = apCard.querySelector('.ap-count');
  if (count) count.textContent = '4 scores of 5 / 1 score of 4';

  const apList = apCard.querySelector('.ap-list');
  if (!apList) return;

  apList.innerHTML = `
    <div class="ap-row ap-row--complete"><span class="course-code">PHY</span><strong>AP Physics 1</strong><span class="course-state">Completed &middot; 5</span></div>
    <div class="ap-row ap-row--complete"><span class="course-code">BIO</span><strong>AP Biology</strong><span class="course-state">Completed &middot; 5</span></div>
    <div class="ap-row ap-row--complete"><span class="course-code">LANG</span><strong>AP English Language and Composition</strong><span class="course-state">Completed &middot; 5</span></div>
    <div class="ap-row ap-row--complete"><span class="course-code">CALC</span><strong>AP Calculus AB</strong><span class="course-state">Completed &middot; 5</span></div>
    <div class="ap-row ap-row--complete"><span class="course-code">CSP</span><strong>AP Computer Science Principles</strong><span class="course-state">Completed &middot; 4</span></div>
  `;
}

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

function addTopiumDiceMarketCard() {
  const gallery = document.querySelector('.notion-gallery--projects');
  if (!gallery || gallery.querySelector('a[href="projects/topium-dice-market/"]')) return;

  const card = document.createElement('a');
  card.className = 'gallery-card gallery-card--systems';
  card.href = 'projects/topium-dice-market/';
  card.setAttribute('aria-label', 'Open Topium Dice Market project page');
  card.innerHTML = `<div class="gallery-card__cover"><img src="assets/covers/topium-dice-market-cover.svg" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;"></div><div class="gallery-card__body"><span class="gallery-card__type">Market simulation / data visualization</span><h3>Topium Dice Market</h3><p>Local Python charting experiment where coin flips and dice rolls generate candles, higher timeframes, and VWAP bands.</p><div class="gallery-card__props"><span>Python</span><span>Tkinter</span><span>Matplotlib</span></div><span class="gallery-card__open">Open &nearr;</span></div>`;

  const firstCard = gallery.querySelector('a[href="projects/robotic-hand/"]');
  if (firstCard?.nextSibling) gallery.insertBefore(card, firstCard.nextSibling);
  else gallery.appendChild(card);
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

addTopiumDiceMarketCard();

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

forceApResults();
addMobileLogo();
fixRobotCover();
updatePageState();
