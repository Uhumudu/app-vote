// src/pages/Deconnexion.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiLogOut, FiAlertTriangle, FiX, FiCheck } from "react-icons/fi";

export default function Logout() {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Countdown après confirmation
  useEffect(() => {
    if (!confirmed) return;
    if (countdown === 0) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [confirmed, countdown, navigate]);

  const handleConfirm = () => setConfirmed(true);
  const handleCancel  = () => navigate(-1);

  return (
    <>
      <style>{styles}</style>
      <div className="logout-root">
        {/* Orbs déco */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        <AnimatePresence mode="wait">

          {/* ── CONFIRMATION ── */}
          {!confirmed && (
            <motion.div
              key="confirm"
              className="card"
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Icône */}
              <div className="icon-ring icon-ring--warning">
                <div className="icon-inner">
                  <FiAlertTriangle size={28} />
                </div>
              </div>

              {/* Texte */}
              <div className="card-text">
                <h1 className="card-title">Déconnexion</h1>
                <p className="card-desc">
                  Êtes-vous sûr de vouloir vous déconnecter de votre session&nbsp;eVote&nbsp;?
                  <br />Vous devrez vous reconnecter pour accéder à vos élections.
                </p>
              </div>

              {/* Séparateur */}
              <div className="divider" />

              {/* Actions */}
              <div className="card-actions">
                <button className="btn-cancel" onClick={handleCancel}>
                  <FiX size={15} /> Annuler
                </button>
                <button className="btn-confirm" onClick={handleConfirm}>
                  <FiLogOut size={15} /> Oui, me déconnecter
                </button>
              </div>

              {/* Label sécurité */}
              <p className="security-note">
                🔒 Votre session sera fermée de manière sécurisée
              </p>
            </motion.div>
          )}

          {/* ── EN COURS ── */}
          {confirmed && (
            <motion.div
              key="progress"
              className="card card--progress"
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Icône succès animée */}
              <div className="icon-ring icon-ring--success">
                <div className="icon-inner">
                  <FiCheck size={28} />
                </div>
              </div>

              <div className="card-text">
                <h1 className="card-title">Déconnexion en cours…</h1>
                <p className="card-desc">
                  Vous allez être redirigé vers la page de connexion dans{" "}
                  <strong>{countdown}</strong> seconde{countdown > 1 ? "s" : ""}.
                </p>
              </div>

              {/* Barre de progression */}
              <div className="progress-track">
                <motion.div
                  className="progress-bar"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              </div>

              <p className="security-note">
                Session fermée · Données locales effacées
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </>
  );
}

/* ============================================================
   STYLES
   ============================================================ */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .logout-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Outfit', sans-serif;
    background: linear-gradient(135deg, #eef2ff 0%, #f8f9ff 55%, #eff6ff 100%);
    position: relative;
    overflow: hidden;
    padding: 24px;
  }

  /* Orbs déco */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }
  .orb-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
    top: -180px; left: -160px;
  }
  .orb-2 {
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%);
    bottom: -120px; right: -100px;
  }

  /* Card */
  .card {
    position: relative;
    z-index: 1;
    background: #ffffff;
    border-radius: 28px;
    box-shadow:
      0 4px 6px rgba(0,0,0,0.03),
      0 20px 60px rgba(79,70,229,0.10),
      0 1px 0 rgba(255,255,255,0.8) inset;
    border: 1px solid rgba(99,102,241,0.10);
    padding: 44px 40px 36px;
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    text-align: center;
  }

  /* Icône ring */
  .icon-ring {
    width: 80px; height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
    position: relative;
  }
  .icon-ring--warning {
    background: #fff7ed;
    border: 2px solid #fed7aa;
    color: #ea580c;
    animation: ring-pulse-warning 2.5s ease-in-out infinite;
  }
  .icon-ring--success {
    background: #f0fdf4;
    border: 2px solid #bbf7d0;
    color: #16a34a;
    animation: ring-pulse-success 1.8s ease-in-out infinite;
  }
  .icon-inner {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @keyframes ring-pulse-warning {
    0%, 100% { box-shadow: 0 0 0 0 rgba(234,88,12,0.15); }
    50%       { box-shadow: 0 0 0 10px rgba(234,88,12,0); }
  }
  @keyframes ring-pulse-success {
    0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.15); }
    50%       { box-shadow: 0 0 0 10px rgba(22,163,74,0); }
  }

  /* Texte */
  .card-text { margin-bottom: 28px; }
  .card-title {
    font-size: 22px;
    font-weight: 800;
    color: #1e1b4b;
    letter-spacing: -0.4px;
    margin-bottom: 10px;
  }
  .card-desc {
    font-size: 14.5px;
    color: #6b7280;
    line-height: 1.65;
  }
  .card-desc strong { color: #4f46e5; font-weight: 700; }

  /* Divider */
  .divider {
    width: 100%;
    height: 1px;
    background: #f3f4f6;
    margin-bottom: 24px;
  }

  /* Actions */
  .card-actions {
    display: flex;
    gap: 12px;
    width: 100%;
    margin-bottom: 20px;
  }
  .btn-cancel {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 12px 20px;
    border-radius: 12px;
    border: 2px solid #e5e7eb;
    background: transparent;
    color: #6b7280;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: border-color .15s, background .15s, color .15s, transform .15s;
  }
  .btn-cancel:hover {
    border-color: #d1d5db;
    background: #f9fafb;
    color: #374151;
    transform: translateY(-1px);
  }

  .btn-confirm {
    flex: 1.5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 12px 20px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(239,68,68,0.30);
    transition: background .18s, transform .15s, box-shadow .18s;
  }
  .btn-confirm:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(239,68,68,0.38);
  }
  .btn-confirm:active { transform: translateY(0); }

  /* Note sécurité */
  .security-note {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 500;
  }

  /* Barre de progression */
  .progress-track {
    width: 100%;
    height: 6px;
    background: #f0fdf4;
    border-radius: 999px;
    overflow: hidden;
    margin: 8px 0 20px;
  }
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #22c55e, #16a34a);
    border-radius: 999px;
  }

  @media (max-width: 480px) {
    .card { padding: 36px 24px 28px; }
    .card-actions { flex-direction: column; }
  }
`;

