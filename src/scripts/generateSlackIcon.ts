import { encodeGrayscalePng } from "./pngEncoder.js";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate a 24x24 greyscale Slack-style icon (# hashtag shape)
const W = 24;
const H = 24;
const pixels = new Uint8Array(W * H); // 0 = black (transparent on G2), 255 = white

function setPixel(x: number, y: number, val: number) {
  if (x >= 0 && x < W && y >= 0 && y < H) {
    pixels[y * W + x] = val;
  }
}

function fillRect(x: number, y: number, w: number, h: number, val: number) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(x + dx, y + dy, val);
    }
  }
}

// Slack # logo: two vertical bars and two horizontal bars
// Vertical bars (with slight slant feel via positioning)
fillRect(7, 2, 3, 20, 255);   // Left vertical
fillRect(14, 2, 3, 20, 255);  // Right vertical

// Horizontal bars
fillRect(2, 7, 20, 3, 255);   // Top horizontal
fillRect(2, 14, 20, 3, 255);  // Bottom horizontal

// Round the ends of the bars with small dots
// Top of left vertical
setPixel(7, 2, 180);
setPixel(9, 2, 180);
// Bottom of left vertical
setPixel(7, 21, 180);
setPixel(9, 21, 180);
// Top of right vertical
setPixel(14, 2, 180);
setPixel(16, 2, 180);
// Bottom of right vertical
setPixel(14, 21, 180);
setPixel(16, 21, 180);
// Left of top horizontal
setPixel(2, 7, 180);
setPixel(2, 9, 180);
// Right of top horizontal
setPixel(21, 7, 180);
setPixel(21, 9, 180);
// Left of bottom horizontal
setPixel(2, 14, 180);
setPixel(2, 16, 180);
// Right of bottom horizontal
setPixel(21, 14, 180);
setPixel(21, 16, 180);

const pngData = encodeGrayscalePng(W, H, pixels);

const output = {
  width: W,
  height: H,
  data: Array.from(pngData),
};

const outPath = path.resolve(__dirname, "..", "public", "slack-icon-data.json");
writeFileSync(outPath, JSON.stringify(output));
console.log(`Slack icon generated: ${outPath} (${pngData.length} bytes)`);
