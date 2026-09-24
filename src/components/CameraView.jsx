import { useEffect, useRef } from "react";
import { useCamera } from "../hooks/useCamera";
import { useQRScanner } from "../hooks/useQRScanner";
import { AnimalOverlay } from "./AnimalOverlay";

export function CameraView({ onDiscover, onStatusChange }) {
  const { videoRef, status, start } = useCamera();
  const canvasRef = useRef(null);

  // Mounting CameraView only happens after the player taps "Start Game" in
  // App.jsx, which is what gates the permission prompt to a user action.
  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useQRScanner({ videoRef, canvasRef, active: status === "active", onDiscover });

  return (
    <div className="camera-view">
      <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
      <AnimalOverlay canvasRef={canvasRef} />
    </div>
  );
}
