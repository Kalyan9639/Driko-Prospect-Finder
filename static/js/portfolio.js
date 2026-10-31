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
  // 4. THREE.JS 3D KINETIC NEURAL ASTROLABE (HERO) & GEODESIC TOPOLOGY (SEC 03)
  // ===========================================================================

  function setupThreeScenes() {
    if (typeof THREE === "undefined") {
      let retries = 0;
      const checkTimer = setInterval(() => {
        retries++;
        if (typeof THREE !== "undefined") {
          clearInterval(checkTimer);
          initHeroThreeNexus();
          initSectionThreeCanvas();
        } else if (retries > 30) {
          clearInterval(checkTimer);
        }
      }, 80);
      return;
    }
    initHeroThreeNexus();
    initSectionThreeCanvas();
  }

  // -------------------------------------------------------------------------
  // Hero Centerpiece: 3D Kinetic Neural Astrolabe & Quantum Core
  // -------------------------------------------------------------------------
  function initHeroThreeNexus() {
    const canvas = document.getElementById("hero-three-canvas");
    if (!canvas) return;

    const container = canvas.parentElement;
    let width = container.clientWidth || 640;
    let height = container.clientHeight || 290;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 11.2);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Illumination
    const ambLight = new THREE.AmbientLight(0xfff6e0, 1.4);
    scene.add(ambLight);

    const pLight1 = new THREE.PointLight(0xd4af37, 3.5, 40);
    pLight1.position.set(12, 10, 14);
    scene.add(pLight1);

    const pLight2 = new THREE.PointLight(0xf3e5ab, 2.5, 40);
    pLight2.position.set(-12, -8, 10);
    scene.add(pLight2);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. Central Glowing Crystal Core (Icosahedron + Wireframe)
    const coreGeo = new THREE.IcosahedronGeometry(1.65, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.18,
      transparent: true,
      opacity: 0.65
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    masterGroup.add(coreMesh);

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xf3e5ab,
      wireframe: true,
      transparent: true,
      opacity: 0.95
    });
    const wireMesh = new THREE.Mesh(coreGeo, wireMat);
    wireMesh.scale.set(1.015, 1.015, 1.015);
    masterGroup.add(wireMesh);

    // 2. Triple Astrolabe Gyroscopic Rings
    // Ring 1 (Inner)
    const ring1Geo = new THREE.TorusGeometry(2.45, 0.042, 16, 90);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2
    });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat1);
    masterGroup.add(ring1);

    // Ring 2 (Middle) with 8 orbital indicator beads
    const ring2Geo = new THREE.TorusGeometry(3.25, 0.042, 16, 90);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xf3e5ab,
      metalness: 0.85,
      roughness: 0.25
    });
    const ring2 = new THREE.Mesh(ring2Geo, ringMat2);
    ring2.rotation.x = 1.15;
    ring2.rotation.y = 0.45;
    masterGroup.add(ring2);

    // Orbital beads on Ring 2
    const beadGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const beadMat = new THREE.MeshBasicMaterial({ color: 0xf3e5ab });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const bead = new THREE.Mesh(beadGeo, beadMat);
      bead.position.set(Math.cos(angle) * 3.25, Math.sin(angle) * 3.25, 0);
      ring2.add(bead);
    }

    // Ring 3 (Outer Equatorial Astrolabe)
    const ring3Geo = new THREE.TorusGeometry(4.1, 0.046, 16, 100);
    const ringMat3 = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.15
    });
    const ring3 = new THREE.Mesh(ring3Geo, ringMat3);
    ring3.rotation.x = 0.55;
    masterGroup.add(ring3);

    // 3. 52 Golden OSINT Satellite Nodes
    const nodeCount = 52;
    const nodePositions = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      const r = 3.65 + Math.sin(i * 1.5) * 0.45;
      nodePositions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
      nodePositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      nodePositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const nodesGeo = new THREE.BufferGeometry();
    nodesGeo.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    const nodesMat = new THREE.PointsMaterial({
      color: 0xf3e5ab,
      size: 0.15,
      transparent: true,
      opacity: 0.95
    });
    const nodesPoints = new THREE.Points(nodesGeo, nodesMat);
    masterGroup.add(nodesPoints);

    // 4. Subtle Ambient Cosmic Dust
    const dustCount = 80;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 12;
      dustPositions[i + 1] = (Math.random() - 0.5) * 8;
      dustPositions[i + 2] = (Math.random() - 0.5) * 8;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xd4af37,
      size: 0.08,
      transparent: true,
      opacity: 0.45
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // Interactive Drag & Hover Orbit Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotX = 0.12;
    let targetRotY = -0.25;
    let curRotX = targetRotX;
    let curRotY = targetRotY;

    container.addEventListener("pointerdown", (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener("pointerup", () => {
      isDragging = false;
    });

    container.addEventListener("pointermove", (e) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        targetRotY += deltaX * 0.01;
        targetRotX += deltaY * 0.01;
      } else {
        targetRotY = normX * 0.75;
        targetRotX = normY * 0.5;
      }
    });

    container.addEventListener("pointerleave", () => {
      if (!isDragging) {
        targetRotX = 0.08;
        targetRotY = 0.05;
      }
    });

    function resizeHero() {
      if (!container || !renderer) return;
      width = container.clientWidth || 640;
      height = container.clientHeight || 290;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    window.addEventListener("resize", resizeHero);
    if (window.ResizeObserver) {
      new ResizeObserver(resizeHero).observe(container);
    }

    let clock = 0;
    function animateHero() {
      requestAnimationFrame(animateHero);
      clock += 0.012;

      // Internal kinetic counter-rotations
      coreMesh.rotation.y += 0.006;
      wireMesh.rotation.y += 0.006;
      coreMesh.rotation.x += 0.003;
      wireMesh.rotation.x += 0.003;

      ring1.rotation.z += 0.012;
      ring1.rotation.x += 0.006;

      ring2.rotation.z -= 0.008;

      ring3.rotation.y += 0.007;
      ring3.rotation.z += 0.004;

      nodesPoints.rotation.y += 0.0035;
      dustPoints.rotation.y -= 0.001;

      // Gentle breathing pulse on core
      const pulseScale = 1 + Math.sin(clock * 2) * 0.04;
      coreMesh.scale.set(pulseScale, pulseScale, pulseScale);
      wireMesh.scale.set(pulseScale * 1.015, pulseScale * 1.015, pulseScale * 1.015);

      // Smooth camera/group inertia
      curRotX += (targetRotX - curRotX) * 0.08;
      curRotY += (targetRotY - curRotY) * 0.08;

      masterGroup.rotation.x = curRotX;
      masterGroup.rotation.y = curRotY + Math.sin(clock * 0.6) * 0.15;

      renderer.render(scene, camera);
    }

    animateHero();
  }

  // -------------------------------------------------------------------------
  // Section 03 Contained Stage: 3D Geodesic OSINT Network
  // -------------------------------------------------------------------------
  function initSectionThreeCanvas() {
    const canvas = document.getElementById("section-three-canvas");
    if (!canvas) return;

    const container = canvas.parentElement;
    let width = container.clientWidth || 380;
    let height = container.clientHeight || 210;

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
      opacity: 0.35
    });
    const wireframeSphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(wireframeSphere);

    // 52 Golden Orbital Nodes
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
      size: 0.18,
      transparent: true,
      opacity: 0.95
    });
    const nodesPoints = new THREE.Points(nodesGeo, nodesMat);
    group.add(nodesPoints);

    // Outer Minimal Equatorial Golden Ring
    const ringGeo = new THREE.RingGeometry(4.35, 4.45, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf3e5ab,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const equatorialRing = new THREE.Mesh(ringGeo, ringMat);
    equatorialRing.rotation.x = 1.15;
    equatorialRing.rotation.y = 0.25;
    group.add(equatorialRing);

    let targetRotX = 0;
    let targetRotY = 0;

    container.addEventListener("pointermove", (e) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = nx * 0.65;
      targetRotX = ny * 0.45;
    });

    container.addEventListener("pointerleave", () => {
      targetRotX = 0;
      targetRotY = 0;
    });

    function resizeSecThree() {
      if (!container || !renderer) return;
      width = container.clientWidth || 380;
      height = container.clientHeight || 210;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    window.addEventListener("resize", resizeSecThree);
    if (window.ResizeObserver) {
      new ResizeObserver(resizeSecThree).observe(container);
    }

    function animateOrbital() {
      requestAnimationFrame(animateOrbital);
      wireframeSphere.rotation.y += 0.004;
      nodesPoints.rotation.y += 0.004;
      equatorialRing.rotation.z -= 0.0045;

      group.rotation.x += (targetRotX - group.rotation.x) * 0.06;
      group.rotation.y += (targetRotY - group.rotation.y) * 0.06;

      renderer.render(scene, camera);
    }

    animateOrbital();
  }

  setupThreeScenes();
});
