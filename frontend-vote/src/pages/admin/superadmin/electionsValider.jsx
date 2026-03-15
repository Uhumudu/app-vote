// src/pages/admin/superadmin/electionsValider.jsx
import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiCalendar, FiClock } from "react-icons/fi";
import api from "../../../services/api";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

export default function ElectionsValider() {
  const [elections, setElections] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState({ msg: "", type: "success" });

  useEffect(() => { fetchElections(); }, []);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const fetchElections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/elections/pending");
      setElections(res.data);
    } catch (err) {
      console.error("Erreur fetch elections:", err);
      notify("Impossible de charger les élections", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const handleValider = async (id) => {
    if (!window.confirm("Valider cette élection ?")) return;
    try {
      await api.put(`/elections/approve/${id}`);
      setElections(prev => prev.filter(e => e.id_election !== id));
      notify("Élection validée avec succès");
    } catch (err) {
      notify("Erreur lors de la validation", "error");
    }
  };

  const handleRefuser = async (id) => {
    if (!window.confirm("Refuser cette élection ?")) return;
    try {
      await api.put(`/elections/reject/${id}`);
      setElections(prev => prev.filter(e => e.id_election !== id));
      notify("Élection refusée", "error");
    } catch (err) {
      notify("Erreur lors du refus", "error");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
          toast.type === "error" ? "bg-red-600" : "bg-blue-700"
        }`}>
          {toast.msg}
        </div>
      )}

      <SuperAdminSidebar active="valider" />

      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-black text-blue-900 tracking-tight">Élections à valider</h2>
          <p className="text-sm text-blue-400 mt-1">
            {loading ? "Chargement…" : `${elections.length} élection${elections.length > 1 ? "s" : ""} en attente de validation`}
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-blue-700">
                {["Titre", "Type", "Créateur", "Début", "Fin", "Sièges", "Statut", "Actions"].map((h, i) => (
                  <th key={h}
                    className={`px-4 py-3.5 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${
                      i < 7 ? "border-r border-blue-600/50" : "text-center"
                    }`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                      <p className="text-gray-400 text-sm">Chargement…</p>
                    </div>
                  </td>
                </tr>
              ) : elections.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                        <FiCheckCircle className="text-emerald-400 text-2xl" />
                      </div>
                      <p className="text-gray-500 font-semibold">Aucune élection en attente 🎉</p>
                      <p className="text-gray-400 text-sm">Toutes les élections ont été traitées.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                elections.map((e, index) => (
                  <tr key={e.id_election}
                    className={`border-b border-gray-100 transition-colors hover:bg-blue-50/40 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}>

                    {/* Titre */}
                    <td className="px-4 py-3.5 border-r border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{e.titre}</p>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5 border-r border-gray-100">
                      <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                        {e.type}
                      </span>
                    </td>

                    {/* Créateur */}
                    <td className="px-4 py-3.5 border-r border-gray-100">
                      <p className="text-sm text-gray-700">{e.prenom_admin} {e.nom_admin}</p>
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FiCalendar size={11} className="text-gray-400" />
                        {formatDate(e.date_debut)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FiClock size={11} className="text-gray-400" />
                        {e.type === "LISTE" && e.duree_tour_minutes
                          ? `${e.duree_tour_minutes >= 1440
                              ? `${e.duree_tour_minutes / 1440}j/tour`
                              : `${e.duree_tour_minutes}min/tour`}`
                          : formatDate(e.date_fin)
                        }
                      </div>
                    </td>

                    {/* Sièges */}
                    <td className="px-4 py-3.5 border-r border-gray-100 text-center">
                      {e.nb_sieges
                        ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{e.nb_sieges} sièges</span>
                        : <span className="text-xs text-gray-300">—</span>
                      }
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3.5 border-r border-gray-100">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        En attente
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button title="Valider"
                          onClick={() => handleValider(e.id_election)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 active:scale-95 transition-all text-xs font-bold shadow-sm">
                          <FiCheckCircle size={12} /> Valider
                        </button>
                        <button title="Refuser"
                          onClick={() => handleRefuser(e.id_election)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all text-xs font-bold shadow-sm">
                          <FiXCircle size={12} /> Refuser
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}



































// // src/pages/admin/superadmin/electionsValider.jsx
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut,
//   FiCheckCircle, FiXCircle, FiCalendar, FiClock, FiEye
// } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";
// import api from "../../../services/api";

// const SuperAdminSidebar = ({ active }) => (
//   <aside className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 p-6 flex flex-col shadow-sm">
//     <div className="mb-10">
//       <h1 className="text-xl font-black text-blue-700 tracking-tight">🗳 eVote</h1>
//       <p className="text-xs text-blue-400 font-medium mt-0.5">Super Administrateur</p>
//     </div>
//     <nav className="flex-1 space-y-1">
//       {[
//         { to: "/superAdminDashboard",               icon: <FiHome size={15} />,     label: "Tableau de bord",     key: "dashboard" },
//         { to: "/admin/superadmin/utilisateursPage", icon: <FiUsers size={15} />,    label: "Utilisateurs",        key: "users" },
//         { to: "/admin/superadmin/electionsValider", icon: <FaVoteYea size={14} />,  label: "Élections à valider", key: "elections" },
//         { to: "/admin/superadmin/StatistiquesPage", icon: <FiBarChart2 size={15} />, label: "Statistiques",       key: "stats" },
//       ].map(item => (
//         <Link key={item.key} to={item.to}
//           className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
//             active === item.key
//               ? "bg-blue-100 text-blue-700 font-semibold"
//               : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
//           }`}>
//           {item.icon} {item.label}
//         </Link>
//       ))}
//     </nav>
//     <div className="space-y-1 pt-4 border-t border-gray-100 mt-4">
//       <Link to="/admin/superadmin/ParametresPage"
//         className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
//         <FiSettings size={15} /> Paramètres
//       </Link>
//       <Link to="/logout"
//         className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
//         <FiLogOut size={15} /> Déconnexion
//       </Link>
//     </div>
//   </aside>
// );

// export default function ElectionsValider() {
//   const [elections, setElections] = useState([]);
//   const [loading,   setLoading]   = useState(true);
//   const [toast,     setToast]     = useState({ msg: "", type: "success" });

//   useEffect(() => { fetchElections(); }, []);

//   const notify = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
//   };

//   const fetchElections = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/elections/pending");
//       setElections(res.data);
//     } catch (err) {
//       console.error("Erreur fetch elections:", err);
//       notify("Impossible de charger les élections", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (d) => new Date(d).toLocaleString("fr-FR", {
//     day: "2-digit", month: "2-digit", year: "numeric",
//     hour: "2-digit", minute: "2-digit",
//   });

//   const handleValider = async (id) => {
//     if (!window.confirm("Valider cette élection ?")) return;
//     try {
//       await api.put(`/elections/approve/${id}`);
//       setElections(prev => prev.filter(e => e.id_election !== id));
//       notify("Élection validée avec succès");
//     } catch (err) {
//       notify("Erreur lors de la validation", "error");
//     }
//   };

//   const handleRefuser = async (id) => {
//     if (!window.confirm("Refuser cette élection ?")) return;
//     try {
//       await api.put(`/elections/reject/${id}`);
//       setElections(prev => prev.filter(e => e.id_election !== id));
//       notify("Élection refusée", "error");
//     } catch (err) {
//       notify("Erreur lors du refus", "error");
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

//       {/* Toast */}
//       {toast.msg && (
//         <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
//           toast.type === "error" ? "bg-red-600" : "bg-blue-700"
//         }`}>
//           {toast.msg}
//         </div>
//       )}

//       <SuperAdminSidebar active="elections" />

//       <main className="flex-1 p-8 overflow-y-auto">

//         {/* Header */}
//         <div className="mb-8">
//           <h2 className="text-2xl font-black text-blue-900 tracking-tight">Élections à valider</h2>
//           <p className="text-sm text-blue-400 mt-1">
//             {loading ? "Chargement…" : `${elections.length} élection${elections.length > 1 ? "s" : ""} en attente de validation`}
//           </p>
//         </div>

//         {/* Table */}
//         <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
//           <table className="min-w-full border-collapse">
//             <thead>
//               <tr className="bg-blue-700">
//                 {["Titre", "Type", "Créateur", "Début", "Fin", "Sièges", "Statut", "Actions"].map((h, i) => (
//                   <th key={h}
//                     className={`px-4 py-3.5 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${
//                       i < 7 ? "border-r border-blue-600/50" : "text-center"
//                     }`}>
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan="8" className="p-12 text-center">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
//                       <p className="text-gray-400 text-sm">Chargement…</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : elections.length === 0 ? (
//                 <tr>
//                   <td colSpan="8" className="p-16 text-center">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
//                         <FiCheckCircle className="text-emerald-400 text-2xl" />
//                       </div>
//                       <p className="text-gray-500 font-semibold">Aucune élection en attente 🎉</p>
//                       <p className="text-gray-400 text-sm">Toutes les élections ont été traitées.</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 elections.map((e, index) => (
//                   <tr key={e.id_election}
//                     className={`border-b border-gray-100 transition-colors hover:bg-blue-50/40 ${
//                       index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
//                     }`}>

//                     {/* Titre */}
//                     <td className="px-4 py-3.5 border-r border-gray-100">
//                       <p className="text-sm font-semibold text-gray-800">{e.titre}</p>
//                     </td>

//                     {/* Type */}
//                     <td className="px-4 py-3.5 border-r border-gray-100">
//                       <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
//                         {e.type}
//                       </span>
//                     </td>

//                     {/* Créateur */}
//                     <td className="px-4 py-3.5 border-r border-gray-100">
//                       <p className="text-sm text-gray-700">{e.prenom_admin} {e.nom_admin}</p>
//                     </td>

//                     {/* Dates */}
//                     <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">
//                       <div className="flex items-center gap-1.5">
//                         <FiCalendar size={11} className="text-gray-400" />
//                         {formatDate(e.date_debut)}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">
//                       <div className="flex items-center gap-1.5">
//                         <FiClock size={11} className="text-gray-400" />
//                         {e.type === "LISTE" && e.duree_tour_minutes
//                           ? `${e.duree_tour_minutes >= 1440
//                               ? `${e.duree_tour_minutes / 1440}j/tour`
//                               : `${e.duree_tour_minutes}min/tour`}`
//                           : formatDate(e.date_fin)
//                         }
//                       </div>
//                     </td>

//                     {/* Sièges */}
//                     <td className="px-4 py-3.5 border-r border-gray-100 text-center">
//                       {e.nb_sieges
//                         ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{e.nb_sieges} sièges</span>
//                         : <span className="text-xs text-gray-300">—</span>
//                       }
//                     </td>

//                     {/* Statut */}
//                     <td className="px-4 py-3.5 border-r border-gray-100">
//                       <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
//                         style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
//                         <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
//                         En attente
//                       </span>
//                     </td>

//                     {/* Actions */}
//                     <td className="px-4 py-3.5 text-center">
//                       <div className="flex justify-center items-center gap-2">
//                         <button title="Valider"
//                           onClick={() => handleValider(e.id_election)}
//                           className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 active:scale-95 transition-all text-xs font-bold shadow-sm">
//                           <FiCheckCircle size={12} /> Valider
//                         </button>
//                         <button title="Refuser"
//                           onClick={() => handleRefuser(e.id_election)}
//                           className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all text-xs font-bold shadow-sm">
//                           <FiXCircle size={12} /> Refuser
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//       </main>
//     </div>
//   );
// }

































// // src/pages/superAdmin/ElectionsValider.jsx
// import React, { useState, useEffect } from "react";
// import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiEye, FiCheckCircle, FiXCircle } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import api from "../../../services/api";

// export default function ElectionsValider() {
//   const navigate = useNavigate();
//   const [elections, setElections] = useState([]);

//   useEffect(() => {
//     fetchElections();
//   }, []);

//   // Récupérer toutes les élections en attente
//   const fetchElections = async () => {
//     try {
//       const res = await api.get("/elections/pending"); // backend GET /elections/pending
//       setElections(res.data); // res.data = tableau des élections en attente
//     } catch (error) {
//       console.error("Erreur fetch elections:", error);
//       alert("Impossible de charger les élections");
//     }
//   };

//   // Formater date
//   const formatDateTime = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleString("fr-FR", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   // Valider une élection
//   const handleValider = async (id) => {
//     if (!window.confirm("Valider cette élection ?")) return;
//     try {
//       await api.put(`/elections/approve/${id}`);
//       setElections(elections.filter(e => e.id_election !== id));
//       alert("Élection validée ✅");
//     } catch (error) {
//       console.error(error);
//       alert("Erreur lors de la validation");
//     }
//   };

//   // Refuser une élection
//   const handleRefuser = async (id) => {
//     if (!window.confirm("Refuser cette élection ?")) return;
//     try {
//       await api.put(`/elections/reject/${id}`);
//       setElections(elections.filter(e => e.id_election !== id));
//       alert("Élection refusée ❌");
//     } catch (error) {
//       console.error(error);
//       alert("Erreur lors du refus");
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
//       {/* SIDEBAR */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>
//         <nav className="flex-1 space-y-3">
//           <a onClick={() => navigate("/superAdminDashboard")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"><FiHome /> Tableau de bord</a>
//           <a onClick={() => navigate("/admin/superadmin/utilisateursPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"><FiUsers /> Utilisateurs</a>
//           <a onClick={() => navigate("/admin/superadmin/electionsValider")} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold cursor-pointer"><FaVoteYea /> Élections à valider</a>
//           <a onClick={() => navigate("/admin/superadmin/StatistiquesPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"><FiBarChart2 /> Statistiques</a>
//         </nav>
//         <div className="space-y-3 mt-6">
//           <a onClick={() => navigate("/admin/superadmin/ParametresPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"><FiSettings /> Paramètres</a>
//           <a onClick={() => navigate("/logout")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 text-red-600 cursor-pointer"><FiLogOut /> Déconnexion</a>
//         </div>
//       </aside>

//       {/* CONTENU ÉLECTIONS */}
//       <main className="flex-1 p-8 bg-white">
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-blue-800">🗳 Élections à valider</h1>
//           <p className="text-gray-600">Liste des élections en attente de validation par le Super Administrateur</p>
//         </div>

//         <div className="bg-white rounded-xl shadow overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-blue-100 text-blue-900">
//               <tr>
//                 <th className="p-4 text-left">Titre</th>
//                 <th className="p-4 text-left">Type</th>
//                 <th className="p-4 text-left">Créateur</th>
//                 <th className="p-4 text-left">Début</th>
//                 <th className="p-4 text-left">Fin</th>
//                 <th className="p-4 text-left">Statut</th>
//                 <th className="p-4 text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {elections.length === 0 ? (
//                 <tr>
//                   <td colSpan="7" className="p-6 text-center text-gray-500">Aucune élection en attente 🎉</td>
//                 </tr>
//               ) : (
//                 elections.map((e) => (
//                   <tr key={e.id_election} className="border-t hover:bg-gray-50 text-black">
//                     <td className="p-4 font-medium">{e.titre}</td>
//                     <td className="p-4">{e.type}</td>
//                     <td className="p-4">{e.nom_admin} {e.prenom_admin}</td>
//                     <td className="p-4">{formatDateTime(e.date_debut)}</td>
//                     <td className="p-4">{formatDateTime(e.date_fin)}</td>
//                     <td className="p-4">
//                       <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">En attente</span>
//                     </td>
//                     <td className="p-4 flex justify-center gap-2">
//                       <button title="Voir détails" className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"><FiEye /></button>
//                       <button title="Valider" onClick={() => handleValider(e.id_election)} className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600"><FiCheckCircle /></button>
//                       <button title="Refuser" onClick={() => handleRefuser(e.id_election)} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"><FiXCircle /></button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </main>
//     </div>
//   );
// }













