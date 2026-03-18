// src/pages/admin/adminelection/AjouterElecteur.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiEye, FiEyeOff, FiCopy, FiArrowLeft,
  FiRefreshCw, FiShield, FiUser, FiLock,
  FiAlertTriangle, FiMail, FiUserCheck
} from "react-icons/fi";
import api from "../../../services/api.jsx";
import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

const generatePassword = () => Math.random().toString(36).slice(-8);

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

/* ── Illustration ─────────────────────────────────────────────────────── */
const DecoIllustration = () => (
  <div className="flex flex-col items-center justify-center gap-8 select-none w-full h-full py-6">
    <div className="text-center">
      <p className="text-indigo-700 font-bold text-lg leading-tight">Gestion des électeurs</p>
      <p className="text-indigo-400 text-sm mt-1">Ajoutez des participants en toute sécurité</p>
    </div>
    <svg viewBox="0 0 320 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: "340px" }}>
      <circle cx="160" cy="155" r="120" fill="#eef2ff" opacity="0.8"/>
      <circle cx="160" cy="155" r="88"  fill="#e0e7ff" opacity="0.6"/>
      <circle cx="160" cy="155" r="56"  fill="#c7d2fe" opacity="0.25"/>
      <rect x="88" y="148" width="144" height="110" rx="14" fill="#4f46e5"/>
      <rect x="88" y="148" width="144" height="110" rx="14" stroke="#4338ca" strokeWidth="2"/>
      <rect x="98" y="158" width="30" height="80" rx="6" fill="white" opacity="0.06"/>
      <rect x="78" y="128" width="164" height="28" rx="8" fill="#6366f1"/>
      <rect x="78" y="128" width="164" height="28" rx="8" stroke="#4f46e5" strokeWidth="2"/>
      <rect x="132" y="133" width="56" height="8" rx="4" fill="#c7d2fe"/>
      <g transform="rotate(-10, 155, 100)">
        <rect x="138" y="72" width="34" height="44" rx="5" fill="white" stroke="#a5b4fc" strokeWidth="2"/>
        <line x1="146" y1="84" x2="164" y2="84" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round"/>
        <line x1="146" y1="91" x2="160" y2="91" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round"/>
        <line x1="146" y1="98" x2="162" y2="98" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round"/>
        <path d="M147 106 l4 4 l8-8" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <circle cx="52" cy="128" r="26" fill="#e0e7ff"/>
      <circle cx="52" cy="120" r="12" fill="#818cf8"/>
      <path d="M26 152 Q52 138 78 152" fill="#818cf8"/>
      <line x1="72" y1="145" x2="92" y2="138" stroke="#818cf8" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="268" cy="128" r="26" fill="#e0e7ff"/>
      <circle cx="268" cy="120" r="12" fill="#818cf8"/>
      <path d="M242 152 Q268 138 294 152" fill="#818cf8"/>
      <line x1="248" y1="145" x2="228" y2="138" stroke="#818cf8" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="55"  cy="68" r="5" fill="#6366f1" opacity="0.5"/>
      <circle cx="264" cy="72" r="4" fill="#818cf8" opacity="0.5"/>
      <circle cx="198" cy="48" r="6" fill="#a5b4fc" opacity="0.5"/>
      <circle cx="108" cy="52" r="4" fill="#6366f1" opacity="0.4"/>
      <path d="M90 35 l2 5 l5 2 l-5 2 l-2 5 l-2-5 l-5-2 l5-2z" fill="#a5b4fc" opacity="0.7"/>
      <path d="M228 30 l1.5 3.5 l3.5 1.5 l-3.5 1.5 l-1.5 3.5 l-1.5-3.5 l-3.5-1.5 l3.5-1.5z" fill="#818cf8" opacity="0.6"/>
      <rect x="144" y="182" width="32" height="26" rx="5" fill="#4338ca"/>
      <path d="M150 182 v-7 a10 10 0 0 1 20 0 v7" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <circle cx="160" cy="196" r="4" fill="#c7d2fe"/>
      <rect x="158.5" y="196" width="3" height="5" rx="1.5" fill="#c7d2fe"/>
      <text x="160" y="278" textAnchor="middle" fontSize="13" fontWeight="700" fill="#4f46e5" fontFamily="system-ui, sans-serif">eVote — Plateforme de vote</text>
      <text x="160" y="295" textAnchor="middle" fontSize="11" fill="#818cf8" fontFamily="system-ui, sans-serif">Sécurisé · Transparent · Fiable</text>
    </svg>
    <div className="flex flex-col gap-3 w-full max-w-[230px]">
      {[
        { icon: "🔐", label: "Chiffrement de bout en bout", color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
        { icon: "🗳",  label: "Vote anonyme garanti",       color: "bg-purple-50 border-purple-200 text-purple-700" },
        { icon: "📩", label: "Notification par e-mail",    color: "bg-blue-50   border-blue-200   text-blue-700"   },
        { icon: "⚡", label: "Accès immédiat après ajout", color: "bg-amber-50  border-amber-200  text-amber-700"  },
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
export default function AjouterElecteur() {
  const { electionId } = useParams();
  const navigate       = useNavigate();
  const activeId       = electionId || localStorage.getItem("activeElectionId");

  const [election, setElection]         = useState(null);
  const [nom, setNom]                   = useState("");
  const [prenom, setPrenom]             = useState("");
  const [email, setEmail]               = useState("");
  const [motDePasse, setMotDePasse]     = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [copySuccess, setCopySuccess]   = useState(false);
  const [actif, setActif]               = useState(true);
  const [errorMsg, setErrorMsg]         = useState("");
  const [successMsg, setSuccessMsg]     = useState("");
  const [loading, setLoading]           = useState(false);

  useEffect(() => { if (activeId) fetchElection(); }, [activeId]);

  const fetchElection = async () => {
    try { const res = await api.get(`/elections/${activeId}`); setElection(res.data); }
    catch (err) { console.error(err.response?.data || err.message); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(motDePasse);
    setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg(""); setLoading(true);
    try {
      const res = await api.post(`/elections/${activeId}/electeurs`, { nom, prenom, email, actif });
      const pwd = res.data.mot_de_passe || motDePasse;
      setSuccessMsg(`✅ ${prenom} ${nom} ajouté ! Mot de passe : ${pwd}`);
      setNom(""); setPrenom(""); setEmail("");
      setMotDePasse(generatePassword()); setActif(true); setShowPassword(false);
      setTimeout(() => navigate(`/admin/adminelection/electeurs/${activeId}`), 2500);
    } catch (err) {
      if      (err.response?.status === 409) setErrorMsg("⚠️ Cet électeur est déjà inscrit à cette élection.");
      else if (err.response?.status === 403) setErrorMsg("🚫 Accès refusé ou élection non autorisée.");
      else if (err.response?.status === 401) setErrorMsg("🚫 Session expirée, veuillez vous reconnecter.");
      else setErrorMsg(err.response?.data?.message || "Erreur serveur lors de l'ajout.");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      <AdminElectionSidebar active="elections" />

      <main className="flex-1 flex items-center justify-center p-6 lg:p-8 gap-8">

        {/* Illustration */}
        <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 max-w-sm">
          <DecoIllustration />
        </div>

        {/* Formulaire */}
        <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-3xl shadow-xl w-full max-w-lg lg:flex-shrink-0">

          <button type="button" onClick={() => navigate(`/admin/adminelection/electeurs/${activeId}`)}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl font-semibold transition text-sm">
            <FiArrowLeft size={14}/> Retour aux électeurs
          </button>

          <h2 className="text-xl sm:text-2xl font-bold text-indigo-700 mb-1">Ajouter un électeur</h2>
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

            {/* Section 2 : Accès */}
            <div>
              <SectionTitle icon={<FiLock size={11} />} label="Accès au compte" />

              <Field label="Adresse e-mail" required icon={<FiMail size={13} />}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="jean.dupont@email.com" className={`${inputCls} mb-4`} />
              </Field>

              <Field label="Mot de passe provisoire" icon={<FiLock size={13} />}>
                <div className="flex flex-wrap items-center gap-2">
                  <input type={showPassword ? "text" : "password"} value={motDePasse} readOnly
                    className="flex-1 min-w-0 px-4 py-3.5 border-2 border-gray-300 rounded-xl font-mono text-sm font-medium bg-gray-50 text-gray-700 outline-none" />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="p-3.5 bg-gray-100 hover:bg-gray-200 border-2 border-gray-200 rounded-xl transition text-gray-500">
                      {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                    <button type="button" onClick={() => setMotDePasse(generatePassword())}
                      className="p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition border-2 border-amber-200">
                      <FiRefreshCw size={15} />
                    </button>
                    <button type="button" onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-4 py-3.5 rounded-xl text-sm font-bold transition-all border-2 ${
                        copySuccess
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                      }`}>
                      <FiCopy size={13} />
                      <span className="hidden xs:inline">{copySuccess ? "Copié !" : "Copier"}</span>
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-start gap-2.5 p-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                  <FiAlertTriangle size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                    <span className="font-bold block mb-0.5">Conservez ce mot de passe</span>
                    Il sera communiqué à l'électeur pour son premier accès. Le système stocke une version chiffrée — ce mot de passe ne sera plus accessible après validation.
                  </p>
                </div>
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
                    {actif ? "L'électeur pourra voter immédiatement" : "Le compte sera désactivé à la création"}
                  </p>
                </div>
                <FiShield size={16} className={`flex-shrink-0 ${actif ? "text-indigo-400" : "text-gray-300"}`} />
              </label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-wide border-2 border-indigo-700">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Ajout en cours…
                </>
              ) : (
                <><FiUserCheck size={15} /> Ajouter l'électeur</>
              )}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}
