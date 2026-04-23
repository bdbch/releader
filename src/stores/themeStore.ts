import { create } from "zustand";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeState = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  initializeTheme: () => void;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "releader.theme-preference";

let mediaQueryList: MediaQueryList | null = null;
let mediaQueryListenerAttached = false;

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: "system",
  resolvedTheme: "light",
  initializeTheme: () => {
    const storedPreference = loadThemePreference();
    const preference = storedPreference ?? "system";
    const resolvedTheme = resolveTheme(preference);

    applyTheme(resolvedTheme, storedPreference);
    attachSystemThemeListener();

    set({
      preference,
      resolvedTheme,
    });
  },
  setThemePreference: (preference) => {
    const resolvedTheme = resolveTheme(preference);

    saveThemePreference(preference);
    applyTheme(resolvedTheme, preference === "system" ? null : preference);

    set({
      preference,
      resolvedTheme,
    });
  },
  toggleTheme: () => {
    const nextPreference = get().resolvedTheme === "dark" ? "light" : "dark";
    get().setThemePreference(nextPreference);
  },
}));

export function initializeTheme() {
  useThemeStore.getState().initializeTheme();
}

function attachSystemThemeListener() {
  if (typeof window === "undefined" || mediaQueryListenerAttached) {
    return;
  }

  mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQueryList.addEventListener("change", handleSystemThemeChange);
  mediaQueryListenerAttached = true;
}

function handleSystemThemeChange() {
  const { preference } = useThemeStore.getState();

  if (preference !== "system") {
    return;
  }

  const resolvedTheme = resolveTheme("system");
  applyTheme(resolvedTheme, null);
  useThemeStore.setState({ resolvedTheme });
}

function loadThemePreference(): Exclude<ThemePreference, "system"> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(STORAGE_KEY);

  if (value === "light" || value === "dark") {
    return value;
  }

  return null;
}

function saveThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  if (preference === "system") {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, preference);
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(
  resolvedTheme: ResolvedTheme,
  explicitTheme: Exclude<ThemePreference, "system"> | null,
) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  root.dataset.theme = explicitTheme ?? "system";
  root.style.colorScheme = resolvedTheme;
}
