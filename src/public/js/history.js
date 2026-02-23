import { formatDateTime } from "./utils.js";

let historyEl;

export function initHistory(el) {
  historyEl = el;
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("g2_messages") || "[]");
  } catch { return []; }
}

export function saveMessage(text, contactName) {
  const history = getHistory();
  const entry = {
    text,
    contact: contactName,
    timestamp: new Date().toISOString(),
  };
  history.unshift(entry);
  if (history.length > 100) history.length = 100;
  localStorage.setItem("g2_messages", JSON.stringify(history));
  return entry;
}

export function renderHistory() {
  const history = getHistory();
  if (history.length === 0) {
    historyEl.innerHTML = "";
    return;
  }
  let html = "<h2>History</h2>";
  for (const item of history.slice(0, 20)) {
    const contactLabel = item.contact ? ` → ${item.contact}` : "";
    html += `<div class="history-item">
      <div class="time">${formatDateTime(item.timestamp)}${contactLabel}</div>
      <div class="text">${item.text}</div>
    </div>`;
  }
  historyEl.innerHTML = html;
}
