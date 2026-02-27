import { S } from "../state.js";
import { formatTime, renderIconToCanvas } from "../utils.js";

let messengerListEl, contactListEl, conversationViewEl, previewViewEl, recordBtn, appTitleEl;
let folderListEl, messageListEl, messageViewEl;
let settingsViewEl;

export function initBrowserUI(elements) {
  messengerListEl = elements.messengerListEl;
  contactListEl = elements.contactListEl;
  conversationViewEl = elements.conversationViewEl;
  previewViewEl = elements.previewViewEl;
  recordBtn = elements.recordBtn;
  appTitleEl = elements.appTitleEl;
  folderListEl = elements.folderListEl;
  messageListEl = elements.messageListEl;
  messageViewEl = elements.messageViewEl;
  settingsViewEl = elements.settingsViewEl;
}

export function showBrowserMessengerList(onSelect) {
  if (S.availableMessengers.length === 0) {
    messengerListEl.innerHTML = "<p style='color:var(--tc-2); padding:var(--spacing-16); text-align:center'>No messengers configured</p>";
    messengerListEl.style.display = "block";
    return;
  }
  let html = "";
  for (const name of S.availableMessengers) {
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    html += `<button data-name="${name}">
      <canvas class="messenger-icon" data-icon="${name}" width="24" height="24"></canvas>
      ${displayName}
    </button>`;
  }
  messengerListEl.innerHTML = html;
  messengerListEl.style.display = "block";

  messengerListEl.querySelectorAll("canvas.messenger-icon").forEach((canvas) => {
    const iconName = canvas.dataset.icon;
    const iconData = S.messengerIconData[iconName];
    if (iconData) {
      renderIconToCanvas(canvas, iconData);
    }
  });

  messengerListEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      onSelect(btn.dataset.name);
    });
  });
}

export function hideBrowserMessengerList() {
  messengerListEl.style.display = "none";
}

export function showBrowserContacts(onContactSelect) {
  if (!S.session?.contacts?.length) {
    contactListEl.innerHTML = "<p style='color:var(--tc-2); padding:var(--spacing-16); text-align:center'>No contacts found</p>";
    contactListEl.style.display = "block";
    return;
  }
  let html = "";
  for (const c of S.session.contacts) {
    const typeLabel = c.isGroup ? "group" : c.isChannel ? "channel" : "user";
    html += `<button data-id="${c.id}" data-name="${c.name}" data-username="${c.username || ""}">
      ${c.name}<span class="type">${typeLabel}</span>
    </button>`;
  }
  contactListEl.innerHTML = html;
  contactListEl.style.display = "block";

  contactListEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const contact = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        username: btn.dataset.username,
      };
      onContactSelect(contact);
    });
  });
}

export function hideBrowserContacts() {
  contactListEl.style.display = "none";
}

export function showBrowserConversation() {
  if (!S.session?.selectedContact) return;
  conversationViewEl.querySelector(".conv-header .name").textContent = S.session.selectedContact.name;

  const msgsEl = conversationViewEl.querySelector(".conv-messages");
  const msgs = [...S.session.conversationMessages].reverse();

  if (msgs.length === 0) {
    msgsEl.innerHTML = '<div style="color:var(--tc-2); text-align:center; padding:var(--spacing-20)">No messages yet</div>';
  } else {
    let html = "";
    for (const m of msgs) {
      const cls = m.out ? "out" : "in";
      const sender = m.out ? "Me" : (m.senderName || S.session.selectedContact.name);
      const text = m.text || "";
      const time = formatTime(m.date);
      html += `<div class="conv-msg ${cls}">
        <div class="sender">${sender}</div>
        <div class="text">${text}</div>
        <div class="time">${time}</div>
      </div>`;
    }
    msgsEl.innerHTML = html;
  }

  recordBtn.style.display = "block";
  recordBtn.disabled = false;
  recordBtn.textContent = "Tap to Record";
  recordBtn.classList.remove("recording");
  conversationViewEl.style.display = "block";
}

export function hideBrowserConversation() {
  conversationViewEl.style.display = "none";
  recordBtn.style.display = "none";
}

export function showBrowserPreview(text) {
  previewViewEl.querySelector(".preview-text").textContent = text;
  previewViewEl.style.display = "block";
}

export function hideBrowserPreview() {
  previewViewEl.style.display = "none";
}

// --- Gmail folder/message browser views ---

export function showBrowserFolderList(onSelect) {
  if (!S.session?.folders?.length) {
    folderListEl.innerHTML = "<p style='color:var(--tc-2); padding:var(--spacing-16); text-align:center'>No folders</p>";
    folderListEl.style.display = "block";
    return;
  }
  let html = "";
  for (const f of S.session.folders) {
    const badge = f.unreadCount > 0
      ? `<span class="type">${f.unreadCount} unread</span>`
      : "";
    html += `<button data-id="${f.id}" data-name="${f.name}">
      ${f.name}${badge}
    </button>`;
  }
  folderListEl.innerHTML = html;
  folderListEl.style.display = "block";
  folderListEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      onSelect({ id: btn.dataset.id, name: btn.dataset.name });
    });
  });
}

export function hideBrowserFolderList() {
  if (folderListEl) folderListEl.style.display = "none";
}

export function showBrowserMessageList(onSelect) {
  if (!S.session?.folderMessages?.length) {
    messageListEl.innerHTML = "<p style='color:var(--tc-2); padding:var(--spacing-16); text-align:center'>No messages</p>";
    messageListEl.style.display = "block";
    return;
  }
  let html = "";
  for (const m of S.session.folderMessages) {
    const unreadCls = m.isRead ? "" : " unread";
    html += `<button data-id="${m.id}" class="email-item${unreadCls}">
      <div class="email-from">${m.from}</div>
      <div class="email-subject">${m.subject}</div>
      <div class="email-snippet">${m.snippet}</div>
    </button>`;
  }
  messageListEl.innerHTML = html;
  messageListEl.style.display = "block";
  messageListEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const msg = S.session.folderMessages.find((m) => m.id === btn.dataset.id);
      if (msg) onSelect(msg);
    });
  });
}

export function hideBrowserMessageList() {
  if (messageListEl) messageListEl.style.display = "none";
}

export function showBrowserMessageView() {
  if (!S.session?.selectedMessage) return;
  const m = S.session.selectedMessage;
  messageViewEl.querySelector(".msg-from").textContent = m.from;
  messageViewEl.querySelector(".msg-subject").textContent = m.subject;
  messageViewEl.querySelector(".msg-body").textContent = m.body || m.snippet;
  messageViewEl.style.display = "block";
  recordBtn.style.display = "block";
  recordBtn.disabled = false;
  recordBtn.textContent = "Tap to Record Reply";
  recordBtn.classList.remove("recording");
}

export function hideBrowserMessageView() {
  if (messageViewEl) messageViewEl.style.display = "none";
}

export function updateAppTitle(text) {
  appTitleEl.textContent = text;
  document.title = text;
}

export function updateRecordButton(state) {
  if (state === "ready") {
    recordBtn.style.display = "block";
    recordBtn.disabled = false;
    recordBtn.textContent = "Tap to Record";
    recordBtn.classList.remove("recording");
  } else if (state === "recording") {
    recordBtn.textContent = "Stop Recording";
    recordBtn.classList.add("recording");
  } else if (state === "processing") {
    recordBtn.disabled = true;
    recordBtn.textContent = "Processing...";
    recordBtn.classList.remove("recording");
  } else if (state === "hidden") {
    recordBtn.style.display = "none";
  }
}

export function showBrowserSettings(status) {
  if (!settingsViewEl) return;
  // Update status badges
  for (const [service, info] of Object.entries(status)) {
    const badge = settingsViewEl.querySelector(`[data-status="${service}"]`);
    if (badge) {
      const isConfigured = info.configured;
      badge.textContent = isConfigured ? "Configured" : "Not configured";
      badge.className = "settings-card-status " + (isConfigured ? "configured" : "not-configured");
    }
  }
  // Show Telegram auth section if credentials are saved
  const telegramAuth = document.getElementById("telegramAuth");
  if (telegramAuth) {
    telegramAuth.style.display = status.telegram?.configured ? "block" : "none";
    // Show authenticated status if session exists
    if (status.telegram?.authenticated) {
      const authStatus = document.getElementById("telegramAuthStatus");
      if (authStatus) {
        authStatus.style.display = "block";
        authStatus.textContent = "Authenticated";
        authStatus.style.color = "var(--tc-green)";
        authStatus.style.background = "rgba(75, 185, 86, 0.1)";
      }
    }
  }
  settingsViewEl.style.display = "block";
}

export function hideBrowserSettings() {
  if (settingsViewEl) settingsViewEl.style.display = "none";
}
