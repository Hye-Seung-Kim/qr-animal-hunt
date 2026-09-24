// Transparent canvas that useQRScanner draws the bounding box + animal +
// caption onto every frame. Deliberately a "dumb" element with no React
// state of its own — see hooks/useQRScanner.js for why.
export function AnimalOverlay({ canvasRef }) {
  return <canvas ref={canvasRef} className="animal-overlay" />;
}
