// src/components/SuperAdminSidebar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut,
  FiCalendar, FiShield, FiCreditCard, FiSend, FiAlertCircle
} from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";

const NAV_ITEMS = [
  { to: "/superAdminDashboard", icon: <FiHome size={16} />, label: "Tableau de bord", key: "dashboard" },
  { to: "/admin/superadmin/utilisateursPage", icon: <FiUsers size={16} />, label: "Utilisateurs", key: "users" },
  { to: "/admin/superadmin/electionsValider", icon: <FaVoteYea size={15} />, label: "Élections à valider", key: "valider" },
  { to: "/admin/superadmin/elections", icon: <FiCalendar size={16} />, label: "Toutes les élections", key: "elections" },
  { to: "/admin/superadmin/StatistiquesPage", icon: <FiBarChart2 size={16} />, label: "Statistiques", key: "stats" },
  { to: "/admin/superadmin/transactions-campay", icon: <FiCreditCard size={16} />, label: "Transactions", key: "transactions" },
 // { to: "/admin/superadmin/retraits", icon: <FiSend size={16} />, label: "Retraits", key: "retraits" },
];

export default function SuperAdminSidebar({ active }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleConfirmLogout = () => {
    // Ajoutez ici votre logique de nettoyage (ex: localStorage.clear(), remove cookie)
    console.log("Déconnexion effectuée");
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  return (
    <>
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
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
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
                  background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                  border: isActive ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.18s ease",
                  position: "relative",
                  boxShadow: isActive ? "0 2px 12px rgba(0,0,0,0.15)" : "none",
                }}
              >
                {isActive && (
                  <span style={{
                    position: "absolute",
                    left: 0, top: "50%",
                    transform: "translateY(-50%)",
                    width: "3px", height: "60%",
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
          <Link
            to="/admin/superadmin/parametres"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
              padding: "10px 12px",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: active === "parametres" ? 600 : 400,
              color: "#ffffff",
              textDecoration: "none",
              background: active === "parametres" ? "rgba(255,255,255,0.2)" : "transparent",
              transition: "all 0.18s ease",
            }}
          >
            <FiSettings size={16} style={{ opacity: 0.75 }} />
            <span>Paramètres</span>
          </Link>

          {/* Bouton Déconnexion avec Confirmation */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
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
              cursor: "pointer",
              transition: "all 0.18s ease",
              width: "100%",
              textAlign: "left",
              fontFamily: "inherit"
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
          </button>

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

      {/* --- MODAL DE CONFIRMATION (Interface App) --- */}
      {showLogoutConfirm && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            padding: "32px",
            borderRadius: "16px",
            width: "360px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            textAlign: "center"
          }}>
            <div style={{
              width: "56px", height: "56px",
              backgroundColor: "#fee2e2",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              color: "#dc2626"
            }}>
              <FiAlertCircle size={28} />
            </div>
            
            <h3 style={{ margin: "0 0 10px 0", color: "#111827", fontSize: "18px", fontWeight: 700 }}>
              Déconnexion
            </h3>
            
            <p style={{ margin: "0 0 24px 0", color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
              Voulez-vous vraiment quitter votre session ? Vous devrez vous reconnecter pour accéder au tableau de bord.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#ffffff"}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmLogout}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#b91c1c"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#dc2626"}
              >
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

























// // src/components/SuperAdminSidebar.jsx
// import { Link } from "react-router-dom";
// import {
//   FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut,
//   FiCalendar, FiShield, FiCreditCard, FiSend
// } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";

// const NAV_ITEMS = [
//   { to: "/superAdminDashboard",                  icon: <FiHome size={16} />,       label: "Tableau de bord",      key: "dashboard"    },
//   { to: "/admin/superadmin/utilisateursPage",    icon: <FiUsers size={16} />,      label: "Utilisateurs",         key: "users"        },
//   { to: "/admin/superadmin/electionsValider",    icon: <FaVoteYea size={15} />,    label: "Élections à valider",  key: "valider"      },
//   { to: "/admin/superadmin/elections",           icon: <FiCalendar size={16} />,   label: "Toutes les élections", key: "elections"    },
//   { to: "/admin/superadmin/StatistiquesPage",    icon: <FiBarChart2 size={16} />,  label: "Statistiques",         key: "stats"        },
//   { to: "/admin/superadmin/transactions-campay", icon: <FiCreditCard size={16} />, label: "Transactions",         key: "transactions" },
//   { to: "/admin/superadmin/retraits",            icon: <FiSend size={16} />,       label: "Retraits",             key: "retraits"     },
// ];

// export default function SuperAdminSidebar({ active }) {
//   return (
//     <aside
//       style={{
//         width: "256px",
//         background: "linear-gradient(180deg, #1a3fa8 0%, #2356c7 40%, #2d65d8 100%)",
//         borderRight: "1px solid rgba(255,255,255,0.1)",
//         padding: "0",
//         display: "flex",
//         flexDirection: "column",
//         position: "sticky",
//         top: 0,
//         height: "100vh",
//         overflowY: "auto",
//         boxShadow: "4px 0 28px rgba(27,63,168,0.4)",
//       }}
//     >
//       {/* Logo */}
//       <div style={{
//         padding: "28px 24px 24px",
//         borderBottom: "1px solid rgba(255,255,255,0.12)",
//       }}>
//         <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
//           <div style={{
//             width: "32px", height: "32px",
//             background: "rgba(255,255,255,0.2)",
//             borderRadius: "8px",
//             display: "flex", alignItems: "center", justifyContent: "center",
//             boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
//             fontSize: "16px",
//             backdropFilter: "blur(4px)",
//             border: "1px solid rgba(255,255,255,0.25)",
//           }}>🗳</div>
//           <h1 style={{
//             fontSize: "18px",
//             fontWeight: 800,
//             color: "#ffffff",
//             letterSpacing: "-0.3px",
//             fontFamily: "'Segoe UI', sans-serif",
//             margin: 0,
//           }}>eVote</h1>
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingLeft: "42px" }}>
//           <FiShield size={10} color="rgba(255,255,255,0.7)" />
//           <p style={{
//             fontSize: "11px",
//             color: "rgba(255,255,255,0.7)",
//             fontWeight: 500,
//             margin: 0,
//             letterSpacing: "0.3px",
//             textTransform: "uppercase",
//           }}>Super administrateur</p>
//         </div>
//       </div>

//       {/* Nav label */}
//       <div style={{ padding: "20px 24px 8px" }}>
//         <span style={{
//           fontSize: "10px",
//           fontWeight: 600,
//           color: "rgba(255,255,255,0.45)",
//           letterSpacing: "1px",
//           textTransform: "uppercase",
//         }}>Navigation</span>
//       </div>

//       {/* Nav items */}
//       <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
//         {NAV_ITEMS.map(item => {
//           const isActive = active === item.key;
//           return (
//             <Link
//               key={item.key}
//               to={item.to}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "11px",
//                 padding: "10px 12px",
//                 borderRadius: "10px",
//                 fontSize: "13.5px",
//                 fontWeight: isActive ? 600 : 400,
//                 color: "#ffffff",
//                 background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
//                 border: isActive ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
//                 textDecoration: "none",
//                 transition: "all 0.18s ease",
//                 position: "relative",
//                 boxShadow: isActive ? "0 2px 12px rgba(0,0,0,0.15)" : "none",
//               }}
//               onMouseEnter={e => {
//                 if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.1)";
//               }}
//               onMouseLeave={e => {
//                 if (!isActive) e.currentTarget.style.background = "transparent";
//               }}
//             >
//               {isActive && (
//                 <span style={{
//                   position: "absolute",
//                   left: 0,
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   width: "3px",
//                   height: "60%",
//                   background: "#ffffff",
//                   borderRadius: "0 3px 3px 0",
//                   opacity: 0.9,
//                 }} />
//               )}
//               <span style={{ display: "flex", opacity: isActive ? 1 : 0.75 }}>
//                 {item.icon}
//               </span>
//               <span style={{ opacity: isActive ? 1 : 0.85 }}>{item.label}</span>
//             </Link>
//           );
//         })}
//       </nav>

//       {/* Footer */}
//       <div style={{
//         padding: "12px",
//         borderTop: "1px solid rgba(255,255,255,0.12)",
//         margin: "8px 0 0",
//         display: "flex",
//         flexDirection: "column",
//         gap: "2px",
//       }}>
//         {/* Settings */}
//         {(() => {
//           const isActive = active === "parametres";
//           return (
//             <Link
//               to="/admin/superadmin/parametres"
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "11px",
//                 padding: "10px 12px",
//                 borderRadius: "10px",
//                 fontSize: "13.5px",
//                 fontWeight: isActive ? 600 : 400,
//                 color: "#ffffff",
//                 background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
//                 border: isActive ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
//                 textDecoration: "none",
//                 transition: "all 0.18s ease",
//               }}
//               onMouseEnter={e => {
//                 if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.1)";
//               }}
//               onMouseLeave={e => {
//                 if (!isActive) e.currentTarget.style.background = "transparent";
//               }}
//             >
//               <span style={{ display: "flex", opacity: isActive ? 1 : 0.75 }}>
//                 <FiSettings size={16} />
//               </span>
//               <span style={{ opacity: isActive ? 1 : 0.85 }}>Paramètres</span>
//             </Link>
//           );
//         })()}

//         {/* Logout */}
//         <Link
//           to="/logout"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: "11px",
//             padding: "10px 12px",
//             borderRadius: "10px",
//             fontSize: "13.5px",
//             fontWeight: 400,
//             color: "rgba(255,180,180,0.85)",
//             background: "transparent",
//             border: "1px solid transparent",
//             textDecoration: "none",
//             transition: "all 0.18s ease",
//           }}
//           onMouseEnter={e => {
//             e.currentTarget.style.background = "rgba(255,100,100,0.15)";
//             e.currentTarget.style.color = "#ffaaaa";
//             e.currentTarget.style.border = "1px solid rgba(255,120,120,0.25)";
//           }}
//           onMouseLeave={e => {
//             e.currentTarget.style.background = "transparent";
//             e.currentTarget.style.color = "rgba(255,180,180,0.85)";
//             e.currentTarget.style.border = "1px solid transparent";
//           }}
//         >
//           <FiLogOut size={16} />
//           Déconnexion
//         </Link>

//         {/* User badge */}
//         <div style={{
//           marginTop: "8px",
//           padding: "10px 12px",
//           borderRadius: "10px",
//           background: "rgba(255,255,255,0.1)",
//           border: "1px solid rgba(255,255,255,0.15)",
//           display: "flex",
//           alignItems: "center",
//           gap: "10px",
//         }}>
//           <div style={{
//             width: "30px", height: "30px",
//             borderRadius: "50%",
//             background: "rgba(255,255,255,0.25)",
//             border: "1px solid rgba(255,255,255,0.3)",
//             display: "flex", alignItems: "center", justifyContent: "center",
//             fontSize: "11px", fontWeight: 700, color: "#fff",
//             flexShrink: 0,
//           }}>SA</div>
//           <div>
//             <div style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>Super Admin</div>
//             <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>Accès complet</div>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// }