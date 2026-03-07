import { useEffect, useState } from "react";

export type ThemeAppearance = "light" | "dark";

export const THEME_STORAGE_KEY = "ocx-theme-appearance";
export const THEME_EVENT = "ocx-theme-change";

function normalizeAppearance(value: string | null): ThemeAppearance | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === "dark") return "dark";
  if (normalized === "light") return "light";
  return null;
}

export function getPreferredAppearance(): ThemeAppearance {
  if (typeof window === "undefined") return "light";
  const stored = normalizeAppearance(window.localStorage.getItem(THEME_STORAGE_KEY));
  if (stored) return stored;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyAppearance(appearance: ThemeAppearance) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", appearance === "dark");
  document.documentElement.setAttribute("data-theme", appearance);
}

export function setPreferredAppearance(appearance: ThemeAppearance) {
  if (typeof window === "undefined") return;
  const current = normalizeAppearance(window.localStorage.getItem(THEME_STORAGE_KEY));
  applyAppearance(appearance);
  window.localStorage.setItem(THEME_STORAGE_KEY, appearance);
  if (current !== appearance) {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: appearance }));
  }
}

export function useThemeAppearance() {
  const [appearance, setAppearance] = useState<ThemeAppearance>(() => getPreferredAppearance());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const normalized = normalizeAppearance(detail);
      if (normalized) {
        setAppearance(normalized);
      }
    };
    const storageHandler = () => setAppearance(getPreferredAppearance());
    window.addEventListener(THEME_EVENT, handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener(THEME_EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  return appearance;
}
