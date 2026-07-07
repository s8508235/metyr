// 1. Listen for the Keyboard Shortcut (Ctrl+D) from Background Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "triggerTranslation") {
    const selection = window.getSelection().toString().trim();
    if (selection) {
      chrome.runtime.sendMessage({ action: "startTranslation", text: selection });
    }
  } else if (request.action === "showLoading") {
    showOverlay(request.text || "Translating...");
  } else if (request.action === "showResult") {
    showOverlay(request.text, true);
  } else if (request.action === "showError") {
    showOverlay(request.text, true, true); // Added isError flag
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

function showOverlay(text, isResult = false, isError = false) {
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
      cursor: "grab",
      userSelect: "none"
    });
    document.body.appendChild(div);
    makeElementDraggable(div);
  }

  // Visual feedback for errors
  div.style.borderLeft = isError ? "4px solid #FF3B30" : "4px solid #007AFF";
  div.innerText = text;

  if (isResult || isError) {
    const closeHint = document.createElement('div');
    closeHint.innerText = "(Double-click to close)";
    closeHint.style.fontSize = "10px";
    closeHint.style.marginTop = "8px";
    closeHint.style.opacity = "0.6";
    div.appendChild(closeHint);
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

    // Calculate proposed positions
    let newTop = el.offsetTop - pos2;
    let newLeft = el.offsetLeft - pos1;

    // Boundary Constraints
    const minTop = 0;
    const minLeft = 0;
    const maxTop = window.innerHeight - el.offsetHeight;
    const maxLeft = window.innerWidth - el.offsetWidth;

    // Restrict Top/Bottom
    if (newTop < minTop) newTop = minTop;
    else if (newTop > maxTop) newTop = maxTop;

    // Restrict Left/Right
    if (newLeft < minLeft) newLeft = minLeft;
    else if (newLeft > maxLeft) newLeft = maxLeft;

    // Apply restricted coordinates
    el.style.bottom = "auto";
    el.style.right = "auto";
    el.style.top = newTop + "px";
    el.style.left = newLeft + "px";
  }

  function closeDragElement() {
    el.style.cursor = "grab";
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
