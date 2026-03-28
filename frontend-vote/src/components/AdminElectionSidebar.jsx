// src/components/AdminElectionSidebar.jsx
import { Link } from "react-router-dom";
import {
  FiHome, FiCalendar, FiSettings, FiLogOut, FiAward,
} from "react-icons/fi";

const NAV_ITEMS = [
  { to: "/adminElectionDashboard",           icon: <FiHome size={16} />,     label: "Tableau de bord", key: "dashboard" },
  { to: "/admin/adminelection/ElectionPage", icon: <FiCalendar size={16} />, label: "Mes Élections",   key: "elections" },
];

export default function AdminElectionSidebar({ active }) {
  const prenom = localStorage.getItem("prenom") || "";
  const nom    = localStorage.getItem("nom")    || "";
  const initials   = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "AE";
  const displayName = [prenom, nom].filter(Boolean).join(" ") || "Admin Élection";

  return (
    <>
      {/* ── Sidebar fixe ── */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "256px",
          height: "100vh",
          zIndex: 50,
          background: "linear-gradient(180deg, #2e1065 0%, #4338ca 40%, #4f46e5 100%)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          boxShadow: "4px 0 28px rgba(67,56,202,0.45)",
        }}
      >
        {/* Logo */}
        <div style={{
          padding: "28px 24px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{
              width: "32px", height: "32px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              fontSize: "16px",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}>🗳</div>
            <h1 style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.3px",
              fontFamily: "'Segoe UI', sans-serif",
              margin: 0,
            }}>eVote</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingLeft: "42px" }}>
            <FiAward size={10} color="rgba(255,255,255,0.7)" />
            <p style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
              margin: 0,
              letterSpacing: "0.3px",
              textTransform: "uppercase",
            }}>Admin d'Élection</p>
          </div>
        </div>

        {/* Nav label */}
        <div style={{ padding: "20px 24px 8px" }}>
          <span style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}>Navigation</span>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV_ITEMS.map(item => {
            const isActive = active === item.key;
            return (
              <Link
                key={item.key}
                to={item.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  fontWeight: isActive ? 600 : 400,
                  color: "#ffffff",
                  background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                  border: isActive ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.18s ease",
                  position: "relative",
                  boxShadow: isActive ? "0 2px 12px rgba(0,0,0,0.15)" : "none",
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                {isActive && (
                  <span style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "3px",
                    height: "60%",
                    background: "#ffffff",
                    borderRadius: "0 3px 3px 0",
                    opacity: 0.9,
                  }} />
                )}
                <span style={{ display: "flex", opacity: isActive ? 1 : 0.75 }}>
                  {item.icon}
                </span>
                <span style={{ opacity: isActive ? 1 : 0.85 }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: "12px",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          margin: "8px 0 0",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}>
          {/* Paramètres */}
          {(() => {
            const isActive = active === "parametres";
            return (
              <Link
                to="/admin/adminelection/parametres"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  fontWeight: isActive ? 600 : 400,
                  color: "#ffffff",
                  background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                  border: isActive ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ display: "flex", opacity: isActive ? 1 : 0.75 }}>
                  <FiSettings size={16} />
                </span>
                <span style={{ opacity: isActive ? 1 : 0.85 }}>Paramètres</span>
              </Link>
            );
          })()}

          {/* Déconnexion */}
          <Link
            to="/logout"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
              padding: "10px 12px",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: 400,
              color: "rgba(255,180,180,0.85)",
              background: "transparent",
              border: "1px solid transparent",
              textDecoration: "none",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,100,100,0.15)";
              e.currentTarget.style.color = "#ffaaaa";
              e.currentTarget.style.border = "1px solid rgba(255,120,120,0.25)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,180,180,0.85)";
              e.currentTarget.style.border = "1px solid transparent";
            }}
          >
            <FiLogOut size={16} />
            Déconnexion
          </Link>

          {/* Badge utilisateur */}
          <div style={{
            marginTop: "8px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <div style={{
              width: "30px", height: "30px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
              border: "1px solid rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700, color: "#fff",
              flexShrink: 0,
            }}>{initials}</div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>{displayName}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>Admin Élection</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Spacer : compense la largeur fixe pour que le contenu principal ne passe pas dessous */}
      <div style={{ width: "256px", flexShrink: 0 }} />
    </>
  );
}

























// // src/components/AdminElectionSidebar.jsx
// // Sidebar commune à toutes les pages Admin d'Élection
// import { Link } from "react-router-dom";
// import { FiHome, FiCalendar, FiSettings, FiLogOut } from "react-icons/fi";

// const NAV_ITEMS = [
//   { to: "/adminElectionDashboard",           icon: <FiHome size={15} />,     label: "Tableau de bord", key: "dashboard" },
//   { to: "/admin/adminelection/ElectionPage", icon: <FiCalendar size={15} />, label: "Mes Élections",   key: "elections" },
// ];

// export default function AdminElectionSidebar({ active }) {
//   return (
//     <aside className="w-64 min-h-screen bg-white/90 backdrop-blur border-r border-gray-200 p-6 flex flex-col shadow-sm">

//       {/* Logo */}
//       <div className="mb-10">
//         <h1 className="text-xl font-black text-indigo-700 tracking-tight">🗳 eVote</h1>
//         <p className="text-xs text-indigo-400 font-medium mt-0.5">Admin d'Élection</p>
//       </div>

//       {/* Navigation principale */}
//       <nav className="flex-1 space-y-1">
//         {NAV_ITEMS.map(item => (
//           <Link
//             key={item.key}
//             to={item.to}
//             className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
//               active === item.key
//                 ? "bg-indigo-100 text-indigo-700 font-semibold"
//                 : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
//             }`}
//           >
//             {item.icon} {item.label}
//           </Link>
//         ))}
//       </nav>

//       {/* Paramètres + Déconnexion collés en bas */}
//       <div className="space-y-1 pt-4 border-t border-gray-100 mt-auto">
//         <Link
//           to="/admin/adminelection/parametres"
//           className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
//             active === "parametres"
//               ? "bg-indigo-100 text-indigo-700 font-semibold"
//               : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
//           }`}
//         >
//           <FiSettings size={15} /> Paramètres
//         </Link>
//         <Link
//           to="/logout"
//           className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
//         >
//           <FiLogOut size={15} /> Déconnexion
//         </Link>
//       </div>

//     </aside>
//   );
// }
