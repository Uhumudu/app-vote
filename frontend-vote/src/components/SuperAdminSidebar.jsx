// src/components/SuperAdminSidebar.jsx
import { Link } from "react-router-dom";
import {
  FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiCalendar, FiShield, FiCreditCard 
} from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";
const NAV_ITEMS = [
  { to: "/superAdminDashboard",               icon: <FiHome size={16} />,      label: "Tableau de bord",      key: "dashboard" },
  { to: "/admin/superadmin/utilisateursPage", icon: <FiUsers size={16} />,     label: "Utilisateurs",         key: "users" },
  { to: "/admin/superadmin/electionsValider", icon: <FaVoteYea size={15} />,   label: "Élections à valider",  key: "valider" },
  { to: "/admin/superadmin/elections",        icon: <FiCalendar size={16} />,  label: "Toutes les élections", key: "elections" },
  { to: "/admin/superadmin/StatistiquesPage", icon: <FiBarChart2 size={16} />, label: "Statistiques",         key: "stats" },
   { to: "/admin/superadmin/transactions-campay", icon: <FiCreditCard size={16} />, label: "Transactions CamPay",key: "transactions" },
];

export default function SuperAdminSidebar({ active }) {
  return (
    <aside
      style={{
        width: "256px",
        background: "linear-gradient(180deg, #1a3fa8 0%, #2356c7 40%, #2d65d8 100%)",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        padding: "0",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        boxShadow: "4px 0 28px rgba(27,63,168,0.4)",
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
          <FiShield size={10} color="rgba(255,255,255,0.7)" />
          <p style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.7)",
            fontWeight: 500,
            margin: 0,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}>Super administrateur</p>
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
                background: isActive
                  ? "rgba(255,255,255,0.2)"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(255,255,255,0.3)"
                  : "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.18s ease",
                position: "relative",
                boxShadow: isActive ? "0 2px 12px rgba(0,0,0,0.15)" : "none",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                }
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
        {/* Settings */}
        {(() => {
          const isActive = active === "parametres";
          return (
            <Link
              to="/admin/superadmin/parametres"
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
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ display: "flex", opacity: isActive ? 1 : 0.75 }}>
                <FiSettings size={16} />
              </span>
              <span style={{ opacity: isActive ? 1 : 0.85 }}>Paramètres</span>
            </Link>
          );
        })()}

        {/* Logout */}
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

        {/* User badge */}
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
          }}>SA</div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>Super Admin</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>Accès complet</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

