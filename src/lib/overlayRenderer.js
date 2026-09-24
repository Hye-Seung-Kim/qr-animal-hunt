import { centroidOf, averageSideLength } from "./qrGeometry";

// Draws every tracked QR's bounding box (anchored to the QR itself, for
// scan feedback) plus the discovered animal + caption, which is pinned to
// the center of the screen rather than the QR's position — the QR is often
// held off to one side of frame, and the animal reads much better sitting
// front-and-center than tucked in a corner. Pure function of the
// tracked-entry map and the current time — called every animation frame
// from useQRScanner so the animal can idle-bounce and fade smoothly.
export function renderOverlay(ctx, canvas, trackedEntries, now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const entry of trackedEntries) {
    drawBoundingBox(ctx, entry.location, entry.opacity);
    if (!entry.animal) {
      drawUnknownLabel(ctx, entry.location, entry.opacity);
    }
  }

  const animalEntries = trackedEntries.filter((entry) => entry.animal);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const spacing = Math.min(canvas.width * 0.32, canvas.width / (animalEntries.length + 1));

  animalEntries.forEach((entry, index) => {
    const offset = (index - (animalEntries.length - 1) / 2) * spacing;
    drawAnimal(ctx, entry, now, centerX + offset, centerY);
  });
}

function drawBoundingBox(ctx, location, opacity) {
  const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = location;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = Math.max(3, ctx.canvas.width * 0.005);
  ctx.beginPath();
  ctx.moveTo(topLeftCorner.x, topLeftCorner.y);
  ctx.lineTo(topRightCorner.x, topRightCorner.y);
  ctx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
  ctx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawUnknownLabel(ctx, location, opacity) {
  const center = centroidOf(location);
  ctx.save();
  ctx.globalAlpha = opacity;
  const fontSize = Math.max(14, ctx.canvas.width * 0.018);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  const text = "Unknown creature";
  const width = ctx.measureText(text).width;
  ctx.fillRect(center.x - width / 2 - 8, center.y + 12, width + 16, fontSize + 10);
  ctx.fillStyle = "#e5e7eb";
  ctx.textBaseline = "top";
  ctx.fillText(text, center.x, center.y + 17);
  ctx.restore();
}

function drawAnimal(ctx, entry, now, drawX, drawY) {
  const { location, opacity, animal, discoveredAt } = entry;
  // Size still tracks the QR's on-screen size (closer/bigger QR = bigger
  // animal); only the position is decoupled from the QR's location.
  const size = averageSideLength(location);

  // Pop-in scale for the first ~280ms after discovery, then a gentle idle
  // bounce for as long as the animal stays visible.
  const age = now - discoveredAt;
  const popIn = Math.min(1, easeOutBack(Math.min(1, age / 280)));
  const bounce = Math.sin(now / 260 + discoveredAt) * size * 0.05;

  const emojiSize = size * 1.1 * popIn;
  const centerY = drawY + bounce;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `${emojiSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(animal.emoji, drawX, centerY);

  const fontSize = Math.max(14, size * 0.16);
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.textBaseline = "top";
  const captionY = centerY + emojiSize * 0.55 + 10;
  const text = animal.caption;
  const textWidth = ctx.measureText(text).width;
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(drawX - textWidth / 2 - 8, captionY - 4, textWidth + 16, fontSize + 12);
  ctx.fillStyle = "#fde68a";
  ctx.fillText(text, drawX, captionY);
  ctx.restore();
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
