import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useSidebarStore } from "@/stores/sidebarStore";
import { initializeTheme } from "@/stores/themeStore";

window.resetReleaderData = () => useSidebarStore.getState().resetToSeededData();
initializeTheme();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
