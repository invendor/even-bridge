import { S } from "./state.js";
import { initUtils, log, setStatus, getStatusText } from "./utils.js";
import { initHistory, renderHistory } from "./history.js";
import { initBrowserUI } from "./ui/browser.js";
import { connectWebSocket } from "./ws.js";
import { toggleRecording } from "./recording.js";
import { loadLogoData } from "./api.js";
import {
  goToMessengerSelect, goToContacts, goToConversation,
  selectMessenger, sendPendingMessage, cancelPreview,
  refreshConversation, requestWakeLock,
} from "./state.js";
import {
  showStartupScreen, showGlassesMessengerSelect,
  updateGlassesMessengerSelection,
} from "./ui/glasses.js";

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Bridge not detected within ${ms}ms`)), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

// --- Visibility change handler ---
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    S.pageAbort.abort();
    log("Page hidden — aborted in-flight fetches");
  } else if (document.visibilityState === "visible") {
    S.pageAbort = new AbortController();
    requestWakeLock();
    log("Page visible — resuming");

    const status = getStatusText();
    if (status.startsWith("Loading contacts") || status === "Initializing...") {
      log("Resuming from lock — retrying contacts");
      goToContacts();
    } else if (status.startsWith("Loading conversation") && S.selectedContact) {
      log("Resuming from lock — retrying conversation");
      goToConversation(S.selectedContact);
    } else if (S.appState === "conversation" && S.selectedContact) {
      log("Resuming from lock — refreshing conversation");
      refreshConversation();
    }

    if (!S.ws || S.ws.readyState === WebSocket.CLOSED || S.ws.readyState === WebSocket.CLOSING) {
      log("WebSocket dead after wake — reconnecting");
      connectWebSocket();
    }
  }
});

// --- Initialize ---
async function init() {
  const appTitleEl = document.getElementById("appTitle");
  const statusEl = document.getElementById("status");
  const messengerListEl = document.getElementById("messengerList");
  const contactListEl = document.getElementById("contactList");
  const conversationViewEl = document.getElementById("conversationView");
  const previewViewEl = document.getElementById("previewView");
  const recordBtn = document.getElementById("recordBtn");
  const historyEl = document.getElementById("history");
  const logEl = document.getElementById("log");

  initUtils({ statusEl, logEl });
  initHistory(historyEl);
  initBrowserUI({
    messengerListEl,
    contactListEl,
    conversationViewEl,
    previewViewEl,
    recordBtn,
    appTitleEl,
  });

  log(`Even Bridge ${S.BUILD_VERSION} starting`);

  // Detect G2 bridge
  try {
    const sdk = await import(
      "https://cdn.jsdelivr.net/npm/@evenrealities/even_hub_sdk@latest/dist/index.js"
    );
    S.bridge = await withTimeout(sdk.waitForEvenAppBridge(), 2000);
    S.isG2 = true;
    log("G2 bridge detected (SDK)");
  } catch {
    if (typeof window.EvenAppBridge?.getInstance === "function") {
      S.bridge = window.EvenAppBridge.getInstance();
      S.isG2 = true;
      log("G2 bridge detected (raw)");
    }
  }

  if (S.isG2) {
    log("Running in G2 glasses mode");

    S.logoData = await loadLogoData();
    await showStartupScreen();

    // G2 event handler
    S.bridge.onEvenHubEvent((event) => {
      // Audio streaming during recording
      if (event.audioEvent?.audioPcm && S.isRecording) {
        if (S.ws && S.ws.readyState === WebSocket.OPEN) {
          S.ws.send(event.audioEvent.audioPcm);
        }
        return;
      }

      // List events (contact selection)
      if (event.listEvent) {
        const { currentSelectItemIndex, eventType } = event.listEvent;
        if (eventType === 0 || eventType === undefined) {
          if (S.appState === "contacts") {
            const idx = currentSelectItemIndex ?? 0;
            const contact = S.contacts[idx];
            if (contact) goToConversation(contact);
          }
        } else if (eventType === 3) {
          if (S.appState === "contacts") goToMessengerSelect();
        }
        return;
      }

      // Debug logging
      if (!event.audioEvent) {
        log("G2 event: " + JSON.stringify(Object.keys(event)) + " state=" + S.appState);
        const ev2 = event.textEvent || event.sysEvent;
        if (ev2) log("  eventType=" + ev2.eventType);
      }

      // Text/sys events (taps, double taps, scrolls)
      const ev = event.textEvent || event.sysEvent;
      if (!ev) return;

      const eventType = ev.eventType;

      // Single tap (0 or undefined)
      if (eventType === 0 || eventType === undefined) {
        if (S.appState === "messengerSelect") {
          const name = S.availableMessengers[S.messengerSelectIndex];
          if (name) selectMessenger(name);
        } else if (S.appState === "recording") {
          toggleRecording();
        } else if (S.appState === "preview") {
          sendPendingMessage();
        }
      }
      // Double tap (3)
      else if (eventType === 3) {
        if (S.appState === "contacts") {
          goToMessengerSelect();
        } else if (S.appState === "conversation") {
          toggleRecording();
        }
      }
      // Scroll (1 or 2)
      else if (eventType === 1 || eventType === 2) {
        if (S.appState === "messengerSelect" && S.availableMessengers.length > 1) {
          S.messengerSelectIndex = eventType === 2
            ? Math.min(S.messengerSelectIndex + 1, S.availableMessengers.length - 1)
            : Math.max(S.messengerSelectIndex - 1, 0);
          if (S.messengerSelectBuilt) {
            updateGlassesMessengerSelection();
          } else {
            showGlassesMessengerSelect();
          }
        } else if (S.appState === "conversation") {
          goToContacts();
        } else if (S.appState === "preview") {
          cancelPreview();
        }
      }
    });
  } else {
    log("Running in browser fallback mode (no G2 detected)");
  }

  connectWebSocket();
  renderHistory();
  requestWakeLock();

  goToMessengerSelect();

  // Browser event listeners
  conversationViewEl.querySelector(".back").addEventListener("click", () => {
    goToContacts();
  });
  recordBtn.addEventListener("click", toggleRecording);
  previewViewEl.querySelector(".send-btn").addEventListener("click", sendPendingMessage);
  previewViewEl.querySelector(".cancel-btn").addEventListener("click", cancelPreview);
}

init().catch((err) => {
  log("Init error: " + err.message);
  setStatus("Error: " + err.message, "error");
});
