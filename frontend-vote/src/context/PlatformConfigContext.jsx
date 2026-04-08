// src/context/PlatformConfigContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";

const PlatformConfigContext = createContext(null);

const DEFAULTS = {
  nomPlateforme:      "VoteSecure",
  urlFrontend:        "https://votesecure.cm",
  emailSupport:       "support@votesecure.cm",
  votesMultiples:     false,
  inscriptionOuverte: true,
  maintenance:        false,
  dureeSession:       "24",
  couleurPrincipale:  "#4f46e5",
  logoUrl:            "",
  messageMaintenance: "La plateforme est temporairement indisponible pour maintenance.",
};

export function PlatformConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const applyConfig = useCallback((cfg) => {
    const merged = { ...DEFAULTS, ...cfg };
    setConfig(merged);
    // Appliquer la couleur principale comme variable CSS globale
    document.documentElement.style.setProperty(
      "--platform-color",
      merged.couleurPrincipale || "#4f46e5"
    );
    // Changer le titre de l'onglet
    if (merged.nomPlateforme) {
      document.title = merged.nomPlateforme;
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/super-admin/settings/platform/public"
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      applyConfig(data);
    } catch {
      applyConfig(DEFAULTS);
    } finally {
      setLoaded(true);
    }
  }, [applyConfig]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Écoute les mises à jour faites par SuperAdminSettings.jsx
  useEffect(() => {
    const handler = (e) => {
      if (e.detail) applyConfig(e.detail);
    };
    window.addEventListener("platformConfigUpdated", handler);
    return () => window.removeEventListener("platformConfigUpdated", handler);
  }, [applyConfig]);

  return (
    <PlatformConfigContext.Provider value={{ config, loaded, refetch: fetchConfig }}>
      {children}
    </PlatformConfigContext.Provider>
  );
}

export function usePlatformConfig() {
  const ctx = useContext(PlatformConfigContext);
  if (!ctx) throw new Error("usePlatformConfig must be used inside PlatformConfigProvider");
  return ctx;
}
