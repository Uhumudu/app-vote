// src/pages/public/VoterPublicPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle, FiXCircle, FiArrowLeft, FiArrowRight,
  FiUsers, FiX, FiMinus, FiPlus, FiHome,
} from "react-icons/fi";
import api from "../../services/api";

const API_BASE   = import.meta.env.VITE_API_URL || "http://localhost:5000";
const formatDate = d => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// ✅ Frais unitaire fixe : 10 XAF par voix
const FRAIS_PAR_VOIX = 10;

function buildPhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const path = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
  return `${base}${path}`;
}

/* ─── Navbar commune ─────────────────────────────────────────────────────── */
function PublicNavbar() {
  const navigate = useNavigate();
  return (
    <nav style={NAV.root}>
      <div style={NAV.inner}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate(-1)} style={NAV.ghost}>
            <FiArrowLeft size={14} /> Retour
          </button>
          <div style={{ width: 1, height: 20, background: "#c7d2fe" }} />
          <a href="/" style={NAV.logo}>🗳 <strong>eVote</strong></a>
        </div>
        <a href="/dashboard-electeur" style={NAV.ghost}>
          📊 Mon tableau de bord
        </a>
      </div>
    </nav>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ photoUrl, prenom, nom, size = 52 }) {
  const [imgError, setImgError] = useState(false);
  const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
  const url = buildPhotoUrl(photoUrl);

  if (url && !imgError) {
    return (
      <div style={{ width: size, height: size, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#eef2ff" }}>
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
    <div style={{ width: size, height: size, borderRadius: 12, flexShrink: 0, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#6366f1", fontWeight: 600, fontSize: size * 0.3 }}>{initials}</span>
    </div>
  );
}

/* ─── Lightbox ───────────────────────────────────────────────────────────── */
function Lightbox({ src, nom, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
          style={{ position: "relative" }}
        >
          <img
            src={src} alt={nom}
            style={{ maxHeight: "80vh", maxWidth: "90vw", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.5)", objectFit: "contain" }}
          />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top,rgba(0,0,0,.7),transparent)", borderRadius: "0 0 16px 16px", padding: "16px" }}>
            <p style={{ color: "white", fontWeight: 700, textAlign: "center" }}>{nom}</p>
          </div>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: -12, right: -12, width: 36, height: 36, borderRadius: "50%", background: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
          >
            <FiX size={16} color="#374151" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Carte candidat ─────────────────────────────────────────────────────── */
function CarteCandidат({ c, idx, totalVotes, maxVotes, enCours, onVoter, onLightbox }) {
  const [imgError, setImgError] = useState(false);
  const votes    = Number(c.nb_votes);
  const pct      = totalVotes > 0 ? Math.round(votes / totalVotes * 100) : 0;
  const isLeader = votes > 0 && votes === maxVotes;
  const medals   = ["🥇", "🥈", "🥉"];
  const photoUrl = buildPhotoUrl(c.photo_url);
  const initials = `${c.prenom?.[0] ?? ""}${c.nom?.[0] ?? ""}`.toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
      style={{
        position: "relative", background: "white", borderRadius: 24, overflow: "hidden",
        boxShadow: isLeader ? "0 8px 32px rgba(99,102,241,0.18)" : "0 2px 12px rgba(0,0,0,0.06)",
        border: isLeader ? "2px solid #a5b4fc" : "1px solid #f0f0f0",
        display: "flex", flexDirection: "column", transition: "all .3s",
      }}
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(79,70,229,0.15)" }}
    >
      <div
        style={{ position: "relative", width: "100%", height: 240, overflow: "hidden", cursor: photoUrl && !imgError ? "zoom-in" : "default" }}
        onClick={() => photoUrl && !imgError && onLightbox({ src: photoUrl, nom: `${c.prenom} ${c.nom}` })}
      >
        {photoUrl && !imgError ? (
          <img
            src={photoUrl}
            alt={`${c.prenom} ${c.nom}`}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transition: "transform .5s" }}
            onError={() => setImgError(true)}
            onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#eef2ff,#c7d2fe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 64, fontWeight: 900, color: "#a5b4fc" }}>{initials}</span>
          </div>
        )}
        <div style={{ position: "absolute", inset: "0 0 0 0", background: "linear-gradient(to top,rgba(0,0,0,0.80) 0%,rgba(0,0,0,0.20) 45%,transparent 70%)" }} />

        <div style={{
          position: "absolute", top: 12, left: 12, width: 36, height: 36, borderRadius: 10,
          background: idx === 0 ? "rgba(245,158,11,0.95)" : idx === 1 ? "rgba(148,163,184,0.95)" : idx === 2 ? "rgba(248,113,113,0.95)" : "rgba(255,255,255,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: idx < 3 ? 18 : 13, fontWeight: 800,
          color: idx >= 3 ? "#64748b" : "white",
          backdropFilter: "blur(4px)",
        }}>
          {idx < 3 ? medals[idx] : `#${idx + 1}`}
        </div>

        {isLeader && (
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 4, background: "rgba(99,102,241,0.9)", color: "white", fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 10, backdropFilter: "blur(4px)" }}>
            🏆 En tête
          </div>
        )}

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 14px 12px" }}>
          <p style={{ color: "white", fontWeight: 900, fontSize: 15, lineHeight: 1.2, margin: "0 0 4px", textShadow: "0 1px 4px rgba(0,0,0,.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {c.prenom} {c.nom}
          </p>
          {c.parti ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,.25)", padding: "2px 10px", borderRadius: 999 }}>
              🏛 {c.parti}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>Candidat indépendant</span>
          )}
        </div>
      </div>

      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {c.bio && (
          <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.bio}</p>
        )}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              <strong style={{ color: "#4f46e5" }}>{votes}</strong> voix
            </span>
            {totalVotes > 0 && (
              <span style={{ fontSize: 12, fontWeight: 900, color: isLeader ? "#4f46e5" : "#d1d5db" }}>{pct}%</span>
            )}
          </div>
          <div style={{ height: 6, background: "#e0e7ff", borderRadius: 999, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: idx * 0.07 + 0.2 }}
              style={{ height: "100%", borderRadius: 999, background: isLeader ? "linear-gradient(90deg,#4f46e5,#818cf8)" : "#c7d2fe" }}
            />
          </div>
        </div>
        {enCours && (
          <button
            onClick={() => onVoter(c)}
            style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", border: "none", borderRadius: 14, fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(79,70,229,0.3)", transition: "all .2s", fontFamily: "'Outfit',sans-serif" }}
          >
            🗳 Voter
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Barre de progression du délai ─────────────────────────────────────── */
function TimerBar({ dureeSecondes, active }) {
  const [restant, setRestant] = useState(dureeSecondes);

  useEffect(() => {
    if (!active) return;
    setRestant(dureeSecondes);
    const iv = setInterval(() => {
      setRestant(r => {
        if (r <= 1) { clearInterval(iv); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [active, dureeSecondes]);

  const pct = Math.round((restant / dureeSecondes) * 100);
  const couleur = pct > 50 ? "#4f46e5" : pct > 20 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Temps restant</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: couleur }}>{restant}s</span>
      </div>
      <div style={{ height: 6, background: "#e0e7ff", borderRadius: 999, overflow: "hidden" }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "linear" }}
          style={{ height: "100%", borderRadius: 999, background: couleur, transition: "background 0.5s" }}
        />
      </div>
    </div>
  );
}

/* ─── Modal vote ─────────────────────────────────────────────────────────── */
function ModalVote({
  candidat, election, etape, setEtape,
  nbVoix, setNbVoix,
  telephone, setTelephone,
  nomElecteur, setNomElecteur,
  emailElecteur, setEmailElecteur,
  campayRef, msgErreur,
  onPayer, onFermer, onReessayer,
}) {
  if (!["choix_voix", "saisie", "attente", "succes", "erreur"].includes(etape)) return null;

  // ✅ Frais fixe : 10 XAF par voix (ignoré ce que retourne l'API pour l'affichage)
  const fraisUnitaire = FRAIS_PAR_VOIX;
  const montantTotal  = fraisUnitaire * nbVoix;

  const barBg = etape === "succes" ? "linear-gradient(90deg,#22c55e,#16a34a)"
              : etape === "erreur" ? "linear-gradient(90deg,#ef4444,#dc2626)"
              : "linear-gradient(90deg,#6366f1,#4f46e5)";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(15,23,42,0.75)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          key={etape}
          initial={{ opacity: 0, scale: .92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 440, boxShadow: "0 32px 100px rgba(0,0,0,0.28)", overflow: "hidden" }}
        >
          <div style={{ height: 6, background: barBg }} />
          <div style={{ padding: 32 }}>

            {/* ── CHOIX VOIX ── */}
            {etape === "choix_voix" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
                  <Avatar photoUrl={candidat?.photo_url} prenom={candidat?.prenom} nom={candidat?.nom} size={80} />
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", textAlign: "center", marginTop: 12 }}>
                    Voter pour <span style={{ color: "#4f46e5" }}>{candidat?.prenom} {candidat?.nom}</span>
                  </h3>
                  <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
                    Tarif : <strong style={{ color: "#4f46e5" }}>{fraisUnitaire} XAF</strong> par voix
                  </p>
                </div>

                <label style={FORM.label}>Nombre de voix souhaité</label>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "12px 0 16px" }}>
                  <button onClick={() => setNbVoix(v => Math.max(1, v - 1))} style={BTN.stepper}><FiMinus size={18} /></button>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <input
                      type="number" min={1} max={100} value={nbVoix}
                      onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1 && v <= 100) setNbVoix(v); }}
                      style={{ width: 96, textAlign: "center", fontSize: 28, fontWeight: 900, color: "#4f46e5", border: "2px solid #c7d2fe", borderRadius: 16, padding: "10px 8px", outline: "none", background: "#eef2ff", fontFamily: "'Outfit',sans-serif" }}
                    />
                    <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>voix</span>
                  </div>
                  <button onClick={() => setNbVoix(v => Math.min(100, v + 1))} style={BTN.stepper}><FiPlus size={18} /></button>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
                  {[1, 2, 3, 5, 10].map(n => (
                    <button key={n} onClick={() => setNbVoix(n)} style={{
                      padding: "6px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s", fontFamily: "'Outfit',sans-serif",
                      background: nbVoix === n ? "#4f46e5" : "white", color: nbVoix === n ? "white" : "#4f46e5",
                      border: `2px solid ${nbVoix === n ? "#4f46e5" : "#c7d2fe"}`,
                    }}>{n}</button>
                  ))}
                </div>

                {/* ✅ Récapitulatif clair avec montant calculé */}
                <div style={{ background: "linear-gradient(135deg,#eef2ff,#e0e7ff)", borderRadius: 16, padding: 16, marginBottom: 20, border: "1px solid #c7d2fe" }}>
                  {[
                    ["Prix par voix", `${fraisUnitaire} XAF`],
                    ["Nombre de voix", `× ${nbVoix}`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "#4f46e5" }}>{l}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#3730a3" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: "#c7d2fe", margin: "10px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 900, color: "#1e1b4b" }}>Total à débiter</span>
                    <motion.span
                      key={montantTotal} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                      style={{ fontSize: 20, fontWeight: 900, color: "#4f46e5" }}
                    >{montantTotal} XAF</motion.span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={onFermer} style={BTN.secondary}>← Retour</button>
                  <button onClick={() => setEtape("saisie")} style={{ ...BTN.primary, flex: 2 }}>
                    Continuer → {montantTotal} XAF
                  </button>
                </div>
              </>
            )}

            {/* ── SAISIE ── */}
            {etape === "saisie" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                  <Avatar photoUrl={candidat?.photo_url} prenom={candidat?.prenom} nom={candidat?.nom} size={64} />
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: "#1e1b4b", textAlign: "center", marginTop: 10 }}>{candidat?.prenom} {candidat?.nom}</h3>
                  {/* ✅ Affichage du montant total calculé */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, background: "#eef2ff", borderRadius: 10, padding: "8px 14px", border: "1px solid #c7d2fe" }}>
                    <span style={{ fontSize: 13, color: "#4f46e5" }}>{nbVoix} voix × {fraisUnitaire} XAF =</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: "#3730a3" }}>{montantTotal} XAF</span>
                  </div>
                </div>

                {[
                  { label: "Votre nom", placeholder: "Ex: Kengne", value: nomElecteur, setter: setNomElecteur, type: "text" },
                  { label: "Email", placeholder: "kengne@email.com", value: emailElecteur, setter: setEmailElecteur, type: "email" },
                ].map(({ label, placeholder, value, setter, type }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <label style={{ ...FORM.label, marginBottom: 6 }}>
                      {label} <span style={{ color: "#9ca3af", textTransform: "none", fontSize: 10 }}>(optionnel)</span>
                    </label>
                    <input type={type} placeholder={placeholder} value={value} onChange={e => setter(e.target.value)}
                      style={{ ...FORM.input, marginBottom: 0 }} />
                  </div>
                ))}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ ...FORM.label, marginBottom: 6 }}>Numéro MTN / Orange Money *</label>
                  <div style={{ display: "flex", border: "2px solid #c7d2fe", borderRadius: 12, overflow: "hidden" }}>
                    <span style={{ padding: "12px 14px", background: "#eef2ff", color: "#4f46e5", fontWeight: 800, fontSize: 14, borderRight: "2px solid #c7d2fe" }}>+237</span>
                    <input
                      type="tel" maxLength={9} placeholder="6XXXXXXXX" value={telephone}
                      onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))} autoFocus
                      style={{ flex: 1, padding: "12px 14px", fontSize: 15, fontFamily: "monospace", color: "#1e293b", background: "transparent", border: "none", outline: "none", letterSpacing: 2 }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {[
                    { label: "MTN MoMo",      color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                    { label: "Orange Money",  color: "#ea580c", bg: "#fff7ed", border: "#fdba74" },
                  ].map(op => (
                    <div key={op.label} style={{ flex: 1, padding: "8px", borderRadius: 10, background: op.bg, border: `1.5px solid ${op.border}`, textAlign: "center", fontSize: 11, fontWeight: 700, color: op.color }}>
                      ✓ {op.label}
                    </div>
                  ))}
                </div>

                {/* ✅ Rappel du montant qui sera notifié sur le téléphone */}
                <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: "#92400e", margin: 0, fontWeight: 600, textAlign: "center" }}>
                    📱 Vous recevrez une notification de <strong>{montantTotal} XAF</strong> sur votre téléphone
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setNomElecteur(""); setEmailElecteur(""); setEtape("choix_voix"); }} style={BTN.secondary}>← Retour</button>
                  <button
                    onClick={onPayer}
                    disabled={telephone.length !== 9}
                    style={{ ...BTN.primary, flex: 2, opacity: telephone.length !== 9 ? .5 : 1, cursor: telephone.length !== 9 ? "not-allowed" : "pointer" }}
                  >
                    💳 Payer {montantTotal} XAF
                  </button>
                </div>
                <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 10 }}>🔒 Paiement sécurisé via Mobile Money</p>
              </>
            )}

            {/* ── ATTENTE ── */}
            {etape === "attente" && (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#eef2ff", border: "4px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <div style={{ width: 36, height: 36, border: "4px solid #c7d2fe", borderTop: "4px solid #4f46e5", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", marginBottom: 10 }}>En attente de confirmation</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 14 }}>
                  Confirmez le paiement de <strong style={{ color: "#4f46e5" }}>{montantTotal} XAF</strong> avec votre <strong style={{ color: "#4f46e5" }}>PIN Mobile Money</strong>.
                </p>
                <div style={{ background: "#eef2ff", borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 13, color: "#3730a3", fontWeight: 600, border: "1px solid #c7d2fe" }}>
                  {nbVoix} voix × {fraisUnitaire} XAF = {montantTotal} XAF
                </div>
                {campayRef && (
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 14px", marginBottom: 16, textAlign: "left" }}>
                    <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, margin: "0 0 4px" }}>Référence transaction</p>
                    <p style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", margin: 0, wordBreak: "break-all" }}>{campayRef}</p>
                  </div>
                )}
                {/* ✅ Barre de progression 30 secondes */}
                <TimerBar dureeSecondes={30} active={etape === "attente"} />
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  Le paiement sera annulé automatiquement après 30 secondes sans confirmation.
                </p>
              </div>
            )}

            {/* ── SUCCÈS ── */}
            {etape === "succes" && (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <motion.div
                  initial={{ scale: .5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "4px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}
                >
                  <FiCheckCircle size={36} color="#22c55e" />
                </motion.div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#15803d", marginBottom: 10 }}>Vote enregistré !</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 14 }}>
                  Votre vote pour <strong style={{ color: "#1e293b" }}>{candidat?.prenom} {candidat?.nom}</strong> a été confirmé.
                </p>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 12, marginBottom: 24, fontSize: 13, color: "#15803d", fontWeight: 600 }}>
                  🗳 {nbVoix} voix envoyée{nbVoix > 1 ? "s" : ""} · {montantTotal} XAF débité
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={onFermer} style={BTN.secondary}>Voter à nouveau</button>
                  <button onClick={() => window.location.href = "/dashboard-electeur"} style={BTN.successBtn}>
                    <FiHome size={14} /> Mon tableau de bord
                  </button>
                </div>
              </div>
            )}

            {/* ── ERREUR ── */}
            {etape === "erreur" && (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fef2f2", border: "4px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <FiXCircle size={36} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#dc2626", marginBottom: 10 }}>Paiement échoué</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>{msgErreur || "Le paiement a échoué ou le délai de 30 secondes a expiré."}</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={onFermer} style={BTN.secondary}>Fermer</button>
                  <button onClick={onReessayer} style={BTN.primary}>Réessayer</button>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function VoterPublicPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [errPage,       setErrPage]       = useState("");
  const [candidatSel,   setCandidatSel]   = useState(null);
  const [lightboxImg,   setLightboxImg]   = useState(null);

  const [etape,         setEtape]         = useState("");
  const [nbVoix,        setNbVoix]        = useState(1);
  const [telephone,     setTelephone]     = useState("");
  const [nomElecteur,   setNomElecteur]   = useState("");
  const [emailElecteur, setEmailElecteur] = useState("");
  const [campayRef,     setCampayRef]     = useState(null);
  const [msgErreur,     setMsgErreur]     = useState("");

  useEffect(() => {
    api.get(`/public-elections/${id}/detail`)
      .then(r => setData(r.data))
      .catch(() => setErrPage("Élection introuvable ou non publique."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!data?.election || data.election.statut !== "EN_COURS") return;
    const iv = setInterval(() => {
      api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
    }, 10_000);
    return () => clearInterval(iv);
  }, [data?.election?.statut, id]);

  const handleVoter = c => {
    setCandidatSel(c);
    setNbVoix(1);
    setTelephone("");
    setNomElecteur("");
    setEmailElecteur("");
    setCampayRef(null);
    setMsgErreur("");
    setEtape("choix_voix");
  };

  const handlePayer = async () => {
    if (!/^[0-9]{9}$/.test(telephone)) return;
    setEtape("attente");
    try {
      // ✅ Le montant envoyé au backend = nbVoix × 10 XAF
      const montantTotal = nbVoix * FRAIS_PAR_VOIX;
      const { data: res } = await api.post(`/public-elections/${id}/voter`, {
        candidat_public_id: candidatSel.id,
        telephone:          `237${telephone}`,
        nb_voix:            nbVoix,
        montant_total:      montantTotal, // ✅ envoyé explicitement
        nom_electeur:       nomElecteur   || undefined,
        email_electeur:     emailElecteur || undefined,
      });
      setCampayRef(res.campay_reference);
      // ✅ Polling avec timeout 30 secondes (6 tentatives × 5s)
      lancerPolling(res.campay_reference);
    } catch (err) {
      setMsgErreur(err.response?.data?.message || "Erreur initialisation paiement.");
      setEtape("erreur");
    }
  };

  // ✅ Timeout 30 secondes : 6 tentatives toutes les 5 secondes
  const lancerPolling = reference => {
    let tentatives = 0;
    const MAX_TENTATIVES = 6; // 6 × 5s = 30 secondes
    const iv = setInterval(async () => {
      tentatives++;
      try {
        const { data: s } = await api.get(`/public-elections/vote-statut/${reference}`);
        if (s.status === "SUCCESSFUL") {
          clearInterval(iv);
          setEtape("succes");
          api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
        } else if (s.status === "FAILED" || tentatives >= MAX_TENTATIVES) {
          clearInterval(iv);
          setMsgErreur(
            tentatives >= MAX_TENTATIVES
              ? "Délai de 30 secondes dépassé. Veuillez réessayer."
              : "Paiement refusé ou annulé."
          );
          setEtape("erreur");
        }
      } catch {
        clearInterval(iv);
        setMsgErreur("Erreur lors de la vérification du paiement.");
        setEtape("erreur");
      }
    }, 5000);
  };

  if (loading) return (
    <div style={FULL_CENTER}>
      <div style={SPINNER_DIV} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (errPage) return (
    <div style={{ ...FULL_CENTER, gap: 16 }}>
      <span style={{ fontSize: 48 }}>🗳</span>
      <p style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>{errPage}</p>
      <button onClick={() => navigate("/")} style={BTN.primary}>Retour à l'accueil</button>
    </div>
  );

  const { election, candidats } = data;
  const enCours    = election.statut === "EN_COURS";
  const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);
  const maxVotes   = candidats.reduce((m, c) => Math.max(m, Number(c.nb_votes)), 0);

  return (
    <>
      <style>{BASE_STYLES}</style>
      <div style={{ minHeight: "100vh", fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%)" }}>

        {lightboxImg && (
          <Lightbox src={lightboxImg.src} nom={lightboxImg.nom} onClose={() => setLightboxImg(null)} />
        )}

        <AnimatePresence>
          {etape && (
            <ModalVote
              candidat={candidatSel}
              election={election}
              etape={etape}
              setEtape={setEtape}
              nbVoix={nbVoix}       setNbVoix={setNbVoix}
              telephone={telephone} setTelephone={setTelephone}
              nomElecteur={nomElecteur}     setNomElecteur={setNomElecteur}
              emailElecteur={emailElecteur} setEmailElecteur={setEmailElecteur}
              campayRef={campayRef}
              msgErreur={msgErreur}
              onPayer={handlePayer}
              onFermer={() => { setEtape(""); setMsgErreur(""); }}
              onReessayer={() => { setEtape("choix_voix"); setMsgErreur(""); setTelephone(""); }}
            />
          )}
        </AnimatePresence>

        <PublicNavbar />

        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 80px" }}>

          {/* En-tête élection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "linear-gradient(135deg,#4f46e5,#4338ca)", borderRadius: 24, padding: "28px 32px", marginBottom: 32, boxShadow: "0 12px 48px rgba(79,70,229,0.25)" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  {enCours ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", color: "#15803d", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 999, border: "1px solid #bbf7d0" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "blink 1.2s infinite" }} /> Élection en cours
                    </span>
                  ) : (
                    <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 999 }}>À venir</span>
                  )}
                  <span style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,.9)", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,.3)" }}>🌐 Publique</span>
                </div>
                <h1 style={{ color: "white", fontSize: 22, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 6 }}>{election.titre}</h1>
                {election.description && (
                  <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13, lineHeight: 1.6 }}>{election.description}</p>
                )}
              </div>
              {/* ✅ Affiche toujours 10 XAF/voix */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ color: "rgba(255,255,255,.65)", fontSize: 11, marginBottom: 2 }}>Frais par voix</p>
                <p style={{ color: "white", fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{FRAIS_PAR_VOIX} XAF</p>
                <p style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>MTN / Orange Money</p>
              </div>
            </div>

            <div style={{ display: "flex", background: "rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden", marginTop: 20, border: "1px solid rgba(255,255,255,.15)" }}>
              {[
                { label: "Candidats",   value: candidats.length },
                { label: "Votes total", value: totalVotes },
                { label: "Clôture",     value: formatDate(election.date_fin) },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, borderRight: i < 2 ? "1px solid rgba(255,255,255,.15)" : "none" }}>
                  <span style={{ color: "white", fontWeight: 900, fontSize: 16 }}>{s.value}</span>
                  <span style={{ color: "rgba(255,255,255,.6)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .4 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Grille candidats */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: .8, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <FiUsers size={12} /> Candidats ({candidats.length})
          </p>

          {candidats.length === 0 ? (
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #e0e7ff", padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
              <p style={{ fontWeight: 700, color: "#64748b" }}>Aucun candidat approuvé pour l'instant</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20, marginBottom: 32 }}>
              {candidats.map((c, idx) => (
                <CarteCandidат
                  key={c.id} c={c} idx={idx}
                  totalVotes={totalVotes} maxVotes={maxVotes}
                  enCours={enCours} onVoter={handleVoter} onLightbox={setLightboxImg}
                />
              ))}
            </div>
          )}

          {/* Bandeau dashboard */}
          <div style={{ background: "white", borderRadius: 20, border: "1px solid #e0e7ff", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", boxShadow: "0 2px 12px rgba(79,70,229,0.06)" }}>
            <div>
              <p style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14, margin: "0 0 4px" }}>📊 Suivez votre historique de votes</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Consultez votre tableau de bord avec votre numéro de téléphone.</p>
            </div>
            <a href="/dashboard-electeur" style={BTN.cta}>
              Mon tableau de bord <FiArrowRight size={13} />
            </a>
          </div>
        </main>
      </div>
    </>
  );
}

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const NAV = {
  root:  { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 1px 16px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 10 },
  inner: { maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo:  { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 18, fontWeight: 700, color: "#4f46e5" },
  ghost: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", fontFamily: "inherit", transition: "all .15s" },
};
const FORM = {
  label: { display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: .7, marginBottom: 4 },
  input: { width: "100%", padding: "11px 14px", border: "2px solid #e0e7ff", borderRadius: 12, fontSize: 14, fontFamily: "'Outfit',sans-serif", color: "#1e293b", background: "#fafafa", outline: "none", boxSizing: "border-box" },
};
const BTN = {
  primary:    { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.3)", flex: 1 },
  secondary:  { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "12px 16px", border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", flex: 1 },
  stepper:    { width: 48, height: 48, borderRadius: 14, border: "2px solid #c7d2fe", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", cursor: "pointer" },
  cta:        { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", textDecoration: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, boxShadow: "0 4px 14px rgba(79,70,229,0.3)", whiteSpace: "nowrap" },
  successBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 14px rgba(34,197,94,0.3)", flex: 1 },
};
const FULL_CENTER = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 100%)" };
const SPINNER_DIV = { width: 40, height: 40, border: "4px solid #e0e7ff", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" };
const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
  @keyframes progress{0%{transform:translateX(-100%);}60%{transform:translateX(200%);}100%{transform:translateX(500%);}}
`;



























// // src/pages/public/VoterPublicPage.jsx
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiCheckCircle, FiXCircle, FiArrowLeft, FiArrowRight,
//   FiUsers, FiX, FiMinus, FiPlus, FiHome,
// } from "react-icons/fi";
// import api from "../../services/api";

// // ✅ FIX : API_BASE utilisé partout pour reconstruire les URLs de photos
// const API_BASE   = import.meta.env.VITE_API_URL || "http://localhost:5000";
// const formatDate = d => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// /**
//  * ✅ FIX PRINCIPAL : buildPhotoUrl robuste
//  * - Si null/undefined → null
//  * - Si déjà une URL absolue (http/https) → retourner tel quel
//  * - Si chemin relatif (/uploads/...) → préfixer avec API_BASE
//  */
// function buildPhotoUrl(photoUrl) {
//   if (!photoUrl) return null;
//   if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
//   // S'assure qu'il n'y a pas de double slash
//   const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
//   const path = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
//   return `${base}${path}`;
// }

// /* ─── Navbar commune ─────────────────────────────────────────────────────── */
// function PublicNavbar() {
//   const navigate = useNavigate();
//   return (
//     <nav style={NAV.root}>
//       <div style={NAV.inner}>
//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <button onClick={() => navigate(-1)} style={NAV.ghost}>
//             <FiArrowLeft size={14} /> Retour
//           </button>
//           <div style={{ width: 1, height: 20, background: "#c7d2fe" }} />
//           <a href="/" style={NAV.logo}>🗳 <strong>eVote</strong></a>
//         </div>
//         <a href="/dashboard-electeur" style={NAV.ghost}>
//           📊 Mon tableau de bord
//         </a>
//       </div>
//     </nav>
//   );
// }

// /* ─── Avatar ─────────────────────────────────────────────────────────────── */
// function Avatar({ photoUrl, prenom, nom, size = 52 }) {
//   const [imgError, setImgError] = useState(false);
//   const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
//   // ✅ FIX : utilise buildPhotoUrl pour reconstruire correctement l'URL
//   const url = buildPhotoUrl(photoUrl);

//   if (url && !imgError) {
//     return (
//       <div style={{ width: size, height: size, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#eef2ff" }}>
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
//     <div style={{ width: size, height: size, borderRadius: 12, flexShrink: 0, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
//       <span style={{ color: "#6366f1", fontWeight: 600, fontSize: size * 0.3 }}>{initials}</span>
//     </div>
//   );
// }

// /* ─── Lightbox ───────────────────────────────────────────────────────────── */
// function Lightbox({ src, nom, onClose }) {
//   useEffect(() => {
//     const h = e => { if (e.key === "Escape") onClose(); };
//     window.addEventListener("keydown", h);
//     return () => window.removeEventListener("keydown", h);
//   }, [onClose]);

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//         onClick={onClose}
//         style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
//       >
//         <motion.div
//           initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
//           transition={{ type: "spring", stiffness: 300, damping: 25 }}
//           onClick={e => e.stopPropagation()}
//           style={{ position: "relative" }}
//         >
//           <img
//             src={src} alt={nom}
//             style={{ maxHeight: "80vh", maxWidth: "90vw", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.5)", objectFit: "contain" }}
//           />
//           <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top,rgba(0,0,0,.7),transparent)", borderRadius: "0 0 16px 16px", padding: "16px" }}>
//             <p style={{ color: "white", fontWeight: 700, textAlign: "center" }}>{nom}</p>
//           </div>
//           <button
//             onClick={onClose}
//             style={{ position: "absolute", top: -12, right: -12, width: 36, height: 36, borderRadius: "50%", background: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
//           >
//             <FiX size={16} color="#374151" />
//           </button>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// /* ─── Carte candidat ─────────────────────────────────────────────────────── */
// function CarteCandidат({ c, idx, totalVotes, maxVotes, enCours, onVoter, onLightbox }) {
//   const [imgError, setImgError] = useState(false);
//   const votes    = Number(c.nb_votes);
//   const pct      = totalVotes > 0 ? Math.round(votes / totalVotes * 100) : 0;
//   const isLeader = votes > 0 && votes === maxVotes;
//   const medals   = ["🥇", "🥈", "🥉"];
//   // ✅ FIX : utilise buildPhotoUrl pour reconstruire correctement l'URL
//   const photoUrl = buildPhotoUrl(c.photo_url);
//   const initials = `${c.prenom?.[0] ?? ""}${c.nom?.[0] ?? ""}`.toUpperCase();

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
//       style={{
//         position: "relative", background: "white", borderRadius: 24, overflow: "hidden",
//         boxShadow: isLeader ? "0 8px 32px rgba(99,102,241,0.18)" : "0 2px 12px rgba(0,0,0,0.06)",
//         border: isLeader ? "2px solid #a5b4fc" : "1px solid #f0f0f0",
//         display: "flex", flexDirection: "column", transition: "all .3s",
//       }}
//       whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(79,70,229,0.15)" }}
//     >
//       {/* Photo */}
//       {/* ✅ FIX : un seul div avec onClick, pas de nesting dupliqué */}
//       <div
//         style={{ position: "relative", width: "100%", height: 240, overflow: "hidden", cursor: photoUrl && !imgError ? "zoom-in" : "default" }}
//         onClick={() => photoUrl && !imgError && onLightbox({ src: photoUrl, nom: `${c.prenom} ${c.nom}` })}
//       >
//         {photoUrl && !imgError ? (
//           <img
//             src={photoUrl}
//             alt={`${c.prenom} ${c.nom}`}
//             style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transition: "transform .5s" }}
//             onError={() => setImgError(true)}
//             onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
//             onMouseLeave={e => e.target.style.transform = "scale(1)"}
//           />
//         ) : (
//           <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#eef2ff,#c7d2fe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <span style={{ fontSize: 64, fontWeight: 900, color: "#a5b4fc" }}>{initials}</span>
//           </div>
//         )}
//         <div style={{ position: "absolute", inset: "0 0 0 0", background: "linear-gradient(to top,rgba(0,0,0,0.80) 0%,rgba(0,0,0,0.20) 45%,transparent 70%)" }} />

//         {/* Rang */}
//         <div style={{
//           position: "absolute", top: 12, left: 12, width: 36, height: 36, borderRadius: 10,
//           background: idx === 0 ? "rgba(245,158,11,0.95)" : idx === 1 ? "rgba(148,163,184,0.95)" : idx === 2 ? "rgba(248,113,113,0.95)" : "rgba(255,255,255,0.8)",
//           display: "flex", alignItems: "center", justifyContent: "center",
//           fontSize: idx < 3 ? 18 : 13, fontWeight: 800,
//           color: idx >= 3 ? "#64748b" : "white",
//           backdropFilter: "blur(4px)",
//         }}>
//           {idx < 3 ? medals[idx] : `#${idx + 1}`}
//         </div>

//         {/* Badge leader */}
//         {isLeader && (
//           <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 4, background: "rgba(99,102,241,0.9)", color: "white", fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 10, backdropFilter: "blur(4px)" }}>
//             🏆 En tête
//           </div>
//         )}

//         {/* Nom overlay */}
//         <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 14px 12px" }}>
//           <p style={{ color: "white", fontWeight: 900, fontSize: 15, lineHeight: 1.2, margin: "0 0 4px", textShadow: "0 1px 4px rgba(0,0,0,.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//             {c.prenom} {c.nom}
//           </p>
//           {c.parti ? (
//             <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.25)", padding: "2px 10px", borderRadius: 999 }}>
//               🏛 {c.parti}
//             </span>
//           ) : (
//             <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>Candidat indépendant</span>
//           )}
//         </div>
//       </div>

//       {/* Bas de carte */}
//       <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
//         {c.bio && (
//           <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.bio}</p>
//         )}
//         <div>
//           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
//             <span style={{ fontSize: 12, color: "#64748b" }}>
//               <strong style={{ color: "#4f46e5" }}>{votes}</strong> voix
//             </span>
//             {totalVotes > 0 && (
//               <span style={{ fontSize: 12, fontWeight: 900, color: isLeader ? "#4f46e5" : "#d1d5db" }}>{pct}%</span>
//             )}
//           </div>
//           <div style={{ height: 6, background: "#e0e7ff", borderRadius: 999, overflow: "hidden" }}>
//             <motion.div
//               initial={{ width: 0 }} animate={{ width: `${pct}%` }}
//               transition={{ duration: 1, ease: "easeOut", delay: idx * 0.07 + 0.2 }}
//               style={{ height: "100%", borderRadius: 999, background: isLeader ? "linear-gradient(90deg,#4f46e5,#818cf8)" : "#c7d2fe" }}
//             />
//           </div>
//         </div>
//         {enCours && (
//           <button
//             onClick={() => onVoter(c)}
//             style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", border: "none", borderRadius: 14, fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(79,70,229,0.3)", transition: "all .2s", fontFamily: "'Outfit',sans-serif" }}
//           >
//             🗳 Voter
//           </button>
//         )}
//       </div>
//     </motion.div>
//   );
// }

// /* ─── Modal vote (version propre et unique) ──────────────────────────────── */
// function ModalVote({
//   candidat, election, etape, setEtape,
//   nbVoix, setNbVoix,
//   telephone, setTelephone,
//   nomElecteur, setNomElecteur,
//   emailElecteur, setEmailElecteur,
//   campayRef, msgErreur,
//   onPayer, onFermer, onReessayer,
// }) {
//   if (!["choix_voix", "saisie", "attente", "succes", "erreur"].includes(etape)) return null;

//   const fraisUnitaire = election?.frais_vote_xaf || 100;
//   const montantTotal  = fraisUnitaire * nbVoix;

//   const barBg = etape === "succes" ? "linear-gradient(90deg,#22c55e,#16a34a)"
//               : etape === "erreur" ? "linear-gradient(90deg,#ef4444,#dc2626)"
//               : "linear-gradient(90deg,#6366f1,#4f46e5)";

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//         style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(15,23,42,0.75)", backdropFilter: "blur(8px)" }}
//       >
//         <motion.div
//           key={etape}
//           initial={{ opacity: 0, scale: .92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
//           transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }}
//           style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 440, boxShadow: "0 32px 100px rgba(0,0,0,0.28)", overflow: "hidden" }}
//         >
//           <div style={{ height: 6, background: barBg }} />
//           <div style={{ padding: 32 }}>

//             {/* ── CHOIX VOIX ── */}
//             {etape === "choix_voix" && (
//               <>
//                 <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
//                   {/* ✅ FIX : Avatar reçoit photo_url brut, buildPhotoUrl est appelé à l'intérieur */}
//                   <Avatar photoUrl={candidat?.photo_url} prenom={candidat?.prenom} nom={candidat?.nom} size={80} />
//                   <h3 style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", textAlign: "center", marginTop: 12 }}>
//                     Voter pour <span style={{ color: "#4f46e5" }}>{candidat?.prenom} {candidat?.nom}</span>
//                   </h3>
//                   <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
//                     Tarif : <strong style={{ color: "#4f46e5" }}>{fraisUnitaire} XAF</strong> par voix
//                   </p>
//                 </div>

//                 <label style={FORM.label}>Nombre de voix souhaité</label>
//                 <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "12px 0 16px" }}>
//                   <button onClick={() => setNbVoix(v => Math.max(1, v - 1))} style={BTN.stepper}><FiMinus size={18} /></button>
//                   <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
//                     <input
//                       type="number" min={1} max={100} value={nbVoix}
//                       onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1 && v <= 100) setNbVoix(v); }}
//                       style={{ width: 96, textAlign: "center", fontSize: 28, fontWeight: 900, color: "#4f46e5", border: "2px solid #c7d2fe", borderRadius: 16, padding: "10px 8px", outline: "none", background: "#eef2ff", fontFamily: "'Outfit',sans-serif" }}
//                     />
//                     <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>voix</span>
//                   </div>
//                   <button onClick={() => setNbVoix(v => Math.min(100, v + 1))} style={BTN.stepper}><FiPlus size={18} /></button>
//                 </div>

//                 <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
//                   {[1, 2, 3, 5, 10].map(n => (
//                     <button key={n} onClick={() => setNbVoix(n)} style={{
//                       padding: "6px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s", fontFamily: "'Outfit',sans-serif",
//                       background: nbVoix === n ? "#4f46e5" : "white", color: nbVoix === n ? "white" : "#4f46e5",
//                       border: `2px solid ${nbVoix === n ? "#4f46e5" : "#c7d2fe"}`,
//                     }}>{n}</button>
//                   ))}
//                 </div>

//                 <div style={{ background: "linear-gradient(135deg,#eef2ff,#e0e7ff)", borderRadius: 16, padding: 16, marginBottom: 20, border: "1px solid #c7d2fe" }}>
//                   {[["Prix unitaire", `${fraisUnitaire} XAF`], ["Nombre de voix", `× ${nbVoix}`]].map(([l, v]) => (
//                     <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
//                       <span style={{ fontSize: 13, color: "#4f46e5" }}>{l}</span>
//                       <span style={{ fontSize: 13, fontWeight: 700, color: "#3730a3" }}>{v}</span>
//                     </div>
//                   ))}
//                   <div style={{ height: 1, background: "#c7d2fe", margin: "10px 0" }} />
//                   <div style={{ display: "flex", justifyContent: "space-between" }}>
//                     <span style={{ fontWeight: 900, color: "#1e1b4b" }}>Total à payer</span>
//                     <motion.span
//                       key={montantTotal} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
//                       style={{ fontSize: 20, fontWeight: 900, color: "#4f46e5" }}
//                     >{montantTotal} XAF</motion.span>
//                   </div>
//                 </div>

//                 <div style={{ display: "flex", gap: 10 }}>
//                   <button onClick={onFermer} style={BTN.secondary}>← Retour</button>
//                   {/* ✅ FIX : setEtape("saisie") proprement, sans window.dispatchEvent ni double onClick */}
//                   <button onClick={() => setEtape("saisie")} style={{ ...BTN.primary, flex: 2 }}>
//                     Continuer → {montantTotal} XAF
//                   </button>
//                 </div>
//               </>
//             )}

//             {/* ── SAISIE ── */}
//             {etape === "saisie" && (
//               <>
//                 <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
//                   <Avatar photoUrl={candidat?.photo_url} prenom={candidat?.prenom} nom={candidat?.nom} size={64} />
//                   <h3 style={{ fontSize: 15, fontWeight: 900, color: "#1e1b4b", textAlign: "center", marginTop: 10 }}>{candidat?.prenom} {candidat?.nom}</h3>
//                   <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, background: "#eef2ff", borderRadius: 10, padding: "8px 14px", border: "1px solid #c7d2fe" }}>
//                     <span style={{ fontSize: 13, color: "#4f46e5" }}>{nbVoix} voix × {fraisUnitaire} XAF =</span>
//                     <span style={{ fontSize: 15, fontWeight: 900, color: "#3730a3" }}>{montantTotal} XAF</span>
//                   </div>
//                 </div>

//                 {[
//                   { label: "Votre nom", placeholder: "Ex: Kengne", value: nomElecteur, setter: setNomElecteur, type: "text" },
//                   { label: "Email", placeholder: "kengne@email.com", value: emailElecteur, setter: setEmailElecteur, type: "email" },
//                 ].map(({ label, placeholder, value, setter, type }) => (
//                   <div key={label} style={{ marginBottom: 14 }}>
//                     <label style={{ ...FORM.label, marginBottom: 6 }}>
//                       {label} <span style={{ color: "#9ca3af", textTransform: "none", fontSize: 10 }}>(optionnel)</span>
//                     </label>
//                     <input type={type} placeholder={placeholder} value={value} onChange={e => setter(e.target.value)}
//                       style={{ ...FORM.input, marginBottom: 0 }} />
//                   </div>
//                 ))}

//                 <div style={{ marginBottom: 20 }}>
//                   <label style={{ ...FORM.label, marginBottom: 6 }}>Numéro MTN / Orange Money *</label>
//                   <div style={{ display: "flex", border: "2px solid #c7d2fe", borderRadius: 12, overflow: "hidden" }}>
//                     <span style={{ padding: "12px 14px", background: "#eef2ff", color: "#4f46e5", fontWeight: 800, fontSize: 14, borderRight: "2px solid #c7d2fe" }}>+237</span>
//                     <input
//                       type="tel" maxLength={9} placeholder="6XXXXXXXX" value={telephone}
//                       onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))} autoFocus
//                       style={{ flex: 1, padding: "12px 14px", fontSize: 15, fontFamily: "monospace", color: "#1e293b", background: "transparent", border: "none", outline: "none", letterSpacing: 2 }}
//                     />
//                   </div>
//                 </div>

//                 <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
//                   {[
//                     { label: "MTN MoMo",      color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
//                     { label: "Orange Money",  color: "#ea580c", bg: "#fff7ed", border: "#fdba74" },
//                   ].map(op => (
//                     <div key={op.label} style={{ flex: 1, padding: "8px", borderRadius: 10, background: op.bg, border: `1.5px solid ${op.border}`, textAlign: "center", fontSize: 11, fontWeight: 700, color: op.color }}>
//                       ✓ {op.label}
//                     </div>
//                   ))}
//                 </div>

//                 <div style={{ display: "flex", gap: 10 }}>
//                   {/* ✅ FIX : retour propre vers choix_voix */}
//                   <button onClick={() => { setNomElecteur(""); setEmailElecteur(""); setEtape("choix_voix"); }} style={BTN.secondary}>← Retour</button>
//                   <button
//                     onClick={onPayer}
//                     disabled={telephone.length !== 9}
//                     style={{ ...BTN.primary, flex: 2, opacity: telephone.length !== 9 ? .5 : 1, cursor: telephone.length !== 9 ? "not-allowed" : "pointer" }}
//                   >
//                     💳 Payer {montantTotal} XAF
//                   </button>
//                 </div>
//                 <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 10 }}>🔒 Paiement sécurisé via Mobile Money</p>
//               </>
//             )}

//             {/* ── ATTENTE ── */}
//             {etape === "attente" && (
//               <div style={{ textAlign: "center", padding: "8px 0" }}>
//                 <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#eef2ff", border: "4px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
//                   <div style={{ width: 36, height: 36, border: "4px solid #c7d2fe", borderTop: "4px solid #4f46e5", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
//                 </div>
//                 <h3 style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", marginBottom: 10 }}>En attente de confirmation</h3>
//                 <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 14 }}>
//                   Confirmez le paiement de <strong style={{ color: "#4f46e5" }}>{montantTotal} XAF</strong> avec votre <strong style={{ color: "#4f46e5" }}>PIN Mobile Money</strong>.
//                 </p>
//                 <div style={{ background: "#eef2ff", borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 13, color: "#3730a3", fontWeight: 600, border: "1px solid #c7d2fe" }}>
//                   {nbVoix} voix × {fraisUnitaire} XAF = {montantTotal} XAF
//                 </div>
//                 {campayRef && (
//                   <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 14px", marginBottom: 16, textAlign: "left" }}>
//                     <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, margin: "0 0 4px" }}>Référence transaction</p>
//                     <p style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", margin: 0, wordBreak: "break-all" }}>{campayRef}</p>
//                   </div>
//                 )}
//                 <div style={{ height: 6, background: "#e0e7ff", borderRadius: 999, overflow: "hidden" }}>
//                   <div style={{ height: "100%", width: "50%", background: "linear-gradient(90deg,#4f46e5,#818cf8)", borderRadius: 999, animation: "progress 1.8s ease-in-out infinite" }} />
//                 </div>
//               </div>
//             )}

//             {/* ── SUCCÈS ── */}
//             {etape === "succes" && (
//               <div style={{ textAlign: "center", padding: "8px 0" }}>
//                 <motion.div
//                   initial={{ scale: .5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
//                   transition={{ type: "spring", stiffness: 300, damping: 20 }}
//                   style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "4px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}
//                 >
//                   <FiCheckCircle size={36} color="#22c55e" />
//                 </motion.div>
//                 <h3 style={{ fontSize: 20, fontWeight: 900, color: "#15803d", marginBottom: 10 }}>Vote enregistré !</h3>
//                 <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 14 }}>
//                   Votre vote pour <strong style={{ color: "#1e293b" }}>{candidat?.prenom} {candidat?.nom}</strong> a été confirmé.
//                 </p>
//                 <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 12, marginBottom: 24, fontSize: 13, color: "#15803d", fontWeight: 600 }}>
//                   🗳 {nbVoix} voix envoyée{nbVoix > 1 ? "s" : ""} · {montantTotal} XAF débité
//                 </div>
//                 <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
//                   <button onClick={onFermer} style={BTN.secondary}>Voter à nouveau</button>
//                   <button onClick={() => window.location.href = "/dashboard-electeur"} style={BTN.successBtn}>
//                     <FiHome size={14} /> Mon tableau de bord
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* ── ERREUR ── */}
//             {etape === "erreur" && (
//               <div style={{ textAlign: "center", padding: "8px 0" }}>
//                 <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fef2f2", border: "4px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
//                   <FiXCircle size={36} color="#ef4444" />
//                 </div>
//                 <h3 style={{ fontSize: 20, fontWeight: 900, color: "#dc2626", marginBottom: 10 }}>Paiement échoué</h3>
//                 <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>{msgErreur || "Le paiement a échoué ou le délai a expiré."}</p>
//                 <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
//                   <button onClick={onFermer} style={BTN.secondary}>Fermer</button>
//                   <button onClick={onReessayer} style={BTN.primary}>Réessayer</button>
//                 </div>
//               </div>
//             )}

//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// /* ─── Page principale ────────────────────────────────────────────────────── */
// export default function VoterPublicPage() {
//   const { id }   = useParams();
//   const navigate = useNavigate();

//   const [data,          setData]          = useState(null);
//   const [loading,       setLoading]       = useState(true);
//   const [errPage,       setErrPage]       = useState("");
//   const [candidatSel,   setCandidatSel]   = useState(null);
//   const [lightboxImg,   setLightboxImg]   = useState(null);

//   const [etape,         setEtape]         = useState("");
//   const [nbVoix,        setNbVoix]        = useState(1);
//   const [telephone,     setTelephone]     = useState("");
//   const [nomElecteur,   setNomElecteur]   = useState("");
//   const [emailElecteur, setEmailElecteur] = useState("");
//   const [campayRef,     setCampayRef]     = useState(null);
//   const [msgErreur,     setMsgErreur]     = useState("");

//   useEffect(() => {
//     api.get(`/public-elections/${id}/detail`)
//       .then(r => setData(r.data))
//       .catch(() => setErrPage("Élection introuvable ou non publique."))
//       .finally(() => setLoading(false));
//   }, [id]);

//   // Rafraîchissement auto si élection en cours
//   useEffect(() => {
//     if (!data?.election || data.election.statut !== "EN_COURS") return;
//     const iv = setInterval(() => {
//       api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//     }, 10_000);
//     return () => clearInterval(iv);
//   }, [data?.election?.statut, id]);

//   const handleVoter = c => {
//     setCandidatSel(c);
//     setNbVoix(1);
//     setTelephone("");
//     setNomElecteur("");
//     setEmailElecteur("");
//     setCampayRef(null);
//     setMsgErreur("");
//     setEtape("choix_voix");
//   };

//   const handlePayer = async () => {
//     if (!/^[0-9]{9}$/.test(telephone)) return;
//     setEtape("attente");
//     try {
//       const { data: res } = await api.post(`/public-elections/${id}/voter`, {
//         candidat_public_id: candidatSel.id,
//         telephone:          `237${telephone}`,
//         nb_voix:            nbVoix,
//         nom_electeur:       nomElecteur   || undefined,
//         email_electeur:     emailElecteur || undefined,
//       });
//       setCampayRef(res.campay_reference);
//       lancerPolling(res.campay_reference);
//     } catch (err) {
//       setMsgErreur(err.response?.data?.message || "Erreur initialisation paiement.");
//       setEtape("erreur");
//     }
//   };

//   const lancerPolling = reference => {
//     let tentatives = 0;
//     const iv = setInterval(async () => {
//       tentatives++;
//       try {
//         const { data: s } = await api.get(`/public-elections/vote-statut/${reference}`);
//         if (s.status === "SUCCESSFUL") {
//           clearInterval(iv);
//           setEtape("succes");
//           api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//         } else if (s.status === "FAILED" || tentatives >= 24) {
//           clearInterval(iv);
//           setMsgErreur("Paiement échoué ou délai de 120 secondes dépassé.");
//           setEtape("erreur");
//         }
//       } catch {
//         clearInterval(iv);
//         setMsgErreur("Erreur lors de la vérification.");
//         setEtape("erreur");
//       }
//     }, 5000);
//   };

//   if (loading) return (
//     <div style={FULL_CENTER}>
//       <div style={SPINNER_DIV} />
//       <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
//     </div>
//   );

//   if (errPage) return (
//     <div style={{ ...FULL_CENTER, gap: 16 }}>
//       <span style={{ fontSize: 48 }}>🗳</span>
//       <p style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>{errPage}</p>
//       <button onClick={() => navigate("/")} style={BTN.primary}>Retour à l'accueil</button>
//     </div>
//   );

//   const { election, candidats } = data;
//   const enCours    = election.statut === "EN_COURS";
//   const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);
//   const maxVotes   = candidats.reduce((m, c) => Math.max(m, Number(c.nb_votes)), 0);

//   return (
//     <>
//       <style>{BASE_STYLES}</style>
//       <div style={{ minHeight: "100vh", fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%)" }}>

//         {lightboxImg && (
//           <Lightbox src={lightboxImg.src} nom={lightboxImg.nom} onClose={() => setLightboxImg(null)} />
//         )}

//         <AnimatePresence>
//           {etape && (
//             <ModalVote
//               candidat={candidatSel}
//               election={election}
//               etape={etape}
//               setEtape={setEtape}
//               nbVoix={nbVoix}       setNbVoix={setNbVoix}
//               telephone={telephone} setTelephone={setTelephone}
//               nomElecteur={nomElecteur}     setNomElecteur={setNomElecteur}
//               emailElecteur={emailElecteur} setEmailElecteur={setEmailElecteur}
//               campayRef={campayRef}
//               msgErreur={msgErreur}
//               onPayer={handlePayer}
//               onFermer={() => { setEtape(""); setMsgErreur(""); }}
//               onReessayer={() => { setEtape("choix_voix"); setMsgErreur(""); setTelephone(""); }}
//             />
//           )}
//         </AnimatePresence>

//         <PublicNavbar />

//         <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 80px" }}>

//           {/* En-tête élection */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
//             style={{ background: "linear-gradient(135deg,#4f46e5,#4338ca)", borderRadius: 24, padding: "28px 32px", marginBottom: 32, boxShadow: "0 12px 48px rgba(79,70,229,0.25)" }}
//           >
//             <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
//               <div style={{ flex: 1 }}>
//                 <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
//                   {enCours ? (
//                     <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", color: "#15803d", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 999, border: "1px solid #bbf7d0" }}>
//                       <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "blink 1.2s infinite" }} /> Élection en cours
//                     </span>
//                   ) : (
//                     <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 999 }}>À venir</span>
//                   )}
//                   <span style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,.9)", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,.3)" }}>🌐 Publique</span>
//                 </div>
//                 <h1 style={{ color: "white", fontSize: 22, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 6 }}>{election.titre}</h1>
//                 {election.description && (
//                   <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13, lineHeight: 1.6 }}>{election.description}</p>
//                 )}
//               </div>
//               <div style={{ textAlign: "right", flexShrink: 0 }}>
//                 <p style={{ color: "rgba(255,255,255,.65)", fontSize: 11, marginBottom: 2 }}>Frais par voix</p>
//                 <p style={{ color: "white", fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{election.frais_vote_xaf || 100} XAF</p>
//                 <p style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>MTN / Orange Money</p>
//               </div>
//             </div>

//             <div style={{ display: "flex", background: "rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden", marginTop: 20, border: "1px solid rgba(255,255,255,.15)" }}>
//               {[
//                 { label: "Candidats",   value: candidats.length },
//                 { label: "Votes total", value: totalVotes },
//                 { label: "Clôture",     value: formatDate(election.date_fin) },
//               ].map((s, i) => (
//                 <div key={i} style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, borderRight: i < 2 ? "1px solid rgba(255,255,255,.15)" : "none" }}>
//                   <span style={{ color: "white", fontWeight: 900, fontSize: 16 }}>{s.value}</span>
//                   <span style={{ color: "rgba(255,255,255,.6)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .4 }}>{s.label}</span>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           {/* Grille candidats */}
//           <p style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: .8, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
//             <FiUsers size={12} /> Candidats ({candidats.length})
//           </p>

//           {candidats.length === 0 ? (
//             <div style={{ background: "white", borderRadius: 20, border: "1px solid #e0e7ff", padding: "60px 24px", textAlign: "center" }}>
//               <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
//               <p style={{ fontWeight: 700, color: "#64748b" }}>Aucun candidat approuvé pour l'instant</p>
//             </div>
//           ) : (
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20, marginBottom: 32 }}>
//               {candidats.map((c, idx) => (
//                 <CarteCandidат
//                   key={c.id} c={c} idx={idx}
//                   totalVotes={totalVotes} maxVotes={maxVotes}
//                   enCours={enCours} onVoter={handleVoter} onLightbox={setLightboxImg}
//                 />
//               ))}
//             </div>
//           )}

//           {/* Bandeau dashboard */}
//           <div style={{ background: "white", borderRadius: 20, border: "1px solid #e0e7ff", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", boxShadow: "0 2px 12px rgba(79,70,229,0.06)" }}>
//             <div>
//               <p style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14, margin: "0 0 4px" }}>📊 Suivez votre historique de votes</p>
//               <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Consultez votre tableau de bord avec votre numéro de téléphone.</p>
//             </div>
//             <a href="/dashboard-electeur" style={BTN.cta}>
//               Mon tableau de bord <FiArrowRight size={13} />
//             </a>
//           </div>
//         </main>
//       </div>
//     </>
//   );
// }

// /* ─── Design tokens ──────────────────────────────────────────────────────── */
// const NAV = {
//   root:  { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 1px 16px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 10 },
//   inner: { maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" },
//   logo:  { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 18, fontWeight: 700, color: "#4f46e5" },
//   ghost: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", fontFamily: "inherit", transition: "all .15s" },
// };
// const FORM = {
//   label: { display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: .7, marginBottom: 4 },
//   input: { width: "100%", padding: "11px 14px", border: "2px solid #e0e7ff", borderRadius: 12, fontSize: 14, fontFamily: "'Outfit',sans-serif", color: "#1e293b", background: "#fafafa", outline: "none", boxSizing: "border-box" },
// };
// const BTN = {
//   primary:    { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.3)", flex: 1 },
//   secondary:  { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "12px 16px", border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", flex: 1 },
//   stepper:    { width: 48, height: 48, borderRadius: 14, border: "2px solid #c7d2fe", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", cursor: "pointer" },
//   cta:        { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", textDecoration: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, boxShadow: "0 4px 14px rgba(79,70,229,0.3)", whiteSpace: "nowrap" },
//   successBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 14px rgba(34,197,94,0.3)", flex: 1 },
// };
// const FULL_CENTER = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 100%)" };
// const SPINNER_DIV = { width: 40, height: 40, border: "4px solid #e0e7ff", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" };
// const BASE_STYLES = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   @keyframes spin{to{transform:rotate(360deg);}}
//   @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
//   @keyframes progress{0%{transform:translateX(-100%);}60%{transform:translateX(200%);}100%{transform:translateX(500%);}}
// `;


