export function GameHUD({ foundCount, total, lastDiscovery }) {
  return (
    <>
      <div className="hud-top">
        <span className="hud-title">Animal Hunt</span>
        <span className="hud-count">Animals found: {foundCount} / {total}</span>
      </div>

      {lastDiscovery && (
        <div className={`hud-toast${lastDiscovery.unknown ? " hud-toast-unknown" : ""}`}>
          <strong>
            {lastDiscovery.unknown ? "Unknown creature" : `You found a ${lastDiscovery.name}!`}
          </strong>
          {lastDiscovery.caption && !lastDiscovery.unknown && <span>{lastDiscovery.caption}</span>}
        </div>
      )}

      <div className="hud-bottom">Point your camera at a QR code</div>
    </>
  );
}
