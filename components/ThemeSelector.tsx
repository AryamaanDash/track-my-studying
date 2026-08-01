"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const storageKey = "track-my-studying-theme";
const themeChangeEvent = "track-my-studying-theme-change";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  try {
    return window.localStorage.getItem(storageKey) === "dark" ? "dark" : "light";
  } catch {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function getServerTheme(): Theme {
  return "light";
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(themeChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(themeChangeEvent, onStoreChange);
  };
}

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationStatus() {
  return true;
}

function getServerHydrationStatus() {
  return false;
}

export default function ThemeSelector() {
  const theme = useSyncExternalStore(
    subscribeToThemeChanges,
    getStoredTheme,
    getServerTheme
  );
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationStatus,
    getServerHydrationStatus
  );
  const selectedTheme = hasHydrated ? theme : getServerTheme();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function chooseTheme(nextTheme: Theme) {
    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch {
      // The DOM still updates when storage is unavailable.
    }

    applyTheme(nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <div
      aria-label="Color theme"
      className="flex w-fit items-center rounded-full border border-border p-0.5 text-xs"
      role="group"
    >
      <button
        aria-pressed={selectedTheme === "light"}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors ${
          selectedTheme === "light"
            ? "bg-foreground text-background"
            : "text-muted hover:text-foreground"
        }`}
        onClick={() => chooseTheme("light")}
        type="button"
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Light</span>
      </button>
      <button
        aria-pressed={selectedTheme === "dark"}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors ${
          selectedTheme === "dark"
            ? "bg-foreground text-background"
            : "text-muted hover:text-foreground"
        }`}
        onClick={() => chooseTheme("dark")}
        type="button"
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Dark</span>
      </button>
    </div>
  );
}
