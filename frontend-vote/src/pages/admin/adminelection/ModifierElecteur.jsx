// src/pages/admin/adminelection/ModifierElecteur.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiArrowLeft, FiHome, FiBarChart2, FiLogOut,
  FiUserCheck, FiCalendar, FiUsers, FiSettings,
  FiShield, FiUser, FiMail, FiSave, FiMenu, FiX
} from "react-icons/fi";
import api from "../../../services/api.jsx";

/* ── Composants partagés (identiques à AjouterElecteur) ─────────────── */
const SectionTitle = ({ icon, label }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-0.5 h-4 bg-indigo-500 rounded-full" />
    <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 flex items-center gap-1.5">
      {icon} {label}
    </span>
  </div>
);

const Field = ({ label, required, icon, children }) => (
  <div>
    <label className="block mb-2 font-semibold text-gray-700 text-sm flex items-center gap-1.5">
      <span className="text-indigo-400">{icon}</span>
      {label}
      {required && <span className="text-red-400 font-normal">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-gray-50 " +
  "focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all " +
  "placeholder-gray-400";

/* ── Illustration décorative (adaptée "Modification") ───────────────── */
const DecoIllustration = () => (
  <div className="flex flex-col items-center justify-center gap-8 select-none w-full h-full py-6">
    <div className="text-center">
      <p className="text-indigo-700 font-bold text-lg leading-tight">Modification d'un électeur</p>
      <p className="text-indigo-400 text-sm mt-1">Mettez à jour les informations en toute sécurité</p>
    </div>
    <svg viewBox="0 0 320 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: "340px" }}>
      <circle cx="160" cy="155" r="120" fill="#eef2ff" opacity="0.8"/>
      <circle cx="160" cy="155" r="88"  fill="#e0e7ff" opacity="0.6"/>
      <circle cx="160" cy="155" r="56"  fill="#c7d2fe" opacity="0.25"/>
      {/* Urne */}
      <rect x="88" y="148" width="144" height="110" rx="14" fill="#4f46e5"/>
      <rect x="88" y="148" width="144" height="110" rx="14" stroke="#4338ca" strokeWidth="2"/>
      <rect x="98" y="158" width="30" height="80" rx="6" fill="white" opacity="0.06"/>
      <rect x="78" y="128" width="164" height="28" rx="8" fill="#6366f1"/>
      <rect x="78" y="128" width="164" height="28" rx="8" stroke="#4f46e5" strokeWidth="2"/>
      <rect x="132" y="133" width="56" height="8" rx="4" fill="#c7d2fe"/>
      {/* Crayon (symbole modification) */}
      <g transform="rotate(-35, 160, 80)">
        <rect x="148" y="50" width="24" height="50" rx="4" fill="#6366f1" stroke="#4338ca" strokeWidth="1.5"/>
        <polygon points="148,100 172,100 160,118" fill="#fbbf24"/>
        <rect x="148" y="50" width="24" height="10" rx="4" fill="#c7d2fe"/>
        <line x1="155" y1="65" x2="165" y2="65" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        <line x1="155" y1="72" x2="165" y2="72" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        <line x1="155" y1="79" x2="165" y2="79" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      </g>
      {/* Électeur gauche */}
      <circle cx="52" cy="128" r="26" fill="#e0e7ff"/>
      <circle cx="52" cy="120" r="12" fill="#818cf8"/>
      <path d="M26 152 Q52 138 78 152" fill="#818cf8"/>
      <line x1="72" y1="145" x2="92" y2="138" stroke="#818cf8" strokeWidth="4" strokeLinecap="round"/>
      {/* Électeur droite */}
      <circle cx="268" cy="128" r="26" fill="#e0e7ff"/>
      <circle cx="268" cy="120" r="12" fill="#818cf8"/>
      <path d="M242 152 Q268 138 294 152" fill="#818cf8"/>
      <line x1="248" y1="145" x2="228" y2="138" stroke="#818cf8" strokeWidth="4" strokeLinecap="round"/>
      {/* Particules */}
      <circle cx="55"  cy="68" r="5" fill="#6366f1" opacity="0.5"/>
      <circle cx="264" cy="72" r="4" fill="#818cf8" opacity="0.5"/>
      <circle cx="198" cy="48" r="6" fill="#a5b4fc" opacity="0.5"/>
      <circle cx="108" cy="52" r="4" fill="#6366f1" opacity="0.4"/>
      <path d="M90 35 l2 5 l5 2 l-5 2 l-2 5 l-2-5 l-5-2 l5-2z" fill="#a5b4fc" opacity="0.7"/>
      <path d="M228 30 l1.5 3.5 l3.5 1.5 l-3.5 1.5 l-1.5 3.5 l-1.5-3.5 l-3.5-1.5 l3.5-1.5z" fill="#818cf8" opacity="0.6"/>
      {/* Cadenas */}
      <rect x="144" y="182" width="32" height="26" rx="5" fill="#4338ca"/>
      <path d="M150 182 v-7 a10 10 0 0 1 20 0 v7" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <circle cx="160" cy="196" r="4" fill="#c7d2fe"/>
      <rect x="158.5" y="196" width="3" height="5" rx="1.5" fill="#c7d2fe"/>
      <text x="160" y="278" textAnchor="middle" fontSize="13" fontWeight="700" fill="#4f46e5" fontFamily="system-ui, sans-serif">eVote — Plateforme de vote</text>
      <text x="160" y="295" textAnchor="middle" fontSize="11" fill="#818cf8" fontFamily="system-ui, sans-serif">Sécurisé · Transparent · Fiable</text>
    </svg>
    <div className="flex flex-col gap-3 w-full max-w-[230px]">
      {[
        { icon: "✏️", label: "Modification sécurisée",       color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
        { icon: "🔐", label: "Données chiffrées",            color: "bg-purple-50 border-purple-200 text-purple-700" },
        { icon: "📋", label: "Historique conservé",          color: "bg-blue-50   border-blue-200   text-blue-700"   },
        { icon: "⚡", label: "Mise à jour instantanée",      color: "bg-amber-50  border-amber-200  text-amber-700"  },
      ].map(({ icon, label, color }) => (
        <div key={label} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${color} shadow-sm`}>
          <span className="text-base leading-none">{icon}</span>
          <span className="text-xs font-semibold leading-tight">{label}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ── Composant principal ─────────────────────────────────────────────── */
export default function ModifierElecteur() {
  const { electionId, id } = useParams();
  const navigate           = useNavigate();
  const activeId           = electionId || localStorage.getItem("activeElectionId");

  const [election, setElection]     = useState(null);
  const [nom, setNom]               = useState("");
  const [prenom, setPrenom]         = useState("");
  const [email, setEmail]           = useState("");
  const [actif, setActif]           = useState(true);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (activeId && id) { fetchElection(); fetchElecteur(); }
  }, [activeId, id]);

  const fetchElection = async () => {
    try { const res = await api.get(`/elections/${activeId}`); setElection(res.data); }
    catch (err) { console.error(err.response?.data || err.message); }
  };

  const fetchElecteur = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/elections/${activeId}/electeurs`);
      const found = res.data.find(e => String(e.id) === String(id));
      if (found) {
        setNom(found.nom); setPrenom(found.prenom);
        setEmail(found.email); setActif(found.actif);
      } else {
        setErrorMsg("Électeur introuvable dans cette élection.");
      }
    } catch (err) {
      setErrorMsg("Impossible de charger les données de l'électeur.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg(""); setSaving(true);
    try {
      await api.put(`/elections/${activeId}/electeurs/${id}`, { nom, prenom, email, actif });
      setSuccessMsg("✅ Électeur modifié avec succès !");
      setTimeout(() => navigate(`/admin/adminelection/electeurs/${activeId}`), 1800);
    } catch (err) {
      if      (err.response?.status === 404) setErrorMsg("Électeur introuvable.");
      else if (err.response?.status === 403) setErrorMsg("🚫 Accès refusé.");
      else setErrorMsg(err.response?.data?.message || "Erreur serveur.");
    } finally { setSaving(false); }
  };

  const NavLinks = ({ onClose }) => (
    <>
      <nav className="flex-1 space-y-1">
        <Link to="/adminElectionDashboard" onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100 text-gray-700 text-sm font-medium">
          <FiHome size={16}/> Tableau de bord
        </Link>
        <Link to="/admin/adminelection/ElectionPage" onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100 text-gray-700 text-sm font-medium">
          <FiCalendar size={16}/> Mes élections
        </Link>
        <Link to="/admin/adminelection/candidats" onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100 text-gray-700 text-sm font-medium">
          <FiUsers size={16}/> Candidats
        </Link>
        <Link to={`/admin/adminelection/electeurs/${activeId}`} onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-100 text-indigo-700 font-semibold text-sm">
          <FiUserCheck size={16}/> Électeurs
        </Link>
        <Link to="/admin/adminelection/resultats" onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100 text-gray-700 text-sm font-medium">
          <FiBarChart2 size={16}/> Résultats
        </Link>
      </nav>
      <div className="space-y-1 mt-6 pt-4 border-t border-gray-100">
        <Link to="/settings" onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100 text-gray-700 text-sm font-medium">
          <FiSettings size={16}/> Paramètres
        </Link>
        <Link to="/logout" onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 text-sm font-medium">
          <FiLogOut size={16}/> Déconnexion
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 bg-white/80 backdrop-blur border-r flex-col p-6 flex-shrink-0">
        <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
        <NavLinks onClose={() => {}} />
      </aside>

      {/* Sidebar mobile (drawer) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-72 bg-white flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-xl font-bold text-indigo-700">🗳 eVote – Admin</h1>
              <button onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                <FiX size={20} />
              </button>
            </div>
            <NavLinks onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white/80 backdrop-blur border-b">
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-indigo-100 text-indigo-700">
            <FiMenu size={20} />
          </button>
          <span className="text-base font-bold text-indigo-700">🗳 eVote – Admin</span>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 lg:p-8 gap-6 lg:gap-8">

          {/* Illustration — masquée sur mobile */}
          <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 max-w-sm">
            <DecoIllustration />
          </div>

          {/* Carte formulaire */}
          <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-3xl shadow-xl w-full max-w-lg lg:flex-shrink-0">

            <button type="button" onClick={() => navigate(`/admin/adminelection/electeurs/${activeId}`)}
              className="mb-6 flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl font-semibold transition text-sm">
              <FiArrowLeft size={14}/> Retour aux électeurs
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-indigo-700 mb-1">Modifier l'électeur</h2>
            {election && (
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  🗳 {election.titre}
                </span>
              </div>
            )}
            {!election && <div className="mb-6" />}

            {errorMsg && (
              <div className="mb-5 flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                <span className="mt-0.5 shrink-0">⚠️</span><span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-5 flex items-start gap-2 p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                <span className="mt-0.5 shrink-0">✅</span><span>{successMsg}</span>
              </div>
            )}

            {loading ? (
              /* État de chargement */
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <svg className="animate-spin w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                <p className="text-indigo-600 font-semibold text-sm">Chargement des données…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Section 1 : Identité */}
                <div>
                  <SectionTitle icon={<FiUser size={11} />} label="Identité" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nom" required icon={<FiUser size={13} />}>
                      <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
                        placeholder="Dupont" className={inputCls} />
                    </Field>
                    <Field label="Prénom" required icon={<FiUser size={13} />}>
                      <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} required
                        placeholder="Jean" className={inputCls} />
                    </Field>
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-gray-100" />

                {/* Section 2 : Coordonnées */}
                <div>
                  <SectionTitle icon={<FiMail size={11} />} label="Coordonnées" />
                  <Field label="Adresse e-mail" required icon={<FiMail size={13} />}>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="jean.dupont@email.com" className={inputCls} />
                  </Field>
                </div>

                <div className="border-t-2 border-dashed border-gray-100" />

                {/* Section 3 : Statut */}
                <div>
                  <SectionTitle icon={<FiShield size={11} />} label="Statut du compte" />
                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                    actif ? "bg-indigo-50 border-indigo-400" : "bg-gray-50 border-gray-300"
                  }`}>
                    <div onClick={() => setActif(!actif)}
                      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${actif ? "bg-indigo-600" : "bg-gray-300"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${actif ? "left-6" : "left-1"}`} />
                      <input type="checkbox" checked={actif} onChange={() => setActif(!actif)} className="sr-only" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${actif ? "text-indigo-700" : "text-gray-500"}`}>Compte actif</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {actif ? "L'électeur peut voter" : "L'électeur est suspendu"}
                      </p>
                    </div>
                    <FiShield size={16} className={`flex-shrink-0 ${actif ? "text-indigo-400" : "text-gray-300"}`} />
                  </label>
                </div>

                {/* Submit */}
                <button type="submit" disabled={saving}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-wide border-2 border-indigo-700">
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                      Enregistrement…
                    </>
                  ) : (
                    <><FiSave size={15} /> Enregistrer les modifications</>
                  )}
                </button>

              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
























































// // src/pages/admin/adminelection/ModifierElecteur.jsx
// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams, Link } from "react-router-dom";
// import {
//   FiArrowLeft, FiHome, FiBarChart2, FiLogOut,
//   FiUserCheck, FiCalendar, FiUsers, FiSettings
// } from "react-icons/fi";
// import api from "../../../services/api.jsx";

// export default function ModifierElecteur() {
//   const { electionId, id } = useParams();
//   const navigate           = useNavigate();
//   const activeId           = electionId || localStorage.getItem("activeElectionId");

//   const [election, setElection]   = useState(null);
//   const [nom, setNom]             = useState("");
//   const [prenom, setPrenom]       = useState("");
//   const [email, setEmail]         = useState("");
//   const [actif, setActif]         = useState(true);
//   const [loading, setLoading]     = useState(true);
//   const [saving, setSaving]       = useState(false);
//   const [errorMsg, setErrorMsg]   = useState("");
//   const [successMsg, setSuccessMsg] = useState("");

//   useEffect(() => {
//     if (activeId && id) { fetchElection(); fetchElecteur(); }
//   }, [activeId, id]);

//   const fetchElection = async () => {
//     try { const res = await api.get(`/elections/${activeId}`); setElection(res.data); }
//     catch (err) { console.error(err.response?.data || err.message); }
//   };

//   const fetchElecteur = async () => {
//     try {
//       setLoading(true);
//       // Récupérer la liste des électeurs et trouver le bon
//       const res = await api.get(`/elections/${activeId}/electeurs`);
//       const found = res.data.find(e => String(e.id) === String(id));
//       if (found) {
//         setNom(found.nom);
//         setPrenom(found.prenom);
//         setEmail(found.email);
//         setActif(found.actif);
//       } else {
//         setErrorMsg("Électeur introuvable dans cette élection.");
//       }
//     } catch (err) {
//       setErrorMsg("Impossible de charger les données de l'électeur.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setErrorMsg(""); setSuccessMsg(""); setSaving(true);

//     try {
//       // PUT /api/elections/:electionId/electeurs/:electeurId
//       await api.put(`/elections/${activeId}/electeurs/${id}`, { nom, prenom, email, actif });
//       setSuccessMsg("✅ Électeur modifié avec succès !");
//       setTimeout(() => navigate(`/admin/adminelection/electeurs/${activeId}`), 1800);
//     } catch (err) {
//       if      (err.response?.status === 404) setErrorMsg("Électeur introuvable.");
//       else if (err.response?.status === 403) setErrorMsg("🚫 Accès refusé.");
//       else setErrorMsg(err.response?.data?.message || "Erreur serveur.");
//     } finally { setSaving(false); }
//   };

//   const Sidebar = () => (
//     <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//       <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//       <nav className="flex-1 space-y-3">
//         <Link to="/adminElectionDashboard"                      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiHome /> Tableau de bord</Link>
//         <Link to="/admin/adminelection/ElectionPage"            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiCalendar /> Mes élections</Link>
//         <Link to="/admin/adminelection/candidats"               className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUsers /> Candidats</Link>
//         <Link to={`/admin/adminelection/electeurs/${activeId}`} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 font-semibold"><FiUserCheck /> Électeurs</Link>
//         <Link to="/admin/adminelection/resultats"               className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiBarChart2 /> Résultats</Link>
//       </nav>
//       <div className="space-y-3 mt-6">
//         <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiSettings /> Paramètres</Link>
//         <Link to="/logout"   className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600"><FiLogOut /> Déconnexion</Link>
//       </div>
//     </aside>
//   );

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <Sidebar />
//       <main className="flex-1 p-8 flex justify-center items-start">
//         <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-lg">

//           <button type="button" onClick={() => navigate(`/admin/adminelection/electeurs/${activeId}`)}
//             className="mb-6 flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl font-semibold transition">
//             <FiArrowLeft /> Retour aux électeurs
//           </button>

//           <h2 className="text-2xl font-bold text-indigo-700 mb-1">Modifier l'électeur</h2>
//           {election && <p className="text-sm text-gray-500 mb-6">{election.titre}</p>}

//           {errorMsg   && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{errorMsg}</div>}
//           {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-sm">{successMsg}</div>}

//           {loading ? (
//             <div className="text-center py-10 text-indigo-600">Chargement...</div>
//           ) : (
//             <form onSubmit={handleSubmit} className="space-y-5">

//               <div>
//                 <label className="block mb-1 font-semibold text-gray-700">Nom *</label>
//                 <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
//                   className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
//               </div>

//               <div>
//                 <label className="block mb-1 font-semibold text-gray-700">Prénom *</label>
//                 <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} required
//                   className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
//               </div>

//               <div>
//                 <label className="block mb-1 font-semibold text-gray-700">Email *</label>
//                 <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
//                   className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
//               </div>

//               <div className="flex items-center gap-3">
//                 <input type="checkbox" id="actif" checked={actif} onChange={() => setActif(!actif)}
//                   className="w-5 h-5 accent-indigo-600" />
//                 <label htmlFor="actif" className="font-semibold text-gray-700 cursor-pointer">Compte actif</label>
//               </div>

//               <button type="submit" disabled={saving}
//                 className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-50">
//                 {saving ? "Enregistrement..." : "Enregistrer les modifications"}
//               </button>
//             </form>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }

