import { S } from "./state.js";
import { handleServerMessage } from "./state.js";
import { log } from "./utils.js";

export function connectWebSocket() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  S.ws = new WebSocket(`${protocol}//${location.host}/ws`);

  S.ws.onopen = () => {
    log("WebSocket connected");
  };

  S.ws.onmessage = (event) => {
    handleServerMessage(JSON.parse(event.data));
  };

  S.ws.onclose = () => {
    log("WebSocket disconnected, reconnecting...");
    setTimeout(connectWebSocket, 2000);
  };
}
