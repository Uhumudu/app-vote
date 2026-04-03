// src/pages/public/DashboardPublicPage.jsx
// Tableau de bord pour : CANDIDATS (via candidat_id) et ÉLECTEURS (via téléphone)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft, FiLoader, FiPhone, FiCheckCircle,
  FiTrendingUp, FiCalendar, FiAward,
} from "react-icons/fi";
import { BarChart3, Users, Vote } from "lucide-react";
import api from "../../services/api";

const formatDate = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
const formatDateShort = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });

// ─── PAGE PRINCIPALE : routing mode (candidat | electeur) ────────────────────
export default function DashboardPublicPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "electeur"; // "candidat" | "electeur"

  if (mode === "candidat") return <DashboardCandidat />;
  return <DashboardElecteur />;
}

// ─── DASHBOARD ÉLECTEUR ───────────────────────────────────────────────────────
function DashboardElecteur() {
  const navigate = useNavigate();
  const [telephone, setTelephone] = useState("");
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [errMsg,    setErrMsg]    = useState("");

  const handleRecherche = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{9}$/.test(telephone)) {
      setErrMsg("Saisissez 9 chiffres (sans le +237).");
      return;
    }
    setLoading(true);
    setErrMsg("");
    try {
      const { data: res } = await api.get(`/public-elections/dashboard/electeur/237${telephone}`);
      setData(res);
    } catch {
      setErrMsg("Aucun vote trouvé pour ce numéro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="db-root">
        <div className="db-orb db-orb-1" /><div className="db-orb db-orb-2" />

        {/* Nav */}
        <nav className="db-nav">
          <div className="db-nav-inner">
            <a href="/" className="db-logo">🗳 <strong>EVote</strong></a>
            <div style={{ display: "flex", gap: 10 }}>
              <a href="/dashboard-candidat" className="db-nav-link">Dashboard candidat</a>
              <button onClick={() => navigate(-1)} className="db-back"><FiArrowLeft size={14}/> Retour</button>
            </div>
          </div>
        </nav>

        <main className="db-main">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}>

            {/* Hero */}
            <div className="db-hero">
              <div className="db-hero-icon"><Vote size={28} color="white"/></div>
              <h1 className="db-hero-title">Mon tableau de bord électeur</h1>
              <p className="db-hero-sub">Consultez tous vos votes et les élections auxquelles vous avez participé.</p>
            </div>

            {/* Formulaire téléphone */}
            {!data && (
              <div className="db-search-card">
                <h2 className="db-card-title">
                  <FiPhone size={18} color="#6366f1" /> Entrez votre numéro
                </h2>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                  Votre numéro est utilisé comme identifiant électeur. Saisissez celui avec lequel vous avez voté.
                </p>
                <form onSubmit={handleRecherche} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{
                    flex: 1, minWidth: 240, display: "flex",
                    border: "2px solid #e0e7ff", borderRadius: 14, overflow: "hidden",
                  }}>
                    <span style={{
                      padding: "12px 16px", background: "#eef2ff", color: "#6366f1",
                      fontWeight: 800, fontSize: 15, borderRight: "2px solid #e0e7ff",
                      whiteSpace: "nowrap",
                    }}>+237</span>
                    <input
                      type="tel" maxLength={9} placeholder="6XXXXXXXX"
                      value={telephone} onChange={e => setTelephone(e.target.value.replace(/\D/g,""))}
                      style={{
                        flex:1, border:"none", outline:"none", padding:"12px 16px",
                        fontSize:16, fontFamily:"Outfit,sans-serif", letterSpacing:2,
                        background:"transparent", color:"#1e293b",
                      }}
                    />
                  </div>
                  <button type="submit" disabled={loading || telephone.length !== 9} style={{
                    padding:"12px 24px", borderRadius:14, border:"none",
                    background: telephone.length === 9 ? "linear-gradient(135deg,#4f46e5,#6366f1)" : "#e2e8f0",
                    color: telephone.length === 9 ? "white" : "#94a3b8",
                    fontWeight:700, fontSize:14, fontFamily:"inherit", cursor:"pointer",
                    boxShadow: telephone.length === 9 ? "0 4px 14px rgba(79,70,229,0.30)" : "none",
                  }}>
                    {loading ? <FiLoader size={16} style={{ animation:"spin 1s linear infinite" }}/> : "Voir mes votes"}
                  </button>
                </form>
                {errMsg && <p style={{ fontSize:13, color:"#dc2626", marginTop:12, fontWeight:600 }}>{errMsg}</p>}
              </div>
            )}

            {/* Résultats */}
            {data && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                {/* Stats */}
                <div className="db-stats-row">
                  {[
                    { label:"Élections participées", value: data.stats.length,                                          icon:<FiCalendar size={20} color="#6366f1"/>, color:"#eef2ff" },
                    { label:"Votes confirmés",        value: data.votes.filter(v => v.statut_paiement==="PAYÉ").length, icon:<FiCheckCircle size={20} color="#22c55e"/>, color:"#f0fdf4" },
                    { label:"Total dépensé (XAF)",    value: data.stats.reduce((s,x)=>s+x.total_dépensé,0),             icon:<FiTrendingUp size={20} color="#f59e0b"/>, color:"#fffbeb" },
                  ].map((s,i) => (
                    <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*.08 }} className="db-stat-card" style={{ background: s.color }}>
                      <div style={{ marginBottom:8 }}>{s.icon}</div>
                      <p className="db-stat-val">{s.value}</p>
                      <p className="db-stat-label">{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Par élection */}
                {data.stats.map((el, i) => (
                  <motion.div key={i} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*.08 }} className="db-section-card">
                    <div className="db-section-header">
                      <div>
                        <h3 className="db-section-title">{el.election_titre}</h3>
                        <span className={`db-statut ${el.election_statut === "EN_COURS" ? "db-statut--green" : "db-statut--gray"}`}>
                          {el.election_statut === "EN_COURS" ? "En cours" : el.election_statut}
                        </span>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ fontSize:11, color:"#94a3b8" }}>Votes donnés</p>
                        <p style={{ fontSize:22, fontWeight:900, color:"#4f46e5" }}>{el.nb_votes}</p>
                        <p style={{ fontSize:11, color:"#94a3b8" }}>{el.total_dépensé} XAF</p>
                      </div>
                    </div>

                    {/* Liste des votes pour cette élection */}
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:14 }}>
                      {data.votes.filter(v => v.election_titre === el.election_titre && v.statut_paiement === "PAYÉ").map((v,j) => (
                        <div key={j} style={{
                          display:"flex", alignItems:"center", justifyContent:"space-between",
                          padding:"10px 14px", background:"#f8faff",
                          border:"1px solid #e0e7ff", borderRadius:10, flexWrap:"wrap", gap:8,
                        }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", flexShrink:0 }}/>
                            <span style={{ fontWeight:700, fontSize:14, color:"#1e1b4b" }}>
                              {v.candidat_prenom} {v.candidat_nom}
                            </span>
                          </div>
                          <span style={{ fontSize:12, color:"#94a3b8" }}>{formatDate(v.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                <button onClick={() => { setData(null); setTelephone(""); }} style={{
                  alignSelf:"center", padding:"10px 24px", borderRadius:10, border:"1.5px solid #e0e7ff",
                  background:"white", color:"#6366f1", fontWeight:600, cursor:"pointer", fontFamily:"inherit", fontSize:14,
                }}>
                  Rechercher un autre numéro
                </button>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
}

// ─── DASHBOARD CANDIDAT ───────────────────────────────────────────────────────
function DashboardCandidat() {
  const navigate    = useNavigate();
  const [candidatId, setCandidatId] = useState("");
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [errMsg,     setErrMsg]     = useState("");

  const handleRecherche = async (e) => {
    e.preventDefault();
    if (!candidatId || isNaN(candidatId)) {
      setErrMsg("Saisissez un ID candidat valide.");
      return;
    }
    setLoading(true);
    setErrMsg("");
    try {
      const { data: res } = await api.get(`/public-elections/dashboard/candidat/${candidatId}`);
      setData(res);
    } catch {
      setErrMsg("Candidat introuvable.");
    } finally {
      setLoading(false);
    }
  };

  const maxVotes = data?.classement?.[0]?.nb_votes || 0;
  const rang     = data ? data.classement.findIndex(c => c.id === data.candidat.id) + 1 : 0;

  return (
    <>
      <style>{styles}</style>
      <div className="db-root">
        <div className="db-orb db-orb-1"/><div className="db-orb db-orb-2"/>

        {/* Nav */}
        <nav className="db-nav">
          <div className="db-nav-inner">
            <a href="/" className="db-logo">🗳 <strong>EVote</strong></a>
            <div style={{ display:"flex", gap:10 }}>
              <a href="/dashboard-electeur" className="db-nav-link">Dashboard électeur</a>
              <button onClick={() => navigate(-1)} className="db-back"><FiArrowLeft size={14}/> Retour</button>
            </div>
          </div>
        </nav>

        <main className="db-main">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}>

            {/* Hero */}
            <div className="db-hero" style={{ background:"linear-gradient(135deg,#0f766e,#0d9488)" }}>
              <div className="db-hero-icon" style={{ background:"rgba(255,255,255,0.15)" }}>
                <FiAward size={28} color="white"/>
              </div>
              <h1 className="db-hero-title">Mon tableau de bord candidat</h1>
              <p className="db-hero-sub">Suivez vos votes reçus et votre classement en temps réel.</p>
            </div>

            {/* Formulaire ID */}
            {!data && (
              <div className="db-search-card">
                <h2 className="db-card-title">
                  <FiAward size={18} color="#0f766e" /> Entrez votre ID candidat
                </h2>
                <p style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>
                  Votre ID candidat vous a été communiqué lors de la soumission de votre candidature (confirmez avec l'admin si perdu).
                </p>
                <form onSubmit={handleRecherche} style={{ display:"flex", gap:10 }}>
                  <input
                    type="number" placeholder="Ex : 12" min="1"
                    value={candidatId} onChange={e => setCandidatId(e.target.value)}
                    style={{
                      flex:1, padding:"12px 16px", border:"2px solid #ccfbf1",
                      borderRadius:12, fontSize:16, fontFamily:"Outfit,sans-serif",
                      color:"#1e293b", background:"#f0fdfa", outline:"none",
                    }}
                  />
                  <button type="submit" disabled={loading || !candidatId} style={{
                    padding:"12px 24px", borderRadius:12, border:"none",
                    background: candidatId ? "linear-gradient(135deg,#0f766e,#0d9488)" : "#e2e8f0",
                    color: candidatId ? "white" : "#94a3b8",
                    fontWeight:700, fontSize:14, fontFamily:"inherit", cursor:"pointer",
                    boxShadow: candidatId ? "0 4px 14px rgba(15,118,110,0.30)" : "none",
                  }}>
                    {loading ? <FiLoader size={16} style={{ animation:"spin 1s linear infinite" }}/> : "Voir mon tableau de bord"}
                  </button>
                </form>
                {errMsg && <p style={{ fontSize:13, color:"#dc2626", marginTop:12, fontWeight:600 }}>{errMsg}</p>}
              </div>
            )}

            {/* Dashboard candidat */}
            {data && (
              <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

                {/* Profil + stats */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, flexWrap:"wrap" }}>
                  {/* Profil */}
                  <div className="db-section-card" style={{ gridColumn:"span 1" }}>
                    <h3 className="db-card-title" style={{ marginBottom:16 }}>
                      <FiAward size={16} color="#0f766e"/> Mon profil
                    </h3>
                    <p style={{ fontSize:20, fontWeight:900, color:"#1e1b4b", marginBottom:4 }}>
                      {data.candidat.prenom} {data.candidat.nom}
                    </p>
                    <p style={{ fontSize:12, color:"#64748b", marginBottom:12, lineHeight:1.5 }}>
                      {data.candidat.bio || "Aucune biographie."}
                    </p>
                    <div style={{ padding:"10px 14px", background:"#f0fdfa", borderRadius:10, border:"1px solid #ccfbf1" }}>
                      <p style={{ fontSize:11, color:"#0f766e", fontWeight:700, margin:"0 0 2px" }}>Élection</p>
                      <p style={{ fontSize:13, fontWeight:600, color:"#134e4a", margin:0 }}>{data.candidat.election_titre}</p>
                      <p style={{ fontSize:11, color:"#64748b", margin:"4px 0 0" }}>
                        {formatDateShort(data.candidat.date_debut)} → {formatDateShort(data.candidat.date_fin)}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  {[
                    { label:"Votes reçus",  value: data.votes.length,     icon:<Vote size={22} color="#0f766e"/>,     color:"#f0fdfa", border:"#ccfbf1" },
                    { label:"Rang actuel",  value: `#${rang}`,            icon:<FiTrendingUp size={22} color="#f59e0b"/>, color:"#fffbeb", border:"#fde68a" },
                  ].map((s,i) => (
                    <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*.08 }}
                      className="db-stat-card" style={{ background:s.color, border:`1px solid ${s.border}` }}>
                      <div style={{ marginBottom:10 }}>{s.icon}</div>
                      <p className="db-stat-val" style={{ fontSize:32 }}>{s.value}</p>
                      <p className="db-stat-label">{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Classement */}
                <div className="db-section-card">
                  <h3 className="db-card-title" style={{ marginBottom:16 }}>
                    <Users size={16} color="#6366f1"/> Classement des candidats
                  </h3>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {data.classement.map((c, idx) => {
                      const pct = maxVotes > 0 ? Math.round((c.nb_votes / maxVotes) * 100) : 0;
                      const isMe = c.id === data.candidat.id;
                      return (
                        <div key={c.id} style={{
                          display:"flex", alignItems:"center", gap:12,
                          padding:"12px 16px",
                          background: isMe ? "#f0fdfa" : "#f8fafc",
                          border: isMe ? "2px solid #0d9488" : "1px solid #f0f0f0",
                          borderRadius:12,
                        }}>
                          <span style={{
                            width:28, height:28, borderRadius:8, flexShrink:0,
                            background: idx === 0 ? "#f59e0b" : "#e5e7eb",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize: idx === 0 ? "14px" : "13px", fontWeight:800,
                            color: idx === 0 ? "white" : "#6b7280",
                          }}>
                            {idx === 0 ? "🥇" : `#${idx+1}`}
                          </span>
                          <div style={{ flex:1, minWidth:120 }}>
                            <p style={{ fontWeight:700, fontSize:14, color: isMe ? "#0f766e" : "#1e1b4b", margin:0 }}>
                              {c.prenom} {c.nom} {isMe && <span style={{ fontSize:11, color:"#0d9488" }}>(moi)</span>}
                            </p>
                            <div style={{ height:5, background:"#e2e8f0", borderRadius:999, overflow:"hidden", marginTop:6 }}>
                              <motion.div
                                initial={{ width:0 }}
                                animate={{ width:`${pct}%` }}
                                transition={{ duration:.8, ease:"easeOut" }}
                                style={{
                                  height:"100%",
                                  background: isMe ? "linear-gradient(90deg,#0d9488,#14b8a6)" : "#c7d2fe",
                                  borderRadius:999,
                                }}
                              />
                            </div>
                          </div>
                          <span style={{ fontWeight:900, fontSize:16, color: isMe ? "#0f766e" : "#6366f1", flexShrink:0 }}>
                            {c.nb_votes} <span style={{ fontSize:11, fontWeight:500, color:"#94a3b8" }}>votes</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Historique votes reçus */}
                {data.votes.length > 0 && (
                  <div className="db-section-card">
                    <h3 className="db-card-title" style={{ marginBottom:16 }}>
                      <FiCheckCircle size={16} color="#22c55e"/> Votes reçus ({data.votes.length})
                    </h3>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {data.votes.map((v, i) => (
                        <div key={i} style={{
                          display:"flex", alignItems:"center", justifyContent:"space-between",
                          padding:"10px 14px", background:"#f8fafc",
                          border:"1px solid #f0f0f0", borderRadius:10, flexWrap:"wrap", gap:8,
                        }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e" }}/>
                            <span style={{ fontSize:14, fontWeight:600, color:"#1e1b4b" }}>
                              {v.nom_electeur || "Électeur anonyme"}
                            </span>
                          </div>
                          <span style={{ fontSize:12, color:"#94a3b8" }}>{formatDate(v.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => { setData(null); setCandidatId(""); }} style={{
                  alignSelf:"center", padding:"10px 24px", borderRadius:10, border:"1.5px solid #ccfbf1",
                  background:"white", color:"#0f766e", fontWeight:600, cursor:"pointer", fontFamily:"inherit", fontSize:14,
                }}>
                  Rechercher un autre candidat
                </button>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
}

// ─── Styles partagés ─────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .db-root{min-height:100vh;font-family:'Outfit',sans-serif;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow-x:hidden;}
  .db-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
  .db-orb-1{width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%);top:-180px;left:-180px;}
  .db-orb-2{width:380px;height:380px;background:radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%);bottom:-100px;right:-80px;}
  .db-nav{position:relative;z-index:10;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);box-shadow:0 1px 16px rgba(0,0,0,0.05);}
  .db-nav-inner{max-width:860px;margin:0 auto;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;}
  .db-logo{display:flex;align-items:center;gap:8px;text-decoration:none;font-size:18px;font-weight:700;color:#4f46e5;}
  .db-nav-link{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;background:transparent;color:#64748b;font-size:13px;font-weight:600;text-decoration:none;transition:all .15s;}
  .db-nav-link:hover{background:#eef2ff;color:#4f46e5;}
  .db-back{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
  .db-back:hover{background:#f8fafc;}
  .db-main{position:relative;z-index:1;padding:40px 24px 80px;max-width:860px;margin:0 auto;}
  .db-hero{background:linear-gradient(135deg,#4f46e5,#4338ca);border-radius:24px;padding:36px;text-align:center;margin-bottom:28px;box-shadow:0 12px 48px rgba(79,70,229,0.25);}
  .db-hero-icon{width:72px;height:72px;border-radius:20px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;}
  .db-hero-title{font-size:26px;font-weight:900;color:white;letter-spacing:-0.4px;margin-bottom:10px;}
  .db-hero-sub{font-size:14px;color:rgba(255,255,255,0.75);line-height:1.6;}
  .db-search-card{background:white;border-radius:20px;border:1px solid #f0f0f0;box-shadow:0 2px 20px rgba(0,0,0,0.06);padding:28px 32px;margin-bottom:24px;}
  .db-card-title{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800;color:#1e1b4b;margin-bottom:8px;}
  .db-stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
  .db-stat-card{background:white;border-radius:18px;padding:24px;text-align:center;border:1px solid #f0f0f0;box-shadow:0 2px 12px rgba(0,0,0,0.04);}
  .db-stat-val{font-size:28px;font-weight:900;color:#1e1b4b;margin:4px 0;}
  .db-stat-label{font-size:12px;color:#64748b;font-weight:500;}
  .db-section-card{background:white;border-radius:20px;border:1px solid #f0f0f0;box-shadow:0 2px 12px rgba(0,0,0,0.04);padding:24px 28px;}
  .db-section-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12;margin-bottom:14px;}
  .db-section-title{font-size:16px;font-weight:800;color:#1e1b4b;margin-bottom:6px;}
  .db-statut{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;}
  .db-statut--green{background:#f0fdf4;color:#15803d;}
  .db-statut--gray{background:#f1f5f9;color:#64748b;}
  @media(max-width:640px){.db-stats-row{grid-template-columns:1fr 1fr;}.db-search-card{padding:20px;}.db-hero{padding:24px 20px;}}
`;
