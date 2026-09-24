const MESSAGES = {
  denied: "Camera access is required to play. Please allow camera access in your browser settings and reload.",
  unavailable: "No usable camera was found on this device.",
  unsupported: "This browser doesn't support camera access. Try the latest Chrome or Safari.",
  error: "Something went wrong starting the camera. Please reload and try again.",
};

export function ErrorBanner({ status }) {
  const message = MESSAGES[status];
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      {message}
    </div>
  );
}
