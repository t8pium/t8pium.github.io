/* Navigation is an enhancement. Every page and link works without JavaScript. */
(() => {
  const nav = document.querySelector(".nav");
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!nav || !toggle || !menu) return;
  const mobile = window.matchMedia("(max-width: 700px)");
  const links = [...menu.querySelectorAll("a")];
  const closeMenu = (restoreFocus = false) => {
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("open");
    if (restoreFocus && mobile.matches) toggle.focus();
  };
  toggle.hidden = false;
  nav.classList.add("nav-ready");
  // Keep anchor targets below the real header height, including enlarged text.
  const header = nav.closest("header");
  const updateScrollOffset = () => {
    document.documentElement.style.setProperty(
      "--scroll-offset",
      `${Math.ceil(header.getBoundingClientRect().height) + 24}px`,
    );
  };
  if ("ResizeObserver" in window) {
    new ResizeObserver(updateScrollOffset).observe(header);
  }
  window.addEventListener("resize", updateScrollOffset, { passive: true });
  updateScrollOffset();
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("open", open);
  });
  links.forEach((link) =>
    link.addEventListener("click", () => {
      const target =
        link.pathname === location.pathname && link.hash
          ? document.getElementById(link.hash.slice(1))
          : null;
      closeMenu();
      if (mobile.matches && target) {
        // Move focus out of the closing disclosure to the destination being read.
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener(
          "blur",
          () => target.removeAttribute("tabindex"),
          { once: true },
        );
      }
    }),
  );
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      toggle.getAttribute("aria-expanded") === "true"
    )
      closeMenu(true);
  });
  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !nav.contains(event.target))
      closeMenu();
  });
  nav.addEventListener("focusout", (event) => {
    if (
      event.relatedTarget instanceof Node &&
      !nav.contains(event.relatedTarget)
    )
      closeMenu();
  });
  mobile.addEventListener("change", () => {
    const focusIsInMenu = menu.contains(document.activeElement);
    closeMenu(mobile.matches && focusIsInMenu);
  });
  const sections = links
    .map((link) => {
      if (link.pathname !== location.pathname || !link.hash) return null;
      return document.getElementById(link.hash.slice(1));
    })
    .filter(Boolean);
  if (!sections.length) return;
  // Coalesce scroll work; there is no animation loop or scroll-revealed content.
  let queued = false;
  const markCurrent = () => {
    queued = false;
    let current = "";
    const cutoff = header.getBoundingClientRect().height + 32;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= cutoff)
        current = `#${section.id}`;
    }
    links.forEach((link) => {
      if (link.hash === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  const schedule = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(markCurrent);
    }
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("pageshow", schedule);
  markCurrent();
})();

/* Selected work rail: progressive enhancement only; native horizontal scroll remains usable without JS. */
(() => {
  const viewport = document.getElementById("workCarousel");
  const prev = document.getElementById("workPrev");
  const next = document.getElementById("workNext");
  const status = document.getElementById("workStatus");
  if (!viewport || !prev || !next || !status) return;

  const slides = [...viewport.querySelectorAll(".work-card")];
  if (!slides.length) return;

  prev.hidden = false;
  next.hidden = false;

  const maxScroll = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const nearestIndex = () => {
    const left = viewport.scrollLeft;
    let best = 0;
    let distance = Infinity;
    slides.forEach((slide, index) => {
      const delta = Math.abs(slide.offsetLeft - slides[0].offsetLeft - left);
      if (delta < distance) {
        distance = delta;
        best = index;
      }
    });
    return best;
  };

  const update = () => {
    const index = nearestIndex();
    status.textContent = `${index + 1} / ${slides.length}`;
    prev.disabled = viewport.scrollLeft <= 2;
    next.disabled = viewport.scrollLeft >= maxScroll() - 2;
  };

  const go = (index) => {
    const target = slides[Math.max(0, Math.min(slides.length - 1, index))];
    if (!target) return;
    viewport.scrollTo({
      left: target.offsetLeft - slides[0].offsetLeft,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  prev.addEventListener("click", () => go(nearestIndex() - 1));
  next.addEventListener("click", () => go(nearestIndex() + 1));

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(nearestIndex() - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(nearestIndex() + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      go(0);
    } else if (event.key === "End") {
      event.preventDefault();
      go(slides.length - 1);
    }
  });

  viewport.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const atStart = viewport.scrollLeft <= 1;
      const atEnd = viewport.scrollLeft >= maxScroll() - 1;
      if ((event.deltaY < 0 && atStart) || (event.deltaY > 0 && atEnd)) return;
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    },
    { passive: false },
  );

  let pointer = null;
  let startX = 0;
  let startScroll = 0;
  let dragged = false;

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;

    // Do not start drag-capture from interactive controls. Capturing the pointer
    // from a link can prevent the browser's native navigation from firing.
    if (
      event.target instanceof Element &&
      event.target.closest("a, button, input, textarea, select, summary, [role='button']")
    )
      return;

    pointer = event.pointerId;
    startX = event.clientX;
    startScroll = viewport.scrollLeft;
    dragged = false;
    viewport.setPointerCapture(pointer);
  });
  viewport.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointer) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 5) dragged = true;
    viewport.scrollLeft = startScroll - delta;
  });
  const release = (event) => {
    if (event.pointerId !== pointer) return;
    try { viewport.releasePointerCapture(pointer); } catch {}
    pointer = null;
  };
  viewport.addEventListener("pointerup", release);
  viewport.addEventListener("pointercancel", release);
  viewport.addEventListener(
    "click",
    (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    },
    true,
  );

  let queued = false;
  const scheduleUpdate = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  viewport.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  update();
})();
