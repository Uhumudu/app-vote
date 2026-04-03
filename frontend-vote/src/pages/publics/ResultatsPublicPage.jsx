// src/pages/public/ResultatsPublicPage.jsx
// Page de résultats en temps réel d'une élection publique.
// Accessible sans compte. Rafraîchissement automatique toutes les 10s.
// Route : /resultats/:id
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft, FiLoader, FiRefreshCw, FiClock,
  FiUsers, FiShare2, FiCheckCircle,
} from "react-icons/fi";
import { BarChart3, Trophy, Vote } from "lucide-react";
import api from "../../services/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = d => new Date(d).toLocaleDateString("fr-FR", {
  day: "2-digit", month: "long", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

const timeLeft = (dateFin) => {
  const diff = new Date(dateFin) - new Date();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 24) return `${Math.floor(h/24)}j ${h%24}h restant${Math.floor(h/24) > 1 ? "s" : ""}`;
  if (h > 0)  return `${h}h ${m}m restantes`;
  return `${m}m ${s}s restantes`;
};

// ─── Podium (top 3) ──────────────────────────────────────────────────────────
function Podium({ candidats }) {
  if (candidats.length < 1) return null;

  const top3  = candidats.slice(0, 3);
  // Réordonner : 2e à gauche, 1er au centre, 3e à droite
  const order = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
    ? [top3[1], top3[0]]
    : [top3[0]];

  const heights = [120, 160, 90];   // 2e, 1er, 3e
  const medals  = ["🥈", "🥇", "🥉"];
  const colors  = [
    { bg: "#e2e8f0", text: "#475569", shadow: "rgba(71,85,105,0.2)" },
    { bg: "#fef3c7", text: "#d97706", shadow: "rgba(217,119,6,0.35)" },
    { bg: "#ffe4e6", text: "#e11d48", shadow: "rgba(225,29,72,0.2)" },
  ];

  const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);

  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      gap: 12, padding: "24px 0 0",
    }}>
      {order.map((c, i) => {
        if (!c) return null;
        const isFirst = (top3.length >= 3 && i === 1) || (top3.length < 3 && i === order.length - 1 && candidats[0]?.id === c.id);
        const col = colors[i];
        const h   = heights[i] || 90;
        const pct = totalVotes > 0 ? Math.round((Number(c.nb_votes) / totalVotes) * 100) : 0;
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: .5 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
          >
            {/* Avatar */}
            <div style={{
              width: isFirst ? 60 : 48, height: isFirst ? 60 : 48,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${col.bg}, ${col.bg}cc)`,
              border: `3px solid ${col.text}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isFirst ? 24 : 18,
              boxShadow: `0 4px 16px ${col.shadow}`,
            }}>
              {medals[i]}
            </div>
            {/* Nom */}
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 800, fontSize: isFirst ? 14 : 12, color: "#1e1b4b", margin: "0 0 2px", maxWidth: 100, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.prenom} {c.nom}
              </p>
              <p style={{ fontSize: 12, color: "#4f46e5", fontWeight: 700, margin: 0 }}>
                {c.nb_votes} vote{Number(c.nb_votes) > 1 ? "s" : ""} · {pct}%
              </p>
            </div>
            {/* Barre podium */}
            <div style={{
              width: isFirst ? 100 : 80,
              height: h,
              background: `linear-gradient(180deg, ${col.bg} 0%, ${col.bg}aa 100%)`,
              border: `2px solid ${col.text}30`,
              borderRadius: "10px 10px 0 0",
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

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ResultatsPublicPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();

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

  // Premier chargement
  useEffect(() => { fetchData(); }, [fetchData]);

  // Rafraîchissement automatique toutes les 10s si en cours
  useEffect(() => {
    if (!data?.election || !["EN_COURS", "APPROUVEE"].includes(data.election.statut)) return;
    const iv = setInterval(fetchData, 10000);
    return () => clearInterval(iv);
  }, [data?.election?.statut, fetchData]);

  // Compte à rebours si EN_COURS
  useEffect(() => {
    if (!data?.election?.date_fin) return;
    const iv = setInterval(() => {
      setCountdown(timeLeft(data.election.date_fin) || "");
    }, 1000);
    return () => clearInterval(iv);
  }, [data?.election?.date_fin]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: data?.election?.titre, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Outfit, sans-serif" }}>
      <FiLoader size={32} color="#4f46e5" style={{ animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (errPage) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"Outfit, sans-serif", gap:16, color:"#64748b" }}>
      <span style={{ fontSize:48 }}>📊</span>
      <p style={{ fontSize:18, fontWeight:700, color:"#1e1b4b" }}>{errPage}</p>
      <button onClick={() => navigate("/")} style={{ padding:"10px 24px", borderRadius:10, background:"#4f46e5", color:"white", border:"none", fontFamily:"inherit", fontWeight:700, cursor:"pointer" }}>
        Retour à l'accueil
      </button>
    </div>
  );

  const { election, candidats } = data;
  const totalVotes  = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);
  const enCours     = election.statut === "EN_COURS";
  const terminee    = election.statut === "TERMINEE";
  const leader      = candidats[0];
  const hasWinner   = terminee && leader && Number(leader.nb_votes) > 0;

  return (
    <>
      <style>{pageStyles}</style>
      <div className="rp-root">
        <div className="rp-orb rp-orb-1" />
        <div className="rp-orb rp-orb-2" />

        {/* ── Navbar ── */}
        <nav className="rp-nav">
          <div className="rp-nav-inner">
            <a href="/" className="rp-logo">🗳 <strong>EVote</strong></a>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {enCours && (
                <button onClick={fetchData} className="rp-btn-ghost" title="Rafraîchir">
                  <FiRefreshCw size={14} /> Actualiser
                </button>
              )}
              <button onClick={handleShare} className="rp-btn-ghost">
                {copied ? <><FiCheckCircle size={14} color="#22c55e" /> Copié !</> : <><FiShare2 size={14} /> Partager</>}
              </button>
              <button onClick={() => navigate(-1)} className="rp-back">
                <FiArrowLeft size={14} /> Retour
              </button>
            </div>
          </div>
        </nav>

        <main className="rp-main">

          {/* ── Header élection ── */}
          <motion.div
            className="rp-header"
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
          >
            {/* Bandeau winner si terminée */}
            {hasWinner && (
              <div style={{
                background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)",
                borderRadius:12, padding:"10px 16px", marginBottom:20,
                display:"flex", alignItems:"center", gap:10,
              }}>
                <Trophy size={18} color="white" />
                <span style={{ fontSize:14, fontWeight:700, color:"white" }}>
                  🎉 Résultat final — Vainqueur : {leader.prenom} {leader.nom} avec {leader.nb_votes} votes ({totalVotes > 0 ? Math.round(Number(leader.nb_votes)/totalVotes*100) : 0}%)
                </span>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
              <div style={{ flex:1 }}>
                <div className="rp-badge-row">
                  <span className={`rp-statut ${enCours ? "rp-statut--green" : terminee ? "rp-statut--gray" : "rp-statut--blue"}`}>
                    {enCours && <span className="rp-dot" />}
                    {enCours ? "En cours" : terminee ? "Terminée" : "À venir"}
                  </span>
                  <span className="rp-public-badge">🌐 Publique</span>
                  <span className="rp-type-badge">{election.type}</span>
                </div>
                <h1 className="rp-title">{election.titre}</h1>
                {election.description && (
                  <p className="rp-desc">{election.description}</p>
                )}
              </div>

              {/* Compte à rebours */}
              {enCours && countdown && (
                <div style={{
                  background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)",
                  borderRadius:14, padding:"14px 20px", textAlign:"center", flexShrink:0,
                }}>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600, textTransform:"uppercase", letterSpacing:.5, margin:"0 0 6px" }}>
                    <FiClock size={11}/> Temps restant
                  </p>
                  <p style={{ fontSize:20, fontWeight:900, color:"white", margin:0, letterSpacing:-0.5 }}>
                    {countdown}
                  </p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="rp-stats-row">
              {[
                { icon:<FiUsers size={14}/>, label:"Candidats",     value: candidats.length },
                { icon:<Vote size={14}/>,    label:"Votes total",   value: totalVotes },
                { icon:<BarChart3 size={14}/>,label:"Mise à jour",  value: lastUpdate.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit", second:"2-digit" }) },
              ].map((s, i) => (
                <div key={i} className="rp-stat-item">
                  {s.icon}
                  <span className="rp-stat-val">{s.value}</span>
                  <span className="rp-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Corps ── */}
          <div className="rp-body">

            {candidats.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 24px", background:"white", borderRadius:20, border:"1px solid #f0f0f0" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🕐</div>
                <p style={{ fontWeight:600, color:"#64748b" }}>Aucun candidat approuvé pour l'instant</p>
              </div>
            ) : (
              <>
                {/* Podium (visible si ≥ 1 vote) */}
                {totalVotes > 0 && (
                  <div className="rp-card">
                    <h2 className="rp-section-title">
                      <Trophy size={18} color="#f59e0b" /> Podium
                    </h2>
                    <Podium candidats={candidats} />
                    <div style={{ height:4, background:"#e2e8f0", borderRadius:0, marginTop:0, borderTop:"2px solid #e2e8f0" }} />
                    <p style={{ fontSize:11, color:"#94a3b8", textAlign:"center", marginTop:12 }}>
                      <FiRefreshCw size={10}/> Résultats mis à jour automatiquement
                      {enCours && " · Dernier vote à " + lastUpdate.toLocaleTimeString("fr-FR")}
                    </p>
                  </div>
                )}

                {/* Classement complet */}
                <div className="rp-card">
                  <h2 className="rp-section-title">
                    <BarChart3 size={18} color="#4f46e5" /> Classement complet
                  </h2>

                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <AnimatePresence>
                      {candidats.map((c, idx) => {
                        const pct      = totalVotes > 0 ? Number(c.nb_votes) / totalVotes * 100 : 0;
                        const isLeader = idx === 0 && Number(c.nb_votes) > 0;
                        const pctLabel = totalVotes > 0 ? `${Math.round(pct)}%` : "—";

                        return (
                          <motion.div
                            key={c.id}
                            layout
                            initial={{ opacity:0, x:-20 }}
                            animate={{ opacity:1, x:0 }}
                            transition={{ delay: idx * 0.05 }}
                            style={{
                              background: isLeader ? "linear-gradient(135deg,#fef9ee,#fef3c7)" : "#fafafa",
                              border: isLeader ? "2px solid #fde68a" : "1px solid #f0f0f0",
                              borderRadius:16, padding:"16px 20px",
                              boxShadow: isLeader ? "0 4px 16px rgba(245,158,11,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                            }}
                          >
                            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                              {/* Rang */}
                              <div style={{
                                width:36, height:36, borderRadius:10, flexShrink:0,
                                background: idx === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)"
                                          : idx === 1 ? "#e2e8f0"
                                          : idx === 2 ? "#fee2e2" : "#f1f5f9",
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize: idx < 3 ? 18 : 14,
                                fontWeight:800,
                                color: idx === 0 ? "white" : idx === 1 ? "#475569" : idx === 2 ? "#e11d48" : "#94a3b8",
                              }}>
                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx+1}`}
                              </div>

                              {/* Nom + barre */}
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                    <span style={{ fontWeight:800, fontSize:15, color:"#1e1b4b" }}>
                                      {c.prenom} {c.nom}
                                    </span>
                                    {isLeader && !terminee && (
                                      <span style={{ background:"#fef3c7", color:"#d97706", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999 }}>
                                        En tête
                                      </span>
                                    )}
                                    {isLeader && terminee && (
                                      <span style={{ background:"#f0fdf4", color:"#15803d", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999 }}>
                                        🏆 Vainqueur
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ textAlign:"right", flexShrink:0 }}>
                                    <span style={{ fontWeight:900, fontSize:16, color:"#4f46e5" }}>{c.nb_votes}</span>
                                    <span style={{ fontSize:12, color:"#94a3b8", marginLeft:3 }}>votes</span>
                                    <span style={{ fontSize:12, color:"#94a3b8", marginLeft:8 }}>({pctLabel})</span>
                                  </div>
                                </div>

                                {/* Barre animée */}
                                <div style={{ height:8, background:"#e2e8f0", borderRadius:999, overflow:"hidden" }}>
                                  <motion.div
                                    initial={{ width:0 }}
                                    animate={{ width:`${pct}%` }}
                                    transition={{ duration:.8, ease:"easeOut" }}
                                    style={{
                                      height:"100%", borderRadius:999,
                                      background: idx === 0 ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                                                : idx === 1 ? "linear-gradient(90deg,#94a3b8,#cbd5e1)"
                                                : idx === 2 ? "linear-gradient(90deg,#f87171,#fca5a5)"
                                                : "linear-gradient(90deg,#818cf8,#a5b4fc)",
                                    }}
                                  />
                                </div>

                                {c.bio && (
                                  <p style={{ fontSize:12, color:"#64748b", margin:"6px 0 0", lineHeight:1.5 }}>
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
                <div className="rp-card">
                  <h2 className="rp-section-title"><FiClock size={16} color="#6366f1" /> Informations</h2>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {[
                      { label:"Début",         value: formatDate(election.date_debut) },
                      { label:"Fin",           value: formatDate(election.date_fin) },
                      { label:"Type scrutin",  value: election.type },
                      { label:"Frais de vote", value: election.frais_vote_xaf ? `${election.frais_vote_xaf} XAF` : "—" },
                    ].map((r, i) => (
                      <div key={i} style={{ background:"#f8fafc", borderRadius:10, padding:"12px 16px", border:"1px solid #f0f0f0" }}>
                        <p style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:.5, margin:"0 0 4px" }}>{r.label}</p>
                        <p style={{ fontSize:14, fontWeight:700, color:"#1e1b4b", margin:0 }}>{r.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA voter */}
                {enCours && (
                  <div style={{
                    background:"linear-gradient(135deg,#eef2ff,#e0e7ff)",
                    border:"1.5px solid #c7d2fe", borderRadius:18,
                    padding:"24px 28px",
                    display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap",
                  }}>
                    <div>
                      <p style={{ fontWeight:800, color:"#3730a3", margin:"0 0 4px", fontSize:16 }}>
                        🗳 Vous pouvez encore voter !
                      </p>
                      <p style={{ fontSize:13, color:"#6366f1", margin:0 }}>
                        Chaque vote coûte <strong>{election.frais_vote_xaf || 500} XAF</strong> via Mobile Money.
                        Votez autant de fois que vous voulez.
                      </p>
                    </div>
                    <a
                      href={`/voter/${id}`}
                      style={{
                        display:"inline-flex", alignItems:"center", gap:8,
                        padding:"12px 24px", borderRadius:12,
                        background:"linear-gradient(135deg,#4f46e5,#6366f1)",
                        color:"white", textDecoration:"none", fontSize:14, fontWeight:700,
                        boxShadow:"0 4px 14px rgba(79,70,229,0.35)",
                        whiteSpace:"nowrap", flexShrink:0,
                      }}
                    >
                      Voter maintenant →
                    </a>
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
  .rp-root{min-height:100vh;font-family:'Outfit',sans-serif;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow-x:hidden;}
  .rp-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
  .rp-orb-1{width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%);top:-180px;left:-180px;}
  .rp-orb-2{width:380px;height:380px;background:radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%);bottom:-100px;right:-80px;}
  .rp-nav{position:relative;z-index:10;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);box-shadow:0 1px 16px rgba(0,0,0,0.05);}
  .rp-nav-inner{max-width:860px;margin:0 auto;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;gap:10;}
  .rp-logo{display:flex;align-items:center;gap:8px;text-decoration:none;font-size:18px;font-weight:700;color:#4f46e5;}
  .rp-btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
  .rp-btn-ghost:hover{background:#eef2ff;color:#4f46e5;border-color:#c7d2fe;}
  .rp-back{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
  .rp-back:hover{background:#f8fafc;}
  .rp-main{position:relative;z-index:1;padding:40px 24px 80px;max-width:860px;margin:0 auto;}
  .rp-header{background:linear-gradient(135deg,#4f46e5,#4338ca);border-radius:24px;padding:32px;margin-bottom:24px;box-shadow:0 12px 48px rgba(79,70,229,0.25);}
  .rp-badge-row{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
  .rp-statut{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;}
  .rp-statut--green{background:#f0fdf4;color:#15803d;}
  .rp-statut--gray{background:#f1f5f9;color:#64748b;}
  .rp-statut--blue{background:#eff6ff;color:#1d4ed8;}
  .rp-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;animation:blink 1.2s ease-in-out infinite;flex-shrink:0;}
  .rp-public-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.15);color:rgba(255,255,255,.9);padding:5px 12px;border-radius:999px;font-size:11px;font-weight:600;}
  .rp-type-badge{display:inline-block;background:rgba(255,255,255,0.10);color:rgba(255,255,255,.8);padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;}
  .rp-title{font-size:26px;font-weight:900;color:white;letter-spacing:-0.5px;margin-bottom:8px;line-height:1.2;}
  .rp-desc{font-size:14px;color:rgba(255,255,255,0.72);line-height:1.6;margin:0;}
  .rp-stats-row{display:flex;background:rgba(255,255,255,0.12);border-radius:14px;overflow:hidden;margin-top:24px;}
  .rp-stat-item{flex:1;padding:14px;display:flex;flex-direction:column;align-items:center;gap:4px;border-right:1px solid rgba(255,255,255,0.15);}
  .rp-stat-item:last-child{border-right:none;}
  .rp-stat-val{font-size:16px;font-weight:900;color:white;}
  .rp-stat-label{font-size:10px;color:rgba(255,255,255,0.65);font-weight:600;text-transform:uppercase;letter-spacing:.4px;}
  .rp-body{display:flex;flex-direction:column;gap:20px;}
  .rp-card{background:white;border-radius:20px;border:1px solid #f0f0f0;box-shadow:0 2px 16px rgba(0,0,0,0.05);padding:24px 28px;}
  .rp-section-title{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:800;color:#1e1b4b;margin-bottom:20px;letter-spacing:-0.2px;}
  @media(max-width:600px){
    .rp-title{font-size:20px;}
    .rp-header{padding:24px 20px;}
    .rp-card{padding:20px 18px;}
    .rp-stats-row .rp-stat-label{display:none;}
  }
`;
