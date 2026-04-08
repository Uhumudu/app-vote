// src/pages/home/HomePage.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Vote, BarChart3, CheckCircle, ArrowRight, Globe } from "lucide-react";
import { FiLogIn, FiSearch, FiTag, FiMapPin, FiCalendar, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import accueilIMG from "./accueil.png";
import api from "../../services/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });

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

const BACKEND_URL = "http://localhost:5000";

function buildPhotoUrl(rawUrl) {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  return `${BACKEND_URL}${rawUrl}`;
}

// ─── Vérifie si une élection doit encore être affichée ────────────────────────
// Les élections terminées restent visibles 7 jours après date_fin
function shouldShowElection(election) {
  if (election.statut !== "TERMINEE") return true;
  if (!election.date_fin) return false;
  const dateFin = new Date(election.date_fin);
  const now = new Date();
  const diffMs = now - dateFin;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

// ─── Vérifie si on peut encore candidater ────────────────────────────────────
function canCandidater(election) {
  return election.statut === "APPROUVEE"; // seulement avant le début
}

// ─── ElectionCard (style référence) ──────────────────────────────────────────
function ElectionCard({ election, onVoter, onCandidater }) {
  const navigate = useNavigate();
  const enCours  = election.statut === "EN_COURS";
  const termine  = election.statut === "TERMINEE";
  const aVenir   = election.statut === "APPROUVEE";

  const rawPhoto = election.photo_url || election.image_url || null;
  const photoSrc = buildPhotoUrl(rawPhoto);
  const hasPhoto = !!photoSrc;

  const candidatureOuverte = canCandidater(election);

  return (
    <motion.div
      className="election-card"
      whileHover={{ y: -8, scale: 1.015 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/election-publique/${election.id_election}`)}
    >
      {/* IMAGE */}
      <div className="card-img-wrap">
        {hasPhoto ? (
          <img
            src={photoSrc}
            alt={election.titre}
            className="card-img"
            onError={e => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement.style.background = getGradient(election.titre);
            }}
          />
        ) : (
          <div className="card-img-placeholder" style={{ background: getGradient(election.titre) }}>
            <span className="card-img-initials">{election.titre?.slice(0, 2)}</span>
          </div>
        )}

        {/* Overlay gradient bottom */}
        <div className="card-img-overlay" />

        {/* Badge statut */}
        <div className={`card-status-badge ${enCours ? "badge-live" : termine ? "badge-done" : "badge-upcoming"}`}>
          {enCours ? (
            <><span className="badge-pulse-dot" />En cours</>
          ) : termine ? (
            <><span className="badge-check">✓</span>Terminé</>
          ) : (
            <><span className="badge-dot-blue" />À venir</>
          )}
        </div>

        {/* Badge type */}
        <div className="card-type-badge">
          <FiTag size={11} />
          {election.type || "Élection"}
        </div>

        {/* Date en bas de l'image */}
        <div className="card-date-overlay">
          <FiCalendar size={11} />
          {formatDate(election.date_debut)}
        </div>
      </div>

      {/* CORPS */}
      <div className="card-body">
        <h3 className="card-title">{election.titre}</h3>

        <p className="card-organizer">
          {election.prenom_admin} {election.nom_admin}
        </p>

        {election.description && (
          <p className="card-desc">{election.description}</p>
        )}

        {election.nb_candidats != null && (
          <div className="card-meta">
            <span className="card-meta-item">
              <FiUsers size={12} />
              {election.nb_candidats} candidat{election.nb_candidats !== 1 ? "s" : ""}
            </span>
            {election.nb_votes != null && (
              <span className="card-meta-item">
                <Vote size={12} />
                {election.nb_votes} vote{election.nb_votes !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="card-actions">
        {/* Bouton Candidater — désactivé si élection EN_COURS ou TERMINEE */}
        <button
          onClick={e => {
            e.stopPropagation();
            if (candidatureOuverte) onCandidater(election);
          }}
          disabled={!candidatureOuverte}
          className={`card-btn-secondary ${!candidatureOuverte ? "card-btn-disabled" : ""}`}
          title={!candidatureOuverte ? (termine ? "Élection terminée" : "Candidatures fermées") : "Se candidater"}
        >
          {candidatureOuverte
            ? "Se candidater"
            : termine
              ? "Terminée"
              : "Candidatures fermées"}
        </button>

        {enCours && (
          <button
            onClick={e => { e.stopPropagation(); onVoter(election); }}
            className="card-btn-primary"
          >
            Voter <ArrowRight size={13} />
          </button>
        )}

        {aVenir && !enCours && (
          <button
            onClick={e => e.stopPropagation()}
            className="card-btn-ghost"
            disabled
          >
            Bientôt
          </button>
        )}

        {termine && (
          <button
            onClick={e => { e.stopPropagation(); navigate(`/election-publique/${election.id_election}`); }}
            className="card-btn-results"
          >
            Résultats
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [elections,  setElections]  = useState([]);
  const [loadingEl,  setLoadingEl]  = useState(true);
  const [searchQ,    setSearchQ]    = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    api.get("/public-elections")
      .then(r => setElections(r.data))
      .catch(console.error)
      .finally(() => setLoadingEl(false));
  }, []);

  const filteredElections = elections
    .filter(shouldShowElection) // ← filtre disparition 7j post-fin
    .filter(e => {
      const q      = searchQ.toLowerCase();
      const matchQ = !q || e.titre.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
      const matchF =
        filterType === "all"      ? true :
        filterType === "en_cours" ? e.statut === "EN_COURS" :
        filterType === "a_venir"  ? e.statut === "APPROUVEE" :
        filterType === "termine"  ? e.statut === "TERMINEE" : true;
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
              <a href="#elections"       className="nav-link-section">Élections</a>
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
            <motion.div className="hero-text" initial={{ opacity:0, x:-36 }} animate={{ opacity:1, x:0 }} transition={{ duration:.6, ease:[0.22,1,0.36,1] }}>
              <span className="hero-badge">
                <span className="badge-dot" /> Vote électronique sécurisé
              </span>
              <h1 className="hero-title">
                Organisez vos élections{" "}
                <span className="hero-title-accent">facilement et en toute confiance</span>
              </h1>
              <p className="hero-desc">
                Participez aux élections publiques ou organisez les vôtres.
                Candidatez, votez, suivez les résultats — le tout en quelques clics.
              </p>
              <div className="hero-btns">
                <a href="#elections" className="btn-filled btn-lg" style={{ textDecoration:"none" }}>
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

            <motion.div className="hero-img-wrap" initial={{ opacity:0, y:36 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.1 }}>
              <div className="hero-img-glow" />
              <img src={accueilIMG} alt="Vote en ligne" className="hero-img" />
            </motion.div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats-bar">
          <div className="stats-inner">
            {[
              { value:"247+",  label:"Votes traités" },
              { value:"12+",   label:"Élections organisées" },
              { value:"99.9%", label:"Disponibilité" },
              { value:"100%",  label:"Résultats transparents" },
            ].map((s,i) => (
              <motion.div key={i} className="stat-item" initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.08 }}>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ELECTIONS PUBLIQUES */}
        <section id="elections" style={{ padding:"80px 0", background:"#f9fafb" }}>
          <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"0 32px" }}>

            <div style={{ textAlign:"center", marginBottom:"40px" }}>
              <span className="section-badge" style={{ marginBottom:"14px", display:"inline-block" }}>
                Elections publiques
              </span>
              <h2 style={{ fontSize:"34px", fontWeight:800, color:"#111827", letterSpacing:"-0.7px", marginBottom:"10px" }}>
                Participez aux élections ouvertes
              </h2>
              <p style={{ fontSize:"15px", color:"#6b7280", maxWidth:"500px", margin:"0 auto", lineHeight:1.6 }}>
                Candidatez librement ou votez pour vos favoris.
              </p>
            </div>

            {/* Recherche + filtres */}
            <div style={{ display:"flex", gap:"12px", marginBottom:"32px", flexWrap:"wrap" }}>
              <div style={{
                flex:1, minWidth:"240px", display:"flex", alignItems:"center",
                gap:"10px", background:"white", border:"1.5px solid #e5e7eb",
                borderRadius:"12px", padding:"10px 14px",
                boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
              }}>
                <FiSearch size={16} color="#9ca3af" />
                <input
                  type="text" placeholder="Rechercher une élection…"
                  value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  style={{ flex:1, border:"none", outline:"none", fontSize:"14px", fontFamily:"inherit", color:"#111827", background:"transparent" }}
                />
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[
                  { key:"all",      label:"Toutes" },
                  { key:"en_cours", label:"En cours" },
                  { key:"a_venir",  label:"À venir" },
                  { key:"termine",  label:"Terminées" },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilterType(f.key)} style={{
                    padding:"10px 18px", borderRadius:"10px", fontSize:"13px", fontWeight:600,
                    border: filterType === f.key ? "none" : "1.5px solid #e5e7eb",
                    background: filterType === f.key ? "#111827" : "white",
                    color: filterType === f.key ? "white" : "#6b7280",
                    cursor:"pointer", fontFamily:"inherit", transition:"all .15s",
                    boxShadow: filterType === f.key ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                  }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compteur */}
            {!loadingEl && (
              <p style={{ fontSize:"14px", color:"#9ca3af", marginBottom:"20px", fontWeight:500 }}>
                {filteredElections.length} événement{filteredElections.length !== 1 ? "s" : ""} trouvé{filteredElections.length !== 1 ? "s" : ""}
              </p>
            )}

            {/* Grille */}
            {loadingEl ? (
              <div style={{ textAlign:"center", padding:"80px 0", color:"#9ca3af" }}>
                <div style={{
                  width:"36px", height:"36px", borderRadius:"50%",
                  border:"3px solid #e5e7eb", borderTopColor:"#4f46e5",
                  animation:"spin .7s linear infinite", margin:"0 auto 16px",
                }} />
                Chargement des élections…
              </div>
            ) : filteredElections.length === 0 ? (
              <div style={{ textAlign:"center", padding:"80px 0" }}>
                <div style={{ fontSize:"48px", marginBottom:"16px" }}>🗳</div>
                <p style={{ fontSize:"16px", fontWeight:700, color:"#374151", marginBottom:"8px" }}>
                  Aucune élection publique pour le moment
                </p>
                <p style={{ fontSize:"14px", color:"#9ca3af" }}>
                  Revenez bientôt ou créez votre propre élection !
                </p>
              </div>
            ) : (
              <div className="elections-grid">
                {filteredElections.map((el, i) => (
                  <motion.div
                    key={el.id_election}
                    initial={{ opacity:0, y:24 }}
                    whileInView={{ opacity:1, y:0 }}
                    viewport={{ once:true }}
                    transition={{ delay: i * 0.07, duration: 0.4 }}
                  >
                    <ElectionCard
                      election={el}
                      onVoter={el   => navigate(`/voter/${el.id_election}`)}
                      onCandidater={el => navigate(`/candidater/${el.id_election}`)}
                    />
                  </motion.div>
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
                { icon:<ShieldCheck size={24}/>, title:"Sécurité maximale",    text:"Chiffrement bout en bout des votes avec protection anti-fraude intégrée.", color:"#6366f1", bg:"#eef2ff" },
                { icon:<Globe size={24}/>,       title:"Public ou Privé",      text:"Créez des élections ouvertes à tous ou réservées à vos membres.",           color:"#0ea5e9", bg:"#f0f9ff" },
                { icon:<Vote size={24}/>,        title:"Vote payant flexible", text:"Définissez vos frais de vote. L'électeur paie via MTN ou Orange Money.",    color:"#8b5cf6", bg:"#f5f3ff" },
                { icon:<BarChart3 size={24}/>,   title:"Résultats en direct",  text:"Tableaux de bord temps réel pour candidats et électeurs.",                  color:"#10b981", bg:"#f0fdf4" },
              ].map((f,i) => (
                <motion.div key={i} className="feature-card" initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.1 }} whileHover={{ y:-6 }}>
                  <div className="feature-icon-wrap" style={{ background:f.bg, color:f.color }}>{f.icon}</div>
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
          <motion.div className="cta-inner" initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  :root{--indigo-50:#eef2ff;--indigo-100:#e0e7ff;--indigo-200:#c7d2fe;--indigo-500:#6366f1;--indigo-600:#4f46e5;--indigo-700:#4338ca;--indigo-900:#1e1b4b;--gray-50:#f9fafb;--gray-500:#6b7280;--gray-800:#1f2937;--white:#fff;}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.6;transform:scale(0.85);}}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes pulseDot{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.6);}70%{box-shadow:0 0 0 6px rgba(34,197,94,0);}}

  .home-root{min-height:100vh;font-family:'Outfit',sans-serif;color:var(--gray-800);background:var(--white);}

  /* NAVBAR */
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

  /* BUTTONS */
  .btn-filled{display:inline-flex;align-items:center;gap:8px;background:var(--indigo-600);color:#fff!important;border:none;border-radius:12px;font-family:'Outfit',sans-serif;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(79,70,229,0.30);transition:all .18s;}
  .btn-filled:hover{background:var(--indigo-700);transform:translateY(-2px);}
  .btn-outline{display:inline-flex;align-items:center;gap:7px;border-radius:12px;border:2px solid var(--indigo-600);background:transparent;color:var(--indigo-600);font-size:15px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;transition:all .15s;}
  .btn-outline:hover{background:var(--indigo-50);transform:translateY(-1px);}
  .btn-lg{padding:13px 28px;font-size:15px;}

  /* HERO */
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

  /* STATS */
  .stats-bar{background:white;border-top:1px solid var(--indigo-100);border-bottom:1px solid var(--indigo-100);}
  .stats-inner{max-width:1200px;margin:0 auto;padding:32px;display:grid;grid-template-columns:repeat(4,1fr);}
  .stat-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:16px;border-right:1px solid var(--indigo-100);}
  .stat-item:last-child{border-right:none;}
  .stat-value{font-size:26px;font-weight:800;color:var(--indigo-600);letter-spacing:-0.5px;}
  .stat-label{font-size:13px;color:var(--gray-500);font-weight:500;}

  /* ── ELECTION CARDS ─────────────────────────────────────────────────────── */
  .elections-grid{
    display:grid;
    grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));
    gap:24px;
  }

  .election-card{
    background:white;
    border-radius:20px;
    overflow:hidden;
    box-shadow:0 2px 16px rgba(0,0,0,0.07);
    border:1px solid #ececec;
    cursor:pointer;
    display:flex;
    flex-direction:column;
    transition:box-shadow 0.25s ease, transform 0.25s ease;
  }
  .election-card:hover{
    box-shadow:0 20px 56px rgba(79,70,229,0.15), 0 4px 16px rgba(0,0,0,0.08);
  }

  /* Image */
  .card-img-wrap{
    position:relative;
    height:210px;
    overflow:hidden;
    flex-shrink:0;
    background:#1a1a2e;
  }
  .card-img{
    width:100%;
    height:100%;
    object-fit:cover;
    display:block;
    transition:transform 0.4s ease;
  }
  .election-card:hover .card-img{
    transform:scale(1.06);
  }
  .card-img-placeholder{
    width:100%;
    height:100%;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .card-img-initials{
    font-size:80px;
    font-weight:900;
    color:rgba(255,255,255,0.15);
    text-transform:uppercase;
    letter-spacing:-4px;
    user-select:none;
  }
  .card-img-overlay{
    position:absolute;
    bottom:0;left:0;right:0;
    height:90px;
    background:linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%);
    pointer-events:none;
  }

  /* Badges sur l'image */
  .card-status-badge{
    position:absolute;
    top:12px;left:12px;
    display:inline-flex;
    align-items:center;
    gap:6px;
    background:rgba(255,255,255,0.92);
    backdrop-filter:blur(8px);
    padding:5px 12px;
    border-radius:999px;
    font-size:12px;
    font-weight:700;
    color:#1a1a2e;
    box-shadow:0 2px 10px rgba(0,0,0,0.13);
  }
  .badge-live{ color:#15803d; }
  .badge-done{ color:#64748b; }
  .badge-upcoming{ color:#1d4ed8; }
  .badge-pulse-dot{
    width:8px;height:8px;border-radius:50%;background:#22c55e;
    display:inline-block;
    animation:pulseDot 1.5s ease-in-out infinite;
  }
  .badge-check{ font-size:11px; }
  .badge-dot-blue{
    width:8px;height:8px;border-radius:50%;background:#3b82f6;
    display:inline-block;
  }

  .card-type-badge{
    position:absolute;
    top:12px;right:12px;
    display:inline-flex;
    align-items:center;
    gap:5px;
    background:rgba(255,255,255,0.92);
    backdrop-filter:blur(8px);
    padding:5px 12px;
    border-radius:999px;
    font-size:11.5px;
    font-weight:700;
    color:#1a1a2e;
    box-shadow:0 2px 8px rgba(0,0,0,0.12);
    text-transform:uppercase;
    letter-spacing:.4px;
  }

  .card-date-overlay{
    position:absolute;
    bottom:11px;left:12px;
    font-size:11.5px;
    font-weight:700;
    color:white;
    display:flex;
    align-items:center;
    gap:5px;
    text-shadow:0 1px 4px rgba(0,0,0,0.6);
  }

  /* Corps */
  .card-body{
    padding:16px 18px 12px;
    flex:1;
    display:flex;
    flex-direction:column;
    gap:6px;
  }
  .card-title{
    margin:0;
    font-size:15px;
    font-weight:800;
    color:#111827;
    text-transform:uppercase;
    letter-spacing:-0.1px;
    line-height:1.3;
    display:-webkit-box;
    -webkit-line-clamp:2;
    -webkit-box-orient:vertical;
    overflow:hidden;
  }
  .card-organizer{
    margin:0;
    font-size:12.5px;
    color:#9ca3af;
    font-weight:500;
  }
  .card-desc{
    margin:0;
    font-size:13px;
    color:#6b7280;
    line-height:1.55;
    display:-webkit-box;
    -webkit-line-clamp:2;
    -webkit-box-orient:vertical;
    overflow:hidden;
  }
  .card-meta{
    display:flex;
    gap:12px;
    margin-top:4px;
  }
  .card-meta-item{
    display:flex;
    align-items:center;
    gap:4px;
    font-size:11.5px;
    font-weight:600;
    color:#9ca3af;
  }

  /* Actions */
  .card-actions{
    padding:10px 18px 14px;
    border-top:1px solid #f4f4f5;
    display:flex;
    gap:8px;
  }
  .card-btn-secondary{
    flex:1;
    padding:9px 0;
    border-radius:9px;
    border:1.5px solid #e0e7ff;
    background:#f5f3ff;
    color:#4f46e5;
    font-size:12.5px;
    font-weight:700;
    cursor:pointer;
    font-family:'Outfit',sans-serif;
    transition:all .15s;
  }
  .card-btn-secondary:hover:not(:disabled){
    background:#ede9fe;
    border-color:#c7d2fe;
  }
  .card-btn-disabled{
    background:#f4f4f5 !important;
    border-color:#e5e7eb !important;
    color:#9ca3af !important;
    cursor:not-allowed !important;
  }
  .card-btn-primary{
    flex:1;
    padding:9px 0;
    border-radius:9px;
    border:none;
    background:linear-gradient(135deg,#4f46e5,#6366f1);
    color:white;
    font-size:12.5px;
    font-weight:700;
    cursor:pointer;
    font-family:'Outfit',sans-serif;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:5px;
    box-shadow:0 3px 10px rgba(79,70,229,0.30);
    transition:opacity .15s;
  }
  .card-btn-primary:hover{opacity:0.88;}
  .card-btn-ghost{
    flex:1;
    padding:9px 0;
    border-radius:9px;
    border:1.5px solid #e5e7eb;
    background:white;
    color:#9ca3af;
    font-size:12.5px;
    font-weight:600;
    cursor:not-allowed;
    font-family:'Outfit',sans-serif;
  }
  .card-btn-results{
    flex:1;
    padding:9px 0;
    border-radius:9px;
    border:none;
    background:linear-gradient(135deg,#374151,#4b5563);
    color:white;
    font-size:12.5px;
    font-weight:700;
    cursor:pointer;
    font-family:'Outfit',sans-serif;
    transition:opacity .15s;
  }
  .card-btn-results:hover{opacity:0.85;}

  /* FEATURES */
  .features{padding:96px 0;background:var(--gray-50);}
  .section-inner{max-width:1200px;margin:0 auto;padding:0 32px;}
  .section-header{text-align:center;margin-bottom:56px;}
  .section-badge{display:inline-block;background:var(--indigo-50);color:var(--indigo-600);border:1px solid var(--indigo-100);padding:4px 14px;border-radius:999px;font-size:11.5px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;}
  .section-title{font-size:34px;font-weight:800;color:var(--indigo-900);letter-spacing:-0.7px;margin-bottom:12px;}
  .section-subtitle{font-size:15.5px;color:var(--gray-500);max-width:500px;margin:0 auto;line-height:1.6;}
  .features-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;}
  .feature-card{background:white;border:1px solid #f0f0f0;border-radius:20px;padding:32px 24px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.04);transition:box-shadow .2s,transform .2s;}
  .feature-card:hover{box-shadow:0 12px 36px rgba(79,70,229,0.12);}
  .feature-icon-wrap{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;margin:0 auto 18px;}
  .feature-title{font-size:16px;font-weight:700;color:var(--indigo-900);margin-bottom:8px;}
  .feature-text{font-size:13.5px;color:var(--gray-500);line-height:1.6;}

  /* CTA */
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

  /* FOOTER */
  .footer{background:var(--indigo-900);padding:28px 32px;}
  .footer-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
  .footer-logo{display:flex;align-items:center;gap:8px;font-size:18px;}
  .footer-logo-text{font-weight:700;color:white;letter-spacing:-0.3px;}
  .footer-copy{font-size:13px;color:rgba(255,255,255,0.40);}

  /* RESPONSIVE */
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
    .elections-grid{grid-template-columns:1fr;}
  }
`;































// // src/pages/home/HomePage.jsx
// import React, { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import { ShieldCheck, Vote, BarChart3, CheckCircle, ArrowRight, Globe } from "lucide-react";
// import { FiLogIn, FiSearch, FiTag } from "react-icons/fi";
// import { useNavigate } from "react-router-dom";
// import accueilIMG from "./accueil.png";
// import api from "../../services/api";

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const formatDate = (d) =>
//   new Date(d).toLocaleDateString("fr-FR", {
//     day: "2-digit", month: "short", year: "numeric",
//   });

// const getGradient = (titre = "") => {
//   const gradients = [
//     "linear-gradient(135deg,#e63946,#f4a261)",
//     "linear-gradient(135deg,#2d6a4f,#74c69d)",
//     "linear-gradient(135deg,#023e8a,#48cae4)",
//     "linear-gradient(135deg,#7b2d8b,#e040fb)",
//     "linear-gradient(135deg,#f72585,#7209b7)",
//     "linear-gradient(135deg,#4cc9f0,#4361ee)",
//     "linear-gradient(135deg,#f8961e,#f3722c)",
//     "linear-gradient(135deg,#1b4332,#52b788)",
//     "linear-gradient(135deg,#6a040f,#d00000)",
//     "linear-gradient(135deg,#212529,#495057)",
//   ];
//   return gradients[titre.charCodeAt(0) % gradients.length];
// };

// // ─── ✅ CORRECTION PRINCIPALE : construction robuste de l'URL photo ───────────
// const BACKEND_URL = "http://localhost:5000";

// function buildPhotoUrl(rawUrl) {
//   if (!rawUrl) return null;
//   // URL absolue → retourner telle quelle
//   if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
//   // URL relative (/uploads/elections/xxx.jpg) → préfixer le backend
//   return `${BACKEND_URL}${rawUrl}`;
// }

// // ─── ElectionCard ─────────────────────────────────────────────────────────────
// function ElectionCard({ election, onVoter, onCandidater }) {
//   const navigate = useNavigate();
//   const enCours  = election.statut === "EN_COURS";
//   const termine  = election.statut === "TERMINEE";

//   // ✅ photo_url vient de la BDD, image_url est un alias legacy
//   const rawPhoto = election.photo_url || election.image_url || null;
//   const photoSrc = buildPhotoUrl(rawPhoto);
//   const hasPhoto = !!photoSrc;

//   return (
//     <motion.div
//       whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,0,0,0.13)" }}
//       transition={{ duration: 0.2, ease: "easeOut" }}
//       style={{
//         background: "white", borderRadius: "16px", overflow: "hidden",
//         boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
//         display: "flex", flexDirection: "column",
//         border: "1px solid #ececec", cursor: "pointer",
//       }}
//       onClick={() => navigate(`/election-publique/${election.id_election}`)}
//     >
//       {/* ── IMAGE / COUVERTURE ── */}
//       <div style={{
//         position: "relative", height: "200px",
//         background: hasPhoto ? "#000" : getGradient(election.titre),
//         overflow: "hidden", flexShrink: 0,
//       }}>
//         {hasPhoto ? (
//           <img
//             src={photoSrc}
//             alt={election.titre}
//             onError={e => {
//               // ✅ Fallback si l'image ne charge pas
//               e.currentTarget.style.display = "none";
//               e.currentTarget.parentElement.style.background = getGradient(election.titre);
//             }}
//             style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
//           />
//         ) : (
//           <div style={{
//             width: "100%", height: "100%",
//             display: "flex", alignItems: "center", justifyContent: "center",
//           }}>
//             <span style={{
//               fontSize: "72px", fontWeight: 900,
//               color: "rgba(255,255,255,0.15)",
//               textTransform: "uppercase", userSelect: "none", letterSpacing: "-4px",
//             }}>
//               {election.titre?.slice(0, 2)}
//             </span>
//           </div>
//         )}

//         {/* Gradient overlay */}
//         <div style={{
//           position: "absolute", bottom: 0, left: 0, right: 0, height: "80px",
//           background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
//         }} />

//         {/* Badge statut */}
//         <div style={{
//           position: "absolute", top: "12px", left: "12px",
//           display: "inline-flex", alignItems: "center", gap: "5px",
//           background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
//           padding: "4px 10px", borderRadius: "999px",
//           fontSize: "12px", fontWeight: 700, color: "#1a1a2e",
//           boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
//         }}>
//           {enCours ? (
//             <>
//               <span style={{
//                 width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
//                 display: "inline-block", animation: "blink 1.2s ease-in-out infinite",
//               }} />
//               En cours
//             </>
//           ) : termine ? (
//             <>
//               <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
//                 <path d="M20 6L9 17l-5-5"/>
//               </svg>
//               <span style={{ color: "#64748b" }}>Terminé</span>
//             </>
//           ) : (
//             <>
//               <span style={{
//                 width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "inline-block",
//               }} />
//               À venir
//             </>
//           )}
//         </div>

//         {/* Bouton Vote */}
//         <button
//           onClick={e => { e.stopPropagation(); onVoter(election); }}
//           style={{
//             position: "absolute", top: "12px", right: "12px",
//             display: "inline-flex", alignItems: "center", gap: "5px",
//             background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
//             padding: "4px 12px", borderRadius: "999px",
//             fontSize: "12px", fontWeight: 700, color: "#1a1a2e",
//             border: "none", cursor: "pointer",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.12)", transition: "background .15s",
//           }}
//           onMouseEnter={e => e.currentTarget.style.background = "white"}
//           onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.92)"}
//         >
//           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
//             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
//             <circle cx="12" cy="7" r="4"/>
//           </svg>
//           Vote
//         </button>

//         {/* Date */}
//         <div style={{
//           position: "absolute", bottom: "10px", left: "12px",
//           fontSize: "11.5px", fontWeight: 700, color: "white",
//           display: "flex", alignItems: "center", gap: "5px",
//           textShadow: "0 1px 4px rgba(0,0,0,0.5)",
//         }}>
//           <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
//             <rect x="3" y="4" width="18" height="18" rx="2"/>
//             <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
//             <line x1="3" y1="10" x2="21" y2="10"/>
//           </svg>
//           {formatDate(election.date_debut)}
//         </div>
//       </div>

//       {/* ── CORPS ── */}
//       <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
//         <h3 style={{
//           margin: 0, fontSize: "15px", fontWeight: 800, color: "#111827",
//           textTransform: "uppercase", letterSpacing: "-0.1px", lineHeight: 1.3,
//           display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
//         }}>
//           {election.titre}
//         </h3>

//         <p style={{
//           margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 400,
//           display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
//         }}>
//           {election.prenom_admin} {election.nom_admin}
//         </p>

//         {election.description && (
//           <p style={{
//             margin: 0, fontSize: "13px", color: "#374151", lineHeight: 1.55,
//             display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
//           }}>
//             {election.description}
//           </p>
//         )}

//         <div style={{ marginTop: "auto", paddingTop: "6px" }}>
//           <span style={{
//             display: "inline-flex", alignItems: "center", gap: "5px",
//             fontSize: "11px", fontWeight: 600, color: "#6b7280",
//             letterSpacing: ".5px", textTransform: "uppercase",
//           }}>
//             <FiTag size={11} />
//             {election.type || "Election"}
//           </span>
//         </div>
//       </div>

//       {/* ── ACTIONS ── */}
//       <div style={{ padding: "10px 18px 14px", borderTop: "1px solid #f4f4f5", display: "flex", gap: "8px" }}>
//         <button
//           onClick={e => { e.stopPropagation(); onCandidater(election); }}
//           style={{
//             flex: 1, padding: "8px 0", borderRadius: "8px",
//             border: "1.5px solid #e0e7ff", background: "#f5f3ff",
//             color: "#4f46e5", fontSize: "12.5px", fontWeight: 700,
//             cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
//           }}
//           onMouseEnter={e => e.currentTarget.style.background = "#ede9fe"}
//           onMouseLeave={e => e.currentTarget.style.background = "#f5f3ff"}
//         >
//           Se candidater
//         </button>
//         {enCours && (
//           <button
//             onClick={e => { e.stopPropagation(); onVoter(election); }}
//             style={{
//               flex: 1, padding: "8px 0", borderRadius: "8px", border: "none",
//               background: "linear-gradient(135deg,#4f46e5,#6366f1)",
//               color: "white", fontSize: "12.5px", fontWeight: 700,
//               cursor: "pointer", fontFamily: "inherit",
//               boxShadow: "0 3px 10px rgba(79,70,229,0.30)", transition: "opacity .15s",
//             }}
//             onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
//             onMouseLeave={e => e.currentTarget.style.opacity = "1"}
//           >
//             Voter →
//           </button>
//         )}
//       </div>
//     </motion.div>
//   );
// }

// // ─── Page principale ──────────────────────────────────────────────────────────
// export default function HomePage() {
//   const navigate = useNavigate();
//   const [elections,  setElections]  = useState([]);
//   const [loadingEl,  setLoadingEl]  = useState(true);
//   const [searchQ,    setSearchQ]    = useState("");
//   const [filterType, setFilterType] = useState("all");

//   useEffect(() => {
//     api.get("/public-elections")
//       .then(r => setElections(r.data))
//       .catch(console.error)
//       .finally(() => setLoadingEl(false));
//   }, []);

//   const filteredElections = elections.filter(e => {
//     const q      = searchQ.toLowerCase();
//     const matchQ = !q || e.titre.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
//     const matchF =
//       filterType === "all"      ? true :
//       filterType === "en_cours" ? e.statut === "EN_COURS" :
//       filterType === "a_venir"  ? e.statut === "APPROUVEE" : true;
//     return matchQ && matchF;
//   });

//   return (
//     <>
//       <style>{pageStyles}</style>
//       <div className="home-root">

//         {/* NAVBAR */}
//         <header className="navbar">
//           <div className="navbar-inner">
//             <div className="navbar-logo">
//               <span className="logo-icon">🗳</span>
//               <span className="logo-text">EVote</span>
//             </div>
//             <nav className="navbar-links">
//               <a href="#elections"       className="nav-link-section">Élections</a>
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

//         {/* HERO */}
//         <section className="hero" id="accueil">
//           <div className="hero-orb hero-orb-1" />
//           <div className="hero-orb hero-orb-2" />
//           <div className="hero-grid" />
//           <div className="hero-inner">
//             <motion.div className="hero-text" initial={{ opacity:0, x:-36 }} animate={{ opacity:1, x:0 }} transition={{ duration:.6, ease:[0.22,1,0.36,1] }}>
//               <span className="hero-badge">
//                 <span className="badge-dot" /> Vote électronique sécurisé
//               </span>
//               <h1 className="hero-title">
//                 Organisez vos élections{" "}
//                 <span className="hero-title-accent">facilement et en toute confiance</span>
//               </h1>
//               <p className="hero-desc">
//                 Participez aux élections publiques ou organisez les vôtres.
//                 Candidatez, votez, suivez les résultats — le tout en quelques clics.
//               </p>
//               <div className="hero-btns">
//                 <a href="#elections" className="btn-filled btn-lg" style={{ textDecoration:"none" }}>
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

//             <motion.div className="hero-img-wrap" initial={{ opacity:0, y:36 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.1 }}>
//               <div className="hero-img-glow" />
//               <img src={accueilIMG} alt="Vote en ligne" className="hero-img" />
//             </motion.div>
//           </div>
//         </section>

//         {/* STATS */}
//         <section className="stats-bar">
//           <div className="stats-inner">
//             {[
//               { value:"247+",  label:"Votes traités" },
//               { value:"12+",   label:"Élections organisées" },
//               { value:"99.9%", label:"Disponibilité" },
//               { value:"100%",  label:"Résultats transparents" },
//             ].map((s,i) => (
//               <motion.div key={i} className="stat-item" initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.08 }}>
//                 <span className="stat-value">{s.value}</span>
//                 <span className="stat-label">{s.label}</span>
//               </motion.div>
//             ))}
//           </div>
//         </section>

//         {/* ELECTIONS PUBLIQUES */}
//         <section id="elections" style={{ padding:"80px 0", background:"#f9fafb" }}>
//           <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"0 32px" }}>

//             <div style={{ textAlign:"center", marginBottom:"40px" }}>
//               <span style={{
//                 display:"inline-block", background:"#eef2ff", color:"#4f46e5",
//                 border:"1px solid #e0e7ff", padding:"4px 14px", borderRadius:"999px",
//                 fontSize:"11.5px", fontWeight:600, letterSpacing:".8px",
//                 textTransform:"uppercase", marginBottom:"14px",
//               }}>Elections publiques</span>
//               <h2 style={{ fontSize:"34px", fontWeight:800, color:"#111827", letterSpacing:"-0.7px", marginBottom:"10px" }}>
//                 Participez aux élections ouvertes
//               </h2>
//               <p style={{ fontSize:"15px", color:"#6b7280", maxWidth:"500px", margin:"0 auto", lineHeight:1.6 }}>
//                 Candidatez librement ou votez pour vos favoris.
//               </p>
//             </div>

//             {/* Recherche + filtres */}
//             <div style={{ display:"flex", gap:"12px", marginBottom:"32px", flexWrap:"wrap" }}>
//               <div style={{
//                 flex:1, minWidth:"240px", display:"flex", alignItems:"center",
//                 gap:"10px", background:"white", border:"1.5px solid #e5e7eb",
//                 borderRadius:"12px", padding:"10px 14px",
//                 boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
//               }}>
//                 <FiSearch size={16} color="#9ca3af" />
//                 <input
//                   type="text" placeholder="Rechercher une élection…"
//                   value={searchQ} onChange={e => setSearchQ(e.target.value)}
//                   style={{ flex:1, border:"none", outline:"none", fontSize:"14px", fontFamily:"inherit", color:"#111827", background:"transparent" }}
//                 />
//               </div>
//               <div style={{ display:"flex", gap:6 }}>
//                 {[
//                   { key:"all",      label:"Toutes" },
//                   { key:"en_cours", label:"En cours" },
//                   { key:"a_venir",  label:"À venir" },
//                 ].map(f => (
//                   <button key={f.key} onClick={() => setFilterType(f.key)} style={{
//                     padding:"10px 18px", borderRadius:"10px", fontSize:"13px", fontWeight:600,
//                     border: filterType === f.key ? "none" : "1.5px solid #e5e7eb",
//                     background: filterType === f.key ? "#111827" : "white",
//                     color: filterType === f.key ? "white" : "#6b7280",
//                     cursor:"pointer", fontFamily:"inherit", transition:"all .15s",
//                     boxShadow: filterType === f.key ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
//                   }}>
//                     {f.label}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Grille */}
//             {loadingEl ? (
//               <div style={{ textAlign:"center", padding:"80px 0", color:"#9ca3af" }}>
//                 <div style={{
//                   width:"36px", height:"36px", borderRadius:"50%",
//                   border:"3px solid #e5e7eb", borderTopColor:"#4f46e5",
//                   animation:"spin .7s linear infinite", margin:"0 auto 16px",
//                 }} />
//                 Chargement des élections…
//               </div>
//             ) : filteredElections.length === 0 ? (
//               <div style={{ textAlign:"center", padding:"80px 0" }}>
//                 <div style={{ fontSize:"48px", marginBottom:"16px" }}>🗳</div>
//                 <p style={{ fontSize:"16px", fontWeight:700, color:"#374151", marginBottom:"8px" }}>
//                   Aucune élection publique pour le moment
//                 </p>
//                 <p style={{ fontSize:"14px", color:"#9ca3af" }}>
//                   Revenez bientôt ou créez votre propre élection !
//                 </p>
//               </div>
//             ) : (
//               <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:"24px" }}>
//                 {filteredElections.map(el => (
//                   <ElectionCard
//                     key={el.id_election}
//                     election={el}
//                     onVoter={el   => navigate(`/voter/${el.id_election}`)}
//                     onCandidater={el => navigate(`/candidater/${el.id_election}`)}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>
//         </section>

//         {/* FEATURES */}
//         <section className="features" id="fonctionnalites">
//           <div className="section-inner">
//             <div className="section-header">
//               <span className="section-badge">Fonctionnalités</span>
//               <h2 className="section-title">Pourquoi choisir EVote ?</h2>
//               <p className="section-subtitle">Une plateforme complète pensée pour la fiabilité et la simplicité.</p>
//             </div>
//             <div className="features-grid">
//               {[
//                 { icon:<ShieldCheck size={24}/>, title:"Sécurité maximale",    text:"Chiffrement bout en bout des votes avec protection anti-fraude intégrée.", color:"#6366f1", bg:"#eef2ff" },
//                 { icon:<Globe size={24}/>,       title:"Public ou Privé",      text:"Créez des élections ouvertes à tous ou réservées à vos membres.",           color:"#0ea5e9", bg:"#f0f9ff" },
//                 { icon:<Vote size={24}/>,        title:"Vote payant flexible", text:"Définissez vos frais de vote. L'électeur paie via MTN ou Orange Money.",    color:"#8b5cf6", bg:"#f5f3ff" },
//                 { icon:<BarChart3 size={24}/>,   title:"Résultats en direct",  text:"Tableaux de bord temps réel pour candidats et électeurs.",                  color:"#10b981", bg:"#f0fdf4" },
//               ].map((f,i) => (
//                 <motion.div key={i} className="feature-card" initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.1 }} whileHover={{ y:-6 }}>
//                   <div className="feature-icon-wrap" style={{ background:f.bg, color:f.color }}>{f.icon}</div>
//                   <h3 className="feature-title">{f.title}</h3>
//                   <p className="feature-text">{f.text}</p>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* CTA */}
//         <section className="cta-section">
//           <div className="cta-orb" />
//           <motion.div className="cta-inner" initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
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

//         {/* FOOTER */}
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

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const pageStyles = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
//   :root{--indigo-50:#eef2ff;--indigo-100:#e0e7ff;--indigo-200:#c7d2fe;--indigo-500:#6366f1;--indigo-600:#4f46e5;--indigo-700:#4338ca;--indigo-900:#1e1b4b;--gray-50:#f9fafb;--gray-500:#6b7280;--gray-800:#1f2937;--white:#fff;}
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.6;transform:scale(0.85);}}
//   @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
//   @keyframes spin{to{transform:rotate(360deg);}}
//   .home-root{min-height:100vh;font-family:'Outfit',sans-serif;color:var(--gray-800);background:var(--white);}
//   .navbar{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);box-shadow:0 1px 16px rgba(0,0,0,0.05);}
//   .navbar-inner{max-width:1200px;margin:0 auto;padding:0 32px;height:62px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
//   .navbar-logo{display:flex;align-items:center;gap:9px;flex-shrink:0;}
//   .logo-icon{font-size:20px;}.logo-text{font-size:19px;font-weight:900;color:var(--indigo-600);letter-spacing:-0.5px;}
//   .navbar-links{display:flex;align-items:center;gap:4px;}
//   .nav-link-section{padding:8px 16px;border-radius:9px;font-size:13.5px;font-weight:600;color:var(--gray-500);text-decoration:none;transition:background .15s,color .15s;}
//   .nav-link-section:hover{background:var(--indigo-50);color:var(--indigo-600);}
//   .navbar-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;}
//   .navbar-btn-ghost{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:9px;border:none;background:transparent;color:var(--gray-500);font-size:13.5px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;transition:all .15s;}
//   .navbar-btn-ghost:hover{background:var(--indigo-50);color:var(--indigo-600);transform:translateY(-1px);}
//   .navbar-btn-filled{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:9px;border:none;background:var(--indigo-600);color:white;font-size:13.5px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(79,70,229,0.25);transition:all .18s;}
//   .navbar-btn-filled:hover{background:var(--indigo-700);transform:translateY(-1px);}
//   .btn-filled{display:inline-flex;align-items:center;gap:8px;background:var(--indigo-600);color:#fff!important;border:none;border-radius:12px;font-family:'Outfit',sans-serif;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(79,70,229,0.30);transition:all .18s;}
//   .btn-filled:hover{background:var(--indigo-700);transform:translateY(-2px);}
//   .btn-outline{display:inline-flex;align-items:center;gap:7px;border-radius:12px;border:2px solid var(--indigo-600);background:transparent;color:var(--indigo-600);font-size:15px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;transition:all .15s;}
//   .btn-outline:hover{background:var(--indigo-50);transform:translateY(-1px);}
//   .btn-lg{padding:13px 28px;font-size:15px;}
//   .hero{padding-top:110px;padding-bottom:100px;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow:hidden;}
//   .hero-orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;}
//   .hero-orb-1{width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 70%);top:-200px;left:-200px;}
//   .hero-orb-2{width:400px;height:400px;background:radial-gradient(circle,rgba(14,165,233,0.12) 0%,transparent 70%);bottom:-100px;right:-100px;}
//   .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px);background-size:44px 44px;pointer-events:none;}
//   .hero-inner{max-width:1200px;margin:0 auto;padding:0 32px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;position:relative;z-index:1;}
//   .hero-badge{display:inline-flex;align-items:center;gap:8px;background:white;border:1px solid var(--indigo-200);color:var(--indigo-600);padding:6px 16px;border-radius:999px;font-size:12.5px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;margin-bottom:20px;box-shadow:0 2px 8px rgba(99,102,241,0.10);}
//   .badge-dot{width:7px;height:7px;background:var(--indigo-500);border-radius:50%;animation:pulse 2s ease-in-out infinite;}
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
//   .feature-card{background:white;border:1px solid #f0f0f0;border-radius:20px;padding:32px 24px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.04);transition:box-shadow .2s,transform .2s;}
//   .feature-card:hover{box-shadow:0 12px 36px rgba(79,70,229,0.12);}
//   .feature-icon-wrap{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;margin:0 auto 18px;}
//   .feature-title{font-size:16px;font-weight:700;color:var(--indigo-900);margin-bottom:8px;}
//   .feature-text{font-size:13.5px;color:var(--gray-500);line-height:1.6;}
//   .cta-section{background:linear-gradient(135deg,var(--indigo-600) 0%,#4338ca 100%);padding:100px 32px;text-align:center;position:relative;overflow:hidden;}
//   .cta-orb{position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%);border-radius:50%;top:-200px;left:50%;transform:translateX(-50%);pointer-events:none;}
//   .cta-inner{position:relative;z-index:1;max-width:600px;margin:0 auto;}
//   .cta-badge{display:inline-block;background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.25);padding:4px 16px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;margin-bottom:20px;}
//   .cta-title{font-size:38px;font-weight:900;color:white;letter-spacing:-0.8px;margin-bottom:14px;line-height:1.2;}
//   .cta-desc{font-size:16px;color:rgba(255,255,255,0.80);margin-bottom:36px;line-height:1.6;}
//   .cta-btns{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;}
//   .cta-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;background:white;color:var(--indigo-600);border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,0.15);transition:all .15s;}
//   .cta-btn-primary:hover{background:#f5f5ff;transform:translateY(-2px);}
//   .cta-btn-ghost{padding:13px 28px;background:transparent;color:white;border:2px solid rgba(255,255,255,0.40);border-radius:12px;font-size:15px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;transition:all .15s;}
//   .cta-btn-ghost:hover{background:rgba(255,255,255,0.10);transform:translateY(-1px);}
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
//     .hero{padding-top:100px;padding-bottom:60px;}
//     .hero-inner,.section-inner{padding:0 20px;}
//   }
// `;


