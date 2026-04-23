import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useSidebarStore } from "@/stores/sidebarStore";

window.resetReleaderData = () => useSidebarStore.getState().resetToSeededData();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
