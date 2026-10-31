/**
 * MADDALA KALYAN SAI PRASAD — GOLDEN MINIMALIST PORTFOLIO & ICP CLARITY LAB
 * Clean, High-Readability Architecture:
 * - Zero noisy full-screen wave animations behind text
 * - Minimal, attractive contained 3D Golden Orbital Sphere in Section 03 (#section-three-canvas)
 * - Smooth IntersectionObserver section reveal
 * - Direct Backend Launcher (opens app.html on Backend)
 */

document.addEventListener("DOMContentLoaded", () => {
  // ===========================================================================
  // 1. PRESETS & STANDALONE BACKEND CONFIGURATION
  // ===========================================================================

  const BRIEF_PRESETS = {
    wispr_flow: {
      archetype: "Founders, CTOs & Staff Engineers",
      brief:
        "We are scaling Wispr Flow, a voice-first dictation and AI productivity platform for high-output builders, software engineers, founders, and product teams in India and globally. We help engineers and operators speak architectural specs, code reviews, PR descriptions, and customer comms 4x faster than typing. We want to identify fast-growing tech startups, AI engineering teams, and developer communities in India and remote B2B orgs where documentation velocity is a bottleneck, while avoiding traditional slow-moving legacy enterprises."
    },
    kriu_hiring: {
      archetype: "Engineering Leaders & CTOs",
      brief:
        "I am building KRIU (trykriu.com), an AI-powered candidate verification and technical evaluation platform for B2B tech companies and scaling startups. We help hiring managers and tech leads audit resume claims against real-world GitHub repositories and work artifacts, replacing rigid keyword filters with plain-English hiring bars and 30-second evidence decks. We focus on funded startups and product companies in India and remote teams actively hiring engineers."
    },
    solar_telangana: {
      archetype: "Plant Heads & Operations Directors",
      brief:
        "I provide commercial solar installations to manufacturing companies in Telangana. I am interested in companies with suitable industrial facilities and high electricity consumption. I prefer businesses that are expanding or upgrading facilities. I do not want residential customers or small retail shops."
    },
    workflow_automation: {
      archetype: "VP of Operations & Logistics Heads",
      brief:
        "I provide custom AI and process automation for mid-sized logistics and distribution companies in India and SEA. We automate invoice processing, warehouse dispatch updates, and exception reporting. We do not work with early-stage non-revenue startups or companies with fewer than 20 operations staff."
    },
    tech_agency: {
      archetype: "Founders & Co-Founders",
      brief:
        "We run a specialized recruitment agency placing senior backend and AI engineers for series-A to series-C startups. We do not do mass volume hiring or generic IT staffing. We want founders and CTOs who are tired of receiving 500 unqualified resumes from traditional job boards."
    }
  };

  let activePresetKey = "wispr_flow";
  const urlQuery = new URLSearchParams(window.location.search);
  const queryBackend = urlQuery.get("backend");
  if (queryBackend) {
    localStorage.setItem("icp_backend_url", queryBackend.replace(/\/+$/, ""));
  }

  // Centralized Backend URL constant (update here when deployed to Cloud Run)
  const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

  function resolveDefaultBackendUrl() {
    const saved = localStorage.getItem("icp_backend_url");
    if (saved) return saved.replace(/\/+$/, "");

    if (DEFAULT_BACKEND_URL && DEFAULT_BACKEND_URL !== "http://127.0.0.1:8000") {
      return DEFAULT_BACKEND_URL.replace(/\/+$/, "");
    }

    if (window.location.protocol.startsWith("http")) {
      return window.location.origin;
    }
    return DEFAULT_BACKEND_URL;
  }

  let backendBaseUrl = resolveDefaultBackendUrl();
  const endpointInput = document.getElementById("backend-endpoint-input");
  const backendStatusDot = document.getElementById("backend-status-dot");
  const backendStatusText = document.getElementById("backend-status-text");

  if (endpointInput) {
    endpointInput.value = backendBaseUrl;
    endpointInput.addEventListener("change", () => {
      const cleaned = endpointInput.value.trim().replace(/\/+$/, "");
      if (cleaned) {
        backendBaseUrl = cleaned;
        localStorage.setItem("icp_backend_url", backendBaseUrl);
        pingBackendHealth();
      }
    });
  }

  async function pingBackendHealth() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${backendBaseUrl}/api/health`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (backendStatusDot) {
          backendStatusDot.style.background = "#34D399";
        }
        if (backendStatusText) {
          backendStatusText.textContent = `Backend Online (${data.unblocked_sources_count || 52} OSINT Feeds Ready)`;
          backendStatusText.style.color = "#34D399";
        }
        return;
      }
    } catch (_) {
      if (backendBaseUrl === window.location.origin && window.location.port !== "8000") {
        try {
          const r2 = await fetch("http://127.0.0.1:8000/api/health");
          if (r2.ok) {
            backendBaseUrl = "http://127.0.0.1:8000";
            if (endpointInput) endpointInput.value = backendBaseUrl;
            if (backendStatusDot) backendStatusDot.style.background = "#34D399";
            if (backendStatusText) {
              backendStatusText.textContent = "Local Backend Online (127.0.0.1:8000)";
              backendStatusText.style.color = "#34D399";
            }
            return;
          }
        } catch (_e2) {}
      }
    }

    if (backendStatusDot) {
      backendStatusDot.style.background = "#D4AF37";
    }
    if (backendStatusText) {
      backendStatusText.textContent = "Ready to Launch Backend Workbench";
      backendStatusText.style.color = "#F3E5AB";
    }
  }

  pingBackendHealth();

  function buildWorkbenchUrl(customBrief, presetKey) {
    const base = (endpointInput?.value || backendBaseUrl || DEFAULT_BACKEND_URL)
      .trim()
      .replace(/\/+$/, "");
    const params = new URLSearchParams();
    if (customBrief) params.set("brief", customBrief);
    if (presetKey) params.set("preset", presetKey);
    const qs = params.toString();
    return `${base}/${qs ? "?" + qs : ""}`;
  }

  document.querySelectorAll(".js-launch-workbench").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const preset = btn.dataset.preset || activePresetKey;
      const briefText =
        document.getElementById("hero-brief-input")?.value.trim() ||
        BRIEF_PRESETS[preset]?.brief ||
        "";
      try {
        if (briefText) sessionStorage.setItem("icp_pending_brief", briefText);
      } catch (_) {}
      window.location.href = buildWorkbenchUrl(briefText, preset);
    });
  });

  // ===========================================================================
  // 2. INTERACTIVE BRIEF PRESETS & 1-CLICK EMAIL COPY
  // ===========================================================================

  const briefTextarea = document.getElementById("hero-brief-input");
  if (briefTextarea) {
    briefTextarea.value = BRIEF_PRESETS[activePresetKey].brief;
  }

  document.querySelectorAll(".gold-preset-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".gold-preset-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const key = chip.dataset.preset;
      if (BRIEF_PRESETS[key] && briefTextarea) {
        activePresetKey = key;
        briefTextarea.value = BRIEF_PRESETS[key].brief;
      }
    });
  });

  document.querySelectorAll(".js-copy-email").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const email = "kalyanprasadmaddala@gmail.com";
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email);
      }
      const feedbackEl = el.querySelector(".js-email-label") || el;
      const original = feedbackEl.textContent;
      feedbackEl.textContent = "✓ Copied: kalyanprasadmaddala@gmail.com";
      setTimeout(() => {
        feedbackEl.textContent = original;
      }, 2200);
    });
  });

  // ===========================================================================
  // 3. SMOOTH SECTION SCROLL-REVEAL & HUD SCROLL SPY
  // ===========================================================================

  const revealSections = document.querySelectorAll(".reveal-section");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.08 }
    );
    revealSections.forEach((sec) => observer.observe(sec));
  } else {
    revealSections.forEach((sec) => sec.classList.add("is-visible"));
  }

  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".hud-link");

  window.addEventListener(
    "scroll",
    () => {
      let currentId = "";
      const scrollY = window.scrollY + 180;
      sections.forEach((sec) => {
        if (scrollY >= sec.offsetTop) {
          currentId = sec.getAttribute("id");
        }
      });
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${currentId}`);
      });
    },
    { passive: true }
  );

  // ===========================================================================
  // 4. MINIMAL CONTAINED THREE.JS 3D GOLDEN ORBITAL SPHERE (IN SECTION 03 ONLY)
  // ===========================================================================

  const canvas = document.getElementById("section-three-canvas");
  if (!canvas || typeof THREE === "undefined") {
    return;
  }

  const container = canvas.parentElement;
  const width = container.clientWidth || 380;
  const height = container.clientHeight || 210;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 11.5);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const group = new THREE.Group();
  scene.add(group);

  // Minimal Golden Wireframe Geodesic Sphere
  const sphereGeo = new THREE.IcosahedronGeometry(3.3, 2);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0xd4af37,
    wireframe: true,
    transparent: true,
    opacity: 0.25
  });
  const wireframeSphere = new THREE.Mesh(sphereGeo, sphereMat);
  group.add(wireframeSphere);

  // 52 Golden Orbital Nodes (Representing the 52 Public OSINT Sources)
  const nodeCount = 52;
  const nodePositions = new Float32Array(nodeCount * 3);
  for (let i = 0; i < nodeCount; i++) {
    const phi = Math.acos(-1 + (2 * i) / nodeCount);
    const theta = Math.sqrt(nodeCount * Math.PI) * phi;
    const r = 3.35;
    nodePositions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
    nodePositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
    nodePositions[i * 3 + 2] = r * Math.cos(phi);
  }
  const nodesGeo = new THREE.BufferGeometry();
  nodesGeo.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
  const nodesMat = new THREE.PointsMaterial({
    color: 0xf3e5ab,
    size: 0.14,
    transparent: true,
    opacity: 0.9
  });
  const nodesPoints = new THREE.Points(nodesGeo, nodesMat);
  group.add(nodesPoints);

  // Outer Minimal Equatorial Golden Ring
  const ringGeo = new THREE.RingGeometry(4.35, 4.42, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf3e5ab,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35
  });
  const equatorialRing = new THREE.Mesh(ringGeo, ringMat);
  equatorialRing.rotation.x = 1.15;
  equatorialRing.rotation.y = 0.25;
  group.add(equatorialRing);

  let targetRotX = 0;
  let targetRotY = 0;

  container.addEventListener("mousemove", (e) => {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    targetRotY = nx * 0.6;
    targetRotX = ny * 0.4;
  });

  container.addEventListener("mouseleave", () => {
    targetRotX = 0;
    targetRotY = 0;
  });

  window.addEventListener("resize", () => {
    const w = container.clientWidth || 380;
    const h = container.clientHeight || 210;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  function animateOrbital() {
    requestAnimationFrame(animateOrbital);
    wireframeSphere.rotation.y += 0.0035;
    nodesPoints.rotation.y += 0.0035;
    equatorialRing.rotation.z -= 0.004;

    group.rotation.x += (targetRotX - group.rotation.x) * 0.06;
    group.rotation.y += (targetRotY - group.rotation.y) * 0.06;

    renderer.render(scene, camera);
  }

  animateOrbital();
});
