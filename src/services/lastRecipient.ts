import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LAST_RECIPIENT_DIR = path.resolve(__dirname, "..", "..");

interface LastRecipient {
  id: string;
  name: string;
  username: string | null;
}

function lastRecipientFile(messengerName: string): string {
  return path.join(LAST_RECIPIENT_DIR, `last-recipient-${messengerName}.json`);
}

export function loadLastRecipient(messengerName: string): LastRecipient | null {
  try {
    const file = lastRecipientFile(messengerName);
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, "utf-8"));
    }
  } catch {}
  return null;
}

export function saveLastRecipient(messengerName: string, recipient: LastRecipient): void {
  writeFileSync(lastRecipientFile(messengerName), JSON.stringify(recipient));
}
