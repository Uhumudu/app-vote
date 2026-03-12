import React, { createContext, useState, useEffect } from "react";

// Création du contexte
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Sauvegarder le thème dans le localStorage
  useEffect(() => {
    localStorage.setItem("theme", theme);

    // Ajouter la classe au body pour que le CSS s'applique globalement
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};