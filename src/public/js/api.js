import { S } from "./state.js";
import { log } from "./utils.js";

export function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onPageAbort = () => controller.abort();
  S.pageAbort.signal.addEventListener("abort", onPageAbort);
  return fetch(url, { signal: controller.signal }).finally(() => {
    clearTimeout(timer);
    S.pageAbort.signal.removeEventListener("abort", onPageAbort);
  });
}

export async function fetchAvailableMessengers() {
  const resp = await fetchWithTimeout("/api/available-messengers");
  if (!resp.ok) throw new Error("Failed to fetch available messengers");
  return await resp.json();
}

export async function fetchContacts() {
  const resp = await fetchWithTimeout("/api/contacts", 30000);
  if (!resp.ok) throw new Error("Failed to fetch contacts");
  return await resp.json();
}

export async function fetchLastRecipient() {
  try {
    const resp = await fetchWithTimeout("/api/last-recipient");
    if (!resp.ok) return null;
    return await resp.json();
  } catch { return null; }
}

export async function fetchMessages(entityId) {
  const resp = await fetchWithTimeout(`/api/messages/${encodeURIComponent(entityId)}`);
  if (!resp.ok) throw new Error("Failed to fetch messages");
  return await resp.json();
}

export async function fetchFolders() {
  const resp = await fetchWithTimeout("/api/folders", 15000);
  if (!resp.ok) throw new Error("Failed to fetch folders");
  return await resp.json();
}

export async function fetchFolderMessages(folderId, limit = 10) {
  const resp = await fetchWithTimeout(
    `/api/folders/${encodeURIComponent(folderId)}/messages?limit=${limit}`,
    15000,
  );
  if (!resp.ok) throw new Error("Failed to fetch folder messages");
  return await resp.json();
}

export async function fetchFolderMessage(folderId, messageId) {
  const resp = await fetchWithTimeout(
    `/api/folders/${encodeURIComponent(folderId)}/messages/${encodeURIComponent(messageId)}`,
    15000,
  );
  if (!resp.ok) throw new Error("Failed to fetch message");
  return await resp.json();
}

export async function loadLogoData() {
  try {
    const resp = await fetch("/logo-data.json");
    const data = await resp.json();
    log(`Logo loaded: ${data.width}x${data.height}`);
    return data;
  } catch (e) {
    log("Logo load failed: " + e.message);
    return null;
  }
}

// --- Settings API ---

export async function fetchSettingsStatus() {
  const resp = await fetchWithTimeout("/api/settings/status");
  if (!resp.ok) throw new Error("Failed to fetch settings");
  return await resp.json();
}

export async function saveServiceSettings(service, data) {
  const resp = await fetch(`/api/settings/${service}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw new Error("Failed to save settings");
  return await resp.json();
}

export async function deleteServiceSettings(service) {
  const resp = await fetch(`/api/settings/${service}`, { method: "DELETE" });
  if (!resp.ok) throw new Error("Failed to delete settings");
  return await resp.json();
}

export async function startTelegramAuth(phone) {
  const resp = await fetch("/api/settings/telegram/auth/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!resp.ok) throw new Error("Failed to start auth");
  return await resp.json();
}

export async function submitTelegramCode(code) {
  const resp = await fetch("/api/settings/telegram/auth/code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!resp.ok) throw new Error("Failed to submit code");
  return await resp.json();
}

export async function submitTelegramPassword(password) {
  const resp = await fetch("/api/settings/telegram/auth/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!resp.ok) throw new Error("Failed to submit password");
  return await resp.json();
}

export async function fetchTelegramAuthState() {
  const resp = await fetchWithTimeout("/api/settings/telegram/auth/state");
  if (!resp.ok) throw new Error("Failed to fetch auth state");
  return await resp.json();
}

export async function loadMessengerIcons(names) {
  const iconFiles = { telegram: "telegram-icon-data.json", slack: "slack-icon-data.json" };
  const result = {};
  for (const name of names) {
    const file = iconFiles[name];
    if (!file) continue;
    try {
      const resp = await fetch(`/${file}`);
      result[name] = await resp.json();
      log(`Icon loaded for ${name}`);
    } catch (e) {
      log(`Icon load failed for ${name}: ${e.message}`);
    }
  }
  return result;
}
