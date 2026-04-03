// src/pages/public/VoterPublicPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle, FiXCircle, FiLoader, FiSmartphone,
  FiArrowLeft, FiArrowRight, FiUsers,
} from "react-icons/fi";
import { BarChart3 } from "lucide-react";
import api from "../../services/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = d =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// ─── Modal Paiement CamPay ────────────────────────────────────────────────────
function ModalPaiement({ candidat, election, etape, telephone, setTelephone, nomElecteur, setNomElecteur, emailElecteur, setEmailElecteur, campayRef, msgErreur, onPayer, onFermer, onReessayer }) {
  if (!["saisie", "attente", "succes", "erreur"].includes(etape)) return null;

  const frais = election?.frais_vote_xaf || 500;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15,23,42,0.72)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: 16,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: .92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: .92, y: 20 }}
        transition={{ duration: .3, ease: [0.22,1,0.36,1] }}
        style={{
          background: "#fff", borderRadius: 24,
          padding: "40px 36px", width: "100%", maxWidth: 440,
          boxShadow: "0 32px 100px rgba(0,0,0,0.28)",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Bande top */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 5,
          background:
            etape === "succes" ? "linear-gradient(90deg,#22c55e,#16a34a)" :
            etape === "erreur" ? "linear-gradient(90deg,#ef4444,#dc2626)" :
            "linear-gradient(90deg,#6366f1,#4f46e5,#818cf8)",
        }} />

        {/* ── SAISIE ── */}
        {etape === "saisie" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 68, height: 68, borderRadius: 20,
                background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 10px 30px rgba(99,102,241,0.40)",
              }}>
                <FiSmartphone size={28} color="white" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1e1b4b", marginBottom: 8 }}>
                Voter pour <span style={{ color: "#6366f1" }}>{candidat?.prenom} {candidat?.nom}</span>
              </h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                Frais de vote : <strong style={{ color: "#6366f1", fontSize: 15 }}>{frais} XAF</strong>
                <br />Paiement sécurisé via Mobile Money
              </p>
            </div>

            {/* Nom électeur */}
            <div style={{ marginBottom: 14 }}>
              <label style={LABEL_STYLE}>Votre nom (optionnel)</label>
              <input
                type="text" placeholder="Jean Dupont"
                value={nomElecteur} onChange={e => setNomElecteur(e.target.value)}
                style={{ ...INPUT_STYLE, marginTop: 6 }}
              />
            </div>

            {/* Email pour confirmation */}
            <div style={{ marginBottom: 14 }}>
              <label style={LABEL_STYLE}>Email (optionnel — pour recevoir la confirmation)</label>
              <input
                type="email" placeholder="jean@email.com"
                value={emailElecteur} onChange={e => setEmailElecteur(e.target.value)}
                style={{ ...INPUT_STYLE, marginTop: 6 }}
              />
            </div>

            {/* Téléphone */}
            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>Votre numéro MTN / Orange Money *</label>
              <div style={{
                display: "flex", border: "2px solid #e0e7ff",
                borderRadius: 14, overflow: "hidden", marginTop: 6,
              }}>
                <span style={{
                  padding: "13px 16px", background: "#eef2ff", color: "#6366f1",
                  fontWeight: 800, fontSize: 15, borderRight: "2px solid #e0e7ff",
                  whiteSpace: "nowrap", letterSpacing: .5,
                }}>
                  +237
                </span>
                <input
                  type="tel" maxLength={9} placeholder="6XXXXXXXX"
                  value={telephone} onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  style={{
                    flex: 1, border: "none", outline: "none",
                    padding: "13px 16px", fontSize: 16,
                    fontFamily: "Outfit, sans-serif", color: "#1e293b",
                    background: "transparent", letterSpacing: 2,
                  }}
                />
              </div>
            </div>

            {/* Opérateurs */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {[{ label: "MTN MoMo", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                { label: "Orange Money", color: "#ea580c", bg: "#fff7ed", border: "#fdba74" }].map(op => (
                <div key={op.label} style={{
                  flex: 1, padding: "9px 10px", borderRadius: 10,
                  background: op.bg, border: `1.5px solid ${op.border}`,
                  textAlign: "center", fontSize: 12, fontWeight: 700, color: op.color,
                }}>
                  ✓ {op.label}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onFermer} style={BTN_OUTLINE}>← Retour</button>
              <button
                onClick={onPayer}
                disabled={telephone.length !== 9}
                style={{
                  ...BTN_FILLED,
                  background: telephone.length === 9 ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#e2e8f0",
                  color: telephone.length === 9 ? "#fff" : "#94a3b8",
                  cursor: telephone.length === 9 ? "pointer" : "not-allowed",
                  boxShadow: telephone.length === 9 ? "0 6px 18px rgba(99,102,241,0.40)" : "none",
                }}
              >
                💳 Voter — {frais} XAF
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
              🔒 Paiement sécurisé via CamPay
            </p>
          </>
        )}

        {/* ── ATTENTE ── */}
        {etape === "attente" && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "#eef2ff", border: "3px solid #c7d2fe",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 22px",
            }}>
              <FiLoader size={34} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1e1b4b", marginBottom: 12 }}>
              En attente de confirmation
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 20 }}>
              Confirmez le paiement avec votre <strong style={{ color: "#6366f1" }}>PIN Mobile Money</strong>.
            </p>
            {campayRef && (
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px", border: "1px solid #e2e8f0", marginBottom: 20, wordBreak: "break-all" }}>
                <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, margin: "0 0 4px" }}>Référence</p>
                <p style={{ fontSize: 12, color: "#475569", fontWeight: 600, margin: 0 }}>{campayRef}</p>
              </div>
            )}
            <div style={{ height: 5, background: "#e0e7ff", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: "45%",
                background: "linear-gradient(90deg,#6366f1,#818cf8)", borderRadius: 4,
                animation: "progress 1.8s ease-in-out infinite",
              }} />
            </div>
          </div>
        )}

        {/* ── SUCCÈS ── */}
        {etape === "succes" && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <motion.div
              initial={{ scale: .5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "#f0fdf4", border: "3px solid #bbf7d0",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 22px",
              }}
            >
              <FiCheckCircle size={36} color="#22c55e" />
            </motion.div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#15803d", marginBottom: 12 }}>
              Vote enregistré !
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 28 }}>
              Votre vote pour <strong>{candidat?.prenom} {candidat?.nom}</strong> a été confirmé.
              Vous pouvez voter à nouveau en payant les frais.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={onFermer} style={{ ...BTN_OUTLINE, borderRadius: 12 }}>
                Voter à nouveau
              </button>
              <button onClick={() => window.location.href = `/dashboard-electeur/${telephone}`} style={{
                ...BTN_FILLED,
                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                boxShadow: "0 6px 18px rgba(34,197,94,0.35)",
              }}>
                Mon tableau de bord
              </button>
            </div>
          </div>
        )}

        {/* ── ERREUR ── */}
        {etape === "erreur" && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "#fef2f2", border: "3px solid #fecaca",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 22px",
            }}>
              <FiXCircle size={36} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#dc2626", marginBottom: 12 }}>
              Paiement échoué
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 28 }}>
              {msgErreur || "Le paiement a échoué ou le délai a expiré."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={onFermer} style={BTN_OUTLINE}>Fermer</button>
              <button onClick={onReessayer} style={{ ...BTN_FILLED, background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
                Réessayer
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin{to{transform:rotate(360deg);}}
          @keyframes progress{0%{transform:translateX(-100%);}60%{transform:translateX(200%);}100%{transform:translateX(500%);}}
        `}</style>
      </motion.div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default function VoterPublicPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [errPage,     setErrPage]     = useState("");
  const [candidatSel, setCandidatSel] = useState(null);

  // Paiement state
  const [etape,       setEtape]       = useState("");
  const [telephone,   setTelephone]   = useState("");
  const [nomElecteur,  setNomElecteur]  = useState("");
  const [emailElecteur, setEmailElecteur] = useState("");
  const [campayRef,   setCampayRef]   = useState(null);
  const [msgErreur,   setMsgErreur]   = useState("");
  const [voteId,      setVoteId]      = useState(null);

  useEffect(() => {
    api.get(`/public-elections/${id}/detail`)
      .then(r => setData(r.data))
      .catch(() => setErrPage("Élection introuvable ou non publique."))
      .finally(() => setLoading(false));
  }, [id]);

  // Rafraîchir résultats toutes les 10s si en cours
  useEffect(() => {
    if (!data?.election || data.election.statut !== "EN_COURS") return;
    const iv = setInterval(() => {
      api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
    }, 10000);
    return () => clearInterval(iv);
  }, [data?.election?.statut]);

  const handleVoter = (candidat) => {
    setCandidatSel(candidat);
    setTelephone("");
    setNomElecteur("");
    setEmailElecteur("");
    setEtape("saisie");
  };

  const handlePayer = async () => {
    if (!/^[0-9]{9}$/.test(telephone)) return;

    setEtape("attente");
    try {
      const { data: res } = await api.post(`/public-elections/${id}/voter`, {
        candidat_public_id: candidatSel.id,
        telephone: `237${telephone}`,
        nom_electeur:   nomElecteur   || undefined,
        email_electeur: emailElecteur || undefined,
      });
      setCampayRef(res.campay_reference);
      setVoteId(res.vote_id);
      lancerPolling(res.campay_reference);
    } catch (err) {
      setMsgErreur(err.response?.data?.message || "Erreur initialisation paiement.");
      setEtape("erreur");
    }
  };

  const lancerPolling = (reference) => {
    let tentatives = 0;
    const iv = setInterval(async () => {
      tentatives++;
      try {
        const { data: s } = await api.get(`/public-elections/vote-statut/${reference}`);
        if (s.status === "SUCCESSFUL") {
          clearInterval(iv);
          setEtape("succes");
          // Rafraîchir les candidats
          api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
        } else if (s.status === "FAILED" || tentatives >= 12) {
          clearInterval(iv);
          setMsgErreur("Paiement échoué ou délai de 60 secondes dépassé.");
          setEtape("erreur");
        }
      } catch {
        clearInterval(iv);
        setMsgErreur("Erreur lors de la vérification.");
        setEtape("erreur");
      }
    }, 5000);
  };

  const maxVotes = data?.candidats?.reduce((m, c) => Math.max(m, c.nb_votes), 0) || 0;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif" }}>
      <FiLoader size={32} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (errPage) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif", gap: 16, color: "#64748b" }}>
      <span style={{ fontSize: 40 }}>🗳</span>
      <p style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>{errPage}</p>
      <button onClick={() => navigate("/")} style={{ padding: "10px 24px", borderRadius: 10, background: "#4f46e5", color: "white", border: "none", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}>
        Retour à l'accueil
      </button>
    </div>
  );

  const { election, candidats } = data;
  const enCours = election.statut === "EN_COURS";
  const totalVotes = candidats.reduce((s, c) => s + c.nb_votes, 0);

  return (
    <>
      <style>{styles}</style>
      <div className="vp-root">
        <div className="vp-orb vp-orb-1" />
        <div className="vp-orb vp-orb-2" />

        {/* Modal paiement */}
        <AnimatePresence>
          {etape && (
            <ModalPaiement
              candidat={candidatSel}
              election={election}
              etape={etape}
              telephone={telephone}
              setTelephone={setTelephone}
              nomElecteur={nomElecteur}
              setNomElecteur={setNomElecteur}
              emailElecteur={emailElecteur}
              setEmailElecteur={setEmailElecteur}
              campayRef={campayRef}
              msgErreur={msgErreur}
              onPayer={handlePayer}
              onFermer={() => setEtape("")}
              onReessayer={() => { setEtape("saisie"); setMsgErreur(""); }}
            />
          )}
        </AnimatePresence>

        {/* Navbar */}
        <nav className="vp-nav">
          <div className="vp-nav-inner">
            <a href="/" className="vp-logo">🗳 <strong>EVote</strong></a>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <a href={`/dashboard-electeur/${telephone || "votre-telephone"}`} className="vp-nav-link">
                <BarChart3 size={14} /> Mon tableau de bord
              </a>
              <button onClick={() => navigate(-1)} className="vp-back">
                <FiArrowLeft size={14} /> Retour
              </button>
            </div>
          </div>
        </nav>

        <main className="vp-main">
          {/* En-tête élection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="vp-header-card"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div className="vp-badge-row">
                  <span className={`vp-statut-badge ${enCours ? "vp-statut-badge--green" : "vp-statut-badge--blue"}`}>
                    {enCours && <span className="vp-dot" />}
                    {enCours ? "Élection en cours" : "Élection à venir"}
                  </span>
                  <span className="vp-public-badge">🌐 Publique</span>
                </div>
                <h1 className="vp-title">{election.titre}</h1>
                {election.description && <p className="vp-desc">{election.description}</p>}
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Frais de vote</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{election.frais_vote_xaf || 500} XAF</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>par vote · MTN / Orange</p>
              </div>
            </div>

            {/* Stats */}
            <div className="vp-stats-row">
              {[
                { label: "Candidats", value: candidats.length, icon: <FiUsers size={14}/> },
                { label: "Votes total", value: totalVotes, icon: <BarChart3 size={14}/> },
                { label: "Clôture", value: formatDate(election.date_fin), icon: null },
              ].map((s, i) => (
                <div key={i} className="vp-stat-item">
                  {s.icon && <span style={{ opacity: .8 }}>{s.icon}</span>}
                  <span className="vp-stat-val">{s.value}</span>
                  <span className="vp-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Candidats */}
          <div style={{ maxWidth: 800, margin: "32px auto 0" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e1b4b", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <FiUsers size={18} color="#6366f1" />
              Candidats ({candidats.length})
            </h2>

            {candidats.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: 20, border: "1px solid #f0f0f0", color: "#94a3b8" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🕐</div>
                <p style={{ fontWeight: 600, color: "#64748b" }}>Aucun candidat approuvé pour l'instant</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {candidats.map((c, idx) => {
                  const pct = maxVotes > 0 ? Math.round((c.nb_votes / maxVotes) * 100) : 0;
                  const isLeader = c.nb_votes > 0 && c.nb_votes === maxVotes;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      style={{
                        background: "white", borderRadius: 18,
                        border: isLeader ? "2px solid #6366f1" : "1px solid #f0f0f0",
                        boxShadow: isLeader ? "0 4px 20px rgba(99,102,241,0.15)" : "0 2px 10px rgba(0,0,0,0.05)",
                        padding: "20px 24px",
                        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                      }}
                    >
                      {/* Rang */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: idx === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#eef2ff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: idx === 0 ? "20px" : "16px", fontWeight: 800,
                        color: idx === 0 ? "white" : "#6366f1",
                      }}>
                        {idx === 0 ? "🏆" : `#${idx+1}`}
                      </div>

                      {/* Infos candidat */}
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <p style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b", margin: 0 }}>
                            {c.prenom} {c.nom}
                          </p>
                          {isLeader && <span style={{ background: "#eef2ff", color: "#6366f1", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>🥇 En tête</span>}
                        </div>
                        {c.bio && <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{c.bio.slice(0, 80)}{c.bio.length > 80 ? "…" : ""}</p>}

                        {/* Barre de votes */}
                        <div style={{ marginTop: 10 }}>
                          <div style={{ height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: .8, ease: "easeOut" }}
                              style={{
                                height: "100%",
                                background: isLeader ? "linear-gradient(90deg,#6366f1,#818cf8)" : "#c7d2fe",
                                borderRadius: 999,
                              }}
                            />
                          </div>
                          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                            <strong style={{ color: "#6366f1" }}>{c.nb_votes}</strong> vote{c.nb_votes > 1 ? "s" : ""}
                            {totalVotes > 0 && ` · ${Math.round((c.nb_votes/totalVotes)*100)}%`}
                          </p>
                        </div>
                      </div>

                      {/* Bouton voter */}
                      {enCours && (
                        <button
                          onClick={() => handleVoter(c)}
                          style={{
                            padding: "10px 20px", borderRadius: 12, border: "none",
                            background: "linear-gradient(135deg,#4f46e5,#6366f1)",
                            color: "white", fontSize: 13, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit",
                            boxShadow: "0 4px 12px rgba(79,70,229,0.30)",
                            whiteSpace: "nowrap", transition: "all .2s",
                            flexShrink: 0,
                          }}
                          onMouseEnter={e => e.target.style.transform = "translateY(-1px)"}
                          onMouseLeave={e => e.target.style.transform = "translateY(0)"}
                        >
                          Voter →
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Bandeau dashboard électeur */}
            <div style={{
              marginTop: 32, background: "linear-gradient(135deg,#eef2ff,#e0e7ff)",
              border: "1.5px solid #c7d2fe", borderRadius: 16, padding: "20px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
            }}>
              <div>
                <p style={{ fontWeight: 800, color: "#3730a3", margin: "0 0 4px" }}>📊 Suivez vos votes</p>
                <p style={{ fontSize: 13, color: "#6366f1", margin: 0 }}>
                  Consultez votre tableau de bord avec votre numéro de téléphone.
                </p>
              </div>
              <a
                href="/dashboard-electeur"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "10px 20px", borderRadius: 12,
                  background: "linear-gradient(135deg,#4f46e5,#6366f1)",
                  color: "white", textDecoration: "none", fontSize: 13, fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(79,70,229,0.30)",
                }}
              >
                Mon tableau de bord <FiArrowRight size={13} />
              </a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const LABEL_STYLE = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#64748b", textTransform: "uppercase", letterSpacing: .7,
};
const INPUT_STYLE = {
  width: "100%", padding: "12px 14px",
  border: "2px solid #e0e7ff", borderRadius: 12,
  fontSize: 14, fontFamily: "Outfit, sans-serif",
  color: "#1e293b", background: "#fafafa", outline: "none",
};
const BTN_OUTLINE = {
  flex: 1, padding: "13px", borderRadius: 14,
  border: "1.5px solid #e2e8f0", background: "#fff",
  color: "#64748b", fontSize: 14, fontWeight: 600,
  cursor: "pointer", fontFamily: "Outfit, sans-serif",
};
const BTN_FILLED = {
  flex: 2, padding: "13px", borderRadius: 14, border: "none",
  fontSize: 14, fontWeight: 800, fontFamily: "Outfit, sans-serif",
  transition: "all .25s",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  .vp-root{min-height:100vh;font-family:'Outfit',sans-serif;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow-x:hidden;}
  .vp-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
  .vp-orb-1{width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%);top:-180px;left:-180px;}
  .vp-orb-2{width:380px;height:380px;background:radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%);bottom:-100px;right:-80px;}
  .vp-nav{position:relative;z-index:10;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);box-shadow:0 1px 16px rgba(0,0,0,0.05);}
  .vp-nav-inner{max-width:840px;margin:0 auto;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;}
  .vp-logo{display:flex;align-items:center;gap:8px;text-decoration:none;font-size:18px;font-weight:700;color:#4f46e5;}
  .vp-nav-link{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:none;background:transparent;color:#64748b;font-size:13px;font-weight:600;text-decoration:none;transition:all .15s;}
  .vp-nav-link:hover{background:#eef2ff;color:#4f46e5;}
  .vp-back{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
  .vp-back:hover{background:#f8fafc;}
  .vp-main{position:relative;z-index:1;padding:40px 24px 80px;}
  .vp-header-card{max-width:840px;margin:0 auto;background:linear-gradient(135deg,#4f46e5,#4338ca);border-radius:24px;padding:32px;color:white;box-shadow:0 12px 48px rgba(79,70,229,0.25);}
  .vp-badge-row{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
  .vp-statut-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.3px;}
  .vp-statut-badge--green{background:#f0fdf4;color:#15803d;}
  .vp-statut-badge--blue{background:#eff6ff;color:#1d4ed8;}
  .vp-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;animation:blink 1.2s ease-in-out infinite;flex-shrink:0;}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
  .vp-public-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.15);color:rgba(255,255,255,.9);padding:5px 12px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid rgba(255,255,255,0.25);}
  .vp-title{font-size:28px;font-weight:900;letter-spacing:-0.5px;margin-bottom:8px;line-height:1.2;}
  .vp-desc{font-size:14px;color:rgba(255,255,255,0.75);line-height:1.6;margin:0;}
  .vp-stats-row{display:flex;gap:0;margin-top:24px;background:rgba(255,255,255,0.12);border-radius:14px;overflow:hidden;}
  .vp-stat-item{flex:1;padding:14px 16px;display:flex;flex-direction:column;align-items:center;gap:4px;border-right:1px solid rgba(255,255,255,0.15);}
  .vp-stat-item:last-child{border-right:none;}
  .vp-stat-val{font-size:18px;font-weight:900;color:white;}
  .vp-stat-label{font-size:11px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:.4px;}
  @media(max-width:600px){.vp-title{font-size:22px;}.vp-header-card{padding:24px 20px;}.vp-nav-link span{display:none;}}
`;
