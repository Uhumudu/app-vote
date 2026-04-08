// src/pages/admin/adminelection/CandidaturesPubliquesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiCheckCircle, FiXCircle, FiClock, FiRefreshCw,
  FiArrowLeft, FiSearch, FiEye, FiAlignLeft,
  FiMail, FiPhone,
} from "react-icons/fi";
import api from "../../../services/api";
import AdminElectionSidebar from "../../../components/AdminElectionSidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  d ? new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

// ── Statuts alignés sur candidat_public.statut ───────────────────────────────
const STATUT_CONFIG = {
  EN_ATTENTE: {
    label: "En attente",
    icon: <FiClock size={12} />,
    bg: "#fef9c3", color: "#854d0e", border: "#fde047", dot: "#eab308",
  },
  APPROUVE: {
    label: "Approuvé",
    icon: <FiCheckCircle size={12} />,
    bg: "#dcfce7", color: "#15803d", border: "#bbf7d0", dot: "#22c55e",
  },
  REJETE: {
    label: "Rejeté",
    icon: <FiXCircle size={12} />,
    bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", dot: "#ef4444",
  },
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.EN_ATTENTE;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "4px 10px", borderRadius: "999px",
      fontSize: "11px", fontWeight: 700,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`, whiteSpace: "nowrap",
    }}>
      <span style={{
        width: "6px", height: "6px", borderRadius: "50%",
        background: cfg.dot, flexShrink: 0,
        animation: statut === "EN_ATTENTE" ? "pulse 1.5s infinite" : "none",
      }} />
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Drawer détail ─────────────────────────────────────────────────────────────
function DetailDrawer({ candidat, onClose, onAction, loading }) {
  const [confirmRejet, setConfirmRejet] = useState(false);

  useEffect(() => {
    if (!candidat) setConfirmRejet(false);
  }, [candidat]);

  if (!candidat) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(15,23,42,0.55)",
          backdropFilter: "blur(4px)", zIndex: 999,
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "460px", height: "100vh",
        background: "#fff",
        boxShadow: "-8px 0 48px rgba(0,0,0,0.18)",
        zIndex: 1000, display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>

        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #4338ca, #6366f1)",
          padding: "28px 24px 22px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", margin: "0 0 5px" }}>
                Candidature publique
              </p>
              <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-.2px" }}>
                {candidat.prenom} {candidat.nom}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px", color: "#fff", cursor: "pointer",
                padding: "6px 11px", fontSize: "18px", lineHeight: 1,
                transition: "background .15s",
              }}
            >×</button>
          </div>
          <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
            <StatutBadge statut={candidat.statut} />
            {candidat.nb_votes > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "4px 10px", borderRadius: "999px",
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                fontSize: "11px", fontWeight: 700, color: "#fff",
              }}>
                🗳️ {candidat.nb_votes} vote{candidat.nb_votes > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* ── Contenu ── */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>

          {/* Avatar + identité */}
          <div style={{
            display: "flex", alignItems: "center", gap: "16px",
            background: "#f8fafc", borderRadius: "14px",
            padding: "16px 18px", border: "1px solid #e2e8f0",
          }}>
            {candidat.photo_url ? (
              <img
                src={candidat.photo_url.startsWith("http")
                  ? candidat.photo_url
                  : `http://localhost:5000${candidat.photo_url}`}
                alt={candidat.nom}
                style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  objectFit: "cover", border: "2.5px solid #e0e7ff", flexShrink: 0,
                }}
              />
            ) : (
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #6366f1, #4338ca)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", fontWeight: 900, color: "#fff",
              }}>
                {(candidat.prenom?.[0] || "?").toUpperCase()}
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1e293b", letterSpacing: "-.2px" }}>
                {candidat.prenom} {candidat.nom}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#94a3b8" }}>
                Soumise le {formatDate(candidat.created_at)}
              </p>
            </div>
          </div>

          {/* Infos contact */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: "12px", overflow: "hidden",
          }}>
            {[
              { icon: <FiMail size={13} color="#6366f1" />,  label: "Email",     value: candidat.email     || "—" },
              { icon: <FiPhone size={13} color="#6366f1" />, label: "Téléphone", value: candidat.telephone || "—" },
            ].map(({ icon, label, value }, i) => (
              <div
                key={label}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 16px",
                  borderBottom: i === 0 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <div style={{
                  width: "30px", height: "30px", borderRadius: "8px",
                  background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>
                    {label}
                  </p>
                  <p style={{ margin: "1px 0 0", fontSize: "13px", color: "#1e293b", fontWeight: 600 }}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bio / Programme */}
          {candidat.bio ? (
            <div style={{
              background: "#eef2ff", borderRadius: "12px",
              padding: "16px", border: "1px solid #c7d2fe",
            }}>
              <p style={{
                fontSize: "11px", color: "#6366f1", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: ".5px",
                margin: "0 0 10px", display: "flex", alignItems: "center", gap: "6px",
              }}>
                <FiAlignLeft size={11} /> Programme / Présentation
              </p>
              <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.7, margin: 0 }}>
                {candidat.bio}
              </p>
            </div>
          ) : (
            <div style={{
              background: "#f8fafc", borderRadius: "12px", padding: "14px 16px",
              border: "1px dashed #e2e8f0", textAlign: "center",
            }}>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                Aucun programme renseigné
              </p>
            </div>
          )}

          {/* Zone confirmation rejet */}
          {confirmRejet && candidat.statut === "EN_ATTENTE" && (
            <div style={{
              background: "#fef2f2", border: "1.5px solid #fca5a5",
              borderRadius: "12px", padding: "16px",
            }}>
              <p style={{ fontSize: "12px", color: "#dc2626", fontWeight: 700, margin: "0 0 10px" }}>
                ⚠️ Confirmer le rejet de cette candidature ?
              </p>
              <p style={{ fontSize: "12px", color: "#7f1d1d", margin: "0 0 14px", lineHeight: 1.5 }}>
                Le candidat recevra un email l'informant que sa candidature n'a pas été retenue.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setConfirmRejet(false)}
                  style={{
                    flex: 1, padding: "9px", borderRadius: "9px",
                    border: "1.5px solid #e2e8f0", background: "#fff",
                    color: "#64748b", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => { onAction(candidat.id, "REJETE"); setConfirmRejet(false); }}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "9px", borderRadius: "9px",
                    border: "none",
                    background: loading ? "#94a3b8" : "linear-gradient(135deg,#dc2626,#ef4444)",
                    color: "#fff", fontSize: "13px", fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                  }}
                >
                  {loading ? "…" : "Confirmer le rejet"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Actions footer ── */}
        {candidat.statut === "EN_ATTENTE" && !confirmRejet && (
          <div style={{
            padding: "16px 24px", borderTop: "1px solid #f1f5f9",
            display: "flex", gap: "10px", flexShrink: 0,
          }}>
            <button
              onClick={() => setConfirmRejet(true)}
              disabled={loading}
              style={{
                flex: 1, padding: "12px", borderRadius: "10px",
                border: "1.5px solid #fca5a5", background: "#fff",
                color: "#dc2626", fontSize: "13px", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                transition: "all .18s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
            >
              <FiXCircle size={14} /> Rejeter
            </button>
            <button
              onClick={() => onAction(candidat.id, "APPROUVE")}
              disabled={loading}
              style={{
                flex: 1, padding: "12px", borderRadius: "10px",
                border: "none",
                background: loading
                  ? "#94a3b8"
                  : "linear-gradient(135deg,#15803d,#16a34a)",
                color: "#fff", fontSize: "13px", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                boxShadow: loading ? "none" : "0 4px 14px rgba(21,128,61,0.3)",
                transition: "all .18s",
              }}
            >
              <FiCheckCircle size={14} /> Approuver
            </button>
          </div>
        )}

        {/* Statut déjà traité */}
        {candidat.statut !== "EN_ATTENTE" && (
          <div style={{
            padding: "16px 24px", borderTop: "1px solid #f1f5f9",
            flexShrink: 0,
          }}>
            <div style={{
              padding: "12px 16px", borderRadius: "10px",
              background: candidat.statut === "APPROUVE" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${candidat.statut === "APPROUVE" ? "#bbf7d0" : "#fecaca"}`,
              textAlign: "center",
            }}>
              <p style={{
                margin: 0, fontSize: "13px", fontWeight: 700,
                color: candidat.statut === "APPROUVE" ? "#15803d" : "#dc2626",
              }}>
                {candidat.statut === "APPROUVE"
                  ? "✅ Cette candidature a été approuvée"
                  : "❌ Cette candidature a été rejetée"}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function CandidaturesPubliquesPage() {
  const { id: electionId } = useParams();
  const navigate            = useNavigate();

  const [candidats,     setCandidats]     = useState([]);
  const [election,      setElection]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [search,        setSearch]        = useState("");
  const [filtreStatut,  setFiltreStatut]  = useState("TOUS");

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [candRes, elecRes] = await Promise.all([
        api.get(`/public-elections/${electionId}/candidatures`),
        api.get(`/elections/${electionId}`),
      ]);
      setCandidats(candRes.data);
      setElection(elecRes.data);
    } catch (err) {
      console.error("Erreur:", err.response?.data || err.message);
      toast.error("Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const kpis = {
    total:     candidats.length,
    enAttente: candidats.filter(c => c.statut === "EN_ATTENTE").length,
    approuves: candidats.filter(c => c.statut === "APPROUVE").length,
    rejetes:   candidats.filter(c => c.statut === "REJETE").length,
  };

  // ── Filtrage ─────────────────────────────────────────────────────────────────
  const filtered = candidats.filter(c => {
    const matchStatut = filtreStatut === "TOUS" || c.statut === filtreStatut;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.nom?.toLowerCase().includes(q)    ||
      c.prenom?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q);
    return matchStatut && matchSearch;
  });

  // ── Action approuver / rejeter ────────────────────────────────────────────────
  // ✅ CORRECTION : on capture { data } pour accéder à emailEchec et motDePasse
  const handleAction = async (candidatId, action) => {
    setActionLoading(true);
    try {
      const { data } = await api.put(
        `/public-elections/${electionId}/candidatures/${candidatId}/review`,
        { action }
      );

      if (data.emailEchec) {
        // Email non envoyé → afficher le mot de passe à l'admin
        toast.warn(
          <div>
            <strong>✅ Candidature approuvée</strong>
            <p style={{ margin: "6px 0 0", fontSize: "12px", lineHeight: 1.5 }}>
              ⚠️ Email non envoyé (config mail manquante).<br />
              Mot de passe temporaire :{" "}
              <strong style={{
                background: "#fef9c3", padding: "1px 6px",
                borderRadius: "4px", fontFamily: "monospace",
              }}>
                {data.motDePasse}
              </strong>
              <br />
              Transmettez-le manuellement au candidat.
            </p>
          </div>,
          { autoClose: false }  // Ne pas fermer auto : l'admin doit le noter
        );
      } else {
        toast.success(
          action === "APPROUVE"
            ? "✅ Candidature approuvée ! Le candidat a été notifié par email."
            : "❌ Candidature rejetée. Le candidat a été notifié."
        );
      }

      setSelected(null);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'action.");
    } finally {
      setActionLoading(false);
    }
  };

  const TABS = ["TOUS", "EN_ATTENTE", "APPROUVE", "REJETE"];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#eef2ff,#e0e7ff 60%,#ede9fe20)" }}>
      <AdminElectionSidebar active="elections" />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>

        {/* ── En-tête ── */}
        <div style={{ marginBottom: "28px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "7px 14px", borderRadius: "9px",
              border: "1.5px solid #c7d2fe", background: "#fff",
              color: "#6366f1", fontSize: "12px", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", marginBottom: "14px",
              transition: "all .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#eef2ff"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            <FiArrowLeft size={12} /> Retour aux élections
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#1e1b4b", margin: 0, letterSpacing: "-.3px" }}>
                Validation des candidatures
              </h2>
              {election && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", flexWrap: "wrap" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6366f1", fontWeight: 600 }}>
                    🗳️ {election.titre}
                  </p>
                  <span style={{
                    padding: "2px 10px", borderRadius: "999px",
                    background: "#ecfdf5", border: "1px solid #bbf7d0",
                    fontSize: "11px", fontWeight: 700, color: "#15803d",
                  }}>
                    🌍 Élection publique
                  </span>
                  <span style={{
                    padding: "2px 10px", borderRadius: "999px",
                    background: "#eef2ff", border: "1px solid #c7d2fe",
                    fontSize: "11px", fontWeight: 700, color: "#4f46e5",
                  }}>
                    {election.statut}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={fetchData}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "9px 16px", borderRadius: "10px",
                border: "1.5px solid #c7d2fe", background: "#fff",
                color: "#6366f1", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <FiRefreshCw size={13} /> Actualiser
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total soumises", value: kpis.total,     gradient: "linear-gradient(135deg,#4338ca,#6366f1)",   emoji: "📋" },
            { label: "En attente",     value: kpis.enAttente, gradient: "linear-gradient(135deg,#d97706,#f59e0b)",   emoji: "⏳" },
            { label: "Approuvées",     value: kpis.approuves, gradient: "linear-gradient(135deg,#15803d,#16a34a)",   emoji: "✅" },
            { label: "Rejetées",       value: kpis.rejetes,   gradient: "linear-gradient(135deg,#b91c1c,#dc2626)",   emoji: "❌" },
          ].map(({ label, value, gradient, emoji }) => (
            <div key={label} style={{
              background: gradient, borderRadius: "16px",
              padding: "20px 22px", position: "relative", overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}>
              <div style={{
                position: "absolute", top: "-12px", right: "-12px",
                width: "64px", height: "64px", borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px",
              }}>
                {emoji}
              </div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: ".7px", margin: 0 }}>
                {label}
              </p>
              <p style={{ fontSize: "30px", fontWeight: 900, color: "#fff", margin: "6px 0 0", lineHeight: 1 }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Alerte candidatures en attente ── */}
        {kpis.enAttente > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "14px",
            background: "#fffbeb", border: "1.5px solid #fde047",
            borderRadius: "14px", padding: "14px 20px", marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(234,179,8,0.12)",
          }}>
            <span style={{ fontSize: "24px", flexShrink: 0 }}>⏳</span>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#854d0e", fontWeight: 700 }}>
                {kpis.enAttente} candidature{kpis.enAttente > 1 ? "s" : ""} en attente de votre décision
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#92400e" }}>
                Cliquez sur une ligne ou sur "Voir" pour approuver ou rejeter.
              </p>
            </div>
          </div>
        )}

        {kpis.enAttente === 0 && kpis.total > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "14px",
            background: "#f0fdf4", border: "1.5px solid #bbf7d0",
            borderRadius: "14px", padding: "14px 20px", marginBottom: "20px",
          }}>
            <span style={{ fontSize: "24px", flexShrink: 0 }}>🎉</span>
            <p style={{ margin: 0, fontSize: "13px", color: "#15803d", fontWeight: 700 }}>
              Toutes les candidatures ont été traitées.
            </p>
          </div>
        )}

        {/* ── Barre de filtres ── */}
        <div style={{
          background: "#fff", borderRadius: "14px",
          border: "1px solid #e0e7ff", padding: "14px 18px",
          marginBottom: "16px", display: "flex", gap: "12px",
          alignItems: "center", flexWrap: "wrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <FiSearch size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 34px",
                border: "1.5px solid #e2e8f0", borderRadius: "10px",
                fontSize: "13px", color: "#1e293b", background: "#f8fafc",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "3px", background: "#f1f5f9", borderRadius: "10px", padding: "3px" }}>
            {TABS.map(tab => {
              const cfg      = STATUT_CONFIG[tab];
              const isActive = filtreStatut === tab;
              const count    = tab === "TOUS"       ? kpis.total
                             : tab === "EN_ATTENTE" ? kpis.enAttente
                             : tab === "APPROUVE"   ? kpis.approuves
                             :                        kpis.rejetes;
              return (
                <button
                  key={tab}
                  onClick={() => setFiltreStatut(tab)}
                  style={{
                    padding: "6px 12px", borderRadius: "8px", border: "none",
                    fontSize: "12px", fontWeight: 700, cursor: "pointer",
                    transition: "all .18s",
                    background: isActive ? (cfg?.bg || "#fff") : "transparent",
                    color: isActive ? (cfg?.color || "#1e1b4b") : "#64748b",
                    boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                    fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "5px",
                  }}
                >
                  {tab === "TOUS" ? "Toutes" : cfg?.label}
                  <span style={{
                    background: isActive ? "rgba(0,0,0,0.1)" : "#e2e8f0",
                    color: isActive ? "inherit" : "#64748b",
                    borderRadius: "999px", padding: "1px 6px",
                    fontSize: "10px", fontWeight: 800,
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tableau ── */}
        <div style={{
          background: "#fff", borderRadius: "16px",
          border: "1px solid #e0e7ff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)", overflow: "hidden",
        }}>
          {/* Header colonnes */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 1.4fr 0.7fr 1fr 1fr 0.5fr",
            background: "linear-gradient(135deg, #4338ca, #6366f1)",
            padding: "12px 20px", gap: "8px",
          }}>
            {["Candidat", "Email", "Votes", "Soumise le", "Statut", ""].map((h, i) => (
              <p key={i} style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: ".6px" }}>
                {h}
              </p>
            ))}
          </div>

          {/* Corps */}
          {loading ? (
            <div style={{ padding: "64px", textAlign: "center" }}>
              <div style={{
                width: "38px", height: "38px",
                border: "3px solid #e0e7ff", borderTop: "3px solid #4f46e5",
                borderRadius: "50%", margin: "0 auto 14px",
                animation: "spin 1s linear infinite",
              }} />
              <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>Chargement des candidatures…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "64px", textAlign: "center" }}>
              <p style={{ fontSize: "40px", margin: "0 0 14px" }}>🙋</p>
              <p style={{ color: "#64748b", fontWeight: 700, fontSize: "14px", margin: 0 }}>
                {search || filtreStatut !== "TOUS"
                  ? "Aucun résultat pour ces critères"
                  : "Aucune candidature reçue pour le moment"}
              </p>
              <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>
                {!search && filtreStatut === "TOUS" && "Les candidatures soumises via la page publique apparaîtront ici."}
              </p>
            </div>
          ) : (
            filtered.map((c, idx) => (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 1.4fr 0.7fr 1fr 1fr 0.5fr",
                  padding: "13px 20px", gap: "8px", alignItems: "center",
                  background: idx % 2 === 0 ? "#fff" : "#fafbff",
                  borderBottom: "1px solid #f1f5f9",
                  cursor: "pointer", transition: "background .15s",
                  borderLeft: c.statut === "EN_ATTENTE" ? "3px solid #fde047" : "3px solid transparent",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#eef2ff"}
                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafbff"}
              >
                {/* Candidat */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {c.photo_url ? (
                    <img
                      src={c.photo_url.startsWith("http") ? c.photo_url : `http://localhost:5000${c.photo_url}`}
                      alt={c.nom}
                      style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1.5px solid #e0e7ff" }}
                    />
                  ) : (
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #6366f1, #4338ca)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 800, color: "#fff",
                    }}>
                      {(c.prenom?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.prenom} {c.nom}
                    </p>
                    {c.telephone && (
                      <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>{c.telephone}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <p style={{ margin: 0, fontSize: "12px", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.email || "—"}
                </p>

                {/* Votes */}
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: c.nb_votes > 0 ? "#6366f1" : "#cbd5e1" }}>
                  {c.nb_votes > 0 ? `🗳️ ${c.nb_votes}` : "—"}
                </p>

                {/* Date */}
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                  {formatDate(c.created_at)}
                </p>

                {/* Statut */}
                <div><StatutBadge statut={c.statut} /></div>

                {/* Bouton voir */}
                <button
                  onClick={e => { e.stopPropagation(); setSelected(c); }}
                  style={{
                    padding: "5px 10px", borderRadius: "8px",
                    border: "1px solid #e0e7ff", background: "#eef2ff",
                    color: "#6366f1", fontSize: "11px", fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "4px",
                  }}
                >
                  <FiEye size={11} /> Voir
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Drawer */}
      <DetailDrawer
        candidat={selected}
        onClose={() => setSelected(null)}
        onAction={handleAction}
        loading={actionLoading}
      />

      <ToastContainer position="top-right" autoClose={4000} />

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}

