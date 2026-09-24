// Pure geometry helpers for mapping a downscaled detection frame back onto
// full camera resolution, and for finding multiple QR codes in one frame by
// masking each decoded region before re-scanning. Ported from the original
// qrcode-tracking prototype (qr-scanner.js) with no behavior changes.

export function calculateDetectionSize(sourceWidth, sourceHeight, maxDimension = 720) {
  const longestSide = Math.max(sourceWidth, sourceHeight);
  const ratio = Math.min(1, maxDimension / longestSide);
  const width = Math.round(sourceWidth * ratio);
  const height = Math.round(sourceHeight * ratio);
  return {
    width,
    height,
    scaleX: sourceWidth / width,
    scaleY: sourceHeight / height,
  };
}

export function mapDetectionToSource(detection, scaleX, scaleY) {
  const scalePoint = (point) => ({
    x: point.x * scaleX,
    y: point.y * scaleY,
  });
  return {
    ...detection,
    location: {
      topLeftCorner: scalePoint(detection.location.topLeftCorner),
      topRightCorner: scalePoint(detection.location.topRightCorner),
      bottomRightCorner: scalePoint(detection.location.bottomRightCorner),
      bottomLeftCorner: scalePoint(detection.location.bottomLeftCorner),
    },
  };
}

function maskDetection(imageData, location) {
  const points = [
    location.topLeftCorner,
    location.topRightCorner,
    location.bottomRightCorner,
    location.bottomLeftCorner,
  ];
  const padding = 4;
  const minX = Math.max(0, Math.floor(Math.min(...points.map((point) => point.x))) - padding);
  const maxX = Math.min(imageData.width - 1, Math.ceil(Math.max(...points.map((point) => point.x))) + padding);
  const minY = Math.max(0, Math.floor(Math.min(...points.map((point) => point.y))) - padding);
  const maxY = Math.min(imageData.height - 1, Math.ceil(Math.max(...points.map((point) => point.y))) + padding);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const offset = ((y * imageData.width) + x) * 4;
      imageData.data[offset] = 255;
      imageData.data[offset + 1] = 255;
      imageData.data[offset + 2] = 255;
      imageData.data[offset + 3] = 255;
    }
  }
}

export function scanImageDataForQRCodes(imageData, decoder, maxDetections = 8) {
  const detections = [];
  for (let index = 0; index < maxDetections; index += 1) {
    const detection = decoder(imageData.data, imageData.width, imageData.height);
    if (!detection) break;
    detections.push(detection);
    maskDetection(imageData, detection.location);
  }
  return detections;
}

export function centroidOf(location) {
  const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = location;
  return {
    x: (topLeftCorner.x + topRightCorner.x + bottomRightCorner.x + bottomLeftCorner.x) / 4,
    y: (topLeftCorner.y + topRightCorner.y + bottomRightCorner.y + bottomLeftCorner.y) / 4,
  };
}

export function averageSideLength(location) {
  const { topLeftCorner, topRightCorner, bottomLeftCorner } = location;
  const top = Math.hypot(topRightCorner.x - topLeftCorner.x, topRightCorner.y - topLeftCorner.y);
  const side = Math.hypot(bottomLeftCorner.x - topLeftCorner.x, bottomLeftCorner.y - topLeftCorner.y);
  return (top + side) / 2;
}

export function lerpLocation(from, to, t) {
  const lerpPoint = (a, b) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  return {
    topLeftCorner: lerpPoint(from.topLeftCorner, to.topLeftCorner),
    topRightCorner: lerpPoint(from.topRightCorner, to.topRightCorner),
    bottomRightCorner: lerpPoint(from.bottomRightCorner, to.bottomRightCorner),
    bottomLeftCorner: lerpPoint(from.bottomLeftCorner, to.bottomLeftCorner),
  };
}
