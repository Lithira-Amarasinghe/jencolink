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

  document.querySelectorAll('a.brand[href="#top"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setMenu(false);
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
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
  initCatalog(reducedMotion);
  initSectionSpy();
  initReveal(reducedMotion);
})();

function initReveal(reducedMotion) {
  if (reducedMotion) {
    document.documentElement.classList.remove("js-reveal");
    return;
  }
  const groups = [
    { selector: ".services-head", kind: "reveal" },
    { selector: ".service-row-inner", kind: "reveal-row", stagger: 0.05 },
    { selector: ".why-intro", kind: "reveal" },
    { selector: ".value-item", kind: "reveal", stagger: 0.07 },
    { selector: ".faq-head", kind: "reveal" },
    { selector: ".faq-item", kind: "reveal-soft", stagger: 0.045 },
    { selector: ".contact-copy", kind: "reveal" },
    { selector: ".contact-section form", kind: "reveal", delay: 0.1 },
    { selector: ".site-footer", kind: "reveal-soft" },
  ];
  const nodes = [];
  for (const group of groups) {
    document.querySelectorAll(group.selector).forEach((node, index) => {
      node.classList.add("reveal", group.kind);
      const delay = (group.delay || 0) + index * (group.stagger || 0);
      if (delay) node.style.setProperty("--d", `${delay.toFixed(2)}s`);
      nodes.push(node);
    });
  }
  if (!nodes.length || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  nodes.forEach((node) => observer.observe(node));
}

function initSectionSpy() {
  const links = [...document.querySelectorAll(".desktop-nav [data-scroll], .mobile-nav [data-scroll]")];
  const sections = ["services", "why", "faq", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!links.length || !sections.length) return;

  const mark = () => {
    const line = window.innerHeight * 0.32;
    let current = "";
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) current = section.id;
    }
    for (const link of links) {
      if (link.getAttribute("data-scroll") === current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
  };

  mark();
  window.addEventListener("scroll", mark, { passive: true });
}

function initCatalog(reducedMotion) {
  const list = document.querySelector(".service-list");
  if (!list) return;
  const rows = [...list.querySelectorAll(".service-row")];
  const filter = document.querySelector(".service-filter");
  const filterLabel = filter?.querySelector("[data-filter-label]");
  const topic = document.querySelector(".contact-topic");
  const topicName = topic?.querySelector("[data-topic-name]");
  const message = document.querySelector('[name="message"]');
  let activeLane = null;
  let starter = "";

  const setTopic = (title) => {
    if (!topic || !topicName) return;
    topic.hidden = false;
    topicName.textContent = title;
    const next = `I'd like to talk about ${title}.`;
    if (message && (message.value.trim() === "" || message.value === starter)) {
      message.value = next;
      starter = next;
    }
  };

  const clearTopic = () => {
    if (topic) topic.hidden = true;
    if (message && message.value === starter) message.value = "";
    starter = "";
  };

  topic?.querySelector("[data-topic-clear]")?.addEventListener("click", clearTopic);

  rows.forEach((row, index) => {
    const title = row.querySelector(".service-title");
    const copy = row.querySelector(".service-row-copy");
    if (!title || !copy) return;
    const name = title.textContent.trim();
    const button = document.createElement("button");
    button.type = "button";
    button.className = "service-toggle";
    button.textContent = name;
    button.setAttribute("aria-expanded", "false");
    const panelId = `service-panel-${index + 1}`;
    button.setAttribute("aria-controls", panelId);
    title.replaceChildren(button);

    const panel = document.createElement("div");
    panel.className = "service-panel";
    panel.id = panelId;
    const inner = document.createElement("div");
    inner.className = "service-panel-inner";
    const more = document.createElement("p");
    more.className = "service-more";
    more.textContent = row.dataset.more || "";
    const talk = document.createElement("button");
    talk.type = "button";
    talk.className = "service-talk";
    talk.textContent = "Talk about this";
    inner.append(more, talk);
    panel.append(inner);
    copy.append(panel);

    const setOpen = (open) => {
      row.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    };

    button.addEventListener("click", () => {
      const open = !row.classList.contains("is-open");
      for (const other of rows) {
        if (other !== row) {
          other.classList.remove("is-open");
          other.querySelector(".service-toggle")?.setAttribute("aria-expanded", "false");
        }
      }
      setOpen(open);
    });

    talk.addEventListener("click", () => {
      setTopic(name);
      const contact = document.getElementById("contact");
      contact?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      window.setTimeout(() => message?.focus(), reducedMotion ? 0 : 450);
    });
  });

  list.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const toggles = [...list.querySelectorAll(".service-toggle")];
    const index = toggles.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    toggles[(index + direction + toggles.length) % toggles.length].focus();
  });

  const applyFilter = (lane, label) => {
    activeLane = lane || null;
    const on = Boolean(activeLane);
    if (filter) filter.hidden = !on;
    if (filterLabel) filterLabel.textContent = label || "";
    for (const row of rows) {
      row.classList.toggle("is-dimmed", on && row.dataset.lane !== activeLane);
    }
  };

  document.addEventListener("jencolink:lane", (event) => {
    applyFilter(event.detail?.lane, event.detail?.label);
  });

  filter?.querySelector("[data-filter-clear]")?.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("jencolink:lane", { detail: { lane: null, label: "", source: "catalog" } }));
  });
}

function initHero(reducedMotion) {
  const scene = document.querySelector(".hero");
  if (!scene) return;
  const signal = document.getElementById("hero-signal");
  const noteWrap = scene.querySelector(".hero-note-wrap");
  const more = scene.querySelector(".hero-more");
  const hint = scene.querySelector(".hero-drag-hint");
  const buttons = [...scene.querySelectorAll(".hero-tags button")];
  const emblem = scene.querySelector(".hero-emblem");
  let lane = null;
  let clearTimer = 0;
  let turnTarget = 0;
  let dragTilt = 0;
  let dragged = false;
  let pointerOrigin = null;

  const applyLane = (button, source) => {
    lane = button ? button.dataset.lane : null;
    scene.dataset.linked = lane ? "true" : "false";
    for (const item of buttons) {
      item.setAttribute("aria-checked", item === button ? "true" : "false");
    }
    if (more) more.hidden = !button;
    window.clearTimeout(clearTimer);
    if (signal && noteWrap) {
      if (button) {
        signal.textContent = button.dataset.copy || "";
        noteWrap.dataset.open = "true";
      } else {
        noteWrap.dataset.open = "false";
        clearTimer = window.setTimeout(() => {
          if (noteWrap.dataset.open !== "true") signal.textContent = "";
        }, 420);
      }
    }
    turnTarget = lane === "web" ? -8 : lane === "flow" ? 8 : 0;
    if (reducedMotion) scene.style.setProperty("--mark-turn", `${turnTarget}deg`);
    if (source !== "catalog") {
      document.dispatchEvent(
        new CustomEvent("jencolink:lane", {
          detail: { lane, label: button ? button.textContent.trim() : "", source: "hero" },
        }),
      );
    }
  };

  document.addEventListener("jencolink:lane", (event) => {
    if (event.detail?.source !== "catalog") return;
    applyLane(null, "catalog");
  });

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

  const mission = scene.querySelector(".hero-mission");
  const words = [...scene.querySelectorAll(".mission-word")];
  const paintWords = (index) => {
    words.forEach((word, i) => {
      const distance = index < 0 ? 99 : Math.abs(i - index);
      const near = distance === 0 ? 1 : distance === 1 ? 0.42 : 0;
      word.style.setProperty("--near", String(near));
    });
  };
  const nearestWord = (event) => {
    let best = -1;
    let bestDistance = 120;
    words.forEach((word, i) => {
      const rect = word.getBoundingClientRect();
      const distance = Math.hypot(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    paintWords(best);
  };
  mission?.addEventListener("pointermove", nearestWord);
  mission?.addEventListener("pointerleave", () => paintWords(-1));

  scene.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") hint?.classList.add("is-gone");
    if (event.target.closest(".hero-emblem")) dragged = false;
  });

  emblem?.addEventListener("pointerdown", (event) => {
    dragged = false;
    pointerOrigin = { x: event.clientX, y: event.clientY };
  });

  emblem?.addEventListener("pointermove", (event) => {
    if (!pointerOrigin || event.buttons === 0) return;
    const travel = Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y);
    if (travel > 12) {
      dragged = true;
      dragTilt = Math.max(-12, Math.min(12, (event.clientX - pointerOrigin.x) / 18));
    }
  });

  emblem?.addEventListener("pointerup", () => {
    pointerOrigin = null;
    dragTilt = 0;
  });
  emblem?.addEventListener("pointercancel", () => {
    pointerOrigin = null;
    dragTilt = 0;
  });

  emblem?.addEventListener("click", () => {
    if (dragged || reducedMotion) {
      dragged = false;
      return;
    }
    scene.querySelectorAll(".hero-letter, .mission-word, .hero-tags button, .hero-emblem-in").forEach((node) => {
      node.style.animation = "none";
      void node.offsetWidth;
      node.style.animation = "";
    });
  });

  const aurora = scene.querySelector(".hero-aurora");
  const washes = [
    { el: scene.querySelector('[data-wash="0"]'), x: 0.2, y: 0.34, ampX: 0.05, ampY: 0.034, phase: 0 },
    { el: scene.querySelector('[data-wash="1"]'), x: 0.78, y: 0.26, ampX: 0.042, ampY: 0.04, phase: 2.1 },
    { el: scene.querySelector('[data-wash="2"]'), x: 0.54, y: 0.82, ampX: 0.036, ampY: 0.044, phase: 4.3 },
  ].filter((wash) => wash.el);
  const follow = scene.querySelector('[data-wash="follow"]');

  const placeWashes = (time, biasX, biasY) => {
    const width = scene.clientWidth;
    const height = scene.clientHeight;
    for (const wash of washes) {
      const driftX = time == null ? 0 : Math.sin(time * 0.22 + wash.phase) * wash.ampX;
      const driftY = time == null ? 0 : Math.cos(time * 0.18 + wash.phase) * wash.ampY;
      const cx = (wash.x + driftX + biasX) * width;
      const cy = (wash.y + driftY + biasY) * height;
      wash.el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -50%)`;
    }
  };

  if (reducedMotion) {
    placeWashes(null, 0, 0);
    return;
  }

  let heroVisible = true;
  let turn = 0;
  let gx = 0.46;
  let gy = 0.4;
  let gxT = 0.46;
  let gyT = 0.4;
  let raf = 0;
  let wandering = false;
  let wanderX = gx;
  let wanderY = gy;
  let autoVX = 0;
  let autoVY = 0;
  let kickIn = 400 + Math.random() * 700;
  let lastFrame = performance.now();
  const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const idleResumeMs = coarsePointer ? 700 : 2000;
  let lastRealMoveAt = performance.now();

  const observer = new IntersectionObserver(
    ([entry]) => {
      heroVisible = entry.isIntersecting;
      scene.classList.toggle("hero--offscreen", !entry.isIntersecting);
    },
    { threshold: 0 },
  );
  observer.observe(scene);

  const notePointer = (event) => {
    if (event.pointerType === "mouse" && event.movementX === 0 && event.movementY === 0) return;
    const rect = scene.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    lastRealMoveAt = performance.now();
    wandering = false;
    gxT = Math.min(0.9, Math.max(0.1, (event.clientX - rect.left) / rect.width));
    gyT = Math.min(0.88, Math.max(0.12, (event.clientY - rect.top) / rect.height));
    aurora?.setAttribute("data-lit", "true");
  };
  scene.addEventListener("pointermove", notePointer);
  scene.addEventListener("pointerdown", notePointer);

  const stepWander = (dt) => {
    const step = Math.min(dt, 34) / 16.67;
    kickIn -= dt;
    if (kickIn <= 0) {
      const angle = Math.random() * Math.PI * 2;
      const power = 0.004 + Math.random() * 0.008;
      autoVX += Math.cos(angle) * power;
      autoVY += Math.sin(angle) * power;
      kickIn = 520 + Math.random() * 1800;
    }
    autoVX += (Math.random() - 0.5) * 0.0014 * step;
    autoVY += (Math.random() - 0.5) * 0.0014 * step;
    autoVX *= 0.985 ** step;
    autoVY *= 0.985 ** step;
    const speed = Math.hypot(autoVX, autoVY);
    const maxSpeed = 0.006;
    if (speed > maxSpeed) {
      autoVX = (autoVX / speed) * maxSpeed;
      autoVY = (autoVY / speed) * maxSpeed;
    }
    wanderX += autoVX * step;
    wanderY += autoVY * step;
    if (wanderX < 0.12) {
      wanderX = 0.12;
      autoVX = Math.abs(autoVX) * 0.5;
    } else if (wanderX > 0.88) {
      wanderX = 0.88;
      autoVX = -Math.abs(autoVX) * 0.5;
    }
    if (wanderY < 0.14) {
      wanderY = 0.14;
      autoVY = Math.abs(autoVY) * 0.5;
    } else if (wanderY > 0.86) {
      wanderY = 0.86;
      autoVY = -Math.abs(autoVY) * 0.5;
    }
  };

  const loop = () => {
    if (heroVisible) {
      const now = performance.now();
      const dt = now - lastFrame;
      lastFrame = now;
      const idle = now - lastRealMoveAt > idleResumeMs;
      if (idle) {
        if (!wandering) {
          wandering = true;
          wanderX = gx;
          wanderY = gy;
          const angle = Math.random() * Math.PI * 2;
          const power = 0.003 + Math.random() * 0.004;
          autoVX = Math.cos(angle) * power;
          autoVY = Math.sin(angle) * power;
          kickIn = 180 + Math.random() * 500;
        }
        stepWander(dt);
        gxT = wanderX;
        gyT = wanderY;
        aurora?.setAttribute("data-lit", "true");
      }
      const ease = idle ? 0.04 : 0.08;
      gx += (gxT - gx) * ease;
      gy += (gyT - gy) * ease;
      const biasX = (gx - 0.5) * 0.22;
      const biasY = (gy - 0.42) * 0.18;
      placeWashes(now / 1000, biasX, biasY);
      if (follow) {
        const fx = gx * scene.clientWidth;
        const fy = gy * scene.clientHeight;
        follow.style.transform = `translate3d(${fx.toFixed(1)}px, ${fy.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }
      turn += (turnTarget + dragTilt - turn) * 0.08;
      scene.style.setProperty("--mark-turn", `${turn.toFixed(2)}deg`);
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
}
