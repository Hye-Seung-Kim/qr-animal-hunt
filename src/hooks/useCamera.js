import { useCallback, useEffect, useRef, useState } from "react";

function isCameraSupported() {
  return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

const VIDEO_CONSTRAINTS = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: { ideal: "environment" },
  },
  audio: false,
};

// Camera lifecycle only — no QR logic here. Permission is requested only
// when `start()` is called, which the UI wires to the "Start Game" tap
// (mobile Safari also needs a user gesture to unlock audio at the same
// moment, so StartScreen calls both from the same click handler).
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  // idle | requesting | active | denied | unavailable | unsupported | error
  const [status, setStatus] = useState(() => (isCameraSupported() ? "idle" : "unsupported"));

  const start = useCallback(async () => {
    if (!isCameraSupported()) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus("active");
    } catch (error) {
      if (error && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
        setStatus("denied");
      } else if (error && (error.name === "NotFoundError" || error.name === "OverconstrainedError")) {
        setStatus("unavailable");
      } else {
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  return { videoRef, status, start };
}
