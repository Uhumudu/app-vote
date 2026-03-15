// src/pages/admin/adminelection/ElectionPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEdit, FiPlus, FiHome, FiUsers, FiBarChart2,
  FiSettings, FiLogOut, FiCalendar, FiUserCheck,
  FiTrash2, FiChevronDown, FiChevronUp, FiRepeat
} from "react-icons/fi";
import api from "../../../services/api";

export default function ElectionPage() {
  const [elections,   setElections]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState({ msg: "", type: "success" });
  const [expandedId,  setExpandedId]  = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchElections(); }, []);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const fetchElections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/elections");
      setElections(res.data.map(e => ({
        id:          e.id_election,
        title:       e.titre,
        type:        e.type,
        startDate:   e.date_debut,
        endDate:     e.date_fin,
        status:
          e.statut === "EN_COURS"   ? "En cours"    :
          e.statut === "TERMINEE"   ? "Terminée"    :
          e.statut === "EN_ATTENTE" ? "Non ouverte" :
          e.statut === "APPROUVEE"  ? "Approuvée"   :
          e.statut === "SUSPENDUE"  ? "Suspendue"   : e.statut,
        statut:      e.statut,
        tourCourant: e.tour_courant || 1,
      })));
    } catch (err) {
      console.error("Erreur fetch élections:", err.response?.data || err.message);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette élection définitivement ?")) return;
    try {
      await api.delete(`/elections/${id}`);
      notify("Élection supprimée");
      fetchElections();
    } catch (err) {
      notify(err.response?.data?.message || "Erreur suppression", "error");
    }
  };

  const selectElection    = (id) => localStorage.setItem("activeElectionId", id);
  const handleGererCandidats  = (id) => { selectElection(id); navigate("/admin/adminelection/candidats"); };
  const handleGererElecteurs  = (id) => { selectElection(id); navigate(`/admin/adminelection/electeurs/${id}`); };
  const handleDepouillement   = (id) => { selectElection(id); navigate(`/admin/adminelection/depouillement/${id}`); };

  const formatDate = (d) =>
    new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const statusConfig = (status) => {
    const map = {
      // Valeurs françaises mappées
      "En cours":    { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", dot: true,  dotColor: "#10b981" },
      "Terminée":    { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db", dot: false, dotColor: "#9ca3af" },
      "Approuvée":   { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", dot: false, dotColor: "#3b82f6" },
      "Suspendue":   { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", dot: false, dotColor: "#ef4444" },
      "Non ouverte": { bg: "#fef3c7", color: "#78350f", border: "#fcd34d", dot: false, dotColor: "#f59e0b" },
      // Valeurs brutes backend (sécurité)
      "EN_COURS":    { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", dot: true,  dotColor: "#10b981" },
      "TERMINEE":    { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db", dot: false, dotColor: "#9ca3af" },
      "APPROUVEE":   { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", dot: false, dotColor: "#3b82f6" },
      "SUSPENDUE":   { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", dot: false, dotColor: "#ef4444" },
      "EN_ATTENTE":  { bg: "#fef3c7", color: "#78350f", border: "#fcd34d", dot: false, dotColor: "#f59e0b" },
    };
    return map[status] || { bg: "#e0e7ff", color: "#3730a3", border: "#a5b4fc", dot: false, dotColor: "#6366f1" };
  };

  const canEdit = (statut) => !["EN_COURS", "TERMINEE"].includes(statut);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition-all animate-fade-in ${
          toast.type === "error" ? "bg-red-600" : "bg-indigo-700"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 p-6 flex flex-col shadow-sm">
        <div className="mb-10">
          <h1 className="text-xl font-black text-indigo-700 tracking-tight">🗳 eVote</h1>
          <p className="text-xs text-indigo-400 font-medium mt-0.5">Espace administrateur</p>
        </div>
        <nav className="flex-1 space-y-1">
          {[
            { to: "/adminElectionDashboard",             icon: <FiHome size={15} />,     label: "Tableau de bord" },
            { to: "/admin/adminelection/ElectionPage",   icon: <FiCalendar size={15} />, label: "Mes élections",  active: true },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? "bg-indigo-100 text-indigo-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
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

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Mes élections</h2>
            {!loading && (
              <p className="text-sm text-indigo-400 mt-1">{elections.length} élection{elections.length > 1 ? "s" : ""} enregistrée{elections.length > 1 ? "s" : ""}</p>
            )}
          </div>
          <Link
            to="/admin/adminelection/Creer-election"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all font-semibold text-sm shadow-md shadow-indigo-200/60"
          >
            <FiPlus size={15} /> Nouvelle élection
          </Link>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-indigo-700">
                {["Titre", "Type", "Début", "Fin", "Statut", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3.5 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${
                      h === "Titre"   ? "w-auto" :
                      h === "Type"    ? "w-28" :
                      h === "Début"   ? "w-36" :
                      h === "Fin"     ? "w-36" :
                      h === "Statut"  ? "w-36" :
                      "w-48 text-center"
                    } ${i < 5 ? "border-r border-indigo-600/50" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                      <p className="text-gray-400 text-sm">Chargement…</p>
                    </div>
                  </td>
                </tr>
              ) : elections.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <FiCalendar className="text-indigo-300 text-2xl" />
                      </div>
                      <p className="text-gray-500 font-semibold">Aucune élection</p>
                      <Link to="/admin/adminelection/Creer-election" className="text-indigo-600 text-sm font-medium hover:underline">
                        Créer votre première élection →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                elections.map((election, index) => {
                  const sc = statusConfig(election.status) || statusConfig(election.statut);
                  return (
                    <React.Fragment key={election.id}>
                      <tr className={`border-b border-gray-100 transition-colors duration-150 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      } hover:bg-indigo-50/40`}>

                        {/* Titre */}
                        <td className="px-4 py-3.5 border-r border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">{election.title}</span>
                            {election.type === "LISTE" && election.statut === "EN_COURS" && election.tourCourant > 1 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">
                                <FiRepeat size={9} /> T{election.tourCourant}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3.5 border-r border-gray-100">
                          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                            {election.type}
                          </span>
                        </td>

                        {/* Dates */}
                        <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">{formatDate(election.startDate)}</td>
                        <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">{formatDate(election.endDate)}</td>

                        {/* Statut */}
                        <td className="px-4 py-3.5 border-r border-gray-100 w-36">
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap"
                            style={{
                              backgroundColor: sc.bg,
                              color:           sc.color,
                              borderColor:     sc.border,
                            }}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot ? "animate-pulse" : ""}`}
                              style={{ backgroundColor: sc.dotColor }}
                            />
                            {election.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex justify-center items-center gap-1.5 flex-wrap">
                            {canEdit(election.statut) && (
                              <Link
                                to={`/admin/adminelection/modifier-election/${election.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:scale-95 transition-all text-xs font-bold"
                              >
                                <FiEdit size={11} /> Modifier
                              </Link>
                            )}
                            <Link
                              to={`/admin/adminelection/detail-election/${election.id}`}
                              onClick={() => selectElection(election.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all text-xs font-medium"
                            >
                              Détails
                            </Link>
                            <button
                              onClick={() => setExpandedId(expandedId === election.id ? null : election.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold border ${
                                expandedId === election.id
                                  ? "bg-violet-700 text-white border-violet-700 shadow-sm"
                                  : "bg-violet-600 text-white border-violet-600 hover:bg-violet-700 active:scale-95"
                              }`}
                            >
                              Gérer {expandedId === election.id ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
                            </button>
                            {canEdit(election.statut) && (
                              <button
                                onClick={() => handleDelete(election.id)}
                                className="inline-flex items-center px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-xs"
                                title="Supprimer"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Ligne expandée */}
                      {expandedId === election.id && (
                        <tr className="bg-violet-50/60 border-b border-violet-100">
                          <td colSpan="6" className="px-6 py-4">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-xs font-bold text-violet-600 uppercase tracking-wider mr-1">
                                {election.title}
                              </span>

                              <button
                                onClick={() => handleGererCandidats(election.id)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-xs font-semibold shadow-sm"
                              >
                                <FiUsers size={13} /> Candidats
                              </button>

                              <button
                                onClick={() => handleGererElecteurs(election.id)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:scale-95 transition-all text-xs font-semibold shadow-sm"
                              >
                                <FiUserCheck size={13} /> Électeurs
                              </button>

                              {election.type === "LISTE" && election.statut === "EN_COURS" && (
                                <button
                                  onClick={() => handleDepouillement(election.id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:scale-95 transition-all text-xs font-semibold shadow-sm"
                                >
                                  <FiRepeat size={13} />
                                  Dépouillement
                                  {election.tourCourant > 1 && (
                                    <span className="bg-orange-600/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                      T{election.tourCourant}
                                    </span>
                                  )}
                                </button>
                              )}

                              {!["EN_ATTENTE", "SUSPENDUE"].includes(election.statut) && (
                                <Link
                                  to="/admin/adminelection/resultats"
                                  onClick={() => selectElection(election.id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:scale-95 transition-all text-xs font-semibold shadow-sm"
                                >
                                  <FiBarChart2 size={13} /> Résultats
                                </Link>
                              )}
                            </div>

                            {election.type === "LISTE" && election.statut === "EN_COURS" && (
                              <p className="mt-3 text-xs text-orange-600 flex items-center gap-1.5">
                                <FiRepeat size={11} />
                                Scrutin à tours successifs — Tour courant : <strong>{election.tourCourant}</strong> — Clôturez le tour depuis l'interface de dépouillement.
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}


















// // src/pages/admin/adminelection/ElectionPage.jsx
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   FiEdit, FiPlus, FiHome, FiUsers, FiBarChart2,
//   FiSettings, FiLogOut, FiCalendar, FiUserCheck,
//   FiTrash2, FiChevronDown, FiChevronUp, FiRepeat
// } from "react-icons/fi";
// import api from "../../../services/api";

// export default function ElectionPage() {
//   const [elections,   setElections]   = useState([]);
//   const [loading,     setLoading]     = useState(true);
//   const [toast,       setToast]       = useState({ msg: "", type: "success" });
//   const [expandedId,  setExpandedId]  = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => { fetchElections(); }, []);

//   const notify = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
//   };

//   const fetchElections = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/elections");
//       setElections(res.data.map(e => ({
//         id:          e.id_election,
//         title:       e.titre,
//         type:        e.type,
//         startDate:   e.date_debut,
//         endDate:     e.date_fin,
//         status:
//           e.statut === "EN_COURS"   ? "En cours"    :
//           e.statut === "TERMINEE"   ? "Terminée"    :
//           e.statut === "EN_ATTENTE" ? "Non ouverte" :
//           e.statut === "APPROUVEE"  ? "Approuvée"   :
//           e.statut === "SUSPENDUE"  ? "Suspendue"   : e.statut,
//         statut:      e.statut,
//         tourCourant: e.tour_courant || 1,
//       })));
//     } catch (err) {
//       console.error("Erreur fetch élections:", err.response?.data || err.message);
//     } finally { setLoading(false); }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Supprimer cette élection définitivement ?")) return;
//     try {
//       await api.delete(`/elections/${id}`);
//       notify("Élection supprimée");
//       fetchElections();
//     } catch (err) {
//       notify(err.response?.data?.message || "Erreur suppression", "error");
//     }
//   };

//   const selectElection    = (id) => localStorage.setItem("activeElectionId", id);
//   const handleGererCandidats  = (id) => { selectElection(id); navigate("/admin/adminelection/candidats"); };
//   const handleGererElecteurs  = (id) => { selectElection(id); navigate(`/admin/adminelection/electeurs/${id}`); };
//   const handleDepouillement   = (id) => { selectElection(id); navigate(`/admin/adminelection/depouillement/${id}`); };

//   const formatDate = (d) =>
//     new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

//   const statusConfig = (status) => {
//     const map = {
//       "En cours":    { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: true },
//       "Terminée":    { cls: "bg-gray-100 text-gray-500 border-gray-200",          dot: false },
//       "Approuvée":   { cls: "bg-blue-100 text-blue-700 border-blue-200",          dot: false },
//       "Suspendue":   { cls: "bg-red-100 text-red-600 border-red-200",             dot: false },
//       "Non ouverte": { cls: "bg-amber-100 text-amber-700 border-amber-200",       dot: false },
//     };
//     return map[status] || { cls: "bg-gray-100 text-gray-500 border-gray-200", dot: false };
//   };

//   const canEdit = (statut) => !["EN_COURS", "TERMINEE"].includes(statut);

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ── TOAST ─────────────────────────────────────────────────────────── */}
//       {toast.msg && (
//         <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition-all animate-fade-in ${
//           toast.type === "error" ? "bg-red-600" : "bg-indigo-700"
//         }`}>
//           {toast.msg}
//         </div>
//       )}

//       {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
//       <aside className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 p-6 flex flex-col shadow-sm">
//         <div className="mb-10">
//           <h1 className="text-xl font-black text-indigo-700 tracking-tight">🗳 eVote</h1>
//           <p className="text-xs text-indigo-400 font-medium mt-0.5">Espace administrateur</p>
//         </div>
//         <nav className="flex-1 space-y-1">
//           {[
//             { to: "/adminElectionDashboard",             icon: <FiHome size={15} />,     label: "Tableau de bord" },
//             { to: "/admin/adminelection/ElectionPage",   icon: <FiCalendar size={15} />, label: "Mes élections",  active: true },
//           ].map(item => (
//             <Link
//               key={item.to}
//               to={item.to}
//               className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
//                 item.active
//                   ? "bg-indigo-100 text-indigo-700 font-semibold"
//                   : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
//               }`}
//             >
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
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//           <div>
//             <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Mes élections</h2>
//             {!loading && (
//               <p className="text-sm text-indigo-400 mt-1">{elections.length} élection{elections.length > 1 ? "s" : ""} enregistrée{elections.length > 1 ? "s" : ""}</p>
//             )}
//           </div>
//           <Link
//             to="/admin/adminelection/Creer-election"
//             className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all font-semibold text-sm shadow-md shadow-indigo-200/60"
//           >
//             <FiPlus size={15} /> Nouvelle élection
//           </Link>
//         </div>

//         {/* TABLE */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//           <table className="min-w-full border-collapse">
//             <thead>
//               <tr className="bg-indigo-700">
//                 {["Titre", "Type", "Début", "Fin", "Statut", "Actions"].map((h, i) => (
//                   <th
//                     key={h}
//                     className={`px-4 py-3.5 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${
//                       h === "Titre"   ? "w-auto" :
//                       h === "Type"    ? "w-28" :
//                       h === "Début"   ? "w-36" :
//                       h === "Fin"     ? "w-36" :
//                       h === "Statut"  ? "w-36" :
//                       "w-48 text-center"
//                     } ${i < 5 ? "border-r border-indigo-600/50" : ""}`}
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan="6" className="p-12 text-center">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
//                       <p className="text-gray-400 text-sm">Chargement…</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : elections.length === 0 ? (
//                 <tr>
//                   <td colSpan="6" className="p-16 text-center">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
//                         <FiCalendar className="text-indigo-300 text-2xl" />
//                       </div>
//                       <p className="text-gray-500 font-semibold">Aucune élection</p>
//                       <Link to="/admin/adminelection/Creer-election" className="text-indigo-600 text-sm font-medium hover:underline">
//                         Créer votre première élection →
//                       </Link>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 elections.map((election, index) => {
//                   const sc = statusConfig(election.status);
//                   return (
//                     <React.Fragment key={election.id}>
//                       <tr className={`border-b border-gray-100 transition-colors duration-150 ${
//                         index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
//                       } hover:bg-indigo-50/40`}>

//                         {/* Titre */}
//                         <td className="px-4 py-3.5 border-r border-gray-100">
//                           <div className="flex items-center gap-2">
//                             <span className="text-sm font-semibold text-gray-800">{election.title}</span>
//                             {election.type === "LISTE" && election.statut === "EN_COURS" && election.tourCourant > 1 && (
//                               <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">
//                                 <FiRepeat size={9} /> T{election.tourCourant}
//                               </span>
//                             )}
//                           </div>
//                         </td>

//                         {/* Type */}
//                         <td className="px-4 py-3.5 border-r border-gray-100">
//                           <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
//                             {election.type}
//                           </span>
//                         </td>

//                         {/* Dates */}
//                         <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">{formatDate(election.startDate)}</td>
//                         <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">{formatDate(election.endDate)}</td>

//                         {/* Statut */}
//                         <td className="px-4 py-3.5 border-r border-gray-100 w-36">
//                           <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${sc.cls}`}>
//                             {sc.dot
//                               ? <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
//                               : <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
//                                   election.status === "Terminée"    ? "bg-gray-400" :
//                                   election.status === "Approuvée"   ? "bg-blue-500" :
//                                   election.status === "Suspendue"   ? "bg-red-500"  :
//                                   election.status === "Non ouverte" ? "bg-amber-500" : "bg-gray-400"
//                                 }`}
//                               />
//                             }
//                             {election.status}
//                           </span>
//                         </td>

//                         {/* Actions */}
//                         <td className="px-4 py-3.5 text-center">
//                           <div className="flex justify-center items-center gap-1.5 flex-wrap">
//                             {canEdit(election.statut) && (
//                               <Link
//                                 to={`/admin/adminelection/modifier-election/${election.id}`}
//                                 className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:scale-95 transition-all text-xs font-bold"
//                               >
//                                 <FiEdit size={11} /> Modifier
//                               </Link>
//                             )}
//                             <Link
//                               to={`/admin/adminelection/detail-election/${election.id}`}
//                               onClick={() => selectElection(election.id)}
//                               className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all text-xs font-medium"
//                             >
//                               Détails
//                             </Link>
//                             <button
//                               onClick={() => setExpandedId(expandedId === election.id ? null : election.id)}
//                               className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold border ${
//                                 expandedId === election.id
//                                   ? "bg-violet-700 text-white border-violet-700 shadow-sm"
//                                   : "bg-violet-600 text-white border-violet-600 hover:bg-violet-700 active:scale-95"
//                               }`}
//                             >
//                               Gérer {expandedId === election.id ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
//                             </button>
//                             {canEdit(election.statut) && (
//                               <button
//                                 onClick={() => handleDelete(election.id)}
//                                 className="inline-flex items-center px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-xs"
//                                 title="Supprimer"
//                               >
//                                 <FiTrash2 size={12} />
//                               </button>
//                             )}
//                           </div>
//                         </td>
//                       </tr>

//                       {/* Ligne expandée */}
//                       {expandedId === election.id && (
//                         <tr className="bg-violet-50/60 border-b border-violet-100">
//                           <td colSpan="6" className="px-6 py-4">
//                             <div className="flex items-center gap-3 flex-wrap">
//                               <span className="text-xs font-bold text-violet-600 uppercase tracking-wider mr-1">
//                                 {election.title}
//                               </span>

//                               <button
//                                 onClick={() => handleGererCandidats(election.id)}
//                                 className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-xs font-semibold shadow-sm"
//                               >
//                                 <FiUsers size={13} /> Candidats
//                               </button>

//                               <button
//                                 onClick={() => handleGererElecteurs(election.id)}
//                                 className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:scale-95 transition-all text-xs font-semibold shadow-sm"
//                               >
//                                 <FiUserCheck size={13} /> Électeurs
//                               </button>

//                               {election.type === "LISTE" && election.statut === "EN_COURS" && (
//                                 <button
//                                   onClick={() => handleDepouillement(election.id)}
//                                   className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:scale-95 transition-all text-xs font-semibold shadow-sm"
//                                 >
//                                   <FiRepeat size={13} />
//                                   Dépouillement
//                                   {election.tourCourant > 1 && (
//                                     <span className="bg-orange-600/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
//                                       T{election.tourCourant}
//                                     </span>
//                                   )}
//                                 </button>
//                               )}

//                               {!["EN_ATTENTE", "SUSPENDUE"].includes(election.statut) && (
//                                 <Link
//                                   to="/admin/adminelection/resultats"
//                                   onClick={() => selectElection(election.id)}
//                                   className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:scale-95 transition-all text-xs font-semibold shadow-sm"
//                                 >
//                                   <FiBarChart2 size={13} /> Résultats
//                                 </Link>
//                               )}
//                             </div>

//                             {election.type === "LISTE" && election.statut === "EN_COURS" && (
//                               <p className="mt-3 text-xs text-orange-600 flex items-center gap-1.5">
//                                 <FiRepeat size={11} />
//                                 Scrutin à tours successifs — Tour courant : <strong>{election.tourCourant}</strong> — Clôturez le tour depuis l'interface de dépouillement.
//                               </p>
//                             )}
//                           </td>
//                         </tr>
//                       )}
//                     </React.Fragment>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>

//       </main>
//     </div>
//   );
// }

















// // src/pages/adminElection/ElectionPage.jsx
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   FiEdit, FiPlus, FiHome, FiUsers, FiBarChart2,
//   FiSettings, FiLogOut, FiCalendar, FiUserCheck,
//   FiTrash2, FiChevronDown, FiChevronUp, FiRepeat
// } from "react-icons/fi";
// import api from "../../../services/api";

// export default function ElectionPage() {
//   const [elections, setElections]   = useState([]);
//   const [loading, setLoading]       = useState(true);
//   const [toast, setToast]           = useState({ msg: "", type: "success" });
//   const [expandedId, setExpandedId] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => { fetchElections(); }, []);

//   const notify = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
//   };

//   const fetchElections = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/elections");
//       setElections(res.data.map(e => ({
//         id:        e.id_election,
//         title:     e.titre,
//         type:      e.type,
//         startDate: e.date_debut,
//         endDate:   e.date_fin,
//         status:
//           e.statut === "EN_COURS"   ? "En cours"    :
//           e.statut === "TERMINEE"   ? "Terminée"    :
//           e.statut === "EN_ATTENTE" ? "Non ouverte" :
//           e.statut === "APPROUVEE"  ? "Approuvée"   :
//           e.statut === "SUSPENDUE"  ? "Suspendue"   : e.statut,
//         statut:     e.statut,
//         tourCourant: e.tour_courant || 1,
//       })));
//     } catch (err) {
//       console.error("Erreur fetch élections:", err.response?.data || err.message);
//     } finally { setLoading(false); }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Supprimer cette élection définitivement ?")) return;
//     try {
//       await api.delete(`/elections/${id}`);
//       notify("Élection supprimée");
//       fetchElections();
//     } catch (err) {
//       notify(err.response?.data?.message || "Erreur suppression", "error");
//     }
//   };

//   const selectElection = (id) => localStorage.setItem("activeElectionId", id);

//   const handleGererCandidats = (id) => {
//     selectElection(id);
//     navigate("/admin/adminelection/candidats");
//   };

//   const handleGererElecteurs = (id) => {
//     selectElection(id);
//     navigate(`/admin/adminelection/electeurs/${id}`);
//   };

//   const handleDepouillement = (id) => {
//     selectElection(id);
//     navigate(`/admin/adminelection/depouillement/${id}`);
//   };

//   const formatDateTime = (d) =>
//     new Date(d).toLocaleString("fr-FR", {
//       day: "2-digit", month: "2-digit", year: "numeric",
//       hour: "2-digit", minute: "2-digit"
//     });

//   const statusStyle = (status) => {
//     if (status === "En cours")   return "bg-green-100 text-green-700";
//     if (status === "Terminée")   return "bg-gray-100 text-gray-500";
//     if (status === "Approuvée")  return "bg-blue-100 text-blue-700";
//     if (status === "Suspendue")  return "bg-red-100 text-red-600";
//     return "bg-yellow-100 text-yellow-700";
//   };

//   const canEdit = (statut) => !["EN_COURS", "TERMINEE"].includes(statut);

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* TOAST */}
//       {toast.msg && (
//         <div className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium transition-all
//           ${toast.type === "error" ? "bg-red-600" : "bg-indigo-700"}`}>
//           {toast.msg}
//         </div>
//       )}

//       {/* SIDEBAR */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard"
//             className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiHome /> Tableau de bord
//           </Link>
//           <Link to="/admin/adminelection/ElectionPage"
//             className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-100 font-semibold">
//             <FiCalendar /> Mes élections
//           </Link>
//         </nav>
//         <div className="space-y-3 mt-6">
//           <Link to="/settings"
//             className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings /> Paramètres
//           </Link>
//           <Link to="/logout"
//             className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-indigo-100">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* MAIN */}
//       <main className="flex-1 p-8">

//         {/* HEADER */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
//           <div>
//             <h2 className="text-lg font-semibold text-indigo-900">Mes élections</h2>
//             {!loading && (
//               <p className="text-sm text-gray-500 mt-0.5">{elections.length} élection(s) enregistrée(s)</p>
//             )}
//           </div>
//           <Link
//             to="/admin/adminelection/Creer-election"
//             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
//           >
//             <FiPlus /> Ajouter une élection
//           </Link>
//         </div>

//         {/* TABLE */}
//         <div className="overflow-x-auto bg-white rounded-xl shadow">
//           <table className="min-w-full border-collapse">
//             <thead className="bg-indigo-700">
//               <tr>
//                 <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-indigo-600">Titre</th>
//                 <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-indigo-600">Type</th>
//                 <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-indigo-600">Début</th>
//                 <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-indigo-600">Fin</th>
//                 <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-indigo-600">Statut</th>
//                 <th className="px-4 py-3 text-center text-sm font-semibold text-white">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan="6" className="p-8 text-center text-gray-500">Chargement...</td>
//                 </tr>
//               ) : elections.length === 0 ? (
//                 <tr>
//                   <td colSpan="6" className="p-8 text-center text-gray-500">
//                     Aucune élection trouvée.{" "}
//                     <Link to="/admin/adminelection/Creer-election" className="text-indigo-600 underline">
//                       Créer la première
//                     </Link>
//                   </td>
//                 </tr>
//               ) : (
//                 elections.map((election, index) => (
//                   <React.Fragment key={election.id}>

//                     {/* ── LIGNE PRINCIPALE ── */}
//                     <tr className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b border-gray-200 hover:bg-indigo-50 transition-all`}>

//                       <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
//                         <div className="flex items-center gap-2">
//                           {election.title}
//                           {/* Indicateur de tour pour scrutin LISTE en cours */}
//                           {election.type === "LISTE" && election.statut === "EN_COURS" && election.tourCourant > 1 && (
//                             <span className="inline-flex items-center gap-1 text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">
//                               <FiRepeat size={10} /> Tour {election.tourCourant}
//                             </span>
//                           )}
//                         </div>
//                       </td>

//                       <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
//                         <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
//                           {election.type}
//                         </span>
//                       </td>

//                       <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">
//                         {formatDateTime(election.startDate)}
//                       </td>

//                       <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">
//                         {formatDateTime(election.endDate)}
//                       </td>

//                       <td className="px-4 py-3 border-r border-gray-200">
//                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle(election.status)}`}>
//                           {election.status === "En cours" && (
//                             <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
//                           )}
//                           {election.status}
//                         </span>
//                       </td>

//                       <td className="px-4 py-3 text-center">
//                         <div className="flex justify-center items-center gap-2 flex-wrap">

//                           {/* Modifier */}
//                           {canEdit(election.statut) && (
//                             <Link
//                               to={`/admin/adminelection/modifier-election/${election.id}`}
//                               className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white border-2 border-orange-600 rounded-lg hover:bg-orange-600 transition text-xs font-bold shadow-sm"
//                             >
//                               <FiEdit size={12} /> Modifier
//                             </Link>
//                           )}

//                           {/* Détails */}
//                           <Link
//                             to={`/admin/adminelection/detail-election/${election.id}`}
//                             onClick={() => selectElection(election.id)}
//                             className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-medium"
//                           >
//                             Détails
//                           </Link>

//                           {/* ── Bouton Gérer ── */}
//                           <button
//                             onClick={() => setExpandedId(expandedId === election.id ? null : election.id)}
//                             className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs font-bold border-2 ${
//                               expandedId === election.id
//                                 ? "bg-purple-700 text-white border-violet-700 shadow-md"
//                                 : "bg-purple-600 text-white border-violet-600 hover:bg-violet-700 hover:border-violet-700 shadow-sm"
//                             }`}
//                           >
//                             Gérer
//                             {expandedId === election.id
//                               ? <FiChevronUp size={12} />
//                               : <FiChevronDown size={12} />}
//                           </button>

//                           {/* Supprimer */}
//                           {canEdit(election.statut) && (
//                             <button
//                               onClick={() => handleDelete(election.id)}
//                               className="inline-flex items-center px-2.5 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-xs font-medium"
//                               title="Supprimer"
//                             >
//                               <FiTrash2 size={13} />
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </tr>

//                     {/* ── LIGNE EXPANDÉE ── */}
//                     {expandedId === election.id && (
//                       <tr className="bg-violet-50 border-b border-violet-100">
//                         <td colSpan="6" className="px-6 py-4">
//                           <div className="flex items-center gap-4 flex-wrap">
//                             <span className="text-sm font-semibold text-violet-700 mr-2">
//                               Gérer « {election.title} » :
//                             </span>

//                             {/* Gérer les candidats */}
//                             <button
//                               onClick={() => handleGererCandidats(election.id)}
//                               className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium shadow-sm"
//                             >
//                               <FiUsers size={14} />
//                               Gérer les candidats
//                             </button>

//                             {/* Gérer les électeurs */}
//                             <button
//                               onClick={() => handleGererElecteurs(election.id)}
//                               className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition text-sm font-medium shadow-sm"
//                             >
//                               <FiUserCheck size={14} />
//                               Gérer les électeurs
//                             </button>

//                             {/* ── Dépouillement tours (LISTE uniquement, EN_COURS) ── */}
//                             {election.type === "LISTE" && election.statut === "EN_COURS" && (
//                               <button
//                                 onClick={() => handleDepouillement(election.id)}
//                                 className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition text-sm font-medium shadow-sm"
//                               >
//                                 <FiRepeat size={14} />
//                                 Dépouillement tours
//                                 {election.tourCourant > 1 && (
//                                   <span className="bg-orange-600 text-white text-xs font-black px-1.5 py-0.5 rounded-full">
//                                     Tour {election.tourCourant}
//                                   </span>
//                                 )}
//                               </button>
//                             )}

//                             {/* Voir les résultats */}
//                             {!["EN_ATTENTE", "SUSPENDUE"].includes(election.statut) && (
//                               <Link
//                                 to="/admin/adminelection/resultats"
//                                 onClick={() => selectElection(election.id)}
//                                 className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition text-sm font-medium shadow-sm"
//                               >
//                                 <FiBarChart2 size={14} />
//                                 Voir les résultats
//                               </Link>
//                             )}
//                           </div>

//                           {/* Info supplémentaire pour scrutin LISTE en cours */}
//                           {election.type === "LISTE" && election.statut === "EN_COURS" && (
//                             <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 w-fit">
//                               <FiRepeat size={12} />
//                               Scrutin à tours successifs — Tour courant : <strong>{election.tourCourant}</strong>.
//                               Clôturez le tour depuis l'interface de dépouillement une fois tous les votes reçus.
//                             </div>
//                           )}
//                         </td>
//                       </tr>
//                     )}

//                   </React.Fragment>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//       </main>
//     </div>
//   );
// }

