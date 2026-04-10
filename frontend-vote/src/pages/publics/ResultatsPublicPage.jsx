// src/pages/public/ResultatsPublicPage.jsx
// Route : /resultats/:id
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft, FiRefreshCw, FiClock,
  FiUsers, FiShare2, FiCheckCircle, FiHome,
} from "react-icons/fi";
import api from "../../services/api";

// ✅ FIX : API_BASE défini ici aussi (manquait dans le fichier original)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const formatDate = d => new Date(d).toLocaleDateString("fr-FR", {
  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
});

const timeLeft = (dateFin) => {
  const diff = new Date(dateFin) - new Date();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (h > 24) return `${Math.floor(h / 24)}j ${h % 24}h restants`;
  if (h > 0)  return `${h}h ${m}m restantes`;
  return `${m}m ${s}s restantes`;
};

/**
 * ✅ FIX : même helper que dans VoterPublicPage
 */
function buildPhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const path = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
  return `${base}${path}`;
}

/* ─── Navbar commune ─────────────────────────────────────────────────────── */
function PublicNavbar({ onRefresh, showRefresh, onShare, copied }) {
  const navigate = useNavigate();
  return (
    <nav style={NAV.root}>
      <div style={NAV.inner}>
        <a href="/" style={NAV.logo}>🗳 <strong>EVote</strong></a>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {showRefresh && (
            <button onClick={onRefresh} style={NAV.ghost} title="Rafraîchir">
              <FiRefreshCw size={13} /> Actualiser
            </button>
          )}
          <button onClick={onShare} style={NAV.ghost}>
            {copied
              ? <><FiCheckCircle size={13} color="#22c55e" /> Copié !</>
              : <><FiShare2 size={13} /> Partager</>}
          </button>
          <a href="/" style={NAV.ghost}><FiHome size={13} /> Accueil</a>
          <button onClick={() => navigate(-1)} style={NAV.ghost}><FiArrowLeft size={13} /> Retour</button>
        </div>
      </div>
    </nav>
  );
}

/* ─── Avatar candidat ────────────────────────────────────────────────────── */
// ✅ FIX : composant Avatar ajouté pour afficher les photos dans le podium et le classement
function Avatar({ photoUrl, prenom, nom, size = 48 }) {
  const [imgError, setImgError] = useState(false);
  const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
  const url = buildPhotoUrl(photoUrl);

  if (url && !imgError) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#eef2ff", border: "2px solid #e0e7ff" }}>
        <img
          src={url}
          alt={`${prenom} ${nom}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#eef2ff,#c7d2fe)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #e0e7ff" }}>
      <span style={{ color: "#6366f1", fontWeight: 700, fontSize: size * 0.32 }}>{initials}</span>
    </div>
  );
}

/* ─── Podium top 3 ───────────────────────────────────────────────────────── */
function Podium({ candidats }) {
  if (!candidats.length) return null;
  const top3  = candidats.slice(0, 3);
  const order = top3.length >= 3 ? [top3[1], top3[0], top3[2]]
               : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]];
  const heights = [120, 160, 90];
  const medals  = ["🥈", "🥇", "🥉"];
  const colors  = [
    { bg: "#e2e8f0", text: "#475569", shadow: "rgba(71,85,105,0.2)" },
    { bg: "#fef3c7", text: "#d97706", shadow: "rgba(217,119,6,0.35)" },
    { bg: "#ffe4e6", text: "#e11d48", shadow: "rgba(225,29,72,0.2)" },
  ];
  const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, padding: "24px 0 0" }}>
      {order.map((c, i) => {
        if (!c) return null;
        const isFirst = i === 1 || (top3.length < 3 && i === order.length - 1);
        const col = colors[i];
        const h   = heights[i] || 90;
        const pct = totalVotes > 0 ? Math.round(Number(c.nb_votes) / totalVotes * 100) : 0;
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: .5 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
          >
            {/* ✅ FIX : affichage de la photo dans le podium via Avatar */}
            <Avatar photoUrl={c.photo_url} prenom={c.prenom} nom={c.nom} size={isFirst ? 60 : 48} />
            <div style={{
              width: isFirst ? 60 : 48, height: isFirst ? 60 : 48, borderRadius: "50%",
              background: col.bg, border: `3px solid ${col.text}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isFirst ? 24 : 18, boxShadow: `0 4px 16px ${col.shadow}`,
              marginTop: -8,
            }}>
              {medals[i]}
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 800, fontSize: isFirst ? 14 : 12, color: "#1e1b4b", margin: "0 0 2px", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.prenom} {c.nom}
              </p>
              <p style={{ fontSize: 12, color: "#4f46e5", fontWeight: 700, margin: 0 }}>
                {c.nb_votes} vote{Number(c.nb_votes) > 1 ? "s" : ""} · {pct}%
              </p>
            </div>
            <div style={{
              width: isFirst ? 100 : 80, height: h,
              background: `linear-gradient(180deg,${col.bg} 0%,${col.bg}aa 100%)`,
              border: `2px solid ${col.text}30`, borderRadius: "10px 10px 0 0",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 -4px 16px ${col.shadow}`,
            }}>
              <span style={{ fontSize: isFirst ? 32 : 24 }}>
                {i === 0 ? "2" : i === 1 ? "1" : "3"}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function ResultatsPublicPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [errPage,    setErrPage]    = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [countdown,  setCountdown]  = useState("");
  const [copied,     setCopied]     = useState(false);

  const fetchData = useCallback(() => {
    api.get(`/public-elections/${id}/detail`)
      .then(r => { setData(r.data); setLastUpdate(new Date()); })
      .catch(() => setErrPage("Résultats introuvables ou élection non publique."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!data?.election || data.election.statut !== "EN_COURS") return;
    const iv = setInterval(fetchData, 10_000);
    return () => clearInterval(iv);
  }, [data?.election?.statut, fetchData]);

  useEffect(() => {
    if (!data?.election?.date_fin) return;
    const iv = setInterval(() => setCountdown(timeLeft(data.election.date_fin) || ""), 1_000);
    return () => clearInterval(iv);
  }, [data?.election?.date_fin]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) { await navigator.share({ title: data?.election?.titre, url }); }
    else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  if (loading) return (
    <div style={FULL_CENTER}>
      <div style={SPINNER} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (errPage) return (
    <div style={{ ...FULL_CENTER, gap: 16 }}>
      <span style={{ fontSize: 48 }}>📊</span>
      <p style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>{errPage}</p>
      <button onClick={() => navigate("/")} style={BTN.primary}>Retour à l'accueil</button>
    </div>
  );

  const { election, candidats } = data;
  const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);
  const enCours    = election.statut === "EN_COURS";
  const terminee   = election.statut === "TERMINEE";
  const leader     = candidats[0];
  const hasWinner  = terminee && leader && Number(leader.nb_votes) > 0;

  return (
    <>
      <style>{BASE_STYLES}</style>
      <div style={PAGE.root}>
        <div style={PAGE.orb1} /><div style={PAGE.orb2} />
        <PublicNavbar onRefresh={fetchData} showRefresh={enCours} onShare={handleShare} copied={copied} />

        <main style={PAGE.main}>

          {/* ── Header élection ── */}
          <motion.div style={SECTION.header} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {hasWinner && (
              <div style={SECTION.winnerBanner}>
                🏆 Résultat final — Vainqueur : <strong>{leader.prenom} {leader.nom}</strong> avec {leader.nb_votes} votes
                ({totalVotes > 0 ? Math.round(Number(leader.nb_votes) / totalVotes * 100) : 0}%)
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  <span style={{
                    ...BADGE.base,
                    background: enCours ? "#f0fdf4" : terminee ? "#f1f5f9" : "#eff6ff",
                    color: enCours ? "#15803d" : terminee ? "#64748b" : "#1d4ed8",
                    display: "inline-flex", alignItems: "center", gap: 7,
                  }}>
                    {enCours && <span style={BADGE.dot} />}
                    {enCours ? "En cours" : terminee ? "Terminée" : "À venir"}
                  </span>
                  <span style={{ ...BADGE.base, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,.9)" }}>🌐 Publique</span>
                  <span style={{ ...BADGE.base, background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,.8)" }}>{election.type}</span>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: -0.5, marginBottom: 8, lineHeight: 1.2 }}>{election.titre}</h1>
                {election.description && (
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.6, margin: 0 }}>{election.description}</p>
                )}
              </div>
              {enCours && countdown && (
                <div style={SECTION.countdown}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, margin: "0 0 6px" }}>
                    <FiClock size={11} /> Temps restant
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: "white", margin: 0, letterSpacing: -0.5 }}>{countdown}</p>
                </div>
              )}
            </div>

            <div style={SECTION.statsRow}>
              {[
                { label: "Candidats",   value: candidats.length },
                { label: "Votes total", value: totalVotes },
                { label: "Mis à jour",  value: lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
              ].map((s, i) => (
                <div key={i} style={SECTION.statItem}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{s.value}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Corps ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {candidats.length === 0 ? (
              <div style={CARD.empty}>
                <span style={{ fontSize: 40, marginBottom: 12 }}>🕐</span>
                <p style={{ fontWeight: 600, color: "#64748b" }}>Aucun candidat approuvé pour l'instant</p>
              </div>
            ) : (
              <>
                {/* Podium */}
                {totalVotes > 0 && (
                  <div style={CARD.root}>
                    <h2 style={CARD.sectionTitle}>🏆 Podium</h2>
                    <Podium candidats={candidats} />
                    <div style={{ height: 1, background: "#e2e8f0", margin: "16px 0 12px" }} />
                    <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
                      <FiRefreshCw size={10} style={{ marginRight: 4 }} />
                      Résultats mis à jour automatiquement
                      {enCours && ` · Dernière actualisation : ${lastUpdate.toLocaleTimeString("fr-FR")}`}
                    </p>
                  </div>
                )}

                {/* Classement complet */}
                <div style={CARD.root}>
                  <h2 style={CARD.sectionTitle}>📊 Classement complet</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <AnimatePresence>
                      {candidats.map((c, idx) => {
                        const pct      = totalVotes > 0 ? Number(c.nb_votes) / totalVotes * 100 : 0;
                        const isLeader = idx === 0 && Number(c.nb_votes) > 0;
                        return (
                          <motion.div
                            key={c.id} layout
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            style={{
                              background: isLeader ? "linear-gradient(135deg,#fef9ee,#fef3c7)" : "#fafafa",
                              border: isLeader ? "2px solid #fde68a" : "1px solid #f0f0f0",
                              borderRadius: 16, padding: "16px 20px",
                              boxShadow: isLeader ? "0 4px 16px rgba(245,158,11,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              {/* Médaille / rang */}
                              <div style={{
                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                background: idx === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : idx === 1 ? "#e2e8f0" : idx === 2 ? "#fee2e2" : "#f1f5f9",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: idx < 3 ? 18 : 14, fontWeight: 800,
                                color: idx === 0 ? "white" : idx === 1 ? "#475569" : idx === 2 ? "#e11d48" : "#94a3b8",
                              }}>
                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                              </div>

                              {/* ✅ FIX : photo du candidat dans le classement */}
                              <Avatar photoUrl={c.photo_url} prenom={c.prenom} nom={c.nom} size={40} />

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b" }}>{c.prenom} {c.nom}</span>
                                    {isLeader && !terminee && <span style={BADGE.enTete}>En tête</span>}
                                    {isLeader && terminee  && <span style={BADGE.vainqueur}>🏆 Vainqueur</span>}
                                  </div>
                                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <span style={{ fontWeight: 900, fontSize: 16, color: "#4f46e5" }}>{c.nb_votes}</span>
                                    <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 3 }}>votes</span>
                                    {totalVotes > 0 && (
                                      <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>({Math.round(pct)}%)</span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                                  <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                    transition={{ duration: .8, ease: "easeOut" }}
                                    style={{
                                      height: "100%", borderRadius: 999,
                                      background: idx === 0 ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                                                : idx === 1 ? "linear-gradient(90deg,#94a3b8,#cbd5e1)"
                                                : idx === 2 ? "linear-gradient(90deg,#f87171,#fca5a5)"
                                                : "linear-gradient(90deg,#818cf8,#a5b4fc)",
                                    }}
                                  />
                                </div>
                                {c.bio && (
                                  <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>
                                    {c.bio.slice(0, 100)}{c.bio.length > 100 ? "…" : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Infos élection */}
                <div style={CARD.root}>
                  <h2 style={CARD.sectionTitle}><FiClock size={16} color="#6366f1" style={{ marginRight: 6 }} /> Informations</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Début",         value: formatDate(election.date_debut) },
                      { label: "Fin",           value: formatDate(election.date_fin) },
                      { label: "Type scrutin",  value: election.type },
                      { label: "Frais de vote", value: election.frais_vote_xaf ? `${election.frais_vote_xaf} XAF` : "—" },
                    ].map((r, i) => (
                      <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px", border: "1px solid #f0f0f0" }}>
                        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, margin: "0 0 4px" }}>{r.label}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", margin: 0 }}>{r.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA voter */}
                {enCours && (
                  <div style={SECTION.cta}>
                    <div>
                      <p style={{ fontWeight: 800, color: "#3730a3", margin: "0 0 4px", fontSize: 16 }}>🗳 Vous pouvez encore voter !</p>
                      <p style={{ fontSize: 13, color: "#6366f1", margin: 0 }}>
                        Chaque voix coûte <strong>{election.frais_vote_xaf || 500} XAF</strong> via Mobile Money.
                      </p>
                    </div>
                    <a href={`/voter/${id}`} style={BTN.cta}>Voter maintenant →</a>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const NAV = {
  root:  { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 1px 16px rgba(0,0,0,0.05)", position: "relative", zIndex: 10 },
  inner: { maxWidth: 860, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  logo:  { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 18, fontWeight: 700, color: "#4f46e5" },
  ghost: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", fontFamily: "inherit", transition: "all .15s" },
};
const PAGE = {
  root: { minHeight: "100vh", fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%)", position: "relative", overflowX: "hidden" },
  orb1: { position: "fixed", width: 500, height: 500, borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", zIndex: 0, background: "radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)", top: -180, left: -180 },
  orb2: { position: "fixed", width: 380, height: 380, borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", zIndex: 0, background: "radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%)", bottom: -100, right: -80 },
  main: { position: "relative", zIndex: 1, padding: "40px 24px 80px", maxWidth: 860, margin: "0 auto" },
};
const CARD = {
  root:         { background: "white", borderRadius: 20, border: "1px solid #f0f0f0", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", padding: "24px 28px" },
  sectionTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 800, color: "#1e1b4b", marginBottom: 20, letterSpacing: -0.2 },
  empty:        { textAlign: "center", padding: "60px 24px", background: "white", borderRadius: 20, border: "1px solid #f0f0f0", display: "flex", flexDirection: "column", alignItems: "center" },
};
const SECTION = {
  header:      { background: "linear-gradient(135deg,#4f46e5,#4338ca)", borderRadius: 24, padding: 32, marginBottom: 24, boxShadow: "0 12px 48px rgba(79,70,229,0.25)" },
  winnerBanner:{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "10px 16px", marginBottom: 20, fontSize: 14, fontWeight: 700, color: "white" },
  countdown:   { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 14, padding: "14px 20px", textAlign: "center", flexShrink: 0 },
  statsRow:    { display: "flex", background: "rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden", marginTop: 24 },
  statItem:    { flex: 1, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, borderRight: "1px solid rgba(255,255,255,0.15)" },
  cta:         { background: "linear-gradient(135deg,#eef2ff,#e0e7ff)", border: "1.5px solid #c7d2fe", borderRadius: 18, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
};
const BADGE = {
  base:      { display: "inline-block", padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  dot:       { display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "blink 1.2s ease-in-out infinite", flexShrink: 0 },
  enTete:    { background: "#fef3c7", color: "#d97706", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 },
  vainqueur: { background: "#f0fdf4", color: "#15803d", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 },
};
const BTN = {
  primary: { padding: "10px 24px", borderRadius: 10, background: "#4f46e5", color: "white", border: "none", fontFamily: "'Outfit',sans-serif", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  cta:     { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 14px rgba(79,70,229,0.35)", whiteSpace: "nowrap", flexShrink: 0 },
};
const FULL_CENTER = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 100%)" };
const SPINNER = { width: 36, height: 36, border: "4px solid #e0e7ff", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" };
const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
`;








































// // src/pages/public/ResultatsPublicPage.jsx
// // Route : /resultats/:id
// import React, { useState, useEffect, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiArrowLeft, FiRefreshCw, FiClock,
//   FiUsers, FiShare2, FiCheckCircle, FiHome,
// } from "react-icons/fi";
// import api from "../../services/api";

// /* ─── Helpers ────────────────────────────────────────────────────────────── */
// const formatDate = d => new Date(d).toLocaleDateString("fr-FR", {
//   day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
// });

// const timeLeft = (dateFin) => {
//   const diff = new Date(dateFin) - new Date();
//   if (diff <= 0) return null;
//   const h = Math.floor(diff / 3_600_000);
//   const m = Math.floor((diff % 3_600_000) / 60_000);
//   const s = Math.floor((diff % 60_000) / 1_000);
//   if (h > 24) return `${Math.floor(h / 24)}j ${h % 24}h restants`;
//   if (h > 0)  return `${h}h ${m}m restantes`;
//   return `${m}m ${s}s restantes`;
// };

// /* ─── Navbar commune ─────────────────────────────────────────────────────── */
// function PublicNavbar({ onRefresh, showRefresh, onShare, copied }) {
//   const navigate = useNavigate();
//   return (
//     <nav style={NAV.root}>
//       <div style={NAV.inner}>
//         <a href="/" style={NAV.logo}>🗳 <strong>EVote</strong></a>
//         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//           {showRefresh && (
//             <button onClick={onRefresh} style={NAV.ghost} title="Rafraîchir">
//               <FiRefreshCw size={13} /> Actualiser
//             </button>
//           )}
//           <button onClick={onShare} style={NAV.ghost}>
//             {copied
//               ? <><FiCheckCircle size={13} color="#22c55e" /> Copié !</>
//               : <><FiShare2 size={13} /> Partager</>}
//           </button>
//           <a href="/" style={NAV.ghost}><FiHome size={13} /> Accueil</a>
//           <button onClick={() => navigate(-1)} style={NAV.ghost}><FiArrowLeft size={13} /> Retour</button>
//         </div>
//       </div>
//     </nav>
//   );
// }

// /* ─── Podium top 3 ───────────────────────────────────────────────────────── */
// function Podium({ candidats }) {
//   if (!candidats.length) return null;
//   const top3  = candidats.slice(0, 3);
//   const order = top3.length >= 3 ? [top3[1], top3[0], top3[2]]
//                : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]];
//   const heights = [120, 160, 90];
//   const medals  = ["🥈", "🥇", "🥉"];
//   const colors  = [
//     { bg: "#e2e8f0", text: "#475569", shadow: "rgba(71,85,105,0.2)" },
//     { bg: "#fef3c7", text: "#d97706", shadow: "rgba(217,119,6,0.35)" },
//     { bg: "#ffe4e6", text: "#e11d48", shadow: "rgba(225,29,72,0.2)" },
//   ];
//   const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);
//   return (
//     <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, padding: "24px 0 0" }}>
//       {order.map((c, i) => {
//         if (!c) return null;
//         const isFirst = i === 1 || (top3.length < 3 && i === order.length - 1);
//         const col = colors[i];
//         const h   = heights[i] || 90;
//         const pct = totalVotes > 0 ? Math.round(Number(c.nb_votes) / totalVotes * 100) : 0;
//         return (
//           <motion.div key={c.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: i * 0.12, duration: .5 }}
//             style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
//             <div style={{
//               width: isFirst ? 60 : 48, height: isFirst ? 60 : 48, borderRadius: "50%",
//               background: col.bg, border: `3px solid ${col.text}40`,
//               display: "flex", alignItems: "center", justifyContent: "center",
//               fontSize: isFirst ? 24 : 18, boxShadow: `0 4px 16px ${col.shadow}`,
//             }}>
//               {medals[i]}
//             </div>
//             <div style={{ textAlign: "center" }}>
//               <p style={{ fontWeight: 800, fontSize: isFirst ? 14 : 12, color: "#1e1b4b", margin: "0 0 2px", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                 {c.prenom} {c.nom}
//               </p>
//               <p style={{ fontSize: 12, color: "#4f46e5", fontWeight: 700, margin: 0 }}>
//                 {c.nb_votes} vote{Number(c.nb_votes) > 1 ? "s" : ""} · {pct}%
//               </p>
//             </div>
//             <div style={{
//               width: isFirst ? 100 : 80, height: h,
//               background: `linear-gradient(180deg,${col.bg} 0%,${col.bg}aa 100%)`,
//               border: `2px solid ${col.text}30`, borderRadius: "10px 10px 0 0",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               boxShadow: `0 -4px 16px ${col.shadow}`,
//             }}>
//               <span style={{ fontSize: isFirst ? 32 : 24 }}>
//                 {i === 0 ? "2" : i === 1 ? "1" : "3"}
//               </span>
//             </div>
//           </motion.div>
//         );
//       })}
//     </div>
//   );
// }

// /* ─── Page principale ────────────────────────────────────────────────────── */
// export default function ResultatsPublicPage() {
//   const { id }   = useParams();
//   const navigate = useNavigate();

//   const [data,       setData]       = useState(null);
//   const [loading,    setLoading]    = useState(true);
//   const [errPage,    setErrPage]    = useState("");
//   const [lastUpdate, setLastUpdate] = useState(new Date());
//   const [countdown,  setCountdown]  = useState("");
//   const [copied,     setCopied]     = useState(false);

//   const fetchData = useCallback(() => {
//     api.get(`/public-elections/${id}/detail`)
//       .then(r => { setData(r.data); setLastUpdate(new Date()); })
//       .catch(() => setErrPage("Résultats introuvables ou élection non publique."))
//       .finally(() => setLoading(false));
//   }, [id]);

//   useEffect(() => { fetchData(); }, [fetchData]);

//   // ✅ FIX : rafraîchissement uniquement si statut EN_COURS (APPROUVEE n'existe pas côté élection active)
//   useEffect(() => {
//     if (!data?.election || data.election.statut !== "EN_COURS") return;
//     const iv = setInterval(fetchData, 10_000);
//     return () => clearInterval(iv);
//   }, [data?.election?.statut, fetchData]);

//   // Compte à rebours
//   useEffect(() => {
//     if (!data?.election?.date_fin) return;
//     const iv = setInterval(() => setCountdown(timeLeft(data.election.date_fin) || ""), 1_000);
//     return () => clearInterval(iv);
//   }, [data?.election?.date_fin]);

//   const handleShare = async () => {
//     const url = window.location.href;
//     if (navigator.share) { await navigator.share({ title: data?.election?.titre, url }); }
//     else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
//   };

//   if (loading) return (
//     <div style={FULL_CENTER}>
//       <div style={SPINNER} />
//       <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
//     </div>
//   );

//   if (errPage) return (
//     <div style={{ ...FULL_CENTER, gap: 16 }}>
//       <span style={{ fontSize: 48 }}>📊</span>
//       <p style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>{errPage}</p>
//       <button onClick={() => navigate("/")} style={BTN.primary}>Retour à l'accueil</button>
//     </div>
//   );

//   const { election, candidats } = data;
//   const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);
//   const enCours    = election.statut === "EN_COURS";
//   const terminee   = election.statut === "TERMINEE";
//   const leader     = candidats[0];
//   const hasWinner  = terminee && leader && Number(leader.nb_votes) > 0;

//   return (
//     <>
//       <style>{BASE_STYLES}</style>
//       <div style={PAGE.root}>
//         <div style={PAGE.orb1} /><div style={PAGE.orb2} />
//         <PublicNavbar onRefresh={fetchData} showRefresh={enCours} onShare={handleShare} copied={copied} />

//         <main style={PAGE.main}>

//           {/* ── Header élection ── */}
//           <motion.div style={SECTION.header} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//             {hasWinner && (
//               <div style={SECTION.winnerBanner}>
//                 🏆 Résultat final — Vainqueur : <strong>{leader.prenom} {leader.nom}</strong> avec {leader.nb_votes} votes
//                 ({totalVotes > 0 ? Math.round(Number(leader.nb_votes) / totalVotes * 100) : 0}%)
//               </div>
//             )}

//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
//               <div style={{ flex: 1 }}>
//                 <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
//                   <span style={{
//                     ...BADGE.base,
//                     background: enCours ? "#f0fdf4" : terminee ? "#f1f5f9" : "#eff6ff",
//                     color: enCours ? "#15803d" : terminee ? "#64748b" : "#1d4ed8",
//                     display: "inline-flex", alignItems: "center", gap: 7,
//                   }}>
//                     {enCours && <span style={BADGE.dot} />}
//                     {enCours ? "En cours" : terminee ? "Terminée" : "À venir"}
//                   </span>
//                   <span style={{ ...BADGE.base, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,.9)" }}>🌐 Publique</span>
//                   <span style={{ ...BADGE.base, background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,.8)" }}>{election.type}</span>
//                 </div>
//                 <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: -0.5, marginBottom: 8, lineHeight: 1.2 }}>{election.titre}</h1>
//                 {election.description && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.6, margin: 0 }}>{election.description}</p>}
//               </div>
//               {enCours && countdown && (
//                 <div style={SECTION.countdown}>
//                   <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, margin: "0 0 6px" }}>
//                     <FiClock size={11} /> Temps restant
//                   </p>
//                   <p style={{ fontSize: 20, fontWeight: 900, color: "white", margin: 0, letterSpacing: -0.5 }}>{countdown}</p>
//                 </div>
//               )}
//             </div>

//             <div style={SECTION.statsRow}>
//               {[
//                 { label: "Candidats",   value: candidats.length },
//                 { label: "Votes total", value: totalVotes },
//                 { label: "Mis à jour",  value: lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
//               ].map((s, i) => (
//                 <div key={i} style={SECTION.statItem}>
//                   <span style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{s.value}</span>
//                   <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 }}>{s.label}</span>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           {/* ── Corps ── */}
//           <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
//             {candidats.length === 0 ? (
//               <div style={CARD.empty}>
//                 <span style={{ fontSize: 40, marginBottom: 12 }}>🕐</span>
//                 <p style={{ fontWeight: 600, color: "#64748b" }}>Aucun candidat approuvé pour l'instant</p>
//               </div>
//             ) : (
//               <>
//                 {/* Podium */}
//                 {totalVotes > 0 && (
//                   <div style={CARD.root}>
//                     <h2 style={CARD.sectionTitle}>🏆 Podium</h2>
//                     <Podium candidats={candidats} />
//                     <div style={{ height: 1, background: "#e2e8f0", margin: "16px 0 12px" }} />
//                     <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
//                       <FiRefreshCw size={10} style={{ marginRight: 4 }} />
//                       Résultats mis à jour automatiquement
//                       {enCours && ` · Dernière actualisation : ${lastUpdate.toLocaleTimeString("fr-FR")}`}
//                     </p>
//                   </div>
//                 )}

//                 {/* Classement complet */}
//                 <div style={CARD.root}>
//                   <h2 style={CARD.sectionTitle}>📊 Classement complet</h2>
//                   <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//                     <AnimatePresence>
//                       {candidats.map((c, idx) => {
//                         const pct      = totalVotes > 0 ? Number(c.nb_votes) / totalVotes * 100 : 0;
//                         const isLeader = idx === 0 && Number(c.nb_votes) > 0;
//                         return (
//                           <motion.div key={c.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
//                             transition={{ delay: idx * 0.05 }}
//                             style={{
//                               background: isLeader ? "linear-gradient(135deg,#fef9ee,#fef3c7)" : "#fafafa",
//                               border: isLeader ? "2px solid #fde68a" : "1px solid #f0f0f0",
//                               borderRadius: 16, padding: "16px 20px",
//                               boxShadow: isLeader ? "0 4px 16px rgba(245,158,11,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
//                             }}>
//                             <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//                               <div style={{
//                                 width: 36, height: 36, borderRadius: 10, flexShrink: 0,
//                                 background: idx === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : idx === 1 ? "#e2e8f0" : idx === 2 ? "#fee2e2" : "#f1f5f9",
//                                 display: "flex", alignItems: "center", justifyContent: "center",
//                                 fontSize: idx < 3 ? 18 : 14, fontWeight: 800,
//                                 color: idx === 0 ? "white" : idx === 1 ? "#475569" : idx === 2 ? "#e11d48" : "#94a3b8",
//                               }}>
//                                 {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
//                               </div>
//                               <div style={{ flex: 1, minWidth: 0 }}>
//                                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
//                                   <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                                     <span style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b" }}>{c.prenom} {c.nom}</span>
//                                     {isLeader && !terminee && <span style={BADGE.enTete}>En tête</span>}
//                                     {isLeader && terminee  && <span style={BADGE.vainqueur}>🏆 Vainqueur</span>}
//                                   </div>
//                                   <div style={{ textAlign: "right", flexShrink: 0 }}>
//                                     <span style={{ fontWeight: 900, fontSize: 16, color: "#4f46e5" }}>{c.nb_votes}</span>
//                                     <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 3 }}>votes</span>
//                                     {totalVotes > 0 && <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>({Math.round(pct)}%)</span>}
//                                   </div>
//                                 </div>
//                                 <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
//                                   <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
//                                     transition={{ duration: .8, ease: "easeOut" }}
//                                     style={{
//                                       height: "100%", borderRadius: 999,
//                                       background: idx === 0 ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
//                                                 : idx === 1 ? "linear-gradient(90deg,#94a3b8,#cbd5e1)"
//                                                 : idx === 2 ? "linear-gradient(90deg,#f87171,#fca5a5)"
//                                                 : "linear-gradient(90deg,#818cf8,#a5b4fc)",
//                                     }} />
//                                 </div>
//                                 {c.bio && <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>{c.bio.slice(0, 100)}{c.bio.length > 100 ? "…" : ""}</p>}
//                               </div>
//                             </div>
//                           </motion.div>
//                         );
//                       })}
//                     </AnimatePresence>
//                   </div>
//                 </div>

//                 {/* Infos élection */}
//                 <div style={CARD.root}>
//                   <h2 style={CARD.sectionTitle}><FiClock size={16} color="#6366f1" style={{ marginRight: 6 }} /> Informations</h2>
//                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
//                     {[
//                       { label: "Début",         value: formatDate(election.date_debut) },
//                       { label: "Fin",           value: formatDate(election.date_fin) },
//                       { label: "Type scrutin",  value: election.type },
//                       { label: "Frais de vote", value: election.frais_vote_xaf ? `${election.frais_vote_xaf} XAF` : "—" },
//                     ].map((r, i) => (
//                       <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px", border: "1px solid #f0f0f0" }}>
//                         <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, margin: "0 0 4px" }}>{r.label}</p>
//                         <p style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", margin: 0 }}>{r.value}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* CTA voter */}
//                 {enCours && (
//                   <div style={SECTION.cta}>
//                     <div>
//                       <p style={{ fontWeight: 800, color: "#3730a3", margin: "0 0 4px", fontSize: 16 }}>🗳 Vous pouvez encore voter !</p>
//                       <p style={{ fontSize: 13, color: "#6366f1", margin: 0 }}>
//                         Chaque voix coûte <strong>{election.frais_vote_xaf || 500} XAF</strong> via Mobile Money.
//                       </p>
//                     </div>
//                     <a href={`/voter/${id}`} style={BTN.cta}>Voter maintenant →</a>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </main>
//       </div>
//     </>
//   );
// }

// /* ─── Design tokens ──────────────────────────────────────────────────────── */
// const NAV = {
//   root: { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 1px 16px rgba(0,0,0,0.05)", position: "relative", zIndex: 10 },
//   inner: { maxWidth: 860, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
//   logo: { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 18, fontWeight: 700, color: "#4f46e5" },
//   ghost: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", fontFamily: "inherit", transition: "all .15s" },
// };
// const PAGE = {
//   root: { minHeight: "100vh", fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%)", position: "relative", overflowX: "hidden" },
//   orb1: { position: "fixed", width: 500, height: 500, borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", zIndex: 0, background: "radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)", top: -180, left: -180 },
//   orb2: { position: "fixed", width: 380, height: 380, borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", zIndex: 0, background: "radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%)", bottom: -100, right: -80 },
//   main: { position: "relative", zIndex: 1, padding: "40px 24px 80px", maxWidth: 860, margin: "0 auto" },
// };
// const CARD = {
//   root: { background: "white", borderRadius: 20, border: "1px solid #f0f0f0", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", padding: "24px 28px" },
//   sectionTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 800, color: "#1e1b4b", marginBottom: 20, letterSpacing: -0.2 },
//   empty: { textAlign: "center", padding: "60px 24px", background: "white", borderRadius: 20, border: "1px solid #f0f0f0", display: "flex", flexDirection: "column", alignItems: "center" },
// };
// const SECTION = {
//   header: { background: "linear-gradient(135deg,#4f46e5,#4338ca)", borderRadius: 24, padding: 32, marginBottom: 24, boxShadow: "0 12px 48px rgba(79,70,229,0.25)" },
//   winnerBanner: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "10px 16px", marginBottom: 20, fontSize: 14, fontWeight: 700, color: "white" },
//   countdown: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 14, padding: "14px 20px", textAlign: "center", flexShrink: 0 },
//   statsRow: { display: "flex", background: "rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden", marginTop: 24 },
//   statItem: { flex: 1, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, borderRight: "1px solid rgba(255,255,255,0.15)" },
//   cta: { background: "linear-gradient(135deg,#eef2ff,#e0e7ff)", border: "1.5px solid #c7d2fe", borderRadius: 18, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
// };
// const BADGE = {
//   base: { display: "inline-block", padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
//   dot: { display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "blink 1.2s ease-in-out infinite", flexShrink: 0 },
//   enTete:   { background: "#fef3c7", color: "#d97706", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 },
//   vainqueur: { background: "#f0fdf4", color: "#15803d", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 },
// };
// const BTN = {
//   primary: { padding: "10px 24px", borderRadius: 10, background: "#4f46e5", color: "white", border: "none", fontFamily: "'Outfit',sans-serif", fontWeight: 700, cursor: "pointer", fontSize: 14 },
//   cta: { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 14px rgba(79,70,229,0.35)", whiteSpace: "nowrap", flexShrink: 0 },
// };
// const FULL_CENTER = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 100%)" };
// const SPINNER = { width: 36, height: 36, border: "4px solid #e0e7ff", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" };
// const BASE_STYLES = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   @keyframes spin{to{transform:rotate(360deg);}}
//   @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
// `;


