// src/pages/admin/superadmin/superAdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import api from "../../../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* -------- STAT CARD -------- */
const StatCard = ({ title, amount, icon: Icon, bg }) => (
  <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
    <div>
      <p className="text-gray-600 text-sm">{title}</p>
      <p className="text-2xl font-bold text-blue-700">{amount}</p>
    </div>
    <div className={`p-3 rounded-full ${bg}`}>
      <Icon className="text-white text-xl" />
    </div>
  </div>
);

export default function SuperAdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/superadmin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("❌ Erreur stats:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const data = {
    labels: stats?.evolutionVotes?.map(e => e.mois) || [],
    datasets: [
      {
        label: "Votes globaux",
        data: stats?.evolutionVotes?.map(e => e.nb_votes) || [],
        backgroundColor: "rgba(37,99,235,0.8)",
        borderRadius: 8
      }
    ]
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>
        <nav className="flex-1 space-y-3">
          <Link to="/superAdminDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
            <FiHome /> Tableau de bord
          </Link>
          <Link to="/admin/superadmin/utilisateursPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
            <FiUsers /> Utilisateurs
          </Link>
          <Link to="/admin/superadmin/electionsValider" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
            <FaVoteYea /> Élections à valider
          </Link>
          <Link to="/admin/superadmin/StatistiquesPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
            <FiBarChart2 /> Statistiques
          </Link>
        </nav>
        <div className="space-y-3 mt-6">
          <Link to="/admin/superadmin/ParametresPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
            <FiSettings /> Paramètres
          </Link>
          <Link to="/logout" className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
            <FiLogOut /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8">
        <div className="bg-white/80 rounded-xl shadow p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900">Bienvenue Super Administrateur 👑</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Utilisateurs"
                amount={stats?.totalUtilisateurs?.toLocaleString("fr-FR") ?? "—"}
                icon={FiUsers}
                bg="bg-blue-500"
              />
              <StatCard
                title="Élections"
                amount={stats?.totalElections ?? "—"}
                icon={FaVoteYea}
                bg="bg-indigo-500"
              />
              <StatCard
                title="En attente"
                amount={stats?.enAttente ?? "—"}
                icon={FiAlertCircle}
                bg="bg-yellow-500"
              />
              <StatCard
                title="Participation globale"
                amount={`${stats?.tauxParticipation ?? 0}%`}
                icon={FiCheckCircle}
                bg="bg-green-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white/80 p-6 rounded-xl shadow lg:col-span-2">
                <h3 className="font-semibold mb-4 text-blue-900">Évolution globale des votes</h3>
                <Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-red-500 to-red-400 p-6 rounded-xl text-white shadow">
                  <h4 className="font-semibold mb-2">⚠ Alertes système</h4>
                  <p>{stats?.enAttente} élection(s) en attente de validation</p>
                  <p>{stats?.enCours} élection(s) en cours</p>
                </div>

                <div className="bg-white/80 p-4 rounded-xl shadow">
                  <h4 className="font-semibold mb-3 text-blue-900">Élections à valider</h4>
                  {stats?.electionsEnAttente?.length === 0 ? (
                    <p className="text-gray-400 text-sm">Aucune élection en attente.</p>
                  ) : (
                    stats?.electionsEnAttente?.map(e => (
                      <div key={e.id_election} className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium">{e.titre}</p>
                          <p className="text-sm text-yellow-600">En attente</p>
                        </div>
                        <Link
                          to="/admin/superadmin/electionsValider"
                          className="text-blue-600 font-semibold"
                        >
                          Voir
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}































// // src/pages/admin/superadmin/superAdminDashboard.jsx
// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { Bar } from "react-chartjs-2";
// import {
//   FiHome, FiUsers, FiBarChart2, FiSettings,
//   FiLogOut, FiAlertCircle, FiCheckCircle, FiTrendingUp, FiCalendar
// } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";
// import {
//   Chart as ChartJS, CategoryScale,
//   LinearScale, BarElement, Tooltip, Legend
// } from "chart.js";
// import api from "../../../services/api";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// /* ── Stat Card ── */
// const StatCard = ({ title, amount, icon: Icon, bg, sub }) => (
//   <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-5 flex items-center justify-between hover:shadow-md transition-all">
//     <div>
//       <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{title}</p>
//       <p className="text-3xl font-black text-gray-800 mt-1">{amount}</p>
//       {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
//     </div>
//     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
//       <Icon className="text-white text-xl" />
//     </div>
//   </div>
// );

// export default function SuperAdminDashboard() {
//   const [stats,   setStats]   = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error,   setError]   = useState("");

//   useEffect(() => { fetchStats(); }, []);

//   const fetchStats = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/superadmin/stats");
//       setStats(res.data);
//     } catch (err) {
//       setError("Impossible de charger les statistiques.");
//       console.error("❌ Erreur stats:", err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const chartData = {
//     labels: stats?.evolutionVotes?.map(e => e.mois) || [],
//     datasets: [{
//       label: "Votes",
//       data:  stats?.evolutionVotes?.map(e => e.nb_votes) || [],
//       backgroundColor: [
//         "rgba(37,99,235,0.85)",
//         "rgba(99,102,241,0.85)",
//         "rgba(16,185,129,0.85)",
//         "rgba(245,158,11,0.85)",
//         "rgba(239,68,68,0.85)",
//         "rgba(59,130,246,0.85)",
//       ],
//       borderRadius: 10,
//       borderSkipped: false,
//     }]
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">

//       {/* ===== SIDEBAR ===== */}
//       <aside className="w-64 bg-white shadow-xl border-r border-blue-100 p-6 flex flex-col sticky top-0 h-screen">
//         <div className="mb-10">
//           <h1 className="text-2xl font-black text-blue-700 tracking-tight">🗳 eVote</h1>
//           <p className="text-xs text-blue-400 mt-1 font-medium">Super Administration</p>
//         </div>
//         <nav className="flex-1 space-y-1">
//           <Link to="/superAdminDashboard"
//             className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md">
//             <FiHome /> Tableau de bord
//           </Link>
//           <Link to="/admin/superadmin/utilisateursPage"
//             className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm font-medium">
//             <FiUsers /> Utilisateurs
//           </Link>
//           <Link to="/admin/superadmin/electionsValider"
//             className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm font-medium">
//             <FaVoteYea /> Élections à valider
//             {stats?.enAttente > 0 && (
//               <span className="ml-auto bg-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
//                 {stats.enAttente}
//               </span>
//             )}
//           </Link>
//           <Link to="/admin/superadmin/StatistiquesPage"
//             className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm font-medium">
//             <FiBarChart2 /> Statistiques
//           </Link>
//         </nav>
//         <div className="space-y-1 pt-4 border-t border-gray-100">
//           <Link to="/admin/superadmin/ParametresPage"
//             className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 transition-all text-sm">
//             <FiSettings /> Paramètres
//           </Link>
//           <Link to="/logout"
//             className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all text-sm">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ===== MAIN ===== */}
//       <main className="flex-1 p-8 overflow-y-auto">

//         {/* Header */}
//         <div className="mb-8">
//           <h2 className="text-3xl font-black text-blue-900 tracking-tight">Tableau de bord</h2>
//           <p className="text-blue-400 mt-1 text-sm font-medium">
//             Bienvenue Super Administrateur 👑 — Vue globale de la plateforme eVote
//           </p>
//         </div>

//         {/* Erreur */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2 text-sm">
//             <FiAlertCircle /> {error}
//           </div>
//         )}

//         {/* Loading */}
//         {loading ? (
//           <div className="flex items-center justify-center py-32">
//             <div className="flex flex-col items-center gap-4">
//               <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
//               <p className="text-blue-500 font-medium">Chargement des statistiques...</p>
//             </div>
//           </div>
//         ) : (
//           <>
//             {/* ── KPI Cards ── */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//               <StatCard
//                 title="Utilisateurs"
//                 amount={stats?.totalUtilisateurs?.toLocaleString("fr-FR") ?? "—"}
//                 icon={FiUsers}
//                 bg="bg-blue-500"
//                 sub="Total inscrits"
//               />
//               <StatCard
//                 title="Élections"
//                 amount={stats?.totalElections ?? "—"}
//                 icon={FaVoteYea}
//                 bg="bg-indigo-500"
//                 sub={`${stats?.enCours ?? 0} en cours · ${stats?.terminees ?? 0} terminées`}
//               />
//               <StatCard
//                 title="En attente"
//                 amount={stats?.enAttente ?? "—"}
//                 icon={FiAlertCircle}
//                 bg="bg-yellow-500"
//                 sub="Validation requise"
//               />
//               <StatCard
//                 title="Participation"
//                 amount={`${stats?.tauxParticipation ?? 0}%`}
//                 icon={FiCheckCircle}
//                 bg="bg-emerald-500"
//                 sub={`${stats?.totalVotes ?? 0} votes / ${stats?.totalElecteurs ?? 0} électeurs`}
//               />
//             </div>

//             {/* ── Graphique + Alertes ── */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

//               {/* Graphique */}
//               <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6 lg:col-span-2">
//                 <div className="flex items-center justify-between mb-5">
//                   <h3 className="font-bold text-blue-900">Évolution globale des votes</h3>
//                   <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
//                     6 derniers mois
//                   </span>
//                 </div>
//                 {stats?.evolutionVotes?.length === 0 ? (
//                   <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
//                     Aucune donnée disponible
//                   </div>
//                 ) : (
//                   <Bar
//                     data={chartData}
//                     options={{
//                       responsive: true,
//                       plugins: {
//                         legend: { display: false },
//                         tooltip: {
//                           backgroundColor: "#1e40af",
//                           padding: 12,
//                           cornerRadius: 8,
//                         }
//                       },
//                       scales: {
//                         x: { grid: { display: false }, ticks: { font: { weight: "600" } } },
//                         y: { grid: { color: "#f3f4f6" }, ticks: { font: { size: 12 } } }
//                       }
//                     }}
//                   />
//                 )}
//               </div>

//               {/* Colonne droite */}
//               <div className="space-y-4">

//                 {/* Alertes */}
//                 <div className="bg-gradient-to-br from-red-500 to-red-400 p-5 rounded-2xl text-white shadow-md">
//                   <h4 className="font-bold mb-3 flex items-center gap-2">
//                     <FiAlertCircle /> Alertes système
//                   </h4>
//                   <div className="space-y-2 text-sm">
//                     <div className="bg-white/20 rounded-xl px-3 py-2">
//                       📋 {stats?.enAttente} élection(s) en attente de validation
//                     </div>
//                     <div className="bg-white/20 rounded-xl px-3 py-2">
//                       🟢 {stats?.enCours} élection(s) actuellement en cours
//                     </div>
//                   </div>
//                 </div>

//                 {/* Résumé rapide */}
//                 <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-5">
//                   <h4 className="font-bold text-blue-900 mb-3 text-sm">Résumé rapide</h4>
//                   <div className="space-y-3">
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="text-gray-500 flex items-center gap-2"><FiTrendingUp className="text-indigo-400" /> Votes totaux</span>
//                       <span className="font-black text-indigo-700">{stats?.totalVotes?.toLocaleString("fr-FR") ?? 0}</span>
//                     </div>
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="text-gray-500 flex items-center gap-2"><FiUsers className="text-blue-400" /> Électeurs inscrits</span>
//                       <span className="font-black text-blue-700">{stats?.totalElecteurs?.toLocaleString("fr-FR") ?? 0}</span>
//                     </div>
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="text-gray-500 flex items-center gap-2"><FiCalendar className="text-emerald-400" /> Élections terminées</span>
//                       <span className="font-black text-emerald-700">{stats?.terminees ?? 0}</span>
//                     </div>
//                     {/* Barre participation */}
//                     <div>
//                       <div className="flex justify-between text-xs text-gray-400 mb-1">
//                         <span>Participation globale</span>
//                         <span>{stats?.tauxParticipation ?? 0}%</span>
//                       </div>
//                       <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
//                         <div
//                           className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-700"
//                           style={{ width: `${Math.min(stats?.tauxParticipation ?? 0, 100)}%` }}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//               </div>
//             </div>

//             {/* ── Élections en attente ── */}
//             <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
//               <div className="px-6 py-4 border-b border-blue-50 flex items-center justify-between">
//                 <h4 className="font-bold text-blue-900 text-sm uppercase tracking-widest">
//                   Élections en attente de validation
//                 </h4>
//                 <Link
//                   to="/admin/superadmin/electionsValider"
//                   className="text-blue-600 text-sm font-semibold hover:underline"
//                 >
//                   Voir tout →
//                 </Link>
//               </div>

//               {stats?.electionsEnAttente?.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center py-10 text-center">
//                   <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
//                     <FiCheckCircle className="text-emerald-500 text-xl" />
//                   </div>
//                   <p className="text-gray-500 font-medium">Aucune élection en attente</p>
//                   <p className="text-gray-400 text-sm mt-1">Toutes les élections sont traitées ✓</p>
//                 </div>
//               ) : (
//                 <table className="min-w-full">
//                   <thead>
//                     <tr className="bg-blue-50">
//                       <th className="px-6 py-3 text-left text-xs font-bold text-blue-400 uppercase tracking-wider">Élection</th>
//                       <th className="px-6 py-3 text-left text-xs font-bold text-blue-400 uppercase tracking-wider">Admin</th>
//                       <th className="px-6 py-3 text-left text-xs font-bold text-blue-400 uppercase tracking-wider">Date début</th>
//                       <th className="px-6 py-3 text-left text-xs font-bold text-blue-400 uppercase tracking-wider">Date fin</th>
//                       <th className="px-6 py-3 text-center text-xs font-bold text-blue-400 uppercase tracking-wider">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-50">
//                     {stats?.electionsEnAttente?.map((e) => (
//                       <tr key={e.id_election} className="hover:bg-blue-50/40 transition-colors">
//                         <td className="px-6 py-4 font-bold text-gray-800">{e.titre}</td>
//                         <td className="px-6 py-4">
//                           <div>
//                             <p className="text-sm font-semibold text-gray-700">{e.admin_prenom} {e.admin_nom}</p>
//                             <p className="text-xs text-gray-400">{e.admin_email}</p>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 text-sm text-gray-500">
//                           {new Date(e.date_debut).toLocaleDateString("fr-FR")}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-gray-500">
//                           {new Date(e.date_fin).toLocaleDateString("fr-FR")}
//                         </td>
//                         <td className="px-6 py-4 text-center">
//                           <Link
//                             to="/admin/superadmin/electionsValider"
//                             className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all"
//                           >
//                             Valider
//                           </Link>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               )}
//             </div>

//           </>
//         )}
//       </main>
//     </div>
//   );
// }




















































// import React from "react";
// import { Link } from "react-router-dom";
// import { Bar } from "react-chartjs-2";
// import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Tooltip,
//   Legend
// } from "chart.js";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// /* -------- STAT CARD -------- */
// const StatCard = ({ title, amount, icon: Icon, bg }) => (
//   <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
//     <div>
//       <p className="text-gray-600 text-sm">{title}</p>
//       <p className="text-2xl font-bold">{amount}</p>
//     </div>
//     <div className={`p-3 rounded-full ${bg}`}>
//       <Icon className="text-white text-xl" />
//     </div>
//   </div>
// );

// export default function SuperAdminDashboard() {
//   const data = {
//     labels: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"],
//     datasets: [
//       {
//         label: "Votes globaux",
//         data: [1200, 2300, 3100, 4200, 5000, 6100],
//         backgroundColor: "rgba(37,99,235,0.8)",
//         borderRadius: 8
//       }
//     ]
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
//       {/* SIDEBAR */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="/superAdminDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
//             <FiHome /> Tableau de bord
//           </Link>
//           <Link to="/admin/superadmin/utilisateursPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
//             <FiUsers /> Utilisateurs
//           </Link>
//           <Link to="/admin/superadmin/electionsValider" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
//             <FaVoteYea /> Élections à valider
//           </Link>
//           <Link to="/admin/superadmin/StatistiquesPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
//             <FiBarChart2 /> Statistiques
//           </Link>
//         </nav>
//         <div className="space-y-3 mt-6">
//           <Link to="/admin/superadmin/ParametresPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
//             <FiSettings /> Paramètres
//           </Link>
//           <Link to="/logout" className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* MAIN */}
//       <main className="flex-1 p-8">
//         <div className="bg-white/80 rounded-xl shadow p-4 mb-6">
//           <h2 className="text-lg font-semibold text-blue-900">Bienvenue Super Administrateur 👑</h2>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
//           <StatCard title="Utilisateurs" amount="5 420" icon={FiUsers} bg="bg-blue-500" />
//           <StatCard title="Élections" amount="38" icon={FaVoteYea} bg="bg-indigo-500" />
//           <StatCard title="En attente" amount="6" icon={FiAlertCircle} bg="bg-yellow-500" />
//           <StatCard title="Participation globale" amount="74%" icon={FiCheckCircle} bg="bg-green-500" />
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <div className="bg-white/80 p-6 rounded-xl shadow lg:col-span-2">
//             <h3 className="font-semibold mb-4 text-blue-900">Évolution globale des votes</h3>
//             <Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
//           </div>

//           <div className="space-y-6">
//             <div className="bg-gradient-to-br from-red-500 to-red-400 p-6 rounded-xl text-white shadow">
//               <h4 className="font-semibold mb-2">⚠ Alertes système</h4>
//               <p>3 élections en attente de validation</p>
//               <p>1 tentative suspecte détectée</p>
//             </div>

//             <div className="bg-white/80 p-4 rounded-xl shadow">
//               <h4 className="font-semibold mb-3 text-blue-900">Élections à valider</h4>
//               <div className="flex justify-between items-center mb-2">
//                 <div>
//                   <p className="font-medium">Élection universitaire 2026</p>
//                   <p className="text-sm text-yellow-600">En attente</p>
//                 </div>
//                 <span className="text-blue-600 font-semibold">Voir</span>
//               </div>
//               <div className="flex justify-between items-center">
//                 <div>
//                   <p className="font-medium">Conseil municipal</p>
//                   <p className="text-sm text-yellow-600">En attente</p>
//                 </div>
//                 <span className="text-blue-600 font-semibold">Voir</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

