import { useCallback, useEffect, useRef, useState } from "react";
import { StartScreen } from "./components/StartScreen";
import { CameraView } from "./components/CameraView";
import { GameHUD } from "./components/GameHUD";
import { AnimalCollection } from "./components/AnimalCollection";
import { ErrorBanner } from "./components/ErrorBanner";
import { useCollection } from "./hooks/useCollection";
import { ANIMAL_ORDER } from "./data/animals";
import "./App.css";

const ERROR_STATUSES = new Set(["denied", "unavailable", "unsupported", "error"]);
const TOAST_DURATION_MS = 2500;

function App() {
  const [screen, setScreen] = useState("start"); // 'start' | 'playing'
  const [cameraStatus, setCameraStatus] = useState("idle");
  const [lastDiscovery, setLastDiscovery] = useState(null);
  const { found, markFound } = useCollection();
  const toastTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const handleDiscover = useCallback(({ id, animal }) => {
    if (animal) {
      markFound(id);
      setLastDiscovery({ name: animal.name, caption: animal.caption, unknown: false });
    } else {
      setLastDiscovery({ unknown: true });
    }
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setLastDiscovery(null), TOAST_DURATION_MS);
  }, [markFound]);

  if (screen === "start") {
    return <StartScreen onStart={() => setScreen("playing")} />;
  }

  return (
    <div className="game-screen">
      <CameraView onDiscover={handleDiscover} onStatusChange={setCameraStatus} />
      <GameHUD foundCount={found.size} total={ANIMAL_ORDER.length} lastDiscovery={lastDiscovery} />
      {!ERROR_STATUSES.has(cameraStatus) && <AnimalCollection found={found} />}
      {ERROR_STATUSES.has(cameraStatus) && <ErrorBanner status={cameraStatus} />}
    </div>
  );
}

export default App;
