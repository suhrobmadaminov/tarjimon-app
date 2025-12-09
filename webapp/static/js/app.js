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
    showToast("Tarjima qilishda xatolik yuz berdi", "error");
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

// Simulate translation (replace with actual API call)
// Real translation API function
async function callTranslationAPI(translationData) {
  // Try multiple translation methods
  console.log("Starting translation API calls...");

  // First try LibreTranslate API
  try {
    console.log("Trying LibreTranslate API...");
    const response = await fetch("https://libretranslate.com/translate", {
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

    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(translationData.text)}&langpair=${langPair}`,
    );
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(translationData.text)}&langpair=${langPair}`;
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

  // Fallback to local backend API if available
  try {
    console.log("Trying backend API...");
    const backendUrl = getBackendUrl();
    console.log("Backend URL:", backendUrl);
    if (backendUrl) {
      const response = await fetch(`${backendUrl}/api/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(translationData),
      });

      console.log("Backend response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Backend response:", data);
        if (data.success) {
          return data.translated_text;
        }
      }
    }
  } catch (error) {
    console.warn("Backend API failed:", error);
  }

  // If all methods fail, return simple fallback
  console.error("All translation methods failed!");
  throw new Error(
    "Barcha tarjima xizmatlari ishlamayapti. Iltimos, keyinroq qayta urinib ko'ring.",
  );
}

function getBackendUrl() {
