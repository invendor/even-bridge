import { S } from "../state.js";
import { formatTime, renderIconToCanvas } from "../utils.js";

let messengerListEl, contactListEl, conversationViewEl, previewViewEl, recordBtn, appTitleEl;

export function initBrowserUI(elements) {
  messengerListEl = elements.messengerListEl;
  contactListEl = elements.contactListEl;
  conversationViewEl = elements.conversationViewEl;
  previewViewEl = elements.previewViewEl;
  recordBtn = elements.recordBtn;
  appTitleEl = elements.appTitleEl;
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
  if (S.contacts.length === 0) {
    contactListEl.innerHTML = "<p style='color:var(--tc-2); padding:var(--spacing-16); text-align:center'>No contacts found</p>";
    contactListEl.style.display = "block";
    return;
  }
  let html = "";
  for (const c of S.contacts) {
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
  if (!S.selectedContact) return;
  conversationViewEl.querySelector(".conv-header .name").textContent = S.selectedContact.name;

  const msgsEl = conversationViewEl.querySelector(".conv-messages");
  const msgs = [...S.conversationMessages].reverse();

  if (msgs.length === 0) {
    msgsEl.innerHTML = '<div style="color:var(--tc-2); text-align:center; padding:var(--spacing-20)">No messages yet</div>';
  } else {
    let html = "";
    for (const m of msgs) {
      const cls = m.out ? "out" : "in";
      const sender = m.out ? "Me" : (m.senderName || S.selectedContact.name);
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

export function showNoMessengersConfigured() {
  messengerListEl.innerHTML = `<div style="color:var(--tc-2); padding:var(--spacing-16); text-align:center; line-height:1.6">
    <p style="font-weight:400; margin-bottom:12px">No messengers configured</p>
    <p>Add credentials to your <code>.env</code> file:</p>
    <p style="margin-top:8px"><b>Telegram:</b> TELEGRAM_API_ID + TELEGRAM_API_HASH</p>
    <p><b>Slack:</b> SLACK_USER_TOKEN</p>
    <p style="margin-top:12px; font-size:13px">Then restart the server.</p>
  </div>`;
  messengerListEl.style.display = "block";
}
