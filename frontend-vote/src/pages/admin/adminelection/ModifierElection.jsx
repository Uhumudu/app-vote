// src/pages/adminElection/ModifierElection.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut,
  FiCalendar, FiUserCheck, FiArrowLeft, FiEdit3,
  FiAlertCircle, FiCheckCircle, FiClock, FiType, FiAlignLeft, FiList
} from "react-icons/fi";
import api from "../../../services/api";

export default function ModifierElection() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "UNINOMINAL",
    startDate: "",
    endDate: "",
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ===== Récupérer l'élection pour pré-remplissage =====
  useEffect(() => {
    const fetchElection = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/elections/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const e = res.data;

        // Format pour datetime-local : "YYYY-MM-DDTHH:MM"
        const startDate = e.date_debut ? e.date_debut.slice(0, 16) : "";
        const endDate = e.date_fin ? e.date_fin.slice(0, 16) : "";

        setFormData({
          title: e.titre,
          description: e.description,
          type: e.type,
          startDate,
          endDate,
        });

        setStatus(e.statut);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du fetch de l'élection:", error.response?.data || error.message);
        setLoading(false);
      }
    };
    fetchElection();
  }, [id]);

  const isEditable = status !== "EN_COURS" && status !== "TERMINEE";

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditable) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await api.put(`/elections/${id}`, {
        titre: formData.title,
        description: formData.description,
        date_debut: formData.startDate,
        date_fin: formData.endDate,
        type: formData.type,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSaveSuccess(true);
      setTimeout(() => navigate("/admin/adminelection/ElectionPage"), 1500);
    } catch (error) {
      console.error("Erreur lors de la modification:", error.response?.data || error.message);
      alert("Erreur lors de la modification de l'élection");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-indigo-600 text-sm font-medium">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* Sidebar */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r border-indigo-100 p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
        <nav className="flex-1 space-y-1">
          <Link to="/adminElectionDashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium">
            <FiHome size={16} /> Tableau de bord
          </Link>
          <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-100 text-indigo-700 font-semibold text-sm">
            <FiCalendar size={16} /> Mes élections
          </Link>
          <Link to="/admin/adminelection/candidats" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium">
            <FiUsers size={16} /> Candidats
          </Link>
          <Link to={`/admin/adminelection/electeurs/${id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium">
            <FiUserCheck size={16} /> Électeurs
          </Link>
          <Link to="/admin/adminelection/resultats" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium">
            <FiBarChart2 size={16} /> Résultats
          </Link>
        </nav>

        <div className="space-y-1 mt-6 pt-6 border-t border-indigo-100">
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 transition-colors text-sm font-medium">
            <FiSettings size={16} /> Paramètres
          </Link>
          <Link to="/logout" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium">
            <FiLogOut size={16} /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm">
              <FiEdit3 size={17} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-indigo-900">Modifier l'élection</h2>
              <p className="text-xs text-indigo-400 font-mono mt-0.5">ID #{id}</p>
            </div>
          </div>
          <Link
            to="/admin/adminelection/ElectionPage"
            className="flex items-center gap-2 px-4 py-2 bg-white/70 border border-indigo-100 text-indigo-700 rounded-xl hover:bg-white transition shadow-sm text-sm font-medium"
          >
            <FiArrowLeft size={14} /> Retour
          </Link>
        </div>

        {/* Statut */}
        {status && (
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium mb-6 border ${
            isEditable
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {isEditable
              ? <><FiCheckCircle size={16} /> Cette élection peut être modifiée</>
              : <><FiAlertCircle size={16} /> Cette élection ne peut plus être modifiée — statut : <strong className="ml-1">{status}</strong></>
            }
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl bg-indigo-50 backdrop-blur p-8 rounded-2xl shadow-sm border border-indigo-200">

          {/* Titre */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
              <FiType size={12} /> Titre de l'élection
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={!isEditable}
              placeholder="Ex : Élection du conseil municipal 2025"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
              <FiAlignLeft size={12} /> Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={!isEditable}
              rows="4"
              placeholder="Décrivez l'objet de cette élection…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Type + Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                <FiList size={12} /> Type de scrutin
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={!isEditable}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 text-sm bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="UNINOMINAL">Uninominal</option>
                <option value="BINOMINAL">Binominal</option>
                <option value="LISTE">Liste</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                <FiClock size={12} /> Date et heure de début
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                disabled={!isEditable}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                <FiClock size={12} /> Date et heure de fin
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                disabled={!isEditable}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Actions */}
          {isEditable && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Link
                to="/admin/adminelection/ElectionPage"
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Annuler
              </Link>

              <button
                type="submit"
                disabled={saving || saveSuccess}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all
                  ${saveSuccess
                    ? "bg-emerald-500"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0"
                  } disabled:opacity-75 disabled:cursor-not-allowed`}
              >
                {saveSuccess ? (
                  <><FiCheckCircle size={15} /> Enregistré !</>
                ) : saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Enregistrement…
                  </>
                ) : (
                  <><FiEdit3 size={15} /> Enregistrer les modifications</>
                )}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

















// // src/pages/adminElection/ModifierElection.jsx
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import {
//   FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut,
//   FiCalendar, FiUserCheck, FiArrowLeft, FiEdit3,
//   FiAlertCircle, FiCheckCircle, FiClock, FiType, FiAlignLeft, FiList
// } from "react-icons/fi";
// import api from "../../../services/api";

// export default function ModifierElection() {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     type: "UNINOMINAL",
//     startDate: "",
//     endDate: "",
//   });
//   const [status, setStatus] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [saveSuccess, setSaveSuccess] = useState(false);

//   useEffect(() => {
//     const fetchElection = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await api.get(`/elections/${id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const e = res.data;
//         setFormData({
//           title: e.titre,
//           description: e.description,
//           type: e.type,
//           startDate: e.date_debut ? e.date_debut.slice(0, 16) : "",
//           endDate: e.date_fin ? e.date_fin.slice(0, 16) : "",
//         });
//         setStatus(e.statut);
//         setLoading(false);
//       } catch (error) {
//         console.error("Erreur lors du fetch de l'élection:", error.response?.data || error.message);
//         setLoading(false);
//       }
//     };
//     fetchElection();
//   }, [id]);

//   const isEditable = status !== "EN_COURS" && status !== "TERMINEE";

//   const handleChange = (e) =>
//     setFormData({ ...formData, [e.target.name]: e.target.value });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!isEditable) return;
//     setSaving(true);
//     try {
//       const token = localStorage.getItem("token");
//       await api.put(`/elections/${id}`, {
//         titre: formData.title,
//         description: formData.description,
//         date_debut: formData.startDate,
//         date_fin: formData.endDate,
//         type: formData.type,
//       }, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setSaveSuccess(true);
//       setTimeout(() => navigate("/admin/adminelection/ElectionPage"), 1500);
//     } catch (error) {
//       console.error("Erreur lors de la modification:", error.response?.data || error.message);
//       alert("Erreur lors de la modification de l'élection");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
//           <p className="text-indigo-600 text-sm font-medium">Chargement…</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ===== SIDEBAR — identique à l'original ===== */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r border-indigo-100 p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//         <nav className="flex-1 space-y-1">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium">
//             <FiHome size={16} /> Tableau de bord
//           </Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-100 text-indigo-700 font-semibold text-sm">
//             <FiCalendar size={16} /> Mes élections
//           </Link>
//           <Link to="/admin/adminelection/candidats" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium">
//             <FiUsers size={16} /> Candidats
//           </Link>
//           <Link to={`/admin/adminelection/electeurs/${id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium">
//             <FiUserCheck size={16} /> Électeurs
//           </Link>
//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium">
//             <FiBarChart2 size={16} /> Résultats
//           </Link>
//         </nav>

//         <div className="space-y-1 mt-6 pt-6 border-t border-indigo-100">
//           <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 transition-colors text-sm font-medium">
//             <FiSettings size={16} /> Paramètres
//           </Link>
//           <Link to="/logout" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium">
//             <FiLogOut size={16} /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ===== CONTENU PRINCIPAL ===== */}
//       <main className="flex-1 p-8">

//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm">
//               <FiEdit3 size={17} />
//             </div>
//             <div>
//               <h2 className="text-2xl font-bold text-indigo-900">Modifier l'élection</h2>
//               <p className="text-xs text-indigo-400 font-mono mt-0.5">ID #{id}</p>
//             </div>
//           </div>
//           <Link
//             to="/admin/adminelection/ElectionPage"
//             className="flex items-center gap-2 px-4 py-2 bg-white/70 border border-indigo-100 text-indigo-700 rounded-xl hover:bg-white transition shadow-sm text-sm font-medium"
//           >
//             <FiArrowLeft size={14} /> Retour
//           </Link>
//         </div>

//         {/* ===== Bannière de statut ===== */}
//         {status && (
//           <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium mb-6 border ${
//             isEditable
//               ? "bg-emerald-50 text-emerald-700 border-emerald-200"
//               : "bg-amber-50 text-amber-700 border-amber-200"
//           }`}>
//             {isEditable
//               ? <><FiCheckCircle size={16} /> Cette élection peut être modifiée</>
//               : <><FiAlertCircle size={16} /> Cette élection ne peut plus être modifiée — statut : <strong className="ml-1">{status}</strong></>
//             }
//           </div>
//         )}

//         {/* ===== Formulaire ===== */}
//         <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl bg-indigo-50 backdrop-blur p-8 rounded-2xl shadow-sm border border-indigo-200">

//           {/* Titre */}
//           <div className="space-y-1.5">
//             <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
//               <FiType size={12} /> Titre de l'élection
//             </label>
//             <input
//               type="text"
//               name="title"
//               value={formData.title}
//               onChange={handleChange}
//               disabled={!isEditable}
//               placeholder="Ex : Élection du conseil municipal 2025"
//               className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
//             />
//           </div>

//           {/* Description */}
//           <div className="space-y-1.5">
//             <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
//               <FiAlignLeft size={12} /> Description
//             </label>
//             <textarea
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               disabled={!isEditable}
//               rows="4"
//               placeholder="Décrivez l'objet de cette élection…"
//               className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
//             />
//           </div>

//           {/* Type + Dates */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="space-y-1.5">
//               <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
//                 <FiList size={12} /> Type de scrutin
//               </label>
//               <select
//                 name="type"
//                 value={formData.type}
//                 onChange={handleChange}
//                 disabled={!isEditable}
//                 className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 text-sm bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
//               >
//                 <option value="UNINOMINAL">Uninominal</option>
//                 <option value="BINOMINAL">Binominal</option>
//                 <option value="LISTE">Liste</option>
//               </select>
//             </div>

//             <div className="space-y-1.5">
//               <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
//                 <FiClock size={12} /> Date de début
//               </label>
//               <input
//                 type="datetime-local"
//                 name="startDate"
//                 value={formData.startDate}
//                 onChange={handleChange}
//                 disabled={!isEditable}
//                 className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
//               />
//             </div>

//             <div className="space-y-1.5">
//               <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
//                 <FiClock size={12} /> Date de fin
//               </label>
//               <input
//                 type="datetime-local"
//                 name="endDate"
//                 value={formData.endDate}
//                 onChange={handleChange}
//                 disabled={!isEditable}
//                 className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
//               />
//             </div>
//           </div>

//           {/* ===== Actions ===== */}
//           {isEditable && (
//             <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
//               <Link
//                 to="/admin/adminelection/ElectionPage"
//                 className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
//               >
//                 Annuler
//               </Link>

//               <button
//                 type="submit"
//                 disabled={saving || saveSuccess}
//                 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all
//                   ${saveSuccess
//                     ? "bg-emerald-500"
//                     : "bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0"
//                   } disabled:opacity-75 disabled:cursor-not-allowed`}
//               >
//                 {saveSuccess ? (
//                   <><FiCheckCircle size={15} /> Enregistré !</>
//                 ) : saving ? (
//                   <>
//                     <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
//                     </svg>
//                     Enregistrement…
//                   </>
//                 ) : (
//                   <><FiEdit3 size={15} /> Enregistrer les modifications</>
//                 )}
//               </button>
//             </div>
//           )}
//         </form>
//       </main>
//     </div>
//   );
// }


