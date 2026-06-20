const header = document.getElementById("siteHeader");
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const progress = document.getElementById("scrollProgress");
const navLinks = [...document.querySelectorAll(".nav-menu a")];
const sections = [...document.querySelectorAll("main section[id]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function closeMenu() {
  if (!navToggle || !navMenu) return;
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.querySelector(".sr-only").textContent = "Open navigation";
  navMenu.classList.remove("open");
  header?.classList.remove("menu-open");
  document.body.style.overflow = "";
}

navToggle?.addEventListener("click", () => {
  const open = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!open));
  navToggle.querySelector(".sr-only").textContent = open ? "Open navigation" : "Close navigation";
  navMenu?.classList.toggle("open", !open);
  header?.classList.toggle("menu-open", !open);
  document.body.style.overflow = open ? "" : "hidden";
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

