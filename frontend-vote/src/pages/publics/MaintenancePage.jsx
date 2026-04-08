// src/pages/publics/MaintenancePage.jsx
import { FiTool } from "react-icons/fi";
import { usePlatformConfig } from "../../context/PlatformConfigContext";

const API_BASE = "http://localhost:5000";

export default function MaintenancePage() {
  // Utilise le context global — plus besoin de fetch ici
  const { config } = usePlatformConfig();

  const color = config?.couleurPrincipale || "#4f46e5";
  const name  = config?.nomPlateforme     || "VoteSecure";
  const msg   = config?.messageMaintenance
    || "La plateforme est temporairement indisponible pour maintenance. Veuillez réessayer ultérieurement.";

  // Construire l'URL du logo correctement
  const logoUrl = config?.logoUrl
    ? config.logoUrl.startsWith("http")
      ? config.logoUrl
      : `${API_BASE}${config.logoUrl}`
    : "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Outfit',sans-serif;background:#f8fafc;min-height:100vh;
          display:flex;align-items:center;justify-content:center}
        .mp-wrap{text-align:center;padding:48px 24px;max-width:480px;margin:0 auto}
        .mp-icon-circle{width:80px;height:80px;border-radius:50%;display:flex;
          align-items:center;justify-content:center;margin:0 auto 24px;color:#fff;font-size:32px}
        .mp-logo{height:56px;object-fit:contain;margin-bottom:20px}
        .mp-name{font-size:24px;font-weight:800;margin-bottom:20px}
        .mp-title{font-size:28px;font-weight:800;color:#1e1b4b;margin-bottom:12px}
        .mp-msg{font-size:15px;color:#6b7280;line-height:1.7;margin-bottom:32px}
        .mp-badge{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;
          border-radius:999px;font-size:13px;font-weight:600;color:#fff}
        .mp-dot{width:8px;height:8px;border-radius:50%;background:#fff;
          animation:pulse 1.4s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
      `}</style>
      <div className="mp-wrap">
        {logoUrl ? (
          <img src={logoUrl} alt={name} className="mp-logo" />
        ) : (
          <div className="mp-name" style={{ color }}>{name}</div>
        )}

        <div className="mp-icon-circle" style={{ background: color }}>
          <FiTool />
        </div>

        <h1 className="mp-title">Maintenance en cours</h1>
        <p className="mp-msg">{msg}</p>

        <span className="mp-badge" style={{ background: color }}>
          <span className="mp-dot" />
          Nous serons bientôt de retour
        </span>
      </div>
    </>
  );
}
















// import { useEffect, useState } from "react";
// import { FiTool } from "react-icons/fi";

// export default function MaintenancePage() {
//   const [config, setConfig] = useState(null);

//   useEffect(() => {
//     // On charge la config publique pour afficher le bon message et la bonne couleur
//     fetch("http://localhost:5000/api/super-admin/settings/platform/public")
//       .then(r => r.json())
//       .then(d => setConfig(d))
//       .catch(() => {});
//   }, []);

//   const color  = config?.couleurPrincipale || "#4f46e5";
//   const name   = config?.nomPlateforme     || "VoteSecure";
//   const logo   = config?.logoUrl           || "";
//   const msg    = config?.messageMaintenance
//     || "La plateforme est temporairement indisponible pour maintenance. Veuillez réessayer ultérieurement.";

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
//         *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
//         body{font-family:'Outfit',sans-serif;background:#f8fafc;min-height:100vh;
//           display:flex;align-items:center;justify-content:center}
//         .mp-wrap{text-align:center;padding:48px 24px;max-width:480px;margin:0 auto}
//         .mp-icon-circle{width:80px;height:80px;border-radius:50%;display:flex;
//           align-items:center;justify-content:center;margin:0 auto 24px;color:#fff;font-size:32px}
//         .mp-logo{height:48px;object-fit:contain;margin-bottom:12px}
//         .mp-name{font-size:22px;font-weight:800;margin-bottom:24px}
//         .mp-title{font-size:28px;font-weight:800;color:#1e1b4b;margin-bottom:12px}
//         .mp-msg{font-size:15px;color:#6b7280;line-height:1.7;margin-bottom:32px}
//         .mp-badge{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;
//           border-radius:999px;font-size:13px;font-weight:600;color:#fff}
//         .mp-dot{width:8px;height:8px;border-radius:50%;background:#fff;
//           animation:pulse 1.4s ease-in-out infinite}
//         @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
//       `}</style>
//       <div className="mp-wrap">
//         {logo
//           ? <img src={`http://localhost:5000${logo}`} alt={name} className="mp-logo" />
//           : <div className="mp-name" style={{ color }}>{name}</div>}

//         <div className="mp-icon-circle" style={{ background: color }}>
//           <FiTool />
//         </div>

//         <h1 className="mp-title">Maintenance en cours</h1>
//         <p className="mp-msg">{msg}</p>

//         <span className="mp-badge" style={{ background: color }}>
//           <span className="mp-dot" />
//           Nous serons bientôt de retour
//         </span>
//       </div>
//     </>
//   );
// }
