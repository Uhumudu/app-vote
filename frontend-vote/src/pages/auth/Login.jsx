// src/pages/auth/Login.jsx
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiAlertCircle, FiArrowRight, FiEye, FiEyeOff, FiHome, FiPlusCircle } from "react-icons/fi";
import api from "../../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, mot_de_passe: motDePasse });
      const { token, role, id, nom, prenom, email: userEmail } = res.data;
      if (!token || !role) {
        setError("Erreur : token ou rôle manquant dans la réponse du serveur");
        setLoading(false);
        return;
      }
      localStorage.setItem("token",  token);
      localStorage.setItem("id",     id);
      localStorage.setItem("role",   role);
      localStorage.setItem("nom",    nom    || "");
      localStorage.setItem("prenom", prenom || "");
      localStorage.setItem("email",  userEmail || email);
      const normalizedRole = role.toUpperCase();
      switch (normalizedRole) {
        case "SUPER_ADMIN":    navigate("/superAdminDashboard");    break;
        case "ADMIN_ELECTION": navigate("/adminElectionDashboard"); break;
        case "ELECTEUR":       navigate("/DashboardElecteur");      break;
        default:               setError("Rôle inconnu : " + role);
      }
    } catch (err) {
      console.error("Erreur lors de la connexion:", err);
      setError(err.response?.data?.message || "Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">
        <nav className="top-nav">
          <div className="top-nav-inner">
            <button onClick={() => navigate("/")} className="top-nav-logo">
              <span className="top-nav-logo-icon">🗳</span>
              <span className="top-nav-logo-name">EVote</span>
            </button>
            <div className="top-nav-links">
              <button onClick={() => navigate("/")} className="top-nav-link">
                <FiHome size={14} /><span>Accueil</span>
              </button>
              <button onClick={() => navigate("/creer-election")} className="top-nav-link top-nav-link--cta">
                <FiPlusCircle size={14} /><span>Créer une élection</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="login-body">
          <div className="bg-left">
            <div className="bg-circle bg-circle-1" />
            <div className="bg-circle bg-circle-2" />
            <div className="bg-dots" />
            <div className="bg-left-content">
              <div className="brand-mark">
                <span className="brand-icon">🗳</span>
                <span className="brand-name">EVote</span>
              </div>
              <div className="left-copy">
                <h1 className="left-title">
                  Le vote électronique<br />
                  <span className="left-title-accent">simple et sécurisé</span>
                </h1>
                <p className="left-desc">
                  Organisez et participez à vos élections en toute transparence, depuis n'importe quel appareil.
                </p>
              </div>
              <div className="left-features">
                {[
                  { icon: "🔒", label: "Chiffrement bout en bout" },
                  { icon: "⚡", label: "Résultats en temps réel" },
                  { icon: "✅", label: "Zéro fraude possible" },
                ].map((f, i) => (
                  <div key={i} className="left-feature-item">
                    <span className="left-feature-icon">{f.icon}</span>
                    <span className="left-feature-label">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-right">
            <main className="login-main">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="login-card"
              >
                <div className="card-header">
                  <div className="card-logo">
                    <div className="card-logo-icon">🗳</div>
                    <span className="card-logo-name">EVote</span>
                  </div>
                  <div className="card-badge">
                    <span className="badge-pulse" />
                    Espace sécurisé
                  </div>
                  <h2 className="card-title">Connexion</h2>
                  <p className="card-subtitle">Accédez à votre espace de vote en toute sécurité</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="error-box">
                    <FiAlertCircle size={15} /><span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="card-form">
                  <div className={`field-wrap ${focused === "email" ? "field-wrap--focused" : ""}`}>
                    <label className="field-label">Adresse e-mail</label>
                    <div className="field-inner">
                      <FiMail size={16} className="field-icon" />
                      <input
                        type="email" required placeholder="exemple@email.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                        className="field-input"
                      />
                    </div>
                  </div>

                  <div className={`field-wrap ${focused === "password" ? "field-wrap--focused" : ""}`}>
                    <label className="field-label">Mot de passe</label>
                    <div className="field-inner">
                      <FiLock size={16} className="field-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required placeholder="••••••••"
                        value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
                        onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                        className="field-input field-input--has-toggle"
                      />
                      <button type="button" className="pwd-toggle"
                        onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                        aria-label={showPassword ? "Masquer" : "Afficher"}>
                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}>
                    {loading ? (
                      <><svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
                        <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>Connexion en cours…</>
                    ) : (
                      <>Se connecter <FiArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                <div className="card-footer">
                  <span>Pas encore de compte ?</span>
                  <button onClick={() => navigate("/creer-election")} className="footer-link">
                    Créer une élection
                  </button>
                </div>
              </motion.div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

  :root {
    --indigo-50:  #eef2ff; --indigo-100: #e0e7ff; --indigo-200: #c7d2fe;
    --indigo-400: #818cf8; --indigo-500: #6366f1; --indigo-600: #4f46e5;
    --indigo-700: #4338ca; --indigo-900: #1e1b4b;
    --white: #ffffff; --gray-400: #9ca3af; --gray-500: #6b7280;
    --gray-700: #374151; --red-50: #fef2f2; --red-700: #b91c1c;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .login-root { min-height: 100vh; display: flex; flex-direction: column; font-family: 'Outfit', sans-serif; }

  /* ===== NAVBAR ===== */
  .top-nav { width: 100%; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(99,102,241,0.12); box-shadow: 0 1px 16px rgba(0,0,0,0.05); z-index: 50; flex-shrink: 0; }
  .top-nav-inner { max-width: 1300px; margin: 0 auto; padding: 0 32px; height: 62px; display: flex; align-items: center; justify-content: space-between; }
  .top-nav-logo { display: flex; align-items: center; gap: 9px; background: none; border: none; cursor: pointer; }
  .top-nav-logo-icon { font-size: 20px; }
  .top-nav-logo-name { font-size: 19px; font-weight: 900; color: var(--indigo-600); letter-spacing: -0.5px; }
  .top-nav-links { display: flex; align-items: center; gap: 8px; }
  .top-nav-link { display: flex; align-items: center; gap: 7px; padding: 8px 16px; border: none; border-radius: 9px; background: transparent; color: var(--gray-500); font-size: 13.5px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; transition: background .15s, color .15s, transform .15s; }
  .top-nav-link:hover { background: var(--indigo-50); color: var(--indigo-600); transform: translateY(-1px); }
  .top-nav-link--cta { background: var(--indigo-600); color: white; box-shadow: 0 4px 12px rgba(79,70,229,0.25); }
  .top-nav-link--cta:hover { background: var(--indigo-700); color: white; }

  /* ===== BODY ===== */
  .login-body { flex: 1; display: flex; min-height: 0; }

  /* ===== GAUCHE — bleu clair ===== */
  .bg-left {
    flex: 0 0 46%;
    background: linear-gradient(150deg, #60a5fa 0%, #3b82f6 45%, #6366f1 100%);
    position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .bg-circle { position: absolute; border-radius: 50%; pointer-events: none; }
  .bg-circle-1 { width: 500px; height: 500px; background: rgba(255,255,255,0.15); top: -170px; right: -170px; border: 1px solid rgba(255,255,255,0.20); }
  .bg-circle-2 { width: 280px; height: 280px; background: rgba(255,255,255,0.10); bottom: -90px; left: -70px; border: 1px solid rgba(255,255,255,0.15); }
  .bg-dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px); background-size: 26px 26px; pointer-events: none; }
  .bg-left-content { position: relative; z-index: 1; padding: 48px; max-width: 420px; width: 100%; }
  .brand-mark { display: flex; align-items: center; gap: 10px; margin-bottom: 56px; }
  .brand-icon { font-size: 26px; }
  .brand-name { font-size: 21px; font-weight: 800; color: white; letter-spacing: -0.5px; }
  .left-copy { margin-bottom: 40px; }
  .left-title { font-size: 34px; font-weight: 900; color: white; line-height: 1.18; letter-spacing: -1px; margin-bottom: 14px; }
  .left-title-accent { color: #fef08a; }
  .left-desc { font-size: 14px; color: rgba(255,255,255,0.88); line-height: 1.7; }
  .left-features { display: flex; flex-direction: column; gap: 11px; }
  .left-feature-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.32); border-radius: 12px; }
  .left-feature-icon { font-size: 16px; flex-shrink: 0; }
  .left-feature-label { font-size: 13.5px; font-weight: 500; color: white; }

  /* ===== DROIT ===== */
  .bg-right { flex: 1; background: #eef2ff; display: flex; flex-direction: column; }
  .login-main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; }

  /* ===== CARTE ===== */
  .login-card { background: white; border: 1px solid #d4d8f0; border-radius: 24px; padding: 48px 44px; width: 100%; max-width: 440px; box-shadow: 0 0 0 1px rgba(99,102,241,0.06), 0 8px 24px rgba(79,70,229,0.10), 0 32px 64px rgba(79,70,229,0.08); }
  .card-header { text-align: center; margin-bottom: 32px; }
  .card-logo { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; }
  .card-logo-icon { width: 40px; height: 40px; background: var(--indigo-600); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .card-logo-name { font-size: 22px; font-weight: 900; color: var(--indigo-600); letter-spacing: -0.5px; }
  .card-badge { display: inline-flex; align-items: center; gap: 7px; background: var(--indigo-50); color: var(--indigo-600); border: 1px solid var(--indigo-100); border-radius: 999px; padding: 4px 14px; font-size: 11.5px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; margin-bottom: 14px; }
  .badge-pulse { display: inline-block; width: 6px; height: 6px; background: var(--indigo-500); border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(0.8); } }
  .card-title { font-size: 28px; font-weight: 800; color: var(--indigo-900); letter-spacing: -0.6px; margin-bottom: 8px; }
  .card-subtitle { font-size: 14px; color: var(--gray-500); line-height: 1.5; }

  .error-box { display: flex; align-items: center; gap: 8px; background: var(--red-50); border: 1px solid #fecaca; color: var(--red-700); border-radius: 10px; padding: 11px 14px; font-size: 13px; font-weight: 500; margin-bottom: 22px; }

  .card-form { display: flex; flex-direction: column; gap: 20px; }
  .field-wrap { display: flex; flex-direction: column; gap: 7px; }
  .field-label { font-size: 13px; font-weight: 700; color: #1e293b; letter-spacing: .2px; }
  .field-inner { position: relative; display: flex; align-items: center; }
  .field-icon { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; transition: color .2s; }
  .field-wrap--focused .field-icon { color: var(--indigo-500); }
  .field-input { width: 100%; padding: 13px 16px 13px 44px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: 'Outfit', sans-serif; color: #0f172a; background: #f8fafc; outline: none; transition: border-color .2s, box-shadow .2s, background .2s; }
  .field-input--has-toggle { padding-right: 48px; }
  .field-input::placeholder { color: #cbd5e1; }
  .field-input:focus { border-color: var(--indigo-500); box-shadow: 0 0 0 4px rgba(99,102,241,0.12); background: white; }
  .field-wrap--focused .field-input { border-color: var(--indigo-500); background: white; }
  .pwd-toggle { position: absolute; right: 14px; background: none; border: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 6px; transition: color .2s, background .15s; }
  .pwd-toggle:hover { color: var(--indigo-500); background: var(--indigo-50); }

  .submit-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 15px; background: var(--indigo-600); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; font-family: 'Outfit', sans-serif; cursor: pointer; margin-top: 4px; transition: background .2s, transform .15s, box-shadow .2s; box-shadow: 0 4px 16px rgba(79,70,229,0.32); letter-spacing: -0.1px; }
  .submit-btn:hover:not(:disabled) { background: var(--indigo-700); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(79,70,229,0.40); }
  .submit-btn:active:not(:disabled) { transform: translateY(0); }
  .submit-btn--loading { opacity: .8; cursor: not-allowed; }
  .btn-spinner { width: 17px; height: 17px; animation: spin .7s linear infinite; flex-shrink: 0; }
  .spinner-track { opacity: .25; }
  .spinner-head  { opacity: .85; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .card-footer { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f0f0f0; font-size: 13px; color: var(--gray-400); }
  .footer-link { background: none; border: none; color: var(--indigo-600); font-weight: 600; font-size: 13px; font-family: 'Outfit', sans-serif; cursor: pointer; padding: 0; transition: color .15s; }
  .footer-link:hover { color: var(--indigo-700); text-decoration: underline; }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 860px) {
    .bg-left { display: none; }
    .bg-right { background: #eef2ff; }
    .login-main { padding: 32px 20px; }
    .login-card { padding: 36px 28px; }
    .top-nav-inner { padding: 0 20px; }
  }
  @media (max-width: 480px) {
    .login-card { padding: 28px 20px; }
    .card-title { font-size: 24px; }
    .field-input { font-size: 14px; padding: 12px 14px 12px 42px; }
    .field-input--has-toggle { padding-right: 44px; }
    .top-nav-link span { display: none; }
    .top-nav-link { padding: 8px 12px; }
  }
`;






































// // src/pages/auth/Login.jsx
// import { motion } from "framer-motion";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { FiMail, FiLock, FiAlertCircle, FiArrowRight, FiEye, FiEyeOff, FiHome, FiPlusCircle } from "react-icons/fi";
// import api from "../../services/api";

// export default function Login() {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [motDePasse, setMotDePasse] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [focused, setFocused] = useState(null);
//   const [showPassword, setShowPassword] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       const res = await api.post("/auth/login", { email, mot_de_passe: motDePasse });

//       const { token, role, id, nom, prenom, email: userEmail } = res.data;

//       if (!token || !role) {
//         setError("Erreur : token ou rôle manquant dans la réponse du serveur");
//         setLoading(false);
//         return;
//       }

//       // ✅ Stockage individuel de chaque champ pour un accès direct dans tous les composants
//       localStorage.setItem("token",  token);
//       localStorage.setItem("id",     id);
//       localStorage.setItem("role",   role);
//       localStorage.setItem("nom",    nom    || "");
//       localStorage.setItem("prenom", prenom || "");
//       localStorage.setItem("email",  userEmail || email);

//       // Redirection selon le rôle
//       const normalizedRole = role.toUpperCase();
//       switch (normalizedRole) {
//         case "SUPER_ADMIN":    navigate("/superAdminDashboard");    break;
//         case "ADMIN_ELECTION": navigate("/adminElectionDashboard"); break;
//         case "ELECTEUR":       navigate("/DashboardElecteur");      break;
//         default:               setError("Rôle inconnu : " + role);
//       }
//     } catch (err) {
//       console.error("Erreur lors de la connexion:", err);
//       setError(err.response?.data?.message || "Erreur de connexion. Veuillez réessayer.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <style>{styles}</style>
//       <div className="login-root">

//         {/* ===== NAVBAR ===== */}
//         <nav className="top-nav">
//           <div className="top-nav-inner">
//             <button onClick={() => navigate("/")} className="top-nav-logo">
//               <span className="top-nav-logo-icon">🗳</span>
//               <span className="top-nav-logo-name">EVote</span>
//             </button>
//             <div className="top-nav-links">
//               <button onClick={() => navigate("/")} className="top-nav-link">
//                 <FiHome size={14} />
//                 <span>Accueil</span>
//               </button>
//               <button onClick={() => navigate("/creer-election")} className="top-nav-link top-nav-link--cta">
//                 <FiPlusCircle size={14} />
//                 <span>Créer une élection</span>
//               </button>
//             </div>
//           </div>
//         </nav>

//         {/* ===== BODY SPLIT ===== */}
//         <div className="login-body">

//           {/* ===== PANNEAU GAUCHE ===== */}
//           <div className="bg-left">
//             <div className="bg-circle bg-circle-1" />
//             <div className="bg-circle bg-circle-2" />
//             <div className="bg-dots" />
//             <div className="bg-left-content">
//               <div className="brand-mark">
//                 <span className="brand-icon">🗳</span>
//                 <span className="brand-name">EVote</span>
//               </div>
//               <div className="left-copy">
//                 <h1 className="left-title">
//                   Le vote électronique<br />
//                   <span className="left-title-accent">simple et sécurisé</span>
//                 </h1>
//                 <p className="left-desc">
//                   Organisez et participez à vos élections en toute transparence, depuis n'importe quel appareil.
//                 </p>
//               </div>
//               <div className="left-features">
//                 {[
//                   { icon: "🔒", label: "Chiffrement bout en bout" },
//                   { icon: "⚡", label: "Résultats en temps réel" },
//                   { icon: "✅", label: "Zéro fraude possible" },
//                 ].map((f, i) => (
//                   <div key={i} className="left-feature-item">
//                     <span className="left-feature-icon">{f.icon}</span>
//                     <span className="left-feature-label">{f.label}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* ===== PANNEAU DROIT ===== */}
//           <div className="bg-right">
//             <main className="login-main">
//               <motion.div
//                 initial={{ opacity: 0, y: 28 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
//                 className="login-card"
//               >
//                 <div className="card-header">
//                   <div className="card-logo">
//                     <div className="card-logo-icon">🗳</div>
//                     <span className="card-logo-name">EVote</span>
//                   </div>
//                   <div className="card-badge">
//                     <span className="badge-pulse" />
//                     Espace sécurisé
//                   </div>
//                   <h2 className="card-title">Connexion</h2>
//                   <p className="card-subtitle">Accédez à votre espace de vote en toute sécurité</p>
//                 </div>

//                 {error && (
//                   <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="error-box">
//                     <FiAlertCircle size={15} />
//                     <span>{error}</span>
//                   </motion.div>
//                 )}

//                 <form onSubmit={handleSubmit} className="card-form">

//                   {/* Email */}
//                   <div className={`field-wrap ${focused === "email" ? "field-wrap--focused" : ""}`}>
//                     <label className="field-label">Adresse e-mail</label>
//                     <div className="field-inner">
//                       <FiMail size={16} className="field-icon" />
//                       <input
//                         type="email" required placeholder="exemple@email.com"
//                         value={email} onChange={(e) => setEmail(e.target.value)}
//                         onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
//                         className="field-input"
//                       />
//                     </div>
//                   </div>

//                   {/* Mot de passe + toggle */}
//                   <div className={`field-wrap ${focused === "password" ? "field-wrap--focused" : ""}`}>
//                     <label className="field-label">Mot de passe</label>
//                     <div className="field-inner">
//                       <FiLock size={16} className="field-icon" />
//                       <input
//                         type={showPassword ? "text" : "password"}
//                         required placeholder="••••••••"
//                         value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
//                         onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
//                         className="field-input field-input--has-toggle"
//                       />
//                       <button
//                         type="button"
//                         className="pwd-toggle"
//                         onClick={() => setShowPassword(!showPassword)}
//                         tabIndex={-1}
//                         aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
//                       >
//                         {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
//                       </button>
//                     </div>
//                   </div>

//                   <button type="submit" disabled={loading} className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}>
//                     {loading ? (
//                       <>
//                         <svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
//                           <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
//                           <path className="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
//                         </svg>
//                         Connexion en cours…
//                       </>
//                     ) : (
//                       <>Se connecter <FiArrowRight size={16} /></>
//                     )}
//                   </button>
//                 </form>

//                 <div className="card-footer">
//                   <span>Pas encore de compte ?</span>
//                   <button onClick={() => navigate("/creer-election")} className="footer-link">
//                     Créer une élection
//                   </button>
//                 </div>
//               </motion.div>
//             </main>
//           </div>

//         </div>
//       </div>
//     </>
//   );
// }

// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

//   :root {
//     --indigo-50:  #eef2ff; --indigo-100: #e0e7ff; --indigo-200: #c7d2fe;
//     --indigo-400: #818cf8; --indigo-500: #6366f1; --indigo-600: #4f46e5;
//     --indigo-700: #4338ca; --indigo-900: #1e1b4b;
//     --white: #ffffff; --gray-400: #9ca3af; --gray-500: #6b7280;
//     --gray-700: #374151; --red-50: #fef2f2; --red-700: #b91c1c;
//   }

//   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//   .login-root {
//     min-height: 100vh;
//     display: flex;
//     flex-direction: column;
//     font-family: 'Outfit', sans-serif;
//   }

//   /* ===== NAVBAR ===== */
//   .top-nav {
//     width: 100%;
//     background: rgba(255,255,255,0.97);
//     backdrop-filter: blur(12px);
//     border-bottom: 1px solid rgba(99,102,241,0.12);
//     box-shadow: 0 1px 16px rgba(0,0,0,0.05);
//     z-index: 50;
//     flex-shrink: 0;
//   }
//   .top-nav-inner {
//     max-width: 1300px; margin: 0 auto;
//     padding: 0 32px; height: 62px;
//     display: flex; align-items: center; justify-content: space-between;
//   }
//   .top-nav-logo {
//     display: flex; align-items: center; gap: 9px;
//     background: none; border: none; cursor: pointer;
//   }
//   .top-nav-logo-icon { font-size: 20px; }
//   .top-nav-logo-name {
//     font-size: 19px; font-weight: 900;
//     color: var(--indigo-600); letter-spacing: -0.5px;
//   }
//   .top-nav-links { display: flex; align-items: center; gap: 8px; }
//   .top-nav-link {
//     display: flex; align-items: center; gap: 7px;
//     padding: 8px 16px; border: none; border-radius: 9px;
//     background: transparent; color: var(--gray-500);
//     font-size: 13.5px; font-weight: 600;
//     font-family: 'Outfit', sans-serif; cursor: pointer;
//     transition: background .15s, color .15s, transform .15s;
//   }
//   .top-nav-link:hover { background: var(--indigo-50); color: var(--indigo-600); transform: translateY(-1px); }
//   .top-nav-link--cta {
//     background: var(--indigo-600); color: white;
//     box-shadow: 0 4px 12px rgba(79,70,229,0.25);
//   }
//   .top-nav-link--cta:hover { background: var(--indigo-700); color: white; }

//   /* ===== BODY ===== */
//   .login-body { flex: 1; display: flex; min-height: 0; }

//   /* ===== GAUCHE ===== */
//   .bg-left {
//     flex: 0 0 46%;
//     background: linear-gradient(150deg, var(--indigo-900) 0%, #2d1f6e 45%, var(--indigo-700) 100%);
//     position: relative; overflow: hidden;
//     display: flex; align-items: center; justify-content: center;
//   }
//   .bg-circle { position: absolute; border-radius: 50%; pointer-events: none; }
//   .bg-circle-1 {
//     width: 500px; height: 500px; background: rgba(99,102,241,0.20);
//     top: -170px; right: -170px; border: 1px solid rgba(255,255,255,0.07);
//   }
//   .bg-circle-2 {
//     width: 280px; height: 280px; background: rgba(99,102,241,0.14);
//     bottom: -90px; left: -70px; border: 1px solid rgba(255,255,255,0.05);
//   }
//   .bg-dots {
//     position: absolute; inset: 0;
//     background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
//     background-size: 26px 26px; pointer-events: none;
//   }
//   .bg-left-content { position: relative; z-index: 1; padding: 48px; max-width: 420px; width: 100%; }
//   .brand-mark { display: flex; align-items: center; gap: 10px; margin-bottom: 56px; }
//   .brand-icon { font-size: 26px; }
//   .brand-name { font-size: 21px; font-weight: 800; color: white; letter-spacing: -0.5px; }
//   .left-copy { margin-bottom: 40px; }
//   .left-title { font-size: 34px; font-weight: 900; color: white; line-height: 1.18; letter-spacing: -1px; margin-bottom: 14px; }
//   .left-title-accent { color: #a5b4fc; }
//   .left-desc { font-size: 14px; color: rgba(255,255,255,0.58); line-height: 1.7; }
//   .left-features { display: flex; flex-direction: column; gap: 11px; }
//   .left-feature-item {
//     display: flex; align-items: center; gap: 12px; padding: 12px 16px;
//     background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.10); border-radius: 12px;
//   }
//   .left-feature-icon { font-size: 16px; flex-shrink: 0; }
//   .left-feature-label { font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.82); }

//   /* ===== DROIT ===== */
//   .bg-right { flex: 1; background: #eef2ff; display: flex; flex-direction: column; }
//   .login-main {
//     flex: 1; display: flex; flex-direction: column;
//     align-items: center; justify-content: center; padding: 40px 24px;
//   }

//   /* ===== CARTE ===== */
//   .login-card {
//     background: white; border: 1px solid #d4d8f0; border-radius: 24px;
//     padding: 48px 44px; width: 100%; max-width: 440px;
//     box-shadow: 0 0 0 1px rgba(99,102,241,0.06), 0 8px 24px rgba(79,70,229,0.10), 0 32px 64px rgba(79,70,229,0.08);
//   }
//   .card-header { text-align: center; margin-bottom: 32px; }
//   .card-logo { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; }
//   .card-logo-icon {
//     width: 40px; height: 40px; background: var(--indigo-600); border-radius: 10px;
//     display: flex; align-items: center; justify-content: center; font-size: 20px;
//   }
//   .card-logo-name { font-size: 22px; font-weight: 900; color: var(--indigo-600); letter-spacing: -0.5px; }
//   .card-badge {
//     display: inline-flex; align-items: center; gap: 7px;
//     background: var(--indigo-50); color: var(--indigo-600);
//     border: 1px solid var(--indigo-100); border-radius: 999px;
//     padding: 4px 14px; font-size: 11.5px; font-weight: 600;
//     letter-spacing: .5px; text-transform: uppercase; margin-bottom: 14px;
//   }
//   .badge-pulse {
//     display: inline-block; width: 6px; height: 6px;
//     background: var(--indigo-500); border-radius: 50%;
//     animation: pulse 2s ease-in-out infinite;
//   }
//   @keyframes pulse {
//     0%, 100% { opacity: 1; transform: scale(1); }
//     50%       { opacity: .5; transform: scale(0.8); }
//   }
//   .card-title { font-size: 28px; font-weight: 800; color: var(--indigo-900); letter-spacing: -0.6px; margin-bottom: 8px; }
//   .card-subtitle { font-size: 14px; color: var(--gray-500); line-height: 1.5; }

//   .error-box {
//     display: flex; align-items: center; gap: 8px;
//     background: var(--red-50); border: 1px solid #fecaca; color: var(--red-700);
//     border-radius: 10px; padding: 11px 14px; font-size: 13px; font-weight: 500; margin-bottom: 22px;
//   }

//   .card-form { display: flex; flex-direction: column; gap: 20px; }
//   .field-wrap { display: flex; flex-direction: column; gap: 7px; }
//   .field-label { font-size: 13px; font-weight: 700; color: #1e293b; letter-spacing: .2px; }
//   .field-inner { position: relative; display: flex; align-items: center; }
//   .field-icon { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; transition: color .2s; }
//   .field-wrap--focused .field-icon { color: var(--indigo-500); }

//   .field-input {
//     width: 100%; padding: 13px 16px 13px 44px;
//     border: 2px solid #e2e8f0; border-radius: 12px;
//     font-size: 15px; font-family: 'Outfit', sans-serif;
//     color: #0f172a; background: #f8fafc; outline: none;
//     transition: border-color .2s, box-shadow .2s, background .2s;
//   }
//   .field-input--has-toggle { padding-right: 48px; }
//   .field-input::placeholder { color: #cbd5e1; }
//   .field-input:focus {
//     border-color: var(--indigo-500);
//     box-shadow: 0 0 0 4px rgba(99,102,241,0.12);
//     background: white;
//   }
//   .field-wrap--focused .field-input { border-color: var(--indigo-500); background: white; }

//   /* Toggle mot de passe */
//   .pwd-toggle {
//     position: absolute; right: 14px;
//     background: none; border: none; color: #94a3b8;
//     cursor: pointer; display: flex; align-items: center; justify-content: center;
//     padding: 4px; border-radius: 6px;
//     transition: color .2s, background .15s;
//   }
//   .pwd-toggle:hover { color: var(--indigo-500); background: var(--indigo-50); }

//   .submit-btn {
//     display: flex; align-items: center; justify-content: center; gap: 8px;
//     width: 100%; padding: 15px; background: var(--indigo-600); color: white; border: none;
//     border-radius: 12px; font-size: 16px; font-weight: 700;
//     font-family: 'Outfit', sans-serif; cursor: pointer; margin-top: 4px;
//     transition: background .2s, transform .15s, box-shadow .2s;
//     box-shadow: 0 4px 16px rgba(79,70,229,0.32); letter-spacing: -0.1px;
//   }
//   .submit-btn:hover:not(:disabled) { background: var(--indigo-700); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(79,70,229,0.40); }
//   .submit-btn:active:not(:disabled) { transform: translateY(0); }
//   .submit-btn--loading { opacity: .8; cursor: not-allowed; }

//   .btn-spinner { width: 17px; height: 17px; animation: spin .7s linear infinite; flex-shrink: 0; }
//   .spinner-track { opacity: .25; }
//   .spinner-head  { opacity: .85; }
//   @keyframes spin { to { transform: rotate(360deg); } }

//   .card-footer {
//     display: flex; align-items: center; justify-content: center; gap: 6px;
//     margin-top: 24px; padding-top: 20px; border-top: 1px solid #f0f0f0;
//     font-size: 13px; color: var(--gray-400);
//   }
//   .footer-link {
//     background: none; border: none; color: var(--indigo-600);
//     font-weight: 600; font-size: 13px; font-family: 'Outfit', sans-serif;
//     cursor: pointer; padding: 0; transition: color .15s;
//   }
//   .footer-link:hover { color: var(--indigo-700); text-decoration: underline; }

//   /* ===== RESPONSIVE ===== */
//   @media (max-width: 860px) {
//     .bg-left { display: none; }
//     .bg-right { background: #eef2ff; }
//     .login-main { padding: 32px 20px; }
//     .login-card { padding: 36px 28px; }
//     .top-nav-inner { padding: 0 20px; }
//   }
//   @media (max-width: 480px) {
//     .login-card { padding: 28px 20px; }
//     .card-title { font-size: 24px; }
//     .field-input { font-size: 14px; padding: 12px 14px 12px 42px; }
//     .field-input--has-toggle { padding-right: 44px; }
//     .top-nav-link span { display: none; }
//     .top-nav-link { padding: 8px 12px; }
//   }
// `;


