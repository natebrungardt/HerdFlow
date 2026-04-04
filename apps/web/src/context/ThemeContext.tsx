import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

type ThemeProviderProps = {
  children: ReactNode;
  forcedTheme?: Theme;
};

const STORAGE_KEY = "herdflow-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function ThemeProvider({
  children,
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(forcedTheme ?? getInitialTheme);

  useEffect(() => {
    if (!forcedTheme) {
      return;
    }

    setTheme(forcedTheme);
  }, [forcedTheme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    if (!forcedTheme) {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [forcedTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        setTheme((currentTheme) =>
          currentTheme === "dark" ? "light" : "dark",
        );
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { ThemeContext };
