import { log, setStatus } from "./utils.js";
import { fetchAvailableMessengers, fetchContacts, fetchLastRecipient, fetchMessages, loadMessengerIcons } from "./api.js";
import { showBrowserMessengerList, hideBrowserMessengerList, showBrowserContacts, hideBrowserContacts, showBrowserConversation, hideBrowserConversation, showBrowserPreview, hideBrowserPreview, updateAppTitle, updateRecordButton, showNoMessengersConfigured } from "./ui/browser.js";
import { showGlassesMessengerSelect, showGlassesContactList, showGlassesConversation, showGlassesPreview, rebuildGlassesDisplay } from "./ui/glasses.js";
import { saveMessage, renderHistory } from "./history.js";

export const S = {
  ws: null,
  isRecording: false,
  bridge: null,
  isG2: false,
  appState: "startup",
  availableMessengers: [],
  selectedMessengerName: null,
  messengerSelectIndex: 0,
  contacts: [],
  selectedContact: null,
  conversationMessages: [],
  pendingText: "",
  audioContext: null,
  scriptProcessor: null,
  mediaStream: null,
  logoData: null,
  messengerIconData: {},
  messengerSelectBuilt: false,
  startupShown: false,
  conversationPollTimer: null,
  wakeLock: null,
  pageAbort: new AbortController(),
  displayRebuilt: false,
  BUILD_VERSION: "v1.2.0",
};

// --- Wake lock ---
export async function requestWakeLock() {
  if (S.wakeLock) return;
  try {
    if ("wakeLock" in navigator) {
      S.wakeLock = await navigator.wakeLock.request("screen");
      S.wakeLock.addEventListener("release", () => {
        S.wakeLock = null;
      });
      log("Wake lock acquired");
    }
  } catch (e) {
    log("Wake lock failed: " + e.message);
  }
}

// --- Conversation polling ---
export function startConversationPolling() {
  stopConversationPolling();
  S.conversationPollTimer = setInterval(async () => {
    if (S.appState !== "conversation" || !S.selectedContact) {
      stopConversationPolling();
      return;
    }
    try {
      const entityId = S.selectedContact.username || S.selectedContact.id;
      const msgs = await fetchMessages(entityId);
      if (S.appState !== "conversation") return;
      S.conversationMessages = msgs;
      if (S.isG2) showGlassesConversation();
      showBrowserConversation();
    } catch {}
  }, 5000);
}

export function stopConversationPolling() {
  if (S.conversationPollTimer) {
    clearInterval(S.conversationPollTimer);
    S.conversationPollTimer = null;
  }
}

// --- State transitions ---
export function selectMessenger(name) {
  S.appState = "processing";
  S.selectedMessengerName = name;
  S.messengerSelectBuilt = false;
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);

  hideBrowserMessengerList();
  setStatus(`Connecting to ${displayName}...`);
  if (S.isG2) {
    S.displayRebuilt = false;
    rebuildGlassesDisplay(`Connecting to ${displayName}...`, true);
  }

  if (S.ws && S.ws.readyState === WebSocket.OPEN) {
    S.ws.send(JSON.stringify({ type: "select-messenger", name }));
  }
}

export async function goToMessengerSelect() {
  S.appState = "messengerSelect";
  S.selectedMessengerName = null;
  S.selectedContact = null;
  S.conversationMessages = [];
  S.pendingText = "";
  S.displayRebuilt = false;
  S.contacts = [];
  stopConversationPolling();
  requestWakeLock();

  hideBrowserContacts();
  hideBrowserConversation();
  hideBrowserPreview();

  setStatus("Loading messengers...");

  try {
    S.availableMessengers = await fetchAvailableMessengers();
    S.messengerIconData = await loadMessengerIcons(S.availableMessengers);
    log(`Available messengers: ${S.availableMessengers.join(", ")}`);
  } catch (e) {
    log("Error loading messengers: " + e.message);
    setStatus("Error loading messengers", "error");
    return;
  }

  if (S.availableMessengers.length === 0) {
    const setupMsg = "No messengers configured.\n\nSet up in .env:\n\nTelegram:\n  TELEGRAM_API_ID\n  TELEGRAM_API_HASH\n\nSlack:\n  SLACK_USER_TOKEN";
    setStatus("No messengers configured", "error");
    if (S.isG2) rebuildGlassesDisplay(setupMsg);
    showNoMessengersConfigured();
    return;
  }

  S.messengerSelectIndex = 0;
  setStatus("Select a messenger");

  if (S.isG2) {
    await showGlassesMessengerSelect();
  }
  showBrowserMessengerList((name) => selectMessenger(name));
}

export async function goToContacts() {
  S.appState = "contacts";
  S.selectedContact = null;
  S.conversationMessages = [];
  S.pendingText = "";
  S.displayRebuilt = false;
  S.contacts = [];
  stopConversationPolling();
  requestWakeLock();

  hideBrowserMessengerList();
  hideBrowserConversation();
  hideBrowserPreview();

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    setStatus(attempt === 1 ? "Loading contacts..." : `Retrying contacts (${attempt - 1}/${maxRetries})...`);
    rebuildGlassesDisplay(attempt === 1 ? "Loading contacts..." : `Retrying... (${attempt - 1}/${maxRetries})`, true);

    try {
      const [fetchedContacts, lastRecipient] = await Promise.all([
        fetchContacts(),
        fetchLastRecipient(),
      ]);
      S.contacts = fetchedContacts;
      log(`Loaded ${S.contacts.length} contacts`);

      if (lastRecipient && lastRecipient.id) {
        const idx = S.contacts.findIndex((c) => c.id === lastRecipient.id);
        if (idx > 0) {
          const [contact] = S.contacts.splice(idx, 1);
          S.contacts.unshift(contact);
          log(`Last recipient "${lastRecipient.name}" moved to top`);
        }
      }
      break;
    } catch (e) {
      log(`Error loading contacts (attempt ${attempt}): ` + e.message);
      if (attempt > maxRetries) {
        setStatus("Connection failed", "error");
        rebuildGlassesDisplay("Connection failed.\nReturning to main screen...");
        setTimeout(() => goToMessengerSelect(), 3000);
        return;
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  if (S.contacts.length === 0) {
    setStatus("No contacts found", "error");
    rebuildGlassesDisplay("No contacts found");
    showBrowserContacts(() => {});
    return;
  }

  setStatus("Select a contact");
  log(`isG2=${S.isG2}, contacts=${S.contacts.length}, names=${S.contacts.slice(0,3).map(c=>c.name).join(",")}`);

  if (S.isG2) {
    await new Promise((r) => setTimeout(r, 150));
    log("Calling showGlassesContactList...");
    showGlassesContactList();
  }
  showBrowserContacts((contact) => goToConversation(contact));
}

export async function goToConversation(contact) {
  S.selectedContact = contact;
  S.appState = "conversation";
  log(`Selected contact: ${contact.name}`);
  requestWakeLock();

  hideBrowserContacts();
  hideBrowserPreview();

  S.displayRebuilt = false;

  const maxRetries = 3;
  let loaded = false;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    setStatus(attempt === 1 ? `Loading conversation with ${contact.name}...` : `Retrying (${attempt - 1}/${maxRetries})...`);
    rebuildGlassesDisplay(attempt === 1 ? "Loading conversation..." : `Retrying... (${attempt - 1}/${maxRetries})`, true);

    try {
      const entityId = contact.username || contact.id;
      S.conversationMessages = await fetchMessages(entityId);
      log(`Loaded ${S.conversationMessages.length} messages`);
      loaded = true;
      break;
    } catch (e) {
      log(`Error loading messages (attempt ${attempt}): ` + e.message);
      if (attempt > maxRetries) {
        setStatus("Connection failed", "error");
        rebuildGlassesDisplay("Connection failed.\nReturning to contacts...");
        setTimeout(() => goToContacts(), 3000);
        return;
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  if (!loaded) {
    S.conversationMessages = [];
  }

  setStatus(`Conversation with ${contact.name}`);

  if (S.isG2) {
    showGlassesConversation(true);
  }
  showBrowserConversation();
  startConversationPolling();
}

export async function refreshConversation() {
  if (!S.selectedContact) return;
  try {
    const entityId = S.selectedContact.username || S.selectedContact.id;
    S.conversationMessages = await fetchMessages(entityId);
    log(`Refreshed conversation: ${S.conversationMessages.length} messages`);
  } catch (e) {
    log("Error refreshing messages: " + e.message);
  }

  S.appState = "conversation";
  setStatus(`Conversation with ${S.selectedContact.name}`);

  if (S.isG2) {
    showGlassesConversation();
  }
  showBrowserConversation();
  hideBrowserPreview();
  startConversationPolling();
}

export function sendPendingMessage() {
  if (!S.pendingText || !S.selectedContact) return;

  S.appState = "processing";
  setStatus("Sending...");
  if (S.isG2) {
    S.displayRebuilt = false;
    rebuildGlassesDisplay("Sending...");
  }

  const recipient = S.selectedContact.username || S.selectedContact.id;
  if (S.ws && S.ws.readyState === WebSocket.OPEN) {
    S.ws.send(JSON.stringify({
      type: "send",
      text: S.pendingText,
      recipient,
      recipientId: S.selectedContact.id,
      recipientName: S.selectedContact.name,
      recipientUsername: S.selectedContact.username,
    }));
  }
}

export async function cancelPreview() {
  log("Preview cancelled");
  S.pendingText = "";
  hideBrowserPreview();
  await refreshConversation();
}

// --- Handle messages from server via WebSocket ---
export function handleServerMessage(msg) {
  if (msg.type === "messenger-selected") {
    const displayName = msg.name;
    log(`Messenger selected: ${displayName}`);
    updateAppTitle(`Even Bridge → ${displayName}`);
    goToContacts();
  } else if (msg.type === "status") {
    setStatus(msg.text);
    if (S.isG2 && S.displayRebuilt) {
      rebuildGlassesDisplay(msg.text);
    }
    log("Status: " + msg.text);
  } else if (msg.type === "preview") {
    S.pendingText = msg.text;
    S.appState = "preview";
    setStatus("Preview — tap to send, swipe to cancel");
    log(`Preview: ${msg.text}`);

    if (S.isG2) {
      showGlassesPreview(msg.text);
    }

    updateRecordButton("hidden");
    showBrowserPreview(msg.text);
  } else if (msg.type === "sent") {
    const contactName = S.selectedContact?.name || "Unknown";
    saveMessage(msg.text, contactName);
    renderHistory();
    log(`Sent to ${contactName}: ${msg.text}`);
    S.pendingText = "";
    refreshConversation();
  } else if (msg.type === "error") {
    setStatus(msg.text, "error");
    log("Error: " + msg.text);

    if (S.isG2) {
      S.displayRebuilt = false;
      rebuildGlassesDisplay("Error:\n" + msg.text);
    }

    setTimeout(() => {
      if (S.selectedContact) {
        refreshConversation();
      } else if (S.selectedMessengerName) {
        goToContacts();
      } else {
        goToMessengerSelect();
      }
    }, 3000);
  }
}
