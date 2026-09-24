import { centroidOf, averageSideLength } from "./qrGeometry";

// Draws every tracked QR's bounding box, anchored animal emoji, and caption
// onto a transparent canvas. Pure function of the tracked-entry map and the
// current time — called every animation frame from useQRScanner so the
// animal can idle-bounce and fade smoothly between actual QR detections.
export function renderOverlay(ctx, canvas, trackedEntries, now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const entry of trackedEntries) {
    drawBoundingBox(ctx, entry.location, entry.opacity);
    if (entry.animal) {
      drawAnimal(ctx, entry, now);
    } else {
      drawUnknownLabel(ctx, entry.location, entry.opacity);
    }
  }
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

function drawAnimal(ctx, entry, now) {
  const { location, opacity, animal, discoveredAt } = entry;
  const center = centroidOf(location);
  const size = averageSideLength(location);

  // Pop-in scale for the first ~280ms after discovery, then a gentle idle
  // bounce for as long as the animal stays visible.
  const age = now - discoveredAt;
  const popIn = Math.min(1, easeOutBack(Math.min(1, age / 280)));
  const bounce = Math.sin(now / 260 + discoveredAt) * size * 0.05;

  const emojiSize = size * 1.1 * popIn;
  const anchorY = location.topLeftCorner.y < location.bottomLeftCorner.y
    ? Math.min(location.topLeftCorner.y, location.topRightCorner.y)
    : center.y;
  const drawY = anchorY - size * 0.15 + bounce;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `${emojiSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(animal.emoji, center.x, drawY);

  const fontSize = Math.max(14, size * 0.16);
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.textBaseline = "top";
  const captionY = Math.max(location.bottomLeftCorner.y, location.bottomRightCorner.y) + 8;
  const text = animal.caption;
  const textWidth = ctx.measureText(text).width;
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(center.x - textWidth / 2 - 8, captionY - 4, textWidth + 16, fontSize + 12);
  ctx.fillStyle = "#fde68a";
  ctx.fillText(text, center.x, captionY);
  ctx.restore();
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
