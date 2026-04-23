import "@fontsource/inter/latin.css";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { useRoutes } from "./stores/routeStore";

function App() {
  const route = useRoutes((state) => state.currentRoute);
  const routeParams = useRoutes((state) => state.routeParams);

  return (
    <div className="grid grid-cols-[280px_1fr] h-full w-full">
      <div className="flex flex-col justify-start select-none">
        <div
          className="h-titlebar bg-background w-full select-none border-r"
          data-tauri-drag-region
        />
        <div className="border-r flex-1 px-4" data-tauri-drag-region>
          <Sidebar />
        </div>
      </div>
      <main>
        <div
          className="h-8 bg-background w-full select-none"
          data-tauri-drag-region
        />
        <div className="px-6">
          <p>
            Here may be your content for: {route} with params{" "}
            {JSON.stringify(routeParams)}
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
