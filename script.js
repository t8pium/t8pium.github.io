/* =============================================
   PORTFOLIO v1 — script.js
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ---- 1. MOBILE NAV TOGGLE ----
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });

    navLinks.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  }

  // ---- 2. STICKY NAV ----
  const nav = document.getElementById('nav');
  if (nav) {
    const tick = () => nav.classList.toggle('scrolled', window.scrollY > 28);
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  }

  // ---- 3. ACTIVE NAV LINK ON SCROLL ----
  const sections = document.querySelectorAll('main section[id]');
  const links    = document.querySelectorAll('.nav__link');

  if (sections.length && links.length) {
    const highlight = () => {
      let current = '';
      sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - window.innerHeight * 0.42) {
          current = sec.id;
        }
      });
      links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
      });
    };
    window.addEventListener('scroll', highlight, { passive: true });
    highlight();
  }

  // ---- 4. SCROLL REVEAL ----
  const revealEls = document.querySelectorAll('.reveal, .reveal-delay');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -55px 0px', threshold: 0.08 }
    );
    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // ---- 5. THEME TOGGLE ----
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon   = document.getElementById('themeIcon');

  function applyTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
    if (themeIcon) themeIcon.textContent = theme === 'light' ? '☾' : '☀';
  }

  const saved = localStorage.getItem('portfolio-theme') || 'dark';
  applyTheme(saved);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = document.body.classList.contains('light') ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem('portfolio-theme', next);
    });
  }

  // ---- 6. SMOOTH SCROLL WITH NAV OFFSET ----
  const NAV_H = 70;
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - NAV_H, behavior: 'smooth' });
    });
  });

});
