import { lazy, Suspense, useEffect, useRef } from "react";
import { useCamera } from "../hooks/useCamera";
import { useQRScanner } from "../hooks/useQRScanner";
import { AnimalOverlay } from "./AnimalOverlay";

// three.js + @react-three/fiber are a meaningful chunk of bundle size --
// lazy-loaded so the landing/waiting-room/leaderboard screens (which never
// mount CameraView) don't pay for them.
const AnimalScene = lazy(() => import("../three/AnimalScene").then((m) => ({ default: m.AnimalScene })));

export function CameraView({ onDiscover, onStatusChange }) {
  const { videoRef, status, start } = useCamera();
  const canvasRef = useRef(null);
  // Shared with AnimalScene (the 3D layer) so it can read the same live
  // tracking data useQRScanner maintains, without another React state stream.
  const trackedRef = useRef(new Map());

  // Mounting CameraView only happens after the player taps "Start Game" in
  // App.jsx, which is what gates the permission prompt to a user action.
  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useQRScanner({ videoRef, canvasRef, active: status === "active", onDiscover, trackedRef });

  return (
    <div className="camera-view">
      <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
      <AnimalOverlay canvasRef={canvasRef} />
      <Suspense fallback={null}>
        <AnimalScene trackedRef={trackedRef} />
      </Suspense>
    </div>
  );
}
