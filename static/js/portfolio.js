/**
 * MADDALA KALYAN SAI PRASAD — GOLDEN MINIMALIST PORTFOLIO & ICP CLARITY LAB
 * Pure Vanilla JS + CDN Three.js (Zero Node/React Build Dependency)
 *
 * Features:
 * 1. Three.js 3D Golden Acoustic Wave -> 52-Node OSINT Constellation Morphing
 * 2. Live Voice / Cursor Ripple Visualizer (Web Audio API + Simulated Voice Fallback)
 * 3. Decoupled Backend Connector (Opens app.html on Backend with Cross-Domain ?brief= Handoff)
 * 4. Interactive Wispr Flow India Growth Playbook & 1-Click Contact Copy
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

  // Determine initial Backend URL for opening app.html
  function resolveDefaultBackendUrl() {
    const saved = localStorage.getItem("icp_backend_url");
    if (saved) return saved.replace(/\/+$/, "");

    // If served directly from FastAPI on localhost or Cloud Run, use current origin
    if (window.location.protocol.startsWith("http")) {
      return window.location.origin;
    }
    // When opened via file:// or separate static host without config, default to local FastAPI port 8000
    return "http://127.0.0.1:8000";
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
          backendStatusDot.style.boxShadow = "0 0 10px #34D399";
        }
        if (backendStatusText) {
          backendStatusText.textContent = `Backend Online (${data.unblocked_sources_count || 52} OSINT Feeds Ready)`;
          backendStatusText.style.color = "#34D399";
        }
        return;
      }
    } catch (_) {
      // Fallback check if hosted on a separate static server and local 8000 is running
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
      backendStatusText.textContent = "Standalone Mode (Starts app.html on Launch)";
      backendStatusText.style.color = "#F3E5AB";
    }
  }

  pingBackendHealth();

  // Build target app.html URL for launching the workbench
  function buildWorkbenchUrl(customBrief, presetKey) {
    if (window.location.protocol === "file:") {
      const params = new URLSearchParams();
      if (customBrief) params.set("brief", customBrief);
      if (presetKey) params.set("preset", presetKey);
      const qs = params.toString();
      return `app.html${qs ? "?" + qs : ""}`;
    }

    const base = (endpointInput?.value || backendBaseUrl || "http://127.0.0.1:8000")
      .trim()
      .replace(/\/+$/, "");
    const params = new URLSearchParams();
    if (customBrief) params.set("brief", customBrief);
    if (presetKey) params.set("preset", presetKey);
    const qs = params.toString();
    // Since backend root (/) directly opens app.html, we can target base + "/app" or base + "/"
    return `${base}/app${qs ? "?" + qs : ""}`;
  }

  // Wire all direct "Launch App" buttons
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
  // 2. INTERACTIVE BRIEF BRIDGE & PRESET CHIPS (ACT II)
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

  // ===========================================================================
  // 3. WISPR FLOW INDIA GROWTH PLAYBOOK TABS
  // ===========================================================================

  const playbookBtns = document.querySelectorAll(".playbook-tab-btn");
  const playbookPanels = document.querySelectorAll(".playbook-panel");

  playbookBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      playbookBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      playbookPanels.forEach((p) => {
        p.classList.toggle("active", p.id === targetId);
      });
    });
  });

  // ===========================================================================
  // 4. 1-CLICK EMAIL COPY & NAVIGATION SPY
  // ===========================================================================

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

  // Smooth Section Spy for HUD Nav
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
  // 5. LIVE VOICE / AUDIO RIPPLE VISUALIZER (HERO WIDGET + THREE.JS)
  // ===========================================================================

  let voiceEnergy = 0.15;
  let voiceModeActive = false;
  let audioContext = null;
  let analyser = null;
  let micDataArray = null;
  let simulatedPulseTimer = null;

  const voiceBtn = document.getElementById("btn-toggle-voice-ripple");
  const voiceStatusLabel = document.getElementById("voice-mode-status");
  const voiceBars = document.querySelectorAll(".voice-bar");

  function updateVoiceBarsUI(energy) {
    if (!voiceBars.length) return;
    const now = performance.now() * 0.006;
    voiceBars.forEach((bar, idx) => {
      const wave = Math.sin(now + idx * 0.55) * 0.5 + 0.5;
      const base = voiceModeActive ? 28 + energy * 68 * wave : 16 + wave * 22;
      bar.style.height = `${Math.min(100, Math.max(14, base))}%`;
    });
  }

  async function toggleVoiceRipple() {
    if (voiceModeActive) {
      voiceModeActive = false;
      voiceEnergy = 0.15;
      if (simulatedPulseTimer) clearInterval(simulatedPulseTimer);
      if (audioContext && audioContext.state !== "closed") {
        try {
          await audioContext.close();
        } catch (_) {}
      }
      audioContext = null;
      analyser = null;
      if (voiceBtn) voiceBtn.textContent = "🎙️ Test Live Voice Wave";
      if (voiceStatusLabel) voiceStatusLabel.textContent = "Acoustic Horizon: Idle";
      return;
    }

    voiceModeActive = true;
    if (voiceBtn) voiceBtn.textContent = "⏹ Stop Voice Ripple";

    // Attempt client-side microphone frequency reading; fallback to simulated dictation cadence
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      micDataArray = new Uint8Array(analyser.frequencyBinCount);
      if (voiceStatusLabel) {
        voiceStatusLabel.textContent = "Live Mic Active: Speak to Ripple 3D Field";
        voiceStatusLabel.style.color = "#34D399";
      }
    } catch (_) {
      // Simulated Wispr Flow voice dictation cadence when mic is unavailable/declined
      if (voiceStatusLabel) {
        voiceStatusLabel.textContent = "Simulated Voice Cadence Active (3D Ripple)";
        voiceStatusLabel.style.color = "#F3E5AB";
      }
      simulatedPulseTimer = setInterval(() => {
        const t = performance.now() * 0.004;
        voiceEnergy = 0.45 + 0.45 * Math.abs(Math.sin(t) * Math.cos(t * 1.7));
      }, 60);
    }
  }

  if (voiceBtn) {
    voiceBtn.addEventListener("click", toggleVoiceRipple);
  }

  // ===========================================================================
  // 6. THREE.JS GOLDEN MINIMALIST 3D ACOUSTIC WAVE -> OSINT CONSTELLATION
  // ===========================================================================

  const canvas = document.getElementById("three-acoustic-canvas");
  if (!canvas || typeof THREE === "undefined") {
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2.2, 26);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Create 312 Golden Nodes (6 filaments x 52 OSINT sources)
  const FILAMENTS = 6;
  const NODES_PER_FILAMENT = 52;
  const TOTAL_NODES = FILAMENTS * NODES_PER_FILAMENT;

  const positions = new Float32Array(TOTAL_NODES * 3);
  const colors = new Float32Array(TOTAL_NODES * 3);
  const waveTargets = new Float32Array(TOTAL_NODES * 3);
  const gridTargets = new Float32Array(TOTAL_NODES * 3);

  const colorGoldPrimary = new THREE.Color(0xd4af37);
  const colorGoldChampagne = new THREE.Color(0xf3e5ab);
  const colorGoldBurnished = new THREE.Color(0x9a7b1c);

  for (let f = 0; f < FILAMENTS; f++) {
    for (let n = 0; n < NODES_PER_FILAMENT; n++) {
      const idx = f * NODES_PER_FILAMENT + n;
      const i3 = idx * 3;

      // 1. Act I State: Organic Voice Frequency Ribbon along Horizon
      const xWave = (n / (NODES_PER_FILAMENT - 1) - 0.5) * 46;
      const zWave = (f - FILAMENTS / 2) * 2.6 - 4;
      const yWave = Math.sin(n * 0.22 + f * 0.6) * 1.4 - 4.5;

      waveTargets[i3] = xWave;
      waveTargets[i3 + 1] = yWave;
      waveTargets[i3 + 2] = zWave;

      // 2. Act II State: Structured 52-Source OSINT Constellation Sphere/Matrix
      const angle = (n / NODES_PER_FILAMENT) * Math.PI * 2;
      const radius = 8.5 + f * 2.1;
      const xGrid = Math.cos(angle + f * 0.25) * radius * 1.35;
      const yGrid = Math.sin(angle + f * 0.25) * (radius * 0.62) - 1.0;
      const zGrid = Math.sin(n * 0.4 + f) * 4.5 - 6;

      gridTargets[i3] = xGrid;
      gridTargets[i3 + 1] = yGrid;
      gridTargets[i3 + 2] = zGrid;

      positions[i3] = xWave;
      positions[i3 + 1] = yWave;
      positions[i3 + 2] = zWave;

      // Mix golden hues
      const c =
        n % 5 === 0
          ? colorGoldChampagne
          : f % 2 === 0
          ? colorGoldPrimary
          : colorGoldBurnished;
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.19,
    vertexColors: true,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(geometry, pointsMaterial);
  scene.add(particleSystem);

  // Subtle Golden Architectural Wireframe Ring in Far Background Periphery
  const ringGeo = new THREE.RingGeometry(13.5, 13.62, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xd4af37,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.11
  });
  const goldenRing = new THREE.Mesh(ringGeo, ringMat);
  goldenRing.position.set(11, 3.5, -12);
  goldenRing.rotation.x = 0.45;
  goldenRing.rotation.y = -0.35;
  scene.add(goldenRing);

  const innerRingGeo = new THREE.RingGeometry(9.2, 9.28, 52);
  const innerRing = new THREE.Mesh(innerRingGeo, ringMat);
  innerRing.position.set(11, 3.5, -12);
  innerRing.rotation.x = -0.35;
  innerRing.rotation.y = 0.5;
  scene.add(innerRing);

  // Mouse & Scroll Tracking
  let mouseX = 0;
  let mouseY = 0;
  let scrollProgress = 0;

  window.addEventListener(
    "mousemove",
    (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  window.addEventListener(
    "scroll",
    () => {
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      scrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Read live microphone amplitude if active
    if (voiceModeActive && analyser && micDataArray) {
      analyser.getByteFrequencyData(micDataArray);
      let sum = 0;
      for (let i = 0; i < micDataArray.length; i++) {
        sum += micDataArray[i];
      }
      voiceEnergy = Math.min(1.4, (sum / micDataArray.length / 128) * 1.6 + 0.15);
    }

    updateVoiceBarsUI(voiceEnergy);

    // Morph factor: 0.0 in Act I (Portfolio) -> 1.0 in Act II (ICP Clarity Lab Product)
    const morphFactor = Math.min(1, Math.max(0, (scrollProgress - 0.32) * 2.2));
    const posAttr = geometry.attributes.position;
    const posArr = posAttr.array;

    const amp = 1 + (voiceModeActive ? voiceEnergy * 2.2 : Math.abs(mouseX) * 0.45);

    for (let f = 0; f < FILAMENTS; f++) {
      for (let n = 0; n < NODES_PER_FILAMENT; n++) {
        const idx = f * NODES_PER_FILAMENT + n;
        const i3 = idx * 3;

        // Dynamic acoustic wave motion
        const dynamicWaveY =
          waveTargets[i3 + 1] +
          Math.sin(n * 0.24 + elapsed * 1.8 + f * 0.5) * 0.95 * amp +
          Math.cos(n * 0.12 - elapsed * 1.1) * 0.45 * amp;

        const targetX =
          waveTargets[i3] * (1 - morphFactor) + gridTargets[i3] * morphFactor;
        const targetY =
          dynamicWaveY * (1 - morphFactor) +
          (gridTargets[i3 + 1] + Math.sin(elapsed + n) * 0.25) * morphFactor;
        const targetZ =
          waveTargets[i3 + 2] * (1 - morphFactor) + gridTargets[i3 + 2] * morphFactor;

        posArr[i3] += (targetX - posArr[i3]) * 0.08;
        posArr[i3 + 1] += (targetY - posArr[i3 + 1]) * 0.08;
        posArr[i3 + 2] += (targetZ - posArr[i3 + 2]) * 0.08;
      }
    }

    posAttr.needsUpdate = true;

    // Gentle camera & ring parallax
    camera.position.x += (mouseX * 1.6 - camera.position.x) * 0.04;
    camera.position.y += (2.2 + mouseY * 0.9 - camera.position.y) * 0.04;
    camera.lookAt(0, -1.2, 0);

    goldenRing.rotation.z = elapsed * 0.08 + scrollProgress * 1.2;
    innerRing.rotation.z = -elapsed * 0.11 - scrollProgress * 1.5;

    renderer.render(scene, camera);
  }

  animate();
});
