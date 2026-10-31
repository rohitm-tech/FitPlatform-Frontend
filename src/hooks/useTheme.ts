import { useEffect, useState } from "react";

export type ThemeName = "light" | "dark";

function readTheme(): ThemeName {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function applyTheme(next: ThemeName) {
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(next);
  localStorage.setItem("fp-theme", next);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", next === "light" ? "#ffffff" : "#000000");
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const choose = (next: ThemeName) => {
    applyTheme(next);
    setTheme(next);
  };

  return {
    theme,
    setTheme: choose,
    toggle: () => choose(theme === "dark" ? "light" : "dark"),
  };
}
