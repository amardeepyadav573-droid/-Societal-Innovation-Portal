import {
  createContext,
  useEffect,
  useState
} from "react";

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    localStorage.getItem("sip_theme") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem("sip_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}