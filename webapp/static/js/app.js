// API Configuration
const API_CONFIG = {
  GEMINI_API_KEY: "gen-lang-client-0291253118",
  GEMINI_BASE_URL: "https://generativelanguage.googleapis.com/v1beta/models",
  GEMINI_MODEL: "gemini-1.5-flash",
  LIBRE_TRANSLATE_URL: "https://libretranslate.com/translate",
  MYMEMORY_BASE_URL: "https://api.mymemory.translated.net/get",
};

// Telegram Web App Integration
let tg = window.Telegram.WebApp;

// Initialize Telegram Web App
tg.ready();
tg.expand();

// Theme handling
function initTheme() {
  const themeParams = tg.themeParams;

  if (themeParams.bg_color) {
    document.documentElement.style.setProperty(
      "--tg-theme-bg-color",
      themeParams.bg_color,
    );
  }
  if (themeParams.text_color) {
    document.documentElement.style.setProperty(
      "--tg-theme-text-color",
      themeParams.text_color,
    );
  }
  if (themeParams.hint_color) {
    document.documentElement.style.setProperty(
      "--tg-theme-hint-color",
      themeParams.hint_color,
    );
  }
  if (themeParams.link_color) {
    document.documentElement.style.setProperty(
      "--tg-theme-link-color",
      themeParams.link_color,
    );
  }
  if (themeParams.button_color) {
    document.documentElement.style.setProperty(
      "--tg-theme-button-color",
      themeParams.button_color,
    );
  }
  if (themeParams.button_text_color) {
    document.documentElement.style.setProperty(
      "--tg-theme-button-text-color",
      themeParams.button_text_color,
    );
  }
  if (themeParams.secondary_bg_color) {
    document.documentElement.style.setProperty(
      "--tg-theme-secondary-bg-color",
      themeParams.secondary_bg_color,
    );
  }

  // Apply dark theme if needed
  if (tg.colorScheme === "dark") {
    document.body.classList.add("dark-theme");
  }
}

// Global variables
let currentHistory = [];
let isTranslating = false;

// DOM elements
const elements = {
  inputText: document.getElementById("inputText"),
  outputText: document.getElementById("outputText"),
  fromLang: document.getElementById("fromLang"),
  toLang: document.getElementById("toLang"),
  swapBtn: document.getElementById("swapLangs"),
  translateBtn: document.getElementById("translateBtn"),
  clearBtn: document.getElementById("clearBtn"),
  copyBtn: document.getElementById("copyBtn"),
  shareBtn: document.getElementById("shareBtn"),
  charCount: document.querySelector(".char-count"),
  historySection: document.getElementById("historySection"),
  historyList: document.getElementById("historyList"),
  fileSection: document.getElementById("fileSection"),
  fileInput: document.getElementById("fileInput"),
  uploadArea: document.getElementById("uploadArea"),
  fileProgress: document.getElementById("fileProgress"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  toastContainer: document.getElementById("toastContainer"),
  themeToggle: document.getElementById("themeToggle"),
};

// Language mappings
const languages = {
  auto: { name: "🔍 Avtomatik aniqlash", flag: "🔍" },
  uz: { name: "O'zbek", flag: "🇺🇿" },
  en: { name: "Ingliz", flag: "🇺🇸" },
  ru: { name: "Rus", flag: "🇷🇺" },
  fr: { name: "Fransuz", flag: "🇫🇷" },
  de: { name: "Nemis", flag: "🇩🇪" },
  es: { name: "Ispan", flag: "🇪🇸" },
  ar: { name: "Arab", flag: "🇸🇦" },
  tr: { name: "Turk", flag: "🇹🇷" },
  ja: { name: "Yapon", flag: "🇯🇵" },
  ko: { name: "Koreys", flag: "🇰🇷" },
  zh: { name: "Xitoy", flag: "🇨🇳" },
  hi: { name: "Hindi", flag: "🇮🇳" },
};

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initEventListeners();
  loadHistory();
  updateCharCount();

  // Set default languages
  elements.fromLang.value = "auto";
  elements.toLang.value = "uz";

  showToast("Web App yuklandi!", "success");
});

// Event listeners
function initEventListeners() {
  // Text input events
  elements.inputText.addEventListener("input", function () {
    updateCharCount();
    if (this.value.trim()) {
      elements.translateBtn.disabled = false;
    } else {
      elements.translateBtn.disabled = true;
    }
  });

  // Translation button
  elements.translateBtn.addEventListener("click", translateText);

  // Language swap
  elements.swapBtn.addEventListener("click", swapLanguages);

  // Clear button
  elements.clearBtn.addEventListener("click", clearText);

  // Copy button
  elements.copyBtn.addEventListener("click", copyTranslation);

  // Share button
  elements.shareBtn.addEventListener("click", shareTranslation);

  // Theme toggle
  elements.themeToggle.addEventListener("click", toggleTheme);

  // Quick action buttons
  document.querySelectorAll(".quick-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const action = this.dataset.action;
      handleQuickAction(action);
    });
  });

  // File upload
  elements.uploadArea.addEventListener("click", () =>
    elements.fileInput.click(),
  );
  elements.uploadArea.addEventListener("dragover", handleDragOver);
  elements.uploadArea.addEventListener("drop", handleFileDrop);
  elements.fileInput.addEventListener("change", handleFileSelect);

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          if (!isTranslating) translateText();
          break;
        case "k":
          e.preventDefault();
          elements.inputText.focus();
          break;
        case "l":
          e.preventDefault();
          clearText();
          break;
      }
    }
  });
}

// Update character count
function updateCharCount() {
  const count = elements.inputText.value.length;
  elements.charCount.textContent = `${count}/5000`;

  if (count > 4500) {
    elements.charCount.style.color = "var(--danger-color)";
  } else if (count > 4000) {
    elements.charCount.style.color = "var(--warning-color)";
  } else {
    elements.charCount.style.color = "var(--tg-theme-hint-color)";
  }
}

// Main translation function
async function translateText() {
  const text = elements.inputText.value.trim();
  if (!text) {
    showToast("Iltimos, tarjima qilinadigan matnni kiriting", "error");
    return;
  }

  const fromLang = elements.fromLang.value;
  const toLang = elements.toLang.value;

  console.log("Translation started:", { text, fromLang, toLang });

  if (fromLang !== "auto" && fromLang === toLang) {
    showToast("Bir xil tillarni tanlab bo'lmaydi", "error");
    return;
  }

  isTranslating = true;
  elements.translateBtn.disabled = true;
  elements.translateBtn.innerHTML = `
        <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
        Tarjima qilinmoqda...
    `;

  showLoadingOverlay(true);

  try {
    // Send translation request to backend API
    const translationData = {
      text: text,
      from_lang: fromLang,
      to_lang: toLang,
      user_id: tg.initDataUnsafe?.user?.id || "anonymous",
    };

    console.log("Calling translation API with data:", translationData);

    // Call real translation API
    const translatedText = await callTranslationAPI(translationData);

    console.log("Translation result:", translatedText);

    displayTranslation(translatedText);
    addToHistory(text, translatedText, fromLang, toLang);

    showToast("Tarjima muvaffaqiyatli bajarildi!", "success");

    // Send success data back to bot
    tg.sendData(
      JSON.stringify({
        action: "translation_completed",
        original: text,
        translated: translatedText,
        from_lang: fromLang,
        to_lang: toLang,
      }),
    );
  } catch (error) {
    console.error("Translation error:", error);
    showToast("Tarjima qilishda xatolik yuz berdi: " + error.message, "error");
    elements.outputText.textContent =
      "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
  } finally {
    isTranslating = false;
    elements.translateBtn.disabled = false;
    elements.translateBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 8L3 12L5 16M19 8L21 12L19 16M11 4L7 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Tarjima qilish
        `;
    showLoadingOverlay(false);
  }
}

// Real translation API function
async function callTranslationAPI(translationData) {
  console.log("Starting translation API calls...");

  // First try simple translation with provided API key
  try {
    console.log("Trying simple API translation...");
    const simpleResult = await translateWithSimpleAPI(translationData);
    if (simpleResult) {
      console.log("Simple API translation successful:", simpleResult);
      return simpleResult;
    }
  } catch (error) {
    console.warn("Simple API failed, trying other methods:", error);
  }

  // Try LibreTranslate API
  try {
    console.log("Trying LibreTranslate API...");
    const response = await fetch(API_CONFIG.LIBRE_TRANSLATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: translationData.text,
        source:
          translationData.from_lang === "auto"
            ? "auto"
            : translationData.from_lang,
        target: translationData.to_lang,
        format: "text",
      }),
    });

    console.log("LibreTranslate response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("LibreTranslate response:", data);
      return data.translatedText;
    }
  } catch (error) {
    console.warn("LibreTranslate failed, trying MyMemory:", error);
  }

  // Fallback to MyMemory API
  try {
    console.log("Trying MyMemory API...");
    const langPair =
      translationData.from_lang === "auto"
        ? `en|${translationData.to_lang}`
        : `${translationData.from_lang}|${translationData.to_lang}`;

    const url = `${API_CONFIG.MYMEMORY_BASE_URL}?q=${encodeURIComponent(translationData.text)}&langpair=${langPair}`;
    console.log("MyMemory URL:", url);

    const response = await fetch(url);
    console.log("MyMemory response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("MyMemory response:", data);
      if (data.responseStatus === 200 && data.responseData) {
        return data.responseData.translatedText;
      }
    }
  } catch (error) {
    console.warn("MyMemory failed, trying backend:", error);
  }

  // Try basic rule-based translation as final fallback
  try {
    console.log("Using rule-based fallback...");
    const fallbackResult = await basicTranslation(translationData);
    if (fallbackResult) {
      return fallbackResult;
    }
  } catch (error) {
    console.warn("Rule-based translation failed:", error);
  }

  // If all methods fail, return error
  console.error("All translation methods failed!");
  throw new Error(
    "Barcha tarjima xizmatlari ishlamayapti. Iltimos, keyinroq qayta urinib ko'ring.",
  );
}

// Simple API translation function
async function translateWithSimpleAPI(translationData) {
  const API_KEY = API_CONFIG.GEMINI_API_KEY;

  console.log("Using API key:", API_KEY);

  // Try multiple endpoints with the provided key
  const endpoints = [
    {
      name: "Google Translate API",
      url: `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        q: translationData.text,
        source:
          translationData.from_lang === "auto" ? "" : translationData.from_lang,
        target: translationData.to_lang,
        format: "text",
      },
    },
    {
      name: "Alternative Translate API",
      url: "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": API_KEY,
      },
      body: [
        {
          text: translationData.text,
        },
      ],
      params: `&to=${translationData.to_lang}${translationData.from_lang !== "auto" ? `&from=${translationData.from_lang}` : ""}`,
    },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying ${endpoint.name}...`);

      const response = await fetch(endpoint.url + (endpoint.params || ""), {
        method: endpoint.method,
        headers: endpoint.headers,
        body: JSON.stringify(endpoint.body),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`${endpoint.name} response:`, data);

        // Handle Google Translate format
        if (data.data && data.data.translations) {
          return data.data.translations[0].translatedText;
        }

        // Handle Microsoft Translator format
        if (Array.isArray(data) && data[0] && data[0].translations) {
          return data[0].translations[0].text;
        }
      } else {
        console.warn(`${endpoint.name} failed with status:`, response.status);
      }
    } catch (error) {
      console.warn(`${endpoint.name} failed:`, error.message);
    }
  }

  throw new Error("All API endpoints failed");
}

// Basic rule-based translation fallback
async function basicTranslation(translationData) {
  const { text, from_lang, to_lang } = translationData;

  // Basic word replacements for common phrases
  const basicDictionary = {
    hello: { uz: "salom", ru: "привет", en: "hello" },
    hi: { uz: "salom", ru: "привет", en: "hello" },
    good: { uz: "yaxshi", ru: "хорошо", en: "good" },
    bad: { uz: "yomon", ru: "плохо", en: "bad" },
    yes: { uz: "ha", ru: "да", en: "yes" },
    no: { uz: "yo'q", ru: "нет", en: "no" },
    "thank you": { uz: "rahmat", ru: "спасибо", en: "thank you" },
    thanks: { uz: "rahmat", ru: "спасибо", en: "thanks" },
    please: { uz: "iltimos", ru: "пожалуйста", en: "please" },
    sorry: { uz: "kechirasiz", ru: "извините", en: "sorry" },
    water: { uz: "suv", ru: "вода", en: "water" },
    food: { uz: "ovqat", ru: "еда", en: "food" },
    house: { uz: "uy", ru: "дом", en: "house" },
    car: { uz: "mashina", ru: "машина", en: "car" },
    book: { uz: "kitob", ru: "книга", en: "book" },
    school: { uz: "maktab", ru: "школа", en: "school" },
    work: { uz: "ish", ru: "работа", en: "work" },
    family: { uz: "oila", ru: "семья", en: "family" },
    friend: { uz: "do'st", ru: "друг", en: "friend" },
    love: { uz: "sevgi", ru: "любовь", en: "love" },
  };

  const lowerText = text.toLowerCase().trim();

  if (basicDictionary[lowerText] && basicDictionary[lowerText][to_lang]) {
    return basicDictionary[lowerText][to_lang];
  }

  // If no direct match, try to find partial matches
  for (const [key, translations] of Object.entries(basicDictionary)) {
    if (lowerText.includes(key) && translations[to_lang]) {
      return `${translations[to_lang]} (${text})`;
    }
  }

  // Return with language indicator if all else fails
  const langFlags = {
    uz: "🇺🇿",
    en: "🇺🇸",
    ru: "🇷🇺",
    fr: "🇫🇷",
    de: "🇩🇪",
    es: "🇪🇸",
  };
  return `${langFlags[to_lang] || ""} ${text}`;
}

function getBackendUrl() {
  // Try to detect backend URL from current location or config
  const hostname = window.location.hostname;

  // If running locally
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000";
  }

  // If running on ngrok or similar
  if (hostname.includes("ngrok")) {
    return `https://${hostname}`;
  }

  // Return null if no backend detected
  return null;
}

// Display translation result
function displayTranslation(translatedText) {
  elements.outputText.textContent = translatedText;
  elements.outputText.classList.add("has-content");
  elements.copyBtn.disabled = false;
  elements.shareBtn.disabled = false;
}

// Swap languages
function swapLanguages() {
  if (elements.fromLang.value === "auto") {
    showToast("Avtomatik aniqlash rejimida til almashtirib bo'lmaydi", "info");
    return;
  }

  const fromValue = elements.fromLang.value;
  const toValue = elements.toLang.value;

  elements.fromLang.value = toValue;
  elements.toLang.value = fromValue;

  // Animate button
  elements.swapBtn.style.transform = "rotate(180deg) scale(1.1)";
  setTimeout(() => {
    elements.swapBtn.style.transform = "";
  }, 300);

  showToast("Tillar almashtirildi", "success");
}

// Clear text
function clearText() {
  elements.inputText.value = "";
  elements.outputText.textContent = "Tarjima bu yerda ko'rinadi...";
  elements.outputText.classList.remove("has-content");
  elements.translateBtn.disabled = true;
  elements.copyBtn.disabled = true;
  elements.shareBtn.disabled = true;
  updateCharCount();
  elements.inputText.focus();
  showToast("Matn tozalandi", "info");
}

// Copy translation
async function copyTranslation() {
  const text = elements.outputText.textContent;
  if (!text || text === "Tarjima bu yerda ko'rinadi...") {
    showToast("Nusxalanadigan matn topilmadi", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast("Matn nusxalandi!", "success");

    // Animate copy button
    elements.copyBtn.style.transform = "scale(1.2)";
    setTimeout(() => {
      elements.copyBtn.style.transform = "";
    }, 200);
  } catch (error) {
    console.error("Copy failed:", error);
    showToast("Nusxalashda xatolik", "error");
  }
}

// Share translation
function shareTranslation() {
  const originalText = elements.inputText.value.trim();
  const translatedText = elements.outputText.textContent;

  if (!translatedText || translatedText === "Tarjima bu yerda ko'rinadi...") {
    showToast("Ulashiladigan tarjima topilmadi", "error");
    return;
  }

  const shareText = `📝 *Tarjima:*\n\n🔤 Asl matn: ${originalText}\n\n✅ Tarjima: ${translatedText}\n\n🤖 @Transalate_uz_bot`;

  // Send data back to Telegram to share
  tg.sendData(
    JSON.stringify({
      action: "share_translation",
      share_text: shareText,
    }),
  );

  showToast("Tarjima ulashish uchun tayyorlandi", "success");
}

// Toggle theme
function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  const isDark = document.body.classList.contains("dark-theme");

  // Save theme preference
  localStorage.setItem("theme", isDark ? "dark" : "light");

  showToast(`${isDark ? "Qorong'i" : "Yorug'"} rejim yoqildi`, "success");
}

// Handle quick actions
function handleQuickAction(action) {
  switch (action) {
    case "favorites":
      showToast("Sevimli tillar tez orada!", "info");
      break;
    case "history":
      toggleHistorySection();
      break;
    case "file":
      toggleFileSection();
      break;
    case "voice":
      showToast("Ovozli tarjima tez orada!", "info");
      break;
  }
}

// Toggle history section
function toggleHistorySection() {
  const isVisible = elements.historySection.style.display !== "none";

  if (isVisible) {
    elements.historySection.style.display = "none";
    elements.fileSection.style.display = "none";
  } else {
    elements.historySection.style.display = "block";
    elements.fileSection.style.display = "none";
    elements.historySection.classList.add("slide-up");
    displayHistory();
  }
}

// Toggle file section
function toggleFileSection() {
  const isVisible = elements.fileSection.style.display !== "none";

  if (isVisible) {
    elements.fileSection.style.display = "none";
    elements.historySection.style.display = "none";
  } else {
    elements.fileSection.style.display = "block";
    elements.historySection.style.display = "none";
    elements.fileSection.classList.add("slide-up");
  }
}

// Add translation to history
function addToHistory(original, translated, fromLang, toLang) {
  const historyItem = {
    id: Date.now(),
    original: original,
    translated: translated,
    fromLang: fromLang,
    toLang: toLang,
    timestamp: new Date().toISOString(),
  };

  currentHistory.unshift(historyItem);

  // Keep only last 50 items
  if (currentHistory.length > 50) {
    currentHistory = currentHistory.slice(0, 50);
  }

  saveHistory();
}

// Display history
function displayHistory() {
  elements.historyList.innerHTML = "";

  if (currentHistory.length === 0) {
    elements.historyList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--tg-theme-hint-color);">
                <p>Hali tarjima tarixi yo'q</p>
            </div>
        `;
    return;
  }

  currentHistory.forEach((item) => {
    const historyElement = createHistoryElement(item);
    elements.historyList.appendChild(historyElement);
  });
}

// Create history element
function createHistoryElement(item) {
  const element = document.createElement("div");
  element.className = "history-item";

  const fromLangName = languages[item.fromLang]?.name || item.fromLang;
  const toLangName = languages[item.toLang]?.name || item.toLang;
  const timeAgo = getTimeAgo(new Date(item.timestamp));

  element.innerHTML = `
        <div class="languages">${fromLangName} → ${toLangName} • ${timeAgo}</div>
        <div class="text">
            <div class="original">${item.original}</div>
            <div class="translated">${item.translated}</div>
        </div>
    `;

  element.addEventListener("click", () => {
    elements.inputText.value = item.original;
    elements.fromLang.value = item.fromLang;
    elements.toLang.value = item.toLang;
    elements.outputText.textContent = item.translated;
    elements.outputText.classList.add("has-content");
    updateCharCount();
    elements.translateBtn.disabled = false;
    elements.copyBtn.disabled = false;
    elements.shareBtn.disabled = false;
    showToast("Tarjima yuklandi", "success");
    toggleHistorySection();
  });

  return element;
}

// Get time ago string
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hozirgina";
  if (diffMins < 60) return `${diffMins} daqiqa oldin`;
  if (diffHours < 24) return `${diffHours} soat oldin`;
  if (diffDays < 30) return `${diffDays} kun oldin`;

  return date.toLocaleDateString();
}

// Save history to localStorage
function saveHistory() {
  try {
    localStorage.setItem("translationHistory", JSON.stringify(currentHistory));
  } catch (error) {
    console.error("Failed to save history:", error);
  }
}

// Load history from localStorage
function loadHistory() {
  try {
    const saved = localStorage.getItem("translationHistory");
    if (saved) {
      currentHistory = JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load history:", error);
    currentHistory = [];
  }
}

// File upload handlers
function handleDragOver(e) {
  e.preventDefault();
  elements.uploadArea.classList.add("dragover");
}

function handleFileDrop(e) {
  e.preventDefault();
  elements.uploadArea.classList.remove("dragover");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    handleFile(file);
  }
}

// Handle file processing
function handleFile(file) {
  if (!file.type.includes("text") && !file.name.endsWith(".txt")) {
    showToast("Faqat matnli fayllar (.txt) qabul qilinadi", "error");
    return;
  }

  if (file.size > 1024 * 1024) {
    // 1MB limit
    showToast("Fayl hajmi 1MB dan oshmasligi kerak", "error");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const content = e.target.result;
    elements.inputText.value = content.slice(0, 5000); // Limit to 5000 characters
    updateCharCount();
    elements.translateBtn.disabled = false;
    showToast("Fayl muvaffaqiyatli yuklandi!", "success");
    toggleFileSection();
  };

  reader.onerror = function () {
    showToast("Fayl o'qishda xatolik", "error");
  };

  // Show progress
  elements.fileProgress.style.display = "block";
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 10;
    elements.fileProgress.querySelector(".progress-fill").style.width =
      progress + "%";

    if (progress >= 100) {
      clearInterval(progressInterval);
      setTimeout(() => {
        elements.fileProgress.style.display = "none";
        elements.fileProgress.querySelector(".progress-fill").style.width =
          "0%";
      }, 500);
    }
  }, 50);

  reader.readAsText(file);
}

// Show/hide loading overlay
function showLoadingOverlay(show) {
  elements.loadingOverlay.style.display = show ? "flex" : "none";
}

// Show toast notification
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icon = getToastIcon(type);
  toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

  elements.toastContainer.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease reverse";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Get toast icon
function getToastIcon(type) {
  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        </svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
        </svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 16V12" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8H12.01" stroke="currentColor" stroke-width="2"/>
        </svg>`,
  };

  return icons[type] || icons.info;
}

// Handle Telegram Web App events
tg.onEvent("mainButtonClicked", function () {
  translateText();
});

tg.onEvent("backButtonClicked", function () {
  if (elements.historySection.style.display !== "none") {
    toggleHistorySection();
  } else if (elements.fileSection.style.display !== "none") {
    toggleFileSection();
  } else {
    tg.close();
  }
});

// Set main button
tg.MainButton.setText("Tarjima qilish");
tg.MainButton.show();

// Handle viewport changes
window.addEventListener("resize", function () {
  tg.expand();
});

// Export functions for testing
window.TranslationApp = {
  translateText,
  swapLanguages,
  clearText,
  showToast,
  handleQuickAction,
};
