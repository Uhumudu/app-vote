// src/pages/admin/adminelection/RegisterElection.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiMail, FiLock, FiCalendar, FiList,
  FiAlignLeft, FiCheckCircle, FiArrowRight, FiType,
  FiClock, FiInfo, FiUsers, FiHome, FiPlusCircle,
  FiLogIn, FiSmartphone, FiLoader, FiXCircle,
} from "react-icons/fi";
import api from "../../../services/api";
import Election from './elct.webp';

// ─── Constantes ───────────────────────────────────────────────────────────────
const DUREE_OPTIONS = [
  { value: 30,    label: "30 minutes" },
  { value: 60,    label: "1 heure" },
  { value: 120,   label: "2 heures" },
  { value: 360,   label: "6 heures" },
  { value: 720,   label: "12 heures" },
  { value: 1440,  label: "24 heures (1 jour)" },
  { value: 2880,  label: "48 heures (2 jours)" },
  { value: 4320,  label: "3 jours" },
  { value: 10080, label: "7 jours" },
];

const FRAIS_ELECTION = 25; // XAF

// ─── Helper dates ─────────────────────────────────────────────────────────────
const toLocalMySQL = (date) => {
  const pad = n => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
};

// ─── Modal Paiement CamPay ────────────────────────────────────────────────────
function ModalPaiement({ etape, telephone, setTelephone, msgPaiement, campayRef, onPayer, onAnnuler, onReessayer }) {
  if (!["telephone", "attente", "succes", "erreur"].includes(etape)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(15, 23, 42, 0.70)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000, padding: "16px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "#fff", borderRadius: "24px",
            padding: "40px 36px", width: "100%", maxWidth: "440px",
            boxShadow: "0 32px 100px rgba(0,0,0,0.28)",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Barre colorée en haut */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "5px",
            background: etape === "succes"
              ? "linear-gradient(90deg,#22c55e,#16a34a)"
              : etape === "erreur"
              ? "linear-gradient(90deg,#ef4444,#dc2626)"
              : "linear-gradient(90deg,#6366f1,#4f46e5,#818cf8)",
          }} />

          {/* ── Saisie téléphone ── */}
          {etape === "telephone" && (
            <>
              <div className="text-center mb-6">
                <div style={{
                  width: "68px", height: "68px", borderRadius: "20px",
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 18px",
                  boxShadow: "0 10px 30px rgba(99,102,241,0.40)",
                }}>
                  <FiSmartphone size={30} color="white" />
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#1e1b4b", margin: "0 0 8px" }}>
                  Paiement des frais de création
                </h3>
                <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                  Des frais de{" "}
                  <strong style={{ color: "#6366f1", fontSize: "15px" }}>{FRAIS_ELECTION} XAF</strong>{" "}
                  sont requis pour soumettre votre élection.
                </p>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{
                  display: "block", fontSize: "11px", fontWeight: 700,
                  color: "#64748b", textTransform: "uppercase",
                  letterSpacing: ".7px", marginBottom: "8px",
                }}>
                  Votre numéro MTN / Orange Money
                </label>
                <div style={{
                  display: "flex", border: "2px solid #e0e7ff",
                  borderRadius: "14px", overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(99,102,241,0.08)",
                  transition: "border-color .2s",
                }}>
                  <span style={{
                    padding: "13px 16px", background: "#eef2ff",
                    color: "#6366f1", fontWeight: 800, fontSize: "15px",
                    borderRight: "2px solid #e0e7ff", whiteSpace: "nowrap",
                    letterSpacing: ".5px",
                  }}>
                    +237
                  </span>
                  <input
                    type="tel" maxLength={9} placeholder="6XXXXXXXX"
                    value={telephone}
                    onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                    style={{
                      flex: 1, border: "none", outline: "none",
                      padding: "13px 16px", fontSize: "16px",
                      fontFamily: "inherit", color: "#1e293b",
                      background: "transparent", letterSpacing: "2px",
                    }}
                  />
                </div>
              </div>

              {/* Opérateurs */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                {[
                  { label: "MTN MoMo", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                  { label: "Orange Money", color: "#ea580c", bg: "#fff7ed", border: "#fdba74" },
                ].map(op => (
                  <div key={op.label} style={{
                    flex: 1, padding: "9px 10px", borderRadius: "10px",
                    background: op.bg, border: `1.5px solid ${op.border}`,
                    textAlign: "center", fontSize: "12px",
                    fontWeight: 700, color: op.color,
                  }}>
                    ✓ {op.label}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={onAnnuler}
                  style={{
                    flex: 1, padding: "13px", borderRadius: "14px",
                    border: "1.5px solid #e2e8f0", background: "#fff",
                    color: "#64748b", fontSize: "14px", fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
                  }}
                >
                  ← Retour
                </button>
                <button
                  onClick={onPayer}
                  disabled={telephone.length !== 9}
                  style={{
                    flex: 2, padding: "13px", borderRadius: "14px",
                    border: "none",
                    background: telephone.length === 9
                      ? "linear-gradient(135deg,#6366f1,#4f46e5)"
                      : "#e2e8f0",
                    color: telephone.length === 9 ? "#fff" : "#94a3b8",
                    fontSize: "14px", fontWeight: 800,
                    cursor: telephone.length === 9 ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    boxShadow: telephone.length === 9 ? "0 6px 18px rgba(99,102,241,0.40)" : "none",
                    transition: "all .25s",
                  }}
                >
                  💳 Payer {FRAIS_ELECTION} XAF
                </button>
              </div>

              <p style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", marginTop: "12px" }}>
                🔒 Paiement sécurisé via CamPay
              </p>
            </>
          )}

          {/* ── Attente ── */}
          {etape === "attente" && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "#eef2ff", border: "3px solid #c7d2fe",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 22px",
              }}>
                <FiLoader size={34} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#1e1b4b", marginBottom: "12px" }}>
                En attente de votre confirmation
              </h3>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7, marginBottom: "20px" }}>
                Une notification Mobile Money a été envoyée.<br />
                <strong style={{ color: "#6366f1" }}>Entrez votre PIN</strong> sur votre téléphone pour valider.
              </p>
              {campayRef && (
                <div style={{
                  background: "#f8fafc", borderRadius: "12px",
                  padding: "12px 16px", border: "1px solid #e2e8f0",
                  marginBottom: "20px", wordBreak: "break-all",
                }}>
                  <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", margin: "0 0 4px" }}>
                    Référence transaction
                  </p>
                  <p style={{ fontSize: "12px", color: "#475569", fontWeight: 600, margin: 0 }}>
                    {campayRef}
                  </p>
                </div>
              )}
              <div style={{ height: "5px", background: "#e0e7ff", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: "45%",
                  background: "linear-gradient(90deg,#6366f1,#818cf8)",
                  borderRadius: "4px",
                  animation: "progress 1.8s ease-in-out infinite",
                }} />
              </div>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "10px" }}>
                Vérification automatique… (60 secondes max)
              </p>
            </div>
          )}

          {/* ── Succès ── */}
          {etape === "succes" && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  background: "#f0fdf4", border: "3px solid #bbf7d0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 22px",
                }}
              >
                <FiCheckCircle size={36} color="#22c55e" />
              </motion.div>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#15803d", marginBottom: "12px" }}>
                Paiement confirmé !
              </h3>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7, marginBottom: "28px" }}>
                Votre compte a été créé et votre élection est en attente de validation par le Super Admin.
                Vous recevrez une confirmation par e-mail.
              </p>
              <a
                href="/login"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "13px 28px", borderRadius: "14px",
                  background: "linear-gradient(135deg,#22c55e,#16a34a)",
                  color: "#fff", textDecoration: "none",
                  fontSize: "15px", fontWeight: 800,
                  boxShadow: "0 6px 20px rgba(34,197,94,0.40)",
                }}
              >
                Se connecter <FiArrowRight size={16} />
              </a>
            </div>
          )}

          {/* ── Erreur ── */}
          {etape === "erreur" && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "#fef2f2", border: "3px solid #fecaca",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 22px",
              }}>
                <FiXCircle size={36} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#dc2626", marginBottom: "12px" }}>
                Paiement échoué
              </h3>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7, marginBottom: "28px" }}>
                {msgPaiement || "Le paiement a échoué ou le délai a été dépassé. Veuillez réessayer."}
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                  onClick={onAnnuler}
                  style={{
                    padding: "12px 20px", borderRadius: "12px",
                    border: "1.5px solid #e2e8f0", background: "#fff",
                    color: "#64748b", fontSize: "14px", fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Fermer
                </button>
                <button
                  onClick={onReessayer}
                  style={{
                    padding: "12px 24px", borderRadius: "12px",
                    background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                    color: "#fff", border: "none", fontSize: "14px", fontWeight: 800,
                    cursor: "pointer", fontFamily: "inherit",
                    boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                  }}
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes progress {
              0%   { transform: translateX(-100%); }
              60%  { transform: translateX(200%); }
              100% { transform: translateX(500%); }
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Composant Field ─────────────────────────────────────────────────────────
function Field({ icon, label, type = "text", name, value, onChange, placeholder, focused, setFocused }) {
  return (
    <div className="field-group">
      <label className="field-label">{icon} {label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required
        onFocus={() => setFocused(name)} onBlur={() => setFocused(null)}
        className={`field-input ${focused === name ? "field-input--focused" : ""}`}
      />
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function RegisterElection() {
  // ── State formulaire
  const [focused,  setFocused]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "", motDePasse: "",
    electionName: "", electionType: "",
    startDate: "", endDate: "",
    dureeTourMinutes: 1440,
    nbSieges: 29,
    description: "",
  });

  // ── State paiement CamPay
  const [etapePaiement, setEtapePaiement] = useState(""); // "" | "telephone" | "attente" | "succes" | "erreur"
  const [telephone,     setTelephone]     = useState("");
  const [campayRef,     setCampayRef]     = useState(null);
  const [msgPaiement,   setMsgPaiement]   = useState("");
  const [userData,      setUserData]      = useState(null); // données créées en étape intermédiaire

  const isListe = formData.electionType === "LISTE";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === "dureeTourMinutes" || name === "nbSieges")
        ? parseInt(value) || 0
        : value,
    }));
  };

  const dateFinTour1 = isListe && formData.startDate
    ? (() => {
        const d = new Date(formData.startDate);
        d.setMinutes(d.getMinutes() + formData.dureeTourMinutes);
        return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
      })()
    : null;

  const bonusSieges = isListe && formData.nbSieges ? Math.floor(formData.nbSieges / 2) : 0;
  const resteSieges = isListe && formData.nbSieges ? formData.nbSieges - bonusSieges : 0;

  // ── ÉTAPE 1 : Valider formulaire → ouvrir modal téléphone
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isListe && new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert("La date de fin doit être supérieure à la date de début !");
      return;
    }
    if (isListe && (!formData.nbSieges || formData.nbSieges < 1)) {
      alert("Le nombre de sièges doit être supérieur à 0.");
      return;
    }

    // Formulaire OK → demander numéro de téléphone
    setTelephone("");
    setEtapePaiement("telephone");
  };

  // ── ÉTAPE 2 : Créer le compte utilisateur + initier paiement CamPay
  const handlePayer = async () => {
    if (!/^[0-9]{9}$/.test(telephone)) {
      alert("Numéro invalide. Saisissez 9 chiffres sans l'indicatif.");
      return;
    }

    setLoading(true);
    setEtapePaiement("attente");

    try {
      // Calcul des dates
      const endDate = isListe
        ? toLocalMySQL((() => {
            const d = new Date(formData.startDate);
            d.setMinutes(d.getMinutes() + formData.dureeTourMinutes);
            return d;
          })())
        : toLocalMySQL(new Date(formData.endDate));

      // ── a) Créer le compte utilisateur en DB (statut PENDING)
      const registerRes = await api.post("/auth/register-and-create-election", {
        ...formData,
        endDate,
        dureeTourMinutes: isListe ? formData.dureeTourMinutes : null,
        nbSieges:         isListe ? formData.nbSieges         : null,
      });

      // Sauvegarder les données retournées (userId, electionId) pour le webhook
      setUserData(registerRes.data);

      // ── b) Initier le paiement CamPay avec le userId créé
      const paiementRes = await api.post("/campay/initier-paiement-public", {
        telephone:        `237${telephone}`,
        user_id:          registerRes.data.userId,
        election_id:      registerRes.data.electionId,
        donnees_election: {
          titre:       formData.electionName,
          description: formData.description,
          type:        formData.electionType,
          startDate:   toLocalMySQL(new Date(formData.startDate)),
          endDate,
          dureeTourMinutes: isListe ? formData.dureeTourMinutes : null,
          nbSieges:         isListe ? formData.nbSieges         : null,
        },
      });

      setCampayRef(paiementRes.data.campay_reference);
      setMsgPaiement(paiementRes.data.message);

      // Lancer le polling
      lancerPolling(paiementRes.data.campay_reference, registerRes.data.userId);

    } catch (err) {
      setMsgPaiement(err.response?.data?.error || err.response?.data?.message || "Erreur lors de l'initialisation.");
      setEtapePaiement("erreur");
      setLoading(false);
    }
  };

  // ── Polling : vérification toutes les 5s (max 60s)
  const lancerPolling = (reference, userId) => {
    let tentatives = 0;

    const interval = setInterval(async () => {
      tentatives++;
      try {
        const { data } = await api.get(`/campay/statut-public/${reference}`);

        if (data.status === "SUCCESSFUL") {
          clearInterval(interval);
          setEtapePaiement("succes");
          setLoading(false);

        } else if (data.status === "FAILED" || tentatives >= 12) {
          clearInterval(interval);
          setMsgPaiement("Paiement échoué ou délai de 60 secondes dépassé. Réessayez.");
          setEtapePaiement("erreur");
          setLoading(false);
        }

      } catch {
        clearInterval(interval);
        setMsgPaiement("Erreur lors de la vérification du paiement.");
        setEtapePaiement("erreur");
        setLoading(false);
      }
    }, 5000);
  };

  // ── Handlers modal
  const handleAnnuler   = () => { setEtapePaiement(""); setLoading(false); };
  const handleReessayer = () => { setEtapePaiement("telephone"); setTelephone(""); setMsgPaiement(""); };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="register-root">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-grid" />

        {/* Modal Paiement CamPay */}
        <ModalPaiement
          etape={etapePaiement}
          telephone={telephone}
          setTelephone={setTelephone}
          msgPaiement={msgPaiement}
          campayRef={campayRef}
          onPayer={handlePayer}
          onAnnuler={handleAnnuler}
          onReessayer={handleReessayer}
        />

        {/* ── NAVBAR ── */}
        <nav className="reg-navbar">
          <div className="reg-navbar-inner">
            <a href="/" className="nav-logo">
              <span className="nav-logo-icon">🗳</span>
              <span className="nav-logo-text">EVote</span>
            </a>
            <div className="nav-actions">
              <a href="/" className="nav-link"><FiHome size={14} /><span>Accueil</span></a>
              <a href="/login" className="nav-link"><FiLogIn size={14} /><span>Connexion</span></a>
              <a href="/creer-election" className="nav-link nav-link--active"><FiPlusCircle size={14} /><span>Créer une élection</span></a>
            </div>
          </div>
        </nav>

        <main className="register-main">
          <motion.div
            className="register-card"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ── IMAGE ── */}
            <div className="reg-image-panel">
              <div className="img-glow" />
              <img src={Election} alt="Création d'élection" className="reg-img" />
              <div className="img-overlay">
                <div className="img-badge">🗳 EVote Platform</div>
                <p className="img-quote">"Organisez des élections transparentes, sécurisées et accessibles à tous."</p>
                <div className="img-features">
                  {["Chiffrement des données", "Résultats en temps réel", "Multi-rôles"].map((f, i) => (
                    <div key={i} className="img-feature-item">
                      <FiCheckCircle size={14} /> {f}
                    </div>
                  ))}
                </div>
                {/* Bandeau frais */}
                <div style={{
                  marginTop: "20px", background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "12px", padding: "12px 16px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "white" }}>
                    <span style={{ fontSize: "18px" }}>💳</span>
                    <div>
                      <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, opacity: .9 }}>Frais de création</p>
                      <p style={{ margin: 0, fontSize: "10px", opacity: .7 }}>Mobile Money requis</p>
                    </div>
                  </div>
                  <span style={{
                    background: "rgba(255,255,255,0.2)", color: "white",
                    fontWeight: 900, fontSize: "14px", padding: "4px 12px",
                    borderRadius: "8px", border: "1px solid rgba(255,255,255,0.3)",
                  }}>
                    {FRAIS_ELECTION} XAF
                  </span>
                </div>
              </div>
            </div>

            {/* ── FORMULAIRE ── */}
            <div className="reg-form-panel">
              <div className="form-header">
                <span className="form-badge">Nouvelle élection</span>
                <h2 className="form-title">Créer une élection</h2>
                <p className="form-subtitle">Remplissez les informations ci-dessous pour démarrer.</p>
              </div>

              <form onSubmit={handleSubmit} className="reg-form">

                {/* Section 01 — Créateur */}
                <div className="form-section">
                  <div className="section-label">
                    <span className="section-num">01</span>
                    <span>Informations du créateur</span>
                  </div>
                  <div className="fields-grid-2">
                    <Field icon={<FiUser size={15}/>}  label="Nom"          name="nom"        value={formData.nom}        onChange={handleChange} placeholder="Dupont"         focused={focused} setFocused={setFocused} />
                    <Field icon={<FiUser size={15}/>}  label="Prénom"       name="prenom"     value={formData.prenom}     onChange={handleChange} placeholder="Jean"           focused={focused} setFocused={setFocused} />
                    <Field icon={<FiMail size={15}/>}  label="Email"        name="email"      value={formData.email}      onChange={handleChange} placeholder="jean@email.com" focused={focused} setFocused={setFocused} type="email" />
                    <Field icon={<FiLock size={15}/>}  label="Mot de passe" name="motDePasse" value={formData.motDePasse} onChange={handleChange} placeholder="••••••••"       focused={focused} setFocused={setFocused} type="password" />
                  </div>
                </div>

                {/* Section 02 — Élection */}
                <div className="form-section">
                  <div className="section-label">
                    <span className="section-num">02</span>
                    <span>Informations de l'élection</span>
                  </div>
                  <div className="fields-stack">

                    <Field icon={<FiType size={15}/>} label="Nom de l'élection" name="electionName" value={formData.electionName} onChange={handleChange} placeholder="Ex : Élection du bureau étudiant 2026" focused={focused} setFocused={setFocused} />

                    <div className="field-group">
                      <label className="field-label"><FiList size={13}/> Type de scrutin</label>
                      <select
                        name="electionType" value={formData.electionType} onChange={handleChange} required
                        onFocus={() => setFocused("type")} onBlur={() => setFocused(null)}
                        className={`field-input field-select ${focused === "type" ? "field-input--focused" : ""}`}
                      >
                        <option value="">Sélectionner un type…</option>
                        <option value="UNINOMINAL">Uninominal</option>
                        <option value="BINOMINAL">Binominal</option>
                        <option value="LISTE">Liste (tours successifs)</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label"><FiCalendar size={13}/> Date de début</label>
                      <input
                        type="datetime-local" name="startDate" value={formData.startDate}
                        onChange={handleChange} required
                        onFocus={() => setFocused("startDate")} onBlur={() => setFocused(null)}
                        className={`field-input ${focused === "startDate" ? "field-input--focused" : ""}`}
                      />
                    </div>

                    {!isListe && (
                      <div className="field-group">
                        <label className="field-label"><FiCalendar size={13}/> Date de fin</label>
                        <input
                          type="datetime-local" name="endDate" value={formData.endDate}
                          onChange={handleChange} required
                          onFocus={() => setFocused("endDate")} onBlur={() => setFocused(null)}
                          className={`field-input ${focused === "endDate" ? "field-input--focused" : ""}`}
                        />
                      </div>
                    )}

                    {isListe && (
                      <div className="fields-stack">
                        <div className="fields-grid-2">
                          <div className="field-group">
                            <label className="field-label"><FiClock size={13}/> Durée par tour</label>
                            <select
                              name="dureeTourMinutes" value={formData.dureeTourMinutes}
                              onChange={handleChange} required
                              onFocus={() => setFocused("duree")} onBlur={() => setFocused(null)}
                              className={`field-input field-select ${focused === "duree" ? "field-input--focused" : ""}`}
                            >
                              {DUREE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="field-group">
                            <label className="field-label"><FiUsers size={13}/> Nombre de sièges</label>
                            <input
                              type="number" name="nbSieges" value={formData.nbSieges}
                              onChange={handleChange} required min="1" max="999" placeholder="Ex : 29"
                              onFocus={() => setFocused("sieges")} onBlur={() => setFocused(null)}
                              className={`field-input ${focused === "sieges" ? "field-input--focused" : ""}`}
                            />
                          </div>
                        </div>

                        {formData.nbSieges > 0 && (
                          <div className="apercu-box">
                            <p className="apercu-title">🏆 Répartition des sièges</p>
                            <div className="apercu-sieges">
                              <div className="siege-card">
                                <span className="siege-num">{formData.nbSieges}</span>
                                <span className="siege-label">Total</span>
                              </div>
                              <div className="siege-card siege-card--bonus">
                                <span className="siege-num">{bonusSieges}</span>
                                <span className="siege-label">Bonus gagnant</span>
                              </div>
                              <div className="siege-card">
                                <span className="siege-num">{resteSieges}</span>
                                <span className="siege-label">Proportionnel</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {dateFinTour1 && (
                          <div className="apercu-box">
                            <p className="apercu-title">📅 Calendrier</p>
                            <div className="apercu-row">
                              <span>Début Tour 1</span>
                              <span className="apercu-val">
                                {new Date(formData.startDate).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="apercu-row">
                              <span>Fin Tour 1</span>
                              <span className="apercu-val apercu-val--accent">{dateFinTour1}</span>
                            </div>
                            <div className="apercu-row apercu-row--muted">
                              <span>Tours suivants</span>
                              <span>+{DUREE_OPTIONS.find(o => o.value === formData.dureeTourMinutes)?.label}</span>
                            </div>
                          </div>
                        )}

                        <div className="info-box">
                          <FiInfo size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                          <p>Si aucune liste n'obtient la majorité absolue (&gt; 50%), un nouveau tour s'ouvre automatiquement.</p>
                        </div>
                      </div>
                    )}

                    <div className="field-group">
                      <label className="field-label"><FiAlignLeft size={13}/> Description</label>
                      <textarea
                        name="description" value={formData.description} onChange={handleChange}
                        placeholder="Décrivez l'objet de cette élection…"
                        onFocus={() => setFocused("desc")} onBlur={() => setFocused(null)}
                        className={`field-input field-textarea ${focused === "desc" ? "field-input--focused" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 03 — Frais CamPay */}
                <div className="form-section">
                  <div className="section-label">
                    <span className="section-num">03</span>
                    <span>Paiement des frais de création</span>
                  </div>
                  <div style={{
                    background: "linear-gradient(135deg,#eef2ff,#e0e7ff)",
                    border: "1.5px solid #c7d2fe",
                    borderRadius: "14px", padding: "16px 18px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "22px" }}>💳</span>
                        <div>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#3730a3" }}>
                            Frais de création d'élection
                          </p>
                          <p style={{ margin: 0, fontSize: "11px", color: "#6366f1" }}>
                            Paiement sécurisé via Mobile Money (MTN / Orange)
                          </p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: "18px", fontWeight: 900, color: "#4338ca",
                        background: "#fff", padding: "5px 14px", borderRadius: "10px",
                        border: "1.5px solid #c7d2fe",
                      }}>
                        {FRAIS_ELECTION} XAF
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {[
                        { label: "MTN MoMo", color: "#d97706", bg: "#fffbeb" },
                        { label: "Orange Money", color: "#ea580c", bg: "#fff7ed" },
                      ].map(op => (
                        <div key={op.label} style={{
                          flex: 1, padding: "8px", borderRadius: "8px",
                          background: op.bg, textAlign: "center",
                          fontSize: "11px", fontWeight: 700, color: op.color,
                          border: `1px solid ${op.color}30`,
                        }}>
                          ✓ {op.label}
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize: "11px", color: "#6366f1", margin: "12px 0 0", textAlign: "center" }}>
                      🔒 Le paiement est initié après validation du formulaire
                    </p>
                  </div>
                </div>

                {/* Bouton */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}
                >
                  {loading ? (
                    <><svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity=".85"/>
                    </svg>Traitement…</>
                  ) : (
                    <>Continuer vers le paiement <FiArrowRight size={16} /></>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}

// ─── Styles CSS ───────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  :root {
    --indigo-50:#eef2ff;--indigo-100:#e0e7ff;--indigo-200:#c7d2fe;--indigo-400:#818cf8;
    --indigo-500:#6366f1;--indigo-600:#4f46e5;--indigo-700:#4338ca;--indigo-900:#1e1b4b;
    --gray-200:#e5e7eb;--gray-400:#9ca3af;--gray-500:#6b7280;--gray-700:#374151;
    --white:#ffffff;--green-50:#f0fdf4;--green-500:#22c55e;--green-600:#16a34a;
    --amber-50:#fffbeb;--amber-600:#d97706;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  .register-root{min-height:100vh;font-family:'Outfit',sans-serif;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow-x:hidden;}
  .bg-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
  .bg-orb-1{width:560px;height:560px;background:radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 70%);top:-180px;left:-180px;}
  .bg-orb-2{width:420px;height:420px;background:radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%);bottom:-120px;right:-100px;}
  .bg-grid{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px);background-size:44px 44px;}
  .reg-navbar{position:relative;z-index:10;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);box-shadow:0 1px 16px rgba(0,0,0,0.05);}
  .reg-navbar-inner{max-width:1200px;margin:0 auto;padding:0 40px;height:62px;display:flex;align-items:center;justify-content:space-between;}
  .nav-logo{display:flex;align-items:center;gap:9px;text-decoration:none;}
  .nav-logo-icon{font-size:20px;}
  .nav-logo-text{font-size:19px;font-weight:900;color:var(--indigo-600);letter-spacing:-0.5px;}
  .nav-actions{display:flex;align-items:center;gap:8px;}
  .nav-link{display:inline-flex;align-items:center;gap:7px;font-size:13.5px;font-weight:600;color:var(--gray-500);text-decoration:none;padding:8px 16px;border-radius:9px;border:none;background:transparent;transition:background .15s,color .15s,transform .15s;font-family:'Outfit',sans-serif;cursor:pointer;}
  .nav-link:hover{background:var(--indigo-50);color:var(--indigo-600);transform:translateY(-1px);}
  .nav-link--active{background:var(--indigo-600);color:white;box-shadow:0 4px 12px rgba(79,70,229,0.25);}
  .nav-link--active:hover{background:var(--indigo-700);color:white;}
  .register-main{position:relative;z-index:1;padding:40px 24px 60px;display:flex;align-items:flex-start;justify-content:center;}
  .register-card{width:100%;max-width:1040px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border:1px solid rgba(99,102,241,0.13);border-radius:28px;box-shadow:0 4px 6px rgba(0,0,0,0.03),0 24px 64px rgba(79,70,229,0.10);display:grid;grid-template-columns:380px 1fr;overflow:hidden;}
  .reg-image-panel{background:linear-gradient(160deg,var(--indigo-600) 0%,#4338ca 100%);padding:40px 32px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;position:relative;overflow:hidden;}
  .img-glow{position:absolute;width:400px;height:400px;background:radial-gradient(circle,rgba(255,255,255,0.12) 0%,transparent 70%);border-radius:50%;top:-100px;left:-100px;pointer-events:none;}
  .reg-img{width:100%;max-width:280px;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.25);position:relative;z-index:1;}
  .img-overlay{position:relative;z-index:1;text-align:center;width:100%;}
  .img-badge{display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:white;padding:5px 16px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.5px;margin-bottom:14px;}
  .img-quote{font-size:14px;color:rgba(255,255,255,0.82);line-height:1.65;margin-bottom:20px;font-style:italic;}
  .img-features{display:flex;flex-direction:column;gap:8px;}
  .img-feature-item{display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,0.90);font-weight:500;}
  .reg-form-panel{padding:40px 40px;overflow-y:auto;max-height:92vh;}
  .form-header{margin-bottom:28px;}
  .form-badge{display:inline-block;background:var(--indigo-50);color:var(--indigo-600);border:1px solid var(--indigo-100);padding:4px 14px;border-radius:999px;font-size:11.5px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;margin-bottom:10px;}
  .form-title{font-size:26px;font-weight:800;color:var(--indigo-900);letter-spacing:-0.5px;margin-bottom:6px;}
  .form-subtitle{font-size:14px;color:var(--gray-500);}
  .reg-form{display:flex;flex-direction:column;gap:28px;}
  .form-section{display:flex;flex-direction:column;gap:14px;}
  .section-label{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:700;color:var(--indigo-600);text-transform:uppercase;letter-spacing:.7px;padding-bottom:10px;border-bottom:1px solid var(--indigo-100);}
  .section-num{background:var(--indigo-600);color:white;width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
  .fields-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .fields-stack{display:flex;flex-direction:column;gap:14px;}
  .field-group{display:flex;flex-direction:column;gap:6px;}
  .field-label{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.6px;}
  .field-input{width:100%;padding:11px 14px;border:1.5px solid var(--gray-200);border-radius:10px;font-size:14px;font-family:'Outfit',sans-serif;color:var(--gray-700);background:#fafafa;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;}
  .field-input::placeholder{color:#d1d5db;}
  .field-input--focused,.field-input:focus{border-color:var(--indigo-400);box-shadow:0 0 0 3px rgba(99,102,241,0.12);background:white;}
  .field-select{cursor:pointer;}
  .field-textarea{min-height:90px;resize:none;line-height:1.6;}
  input[type="datetime-local"]{color-scheme:light;}
  input[type="number"]{-moz-appearance:textfield;}
  input[type="number"]::-webkit-outer-spin-button,input[type="number"]::-webkit-inner-spin-button{-webkit-appearance:none;}
  .apercu-box{background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
  .apercu-title{font-size:12px;font-weight:700;color:var(--indigo-600);text-transform:uppercase;letter-spacing:.5px;}
  .apercu-sieges{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
  .siege-card{background:white;border:1px solid #e0e7ff;border-radius:8px;padding:10px 8px;text-align:center;}
  .siege-card--bonus{background:var(--amber-50);border-color:#fde68a;}
  .siege-num{display:block;font-size:20px;font-weight:900;color:var(--indigo-700);}
  .siege-card--bonus .siege-num{color:var(--amber-600);}
  .siege-label{display:block;font-size:11px;color:var(--gray-400);margin-top:2px;}
  .apercu-row{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--gray-500);}
  .apercu-row--muted{opacity:.65;}
  .apercu-val{font-weight:600;color:var(--indigo-700);}
  .apercu-val--accent{color:var(--indigo-600);}
  .info-box{display:flex;align-items:flex-start;gap:8px;background:var(--amber-50);border:1px solid #fde68a;border-radius:10px;padding:12px 14px;font-size:12.5px;color:var(--amber-600);line-height:1.6;}
  .submit-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:14px;background:var(--indigo-600);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(79,70,229,0.30);transition:background .2s,transform .15s,box-shadow .2s;margin-top:4px;}
  .submit-btn:hover:not(:disabled){background:var(--indigo-700);transform:translateY(-1px);box-shadow:0 6px 20px rgba(79,70,229,0.38);}
  .submit-btn--loading{opacity:.8;cursor:not-allowed;}
  .btn-spinner{width:18px;height:18px;animation:spin .7s linear infinite;flex-shrink:0;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @media(max-width:820px){
    .register-card{grid-template-columns:1fr;}
    .reg-image-panel{display:none;}
    .reg-form-panel{max-height:none;padding:32px 24px;}
    .fields-grid-2{grid-template-columns:1fr;}
    .reg-navbar-inner{padding:0 20px;}
  }
  @media(max-width:480px){
    .register-main{padding:24px 12px 48px;}
    .nav-link span{display:none;}
    .nav-link{padding:8px 12px;}
  }
`;
































// // src/pages/admin/adminelection/RegisterElection.jsx
// import { useState } from "react";
// import { motion } from "framer-motion";
// import {
//   FiUser, FiMail, FiLock, FiCalendar, FiList,
//   FiAlignLeft, FiCheckCircle, FiArrowRight, FiType, FiClock, FiInfo, FiUsers,
//   FiHome, FiPlusCircle, FiLogIn
// } from "react-icons/fi";
// import api from "../../../services/api";
// import Election from './elct.webp';

// const DUREE_OPTIONS = [
//   { value: 30,    label: "30 minutes" },
//   { value: 60,    label: "1 heure" },
//   { value: 120,   label: "2 heures" },
//   { value: 360,   label: "6 heures" },
//   { value: 720,   label: "12 heures" },
//   { value: 1440,  label: "24 heures (1 jour)" },
//   { value: 2880,  label: "48 heures (2 jours)" },
//   { value: 4320,  label: "3 jours" },
//   { value: 10080, label: "7 jours" },
// ];

// // ✅ Helper : convertit une Date JS en "YYYY-MM-DD HH:mm:00" EN HEURE LOCALE
// // (toISOString() convertit en UTC et décale l'heure selon le fuseau → bug)
// const toLocalMySQL = (date) => {
//   const pad = n => String(n).padStart(2, "0");
//   return (
//     `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
//     ` ${pad(date.getHours())}:${pad(date.getMinutes())}:00`
//   );
// };

// export default function RegisterElection() {
//   const [submitted, setSubmitted] = useState(false);
//   const [loading,   setLoading]   = useState(false);
//   const [focused,   setFocused]   = useState(null);
//   const [formData,  setFormData]  = useState({
//     nom: "", prenom: "", email: "", motDePasse: "",
//     electionName: "", electionType: "",
//     startDate: "", endDate: "",
//     dureeTourMinutes: 1440,
//     nbSieges: 29,
//     description: "",
//   });

//   const isListe = formData.electionType === "LISTE";

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: (name === "dureeTourMinutes" || name === "nbSieges")
//         ? parseInt(value) || 0
//         : value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!isListe && new Date(formData.endDate) <= new Date(formData.startDate)) {
//       alert("La date de fin doit être supérieure à la date de début !");
//       return;
//     }
//     if (isListe && (!formData.nbSieges || formData.nbSieges < 1)) {
//       alert("Le nombre de sièges doit être supérieur à 0.");
//       return;
//     }

//     try {
//       setLoading(true);

//       // ✅ Calcul des dates EN HEURE LOCALE (pas de conversion UTC)
//       const endDate = isListe
//         ? (() => {
//             const d = new Date(formData.startDate);
//             d.setMinutes(d.getMinutes() + formData.dureeTourMinutes);
//             return toLocalMySQL(d);
//           })()
//         : toLocalMySQL(new Date(formData.endDate));

//       await api.post("/auth/register-and-create-election", {
//         ...formData,
//         endDate,
//         dureeTourMinutes: isListe ? formData.dureeTourMinutes : null,
//         nbSieges:         isListe ? formData.nbSieges         : null,
//       });

//       setSubmitted(true);
//     } catch (err) {
//       console.error("Erreur lors de la soumission:", err.response || err);
//       alert(err.response?.data?.error || "Erreur serveur");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const dateFinTour1 = isListe && formData.startDate
//     ? (() => {
//         const d = new Date(formData.startDate);
//         d.setMinutes(d.getMinutes() + formData.dureeTourMinutes);
//         return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
//       })()
//     : null;

//   const bonusSieges = isListe && formData.nbSieges ? Math.floor(formData.nbSieges / 2) : 0;
//   const resteSieges = isListe && formData.nbSieges ? formData.nbSieges - bonusSieges : 0;

//   /* ===== ÉCRAN SUCCÈS ===== */
//   if (submitted) {
//     return (
//       <>
//         <style>{styles}</style>
//         <div className="success-screen">
//           <div className="bg-orb bg-orb-1" />
//           <div className="bg-orb bg-orb-2" />
//           <motion.div className="success-card"
//             initial={{ opacity: 0, scale: 0.94, y: 24 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
//             <div className="success-icon-wrap"><FiCheckCircle size={36} /></div>
//             <h2 className="success-title">Demande envoyée !</h2>
//             <p className="success-desc">
//               Votre compte a été créé et votre élection est en attente de validation par le Super Admin.
//               Vous recevrez une confirmation par e-mail.
//             </p>
//             <a href="/login" className="success-btn">Se connecter <FiArrowRight size={15} /></a>
//           </motion.div>
//         </div>
//       </>
//     );
//   }

//   return (
//     <>
//       <style>{styles}</style>
//       <div className="register-root">
//         <div className="bg-orb bg-orb-1" />
//         <div className="bg-orb bg-orb-2" />
//         <div className="bg-grid" />

//         {/* ===== NAVBAR ===== */}
//         <nav className="reg-navbar">
//           <div className="reg-navbar-inner">
//             <a href="/" className="nav-logo">
//               <span className="nav-logo-icon">🗳</span>
//               <span className="nav-logo-text">EVote</span>
//             </a>
//             <div className="nav-actions">
//               <a href="/" className="nav-link"><FiHome size={14} /><span>Accueil</span></a>
//               <a href="/login" className="nav-link"><FiLogIn size={14} /><span>Connexion</span></a>
//               <a href="/creer-election" className="nav-link nav-link--active"><FiPlusCircle size={14} /><span>Créer une élection</span></a>
//             </div>
//           </div>
//         </nav>

//         <main className="register-main">
//           <motion.div className="register-card"
//             initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>

//             {/* IMAGE */}
//             <div className="reg-image-panel">
//               <div className="img-glow" />
//               <img src={Election} alt="Création d'élection" className="reg-img" />
//               <div className="img-overlay">
//                 <div className="img-badge">🗳 EVote Platform</div>
//                 <p className="img-quote">"Organisez des élections transparentes, sécurisées et accessibles à tous."</p>
//                 <div className="img-features">
//                   {["Chiffrement des données", "Résultats en temps réel", "Multi-rôles"].map((f, i) => (
//                     <div key={i} className="img-feature-item"><FiCheckCircle size={14} /> {f}</div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* FORMULAIRE */}
//             <div className="reg-form-panel">
//               <div className="form-header">
//                 <span className="form-badge">Nouvelle élection</span>
//                 <h2 className="form-title">Créer une élection</h2>
//                 <p className="form-subtitle">Remplissez les informations ci-dessous pour démarrer.</p>
//               </div>

//               <form onSubmit={handleSubmit} className="reg-form">

//                 {/* Section 01 — Créateur */}
//                 <div className="form-section">
//                   <div className="section-label">
//                     <span className="section-num">01</span>
//                     <span>Informations du créateur</span>
//                   </div>
//                   <div className="fields-grid-2">
//                     <Field icon={<FiUser size={15}/>}  label="Nom"          name="nom"        value={formData.nom}        onChange={handleChange} placeholder="Dupont"         focused={focused} setFocused={setFocused} />
//                     <Field icon={<FiUser size={15}/>}  label="Prénom"       name="prenom"     value={formData.prenom}     onChange={handleChange} placeholder="Jean"           focused={focused} setFocused={setFocused} />
//                     <Field icon={<FiMail size={15}/>}  label="Email"        name="email"      value={formData.email}      onChange={handleChange} placeholder="jean@email.com" focused={focused} setFocused={setFocused} type="email" />
//                     <Field icon={<FiLock size={15}/>}  label="Mot de passe" name="motDePasse" value={formData.motDePasse} onChange={handleChange} placeholder="••••••••"       focused={focused} setFocused={setFocused} type="password" />
//                   </div>
//                 </div>

//                 {/* Section 02 — Élection */}
//                 <div className="form-section">
//                   <div className="section-label">
//                     <span className="section-num">02</span>
//                     <span>Informations de l'élection</span>
//                   </div>
//                   <div className="fields-stack">

//                     <Field icon={<FiType size={15}/>} label="Nom de l'élection" name="electionName" value={formData.electionName} onChange={handleChange} placeholder="Ex : Élection du bureau étudiant 2026" focused={focused} setFocused={setFocused} />

//                     <div className="field-group">
//                       <label className="field-label"><FiList size={13}/> Type de scrutin</label>
//                       <select name="electionType" value={formData.electionType} onChange={handleChange} required
//                         onFocus={() => setFocused("type")} onBlur={() => setFocused(null)}
//                         className={`field-input field-select ${focused === "type" ? "field-input--focused" : ""}`}>
//                         <option value="">Sélectionner un type…</option>
//                         <option value="UNINOMINAL">Uninominal</option>
//                         <option value="BINOMINAL">Binominal</option>
//                         <option value="LISTE">Liste (tours successifs)</option>
//                       </select>
//                     </div>

//                     <div className="field-group">
//                       <label className="field-label"><FiCalendar size={13}/> Date de début</label>
//                       <input type="datetime-local" name="startDate" value={formData.startDate}
//                         onChange={handleChange} required
//                         onFocus={() => setFocused("startDate")} onBlur={() => setFocused(null)}
//                         className={`field-input ${focused === "startDate" ? "field-input--focused" : ""}`} />
//                     </div>

//                     {!isListe && (
//                       <div className="field-group">
//                         <label className="field-label"><FiCalendar size={13}/> Date de fin</label>
//                         <input type="datetime-local" name="endDate" value={formData.endDate}
//                           onChange={handleChange} required
//                           onFocus={() => setFocused("endDate")} onBlur={() => setFocused(null)}
//                           className={`field-input ${focused === "endDate" ? "field-input--focused" : ""}`} />
//                       </div>
//                     )}

//                     {isListe && (
//                       <div className="fields-stack">
//                         <div className="fields-grid-2">
//                           <div className="field-group">
//                             <label className="field-label"><FiClock size={13}/> Durée par tour</label>
//                             <select name="dureeTourMinutes" value={formData.dureeTourMinutes}
//                               onChange={handleChange} required
//                               onFocus={() => setFocused("duree")} onBlur={() => setFocused(null)}
//                               className={`field-input field-select ${focused === "duree" ? "field-input--focused" : ""}`}>
//                               {DUREE_OPTIONS.map(opt => (
//                                 <option key={opt.value} value={opt.value}>{opt.label}</option>
//                               ))}
//                             </select>
//                           </div>
//                           <div className="field-group">
//                             <label className="field-label"><FiUsers size={13}/> Nombre de sièges</label>
//                             <input type="number" name="nbSieges" value={formData.nbSieges}
//                               onChange={handleChange} required min="1" max="999" placeholder="Ex : 29"
//                               onFocus={() => setFocused("sieges")} onBlur={() => setFocused(null)}
//                               className={`field-input ${focused === "sieges" ? "field-input--focused" : ""}`} />
//                           </div>
//                         </div>

//                         {formData.nbSieges > 0 && (
//                           <div className="apercu-box">
//                             <p className="apercu-title">🏆 Répartition des sièges</p>
//                             <div className="apercu-sieges">
//                               <div className="siege-card">
//                                 <span className="siege-num">{formData.nbSieges}</span>
//                                 <span className="siege-label">Total</span>
//                               </div>
//                               <div className="siege-card siege-card--bonus">
//                                 <span className="siege-num">{bonusSieges}</span>
//                                 <span className="siege-label">Bonus gagnant</span>
//                               </div>
//                               <div className="siege-card">
//                                 <span className="siege-num">{resteSieges}</span>
//                                 <span className="siege-label">Proportionnel</span>
//                               </div>
//                             </div>
//                           </div>
//                         )}

//                         {dateFinTour1 && (
//                           <div className="apercu-box">
//                             <p className="apercu-title">📅 Calendrier</p>
//                             <div className="apercu-row">
//                               <span>Début Tour 1</span>
//                               <span className="apercu-val">
//                                 {new Date(formData.startDate).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
//                               </span>
//                             </div>
//                             <div className="apercu-row">
//                               <span>Fin Tour 1</span>
//                               <span className="apercu-val apercu-val--accent">{dateFinTour1}</span>
//                             </div>
//                             <div className="apercu-row apercu-row--muted">
//                               <span>Tours suivants</span>
//                               <span>+{DUREE_OPTIONS.find(o => o.value === formData.dureeTourMinutes)?.label}</span>
//                             </div>
//                           </div>
//                         )}

//                         <div className="info-box">
//                           <FiInfo size={13} style={{ flexShrink: 0, marginTop: 1 }} />
//                           <p>Si aucune liste n'obtient la majorité absolue (&gt; 50%), un nouveau tour s'ouvre automatiquement. Les listes sous 5% sont éliminées.</p>
//                         </div>
//                       </div>
//                     )}

//                     <div className="field-group">
//                       <label className="field-label"><FiAlignLeft size={13}/> Description</label>
//                       <textarea name="description" value={formData.description} onChange={handleChange}
//                         placeholder="Décrivez l'objet de cette élection…"
//                         onFocus={() => setFocused("desc")} onBlur={() => setFocused(null)}
//                         className={`field-input field-textarea ${focused === "desc" ? "field-input--focused" : ""}`} />
//                     </div>
//                   </div>
//                 </div>

//                 <button type="submit" disabled={loading} className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}>
//                   {loading ? (
//                     <><svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
//                       <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/>
//                       <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity=".85"/>
//                     </svg>Envoi en cours…</>
//                   ) : (
//                     <>Soumettre la demande <FiArrowRight size={16} /></>
//                   )}
//                 </button>
//               </form>
//             </div>
//           </motion.div>
//         </main>
//       </div>
//     </>
//   );
// }

// function Field({ icon, label, type = "text", name, value, onChange, placeholder, focused, setFocused }) {
//   return (
//     <div className="field-group">
//       <label className="field-label">{icon} {label}</label>
//       <input type={type} name={name} value={value} onChange={onChange}
//         placeholder={placeholder} required
//         onFocus={() => setFocused(name)} onBlur={() => setFocused(null)}
//         className={`field-input ${focused === name ? "field-input--focused" : ""}`} />
//     </div>
//   );
// }

// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
//   :root {
//     --indigo-50:#eef2ff;--indigo-100:#e0e7ff;--indigo-200:#c7d2fe;--indigo-400:#818cf8;
//     --indigo-500:#6366f1;--indigo-600:#4f46e5;--indigo-700:#4338ca;--indigo-900:#1e1b4b;
//     --gray-200:#e5e7eb;--gray-400:#9ca3af;--gray-500:#6b7280;--gray-700:#374151;
//     --white:#ffffff;--green-50:#f0fdf4;--green-500:#22c55e;--green-600:#16a34a;
//     --amber-50:#fffbeb;--amber-600:#d97706;
//   }
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   .register-root,.success-screen{min-height:100vh;font-family:'Outfit',sans-serif;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow-x:hidden;}
//   .bg-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
//   .bg-orb-1{width:560px;height:560px;background:radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 70%);top:-180px;left:-180px;}
//   .bg-orb-2{width:420px;height:420px;background:radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%);bottom:-120px;right:-100px;}
//   .bg-grid{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px);background-size:44px 44px;}
//   .reg-navbar{position:relative;z-index:10;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);box-shadow:0 1px 16px rgba(0,0,0,0.05);}
//   .reg-navbar-inner{max-width:1200px;margin:0 auto;padding:0 40px;height:62px;display:flex;align-items:center;justify-content:space-between;}
//   .nav-logo{display:flex;align-items:center;gap:9px;text-decoration:none;}
//   .nav-logo-icon{font-size:20px;}
//   .nav-logo-text{font-size:19px;font-weight:900;color:var(--indigo-600);letter-spacing:-0.5px;}
//   .nav-actions{display:flex;align-items:center;gap:8px;}
//   .nav-link{display:inline-flex;align-items:center;gap:7px;font-size:13.5px;font-weight:600;color:var(--gray-500);text-decoration:none;padding:8px 16px;border-radius:9px;border:none;background:transparent;transition:background .15s,color .15s,transform .15s;font-family:'Outfit',sans-serif;cursor:pointer;}
//   .nav-link:hover{background:var(--indigo-50);color:var(--indigo-600);transform:translateY(-1px);}
//   .nav-link--active{background:var(--indigo-600);color:white;box-shadow:0 4px 12px rgba(79,70,229,0.25);}
//   .nav-link--active:hover{background:var(--indigo-700);color:white;}
//   .register-main{position:relative;z-index:1;padding:40px 24px 60px;display:flex;align-items:flex-start;justify-content:center;}
//   .register-card{width:100%;max-width:1040px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border:1px solid rgba(99,102,241,0.13);border-radius:28px;box-shadow:0 4px 6px rgba(0,0,0,0.03),0 24px 64px rgba(79,70,229,0.10);display:grid;grid-template-columns:380px 1fr;overflow:hidden;}
//   .reg-image-panel{background:linear-gradient(160deg,var(--indigo-600) 0%,#4338ca 100%);padding:40px 32px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;position:relative;overflow:hidden;}
//   .img-glow{position:absolute;width:400px;height:400px;background:radial-gradient(circle,rgba(255,255,255,0.12) 0%,transparent 70%);border-radius:50%;top:-100px;left:-100px;pointer-events:none;}
//   .reg-img{width:100%;max-width:280px;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.25);position:relative;z-index:1;}
//   .img-overlay{position:relative;z-index:1;text-align:center;}
//   .img-badge{display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:white;padding:5px 16px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.5px;margin-bottom:14px;}
//   .img-quote{font-size:14px;color:rgba(255,255,255,0.82);line-height:1.65;margin-bottom:20px;font-style:italic;}
//   .img-features{display:flex;flex-direction:column;gap:8px;}
//   .img-feature-item{display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,0.90);font-weight:500;}
//   .reg-form-panel{padding:40px 40px;overflow-y:auto;max-height:90vh;}
//   .form-header{margin-bottom:28px;}
//   .form-badge{display:inline-block;background:var(--indigo-50);color:var(--indigo-600);border:1px solid var(--indigo-100);padding:4px 14px;border-radius:999px;font-size:11.5px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;margin-bottom:10px;}
//   .form-title{font-size:26px;font-weight:800;color:var(--indigo-900);letter-spacing:-0.5px;margin-bottom:6px;}
//   .form-subtitle{font-size:14px;color:var(--gray-500);}
//   .reg-form{display:flex;flex-direction:column;gap:28px;}
//   .form-section{display:flex;flex-direction:column;gap:14px;}
//   .section-label{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:700;color:var(--indigo-600);text-transform:uppercase;letter-spacing:.7px;padding-bottom:10px;border-bottom:1px solid var(--indigo-100);}
//   .section-num{background:var(--indigo-600);color:white;width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
//   .fields-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
//   .fields-stack{display:flex;flex-direction:column;gap:14px;}
//   .field-group{display:flex;flex-direction:column;gap:6px;}
//   .field-label{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.6px;}
//   .field-input{width:100%;padding:11px 14px;border:1.5px solid var(--gray-200);border-radius:10px;font-size:14px;font-family:'Outfit',sans-serif;color:var(--gray-700);background:#fafafa;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;}
//   .field-input::placeholder{color:#d1d5db;}
//   .field-input--focused,.field-input:focus{border-color:var(--indigo-400);box-shadow:0 0 0 3px rgba(99,102,241,0.12);background:white;}
//   .field-select{cursor:pointer;}
//   .field-textarea{min-height:90px;resize:none;line-height:1.6;}
//   input[type="datetime-local"]{color-scheme:light;}
//   input[type="number"]{-moz-appearance:textfield;}
//   input[type="number"]::-webkit-outer-spin-button,input[type="number"]::-webkit-inner-spin-button{-webkit-appearance:none;}
//   .apercu-box{background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
//   .apercu-title{font-size:12px;font-weight:700;color:var(--indigo-600);text-transform:uppercase;letter-spacing:.5px;}
//   .apercu-sieges{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
//   .siege-card{background:white;border:1px solid #e0e7ff;border-radius:8px;padding:10px 8px;text-align:center;}
//   .siege-card--bonus{background:var(--amber-50);border-color:#fde68a;}
//   .siege-num{display:block;font-size:20px;font-weight:900;color:var(--indigo-700);}
//   .siege-card--bonus .siege-num{color:var(--amber-600);}
//   .siege-label{display:block;font-size:11px;color:var(--gray-400);margin-top:2px;}
//   .apercu-row{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--gray-500);}
//   .apercu-row--muted{opacity:.65;}
//   .apercu-val{font-weight:600;color:var(--indigo-700);}
//   .apercu-val--accent{color:var(--indigo-600);}
//   .info-box{display:flex;align-items:flex-start;gap:8px;background:var(--amber-50);border:1px solid #fde68a;border-radius:10px;padding:12px 14px;font-size:12.5px;color:var(--amber-600);line-height:1.6;}
//   .submit-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:14px;background:var(--indigo-600);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(79,70,229,0.30);transition:background .2s,transform .15s,box-shadow .2s;margin-top:4px;}
//   .submit-btn:hover:not(:disabled){background:var(--indigo-700);transform:translateY(-1px);box-shadow:0 6px 20px rgba(79,70,229,0.38);}
//   .submit-btn--loading{opacity:.8;cursor:not-allowed;}
//   .btn-spinner{width:18px;height:18px;animation:spin .7s linear infinite;flex-shrink:0;}
//   @keyframes spin{to{transform:rotate(360deg);}}
//   .success-screen{display:flex;align-items:center;justify-content:center;padding:40px 16px;}
//   .success-card{background:rgba(255,255,255,0.93);backdrop-filter:blur(16px);border:1px solid rgba(34,197,94,0.20);border-radius:24px;padding:52px 44px;max-width:460px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(34,197,94,0.10);position:relative;z-index:1;}
//   .success-icon-wrap{width:72px;height:72px;background:var(--green-50);border:2px solid rgba(34,197,94,0.25);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--green-500);margin:0 auto 20px;}
//   .success-title{font-size:26px;font-weight:800;color:var(--green-600);letter-spacing:-0.4px;margin-bottom:12px;}
//   .success-desc{font-size:14.5px;color:var(--gray-500);line-height:1.65;margin-bottom:28px;}
//   .success-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:var(--indigo-600);color:white;text-decoration:none;border-radius:11px;font-size:14.5px;font-weight:600;font-family:'Outfit',sans-serif;box-shadow:0 4px 14px rgba(79,70,229,0.28);transition:background .18s,transform .15s;}
//   .success-btn:hover{background:var(--indigo-700);transform:translateY(-1px);}
//   @media(max-width:820px){
//     .register-card{grid-template-columns:1fr;}
//     .reg-image-panel{display:none;}
//     .reg-form-panel{max-height:none;padding:32px 24px;}
//     .fields-grid-2{grid-template-columns:1fr;}
//     .reg-navbar-inner{padding:0 20px;}
//   }
//   @media(max-width:480px){
//     .register-main{padding:24px 12px 48px;}
//     .nav-link span{display:none;}
//     .nav-link{padding:8px 12px;}
//   }
// `;



























// // src/pages/admin/adminelection/RegisterElection.jsx
// import { useState } from "react";
// import { motion } from "framer-motion";
// import {
//   FiUser, FiMail, FiLock, FiCalendar, FiList,
//   FiAlignLeft, FiCheckCircle, FiArrowRight, FiType, FiClock, FiInfo, FiUsers,
//   FiHome, FiPlusCircle, FiLogIn
// } from "react-icons/fi";
// import api from "../../../services/api";
// import Election from './elct.webp';

// const DUREE_OPTIONS = [
//   { value: 30,    label: "30 minutes" },
//   { value: 60,    label: "1 heure" },
//   { value: 120,   label: "2 heures" },
//   { value: 360,   label: "6 heures" },
//   { value: 720,   label: "12 heures" },
//   { value: 1440,  label: "24 heures (1 jour)" },
//   { value: 2880,  label: "48 heures (2 jours)" },
//   { value: 4320,  label: "3 jours" },
//   { value: 10080, label: "7 jours" },
// ];

// export default function RegisterElection() {
//   const [submitted, setSubmitted] = useState(false);
//   const [loading,   setLoading]   = useState(false);
//   const [focused,   setFocused]   = useState(null);
//   const [formData,  setFormData]  = useState({
//     nom: "", prenom: "", email: "", motDePasse: "",
//     electionName: "", electionType: "",
//     startDate: "", endDate: "",
//     dureeTourMinutes: 1440,
//     nbSieges: 29,
//     description: "",
//   });

//   const isListe = formData.electionType === "LISTE";

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: (name === "dureeTourMinutes" || name === "nbSieges")
//         ? parseInt(value) || 0
//         : value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!isListe && new Date(formData.endDate) <= new Date(formData.startDate)) {
//       alert("La date de fin doit être supérieure à la date de début !");
//       return;
//     }
//     if (isListe && (!formData.nbSieges || formData.nbSieges < 1)) {
//       alert("Le nombre de sièges doit être supérieur à 0.");
//       return;
//     }
//     try {
//       setLoading(true);
//       const endDate = isListe
//         ? new Date(new Date(formData.startDate).getTime() + formData.dureeTourMinutes * 60000)
//             .toISOString().slice(0, 16)
//         : formData.endDate;

//       await api.post("/auth/register-and-create-election", {
//         ...formData,
//         endDate,
//         dureeTourMinutes: isListe ? formData.dureeTourMinutes : null,
//         nbSieges:         isListe ? formData.nbSieges         : null,
//       });
//       setSubmitted(true);
//     } catch (err) {
//       console.error("Erreur lors de la soumission:", err.response || err);
//       alert(err.response?.data?.error || "Erreur serveur");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const dateFinTour1 = isListe && formData.startDate
//     ? new Date(new Date(formData.startDate).getTime() + formData.dureeTourMinutes * 60000)
//         .toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
//     : null;

//   const bonusSieges = isListe && formData.nbSieges ? Math.floor(formData.nbSieges / 2) : 0;
//   const resteSieges = isListe && formData.nbSieges ? formData.nbSieges - bonusSieges : 0;

//   /* ===== ÉCRAN SUCCÈS ===== */
//   if (submitted) {
//     return (
//       <>
//         <style>{styles}</style>
//         <div className="success-screen">
//           <div className="bg-orb bg-orb-1" />
//           <div className="bg-orb bg-orb-2" />
//           <motion.div className="success-card"
//             initial={{ opacity: 0, scale: 0.94, y: 24 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
//             <div className="success-icon-wrap"><FiCheckCircle size={36} /></div>
//             <h2 className="success-title">Demande envoyée !</h2>
//             <p className="success-desc">
//               Votre compte a été créé et votre élection est en attente de validation par le Super Admin.
//               Vous recevrez une confirmation par e-mail.
//             </p>
//             <a href="/login" className="success-btn">Se connecter <FiArrowRight size={15} /></a>
//           </motion.div>
//         </div>
//       </>
//     );
//   }

//   return (
//     <>
//       <style>{styles}</style>
//       <div className="register-root">
//         <div className="bg-orb bg-orb-1" />
//         <div className="bg-orb bg-orb-2" />
//         <div className="bg-grid" />

//         {/* ===== NAVBAR ===== */}
//         <nav className="reg-navbar">
//           <div className="reg-navbar-inner">
//             <a href="/" className="nav-logo">
//               <span className="nav-logo-icon">🗳</span>
//               <span className="nav-logo-text">EVote</span>
//             </a>
//             <div className="nav-actions">
//               <a href="/" className="nav-link">
//                 <FiHome size={14} />
//                 <span>Accueil</span>
//               </a>
//               <a href="/login" className="nav-link">
//                 <FiLogIn size={14} />
//                 <span>Connexion</span>
//               </a>
//               <a href="/creer-election" className="nav-link nav-link--active">
//                 <FiPlusCircle size={14} />
//                 <span>Créer une élection</span>
//               </a>
//             </div>
//           </div>
//         </nav>

//         <main className="register-main">
//           <motion.div className="register-card"
//             initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>

//             {/* IMAGE */}
//             <div className="reg-image-panel">
//               <div className="img-glow" />
//               <img src={Election} alt="Création d'élection" className="reg-img" />
//               <div className="img-overlay">
//                 <div className="img-badge">🗳 EVote Platform</div>
//                 <p className="img-quote">"Organisez des élections transparentes, sécurisées et accessibles à tous."</p>
//                 <div className="img-features">
//                   {["Chiffrement des données", "Résultats en temps réel", "Multi-rôles"].map((f, i) => (
//                     <div key={i} className="img-feature-item"><FiCheckCircle size={14} /> {f}</div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* FORMULAIRE */}
//             <div className="reg-form-panel">
//               <div className="form-header">
//                 <span className="form-badge">Nouvelle élection</span>
//                 <h2 className="form-title">Créer une élection</h2>
//                 <p className="form-subtitle">Remplissez les informations ci-dessous pour démarrer.</p>
//               </div>

//               <form onSubmit={handleSubmit} className="reg-form">

//                 {/* Section 01 — Créateur */}
//                 <div className="form-section">
//                   <div className="section-label">
//                     <span className="section-num">01</span>
//                     <span>Informations du créateur</span>
//                   </div>
//                   <div className="fields-grid-2">
//                     <Field icon={<FiUser size={15}/>}  label="Nom"          name="nom"        value={formData.nom}        onChange={handleChange} placeholder="Dupont"         focused={focused} setFocused={setFocused} />
//                     <Field icon={<FiUser size={15}/>}  label="Prénom"       name="prenom"     value={formData.prenom}     onChange={handleChange} placeholder="Jean"           focused={focused} setFocused={setFocused} />
//                     <Field icon={<FiMail size={15}/>}  label="Email"        name="email"      value={formData.email}      onChange={handleChange} placeholder="jean@email.com" focused={focused} setFocused={setFocused} type="email" />
//                     <Field icon={<FiLock size={15}/>}  label="Mot de passe" name="motDePasse" value={formData.motDePasse} onChange={handleChange} placeholder="••••••••"       focused={focused} setFocused={setFocused} type="password" />
//                   </div>
//                 </div>

//                 {/* Section 02 — Élection */}
//                 <div className="form-section">
//                   <div className="section-label">
//                     <span className="section-num">02</span>
//                     <span>Informations de l'élection</span>
//                   </div>
//                   <div className="fields-stack">

//                     <Field icon={<FiType size={15}/>} label="Nom de l'élection" name="electionName" value={formData.electionName} onChange={handleChange} placeholder="Ex : Élection du bureau étudiant 2026" focused={focused} setFocused={setFocused} />

//                     <div className="field-group">
//                       <label className="field-label"><FiList size={13}/> Type de scrutin</label>
//                       <select name="electionType" value={formData.electionType} onChange={handleChange} required
//                         onFocus={() => setFocused("type")} onBlur={() => setFocused(null)}
//                         className={`field-input field-select ${focused === "type" ? "field-input--focused" : ""}`}>
//                         <option value="">Sélectionner un type…</option>
//                         <option value="UNINOMINAL">Uninominal</option>
//                         <option value="BINOMINAL">Binominal</option>
//                         <option value="LISTE">Liste (tours successifs)</option>
//                       </select>
//                     </div>

//                     <div className="field-group">
//                       <label className="field-label"><FiCalendar size={13}/> Date de début</label>
//                       <input type="datetime-local" name="startDate" value={formData.startDate}
//                         onChange={handleChange} required
//                         onFocus={() => setFocused("startDate")} onBlur={() => setFocused(null)}
//                         className={`field-input ${focused === "startDate" ? "field-input--focused" : ""}`} />
//                     </div>

//                     {!isListe && (
//                       <div className="field-group">
//                         <label className="field-label"><FiCalendar size={13}/> Date de fin</label>
//                         <input type="datetime-local" name="endDate" value={formData.endDate}
//                           onChange={handleChange} required
//                           onFocus={() => setFocused("endDate")} onBlur={() => setFocused(null)}
//                           className={`field-input ${focused === "endDate" ? "field-input--focused" : ""}`} />
//                       </div>
//                     )}

//                     {isListe && (
//                       <div className="fields-stack">
//                         <div className="fields-grid-2">
//                           <div className="field-group">
//                             <label className="field-label"><FiClock size={13}/> Durée par tour</label>
//                             <select name="dureeTourMinutes" value={formData.dureeTourMinutes}
//                               onChange={handleChange} required
//                               onFocus={() => setFocused("duree")} onBlur={() => setFocused(null)}
//                               className={`field-input field-select ${focused === "duree" ? "field-input--focused" : ""}`}>
//                               {DUREE_OPTIONS.map(opt => (
//                                 <option key={opt.value} value={opt.value}>{opt.label}</option>
//                               ))}
//                             </select>
//                           </div>
//                           <div className="field-group">
//                             <label className="field-label"><FiUsers size={13}/> Nombre de sièges</label>
//                             <input type="number" name="nbSieges" value={formData.nbSieges}
//                               onChange={handleChange} required min="1" max="999" placeholder="Ex : 29"
//                               onFocus={() => setFocused("sieges")} onBlur={() => setFocused(null)}
//                               className={`field-input ${focused === "sieges" ? "field-input--focused" : ""}`} />
//                           </div>
//                         </div>

//                         {formData.nbSieges > 0 && (
//                           <div className="apercu-box">
//                             <p className="apercu-title">🏆 Répartition des sièges</p>
//                             <div className="apercu-sieges">
//                               <div className="siege-card">
//                                 <span className="siege-num">{formData.nbSieges}</span>
//                                 <span className="siege-label">Total</span>
//                               </div>
//                               <div className="siege-card siege-card--bonus">
//                                 <span className="siege-num">{bonusSieges}</span>
//                                 <span className="siege-label">Bonus gagnant</span>
//                               </div>
//                               <div className="siege-card">
//                                 <span className="siege-num">{resteSieges}</span>
//                                 <span className="siege-label">Proportionnel</span>
//                               </div>
//                             </div>
//                           </div>
//                         )}

//                         {dateFinTour1 && (
//                           <div className="apercu-box">
//                             <p className="apercu-title">📅 Calendrier</p>
//                             <div className="apercu-row">
//                               <span>Début Tour 1</span>
//                               <span className="apercu-val">
//                                 {new Date(formData.startDate).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
//                               </span>
//                             </div>
//                             <div className="apercu-row">
//                               <span>Fin Tour 1</span>
//                               <span className="apercu-val apercu-val--accent">{dateFinTour1}</span>
//                             </div>
//                             <div className="apercu-row apercu-row--muted">
//                               <span>Tours suivants</span>
//                               <span>+{DUREE_OPTIONS.find(o => o.value === formData.dureeTourMinutes)?.label}</span>
//                             </div>
//                           </div>
//                         )}

//                         <div className="info-box">
//                           <FiInfo size={13} style={{ flexShrink: 0, marginTop: 1 }} />
//                           <p>Si aucune liste n'obtient la majorité absolue (&gt; 50%), un nouveau tour s'ouvre automatiquement. Les listes sous 5% sont éliminées.</p>
//                         </div>
//                       </div>
//                     )}

//                     <div className="field-group">
//                       <label className="field-label"><FiAlignLeft size={13}/> Description</label>
//                       <textarea name="description" value={formData.description} onChange={handleChange}
//                         placeholder="Décrivez l'objet de cette élection…"
//                         onFocus={() => setFocused("desc")} onBlur={() => setFocused(null)}
//                         className={`field-input field-textarea ${focused === "desc" ? "field-input--focused" : ""}`} />
//                     </div>
//                   </div>
//                 </div>

//                 <button type="submit" disabled={loading} className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}>
//                   {loading ? (
//                     <><svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
//                       <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/>
//                       <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity=".85"/>
//                     </svg>Envoi en cours…</>
//                   ) : (
//                     <>Soumettre la demande <FiArrowRight size={16} /></>
//                   )}
//                 </button>
//               </form>
//             </div>
//           </motion.div>
//         </main>
//       </div>
//     </>
//   );
// }

// function Field({ icon, label, type = "text", name, value, onChange, placeholder, focused, setFocused }) {
//   return (
//     <div className="field-group">
//       <label className="field-label">{icon} {label}</label>
//       <input type={type} name={name} value={value} onChange={onChange}
//         placeholder={placeholder} required
//         onFocus={() => setFocused(name)} onBlur={() => setFocused(null)}
//         className={`field-input ${focused === name ? "field-input--focused" : ""}`} />
//     </div>
//   );
// }

// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
//   :root {
//     --indigo-50:#eef2ff;--indigo-100:#e0e7ff;--indigo-200:#c7d2fe;--indigo-400:#818cf8;
//     --indigo-500:#6366f1;--indigo-600:#4f46e5;--indigo-700:#4338ca;--indigo-900:#1e1b4b;
//     --gray-200:#e5e7eb;--gray-400:#9ca3af;--gray-500:#6b7280;--gray-700:#374151;
//     --white:#ffffff;--green-50:#f0fdf4;--green-500:#22c55e;--green-600:#16a34a;
//     --amber-50:#fffbeb;--amber-600:#d97706;
//   }
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   .register-root,.success-screen{min-height:100vh;font-family:'Outfit',sans-serif;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow-x:hidden;}
//   .bg-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
//   .bg-orb-1{width:560px;height:560px;background:radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 70%);top:-180px;left:-180px;}
//   .bg-orb-2{width:420px;height:420px;background:radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%);bottom:-120px;right:-100px;}
//   .bg-grid{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px);background-size:44px 44px;}

//   /* ===== NAVBAR ===== */
//   .reg-navbar{
//     position:relative;z-index:10;
//     background:rgba(255,255,255,0.97);
//     backdrop-filter:blur(12px);
//     border-bottom:1px solid rgba(99,102,241,0.12);
//     box-shadow:0 1px 16px rgba(0,0,0,0.05);
//   }
//   .reg-navbar-inner{
//     max-width:1200px;margin:0 auto;
//     padding:0 40px;height:62px;
//     display:flex;align-items:center;justify-content:space-between;
//   }
//   .nav-logo{display:flex;align-items:center;gap:9px;text-decoration:none;}
//   .nav-logo-icon{font-size:20px;}
//   .nav-logo-text{font-size:19px;font-weight:900;color:var(--indigo-600);letter-spacing:-0.5px;}
//   .nav-actions{display:flex;align-items:center;gap:8px;}
//   .nav-link{
//     display:inline-flex;align-items:center;gap:7px;
//     font-size:13.5px;font-weight:600;color:var(--gray-500);
//     text-decoration:none;padding:8px 16px;
//     border-radius:9px;border:none;background:transparent;
//     transition:background .15s,color .15s,transform .15s;
//     font-family:'Outfit',sans-serif;cursor:pointer;
//   }
//   .nav-link:hover{background:var(--indigo-50);color:var(--indigo-600);transform:translateY(-1px);}
//   .nav-link--active{
//     background:var(--indigo-600);color:white;
//     box-shadow:0 4px 12px rgba(79,70,229,0.25);
//   }
//   .nav-link--active:hover{background:var(--indigo-700);color:white;}

//   .register-main{position:relative;z-index:1;padding:40px 24px 60px;display:flex;align-items:flex-start;justify-content:center;}
//   .register-card{width:100%;max-width:1040px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border:1px solid rgba(99,102,241,0.13);border-radius:28px;box-shadow:0 4px 6px rgba(0,0,0,0.03),0 24px 64px rgba(79,70,229,0.10);display:grid;grid-template-columns:380px 1fr;overflow:hidden;}
//   .reg-image-panel{background:linear-gradient(160deg,var(--indigo-600) 0%,#4338ca 100%);padding:40px 32px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;position:relative;overflow:hidden;}
//   .img-glow{position:absolute;width:400px;height:400px;background:radial-gradient(circle,rgba(255,255,255,0.12) 0%,transparent 70%);border-radius:50%;top:-100px;left:-100px;pointer-events:none;}
//   .reg-img{width:100%;max-width:280px;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.25);position:relative;z-index:1;}
//   .img-overlay{position:relative;z-index:1;text-align:center;}
//   .img-badge{display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:white;padding:5px 16px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.5px;margin-bottom:14px;}
//   .img-quote{font-size:14px;color:rgba(255,255,255,0.82);line-height:1.65;margin-bottom:20px;font-style:italic;}
//   .img-features{display:flex;flex-direction:column;gap:8px;}
//   .img-feature-item{display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,0.90);font-weight:500;}
//   .reg-form-panel{padding:40px 40px;overflow-y:auto;max-height:90vh;}
//   .form-header{margin-bottom:28px;}
//   .form-badge{display:inline-block;background:var(--indigo-50);color:var(--indigo-600);border:1px solid var(--indigo-100);padding:4px 14px;border-radius:999px;font-size:11.5px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;margin-bottom:10px;}
//   .form-title{font-size:26px;font-weight:800;color:var(--indigo-900);letter-spacing:-0.5px;margin-bottom:6px;}
//   .form-subtitle{font-size:14px;color:var(--gray-500);}
//   .reg-form{display:flex;flex-direction:column;gap:28px;}
//   .form-section{display:flex;flex-direction:column;gap:14px;}
//   .section-label{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:700;color:var(--indigo-600);text-transform:uppercase;letter-spacing:.7px;padding-bottom:10px;border-bottom:1px solid var(--indigo-100);}
//   .section-num{background:var(--indigo-600);color:white;width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
//   .fields-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
//   .fields-stack{display:flex;flex-direction:column;gap:14px;}
//   .field-group{display:flex;flex-direction:column;gap:6px;}
//   .field-label{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.6px;}
//   .field-input{width:100%;padding:11px 14px;border:1.5px solid var(--gray-200);border-radius:10px;font-size:14px;font-family:'Outfit',sans-serif;color:var(--gray-700);background:#fafafa;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;}
//   .field-input::placeholder{color:#d1d5db;}
//   .field-input--focused,.field-input:focus{border-color:var(--indigo-400);box-shadow:0 0 0 3px rgba(99,102,241,0.12);background:white;}
//   .field-select{cursor:pointer;}
//   .field-textarea{min-height:90px;resize:none;line-height:1.6;}
//   input[type="datetime-local"]{color-scheme:light;}
//   input[type="number"]{-moz-appearance:textfield;}
//   input[type="number"]::-webkit-outer-spin-button,input[type="number"]::-webkit-inner-spin-button{-webkit-appearance:none;}
//   .apercu-box{background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
//   .apercu-title{font-size:12px;font-weight:700;color:var(--indigo-600);text-transform:uppercase;letter-spacing:.5px;}
//   .apercu-sieges{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
//   .siege-card{background:white;border:1px solid #e0e7ff;border-radius:8px;padding:10px 8px;text-align:center;}
//   .siege-card--bonus{background:var(--amber-50);border-color:#fde68a;}
//   .siege-num{display:block;font-size:20px;font-weight:900;color:var(--indigo-700);}
//   .siege-card--bonus .siege-num{color:var(--amber-600);}
//   .siege-label{display:block;font-size:11px;color:var(--gray-400);margin-top:2px;}
//   .apercu-row{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--gray-500);}
//   .apercu-row--muted{opacity:.65;}
//   .apercu-val{font-weight:600;color:var(--indigo-700);}
//   .apercu-val--accent{color:var(--indigo-600);}
//   .info-box{display:flex;align-items:flex-start;gap:8px;background:var(--amber-50);border:1px solid #fde68a;border-radius:10px;padding:12px 14px;font-size:12.5px;color:var(--amber-600);line-height:1.6;}
//   .submit-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:14px;background:var(--indigo-600);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(79,70,229,0.30);transition:background .2s,transform .15s,box-shadow .2s;margin-top:4px;}
//   .submit-btn:hover:not(:disabled){background:var(--indigo-700);transform:translateY(-1px);box-shadow:0 6px 20px rgba(79,70,229,0.38);}
//   .submit-btn--loading{opacity:.8;cursor:not-allowed;}
//   .btn-spinner{width:18px;height:18px;animation:spin .7s linear infinite;flex-shrink:0;}
//   @keyframes spin{to{transform:rotate(360deg);}}
//   .success-screen{display:flex;align-items:center;justify-content:center;padding:40px 16px;}
//   .success-card{background:rgba(255,255,255,0.93);backdrop-filter:blur(16px);border:1px solid rgba(34,197,94,0.20);border-radius:24px;padding:52px 44px;max-width:460px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(34,197,94,0.10);position:relative;z-index:1;}
//   .success-icon-wrap{width:72px;height:72px;background:var(--green-50);border:2px solid rgba(34,197,94,0.25);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--green-500);margin:0 auto 20px;}
//   .success-title{font-size:26px;font-weight:800;color:var(--green-600);letter-spacing:-0.4px;margin-bottom:12px;}
//   .success-desc{font-size:14.5px;color:var(--gray-500);line-height:1.65;margin-bottom:28px;}
//   .success-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:var(--indigo-600);color:white;text-decoration:none;border-radius:11px;font-size:14.5px;font-weight:600;font-family:'Outfit',sans-serif;box-shadow:0 4px 14px rgba(79,70,229,0.28);transition:background .18s,transform .15s;}
//   .success-btn:hover{background:var(--indigo-700);transform:translateY(-1px);}
//   @media(max-width:820px){
//     .register-card{grid-template-columns:1fr;}
//     .reg-image-panel{display:none;}
//     .reg-form-panel{max-height:none;padding:32px 24px;}
//     .fields-grid-2{grid-template-columns:1fr;}
//     .reg-navbar-inner{padding:0 20px;}
//   }
//   @media(max-width:480px){
//     .register-main{padding:24px 12px 48px;}
//     .nav-link span{display:none;}
//     .nav-link{padding:8px 12px;}
//   }
// `;


