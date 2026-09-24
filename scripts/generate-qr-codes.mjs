// Dev-only helper: regenerate the printable test QR codes under public/qr-codes/
// and the public/test-qr-codes.html page that displays them.
// Run with: node scripts/generate-qr-codes.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "qr-codes");

// Mirrors src/data/animals.js — these are the real QR payloads already in
// use (see the qrcode-tracking prototype), repurposed to trigger animals.
const CODES = [
  { id: "object-c", label: "Dog" },
  { id: "notebook", label: "Cat" },
  { id: "object-b", label: "Pigeon" },
  { id: "bottle", label: "Rat" },
  { id: "phone", label: "Squirrel" },
  { id: "object-a", label: "Cockroach" },
];

await mkdir(outDir, { recursive: true });

for (const { id } of CODES) {
  const svg = await QRCode.toString(id, { type: "svg", margin: 1, width: 400 });
  await writeFile(path.join(outDir, `${id}.svg`), svg, "utf8");
}

const cards = CODES.map(({ id, label }) => `
      <div class="card">
        <img src="/qr-codes/${id}.svg" alt="${label} QR code" />
        <p>${label} (${id})</p>
      </div>`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Animal Hunt - Test QR Codes</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: system-ui, sans-serif; background: #fff; margin: 0; padding: 24px; }
    h1 { text-align: center; }
    .grid { display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; }
    .card { text-align: center; }
    .card img { width: 260px; height: 260px; }
    .card p { font-weight: 600; margin-top: 8px; }
  </style>
</head>
<body>
  <h1>Animal Hunt - Test QR Codes</h1>
  <p style="text-align:center">Open this page on a second device/screen and scan these with the game running on your phone.</p>
  <div class="grid">${cards}
  </div>
</body>
</html>
`;

await writeFile(path.join(__dirname, "..", "public", "test-qr-codes.html"), html, "utf8");

console.log(`Generated ${CODES.length} QR codes in ${outDir}`);
console.log("Generated public/test-qr-codes.html");
