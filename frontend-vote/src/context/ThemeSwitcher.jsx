import React, { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button onClick={toggleTheme}>
      Passer au thème {theme === "light" ? "sombre" : "clair"}
    </button>
  );
};

export default ThemeSwitcher;