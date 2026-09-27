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


/* Selected work: native horizontal carousel with wheel, touch, drag and buttons. */
(() => {
  const viewport = document.getElementById("workCarousel");
  const prev = document.getElementById("workPrev");
  const next = document.getElementById("workNext");
  if (!viewport) return;

  const cards = () => [...viewport.querySelectorAll(".work-card")];
  const maxScroll = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);

  const moveByCard = (direction) => {
    const first = cards()[0];
    if (!first) return;
    const gap = parseFloat(getComputedStyle(viewport.querySelector(".work-carousel__track")).gap || "0");
    const amount = first.getBoundingClientRect().width + gap;
    const atStart = viewport.scrollLeft <= 2;
    const atEnd = viewport.scrollLeft >= maxScroll() - 2;

    if (direction < 0 && atStart) {
      viewport.scrollTo({ left: maxScroll(), behavior: "smooth" });
      return;
    }
    if (direction > 0 && atEnd) {
      viewport.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    viewport.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  prev?.addEventListener("click", () => moveByCard(-1));
  next?.addEventListener("click", () => moveByCard(1));

  viewport.addEventListener(
    "wheel",
    (event) => {
      const verticalIntent = Math.abs(event.deltaY) > Math.abs(event.deltaX);
      if (!verticalIntent || event.ctrlKey) return;

      const atStart = viewport.scrollLeft <= 0;
      const atEnd = viewport.scrollLeft >= maxScroll() - 1;
      const wantsLeft = event.deltaY < 0;
      const wantsRight = event.deltaY > 0;

      // At the two ends, let the page keep scrolling naturally.
      if ((atStart && wantsLeft) || (atEnd && wantsRight)) return;

      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    },
    { passive: false },
  );

  let pointerId = null;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startScroll = viewport.scrollLeft;
    moved = false;
    viewport.setPointerCapture(pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 4) moved = true;
    viewport.scrollLeft = startScroll - delta;
  });

  const endDrag = (event) => {
    if (event.pointerId !== pointerId) return;
    try {
      viewport.releasePointerCapture(pointerId);
    } catch {}
    pointerId = null;
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  viewport.addEventListener(
    "click",
    (event) => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    },
    true,
  );

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveByCard(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveByCard(1);
    }
  });
})();
