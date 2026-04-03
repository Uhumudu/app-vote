// src/pages/home/HomePage.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Vote, BarChart3, CheckCircle, ArrowRight, Globe } from "lucide-react";
import { FiLogIn, FiSearch, FiTag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import accueilIMG from "./accueil.png";
import api from "../../services/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// Dégradé déterministe si pas de photo
const getGradient = (titre = "") => {
  const gradients = [
    "linear-gradient(135deg,#e63946,#f4a261)",
    "linear-gradient(135deg,#2d6a4f,#74c69d)",
    "linear-gradient(135deg,#023e8a,#48cae4)",
    "linear-gradient(135deg,#7b2d8b,#e040fb)",
    "linear-gradient(135deg,#f72585,#7209b7)",
    "linear-gradient(135deg,#4cc9f0,#4361ee)",
    "linear-gradient(135deg,#f8961e,#f3722c)",
    "linear-gradient(135deg,#1b4332,#52b788)",
    "linear-gradient(135deg,#6a040f,#d00000)",
    "linear-gradient(135deg,#212529,#495057)",
  ];
  return gradients[titre.charCodeAt(0) % gradients.length];
};

// ─── ElectionCard ─────────────────────────────────────────────────────────────
function ElectionCard({ election, onVoter, onCandidater }) {
  const navigate  = useNavigate();
  const enCours   = election.statut === "EN_COURS";
  const termine   = election.statut === "TERMINEE";
  const hasPhoto  = !!(election.photo_url || election.image_url);

  const BACKEND = "http://localhost:5000";
  const photoSrc = hasPhoto
    ? (election.photo_url?.startsWith("http") || election.image_url?.startsWith("http")
        ? (election.photo_url || election.image_url)
        : `${BACKEND}${election.photo_url || election.image_url}`)
    : null;

  const statutCfg = enCours
    ? { label: "En cours",  dot: "#22c55e", dotAnim: true,  iconPath: null, useDot: true }
    : termine
    ? { label: "Terminé",   dot: null,      dotAnim: false, checkmark: true }
    : { label: "À venir",   dot: "#3b82f6", dotAnim: false, iconPath: null, useDot: true };

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,0,0,0.13)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        background: "white",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        display: "flex", flexDirection: "column",
        border: "1px solid #ececec",
        cursor: "pointer",
      }}
      onClick={() => navigate(`/election-publique/${election.id_election}`)}
    >
      {/* ── IMAGE / COUVERTURE ── */}
      <div style={{
        position: "relative",
        height: "200px",
        background: photoSrc ? "#000" : getGradient(election.titre),
        overflow: "hidden", flexShrink: 0,
      }}>
        {photoSrc ? (
          <img
            src={photoSrc}
            alt={election.titre}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          // Initiales en fond si pas de photo
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontSize: "72px", fontWeight: 900,
              color: "rgba(255,255,255,0.15)",
              textTransform: "uppercase", userSelect: "none",
              letterSpacing: "-4px",
            }}>
              {election.titre?.slice(0, 2)}
            </span>
          </div>
        )}

        {/* Gradient overlay bas pour lisibilité date */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "80px",
          background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
        }} />

        {/* Badge statut — haut gauche */}
        <div style={{
          position: "absolute", top: "12px", left: "12px",
          display: "inline-flex", alignItems: "center", gap: "5px",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          padding: "4px 10px", borderRadius: "999px",
          fontSize: "12px", fontWeight: 700, color: "#1a1a2e",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}>
          {enCours ? (
            <>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#22c55e", display: "inline-block",
                animation: "blink 1.2s ease-in-out infinite",
              }} />
              En cours
            </>
          ) : termine ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span style={{ color: "#64748b" }}>Terminé</span>
            </>
          ) : (
            <>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#3b82f6", display: "inline-block",
              }} />
              À venir
            </>
          )}
        </div>

        {/* Bouton Vote — haut droit */}
        <button
          onClick={e => { e.stopPropagation(); onVoter(election); }}
          style={{
            position: "absolute", top: "12px", right: "12px",
            display: "inline-flex", alignItems: "center", gap: "5px",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            padding: "4px 12px", borderRadius: "999px",
            fontSize: "12px", fontWeight: 700, color: "#1a1a2e",
            border: "none", cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            transition: "background .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "white"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.92)"}
        >
          {/* icone personne */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Vote
        </button>

        {/* Date — bas gauche */}
        <div style={{
          position: "absolute", bottom: "10px", left: "12px",
          fontSize: "11.5px", fontWeight: 700, color: "white",
          display: "flex", alignItems: "center", gap: "5px",
          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {formatDate(election.date_debut)}
        </div>
      </div>

      {/* ── CORPS ── */}
      <div
        style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}
      >
        {/* Titre */}
        <h3 style={{
          margin: 0,
          fontSize: "15px",
          fontWeight: 800,
          color: "#111827",
          textTransform: "uppercase",
          letterSpacing: "-0.1px",
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {election.titre}
        </h3>

        {/* Sous-titre / organisateur */}
        <p style={{
          margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 400,
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {election.prenom_admin} {election.nom_admin}
        </p>

        {/* Description */}
        {election.description && (
          <p style={{
            margin: 0, fontSize: "13px", color: "#374151", lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {election.description}
          </p>
        )}

        {/* Tag type scrutin */}
        <div style={{ marginTop: "auto", paddingTop: "6px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            fontSize: "11px", fontWeight: 600,
            color: "#6b7280", letterSpacing: ".5px",
            textTransform: "uppercase",
          }}>
            <FiTag size={11} />
            {election.type || "Election"}
          </span>
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <div style={{
        padding: "10px 18px 14px",
        borderTop: "1px solid #f4f4f5",
        display: "flex", gap: "8px",
      }}>
        <button
          onClick={e => { e.stopPropagation(); onCandidater(election); }}
          style={{
            flex: 1, padding: "8px 0", borderRadius: "8px",
            border: "1.5px solid #e0e7ff", background: "#f5f3ff",
            color: "#4f46e5", fontSize: "12.5px", fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#ede9fe"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#f5f3ff"; }}
        >
          Se candidater
        </button>
        {enCours && (
          <button
            onClick={e => { e.stopPropagation(); onVoter(election); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg,#4f46e5,#6366f1)",
              color: "white", fontSize: "12.5px", fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 3px 10px rgba(79,70,229,0.30)",
              transition: "opacity .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Voter →
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [elections,   setElections]   = useState([]);
  const [loadingEl,   setLoadingEl]   = useState(true);
  const [searchQ,     setSearchQ]     = useState("");
  const [filterType,  setFilterType]  = useState("all");

  useEffect(() => {
    api.get("/public-elections")
      .then(r => setElections(r.data))
      .catch(console.error)
      .finally(() => setLoadingEl(false));
  }, []);

  const filteredElections = elections.filter(e => {
    const q      = searchQ.toLowerCase();
    const matchQ = !q || e.titre.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
    const matchF =
      filterType === "all"      ? true :
      filterType === "en_cours" ? e.statut === "EN_COURS" :
      filterType === "a_venir"  ? e.statut === "APPROUVEE" : true;
    return matchQ && matchF;
  });

  return (
    <>
      <style>{pageStyles}</style>
      <div className="home-root">

        {/* NAVBAR */}
        <header className="navbar">
          <div className="navbar-inner">
            <div className="navbar-logo">
              <span className="logo-icon">🗳</span>
              <span className="logo-text">EVote</span>
            </div>
            <nav className="navbar-links">
              <a href="#elections" className="nav-link-section">Élections</a>
              <a href="#fonctionnalites" className="nav-link-section">Fonctionnalités</a>
            </nav>
            <div className="navbar-actions">
              <button onClick={() => navigate("/login")} className="navbar-btn-ghost">
                <FiLogIn size={14} /> Connexion
              </button>
              <button onClick={() => navigate("/creer-election")} className="navbar-btn-filled">
                Créer une élection <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="hero" id="accueil">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-grid" />
          <div className="hero-inner">
            <motion.div className="hero-text" initial={{ opacity: 0, x: -36 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <span className="hero-badge">
                <span className="badge-dot" /> Vote électronique sécurisé
              </span>
              <h1 className="hero-title">
                Organisez vos élections{" "}
                <span className="hero-title-accent">facilement et en toute confiance</span>
              </h1>
              <p className="hero-desc">
                Participez aux élections publiques ou organisez les vôtres. Candidatez, votez, suivez les résultats — le tout en quelques clics.
              </p>
              <div className="hero-btns">
                <a href="#elections" className="btn-filled btn-lg" style={{ textDecoration: "none" }}>
                  Voir les élections <ArrowRight size={16} />
                </a>
                <button onClick={() => navigate("/creer-election")} className="btn-outline btn-lg">
                  Organiser une élection
                </button>
              </div>
              <div className="hero-badges">
                <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Vote public ou privé</div>
                <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Paiement Mobile Money</div>
                <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Résultats en direct</div>
              </div>
            </motion.div>
            <motion.div className="hero-img-wrap" initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
              <div className="hero-img-glow" />
              <img src={accueilIMG} alt="Vote en ligne" className="hero-img" />
            </motion.div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats-bar">
          <div className="stats-inner">
            {[
              { value: "247+", label: "Votes traités" },
              { value: "12+",  label: "Élections organisées" },
              { value: "99.9%",label: "Disponibilité" },
              { value: "100%", label: "Résultats transparents" },
            ].map((s, i) => (
              <motion.div key={i} className="stat-item" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ELECTIONS PUBLIQUES */}
        <section id="elections" style={{ padding: "80px 0", background: "#f9fafb" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px" }}>

            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <span style={{
                display: "inline-block", background: "#eef2ff", color: "#4f46e5",
                border: "1px solid #e0e7ff", padding: "4px 14px", borderRadius: "999px",
                fontSize: "11.5px", fontWeight: 600, letterSpacing: ".8px",
                textTransform: "uppercase", marginBottom: "14px",
              }}>
                Elections publiques
              </span>
              <h2 style={{ fontSize: "34px", fontWeight: 800, color: "#111827", letterSpacing: "-0.7px", marginBottom: "10px" }}>
                Participez aux élections ouvertes
              </h2>
              <p style={{ fontSize: "15px", color: "#6b7280", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>
                Candidatez librement ou votez pour vos favoris.
              </p>
            </div>

            {/* Barre recherche + filtres */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
              <div style={{
                flex: 1, minWidth: "240px", display: "flex", alignItems: "center",
                gap: "10px", background: "white", border: "1.5px solid #e5e7eb",
                borderRadius: "12px", padding: "10px 14px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}>
                <FiSearch size={16} color="#9ca3af" />
                <input
                  type="text" placeholder="Rechercher une élection…"
                  value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  style={{
                    flex: 1, border: "none", outline: "none",
                    fontSize: "14px", fontFamily: "inherit",
                    color: "#111827", background: "transparent",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "all",      label: "Toutes" },
                  { key: "en_cours", label: "En cours" },
                  { key: "a_venir",  label: "À venir" },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilterType(f.key)} style={{
                    padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                    border: filterType === f.key ? "none" : "1.5px solid #e5e7eb",
                    background: filterType === f.key ? "#111827" : "white",
                    color: filterType === f.key ? "white" : "#6b7280",
                    cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                    boxShadow: filterType === f.key ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                  }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille */}
            {loadingEl ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  border: "3px solid #e5e7eb", borderTopColor: "#4f46e5",
                  animation: "spin .7s linear infinite", margin: "0 auto 16px",
                }} />
                Chargement des élections…
              </div>
            ) : filteredElections.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗳</div>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
                  Aucune élection publique pour le moment
                </p>
                <p style={{ fontSize: "14px", color: "#9ca3af" }}>
                  Revenez bientôt ou créez votre propre élection !
                </p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "24px",
              }}>
                {filteredElections.map(el => (
                  <ElectionCard
                    key={el.id_election}
                    election={el}
                    onVoter={el  => navigate(`/voter/${el.id_election}`)}
                    onCandidater={el => navigate(`/candidater/${el.id_election}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* FEATURES */}
        <section className="features" id="fonctionnalites">
          <div className="section-inner">
            <div className="section-header">
              <span className="section-badge">Fonctionnalités</span>
              <h2 className="section-title">Pourquoi choisir EVote ?</h2>
              <p className="section-subtitle">Une plateforme complète pensée pour la fiabilité et la simplicité.</p>
            </div>
            <div className="features-grid">
              {[
                { icon: <ShieldCheck size={24}/>, title: "Sécurité maximale",    text: "Chiffrement bout en bout des votes avec protection anti-fraude intégrée.", color: "#6366f1", bg: "#eef2ff" },
                { icon: <Globe size={24}/>,       title: "Public ou Privé",      text: "Créez des élections ouvertes à tous ou réservées à vos membres.", color: "#0ea5e9", bg: "#f0f9ff" },
                { icon: <Vote size={24}/>,        title: "Vote payant flexible", text: "Définissez vos frais de vote. L'électeur paie via MTN ou Orange Money.", color: "#8b5cf6", bg: "#f5f3ff" },
                { icon: <BarChart3 size={24}/>,   title: "Résultats en direct",  text: "Tableaux de bord temps réel pour candidats et électeurs.", color: "#10b981", bg: "#f0fdf4" },
              ].map((f, i) => (
                <motion.div key={i} className="feature-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }}>
                  <div className="feature-icon-wrap" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-text">{f.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="cta-orb" />
          <motion.div className="cta-inner" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="cta-badge">Prêt à commencer ?</span>
            <h2 className="cta-title">Lancez votre élection aujourd'hui</h2>
            <p className="cta-desc">Publique ou privée, en quelques minutes votre scrutin est prêt.</p>
            <div className="cta-btns">
              <button onClick={() => navigate("/creer-election")} className="cta-btn-primary">
                Créer une élection <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate("/login")} className="cta-btn-ghost">
                Se connecter
              </button>
            </div>
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-logo"><span>🗳</span><span className="footer-logo-text">EVote</span></div>
            <p className="footer-copy">© {new Date().getFullYear()} EVote. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  :root{--indigo-50:#eef2ff;--indigo-100:#e0e7ff;--indigo-200:#c7d2fe;--indigo-500:#6366f1;--indigo-600:#4f46e5;--indigo-700:#4338ca;--indigo-900:#1e1b4b;--gray-50:#f9fafb;--gray-500:#6b7280;--gray-800:#1f2937;--white:#fff;}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.6;transform:scale(0.85);}}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
  @keyframes spin{to{transform:rotate(360deg);}}
  .home-root{min-height:100vh;font-family:'Outfit',sans-serif;color:var(--gray-800);background:var(--white);}
  .navbar{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);box-shadow:0 1px 16px rgba(0,0,0,0.05);}
  .navbar-inner{max-width:1200px;margin:0 auto;padding:0 32px;height:62px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .navbar-logo{display:flex;align-items:center;gap:9px;flex-shrink:0;}
  .logo-icon{font-size:20px;}.logo-text{font-size:19px;font-weight:900;color:var(--indigo-600);letter-spacing:-0.5px;}
  .navbar-links{display:flex;align-items:center;gap:4px;}
  .nav-link-section{padding:8px 16px;border-radius:9px;font-size:13.5px;font-weight:600;color:var(--gray-500);text-decoration:none;transition:background .15s,color .15s;}
  .nav-link-section:hover{background:var(--indigo-50);color:var(--indigo-600);}
  .navbar-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;}
  .navbar-btn-ghost{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:9px;border:none;background:transparent;color:var(--gray-500);font-size:13.5px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;transition:all .15s;}
  .navbar-btn-ghost:hover{background:var(--indigo-50);color:var(--indigo-600);transform:translateY(-1px);}
  .navbar-btn-filled{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:9px;border:none;background:var(--indigo-600);color:white;font-size:13.5px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(79,70,229,0.25);transition:all .18s;}
  .navbar-btn-filled:hover{background:var(--indigo-700);transform:translateY(-1px);}
  .btn-filled{display:inline-flex;align-items:center;gap:8px;background:var(--indigo-600);color:#fff!important;border:none;border-radius:12px;font-family:'Outfit',sans-serif;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(79,70,229,0.30);transition:all .18s;}
  .btn-filled:hover{background:var(--indigo-700);transform:translateY(-2px);}
  .btn-outline{display:inline-flex;align-items:center;gap:7px;border-radius:12px;border:2px solid var(--indigo-600);background:transparent;color:var(--indigo-600);font-size:15px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;transition:all .15s;}
  .btn-outline:hover{background:var(--indigo-50);transform:translateY(-1px);}
  .btn-lg{padding:13px 28px;font-size:15px;}
  .hero{padding-top:110px;padding-bottom:100px;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow:hidden;}
  .hero-orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;}
  .hero-orb-1{width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 70%);top:-200px;left:-200px;}
  .hero-orb-2{width:400px;height:400px;background:radial-gradient(circle,rgba(14,165,233,0.12) 0%,transparent 70%);bottom:-100px;right:-100px;}
  .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px);background-size:44px 44px;pointer-events:none;}
  .hero-inner{max-width:1200px;margin:0 auto;padding:0 32px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;position:relative;z-index:1;}
  .hero-badge{display:inline-flex;align-items:center;gap:8px;background:white;border:1px solid var(--indigo-200);color:var(--indigo-600);padding:6px 16px;border-radius:999px;font-size:12.5px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;margin-bottom:20px;box-shadow:0 2px 8px rgba(99,102,241,0.10);}
  .badge-dot{width:7px;height:7px;background:var(--indigo-500);border-radius:50%;animation:pulse 2s ease-in-out infinite;}
  .hero-title{font-size:46px;font-weight:900;line-height:1.13;letter-spacing:-1.2px;color:var(--indigo-900);margin-bottom:20px;}
  .hero-title-accent{color:var(--indigo-600);}
  .hero-desc{font-size:16.5px;color:var(--gray-500);line-height:1.7;margin-bottom:32px;max-width:480px;}
  .hero-btns{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:28px;}
  .hero-badges{display:flex;flex-wrap:wrap;gap:16px;}
  .trust-badge{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--gray-500);font-weight:500;}
  .trust-icon{color:#22c55e;flex-shrink:0;}
  .hero-img-wrap{position:relative;display:flex;justify-content:center;}
  .hero-img-glow{position:absolute;inset:-20px;background:radial-gradient(circle,rgba(14,165,233,0.22) 0%,transparent 70%);border-radius:50%;filter:blur(30px);z-index:0;}
  .hero-img{width:100%;max-width:460px;border-radius:24px;box-shadow:0 24px 64px rgba(14,165,233,0.22),0 4px 16px rgba(0,0,0,0.08);position:relative;z-index:1;}
  .stats-bar{background:white;border-top:1px solid var(--indigo-100);border-bottom:1px solid var(--indigo-100);}
  .stats-inner{max-width:1200px;margin:0 auto;padding:32px;display:grid;grid-template-columns:repeat(4,1fr);}
  .stat-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:16px;border-right:1px solid var(--indigo-100);}
  .stat-item:last-child{border-right:none;}
  .stat-value{font-size:26px;font-weight:800;color:var(--indigo-600);letter-spacing:-0.5px;}
  .stat-label{font-size:13px;color:var(--gray-500);font-weight:500;}
  .features{padding:96px 0;background:var(--gray-50);}
  .section-inner{max-width:1200px;margin:0 auto;padding:0 32px;}
  .section-header{text-align:center;margin-bottom:56px;}
  .section-badge{display:inline-block;background:var(--indigo-50);color:var(--indigo-600);border:1px solid var(--indigo-100);padding:4px 14px;border-radius:999px;font-size:11.5px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;margin-bottom:14px;}
  .section-title{font-size:34px;font-weight:800;color:var(--indigo-900);letter-spacing:-0.7px;margin-bottom:12px;}
  .section-subtitle{font-size:15.5px;color:var(--gray-500);max-width:500px;margin:0 auto;line-height:1.6;}
  .features-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;}
  .feature-card{background:white;border:1px solid #f0f0f0;border-radius:20px;padding:32px 24px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.04);transition:box-shadow .2s,transform .2s;}
  .feature-card:hover{box-shadow:0 12px 36px rgba(79,70,229,0.12);}
  .feature-icon-wrap{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;margin:0 auto 18px;}
  .feature-title{font-size:16px;font-weight:700;color:var(--indigo-900);margin-bottom:8px;}
  .feature-text{font-size:13.5px;color:var(--gray-500);line-height:1.6;}
  .cta-section{background:linear-gradient(135deg,var(--indigo-600) 0%,#4338ca 100%);padding:100px 32px;text-align:center;position:relative;overflow:hidden;}
  .cta-orb{position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%);border-radius:50%;top:-200px;left:50%;transform:translateX(-50%);pointer-events:none;}
  .cta-inner{position:relative;z-index:1;max-width:600px;margin:0 auto;}
  .cta-badge{display:inline-block;background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.25);padding:4px 16px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;margin-bottom:20px;}
  .cta-title{font-size:38px;font-weight:900;color:white;letter-spacing:-0.8px;margin-bottom:14px;line-height:1.2;}
  .cta-desc{font-size:16px;color:rgba(255,255,255,0.80);margin-bottom:36px;line-height:1.6;}
  .cta-btns{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;}
  .cta-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;background:white;color:var(--indigo-600);border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,0.15);transition:all .15s;}
  .cta-btn-primary:hover{background:#f5f5ff;transform:translateY(-2px);}
  .cta-btn-ghost{padding:13px 28px;background:transparent;color:white;border:2px solid rgba(255,255,255,0.40);border-radius:12px;font-size:15px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;transition:all .15s;}
  .cta-btn-ghost:hover{background:rgba(255,255,255,0.10);transform:translateY(-1px);}
  .footer{background:var(--indigo-900);padding:28px 32px;}
  .footer-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
  .footer-logo{display:flex;align-items:center;gap:8px;font-size:18px;}
  .footer-logo-text{font-weight:700;color:white;letter-spacing:-0.3px;}
  .footer-copy{font-size:13px;color:rgba(255,255,255,0.40);}
  @media(max-width:900px){
    .hero-inner{grid-template-columns:1fr;gap:40px;}
    .hero-img{max-width:340px;}
    .hero-title{font-size:34px;}
    .features-grid{grid-template-columns:1fr 1fr;}
    .stats-inner{grid-template-columns:1fr 1fr;}
    .navbar-links{display:none;}
  }
  @media(max-width:580px){
    .navbar-inner{padding:0 20px;}
    .features-grid{grid-template-columns:1fr;}
    .hero{padding-top:100px;padding-bottom:60px;}
    .hero-inner,.section-inner{padding:0 20px;}
  }
`;

















































// // src/pages/HomePage.jsx — VERSION MISE À JOUR avec élections publiques
// import React, { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { ShieldCheck, Users, Vote, BarChart3, CheckCircle, ArrowRight, Globe, Lock, Clock, Users2 } from "lucide-react";
// import { FiLogIn, FiCalendar, FiSearch } from "react-icons/fi";
// import { useNavigate } from "react-router-dom";
// import accueilIMG from "./accueil.png";
// import api from "../../services/api";

// // ─── Helpers ─────────────────────────────────────────────────────────────────
// const formatDate = (d) =>
//   new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// const statutLabel = {
//   APPROUVEE: { text: "À venir",    color: "#3b82f6", bg: "#eff6ff" },
//   EN_COURS:  { text: "En cours",   color: "#22c55e", bg: "#f0fdf4" },
//   TERMINEE:  { text: "Terminée",   color: "#94a3b8", bg: "#f8fafc" },
// };

// // ─── Carte d'élection publique ───────────────────────────────────────────────
// function ElectionCard({ election, onVoter, onCandidater }) {
//   const s = statutLabel[election.statut] || statutLabel["APPROUVEE"];
//   const enCours = election.statut === "EN_COURS";
//   const navigate = useNavigate();

//   return (
//     <motion.div
//       whileHover={{ y: -4 }}
//       style={{
//         background: "white",
//         borderRadius: "20px",
//         border: "1px solid #f0f0f0",
//         boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
//         overflow: "hidden",
//         display: "flex",
//         flexDirection: "column",
//         transition: "box-shadow .2s",
//         cursor: "default",
//       }}
//       onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(79,70,229,0.12)"}
//       onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)"}
//     >
//       {/* Header coloré */}
//       <div style={{
//         background: enCours
//           ? "linear-gradient(135deg, #4f46e5, #6366f1)"
//           : "linear-gradient(135deg, #1e1b4b, #312e81)",
//         padding: "20px 20px 16px",
//         position: "relative",
//       }}>
//         {/* Statut badge */}
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//           <span style={{
//             background: s.bg, color: s.color,
//             fontSize: "11px", fontWeight: 700,
//             padding: "3px 10px", borderRadius: "999px",
//             letterSpacing: ".4px",
//           }}>
//             {enCours && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#22c55e", marginRight: 5, animation: "blink 1.2s ease-in-out infinite" }} />}
//             {s.text}
//           </span>
//           <span style={{
//             background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)",
//             fontSize: "11px", fontWeight: 600,
//             padding: "3px 10px", borderRadius: "999px",
//             display: "flex", alignItems: "center", gap: 5,
//           }}>
//             <Globe size={11} /> Publique
//           </span>
//         </div>

//         <h3 style={{
//           color: "white", fontWeight: 800, fontSize: "16px",
//           margin: "12px 0 6px", lineHeight: 1.3, letterSpacing: "-0.2px",
//         }}>
//           {election.titre}
//         </h3>
//         <p style={{ color: "rgba(255,255,255,0.70)", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
//           {election.description?.slice(0, 80)}{election.description?.length > 80 ? "…" : ""}
//         </p>
//       </div>

//       {/* Corps */}
//       <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
//         {/* Dates */}
//         <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px", color: "#64748b" }}>
//           <FiCalendar size={12} />
//           <span>{formatDate(election.date_debut)} → {formatDate(election.date_fin)}</span>
//         </div>

//         {/* Métriques */}
//         <div style={{ display: "flex", gap: 12 }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "12px", color: "#64748b" }}>
//             <Users2 size={12} /> <strong style={{ color: "#1e1b4b" }}>{election.nb_candidats}</strong> candidat{election.nb_candidats > 1 ? "s" : ""}
//           </div>
//           <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "12px", color: "#64748b" }}>
//             <Vote size={12} /> <strong style={{ color: "#1e1b4b" }}>{election.nb_votes}</strong> vote{election.nb_votes > 1 ? "s" : ""}
//           </div>
//         </div>

//         {/* Frais */}
//         {election.frais_vote_xaf && (
//           <div style={{
//             background: "#fef9ee", border: "1px solid #fde68a",
//             borderRadius: "8px", padding: "6px 10px",
//             fontSize: "12px", color: "#92400e", fontWeight: 600,
//             display: "flex", alignItems: "center", gap: 6,
//           }}>
//             💳 Frais de vote : <strong>{election.frais_vote_xaf} XAF</strong>
//           </div>
//         )}

//         {/* Type scrutin */}
//         <div style={{ fontSize: "11px", color: "#94a3b8" }}>
//           Scrutin : <strong style={{ color: "#6366f1" }}>{election.type}</strong>
//           {" · "}organisé par <strong style={{ color: "#374151" }}>{election.prenom_admin} {election.nom_admin}</strong>
//         </div>
//       </div>

//       {/* Actions */}
//       <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #f4f4f5", display: "flex", gap: 8 }}>
//         <button
//           onClick={() => onCandidater(election)}
//           style={{
//             flex: 1, padding: "9px 0", borderRadius: "10px",
//             border: "1.5px solid #e0e7ff", background: "#f5f3ff",
//             color: "#4f46e5", fontSize: "13px", fontWeight: 700,
//             cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
//           }}
//           onMouseEnter={e => { e.target.style.background = "#ede9fe"; e.target.style.borderColor = "#a5b4fc"; }}
//           onMouseLeave={e => { e.target.style.background = "#f5f3ff"; e.target.style.borderColor = "#e0e7ff"; }}
//         >
//           Se candidater
//         </button>
//         {enCours && (
//           <button
//             onClick={() => onVoter(election)}
//             style={{
//               flex: 1, padding: "9px 0", borderRadius: "10px",
//               border: "none",
//               background: "linear-gradient(135deg, #4f46e5, #6366f1)",
//               color: "white", fontSize: "13px", fontWeight: 700,
//               cursor: "pointer", fontFamily: "inherit",
//               boxShadow: "0 4px 12px rgba(79,70,229,0.30)",
//               transition: "all .2s",
//             }}
//             onMouseEnter={e => e.target.style.background = "linear-gradient(135deg,#4338ca,#4f46e5)"}
//             onMouseLeave={e => e.target.style.background = "linear-gradient(135deg,#4f46e5,#6366f1)"}
//           >
//             Voter →
//           </button>
//         )}
//         <button
//           onClick={() => navigate(`/election-publique/${election.id_election}`)}
//           style={{
//             padding: "9px 14px", borderRadius: "10px",
//             border: "1.5px solid #e5e7eb", background: "white",
//             color: "#64748b", fontSize: "13px",
//             cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
//           }}
//           onMouseEnter={e => e.target.style.background = "#f9fafb"}
//           onMouseLeave={e => e.target.style.background = "white"}
//         >
//           Voir
//         </button>
//       </div>
//     </motion.div>
//   );
// }

// // ─── Composant principal ──────────────────────────────────────────────────────
// export default function HomePage() {
//   const navigate = useNavigate();
//   const [elections, setElections]   = useState([]);
//   const [loadingEl, setLoadingEl]   = useState(true);
//   const [searchQ,   setSearchQ]     = useState("");
//   const [filterType, setFilterType] = useState("all"); // all | en_cours | a_venir
//   const [modalEl,   setModalEl]     = useState(null);  // pour le modal voter/candidater

//   useEffect(() => {
//     api.get("/public-elections")
//       .then(r => setElections(r.data))
//       .catch(console.error)
//       .finally(() => setLoadingEl(false));
//   }, []);

//   const filteredElections = elections.filter(e => {
//     const q = searchQ.toLowerCase();
//     const matchQ = !q || e.titre.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
//     const matchF =
//       filterType === "all"     ? true :
//       filterType === "en_cours" ? e.statut === "EN_COURS" :
//       filterType === "a_venir"  ? e.statut === "APPROUVEE" : true;
//     return matchQ && matchF;
//   });

//   return (
//     <>
//       <style>{styles}</style>
//       <div className="home-root">

//         {/* ===== NAVBAR ===== */}
//         <header className="navbar">
//           <div className="navbar-inner">
//             <div className="navbar-logo">
//               <span className="logo-icon">🗳</span>
//               <span className="logo-text">EVote</span>
//             </div>
//             <nav className="navbar-links">
//               <a href="#elections" className="nav-link-section">Élections</a>
//               <a href="#fonctionnalites" className="nav-link-section">Fonctionnalités</a>
//             </nav>
//             <div className="navbar-actions">
//               <button onClick={() => navigate("/login")} className="navbar-btn-ghost">
//                 <FiLogIn size={14} /> Connexion
//               </button>
//               <button onClick={() => navigate("/creer-election")} className="navbar-btn-filled">
//                 Créer une élection <ArrowRight size={14} />
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* ===== HERO ===== */}
//         <section className="hero" id="accueil">
//           <div className="hero-orb hero-orb-1" />
//           <div className="hero-orb hero-orb-2" />
//           <div className="hero-grid" />
//           <div className="hero-inner">
//             <motion.div
//               className="hero-text"
//               initial={{ opacity: 0, x: -36 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
//             >
//               <span className="hero-badge">
//                 <span className="badge-dot" />
//                 Vote électronique sécurisé
//               </span>
//               <h1 className="hero-title">
//                 Organisez vos élections{" "}
//                 <span className="hero-title-accent">facilement et en toute confiance</span>
//               </h1>
//               <p className="hero-desc">
//                 Participez aux élections publiques ou organisez les vôtres. Candidatez, votez, suivez les résultats — le tout en quelques clics.
//               </p>
//               <div className="hero-btns">
//                 <a href="#elections" className="btn-filled btn-lg" style={{ textDecoration: "none" }}>
//                   Voir les élections <ArrowRight size={16} />
//                 </a>
//                 <button onClick={() => navigate("/creer-election")} className="btn-outline btn-lg">
//                   Organiser une élection
//                 </button>
//               </div>
//               <div className="hero-badges">
//                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Vote public ou privé</div>
//                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Paiement Mobile Money</div>
//                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Résultats en direct</div>
//               </div>
//             </motion.div>
//             <motion.div
//               className="hero-img-wrap"
//               initial={{ opacity: 0, y: 36 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
//             >
//               <div className="hero-img-glow" />
//               <img src={accueilIMG} alt="Vote en ligne" className="hero-img" />
//             </motion.div>
//           </div>
//         </section>

//         {/* ===== STATS ===== */}
//         <section className="stats-bar">
//           <div className="stats-inner">
//             {[
//               { value: "247+", label: "Votes traités" },
//               { value: "12+", label: "Élections organisées" },
//               { value: "99.9%", label: "Disponibilité" },
//               { value: "100%", label: "Résultats transparents" },
//             ].map((s, i) => (
//               <motion.div key={i} className="stat-item" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
//                 <span className="stat-value">{s.value}</span>
//                 <span className="stat-label">{s.label}</span>
//               </motion.div>
//             ))}
//           </div>
//         </section>

//         {/* ===== ÉLECTIONS PUBLIQUES ===== */}
//         <section id="elections" style={{ padding: "80px 0", background: "#f8f9ff" }}>
//           <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px" }}>

//             <div style={{ textAlign: "center", marginBottom: "40px" }}>
//               <span style={{
//                 display: "inline-block", background: "#eef2ff", color: "#4f46e5",
//                 border: "1px solid #e0e7ff", padding: "4px 14px", borderRadius: "999px",
//                 fontSize: "11.5px", fontWeight: 600, letterSpacing: ".8px",
//                 textTransform: "uppercase", marginBottom: "14px",
//               }}>
//                 🌐 Élections publiques
//               </span>
//               <h2 style={{ fontSize: "34px", fontWeight: 800, color: "#1e1b4b", letterSpacing: "-0.7px", marginBottom: "12px" }}>
//                 Participez aux élections ouvertes
//               </h2>
//               <p style={{ fontSize: "15.5px", color: "#64748b", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>
//                 Candidatez librement ou votez pour vos favoris. Paiement Mobile Money requis pour chaque vote.
//               </p>
//             </div>

//             {/* Barre de recherche + filtres */}
//             <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
//               <div style={{
//                 flex: 1, minWidth: "240px", display: "flex", alignItems: "center",
//                 gap: "10px", background: "white", border: "1.5px solid #e0e7ff",
//                 borderRadius: "12px", padding: "10px 14px",
//               }}>
//                 <FiSearch size={16} color="#94a3b8" />
//                 <input
//                   type="text" placeholder="Rechercher une élection…"
//                   value={searchQ} onChange={e => setSearchQ(e.target.value)}
//                   style={{
//                     flex: 1, border: "none", outline: "none",
//                     fontSize: "14px", fontFamily: "inherit", color: "#1e293b",
//                     background: "transparent",
//                   }}
//                 />
//               </div>
//               <div style={{ display: "flex", gap: 8 }}>
//                 {[
//                   { key: "all",     label: "Toutes" },
//                   { key: "en_cours", label: "🟢 En cours" },
//                   { key: "a_venir", label: "🔵 À venir" },
//                 ].map(f => (
//                   <button key={f.key} onClick={() => setFilterType(f.key)} style={{
//                     padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
//                     border: filterType === f.key ? "none" : "1.5px solid #e0e7ff",
//                     background: filterType === f.key ? "#4f46e5" : "white",
//                     color: filterType === f.key ? "white" : "#64748b",
//                     cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
//                   }}>
//                     {f.label}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Grille d'élections */}
//             {loadingEl ? (
//               <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
//                 <div style={{
//                   width: "36px", height: "36px", borderRadius: "50%",
//                   border: "3px solid #e0e7ff", borderTopColor: "#4f46e5",
//                   animation: "spin .7s linear infinite", margin: "0 auto 16px",
//                 }} />
//                 Chargement des élections…
//               </div>
//             ) : filteredElections.length === 0 ? (
//               <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
//                 <div style={{ fontSize: "40px", marginBottom: "12px" }}>🗳</div>
//                 <p style={{ fontSize: "16px", fontWeight: 600, color: "#64748b" }}>Aucune élection publique pour le moment</p>
//                 <p style={{ fontSize: "14px", color: "#94a3b8" }}>Revenez bientôt ou créez votre propre élection !</p>
//               </div>
//             ) : (
//               <div style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
//                 gap: "24px",
//               }}>
//                 {filteredElections.map(el => (
//                   <ElectionCard
//                     key={el.id_election}
//                     election={el}
//                     onVoter={el => navigate(`/voter/${el.id_election}`)}
//                     onCandidater={el => navigate(`/candidater/${el.id_election}`)}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>
//         </section>

//         {/* ===== FEATURES ===== */}
//         <section className="features" id="fonctionnalites">
//           <div className="section-inner">
//             <div className="section-header">
//               <span className="section-badge">Fonctionnalités</span>
//               <h2 className="section-title">Pourquoi choisir EVote ?</h2>
//               <p className="section-subtitle">Une plateforme complète pensée pour la fiabilité et la simplicité.</p>
//             </div>
//             <div className="features-grid">
//               {[
//                 { icon: <ShieldCheck size={24} />, title: "Sécurité maximale",    text: "Chiffrement bout en bout des votes avec protection anti-fraude intégrée.", color: "#6366f1", bg: "#eef2ff" },
//                 { icon: <Globe size={24} />,        title: "Public ou Privé",      text: "Créez des élections ouvertes à tous ou réservées à vos membres.", color: "#0ea5e9", bg: "#f0f9ff" },
//                 { icon: <Vote size={24} />,          title: "Vote payant flexible", text: "Définissez vos frais de vote. L'électeur paie via MTN ou Orange Money.", color: "#8b5cf6", bg: "#f5f3ff" },
//                 { icon: <BarChart3 size={24} />,     title: "Résultats en direct",  text: "Tableaux de bord temps réel pour candidats et électeurs.", color: "#10b981", bg: "#f0fdf4" },
//               ].map((f, i) => (
//                 <motion.div key={i} className="feature-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }}>
//                   <div className="feature-icon-wrap" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
//                   <h3 className="feature-title">{f.title}</h3>
//                   <p className="feature-text">{f.text}</p>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* ===== CTA ===== */}
//         <section className="cta-section">
//           <div className="cta-orb" />
//           <motion.div className="cta-inner" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
//             <span className="cta-badge">Prêt à commencer ?</span>
//             <h2 className="cta-title">Lancez votre élection aujourd'hui</h2>
//             <p className="cta-desc">Publique ou privée, en quelques minutes votre scrutin est prêt.</p>
//             <div className="cta-btns">
//               <button onClick={() => navigate("/creer-election")} className="cta-btn-primary">
//                 Créer une élection <ArrowRight size={16} />
//               </button>
//               <button onClick={() => navigate("/login")} className="cta-btn-ghost">
//                 Se connecter
//               </button>
//             </div>
//           </motion.div>
//         </section>

//         {/* ===== FOOTER ===== */}
//         <footer className="footer">
//           <div className="footer-inner">
//             <div className="footer-logo"><span>🗳</span><span className="footer-logo-text">EVote</span></div>
//             <p className="footer-copy">© {new Date().getFullYear()} EVote. Tous droits réservés.</p>
//           </div>
//         </footer>
//       </div>
//     </>
//   );
// }

// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
//   :root {
//     --indigo-50:#eef2ff;--indigo-100:#e0e7ff;--indigo-200:#c7d2fe;
//     --indigo-500:#6366f1;--indigo-600:#4f46e5;--indigo-700:#4338ca;--indigo-900:#1e1b4b;
//     --gray-50:#f9fafb;--gray-100:#f3f4f6;--gray-500:#6b7280;--gray-600:#4b5563;--gray-800:#1f2937;
//     --white:#ffffff;
//   }
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   .home-root{min-height:100vh;font-family:'Outfit',sans-serif;color:var(--gray-800);background:var(--white);}
//   .navbar{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);box-shadow:0 1px 16px rgba(0,0,0,0.05);}
//   .navbar-inner{max-width:1200px;margin:0 auto;padding:0 32px;height:62px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
//   .navbar-logo{display:flex;align-items:center;gap:9px;flex-shrink:0;}
//   .logo-icon{font-size:20px;}.logo-text{font-size:19px;font-weight:900;color:var(--indigo-600);letter-spacing:-0.5px;}
//   .navbar-links{display:flex;align-items:center;gap:4px;}
//   .nav-link-section{padding:8px 16px;border-radius:9px;font-size:13.5px;font-weight:600;color:var(--gray-500);text-decoration:none;transition:background .15s,color .15s;}
//   .nav-link-section:hover{background:var(--indigo-50);color:var(--indigo-600);}
//   .navbar-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;}
//   .navbar-btn-ghost{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:9px;border:none;background:transparent;color:var(--gray-500);font-size:13.5px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;transition:background .15s,color .15s,transform .15s;}
//   .navbar-btn-ghost:hover{background:var(--indigo-50);color:var(--indigo-600);transform:translateY(-1px);}
//   .navbar-btn-filled{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:9px;border:none;background:var(--indigo-600);color:white;font-size:13.5px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(79,70,229,0.25);transition:background .18s,transform .15s,box-shadow .18s;}
//   .navbar-btn-filled:hover{background:var(--indigo-700);transform:translateY(-1px);box-shadow:0 6px 16px rgba(79,70,229,0.35);}
//   .btn-filled{display:inline-flex;align-items:center;gap:8px;background:var(--indigo-600);color:#fff!important;border:none;border-radius:12px;font-family:'Outfit',sans-serif;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(79,70,229,0.30);transition:background .18s,transform .15s,box-shadow .18s;text-decoration:none;}
//   .btn-filled:hover{background:var(--indigo-700);transform:translateY(-2px);box-shadow:0 10px 28px rgba(79,70,229,0.38);color:#fff!important;}
//   .btn-outline{display:inline-flex;align-items:center;gap:7px;padding:13px 28px;border-radius:12px;border:2px solid var(--indigo-600);background:transparent;color:var(--indigo-600);font-size:15px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;transition:background .15s,transform .15s;}
//   .btn-outline:hover{background:var(--indigo-50);transform:translateY(-1px);}
//   .btn-lg{padding:13px 28px;font-size:15px;border-radius:12px;}
//   .hero{padding-top:110px;padding-bottom:100px;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow:hidden;}
//   .hero-orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;}
//   .hero-orb-1{width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 70%);top:-200px;left:-200px;}
//   .hero-orb-2{width:400px;height:400px;background:radial-gradient(circle,rgba(14,165,233,0.12) 0%,transparent 70%);bottom:-100px;right:-100px;}
//   .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px);background-size:44px 44px;pointer-events:none;}
//   .hero-inner{max-width:1200px;margin:0 auto;padding:0 32px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;position:relative;z-index:1;}
//   .hero-badge{display:inline-flex;align-items:center;gap:8px;background:white;border:1px solid var(--indigo-200);color:var(--indigo-600);padding:6px 16px;border-radius:999px;font-size:12.5px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;margin-bottom:20px;box-shadow:0 2px 8px rgba(99,102,241,0.10);}
//   .badge-dot{width:7px;height:7px;background:var(--indigo-500);border-radius:50%;animation:pulse 2s ease-in-out infinite;}
//   @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.6;transform:scale(0.85);}}
//   @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
//   @keyframes spin{to{transform:rotate(360deg);}}
//   .hero-title{font-size:46px;font-weight:900;line-height:1.13;letter-spacing:-1.2px;color:var(--indigo-900);margin-bottom:20px;}
//   .hero-title-accent{color:var(--indigo-600);}
//   .hero-desc{font-size:16.5px;color:var(--gray-500);line-height:1.7;margin-bottom:32px;max-width:480px;}
//   .hero-btns{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:28px;}
//   .hero-badges{display:flex;flex-wrap:wrap;gap:16px;}
//   .trust-badge{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--gray-500);font-weight:500;}
//   .trust-icon{color:#22c55e;flex-shrink:0;}
//   .hero-img-wrap{position:relative;display:flex;justify-content:center;}
//   .hero-img-glow{position:absolute;inset:-20px;background:radial-gradient(circle,rgba(14,165,233,0.22) 0%,transparent 70%);border-radius:50%;filter:blur(30px);z-index:0;}
//   .hero-img{width:100%;max-width:460px;border-radius:24px;box-shadow:0 24px 64px rgba(14,165,233,0.22),0 4px 16px rgba(0,0,0,0.08);position:relative;z-index:1;}
//   .stats-bar{background:white;border-top:1px solid var(--indigo-100);border-bottom:1px solid var(--indigo-100);}
//   .stats-inner{max-width:1200px;margin:0 auto;padding:32px;display:grid;grid-template-columns:repeat(4,1fr);}
//   .stat-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:16px;border-right:1px solid var(--indigo-100);}
//   .stat-item:last-child{border-right:none;}
//   .stat-value{font-size:26px;font-weight:800;color:var(--indigo-600);letter-spacing:-0.5px;}
//   .stat-label{font-size:13px;color:var(--gray-500);font-weight:500;}
//   .features{padding:96px 0;background:var(--gray-50);}
//   .section-inner{max-width:1200px;margin:0 auto;padding:0 32px;}
//   .section-header{text-align:center;margin-bottom:56px;}
//   .section-badge{display:inline-block;background:var(--indigo-50);color:var(--indigo-600);border:1px solid var(--indigo-100);padding:4px 14px;border-radius:999px;font-size:11.5px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;margin-bottom:14px;}
//   .section-title{font-size:34px;font-weight:800;color:var(--indigo-900);letter-spacing:-0.7px;margin-bottom:12px;}
//   .section-subtitle{font-size:15.5px;color:var(--gray-500);max-width:500px;margin:0 auto;line-height:1.6;}
//   .features-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;}
//   .feature-card{background:white;border:1px solid #f0f0f0;border-radius:20px;padding:32px 24px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.04);transition:box-shadow .2s,transform .2s;cursor:default;}
//   .feature-card:hover{box-shadow:0 12px 36px rgba(79,70,229,0.12);}
//   .feature-icon-wrap{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;margin:0 auto 18px;}
//   .feature-title{font-size:16px;font-weight:700;color:var(--indigo-900);margin-bottom:8px;letter-spacing:-0.2px;}
//   .feature-text{font-size:13.5px;color:var(--gray-500);line-height:1.6;}
//   .cta-section{background:linear-gradient(135deg,var(--indigo-600) 0%,#4338ca 100%);padding:100px 32px;text-align:center;position:relative;overflow:hidden;}
//   .cta-orb{position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%);border-radius:50%;top:-200px;left:50%;transform:translateX(-50%);pointer-events:none;}
//   .cta-inner{position:relative;z-index:1;max-width:600px;margin:0 auto;}
//   .cta-badge{display:inline-block;background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.25);padding:4px 16px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;margin-bottom:20px;}
//   .cta-title{font-size:38px;font-weight:900;color:white;letter-spacing:-0.8px;margin-bottom:14px;line-height:1.2;}
//   .cta-desc{font-size:16px;color:rgba(255,255,255,0.80);margin-bottom:36px;line-height:1.6;}
//   .cta-btns{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;}
//   .cta-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;background:white;color:var(--indigo-600);border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,0.15);transition:background .15s,transform .15s;}
//   .cta-btn-primary:hover{background:#f5f5ff;transform:translateY(-2px);}
//   .cta-btn-ghost{padding:13px 28px;background:transparent;color:white;border:2px solid rgba(255,255,255,0.40);border-radius:12px;font-size:15px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;transition:background .15s,border-color .15s,transform .15s;}
//   .cta-btn-ghost:hover{background:rgba(255,255,255,0.10);border-color:rgba(255,255,255,0.65);transform:translateY(-1px);}
//   .footer{background:var(--indigo-900);padding:28px 32px;}
//   .footer-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
//   .footer-logo{display:flex;align-items:center;gap:8px;font-size:18px;}
//   .footer-logo-text{font-weight:700;color:white;letter-spacing:-0.3px;}
//   .footer-copy{font-size:13px;color:rgba(255,255,255,0.40);}
//   @media(max-width:900px){
//     .hero-inner{grid-template-columns:1fr;gap:40px;}
//     .hero-img{max-width:340px;}
//     .hero-title{font-size:34px;}
//     .features-grid{grid-template-columns:1fr 1fr;}
//     .stats-inner{grid-template-columns:1fr 1fr;}
//     .navbar-links{display:none;}
//   }
//   @media(max-width:580px){
//     .navbar-inner{padding:0 20px;}
//     .features-grid{grid-template-columns:1fr;}
//     .stats-inner{grid-template-columns:1fr 1fr;}
//     .hero{padding-top:100px;padding-bottom:60px;}
//     .hero-inner,.section-inner{padding:0 20px;}
//   }
// `;































// // src/pages/HomePage.jsx
// import React, { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import {
//   ShieldCheck, Users, Vote, BarChart3,
//   CheckCircle, ArrowRight, Calendar, Users2,
// } from "lucide-react";
// import { FiLogIn, FiGlobe } from "react-icons/fi";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import accueilIMG from "./accueil.png";

// const API_BASE = "http://localhost:5000/api";

// export default function HomePage() {
//   const navigate = useNavigate();
//   const [electionsPubliques, setElectionsPubliques] = useState([]);
//   const [loadingElections,   setLoadingElections]   = useState(true);

//   // Charger les élections publiques au montage
//   useEffect(() => {
//     axios
//       .get(`${API_BASE}/elections/publiques`)
//       .then(r => setElectionsPubliques(r.data))
//       .catch(() => setElectionsPubliques([]))
//       .finally(() => setLoadingElections(false));
//   }, []);

//   const formatDate = (d) =>
//     new Date(d).toLocaleDateString("fr-FR", {
//       day: "2-digit", month: "short", year: "numeric",
//     });

//   const statutConfig = (statut) => {
//     switch (statut) {
//       case "EN_COURS":   return { label: "🔴 En cours",     bg: "#fef2f2", color: "#dc2626", border: "#fecaca", pulse: true };
//       case "APPROUVEE":  return { label: "✅ À venir",       bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", pulse: false };
//       case "EN_ATTENTE": return { label: "⏳ En attente",    bg: "#fef9c3", color: "#ca8a04", border: "#fde68a", pulse: false };
//       default:           return { label: statut,             bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", pulse: false };
//     }
//   };

//   return (
//     <>
//       <style>{styles}</style>
//       <div className="home-root">

//         {/* ===== NAVBAR ===== */}
//         <header className="navbar">
//           <div className="navbar-inner">
//             <div className="navbar-logo">
//               <span className="logo-icon">🗳</span>
//               <span className="logo-text">EVote</span>
//             </div>

//             <nav className="navbar-links">
//               <a href="#fonctionnalites" className="nav-link-section">Fonctionnalités</a>
//               <a href="#pourquoi"        className="nav-link-section">Pourquoi nous</a>
//               {electionsPubliques.length > 0 && (
//                 <a href="#elections-publiques" className="nav-link-section nav-link-elections">
//                   <FiGlobe size={13} /> Élections ouvertes
//                   <span className="nav-badge">{electionsPubliques.length}</span>
//                 </a>
//               )}
//             </nav>

//             <div className="navbar-actions">
//               <button onClick={() => navigate("/login")}          className="navbar-btn-ghost">
//                 <FiLogIn size={14} /> Connexion
//               </button>
//               <button onClick={() => navigate("/creer-election")} className="navbar-btn-filled">
//                 Créer une élection <ArrowRight size={14} />
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* ===== HERO ===== */}
//         <section className="hero" id="accueil">
//           <div className="hero-orb hero-orb-1" />
//           <div className="hero-orb hero-orb-2" />
//           <div className="hero-grid" />

//           <div className="hero-inner">
//             <motion.div
//               className="hero-text"
//               initial={{ opacity: 0, x: -36 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
//             >
//               <span className="hero-badge">
//                 <span className="badge-dot" />
//                 Vote électronique sécurisé
//               </span>

//               <h1 className="hero-title">
//                 Organisez vos élections{" "}
//                 <span className="hero-title-accent">facilement et en toute confiance</span>
//               </h1>

//               <p className="hero-desc">
//                 Digitalisez vos scrutins pour écoles, universités et entreprises avec
//                 transparence, sécurité et simplicité.
//               </p>

//               <div className="hero-btns">
//                 <button onClick={() => navigate("/login")}          className="btn-filled btn-lg">
//                   Commencer à voter <ArrowRight size={16} />
//                 </button>
//                 <button onClick={() => navigate("/creer-election")} className="btn-outline btn-lg">
//                   Organiser une élection
//                 </button>
//               </div>

//               <div className="hero-badges">
//                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Données chiffrées</div>
//                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Résultats instantanés</div>
//                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Accès sécurisé</div>
//               </div>
//             </motion.div>

//             <motion.div
//               className="hero-img-wrap"
//               initial={{ opacity: 0, y: 36 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
//             >
//               <div className="hero-img-glow" />
//               <img src={accueilIMG} alt="Vote en ligne" className="hero-img" />
//             </motion.div>
//           </div>
//         </section>

//         {/* ===== STATS ===== */}
//         <section className="stats-bar">
//           <div className="stats-inner">
//             {[
//               { value: "247+",  label: "Votes traités" },
//               { value: "12+",   label: "Élections organisées" },
//               { value: "99.9%", label: "Disponibilité" },
//               { value: "100%",  label: "Résultats transparents" },
//             ].map((s, i) => (
//               <motion.div
//                 key={i}
//                 className="stat-item"
//                 initial={{ opacity: 0, y: 20 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 transition={{ delay: i * 0.08 }}
//               >
//                 <span className="stat-value">{s.value}</span>
//                 <span className="stat-label">{s.label}</span>
//               </motion.div>
//             ))}
//           </div>
//         </section>

//         {/* ===== FEATURES ===== */}
//         <section className="features" id="fonctionnalites">
//           <div className="section-inner">
//             <div className="section-header">
//               <span className="section-badge">Fonctionnalités</span>
//               <h2 className="section-title">Pourquoi choisir EVote ?</h2>
//               <p className="section-subtitle">
//                 Une plateforme complète pensée pour la fiabilité et la simplicité.
//               </p>
//             </div>

//             <div className="features-grid" id="pourquoi">
//               {[
//                 {
//                   icon: <ShieldCheck size={24} />,
//                   title: "Sécurité maximale",
//                   text: "Chiffrement bout en bout des votes avec protection anti-fraude intégrée.",
//                   color: "#6366f1", bg: "#eef2ff",
//                 },
//                 {
//                   icon: <Users size={24} />,
//                   title: "Multi-rôles",
//                   text: "Gestion claire des admins, électeurs et super administrateurs.",
//                   color: "#0ea5e9", bg: "#f0f9ff",
//                 },
//                 {
//                   icon: <Vote size={24} />,
//                   title: "Interface intuitive",
//                   text: "Expérience de vote simple, rapide et entièrement responsive.",
//                   color: "#8b5cf6", bg: "#f5f3ff",
//                 },
//                 {
//                   icon: <BarChart3 size={24} />,
//                   title: "Statistiques en direct",
//                   text: "Résultats transparents et visualisables en temps réel.",
//                   color: "#10b981", bg: "#f0fdf4",
//                 },
//               ].map((f, i) => (
//                 <motion.div
//                   key={i}
//                   className="feature-card"
//                   initial={{ opacity: 0, y: 24 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   viewport={{ once: true }}
//                   transition={{ delay: i * 0.1 }}
//                   whileHover={{ y: -6 }}
//                 >
//                   <div className="feature-icon-wrap" style={{ background: f.bg, color: f.color }}>
//                     {f.icon}
//                   </div>
//                   <h3 className="feature-title">{f.title}</h3>
//                   <p className="feature-text">{f.text}</p>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* ===== ÉLECTIONS PUBLIQUES ===== */}
//         <section className="elections-pub-section" id="elections-publiques">
//           <div className="section-inner">

//             <div className="section-header">
//               <span className="section-badge section-badge--sky">🌍 Ouvert à tous</span>
//               <h2 className="section-title">Élections publiques</h2>
//               <p className="section-subtitle">
//                 Participez comme candidat ou votez directement — aucune invitation requise.
//               </p>
//             </div>

//             {/* Chargement */}
//             {loadingElections && (
//               <div className="elections-loading">
//                 <div className="elections-spinner" />
//                 <p>Chargement des élections…</p>
//               </div>
//             )}

//             {/* Aucune élection */}
//             {!loadingElections && electionsPubliques.length === 0 && (
//               <div className="elections-empty">
//                 <div className="elections-empty-icon">🗳</div>
//                 <h3>Aucune élection publique en cours</h3>
//                 <p>Les prochaines élections publiques apparaîtront ici.</p>
//                 <button
//                   onClick={() => navigate("/creer-election")}
//                   className="btn-filled"
//                   style={{ padding: "12px 24px", fontSize: "14px", borderRadius: "10px", marginTop: "8px" }}
//                 >
//                   Organiser une élection publique
//                 </button>
//               </div>
//             )}

//             {/* Grille des élections */}
//             {!loadingElections && electionsPubliques.length > 0 && (
//               <div className="elections-grid">
//                 {electionsPubliques.map((election, i) => {
//                   const sc = statutConfig(election.statut);
//                   const canVote     = election.statut === "EN_COURS";
//                   const canPostuler = !["EN_COURS", "TERMINEE"].includes(election.statut);

//                   return (
//                     <motion.div
//                       key={election.id_election}
//                       className="election-card"
//                       initial={{ opacity: 0, y: 24 }}
//                       whileInView={{ opacity: 1, y: 0 }}
//                       viewport={{ once: true }}
//                       transition={{ delay: i * 0.08 }}
//                       whileHover={{ y: -5 }}
//                     >
//                       {/* Header statut + type */}
//                       <div className="election-card-header">
//                         <span
//                           className="election-statut"
//                           style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
//                         >
//                           {sc.pulse && <span className="statut-pulse" style={{ background: sc.color }} />}
//                           {sc.label}
//                         </span>
//                         <span className="election-type">{election.type}</span>
//                       </div>

//                       {/* Titre */}
//                       <h3 className="election-title">{election.titre}</h3>

//                       {/* Description */}
//                       {election.description && (
//                         <p className="election-desc">{election.description}</p>
//                       )}

//                       {/* Méta infos */}
//                       <div className="election-meta">
//                         <div className="election-meta-item">
//                           <Calendar size={13} />
//                           <span>{formatDate(election.date_debut)}</span>
//                           <span className="election-meta-sep">→</span>
//                           <span>{formatDate(election.date_fin)}</span>
//                         </div>
//                         <div className="election-meta-row">
//                           <div className="election-meta-item">
//                             <Users2 size={13} />
//                             <span>{election.nb_candidats ?? 0} candidat(s)</span>
//                           </div>
//                           <div className="election-meta-item">
//                             <Vote size={13} />
//                             <span>{election.nb_electeurs ?? 0} électeur(s)</span>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Boutons d'action */}
//                       <div className="election-actions">
//                         {canVote && (
//                           <button
//                             className="election-btn election-btn--vote"
//                             onClick={() => navigate(`/election-publique/${election.id_election}`)}
//                           >
//                             🗳 Voter
//                           </button>
//                         )}
//                         {canPostuler && (
//                           <button
//                             className="election-btn election-btn--candidat"
//                             onClick={() => navigate(`/election-publique/${election.id_election}?action=candidature`)}
//                           >
//                             ✋ Être candidat
//                           </button>
//                         )}
//                         <button
//                           className="election-btn election-btn--details"
//                           onClick={() => navigate(`/election-publique/${election.id_election}`)}
//                         >
//                           Voir les détails →
//                         </button>
//                       </div>
//                     </motion.div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         </section>

//         {/* ===== CTA ===== */}
//         <section className="cta-section">
//           <div className="cta-orb" />
//           <motion.div
//             className="cta-inner"
//             initial={{ opacity: 0, y: 28 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//           >
//             <span className="cta-badge">Prêt à commencer ?</span>
//             <h2 className="cta-title">Lancez votre élection aujourd'hui</h2>
//             <p className="cta-desc">
//               Simplifiez vos scrutins et garantissez la transparence pour tous vos participants.
//             </p>
//             <div className="cta-btns">
//               <button onClick={() => navigate("/creer-election")} className="cta-btn-primary">
//                 Créer une élection <ArrowRight size={16} />
//               </button>
//               <button onClick={() => navigate("/login")} className="cta-btn-ghost">
//                 Se connecter
//               </button>
//             </div>
//           </motion.div>
//         </section>

//         {/* ===== FOOTER ===== */}
//         <footer className="footer">
//           <div className="footer-inner">
//             <div className="footer-logo">
//               <span>🗳</span>
//               <span className="footer-logo-text">EVote</span>
//             </div>
//             <p className="footer-copy">© {new Date().getFullYear()} EVote. Tous droits réservés.</p>
//           </div>
//         </footer>

//       </div>
//     </>
//   );
// }

// /* ============================================================
//    STYLES
//    ============================================================ */
// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

//   :root {
//     --indigo-50:  #eef2ff;
//     --indigo-100: #e0e7ff;
//     --indigo-200: #c7d2fe;
//     --indigo-500: #6366f1;
//     --indigo-600: #4f46e5;
//     --indigo-700: #4338ca;
//     --indigo-900: #1e1b4b;
//     --gray-50:    #f9fafb;
//     --gray-100:   #f3f4f6;
//     --gray-500:   #6b7280;
//     --gray-600:   #4b5563;
//     --gray-800:   #1f2937;
//     --white:      #ffffff;
//   }

//   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//   .home-root {
//     min-height: 100vh;
//     font-family: 'Outfit', sans-serif;
//     color: var(--gray-800);
//     background: var(--white);
//   }

//   /* ── NAVBAR ── */
//   .navbar {
//     position: fixed; top: 0; left: 0; right: 0; z-index: 100;
//     background: rgba(255,255,255,0.97);
//     backdrop-filter: blur(12px);
//     border-bottom: 1px solid rgba(99,102,241,0.12);
//     box-shadow: 0 1px 16px rgba(0,0,0,0.05);
//   }
//   .navbar-inner {
//     max-width: 1200px; margin: 0 auto;
//     padding: 0 32px; height: 62px;
//     display: flex; align-items: center;
//     justify-content: space-between; gap: 24px;
//   }
//   .navbar-logo { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
//   .logo-icon { font-size: 20px; }
//   .logo-text { font-size: 19px; font-weight: 900; color: var(--indigo-600); letter-spacing: -0.5px; }
//   .navbar-links { display: flex; align-items: center; gap: 4px; }
//   .nav-link-section {
//     display: inline-flex; align-items: center; gap: 6px;
//     padding: 8px 16px; border-radius: 9px;
//     font-size: 13.5px; font-weight: 600;
//     color: var(--gray-500); text-decoration: none;
//     transition: background .15s, color .15s;
//   }
//   .nav-link-section:hover { background: var(--indigo-50); color: var(--indigo-600); }
//   .nav-link-elections { color: #0369a1; }
//   .nav-link-elections:hover { background: #f0f9ff; color: #0369a1; }
//   .nav-badge {
//     background: #0ea5e9; color: white;
//     font-size: 10px; font-weight: 800;
//     padding: 1px 7px; border-radius: 999px;
//     min-width: 18px; text-align: center;
//   }
//   .navbar-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
//   .navbar-btn-ghost {
//     display: inline-flex; align-items: center; gap: 7px;
//     padding: 8px 16px; border-radius: 9px; border: none;
//     background: transparent; color: var(--gray-500);
//     font-size: 13.5px; font-weight: 600; font-family: 'Outfit', sans-serif;
//     cursor: pointer; transition: background .15s, color .15s, transform .15s;
//   }
//   .navbar-btn-ghost:hover { background: var(--indigo-50); color: var(--indigo-600); transform: translateY(-1px); }
//   .navbar-btn-filled {
//     display: inline-flex; align-items: center; gap: 7px;
//     padding: 8px 18px; border-radius: 9px; border: none;
//     background: var(--indigo-600); color: white;
//     font-size: 13.5px; font-weight: 600; font-family: 'Outfit', sans-serif;
//     cursor: pointer;
//     box-shadow: 0 4px 12px rgba(79,70,229,0.25);
//     transition: background .18s, transform .15s, box-shadow .18s;
//   }
//   .navbar-btn-filled:hover { background: var(--indigo-700); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79,70,229,0.35); }

//   /* ── BOUTONS HERO ── */
//   .btn-filled {
//     display: inline-flex; align-items: center; gap: 8px;
//     background: var(--indigo-600); color: #ffffff !important;
//     border: none; border-radius: 12px;
//     font-family: 'Outfit', sans-serif; font-weight: 700;
//     cursor: pointer; box-shadow: 0 6px 20px rgba(79,70,229,0.30);
//     transition: background .18s, transform .15s, box-shadow .18s; text-decoration: none;
//   }
//   .btn-filled:hover { background: var(--indigo-700); transform: translateY(-2px); box-shadow: 0 10px 28px rgba(79,70,229,0.38); color: #ffffff !important; }
//   .btn-outline {
//     display: inline-flex; align-items: center; gap: 7px;
//     padding: 13px 28px; border-radius: 12px;
//     border: 2px solid var(--indigo-600); background: transparent;
//     color: var(--indigo-600); font-size: 15px; font-weight: 600;
//     font-family: 'Outfit', sans-serif; cursor: pointer;
//     transition: background .15s, transform .15s;
//   }
//   .btn-outline:hover { background: var(--indigo-50); transform: translateY(-1px); }
//   .btn-lg { padding: 13px 28px; font-size: 15px; border-radius: 12px; }

//   /* ── HERO ── */
//   .hero {
//     padding-top: 110px; padding-bottom: 100px;
//     background: linear-gradient(135deg, #eef2ff 0%, #f8f9ff 55%, #eff6ff 100%);
//     position: relative; overflow: hidden;
//   }
//   .hero-orb { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; }
//   .hero-orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%); top: -200px; left: -200px; }
//   .hero-orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%); bottom: -100px; right: -100px; }
//   .hero-grid {
//     position: absolute; inset: 0; pointer-events: none;
//     background-image: linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px);
//     background-size: 44px 44px;
//   }
//   .hero-inner {
//     max-width: 1200px; margin: 0 auto; padding: 0 32px;
//     display: grid; grid-template-columns: 1fr 1fr;
//     gap: 64px; align-items: center; position: relative; z-index: 1;
//   }
//   .hero-badge {
//     display: inline-flex; align-items: center; gap: 8px;
//     background: white; border: 1px solid var(--indigo-200);
//     color: var(--indigo-600); padding: 6px 16px; border-radius: 999px;
//     font-size: 12.5px; font-weight: 600; letter-spacing: .4px;
//     text-transform: uppercase; margin-bottom: 20px;
//     box-shadow: 0 2px 8px rgba(99,102,241,0.10);
//   }
//   .badge-dot {
//     width: 7px; height: 7px; background: var(--indigo-500); border-radius: 50%;
//     animation: pulse 2s ease-in-out infinite;
//   }
//   @keyframes pulse {
//     0%, 100% { opacity: 1; transform: scale(1); }
//     50% { opacity: .6; transform: scale(0.85); }
//   }
//   .hero-title { font-size: 46px; font-weight: 900; line-height: 1.13; letter-spacing: -1.2px; color: var(--indigo-900); margin-bottom: 20px; }
//   .hero-title-accent { color: var(--indigo-600); }
//   .hero-desc { font-size: 16.5px; color: var(--gray-500); line-height: 1.7; margin-bottom: 32px; max-width: 480px; }
//   .hero-btns { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 28px; }
//   .hero-badges { display: flex; flex-wrap: wrap; gap: 16px; }
//   .trust-badge { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--gray-500); font-weight: 500; }
//   .trust-icon { color: #22c55e; flex-shrink: 0; }
//   .hero-img-wrap { position: relative; display: flex; justify-content: center; }
//   .hero-img-glow { position: absolute; inset: -20px; background: radial-gradient(circle, rgba(14,165,233,0.22) 0%, transparent 70%); border-radius: 50%; filter: blur(30px); z-index: 0; }
//   .hero-img { width: 100%; max-width: 460px; border-radius: 24px; box-shadow: 0 24px 64px rgba(14,165,233,0.22), 0 4px 16px rgba(0,0,0,0.08); position: relative; z-index: 1; }

//   /* ── STATS ── */
//   .stats-bar { background: white; border-top: 1px solid var(--indigo-100); border-bottom: 1px solid var(--indigo-100); }
//   .stats-inner { max-width: 1200px; margin: 0 auto; padding: 32px; display: grid; grid-template-columns: repeat(4, 1fr); }
//   .stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px; border-right: 1px solid var(--indigo-100); }
//   .stat-item:last-child { border-right: none; }
//   .stat-value { font-size: 26px; font-weight: 800; color: var(--indigo-600); letter-spacing: -0.5px; }
//   .stat-label { font-size: 13px; color: var(--gray-500); font-weight: 500; }

//   /* ── FEATURES ── */
//   .features { padding: 96px 0; background: var(--gray-50); }
//   .section-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
//   .section-header { text-align: center; margin-bottom: 56px; }
//   .section-badge {
//     display: inline-block; background: var(--indigo-50); color: var(--indigo-600);
//     border: 1px solid var(--indigo-100); padding: 4px 14px; border-radius: 999px;
//     font-size: 11.5px; font-weight: 600; letter-spacing: .8px;
//     text-transform: uppercase; margin-bottom: 14px;
//   }
//   .section-badge--sky { background: #f0f9ff; color: #0369a1; border-color: #bae6fd; }
//   .section-title { font-size: 34px; font-weight: 800; color: var(--indigo-900); letter-spacing: -0.7px; margin-bottom: 12px; }
//   .section-subtitle { font-size: 15.5px; color: var(--gray-500); max-width: 500px; margin: 0 auto; line-height: 1.6; }
//   .features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
//   .feature-card {
//     background: white; border: 1px solid #f0f0f0; border-radius: 20px;
//     padding: 32px 24px; text-align: center;
//     box-shadow: 0 2px 12px rgba(0,0,0,0.04);
//     transition: box-shadow .2s, transform .2s; cursor: default;
//   }
//   .feature-card:hover { box-shadow: 0 12px 36px rgba(79,70,229,0.12); }
//   .feature-icon-wrap { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 18px; }
//   .feature-title { font-size: 16px; font-weight: 700; color: var(--indigo-900); margin-bottom: 8px; letter-spacing: -0.2px; }
//   .feature-text { font-size: 13.5px; color: var(--gray-500); line-height: 1.6; }

//   /* ── ÉLECTIONS PUBLIQUES ── */
//   .elections-pub-section { padding: 96px 0; background: white; }
//   .elections-loading { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px 0; color: var(--gray-500); font-size: 14px; }
//   .elections-spinner { width: 36px; height: 36px; border: 4px solid var(--indigo-100); border-top-color: var(--indigo-500); border-radius: 50%; animation: spin 0.9s linear infinite; }
//   @keyframes spin { to { transform: rotate(360deg); } }
//   .elections-empty { text-align: center; padding: 60px 32px; }
//   .elections-empty-icon { font-size: 52px; margin-bottom: 16px; }
//   .elections-empty h3 { font-size: 20px; font-weight: 800; color: var(--indigo-900); margin-bottom: 8px; }
//   .elections-empty p { font-size: 14px; color: var(--gray-500); margin-bottom: 20px; }
//   .elections-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }

//   /* ── CARTE ÉLECTION PUBLIQUE ── */
//   .election-card {
//     background: white; border: 1.5px solid #e0e7ff; border-radius: 22px;
//     padding: 24px; display: flex; flex-direction: column; gap: 14px;
//     box-shadow: 0 4px 20px rgba(99,102,241,0.07);
//     transition: box-shadow .2s, transform .2s, border-color .2s;
//     cursor: default;
//   }
//   .election-card:hover { box-shadow: 0 16px 48px rgba(79,70,229,0.15); border-color: #a5b4fc; }
//   .election-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
//   .election-statut {
//     display: inline-flex; align-items: center; gap: 6px;
//     padding: 5px 12px; border-radius: 999px;
//     font-size: 12px; font-weight: 700;
//   }
//   .statut-pulse {
//     display: inline-block; width: 7px; height: 7px; border-radius: 50%;
//     animation: pulse 1.5s ease-in-out infinite;
//   }
//   .election-type {
//     font-size: 11px; font-weight: 700;
//     background: var(--indigo-50); color: var(--indigo-600);
//     padding: 4px 10px; border-radius: 7px;
//     flex-shrink: 0;
//   }
//   .election-title { font-size: 17px; font-weight: 800; color: var(--indigo-900); line-height: 1.3; }
//   .election-desc {
//     font-size: 13px; color: var(--gray-500); line-height: 1.6;
//     display: -webkit-box; -webkit-line-clamp: 2;
//     -webkit-box-orient: vertical; overflow: hidden;
//   }
//   .election-meta { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; background: #f8faff; border-radius: 12px; border: 1px solid #eef2ff; }
//   .election-meta-row { display: flex; align-items: center; gap: 16px; }
//   .election-meta-item { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--gray-500); font-weight: 500; }
//   .election-meta-sep { color: #c7d2fe; font-weight: 300; }
//   .election-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
//   .election-btn {
//     flex: 1; min-width: 90px; padding: 10px 12px;
//     border-radius: 11px; font-size: 13px; font-weight: 700;
//     font-family: 'Outfit', sans-serif; cursor: pointer;
//     transition: all .15s; border: none; text-align: center;
//     white-space: nowrap;
//   }
//   .election-btn--vote {
//     background: var(--indigo-600); color: white;
//     box-shadow: 0 3px 10px rgba(79,70,229,0.28);
//   }
//   .election-btn--vote:hover { background: var(--indigo-700); transform: translateY(-1px); }
//   .election-btn--candidat {
//     background: transparent; color: var(--indigo-600);
//     border: 2px solid var(--indigo-200) !important;
//   }
//   .election-btn--candidat:hover { background: var(--indigo-50); border-color: var(--indigo-400) !important; }
//   .election-btn--details {
//     background: #f3f4f6; color: var(--gray-600);
//     font-weight: 600;
//     flex: none;
//     padding: 10px 14px;
//   }
//   .election-btn--details:hover { background: #e5e7eb; }

//   /* ── CTA ── */
//   .cta-section {
//     background: linear-gradient(135deg, var(--indigo-600) 0%, #4338ca 100%);
//     padding: 100px 32px; text-align: center; position: relative; overflow: hidden;
//   }
//   .cta-orb { position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%); border-radius: 50%; top: -200px; left: 50%; transform: translateX(-50%); pointer-events: none; }
//   .cta-inner { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
//   .cta-badge { display: inline-block; background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.25); padding: 4px 16px; border-radius: 999px; font-size: 12px; font-weight: 600; letter-spacing: .8px; text-transform: uppercase; margin-bottom: 20px; }
//   .cta-title { font-size: 38px; font-weight: 900; color: white; letter-spacing: -0.8px; margin-bottom: 14px; line-height: 1.2; }
//   .cta-desc { font-size: 16px; color: rgba(255,255,255,0.80); margin-bottom: 36px; line-height: 1.6; }
//   .cta-btns { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
//   .cta-btn-primary {
//     display: inline-flex; align-items: center; gap: 8px;
//     padding: 14px 32px; background: white; color: var(--indigo-600);
//     border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
//     font-family: 'Outfit', sans-serif; cursor: pointer;
//     box-shadow: 0 6px 20px rgba(0,0,0,0.15);
//     transition: background .15s, transform .15s, box-shadow .15s;
//   }
//   .cta-btn-primary:hover { background: #f5f5ff; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.18); }
//   .cta-btn-ghost {
//     padding: 13px 28px; background: transparent; color: white;
//     border: 2px solid rgba(255,255,255,0.40); border-radius: 12px;
//     font-size: 15px; font-weight: 600; font-family: 'Outfit', sans-serif;
//     cursor: pointer; transition: background .15s, border-color .15s, transform .15s;
//   }
//   .cta-btn-ghost:hover { background: rgba(255,255,255,0.10); border-color: rgba(255,255,255,0.65); transform: translateY(-1px); }

//   /* ── FOOTER ── */
//   .footer { background: var(--indigo-900); padding: 28px 32px; }
//   .footer-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
//   .footer-logo { display: flex; align-items: center; gap: 8px; font-size: 18px; }
//   .footer-logo-text { font-weight: 700; color: white; letter-spacing: -0.3px; }
//   .footer-copy { font-size: 13px; color: rgba(255,255,255,0.40); }

//   /* ── RESPONSIVE ── */
//   @media (max-width: 900px) {
//     .hero-inner { grid-template-columns: 1fr; gap: 40px; }
//     .hero-img { max-width: 340px; }
//     .hero-title { font-size: 34px; }
//     .features-grid { grid-template-columns: 1fr 1fr; }
//     .stats-inner { grid-template-columns: 1fr 1fr; }
//     .stat-item:nth-child(2) { border-right: none; }
//     .navbar-links { display: none; }
//   }
//   @media (max-width: 580px) {
//     .navbar-inner { padding: 0 20px; }
//     .features-grid { grid-template-columns: 1fr; }
//     .stats-inner { grid-template-columns: 1fr 1fr; }
//     .hero { padding-top: 100px; padding-bottom: 60px; }
//     .hero-inner { padding: 0 20px; }
//     .section-inner { padding: 0 20px; }
//     .elections-grid { grid-template-columns: 1fr; }
//     .election-actions { flex-direction: column; }
//     .election-btn { flex: none; width: 100%; }
//   }
// `;


































// // src/pages/HomePage.jsx
// import React from "react";
// import { motion } from "framer-motion";
// import { ShieldCheck, Users, Vote, BarChart3, CheckCircle, ArrowRight } from "lucide-react";
// import { FiLogIn } from "react-icons/fi";
// import { useNavigate } from "react-router-dom";
// import accueilIMG from "./accueil.png";

// export default function HomePage() {
//   const navigate = useNavigate();

//   return (
//     <>
//       <style>{styles}</style>
//       <div className="home-root">

//         {/* ===== NAVBAR ===== */}
//         <header className="navbar">
//           <div className="navbar-inner">
//             <div className="navbar-logo">
//               <span className="logo-icon">🗳</span>
//               <span className="logo-text">EVote</span>
//             </div>

//             <nav className="navbar-links">
//               <a href="#fonctionnalites" className="nav-link-section">Fonctionnalités</a>
//               <a href="#pourquoi" className="nav-link-section">Pourquoi nous</a>
//             </nav>

//             <div className="navbar-actions">
//               <button onClick={() => navigate("/login")} className="navbar-btn-ghost">
//                 <FiLogIn size={14} /> Connexion
//               </button>
//               <button onClick={() => navigate("/creer-election")} className="navbar-btn-filled">
//                 Créer une élection <ArrowRight size={14} />
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* ===== HERO ===== */}
//         <section className="hero" id="accueil">
//           <div className="hero-orb hero-orb-1" />
//           <div className="hero-orb hero-orb-2" />
//           <div className="hero-grid" />

//           <div className="hero-inner">
//             <motion.div
//               className="hero-text"
//               initial={{ opacity: 0, x: -36 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
//             >
//               <span className="hero-badge">
//                 <span className="badge-dot" />
//                 Vote électronique sécurisé
//               </span>

//               <h1 className="hero-title">
//                 Organisez vos élections{" "}
//                 <span className="hero-title-accent">facilement et en toute confiance</span>
//               </h1>

//               <p className="hero-desc">
//                 Digitalisez vos scrutins pour écoles, universités et entreprises avec
//                 transparence, sécurité et simplicité.
//               </p>

//               <div className="hero-btns">
//                 <button onClick={() => navigate("/login")} className="btn-filled btn-lg">
//                   Commencer à voter <ArrowRight size={16} />
//                 </button>
//                 <button onClick={() => navigate("/creer-election")} className="btn-outline btn-lg">
//                   Organiser une élection
//                 </button>
//               </div>

//               <div className="hero-badges">
//                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Données chiffrées</div>
//                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Résultats instantanés</div>
//                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Accès sécurisé</div>
//               </div>
//             </motion.div>

//             <motion.div
//               className="hero-img-wrap"
//               initial={{ opacity: 0, y: 36 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
//             >
//               <div className="hero-img-glow" />
//               <img src={accueilIMG} alt="Vote en ligne" className="hero-img" />
//             </motion.div>
//           </div>
//         </section>

//         {/* ===== STATS ===== */}
//         <section className="stats-bar">
//           <div className="stats-inner">
//             {[
//               { value: "247+", label: "Votes traités" },
//               { value: "12+", label: "Élections organisées" },
//               { value: "99.9%", label: "Disponibilité" },
//               { value: "100%", label: "Résultats transparents" },
//             ].map((s, i) => (
//               <motion.div
//                 key={i}
//                 className="stat-item"
//                 initial={{ opacity: 0, y: 20 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 transition={{ delay: i * 0.08 }}
//               >
//                 <span className="stat-value">{s.value}</span>
//                 <span className="stat-label">{s.label}</span>
//               </motion.div>
//             ))}
//           </div>
//         </section>

//         {/* ===== FEATURES ===== */}
//         <section className="features" id="fonctionnalites">
//           <div className="section-inner">
//             <div className="section-header">
//               <span className="section-badge">Fonctionnalités</span>
//               <h2 className="section-title">Pourquoi choisir EVote ?</h2>
//               <p className="section-subtitle">
//                 Une plateforme complète pensée pour la fiabilité et la simplicité.
//               </p>
//             </div>

//             <div className="features-grid" id="pourquoi">
//               {[
//                 {
//                   icon: <ShieldCheck size={24} />,
//                   title: "Sécurité maximale",
//                   text: "Chiffrement bout en bout des votes avec protection anti-fraude intégrée.",
//                   color: "#6366f1",
//                   bg: "#eef2ff",
//                 },
//                 {
//                   icon: <Users size={24} />,
//                   title: "Multi-rôles",
//                   text: "Gestion claire des admins, électeurs et super administrateurs.",
//                   color: "#0ea5e9",
//                   bg: "#f0f9ff",
//                 },
//                 {
//                   icon: <Vote size={24} />,
//                   title: "Interface intuitive",
//                   text: "Expérience de vote simple, rapide et entièrement responsive.",
//                   color: "#8b5cf6",
//                   bg: "#f5f3ff",
//                 },
//                 {
//                   icon: <BarChart3 size={24} />,
//                   title: "Statistiques en direct",
//                   text: "Résultats transparents et visualisables en temps réel.",
//                   color: "#10b981",
//                   bg: "#f0fdf4",
//                 },
//               ].map((f, i) => (
//                 <motion.div
//                   key={i}
//                   className="feature-card"
//                   initial={{ opacity: 0, y: 24 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   viewport={{ once: true }}
//                   transition={{ delay: i * 0.1 }}
//                   whileHover={{ y: -6 }}
//                 >
//                   <div className="feature-icon-wrap" style={{ background: f.bg, color: f.color }}>
//                     {f.icon}
//                   </div>
//                   <h3 className="feature-title">{f.title}</h3>
//                   <p className="feature-text">{f.text}</p>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* ===== CTA ===== */}
//         <section className="cta-section">
//           <div className="cta-orb" />
//           <motion.div
//             className="cta-inner"
//             initial={{ opacity: 0, y: 28 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//           >
//             <span className="cta-badge">Prêt à commencer ?</span>
//             <h2 className="cta-title">Lancez votre élection aujourd'hui</h2>
//             <p className="cta-desc">Simplifiez vos scrutins et garantissez la transparence pour tous vos participants.</p>
//             <div className="cta-btns">
//               <button onClick={() => navigate("/creer-election")} className="cta-btn-primary">
//                 Créer une élection <ArrowRight size={16} />
//               </button>
//               <button onClick={() => navigate("/login")} className="cta-btn-ghost">
//                 Se connecter
//               </button>
//             </div>
//           </motion.div>
//         </section>

//         {/* ===== FOOTER ===== */}
//         <footer className="footer">
//           <div className="footer-inner">
//             <div className="footer-logo">
//               <span>🗳</span>
//               <span className="footer-logo-text">EVote</span>
//             </div>
//             <p className="footer-copy">© {new Date().getFullYear()} EVote. Tous droits réservés.</p>
//           </div>
//         </footer>

//       </div>
//     </>
//   );
// }

// /* ============================================================
//    STYLES
//    ============================================================ */
// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

//   :root {
//     --indigo-50:  #eef2ff;
//     --indigo-100: #e0e7ff;
//     --indigo-200: #c7d2fe;
//     --indigo-500: #6366f1;
//     --indigo-600: #4f46e5;
//     --indigo-700: #4338ca;
//     --indigo-900: #1e1b4b;
//     --gray-50:    #f9fafb;
//     --gray-100:   #f3f4f6;
//     --gray-500:   #6b7280;
//     --gray-600:   #4b5563;
//     --gray-800:   #1f2937;
//     --white:      #ffffff;
//   }

//   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//   .home-root {
//     min-height: 100vh;
//     font-family: 'Outfit', sans-serif;
//     color: var(--gray-800);
//     background: var(--white);
//   }

//   /* ===== NAVBAR ===== */
//   .navbar {
//     position: fixed;
//     top: 0; left: 0; right: 0;
//     z-index: 100;
//     background: rgba(255,255,255,0.97);
//     backdrop-filter: blur(12px);
//     border-bottom: 1px solid rgba(99,102,241,0.12);
//     box-shadow: 0 1px 16px rgba(0,0,0,0.05);
//   }
//   .navbar-inner {
//     max-width: 1200px;
//     margin: 0 auto;
//     padding: 0 32px;
//     height: 62px;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     gap: 24px;
//   }
//   .navbar-logo {
//     display: flex;
//     align-items: center;
//     gap: 9px;
//     flex-shrink: 0;
//     text-decoration: none;
//   }
//   .logo-icon { font-size: 20px; }
//   .logo-text {
//     font-size: 19px;
//     font-weight: 900;
//     color: var(--indigo-600);
//     letter-spacing: -0.5px;
//   }
//   .navbar-links {
//     display: flex;
//     align-items: center;
//     gap: 4px;
//   }
//   .nav-link-section {
//     padding: 8px 16px;
//     border-radius: 9px;
//     font-size: 13.5px;
//     font-weight: 600;
//     color: var(--gray-500);
//     text-decoration: none;
//     transition: background .15s, color .15s;
//   }
//   .nav-link-section:hover { background: var(--indigo-50); color: var(--indigo-600); }

//   .navbar-actions {
//     display: flex;
//     align-items: center;
//     gap: 8px;
//     flex-shrink: 0;
//   }
//   .navbar-btn-ghost {
//     display: inline-flex;
//     align-items: center;
//     gap: 7px;
//     padding: 8px 16px;
//     border-radius: 9px;
//     border: none;
//     background: transparent;
//     color: var(--gray-500);
//     font-size: 13.5px;
//     font-weight: 600;
//     font-family: 'Outfit', sans-serif;
//     cursor: pointer;
//     transition: background .15s, color .15s, transform .15s;
//   }
//   .navbar-btn-ghost:hover { background: var(--indigo-50); color: var(--indigo-600); transform: translateY(-1px); }

//   .navbar-btn-filled {
//     display: inline-flex;
//     align-items: center;
//     gap: 7px;
//     padding: 8px 18px;
//     border-radius: 9px;
//     border: none;
//     background: var(--indigo-600);
//     color: white;
//     font-size: 13.5px;
//     font-weight: 600;
//     font-family: 'Outfit', sans-serif;
//     cursor: pointer;
//     box-shadow: 0 4px 12px rgba(79,70,229,0.25);
//     transition: background .18s, transform .15s, box-shadow .18s;
//   }
//   .navbar-btn-filled:hover { background: var(--indigo-700); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79,70,229,0.35); }

//   /* ===== HERO BUTTONS ===== */
//   .btn-filled {
//     display: inline-flex;
//     align-items: center;
//     gap: 8px;
//     background: var(--indigo-600);
//     color: #ffffff !important;
//     border: none;
//     border-radius: 12px;
//     font-family: 'Outfit', sans-serif;
//     font-weight: 700;
//     cursor: pointer;
//     box-shadow: 0 6px 20px rgba(79,70,229,0.30);
//     transition: background .18s, transform .15s, box-shadow .18s;
//     text-decoration: none;
//   }
//   .btn-filled:hover {
//     background: var(--indigo-700);
//     transform: translateY(-2px);
//     box-shadow: 0 10px 28px rgba(79,70,229,0.38);
//     color: #ffffff !important;
//   }
//   .btn-filled:active { transform: translateY(0); }

//   .btn-outline {
//     display: inline-flex;
//     align-items: center;
//     gap: 7px;
//     padding: 13px 28px;
//     border-radius: 12px;
//     border: 2px solid var(--indigo-600);
//     background: transparent;
//     color: var(--indigo-600);
//     font-size: 15px;
//     font-weight: 600;
//     font-family: 'Outfit', sans-serif;
//     cursor: pointer;
//     transition: background .15s, transform .15s;
//   }
//   .btn-outline:hover { background: var(--indigo-50); transform: translateY(-1px); }

//   .btn-lg { padding: 13px 28px; font-size: 15px; border-radius: 12px; }

//   /* ===== HERO ===== */
//   .hero {
//     padding-top: 110px;
//     padding-bottom: 100px;
//     background: linear-gradient(135deg, #eef2ff 0%, #f8f9ff 55%, #eff6ff 100%);
//     position: relative;
//     overflow: hidden;
//   }
//   .hero-orb {
//     position: absolute;
//     border-radius: 50%;
//     filter: blur(90px);
//     pointer-events: none;
//   }
//   .hero-orb-1 {
//     width: 600px; height: 600px;
//     background: radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%);
//     top: -200px; left: -200px;
//   }
//   /* ✅ MODIFIÉ : orbe côté illustration → bleu */
//   .hero-orb-2 {
//     width: 400px; height: 400px;
//     background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%);
//     bottom: -100px; right: -100px;
//   }
//   .hero-grid {
//     position: absolute; inset: 0;
//     background-image:
//       linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
//       linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px);
//     background-size: 44px 44px;
//     pointer-events: none;
//   }
//   .hero-inner {
//     max-width: 1200px;
//     margin: 0 auto;
//     padding: 0 32px;
//     display: grid;
//     grid-template-columns: 1fr 1fr;
//     gap: 64px;
//     align-items: center;
//     position: relative;
//     z-index: 1;
//   }
//   .hero-badge {
//     display: inline-flex;
//     align-items: center;
//     gap: 8px;
//     background: white;
//     border: 1px solid var(--indigo-200);
//     color: var(--indigo-600);
//     padding: 6px 16px;
//     border-radius: 999px;
//     font-size: 12.5px;
//     font-weight: 600;
//     letter-spacing: .4px;
//     text-transform: uppercase;
//     margin-bottom: 20px;
//     box-shadow: 0 2px 8px rgba(99,102,241,0.10);
//   }
//   .badge-dot {
//     width: 7px; height: 7px;
//     background: var(--indigo-500);
//     border-radius: 50%;
//     animation: pulse 2s ease-in-out infinite;
//   }
//   @keyframes pulse {
//     0%, 100% { opacity: 1; transform: scale(1); }
//     50% { opacity: .6; transform: scale(0.85); }
//   }
//   .hero-title {
//     font-size: 46px;
//     font-weight: 900;
//     line-height: 1.13;
//     letter-spacing: -1.2px;
//     color: var(--indigo-900);
//     margin-bottom: 20px;
//   }
//   .hero-title-accent { color: var(--indigo-600); }
//   .hero-desc {
//     font-size: 16.5px;
//     color: var(--gray-500);
//     line-height: 1.7;
//     margin-bottom: 32px;
//     max-width: 480px;
//   }
//   .hero-btns {
//     display: flex;
//     flex-wrap: wrap;
//     gap: 14px;
//     margin-bottom: 28px;
//   }
//   .hero-badges {
//     display: flex;
//     flex-wrap: wrap;
//     gap: 16px;
//   }
//   .trust-badge {
//     display: flex;
//     align-items: center;
//     gap: 6px;
//     font-size: 13px;
//     color: var(--gray-500);
//     font-weight: 500;
//   }
//   .trust-icon { color: #22c55e; flex-shrink: 0; }

//   .hero-img-wrap {
//     position: relative;
//     display: flex;
//     justify-content: center;
//   }
//   /* ✅ MODIFIÉ : glow illustration → bleu */
//   .hero-img-glow {
//     position: absolute;
//     inset: -20px;
//     background: radial-gradient(circle, rgba(14,165,233,0.22) 0%, transparent 70%);
//     border-radius: 50%;
//     filter: blur(30px);
//     z-index: 0;
//   }
//   /* ✅ MODIFIÉ : ombre image → bleu */
//   .hero-img {
//     width: 100%;
//     max-width: 460px;
//     border-radius: 24px;
//     box-shadow: 0 24px 64px rgba(14,165,233,0.22), 0 4px 16px rgba(0,0,0,0.08);
//     position: relative;
//     z-index: 1;
//   }

//   /* ===== STATS ===== */
//   .stats-bar {
//     background: white;
//     border-top: 1px solid var(--indigo-100);
//     border-bottom: 1px solid var(--indigo-100);
//   }
//   .stats-inner {
//     max-width: 1200px;
//     margin: 0 auto;
//     padding: 32px 32px;
//     display: grid;
//     grid-template-columns: repeat(4, 1fr);
//     gap: 0;
//   }
//   .stat-item {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 4px;
//     padding: 16px;
//     border-right: 1px solid var(--indigo-100);
//   }
//   .stat-item:last-child { border-right: none; }
//   .stat-value {
//     font-size: 26px;
//     font-weight: 800;
//     color: var(--indigo-600);
//     letter-spacing: -0.5px;
//   }
//   .stat-label {
//     font-size: 13px;
//     color: var(--gray-500);
//     font-weight: 500;
//   }

//   /* ===== FEATURES ===== */
//   .features {
//     padding: 96px 0;
//     background: var(--gray-50);
//   }
//   .section-inner {
//     max-width: 1200px;
//     margin: 0 auto;
//     padding: 0 32px;
//   }
//   .section-header {
//     text-align: center;
//     margin-bottom: 56px;
//   }
//   .section-badge {
//     display: inline-block;
//     background: var(--indigo-50);
//     color: var(--indigo-600);
//     border: 1px solid var(--indigo-100);
//     padding: 4px 14px;
//     border-radius: 999px;
//     font-size: 11.5px;
//     font-weight: 600;
//     letter-spacing: .8px;
//     text-transform: uppercase;
//     margin-bottom: 14px;
//   }
//   .section-title {
//     font-size: 34px;
//     font-weight: 800;
//     color: var(--indigo-900);
//     letter-spacing: -0.7px;
//     margin-bottom: 12px;
//   }
//   .section-subtitle {
//     font-size: 15.5px;
//     color: var(--gray-500);
//     max-width: 500px;
//     margin: 0 auto;
//     line-height: 1.6;
//   }
//   .features-grid {
//     display: grid;
//     grid-template-columns: repeat(4, 1fr);
//     gap: 24px;
//   }
//   .feature-card {
//     background: white;
//     border: 1px solid #f0f0f0;
//     border-radius: 20px;
//     padding: 32px 24px;
//     text-align: center;
//     box-shadow: 0 2px 12px rgba(0,0,0,0.04);
//     transition: box-shadow .2s, transform .2s;
//     cursor: default;
//   }
//   .feature-card:hover { box-shadow: 0 12px 36px rgba(79,70,229,0.12); }
//   .feature-icon-wrap {
//     display: inline-flex;
//     align-items: center;
//     justify-content: center;
//     width: 56px; height: 56px;
//     border-radius: 14px;
//     margin: 0 auto 18px;
//   }
//   .feature-title {
//     font-size: 16px;
//     font-weight: 700;
//     color: var(--indigo-900);
//     margin-bottom: 8px;
//     letter-spacing: -0.2px;
//   }
//   .feature-text {
//     font-size: 13.5px;
//     color: var(--gray-500);
//     line-height: 1.6;
//   }

//   /* ===== CTA ===== */
//   .cta-section {
//     background: linear-gradient(135deg, var(--indigo-600) 0%, #4338ca 100%);
//     padding: 100px 32px;
//     text-align: center;
//     position: relative;
//     overflow: hidden;
//   }
//   .cta-orb {
//     position: absolute;
//     width: 600px; height: 600px;
//     background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
//     border-radius: 50%;
//     top: -200px; left: 50%;
//     transform: translateX(-50%);
//     pointer-events: none;
//   }
//   .cta-inner {
//     position: relative;
//     z-index: 1;
//     max-width: 600px;
//     margin: 0 auto;
//   }
//   .cta-badge {
//     display: inline-block;
//     background: rgba(255,255,255,0.15);
//     color: white;
//     border: 1px solid rgba(255,255,255,0.25);
//     padding: 4px 16px;
//     border-radius: 999px;
//     font-size: 12px;
//     font-weight: 600;
//     letter-spacing: .8px;
//     text-transform: uppercase;
//     margin-bottom: 20px;
//   }
//   .cta-title {
//     font-size: 38px;
//     font-weight: 900;
//     color: white;
//     letter-spacing: -0.8px;
//     margin-bottom: 14px;
//     line-height: 1.2;
//   }
//   .cta-desc {
//     font-size: 16px;
//     color: rgba(255,255,255,0.80);
//     margin-bottom: 36px;
//     line-height: 1.6;
//   }
//   .cta-btns { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
//   .cta-btn-primary {
//     display: inline-flex;
//     align-items: center;
//     gap: 8px;
//     padding: 14px 32px;
//     background: white;
//     color: var(--indigo-600);
//     border: none;
//     border-radius: 12px;
//     font-size: 15px;
//     font-weight: 700;
//     font-family: 'Outfit', sans-serif;
//     cursor: pointer;
//     box-shadow: 0 6px 20px rgba(0,0,0,0.15);
//     transition: background .15s, transform .15s, box-shadow .15s;
//   }
//   .cta-btn-primary:hover { background: #f5f5ff; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.18); }
//   .cta-btn-ghost {
//     padding: 13px 28px;
//     background: transparent;
//     color: white;
//     border: 2px solid rgba(255,255,255,0.40);
//     border-radius: 12px;
//     font-size: 15px;
//     font-weight: 600;
//     font-family: 'Outfit', sans-serif;
//     cursor: pointer;
//     transition: background .15s, border-color .15s, transform .15s;
//   }
//   .cta-btn-ghost:hover { background: rgba(255,255,255,0.10); border-color: rgba(255,255,255,0.65); transform: translateY(-1px); }

//   /* ===== FOOTER ===== */
//   .footer {
//     background: var(--indigo-900);
//     padding: 28px 32px;
//   }
//   .footer-inner {
//     max-width: 1200px;
//     margin: 0 auto;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     flex-wrap: wrap;
//     gap: 12px;
//   }
//   .footer-logo {
//     display: flex;
//     align-items: center;
//     gap: 8px;
//     font-size: 18px;
//   }
//   .footer-logo-text {
//     font-weight: 700;
//     color: white;
//     letter-spacing: -0.3px;
//   }
//   .footer-copy {
//     font-size: 13px;
//     color: rgba(255,255,255,0.40);
//   }

//   /* ===== RESPONSIVE ===== */
//   @media (max-width: 900px) {
//     .hero-inner { grid-template-columns: 1fr; gap: 40px; }
//     .hero-img { max-width: 340px; }
//     .hero-title { font-size: 34px; }
//     .features-grid { grid-template-columns: 1fr 1fr; }
//     .stats-inner { grid-template-columns: 1fr 1fr; }
//     .stat-item:nth-child(2) { border-right: none; }
//     .navbar-links { display: none; }
//   }
//   @media (max-width: 580px) {
//     .navbar-inner { padding: 0 20px; }
//     .navbar-btn-ghost span { display: none; }
//     .features-grid { grid-template-columns: 1fr; }
//     .stats-inner { grid-template-columns: 1fr 1fr; }
//     .hero { padding-top: 100px; padding-bottom: 60px; }
//     .hero-inner { padding: 0 20px; }
//     .section-inner { padding: 0 20px; }
//   }
// `;








































// // // src/pages/HomePage.jsx
// // import React from "react";
// // import { motion } from "framer-motion";
// // import { ShieldCheck, Users, Vote, BarChart3, CheckCircle, ArrowRight } from "lucide-react";
// // import { FiLogIn } from "react-icons/fi";
// // import { useNavigate } from "react-router-dom";
// // import accueilIMG from "./accueil.png";

// // export default function HomePage() {
// //   const navigate = useNavigate();

// //   return (
// //     <>
// //       <style>{styles}</style>
// //       <div className="home-root">

// //         {/* ===== NAVBAR ===== */}
// //         <header className="navbar">
// //           <div className="navbar-inner">
// //             <div className="navbar-logo">
// //               <span className="logo-icon">🗳</span>
// //               <span className="logo-text">EVote</span>
// //             </div>

// //             <nav className="navbar-links">
// //               <a href="#fonctionnalites" className="nav-link-section">Fonctionnalités</a>
// //               <a href="#pourquoi" className="nav-link-section">Pourquoi nous</a>
// //             </nav>

// //             <div className="navbar-actions">
// //               <button onClick={() => navigate("/login")} className="navbar-btn-ghost">
// //                 <FiLogIn size={14} /> Connexion
// //               </button>
// //               <button onClick={() => navigate("/creer-election")} className="navbar-btn-filled">
// //                 Créer une élection <ArrowRight size={14} />
// //               </button>
// //             </div>
// //           </div>
// //         </header>

// //         {/* ===== HERO ===== */}
// //         <section className="hero" id="accueil">
// //           <div className="hero-orb hero-orb-1" />
// //           <div className="hero-orb hero-orb-2" />
// //           <div className="hero-grid" />

// //           <div className="hero-inner">
// //             <motion.div
// //               className="hero-text"
// //               initial={{ opacity: 0, x: -36 }}
// //               animate={{ opacity: 1, x: 0 }}
// //               transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
// //             >
// //               <span className="hero-badge">
// //                 <span className="badge-dot" />
// //                 Vote électronique sécurisé
// //               </span>

// //               <h1 className="hero-title">
// //                 Organisez vos élections{" "}
// //                 <span className="hero-title-accent">facilement et en toute confiance</span>
// //               </h1>

// //               <p className="hero-desc">
// //                 Digitalisez vos scrutins pour écoles, universités et entreprises avec
// //                 transparence, sécurité et simplicité.
// //               </p>

// //               <div className="hero-btns">
// //                 <button onClick={() => navigate("/login")} className="btn-filled btn-lg">
// //                   Commencer à voter <ArrowRight size={16} />
// //                 </button>
// //                 <button onClick={() => navigate("/creer-election")} className="btn-outline btn-lg">
// //                   Organiser une élection
// //                 </button>
// //               </div>

// //               <div className="hero-badges">
// //                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Données chiffrées</div>
// //                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Résultats instantanés</div>
// //                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Accès sécurisé</div>
// //               </div>
// //             </motion.div>

// //             <motion.div
// //               className="hero-img-wrap"
// //               initial={{ opacity: 0, y: 36 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
// //             >
// //               <div className="hero-img-glow" />
// //               <img src={accueilIMG} alt="Vote en ligne" className="hero-img" />
// //             </motion.div>
// //           </div>
// //         </section>

// //         {/* ===== STATS ===== */}
// //         <section className="stats-bar">
// //           <div className="stats-inner">
// //             {[
// //               { value: "247+", label: "Votes traités" },
// //               { value: "12+", label: "Élections organisées" },
// //               { value: "99.9%", label: "Disponibilité" },
// //               { value: "100%", label: "Résultats transparents" },
// //             ].map((s, i) => (
// //               <motion.div
// //                 key={i}
// //                 className="stat-item"
// //                 initial={{ opacity: 0, y: 20 }}
// //                 whileInView={{ opacity: 1, y: 0 }}
// //                 viewport={{ once: true }}
// //                 transition={{ delay: i * 0.08 }}
// //               >
// //                 <span className="stat-value">{s.value}</span>
// //                 <span className="stat-label">{s.label}</span>
// //               </motion.div>
// //             ))}
// //           </div>
// //         </section>

// //         {/* ===== FEATURES ===== */}
// //         <section className="features" id="fonctionnalites">
// //           <div className="section-inner">
// //             <div className="section-header">
// //               <span className="section-badge">Fonctionnalités</span>
// //               <h2 className="section-title">Pourquoi choisir EVote ?</h2>
// //               <p className="section-subtitle">
// //                 Une plateforme complète pensée pour la fiabilité et la simplicité.
// //               </p>
// //             </div>

// //             <div className="features-grid" id="pourquoi">
// //               {[
// //                 {
// //                   icon: <ShieldCheck size={24} />,
// //                   title: "Sécurité maximale",
// //                   text: "Chiffrement bout en bout des votes avec protection anti-fraude intégrée.",
// //                   color: "#6366f1",
// //                   bg: "#eef2ff",
// //                 },
// //                 {
// //                   icon: <Users size={24} />,
// //                   title: "Multi-rôles",
// //                   text: "Gestion claire des admins, électeurs et super administrateurs.",
// //                   color: "#0ea5e9",
// //                   bg: "#f0f9ff",
// //                 },
// //                 {
// //                   icon: <Vote size={24} />,
// //                   title: "Interface intuitive",
// //                   text: "Expérience de vote simple, rapide et entièrement responsive.",
// //                   color: "#8b5cf6",
// //                   bg: "#f5f3ff",
// //                 },
// //                 {
// //                   icon: <BarChart3 size={24} />,
// //                   title: "Statistiques en direct",
// //                   text: "Résultats transparents et visualisables en temps réel.",
// //                   color: "#10b981",
// //                   bg: "#f0fdf4",
// //                 },
// //               ].map((f, i) => (
// //                 <motion.div
// //                   key={i}
// //                   className="feature-card"
// //                   initial={{ opacity: 0, y: 24 }}
// //                   whileInView={{ opacity: 1, y: 0 }}
// //                   viewport={{ once: true }}
// //                   transition={{ delay: i * 0.1 }}
// //                   whileHover={{ y: -6 }}
// //                 >
// //                   <div className="feature-icon-wrap" style={{ background: f.bg, color: f.color }}>
// //                     {f.icon}
// //                   </div>
// //                   <h3 className="feature-title">{f.title}</h3>
// //                   <p className="feature-text">{f.text}</p>
// //                 </motion.div>
// //               ))}
// //             </div>
// //           </div>
// //         </section>

// //         {/* ===== CTA ===== */}
// //         <section className="cta-section">
// //           <div className="cta-orb" />
// //           <motion.div
// //             className="cta-inner"
// //             initial={{ opacity: 0, y: 28 }}
// //             whileInView={{ opacity: 1, y: 0 }}
// //             viewport={{ once: true }}
// //           >
// //             <span className="cta-badge">Prêt à commencer ?</span>
// //             <h2 className="cta-title">Lancez votre élection aujourd'hui</h2>
// //             <p className="cta-desc">Simplifiez vos scrutins et garantissez la transparence pour tous vos participants.</p>
// //             <div className="cta-btns">
// //               <button onClick={() => navigate("/creer-election")} className="cta-btn-primary">
// //                 Créer une élection <ArrowRight size={16} />
// //               </button>
// //               <button onClick={() => navigate("/login")} className="cta-btn-ghost">
// //                 Se connecter
// //               </button>
// //             </div>
// //           </motion.div>
// //         </section>

// //         {/* ===== FOOTER ===== */}
// //         <footer className="footer">
// //           <div className="footer-inner">
// //             <div className="footer-logo">
// //               <span>🗳</span>
// //               <span className="footer-logo-text">EVote</span>
// //             </div>
// //             <p className="footer-copy">© {new Date().getFullYear()} EVote. Tous droits réservés.</p>
// //           </div>
// //         </footer>

// //       </div>
// //     </>
// //   );
// // }

// // /* ============================================================
// //    STYLES
// //    ============================================================ */
// // const styles = `
// //   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

// //   :root {
// //     --indigo-50:  #eef2ff;
// //     --indigo-100: #e0e7ff;
// //     --indigo-200: #c7d2fe;
// //     --indigo-500: #6366f1;
// //     --indigo-600: #4f46e5;
// //     --indigo-700: #4338ca;
// //     --indigo-900: #1e1b4b;
// //     --gray-50:    #f9fafb;
// //     --gray-100:   #f3f4f6;
// //     --gray-500:   #6b7280;
// //     --gray-600:   #4b5563;
// //     --gray-800:   #1f2937;
// //     --white:      #ffffff;
// //   }

// //   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

// //   .home-root {
// //     min-height: 100vh;
// //     font-family: 'Outfit', sans-serif;
// //     color: var(--gray-800);
// //     background: var(--white);
// //   }

// //   /* ===== NAVBAR ===== */
// //   .navbar {
// //     position: fixed;
// //     top: 0; left: 0; right: 0;
// //     z-index: 100;
// //     background: rgba(255,255,255,0.97);
// //     backdrop-filter: blur(12px);
// //     border-bottom: 1px solid rgba(99,102,241,0.12);
// //     box-shadow: 0 1px 16px rgba(0,0,0,0.05);
// //   }
// //   .navbar-inner {
// //     max-width: 1200px;
// //     margin: 0 auto;
// //     padding: 0 32px;
// //     height: 62px;
// //     display: flex;
// //     align-items: center;
// //     justify-content: space-between;
// //     gap: 24px;
// //   }
// //   .navbar-logo {
// //     display: flex;
// //     align-items: center;
// //     gap: 9px;
// //     flex-shrink: 0;
// //     text-decoration: none;
// //   }
// //   .logo-icon { font-size: 20px; }
// //   .logo-text {
// //     font-size: 19px;
// //     font-weight: 900;
// //     color: var(--indigo-600);
// //     letter-spacing: -0.5px;
// //   }
// //   .navbar-links {
// //     display: flex;
// //     align-items: center;
// //     gap: 4px;
// //   }
// //   .nav-link-section {
// //     padding: 8px 16px;
// //     border-radius: 9px;
// //     font-size: 13.5px;
// //     font-weight: 600;
// //     color: var(--gray-500);
// //     text-decoration: none;
// //     transition: background .15s, color .15s;
// //   }
// //   .nav-link-section:hover { background: var(--indigo-50); color: var(--indigo-600); }

// //   .navbar-actions {
// //     display: flex;
// //     align-items: center;
// //     gap: 8px;
// //     flex-shrink: 0;
// //   }
// //   .navbar-btn-ghost {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 7px;
// //     padding: 8px 16px;
// //     border-radius: 9px;
// //     border: none;
// //     background: transparent;
// //     color: var(--gray-500);
// //     font-size: 13.5px;
// //     font-weight: 600;
// //     font-family: 'Outfit', sans-serif;
// //     cursor: pointer;
// //     transition: background .15s, color .15s, transform .15s;
// //   }
// //   .navbar-btn-ghost:hover { background: var(--indigo-50); color: var(--indigo-600); transform: translateY(-1px); }

// //   .navbar-btn-filled {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 7px;
// //     padding: 8px 18px;
// //     border-radius: 9px;
// //     border: none;
// //     background: var(--indigo-600);
// //     color: white;
// //     font-size: 13.5px;
// //     font-weight: 600;
// //     font-family: 'Outfit', sans-serif;
// //     cursor: pointer;
// //     box-shadow: 0 4px 12px rgba(79,70,229,0.25);
// //     transition: background .18s, transform .15s, box-shadow .18s;
// //   }
// //   .navbar-btn-filled:hover { background: var(--indigo-700); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79,70,229,0.35); }

// //   /* ===== HERO BUTTONS — FIX ===== */
// //   .btn-filled {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 8px;
// //     background: var(--indigo-600);
// //     color: #ffffff !important;
// //     border: none;
// //     border-radius: 12px;
// //     font-family: 'Outfit', sans-serif;
// //     font-weight: 700;
// //     cursor: pointer;
// //     box-shadow: 0 6px 20px rgba(79,70,229,0.30);
// //     transition: background .18s, transform .15s, box-shadow .18s;
// //     text-decoration: none;
// //   }
// //   .btn-filled:hover {
// //     background: var(--indigo-700);
// //     transform: translateY(-2px);
// //     box-shadow: 0 10px 28px rgba(79,70,229,0.38);
// //     color: #ffffff !important;
// //   }
// //   .btn-filled:active { transform: translateY(0); }

// //   .btn-outline {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 7px;
// //     padding: 13px 28px;
// //     border-radius: 12px;
// //     border: 2px solid var(--indigo-600);
// //     background: transparent;
// //     color: var(--indigo-600);
// //     font-size: 15px;
// //     font-weight: 600;
// //     font-family: 'Outfit', sans-serif;
// //     cursor: pointer;
// //     transition: background .15s, transform .15s;
// //   }
// //   .btn-outline:hover { background: var(--indigo-50); transform: translateY(-1px); }

// //   .btn-lg { padding: 13px 28px; font-size: 15px; border-radius: 12px; }

// //   /* ===== HERO ===== */
// //   .hero {
// //     padding-top: 110px;
// //     padding-bottom: 100px;
// //     background: linear-gradient(135deg, #eef2ff 0%, #f8f9ff 55%, #eff6ff 100%);
// //     position: relative;
// //     overflow: hidden;
// //   }
// //   .hero-orb {
// //     position: absolute;
// //     border-radius: 50%;
// //     filter: blur(90px);
// //     pointer-events: none;
// //   }
// //   .hero-orb-1 {
// //     width: 600px; height: 600px;
// //     background: radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%);
// //     top: -200px; left: -200px;
// //   }
// //   .hero-orb-2 {
// //     width: 400px; height: 400px;
// //     background: radial-gradient(circle, rgba(79,70,229,0.09) 0%, transparent 70%);
// //     bottom: -100px; right: -100px;
// //   }
// //   .hero-grid {
// //     position: absolute; inset: 0;
// //     background-image:
// //       linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
// //       linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px);
// //     background-size: 44px 44px;
// //     pointer-events: none;
// //   }
// //   .hero-inner {
// //     max-width: 1200px;
// //     margin: 0 auto;
// //     padding: 0 32px;
// //     display: grid;
// //     grid-template-columns: 1fr 1fr;
// //     gap: 64px;
// //     align-items: center;
// //     position: relative;
// //     z-index: 1;
// //   }
// //   .hero-badge {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 8px;
// //     background: white;
// //     border: 1px solid var(--indigo-200);
// //     color: var(--indigo-600);
// //     padding: 6px 16px;
// //     border-radius: 999px;
// //     font-size: 12.5px;
// //     font-weight: 600;
// //     letter-spacing: .4px;
// //     text-transform: uppercase;
// //     margin-bottom: 20px;
// //     box-shadow: 0 2px 8px rgba(99,102,241,0.10);
// //   }
// //   .badge-dot {
// //     width: 7px; height: 7px;
// //     background: var(--indigo-500);
// //     border-radius: 50%;
// //     animation: pulse 2s ease-in-out infinite;
// //   }
// //   @keyframes pulse {
// //     0%, 100% { opacity: 1; transform: scale(1); }
// //     50% { opacity: .6; transform: scale(0.85); }
// //   }
// //   .hero-title {
// //     font-size: 46px;
// //     font-weight: 900;
// //     line-height: 1.13;
// //     letter-spacing: -1.2px;
// //     color: var(--indigo-900);
// //     margin-bottom: 20px;
// //   }
// //   .hero-title-accent { color: var(--indigo-600); }
// //   .hero-desc {
// //     font-size: 16.5px;
// //     color: var(--gray-500);
// //     line-height: 1.7;
// //     margin-bottom: 32px;
// //     max-width: 480px;
// //   }
// //   .hero-btns {
// //     display: flex;
// //     flex-wrap: wrap;
// //     gap: 14px;
// //     margin-bottom: 28px;
// //   }
// //   .hero-badges {
// //     display: flex;
// //     flex-wrap: wrap;
// //     gap: 16px;
// //   }
// //   .trust-badge {
// //     display: flex;
// //     align-items: center;
// //     gap: 6px;
// //     font-size: 13px;
// //     color: var(--gray-500);
// //     font-weight: 500;
// //   }
// //   .trust-icon { color: #22c55e; flex-shrink: 0; }

// //   .hero-img-wrap {
// //     position: relative;
// //     display: flex;
// //     justify-content: center;
// //   }
// //   .hero-img-glow {
// //     position: absolute;
// //     inset: -20px;
// //     background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
// //     border-radius: 50%;
// //     filter: blur(30px);
// //     z-index: 0;
// //   }
// //   .hero-img {
// //     width: 100%;
// //     max-width: 460px;
// //     border-radius: 24px;
// //     box-shadow: 0 24px 64px rgba(79,70,229,0.18), 0 4px 16px rgba(0,0,0,0.08);
// //     position: relative;
// //     z-index: 1;
// //   }

// //   /* ===== STATS ===== */
// //   .stats-bar {
// //     background: white;
// //     border-top: 1px solid var(--indigo-100);
// //     border-bottom: 1px solid var(--indigo-100);
// //   }
// //   .stats-inner {
// //     max-width: 1200px;
// //     margin: 0 auto;
// //     padding: 32px 32px;
// //     display: grid;
// //     grid-template-columns: repeat(4, 1fr);
// //     gap: 0;
// //   }
// //   .stat-item {
// //     display: flex;
// //     flex-direction: column;
// //     align-items: center;
// //     gap: 4px;
// //     padding: 16px;
// //     border-right: 1px solid var(--indigo-100);
// //   }
// //   .stat-item:last-child { border-right: none; }
// //   .stat-value {
// //     font-size: 26px;
// //     font-weight: 800;
// //     color: var(--indigo-600);
// //     letter-spacing: -0.5px;
// //   }
// //   .stat-label {
// //     font-size: 13px;
// //     color: var(--gray-500);
// //     font-weight: 500;
// //   }

// //   /* ===== FEATURES ===== */
// //   .features {
// //     padding: 96px 0;
// //     background: var(--gray-50);
// //   }
// //   .section-inner {
// //     max-width: 1200px;
// //     margin: 0 auto;
// //     padding: 0 32px;
// //   }
// //   .section-header {
// //     text-align: center;
// //     margin-bottom: 56px;
// //   }
// //   .section-badge {
// //     display: inline-block;
// //     background: var(--indigo-50);
// //     color: var(--indigo-600);
// //     border: 1px solid var(--indigo-100);
// //     padding: 4px 14px;
// //     border-radius: 999px;
// //     font-size: 11.5px;
// //     font-weight: 600;
// //     letter-spacing: .8px;
// //     text-transform: uppercase;
// //     margin-bottom: 14px;
// //   }
// //   .section-title {
// //     font-size: 34px;
// //     font-weight: 800;
// //     color: var(--indigo-900);
// //     letter-spacing: -0.7px;
// //     margin-bottom: 12px;
// //   }
// //   .section-subtitle {
// //     font-size: 15.5px;
// //     color: var(--gray-500);
// //     max-width: 500px;
// //     margin: 0 auto;
// //     line-height: 1.6;
// //   }
// //   .features-grid {
// //     display: grid;
// //     grid-template-columns: repeat(4, 1fr);
// //     gap: 24px;
// //   }
// //   .feature-card {
// //     background: white;
// //     border: 1px solid #f0f0f0;
// //     border-radius: 20px;
// //     padding: 32px 24px;
// //     text-align: center;
// //     box-shadow: 0 2px 12px rgba(0,0,0,0.04);
// //     transition: box-shadow .2s, transform .2s;
// //     cursor: default;
// //   }
// //   .feature-card:hover { box-shadow: 0 12px 36px rgba(79,70,229,0.12); }
// //   .feature-icon-wrap {
// //     display: inline-flex;
// //     align-items: center;
// //     justify-content: center;
// //     width: 56px; height: 56px;
// //     border-radius: 14px;
// //     margin: 0 auto 18px;
// //   }
// //   .feature-title {
// //     font-size: 16px;
// //     font-weight: 700;
// //     color: var(--indigo-900);
// //     margin-bottom: 8px;
// //     letter-spacing: -0.2px;
// //   }
// //   .feature-text {
// //     font-size: 13.5px;
// //     color: var(--gray-500);
// //     line-height: 1.6;
// //   }

// //   /* ===== CTA ===== */
// //   .cta-section {
// //     background: linear-gradient(135deg, var(--indigo-600) 0%, #4338ca 100%);
// //     padding: 100px 32px;
// //     text-align: center;
// //     position: relative;
// //     overflow: hidden;
// //   }
// //   .cta-orb {
// //     position: absolute;
// //     width: 600px; height: 600px;
// //     background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
// //     border-radius: 50%;
// //     top: -200px; left: 50%;
// //     transform: translateX(-50%);
// //     pointer-events: none;
// //   }
// //   .cta-inner {
// //     position: relative;
// //     z-index: 1;
// //     max-width: 600px;
// //     margin: 0 auto;
// //   }
// //   .cta-badge {
// //     display: inline-block;
// //     background: rgba(255,255,255,0.15);
// //     color: white;
// //     border: 1px solid rgba(255,255,255,0.25);
// //     padding: 4px 16px;
// //     border-radius: 999px;
// //     font-size: 12px;
// //     font-weight: 600;
// //     letter-spacing: .8px;
// //     text-transform: uppercase;
// //     margin-bottom: 20px;
// //   }
// //   .cta-title {
// //     font-size: 38px;
// //     font-weight: 900;
// //     color: white;
// //     letter-spacing: -0.8px;
// //     margin-bottom: 14px;
// //     line-height: 1.2;
// //   }
// //   .cta-desc {
// //     font-size: 16px;
// //     color: rgba(255,255,255,0.80);
// //     margin-bottom: 36px;
// //     line-height: 1.6;
// //   }
// //   .cta-btns { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
// //   .cta-btn-primary {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 8px;
// //     padding: 14px 32px;
// //     background: white;
// //     color: var(--indigo-600);
// //     border: none;
// //     border-radius: 12px;
// //     font-size: 15px;
// //     font-weight: 700;
// //     font-family: 'Outfit', sans-serif;
// //     cursor: pointer;
// //     box-shadow: 0 6px 20px rgba(0,0,0,0.15);
// //     transition: background .15s, transform .15s, box-shadow .15s;
// //   }
// //   .cta-btn-primary:hover { background: #f5f5ff; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.18); }
// //   .cta-btn-ghost {
// //     padding: 13px 28px;
// //     background: transparent;
// //     color: white;
// //     border: 2px solid rgba(255,255,255,0.40);
// //     border-radius: 12px;
// //     font-size: 15px;
// //     font-weight: 600;
// //     font-family: 'Outfit', sans-serif;
// //     cursor: pointer;
// //     transition: background .15s, border-color .15s, transform .15s;
// //   }
// //   .cta-btn-ghost:hover { background: rgba(255,255,255,0.10); border-color: rgba(255,255,255,0.65); transform: translateY(-1px); }

// //   /* ===== FOOTER ===== */
// //   .footer {
// //     background: var(--indigo-900);
// //     padding: 28px 32px;
// //   }
// //   .footer-inner {
// //     max-width: 1200px;
// //     margin: 0 auto;
// //     display: flex;
// //     align-items: center;
// //     justify-content: space-between;
// //     flex-wrap: wrap;
// //     gap: 12px;
// //   }
// //   .footer-logo {
// //     display: flex;
// //     align-items: center;
// //     gap: 8px;
// //     font-size: 18px;
// //   }
// //   .footer-logo-text {
// //     font-weight: 700;
// //     color: white;
// //     letter-spacing: -0.3px;
// //   }
// //   .footer-copy {
// //     font-size: 13px;
// //     color: rgba(255,255,255,0.40);
// //   }

// //   /* ===== RESPONSIVE ===== */
// //   @media (max-width: 900px) {
// //     .hero-inner { grid-template-columns: 1fr; gap: 40px; }
// //     .hero-img { max-width: 340px; }
// //     .hero-title { font-size: 34px; }
// //     .features-grid { grid-template-columns: 1fr 1fr; }
// //     .stats-inner { grid-template-columns: 1fr 1fr; }
// //     .stat-item:nth-child(2) { border-right: none; }
// //     .navbar-links { display: none; }
// //   }
// //   @media (max-width: 580px) {
// //     .navbar-inner { padding: 0 20px; }
// //     .navbar-btn-ghost span { display: none; }
// //     .features-grid { grid-template-columns: 1fr; }
// //     .stats-inner { grid-template-columns: 1fr 1fr; }
// //     .hero { padding-top: 100px; padding-bottom: 60px; }
// //     .hero-inner { padding: 0 20px; }
// //     .section-inner { padding: 0 20px; }
// //   }
// // `;































// // // src/pages/HomePage.jsx
// // import React from "react";
// // import { motion } from "framer-motion";
// // import { ShieldCheck, Users, Vote, BarChart3, CheckCircle, ArrowRight } from "lucide-react";
// // import { FiLogIn } from "react-icons/fi";
// // import { useNavigate } from "react-router-dom";
// // import accueilIMG from "./accueil.png";

// // export default function HomePage() {
// //   const navigate = useNavigate();

// //   return (
// //     <>
// //       <style>{styles}</style>
// //       <div className="home-root">

// //         {/* ===== NAVBAR ===== */}
// //         <header className="navbar">
// //           <div className="navbar-inner">
// //             <div className="navbar-logo">
// //               <span className="logo-icon">🗳</span>
// //               <span className="logo-text">EVote</span>
// //             </div>

// //             <nav className="navbar-links">
// //               <a href="#fonctionnalites" className="nav-link-section">Fonctionnalités</a>
// //               <a href="#pourquoi" className="nav-link-section">Pourquoi nous</a>
// //             </nav>

// //             <div className="navbar-actions">
// //               <button onClick={() => navigate("/login")} className="navbar-btn-ghost">
// //                 <FiLogIn size={14} /> Connexion
// //               </button>
// //               <button onClick={() => navigate("/creer-election")} className="navbar-btn-filled">
// //                 Créer une élection <ArrowRight size={14} />
// //               </button>
// //             </div>
// //           </div>
// //         </header>

// //         {/* ===== HERO ===== */}
// //         <section className="hero" id="accueil">
// //           <div className="hero-orb hero-orb-1" />
// //           <div className="hero-orb hero-orb-2" />
// //           <div className="hero-grid" />

// //           <div className="hero-inner">
// //             <motion.div
// //               className="hero-text"
// //               initial={{ opacity: 0, x: -36 }}
// //               animate={{ opacity: 1, x: 0 }}
// //               transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
// //             >
// //               <span className="hero-badge">
// //                 <span className="badge-dot" />
// //                 Vote électronique sécurisé
// //               </span>

// //               <h1 className="hero-title">
// //                 Organisez vos élections{" "}
// //                 <span className="hero-title-accent">facilement et en toute confiance</span>
// //               </h1>

// //               <p className="hero-desc">
// //                 Digitalisez vos scrutins pour écoles, universités et entreprises avec
// //                 transparence, sécurité et simplicité.
// //               </p>

// //               <div className="hero-btns">
// //                 <button onClick={() => navigate("/login")} className="btn-filled btn-lg">
// //                   Commencer à voter <ArrowRight size={16} />
// //                 </button>
// //                 <button onClick={() => navigate("/creer-election")} className="btn-outline btn-lg">
// //                   Organiser une élection
// //                 </button>
// //               </div>

// //               <div className="hero-badges">
// //                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Données chiffrées</div>
// //                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Résultats instantanés</div>
// //                 <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Accès sécurisé</div>
// //               </div>
// //             </motion.div>

// //             <motion.div
// //               className="hero-img-wrap"
// //               initial={{ opacity: 0, y: 36 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
// //             >
// //               <div className="hero-img-glow" />
// //               <img src={accueilIMG} alt="Vote en ligne" className="hero-img" />
// //             </motion.div>
// //           </div>
// //         </section>

// //         {/* ===== STATS ===== */}
// //         <section className="stats-bar">
// //           <div className="stats-inner">
// //             {[
// //               { value: "247+", label: "Votes traités" },
// //               { value: "12+", label: "Élections organisées" },
// //               { value: "99.9%", label: "Disponibilité" },
// //               { value: "100%", label: "Résultats transparents" },
// //             ].map((s, i) => (
// //               <motion.div
// //                 key={i}
// //                 className="stat-item"
// //                 initial={{ opacity: 0, y: 20 }}
// //                 whileInView={{ opacity: 1, y: 0 }}
// //                 viewport={{ once: true }}
// //                 transition={{ delay: i * 0.08 }}
// //               >
// //                 <span className="stat-value">{s.value}</span>
// //                 <span className="stat-label">{s.label}</span>
// //               </motion.div>
// //             ))}
// //           </div>
// //         </section>

// //         {/* ===== FEATURES ===== */}
// //         <section className="features" id="fonctionnalites">
// //           <div className="section-inner">
// //             <div className="section-header">
// //               <span className="section-badge">Fonctionnalités</span>
// //               <h2 className="section-title">Pourquoi choisir EVote ?</h2>
// //               <p className="section-subtitle">
// //                 Une plateforme complète pensée pour la fiabilité et la simplicité.
// //               </p>
// //             </div>

// //             <div className="features-grid" id="pourquoi">
// //               {[
// //                 {
// //                   icon: <ShieldCheck size={24} />,
// //                   title: "Sécurité maximale",
// //                   text: "Chiffrement bout en bout des votes avec protection anti-fraude intégrée.",
// //                   color: "#6366f1",
// //                   bg: "#eef2ff",
// //                 },
// //                 {
// //                   icon: <Users size={24} />,
// //                   title: "Multi-rôles",
// //                   text: "Gestion claire des admins, électeurs et super administrateurs.",
// //                   color: "#0ea5e9",
// //                   bg: "#f0f9ff",
// //                 },
// //                 {
// //                   icon: <Vote size={24} />,
// //                   title: "Interface intuitive",
// //                   text: "Expérience de vote simple, rapide et entièrement responsive.",
// //                   color: "#8b5cf6",
// //                   bg: "#f5f3ff",
// //                 },
// //                 {
// //                   icon: <BarChart3 size={24} />,
// //                   title: "Statistiques en direct",
// //                   text: "Résultats transparents et visualisables en temps réel.",
// //                   color: "#10b981",
// //                   bg: "#f0fdf4",
// //                 },
// //               ].map((f, i) => (
// //                 <motion.div
// //                   key={i}
// //                   className="feature-card"
// //                   initial={{ opacity: 0, y: 24 }}
// //                   whileInView={{ opacity: 1, y: 0 }}
// //                   viewport={{ once: true }}
// //                   transition={{ delay: i * 0.1 }}
// //                   whileHover={{ y: -6 }}
// //                 >
// //                   <div className="feature-icon-wrap" style={{ background: f.bg, color: f.color }}>
// //                     {f.icon}
// //                   </div>
// //                   <h3 className="feature-title">{f.title}</h3>
// //                   <p className="feature-text">{f.text}</p>
// //                 </motion.div>
// //               ))}
// //             </div>
// //           </div>
// //         </section>

// //         {/* ===== CTA ===== */}
// //         <section className="cta-section">
// //           <div className="cta-orb" />
// //           <motion.div
// //             className="cta-inner"
// //             initial={{ opacity: 0, y: 28 }}
// //             whileInView={{ opacity: 1, y: 0 }}
// //             viewport={{ once: true }}
// //           >
// //             <span className="cta-badge">Prêt à commencer ?</span>
// //             <h2 className="cta-title">Lancez votre élection aujourd'hui</h2>
// //             <p className="cta-desc">Simplifiez vos scrutins et garantissez la transparence pour tous vos participants.</p>
// //             <div className="cta-btns">
// //               <button onClick={() => navigate("/creer-election")} className="cta-btn-primary">
// //                 Créer une élection <ArrowRight size={16} />
// //               </button>
// //               <button onClick={() => navigate("/login")} className="cta-btn-ghost">
// //                 Se connecter
// //               </button>
// //             </div>
// //           </motion.div>
// //         </section>

// //         {/* ===== FOOTER ===== */}
// //         <footer className="footer">
// //           <div className="footer-inner">
// //             <div className="footer-logo">
// //               <span>🗳</span>
// //               <span className="footer-logo-text">EVote</span>
// //             </div>
// //             <p className="footer-copy">© {new Date().getFullYear()} EVote. Tous droits réservés.</p>
// //           </div>
// //         </footer>

// //       </div>
// //     </>
// //   );
// // }

// // function Feature({ icon, title, text }) {
// //   return (
// //     <motion.div whileHover={{ y: -6 }} className="feature-card">
// //       <div className="flex justify-center mb-4">{icon}</div>
// //       <h3 className="feature-title">{title}</h3>
// //       <p className="feature-text">{text}</p>
// //     </motion.div>
// //   );
// // }

// // /* ============================================================
// //    STYLES
// //    ============================================================ */
// // const styles = `
// //   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

// //   :root {
// //     --indigo-50:  #eef2ff;
// //     --indigo-100: #e0e7ff;
// //     --indigo-200: #c7d2fe;
// //     --indigo-500: #6366f1;
// //     --indigo-600: #4f46e5;
// //     --indigo-700: #4338ca;
// //     --indigo-900: #1e1b4b;
// //     --gray-50:    #f9fafb;
// //     --gray-100:   #f3f4f6;
// //     --gray-500:   #6b7280;
// //     --gray-600:   #4b5563;
// //     --gray-800:   #1f2937;
// //     --white:      #ffffff;
// //   }

// //   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

// //   .home-root {
// //     min-height: 100vh;
// //     font-family: 'Outfit', sans-serif;
// //     color: var(--gray-800);
// //     background: var(--white);
// //   }

// //   /* ===== NAVBAR ===== */
// //   .navbar {
// //     position: fixed;
// //     top: 0; left: 0; right: 0;
// //     z-index: 100;
// //     background: rgba(255,255,255,0.97);
// //     backdrop-filter: blur(12px);
// //     border-bottom: 1px solid rgba(99,102,241,0.12);
// //     box-shadow: 0 1px 16px rgba(0,0,0,0.05);
// //   }
// //   .navbar-inner {
// //     max-width: 1200px;
// //     margin: 0 auto;
// //     padding: 0 32px;
// //     height: 62px;
// //     display: flex;
// //     align-items: center;
// //     justify-content: space-between;
// //     gap: 24px;
// //   }
// //   .navbar-logo {
// //     display: flex;
// //     align-items: center;
// //     gap: 9px;
// //     flex-shrink: 0;
// //     text-decoration: none;
// //   }
// //   .logo-icon { font-size: 20px; }
// //   .logo-text {
// //     font-size: 19px;
// //     font-weight: 900;
// //     color: var(--indigo-600);
// //     letter-spacing: -0.5px;
// //   }
// //   .navbar-links {
// //     display: flex;
// //     align-items: center;
// //     gap: 4px;
// //   }
// //   .nav-link-section {
// //     padding: 8px 16px;
// //     border-radius: 9px;
// //     font-size: 13.5px;
// //     font-weight: 600;
// //     color: var(--gray-500);
// //     text-decoration: none;
// //     transition: background .15s, color .15s;
// //   }
// //   .nav-link-section:hover { background: var(--indigo-50); color: var(--indigo-600); }

// //   .navbar-actions {
// //     display: flex;
// //     align-items: center;
// //     gap: 8px;
// //     flex-shrink: 0;
// //   }
// //   .navbar-btn-ghost {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 7px;
// //     padding: 8px 16px;
// //     border-radius: 9px;
// //     border: none;
// //     background: transparent;
// //     color: var(--gray-500);
// //     font-size: 13.5px;
// //     font-weight: 600;
// //     font-family: 'Outfit', sans-serif;
// //     cursor: pointer;
// //     transition: background .15s, color .15s, transform .15s;
// //   }
// //   .navbar-btn-ghost:hover { background: var(--indigo-50); color: var(--indigo-600); transform: translateY(-1px); }

// //   .navbar-btn-filled {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 7px;
// //     padding: 8px 18px;
// //     border-radius: 9px;
// //     border: none;
// //     background: var(--indigo-600);
// //     color: white;
// //     font-size: 13.5px;
// //     font-weight: 600;
// //     font-family: 'Outfit', sans-serif;
// //     cursor: pointer;
// //     box-shadow: 0 4px 12px rgba(79,70,229,0.25);
// //     transition: background .18s, transform .15s, box-shadow .18s;
// //   }
// //   .navbar-btn-filled:hover { background: var(--indigo-700); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79,70,229,0.35); }

// //   .btn-outline {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 7px;
// //     padding: 13px 28px;
// //     border-radius: 12px;
// //     border: 2px solid var(--indigo-600);
// //     background: transparent;
// //     color: var(--indigo-600);
// //     font-size: 15px;
// //     font-weight: 600;
// //     font-family: 'Outfit', sans-serif;
// //     cursor: pointer;
// //     transition: background .15s, transform .15s;
// //   }
// //   .btn-outline:hover { background: var(--indigo-50); transform: translateY(-1px); }

// //   .btn-lg { padding: 13px 28px; font-size: 15px; border-radius: 12px; }

// //   /* ===== HERO ===== */
// //   .hero {
// //     padding-top: 110px;
// //     padding-bottom: 100px;
// //     background: linear-gradient(135deg, #eef2ff 0%, #f8f9ff 55%, #eff6ff 100%);
// //     position: relative;
// //     overflow: hidden;
// //   }
// //   .hero-orb {
// //     position: absolute;
// //     border-radius: 50%;
// //     filter: blur(90px);
// //     pointer-events: none;
// //   }
// //   .hero-orb-1 {
// //     width: 600px; height: 600px;
// //     background: radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%);
// //     top: -200px; left: -200px;
// //   }
// //   .hero-orb-2 {
// //     width: 400px; height: 400px;
// //     background: radial-gradient(circle, rgba(79,70,229,0.09) 0%, transparent 70%);
// //     bottom: -100px; right: -100px;
// //   }
// //   .hero-grid {
// //     position: absolute; inset: 0;
// //     background-image:
// //       linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
// //       linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px);
// //     background-size: 44px 44px;
// //     pointer-events: none;
// //   }
// //   .hero-inner {
// //     max-width: 1200px;
// //     margin: 0 auto;
// //     padding: 0 32px;
// //     display: grid;
// //     grid-template-columns: 1fr 1fr;
// //     gap: 64px;
// //     align-items: center;
// //     position: relative;
// //     z-index: 1;
// //   }
// //   .hero-badge {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 8px;
// //     background: white;
// //     border: 1px solid var(--indigo-200);
// //     color: var(--indigo-600);
// //     padding: 6px 16px;
// //     border-radius: 999px;
// //     font-size: 12.5px;
// //     font-weight: 600;
// //     letter-spacing: .4px;
// //     text-transform: uppercase;
// //     margin-bottom: 20px;
// //     box-shadow: 0 2px 8px rgba(99,102,241,0.10);
// //   }
// //   .badge-dot {
// //     width: 7px; height: 7px;
// //     background: var(--indigo-500);
// //     border-radius: 50%;
// //     animation: pulse 2s ease-in-out infinite;
// //   }
// //   @keyframes pulse {
// //     0%, 100% { opacity: 1; transform: scale(1); }
// //     50% { opacity: .6; transform: scale(0.85); }
// //   }
// //   .hero-title {
// //     font-size: 46px;
// //     font-weight: 900;
// //     line-height: 1.13;
// //     letter-spacing: -1.2px;
// //     color: var(--indigo-900);
// //     margin-bottom: 20px;
// //   }
// //   .hero-title-accent { color: var(--indigo-600); }
// //   .hero-desc {
// //     font-size: 16.5px;
// //     color: var(--gray-500);
// //     line-height: 1.7;
// //     margin-bottom: 32px;
// //     max-width: 480px;
// //   }
// //   .hero-btns {
// //     display: flex;
// //     flex-wrap: wrap;
// //     gap: 14px;
// //     margin-bottom: 28px;
// //   }
// //   .hero-badges {
// //     display: flex;
// //     flex-wrap: wrap;
// //     gap: 16px;
// //   }
// //   .trust-badge {
// //     display: flex;
// //     align-items: center;
// //     gap: 6px;
// //     font-size: 13px;
// //     color: var(--gray-500);
// //     font-weight: 500;
// //   }
// //   .trust-icon { color: #22c55e; flex-shrink: 0; }

// //   .hero-img-wrap {
// //     position: relative;
// //     display: flex;
// //     justify-content: center;
// //   }
// //   .hero-img-glow {
// //     position: absolute;
// //     inset: -20px;
// //     background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
// //     border-radius: 50%;
// //     filter: blur(30px);
// //     z-index: 0;
// //   }
// //   .hero-img {
// //     width: 100%;
// //     max-width: 460px;
// //     border-radius: 24px;
// //     box-shadow: 0 24px 64px rgba(79,70,229,0.18), 0 4px 16px rgba(0,0,0,0.08);
// //     position: relative;
// //     z-index: 1;
// //   }

// //   /* ===== STATS ===== */
// //   .stats-bar {
// //     background: white;
// //     border-top: 1px solid var(--indigo-100);
// //     border-bottom: 1px solid var(--indigo-100);
// //   }
// //   .stats-inner {
// //     max-width: 1200px;
// //     margin: 0 auto;
// //     padding: 32px 32px;
// //     display: grid;
// //     grid-template-columns: repeat(4, 1fr);
// //     gap: 0;
// //   }
// //   .stat-item {
// //     display: flex;
// //     flex-direction: column;
// //     align-items: center;
// //     gap: 4px;
// //     padding: 16px;
// //     border-right: 1px solid var(--indigo-100);
// //   }
// //   .stat-item:last-child { border-right: none; }
// //   .stat-value {
// //     font-size: 26px;
// //     font-weight: 800;
// //     color: var(--indigo-600);
// //     letter-spacing: -0.5px;
// //   }
// //   .stat-label {
// //     font-size: 13px;
// //     color: var(--gray-500);
// //     font-weight: 500;
// //   }

// //   /* ===== FEATURES ===== */
// //   .features {
// //     padding: 96px 0;
// //     background: var(--gray-50);
// //   }
// //   .section-inner {
// //     max-width: 1200px;
// //     margin: 0 auto;
// //     padding: 0 32px;
// //   }
// //   .section-header {
// //     text-align: center;
// //     margin-bottom: 56px;
// //   }
// //   .section-badge {
// //     display: inline-block;
// //     background: var(--indigo-50);
// //     color: var(--indigo-600);
// //     border: 1px solid var(--indigo-100);
// //     padding: 4px 14px;
// //     border-radius: 999px;
// //     font-size: 11.5px;
// //     font-weight: 600;
// //     letter-spacing: .8px;
// //     text-transform: uppercase;
// //     margin-bottom: 14px;
// //   }
// //   .section-title {
// //     font-size: 34px;
// //     font-weight: 800;
// //     color: var(--indigo-900);
// //     letter-spacing: -0.7px;
// //     margin-bottom: 12px;
// //   }
// //   .section-subtitle {
// //     font-size: 15.5px;
// //     color: var(--gray-500);
// //     max-width: 500px;
// //     margin: 0 auto;
// //     line-height: 1.6;
// //   }
// //   .features-grid {
// //     display: grid;
// //     grid-template-columns: repeat(4, 1fr);
// //     gap: 24px;
// //   }
// //   .feature-card {
// //     background: white;
// //     border: 1px solid #f0f0f0;
// //     border-radius: 20px;
// //     padding: 32px 24px;
// //     text-align: center;
// //     box-shadow: 0 2px 12px rgba(0,0,0,0.04);
// //     transition: box-shadow .2s, transform .2s;
// //     cursor: default;
// //   }
// //   .feature-card:hover { box-shadow: 0 12px 36px rgba(79,70,229,0.12); }
// //   .feature-icon-wrap {
// //     display: inline-flex;
// //     align-items: center;
// //     justify-content: center;
// //     width: 56px; height: 56px;
// //     border-radius: 14px;
// //     margin: 0 auto 18px;
// //   }
// //   .feature-title {
// //     font-size: 16px;
// //     font-weight: 700;
// //     color: var(--indigo-900);
// //     margin-bottom: 8px;
// //     letter-spacing: -0.2px;
// //   }
// //   .feature-text {
// //     font-size: 13.5px;
// //     color: var(--gray-500);
// //     line-height: 1.6;
// //   }

// //   /* ===== CTA ===== */
// //   .cta-section {
// //     background: linear-gradient(135deg, var(--indigo-600) 0%, #4338ca 100%);
// //     padding: 100px 32px;
// //     text-align: center;
// //     position: relative;
// //     overflow: hidden;
// //   }
// //   .cta-orb {
// //     position: absolute;
// //     width: 600px; height: 600px;
// //     background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
// //     border-radius: 50%;
// //     top: -200px; left: 50%;
// //     transform: translateX(-50%);
// //     pointer-events: none;
// //   }
// //   .cta-inner {
// //     position: relative;
// //     z-index: 1;
// //     max-width: 600px;
// //     margin: 0 auto;
// //   }
// //   .cta-badge {
// //     display: inline-block;
// //     background: rgba(255,255,255,0.15);
// //     color: white;
// //     border: 1px solid rgba(255,255,255,0.25);
// //     padding: 4px 16px;
// //     border-radius: 999px;
// //     font-size: 12px;
// //     font-weight: 600;
// //     letter-spacing: .8px;
// //     text-transform: uppercase;
// //     margin-bottom: 20px;
// //   }
// //   .cta-title {
// //     font-size: 38px;
// //     font-weight: 900;
// //     color: white;
// //     letter-spacing: -0.8px;
// //     margin-bottom: 14px;
// //     line-height: 1.2;
// //   }
// //   .cta-desc {
// //     font-size: 16px;
// //     color: rgba(255,255,255,0.80);
// //     margin-bottom: 36px;
// //     line-height: 1.6;
// //   }
// //   .cta-btns { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
// //   .cta-btn-primary {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 8px;
// //     padding: 14px 32px;
// //     background: white;
// //     color: var(--indigo-600);
// //     border: none;
// //     border-radius: 12px;
// //     font-size: 15px;
// //     font-weight: 700;
// //     font-family: 'Outfit', sans-serif;
// //     cursor: pointer;
// //     box-shadow: 0 6px 20px rgba(0,0,0,0.15);
// //     transition: background .15s, transform .15s, box-shadow .15s;
// //   }
// //   .cta-btn-primary:hover { background: #f5f5ff; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.18); }
// //   .cta-btn-ghost {
// //     padding: 13px 28px;
// //     background: transparent;
// //     color: white;
// //     border: 2px solid rgba(255,255,255,0.40);
// //     border-radius: 12px;
// //     font-size: 15px;
// //     font-weight: 600;
// //     font-family: 'Outfit', sans-serif;
// //     cursor: pointer;
// //     transition: background .15s, border-color .15s, transform .15s;
// //   }
// //   .cta-btn-ghost:hover { background: rgba(255,255,255,0.10); border-color: rgba(255,255,255,0.65); transform: translateY(-1px); }

// //   /* ===== FOOTER ===== */
// //   .footer {
// //     background: var(--indigo-900);
// //     padding: 28px 32px;
// //   }
// //   .footer-inner {
// //     max-width: 1200px;
// //     margin: 0 auto;
// //     display: flex;
// //     align-items: center;
// //     justify-content: space-between;
// //     flex-wrap: wrap;
// //     gap: 12px;
// //   }
// //   .footer-logo {
// //     display: flex;
// //     align-items: center;
// //     gap: 8px;
// //     font-size: 18px;
// //   }
// //   .footer-logo-text {
// //     font-weight: 700;
// //     color: white;
// //     letter-spacing: -0.3px;
// //   }
// //   .footer-copy {
// //     font-size: 13px;
// //     color: rgba(255,255,255,0.40);
// //   }

// //   /* ===== RESPONSIVE ===== */
// //   @media (max-width: 900px) {
// //     .hero-inner { grid-template-columns: 1fr; gap: 40px; }
// //     .hero-img { max-width: 340px; }
// //     .hero-title { font-size: 34px; }
// //     .features-grid { grid-template-columns: 1fr 1fr; }
// //     .stats-inner { grid-template-columns: 1fr 1fr; }
// //     .stat-item:nth-child(2) { border-right: none; }
// //     .navbar-links { display: none; }
// //   }
// //   @media (max-width: 580px) {
// //     .navbar-inner { padding: 0 20px; }
// //     .navbar-btn-ghost span { display: none; }
// //     .features-grid { grid-template-columns: 1fr; }
// //     .stats-inner { grid-template-columns: 1fr 1fr; }
// //     .hero { padding-top: 100px; padding-bottom: 60px; }
// //     .hero-inner { padding: 0 20px; }
// //     .section-inner { padding: 0 20px; }
// //   }
// // `;



