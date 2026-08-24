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

  const nextTheme: Theme = selectedTheme === "light" ? "dark" : "light";
  const ThemeIcon = selectedTheme === "light" ? Sun : Moon;

  return (
    <button
      type="button"
      className="journal-utility"
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      onClick={() => chooseTheme(nextTheme)}
    >
      <ThemeIcon aria-hidden="true" />
      Theme
    </button>
  );
}
