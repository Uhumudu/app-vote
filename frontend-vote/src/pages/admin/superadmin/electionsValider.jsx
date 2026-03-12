// src/pages/superAdmin/ElectionsValider.jsx
import React, { useState, useEffect } from "react";
import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiEye, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

export default function ElectionsValider() {
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);

  useEffect(() => {
    fetchElections();
  }, []);

  // Récupérer toutes les élections en attente
  const fetchElections = async () => {
    try {
      const res = await api.get("/elections/pending"); // backend GET /elections/pending
      setElections(res.data); // res.data = tableau des élections en attente
    } catch (error) {
      console.error("Erreur fetch elections:", error);
      alert("Impossible de charger les élections");
    }
  };

  // Formater date
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Valider une élection
  const handleValider = async (id) => {
    if (!window.confirm("Valider cette élection ?")) return;
    try {
      await api.put(`/elections/approve/${id}`);
      setElections(elections.filter(e => e.id_election !== id));
      alert("Élection validée ✅");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la validation");
    }
  };

  // Refuser une élection
  const handleRefuser = async (id) => {
    if (!window.confirm("Refuser cette élection ?")) return;
    try {
      await api.put(`/elections/reject/${id}`);
      setElections(elections.filter(e => e.id_election !== id));
      alert("Élection refusée ❌");
    } catch (error) {
      console.error(error);
      alert("Erreur lors du refus");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>
        <nav className="flex-1 space-y-3">
          <a onClick={() => navigate("/superAdminDashboard")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"><FiHome /> Tableau de bord</a>
          <a onClick={() => navigate("/admin/superadmin/utilisateursPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"><FiUsers /> Utilisateurs</a>
          <a onClick={() => navigate("/admin/superadmin/electionsValider")} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold cursor-pointer"><FaVoteYea /> Élections à valider</a>
          <a onClick={() => navigate("/admin/superadmin/StatistiquesPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"><FiBarChart2 /> Statistiques</a>
        </nav>
        <div className="space-y-3 mt-6">
          <a onClick={() => navigate("/admin/superadmin/ParametresPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"><FiSettings /> Paramètres</a>
          <a onClick={() => navigate("/logout")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 text-red-600 cursor-pointer"><FiLogOut /> Déconnexion</a>
        </div>
      </aside>

      {/* CONTENU ÉLECTIONS */}
      <main className="flex-1 p-8 bg-white">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-800">🗳 Élections à valider</h1>
          <p className="text-gray-600">Liste des élections en attente de validation par le Super Administrateur</p>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-100 text-blue-900">
              <tr>
                <th className="p-4 text-left">Titre</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Créateur</th>
                <th className="p-4 text-left">Début</th>
                <th className="p-4 text-left">Fin</th>
                <th className="p-4 text-left">Statut</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {elections.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">Aucune élection en attente 🎉</td>
                </tr>
              ) : (
                elections.map((e) => (
                  <tr key={e.id_election} className="border-t hover:bg-gray-50 text-black">
                    <td className="p-4 font-medium">{e.titre}</td>
                    <td className="p-4">{e.type}</td>
                    <td className="p-4">{e.nom_admin} {e.prenom_admin}</td>
                    <td className="p-4">{formatDateTime(e.date_debut)}</td>
                    <td className="p-4">{formatDateTime(e.date_fin)}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">En attente</span>
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button title="Voir détails" className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"><FiEye /></button>
                      <button title="Valider" onClick={() => handleValider(e.id_election)} className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600"><FiCheckCircle /></button>
                      <button title="Refuser" onClick={() => handleRefuser(e.id_election)} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"><FiXCircle /></button>
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

//   const fetchElections = async () => {
//     try {
//       const res = await api.get("/elections"); // backend GET /elections
//       // Filtrer seulement les élections en attente
//       const pending = res.data.filter(e => e.statut === "EN_ATTENTE")
//         .map(e => ({
//           ...e,
//           nom: e.nom_admin || e.nom,       // adapter selon ta jointure admin
//           prenom: e.prenom_admin || e.prenom
//         }));
//       setElections(pending);
//     } catch (error) {
//       console.error("Erreur fetch elections:", error);
//       alert("Impossible de charger les élections");
//     }
//   };

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

//   const handleValider = async (id) => {
//     if (!window.confirm("Valider cette élection ?")) return;
//     try {
//       await api.put(`/elections/approve/${id}`);
//       setElections(elections.filter((e) => e.id_election !== id));
//       alert("Élection validée ✅");
//     } catch (error) {
//       console.error(error);
//       alert("Erreur lors de la validation");
//     }
//   };

//   const handleRefuser = async (id) => {
//     if (!window.confirm("Refuser cette élection ?")) return;
//     try {
//       await api.put(`/elections/reject/${id}`);
//       setElections(elections.filter((e) => e.id_election !== id));
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
//                     <td className="p-4">{e.nom} {e.prenom}</td>
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


















// import React, { useState, useEffect } from "react";
// import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiEye, FiCheckCircle, FiXCircle } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import api from "../../../services/api"; // ton api axios

// export default function ElectionsValider() {
//   const navigate = useNavigate();
//   const [elections, setElections] = useState([]);

//   useEffect(() => {
//     fetchElections();
//   }, []);

//   // Récupère les élections en attente depuis le backend
//   const fetchElections = async () => {
//     try {
//       const res = await api.get("/elections/pending"); // route GET /admin
//       setElections(res.data);
//     } catch (error) {
//       console.error("Erreur fetch elections:", error);
//       alert("Impossible de charger les élections");
//     }
//   };

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

//   const handleValider = async (id) => {
//     if (!window.confirm("Valider cette élection ?")) return;
//     try {
//       await api.put(`/elections/approve/${id}`);
//       setElections(elections.filter((e) => e.id_election !== id));
//       alert("Élection validée ✅");
//     } catch (error) {
//       console.error(error);
//       alert("Erreur lors de la validation");
//     }
//   };

//   const handleRefuser = async (id) => {
//     if (!window.confirm("Refuser cette élection ?")) return;
//     try {
//       await api.put(`/elections/reject/${id}`);
//       setElections(elections.filter((e) => e.id_election !== id));
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
//                     <td className="p-4">{e.nom} {e.prenom}</td>
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
































// import React, { useState } from "react";
// import {
//   FiHome,
//   FiUsers,
//   FiBarChart2,
//   FiSettings,
//   FiLogOut,
//   FiEye,
//   FiCheckCircle,
//   FiXCircle
// } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";

// const fakeElections = [
//   {
//     id: 1,
//     titre: "Élection universitaire 2026",
//     type: "Uninominal",
//     createur: "Moussa Ouhoumoud",
//     debut: "2026-03-01T08:30",
//     fin: "2026-03-05T18:00",
//     statut: "en_attente",
//   },
//   {
//     id: 2,
//     titre: "Conseil municipal",
//     type: "Liste",
//     createur: "Jean Dupont",
//     debut: "2026-04-10T09:00",
//     fin: "2026-04-15T17:30",
//     statut: "en_attente",
//   },
// ];

// export default function ElectionsValider() {
//   const navigate = useNavigate();
//   const [elections, setElections] = useState([]);

//   // ✅ Charger depuis backend
//   const fetchElections = async () => {
//     try {
//       const res = await api.get("/elections/admin");
      
//       // Filtrer uniquement EN_ATTENTE
//       const enAttente = res.data.filter(
//         (e) => e.statut === "EN_ATTENTE"
//       );

//       setElections(enAttente);
//     } catch (error) {
//       console.error("Erreur chargement élections :", error);
//     }
//   };

//   useEffect(() => {
//     fetchElections();
//   }, []);

//   // ✅ Format date + heure
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

//   // ✅ VALIDER (Backend)
//   const handleValider = async (id) => {
//     if (!window.confirm("Valider cette élection ?")) return;

//     try {
//       await api.put(`/elections/${id}/valider`);
//       fetchElections(); // refresh
//       alert("Élection validée ✅");
//     } catch (error) {
//       console.error(error);
//       alert("Erreur validation ❌");
//     }
//   };

//   // ✅ REFUSER (Backend)
//   const handleRefuser = async (id) => {
//     if (!window.confirm("Refuser cette élection ?")) return;

//     try {
//       await api.put(`/elections/${id}/refuser`);
//       fetchElections(); // refresh
//       alert("Élection refusée ❌");
//     } catch (error) {
//       console.error(error);
//       alert("Erreur refus ❌");
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

//       {/* ===== SIDEBAR SUPER ADMIN ===== */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-blue-700">
//           🗳 eVote – SuperAdmin
//         </h1>

//         <nav className="flex-1 space-y-3">
//           <a
//             onClick={() => navigate("/superAdminDashboard")}
//             className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"
//           >
//             <FiHome /> Tableau de bord
//           </a>

//           <a
//             onClick={() => navigate("/admin/superadmin/utilisateursPage")}
//             className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"
//           >
//             <FiUsers /> Utilisateurs
//           </a>

//           <a
//             onClick={() => navigate("/admin/superadmin/electionsValider")}
//             className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold cursor-pointer"
//           >
//             <FaVoteYea /> Élections à valider
//           </a>

//           <a
//             onClick={() => navigate("/admin/superadmin/StatistiquesPage")}
//             className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"
//           >
//             <FiBarChart2 /> Statistiques
//           </a>
//         </nav>

//         <div className="space-y-3 mt-6">
//           <a
//             onClick={() => navigate("/admin/superadmin/ParametresPage")}
//             className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer"
//           >
//             <FiSettings /> Paramètres
//           </a>

//           <a
//             onClick={() => navigate("/logout")}
//             className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 text-red-600 cursor-pointer"
//           >
//             <FiLogOut /> Déconnexion
//           </a>
//         </div>
//       </aside>

//       {/* ===== CONTENU ÉLECTIONS ===== */}
//       <main className="flex-1 p-8 bg-white">

//         {/* TITRE */}
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-blue-800">
//             🗳 Élections à valider
//           </h1>
//           <p className="text-gray-600">
//             Liste des élections en attente de validation par le Super Administrateur
//           </p>
//         </div>

//         {/* TABLE */}
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
//                   <td colSpan="7" className="p-6 text-center text-gray-500">
//                     Aucune élection en attente 🎉
//                   </td>
//                 </tr>
//               ) : (
//                 elections.map((election) => (
//                   <tr
//                     key={election.id_election}
//                     className="border-t hover:bg-gray-50 text-black"
//                   >
//                     <td className="p-4 font-medium">{election.titre}</td>
//                     <td className="p-4">{election.type}</td>
//                     <td className="p-4">{election.createur}</td>

//                     {/* ✅ Date + Heure */}
//                     <td className="p-4">
//                       {formatDateTime(election.debut)}
//                     </td>
//                     <td className="p-4">
//                       {formatDateTime(election.fin)}
//                     </td>

//                     <td className="p-4">
//                       <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
//                         En attente
//                       </span>
//                     </td>

//                     <td className="p-4 flex justify-center gap-2">
//                       <button
//                         title="Voir détails"
//                         className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
//                       >
//                         <FiEye />
//                       </button>

//                       <button
//                         title="Valider"
//                         onClick={() => handleValider(election.id_election)}
//                         className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
//                       >
//                         <FiCheckCircle />
//                       </button>

//                       <button
//                         title="Refuser"
//                         onClick={() => handleRefuser(election.id_election)}
//                         className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
//                       >
//                         <FiXCircle />
//                       </button>
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































// // // src/pages/superAdmin/ElectionsValider.jsx
// // import React, { useEffect, useState } from "react";
// // import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiEye, FiCheckCircle, FiXCircle } from "react-icons/fi";
// // import { FaVoteYea } from "react-icons/fa";
// // import { useNavigate } from "react-router-dom";
// // import api from "../../../services/api";

// // export default function ElectionsValider() {
// //   const navigate = useNavigate();
// //   const [elections, setElections] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     fetchElections();
// //   }, []);

// //   const fetchElections = async () => {
// //     try {
// //       const res = await api.get("/elections/pending");
// //       setElections(res.data);
// //     } catch (err) {
// //       console.error(err);
// //       alert("Erreur chargement élections");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleValider = async (id) => {
// //     if (!window.confirm("Valider cette élection ?")) return;

// //     try {
// //       await api.put(`/elections/valider/${id}`);
// //       fetchElections();
// //     } catch (err) {
// //       console.error(err);
// //     }
// //   };

// //   const handleRefuser = async (id) => {
// //     if (!window.confirm("Refuser cette élection ?")) return;

// //     try {
// //       await api.put(`/elections/refuser/${id}`);
// //       fetchElections();
// //     } catch (err) {
// //       console.error(err);
// //     }
// //   };

// //   return (
// //     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

// //       {/* SIDEBAR */}
// //       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
// //         <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>

// //         <nav className="flex-1 space-y-3">
// //           <a onClick={() => navigate("/superAdminDashboard")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
// //             <FiHome /> Tableau de bord
// //           </a>

// //           <a onClick={() => navigate("/admin/superadmin/utilisateursPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
// //             <FiUsers /> Utilisateurs
// //           </a>

// //           <a className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold cursor-pointer">
// //             <FaVoteYea /> Élections à valider
// //           </a>

// //           <a onClick={() => navigate("/admin/superadmin/StatistiquesPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
// //             <FiBarChart2 /> Statistiques
// //           </a>
// //         </nav>

// //         <div className="mt-6">
// //           <a onClick={() => navigate("/logout")} className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
// //             <FiLogOut /> Déconnexion
// //           </a>
// //         </div>
// //       </aside>

// //       {/* MAIN */}
// //       <main className="flex-1 p-8 bg-white">
// //         <h1 className="text-2xl font-bold text-blue-800 mb-6">Élections à valider</h1>

// //         {loading ? (
// //           <p>Chargement...</p>
// //         ) : elections.length === 0 ? (
// //           <p className="text-gray-500">Aucune élection en attente 🎉</p>
// //         ) : (
// //           <table className="w-full text-sm shadow rounded-xl overflow-hidden">
// //             <thead className="bg-blue-100">
// //               <tr>
// //                 <th className="p-4 text-left">Titre</th>
// //                 <th className="p-4 text-left">Type</th>
// //                 <th className="p-4 text-left">Créateur</th>
// //                 <th className="p-4 text-left">Début</th>
// //                 <th className="p-4 text-left">Fin</th>
// //                 <th className="p-4 text-center">Actions</th>
// //               </tr>
// //             </thead>
// //             <tbody>
// //               {elections.map((election) => (
// //                 <tr key={election.id} className="border-t">
// //                   <td className="p-4">{election.titre}</td>
// //                   <td className="p-4">{election.type}</td>
// //                   <td className="p-4">{election.createur}</td>
// //                   <td className="p-4">{election.debut}</td>
// //                   <td className="p-4">{election.fin}</td>
// //                   <td className="p-4 flex justify-center gap-2">
// //                     <button onClick={() => handleValider(election.id)} className="p-2 bg-green-500 text-white rounded-lg">
// //                       <FiCheckCircle />
// //                     </button>
// //                     <button onClick={() => handleRefuser(election.id)} className="p-2 bg-red-500 text-white rounded-lg">
// //                       <FiXCircle />
// //                     </button>
// //                   </td>
// //                 </tr>
// //               ))}
// //             </tbody>
// //           </table>
// //         )}
// //       </main>
// //     </div>
// //   );
// // }

















// // import React, { useState } from "react";
// // import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiEye, FiCheckCircle, FiXCircle } from "react-icons/fi";
// // import { FaVoteYea } from "react-icons/fa";
// // import { useNavigate } from "react-router-dom";

// //   {
// //     id: 1,
// //     titre: "Élection universitaire 2026",
// //     type: "Uninominal",
// //     createur: "Moussa Ouhoumoud",
// //     debut: "2026-03-01",
// //     fin: "2026-03-05",
// //     statut: "en_attente",
// //   },
// //   {
// //     id: 2,
// //     titre: "Conseil municipal",
// //     type: "Liste",
// //     createur: "Jean Dupont",
// //     debut: "2026-04-10",
// //     fin: "2026-04-15",
// //     statut: "en_attente",
// //   },
// // ];

// // export default function ElectionsValider() {
// //   const navigate = useNavigate();
// //   const [elections, setElections] = useState(fakeElections);

// //   const handleValider = (id) => {
// //     if (!window.confirm("Valider cette élection ?")) return;
// //     setElections(elections.filter((e) => e.id !== id));
// //     alert("Élection validée ✅");
// //   };

// //   const handleRefuser = (id) => {
// //     if (!window.confirm("Refuser cette élection ?")) return;
// //     setElections(elections.filter((e) => e.id !== id));
// //     alert("Élection refusée ❌");
// //   };

// //   return (
// //     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

// //       {/* ===== SIDEBAR SUPER ADMIN ===== */}
// //       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
// //         <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>

// //         <nav className="flex-1 space-y-3">
// //           <a onClick={() => navigate("/superAdminDashboard")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
// //             <FiHome /> Tableau de bord
// //           </a>

// //           <a onClick={() => navigate("/admin/superadmin/utilisateursPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
// //             <FiUsers /> Utilisateurs
// //           </a>

// //           <a onClick={() => navigate("/admin/superadmin/electionsValider")} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold cursor-pointer">
// //             <FaVoteYea /> Élections à valider
// //           </a>

// //           <a onClick={() => navigate("/admin/superadmin/StatistiquesPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
// //             <FiBarChart2 /> Statistiques
// //           </a>
// //         </nav>

// //         <div className="space-y-3 mt-6">
// //           <a onClick={() => navigate("/admin/superadmin/ParametresPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
// //             <FiSettings /> Paramètres
// //           </a>

// //           <a onClick={() => navigate("/logout")} className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 text-red-600 cursor-pointer">
// //             <FiLogOut /> Déconnexion
// //           </a>
// //         </div>
// //       </aside>

// //       {/* ===== CONTENU ÉLECTIONS ===== */}
// //       <main className="flex-1 p-8 bg-white">
// //         {/* TITRE */}
// //         <div className="mb-6">
// //           <h1 className="text-2xl font-bold text-blue-800">🗳 Élections à valider</h1>
// //           <p className="text-gray-600">
// //             Liste des élections en attente de validation par le Super Administrateur
// //           </p>
// //         </div>

// //         {/* TABLE */}
// //         <div className="bg-white rounded-xl shadow overflow-x-auto">
// //           <table className="w-full text-sm">
// //             <thead className="bg-blue-100 text-blue-900">
// //               <tr>
// //                 <th className="p-4 text-left">Titre</th>
// //                 <th className="p-4 text-left">Type</th>
// //                 <th className="p-4 text-left">Créateur</th>
// //                 <th className="p-4 text-left">Début</th>
// //                 <th className="p-4 text-left">Fin</th>
// //                 <th className="p-4 text-left">Statut</th>
// //                 <th className="p-4 text-center">Actions</th>
// //               </tr>
// //             </thead>

// //             <tbody>
// //               {elections.length === 0 ? (
// //                 <tr>
// //                   <td colSpan="7" className="p-6 text-center text-gray-500">
// //                     Aucune élection en attente 🎉
// //                   </td>
// //                 </tr>
// //               ) : (
// //                 elections.map((election) => (
// //                   <tr key={election.id} className="border-t hover:bg-gray-50 text-black">
// //                     <td className="p-4 font-medium">{election.titre}</td>
// //                     <td className="p-4">{election.type}</td>
// //                     <td className="p-4">{election.createur}</td>
// //                     <td className="p-4">{election.debut}</td>
// //                     <td className="p-4">{election.fin}</td>
// //                     <td className="p-4">
// //                       <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
// //                         En attente
// //                       </span>
// //                     </td>
// //                     <td className="p-4 flex justify-center gap-2">
// //                       <button title="Voir détails" className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600">
// //                         <FiEye />
// //                       </button>
// //                       <button title="Valider" onClick={() => handleValider(election.id)} className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600">
// //                         <FiCheckCircle />
// //                       </button>
// //                       <button title="Refuser" onClick={() => handleRefuser(election.id)} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
// //                         <FiXCircle />
// //                       </button>
// //                     </td>
// //                   </tr>
// //                 ))
// //               )}
// //             </tbody>
// //           </table>
// //         </div>
// //       </main>
// //     </div>
// //   );
// // }






















// // import React, { useState } from "react";
// // import { FiCheckCircle, FiXCircle, FiEye } from "react-icons/fi";

// // const fakeElections = [
// //   {
// //     id: 1,
// //     titre: "Élection universitaire 2026",
// //     type: "Uninominal",
// //     createur: "Moussa Ouhoumoud",
// //     debut: "2026-03-01",
// //     fin: "2026-03-05",
// //     statut: "en_attente",
// //   },
// //   {
// //     id: 2,
// //     titre: "Conseil municipal",
// //     type: "Liste",
// //     createur: "Jean Dupont",
// //     debut: "2026-04-10",
// //     fin: "2026-04-15",
// //     statut: "en_attente",
// //   },
// // ];

// // export default function ElectionsValider() {
// //   const [elections, setElections] = useState(fakeElections);

// //   const handleValider = (id) => {
// //     if (!window.confirm("Valider cette élection ?")) return;
// //     setElections(elections.filter((e) => e.id !== id));
// //     alert("Élection validée ✅");
// //   };

// //   const handleRefuser = (id) => {
// //     if (!window.confirm("Refuser cette élection ?")) return;
// //     setElections(elections.filter((e) => e.id !== id));
// //     alert("Élection refusée ❌");
// //   };

// //   return (
// //     <div className="p-8">
// //       {/* TITRE */}
// //       <div className="mb-6">
// //         <h1 className="text-2xl font-bold text-blue-800">
// //           🗳 Élections à valider
// //         </h1>
// //         <p className="text-gray-600">
// //           Liste des élections en attente de validation par le Super Administrateur
// //         </p>
// //       </div>

// //       {/* TABLE */}
// //       <div className="bg-white rounded-xl shadow overflow-x-auto">
// //         <table className="w-full text-sm">
// //           <thead className="bg-blue-100 text-blue-900">
// //             <tr>
// //               <th className="p-4 text-left">Titre</th>
// //               <th className="p-4 text-left">Type</th>
// //               <th className="p-4 text-left">Créateur</th>
// //               <th className="p-4 text-left">Début</th>
// //               <th className="p-4 text-left">Fin</th>
// //               <th className="p-4 text-left">Statut</th>
// //               <th className="p-4 text-center">Actions</th>
// //             </tr>
// //           </thead>

// //           <tbody>
// //             {elections.length === 0 ? (
// //               <tr>
// //                 <td colSpan="7" className="p-6 text-center text-gray-500">
// //                   Aucune élection en attente 🎉
// //                 </td>
// //               </tr>
// //             ) : (
// //               elections.map((election) => (
// //                 <tr
// //                   key={election.id}
// //                   className="border-t hover:bg-gray-50"
// //                 >
// //                   <td className="p-4 font-medium">{election.titre}</td>
// //                   <td className="p-4">{election.type}</td>
// //                   <td className="p-4">{election.createur}</td>
// //                   <td className="p-4">{election.debut}</td>
// //                   <td className="p-4">{election.fin}</td>
// //                   <td className="p-4">
// //                     <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
// //                       En attente
// //                     </span>
// //                   </td>
// //                   <td className="p-4 flex justify-center gap-2">
// //                     <button
// //                       title="Voir détails"
// //                       className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
// //                     >
// //                       <FiEye />
// //                     </button>
// //                     <button
// //                       title="Valider"
// //                       onClick={() => handleValider(election.id)}
// //                       className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
// //                     >
// //                       <FiCheckCircle />
// //                     </button>
// //                     <button
// //                       title="Refuser"
// //                       onClick={() => handleRefuser(election.id)}
// //                       className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
// //                     >
// //                       <FiXCircle />
// //                     </button>
// //                   </td>
// //                 </tr>
// //               ))
// //             )}
// //           </tbody>
// //         </table>
// //       </div>
// //     </div>
// //   );
// // }

