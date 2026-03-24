// src/pages/admin/adminelection/ModifierElection.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiHome, FiBarChart2, FiSettings, FiLogOut, FiCalendar,
  FiArrowLeft, FiEdit3, FiAlertCircle, FiCheckCircle,
  FiClock, FiInfo, FiUsers
} from "react-icons/fi";
import api from "../../../services/api";

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

export default function ModifierElection() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title:            "",
    description:      "",
    type:             "UNINOMINAL",
    startDate:        "",
    endDate:          "",
    dureeTourMinutes: 1440,
    nbSieges:         29,
  });
  const [status,      setStatus]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg,    setErrorMsg]    = useState(null); // ✅ AJOUT : affichage erreur détaillée

  useEffect(() => {
    const fetchElection = async () => {
      try {
        const res = await api.get(`/elections/${id}`);
        const e   = res.data;
        setFormData({
          title:            e.titre       ?? "",
          description:      e.description ?? "",
          type:             e.type        ?? "UNINOMINAL",
          startDate:        e.date_debut  ? e.date_debut.slice(0, 16) : "",
          endDate:          e.date_fin    ? e.date_fin.slice(0, 16)   : "",
          dureeTourMinutes: e.duree_tour_minutes ?? 1440,
          nbSieges:         e.nb_sieges   ?? 29,
        });
        setStatus(e.statut);
      } catch (err) {
        console.error("Erreur fetch élection:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchElection();
  }, [id]);

  const isEditable = !["EN_COURS", "TERMINEE"].includes(status);
  const isListe    = formData.type === "LISTE";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === "dureeTourMinutes" || name === "nbSieges")
        ? parseInt(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditable) return;
    setErrorMsg(null); // reset erreur

    if (isListe && (!formData.nbSieges || formData.nbSieges < 1)) {
      alert("Le nombre de sièges doit être supérieur à 0.");
      return;
    }

    setSaving(true);
    try {
      const dateFin = isListe
        ? new Date(new Date(formData.startDate).getTime() + formData.dureeTourMinutes * 60000)
            .toISOString().slice(0, 16)
        : formData.endDate;

      // ✅ CORRIGÉ : /elections/update/:id au lieu de /elections/:id
      await api.put(`/elections/update/${id}`, {
        titre:              formData.title,
        description:        formData.description,
        date_debut:         formData.startDate,
        date_fin:           dateFin,
        type:               formData.type,
        duree_tour_minutes: isListe ? formData.dureeTourMinutes : null,
        nb_sieges:          isListe ? formData.nbSieges : null,
      });

      setSaveSuccess(true);
      setTimeout(() => navigate("/admin/adminelection/ElectionPage"), 1500);
    } catch (err) {
      // ✅ CORRIGÉ : affiche le message précis du serveur au lieu d'un alert générique
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      console.error("Erreur modification:", msg);
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-10 flex flex-col items-center gap-4 shadow-lg">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-indigo-600 text-sm font-medium">Chargement…</p>
      </div>
    </div>
  );

  const dateFinTour1 = isListe && formData.startDate
    ? new Date(new Date(formData.startDate).getTime() + formData.dureeTourMinutes * 60000)
        .toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  const bonusSieges = isListe && formData.nbSieges ? Math.floor(formData.nbSieges / 2) : 0;
  const resteSieges = isListe && formData.nbSieges ? formData.nbSieges - bonusSieges : 0;

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
            { to: "/admin/adminelection/ElectionPage", icon: <FiCalendar size={15} />,  label: "Mes élections", active: true },
            { to: "/admin/adminelection/resultats",    icon: <FiBarChart2 size={15} />, label: "Résultats" },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active ? "bg-indigo-100 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}>
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <FiEdit3 size={16} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Modifier l'élection</h2>
              <p className="text-xs text-indigo-400 font-mono mt-0.5">ID #{id}</p>
            </div>
          </div>
          <Link to="/admin/adminelection/ElectionPage"
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-medium shadow-sm">
            <FiArrowLeft size={14} /> Retour
          </Link>
        </div>

        {/* Bandeau statut */}
        {status && (
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium mb-6 border ${
            isEditable ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {isEditable
              ? <><FiCheckCircle size={15} /> Cette élection peut être modifiée.</>
              : <><FiAlertCircle size={15} /> Modification impossible — statut : <strong className="ml-1">{status}</strong></>
            }
          </div>
        )}

        {/* ✅ AJOUT : Bandeau d'erreur détaillé */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium mb-6 border bg-red-50 text-red-700 border-red-200">
            <FiAlertCircle size={15} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-7 space-y-6">

          {/* Titre */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Titre *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange}
              disabled={!isEditable} required placeholder="Ex : Élection du conseil 2026"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange}
              disabled={!isEditable} rows="4" placeholder="Décrivez l'objet de cette élection…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none" />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type de scrutin *</label>
            <select name="type" value={formData.type} onChange={handleChange} disabled={!isEditable}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              <option value="UNINOMINAL">Uninominal</option>
              <option value="BINOMINAL">Binominal</option>
              <option value="LISTE">Liste (tours successifs)</option>
            </select>
          </div>

          {/* Date de début */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date et heure de début *</label>
            <input type="datetime-local" name="startDate" value={formData.startDate}
              onChange={handleChange} disabled={!isEditable} required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>

          {/* Date de fin — non-LISTE */}
          {!isListe && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date et heure de fin *</label>
              <input type="datetime-local" name="endDate" value={formData.endDate}
                onChange={handleChange} disabled={!isEditable} required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
          )}

          {/* Champs LISTE */}
          {isListe && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-indigo-100" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-2">Scrutin de liste</span>
                <div className="flex-1 h-px bg-indigo-100" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FiClock size={11} className="text-indigo-500" /> Durée par tour *
                  </label>
                  <select name="dureeTourMinutes" value={formData.dureeTourMinutes}
                    onChange={handleChange} disabled={!isEditable} required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    {DUREE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FiUsers size={11} className="text-indigo-500" /> Nombre de sièges *
                  </label>
                  <input type="number" name="nbSieges" value={formData.nbSieges}
                    onChange={handleChange} disabled={!isEditable} required min="1" max="999"
                    placeholder="Ex : 29"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>
              </div>

              {formData.nbSieges > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
                  <p className="text-xs font-bold text-indigo-500 mb-2.5 flex items-center gap-1.5">
                    <FiInfo size={11} /> Aperçu de la répartition des sièges
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-lg p-2 border border-indigo-100">
                      <p className="text-lg font-black text-indigo-700">{formData.nbSieges}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Total sièges</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                      <p className="text-lg font-black text-amber-600">{bonusSieges}</p>
                      <p className="text-xs text-amber-500 mt-0.5">Bonus gagnant</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-indigo-100">
                      <p className="text-lg font-black text-indigo-500">{resteSieges}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Répartis props.</p>
                    </div>
                  </div>
                </div>
              )}

              {dateFinTour1 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                  <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                    <FiCalendar size={11} /> Aperçu du calendrier
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Début Tour 1</span>
                      <span className="font-semibold text-indigo-700">
                        {new Date(formData.startDate).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fin Tour 1</span>
                      <span className="font-semibold text-indigo-600">{dateFinTour1}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {isEditable && (
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
              <Link to="/admin/adminelection/ElectionPage"
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all">
                Annuler
              </Link>
              <button type="submit" disabled={saving || saveSuccess}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 shadow-md ${
                  saveSuccess ? "bg-emerald-500 shadow-emerald-200/60" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/60"
                } disabled:opacity-75 disabled:cursor-not-allowed`}>
                {saveSuccess
                  ? <><FiCheckCircle size={14} /> Enregistré !</>
                  : saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</>
                  : <><FiEdit3 size={14} /> Enregistrer les modifications</>
                }
              </button>
            </div>
          )}
        </form>

      </main>
    </div>
  );
}































// // src/pages/admin/adminelection/ModifierElection.jsx
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import {
//   FiHome, FiBarChart2, FiSettings, FiLogOut, FiCalendar,
//   FiArrowLeft, FiEdit3, FiAlertCircle, FiCheckCircle,
//   FiClock, FiInfo, FiUsers
// } from "react-icons/fi";
// import api from "../../../services/api";

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

// export default function ModifierElection() {
//   const { id }   = useParams();
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     title:            "",
//     description:      "",
//     type:             "UNINOMINAL",
//     startDate:        "",
//     endDate:          "",
//     dureeTourMinutes: 1440,
//     nbSieges:         29,
//   });
//   const [status,      setStatus]      = useState("");
//   const [loading,     setLoading]     = useState(true);
//   const [saving,      setSaving]      = useState(false);
//   const [saveSuccess, setSaveSuccess] = useState(false);

//   useEffect(() => {
//     const fetchElection = async () => {
//       try {
//         const res = await api.get(`/elections/${id}`);
//         const e   = res.data;
//         setFormData({
//           title:            e.titre       ?? "",
//           description:      e.description ?? "",
//           type:             e.type        ?? "UNINOMINAL",
//           startDate:        e.date_debut  ? e.date_debut.slice(0, 16) : "",
//           endDate:          e.date_fin    ? e.date_fin.slice(0, 16)   : "",
//           dureeTourMinutes: e.duree_tour_minutes ?? 1440,
//           nbSieges:         e.nb_sieges   ?? 29,
//         });
//         setStatus(e.statut);
//       } catch (err) {
//         console.error("Erreur fetch élection:", err.response?.data || err.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchElection();
//   }, [id]);

//   const isEditable = !["EN_COURS", "TERMINEE"].includes(status);
//   const isListe    = formData.type === "LISTE";

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
//     if (!isEditable) return;

//     if (isListe && (!formData.nbSieges || formData.nbSieges < 1)) {
//       alert("Le nombre de sièges doit être supérieur à 0.");
//       return;
//     }

//     setSaving(true);
//     try {
//       const dateFin = isListe
//         ? new Date(new Date(formData.startDate).getTime() + formData.dureeTourMinutes * 60000)
//             .toISOString().slice(0, 16)
//         : formData.endDate;

//       await api.put(`/elections/${id}`, {
//         titre:              formData.title,
//         description:        formData.description,
//         date_debut:         formData.startDate,
//         date_fin:           dateFin,
//         type:               formData.type,
//         duree_tour_minutes: isListe ? formData.dureeTourMinutes : null,
//         nb_sieges:          isListe ? formData.nbSieges : null,
//       });

//       setSaveSuccess(true);
//       setTimeout(() => navigate("/admin/adminelection/ElectionPage"), 1500);
//     } catch (err) {
//       console.error("Erreur modification:", err.response?.data || err.message);
//       alert("Erreur lors de la modification de l'élection");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) return (
//     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <div className="bg-white/80 backdrop-blur rounded-2xl p-10 flex flex-col items-center gap-4 shadow-lg">
//         <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
//         <p className="text-indigo-600 text-sm font-medium">Chargement…</p>
//       </div>
//     </div>
//   );

//   const dateFinTour1 = isListe && formData.startDate
//     ? new Date(new Date(formData.startDate).getTime() + formData.dureeTourMinutes * 60000)
//         .toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
//     : null;

//   const bonusSieges = isListe && formData.nbSieges ? Math.floor(formData.nbSieges / 2) : 0;
//   const resteSieges = isListe && formData.nbSieges ? formData.nbSieges - bonusSieges : 0;

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
//             { to: "/adminElectionDashboard",           icon: <FiHome size={15} />,      label: "Tableau de bord" },
//             { to: "/admin/adminelection/ElectionPage", icon: <FiCalendar size={15} />,  label: "Mes élections", active: true },
//             { to: "/admin/adminelection/resultats",    icon: <FiBarChart2 size={15} />, label: "Résultats" },
//           ].map(item => (
//             <Link key={item.to} to={item.to}
//               className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
//                 item.active ? "bg-indigo-100 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
//               }`}>
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

//         <div className="flex items-center justify-between mb-8">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
//               <FiEdit3 size={16} />
//             </div>
//             <div>
//               <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Modifier l'élection</h2>
//               <p className="text-xs text-indigo-400 font-mono mt-0.5">ID #{id}</p>
//             </div>
//           </div>
//           <Link to="/admin/adminelection/ElectionPage"
//             className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-medium shadow-sm">
//             <FiArrowLeft size={14} /> Retour
//           </Link>
//         </div>

//         {/* Bandeau statut */}
//         {status && (
//           <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium mb-6 border ${
//             isEditable ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
//           }`}>
//             {isEditable
//               ? <><FiCheckCircle size={15} /> Cette élection peut être modifiée.</>
//               : <><FiAlertCircle size={15} /> Modification impossible — statut : <strong className="ml-1">{status}</strong></>
//             }
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-7 space-y-6">

//           {/* Titre */}
//           <div>
//             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Titre *</label>
//             <input type="text" name="title" value={formData.title} onChange={handleChange}
//               disabled={!isEditable} required placeholder="Ex : Élection du conseil 2026"
//               className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
//           </div>

//           {/* Description */}
//           <div>
//             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
//             <textarea name="description" value={formData.description} onChange={handleChange}
//               disabled={!isEditable} rows="4" placeholder="Décrivez l'objet de cette élection…"
//               className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none" />
//           </div>

//           {/* Type */}
//           <div>
//             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type de scrutin *</label>
//             <select name="type" value={formData.type} onChange={handleChange} disabled={!isEditable}
//               className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
//               <option value="UNINOMINAL">Uninominal</option>
//               <option value="BINOMINAL">Binominal</option>
//               <option value="LISTE">Liste (tours successifs)</option>
//             </select>
//           </div>

//           {/* Date de début */}
//           <div>
//             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date et heure de début *</label>
//             <input type="datetime-local" name="startDate" value={formData.startDate}
//               onChange={handleChange} disabled={!isEditable} required
//               className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
//           </div>

//           {/* Date de fin — non-LISTE */}
//           {!isListe && (
//             <div>
//               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date et heure de fin *</label>
//               <input type="datetime-local" name="endDate" value={formData.endDate}
//                 onChange={handleChange} disabled={!isEditable} required
//                 className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
//             </div>
//           )}

//           {/* Champs LISTE */}
//           {isListe && (
//             <div className="space-y-4 pt-1">
//               <div className="flex items-center gap-2">
//                 <div className="flex-1 h-px bg-indigo-100" />
//                 <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-2">Scrutin de liste</span>
//                 <div className="flex-1 h-px bg-indigo-100" />
//               </div>

//               {/* Durée + Sièges */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
//                     <FiClock size={11} className="text-indigo-500" /> Durée par tour *
//                   </label>
//                   <select name="dureeTourMinutes" value={formData.dureeTourMinutes}
//                     onChange={handleChange} disabled={!isEditable} required
//                     className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
//                     {DUREE_OPTIONS.map(opt => (
//                       <option key={opt.value} value={opt.value}>{opt.label}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
//                     <FiUsers size={11} className="text-indigo-500" /> Nombre de sièges *
//                   </label>
//                   <input type="number" name="nbSieges" value={formData.nbSieges}
//                     onChange={handleChange} disabled={!isEditable} required min="1" max="999"
//                     placeholder="Ex : 29"
//                     className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
//                 </div>
//               </div>

//               {/* Aperçu répartition */}
//               {formData.nbSieges > 0 && (
//                 <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
//                   <p className="text-xs font-bold text-indigo-500 mb-2.5 flex items-center gap-1.5">
//                     <FiInfo size={11} /> Aperçu de la répartition des sièges
//                   </p>
//                   <div className="grid grid-cols-3 gap-2 text-center">
//                     <div className="bg-white rounded-lg p-2 border border-indigo-100">
//                       <p className="text-lg font-black text-indigo-700">{formData.nbSieges}</p>
//                       <p className="text-xs text-gray-400 mt-0.5">Total sièges</p>
//                     </div>
//                     <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
//                       <p className="text-lg font-black text-amber-600">{bonusSieges}</p>
//                       <p className="text-xs text-amber-500 mt-0.5">Bonus gagnant</p>
//                     </div>
//                     <div className="bg-white rounded-lg p-2 border border-indigo-100">
//                       <p className="text-lg font-black text-indigo-500">{resteSieges}</p>
//                       <p className="text-xs text-gray-400 mt-0.5">Répartis props.</p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Aperçu calendrier */}
//               {dateFinTour1 && (
//                 <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
//                   <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
//                     <FiCalendar size={11} /> Aperçu du calendrier
//                   </p>
//                   <div className="space-y-1.5 text-xs">
//                     <div className="flex justify-between">
//                       <span className="text-gray-400">Début Tour 1</span>
//                       <span className="font-semibold text-indigo-700">
//                         {new Date(formData.startDate).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-400">Fin Tour 1</span>
//                       <span className="font-semibold text-indigo-600">{dateFinTour1}</span>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Actions */}
//           {isEditable && (
//             <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
//               <Link to="/admin/adminelection/ElectionPage"
//                 className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all">
//                 Annuler
//               </Link>
//               <button type="submit" disabled={saving || saveSuccess}
//                 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 shadow-md ${
//                   saveSuccess ? "bg-emerald-500 shadow-emerald-200/60" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/60"
//                 } disabled:opacity-75 disabled:cursor-not-allowed`}>
//                 {saveSuccess
//                   ? <><FiCheckCircle size={14} /> Enregistré !</>
//                   : saving
//                   ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</>
//                   : <><FiEdit3 size={14} /> Enregistrer les modifications</>
//                 }
//               </button>
//             </div>
//           )}
//         </form>

//       </main>
//     </div>
//   );
// }

