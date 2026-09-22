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
