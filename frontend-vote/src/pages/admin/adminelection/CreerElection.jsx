// src/pages/admin/adminelection/CreerElection.jsx
import React, { useState } from "react";
import {
  FiSave, FiArrowLeft, FiHome, FiBarChart2,
  FiSettings, FiLogOut, FiCalendar, FiClock, FiInfo, FiUsers
} from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Election from './Election.webp';

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

const TYPE_INFO = {
  UNINOMINAL: {
    emoji: "1️⃣",
    title: "Uninominal",
    desc: "Chaque électeur vote pour un seul candidat. Le candidat avec le plus de voix gagne.",
  },
  BINOMINAL: {
    emoji: "2️⃣",
    title: "Binominal",
    desc: "Chaque électeur vote pour exactement 2 candidats. Utile pour élire un titulaire et son suppléant.",
  },
  LISTE: {
    emoji: "📋",
    title: "Liste — Tours successifs",
    desc: "Vote pour une liste complète. Une majorité absolue (> 50%) est nécessaire. Sans vainqueur, un nouveau tour s'ouvre automatiquement.",
  },
};

export default function CreerElection() {
  const [form, setForm] = useState({
    title:            "",
    description:      "",
    type:             "UNINOMINAL",
    startDate:        "",
    endDate:          "",
    dureeTourMinutes: 1440,
    nbSieges:         29,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: (name === "dureeTourMinutes" || name === "nbSieges")
        ? parseInt(value) || 0
        : value,
    }));
  };

  const isListe = form.type === "LISTE";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { toast.error("Vous devez être connecté !"); setLoading(false); return; }

      if (!isListe && new Date(form.endDate) <= new Date(form.startDate)) {
        toast.error("La date de fin doit être postérieure à la date de début.");
        setLoading(false); return;
      }

      if (isListe && (!form.nbSieges || form.nbSieges < 1)) {
        toast.error("Le nombre de sièges doit être supérieur à 0.");
        setLoading(false); return;
      }

      const dateFin = isListe
        ? new Date(new Date(form.startDate).getTime() + form.dureeTourMinutes * 60000).toISOString().slice(0, 16)
        : form.endDate;

      await api.post("/elections/submit", {
        titre:              form.title,
        description:        form.description,
        type:               form.type,
        date_debut:         form.startDate,
        date_fin:           dateFin,
        duree_tour_minutes: isListe ? form.dureeTourMinutes : null,
        nb_sieges:          isListe ? form.nbSieges : null,
      });

      toast.success(`Élection "${form.title}" envoyée pour validation.`, { autoClose: 5000 });
      setForm({ title: "", description: "", startDate: "", endDate: "", type: "UNINOMINAL", dureeTourMinutes: 1440, nbSieges: 29 });

    } catch (err) {
      if (err.response?.status === 403) toast.error("Accès refusé.");
      else toast.error(err.response?.data?.error || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  const dateFinTour1 = isListe && form.startDate
    ? new Date(new Date(form.startDate).getTime() + form.dureeTourMinutes * 60000)
        .toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  // Calcul aperçu répartition sièges
  const bonusSieges   = isListe && form.nbSieges ? Math.floor(form.nbSieges / 2) : 0;
  const resteSieges   = isListe && form.nbSieges ? form.nbSieges - bonusSieges : 0;
  const typeInfo      = TYPE_INFO[form.type];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 p-6 flex flex-col shadow-sm">
        <div className="mb-10">
          <h1 className="text-xl font-black text-indigo-700 tracking-tight">🗳 eVote</h1>
          <p className="text-xs text-indigo-400 font-medium mt-0.5">Espace administrateur</p>
        </div>
        <nav className="flex-1 space-y-1">
          {[
            { to: "/adminElectionDashboard",           icon: <FiHome size={15} />,      label: "Tableau de bord" },
            { to: "/admin/adminelection/ElectionPage", icon: <FiCalendar size={15} />,  label: "Mes élections" },
            { to: "/admin/adminelection/resultats",    icon: <FiBarChart2 size={15} />, label: "Résultats" },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all">
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 pt-4 border-t border-gray-100 mt-4">
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
            <FiSettings size={15} /> Paramètres
          </Link>
          <Link to="/logout" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
            <FiLogOut size={15} /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Nouvelle élection</h2>
            <p className="text-sm text-indigo-400 mt-1">Remplissez les informations ci-dessous</p>
          </div>
          <Link
            to="/admin/adminelection/ElectionPage"
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-medium shadow-sm"
          >
            <FiArrowLeft size={14} /> Retour
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl">

          {/* ── FORMULAIRE ─────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">

            {/* Titre */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Titre *</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required
                placeholder="Ex : Élection du bureau étudiant 2026"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="3"
                placeholder="Décrivez l'objet de cette élection…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all resize-none" />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type de scrutin *</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer">
                <option value="UNINOMINAL">Uninominal</option>
                <option value="BINOMINAL">Binominal</option>
                <option value="LISTE">Liste (tours successifs)</option>
              </select>
            </div>

            {/* Date de début */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date et heure de début *</label>
              <input type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>

            {/* Date de fin — UNINOMINAL / BINOMINAL */}
            {!isListe && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date et heure de fin *</label>
                <input type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all" />
              </div>
            )}

            {/* Champs spécifiques LISTE */}
            {isListe && (
              <div className="space-y-4 pt-1">
                {/* Séparateur */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-indigo-100" />
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-2">Scrutin de liste</span>
                  <div className="flex-1 h-px bg-indigo-100" />
                </div>

                {/* Durée par tour + Nombre de sièges côte à côte */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FiClock size={11} className="text-indigo-500" /> Durée par tour *
                    </label>
                    <select name="dureeTourMinutes" value={form.dureeTourMinutes} onChange={handleChange} required
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer">
                      {DUREE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FiUsers size={11} className="text-indigo-500" /> Nombre de sièges *
                    </label>
                    <input
                      type="number" name="nbSieges" value={form.nbSieges}
                      onChange={handleChange} required min="1" max="999"
                      placeholder="Ex : 29"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                {/* Aperçu répartition des sièges */}
                {form.nbSieges > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
                    <p className="text-xs font-bold text-indigo-500 mb-2.5 flex items-center gap-1.5">
                      <FiInfo size={11} /> Aperçu de la répartition des sièges
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white rounded-lg p-2 border border-indigo-100">
                        <p className="text-lg font-black text-indigo-700">{form.nbSieges}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Total sièges</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                        <p className="text-lg font-black text-amber-600">{bonusSieges}</p>
                        <p className="text-xs text-amber-500 mt-0.5">Bonus gagnant</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-indigo-100">
                        <p className="text-lg font-black text-indigo-500">{resteSieges}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Répartis proportions</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">
                      La liste gagnante reçoit <strong className="text-amber-600">{bonusSieges} sièges bonus</strong> (50% arrondi).
                      Les <strong className="text-indigo-600">{resteSieges} sièges restants</strong> sont distribués proportionnellement entre toutes les listes qualifiées (&gt; 5%).
                    </p>
                  </div>
                )}

                {/* Aperçu calendrier */}
                {dateFinTour1 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                      <FiCalendar size={11} /> Aperçu du calendrier
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Début Tour 1</span>
                        <span className="font-semibold text-indigo-700">
                          {new Date(form.startDate).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fin Tour 1</span>
                        <span className="font-semibold text-indigo-600">{dateFinTour1}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Tours suivants</span>
                        <span>+{DUREE_OPTIONS.find(o => o.value === form.dureeTourMinutes)?.label} après résultats</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Note info */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                  <FiInfo size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Si aucune liste n'obtient la majorité absolue (&gt; 50%), un nouveau tour s'ouvre automatiquement. Les listes sous 5% sont éliminées, celles entre 5% et 10% peuvent fusionner.
                  </p>
                </div>
              </div>
            )}

            {/* Bouton */}
            <div className="pt-2">
              <button type="submit" disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all ${
                  loading ? "bg-gray-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-200/60"
                }`}>
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Création…</>
                  : <><FiSave size={14} /> Soumettre l'élection</>
                }
              </button>
            </div>
          </form>

          {/* ── PANNEAU DROIT ───────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <img src={Election} alt="Élection" className="w-full object-cover" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Type sélectionné</p>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{typeInfo.emoji}</span>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{typeInfo.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{typeInfo.desc}</p>
                </div>
              </div>
              {form.type === "LISTE" && (
                <div className="mt-4 space-y-2">
                  {[
                    { num: "1", color: "bg-indigo-600", text: "Vote → si > 50% → Vainqueur" },
                    { num: "2", color: "bg-orange-400", text: "< 5% éliminées · 5–10% fusionnent" },
                    { num: "N", color: "bg-amber-500",  text: "Tours jusqu'à majorité · Sièges répartis" },
                  ].map(step => (
                    <div key={step.num} className="flex items-center gap-2.5 text-xs text-gray-600">
                      <span className={`w-5 h-5 ${step.color} text-white rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0`}>
                        {step.num}
                      </span>
                      {step.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}





























// // src/pages/admin/adminelection/CreerElection.jsx
// import React, { useState } from "react";
// import {
//   FiSave, FiArrowLeft, FiHome, FiBarChart2,
//   FiSettings, FiLogOut, FiCalendar, FiClock, FiInfo
// } from "react-icons/fi";
// import { Link } from "react-router-dom";
// import api from "../../../services/api";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import Election from './Election.webp';

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

// const TYPE_INFO = {
//   UNINOMINAL: {
//     emoji: "1️⃣",
//     title: "Uninominal",
//     desc: "Chaque électeur vote pour un seul candidat. Le candidat avec le plus de voix gagne.",
//   },
//   BINOMINAL: {
//     emoji: "2️⃣",
//     title: "Binominal",
//     desc: "Chaque électeur vote pour exactement 2 candidats. Utile pour élire un titulaire et son suppléant.",
//   },
//   LISTE: {
//     emoji: "📋",
//     title: "Liste — Tours successifs",
//     desc: "Vote pour une liste complète. Une majorité absolue (> 50%) est nécessaire. Sans vainqueur, un nouveau tour s'ouvre automatiquement.",
//   },
// };

// export default function CreerElection() {
//   const [form, setForm] = useState({
//     title:            "",
//     description:      "",
//     startDate:        "",
//     endDate:          "",
//     type:             "UNINOMINAL",
//     dureeTourMinutes: 1440,
//   });
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm(prev => ({ ...prev, [name]: name === "dureeTourMinutes" ? parseInt(value) : value }));
//   };

//   const isListe = form.type === "LISTE";

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) { toast.error("Vous devez être connecté !"); setLoading(false); return; }

//       if (!isListe && new Date(form.endDate) <= new Date(form.startDate)) {
//         toast.error("La date de fin doit être postérieure à la date de début.");
//         setLoading(false); return;
//       }

//       const dateFin = isListe
//         ? new Date(new Date(form.startDate).getTime() + form.dureeTourMinutes * 60000).toISOString().slice(0, 16)
//         : form.endDate;

//       await api.post("/elections/submit", {
//         titre:              form.title,
//         description:        form.description,
//         type:               form.type,
//         date_debut:         form.startDate,
//         date_fin:           dateFin,
//         duree_tour_minutes: isListe ? form.dureeTourMinutes : null,
//       });

//       toast.success(`Élection "${form.title}" envoyée pour validation.`, { autoClose: 5000 });
//       setForm({ title: "", description: "", startDate: "", endDate: "", type: "UNINOMINAL", dureeTourMinutes: 1440 });

//     } catch (err) {
//       if (err.response?.status === 403) toast.error("Accès refusé.");
//       else toast.error(err.response?.data?.error || "Erreur lors de l'envoi.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const dateFinTour1 = form.startDate
//     ? new Date(new Date(form.startDate).getTime() + form.dureeTourMinutes * 60000)
//         .toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
//     : null;

//   const typeInfo = TYPE_INFO[form.type];

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
//       <aside className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 p-6 flex flex-col shadow-sm">
//         <div className="mb-10">
//           <h1 className="text-xl font-black text-indigo-700 tracking-tight">🗳 eVote</h1>
//           <p className="text-xs text-indigo-400 font-medium mt-0.5">Espace administrateur</p>
//         </div>
//         <nav className="flex-1 space-y-1">
//           {[
//             { to: "/adminElectionDashboard",           icon: <FiHome size={15} />,     label: "Tableau de bord" },
//             { to: "/admin/adminelection/ElectionPage", icon: <FiCalendar size={15} />, label: "Mes élections" },
//             { to: "/admin/adminelection/resultats",    icon: <FiBarChart2 size={15} />, label: "Résultats" },
//           ].map(item => (
//             <Link key={item.to} to={item.to}
//               className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all">
//               {item.icon} {item.label}
//             </Link>
//           ))}
//         </nav>
//         <div className="space-y-1 pt-4 border-t border-gray-100 mt-4">
//           <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
//             <FiSettings size={15} /> Paramètres
//           </Link>
//           <Link to="/logout" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
//             <FiLogOut size={15} /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ── MAIN ──────────────────────────────────────────────────────────── */}
//       <main className="flex-1 p-8 overflow-y-auto">

//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Nouvelle élection</h2>
//             <p className="text-sm text-indigo-400 mt-1">Remplissez les informations ci-dessous</p>
//           </div>
//           <Link
//             to="/admin/adminelection/ElectionPage"
//             className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-medium shadow-sm"
//           >
//             <FiArrowLeft size={14} /> Retour
//           </Link>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl">

//           {/* ── FORMULAIRE ─────────────────────────────────────────────── */}
//           <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">

//             {/* Titre */}
//             <div>
//               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
//                 Titre de l'élection *
//               </label>
//               <input
//                 type="text" name="title" value={form.title} onChange={handleChange} required
//                 placeholder="Ex : Élection du bureau étudiant 2026"
//                 className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
//               />
//             </div>

//             {/* Description */}
//             <div>
//               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
//                 Description
//               </label>
//               <textarea
//                 name="description" value={form.description} onChange={handleChange} rows="3"
//                 placeholder="Décrivez l'objet de cette élection…"
//                 className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
//               />
//             </div>

//             {/* Type */}
//             <div>
//               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
//                 Type de scrutin *
//               </label>
//               <select
//                 name="type" value={form.type} onChange={handleChange}
//                 className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
//               >
//                 <option value="UNINOMINAL">Uninominal</option>
//                 <option value="BINOMINAL">Binominal</option>
//                 <option value="LISTE">Liste (tours successifs)</option>
//               </select>
//             </div>

//             {/* Date de début */}
//             <div>
//               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
//                 Date et heure de début *
//               </label>
//               <input
//                 type="datetime-local" name="startDate" value={form.startDate}
//                 onChange={handleChange} required
//                 className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
//               />
//             </div>

//             {/* Date de fin — UNINOMINAL / BINOMINAL uniquement */}
//             {!isListe && (
//               <div>
//                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
//                   Date et heure de fin *
//                 </label>
//                 <input
//                   type="datetime-local" name="endDate" value={form.endDate}
//                   onChange={handleChange} required
//                   className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
//                 />
//               </div>
//             )}

//             {/* Durée par tour — LISTE uniquement */}
//             {isListe && (
//               <div className="space-y-3">
//                 <div>
//                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
//                     <FiClock size={12} className="text-indigo-500" />
//                     Durée par tour *
//                   </label>
//                   <select
//                     name="dureeTourMinutes" value={form.dureeTourMinutes}
//                     onChange={handleChange} required
//                     className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
//                   >
//                     {DUREE_OPTIONS.map(opt => (
//                       <option key={opt.value} value={opt.value}>{opt.label}</option>
//                     ))}
//                   </select>
//                 </div>

//                 {dateFinTour1 && (
//                   <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
//                     <p className="text-xs font-bold text-indigo-500 mb-2 flex items-center gap-1.5">
//                       <FiInfo size={11} /> Aperçu du calendrier
//                     </p>
//                     <div className="space-y-1.5 text-xs">
//                       <div className="flex justify-between">
//                         <span className="text-gray-500">Début Tour 1</span>
//                         <span className="font-semibold text-indigo-700">
//                           {new Date(form.startDate).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-500">Fin Tour 1</span>
//                         <span className="font-semibold text-indigo-600">{dateFinTour1}</span>
//                       </div>
//                       <div className="flex justify-between text-gray-400">
//                         <span>Tours suivants</span>
//                         <span>+{DUREE_OPTIONS.find(o => o.value === form.dureeTourMinutes)?.label} après résultats</span>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
//                   <FiInfo size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
//                   <p className="text-xs text-amber-700 leading-relaxed">
//                     Si aucune liste n'obtient la majorité absolue (&gt; 50%), un nouveau tour s'ouvre automatiquement avec la même durée. Les listes sous 5% sont éliminées.
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* Bouton */}
//             <div className="pt-2">
//               <button
//                 type="submit" disabled={loading}
//                 className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all ${
//                   loading ? "bg-gray-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-200/60"
//                 }`}
//               >
//                 {loading
//                   ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Création…</>
//                   : <><FiSave size={14} /> Soumettre l'élection</>
//                 }
//               </button>
//             </div>
//           </form>

//           {/* ── PANNEAU DROIT ───────────────────────────────────────────── */}
//           <div className="lg:col-span-2 space-y-4">
//             {/* Image */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//               <img src={Election} alt="Élection" className="w-full object-cover" />
//             </div>

//             {/* Info type sélectionné */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Type sélectionné</p>
//               <div className="flex items-start gap-3">
//                 <span className="text-2xl flex-shrink-0">{typeInfo.emoji}</span>
//                 <div>
//                   <p className="font-bold text-gray-800 text-sm">{typeInfo.title}</p>
//                   <p className="text-xs text-gray-500 mt-1 leading-relaxed">{typeInfo.desc}</p>
//                 </div>
//               </div>

//               {form.type === "LISTE" && (
//                 <div className="mt-4 space-y-2">
//                   {[
//                     { num: "1", color: "bg-indigo-600", text: "Vote → si > 50% → Vainqueur" },
//                     { num: "2", color: "bg-orange-400", text: "< 5% éliminées · 5–10% peuvent fusionner" },
//                     { num: "N", color: "bg-amber-500",  text: "Tours jusqu'à majorité · Sièges répartis" },
//                   ].map(step => (
//                     <div key={step.num} className="flex items-center gap-2.5 text-xs text-gray-600">
//                       <span className={`w-5 h-5 ${step.color} text-white rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0`}>
//                         {step.num}
//                       </span>
//                       {step.text}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>

//       <ToastContainer />
//     </div>
//   );
// }



