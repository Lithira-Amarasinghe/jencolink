(() => {
  const STORAGE_KEY = "jencolink-prototype-theme";
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  const menu = document.querySelector(".mobile-nav");
  const menuButton = document.querySelector(".menu-button");
  const themeToggle = document.querySelector(".theme-toggle");
  const form = document.querySelector(".contact-section form");
  const alertEl = document.querySelector(".form-alert");
  const submitButton = document.querySelector(".submit-button");
  const toast = document.querySelector(".toast");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const systemTheme = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  const readStored = () => {
    try {
      const value =
        localStorage.getItem(STORAGE_KEY) || localStorage.getItem("gencolink-prototype-theme");
      return value === "light" || value === "dark" ? value : "system";
    } catch {
      return "system";
    }
  };

  const requested = new URLSearchParams(window.location.search).get("theme");
  let preference = requested === "light" || requested === "dark" ? requested : readStored();
  if (requested === "light" || requested === "dark") {
    try {
      localStorage.setItem(STORAGE_KEY, requested);
    } catch {
      /* private mode */
    }
  }

  const effective = () => (preference === "system" ? systemTheme() : preference);

  const applyTheme = () => {
    if (preference === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", preference);
    const mode = effective();
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", mode === "light" ? "true" : "false");
      themeToggle.setAttribute(
        "aria-label",
        `Switch to ${mode === "dark" ? "light" : "dark"} mode`,
      );
    }
  };

  applyTheme();

  themeToggle?.addEventListener("click", () => {
    preference = effective() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* private mode */
    }
    applyTheme();
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (preference === "system") applyTheme();
  });

  const setMenu = (open) => {
    menu?.classList.toggle("is-open", open);
    menuButton?.setAttribute("aria-expanded", open ? "true" : "false");
    menuButton?.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    root.classList.toggle("nav-open", open);
  };

  menuButton?.addEventListener("click", () => {
    setMenu(!menu?.classList.contains("is-open"));
  });

  const scrollToId = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    setMenu(false);
  };

  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => scrollToId(button.getAttribute("data-scroll")));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  const onScroll = () => {
    const max = root.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    header?.classList.toggle("site-header--scrolled", window.scrollY > 24);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (finePointer && !reducedMotion) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - (rect.left + rect.width / 2)) * 0.22;
        const y = (event.clientY - (rect.top + rect.height / 2)) * 0.22;
        el.style.transition = "transform 180ms var(--ease-out)";
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform 420ms var(--ease-out-quint)";
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  let toastTimer = 0;
  const showToast = (type, message) => {
    if (!toast) return;
    toast.hidden = false;
    toast.classList.toggle("toast--error", type === "error");
    toast.querySelector("[data-toast-icon='ok']").hidden = type !== "success";
    toast.querySelector("[data-toast-icon='bad']").hidden = type !== "error";
    toast.querySelector("[data-toast-text]").textContent = message;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  };

  const fields = form
    ? {
        name: form.querySelector('[name="name"]'),
        email: form.querySelector('[name="email"]'),
        message: form.querySelector('[name="message"]'),
      }
    : null;

  const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const invalidFields = () => {
    if (!fields) return [];
    const problems = [];
    if (fields.name.value.trim().length < 2) problems.push(fields.name);
    if (!emailOk(fields.email.value.trim())) problems.push(fields.email);
    if (fields.message.value.trim().length < 12) problems.push(fields.message);
    return problems;
  };

  const paintValidity = (problems) => {
    if (!fields) return;
    for (const field of Object.values(fields)) {
      field.setAttribute("aria-invalid", problems.includes(field) ? "true" : "false");
    }
    if (alertEl) alertEl.hidden = problems.length === 0;
  };

  let submitted = false;
  let submitting = false;

  form?.addEventListener("input", () => {
    if (submitted) paintValidity(invalidFields());
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitted = true;
    const problems = invalidFields();
    paintValidity(problems);
    if (problems.length) {
      problems[0].focus();
      return;
    }
    if (submitting) return;
    submitting = true;
    submitButton.disabled = true;
    submitButton.querySelector("[data-label='idle']").hidden = true;
    submitButton.querySelector("[data-label='busy']").hidden = false;
    window.setTimeout(() => {
      form.reset();
      submitted = false;
      paintValidity([]);
      submitting = false;
      submitButton.disabled = false;
      submitButton.querySelector("[data-label='idle']").hidden = false;
      submitButton.querySelector("[data-label='busy']").hidden = true;
      showToast("success", "Message sent. We'll follow up within one business day.");
    }, 700);
  });

  initHero(reducedMotion);
})();

function initHero(reducedMotion) {
  const scene = document.querySelector(".hero");
  if (!scene) return;
  const signal = document.getElementById("hero-signal");
  const noteWrap = scene.querySelector(".hero-note-wrap");
  const buttons = [...scene.querySelectorAll(".hero-tags button")];
  let lane = null;
  let clearTimer = 0;

  const applyLane = (button) => {
    lane = button ? button.dataset.lane : null;
    scene.dataset.linked = lane ? "true" : "false";
    for (const item of buttons) {
      item.setAttribute("aria-checked", item === button ? "true" : "false");
    }
    window.clearTimeout(clearTimer);
    if (!signal || !noteWrap) return;
    if (button) {
      signal.textContent = button.dataset.copy || "";
      noteWrap.dataset.open = "true";
      return;
    }
    noteWrap.dataset.open = "false";
    clearTimer = window.setTimeout(() => {
      if (noteWrap.dataset.open !== "true") signal.textContent = "";
    }, 420);
  };

  for (const button of buttons) {
    button.addEventListener("click", () => {
      applyLane(lane === button.dataset.lane ? null : button);
    });
  }

  scene.querySelector(".hero-tags")?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = buttons[(index + direction + buttons.length) % buttons.length];
    next.focus();
    applyLane(next);
  });

  if (reducedMotion) return;

  let heroVisible = true;
  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let inside = false;
  let raf = 0;

  const observer = new IntersectionObserver(
    ([entry]) => {
      heroVisible = entry.isIntersecting;
      scene.classList.toggle("hero--offscreen", !entry.isIntersecting);
    },
    { threshold: 0 },
  );
  observer.observe(scene);

  scene.addEventListener("pointermove", (event) => {
    const rect = scene.getBoundingClientRect();
    tx = (event.clientX - rect.left) / rect.width - 0.5;
    ty = (event.clientY - rect.top) / rect.height - 0.5;
    inside = true;
  });
  scene.addEventListener("pointerleave", () => {
    inside = false;
    tx = 0;
    ty = 0;
  });

  const loop = () => {
    if (heroVisible) {
      x += ((inside ? tx : 0) - x) * 0.07;
      y += ((inside ? ty : 0) - y) * 0.07;
      scene.style.setProperty("--sx", x.toFixed(4));
      scene.style.setProperty("--sy", y.toFixed(4));
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
}
