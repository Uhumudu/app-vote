// src/pages/public/DashboardCandidatPublicPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAward, FiCheckCircle, FiLogOut, FiCalendar,
  FiUser, FiMail, FiPhone, FiClock, FiShield,
  FiChevronRight, FiLock, FiHome,
} from "react-icons/fi";
import api from "../../services/api";

// ✅ API_BASE pour construire les URLs de photos
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fmtLong  = d => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtShort = d => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const MEDALS = ["🥇", "🥈", "🥉"];
const getMedal = i => MEDALS[i] ?? `#${i + 1}`;

// ✅ Couleur de fond bleue exacte extraite de l'image fournie
const BG_BLUE = "#d6e8f7";

/**
 * ✅ FIX PHOTOS : buildPhotoUrl robuste
 * Gère les chemins relatifs (/uploads/...) et absolus (http/https)
 */
function buildPhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const path = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
  return `${base}${path}`;
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
/**
 * ✅ FIX PHOTOS : composant Avatar avec chargement réel de l'image.
 * Fallback sur initiales colorées si pas de photo ou erreur de chargement.
 */
function Avatar({ photoUrl, prenom, nom, size = 48, radius }) {
  const [imgError, setImgError] = useState(false);
  const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
  const url = buildPhotoUrl(photoUrl);
  const br = radius !== undefined ? radius : size > 56 ? 18 : "50%";

  // Reset de l'erreur si l'URL change
  useEffect(() => { setImgError(false); }, [url]);

  if (url && !imgError) {
    return (
      <div style={{
        width: size, height: size, borderRadius: br,
        overflow: "hidden", flexShrink: 0,
        background: "#dbeafe",
        boxShadow: size > 40 ? "0 4px 16px rgba(59,130,246,0.20)" : "none",
        border: "2px solid rgba(59,130,246,0.18)",
      }}>
        <img
          src={url}
          alt={`${prenom ?? ""} ${nom ?? ""}`}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: br, flexShrink: 0,
      background: "linear-gradient(135deg,#3b82f6,#6366f1)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 900, color: "white",
      boxShadow: size > 40 ? "0 4px 16px rgba(59,130,246,0.25)" : "none",
      border: "2px solid rgba(59,130,246,0.15)",
      letterSpacing: -1,
    }}>
      {initials}
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
function PublicNavbar({ prenom, nom, photoUrl, onLogout }) {
  return (
    <header style={NAV.root}>
      <div style={NAV.inner}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={NAV.logo}>🗳 <strong>eVote</strong></a>
          <span style={NAV.badge}>Espace candidat</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* ✅ Photo dans la navbar */}
            <Avatar photoUrl={photoUrl} prenom={prenom} nom={nom} size={38} radius="50%" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 }}>{prenom} {nom}</p>
              <p style={{ fontSize: 11, color: "#3b82f6", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                <FiShield size={10} /> Candidat approuvé
              </p>
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: "#bfdbfe" }} />
          <button onClick={onLogout} style={NAV.logout}>
            <FiLogOut size={13} /> Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
function KpiCard({ value, label, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: .45 }}
      style={CARD.kpi}
    >
      <p style={{ fontSize: 28, fontWeight: 900, color, margin: "0 0 4px" }}>{value}</p>
      <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: .6, margin: 0 }}>{label}</p>
    </motion.div>
  );
}

/* ─── Tabs ───────────────────────────────────────────────────────────────── */
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "#dbeafe", padding: 4, borderRadius: 14 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 16px", borderRadius: 10, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif", transition: "all .15s",
            background: active === t.id ? "#4f46e5" : "transparent",
            color: active === t.id ? "white" : "#3b82f6",
            boxShadow: active === t.id ? "0 4px 12px rgba(79,70,229,0.25)" : "none",
          }}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function DashboardCandidatPublicPage() {
  const navigate = useNavigate();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState("classement");

  const utilisateurId = localStorage.getItem("id");
  const prenom        = localStorage.getItem("prenom") || "";
  const nom           = localStorage.getItem("nom")    || "";

  useEffect(() => {
    if (!utilisateurId) { navigate("/login"); return; }
    api
      .get(`/public-elections/dashboard/candidat-public/${utilisateurId}`)
      .then(r => setData(r.data))
      .catch(err => {
        const msg = err.response?.data?.message || "Impossible de charger vos données.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [utilisateurId, navigate]);

  const handleLogout = () => {
    ["token", "id", "role", "nom", "prenom", "email", "candidat_id"].forEach(k => localStorage.removeItem(k));
    navigate("/login");
  };

  if (loading) return (
    <div style={{ ...FULL_CENTER, background: BG_BLUE }}>
      <div style={SPINNER} />
      <p style={{ color: "#3b82f6", fontSize: 13, fontWeight: 600 }}>Chargement de votre espace…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ ...FULL_CENTER, background: BG_BLUE }}>
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #fecaca", padding: "40px 32px", textAlign: "center", maxWidth: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
        <span style={{ fontSize: 40, display: "block", marginBottom: 16 }}>😕</span>
        <p style={{ color: "#dc2626", fontWeight: 700, marginBottom: 20, fontSize: 15 }}>{error}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => window.location.reload()} style={BTN.secondary}>Réessayer</button>
          <button onClick={() => navigate("/")} style={BTN.primary}><FiHome size={13} /> Accueil</button>
        </div>
      </div>
    </div>
  );

  const maxVotes = data?.classement?.[0]?.nb_votes ?? 0;
  const myRank   = data ? data.classement.findIndex(c => c.id === data.candidat.id) + 1 : 0;
  const myVotes  = data?.votes?.reduce((s, v) => s + (Number(v.nb_voix) || 1), 0) ?? 0;
  const total    = data?.classement?.reduce((s, c) => s + Number(c.nb_votes), 0) ?? 0;
  const myPct    = total > 0 ? Math.round(myVotes / total * 100) : 0;

  const tabs = [
    { id: "classement", label: "Classement",          icon: "🏆" },
    { id: "votes",      label: `Votes (${myVotes})`,  icon: <FiCheckCircle size={13} /> },
    { id: "profil",     label: "Mon profil",           icon: <FiUser size={13} /> },
  ];

  return (
    <>
      <style>{BASE_STYLES}</style>
      {/* ✅ Fond bleu clair comme l'image fournie */}
      <div style={{ ...PAGE.root, background: BG_BLUE }}>

        <PublicNavbar
          prenom={prenom} nom={nom}
          photoUrl={data?.candidat?.photo_url}
          onLogout={handleLogout}
        />

        <main style={PAGE.main}>

          {/* Salutation */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, marginBottom: 4 }}>Bienvenue dans votre espace</p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1e1b4b", letterSpacing: -0.5, marginBottom: 8 }}>
              Bonjour, {prenom} 👋
            </h1>
            {data && (
              <p style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 8 }}>
                <FiCalendar size={13} />
                {data.candidat.election_titre}
                <span style={{ color: "#93c5fd" }}>·</span>
                {fmtShort(data.candidat.date_debut)} → {fmtShort(data.candidat.date_fin)}
              </p>
            )}
          </motion.div>

          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
            <KpiCard value={myVotes}                           label="Votes reçus"    color="#059669" delay={.05} />
            <KpiCard value={`${myPct}%`}                      label="Part des votes" color="#4338ca" delay={.10} />
            <KpiCard value={data?.classement?.length ?? 0}    label="Candidats"      color="#d97706" delay={.15} />
            <KpiCard value={myRank > 0 ? `#${myRank}` : "—"} label="Mon rang"       color={myRank === 1 ? "#d97706" : "#9ca3af"} delay={.20} />
          </div>

          {/* Contenu principal */}
          <div style={CARD.main}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #eff6ff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: .8 }}>Mon espace candidat</span>
              <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: .2 }}
              >

                {/* ── CLASSEMENT ── */}
                {activeTab === "classement" && (
                  <div style={{ padding: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        🏆 Classement en temps réel
                      </span>
                      <span style={{ fontSize: 11, background: "#dbeafe", border: "1px solid #bfdbfe", color: "#1d4ed8", padding: "4px 12px", borderRadius: 999, fontWeight: 700 }}>
                        {data?.classement?.length} candidats
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {data?.classement?.map((c, idx) => {
                        const pct  = Number(maxVotes) > 0 ? Math.round(Number(c.nb_votes) / Number(maxVotes) * 100) : 0;
                        const isMe = c.id === data.candidat.id;
                        return (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * .04 }}
                            style={{
                              display: "flex", alignItems: "center", gap: 14,
                              padding: "14px 16px", borderRadius: 16, transition: "all .15s",
                              background: isMe ? "#eff6ff" : "white",
                              border: isMe ? "2px solid #93c5fd" : "1px solid #e0efff",
                              boxShadow: isMe ? "0 2px 12px rgba(59,130,246,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
                            }}
                          >
                            {/* Médaille / rang */}
                            <div style={{
                              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                              background: idx === 0 ? "#fef3c7" : idx === 1 ? "#f1f5f9" : idx === 2 ? "#fee2e2" : "#f0f9ff",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: idx < 3 ? 20 : 13, fontWeight: 800,
                              color: idx === 0 ? "#d97706" : idx === 1 ? "#64748b" : idx === 2 ? "#e11d48" : "#94a3b8",
                            }}>
                              {getMedal(idx)}
                            </div>

                            {/* ✅ FIX PHOTOS : Avatar avec photo_url venant du backend */}
                            <Avatar
                              photoUrl={c.photo_url}
                              prenom={c.prenom}
                              nom={c.nom}
                              size={42}
                              radius="50%"
                            />

                            {/* Infos */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{
                                  fontWeight: 800, fontSize: 14,
                                  color: isMe ? "#1d4ed8" : "#1e293b",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>
                                  {c.prenom} {c.nom}
                                </span>
                                {isMe && (
                                  <span style={{ fontSize: 10, background: "#3b82f6", color: "white", padding: "2px 8px", borderRadius: 999, fontWeight: 700, flexShrink: 0 }}>
                                    ← vous
                                  </span>
                                )}
                              </div>
                              <div style={{ height: 6, background: "#dbeafe", borderRadius: 999, overflow: "hidden" }}>
                                <motion.div
                                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                  transition={{ duration: .9, ease: "easeOut", delay: idx * .04 + .1 }}
                                  style={{
                                    height: "100%", borderRadius: 999,
                                    background: isMe
                                      ? "linear-gradient(90deg,#3b82f6,#6366f1)"
                                      : "linear-gradient(90deg,#93c5fd,#bfdbfe)",
                                  }}
                                />
                              </div>
                            </div>

                            {/* Votes */}
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <p style={{ fontSize: 20, fontWeight: 900, color: isMe ? "#1d4ed8" : "#374151", margin: 0 }}>{c.nb_votes}</p>
                              <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, margin: 0 }}>votes</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── VOTES ── */}
                {activeTab === "votes" && (
                  <div style={{ padding: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14 }}>✅ Votes reçus</span>
                      <span style={{ fontSize: 11, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "4px 12px", borderRadius: 999, fontWeight: 700 }}>
                        {myVotes} vote{myVotes > 1 ? "s" : ""}
                      </span>
                    </div>

                    {data?.votes?.length === 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 24px", textAlign: "center" }}>
                        <div style={{ width: 64, height: 64, background: "#dbeafe", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                          <FiAward size={28} color="#93c5fd" />
                        </div>
                        <p style={{ fontWeight: 700, color: "#374151", marginBottom: 6 }}>Aucun vote reçu pour l'instant</p>
                        <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 280, lineHeight: 1.6 }}>Partagez votre profil pour recevoir vos premiers votes !</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {data?.votes?.map((v, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "12px 16px", borderRadius: 12,
                              background: i % 2 === 0 ? "#f0f9ff" : "white",
                              border: "1px solid #e0efff",
                            }}
                          >
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                                {v.nom_electeur || "Électeur anonyme"}
                              </span>
                              {v.nb_voix > 1 && (
                                <span style={{ marginLeft: 8, fontSize: 11, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>
                                  {v.nb_voix} voix
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 12 }}>
                              <FiClock size={11} />
                              {fmtLong(v.created_at)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── PROFIL ── */}
                {activeTab === "profil" && data && (
                  <div style={{ padding: 24 }}>
                    <p style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                      <FiUser size={16} color="#3b82f6" /> Mon profil candidat
                    </p>

                    {/* Avatar + statut */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 20, padding: "20px",
                      background: "#dbeafe", borderRadius: 18, border: "1px solid #bfdbfe", marginBottom: 20,
                    }}>
                      {/* ✅ FIX PHOTOS : vraie photo dans le profil */}
                      <Avatar
                        photoUrl={data.candidat.photo_url}
                        prenom={data.candidat.prenom}
                        nom={data.candidat.nom}
                        size={72}
                        radius={18}
                      />
                      <div>
                        <p style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", margin: "0 0 6px" }}>
                          {data.candidat.prenom} {data.candidat.nom}
                        </p>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "4px 10px", borderRadius: 999, fontWeight: 700 }}>
                          <FiCheckCircle size={11} /> Candidature approuvée
                        </span>
                      </div>
                    </div>

                    {/* Infos */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
                      {[
                        { icon: <FiMail size={14} />,    label: "Email",       val: data.candidat.email     || "—" },
                        { icon: <FiPhone size={14} />,   label: "Téléphone",   val: data.candidat.telephone || "—" },
                        { icon: <FiCalendar size={14}/>, label: "Candidature", val: fmtShort(data.candidat.created_at) },
                      ].map((row, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12,
                          background: i % 2 === 0 ? "#f0f9ff" : "white",
                          border: "1px solid #e0efff",
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", flexShrink: 0 }}>
                            {row.icon}
                          </div>
                          <div>
                            <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: .6, margin: "0 0 2px" }}>{row.label}</p>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>{row.val}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bio */}
                    {data.candidat.bio && (
                      <div style={{ background: "#f8fafc", border: "1px solid #e0efff", borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
                        <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: .6, margin: "0 0 8px" }}>Bio / Programme</p>
                        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0 }}>{data.candidat.bio}</p>
                      </div>
                    )}

                    {/* Élection associée */}
                    <div style={{ borderRadius: 18, border: "2px solid #bfdbfe", background: "linear-gradient(135deg,#dbeafe,#eff6ff)", padding: "18px 20px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: .8, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                        <FiCalendar size={11} /> Élection associée
                      </p>
                      <p style={{ fontWeight: 900, color: "#1e1b4b", fontSize: 15, margin: "0 0 6px" }}>{data.candidat.election_titre}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 12px" }}>
                        {fmtShort(data.candidat.date_debut)} → {fmtShort(data.candidat.date_fin)}
                      </p>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999,
                        background: data.candidat.election_statut === "EN_COURS"  ? "#dbeafe"
                                  : data.candidat.election_statut === "TERMINEE"  ? "#f1f5f9" : "#fffbeb",
                        color:      data.candidat.election_statut === "EN_COURS"  ? "#1d4ed8"
                                  : data.candidat.election_statut === "TERMINEE"  ? "#64748b" : "#d97706",
                        border: `1px solid ${
                          data.candidat.election_statut === "EN_COURS"  ? "#bfdbfe"
                        : data.candidat.election_statut === "TERMINEE"  ? "#e2e8f0" : "#fde68a"}`,
                      }}>
                        {data.candidat.election_statut === "EN_COURS"  && <><FiClock size={11} /> En cours</>}
                        {data.candidat.election_statut === "TERMINEE"  && <><FiLock size={11} /> Terminée</>}
                        {data.candidat.election_statut === "APPROUVEE" && <><FiCheckCircle size={11} /> Approuvée</>}
                        {!["EN_COURS","TERMINEE","APPROUVEE"].includes(data.candidat.election_statut) && data.candidat.election_statut}
                      </span>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Lien vers page publique */}
          {data && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .4 }}
              style={{ marginTop: 16, textAlign: "center" }}>
              <a href={`/voter/${data.candidat.election_id}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>
                <FiChevronRight size={14} /> Voir la page publique de l'élection
              </a>
            </motion.div>
          )}

        </main>
      </div>
    </>
  );
}

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const NAV = {
  root:   { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(59,130,246,0.15)", boxShadow: "0 1px 16px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 10 },
  inner:  { maxWidth: 1100, margin: "0 auto", padding: "0 28px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo:   { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 19, fontWeight: 900, color: "#4f46e5", letterSpacing: -0.5 },
  badge:  { fontSize: 10, background: "#dbeafe", color: "#1d4ed8", padding: "4px 10px", borderRadius: 999, fontWeight: 700, textTransform: "uppercase", letterSpacing: .6 },
  logout: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, color: "#ef4444", background: "transparent", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontFamily: "'Outfit',sans-serif", transition: "all .15s" },
};
const PAGE = {
  root: { minHeight: "100vh", fontFamily: "'Outfit',sans-serif" },
  main: { maxWidth: 1100, margin: "0 auto", padding: "40px 28px 80px" },
};
const CARD = {
  kpi:  { background: "white", borderRadius: 18, border: "1px solid #bfdbfe", padding: "20px", textAlign: "center", boxShadow: "0 2px 8px rgba(59,130,246,0.08)", transition: "all .2s" },
  main: { background: "white", borderRadius: 22, border: "1px solid #bfdbfe", boxShadow: "0 4px 24px rgba(59,130,246,0.10)", overflow: "hidden" },
};
const BTN = {
  primary:   { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 12px rgba(59,130,246,0.25)" },
  secondary: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", border: "1.5px solid #bfdbfe", background: "white", color: "#6b7280", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" },
};
const FULL_CENTER = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif" };
const SPINNER = { width: 40, height: 40, border: "4px solid #bfdbfe", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" };
const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @media(max-width:768px){
    .kpi-grid{grid-template-columns:repeat(2,1fr)!important;}
  }
  @media(max-width:500px){
    .kpi-grid{grid-template-columns:1fr 1fr!important;}
  }
`;


























// // src/pages/public/DashboardCandidatPublicPage.jsx
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiAward, FiCheckCircle, FiLogOut, FiCalendar,
//   FiUser, FiMail, FiPhone, FiClock, FiShield,
//   FiChevronRight, FiLock, FiHome,
// } from "react-icons/fi";
// import api from "../../services/api";

// // ✅ FIX : API_BASE défini ici aussi (manquait dans le fichier original)
// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// const fmtLong  = d => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
// const fmtShort = d => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
// const MEDALS = ["🥇", "🥈", "🥉"];
// const getMedal = i => MEDALS[i] ?? `#${i + 1}`;

// /**
//  * ✅ FIX : même helper que dans les autres pages publiques
//  */
// function buildPhotoUrl(photoUrl) {
//   if (!photoUrl) return null;
//   if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
//   const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
//   const path = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
//   return `${base}${path}`;
// }

// /* ─── Avatar ─────────────────────────────────────────────────────────────── */
// // ✅ FIX : composant Avatar ajouté pour afficher les photos dans le dashboard
// function Avatar({ photoUrl, prenom, nom, size = 48 }) {
//   const [imgError, setImgError] = useState(false);
//   const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
//   const url = buildPhotoUrl(photoUrl);

//   if (url && !imgError) {
//     return (
//       <div style={{ width: size, height: size, borderRadius: size > 56 ? 18 : "50%", overflow: "hidden", flexShrink: 0, background: "#eef2ff", boxShadow: "0 8px 24px rgba(99,102,241,0.25)" }}>
//         <img
//           src={url}
//           alt={`${prenom} ${nom}`}
//           style={{ width: "100%", height: "100%", objectFit: "cover" }}
//           onError={() => setImgError(true)}
//         />
//       </div>
//     );
//   }
//   return (
//     <div style={{ width: size, height: size, borderRadius: size > 56 ? 18 : "50%", flexShrink: 0, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 900, color: "white", boxShadow: "0 8px 24px rgba(99,102,241,0.25)" }}>
//       {initials}
//     </div>
//   );
// }

// /* ─── Navbar commune ─────────────────────────────────────────────────────── */
// function PublicNavbar({ prenom, nom, photoUrl, onLogout }) {
//   const initiales = `${prenom?.charAt(0) ?? ""}${nom?.charAt(0) ?? ""}`.toUpperCase();
//   return (
//     <header style={NAV.root}>
//       <div style={NAV.inner}>
//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <a href="/" style={NAV.logo}>🗳 <strong>eVote</strong></a>
//           <span style={NAV.badge}>Espace candidat</span>
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             {/* ✅ FIX : affichage de la photo dans la navbar */}
//             <Avatar photoUrl={photoUrl} prenom={prenom} nom={nom} size={36} />
//             <div>
//               <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 }}>{prenom} {nom}</p>
//               <p style={{ fontSize: 11, color: "#818cf8", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
//                 <FiShield size={10} /> Candidat approuvé
//               </p>
//             </div>
//           </div>
//           <div style={{ width: 1, height: 28, background: "#e0e7ff" }} />
//           <button onClick={onLogout} style={NAV.logout}>
//             <FiLogOut size={13} /> Déconnexion
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// }

// /* ─── KPI Card ───────────────────────────────────────────────────────────── */
// function KpiCard({ value, label, color, delay }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: .45 }}
//       style={CARD.kpi}
//     >
//       <p style={{ fontSize: 28, fontWeight: 900, color, margin: "0 0 4px" }}>{value}</p>
//       <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: .6, margin: 0 }}>{label}</p>
//     </motion.div>
//   );
// }

// /* ─── Tabs ───────────────────────────────────────────────────────────────── */
// function Tabs({ tabs, active, onChange }) {
//   return (
//     <div style={{ display: "flex", gap: 4, background: "#eef2ff", padding: 4, borderRadius: 14 }}>
//       {tabs.map(t => (
//         <button key={t.id} onClick={() => onChange(t.id)}
//           style={{
//             display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none", cursor: "pointer",
//             fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif", transition: "all .15s",
//             background: active === t.id ? "#4f46e5" : "transparent",
//             color: active === t.id ? "white" : "#818cf8",
//             boxShadow: active === t.id ? "0 4px 12px rgba(79,70,229,0.25)" : "none",
//           }}>
//           {t.icon} {t.label}
//         </button>
//       ))}
//     </div>
//   );
// }

// /* ─── Page principale ────────────────────────────────────────────────────── */
// export default function DashboardCandidatPublicPage() {
//   const navigate = useNavigate();
//   const [data,      setData]      = useState(null);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState("");
//   const [activeTab, setActiveTab] = useState("classement");

//   const utilisateurId = localStorage.getItem("id");
//   const prenom        = localStorage.getItem("prenom") || "";
//   const nom           = localStorage.getItem("nom")    || "";

//   useEffect(() => {
//     if (!utilisateurId) { navigate("/login"); return; }
//     api
//       .get(`/public-elections/dashboard/candidat-public/${utilisateurId}`)
//       .then(r => setData(r.data))
//       .catch(err => {
//         const msg = err.response?.data?.message || "Impossible de charger vos données.";
//         setError(msg);
//       })
//       .finally(() => setLoading(false));
//   }, [utilisateurId, navigate]);

//   const handleLogout = () => {
//     ["token", "id", "role", "nom", "prenom", "email", "candidat_id"].forEach(k => localStorage.removeItem(k));
//     navigate("/login");
//   };

//   /* ── Loading ── */
//   if (loading) return (
//     <div style={FULL_CENTER}>
//       <div style={SPINNER} />
//       <p style={{ color: "#818cf8", fontSize: 13, fontWeight: 600 }}>Chargement de votre espace…</p>
//       <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
//     </div>
//   );

//   /* ── Erreur ── */
//   if (error) return (
//     <div style={FULL_CENTER}>
//       <div style={{ background: "white", borderRadius: 20, border: "1px solid #fecaca", padding: "40px 32px", textAlign: "center", maxWidth: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
//         <span style={{ fontSize: 40, display: "block", marginBottom: 16 }}>😕</span>
//         <p style={{ color: "#dc2626", fontWeight: 700, marginBottom: 20, fontSize: 15 }}>{error}</p>
//         <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
//           <button onClick={() => window.location.reload()} style={BTN.secondary}>Réessayer</button>
//           <button onClick={() => navigate("/")} style={BTN.primary}><FiHome size={13} /> Accueil</button>
//         </div>
//       </div>
//     </div>
//   );

//   /* ── Données ── */
//   const maxVotes = data?.classement?.[0]?.nb_votes ?? 0;
//   const myRank   = data ? data.classement.findIndex(c => c.id === data.candidat.id) + 1 : 0;
//   const myVotes  = data?.votes?.reduce((s, v) => s + (Number(v.nb_voix) || 1), 0) ?? 0;
//   const total    = data?.classement?.reduce((s, c) => s + Number(c.nb_votes), 0) ?? 0;
//   const myPct    = total > 0 ? Math.round(myVotes / total * 100) : 0;

//   const tabs = [
//     { id: "classement", label: "Classement",          icon: "🏆" },
//     { id: "votes",      label: `Votes (${myVotes})`,  icon: <FiCheckCircle size={13} /> },
//     { id: "profil",     label: "Mon profil",           icon: <FiUser size={13} /> },
//   ];

//   return (
//     <>
//       <style>{BASE_STYLES}</style>
//       <div style={PAGE.root}>
//         {/* ✅ FIX : on passe photo_url du candidat à la navbar */}
//         <PublicNavbar
//           prenom={prenom} nom={nom}
//           photoUrl={data?.candidat?.photo_url}
//           onLogout={handleLogout}
//         />

//         <main style={PAGE.main}>

//           {/* Salutation */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} style={{ marginBottom: 32 }}>
//             <p style={{ fontSize: 13, color: "#818cf8", fontWeight: 600, marginBottom: 4 }}>Bienvenue dans votre espace</p>
//             <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1e1b4b", letterSpacing: -0.5, marginBottom: 8 }}>
//               Bonjour, {prenom} 👋
//             </h1>
//             {data && (
//               <p style={{ fontSize: 13, color: "#818cf8", display: "flex", alignItems: "center", gap: 8 }}>
//                 <FiCalendar size={13} />
//                 {data.candidat.election_titre}
//                 <span style={{ color: "#c7d2fe" }}>·</span>
//                 {fmtShort(data.candidat.date_debut)} → {fmtShort(data.candidat.date_fin)}
//               </p>
//             )}
//           </motion.div>

//           {/* KPI cards */}
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
//             <KpiCard value={myVotes}                          label="Votes reçus"    color="#059669" delay={.05} />
//             <KpiCard value={`${myPct}%`}                     label="Part des votes" color="#4338ca" delay={.10} />
//             <KpiCard value={data?.classement?.length ?? 0}   label="Candidats"      color="#d97706" delay={.15} />
//             <KpiCard value={myRank > 0 ? `#${myRank}` : "—"} label="Mon rang"      color={myRank === 1 ? "#d97706" : "#9ca3af"} delay={.20} />
//           </div>

//           {/* Contenu principal */}
//           <div style={CARD.main}>
//             <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f5ff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
//               <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: .8 }}>Mon espace candidat</span>
//               <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
//             </div>

//             <AnimatePresence mode="wait">
//               <motion.div
//                 key={activeTab}
//                 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
//                 transition={{ duration: .2 }}
//               >

//                 {/* ── CLASSEMENT ── */}
//                 {activeTab === "classement" && (
//                   <div style={{ padding: 24 }}>
//                     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
//                       <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
//                         🏆 Classement en temps réel
//                       </span>
//                       <span style={{ fontSize: 11, background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5", padding: "4px 12px", borderRadius: 999, fontWeight: 700 }}>
//                         {data?.classement?.length} candidats
//                       </span>
//                     </div>
//                     <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
//                       {data?.classement?.map((c, idx) => {
//                         const pct  = maxVotes > 0 ? Math.round(Number(c.nb_votes) / Number(maxVotes) * 100) : 0;
//                         const isMe = c.id === data.candidat.id;
//                         return (
//                           <motion.div
//                             key={c.id}
//                             initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * .04 }}
//                             style={{
//                               display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, marginBottom: 4, transition: "all .15s",
//                               background: isMe ? "#eef2ff" : "#fafafa",
//                               border: isMe ? "2px solid #c7d2fe" : "1px solid #f0f0f0",
//                               boxShadow: isMe ? "0 2px 8px rgba(99,102,241,0.12)" : "none",
//                             }}
//                           >
//                             {/* Position */}
//                             <div style={{
//                               width: 36, height: 36, borderRadius: 10, flexShrink: 0,
//                               background: idx === 0 ? "#fef3c7" : idx === 1 ? "#f1f5f9" : idx === 2 ? "#fee2e2" : "#f8fafc",
//                               display: "flex", alignItems: "center", justifyContent: "center",
//                               fontSize: idx < 3 ? 18 : 13, fontWeight: 800,
//                               color: idx === 0 ? "#d97706" : idx === 1 ? "#64748b" : idx === 2 ? "#e11d48" : "#94a3b8",
//                             }}>
//                               {getMedal(idx)}
//                             </div>

//                             {/* ✅ FIX : photo du candidat dans le classement */}
//                             <Avatar photoUrl={c.photo_url} prenom={c.prenom} nom={c.nom} size={36} />

//                             {/* Infos */}
//                             <div style={{ flex: 1, minWidth: 0 }}>
//                               <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
//                                 <span style={{ fontWeight: 800, fontSize: 14, color: isMe ? "#3730a3" : "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                                   {c.prenom} {c.nom}
//                                 </span>
//                                 {isMe && (
//                                   <span style={{ fontSize: 10, background: "#4f46e5", color: "white", padding: "2px 8px", borderRadius: 999, fontWeight: 700, flexShrink: 0 }}>← vous</span>
//                                 )}
//                               </div>
//                               <div style={{ height: 6, background: "#e0e7ff", borderRadius: 999, overflow: "hidden" }}>
//                                 <motion.div
//                                   initial={{ width: 0 }} animate={{ width: `${pct}%` }}
//                                   transition={{ duration: .9, ease: "easeOut", delay: idx * .04 + .1 }}
//                                   style={{ height: "100%", borderRadius: 999, background: isMe ? "#4f46e5" : "#c7d2fe" }}
//                                 />
//                               </div>
//                             </div>
//                             {/* Votes */}
//                             <div style={{ textAlign: "right", flexShrink: 0 }}>
//                               <p style={{ fontSize: 18, fontWeight: 900, color: isMe ? "#3730a3" : "#374151", margin: 0 }}>{c.nb_votes}</p>
//                               <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, margin: 0 }}>votes</p>
//                             </div>
//                           </motion.div>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}

//                 {/* ── VOTES ── */}
//                 {activeTab === "votes" && (
//                   <div style={{ padding: 24 }}>
//                     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
//                       <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14 }}>✅ Votes reçus</span>
//                       <span style={{ fontSize: 11, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "4px 12px", borderRadius: 999, fontWeight: 700 }}>
//                         {myVotes} vote{myVotes > 1 ? "s" : ""}
//                       </span>
//                     </div>

//                     {data?.votes?.length === 0 ? (
//                       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 24px", textAlign: "center" }}>
//                         <div style={{ width: 64, height: 64, background: "#eef2ff", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
//                           <FiAward size={28} color="#c7d2fe" />
//                         </div>
//                         <p style={{ fontWeight: 700, color: "#374151", marginBottom: 6 }}>Aucun vote reçu pour l'instant</p>
//                         <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 280, lineHeight: 1.6 }}>Partagez votre profil pour recevoir vos premiers votes !</p>
//                       </div>
//                     ) : (
//                       <div style={{ display: "flex", flexDirection: "column" }}>
//                         {data?.votes?.map((v, i) => (
//                           <motion.div
//                             key={i}
//                             initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}
//                             style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 4, background: i % 2 === 0 ? "#fafbff" : "white", border: "1px solid #f0f5ff" }}
//                           >
//                             <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
//                             <div style={{ flex: 1 }}>
//                               <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
//                                 {v.nom_electeur || "Électeur anonyme"}
//                               </span>
//                               {v.nb_voix > 1 && (
//                                 <span style={{ marginLeft: 8, fontSize: 11, background: "#eef2ff", color: "#4f46e5", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>
//                                   {v.nb_voix} voix
//                                 </span>
//                               )}
//                             </div>
//                             <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 12 }}>
//                               <FiClock size={11} />
//                               {fmtLong(v.created_at)}
//                             </div>
//                           </motion.div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* ── PROFIL ── */}
//                 {activeTab === "profil" && data && (
//                   <div style={{ padding: 24 }}>
//                     <p style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
//                       <FiUser size={16} color="#6366f1" /> Mon profil candidat
//                     </p>

//                     {/* Avatar + statut */}
//                     <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px", background: "#eef2ff", borderRadius: 18, border: "1px solid #c7d2fe", marginBottom: 20 }}>
//                       {/* ✅ FIX : affichage de la vraie photo dans le profil */}
//                       <Avatar photoUrl={data.candidat.photo_url} prenom={data.candidat.prenom} nom={data.candidat.nom} size={72} />
//                       <div>
//                         <p style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", margin: "0 0 6px" }}>
//                           {data.candidat.prenom} {data.candidat.nom}
//                         </p>
//                         <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "4px 10px", borderRadius: 999, fontWeight: 700 }}>
//                           <FiCheckCircle size={11} /> Candidature approuvée
//                         </span>
//                       </div>
//                     </div>

//                     {/* Infos */}
//                     <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 20 }}>
//                       {[
//                         { icon: <FiMail size={14} />,    label: "Email",      val: data.candidat.email     || "—" },
//                         { icon: <FiPhone size={14} />,   label: "Téléphone",  val: data.candidat.telephone || "—" },
//                         { icon: <FiCalendar size={14}/>, label: "Candidature",val: fmtShort(data.candidat.created_at) },
//                       ].map((row, i) => (
//                         <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, background: i % 2 === 0 ? "#fafbff" : "white", border: "1px solid #f0f5ff" }}>
//                           <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1", flexShrink: 0 }}>
//                             {row.icon}
//                           </div>
//                           <div>
//                             <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: .6, margin: "0 0 2px" }}>{row.label}</p>
//                             <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>{row.val}</p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>

//                     {/* Bio */}
//                     {data.candidat.bio && (
//                       <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
//                         <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: .6, margin: "0 0 8px" }}>Bio / Programme</p>
//                         <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0 }}>{data.candidat.bio}</p>
//                       </div>
//                     )}

//                     {/* Élection associée */}
//                     <div style={{ borderRadius: 18, border: "2px solid #c7d2fe", background: "linear-gradient(135deg,#eef2ff,#f8faff)", padding: "18px 20px" }}>
//                       <p style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: .8, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
//                         <FiCalendar size={11} /> Élection associée
//                       </p>
//                       <p style={{ fontWeight: 900, color: "#1e1b4b", fontSize: 15, margin: "0 0 6px" }}>{data.candidat.election_titre}</p>
//                       <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 12px" }}>
//                         {fmtShort(data.candidat.date_debut)} → {fmtShort(data.candidat.date_fin)}
//                       </p>
//                       <span style={{
//                         display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999,
//                         background: data.candidat.election_statut === "EN_COURS"  ? "#eef2ff"
//                                   : data.candidat.election_statut === "TERMINEE"  ? "#f1f5f9" : "#fffbeb",
//                         color:      data.candidat.election_statut === "EN_COURS"  ? "#4f46e5"
//                                   : data.candidat.election_statut === "TERMINEE"  ? "#64748b" : "#d97706",
//                         border: `1px solid ${
//                           data.candidat.election_statut === "EN_COURS"  ? "#c7d2fe"
//                         : data.candidat.election_statut === "TERMINEE"  ? "#e2e8f0" : "#fde68a"}`,
//                       }}>
//                         {data.candidat.election_statut === "EN_COURS"  && <><FiClock size={11} /> En cours</>}
//                         {data.candidat.election_statut === "TERMINEE"  && <><FiLock size={11} /> Terminée</>}
//                         {data.candidat.election_statut === "APPROUVEE" && <><FiCheckCircle size={11} /> Approuvée</>}
//                         {!["EN_COURS","TERMINEE","APPROUVEE"].includes(data.candidat.election_statut) && data.candidat.election_statut}
//                       </span>
//                     </div>
//                   </div>
//                 )}

//               </motion.div>
//             </AnimatePresence>
//           </div>

//           {/* Lien vers page publique */}
//           {data && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .4 }}
//               style={{ marginTop: 16, textAlign: "center" }}>
//               <a href={`/voter/${data.candidat.election_id}`}
//                 style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#818cf8", fontWeight: 600, textDecoration: "none" }}>
//                 <FiChevronRight size={14} /> Voir la page publique de l'élection
//               </a>
//             </motion.div>
//           )}

//         </main>
//       </div>
//     </>
//   );
// }

// /* ─── Design tokens ──────────────────────────────────────────────────────── */
// const NAV = {
//   root:   { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 1px 16px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 10 },
//   inner:  { maxWidth: 1100, margin: "0 auto", padding: "0 28px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
//   logo:   { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 19, fontWeight: 900, color: "#4f46e5", letterSpacing: -0.5 },
//   badge:  { fontSize: 10, background: "#eef2ff", color: "#6366f1", padding: "4px 10px", borderRadius: 999, fontWeight: 700, textTransform: "uppercase", letterSpacing: .6 },
//   logout: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, color: "#ef4444", background: "transparent", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontFamily: "'Outfit',sans-serif", transition: "all .15s" },
// };
// const PAGE = {
//   root: { minHeight: "100vh", fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f0f4ff 50%,#f8faff 100%)" },
//   main: { maxWidth: 1100, margin: "0 auto", padding: "40px 28px 80px" },
// };
// const CARD = {
//   kpi:  { background: "white", borderRadius: 18, border: "1px solid #e0e7ff", padding: "20px", textAlign: "center", boxShadow: "0 2px 8px rgba(79,70,229,0.06)", transition: "all .2s" },
//   main: { background: "white", borderRadius: 22, border: "1px solid #e0e7ff", boxShadow: "0 4px 24px rgba(79,70,229,0.08)", overflow: "hidden" },
// };
// const BTN = {
//   primary:   { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 12px rgba(79,70,229,0.25)" },
//   secondary: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", border: "1.5px solid #e0e7ff", background: "white", color: "#64748b", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" },
// };
// const FULL_CENTER = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 100%)" };
// const SPINNER = { width: 40, height: 40, border: "4px solid #e0e7ff", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" };
// const BASE_STYLES = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   @keyframes spin{to{transform:rotate(360deg);}}
//   @media(max-width:768px){
//     .kpi-grid{grid-template-columns:repeat(2,1fr)!important;}
//   }
//   @media(max-width:500px){
//     .kpi-grid{grid-template-columns:1fr 1fr!important;}
//   }
// `;











































// // src/pages/public/DashboardCandidatPublicPage.jsx
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiAward, FiCheckCircle, FiLogOut, FiCalendar,
//   FiUser, FiMail, FiPhone, FiClock, FiShield,
//   FiChevronRight, FiLock, FiHome, FiLoader,
// } from "react-icons/fi";
// import api from "../../services/api";

// const fmtLong  = d => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
// const fmtShort = d => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
// const MEDALS = ["🥇", "🥈", "🥉"];
// const getMedal = i => MEDALS[i] ?? `#${i + 1}`;

// /* ─── Navbar commune ─────────────────────────────────────────────────────── */
// function PublicNavbar({ prenom, nom, onLogout }) {
//   const initiales = `${prenom?.charAt(0) ?? ""}${nom?.charAt(0) ?? ""}`.toUpperCase();
//   return (
//     <header style={NAV.root}>
//       <div style={NAV.inner}>
//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <a href="/" style={NAV.logo}>🗳 <strong>eVote</strong></a>
//           <span style={NAV.badge}>Espace candidat</span>
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <div style={NAV.avatar}>{initiales}</div>
//             <div>
//               <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 }}>{prenom} {nom}</p>
//               <p style={{ fontSize: 11, color: "#818cf8", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
//                 <FiShield size={10} /> Candidat approuvé
//               </p>
//             </div>
//           </div>
//           <div style={{ width: 1, height: 28, background: "#e0e7ff" }} />
//           <button onClick={onLogout} style={NAV.logout}>
//             <FiLogOut size={13} /> Déconnexion
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// }

// /* ─── KPI Card ───────────────────────────────────────────────────────────── */
// function KpiCard({ value, label, color, delay }) {
//   return (
//     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: .45 }}
//       style={CARD.kpi}>
//       <p style={{ fontSize: 28, fontWeight: 900, color, margin: "0 0 4px" }}>{value}</p>
//       <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: .6, margin: 0 }}>{label}</p>
//     </motion.div>
//   );
// }

// /* ─── Tabs ───────────────────────────────────────────────────────────────── */
// function Tabs({ tabs, active, onChange }) {
//   return (
//     <div style={{ display: "flex", gap: 4, background: "#eef2ff", padding: 4, borderRadius: 14 }}>
//       {tabs.map(t => (
//         <button key={t.id} onClick={() => onChange(t.id)}
//           style={{
//             display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none", cursor: "pointer",
//             fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif", transition: "all .15s",
//             background: active === t.id ? "#4f46e5" : "transparent",
//             color: active === t.id ? "white" : "#818cf8",
//             boxShadow: active === t.id ? "0 4px 12px rgba(79,70,229,0.25)" : "none",
//           }}>
//           {t.icon} {t.label}
//         </button>
//       ))}
//     </div>
//   );
// }

// /* ─── Page principale ────────────────────────────────────────────────────── */
// export default function DashboardCandidatPublicPage() {
//   const navigate = useNavigate();
//   const [data,      setData]      = useState(null);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState("");
//   const [activeTab, setActiveTab] = useState("classement");

//   // ✅ FIX : on lit l'id utilisateur depuis le localStorage,
//   // mais l'endpoint GET /dashboard/candidat-public/:utilisateur_id attend un utilisateur_id,
//   // pas un candidat_id. Vérifiez votre backend — si l'endpoint attend le candidat_id,
//   // stockez candidat_id dans localStorage après login.
//   const utilisateurId = localStorage.getItem("id");
//   const prenom        = localStorage.getItem("prenom") || "";
//   const nom           = localStorage.getItem("nom")    || "";

//   useEffect(() => {
//     if (!utilisateurId) { navigate("/login"); return; }
//     api
//       .get(`/public-elections/dashboard/candidat-public/${utilisateurId}`)
//       .then(r => setData(r.data))
//       .catch(err => {
//         const msg = err.response?.data?.message || "Impossible de charger vos données.";
//         setError(msg);
//       })
//       .finally(() => setLoading(false));
//   }, [utilisateurId, navigate]);

//   const handleLogout = () => {
//     ["token", "id", "role", "nom", "prenom", "email", "candidat_id"].forEach(k => localStorage.removeItem(k));
//     navigate("/login");
//   };

//   /* ── Loading ── */
//   if (loading) return (
//     <div style={FULL_CENTER}>
//       <div style={SPINNER} />
//       <p style={{ color: "#818cf8", fontSize: 13, fontWeight: 600 }}>Chargement de votre espace…</p>
//       <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
//     </div>
//   );

//   /* ── Erreur ── */
//   if (error) return (
//     <div style={FULL_CENTER}>
//       <div style={{ background: "white", borderRadius: 20, border: "1px solid #fecaca", padding: "40px 32px", textAlign: "center", maxWidth: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
//         <span style={{ fontSize: 40, display: "block", marginBottom: 16 }}>😕</span>
//         <p style={{ color: "#dc2626", fontWeight: 700, marginBottom: 20, fontSize: 15 }}>{error}</p>
//         <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
//           <button onClick={() => window.location.reload()} style={BTN.secondary}>Réessayer</button>
//           <button onClick={() => navigate("/")} style={BTN.primary}><FiHome size={13} /> Accueil</button>
//         </div>
//       </div>
//     </div>
//   );

//   /* ── Données ── */
//   const maxVotes = data?.classement?.[0]?.nb_votes ?? 0;
//   const myRank   = data ? data.classement.findIndex(c => c.id === data.candidat.id) + 1 : 0;
//   const myVotes  = data?.votes?.reduce((s, v) => s + (Number(v.nb_voix) || 1), 0) ?? 0;
//   const total    = data?.classement?.reduce((s, c) => s + Number(c.nb_votes), 0) ?? 0;
//   const myPct    = total > 0 ? Math.round(myVotes / total * 100) : 0;

//   const tabs = [
//     { id: "classement", label: "Classement",          icon: "🏆" },
//     { id: "votes",      label: `Votes (${myVotes})`,  icon: <FiCheckCircle size={13} /> },
//     { id: "profil",     label: "Mon profil",           icon: <FiUser size={13} /> },
//   ];

//   return (
//     <>
//       <style>{BASE_STYLES}</style>
//       <div style={PAGE.root}>
//         <PublicNavbar prenom={prenom} nom={nom} onLogout={handleLogout} />

//         <main style={PAGE.main}>

//           {/* Salutation */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} style={{ marginBottom: 32 }}>
//             <p style={{ fontSize: 13, color: "#818cf8", fontWeight: 600, marginBottom: 4 }}>Bienvenue dans votre espace</p>
//             <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1e1b4b", letterSpacing: -0.5, marginBottom: 8 }}>
//               Bonjour, {prenom} 👋
//             </h1>
//             {data && (
//               <p style={{ fontSize: 13, color: "#818cf8", display: "flex", alignItems: "center", gap: 8 }}>
//                 <FiCalendar size={13} />
//                 {data.candidat.election_titre}
//                 <span style={{ color: "#c7d2fe" }}>·</span>
//                 {fmtShort(data.candidat.date_debut)} → {fmtShort(data.candidat.date_fin)}
//               </p>
//             )}
//           </motion.div>

//           {/* KPI cards */}
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
//             <KpiCard value={myVotes}                          label="Votes reçus"   color="#059669" delay={.05} />
//             <KpiCard value={`${myPct}%`}                     label="Part des votes" color="#4338ca" delay={.10} />
//             <KpiCard value={data?.classement?.length ?? 0}   label="Candidats"     color="#d97706" delay={.15} />
//             <KpiCard value={myRank > 0 ? `#${myRank}` : "—"} label="Mon rang"     color={myRank === 1 ? "#d97706" : "#9ca3af"} delay={.20} />
//           </div>

//           {/* Contenu principal */}
//           <div style={CARD.main}>
//             <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f5ff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
//               <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: .8 }}>Mon espace candidat</span>
//               <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
//             </div>

//             <AnimatePresence mode="wait">
//               <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .2 }}>

//                 {/* ── CLASSEMENT ── */}
//                 {activeTab === "classement" && (
//                   <div style={{ padding: 24 }}>
//                     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
//                       <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
//                         🏆 Classement en temps réel
//                       </span>
//                       <span style={{ fontSize: 11, background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5", padding: "4px 12px", borderRadius: 999, fontWeight: 700 }}>
//                         {data?.classement?.length} candidats
//                       </span>
//                     </div>
//                     <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
//                       {data?.classement?.map((c, idx) => {
//                         const pct  = maxVotes > 0 ? Math.round(Number(c.nb_votes) / Number(maxVotes) * 100) : 0;
//                         const isMe = c.id === data.candidat.id;
//                         return (
//                           <motion.div key={c.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * .04 }}
//                             style={{
//                               display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, marginBottom: 4, transition: "all .15s",
//                               background: isMe ? "#eef2ff" : "#fafafa",
//                               border: isMe ? "2px solid #c7d2fe" : "1px solid #f0f0f0",
//                               boxShadow: isMe ? "0 2px 8px rgba(99,102,241,0.12)" : "none",
//                             }}>
//                             {/* Position */}
//                             <div style={{
//                               width: 36, height: 36, borderRadius: 10, flexShrink: 0,
//                               background: idx === 0 ? "#fef3c7" : idx === 1 ? "#f1f5f9" : idx === 2 ? "#fee2e2" : "#f8fafc",
//                               display: "flex", alignItems: "center", justifyContent: "center",
//                               fontSize: idx < 3 ? 18 : 13, fontWeight: 800,
//                               color: idx === 0 ? "#d97706" : idx === 1 ? "#64748b" : idx === 2 ? "#e11d48" : "#94a3b8",
//                             }}>
//                               {getMedal(idx)}
//                             </div>
//                             {/* Infos */}
//                             <div style={{ flex: 1, minWidth: 0 }}>
//                               <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
//                                 <span style={{ fontWeight: 800, fontSize: 14, color: isMe ? "#3730a3" : "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                                   {c.prenom} {c.nom}
//                                 </span>
//                                 {isMe && (
//                                   <span style={{ fontSize: 10, background: "#4f46e5", color: "white", padding: "2px 8px", borderRadius: 999, fontWeight: 700, flexShrink: 0 }}>← vous</span>
//                                 )}
//                               </div>
//                               <div style={{ height: 6, background: "#e0e7ff", borderRadius: 999, overflow: "hidden" }}>
//                                 <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
//                                   transition={{ duration: .9, ease: "easeOut", delay: idx * .04 + .1 }}
//                                   style={{ height: "100%", borderRadius: 999, background: isMe ? "#4f46e5" : "#c7d2fe" }} />
//                               </div>
//                             </div>
//                             {/* Votes */}
//                             <div style={{ textAlign: "right", flexShrink: 0 }}>
//                               <p style={{ fontSize: 18, fontWeight: 900, color: isMe ? "#3730a3" : "#374151", margin: 0 }}>{c.nb_votes}</p>
//                               <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, margin: 0 }}>votes</p>
//                             </div>
//                           </motion.div>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}

//                 {/* ── VOTES ── */}
//                 {activeTab === "votes" && (
//                   <div style={{ padding: 24 }}>
//                     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
//                       <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14 }}>✅ Votes reçus</span>
//                       <span style={{ fontSize: 11, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "4px 12px", borderRadius: 999, fontWeight: 700 }}>
//                         {myVotes} vote{myVotes > 1 ? "s" : ""}
//                       </span>
//                     </div>

//                     {data?.votes?.length === 0 ? (
//                       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 24px", textAlign: "center" }}>
//                         <div style={{ width: 64, height: 64, background: "#eef2ff", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
//                           <FiAward size={28} color="#c7d2fe" />
//                         </div>
//                         <p style={{ fontWeight: 700, color: "#374151", marginBottom: 6 }}>Aucun vote reçu pour l'instant</p>
//                         <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 280, lineHeight: 1.6 }}>Partagez votre profil pour recevoir vos premiers votes !</p>
//                       </div>
//                     ) : (
//                       <div style={{ display: "flex", flexDirection: "column" }}>
//                         {data?.votes?.map((v, i) => (
//                           <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}
//                             style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 4, background: i % 2 === 0 ? "#fafbff" : "white", border: "1px solid #f0f5ff" }}>
//                             <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
//                             <div style={{ flex: 1 }}>
//                               <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
//                                 {v.nom_electeur || "Électeur anonyme"}
//                               </span>
//                               {v.nb_voix > 1 && (
//                                 <span style={{ marginLeft: 8, fontSize: 11, background: "#eef2ff", color: "#4f46e5", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>
//                                   {v.nb_voix} voix
//                                 </span>
//                               )}
//                             </div>
//                             <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 12 }}>
//                               <FiClock size={11} />
//                               {fmtLong(v.created_at)}
//                             </div>
//                           </motion.div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* ── PROFIL ── */}
//                 {activeTab === "profil" && data && (
//                   <div style={{ padding: 24 }}>
//                     <p style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
//                       <FiUser size={16} color="#6366f1" /> Mon profil candidat
//                     </p>

//                     {/* Avatar + statut */}
//                     <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px", background: "#eef2ff", borderRadius: 18, border: "1px solid #c7d2fe", marginBottom: 20 }}>
//                       <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "white", flexShrink: 0, boxShadow: "0 8px 24px rgba(99,102,241,0.25)" }}>
//                         {data.candidat.prenom?.[0]?.toUpperCase()}{data.candidat.nom?.[0]?.toUpperCase()}
//                       </div>
//                       <div>
//                         <p style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", margin: "0 0 6px" }}>
//                           {data.candidat.prenom} {data.candidat.nom}
//                         </p>
//                         <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "4px 10px", borderRadius: 999, fontWeight: 700 }}>
//                           <FiCheckCircle size={11} /> Candidature approuvée
//                         </span>
//                       </div>
//                     </div>

//                     {/* Infos */}
//                     <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 20 }}>
//                       {[
//                         { icon: <FiMail size={14} />,    label: "Email",      val: data.candidat.email     || "—" },
//                         { icon: <FiPhone size={14} />,   label: "Téléphone",  val: data.candidat.telephone || "—" },
//                         { icon: <FiCalendar size={14}/>, label: "Candidature",val: fmtShort(data.candidat.created_at) },
//                       ].map((row, i) => (
//                         <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, background: i % 2 === 0 ? "#fafbff" : "white", border: "1px solid #f0f5ff" }}>
//                           <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1", flexShrink: 0 }}>
//                             {row.icon}
//                           </div>
//                           <div>
//                             <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: .6, margin: "0 0 2px" }}>{row.label}</p>
//                             <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>{row.val}</p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>

//                     {/* Bio */}
//                     {data.candidat.bio && (
//                       <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
//                         <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: .6, margin: "0 0 8px" }}>Bio / Programme</p>
//                         <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0 }}>{data.candidat.bio}</p>
//                       </div>
//                     )}

//                     {/* Élection associée */}
//                     <div style={{ borderRadius: 18, border: "2px solid #c7d2fe", background: "linear-gradient(135deg,#eef2ff,#f8faff)", padding: "18px 20px" }}>
//                       <p style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: .8, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
//                         <FiCalendar size={11} /> Élection associée
//                       </p>
//                       <p style={{ fontWeight: 900, color: "#1e1b4b", fontSize: 15, margin: "0 0 6px" }}>{data.candidat.election_titre}</p>
//                       <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 12px" }}>
//                         {fmtShort(data.candidat.date_debut)} → {fmtShort(data.candidat.date_fin)}
//                       </p>
//                       <span style={{
//                         display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999,
//                         background: data.candidat.election_statut === "EN_COURS" ? "#eef2ff" : data.candidat.election_statut === "TERMINEE" ? "#f1f5f9" : "#fffbeb",
//                         color: data.candidat.election_statut === "EN_COURS" ? "#4f46e5" : data.candidat.election_statut === "TERMINEE" ? "#64748b" : "#d97706",
//                         border: `1px solid ${data.candidat.election_statut === "EN_COURS" ? "#c7d2fe" : data.candidat.election_statut === "TERMINEE" ? "#e2e8f0" : "#fde68a"}`,
//                       }}>
//                         {data.candidat.election_statut === "EN_COURS"  && <><FiClock size={11} /> En cours</>}
//                         {data.candidat.election_statut === "TERMINEE"  && <><FiLock size={11} /> Terminée</>}
//                         {data.candidat.election_statut === "APPROUVEE" && <><FiCheckCircle size={11} /> Approuvée</>}
//                         {!["EN_COURS","TERMINEE","APPROUVEE"].includes(data.candidat.election_statut) && data.candidat.election_statut}
//                       </span>
//                     </div>
//                   </div>
//                 )}

//               </motion.div>
//             </AnimatePresence>
//           </div>

//           {/* Lien vers page publique */}
//           {data && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .4 }}
//               style={{ marginTop: 16, textAlign: "center" }}>
//               <a href={`/voter/${data.candidat.election_id}`}
//                 style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#818cf8", fontWeight: 600, textDecoration: "none" }}>
//                 <FiChevronRight size={14} /> Voir la page publique de l'élection
//               </a>
//             </motion.div>
//           )}

//         </main>
//       </div>
//     </>
//   );
// }

// /* ─── Design tokens ──────────────────────────────────────────────────────── */
// const NAV = {
//   root: { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 1px 16px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 10 },
//   inner: { maxWidth: 1100, margin: "0 auto", padding: "0 28px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
//   logo: { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 19, fontWeight: 900, color: "#4f46e5", letterSpacing: -0.5 },
//   badge: { fontSize: 10, background: "#eef2ff", color: "#6366f1", padding: "4px 10px", borderRadius: 999, fontWeight: 700, textTransform: "uppercase", letterSpacing: .6 },
//   avatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#818cf8,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 13, boxShadow: "0 2px 8px rgba(99,102,241,0.25)" },
//   logout: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, color: "#ef4444", background: "transparent", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontFamily: "'Outfit',sans-serif", transition: "all .15s" },
// };
// const PAGE = {
//   root: { minHeight: "100vh", fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f0f4ff 50%,#f8faff 100%)" },
//   main: { maxWidth: 1100, margin: "0 auto", padding: "40px 28px 80px" },
// };
// const CARD = {
//   kpi: { background: "white", borderRadius: 18, border: "1px solid #e0e7ff", padding: "20px", textAlign: "center", boxShadow: "0 2px 8px rgba(79,70,229,0.06)", transition: "all .2s" },
//   main: { background: "white", borderRadius: 22, border: "1px solid #e0e7ff", boxShadow: "0 4px 24px rgba(79,70,229,0.08)", overflow: "hidden" },
// };
// const BTN = {
//   primary:   { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 12px rgba(79,70,229,0.25)" },
//   secondary: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", border: "1.5px solid #e0e7ff", background: "white", color: "#64748b", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" },
// };
// const FULL_CENTER = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 100%)" };
// const SPINNER = { width: 40, height: 40, border: "4px solid #e0e7ff", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" };
// const BASE_STYLES = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   @keyframes spin{to{transform:rotate(360deg);}}
//   @media(max-width:768px){
//     .kpi-grid{grid-template-columns:repeat(2,1fr)!important;}
//   }
//   @media(max-width:500px){
//     .kpi-grid{grid-template-columns:1fr 1fr!important;}
//   }
// `;


