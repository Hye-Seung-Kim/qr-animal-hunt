import { useEffect, useRef } from "react";
import jsQR from "jsqr";
import {
  calculateDetectionSize,
  mapDetectionToSource,
  scanImageDataForQRCodes,
  lerpLocation,
} from "../lib/qrGeometry";
import { renderOverlay } from "../lib/overlayRenderer";
import { playAnimalSound } from "../lib/sounds";
import { getAnimal } from "../data/animals";

const DETECTION_MAX_DIMENSION = 900;
const SCAN_INTERVAL_MS = 80; // ~12.5fps decode, within the 10-15fps budget
const MAX_QR_CODES = 8;
const LERP_FACTOR = 0.35;

// Detection stability tuning (see README for the reasoning): a QR that
// blinks out for a moment should not make its animal flicker, but a QR
// that's genuinely gone should let its animal fade out and its sound
// cooldown reset so it can be "discovered" again later.
const GRACE_MS = 500; // fully visible even if momentarily lost
const FADE_END_MS = 1200; // fully faded out by this point
const REMOVE_MS = 2000; // untracked entirely; re-appearance triggers a fresh discovery + sound

// Chrome/Android's native BarcodeDetector uses the OS's own (often
// hardware-accelerated) decoder directly on the video frame at full
// resolution -- no manual downscale/getImageData round-trip -- and is
// noticeably faster and more reliable at range than jsQR. Safari doesn't
// implement it, so jsQR stays as the fallback. Built once at module scope
// since support doesn't change at runtime.
let nativeDetector = null;
if (typeof window !== "undefined" && "BarcodeDetector" in window) {
  try {
    nativeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
  } catch {
    nativeDetector = null;
  }
}

function cornerPointsToLocation(points) {
  return {
    topLeftCorner: points[0],
    topRightCorner: points[1],
    bottomRightCorner: points[2],
    bottomLeftCorner: points[3],
  };
}

// Runs the camera -> canvas -> decoder -> tracked-animal-state -> overlay-draw
// pipeline entirely outside React state, so a busy scene with several QR
// codes doesn't cause a re-render every frame. The only thing that crosses
// back into React is the onDiscover callback, fired once per fresh sighting.
export function useQRScanner({ videoRef, canvasRef, active, onDiscover, trackedRef }) {
  const onDiscoverRef = useRef(onDiscover);
  useEffect(() => {
    onDiscoverRef.current = onDiscover;
  }, [onDiscover]);

  useEffect(() => {
    if (!active) return undefined;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return undefined;

    const ctx = canvas.getContext("2d");
    let sampleCanvas = null;
    let sampleCtx = null;
    let detectionScaleX = 1;
    let detectionScaleY = 1;
    let lastScanTime = -SCAN_INTERVAL_MS;
    let rafId = null;
    let scanning = false;
    // Shared with the 3D layer (AnimalScene) when a trackedRef is supplied,
    // so it can read the same live entries from its own render loop without
    // this hook needing to know anything about three.js.
    const tracked = trackedRef ? (trackedRef.current = new Map()) : new Map();

    function setupForVideoSize() {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const detectionSize = calculateDetectionSize(video.videoWidth, video.videoHeight, DETECTION_MAX_DIMENSION);
      detectionScaleX = detectionSize.scaleX;
      detectionScaleY = detectionSize.scaleY;
      sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = detectionSize.width;
      sampleCanvas.height = detectionSize.height;
      sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    }

    function scanWithJsQR() {
      sampleCtx.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height);
      const imageData = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
      const decoder = (pixels, width, height) => jsQR(pixels, width, height, { inversionAttempts: "attemptBoth" });
      return scanImageDataForQRCodes(imageData, decoder, MAX_QR_CODES)
        .map((detection) => mapDetectionToSource(detection, detectionScaleX, detectionScaleY));
    }

    async function scanWithNativeDetector() {
      const barcodes = await nativeDetector.detect(video);
      return barcodes
        .filter((barcode) => barcode.cornerPoints?.length === 4)
        .map((barcode) => ({ data: barcode.rawValue, location: cornerPointsToLocation(barcode.cornerPoints) }));
    }

    function updateTracking(detections, now) {
      for (const detection of detections) {
        const id = detection.data;
        const entry = tracked.get(id);
        if (!entry) {
          const animal = getAnimal(id);
          tracked.set(id, {
            id,
            animal,
            location: detection.location,
            targetLocation: detection.location,
            lastSeenAt: now,
            discoveredAt: now,
            opacity: 1,
          });
          if (animal) playAnimalSound(animal.soundType);
          onDiscoverRef.current?.({ id, animal });
        } else {
          entry.targetLocation = detection.location;
          entry.lastSeenAt = now;
        }
      }
    }

    function updateVisuals(now) {
      for (const [id, entry] of tracked) {
        const elapsed = now - entry.lastSeenAt;
        if (elapsed >= REMOVE_MS) {
          tracked.delete(id);
          continue;
        }
        entry.opacity = elapsed <= GRACE_MS
          ? 1
          : Math.max(0, 1 - (elapsed - GRACE_MS) / (FADE_END_MS - GRACE_MS));
        entry.location = lerpLocation(entry.location, entry.targetLocation, LERP_FACTOR);
      }
    }

    async function runScan(timestamp) {
      if (scanning) return; // previous scan (native path is async) still in flight
      scanning = true;
      try {
        const detections = nativeDetector ? await scanWithNativeDetector() : scanWithJsQR();
        updateTracking(detections, timestamp);
      } catch {
        // A transient bad frame (e.g. mid-resize); just skip this tick.
      } finally {
        scanning = false;
      }
    }

    function tick(timestamp) {
      if (video.readyState === video.HAVE_ENOUGH_DATA && timestamp - lastScanTime >= SCAN_INTERVAL_MS && !scanning) {
        lastScanTime = timestamp;
        runScan(timestamp);
      }
      updateVisuals(timestamp);
      renderOverlay(ctx, canvas, [...tracked.values()].filter((entry) => entry.opacity > 0.01), timestamp);
      rafId = requestAnimationFrame(tick);
    }

    if (video.readyState >= video.HAVE_METADATA) {
      setupForVideoSize();
    } else {
      video.addEventListener("loadedmetadata", setupForVideoSize, { once: true });
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      video.removeEventListener("loadedmetadata", setupForVideoSize);
    };
  }, [active, videoRef, canvasRef, trackedRef]);
}
