// src/pages/auth/Login.jsx
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import api from "../../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, mot_de_passe: motDePasse });

      console.log("Réponse login:", res.data);
      console.log("✅ Réponse complète:", res.data);
console.log("✅ id:", res.data.id);
console.log("✅ role:", res.data.role);
console.log("✅ token:", res.data.token);

      const { token, role, id, nom, prenom } = res.data;

      if (!token || !role) {
        setError("Erreur : token ou rôle manquant dans la réponse du serveur");
        setLoading(false);
        return;
      }

      // ✅ Sauvegarde du token
      localStorage.setItem("token", token);

      // ✅ Sauvegarde de l'objet user complet
      localStorage.setItem("user", JSON.stringify({
        id,
        nom,
        prenom,
        email,
        role,
      }));

      const normalizedRole = role.toUpperCase();

      switch (normalizedRole) {
        case "SUPER_ADMIN":
          navigate("/superAdminDashboard");
          break;
        case "ADMIN_ELECTION":
          navigate("/adminElectionDashboard");
          break;
        case "ELECTEUR":
          navigate("/DashboardElecteur");
          break;
        default:
          setError("Rôle inconnu : " + role);
      }
    } catch (err) {
      console.error("Erreur lors de la connexion:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Erreur de connexion. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">

        {/* Décoration de fond */}
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-grid" />

        {/* Navbar sobre */}
        <nav className="login-nav">
          <div className="nav-logo">
            <span className="nav-logo-icon">🗳</span>
            <span className="nav-logo-text">eVote</span>
          </div>
          <div className="nav-links">
            <button onClick={() => navigate("/")} className="nav-cta nav-cta--ghost">
              🏠 Accueil
            </button>
            <button onClick={() => navigate("/creer-election")} className="nav-cta">
              Créer une élection <FiArrowRight size={14} />
            </button>
          </div>
        </nav>

        {/* Carte de connexion */}
        <main className="login-main">
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="login-card"
          >
            {/* En-tête */}
            <div className="card-header">
              <div className="card-badge">Espace sécurisé</div>
              <h2 className="card-title">Connexion</h2>
              <p className="card-subtitle">
                Accédez à votre espace de vote en toute sécurité
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-box"
              >
                <FiAlertCircle size={15} />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="card-form">

              {/* Email */}
              <div className={`field-wrap ${focused === "email" ? "field-wrap--focused" : ""}`}>
                <label className="field-label">Adresse e-mail</label>
                <div className="field-inner">
                  <FiMail size={16} className="field-icon" />
                  <input
                    type="email"
                    required
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    className="field-input"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className={`field-wrap ${focused === "password" ? "field-wrap--focused" : ""}`}>
                <label className="field-label">Mot de passe</label>
                <div className="field-inner">
                  <FiLock size={16} className="field-icon" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    className="field-input"
                  />
                </div>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}
              >
                {loading ? (
                  <>
                    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
                      <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Connexion en cours…
                  </>
                ) : (
                  <>Se connecter <FiArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Pied de carte */}
            <div className="card-footer">
              <span>Pas encore de compte ?</span>
              <button onClick={() => navigate("/creer-election")} className="footer-link">
                Créer une élection
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  :root {
    --indigo-50:  #eef2ff;
    --indigo-100: #e0e7ff;
    --indigo-200: #c7d2fe;
    --indigo-400: #818cf8;
    --indigo-500: #6366f1;
    --indigo-600: #4f46e5;
    --indigo-700: #4338ca;
    --indigo-900: #1e1b4b;
    --blue-50:    #eff6ff;
    --white:      #ffffff;
    --gray-400:   #9ca3af;
    --gray-500:   #6b7280;
    --gray-700:   #374151;
    --red-50:     #fef2f2;
    --red-500:    #ef4444;
    --red-700:    #b91c1c;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .login-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #eef2ff 0%, #f8f9ff 50%, #eff6ff 100%);
    font-family: 'Outfit', sans-serif;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
  }
  .bg-orb-1 {
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%);
    top: -160px; left: -160px;
  }
  .bg-orb-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%);
    bottom: -120px; right: -100px;
  }

  .bg-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    z-index: 0;
    pointer-events: none;
  }

  .login-nav {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 40px;
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(99,102,241,0.10);
  }

  .nav-logo { display: flex; align-items: center; gap: 10px; }
  .nav-logo-icon { font-size: 22px; }
  .nav-logo-text {
    font-size: 20px;
    font-weight: 800;
    color: var(--indigo-700);
    letter-spacing: -0.5px;
  }

  .nav-links { display: flex; align-items: center; gap: 10px; }

  .nav-cta {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 20px;
    background: var(--indigo-600);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: background .18s, transform .15s, box-shadow .18s;
    box-shadow: 0 4px 12px rgba(79,70,229,0.25);
  }
  .nav-cta:hover {
    background: var(--indigo-700);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(79,70,229,0.32);
  }
  .nav-cta--ghost {
    background: transparent;
    color: var(--indigo-600);
    border: 1.5px solid var(--indigo-200);
    box-shadow: none;
  }
  .nav-cta--ghost:hover {
    background: var(--indigo-50);
    border-color: var(--indigo-300);
    box-shadow: none;
    transform: translateY(-1px);
  }

  .login-main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    position: relative;
    z-index: 1;
  }

  .login-card {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(99,102,241,0.14);
    border-radius: 24px;
    padding: 44px 40px;
    width: 100%;
    max-width: 420px;
    box-shadow:
      0 4px 6px rgba(0,0,0,0.03),
      0 20px 60px rgba(79,70,229,0.10),
      0 1px 0 rgba(255,255,255,0.8) inset;
  }

  .card-header { text-align: center; margin-bottom: 28px; }

  .card-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--indigo-50);
    color: var(--indigo-600);
    border: 1px solid var(--indigo-100);
    border-radius: 999px;
    padding: 4px 14px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: .5px;
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .card-badge::before {
    content: '';
    display: inline-block;
    width: 6px; height: 6px;
    background: var(--indigo-500);
    border-radius: 50%;
  }

  .card-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--indigo-900);
    letter-spacing: -0.6px;
    margin-bottom: 8px;
  }
  .card-subtitle {
    font-size: 14px;
    color: var(--gray-500);
    line-height: 1.5;
  }

  .error-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--red-50);
    border: 1px solid #fecaca;
    color: var(--red-700);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13.5px;
    font-weight: 500;
    margin-bottom: 20px;
  }

  .card-form { display: flex; flex-direction: column; gap: 18px; }

  .field-wrap { display: flex; flex-direction: column; gap: 6px; }
  .field-label {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--gray-700);
    letter-spacing: .3px;
  }
  .field-inner { position: relative; display: flex; align-items: center; }
  .field-icon {
    position: absolute;
    left: 14px;
    color: var(--gray-400);
    pointer-events: none;
    transition: color .2s;
  }
  .field-wrap--focused .field-icon { color: var(--indigo-500); }

  .field-input {
    width: 100%;
    padding: 12px 14px 12px 42px;
    border: 1.5px solid #e5e7eb;
    border-radius: 11px;
    font-size: 14.5px;
    font-family: 'Outfit', sans-serif;
    color: var(--gray-700);
    background: #fafafa;
    outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }
  .field-input::placeholder { color: #d1d5db; }
  .field-input:focus {
    border-color: var(--indigo-400);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    background: white;
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px;
    background: var(--indigo-600);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    margin-top: 4px;
    transition: background .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 4px 14px rgba(79,70,229,0.30);
    letter-spacing: -0.1px;
  }
  .submit-btn:hover:not(:disabled) {
    background: var(--indigo-700);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(79,70,229,0.38);
  }
  .submit-btn:active:not(:disabled) { transform: translateY(0); }
  .submit-btn--loading { opacity: .8; cursor: not-allowed; }

  .btn-spinner {
    width: 17px; height: 17px;
    animation: spin .7s linear infinite;
    flex-shrink: 0;
  }
  .spinner-track { opacity: .25; }
  .spinner-head  { opacity: .85; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
    font-size: 13.5px;
    color: var(--gray-400);
  }
  .footer-link {
    background: none;
    border: none;
    color: var(--indigo-600);
    font-weight: 600;
    font-size: 13.5px;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    padding: 0;
    transition: color .15s;
  }
  .footer-link:hover { color: var(--indigo-700); text-decoration: underline; }

  @media (max-width: 480px) {
    .login-nav  { padding: 16px 20px; }
    .login-card { padding: 32px 24px; }
  }
`;













































// // src/pages/auth/Login.jsx
// import { motion } from "framer-motion";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { FiMail, FiLock, FiAlertCircle, FiArrowRight } from "react-icons/fi";
// import api from "../../services/api";

// export default function Login() {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [motDePasse, setMotDePasse] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [focused, setFocused] = useState(null);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const res = await api.post("/auth/login", { email, mot_de_passe: motDePasse });

//       console.log("Réponse login:", res.data);

//       const { token, role } = res.data;

//       if (!token || !role) {
//         setError("Erreur : token ou rôle manquant dans la réponse du serveur");
//         setLoading(false);
//         return;
//       }

//       localStorage.setItem("token", token);

//       const normalizedRole = role.toUpperCase();

//       switch (normalizedRole) {
//         case "SUPER_ADMIN":
//           navigate("/superAdminDashboard");
//           break;
//         case "ADMIN_ELECTION":
//           navigate("/adminElectionDashboard");
//           break;
//         case "ELECTEUR":
//           navigate("/DashboardElecteur");
//           break;
//         default:
//           setError("Rôle inconnu : " + role);
//       }
//     } catch (err) {
//       console.error("Erreur lors de la connexion:", err);
//       if (err.response?.data?.message) {
//         setError(err.response.data.message);
//       } else {
//         setError("Erreur de connexion. Veuillez réessayer.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <style>{styles}</style>
//       <div className="login-root">

//         {/* Décoration de fond */}
//         <div className="bg-orb bg-orb-1" />
//         <div className="bg-orb bg-orb-2" />
//         <div className="bg-grid" />

//         {/* Navbar sobre */}
//         <nav className="login-nav">
//           <div className="nav-logo">
//             <span className="nav-logo-icon">🗳</span>
//             <span className="nav-logo-text">eVote</span>
//           </div>
//           <div className="nav-links">
//             <button onClick={() => navigate("/")} className="nav-cta nav-cta--ghost">
//               🏠 Accueil
//             </button>
//             <button onClick={() => navigate("/creer-election")} className="nav-cta">
//               Créer une élection <FiArrowRight size={14} />
//             </button>
//           </div>
//         </nav>

//         {/* Carte de connexion */}
//         <main className="login-main">
//           <motion.div
//             initial={{ opacity: 0, y: 32, scale: 0.98 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
//             className="login-card"
//           >
//             {/* En-tête */}
//             <div className="card-header">
//               <div className="card-badge">Espace sécurisé</div>
//               <h2 className="card-title">Connexion</h2>
//               <p className="card-subtitle">
//                 Accédez à votre espace de vote en toute sécurité
//               </p>
//             </div>

//             {/* Message d'erreur */}
//             {error && (
//               <motion.div
//                 initial={{ opacity: 0, y: -8 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="error-box"
//               >
//                 <FiAlertCircle size={15} />
//                 <span>{error}</span>
//               </motion.div>
//             )}

//             {/* Formulaire */}
//             <form onSubmit={handleSubmit} className="card-form">

//               {/* Email */}
//               <div className={`field-wrap ${focused === "email" ? "field-wrap--focused" : ""}`}>
//                 <label className="field-label">Adresse e-mail</label>
//                 <div className="field-inner">
//                   <FiMail size={16} className="field-icon" />
//                   <input
//                     type="email"
//                     required
//                     placeholder="exemple@email.com"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     onFocus={() => setFocused("email")}
//                     onBlur={() => setFocused(null)}
//                     className="field-input"
//                   />
//                 </div>
//               </div>

//               {/* Mot de passe */}
//               <div className={`field-wrap ${focused === "password" ? "field-wrap--focused" : ""}`}>
//                 <label className="field-label">Mot de passe</label>
//                 <div className="field-inner">
//                   <FiLock size={16} className="field-icon" />
//                   <input
//                     type="password"
//                     required
//                     placeholder="••••••••"
//                     value={motDePasse}
//                     onChange={(e) => setMotDePasse(e.target.value)}
//                     onFocus={() => setFocused("password")}
//                     onBlur={() => setFocused(null)}
//                     className="field-input"
//                   />
//                 </div>
//               </div>

//               {/* Bouton */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className={`submit-btn ${loading ? "submit-btn--loading" : ""}`}
//               >
//                 {loading ? (
//                   <>
//                     <svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
//                       <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
//                       <path className="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
//                     </svg>
//                     Connexion en cours…
//                   </>
//                 ) : (
//                   <>Se connecter <FiArrowRight size={16} /></>
//                 )}
//               </button>
//             </form>

//             {/* Pied de carte */}
//             <div className="card-footer">
//               <span>Pas encore de compte ?</span>
//               <button onClick={() => navigate("/creer-election")} className="footer-link">
//                 Créer une élection
//               </button>
//             </div>
//           </motion.div>
//         </main>
//       </div>
//     </>
//   );
// }

// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

//   :root {
//     --indigo-50:  #eef2ff;
//     --indigo-100: #e0e7ff;
//     --indigo-200: #c7d2fe;
//     --indigo-400: #818cf8;
//     --indigo-500: #6366f1;
//     --indigo-600: #4f46e5;
//     --indigo-700: #4338ca;
//     --indigo-900: #1e1b4b;
//     --blue-50:    #eff6ff;
//     --white:      #ffffff;
//     --gray-400:   #9ca3af;
//     --gray-500:   #6b7280;
//     --gray-700:   #374151;
//     --red-50:     #fef2f2;
//     --red-500:    #ef4444;
//     --red-700:    #b91c1c;
//   }

//   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//   .login-root {
//     min-height: 100vh;
//     background: linear-gradient(135deg, #eef2ff 0%, #f8f9ff 50%, #eff6ff 100%);
//     font-family: 'Outfit', sans-serif;
//     position: relative;
//     overflow: hidden;
//     display: flex;
//     flex-direction: column;
//   }

//   /* Orbs décoratifs */
//   .bg-orb {
//     position: absolute;
//     border-radius: 50%;
//     filter: blur(80px);
//     pointer-events: none;
//     z-index: 0;
//   }
//   .bg-orb-1 {
//     width: 520px; height: 520px;
//     background: radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%);
//     top: -160px; left: -160px;
//   }
//   .bg-orb-2 {
//     width: 400px; height: 400px;
//     background: radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%);
//     bottom: -120px; right: -100px;
//   }

//   /* Grille décorative subtile */
//   .bg-grid {
//     position: absolute;
//     inset: 0;
//     background-image:
//       linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
//       linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
//     background-size: 40px 40px;
//     z-index: 0;
//     pointer-events: none;
//   }

//   /* ---- Navbar ---- */
//   .login-nav {
//     position: relative;
//     z-index: 10;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 20px 40px;
//     background: rgba(255,255,255,0.7);
//     backdrop-filter: blur(12px);
//     border-bottom: 1px solid rgba(99,102,241,0.10);
//   }

//   .nav-logo {
//     display: flex;
//     align-items: center;
//     gap: 10px;
//   }
//   .nav-logo-icon { font-size: 22px; }
//   .nav-logo-text {
//     font-size: 20px;
//     font-weight: 800;
//     color: var(--indigo-700);
//     letter-spacing: -0.5px;
//   }

//   .nav-links { display: flex; align-items: center; gap: 10px; }

//   .nav-cta--ghost {
//     background: transparent;
//     color: var(--indigo-600);
//     border: 1.5px solid var(--indigo-200);
//     box-shadow: none;
//   }
//   .nav-cta--ghost:hover {
//     background: var(--indigo-50);
//     border-color: var(--indigo-300);
//     box-shadow: none;
//     transform: translateY(-1px);
//   }

//   .nav-cta {
//     display: flex;
//     align-items: center;
//     gap: 7px;
//     padding: 9px 20px;
//     background: var(--indigo-600);
//     color: white;
//     border: none;
//     border-radius: 10px;
//     font-size: 13.5px;
//     font-weight: 600;
//     font-family: 'Outfit', sans-serif;
//     cursor: pointer;
//     transition: background .18s, transform .15s, box-shadow .18s;
//     box-shadow: 0 4px 12px rgba(79,70,229,0.25);
//   }
//   .nav-cta:hover {
//     background: var(--indigo-700);
//     transform: translateY(-1px);
//     box-shadow: 0 6px 16px rgba(79,70,229,0.32);
//   }

//   /* ---- Main ---- */
//   .login-main {
//     flex: 1;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     padding: 40px 16px;
//     position: relative;
//     z-index: 1;
//   }

//   /* ---- Card ---- */
//   .login-card {
//     background: rgba(255,255,255,0.92);
//     backdrop-filter: blur(16px);
//     border: 1px solid rgba(99,102,241,0.14);
//     border-radius: 24px;
//     padding: 44px 40px;
//     width: 100%;
//     max-width: 420px;
//     box-shadow:
//       0 4px 6px rgba(0,0,0,0.03),
//       0 20px 60px rgba(79,70,229,0.10),
//       0 1px 0 rgba(255,255,255,0.8) inset;
//   }

//   /* En-tête */
//   .card-header { text-align: center; margin-bottom: 28px; }

//   .card-badge {
//     display: inline-flex;
//     align-items: center;
//     gap: 6px;
//     background: var(--indigo-50);
//     color: var(--indigo-600);
//     border: 1px solid var(--indigo-100);
//     border-radius: 999px;
//     padding: 4px 14px;
//     font-size: 11.5px;
//     font-weight: 600;
//     letter-spacing: .5px;
//     text-transform: uppercase;
//     margin-bottom: 14px;
//   }
//   .card-badge::before {
//     content: '';
//     display: inline-block;
//     width: 6px; height: 6px;
//     background: var(--indigo-500);
//     border-radius: 50%;
//   }

//   .card-title {
//     font-size: 28px;
//     font-weight: 800;
//     color: var(--indigo-900);
//     letter-spacing: -0.6px;
//     margin-bottom: 8px;
//   }
//   .card-subtitle {
//     font-size: 14px;
//     color: var(--gray-500);
//     line-height: 1.5;
//   }

//   /* Erreur */
//   .error-box {
//     display: flex;
//     align-items: center;
//     gap: 8px;
//     background: var(--red-50);
//     border: 1px solid #fecaca;
//     color: var(--red-700);
//     border-radius: 10px;
//     padding: 10px 14px;
//     font-size: 13.5px;
//     font-weight: 500;
//     margin-bottom: 20px;
//   }

//   /* Form */
//   .card-form { display: flex; flex-direction: column; gap: 18px; }

//   .field-wrap {
//     display: flex;
//     flex-direction: column;
//     gap: 6px;
//   }
//   .field-label {
//     font-size: 12.5px;
//     font-weight: 600;
//     color: var(--gray-700);
//     letter-spacing: .3px;
//   }
//   .field-inner {
//     position: relative;
//     display: flex;
//     align-items: center;
//   }
//   .field-icon {
//     position: absolute;
//     left: 14px;
//     color: var(--gray-400);
//     pointer-events: none;
//     transition: color .2s;
//   }
//   .field-wrap--focused .field-icon { color: var(--indigo-500); }

//   .field-input {
//     width: 100%;
//     padding: 12px 14px 12px 42px;
//     border: 1.5px solid #e5e7eb;
//     border-radius: 11px;
//     font-size: 14.5px;
//     font-family: 'Outfit', sans-serif;
//     color: var(--gray-700);
//     background: #fafafa;
//     outline: none;
//     transition: border-color .2s, box-shadow .2s, background .2s;
//   }
//   .field-input::placeholder { color: #d1d5db; }
//   .field-input:focus {
//     border-color: var(--indigo-400);
//     box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
//     background: white;
//   }

//   /* Submit */
//   .submit-btn {
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     gap: 8px;
//     width: 100%;
//     padding: 13px;
//     background: var(--indigo-600);
//     color: white;
//     border: none;
//     border-radius: 12px;
//     font-size: 15px;
//     font-weight: 700;
//     font-family: 'Outfit', sans-serif;
//     cursor: pointer;
//     margin-top: 4px;
//     transition: background .2s, transform .15s, box-shadow .2s;
//     box-shadow: 0 4px 14px rgba(79,70,229,0.30);
//     letter-spacing: -0.1px;
//   }
//   .submit-btn:hover:not(:disabled) {
//     background: var(--indigo-700);
//     transform: translateY(-1px);
//     box-shadow: 0 6px 18px rgba(79,70,229,0.38);
//   }
//   .submit-btn:active:not(:disabled) { transform: translateY(0); }
//   .submit-btn--loading {
//     opacity: .8;
//     cursor: not-allowed;
//   }

//   .btn-spinner {
//     width: 17px; height: 17px;
//     animation: spin .7s linear infinite;
//     flex-shrink: 0;
//   }
//   .spinner-track { opacity: .25; }
//   .spinner-head { opacity: .85; }
//   @keyframes spin { to { transform: rotate(360deg); } }

//   /* Footer */
//   .card-footer {
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     gap: 6px;
//     margin-top: 24px;
//     padding-top: 20px;
//     border-top: 1px solid #f0f0f0;
//     font-size: 13.5px;
//     color: var(--gray-400);
//   }
//   .footer-link {
//     background: none;
//     border: none;
//     color: var(--indigo-600);
//     font-weight: 600;
//     font-size: 13.5px;
//     font-family: 'Outfit', sans-serif;
//     cursor: pointer;
//     padding: 0;
//     transition: color .15s;
//   }
//   .footer-link:hover { color: var(--indigo-700); text-decoration: underline; }

//   @media (max-width: 480px) {
//     .login-nav { padding: 16px 20px; }
//     .login-card { padding: 32px 24px; }
//   }
// `;



























// // src/pages/auth/Login.jsx
// import { motion } from "framer-motion";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../services/api";

// export default function Login() {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [motDePasse, setMotDePasse] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const res = await api.post("/auth/login", { email, mot_de_passe: motDePasse });

//       // DEBUG: vérifier la réponse du backend
//       console.log("Réponse login:", res.data);

//       const { token, role } = res.data;

//       if (!token || !role) {
//         setError("Erreur : token ou rôle manquant dans la réponse du serveur");
//         setLoading(false);
//         return;
//       }

//       // Stocker le token dans localStorage
//       localStorage.setItem("token", token);

//       // Normaliser le rôle en majuscules pour éviter problème de casse
//       const normalizedRole = role.toUpperCase();

//       // Redirection selon rôle
//       switch (normalizedRole) {
//         case "SUPER_ADMIN":
//           navigate("/superAdminDashboard");
//           break;
//         case "ADMIN_ELECTION":
//           navigate("/adminElectionDashboard");
//           break;
//         case "ELECTEUR":
//           navigate("/DashboardElecteur");
//           break;
//         default:
//           setError("Rôle inconnu : " + role);
//       }
//     } catch (err) {
//       console.error("Erreur lors de la connexion:", err);

//       // Gestion des erreurs du backend
//       if (err.response?.data?.message) {
//         setError(err.response.data.message);
//       } else {
//         setError("Erreur de connexion. Veuillez réessayer.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4">
//       <motion.div
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//         className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl"
//       >
//         <h2 className="text-3xl font-extrabold text-center mb-2 text-gray-800">
//           Connexion
//         </h2>
//         <p className="text-center text-gray-500 mb-8">
//           Connectez-vous pour accéder à votre espace de vote
//         </p>

//         {error && <p className="text-red-600 text-center mb-4">{error}</p>}

//         <form onSubmit={handleSubmit} className="space-y-5">
//           <div>
//             <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
//             <input
//               type="email"
//               required
//               placeholder="exemple@email.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1 text-gray-700">Mot de passe</label>
//             <input
//               type="password"
//               required
//               placeholder="********"
//               value={motDePasse}
//               onChange={(e) => setMotDePasse(e.target.value)}
//               className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className={`w-full py-3 bg-indigo-600 text-white rounded-2xl font-semibold text-lg transition ${
//               loading ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"
//             }`}
//           >
//             {loading ? "Connexion..." : "Se connecter"}
//           </button>
//         </form>

//         <div className="mt-6 text-center text-sm text-gray-500">
//           <p className="mb-2">Pas encore de compte ?</p>
//           <button
//             onClick={() => navigate("/creer-election")}
//             className="text-indigo-600 font-semibold hover:underline"
//           >
//             Créer une élection
//           </button>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

