"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Set default ke system
  const [theme, setThemeState] = useState<Theme>("system");
  const [isDark, setIsDark] = useState(false);

  const applyTheme = React.useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    const shouldBeDark =
      newTheme === "dark" ||
      (newTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    setIsDark(shouldBeDark);
    
    // Hapus kedua class terlebih dahulu
    root.classList.remove("light", "dark");
    
    // Tambahkan class yang sesuai
    if (shouldBeDark) {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
  }, []);

  // Set initial theme saat komponen dimuat
  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "system";
    setThemeState(stored);
    applyTheme(stored);
  }, [applyTheme]);

  // Sync dengan perubahan system theme jika mode adalah "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  // Selalu kembalikan Provider agar Context bisa diakses sejak awal
  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return (
    context ?? {
      theme: "system" as Theme,
      setTheme: () => {},
      isDark: false,
    }
  );
}