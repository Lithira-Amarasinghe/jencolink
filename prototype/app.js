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
  const canvas = document.querySelector(".hero-canvas");
  const scene = document.querySelector(".hero");
  const wordmark = document.querySelector(".hero-type");
  if (!canvas || !scene || !wordmark) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const linkDist = 148;
  const mouseRadius = 260;
  let width = 0;
  let height = 0;
  let nodes = [];
  let heroVisible = true;
  let pointerInside = false;
  let pxT = -9999;
  let pyT = -9999;
  let px = -9999;
  let py = -9999;
  let sx = -9999;
  let sy = -9999;
  let lastRealMoveAt = -Infinity;
  let autoPilot = false;
  let autoX = 0;
  let autoY = 0;
  let autoVX = 0;
  let autoVY = 0;
  let raf = 0;
  let lane = null;
  let meterShown = -1;
  const pulses = [];
  const meter = document.getElementById("hero-meter-count");
  const signal = document.getElementById("hero-signal");
  const laneButtons = [...scene.querySelectorAll(".hero-lanes button")];
  const defaultSignal = signal?.textContent || "";

  const washes = [
    { x: 0.22, y: 0.32, r: 0.5, hue: "b", vx: 0.01, vy: 0.006, phase: 0 },
    { x: 0.8, y: 0.24, r: 0.42, hue: "a", vx: -0.008, vy: 0.009, phase: 2.1 },
    { x: 0.6, y: 0.85, r: 0.4, hue: "a", vx: 0.007, vy: -0.007, phase: 4.3 },
  ];

  const toRgb = (hex) => {
    const clean = hex.replace("#", "").trim();
    if (clean.length !== 6) return "46,197,255";
    return `${parseInt(clean.slice(0, 2), 16)},${parseInt(clean.slice(2, 4), 16)},${parseInt(clean.slice(4, 6), 16)}`;
  };

  const buildField = () => {
    const count = Math.max(46, Math.min(Math.round((width * height) / 15000), 132));
    nodes = [];
    for (let i = 0; i < count; i += 1) {
      const hub = Math.random() < 0.14;
      nodes.push({
        hx: Math.random() * width,
        hy: Math.random() * height,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
        amp: 8 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
        size: hub ? 2.4 + Math.random() * 1.4 : 1 + Math.random() * 1.2,
        hub,
      });
    }
  };

  const resize = () => {
    const rect = scene.getBoundingClientRect();
    const nextW = rect.width;
    const nextH = rect.height;
    if (Math.abs(nextW - width) < 1 && Math.abs(nextH - height) < 1) return;
    width = nextW;
    height = nextH;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(Math.round(width * dpr), 1);
    canvas.height = Math.max(Math.round(height * dpr), 1);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildField();
    render(0, true);
  };

  const updateAutoPilot = (now) => {
    const rect = scene.getBoundingClientRect();
    const visLeft = Math.max(0, rect.left);
    const visRight = Math.min(window.innerWidth, rect.right);
    const visTop = Math.max(0, rect.top);
    const visBottom = Math.min(window.innerHeight, rect.bottom);
    if (visRight <= visLeft || visBottom <= visTop) return;
    const minX = visLeft + (visRight - visLeft) * 0.14;
    const maxX = visRight - (visRight - visLeft) * 0.14;
    const minY = visTop + (visBottom - visTop) * 0.16;
    const maxY = visBottom - (visBottom - visTop) * 0.16;
    if (!autoPilot) {
      const seedValid = px > -9000 && py > -9000;
      autoX = seedValid ? Math.min(Math.max(px, minX), maxX) : minX + (maxX - minX) * 0.5;
      autoY = seedValid ? Math.min(Math.max(py, minY), maxY) : minY + (maxY - minY) * 0.45;
      autoVX = 0;
      autoVY = 0;
      autoPilot = true;
    }
    autoVX = (autoVX + (Math.random() - 0.5) * 3.2) * 0.95;
    autoVY = (autoVY + (Math.random() - 0.5) * 3.2) * 0.95;
    const speed = Math.hypot(autoVX, autoVY);
    if (speed > 10) {
      autoVX = (autoVX / speed) * 10;
      autoVY = (autoVY / speed) * 10;
    }
    autoX += autoVX;
    autoY += autoVY;
    if (autoX < minX) {
      autoX = minX;
      autoVX = Math.abs(autoVX) * 0.6;
    } else if (autoX > maxX) {
      autoX = maxX;
      autoVX = -Math.abs(autoVX) * 0.6;
    }
    if (autoY < minY) {
      autoY = minY;
      autoVY = Math.abs(autoVY) * 0.6;
    } else if (autoY > maxY) {
      autoY = maxY;
      autoVY = -Math.abs(autoVY) * 0.6;
    }
    pxT = autoX;
    pyT = autoY;
    pointerInside = true;
    void now;
  };

  const step = () => {
    if (!reducedMotion && performance.now() - lastRealMoveAt > 1600) updateAutoPilot();
    else autoPilot = false;

    px += (pxT - px) * 0.24;
    py += (pyT - py) * 0.24;
    const field = scene.getBoundingClientRect();
    sx = px - field.left;
    sy = py - field.top;

    for (const pulse of pulses) pulse.age += 1;
    while (pulses.length && pulses[0].age > 36) pulses.shift();

    const mx = pointerInside ? px / window.innerWidth - 0.5 : 0;
    const my = pointerInside ? py / window.innerHeight - 0.5 : 0;
    scene.style.setProperty("--mx", mx.toFixed(3));
    scene.style.setProperty("--my", my.toFixed(3));

    if (!reducedMotion) {
      wordmark.querySelectorAll(".hero-wordmark-char").forEach((el) => {
        const body = el.querySelector(".hero-char-body");
        if (!body) return;
        if (!pointerInside) {
          body.style.transform = "";
          return;
        }
        const rect = el.getBoundingClientRect();
        const dx = px - (rect.left + rect.width / 2);
        const dy = py - (rect.top + rect.height / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const influence = Math.max(0, 1 - dist / 360);
        const mag = influence * 22;
        body.style.transform = `translate(${((dx / dist) * mag).toFixed(2)}px, ${((dy / dist) * mag).toFixed(2)}px)`;
      });
    }

    wordmark.querySelectorAll(".hero-block").forEach((block) => {
      if (pointerInside) {
        const rect = block.getBoundingClientRect();
        block.style.setProperty("--bx", `${(px - rect.left).toFixed(1)}px`);
        block.style.setProperty("--by", `${(py - rect.top).toFixed(1)}px`);
      } else {
        block.style.setProperty("--bx", "-999px");
        block.style.setProperty("--by", "-999px");
      }
    });

    if (!reducedMotion) {
      const heroTop = scene.getBoundingClientRect().top;
      const fade = Math.min(1, Math.max(0, -heroTop / Math.max(scene.offsetHeight, 1)));
      wordmark.style.opacity = String(1 - fade);
      wordmark.style.transform = `translateY(${(-8 * fade).toFixed(2)}%)`;
    }

    const t = performance.now() / 1000;
    const mr2 = mouseRadius * mouseRadius;
    const beacon = currentBeacon();
    let inReach = 0;
    for (const node of nodes) {
      const ax = Math.cos(t * 0.5 + node.phase) * node.amp;
      const ay = Math.sin(t * 0.42 + node.phase * 1.3) * node.amp;
      node.vx += (ax - node.ox) * 0.012;
      node.vy += (ay - node.oy) * 0.012;
      if (pointerInside) {
        const nx = node.hx + node.ox;
        const ny = node.hy + node.oy;
        const dx = nx - sx;
        const dy = ny - sy;
        const d2 = dx * dx + dy * dy;
        if (d2 < mr2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          inReach += 1;
          const force = (1 - d / mouseRadius) * 4.4;
          node.vx += (dx / d) * force;
          node.vy += (dy / d) * force;
        }
      }
      if (beacon) {
        const bx = node.hx + node.ox - beacon.x;
        const by = node.hy + node.oy - beacon.y;
        const bd = Math.hypot(bx, by);
        if (bd < 460 && bd > 10) {
          const pull = (1 - bd / 460) * 0.7;
          node.vx -= (bx / bd) * pull;
          node.vy -= (by / bd) * pull;
        }
      }
      for (const pulse of pulses) {
        const rdx = node.hx + node.ox - pulse.x;
        const rdy = node.hy + node.oy - pulse.y;
        const rd = Math.hypot(rdx, rdy) || 1;
        const ring = pulse.age * 16;
        const gap = Math.abs(rd - ring);
        if (gap < 56) {
          const kick = (1 - gap / 56) * 3.1;
          node.vx += (rdx / rd) * kick;
          node.vy += (rdy / rd) * kick;
        }
      }
      node.vx *= 0.86;
      node.vy *= 0.86;
      node.ox += node.vx;
      node.oy += node.vy;
    }
    if (meter && inReach !== meterShown) {
      meterShown = inReach;
      meter.textContent = String(inReach);
    }
  };

  const currentBeacon = () => {
    if (!lane) return null;
    const rect = scene.getBoundingClientRect();
    const spots = {
      web: [0.18, 0.62],
      cloud: [0.82, 0.3],
      flow: [0.5, 0.8],
    };
    const spot = spots[lane];
    if (!spot) return null;
    return { x: rect.width * spot[0], y: rect.height * spot[1] };
  };

  const render = (time, staticFrame) => {
    if (!width) return;
    const styles = getComputedStyle(document.documentElement);
    const rgbA = toRgb(styles.getPropertyValue("--accent") || "#2ec5ff");
    const rgbB = toRgb(styles.getPropertyValue("--accent-2") || "#4ea8e8");
    ctx.clearRect(0, 0, width, height);

    for (const wash of washes) {
      const drift = staticFrame ? 0 : time;
      const cx = (wash.x + Math.sin(drift * 0.05 + wash.phase) * wash.vx) * width;
      const cy = (wash.y + Math.cos(drift * 0.04 + wash.phase) * wash.vy) * height;
      const radius = wash.r * Math.max(width, height);
      const col = wash.hue === "a" ? rgbA : rgbB;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `rgba(${col},0.30)`);
      gradient.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    const live = nodes.map((node) => {
      const x = node.hx + node.ox;
      const y = node.hy + node.oy;
      let near = 0;
      if (pointerInside) {
        const d = Math.hypot(x - sx, y - sy);
        near = d < mouseRadius ? 1 - d / mouseRadius : 0;
      }
      return { x, y, hub: node.hub, size: node.size, near };
    });

    ctx.lineWidth = 1;
    for (let i = 0; i < live.length; i += 1) {
      for (let j = i + 1; j < live.length; j += 1) {
        const a = live[i];
        const b = live[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d >= linkDist) continue;
        const prox = 1 - d / linkDist;
        const boost = Math.max(a.near, b.near);
        const alpha = prox * (0.12 + boost * 0.5);
        if (alpha < 0.01) continue;
        ctx.strokeStyle = `rgba(${boost > 0.15 ? rgbA : rgbB},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    if (pointerInside) {
      for (const point of live) {
        if (point.near <= 0) continue;
        ctx.strokeStyle = `rgba(${rgbA},${(point.near * 0.55).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
    }

    for (const point of live) {
      const alpha = Math.min(1, (point.hub ? 0.7 : 0.42) + point.near * 0.5);
      const size = point.size + point.near * 1.6;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgbA},${alpha.toFixed(3)})`;
      ctx.fill();
    }

    const beacon = currentBeacon();
    if (beacon) {
      const pulse = staticFrame ? 0 : Math.sin(time * 3) * 5;
      ctx.beginPath();
      ctx.arc(beacon.x, beacon.y, 16 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgbA},0.9)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(beacon.x, beacon.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgbA},0.95)`;
      ctx.fill();
    }

    for (const pulse of pulses) {
      const alpha = Math.max(0, 1 - pulse.age / 36);
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.age * 16, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgbA},${(alpha * 0.75).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const applyLane = (button) => {
    lane = button ? button.dataset.lane : null;
    for (const item of laneButtons) {
      item.setAttribute("aria-checked", item === button ? "true" : "false");
    }
    if (signal) signal.textContent = button ? button.dataset.copy || defaultSignal : defaultSignal;
  };

  for (const button of laneButtons) {
    button.addEventListener("click", () => {
      applyLane(lane === button.dataset.lane ? null : button);
    });
  }

  scene.querySelector(".hero-lanes")?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const index = laneButtons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = laneButtons[(index + direction + laneButtons.length) % laneButtons.length];
    next.focus();
    applyLane(next);
  });

  scene.addEventListener("pointerdown", (event) => {
    if (reducedMotion || event.target.closest("button, a")) return;
    const rect = scene.getBoundingClientRect();
    if (pulses.length > 4) pulses.shift();
    pulses.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, age: 0 });
  });

  if (!reducedMotion) {
    scene.addEventListener("pointermove", (event) => {
      lastRealMoveAt = performance.now();
      pxT = event.clientX;
      pyT = event.clientY;
      pointerInside = true;
    });
    scene.addEventListener("pointerleave", () => {
      pointerInside = false;
      pxT = -9999;
      pyT = -9999;
      lastRealMoveAt = -Infinity;
    });
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      heroVisible = entry.isIntersecting;
      scene.classList.toggle("hero--offscreen", !entry.isIntersecting);
    },
    { threshold: 0 },
  );
  observer.observe(scene);

  const loop = (stamp) => {
    if (heroVisible) {
      step();
      render((stamp || 0) / 1000, reducedMotion);
    }
    raf = requestAnimationFrame(loop);
  };

  new ResizeObserver(resize).observe(scene);
  resize();
  if (reducedMotion) render(0, true);
  else raf = requestAnimationFrame(loop);

  window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
}
