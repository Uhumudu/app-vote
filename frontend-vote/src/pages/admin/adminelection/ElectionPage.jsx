
// src/pages/adminElection/ElectionPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEdit, FiPlus, FiHome, FiUsers, FiBarChart2,
  FiSettings, FiLogOut, FiCalendar, FiUserCheck,
  FiTrash2, FiChevronDown, FiChevronUp
} from "react-icons/fi";
import api from "../../../services/api";

export default function ElectionPage() {
  const [elections, setElections]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState({ msg: "", type: "success" });
  const [expandedId, setExpandedId] = useState(null);
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
        id:        e.id_election,
        title:     e.titre,
        type:      e.type,
        startDate: e.date_debut,
        endDate:   e.date_fin,
        status:
          e.statut === "EN_COURS"   ? "En cours"    :
          e.statut === "TERMINEE"   ? "Terminée"    :
          e.statut === "EN_ATTENTE" ? "Non ouverte" :
          e.statut === "APPROUVEE"  ? "Approuvée"   :
          e.statut === "SUSPENDUE"  ? "Suspendue"   : e.statut,
        statut: e.statut
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

  const selectElection = (id) => localStorage.setItem("activeElectionId", id);

  const handleGererCandidats = (id) => {
    selectElection(id);
    navigate("/admin/adminelection/candidats");
  };

  const handleGererElecteurs = (id) => {
    selectElection(id);
    navigate(`/admin/adminelection/electeurs/${id}`);
  };

  const formatDateTime = (d) =>
    new Date(d).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

  const statusStyle = (status) => {
    if (status === "En cours")   return "bg-green-100 text-green-700";
    if (status === "Terminée")   return "bg-gray-100 text-gray-500";
    if (status === "Approuvée")  return "bg-blue-100 text-blue-700";
    if (status === "Suspendue")  return "bg-red-100 text-red-600";
    return "bg-yellow-100 text-yellow-700";
  };

  const canEdit = (statut) => !["EN_COURS", "TERMINEE"].includes(statut);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* TOAST */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium transition-all
          ${toast.type === "error" ? "bg-red-600" : "bg-indigo-700"}`}>
          {toast.msg}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
        <nav className="flex-1 space-y-3">
          <Link to="/adminElectionDashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
            <FiHome /> Tableau de bord
          </Link>
          <Link to="/admin/adminelection/ElectionPage"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-100 font-semibold">
            <FiCalendar /> Mes élections
          </Link>
        </nav>
        <div className="space-y-3 mt-6">
          <Link to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
            <FiSettings /> Paramètres
          </Link>
          <Link to="/logout"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-indigo-100">
            <FiLogOut /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-indigo-900">Mes élections</h2>
            {!loading && (
              <p className="text-sm text-gray-500 mt-0.5">{elections.length} élection(s) enregistrée(s)</p>
            )}
          </div>
          <Link
            to="/admin/adminelection/Creer-election"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
          >
            <FiPlus /> Ajouter une élection
          </Link>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full border-collapse">
            <thead className="bg-indigo-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-indigo-600">Titre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-indigo-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-indigo-600">Début</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-indigo-600">Fin</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-indigo-600">Statut</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : elections.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Aucune élection trouvée.{" "}
                    <Link to="/admin/adminelection/Creer-election" className="text-indigo-600 underline">
                      Créer la première
                    </Link>
                  </td>
                </tr>
              ) : (
                elections.map((election, index) => (
                  <React.Fragment key={election.id}>

                    {/* ── LIGNE PRINCIPALE ── */}
                    <tr className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b border-gray-200 hover:bg-indigo-50 transition-all`}>

                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                        {election.title}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                          {election.type}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">
                        {formatDateTime(election.startDate)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">
                        {formatDateTime(election.endDate)}
                      </td>

                      <td className="px-4 py-3 border-r border-gray-200">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle(election.status)}`}>
                          {election.status === "En cours" && (
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                          )}
                          {election.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-2 flex-wrap">

                          {/* Modifier */}
                          {canEdit(election.statut) && (
                            <Link
                              to={`/admin/adminelection/modifier-election/${election.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white border-2 border-orange-600 rounded-lg hover:bg-orange-600 transition text-xs font-bold shadow-sm"
                            >
                              <FiEdit size={12} /> Modifier
                            </Link>
                          )}

                          {/* Détails */}
                          <Link
                            to={`/admin/adminelection/detail-election/${election.id}`}
                            onClick={() => selectElection(election.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-medium"
                          >
                            Détails
                          </Link>

                          {/* ── Bouton Gérer — violet plein, très visible ── */}
                          <button
                            onClick={() => setExpandedId(expandedId === election.id ? null : election.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs font-bold border-2 ${
                              expandedId === election.id
                                ? "bg-purple-700 text-white border-violet-700 shadow-md"
                                : "bg-purple-600 text-white border-violet-600 hover:bg-violet-700 hover:border-violet-700 shadow-sm"
                            }`}
                          >
                            Gérer
                            {expandedId === election.id
                              ? <FiChevronUp size={12} />
                              : <FiChevronDown size={12} />}
                          </button>

                          {/* Supprimer */}
                          {canEdit(election.statut) && (
                            <button
                              onClick={() => handleDelete(election.id)}
                              className="inline-flex items-center px-2.5 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-xs font-medium"
                              title="Supprimer"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── LIGNE EXPANDÉE ── */}
                    {expandedId === election.id && (
                      <tr className="bg-violet-50 border-b border-violet-100">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-sm font-semibold text-violet-700 mr-2">
                              Gérer pour « {election.title} » :
                            </span>

                            <button
                              onClick={() => handleGererCandidats(election.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium shadow-sm"
                            >
                              <FiUsers size={14} />
                              Gérer les candidats
                            </button>

                            <button
                              onClick={() => handleGererElecteurs(election.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition text-sm font-medium shadow-sm"
                            >
                              <FiUserCheck size={14} />
                              Gérer les électeurs
                            </button>

                            {!["EN_ATTENTE", "SUSPENDUE"].includes(election.statut) && (
                              <Link
                                to="/admin/adminelection/resultats"
                                onClick={() => selectElection(election.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition text-sm font-medium shadow-sm"
                              >
                                <FiBarChart2 size={14} />
                                Voir les résultats
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}





































// // src/pages/adminElection/ElectionPage.jsx
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   FiEdit, FiPlus, FiHome, FiUsers, FiBarChart2,
//   FiSettings, FiLogOut, FiCalendar, FiUserCheck,
//   FiTrash2, FiChevronDown, FiChevronUp
// } from "react-icons/fi";
// import api from "../../../services/api";

// export default function ElectionPage() {
//   const [elections, setElections]   = useState([]);
//   const [loading, setLoading]       = useState(true);
//   const [toast, setToast]           = useState({ msg: "", type: "success" });
//   const [expandedId, setExpandedId] = useState(null); // ligne avec actions dépliées
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
//           e.statut === "EN_COURS"  ? "En cours"   :
//           e.statut === "TERMINEE"  ? "Terminée"   :
//           e.statut === "EN_ATTENTE"? "Non ouverte":
//           e.statut === "APPROUVEE" ? "Approuvée"  :
//           e.statut === "SUSPENDUE" ? "Suspendue"  : e.statut,
//         statut: e.statut
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

//   // Sauvegarder l'ID élection active dans localStorage
//   const selectElection = (id) => localStorage.setItem("activeElectionId", id);

//   const handleGererCandidats = (id) => {
//     selectElection(id);
//     navigate("/admin/adminelection/candidats");
//   };

//   const handleGererElecteurs = (id) => {
//     selectElection(id);
//     navigate(`/admin/adminelection/electeurs/${id}`);
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
//           {/* <Link to="/admin/adminelection/candidats"
//             className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiUsers /> Candidats
//           </Link>
//           <Link to="/admin/adminelection/electeurs"
//             className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiUserCheck /> Électeurs
//           </Link>
//           <Link to="/admin/adminelection/resultats"
//             className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiBarChart2 /> Résultats
//           </Link> */}
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

//                       {/* TITRE */}
//                       <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
//                         {election.title}
//                       </td>

//                       {/* TYPE */}
//                       <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
//                         <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
//                           {election.type}
//                         </span>
//                       </td>

//                       {/* DEBUT */}
//                       <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">
//                         {formatDateTime(election.startDate)}
//                       </td>

//                       {/* FIN */}
//                       <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">
//                         {formatDateTime(election.endDate)}
//                       </td>

//                       {/* STATUT */}
//                       <td className="px-4 py-3 border-r border-gray-200">
//                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle(election.status)}`}>
//                           {election.status === "En cours" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />}
//                           {election.status}
//                         </span>
//                       </td>

//                       {/* ACTIONS */}
//                       <td className="px-4 py-3 text-center">
//                         <div className="flex justify-center items-center gap-2 flex-wrap">

//                           {/* Modifier */}
//                           {canEdit(election.statut) && (
//                             <Link
//                               to={`/admin/adminelection/modifier-election/${election.id}`}
//                               className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-xs font-medium"
//                             >
//                               <FiEdit size={12} /> Modifier
//                             </Link>
//                           )}

//                           {/* Voir plus */}
//                           <Link
//                             to={`/admin/adminelection/detail-election/${election.id}`}
//                             onClick={() => selectElection(election.id)}
//                             className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-medium"
//                           >
//                             Détails
//                           </Link>

//                           {/* Bouton déroulant Gérer */}
//                           <button
//                             onClick={() => setExpandedId(expandedId === election.id ? null : election.id)}
//                             className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition text-xs font-medium border
//                               ${expandedId === election.id
//                                 ? "bg-teal-600 text-white border-teal-600"
//                                 : "bg-white text-teal-700 border-teal-500 hover:bg-teal-50"}`}
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
//                               className="inline-flex items-center px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition text-xs font-medium"
//                               title="Supprimer"
//                             >
//                               <FiTrash2 size={13} />
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </tr>

//                     {/* ── LIGNE EXPANDÉE : GÉRER CANDIDATS & ÉLECTEURS ── */}
//                     {expandedId === election.id && (
//                       <tr className="bg-teal-50 border-b border-teal-100">
//                         <td colSpan="6" className="px-6 py-4">
//                           <div className="flex items-center gap-4 flex-wrap">
//                             <span className="text-sm font-semibold text-teal-700 mr-2">
//                               Gérer pour « {election.title} » :
//                             </span>

//                             {/* Gérer candidats */}
//                             <button
//                               onClick={() => handleGererCandidats(election.id)}
//                               className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium shadow-sm"
//                             >
//                               <FiUsers size={14} />
//                               Gérer les candidats
//                             </button>

//                             {/* Gérer électeurs */}
//                             <button
//                               onClick={() => handleGererElecteurs(election.id)}
//                               className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition text-sm font-medium shadow-sm"
//                             >
//                               <FiUserCheck size={14} />
//                               Gérer les électeurs
//                             </button>

//                             {/* Voir résultats (uniquement si pas EN_ATTENTE) */}
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


