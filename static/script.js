/**
 * NeuraScan AI — script.js
 * ═══════════════════════════════════════════════════════════════
 * Handles:
 *  1. Animated particle background
 *  2. Navbar scroll behaviour
 *  3. Mobile hamburger menu
 *  4. Drag-and-drop + file-picker upload
 *  5. Image preview
 *  6. Detect button → POST to Flask → render result
 *  7. Animated counter numbers
 *  8. Scroll-reveal (IntersectionObserver)
 */

/* ═══════════════════════════════════════════════════════════════
   1. PARTICLE CANVAS
═══════════════════════════════════════════════════════════════ */
(function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Resize canvas to fill the viewport
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // Particle factory
  const PARTICLE_COUNT = 70;
  const particles = [];

  function randomBetween(a, b) { return a + Math.random() * (b - a); }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x    = randomBetween(0, canvas.width);
      this.y    = randomBetween(0, canvas.height);
      this.r    = randomBetween(.8, 2.4);
      this.vx   = randomBetween(-.25, .25);
      this.vy   = randomBetween(-.25, .25);
      this.alpha = randomBetween(.15, .55);
      // Alternate blue / purple dots
      this.color = Math.random() > .5 ? "59,130,246" : "168,85,247";
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      // Wrap around edges
      if (this.x < -10) this.x = canvas.width  + 10;
      if (this.x > canvas.width  + 10) this.x = -10;
      if (this.y < -10) this.y = canvas.height + 10;
      if (this.y > canvas.height + 10) this.y = -10;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  // Draw connecting lines between nearby particles
  function drawConnections() {
    const MAX_DIST = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * .08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
          ctx.lineWidth = .5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animate);
  }
  animate();
})();


/* ═══════════════════════════════════════════════════════════════
   2. NAVBAR — add .scrolled class after scrolling 60 px
═══════════════════════════════════════════════════════════════ */
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 60);
});


/* ═══════════════════════════════════════════════════════════════
   3. MOBILE HAMBURGER MENU
═══════════════════════════════════════════════════════════════ */
const hamburger = document.getElementById("hamburger");
const navLinks  = document.getElementById("navLinks");

if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
  // Close menu on link click
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });
}


/* ═══════════════════════════════════════════════════════════════
   4. FILE UPLOAD — drag & drop + browse
═══════════════════════════════════════════════════════════════ */
const dropZone    = document.getElementById("dropZone");
const fileInput   = document.getElementById("fileInput");
const detectBtn   = document.getElementById("detectBtn");
const dropDefault = document.getElementById("dropDefault");
const dropPreview = document.getElementById("dropPreview");
const previewImg  = document.getElementById("previewImg");
const previewName = document.getElementById("previewName");
const removeBtn   = document.getElementById("removeBtn");

let selectedFile = null;  // Holds the currently selected File object

// ── Click to open file picker ─────────────────────────────────
dropZone.addEventListener("click", (e) => {
  // Don't open picker when clicking the remove button
  if (e.target.closest("#removeBtn")) return;
  if (dropPreview.style.display !== "none") return; // image already shown
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

// ── Drag and drop ──────────────────────────────────────────────
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// ── Process the file ───────────────────────────────────────────
function handleFile(file) {
  // Basic type check
  if (!file.type.startsWith("image/")) {
    alert("Please upload a valid image file (PNG, JPG, JPEG).");
    return;
  }
  selectedFile = file;

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewName.textContent = file.name.length > 28
      ? file.name.slice(0, 25) + "…"
      : file.name;
    dropDefault.style.display = "none";
    dropPreview.style.display = "block";
    detectBtn.disabled = false;
  };
  reader.readAsDataURL(file);

  // Reset result panel to idle
  showResultState("idle");
}

// ── Remove image ───────────────────────────────────────────────
if (removeBtn) {
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    resetUpload();
  });
}

function resetUpload() {
  selectedFile = null;
  fileInput.value = "";
  previewImg.src = "";
  dropDefault.style.display = "block";
  dropPreview.style.display = "none";
  detectBtn.disabled = true;
  showResultState("idle");
}


/* ═══════════════════════════════════════════════════════════════
   5. RESULT PANEL — state machine
   States: "idle" | "loading" | "output" | "error"
═══════════════════════════════════════════════════════════════ */
function showResultState(state) {
  document.getElementById("resultIdle").style.display    = state === "idle"    ? "block" : "none";
  document.getElementById("resultLoading").style.display = state === "loading" ? "block" : "none";
  document.getElementById("resultOutput").style.display  = state === "output"  ? "block" : "none";
  document.getElementById("resultError").style.display   = state === "error"   ? "block" : "none";
}


/* ═══════════════════════════════════════════════════════════════
   6. DETECT BUTTON — send image to Flask, render result
═══════════════════════════════════════════════════════════════ */
detectBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  // Show loading state
  showResultState("loading");
  animateLoadingSteps();

  // Build form data
  const formData = new FormData();
  formData.append("mri_image", selectedFile);

  try {
    const response = await fetch("/predict", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      // Show error
      document.getElementById("errorMsg").textContent = data.error || "Unknown server error.";
      showResultState("error");
      return;
    }

    // Render result
    renderResult(data);

  } catch (err) {
    document.getElementById("errorMsg").textContent =
      "Could not reach the server. Please make sure Flask is running.";
    showResultState("error");
  }
});


/* ═══════════════════════════════════════════════════════════════
   ANIMATED LOADING STEPS
═══════════════════════════════════════════════════════════════ */
function animateLoadingSteps() {
  const steps = ["step1", "step2", "step3"];
  let current = 0;

  // Reset steps
  steps.forEach(id => {
    const el = document.getElementById(id);
    el.className = "step";
  });
  document.getElementById(steps[0]).classList.add("active");

  const timer = setInterval(() => {
    if (current < steps.length - 1) {
      document.getElementById(steps[current]).classList.replace("active", "done");
      current++;
      document.getElementById(steps[current]).classList.add("active");
    } else {
      clearInterval(timer);
    }
  }, 900);
}


/* ═══════════════════════════════════════════════════════════════
   RENDER RESULT DATA
═══════════════════════════════════════════════════════════════ */
function renderResult(data) {
  const badge   = document.getElementById("resultBadge");
  const label   = document.getElementById("resultLabel");
  const confVal = document.getElementById("confValue");
  const confFill = document.getElementById("confFill");
  const message = document.getElementById("resultMessage");
  const demo    = document.getElementById("demoNotice");

  // Badge
  if (data.tumor_detected) {
    badge.className = "result-badge tumor";
    badge.innerHTML = "⚠️ Tumor Detected";
    label.style.color = "#f87171";
  } else {
    badge.className = "result-badge no-tumor";
    badge.innerHTML = "✅ No Tumor Detected";
    label.style.color = "#34d399";
  }

  // Label
  label.textContent = data.label;

  // Confidence bar (animate after a short delay so CSS transition fires)
  setTimeout(() => {
    confFill.style.width = data.confidence + "%";
    confVal.textContent  = data.confidence + "%";
    // Change fill colour for very high or low confidence
    if (data.confidence >= 90) {
      confFill.style.background = "linear-gradient(90deg, #3b82f6, #a855f7)";
    } else if (data.confidence >= 70) {
      confFill.style.background = "linear-gradient(90deg, #3b82f6, #06b6d4)";
    } else {
      confFill.style.background = "linear-gradient(90deg, #64748b, #3b82f6)";
    }
  }, 100);

  // Confidence bar fills start at 0 (reset it first)
  confFill.style.width   = "0%";
  confFill.style.transition = "none";
  void confFill.offsetWidth; // force reflow
  confFill.style.transition = "width 1.2s cubic-bezier(.4,0,.2,1)";

  // Message
  message.textContent = data.message;

  // Demo notice
  demo.style.display = data.demo_mode ? "flex" : "none";

  showResultState("output");
}


/* ═══════════════════════════════════════════════════════════════
   SCAN AGAIN / RETRY BUTTONS
═══════════════════════════════════════════════════════════════ */
document.getElementById("scanAgainBtn").addEventListener("click", resetUpload);
document.getElementById("retryBtn").addEventListener("click", resetUpload);


/* ═══════════════════════════════════════════════════════════════
   7. ANIMATED COUNTERS (runs once when element enters viewport)
═══════════════════════════════════════════════════════════════ */
function animateCounter(el) {
  const target   = parseFloat(el.dataset.target);
  const isFloat  = target % 1 !== 0;
  const duration = 2000; // ms
  const start    = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const value  = target * eased;

    el.textContent = isFloat
      ? value.toFixed(1)
      : Math.floor(value).toLocaleString();

    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Watch all [data-target] elements
const counterEls = document.querySelectorAll("[data-target]");
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);  // Only animate once
    }
  });
}, { threshold: .3 });

counterEls.forEach(el => counterObserver.observe(el));


/* ═══════════════════════════════════════════════════════════════
   8. SCROLL REVEAL — .fade-up elements
═══════════════════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12, rootMargin: "0px 0px -40px 0px" });

document.querySelectorAll(".fade-up").forEach(el => revealObserver.observe(el));
