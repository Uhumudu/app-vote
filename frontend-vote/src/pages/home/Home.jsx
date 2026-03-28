// src/pages/HomePage.jsx
import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Users, Vote, BarChart3, CheckCircle, ArrowRight } from "lucide-react";
import { FiLogIn } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import accueilIMG from "./accueil.png";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="home-root">

        {/* ===== NAVBAR ===== */}
        <header className="navbar">
          <div className="navbar-inner">
            <div className="navbar-logo">
              <span className="logo-icon">🗳</span>
              <span className="logo-text">EVote</span>
            </div>

            <nav className="navbar-links">
              <a href="#fonctionnalites" className="nav-link-section">Fonctionnalités</a>
              <a href="#pourquoi" className="nav-link-section">Pourquoi nous</a>
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

        {/* ===== HERO ===== */}
        <section className="hero" id="accueil">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-grid" />

          <div className="hero-inner">
            <motion.div
              className="hero-text"
              initial={{ opacity: 0, x: -36 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="hero-badge">
                <span className="badge-dot" />
                Vote électronique sécurisé
              </span>

              <h1 className="hero-title">
                Organisez vos élections{" "}
                <span className="hero-title-accent">facilement et en toute confiance</span>
              </h1>

              <p className="hero-desc">
                Digitalisez vos scrutins pour écoles, universités et entreprises avec
                transparence, sécurité et simplicité.
              </p>

              <div className="hero-btns">
                <button onClick={() => navigate("/login")} className="btn-filled btn-lg">
                  Commencer à voter <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate("/creer-election")} className="btn-outline btn-lg">
                  Organiser une élection
                </button>
              </div>

              <div className="hero-badges">
                <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Données chiffrées</div>
                <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Résultats instantanés</div>
                <div className="trust-badge"><CheckCircle size={15} className="trust-icon" /> Accès sécurisé</div>
              </div>
            </motion.div>

            <motion.div
              className="hero-img-wrap"
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="hero-img-glow" />
              <img src={accueilIMG} alt="Vote en ligne" className="hero-img" />
            </motion.div>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <section className="stats-bar">
          <div className="stats-inner">
            {[
              { value: "247+", label: "Votes traités" },
              { value: "12+", label: "Élections organisées" },
              { value: "99.9%", label: "Disponibilité" },
              { value: "100%", label: "Résultats transparents" },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="stat-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section className="features" id="fonctionnalites">
          <div className="section-inner">
            <div className="section-header">
              <span className="section-badge">Fonctionnalités</span>
              <h2 className="section-title">Pourquoi choisir EVote ?</h2>
              <p className="section-subtitle">
                Une plateforme complète pensée pour la fiabilité et la simplicité.
              </p>
            </div>

            <div className="features-grid" id="pourquoi">
              {[
                {
                  icon: <ShieldCheck size={24} />,
                  title: "Sécurité maximale",
                  text: "Chiffrement bout en bout des votes avec protection anti-fraude intégrée.",
                  color: "#6366f1",
                  bg: "#eef2ff",
                },
                {
                  icon: <Users size={24} />,
                  title: "Multi-rôles",
                  text: "Gestion claire des admins, électeurs et super administrateurs.",
                  color: "#0ea5e9",
                  bg: "#f0f9ff",
                },
                {
                  icon: <Vote size={24} />,
                  title: "Interface intuitive",
                  text: "Expérience de vote simple, rapide et entièrement responsive.",
                  color: "#8b5cf6",
                  bg: "#f5f3ff",
                },
                {
                  icon: <BarChart3 size={24} />,
                  title: "Statistiques en direct",
                  text: "Résultats transparents et visualisables en temps réel.",
                  color: "#10b981",
                  bg: "#f0fdf4",
                },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  className="feature-card"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                >
                  <div className="feature-icon-wrap" style={{ background: f.bg, color: f.color }}>
                    {f.icon}
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-text">{f.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="cta-section">
          <div className="cta-orb" />
          <motion.div
            className="cta-inner"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="cta-badge">Prêt à commencer ?</span>
            <h2 className="cta-title">Lancez votre élection aujourd'hui</h2>
            <p className="cta-desc">Simplifiez vos scrutins et garantissez la transparence pour tous vos participants.</p>
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

        {/* ===== FOOTER ===== */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-logo">
              <span>🗳</span>
              <span className="footer-logo-text">EVote</span>
            </div>
            <p className="footer-copy">© {new Date().getFullYear()} EVote. Tous droits réservés.</p>
          </div>
        </footer>

      </div>
    </>
  );
}

/* ============================================================
   STYLES
   ============================================================ */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

  :root {
    --indigo-50:  #eef2ff;
    --indigo-100: #e0e7ff;
    --indigo-200: #c7d2fe;
    --indigo-500: #6366f1;
    --indigo-600: #4f46e5;
    --indigo-700: #4338ca;
    --indigo-900: #1e1b4b;
    --gray-50:    #f9fafb;
    --gray-100:   #f3f4f6;
    --gray-500:   #6b7280;
    --gray-600:   #4b5563;
    --gray-800:   #1f2937;
    --white:      #ffffff;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .home-root {
    min-height: 100vh;
    font-family: 'Outfit', sans-serif;
    color: var(--gray-800);
    background: var(--white);
  }

  /* ===== NAVBAR ===== */
  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(99,102,241,0.12);
    box-shadow: 0 1px 16px rgba(0,0,0,0.05);
  }
  .navbar-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .navbar-logo {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-shrink: 0;
    text-decoration: none;
  }
  .logo-icon { font-size: 20px; }
  .logo-text {
    font-size: 19px;
    font-weight: 900;
    color: var(--indigo-600);
    letter-spacing: -0.5px;
  }
  .navbar-links {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .nav-link-section {
    padding: 8px 16px;
    border-radius: 9px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--gray-500);
    text-decoration: none;
    transition: background .15s, color .15s;
  }
  .nav-link-section:hover { background: var(--indigo-50); color: var(--indigo-600); }

  .navbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .navbar-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    border-radius: 9px;
    border: none;
    background: transparent;
    color: var(--gray-500);
    font-size: 13.5px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: background .15s, color .15s, transform .15s;
  }
  .navbar-btn-ghost:hover { background: var(--indigo-50); color: var(--indigo-600); transform: translateY(-1px); }

  .navbar-btn-filled {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 18px;
    border-radius: 9px;
    border: none;
    background: var(--indigo-600);
    color: white;
    font-size: 13.5px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(79,70,229,0.25);
    transition: background .18s, transform .15s, box-shadow .18s;
  }
  .navbar-btn-filled:hover { background: var(--indigo-700); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79,70,229,0.35); }

  /* ===== HERO BUTTONS ===== */
  .btn-filled {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--indigo-600);
    color: #ffffff !important;
    border: none;
    border-radius: 12px;
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(79,70,229,0.30);
    transition: background .18s, transform .15s, box-shadow .18s;
    text-decoration: none;
  }
  .btn-filled:hover {
    background: var(--indigo-700);
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(79,70,229,0.38);
    color: #ffffff !important;
  }
  .btn-filled:active { transform: translateY(0); }

  .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 13px 28px;
    border-radius: 12px;
    border: 2px solid var(--indigo-600);
    background: transparent;
    color: var(--indigo-600);
    font-size: 15px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: background .15s, transform .15s;
  }
  .btn-outline:hover { background: var(--indigo-50); transform: translateY(-1px); }

  .btn-lg { padding: 13px 28px; font-size: 15px; border-radius: 12px; }

  /* ===== HERO ===== */
  .hero {
    padding-top: 110px;
    padding-bottom: 100px;
    background: linear-gradient(135deg, #eef2ff 0%, #f8f9ff 55%, #eff6ff 100%);
    position: relative;
    overflow: hidden;
  }
  .hero-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;
  }
  .hero-orb-1 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%);
    top: -200px; left: -200px;
  }
  /* ✅ MODIFIÉ : orbe côté illustration → bleu */
  .hero-orb-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%);
    bottom: -100px; right: -100px;
  }
  .hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none;
  }
  .hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: center;
    position: relative;
    z-index: 1;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: white;
    border: 1px solid var(--indigo-200);
    color: var(--indigo-600);
    padding: 6px 16px;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: .4px;
    text-transform: uppercase;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(99,102,241,0.10);
  }
  .badge-dot {
    width: 7px; height: 7px;
    background: var(--indigo-500);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: .6; transform: scale(0.85); }
  }
  .hero-title {
    font-size: 46px;
    font-weight: 900;
    line-height: 1.13;
    letter-spacing: -1.2px;
    color: var(--indigo-900);
    margin-bottom: 20px;
  }
  .hero-title-accent { color: var(--indigo-600); }
  .hero-desc {
    font-size: 16.5px;
    color: var(--gray-500);
    line-height: 1.7;
    margin-bottom: 32px;
    max-width: 480px;
  }
  .hero-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 28px;
  }
  .hero-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .trust-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--gray-500);
    font-weight: 500;
  }
  .trust-icon { color: #22c55e; flex-shrink: 0; }

  .hero-img-wrap {
    position: relative;
    display: flex;
    justify-content: center;
  }
  /* ✅ MODIFIÉ : glow illustration → bleu */
  .hero-img-glow {
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle, rgba(14,165,233,0.22) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(30px);
    z-index: 0;
  }
  /* ✅ MODIFIÉ : ombre image → bleu */
  .hero-img {
    width: 100%;
    max-width: 460px;
    border-radius: 24px;
    box-shadow: 0 24px 64px rgba(14,165,233,0.22), 0 4px 16px rgba(0,0,0,0.08);
    position: relative;
    z-index: 1;
  }

  /* ===== STATS ===== */
  .stats-bar {
    background: white;
    border-top: 1px solid var(--indigo-100);
    border-bottom: 1px solid var(--indigo-100);
  }
  .stats-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 32px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
  }
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 16px;
    border-right: 1px solid var(--indigo-100);
  }
  .stat-item:last-child { border-right: none; }
  .stat-value {
    font-size: 26px;
    font-weight: 800;
    color: var(--indigo-600);
    letter-spacing: -0.5px;
  }
  .stat-label {
    font-size: 13px;
    color: var(--gray-500);
    font-weight: 500;
  }

  /* ===== FEATURES ===== */
  .features {
    padding: 96px 0;
    background: var(--gray-50);
  }
  .section-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
  }
  .section-header {
    text-align: center;
    margin-bottom: 56px;
  }
  .section-badge {
    display: inline-block;
    background: var(--indigo-50);
    color: var(--indigo-600);
    border: 1px solid var(--indigo-100);
    padding: 4px 14px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: .8px;
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .section-title {
    font-size: 34px;
    font-weight: 800;
    color: var(--indigo-900);
    letter-spacing: -0.7px;
    margin-bottom: 12px;
  }
  .section-subtitle {
    font-size: 15.5px;
    color: var(--gray-500);
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.6;
  }
  .features-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
  .feature-card {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 20px;
    padding: 32px 24px;
    text-align: center;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    transition: box-shadow .2s, transform .2s;
    cursor: default;
  }
  .feature-card:hover { box-shadow: 0 12px 36px rgba(79,70,229,0.12); }
  .feature-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px; height: 56px;
    border-radius: 14px;
    margin: 0 auto 18px;
  }
  .feature-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--indigo-900);
    margin-bottom: 8px;
    letter-spacing: -0.2px;
  }
  .feature-text {
    font-size: 13.5px;
    color: var(--gray-500);
    line-height: 1.6;
  }

  /* ===== CTA ===== */
  .cta-section {
    background: linear-gradient(135deg, var(--indigo-600) 0%, #4338ca 100%);
    padding: 100px 32px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .cta-orb {
    position: absolute;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
    border-radius: 50%;
    top: -200px; left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
  }
  .cta-inner {
    position: relative;
    z-index: 1;
    max-width: 600px;
    margin: 0 auto;
  }
  .cta-badge {
    display: inline-block;
    background: rgba(255,255,255,0.15);
    color: white;
    border: 1px solid rgba(255,255,255,0.25);
    padding: 4px 16px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .8px;
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .cta-title {
    font-size: 38px;
    font-weight: 900;
    color: white;
    letter-spacing: -0.8px;
    margin-bottom: 14px;
    line-height: 1.2;
  }
  .cta-desc {
    font-size: 16px;
    color: rgba(255,255,255,0.80);
    margin-bottom: 36px;
    line-height: 1.6;
  }
  .cta-btns { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
  .cta-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    background: white;
    color: var(--indigo-600);
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    transition: background .15s, transform .15s, box-shadow .15s;
  }
  .cta-btn-primary:hover { background: #f5f5ff; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.18); }
  .cta-btn-ghost {
    padding: 13px 28px;
    background: transparent;
    color: white;
    border: 2px solid rgba(255,255,255,0.40);
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: background .15s, border-color .15s, transform .15s;
  }
  .cta-btn-ghost:hover { background: rgba(255,255,255,0.10); border-color: rgba(255,255,255,0.65); transform: translateY(-1px); }

  /* ===== FOOTER ===== */
  .footer {
    background: var(--indigo-900);
    padding: 28px 32px;
  }
  .footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .footer-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
  }
  .footer-logo-text {
    font-weight: 700;
    color: white;
    letter-spacing: -0.3px;
  }
  .footer-copy {
    font-size: 13px;
    color: rgba(255,255,255,0.40);
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 900px) {
    .hero-inner { grid-template-columns: 1fr; gap: 40px; }
    .hero-img { max-width: 340px; }
    .hero-title { font-size: 34px; }
    .features-grid { grid-template-columns: 1fr 1fr; }
    .stats-inner { grid-template-columns: 1fr 1fr; }
    .stat-item:nth-child(2) { border-right: none; }
    .navbar-links { display: none; }
  }
  @media (max-width: 580px) {
    .navbar-inner { padding: 0 20px; }
    .navbar-btn-ghost span { display: none; }
    .features-grid { grid-template-columns: 1fr; }
    .stats-inner { grid-template-columns: 1fr 1fr; }
    .hero { padding-top: 100px; padding-bottom: 60px; }
    .hero-inner { padding: 0 20px; }
    .section-inner { padding: 0 20px; }
  }
`;








































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

//   /* ===== HERO BUTTONS — FIX ===== */
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
//   .hero-orb-2 {
//     width: 400px; height: 400px;
//     background: radial-gradient(circle, rgba(79,70,229,0.09) 0%, transparent 70%);
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
//   .hero-img-glow {
//     position: absolute;
//     inset: -20px;
//     background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
//     border-radius: 50%;
//     filter: blur(30px);
//     z-index: 0;
//   }
//   .hero-img {
//     width: 100%;
//     max-width: 460px;
//     border-radius: 24px;
//     box-shadow: 0 24px 64px rgba(79,70,229,0.18), 0 4px 16px rgba(0,0,0,0.08);
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

// function Feature({ icon, title, text }) {
//   return (
//     <motion.div whileHover={{ y: -6 }} className="feature-card">
//       <div className="flex justify-center mb-4">{icon}</div>
//       <h3 className="feature-title">{title}</h3>
//       <p className="feature-text">{text}</p>
//     </motion.div>
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
//   .hero-orb-2 {
//     width: 400px; height: 400px;
//     background: radial-gradient(circle, rgba(79,70,229,0.09) 0%, transparent 70%);
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
//   .hero-img-glow {
//     position: absolute;
//     inset: -20px;
//     background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
//     border-radius: 50%;
//     filter: blur(30px);
//     z-index: 0;
//   }
//   .hero-img {
//     width: 100%;
//     max-width: 460px;
//     border-radius: 24px;
//     box-shadow: 0 24px 64px rgba(79,70,229,0.18), 0 4px 16px rgba(0,0,0,0.08);
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



