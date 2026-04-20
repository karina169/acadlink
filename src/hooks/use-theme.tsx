import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light" | "midnight" | "warm";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "dark", setTheme: () => {} });

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("acadlink-theme") as Theme | null;
      if (saved) setTheme(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-midnight", "theme-warm");
    if (theme !== "dark") root.classList.add(`theme-${theme}`);
    localStorage.setItem("acadlink-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
