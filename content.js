// 1. Listen for the Keyboard Shortcut (Ctrl+D) from Background Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "triggerTranslation") {
    const selection = window.getSelection().toString().trim();
    if (selection) {
      chrome.runtime.sendMessage({ action: "startTranslation", text: selection });
    }
  } else if (request.action === "showLoading") {
    showOverlay("Translating...");
  } else if (request.action === "showResult") {
    showOverlay(request.text, true);
  }
});

// Prevent default browser bookmarking for Ctrl+D if text is selected
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
    if (window.getSelection().toString().trim()) {
      e.preventDefault(); 
    }
  }
});

function showOverlay(text, isResult = false) {
  let div = document.getElementById("ai-translation-overlay");
  
  if (!div) {
    div = document.createElement("div");
    div.id = "ai-translation-overlay";
    Object.assign(div.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      padding: "15px",
      backgroundColor: "#1e1e1e",
      color: "#ffffff",
      borderRadius: "8px",
      zIndex: "1000000",
      maxWidth: "350px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
      fontFamily: "sans-serif",
      fontSize: "14px",
      lineHeight: "1.6",
      borderLeft: "4px solid #007AFF",
      cursor: "grab", // Indicate it can be moved
      userSelect: "none" // Prevent text selection while dragging
    });
    
    document.body.appendChild(div);
    makeElementDraggable(div);
  }

  div.innerText = text;

  if (isResult) {
    // We add a small "x" or instruction because clicking now might conflict with dragging
    const closeHint = document.createElement('div');
    closeHint.innerText = "(Double-click to close)";
    closeHint.style.fontSize = "10px";
    closeHint.style.marginTop = "8px";
    closeHint.style.opacity = "0.6";
    div.appendChild(closeHint);
    
    // Use double click to remove so single clicks can be used for dragging
    div.ondblclick = () => div.remove();
  }
}

function makeElementDraggable(el) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  el.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    // Get mouse position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Change cursor
    el.style.cursor = "grabbing";

    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    // Calculate new position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    // Switch from bottom/right to top/left to allow free movement
    const rect = el.getBoundingClientRect();
    el.style.bottom = "auto";
    el.style.right = "auto";
    el.style.top = (rect.top - pos2) + "px";
    el.style.left = (rect.left - pos1) + "px";
  }

  function closeDragElement() {
    el.style.cursor = "grab";
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
