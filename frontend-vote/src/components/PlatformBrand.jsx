// src/components/PlatformBrand.jsx
// ─── Composant à utiliser partout où le nom/logo de la plateforme apparaît ───
// Remplace tous les <span>🗳 eVote</span> hardcodés par ce composant

import { usePlatformConfig } from "../context/PlatformConfigContext";

const API_BASE = "http://localhost:5000";

export default function PlatformBrand({ size = "md", showIcon = true }) {
  const { config } = usePlatformConfig();

  const logoUrl = config.logoUrl
    ? config.logoUrl.startsWith("http")
      ? config.logoUrl
      : `${API_BASE}${config.logoUrl}`
    : null;

  const sizes = {
    sm: { fontSize: 14, logoHeight: 24 },
    md: { fontSize: 18, logoHeight: 32 },
    lg: { fontSize: 24, logoHeight: 44 },
  };
  const { fontSize, logoHeight } = sizes[size] || sizes.md;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={config.nomPlateforme}
        style={{ height: logoHeight, objectFit: "contain" }}
      />
    );
  }

  return (
    <span
      style={{
        fontSize,
        fontWeight: 800,
        color: config.couleurPrincipale || "#4f46e5",
        letterSpacing: "-0.5px",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {showIcon && "🗳"} {config.nomPlateforme || "eVote"}
    </span>
  );
}
