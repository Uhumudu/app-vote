// src/pages/adminSuper/StatistiquesPage.jsx
import React, { useState, useEffect } from "react";
import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut } from "react-icons/fi";
import { FaVoteYea, FaCrown, FaUser, FaUserCheck, FaUserTimes, FaBullseye, FaCheckCircle, FaClock } from "react-icons/fa";
import { Bar, Line, Pie } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function StatistiquesPage() {
  const navigate = useNavigate();
  const [filter, setFilter]             = useState("Aujourd'hui");
  const [loading, setLoading]           = useState(true);
  const [kpis, setKpis]                 = useState({
    totalElections: 0, valides: 0, enAttente: 0, refusees: 0,
    totalUsers: 0, superAdmins: 0, adminElections: 0,
    electeursActifs: 0, electeursInactifs: 0,
  });
  const [electionsTable,         setElectionsTable]         = useState([]);
  const [participationData,      setParticipationData]      = useState([]);
  const [electeursParMois,       setElecteursParMois]       = useState([]);
  const [electionsByStatut,      setElectionsByStatut]      = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/Login"); return; }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/statistiques");
      const data = res.data;
      setKpis(data.kpis);
      setElectionsTable(data.electionsTable);
      setParticipationData(data.participationParElection);
      setElecteursParMois(data.electeursParMois);
      setElectionsByStatut(data.electionsByStatut);
    } catch (err) {
      console.error("❌ Erreur fetchStats:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== CHART DATA (connecté au backend) =====
  const electionsStatusData = {
    labels: ["Validée", "En attente", "Refusée"],
    datasets: [
      {
        label: "Élections",
        data: [
          electionsByStatut.find(e => e.statut === "VALIDEE")?.total      || 0,
          electionsByStatut.find(e => e.statut === "EN_ATTENTE")?.total   || 0,
          electionsByStatut.find(e => e.statut === "REFUSEE")?.total      || 0,
        ],
        backgroundColor: ["#16a34a", "#facc15", "#ef4444"],
      },
    ],
  };

  const usersRoleData = {
    labels: ["SuperAdmin", "Admin Élections", "Électeurs actifs", "Électeurs inactifs"],
    datasets: [
      {
        label: "Utilisateurs",
        data: [
          kpis.superAdmins,
          kpis.adminElections,
          kpis.electeursActifs,
          kpis.electeursInactifs,
        ],
        backgroundColor: ["#1d4ed8", "#06b6d4", "#16a34a", "#ef4444"],
      },
    ],
  };

  const electeursLineData = {
    labels: electeursParMois.map(e => e.mois),
    datasets: [
      {
        label: "Électeurs inscrits",
        data: electeursParMois.map(e => e.total),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const votesBarData = {
    labels: participationData.map(e => e.titre),
    datasets: [
      {
        label: "Participation (%)",
        data: participationData.map(e => e.participation),
        backgroundColor: "#2563eb",
      },
    ],
  };

  // ===== Export CSV =====
  const exportCSV = () => {
    const csvHeader = ["Titre,Type,Créateur,Début,Fin,Statut,Participation"];
    const csvRows = electionsTable.map(e =>
      `${e.titre},${e.type},${e.createur_prenom} ${e.createur_nom},${e.date_debut},${e.date_fin},${e.statut_validation},${e.participation}%`
    );
    const csvContent = ["data:text/csv;charset=utf-8,", ...csvHeader, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "statistiques_elections.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const notifications = [
    kpis.enAttente > 0      && `⚠️ ${kpis.enAttente} élection(s) en attente de validation.`,
    kpis.electeursInactifs > 0 && `⚠️ ${kpis.electeursInactifs} électeur(s) inactif(s).`,
    participationData.some(e => e.participation < 50) && "⚠️ Faible participation détectée sur certaines élections.",
  ].filter(Boolean);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>
        <nav className="flex-1 space-y-3">
          <a onClick={() => navigate("/superAdminDashboard")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
            <FiHome /> Tableau de bord
          </a>
          <a onClick={() => navigate("/admin/superadmin/utilisateursPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
            <FiUsers /> Utilisateurs
          </a>
          <a onClick={() => navigate("/admin/superadmin/electionsValider")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
            <FaVoteYea /> Élections à valider
          </a>
          <a onClick={() => navigate("/admin/superadmin/StatistiquesPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold cursor-pointer">
            <FiBarChart2 /> Statistiques
          </a>
        </nav>
        <div className="space-y-3 mt-6">
          <a onClick={() => navigate("/admin/superadmin/ParametresPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
            <FiSettings /> Paramètres
          </a>
          <a onClick={() => navigate("/logout")} className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
            <FiLogOut /> Déconnexion
          </a>
        </div>
      </aside>

      {/* CONTENU STATISTIQUES */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold text-blue-800 mb-6">📊 Statistiques SuperAdmin</h1>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="mb-6 space-y-2">
                {notifications.map((note, i) => (
                  <div key={i} className="bg-yellow-100 text-yellow-800 p-3 rounded-lg shadow">{note}</div>
                ))}
              </div>
            )}

            {/* Filtres & Export */}
            <div className="mb-6 flex items-center gap-4">
              <span className="font-medium text-gray-700">Filtrer par :</span>
              {["Aujourd'hui", "Cette semaine", "Ce mois"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium ${filter === f ? "bg-blue-500 text-white" : "bg-white text-gray-700"} hover:bg-blue-400 hover:text-white transition`}
                >
                  {f}
                </button>
              ))}
              <button onClick={exportCSV} className="ml-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                Export CSV
              </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <FaBullseye className="text-blue-500 text-3xl mb-2" />
                <h2 className="text-xl font-bold">{kpis.totalElections}</h2>
                <p className="text-gray-500">Élections totales</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <FaCheckCircle className="text-green-600 text-3xl mb-2" />
                <h2 className="text-xl font-bold">{kpis.valides}</h2>
                <p className="text-gray-500">Élections validées</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <FaClock className="text-yellow-500 text-3xl mb-2" />
                <h2 className="text-xl font-bold">{kpis.enAttente}</h2>
                <p className="text-gray-500">Élections en attente</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <FaUser className="text-purple-600 text-3xl mb-2" />
                <h2 className="text-xl font-bold">{kpis.totalUsers}</h2>
                <p className="text-gray-500">Utilisateurs</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <FaCrown className="text-blue-800 text-3xl mb-2" />
                <h2 className="text-xl font-bold">{kpis.superAdmins}</h2>
                <p className="text-gray-500">SuperAdmins</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <FaVoteYea className="text-cyan-500 text-3xl mb-2" />
                <h2 className="text-xl font-bold">{kpis.adminElections}</h2>
                <p className="text-gray-500">Admins Élections</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <FaUserCheck className="text-green-600 text-3xl mb-2" />
                <h2 className="text-xl font-bold">{kpis.electeursActifs}</h2>
                <p className="text-gray-500">Électeurs actifs</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <FaUserTimes className="text-red-500 text-3xl mb-2" />
                <h2 className="text-xl font-bold">{kpis.electeursInactifs}</h2>
                <p className="text-gray-500">Électeurs inactifs</p>
              </div>
            </div>

            {/* GRAPHIQUES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-blue-800 mb-4">Élections par statut</h3>
                <Bar data={electionsStatusData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-blue-800 mb-4">Utilisateurs par rôle</h3>
                <Pie data={usersRoleData} options={{ responsive: true }} />
              </div>

              <div className="bg-white rounded-xl shadow p-6 md:col-span-2">
                <h3 className="font-semibold text-blue-800 mb-4">Électeurs inscrits dans le temps</h3>
                <Line data={electeursLineData} options={{ responsive: true }} />
              </div>

              <div className="bg-white rounded-xl shadow p-6 md:col-span-2">
                <h3 className="font-semibold text-blue-800 mb-4">Votes par élection</h3>
                <Bar data={votesBarData} options={{ responsive: true }} />
              </div>
            </div>

            {/* TABLEAU ÉLECTIONS */}
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
                    <th className="p-4 text-left">Participation</th>
                  </tr>
                </thead>
                <tbody>
                  {electionsTable.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">Aucune élection trouvée</td>
                    </tr>
                  ) : (
                    electionsTable.map((election, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 text-black">
                        <td className="p-4 font-medium">{election.titre}</td>
                        <td className="p-4">{election.type}</td>
                        <td className="p-4">{election.createur_prenom} {election.createur_nom}</td>
                        <td className="p-4">{new Date(election.date_debut).toLocaleDateString("fr-FR")}</td>
                        <td className="p-4">{new Date(election.date_fin).toLocaleDateString("fr-FR")}</td>
                        <td className={`p-4 font-medium ${
                          election.statut_validation === "VALIDEE"    ? "text-green-600" :
                          election.statut_validation === "EN_ATTENTE" ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {election.statut_validation === "VALIDEE"    ? "Validée"    :
                           election.statut_validation === "EN_ATTENTE" ? "En attente" : "Refusée"}
                        </td>
                        <td className="p-4">{election.participation}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}















































// // src/pages/adminSuper/StatistiquesPage.jsx
// import React, { useState } from "react";
// import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut } from "react-icons/fi";
// import { FaVoteYea, FaCrown, FaUser, FaUserCheck, FaUserTimes, FaBullseye, FaCheckCircle, FaClock } from "react-icons/fa";
// import { Bar, Line, Pie } from "react-chartjs-2";
// import { useNavigate } from "react-router-dom";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   PointElement,
//   LineElement,
//   ArcElement,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   PointElement,
//   LineElement,
//   ArcElement,
//   Tooltip,
//   Legend
// );

// export default function StatistiquesPage() {
//   const navigate = useNavigate();
//   const [filter, setFilter] = useState("Aujourd'hui");

//   // ===== MOCK DATA =====
//   const kpis = {
//     totalElections: 12,
//     valides: 8,
//     enAttente: 4,
//     totalUsers: 120,
//     superAdmins: 2,
//     adminElections: 10,
//     electeursActifs: 108,
//     electeursInactifs: 12,
//   };

//   const electionsTable = [
//     {
//       titre: "Élection universitaire 2026",
//       type: "Uninominal",
//       createur: "Moussa Ouhoumoud",
//       debut: "2026-03-01",
//       fin: "2026-03-05",
//       statut: "Validée",
//       participation: "90%",
//     },
//     {
//       titre: "Conseil municipal",
//       type: "Liste",
//       createur: "Jean Dupont",
//       debut: "2026-04-10",
//       fin: "2026-04-15",
//       statut: "En attente",
//       participation: "50%",
//     },
//     {
//       titre: "Élection club étudiant",
//       type: "Uninominal",
//       createur: "Amina Bello",
//       debut: "2026-05-01",
//       fin: "2026-05-03",
//       statut: "Refusée",
//       participation: "0%",
//     },
//   ];

//   // ===== CHART DATA =====
//   const electionsStatusData = {
//     labels: ["Validée", "En attente", "Refusée"],
//     datasets: [
//       {
//         label: "Élections",
//         data: [kpis.valides, kpis.enAttente, 0],
//         backgroundColor: ["#16a34a", "#facc15", "#ef4444"],
//       },
//     ],
//   };

//   const usersRoleData = {
//     labels: ["SuperAdmin", "Admin Élections", "Électeurs actifs", "Électeurs inactifs"],
//     datasets: [
//       {
//         label: "Utilisateurs",
//         data: [kpis.superAdmins, kpis.adminElections, kpis.electeursActifs, kpis.electeursInactifs],
//         backgroundColor: ["#1d4ed8", "#06b6d4", "#16a34a", "#ef4444"],
//       },
//     ],
//   };

//   const electeursLineData = {
//     labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
//     datasets: [
//       {
//         label: "Électeurs inscrits",
//         data: [20, 35, 50, 75, 90, 120],
//         borderColor: "#2563eb",
//         backgroundColor: "rgba(37, 99, 235, 0.2)",
//         tension: 0.3,
//       },
//     ],
//   };

//   const votesBarData = {
//     labels: electionsTable.map(e => e.titre),
//     datasets: [
//       {
//         label: "Participation (%)",
//         data: electionsTable.map(e => parseInt(e.participation)),
//         backgroundColor: "#2563eb",
//       },
//     ],
//   };

//   const notifications = [
//     "⚠️ Élection 'Conseil municipal' approche de sa date de fin.",
//     "⚠️ 12 électeurs sont inactifs depuis plus de 30 jours.",
//     "⚠️ Faible participation détectée sur certaines élections.",
//   ];

//   // ===== Export CSV simple =====
//   const exportCSV = () => {
//     const csvHeader = ["Titre,Type,Créateur,Début,Fin,Statut,Participation"];
//     const csvRows = electionsTable.map(e => 
//       `${e.titre},${e.type},${e.createur},${e.debut},${e.fin},${e.statut},${e.participation}`
//     );
//     const csvContent = ["data:text/csv;charset=utf-8,", ...csvHeader, ...csvRows].join("\n");
//     const encodedUri = encodeURI(csvContent);
//     const link = document.createElement("a");
//     link.setAttribute("href", encodedUri);
//     link.setAttribute("download", "statistiques_elections.csv");
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

//       {/* SIDEBAR */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>
//         <nav className="flex-1 space-y-3">
//           <a onClick={() => navigate("/superAdminDashboard")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
//             <FiHome /> Tableau de bord
//           </a>
//           <a onClick={() => navigate("/admin/superadmin/utilisateursPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
//             <FiUsers /> Utilisateurs
//           </a>
//           <a onClick={() => navigate("/admin/superadmin/electionsValider")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
//             <FaVoteYea /> Élections à valider
//           </a>
//           <a onClick={() => navigate("/admin/superadmin/StatistiquesPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold cursor-pointer">
//             <FiBarChart2 /> Statistiques
//           </a>
//         </nav>
//         <div className="space-y-3 mt-6">
//           <a onClick={() => navigate("/admin/superadmin/ParametresPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
//             <FiSettings /> Paramètres
//           </a>
//           <a onClick={() => navigate("/logout")} className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 text-red-600 cursor-pointer">
//             <FiLogOut /> Déconnexion
//           </a>
//         </div>
//       </aside>

//       {/* CONTENU STATISTIQUES */}
//       <main className="flex-1 p-8 overflow-y-auto">
//         <h1 className="text-2xl font-bold text-blue-800 mb-6">📊 Statistiques SuperAdmin</h1>

//         {/* Notifications */}
//         <div className="mb-6 space-y-2">
//           {notifications.map((note, i) => (
//             <div key={i} className="bg-yellow-100 text-yellow-800 p-3 rounded-lg shadow">{note}</div>
//           ))}
//         </div>

//         {/* Filtres & Export */}
//         <div className="mb-6 flex items-center gap-4">
//           <span className="font-medium text-gray-700">Filtrer par :</span>
//           {["Aujourd'hui", "Cette semaine", "Ce mois"].map(f => (
//             <button
//               key={f}
//               onClick={() => setFilter(f)}
//               className={`px-4 py-2 rounded-lg font-medium ${filter === f ? "bg-blue-500 text-white" : "bg-white text-gray-700"} hover:bg-blue-400 hover:text-white transition`}
//             >
//               {f}
//             </button>
//           ))}
//           <button onClick={exportCSV} className="ml-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
//             Export CSV
//           </button>
//         </div>

//         {/* KPIs */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
//           <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
//             <FaBullseye className="text-blue-500 text-3xl mb-2" />
//             <h2 className="text-xl font-bold">{kpis.totalElections}</h2>
//             <p className="text-gray-500">Élections totales</p>
//           </div>
//           <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
//             <FaCheckCircle className="text-green-600 text-3xl mb-2" />
//             <h2 className="text-xl font-bold">{kpis.valides}</h2>
//             <p className="text-gray-500">Élections validées</p>
//           </div>
//           <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
//             <FaClock className="text-yellow-500 text-3xl mb-2" />
//             <h2 className="text-xl font-bold">{kpis.enAttente}</h2>
//             <p className="text-gray-500">Élections en attente</p>
//           </div>
//           <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
//             <FaUser className="text-purple-600 text-3xl mb-2" />
//             <h2 className="text-xl font-bold">{kpis.totalUsers}</h2>
//             <p className="text-gray-500">Utilisateurs</p>
//           </div>
//           <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
//             <FaCrown className="text-blue-800 text-3xl mb-2" />
//             <h2 className="text-xl font-bold">{kpis.superAdmins}</h2>
//             <p className="text-gray-500">SuperAdmins</p>
//           </div>
//           <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
//             <FaVoteYea className="text-cyan-500 text-3xl mb-2" />
//             <h2 className="text-xl font-bold">{kpis.adminElections}</h2>
//             <p className="text-gray-500">Admins Élections</p>
//           </div>
//           <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
//             <FaUserCheck className="text-green-600 text-3xl mb-2" />
//             <h2 className="text-xl font-bold">{kpis.electeursActifs}</h2>
//             <p className="text-gray-500">Électeurs actifs</p>
//           </div>
//           <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
//             <FaUserTimes className="text-red-500 text-3xl mb-2" />
//             <h2 className="text-xl font-bold">{kpis.electeursInactifs}</h2>
//             <p className="text-gray-500">Électeurs inactifs</p>
//           </div>
//         </div>

//         {/* GRAPHIQUES */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//           <div className="bg-white rounded-xl shadow p-6">
//             <h3 className="font-semibold text-blue-800 mb-4">Élections par statut</h3>
//             <Bar data={electionsStatusData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
//           </div>

//           <div className="bg-white rounded-xl shadow p-6">
//             <h3 className="font-semibold text-blue-800 mb-4">Utilisateurs par rôle</h3>
//             <Pie data={usersRoleData} options={{ responsive: true }} />
//           </div>

//           <div className="bg-white rounded-xl shadow p-6 md:col-span-2">
//             <h3 className="font-semibold text-blue-800 mb-4">Électeurs inscrits dans le temps</h3>
//             <Line data={electeursLineData} options={{ responsive: true }} />
//           </div>

//           <div className="bg-white rounded-xl shadow p-6 md:col-span-2">
//             <h3 className="font-semibold text-blue-800 mb-4">Votes par élection</h3>
//             <Bar data={votesBarData} options={{ responsive: true }} />
//           </div>
//         </div>

//         {/* TABLEAU ÉLECTIONS */}
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
//                 <th className="p-4 text-left">Participation</th>
//               </tr>
//             </thead>
//             <tbody>
//               {electionsTable.map((election, i) => (
//                 <tr key={i} className="border-t hover:bg-gray-50 text-black">
//                   <td className="p-4 font-medium">{election.titre}</td>
//                   <td className="p-4">{election.type}</td>
//                   <td className="p-4">{election.createur}</td>
//                   <td className="p-4">{election.debut}</td>
//                   <td className="p-4">{election.fin}</td>
//                   <td className={`p-4 font-medium ${
//                     election.statut === "Validée" ? "text-green-600" :
//                     election.statut === "En attente" ? "text-yellow-600" : "text-red-600"
//                   }`}>{election.statut}</td>
//                   <td className="p-4">{election.participation}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//       </main>
//     </div>
//   );
// }
