const INSTRUCTION = "You are a professional translator. Translate the English text below into Traditional Chinese as used in Taiwan (zh-TW / 臺灣正體). Use Taiwanese vocabulary and phrasing (e.g. 軟體, 程式, 網路, 影片), not Mainland terms. Preserve meaning, tone, and any formatting. Output ONLY the translation - no pinyin, no notes, no original text, no surrounding quotation marks.\n\nEnglish:\n";

// Helper to get current config
async function getConfig() {
  const defaults = {
    host: 'http://localhost:8000',
    transcribePath: '/v1/chat/completions',
    healthPath: '/health'
  };
  return new Promise((resolve) => {
    chrome.storage.local.get(defaults, (settings) => {
      resolve(settings);
    });
  });
}

async function isServerHealthy(config) {
  try {
    const url = config.host + config.healthPath;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (e) {
    return false;
  }
}


chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translate-to-zhtw",
    title: "Translate to zh-TW",
    contexts: ["selection"]
  });
});

// Listener for keyboard shortcut (Ctrl+D)
chrome.commands.onCommand.addListener((command) => {
  if (command === "translate-selection") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "triggerTranslation" });
      }
    });
  }
});

// Listener for right-click menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate-to-zhtw" && info.selectionText) {
    performTranslation(info.selectionText, tab.id);
  }
});

// Listener for messages from content.js (floating button click)
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "startTranslation") {
    performTranslation(request.text, sender.tab.id);
  }
});

async function performTranslation(text, tabId) {

  const config = await getConfig();
  // 1. Show "Checking connection..." or "Translating..."
  chrome.tabs.sendMessage(tabId, { action: "showLoading", text: "Checking server..." });

  // 2. Perform Health Check
  const healthy = await isServerHealthy(config);

  if (!healthy) {
    chrome.tabs.sendMessage(tabId, {
      action: "showError",
      text: "❌ Server is currently offline. Please try again later."
    });
    return; // Ignore the request
  }

  // 3. Proceed with Translation if healthy
  chrome.tabs.sendMessage(tabId, { action: "showLoading", text: "Translating..." });

  const payload = {
    messages: [{ role: "user", content: INSTRUCTION + text }],
    temperature: 0,
    top_p: 1.0,
    stream: false,
    cache_prompt: true
  };

  console.log("Sending payload:", payload);

  const url = config.host + config.transcribePath;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Server response:", data);

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const result = data.choices[0].message.content.trim();
      chrome.tabs.sendMessage(tabId, { action: "showResult", text: result });
    } else {
      throw new Error("Unexpected JSON structure from server");
    }

  } catch (error) {
    console.error("Translation Error:", error);
    chrome.tabs.sendMessage(tabId, {
      action: "showResult",
      text: "Error: " + error.message
    });
  }
}
