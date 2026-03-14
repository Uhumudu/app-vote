// frontend/pages/RegisterElection.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FiUser, FiMail, FiLock, FiCalendar, FiList,
  FiAlignLeft, FiCheckCircle, FiArrowRight, FiType, FiGrid
} from "react-icons/fi";
import api from "../../../services/api";
import Election from './elct.webp';

export default function RegisterElection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "", motDePasse: "",
    electionName: "", electionType: "", startDate: "", endDate: "",
    description: "", nbSieges: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert("La date de fin doit être supérieure à la date de début !");
      return;
    }
    if (formData.electionType === "LISTE" && (!formData.nbSieges || formData.nbSieges < 1)) {
      alert("Veuillez indiquer un nombre de sièges valide !");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/auth/register-and-create-election", {
        ...formData,
        nb_sieges: formData.electionType === "LISTE" ? parseInt(formData.nbSieges) : null,
      });
      console.log("Réponse du serveur:", res.data);
      setSubmitted(true);
    } catch (err) {
      console.error("Erreur lors de la soumission:", err.response || err);
      alert(err.response?.data?.error || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  /* ===== ÉCRAN SUCCÈS ===== */
  if (submitted) {
    return (
      <>
        <style>{styles}</style>
        <div className="success-screen">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <motion.div
            className="success-card"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="success-icon-wrap">
              <FiCheckCircle size={36} />
            </div>
            <h2 className="success-title">Demande envoyée !</h2>
            <p className="success-desc">
              Votre compte a été créé et votre élection est en attente de validation par le Super Admin.
              Vous recevrez une confirmation par e-mail.
            </p>
            <a href="/login" className="success-btn">
              Se connecter <FiArrowRight size={15} />
            </a>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="register-root">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-grid" />

        <nav className="reg-navbar">
          <div className="nav-logo">
            <span>🗳</span>
            <span className="nav-logo-text">VoteSecure</span>
          </div>
          <div className="nav-actions">
            <a href="/" className="nav-btn-ghost">🏠 Accueil</a>
            <a href="/login" className="nav-btn-ghost">Connexion</a>
            <a href="/creer-election" className="nav-btn-filled">
              Créer une élection <FiArrowRight size={14} />
            </a>
          </div>
        </nav>

        <main className="register-main">
          <motion.div
            className="register-card"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* IMAGE */}
            <div className="reg-image-panel">
              <div className="img-glow" />
              <img src={Election} alt="Création d'élection" className="reg-img" />
              <div className="img-overlay">
                <div className="img-badge">🗳 eVote Platform</div>
                <p className="img-quote">
                  "Organisez des élections transparentes, sécurisées et accessibles à tous."
                </p>
                <div className="img-features">
                  {["Chiffrement des données", "Résultats en temps réel", "Multi-rôles"].map((f, i) => (
                    <div key={i} className="img-feature-item">
                      <FiCheckCircle size={14} /> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FORMULAIRE */}
            <div className="reg-form-panel">
              <div className="form-header">
                <span className="form-badge">Nouvelle élection</span>
                <h2 className="form-title">Créer une élection</h2>
                <p className="form-subtitle">Remplissez les informations ci-dessous pour démarrer.</p>
              </div>

              <form onSubmit={handleSubmit} className="reg-form">

                {/* Section créateur */}
                <div className="form-section">
                  <div className="section-label">
                    <span className="section-num">01</span>
                    <span>Informations du créateur</span>
                  </div>
                  <div className="fields-grid-2">
                    <Field icon={<FiUser size={15}/>} label="Nom" name="nom" value={formData.nom} onChange={handleChange} placeholder="Dupont" focused={focused} setFocused={setFocused} />
                    <Field icon={<FiUser size={15}/>} label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Jean" focused={focused} setFocused={setFocused} />
                    <Field icon={<FiMail size={15}/>} label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="jean@email.com" focused={focused} setFocused={setFocused} />
                    <Field icon={<FiLock size={15}/>} label="Mot de passe" type="password" name="motDePasse" value={formData.motDePasse} onChange={handleChange} placeholder="••••••••" focused={focused} setFocused={setFocused} />
                  </div>
                </div>

                {/* Section élection */}
                <div className="form-section">
                  <div className="section-label">
                    <span className="section-num">02</span>
                    <span>Informations de l'élection</span>
                  </div>
                  <div className="fields-stack">
                    <Field icon={<FiType size={15}/>} label="Nom de l'élection" name="electionName" value={formData.electionName} onChange={handleChange} placeholder="Ex : Élection du bureau étudiant 2025" focused={focused} setFocused={setFocused} />

                    <div className="fields-grid-2">
                      <div className="field-group">
                        <label className="field-label"><FiCalendar size={13}/> Date de début</label>
                        <input
                          type="datetime-local" name="startDate" value={formData.startDate}
                          onChange={handleChange} required
                          onFocus={() => setFocused("startDate")}
                          onBlur={() => setFocused(null)}
                          className={`field-input ${focused === "startDate" ? "field-input--focused" : ""}`}
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label"><FiCalendar size={13}/> Date de fin</label>
                        <input
                          type="datetime-local" name="endDate" value={formData.endDate}
                          onChange={handleChange} required
                          onFocus={() => setFocused("endDate")}
                          onBlur={() => setFocused(null)}
                          className={`field-input ${focused === "endDate" ? "field-input--focused" : ""}`}
                        />
                      </div>
                    </div>

                    {/* Type de scrutin */}
                    <div className="field-group">
                      <label className="field-label"><FiList size={13}/> Type de scrutin</label>
                      <select
                        name="electionType" value={formData.electionType}
                        onChange={handleChange} required
                        onFocus={() => setFocused("type")}
                        onBlur={() => setFocused(null)}
                        className={`field-input field-select ${focused === "type" ? "field-input--focused" : ""}`}
                      >
                        <option value="">Sélectionner un type…</option>
                        <option value="UNINOMINAL">Uninominal</option>
                        <option value="BINOMINAL">Binominal</option>
                        <option value="LISTE">Liste</option>
                      </select>
                    </div>

                    {/* ✅ Champ nb sièges — visible uniquement si type = LISTE */}
                    {formData.electionType === "LISTE" && (
                      <motion.div
                        className="field-group sieges-field"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <label className="field-label">
                          <FiGrid size={13}/> Nombre de sièges à pourvoir
                        </label>
                        <input
                          type="number"
                          name="nbSieges"
                          value={formData.nbSieges}
                          onChange={handleChange}
                          min="1"
                          max="999"
                          required
                          placeholder="Ex : 29"
                          onFocus={() => setFocused("nbSieges")}
                          onBlur={() => setFocused(null)}
                          className={`field-input ${focused === "nbSieges" ? "field-input--focused" : ""}`}
                        />
                        <p className="field-hint">
                          La moitié des sièges sera attribuée à la liste arrivée en tête, le reste réparti proportionnellement.
                        </p>
                      </motion.div>
                    )}

                    <div className="field-group">
                      <label className="field-label"><FiAlignLeft size={13}/> Description</label>
                      <textarea
                        name="description" value={formData.description}
                        onChange={handleChange}
                        placeholder="Décrivez l'objet de cette élection…"
                        onFocus={() => setFocused("desc")}
                        onBlur={() => setFocused(null)}
                        className={`field-input field-textarea ${focused === "desc" ? "field-input--focused" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}>
                  {loading ? (
                    <>
                      <svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity=".85"/>
                      </svg>
                      Envoi en cours…
                    </>
                  ) : (
                    <>Soumettre la demande <FiArrowRight size={16} /></>
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

/* ===== Composant Field réutilisable ===== */
function Field({ icon, label, type = "text", name, value, onChange, placeholder, focused, setFocused }) {
  return (
    <div className="field-group">
      <label className="field-label">{icon} {label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required
        onFocus={() => setFocused(name)}
        onBlur={() => setFocused(null)}
        className={`field-input ${focused === name ? "field-input--focused" : ""}`}
      />
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

  :root {
    --indigo-50:  #eef2ff;
    --indigo-100: #e0e7ff;
    --indigo-200: #c7d2fe;
    --indigo-400: #818cf8;
    --indigo-500: #6366f1;
    --indigo-600: #4f46e5;
    --indigo-700: #4338ca;
    --indigo-900: #1e1b4b;
    --gray-50:    #f9fafb;
    --gray-200:   #e5e7eb;
    --gray-400:   #9ca3af;
    --gray-500:   #6b7280;
    --gray-700:   #374151;
    --white:      #ffffff;
    --green-50:   #f0fdf4;
    --green-500:  #22c55e;
    --green-600:  #16a34a;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .register-root, .success-screen {
    min-height: 100vh;
    font-family: 'Outfit', sans-serif;
    background: linear-gradient(135deg, #eef2ff 0%, #f8f9ff 55%, #eff6ff 100%);
    position: relative;
    overflow-x: hidden;
  }

  .bg-orb {
    position: fixed; border-radius: 50%;
    filter: blur(90px); pointer-events: none; z-index: 0;
  }
  .bg-orb-1 {
    width: 560px; height: 560px;
    background: radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%);
    top: -180px; left: -180px;
  }
  .bg-orb-2 {
    width: 420px; height: 420px;
    background: radial-gradient(circle, rgba(79,70,229,0.09) 0%, transparent 70%);
    bottom: -120px; right: -100px;
  }
  .bg-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
    background-size: 44px 44px;
  }

  .reg-navbar {
    position: relative; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 40px;
    background: rgba(255,255,255,0.75);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(99,102,241,0.10);
  }
  .nav-logo { display: flex; align-items: center; gap: 10px; font-size: 20px; }
  .nav-logo-text { font-weight: 800; color: var(--indigo-600); letter-spacing: -0.4px; }
  .nav-actions { display: flex; align-items: center; gap: 10px; }
  .nav-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13.5px; font-weight: 600; color: var(--indigo-600);
    text-decoration: none; padding: 8px 18px; border-radius: 9px;
    border: 1.5px solid var(--indigo-200); background: transparent;
    transition: background .15s, transform .15s;
    font-family: 'Outfit', sans-serif;
  }
  .nav-btn-ghost:hover { background: var(--indigo-50); transform: translateY(-1px); }
  .nav-btn-filled {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 13.5px; font-weight: 600; color: white;
    text-decoration: none; padding: 9px 20px; border-radius: 10px;
    background: var(--indigo-600);
    box-shadow: 0 4px 12px rgba(79,70,229,0.28);
    transition: background .18s, transform .15s, box-shadow .18s;
    font-family: 'Outfit', sans-serif;
  }
  .nav-btn-filled:hover { background: var(--indigo-700); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(79,70,229,0.35); }

  .register-main {
    position: relative; z-index: 1;
    padding: 40px 24px 60px;
    display: flex; align-items: flex-start; justify-content: center;
  }

  .register-card {
    width: 100%; max-width: 1040px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(99,102,241,0.13);
    border-radius: 28px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.03), 0 24px 64px rgba(79,70,229,0.10);
    display: grid;
    grid-template-columns: 380px 1fr;
    overflow: hidden;
  }

  .reg-image-panel {
    background: linear-gradient(160deg, var(--indigo-600) 0%, #4338ca 100%);
    padding: 40px 32px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 28px; position: relative; overflow: hidden;
  }
  .img-glow {
    position: absolute; width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
    border-radius: 50%; top: -100px; left: -100px; pointer-events: none;
  }
  .reg-img {
    width: 100%; max-width: 280px; border-radius: 16px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.25); position: relative; z-index: 1;
  }
  .img-overlay { position: relative; z-index: 1; text-align: center; }
  .img-badge {
    display: inline-block; background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25); color: white;
    padding: 5px 16px; border-radius: 999px;
    font-size: 12px; font-weight: 600; letter-spacing: .5px; margin-bottom: 14px;
  }
  .img-quote {
    font-size: 14px; color: rgba(255,255,255,0.82);
    line-height: 1.65; margin-bottom: 20px; font-style: italic;
  }
  .img-features { display: flex; flex-direction: column; gap: 8px; }
  .img-feature-item {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: rgba(255,255,255,0.90); font-weight: 500;
  }

  .reg-form-panel { padding: 40px 40px; overflow-y: auto; max-height: 90vh; }
  .form-header { margin-bottom: 28px; }
  .form-badge {
    display: inline-block; background: var(--indigo-50); color: var(--indigo-600);
    border: 1px solid var(--indigo-100); padding: 4px 14px; border-radius: 999px;
    font-size: 11.5px; font-weight: 600; letter-spacing: .6px;
    text-transform: uppercase; margin-bottom: 10px;
  }
  .form-title {
    font-size: 26px; font-weight: 800; color: var(--indigo-900);
    letter-spacing: -0.5px; margin-bottom: 6px;
  }
  .form-subtitle { font-size: 14px; color: var(--gray-500); }

  .reg-form { display: flex; flex-direction: column; gap: 28px; }
  .form-section { display: flex; flex-direction: column; gap: 14px; }
  .section-label {
    display: flex; align-items: center; gap: 10px;
    font-size: 12.5px; font-weight: 700; color: var(--indigo-600);
    text-transform: uppercase; letter-spacing: .7px;
    padding-bottom: 10px; border-bottom: 1px solid var(--indigo-100);
  }
  .section-num {
    background: var(--indigo-600); color: white;
    width: 22px; height: 22px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
  }

  .fields-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .fields-stack { display: flex; flex-direction: column; gap: 14px; }

  .field-group { display: flex; flex-direction: column; gap: 6px; }
  .field-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; color: var(--gray-500);
    text-transform: uppercase; letter-spacing: .6px;
  }
  .field-input {
    width: 100%; padding: 11px 14px;
    border: 1.5px solid var(--gray-200); border-radius: 10px;
    font-size: 14px; font-family: 'Outfit', sans-serif;
    color: var(--gray-700); background: #fafafa; outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }
  .field-input::placeholder { color: #d1d5db; }
  .field-input--focused, .field-input:focus {
    border-color: var(--indigo-400);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    background: white;
  }
  .field-select { cursor: pointer; }
  .field-select option { background: white; }
  .field-textarea { min-height: 90px; resize: none; line-height: 1.6; }
  input[type="datetime-local"] { color-scheme: light; }
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button { opacity: 1; }

  /* ✅ Champ sièges avec bordure indigo pour le distinguer */
  .sieges-field .field-input {
    border-color: var(--indigo-200);
    background: var(--indigo-50);
  }
  .sieges-field .field-input:focus,
  .sieges-field .field-input.field-input--focused {
    border-color: var(--indigo-500);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
    background: white;
  }
  .field-hint {
    font-size: 11.5px; color: var(--indigo-400);
    line-height: 1.5; margin-top: 2px;
    font-style: italic;
  }

  .submit-btn {
    display: flex; align-items: center; justify-content: center; gap: 9px;
    width: 100%; padding: 14px;
    background: var(--indigo-600); color: white; border: none;
    border-radius: 12px; font-size: 15px; font-weight: 700;
    font-family: 'Outfit', sans-serif; cursor: pointer;
    box-shadow: 0 4px 14px rgba(79,70,229,0.30);
    transition: background .2s, transform .15s, box-shadow .2s; margin-top: 4px;
  }
  .submit-btn:hover:not(:disabled) {
    background: var(--indigo-700); transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(79,70,229,0.38);
  }
  .submit-btn--loading { opacity: .8; cursor: not-allowed; }
  .btn-spinner { width: 18px; height: 18px; animation: spin .7s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .success-screen {
    display: flex; align-items: center; justify-content: center; padding: 40px 16px;
  }
  .success-card {
    background: rgba(255,255,255,0.93); backdrop-filter: blur(16px);
    border: 1px solid rgba(34,197,94,0.20); border-radius: 24px;
    padding: 52px 44px; max-width: 460px; width: 100%; text-align: center;
    box-shadow: 0 20px 60px rgba(34,197,94,0.10); position: relative; z-index: 1;
  }
  .success-icon-wrap {
    width: 72px; height: 72px; background: var(--green-50);
    border: 2px solid rgba(34,197,94,0.25); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--green-500); margin: 0 auto 20px;
  }
  .success-title {
    font-size: 26px; font-weight: 800; color: var(--green-600);
    letter-spacing: -0.4px; margin-bottom: 12px;
  }
  .success-desc {
    font-size: 14.5px; color: var(--gray-500); line-height: 1.65; margin-bottom: 28px;
  }
  .success-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 28px; background: var(--indigo-600); color: white;
    text-decoration: none; border-radius: 11px;
    font-size: 14.5px; font-weight: 600; font-family: 'Outfit', sans-serif;
    box-shadow: 0 4px 14px rgba(79,70,229,0.28);
    transition: background .18s, transform .15s;
  }
  .success-btn:hover { background: var(--indigo-700); transform: translateY(-1px); }

  @media (max-width: 820px) {
    .register-card { grid-template-columns: 1fr; }
    .reg-image-panel { display: none; }
    .reg-form-panel { max-height: none; padding: 32px 24px; }
    .fields-grid-2 { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) {
    .reg-navbar { padding: 14px 20px; }
    .register-main { padding: 24px 12px 48px; }
  }
`;















































// // frontend/pages/RegisterElection.jsx
// import { useState } from "react";
// import { motion } from "framer-motion";
// import {
//   FiUser, FiMail, FiLock, FiCalendar, FiList,
//   FiAlignLeft, FiCheckCircle, FiArrowRight, FiType
// } from "react-icons/fi";
// import api from "../../../services/api";
// import Election from './elct.webp';

// export default function RegisterElection() {
//   const [submitted, setSubmitted] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [focused, setFocused] = useState(null);
//   const [formData, setFormData] = useState({
//     nom: "", prenom: "", email: "", motDePasse: "",
//     electionName: "", electionType: "", startDate: "", endDate: "", description: "",
//   });

//   const handleChange = (e) =>
//     setFormData({ ...formData, [e.target.name]: e.target.value });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (new Date(formData.endDate) <= new Date(formData.startDate)) {
//       alert("La date de fin doit être supérieure à la date de début !");
//       return;
//     }
//     try {
//       setLoading(true);
//       const res = await api.post("/auth/register-and-create-election", formData);
//       console.log("Réponse du serveur:", res.data);
//       setSubmitted(true);
//     } catch (err) {
//       console.error("Erreur lors de la soumission:", err.response || err);
//       alert(err.response?.data?.error || "Erreur serveur");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ===== ÉCRAN SUCCÈS ===== */
//   if (submitted) {
//     return (
//       <>
//         <style>{styles}</style>
//         <div className="success-screen">
//           <div className="bg-orb bg-orb-1" />
//           <div className="bg-orb bg-orb-2" />
//           <motion.div
//             className="success-card"
//             initial={{ opacity: 0, scale: 0.94, y: 24 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
//           >
//             <div className="success-icon-wrap">
//               <FiCheckCircle size={36} />
//             </div>
//             <h2 className="success-title">Demande envoyée !</h2>
//             <p className="success-desc">
//               Votre compte a été créé et votre élection est en attente de validation par le Super Admin.
//               Vous recevrez une confirmation par e-mail.
//             </p>
//             <a href="/login" className="success-btn">
//               Se connecter <FiArrowRight size={15} />
//             </a>
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

//         {/* Navbar complète */}
//         <nav className="reg-navbar">
//           <div className="nav-logo">
//             <span>🗳</span>
//             <span className="nav-logo-text">VoteSecure</span>
//           </div>
//           <div className="nav-actions">
//             <a href="/" className="nav-btn-ghost">🏠 Accueil</a>
//             <a href="/login" className="nav-btn-ghost">Connexion</a>
//             <a href="/creer-election" className="nav-btn-filled">
//               Créer une élection <FiArrowRight size={14} />
//             </a>
//           </div>
//         </nav>

//         <main className="register-main">
//           <motion.div
//             className="register-card"
//             initial={{ opacity: 0, y: 32 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
//           >

//             {/* IMAGE */}
//             <div className="reg-image-panel">
//               <div className="img-glow" />
//               <img src={Election} alt="Création d'élection" className="reg-img" />
//               <div className="img-overlay">
//                 <div className="img-badge">🗳 eVote Platform</div>
//                 <p className="img-quote">
//                   "Organisez des élections transparentes, sécurisées et accessibles à tous."
//                 </p>
//                 <div className="img-features">
//                   {["Chiffrement des données", "Résultats en temps réel", "Multi-rôles"].map((f, i) => (
//                     <div key={i} className="img-feature-item">
//                       <FiCheckCircle size={14} /> {f}
//                     </div>
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

//                 {/* Section créateur */}
//                 <div className="form-section">
//                   <div className="section-label">
//                     <span className="section-num">01</span>
//                     <span>Informations du créateur</span>
//                   </div>
//                   <div className="fields-grid-2">
//                     <Field icon={<FiUser size={15}/>} label="Nom" name="nom" value={formData.nom} onChange={handleChange} placeholder="Dupont" focused={focused} setFocused={setFocused} />
//                     <Field icon={<FiUser size={15}/>} label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Jean" focused={focused} setFocused={setFocused} />
//                     <Field icon={<FiMail size={15}/>} label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="jean@email.com" focused={focused} setFocused={setFocused} />
//                     <Field icon={<FiLock size={15}/>} label="Mot de passe" type="password" name="motDePasse" value={formData.motDePasse} onChange={handleChange} placeholder="••••••••" focused={focused} setFocused={setFocused} />
//                   </div>
//                 </div>

//                 {/* Section élection */}
//                 <div className="form-section">
//                   <div className="section-label">
//                     <span className="section-num">02</span>
//                     <span>Informations de l'élection</span>
//                   </div>
//                   <div className="fields-stack">
//                     <Field icon={<FiType size={15}/>} label="Nom de l'élection" name="electionName" value={formData.electionName} onChange={handleChange} placeholder="Ex : Élection du bureau étudiant 2025" focused={focused} setFocused={setFocused} />

//                     <div className="fields-grid-2">
//                       <div className="field-group">
//                         <label className="field-label"><FiCalendar size={13}/> Date de début</label>
//                         <input
//                           type="datetime-local" name="startDate" value={formData.startDate}
//                           onChange={handleChange} required
//                           onFocus={() => setFocused("startDate")}
//                           onBlur={() => setFocused(null)}
//                           className={`field-input ${focused === "startDate" ? "field-input--focused" : ""}`}
//                         />
//                       </div>
//                       <div className="field-group">
//                         <label className="field-label"><FiCalendar size={13}/> Date de fin</label>
//                         <input
//                           type="datetime-local" name="endDate" value={formData.endDate}
//                           onChange={handleChange} required
//                           onFocus={() => setFocused("endDate")}
//                           onBlur={() => setFocused(null)}
//                           className={`field-input ${focused === "endDate" ? "field-input--focused" : ""}`}
//                         />
//                       </div>
//                     </div>

//                     <div className="field-group">
//                       <label className="field-label"><FiList size={13}/> Type de scrutin</label>
//                       <select
//                         name="electionType" value={formData.electionType}
//                         onChange={handleChange} required
//                         onFocus={() => setFocused("type")}
//                         onBlur={() => setFocused(null)}
//                         className={`field-input field-select ${focused === "type" ? "field-input--focused" : ""}`}
//                       >
//                         <option value="">Sélectionner un type…</option>
//                         <option value="UNINOMINAL">Uninominal</option>
//                         <option value="BINOMINAL">Binominal</option>
//                         <option value="LISTE">Liste</option>
//                       </select>
//                     </div>

//                     <div className="field-group">
//                       <label className="field-label"><FiAlignLeft size={13}/> Description</label>
//                       <textarea
//                         name="description" value={formData.description}
//                         onChange={handleChange}
//                         placeholder="Décrivez l'objet de cette élection…"
//                         onFocus={() => setFocused("desc")}
//                         onBlur={() => setFocused(null)}
//                         className={`field-input field-textarea ${focused === "desc" ? "field-input--focused" : ""}`}
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <button type="submit" disabled={loading} className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}>
//                   {loading ? (
//                     <>
//                       <svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
//                         <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/>
//                         <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity=".85"/>
//                       </svg>
//                       Envoi en cours…
//                     </>
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

// /* ===== Composant Field réutilisable ===== */
// function Field({ icon, label, type = "text", name, value, onChange, placeholder, focused, setFocused }) {
//   return (
//     <div className="field-group">
//       <label className="field-label">{icon} {label}</label>
//       <input
//         type={type} name={name} value={value} onChange={onChange}
//         placeholder={placeholder} required
//         onFocus={() => setFocused(name)}
//         onBlur={() => setFocused(null)}
//         className={`field-input ${focused === name ? "field-input--focused" : ""}`}
//       />
//     </div>
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
//     --indigo-400: #818cf8;
//     --indigo-500: #6366f1;
//     --indigo-600: #4f46e5;
//     --indigo-700: #4338ca;
//     --indigo-900: #1e1b4b;
//     --gray-50:    #f9fafb;
//     --gray-200:   #e5e7eb;
//     --gray-400:   #9ca3af;
//     --gray-500:   #6b7280;
//     --gray-700:   #374151;
//     --white:      #ffffff;
//     --green-50:   #f0fdf4;
//     --green-500:  #22c55e;
//     --green-600:  #16a34a;
//   }

//   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//   /* ===== ROOT ===== */
//   .register-root, .success-screen {
//     min-height: 100vh;
//     font-family: 'Outfit', sans-serif;
//     background: linear-gradient(135deg, #eef2ff 0%, #f8f9ff 55%, #eff6ff 100%);
//     position: relative;
//     overflow-x: hidden;
//   }

//   .bg-orb {
//     position: fixed;
//     border-radius: 50%;
//     filter: blur(90px);
//     pointer-events: none;
//     z-index: 0;
//   }
//   .bg-orb-1 {
//     width: 560px; height: 560px;
//     background: radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%);
//     top: -180px; left: -180px;
//   }
//   .bg-orb-2 {
//     width: 420px; height: 420px;
//     background: radial-gradient(circle, rgba(79,70,229,0.09) 0%, transparent 70%);
//     bottom: -120px; right: -100px;
//   }
//   .bg-grid {
//     position: fixed; inset: 0; z-index: 0; pointer-events: none;
//     background-image:
//       linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
//       linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
//     background-size: 44px 44px;
//   }

//   /* ===== NAVBAR ===== */
//   .reg-navbar {
//     position: relative; z-index: 10;
//     display: flex; align-items: center; justify-content: space-between;
//     padding: 18px 40px;
//     background: rgba(255,255,255,0.75);
//     backdrop-filter: blur(12px);
//     border-bottom: 1px solid rgba(99,102,241,0.10);
//   }
//   .nav-logo { display: flex; align-items: center; gap: 10px; font-size: 20px; }
//   .nav-logo-text { font-weight: 800; color: var(--indigo-600); letter-spacing: -0.4px; }
//   .nav-actions { display: flex; align-items: center; gap: 10px; }
//   .nav-btn-ghost {
//     display: inline-flex; align-items: center; gap: 6px;
//     font-size: 13.5px; font-weight: 600; color: var(--indigo-600);
//     text-decoration: none; padding: 8px 18px; border-radius: 9px;
//     border: 1.5px solid var(--indigo-200); background: transparent;
//     transition: background .15s, transform .15s;
//     font-family: 'Outfit', sans-serif;
//   }
//   .nav-btn-ghost:hover { background: var(--indigo-50); transform: translateY(-1px); }
//   .nav-btn-filled {
//     display: inline-flex; align-items: center; gap: 7px;
//     font-size: 13.5px; font-weight: 600; color: white;
//     text-decoration: none; padding: 9px 20px; border-radius: 10px;
//     background: var(--indigo-600);
//     box-shadow: 0 4px 12px rgba(79,70,229,0.28);
//     transition: background .18s, transform .15s, box-shadow .18s;
//     font-family: 'Outfit', sans-serif;
//   }
//   .nav-btn-filled:hover { background: var(--indigo-700); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(79,70,229,0.35); }

//   /* ===== MAIN ===== */
//   .register-main {
//     position: relative; z-index: 1;
//     padding: 40px 24px 60px;
//     display: flex; align-items: flex-start; justify-content: center;
//   }

//   /* ===== CARD ===== */
//   .register-card {
//     width: 100%; max-width: 1040px;
//     background: rgba(255,255,255,0.92);
//     backdrop-filter: blur(16px);
//     border: 1px solid rgba(99,102,241,0.13);
//     border-radius: 28px;
//     box-shadow: 0 4px 6px rgba(0,0,0,0.03), 0 24px 64px rgba(79,70,229,0.10);
//     display: grid;
//     grid-template-columns: 380px 1fr;
//     overflow: hidden;
//   }

//   /* ===== IMAGE PANEL ===== */
//   .reg-image-panel {
//     background: linear-gradient(160deg, var(--indigo-600) 0%, #4338ca 100%);
//     padding: 40px 32px;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     gap: 28px;
//     position: relative;
//     overflow: hidden;
//   }
//   .img-glow {
//     position: absolute;
//     width: 400px; height: 400px;
//     background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
//     border-radius: 50%;
//     top: -100px; left: -100px;
//     pointer-events: none;
//   }
//   .reg-img {
//     width: 100%; max-width: 280px;
//     border-radius: 16px;
//     box-shadow: 0 16px 48px rgba(0,0,0,0.25);
//     position: relative; z-index: 1;
//   }
//   .img-overlay { position: relative; z-index: 1; text-align: center; }
//   .img-badge {
//     display: inline-block;
//     background: rgba(255,255,255,0.15);
//     border: 1px solid rgba(255,255,255,0.25);
//     color: white; padding: 5px 16px;
//     border-radius: 999px; font-size: 12px; font-weight: 600;
//     letter-spacing: .5px; margin-bottom: 14px;
//   }
//   .img-quote {
//     font-size: 14px; color: rgba(255,255,255,0.82);
//     line-height: 1.65; margin-bottom: 20px;
//     font-style: italic;
//   }
//   .img-features { display: flex; flex-direction: column; gap: 8px; }
//   .img-feature-item {
//     display: flex; align-items: center; gap: 8px;
//     font-size: 13px; color: rgba(255,255,255,0.90); font-weight: 500;
//   }

//   /* ===== FORM PANEL ===== */
//   .reg-form-panel { padding: 40px 40px; overflow-y: auto; max-height: 90vh; }

//   .form-header { margin-bottom: 28px; }
//   .form-badge {
//     display: inline-block;
//     background: var(--indigo-50); color: var(--indigo-600);
//     border: 1px solid var(--indigo-100);
//     padding: 4px 14px; border-radius: 999px;
//     font-size: 11.5px; font-weight: 600;
//     letter-spacing: .6px; text-transform: uppercase; margin-bottom: 10px;
//   }
//   .form-title {
//     font-size: 26px; font-weight: 800;
//     color: var(--indigo-900); letter-spacing: -0.5px; margin-bottom: 6px;
//   }
//   .form-subtitle { font-size: 14px; color: var(--gray-500); }

//   /* ===== FORM ===== */
//   .reg-form { display: flex; flex-direction: column; gap: 28px; }

//   .form-section { display: flex; flex-direction: column; gap: 14px; }
//   .section-label {
//     display: flex; align-items: center; gap: 10px;
//     font-size: 12.5px; font-weight: 700;
//     color: var(--indigo-600); text-transform: uppercase; letter-spacing: .7px;
//     padding-bottom: 10px;
//     border-bottom: 1px solid var(--indigo-100);
//   }
//   .section-num {
//     background: var(--indigo-600); color: white;
//     width: 22px; height: 22px; border-radius: 6px;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 11px; font-weight: 700; flex-shrink: 0;
//   }

//   .fields-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
//   .fields-stack { display: flex; flex-direction: column; gap: 14px; }

//   /* ===== FIELDS ===== */
//   .field-group { display: flex; flex-direction: column; gap: 6px; }
//   .field-label {
//     display: flex; align-items: center; gap: 6px;
//     font-size: 12px; font-weight: 600;
//     color: var(--gray-500); text-transform: uppercase; letter-spacing: .6px;
//   }
//   .field-input {
//     width: 100%; padding: 11px 14px;
//     border: 1.5px solid var(--gray-200);
//     border-radius: 10px; font-size: 14px;
//     font-family: 'Outfit', sans-serif;
//     color: var(--gray-700); background: #fafafa;
//     outline: none;
//     transition: border-color .2s, box-shadow .2s, background .2s;
//   }
//   .field-input::placeholder { color: #d1d5db; }
//   .field-input--focused, .field-input:focus {
//     border-color: var(--indigo-400);
//     box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
//     background: white;
//   }
//   .field-select { cursor: pointer; }
//   .field-select option { background: white; }
//   .field-textarea { min-height: 90px; resize: none; line-height: 1.6; }

//   input[type="datetime-local"] { color-scheme: light; }

//   /* ===== SUBMIT ===== */
//   .submit-btn {
//     display: flex; align-items: center; justify-content: center; gap: 9px;
//     width: 100%; padding: 14px;
//     background: var(--indigo-600); color: white; border: none;
//     border-radius: 12px; font-size: 15px; font-weight: 700;
//     font-family: 'Outfit', sans-serif; cursor: pointer;
//     box-shadow: 0 4px 14px rgba(79,70,229,0.30);
//     transition: background .2s, transform .15s, box-shadow .2s;
//     margin-top: 4px;
//   }
//   .submit-btn:hover:not(:disabled) {
//     background: var(--indigo-700);
//     transform: translateY(-1px);
//     box-shadow: 0 6px 20px rgba(79,70,229,0.38);
//   }
//   .submit-btn--loading { opacity: .8; cursor: not-allowed; }
//   .btn-spinner { width: 18px; height: 18px; animation: spin .7s linear infinite; flex-shrink: 0; }
//   @keyframes spin { to { transform: rotate(360deg); } }

//   /* ===== SUCCÈS ===== */
//   .success-screen {
//     display: flex; align-items: center; justify-content: center; padding: 40px 16px;
//   }
//   .success-card {
//     background: rgba(255,255,255,0.93);
//     backdrop-filter: blur(16px);
//     border: 1px solid rgba(34,197,94,0.20);
//     border-radius: 24px;
//     padding: 52px 44px;
//     max-width: 460px; width: 100%;
//     text-align: center;
//     box-shadow: 0 20px 60px rgba(34,197,94,0.10);
//     position: relative; z-index: 1;
//   }
//   .success-icon-wrap {
//     width: 72px; height: 72px;
//     background: var(--green-50);
//     border: 2px solid rgba(34,197,94,0.25);
//     border-radius: 50%;
//     display: flex; align-items: center; justify-content: center;
//     color: var(--green-500); margin: 0 auto 20px;
//   }
//   .success-title {
//     font-size: 26px; font-weight: 800;
//     color: var(--green-600); letter-spacing: -0.4px; margin-bottom: 12px;
//   }
//   .success-desc {
//     font-size: 14.5px; color: var(--gray-500);
//     line-height: 1.65; margin-bottom: 28px;
//   }
//   .success-btn {
//     display: inline-flex; align-items: center; gap: 8px;
//     padding: 12px 28px; background: var(--indigo-600);
//     color: white; text-decoration: none;
//     border-radius: 11px; font-size: 14.5px; font-weight: 600;
//     font-family: 'Outfit', sans-serif;
//     box-shadow: 0 4px 14px rgba(79,70,229,0.28);
//     transition: background .18s, transform .15s;
//   }
//   .success-btn:hover { background: var(--indigo-700); transform: translateY(-1px); }

//   /* ===== RESPONSIVE ===== */
//   @media (max-width: 820px) {
//     .register-card { grid-template-columns: 1fr; }
//     .reg-image-panel { display: none; }
//     .reg-form-panel { max-height: none; padding: 32px 24px; }
//     .fields-grid-2 { grid-template-columns: 1fr; }
//   }
//   @media (max-width: 480px) {
//     .reg-navbar { padding: 14px 20px; }
//     .register-main { padding: 24px 12px 48px; }
//   }
// `;


