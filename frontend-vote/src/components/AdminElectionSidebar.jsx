// src/components/AdminElectionSidebar.jsx
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiHome, FiCalendar, FiSettings, FiLogOut, FiAward, FiUsers, FiAlertCircle
} from "react-icons/fi";
import api from "../services/api";

export default function AdminElectionSidebar({ active }) {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const prenom      = localStorage.getItem("prenom") || "";
  const nom         = localStorage.getItem("nom")    || "";
  const initials    = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "AE";
  const displayName = [prenom, nom].filter(Boolean).join(" ") || "Admin Élection";

  // Récupère l'id election depuis l'URL si présent (ex: /candidatures/:id)
  const params    = useParams();
  const urlId     = params.id || params.electionId || null;

  // Elections publiques de l'admin pour afficher le lien Candidatures
  const [electionsPubliques, setElectionsPubliques] = useState([]);

  useEffect(() => {
    api.get("/elections")
      .then(res => {
        const publiques = res.data.filter(e => e.visibilite === "PUBLIQUE");
        setElectionsPubliques(publiques);
      })
      .catch(() => {});
  }, []);

  const handleConfirmLogout = () => {
    // Nettoyage des données de session
    localStorage.clear();
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  // ID à utiliser pour le lien : priorité à l'URL, sinon la première élection publique
  const electionPubliqueId = urlId || electionsPubliques[0]?.id_election || null;

  const NAV_ITEMS = [
    {
      to: "/adminElectionDashboard",
      icon: <FiHome size={16} />,
      label: "Tableau de bord",
      key: "dashboard",
    },
    {
      to: "/admin/adminelection/ElectionPage",
      icon: <FiCalendar size={16} />,
      label: "Mes Élections",
      key: "elections",
    },
    ...(electionPubliqueId ? [{
      to: `/admin/adminelection/candidatures/${electionPubliqueId}`,
      icon: <FiUsers size={16} />,
      label: "Traiter Candidatures",
      key: "candidatures",
    }] : []),
  ];

  return (
    <>
      <aside style={{
        position: "fixed",
        top: 0, left: 0,
        width: "256px", height: "100vh",
        zIndex: 50,
        background: "linear-gradient(180deg, #2e1065 0%, #4338ca 40%, #4f46e5 100%)",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
        boxShadow: "4px 0 28px rgba(67,56,202,0.45)",
      }}>

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
              fontSize: "18px", fontWeight: 800,
              color: "#ffffff", letterSpacing: "-0.3px",
              fontFamily: "'Segoe UI', sans-serif", margin: 0,
            }}>eVote</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingLeft: "42px" }}>
            <FiAward size={10} color="rgba(255,255,255,0.7)" />
            <p style={{
              fontSize: "11px", color: "rgba(255,255,255,0.7)",
              fontWeight: 500, margin: 0, letterSpacing: "0.3px",
              textTransform: "uppercase",
            }}>Admin d'Élection</p>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: "20px 24px 8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "1px", textTransform: "uppercase" }}>
            Navigation
          </span>
        </div>

        <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV_ITEMS.map(item => {
            const isActive = active === item.key;
            return (
              <Link
                key={item.key}
                to={item.to}
                style={{
                  display: "flex", alignItems: "center", gap: "11px",
                  padding: "10px 12px", borderRadius: "10px",
                  fontSize: "13.5px", fontWeight: isActive ? 600 : 400,
                  color: "#ffffff",
                  background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                  border: isActive ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
                  textDecoration: "none", transition: "all 0.18s ease",
                  position: "relative",
                  boxShadow: isActive ? "0 2px 12px rgba(0,0,0,0.15)" : "none",
                }}
              >
                {isActive && (
                  <span style={{
                    position: "absolute", left: 0, top: "50%",
                    transform: "translateY(-50%)", width: "3px", height: "60%",
                    background: "#ffffff", borderRadius: "0 3px 3px 0", opacity: 0.9,
                  }} />
                )}
                <span style={{ display: "flex", opacity: isActive ? 1 : 0.75 }}>{item.icon}</span>
                <span style={{ opacity: isActive ? 1 : 0.85, flex: 1 }}>{item.label}</span>
                {item.key === "candidatures" && (
                  <span style={{ fontSize: "9px", fontWeight: 700, background: "rgba(34,197,94,0.25)", border: "1px solid rgba(34,197,94,0.4)", color: "#86efac", padding: "2px 6px", borderRadius: "999px", textTransform: "uppercase" }}>
                    Public
                  </span>
                )}
              </Link>
            );
          })}

          {electionsPubliques.length === 0 && (
            <div style={{ margin: "4px 0", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", opacity: 0.5 }}>
                <FiUsers size={16} color="white" />
                <div>
                  <p style={{ margin: 0, fontSize: "12px", color: "white", fontWeight: 500 }}>Traiter Candidatures</p>
                  <p style={{ margin: "2px 0 0", fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>Aucune élection publique</p>
                </div>
              </div>
            </div>
          )}

          {electionsPubliques.length > 1 && (
            <div style={{ paddingLeft: "12px", marginTop: "2px", display: "flex", flexDirection: "column", gap: "2px" }}>
              {electionsPubliques.map(e => {
                const isActiveSub = active === "candidatures" && urlId === String(e.id_election);
                return (
                  <Link key={e.id_election} to={`/admin/adminelection/candidatures/${e.id_election}`}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "8px",
                      fontSize: "12px", fontWeight: isActiveSub ? 600 : 400, color: isActiveSub ? "#fff" : "rgba(255,255,255,0.65)",
                      background: isActiveSub ? "rgba(255,255,255,0.15)" : "transparent", textDecoration: "none", transition: "all .15s",
                    }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: isActiveSub ? "#fff" : "rgba(255,255,255,0.4)" }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.titre}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.12)", margin: "8px 0 0", display: "flex", flexDirection: "column", gap: "2px" }}>
          <Link to="/admin/adminelection/parametres" style={{
              display: "flex", alignItems: "center", gap: "11px", padding: "10px 12px", borderRadius: "10px",
              fontSize: "13.5px", fontWeight: active === "parametres" ? 600 : 400, color: "#ffffff",
              background: active === "parametres" ? "rgba(255,255,255,0.2)" : "transparent", textDecoration: "none", transition: "all 0.18s ease",
            }}>
            <FiSettings size={16} style={{ opacity: 0.75 }} />
            <span>Paramètres</span>
          </Link>

          {/* BOUTON DÉCONNEXION MODIFIÉ */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              display: "flex", alignItems: "center", gap: "11px", padding: "10px 12px", borderRadius: "10px",
              fontSize: "13.5px", fontWeight: 400, color: "rgba(255,180,180,0.85)",
              background: "transparent", border: "1px solid transparent", cursor: "pointer",
              transition: "all 0.18s ease", width: "100%", textAlign: "left", fontFamily: "inherit"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,100,100,0.15)"; e.currentTarget.style.color = "#ffaaaa"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,180,180,0.85)"; }}
          >
            <FiLogOut size={16} />
            Déconnexion
          </button>

          <div style={{ marginTop: "8px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff" }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>{displayName}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>Admin Élection</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ width: "256px", flexShrink: 0 }} />

      {/* --- INTERFACE DE CONFIRMATION --- */}
      {showLogoutConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px",
            width: "360px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", textAlign: "center"
          }}>
            <div style={{
              width: "56px", height: "56px", backgroundColor: "#fee2e2", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#dc2626"
            }}>
              <FiAlertCircle size={28} />
            </div>
            <h3 style={{ margin: "0 0 10px 0", color: "#111827", fontSize: "18px", fontWeight: 700 }}>Déconnexion</h3>
            <p style={{ margin: "0 0 24px 0", color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
              Voulez-vous vraiment quitter votre session d'administrateur ?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleConfirmLogout}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#4f46e5", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
