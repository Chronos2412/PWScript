import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "psm-theme";

function readInitialDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function useTheme() {
  const [dark, setDarkState] = useState<boolean>(readInitialDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  const setDark = useCallback((next: boolean) => {
    setDarkState(next);
  }, []);

  const toggle = useCallback(() => {
    setDarkState((d) => !d);
  }, []);

  return { dark, setDark, toggle };
}
