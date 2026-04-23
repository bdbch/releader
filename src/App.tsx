import "@fontsource/inter/latin.css";
import { useEffect, useMemo } from "react";
import { Effect, getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";
import { AppRoutes } from "./components/AppRoutes";
import { Sidebar } from "./components/Sidebar";
import { platform } from '@tauri-apps/plugin-os'
import { useThemeStore } from "@/stores/themeStore";

function App() {
  const currentPlatform = useMemo(() => platform(), [])
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  useEffect(() => {
    function handleContextMenu(event: MouseEvent) {
      event.preventDefault();
    }

    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.platform = currentPlatform;
  }, [currentPlatform]);

  useEffect(() => {
    if (currentPlatform !== "windows") {
      delete document.documentElement.dataset.windowEffect;
      return;
    }

    document.documentElement.dataset.windowEffect = "mica";

    void getCurrentWindow().setEffects({
      effects: [Effect.Mica],
    });
  }, [currentPlatform, resolvedTheme]);

  return (
    <div className="app-shell grid h-full w-full grid-cols-[280px_1fr] bg-background text-foreground">
      <div className="app-panel-blur flex flex-col justify-start select-none border-r bg-background">
        {currentPlatform === 'macos' && <div className="h-titlebar w-full select-none" data-tauri-drag-region />}
        <div className="flex-1 px-4 py-3" data-tauri-drag-region>
          <Sidebar />
        </div>
      </div>
      <main className="app-panel-blur flex min-h-0 flex-col bg-background">
        <div className="min-h-0 flex-1 overflow-auto">
          <AppRoutes />
        </div>
      </main>
    </div>
  );
}

export default App;
