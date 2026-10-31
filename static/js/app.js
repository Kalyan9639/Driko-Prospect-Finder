/**
 * ICP Clarity Lab — Agentic B2B GTM & Public OSINT Platform
 * Pure Vanilla JS | Reactive Rendering | Smart-Table & FastMCP
 */

document.addEventListener("DOMContentLoaded", () => {
  // Application State
  const state = {
    presets: {},
    rawBrief: "",
    distilledBrief: null,
    report: null,
    leads: [],
    filteredLeads: [],
    sources: [],
    campaigns: [],
    activeTab: "tab-studio",
    activeSourceCategory: "all",
    activeLeadFilter: "all",
    activeLedgerFilter: "all",
    selectedArchetype: "Founders & Co-Founders",
    selectedScale: "Small (2-50 employees)",
    selectedTimeDays: 30,
    currentOutreachLead: null,
    currentCampaignId: null,
    customProvider: localStorage.getItem("icp_custom_provider") || "groq",
    customApiKey: localStorage.getItem("icp_custom_api_key") || "",
    customModel: localStorage.getItem("icp_custom_model") || "llama-3.3-70b-versatile",
    serverLLMStatus: null
  };

  const PROVIDER_MODELS = {
    groq: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile (Recommended • Fastest)" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant (Ultra-low latency)" }
    ],
    gemini: [
      { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite (Recommended • Free Tier)" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Deep reasoning)" }
    ]
  };

  // DOM Elements
  const rawBriefInput = document.getElementById("raw-brief-input");
  const customArchetypeInput = document.getElementById("custom-archetype-input");
  const timeSlider = document.getElementById("time-window-slider");
  const sliderReadout = document.getElementById("slider-readout");

  // BYOK & API Key Management Elements
  const btnOpenApiKeyModal = document.getElementById("btn-open-api-key-modal");
  const apiKeyModal = document.getElementById("api-key-modal-overlay");
  const btnCloseApiKeyModal = document.getElementById("btn-close-api-key-modal");
  const apiKeyStatusDot = document.getElementById("api-key-status-dot");
  const apiKeyStatusText = document.getElementById("api-key-status-text");

  const byokAlertBanner = document.getElementById("byok-alert-banner");
  const byokBannerIcon = document.getElementById("byok-banner-icon");
  const byokBannerTitle = document.getElementById("byok-banner-title");
  const byokBannerText = document.getElementById("byok-banner-text");
  const byokErrorBox = document.getElementById("byok-error-box");
  const byokErrorMessage = document.getElementById("byok-error-message");
  const btnBannerAddKey = document.getElementById("btn-banner-add-key");
  const btnBannerUploadFile = document.getElementById("btn-banner-upload-file");
  const btnBannerDismiss = document.getElementById("btn-banner-dismiss");

  const modalLlmStatusBox = document.getElementById("modal-llm-status-box");
  const providerCardGroq = document.getElementById("provider-card-groq");
  const providerCardGemini = document.getElementById("provider-card-gemini");
  const customModelSelect = document.getElementById("custom-model-select");
  const customKeyInput = document.getElementById("custom-key-input");
  const btnToggleKeyVisibility = document.getElementById("btn-toggle-key-visibility");
  const keyInputLabel = document.getElementById("key-input-label");
  const getApiKeyLink = document.getElementById("get-api-key-link");
  const keyFormatHint = document.getElementById("key-format-hint");
  const activeKeyIndicator = document.getElementById("active-key-indicator");
  const keyValidationFeedback = document.getElementById("key-validation-feedback");

  const btnTestKey = document.getElementById("btn-test-key");
  const testKeyText = document.getElementById("test-key-text");
  const testKeySpinner = document.getElementById("test-key-spinner");
  const btnSaveCustomKey = document.getElementById("btn-save-custom-key");
  const btnResetDefaultKey = document.getElementById("btn-reset-default-key");

  const apiKeyDropzone = document.getElementById("api-key-dropzone");
  const apiKeyFileUpload = document.getElementById("api-key-file-upload");
  const linkBrowseFile = document.getElementById("link-browse-file");
  const apiKeyFileInput = document.getElementById("api-key-file-input");

  const btnDistillBrief = document.getElementById("btn-distill-brief");
  const distillBtnText = document.getElementById("distill-btn-text");
  const distillBtnSpinner = document.getElementById("distill-btn-spinner");

  const briefModal = document.getElementById("brief-modal-overlay");
  const btnCloseBriefModal = document.getElementById("btn-close-brief-modal");
  const btnCancelDistill = document.getElementById("btn-cancel-distill");
  const btnCompileFullICP = document.getElementById("btn-compile-full-icp");
  const compileBtnText = document.getElementById("compile-btn-text");
  const compileBtnSpinner = document.getElementById("compile-btn-spinner");

  const distilledOffering = document.getElementById("distilled-offering");
  const distilledTarget = document.getElementById("distilled-target");
  const distilledArchetype = document.getElementById("distilled-archetype");
  const distilledSize = document.getElementById("distilled-size");
  const distilledConstraints = document.getElementById("distilled-constraints");
  const distilledQueries = document.getElementById("distilled-queries");

  const agentStreamPanel = document.getElementById("agent-stream-panel");
  const telemetrySection = document.getElementById("telemetry-section");
  const resultsContainer = document.getElementById("results-container");
  const prospectsTableBody = document.getElementById("prospects-table-body");

  // Outreach Drawer Elements
  const drawerOverlay = document.getElementById("outreach-drawer-overlay");
  const btnCloseDrawer = document.getElementById("btn-close-drawer");
  const drawerCompanyTitle = document.getElementById("drawer-company-title");
  const drawerSignalText = document.getElementById("drawer-signal-text");
  const drawerEmailSubject = document.getElementById("drawer-email-subject");
  const drawerEmailBody = document.getElementById("drawer-email-body");
  const drawerMailtoLink = document.getElementById("drawer-mailto-link");
  const drawerLiNote = document.getElementById("drawer-li-note");
  const drawerLiLen = document.getElementById("drawer-li-len");
  const drawerMomTest = document.getElementById("drawer-mom-test");
  const btnCopyDrawerEmail = document.getElementById("btn-copy-drawer-email");
  const btnCopyDrawerLi = document.getElementById("btn-copy-drawer-li");
  const btnCopyDrawerMom = document.getElementById("btn-copy-drawer-mom");

  // Export Buttons
  const btnExportCsv = document.getElementById("btn-export-csv");
  const btnDownloadCsvBottom = document.getElementById("btn-download-csv-bottom");
  const btnCopyAllEmails = document.getElementById("btn-copy-all-emails");
  const btnDownloadMarkdown = document.getElementById("btn-download-markdown");
  const btnCopyMarkdown = document.getElementById("btn-copy-markdown");
  const btnDownloadJson = document.getElementById("btn-download-json");

  // ---------------------------------------------------------------------------
  // 1. Initial Setup & Event Listeners
  // ---------------------------------------------------------------------------

  function getCustomHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (state.customApiKey && state.customApiKey.trim()) {
      headers["X-Custom-Provider"] = state.customProvider;
      headers["X-Custom-Api-Key"] = state.customApiKey.trim();
      if (state.customModel) {
        headers["X-Custom-Model"] = state.customModel;
      }
    }
    return headers;
  }

  function getCustomPayloadFields() {
    if (state.customApiKey && state.customApiKey.trim()) {
      return {
        custom_provider: state.customProvider,
        custom_api_key: state.customApiKey.trim(),
        custom_model: state.customModel
      };
    }
    return {};
  }

  function setupBYOK() {
    // Open Modal
    if (btnOpenApiKeyModal) {
      btnOpenApiKeyModal.addEventListener("click", () => openApiKeyModal());
    }
    if (btnCloseApiKeyModal) {
      btnCloseApiKeyModal.addEventListener("click", () => closeApiKeyModal());
    }
    if (apiKeyModal) {
      apiKeyModal.addEventListener("click", (e) => {
        if (e.target === apiKeyModal) closeApiKeyModal();
      });
    }

    // Banner Actions
    if (btnBannerAddKey) {
      btnBannerAddKey.addEventListener("click", () => openApiKeyModal());
    }
    if (btnBannerUploadFile) {
      btnBannerUploadFile.addEventListener("click", () => {
        if (apiKeyFileInput) apiKeyFileInput.click();
      });
    }
    if (btnBannerDismiss) {
      btnBannerDismiss.addEventListener("click", () => {
        if (byokAlertBanner) byokAlertBanner.style.display = "none";
        sessionStorage.setItem("icp_byok_banner_dismissed", "true");
      });
    }

    // Provider Cards
    if (providerCardGroq) {
      providerCardGroq.addEventListener("click", () => switchProvider("groq"));
    }
    if (providerCardGemini) {
      providerCardGemini.addEventListener("click", () => switchProvider("gemini"));
    }

    // Model Select
    if (customModelSelect) {
      customModelSelect.addEventListener("change", (e) => {
        state.customModel = e.target.value;
      });
    }

    // Password Visibility Toggle
    if (btnToggleKeyVisibility && customKeyInput) {
      btnToggleKeyVisibility.addEventListener("click", () => {
        const isPassword = customKeyInput.type === "password";
        customKeyInput.type = isPassword ? "text" : "password";
        btnToggleKeyVisibility.textContent = isPassword ? "🙈" : "👁️";
      });
    }

    // File Upload Handlers (Modal dropzone & Hidden inputs)
    if (linkBrowseFile && apiKeyFileUpload) {
      linkBrowseFile.addEventListener("click", () => apiKeyFileUpload.click());
    }
    if (apiKeyDropzone) {
      apiKeyDropzone.addEventListener("click", (e) => {
        if (e.target !== linkBrowseFile && apiKeyFileUpload) apiKeyFileUpload.click();
      });
      apiKeyDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        apiKeyDropzone.classList.add("dragover");
      });
      apiKeyDropzone.addEventListener("dragleave", () => {
        apiKeyDropzone.classList.remove("dragover");
      });
      apiKeyDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        apiKeyDropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleKeyFile(e.dataTransfer.files[0]);
        }
      });
    }
    if (apiKeyFileUpload) {
      apiKeyFileUpload.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          handleKeyFile(e.target.files[0]);
        }
      });
    }
    if (apiKeyFileInput) {
      apiKeyFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          handleKeyFile(e.target.files[0]);
          openApiKeyModal();
        }
      });
    }

    // Key Validation Handshake
    if (btnTestKey) {
      btnTestKey.addEventListener("click", testCurrentKeyHandshake);
    }

    // Save Key
    if (btnSaveCustomKey) {
      btnSaveCustomKey.addEventListener("click", saveAndActivateKey);
    }

    // Reset to Default Key
    if (btnResetDefaultKey) {
      btnResetDefaultKey.addEventListener("click", resetToDefaultKey);
    }

    // Initialize provider and model state
    switchProvider(state.customProvider, false);
  }

  function openApiKeyModal() {
    if (!apiKeyModal) return;
    switchProvider(state.customProvider, false);
    if (customKeyInput) customKeyInput.value = state.customApiKey || "";
    renderModalStatusBox();
    if (keyValidationFeedback) keyValidationFeedback.style.display = "none";
    if (activeKeyIndicator) {
      activeKeyIndicator.style.display = state.customApiKey ? "inline" : "none";
    }
    apiKeyModal.classList.add("active");
  }

  function closeApiKeyModal() {
    if (!apiKeyModal) return;
    apiKeyModal.classList.remove("active");
  }

  function switchProvider(provider, clearFeedback = true) {
    state.customProvider = provider;
    if (providerCardGroq && providerCardGemini) {
      providerCardGroq.classList.toggle("active", provider === "groq");
      providerCardGemini.classList.toggle("active", provider === "gemini");
    }

    // Populate model options
    if (customModelSelect) {
      customModelSelect.innerHTML = "";
      const models = PROVIDER_MODELS[provider] || [];
      models.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.name;
        customModelSelect.appendChild(opt);
      });

      // Maintain or default selected model
      const validIds = models.map(m => m.id);
      if (!validIds.includes(state.customModel)) {
        state.customModel = models[0]?.id || "";
      }
      customModelSelect.value = state.customModel;
    }

    // Update hints & helper links
    if (provider === "groq") {
      if (keyInputLabel) keyInputLabel.textContent = "Groq Cloud API Key:";
      if (getApiKeyLink) {
        getApiKeyLink.href = "https://console.groq.com/keys";
        getApiKeyLink.textContent = "Get free Groq key ↗";
      }
      if (keyFormatHint) keyFormatHint.textContent = "Groq keys start with 'gsk_'";
      if (customKeyInput) customKeyInput.placeholder = "gsk_...";
    } else {
      if (keyInputLabel) keyInputLabel.textContent = "Google Gemini API Key:";
      if (getApiKeyLink) {
        getApiKeyLink.href = "https://aistudio.google.com/app/apikey";
        getApiKeyLink.textContent = "Get free Gemini key ↗";
      }
      if (keyFormatHint) keyFormatHint.textContent = "Gemini keys start with 'AIzaSy...'";
      if (customKeyInput) customKeyInput.placeholder = "AIzaSy...";
    }

    if (clearFeedback && keyValidationFeedback) {
      keyValidationFeedback.style.display = "none";
    }
  }

  function handleKeyFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      let detectedKey = "";
      let detectedProvider = state.customProvider;

      // 1. Try parsing JSON
      try {
        const json = JSON.parse(text);
        if (json.groq_api_key || json.GROQ_API_KEY) {
          detectedKey = json.groq_api_key || json.GROQ_API_KEY;
          detectedProvider = "groq";
        } else if (json.gemini_api_key || json.GEMINI_API_KEY) {
          detectedKey = json.gemini_api_key || json.GEMINI_API_KEY;
          detectedProvider = "gemini";
        } else if (json.apiKey || json.api_key) {
          detectedKey = json.apiKey || json.api_key;
        }
      } catch (err) {
        // Not JSON, continue to .env / line parsing
      }

      // 2. Try parsing .env lines
      if (!detectedKey) {
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("#") || !trimmed) continue;
          if (trimmed.startsWith("GROQ_API_KEY=")) {
            detectedKey = trimmed.split("=")[1].replace(/["']/g, "").trim();
            detectedProvider = "groq";
            break;
          } else if (trimmed.startsWith("GEMINI_API_KEY=")) {
            detectedKey = trimmed.split("=")[1].replace(/["']/g, "").trim();
            detectedProvider = "gemini";
            break;
          } else if (trimmed.includes("KEY=") || trimmed.includes("API=")) {
            const val = trimmed.split("=")[1].replace(/["']/g, "").trim();
            if (val.length > 20) {
              detectedKey = val;
              break;
            }
          }
        }
      }

      // 3. Fallback to raw text
      if (!detectedKey) {
        const clean = text.trim();
        if (clean.length > 15 && clean.length < 150) {
          detectedKey = clean;
        }
      }

      if (detectedKey) {
        // Auto-detect provider if key starts with standard prefix
        if (detectedKey.startsWith("gsk_")) {
          detectedProvider = "groq";
        } else if (detectedKey.startsWith("AIza")) {
          detectedProvider = "gemini";
        }

        switchProvider(detectedProvider, false);
        if (customKeyInput) customKeyInput.value = detectedKey;

        if (keyValidationFeedback) {
          keyValidationFeedback.className = "validation-feedback-box success";
          keyValidationFeedback.style.display = "block";
          keyValidationFeedback.innerHTML = `<strong>File Imported!</strong> Extracted key from <code>${file.name}</code> for <strong>${detectedProvider.toUpperCase()}</strong>. Click <em>"Test Handshake"</em> to verify.`;
        }
      } else {
        if (keyValidationFeedback) {
          keyValidationFeedback.className = "validation-feedback-box error";
          keyValidationFeedback.style.display = "block";
          keyValidationFeedback.textContent = `Could not find a valid API key in ${file.name}. Ensure it contains GROQ_API_KEY or GEMINI_API_KEY.`;
        }
      }
    };
    reader.readAsText(file);
  }

  async function testCurrentKeyHandshake() {
    const key = (customKeyInput?.value || "").trim();
    if (!key) {
      if (keyValidationFeedback) {
        keyValidationFeedback.className = "validation-feedback-box error";
        keyValidationFeedback.style.display = "block";
        keyValidationFeedback.textContent = "Please enter or paste an API key first.";
      }
      return;
    }

    if (testKeyText) testKeyText.style.display = "none";
    if (testKeySpinner) testKeySpinner.style.display = "inline";
    if (btnTestKey) btnTestKey.disabled = true;

    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: state.customProvider,
          api_key: key,
          model: customModelSelect?.value || state.customModel
        })
      });

      const data = await res.json();
      if (keyValidationFeedback) {
        keyValidationFeedback.style.display = "block";
        if (data.valid) {
          keyValidationFeedback.className = "validation-feedback-box success";
          keyValidationFeedback.innerHTML = `<strong>✓ Verification Succeeded:</strong> ${data.message}`;
        } else {
          keyValidationFeedback.className = "validation-feedback-box error";
          keyValidationFeedback.innerHTML = `<strong>✕ Verification Notice:</strong> ${data.message || data.error}`;
        }
      }
    } catch (err) {
      if (keyValidationFeedback) {
        keyValidationFeedback.className = "validation-feedback-box error";
        keyValidationFeedback.style.display = "block";
        keyValidationFeedback.textContent = `Validation request error: ${err.message}`;
      }
    } finally {
      if (testKeyText) testKeyText.style.display = "inline";
      if (testKeySpinner) testKeySpinner.style.display = "none";
      if (btnTestKey) btnTestKey.disabled = false;
    }
  }

  function saveAndActivateKey() {
    const key = (customKeyInput?.value || "").trim();
    if (!key) {
      if (keyValidationFeedback) {
        keyValidationFeedback.className = "validation-feedback-box error";
        keyValidationFeedback.style.display = "block";
        keyValidationFeedback.textContent = "Cannot activate an empty API key.";
      }
      return;
    }

    state.customApiKey = key;
    state.customModel = customModelSelect?.value || state.customModel;

    localStorage.setItem("icp_custom_provider", state.customProvider);
    localStorage.setItem("icp_custom_api_key", state.customApiKey);
    localStorage.setItem("icp_custom_model", state.customModel);

    updateLLMUI();
    closeApiKeyModal();

    // Re-check health and status
    checkLLMStatus();
  }

  function resetToDefaultKey() {
    state.customApiKey = "";
    localStorage.removeItem("icp_custom_provider");
    localStorage.removeItem("icp_custom_api_key");
    localStorage.removeItem("icp_custom_model");

    if (customKeyInput) customKeyInput.value = "";
    if (activeKeyIndicator) activeKeyIndicator.style.display = "none";

    updateLLMUI();
    renderModalStatusBox();

    if (keyValidationFeedback) {
      keyValidationFeedback.className = "validation-feedback-box success";
      keyValidationFeedback.style.display = "block";
      keyValidationFeedback.textContent = "Reverted to server default configuration.";
    }

    checkLLMStatus();
  }

  function renderModalStatusBox() {
    if (!modalLlmStatusBox) return;
    const status = state.serverLLMStatus;

    if (state.customApiKey) {
      modalLlmStatusBox.className = "modal-status-callout status-ok";
      modalLlmStatusBox.innerHTML = `
        <div style="font-weight: 600; color: #a7f3d0; margin-bottom: 0.2rem;">🟢 Custom User API Key Active</div>
        <div>Routing to <strong>${state.customProvider.toUpperCase()} (${state.customModel})</strong> with client-side authentication.</div>
      `;
    } else if (status?.default_key_status === "error" || status?.default_key_error) {
      modalLlmStatusBox.className = "modal-status-callout status-error";
      modalLlmStatusBox.innerHTML = `
        <div style="font-weight: 600; color: #f87171; margin-bottom: 0.25rem;">⚠️ Default Server Key Error</div>
        <div style="font-size: 0.8rem; margin-bottom: 0.35rem;"><code>${status.default_key_error}</code></div>
        <div style="font-size: 0.775rem; color: var(--ink-secondary);">Add your own Groq or Gemini key below to bypass this error and unlock full AI generation.</div>
      `;
    } else if (status?.default_key_status === "not_configured") {
      modalLlmStatusBox.className = "modal-status-callout status-neutral";
      modalLlmStatusBox.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.2rem;">ℹ️ Server Running in Deterministic Mode</div>
        <div>No default GEMINI_API_KEY is configured on the server. Add your own key below to activate AI synthesis.</div>
      `;
    } else {
      modalLlmStatusBox.className = "modal-status-callout status-neutral";
      modalLlmStatusBox.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.2rem;">Server Default: Gemini (${status?.configured_model || '2.5 Flash Lite'})</div>
        <div>Add your own key below for higher rate limits, custom models (Groq/Gemini), and dedicated quotas.</div>
      `;
    }
  }

  async function checkLLMStatus() {
    try {
      const res = await fetch("/api/llm-status");
      if (res.ok) {
        state.serverLLMStatus = await res.json();
        updateLLMUI();
      }
    } catch (e) {
      console.warn("LLM status fetch error:", e);
    }
  }

  function updateLLMUI() {
    const status = state.serverLLMStatus;
    const badge = document.getElementById("system-model-badge");

    // 1. Navigation Status Button & Header Badge
    if (state.customApiKey && state.customApiKey.trim()) {
      if (apiKeyStatusDot) apiKeyStatusDot.textContent = "🟢";
      if (apiKeyStatusText) apiKeyStatusText.textContent = `${state.customProvider === "groq" ? "Groq" : "Gemini"} Active`;
      if (badge) {
        badge.textContent = `BYOK: ${state.customProvider.toUpperCase()} (${state.customModel}) • FastMCP`;
        badge.style.borderColor = "var(--accent-cyan)";
      }
      if (byokAlertBanner) byokAlertBanner.style.display = "none";
    } else {
      const hasError = status?.default_key_status === "error" || Boolean(status?.default_key_error);
      if (hasError) {
        if (apiKeyStatusDot) apiKeyStatusDot.textContent = "⚠️";
        if (apiKeyStatusText) apiKeyStatusText.textContent = "Model Error — Add Key";
        if (badge) {
          badge.textContent = `Default Gemini (Error) • Local Fallback`;
          badge.style.borderColor = "var(--status-unknown)";
        }
      } else {
        if (apiKeyStatusDot) apiKeyStatusDot.textContent = "🔑";
        if (apiKeyStatusText) apiKeyStatusText.textContent = "AI API Key";
        if (badge && status?.configured_model) {
          badge.textContent = `${status.configured_model} • FastMCP`;
          badge.style.borderColor = "var(--hairline)";
        }
      }

      // 2. Alert Banner Display Logic
      const isDismissed = sessionStorage.getItem("icp_byok_banner_dismissed") === "true";
      if (byokAlertBanner && !isDismissed) {
        if (hasError) {
          byokAlertBanner.style.display = "flex";
          byokAlertBanner.classList.add("has-error");
          if (byokBannerIcon) byokBannerIcon.textContent = "⚠️";
          if (byokBannerTitle) byokBannerTitle.textContent = "Not getting the best experience with the current model?";
          if (byokBannerText) byokBannerText.textContent = "The server's default AI model encountered an error or quota exhaustion. Add your own Google Gemini or Groq API key to unlock full AI reasoning, unblocked rate limits, and custom outreach personalization.";
          if (byokErrorBox) byokErrorBox.style.display = "block";
          if (byokErrorMessage) byokErrorMessage.textContent = status.default_key_error || "Model API key rejected or rate-limited.";
        } else if (status?.default_key_status === "not_configured") {
          byokAlertBanner.style.display = "flex";
          byokAlertBanner.classList.remove("has-error");
          if (byokBannerIcon) byokBannerIcon.textContent = "💡";
          if (byokBannerTitle) byokBannerTitle.textContent = "Not getting the best experience with the default model?";
          if (byokBannerText) byokBannerText.textContent = "No server API key is configured. Add your own Google Gemini or Groq API key to unlock full AI reasoning, unblocked rate limits, and custom outreach personalization.";
          if (byokErrorBox) byokErrorBox.style.display = "none";
        } else {
          byokAlertBanner.style.display = "none";
        }
      }
    }
  }

  async function init() {
    setupTabNavigation();
    setupControls();
    setupBYOK();
    await checkHealth();
    await checkLLMStatus();
    await loadPresets();
    await loadUnblockedSources();
    await loadCampaigns();
  }

  // Tab Navigation
  function setupTabNavigation() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tabId = btn.dataset.tab;
        state.activeTab = tabId;

        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".tab-content-panel").forEach(panel => {
          panel.style.display = panel.id === tabId ? "block" : "none";
        });

        if (tabId === "tab-sources" && state.sources.length === 0) {
          loadUnblockedSources();
        } else if (tabId === "tab-workbooks") {
          loadCampaigns();
        }
      });
    });
  }

  // Interactive UI Controls
  function setupControls() {
    // Archetype Chips
    document.querySelectorAll(".archetype-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".archetype-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.selectedArchetype = chip.dataset.archetype;
        customArchetypeInput.value = state.selectedArchetype;
      });
    });

    customArchetypeInput.addEventListener("input", () => {
      state.selectedArchetype = customArchetypeInput.value;
    });

    // Scale Chips
    document.querySelectorAll(".size-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".size-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.selectedScale = chip.dataset.size;
      });
    });

    // Sliding Time-Window Slider & Presets
    timeSlider.addEventListener("input", (e) => {
      updateTimeWindow(parseInt(e.target.value, 10));
    });

    document.querySelectorAll(".time-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".time-preset-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const days = parseInt(btn.dataset.days, 10);
        timeSlider.value = days > 0 ? days : 365;
        updateTimeWindow(days);
      });
    });

    function updateTimeWindow(days) {
      state.selectedTimeDays = days;
      if (days === 0) {
        sliderReadout.textContent = "All Time (Historical & Active)";
      } else if (days === 1) {
        sliderReadout.textContent = "Last 24 Hours (Breaking Triggers)";
      } else {
        const pastDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const dateStr = pastDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        sliderReadout.textContent = `Last ${days} Days (Since ${dateStr})`;
      }
    }

    // Target Prospect Count Controls
    state.selectedTargetCount = 8;
    const prospectCountReadout = document.getElementById("prospect-count-readout");
    const customCountInput = document.getElementById("custom-prospect-count-input");

    document.querySelectorAll(".count-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".count-preset-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const count = parseInt(btn.dataset.count, 10);
        state.selectedTargetCount = count;
        if (customCountInput) customCountInput.value = count;
        if (prospectCountReadout) prospectCountReadout.textContent = `${count} Prospects`;
      });
    });

    if (customCountInput) {
      customCountInput.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (val >= 2 && val <= 50) {
          state.selectedTargetCount = val;
          document.querySelectorAll(".count-preset-btn").forEach(b => {
            b.classList.toggle("active", parseInt(b.dataset.count, 10) === val);
          });
          if (prospectCountReadout) prospectCountReadout.textContent = `${val} Prospects`;
        }
      });
    }

    // Lead Table Filters
    document.querySelectorAll(".lead-filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".lead-filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.activeLeadFilter = chip.dataset.filter;
        filterAndRenderLeads();
      });
    });

    const searchInput = document.getElementById("lead-filter-search");
    if (searchInput) {
      searchInput.addEventListener("input", filterAndRenderLeads);
    }

    // Sources Catalog Category Filter
    document.querySelectorAll(".src-filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".src-filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.activeSourceCategory = chip.dataset.cat;
        renderSourcesCatalog();
      });
    });

    // Drawer Close
    btnCloseDrawer.addEventListener("click", () => {
      drawerOverlay.style.display = "none";
    });
    drawerOverlay.addEventListener("click", (e) => {
      if (e.target === drawerOverlay) drawerOverlay.style.display = "none";
    });

    // Copy Drawer Buttons
    btnCopyDrawerEmail.addEventListener("click", () => {
      navigator.clipboard.writeText(`${drawerEmailSubject.textContent}\n\n${drawerEmailBody.textContent}`);
      btnCopyDrawerEmail.textContent = "✓ Copied!";
      setTimeout(() => btnCopyDrawerEmail.textContent = "📋 Copy Email", 1800);
    });

    btnCopyDrawerLi.addEventListener("click", () => {
      navigator.clipboard.writeText(drawerLiNote.textContent);
      btnCopyDrawerLi.textContent = "✓ Copied!";
      setTimeout(() => btnCopyDrawerLi.textContent = "📋 Copy Note", 1800);
    });

    btnCopyDrawerMom.addEventListener("click", () => {
      navigator.clipboard.writeText(drawerMomTest.textContent);
      btnCopyDrawerMom.textContent = "✓ Copied!";
      setTimeout(() => btnCopyDrawerMom.textContent = "📋 Copy Question", 1800);
    });

    // Export Handlers
    btnExportCsv.addEventListener("click", downloadCsv);
    btnDownloadCsvBottom.addEventListener("click", downloadCsv);
    btnCopyAllEmails.addEventListener("click", copyAllEmails);
    btnDownloadMarkdown.addEventListener("click", downloadMarkdown);
    btnCopyMarkdown.addEventListener("click", copyMarkdown);
    btnDownloadJson.addEventListener("click", downloadJson);
  }

  // ---------------------------------------------------------------------------
  // 2. Health & Presets Loader
  // ---------------------------------------------------------------------------

  async function checkHealth() {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      const badge = document.getElementById("system-model-badge");
      if (badge && data.primary_model) {
        badge.textContent = `${data.primary_model} • FastMCP`;
      }
      const indicator = document.getElementById("health-status-indicator");
      if (indicator) {
        indicator.textContent = `● ${data.unblocked_sources_count || 52} Sources Ready`;
      }
      const tabBadge = document.getElementById("tab-sources-badge");
      if (tabBadge) tabBadge.textContent = data.unblocked_sources_count || 52;
    } catch (e) {
      console.warn("Health check error:", e);
    }
  }

  async function loadPresets() {
    try {
      const res = await fetch("/api/presets");
      const presets = await res.json();
      presets.forEach(p => state.presets[p.id] = p);

      const urlParams = new URLSearchParams(window.location.search);
      const queryBrief = urlParams.get("brief");
      const queryPreset = urlParams.get("preset");
      const pendingBrief = sessionStorage.getItem("icp_pending_brief");

      if (queryBrief && queryBrief.trim().length > 0) {
        rawBriefInput.value = queryBrief.trim();
        if (queryPreset && state.presets[queryPreset]?.target_customer_archetype) {
          state.selectedArchetype = state.presets[queryPreset].target_customer_archetype;
          customArchetypeInput.value = state.selectedArchetype;
        }
      } else if (queryPreset && state.presets[queryPreset]) {
        applyPreset(queryPreset);
      } else if (pendingBrief && pendingBrief.trim().length > 0) {
        rawBriefInput.value = pendingBrief.trim();
        sessionStorage.removeItem("icp_pending_brief");
      } else if (state.presets["kriu_hiring"]) {
        applyPreset("kriu_hiring");
      }

      document.querySelectorAll(".preset-chip[data-preset]").forEach(chip => {
        chip.addEventListener("click", () => {
          document.querySelectorAll(".preset-chip[data-preset]").forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          applyPreset(chip.dataset.preset);
        });
      });
    } catch (e) {
      console.warn("Preset load error:", e);
    }
  }

  function applyPreset(presetId) {
    const p = state.presets[presetId];
    if (!p) return;
    rawBriefInput.value = p.raw_brief || "";
    if (p.target_customer_archetype) {
      state.selectedArchetype = p.target_customer_archetype;
      customArchetypeInput.value = p.target_customer_archetype;
      document.querySelectorAll(".archetype-chip").forEach(c => {
        c.classList.toggle("active", c.dataset.archetype === p.target_customer_archetype);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Stage 1: Distill Brief into Problem Spec
  // ---------------------------------------------------------------------------

  btnDistillBrief.addEventListener("click", async () => {
    const text = rawBriefInput.value.trim();
    if (text.length < 15) {
      alert("Please provide at least a couple of sentences describing your business.");
      return;
    }

    distillBtnText.style.display = "none";
    distillBtnSpinner.style.display = "inline";
    btnDistillBrief.disabled = true;

    try {
      const headers = getCustomHeaders();
      const payload = {
        raw_brief: text,
        ...getCustomPayloadFields()
      };

      const res = await fetch("/api/distill-brief", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Distillation failed.");
      }

      state.distilledBrief = await res.json();

      // Populate review fields
      distilledOffering.value = state.distilledBrief.core_offering || "";
      distilledTarget.value = state.distilledBrief.target_audience_hypothesis || "";
      distilledArchetype.value = state.selectedArchetype || "Founders & Engineering Leaders";
      distilledSize.value = state.selectedScale || "Small (2-50 employees)";
      distilledConstraints.value = (state.distilledBrief.explicit_constraints || []).join(", ");
      distilledQueries.value = (state.distilledBrief.precision_search_queries || []).join("\n");

      briefModal.classList.add("active");
    } catch (err) {
      alert(`Error during brief distillation: ${err.message}`);
    } finally {
      distillBtnText.style.display = "inline";
      distillBtnSpinner.style.display = "none";
      btnDistillBrief.disabled = false;
    }
  });

  btnCloseBriefModal.addEventListener("click", () => briefModal.classList.remove("active"));
  btnCancelDistill.addEventListener("click", () => briefModal.classList.remove("active"));

  // ---------------------------------------------------------------------------
  // 4. Stage 2 & 3: Autonomous Multi-Agent Scouting & Contact Stitching
  // ---------------------------------------------------------------------------

  btnCompileFullICP.addEventListener("click", () => executeAutonomousPipeline(false));

  const btnForceRefresh = document.getElementById("btn-force-refresh");
  if (btnForceRefresh) {
    btnForceRefresh.addEventListener("click", () => executeAutonomousPipeline(true));
  }

  async function executeAutonomousPipeline(forceRefresh = false) {
    briefModal.classList.remove("active");

    const selectedCategories = Array.from(document.querySelectorAll(".source-cat-check:checked"))
      .map(cb => cb.value);

    const updatedConstraints = distilledConstraints.value.split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const updatedQueries = distilledQueries.value.split("\n")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payloadBrief = {
      core_offering: distilledOffering.value.trim() || state.distilledBrief.core_offering,
      target_audience_hypothesis: distilledTarget.value.trim() || state.distilledBrief.target_audience_hypothesis,
      target_customer_archetype: distilledArchetype.value.trim() || state.selectedArchetype,
      target_company_size_focus: distilledSize.value.trim() || state.selectedScale,
      time_window_days: state.selectedTimeDays,
      target_prospect_count: state.selectedTargetCount || 8,
      explicit_constraints: updatedConstraints,
      precision_search_queries: updatedQueries.length > 0 ? updatedQueries : state.distilledBrief.precision_search_queries,
      selected_source_categories: selectedCategories
    };

    const isDeterministic = document.getElementById("chk-deterministic-mode").checked;

    // Show stream & animate steps
    agentStreamPanel.style.display = "block";
    setAgentStep(1, "active");
    setAgentStep(2, "pending");
    setAgentStep(3, "pending");
    setAgentStep(4, "pending");
    setAgentStep(5, "pending");

    setTimeout(() => { setAgentStep(1, "completed"); setAgentStep(2, "active"); }, 800);
    setTimeout(() => { setAgentStep(2, "completed"); setAgentStep(3, "active"); }, 2000);
    setTimeout(() => { setAgentStep(3, "completed"); setAgentStep(4, "active"); }, 3800);

    try {
      const headers = getCustomHeaders();
      const payload = {
        brief_json: payloadBrief,
        urls: [],
        force_refresh: forceRefresh,
        deterministic_mode: isDeterministic,
        enable_live_grounding: true,
        sliding_time_window_days: state.selectedTimeDays,
        target_prospect_count: state.selectedTargetCount || 8,
        ...getCustomPayloadFields()
      };

      const res = await fetch("/api/compile-icp", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Pipeline failed.");
      }

      setAgentStep(4, "completed");
      setAgentStep(5, "completed");

      state.report = await res.json();
      state.leads = state.report.discovered_prospects || [];
      state.filteredLeads = [...state.leads];

      renderAllResults();
    } catch (err) {
      alert(`Pipeline error: ${err.message}`);
    } finally {
      setTimeout(() => {
        agentStreamPanel.style.display = "none";
      }, 4000);
    }
  }

  function setAgentStep(stepNum, status) {
    const el = document.getElementById(`step-agent-${stepNum}`);
    if (!el) return;
    el.classList.remove("active", "completed");
    if (status === "active") el.classList.add("active");
    if (status === "completed") el.classList.add("completed");
  }

  // ---------------------------------------------------------------------------
  // 5. Render Results (Smart-Table, Ledger, Personas, Plan)
  // ---------------------------------------------------------------------------

  function renderAllResults() {
    telemetrySection.style.display = "block";
    resultsContainer.style.display = "block";

    // Telemetry
    const tele = state.report.telemetry || {};
    const modelUsedEl = document.getElementById("tele-model");
    if (tele.model_error) {
      if (modelUsedEl) {
        modelUsedEl.innerHTML = `<span style="color: #f87171;" title="${tele.model_error}">⚠️ Fallback (Model Error)</span> <a href="javascript:void(0)" id="link-fix-model-error" style="font-size: 0.75rem; text-decoration: underline; margin-left: 0.4rem; color: var(--accent-cyan);">Fix Key</a>`;
        document.getElementById("link-fix-model-error")?.addEventListener("click", () => openApiKeyModal());
      }
      // Re-trigger banner if error occurred during generation
      if (byokAlertBanner) {
        byokAlertBanner.style.display = "flex";
        byokAlertBanner.classList.add("has-error");
        if (byokBannerIcon) byokBannerIcon.textContent = "⚠️";
        if (byokBannerTitle) byokBannerTitle.textContent = "Not getting the best experience with the current model?";
        if (byokBannerText) byokBannerText.textContent = "The model encountered an error during generation. Add your own Google Gemini or Groq API key to get reliable results without quotas or errors.";
        if (byokErrorBox) byokErrorBox.style.display = "block";
        if (byokErrorMessage) byokErrorMessage.textContent = tele.model_error;
      }
    } else {
      if (modelUsedEl) {
        let displayModel = tele.model_used || "FastMCP / Gemini";
        if (tele.custom_provider) {
          displayModel = `BYOK: ${tele.custom_provider.toUpperCase()} (${tele.custom_model || tele.model_used})`;
        } else if (tele.provider) {
          displayModel = `${tele.provider.toUpperCase()}: ${tele.model_used}`;
        }
        modelUsedEl.textContent = displayModel;
      }
    }

    document.getElementById("tele-tokens").textContent = tele.total_tokens || 0;
    document.getElementById("tele-leads-count").textContent = state.leads.length;
    document.getElementById("tele-time").textContent = `${tele.elapsed_seconds || 0.0}s`;
    document.getElementById("tele-signal-count").textContent = (state.report.external_signals || []).length;

    // Thesis Card
    document.getElementById("report-icp-statement").textContent = `"${state.report.icp_statement}"`;
    document.getElementById("report-offering").textContent = state.report.offering;
    document.getElementById("report-target").textContent = state.report.target_entity;

    const geo = state.report.geography || {};
    const inc = geo.include || [];
    const exc = geo.exclude || [];
    document.getElementById("report-geography").textContent = `Include: ${inc.join(", ") || "Global"} | Exclude: ${exc.join(", ") || "None"}`;

    // Render Smart-Table
    filterAndRenderLeads();

    // Render Ledger
    renderLedger();

    // Render Personas
    renderPersonas();

    // Render Mom-Test Questions & Plan
    renderValidationGuide();

    // Update campaign badge
    loadCampaigns();

    // Scroll smoothly to results
    resultsContainer.scrollIntoView({ behavior: "smooth" });
  }

  // Render Clay-Style Smart-Table
  function filterAndRenderLeads() {
    const searchVal = (document.getElementById("lead-filter-search")?.value || "").toLowerCase().trim();
    const filterType = state.activeLeadFilter;

    // Update filter counts
    const countAll = state.leads.length;
    const countEmail = state.leads.filter(l => (l.public_emails && l.public_emails.length > 0) || (l.decision_makers && l.decision_makers.some(d => d.email))).length;
    const countLi = state.leads.filter(l => l.company_linkedin_url || (l.decision_makers && l.decision_makers.some(d => d.linkedin_url))).length;

    document.getElementById("filter-count-all").textContent = countAll;
    document.getElementById("filter-count-email").textContent = countEmail;
    document.getElementById("filter-count-li").textContent = countLi;

    state.filteredLeads = state.leads.filter(lead => {
      // Search text match
      const nameMatch = lead.company_name.toLowerCase().includes(searchVal);
      const dmMatch = (lead.decision_makers || []).some(d => d.full_name.toLowerCase().includes(searchVal) || d.role_title.toLowerCase().includes(searchVal));
      if (searchVal && !nameMatch && !dmMatch) return false;

      // Filter chip match
      if (filterType === "has_email") {
        const hasPubEmail = lead.public_emails && lead.public_emails.length > 0;
        const hasDmEmail = (lead.decision_makers || []).some(d => d.email);
        if (!hasPubEmail && !hasDmEmail) return false;
      } else if (filterType === "has_linkedin") {
        const hasCompLi = !!lead.company_linkedin_url;
        const hasDmLi = (lead.decision_makers || []).some(d => d.linkedin_url);
        if (!hasCompLi && !hasDmLi) return false;
      } else if (filterType === "high_fit") {
        if ((lead.fit_score || 0) < 80) return false;
      }

      return true;
    });

    prospectsTableBody.innerHTML = "";

    if (state.filteredLeads.length === 0) {
      prospectsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--ink-muted); padding: 2.5rem;">
            No leads match the active filter. Toggle filters or broaden search terms.
          </td>
        </tr>
      `;
      return;
    }

    state.filteredLeads.forEach(lead => {
      const tr = document.createElement("tr");

      // Column 1: Company & Scale
      const cleanUrl = lead.website_url.replace("https://", "").replace("http://", "").split("/")[0];
      const fitBadgeClass = lead.fit_score >= 80 ? "fit-high" : "fit-med";

      // Column 2: Verifiable Proof & Evidence
      const proof = lead.evidence_proof;
      const proofUrl = proof ? proof.proof_url : (lead.source_url || '#');
      const proofSource = proof ? proof.source_name : (lead.source_name || 'Public Source');
      const proofExcerpt = proof ? proof.verbatim_excerpt : lead.problem_symptom_matched;
      const proofFit = proof && proof.fit_explanation ? proof.fit_explanation : '';
      const proofDate = proof && proof.proof_date ? ` (${proof.proof_date})` : '';

      const proofHtml = `
        <div class="evidence-badge" style="border-left: 3px solid var(--accent-cyan); padding: 0.5rem 0.75rem; background: rgba(6, 182, 212, 0.08); border-radius: 0 6px 6px 0;">
          <div style="font-weight: 600; color: #fff; font-size: 0.825rem; line-height: 1.4; margin-bottom: 0.35rem;">
            ${proofExcerpt}
          </div>
          ${proofFit ? `<div style="font-size: 0.75rem; color: var(--ink-secondary); margin-bottom: 0.35rem; line-height: 1.3;">📌 ${proofFit}</div>` : ''}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem;">
            <a href="${proofUrl}" target="_blank" rel="noopener" style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;">
              🔗 Verify on ${proofSource}${proofDate} &nearr;
            </a>
          </div>
        </div>
      `;

      // Column 3: Decision Makers & Responsibilities
      let dmHtml = "";
      if (lead.decision_makers && lead.decision_makers.length > 0) {
        dmHtml = lead.decision_makers.map(dm => {
          const liBtn = dm.linkedin_url
            ? `<a href="${dm.linkedin_url}" target="_blank" rel="noopener" class="copy-pill" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); font-weight: 600;">in Verified Profile &nearr;</a>`
            : (dm.linkedin_search_url ? `<a href="${dm.linkedin_search_url}" target="_blank" rel="noopener" class="copy-pill" style="color: var(--ink-secondary);">in Search ${dm.full_name.split(' ')[0]} &nearr;</a>` : "");

          const emailBadge = dm.email
            ? `<button class="copy-pill copy-email-btn verified-email" data-email="${dm.email}">✉ ${dm.email}</button>`
            : `<span class="copy-pill" style="color: var(--ink-muted); cursor: default; border-color: transparent;">No private email published</span>`;

          const respHtml = dm.stakeholder_responsibility
            ? `<div style="font-size: 0.725rem; color: #a5b4fc; margin-top: 0.15rem; line-height: 1.3;">🎯 ${dm.stakeholder_responsibility}</div>`
            : "";

          return `
            <div style="margin-bottom: 0.6rem; padding-bottom: 0.4rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <div style="font-weight: 700; color: #fff; font-size: 0.875rem;">${dm.full_name}</div>
              <div style="font-size: 0.75rem; color: var(--ink-secondary); font-weight: 500;">${dm.role_title}</div>
              ${respHtml}
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.3rem;">${liBtn} ${emailBadge}</div>
            </div>
          `;
        }).join("");
      } else {
        dmHtml = `<span style="font-size: 0.8rem; color: var(--ink-muted); font-style: italic;">Target Role: ${state.selectedArchetype}</span>`;
      }

      // Column 4: Inboxes & Phones
      let inboxHtml = "";
      if (lead.public_emails && lead.public_emails.length > 0) {
        inboxHtml += lead.public_emails.map(e => `<button class="copy-pill copy-email-btn verified-email" data-email="${e}">✉ ${e}</button>`).join(" ");
      }
      if (lead.phone_numbers && lead.phone_numbers.length > 0) {
        inboxHtml += `<div style="font-size: 0.75rem; color: var(--ink-secondary); margin-top: 0.25rem;">📞 ${lead.phone_numbers.join(", ")}</div>`;
      }
      if (lead.company_linkedin_url) {
        inboxHtml += `<div style="margin-top: 0.3rem;"><a href="${lead.company_linkedin_url}" target="_blank" rel="noopener" style="font-size: 0.75rem; color: #38bdf8;">Company LinkedIn &nearr;</a></div>`;
      }
      if (!inboxHtml) inboxHtml = `<span style="font-size: 0.75rem; color: var(--ink-muted);">Direct website lookup</span>`;

      tr.innerHTML = `
        <td>
          <div class="company-title-cell">
            <a href="${lead.website_url}" target="_blank" rel="noopener">${lead.company_name} &nearr;</a>
            <span style="font-size: 0.75rem; color: var(--ink-secondary);">${cleanUrl} • ${lead.location}</span>
            <div style="margin-top: 0.35rem; display: flex; gap: 0.4rem; align-items: center;">
              <span class="tier-badge">${lead.company_size_tier}</span>
              <span class="fit-badge ${fitBadgeClass}">${lead.fit_score}% Fit</span>
            </div>
          </div>
        </td>
        <td style="max-width: 320px;">${proofHtml}</td>
        <td style="min-width: 200px;">${dmHtml}</td>
        <td>${inboxHtml}</td>
        <td>
          <select class="crm-status-select" data-lead-id="${lead.id}">
            <option value="new" ${lead.crm_status === "new" ? "selected" : ""}>New Lead</option>
            <option value="contacted" ${lead.crm_status === "contacted" ? "selected" : ""}>Contacted</option>
            <option value="replied" ${lead.crm_status === "replied" ? "selected" : ""}>Replied</option>
            <option value="meeting_booked" ${lead.crm_status === "meeting_booked" ? "selected" : ""}>Meeting Booked</option>
            <option value="not_a_fit" ${lead.crm_status === "not_a_fit" ? "selected" : ""}>Not a Fit</option>
          </select>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm view-outreach-btn" data-lead-id="${lead.id}" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; white-space: nowrap;">
            AI Outreach &rarr;
          </button>
        </td>
      `;

      prospectsTableBody.appendChild(tr);
    });

    // Attach copy email event listeners
    document.querySelectorAll(".copy-email-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const email = btn.dataset.email;
        navigator.clipboard.writeText(email);
        const originalText = btn.textContent;
        btn.textContent = "✓ Copied";
        setTimeout(() => btn.textContent = originalText, 1500);
      });
    });

    // Attach CRM status change listeners
    document.querySelectorAll(".crm-status-select").forEach(sel => {
      sel.addEventListener("change", async () => {
        const leadId = sel.dataset.leadId;
        const newStatus = sel.value;
        const lead = state.leads.find(l => l.id === leadId);
        if (lead) lead.crm_status = newStatus;

        if (state.currentCampaignId) {
          try {
            await fetch(`/api/campaigns/${state.currentCampaignId}/lead-status`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                campaign_id: state.currentCampaignId,
                lead_id: leadId,
                crm_status: newStatus
              })
            });
          } catch (e) {
            console.warn("Status update error:", e);
          }
        }
      });
    });

    // Attach View Outreach buttons
    document.querySelectorAll(".view-outreach-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const leadId = btn.dataset.leadId;
        const lead = state.leads.find(l => l.id === leadId);
        if (lead) openOutreachDrawer(lead);
      });
    });
  }

  // Open Slide-over Outreach Drawer
  function openOutreachDrawer(lead) {
    state.currentOutreachLead = lead;
    const draft = lead.outreach_draft || {};

    drawerCompanyTitle.textContent = `${lead.company_name} — Outreach`;
    drawerSignalText.textContent = lead.problem_symptom_matched;

    drawerEmailSubject.textContent = draft.subject_line || `Question re: ${lead.company_name}'s workflow`;
    drawerEmailBody.textContent = draft.cold_email_body || "No email body generated.";

    const firstEmail = (lead.public_emails && lead.public_emails[0]) || (lead.decision_makers && lead.decision_makers[0]?.email) || "";
    drawerMailtoLink.href = `mailto:${firstEmail}?subject=${encodeURIComponent(draft.subject_line || '')}&body=${encodeURIComponent(draft.cold_email_body || '')}`;

    drawerLiNote.textContent = draft.linkedin_dm_note || "No note generated.";
    drawerLiLen.textContent = (draft.linkedin_dm_note || "").length;

    drawerMomTest.textContent = `"${draft.mom_test_opener || 'What is your biggest current bottleneck?'}"`;

    drawerOverlay.style.display = "flex";
  }

  // Render Assumption Ledger
  function renderLedger() {
    const container = document.getElementById("ledger-items-container");
    container.innerHTML = "";

    const items = state.report.ledger_items || [];
    const statusMap = {
      user_provided: { label: "USER-PROVIDED", class: "status-user-provided" },
      user_confirmed: { label: "USER-CONFIRMED", class: "status-user-confirmed" },
      ai_interpretation: { label: "AI INTERPRETATION", class: "status-ai-interpretation" },
      external_signal: { label: "EXTERNAL SIGNAL", class: "status-external-signal" },
      assumption: { label: "ASSUMPTION (UNVERIFIED)", class: "status-assumption" },
      unknown: { label: "UNKNOWN (GAP)", class: "status-unknown" }
    };

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "ledger-item-card";

      const st = statusMap[item.status] || { label: item.status, class: "status-ai-interpretation" };
      const sourceHtml = item.source_url
        ? `<div style="font-size: 0.75rem; margin-top: 0.5rem;"><a href="${item.source_url}" target="_blank" rel="noopener">Provenance Source Link &nearr;</a></div>`
        : "";

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-muted);">${item.id} • ${item.category}</span>
          <span class="status-badge ${st.class}">${st.label}</span>
        </div>
        <p style="font-size: 0.9rem; font-weight: 600; color: #fff; margin-bottom: 0.4rem;">${item.statement}</p>
        <p style="font-size: 0.8rem; color: var(--ink-secondary);">${item.explanation}</p>
        ${sourceHtml}
      `;
      container.appendChild(card);
    });

    // Unknowns
    const unknownsList = document.getElementById("unknowns-list");
    unknownsList.innerHTML = "";
    (state.report.unknowns || []).forEach(u => {
      const li = document.createElement("li");
      li.textContent = u;
      unknownsList.appendChild(li);
    });
  }

  // Render Personas
  function renderPersonas() {
    const container = document.getElementById("personas-container");
    container.innerHTML = "";
    (state.report.buyer_personas || []).forEach(p => {
      const card = document.createElement("div");
      card.className = "persona-card";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h4 style="font-size: 1.05rem; color: #fff;">${p.role_title}</h4>
          <span class="status-badge status-ai-interpretation">${p.role_type.toUpperCase()}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--ink-secondary); margin-bottom: 0.5rem;">
          <strong>Operational Pain:</strong> ${p.core_pain_and_stake}
        </div>
        <div style="font-size: 0.825rem; color: var(--accent-cyan); margin-bottom: 0.5rem;">
          <strong>Authority Qualification:</strong> <em>${p.authority_qualification}</em>
        </div>
        <div style="font-size: 0.8rem; color: #f87171;">
          <strong>Deal-Breaker Risk:</strong> ${p.deal_breaker_risk}
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Render Validation Guide
  function renderValidationGuide() {
    const qContainer = document.getElementById("questions-container");
    qContainer.innerHTML = "";
    (state.report.validation_questions || []).forEach(q => {
      const item = document.createElement("div");
      item.style.marginBottom = "1rem";
      item.innerHTML = `
        <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--ink-muted); margin-bottom: 0.2rem;">
          Target: ${q.target_persona_title} (Linked: ${q.linked_item_id})
        </div>
        <blockquote style="font-size: 0.9rem; color: var(--status-user-provided); font-style: italic; margin-bottom: 0.35rem; padding-left: 0.75rem; border-left: 3px solid var(--status-user-provided);">
          "${q.discovery_question}"
        </blockquote>
        <div style="font-size: 0.8rem; color: var(--ink-secondary);">
          <strong>Validation Signal:</strong> ${q.validation_signal}
        </div>
      `;
      qContainer.appendChild(item);
    });

    const pContainer = document.getElementById("plan-container");
    pContainer.innerHTML = "";
    (state.report.validation_plan || []).forEach(s => {
      const step = document.createElement("div");
      step.style.marginBottom = "0.75rem";
      step.innerHTML = `
        <div style="font-size: 0.875rem; color: #fff; font-weight: 600;">Step ${s.step_number}: ${s.action}</div>
        <div style="font-size: 0.8rem; color: var(--ink-secondary);">Target: ${s.target_profile} • Decision Rule: <strong>${s.decision_rule}</strong></div>
      `;
      pContainer.appendChild(step);
    });
  }

  // ---------------------------------------------------------------------------
  // 6. Tab 2: 50 Unblocked Sources Directory Loader
  // ---------------------------------------------------------------------------

  async function loadUnblockedSources() {
    try {
      const res = await fetch("/api/unblocked-sources");
      const data = await res.json();
      state.sources = data.sources || [];
      renderSourcesCatalog();
    } catch (e) {
      console.warn("Sources load error:", e);
    }
  }

  function renderSourcesCatalog() {
    const container = document.getElementById("sources-catalog-container");
    if (!container) return;
    container.innerHTML = "";

    const filtered = state.activeSourceCategory === "all"
      ? state.sources
      : state.sources.filter(s => s.category === state.activeSourceCategory);

    filtered.forEach(src => {
      const card = document.createElement("div");
      card.className = "ledger-item-card";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
          <strong style="color: #fff; font-size: 0.9rem;">${src.name}</strong>
          <span class="status-badge status-user-provided">200 OK</span>
        </div>
        <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--accent-cyan); margin-bottom: 0.4rem;">
          ${src.category.toUpperCase()} • ${src.format.toUpperCase()}
        </div>
        <p style="font-size: 0.8rem; color: var(--ink-secondary); margin-bottom: 0.75rem; line-height: 1.4;">
          ${src.description}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.7rem; color: var(--ink-muted);">Keyless • Unrestricted</span>
          <button class="btn btn-secondary btn-sm test-scan-src-btn" data-src-id="${src.id}" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;">
            Scan Source &rarr;
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    document.querySelectorAll(".test-scan-src-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const srcId = btn.dataset.srcId;
        const query = prompt("Enter search keyword or role for this source:", "CTO software hiring");
        if (!query) return;

        btn.textContent = "Scanning...";
        btn.disabled = true;

        try {
          const res = await fetch("/api/scrape-source", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source_id: srcId,
              query: query,
              time_window_days: state.selectedTimeDays
            })
          });
          const result = await res.json();
          alert(`Scanned ${result.source_name}: Discovered ${result.results_count} matching client leads! Check Studio tab.`);
          if (result.results && result.results.length > 0) {
            state.leads = result.results;
            state.filteredLeads = [...state.leads];
            // Switch to studio tab
            document.querySelector(".tab-btn[data-tab='tab-studio']").click();
            resultsContainer.style.display = "block";
            filterAndRenderLeads();
          }
        } catch (e) {
          alert(`Error scanning source: ${e.message}`);
        } finally {
          btn.textContent = "Scan Source →";
          btn.disabled = false;
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 7. Tab 3: GTM Workbooks & Saved Campaigns Loader
  // ---------------------------------------------------------------------------

  async function loadCampaigns() {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      state.campaigns = data.campaigns || [];
      const badge = document.getElementById("tab-campaigns-badge");
      if (badge) badge.textContent = state.campaigns.length;
      renderCampaignsList();
    } catch (e) {
      console.warn("Campaigns load error:", e);
    }
  }

  function renderCampaignsList() {
    const container = document.getElementById("campaigns-list-container");
    if (!container) return;
    container.innerHTML = "";

    if (state.campaigns.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--ink-muted); padding: 2rem;">
          No saved campaigns yet. Run your first discovery in the Studio tab to auto-save a workbook.
        </div>
      `;
      return;
    }

    state.campaigns.forEach(c => {
      const item = document.createElement("div");
      item.className = "ledger-item-card";
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";

      const dateStr = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      item.innerHTML = `
        <div>
          <strong style="color: #fff; font-size: 0.95rem;">${c.name}</strong>
          <div style="font-size: 0.75rem; color: var(--ink-secondary); margin-top: 0.2rem;">
            Saved on ${dateStr} • ${c.leads_count} Leads Discovered
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary btn-sm open-campaign-btn" data-camp-id="${c.id}" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
            Open Workbook &rarr;
          </button>
        </div>
      `;
      container.appendChild(item);
    });

    document.querySelectorAll(".open-campaign-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const campId = btn.dataset.campId;
        try {
          const res = await fetch(`/api/campaigns/${campId}`);
          const camp = await res.json();
          state.currentCampaignId = camp.id;
          state.leads = camp.leads || [];
          state.filteredLeads = [...state.leads];

          // Switch to studio tab & render leads
          document.querySelector(".tab-btn[data-tab='tab-studio']").click();
          resultsContainer.style.display = "block";
          filterAndRenderLeads();
          prospectsTableBody.scrollIntoView({ behavior: "smooth" });
        } catch (e) {
          alert(`Error opening campaign: ${e.message}`);
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 8. Export Operations (CSV, Markdown, JSON, Copy Emails)
  // ---------------------------------------------------------------------------

  async function downloadCsv() {
    if (!state.report) {
      alert("Please run a discovery first.");
      return;
    }
    try {
      const res = await fetch("/api/export/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.report)
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `icp_prospects_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert(`Error exporting CSV: ${e.message}`);
    }
  }

  function copyAllEmails() {
    const emails = [];
    state.leads.forEach(l => {
      if (l.public_emails) emails.push(...l.public_emails);
      if (l.decision_makers) {
        l.decision_makers.forEach(d => {
          if (d.email) emails.push(d.email);
        });
      }
    });
    const unique = Array.from(new Set(emails));
    if (unique.length === 0) {
      alert("No email addresses discovered in the current leads list.");
      return;
    }
    navigator.clipboard.writeText(unique.join(", "));
    alert(`Copied ${unique.length} unique email addresses to clipboard!`);
  }

  async function downloadMarkdown() {
    if (!state.report) return;
    try {
      const res = await fetch("/api/export/markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.report)
      });
      const md = await res.text();
      const blob = new Blob([md], { type: "text/markdown" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `icp_validation_report_${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert(`Markdown export error: ${e.message}`);
    }
  }

  async function copyMarkdown() {
    if (!state.report) return;
    try {
      const res = await fetch("/api/export/markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.report)
      });
      const md = await res.text();
      navigator.clipboard.writeText(md);
      btnCopyMarkdown.textContent = "✓ Copied Markdown!";
      setTimeout(() => btnCopyMarkdown.textContent = "📋 Copy Markdown", 2000);
    } catch (e) {
      alert(`Copy error: ${e.message}`);
    }
  }

  function downloadJson() {
    if (!state.report) return;
    const jsonStr = JSON.stringify(state.report, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `icp_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Run initialization
  init();
});
