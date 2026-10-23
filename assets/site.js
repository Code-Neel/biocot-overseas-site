(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const transitionParam = "biocotMotion";
  let arrivedFromPageTransition = false;

  try {
    const currentUrl = new URL(window.location.href);
    arrivedFromPageTransition = currentUrl.searchParams.get(transitionParam) === "enter";
    if (arrivedFromPageTransition) {
      currentUrl.searchParams.delete(transitionParam);
      window.history.replaceState(null, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    }
  } catch {
    // The page remains usable if this browser blocks local file history updates.
  }

  if (arrivedFromPageTransition && !reduceMotion) {
    root.classList.add("page-arriving");
    window.setTimeout(() => root.classList.remove("page-arriving"), 1100);
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealItems = document.querySelectorAll("[data-reveal]");
    if (revealItems.length) {
      if (arrivedFromPageTransition) {
        document.querySelectorAll(".product-hero [data-reveal]").forEach((item) => item.classList.add("is-visible"));
      }
      revealItems.forEach((item) => {
        const siblings = Array.from(item.parentElement.children).filter((child) => child.hasAttribute("data-reveal"));
        const index = siblings.indexOf(item);
        item.style.setProperty("--reveal-delay", `${Math.max(0, Math.min(index, 4)) * 65}ms`);
      });
      root.classList.add("motion-ready");
      const observer = new IntersectionObserver((entries, activeObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            activeObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -24px 0px" });
      revealItems.forEach((item) => observer.observe(item));
    }
  }

  if (!reduceMotion) {
    const supportsNativePageTransitions = window.location.protocol !== "file:" &&
      "startViewTransition" in document &&
      window.CSS && CSS.supports("view-transition-name: product-shared-image");

    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest && event.target.closest("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

      let destination;
      try {
        destination = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (!["file:", "http:", "https:"].includes(destination.protocol) ||
          destination.origin !== window.location.origin ||
          destination.pathname === window.location.pathname) return;
      if (destination.protocol === "file:") {
        const siteDirectory = new URL(".", window.location.href).pathname.toLowerCase();
        if (!destination.pathname.toLowerCase().startsWith(siteDirectory)) return;
      }

      const productCard = link.closest(".product-card");
      if (supportsNativePageTransitions) {
        const sourceImage = productCard && productCard.querySelector("img");
        if (sourceImage) sourceImage.style.setProperty("view-transition-name", "product-shared-image");
        return;
      }

      event.preventDefault();
      destination.searchParams.set(transitionParam, "enter");
      if (productCard) productCard.classList.add("is-activating");
      root.classList.add("page-leaving");
      window.setTimeout(() => window.location.assign(destination.href), 250);
    });
  }

  document.querySelectorAll(".mobile-nav nav a").forEach((link) => {
    link.addEventListener("click", () => {
      const menu = link.closest(".mobile-nav");
      if (menu) menu.open = false;
    });
  });

  async function copyNumber(button) {
    const contact = button.closest(".contact-actions");
    const status = contact && contact.querySelector(".copy-status");
    const value = button.dataset.copy;
    if (!value || !status) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const temporary = document.createElement("textarea");
        temporary.value = value;
        temporary.setAttribute("readonly", "");
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.appendChild(temporary);
        temporary.select();
        const copied = document.execCommand("copy");
        temporary.remove();
        if (!copied) throw new Error("Clipboard unavailable");
      }
      status.textContent = "Number copied.";
    } catch {
      status.textContent = "Copy is unavailable in this preview. You can select the number above.";
    }
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => copyNumber(button));
  });
})();

