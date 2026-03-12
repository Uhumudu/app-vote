// src/pages/admin/adminelection/adminElectionDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiCalendar, FiUserCheck } from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";
import api from "../../../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const StatCard = ({ title, amount, icon: Icon, bg }) => (
  <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
    <div>
      <p className="text-gray-600 text-sm">{title}</p>
      <p className="text-2xl font-bold text-black">{amount}</p>
    </div>
    <div className={`p-3 rounded-full ${bg}`}>
      <Icon className="text-white text-xl" />
    </div>
  </div>
);

export default function AdminElectionDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Erreur dashboard:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartLabels = stats?.evolutionVotes?.map(v => v.mois) || ["Jan","Fév","Mar","Avr","Mai","Jun"];
  const chartData   = stats?.evolutionVotes?.map(v => v.nb_votes) || [0,0,0,0,0,0];

  const data = {
    labels: chartLabels,
    datasets: [{ label: "Votes", data: chartData, backgroundColor: "rgba(99,102,241,0.8)", borderRadius: 8 }]
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
        <nav className="flex-1 space-y-3">
          <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 font-semibold"><FiHome /> Tableau de bord</Link>
          <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiCalendar /> Mes élections</Link>
          {/* <Link to="/admin/adminelection/candidats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUsers /> Candidats</Link>
          <Link to="/admin/adminelection/electeurs" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUserCheck /> Électeurs</Link>
          <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiBarChart2 /> Résultats</Link> */}
        </nav>
        <div className="space-y-3 mt-6">
          <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiSettings /> Paramètres</Link>
          <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600"><FiLogOut /> Déconnexion</Link>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="bg-white/80 rounded-xl shadow p-4 mb-6">
          <h2 className="text-lg font-semibold text-indigo-900">Bienvenue, Administrateur d'Élection 👋</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48 text-indigo-700 font-medium">Chargement...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <StatCard title="Élections créées"  amount={stats?.stats?.nb_elections ?? 0}                             icon={FaVoteYea}   bg="bg-indigo-500" />
              <StatCard title="Candidats"          amount={stats?.stats?.nb_candidats ?? 0}                             icon={FiUsers}     bg="bg-blue-500" />
              <StatCard title="Votes exprimés"     amount={(stats?.stats?.nb_votes ?? 0).toLocaleString("fr-FR")}       icon={FiBarChart2} bg="bg-purple-500" />
              <StatCard title="Participation"      amount={`${stats?.stats?.taux_participation ?? 0}%`}                 icon={FiUserCheck} bg="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white/80 p-6 rounded-xl shadow lg:col-span-2">
                <h3 className="font-semibold mb-4 text-indigo-900">Évolution des votes</h3>
                <Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-400 p-6 rounded-xl shadow text-white">
                  <h4 className="font-semibold mb-2">Candidat en tête</h4>
                  {stats?.candidatEnTete ? (
                    <>
                      <p className="text-lg font-bold">{stats.candidatEnTete.nom}</p>
                      <p className="text-sm opacity-90">{stats.candidatEnTete.parti || "Indépendant"}</p>
                      <p className="mt-1 font-semibold">{stats.candidatEnTete.nb_votes.toLocaleString("fr-FR")} votes</p>
                    </>
                  ) : <p className="text-sm opacity-80">Aucune élection en cours</p>}
                </div>
                <div className="bg-white/80 p-4 rounded-xl shadow">
                  <h4 className="font-semibold mb-3 text-indigo-900">Élection en cours</h4>
                  {stats?.electionEnCours ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{stats.electionEnCours.titre}</p>
                        <p className="text-sm text-green-600 font-medium">En cours</p>
                        <p className="text-xs text-gray-500 mt-1">{stats.electionEnCours.nb_votes} / {stats.electionEnCours.nb_electeurs} votes</p>
                      </div>
                      <Link to={`/admin/adminelection/detail-election/${stats.electionEnCours.id_election}`} className="text-indigo-600 font-semibold hover:underline">Gérer</Link>
                    </div>
                  ) : <p className="text-sm text-gray-500">Aucune élection en cours</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
































// import React from "react";
// import { Link } from "react-router-dom";
// import { Bar } from "react-chartjs-2";

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Tooltip,
//   Legend
// } from "chart.js";

// import {
//   FiHome,
//   FiUsers,
//   FiBarChart2,
//   FiSettings,
//   FiLogOut,
//   FiCalendar,
//   FiUserCheck
// } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";


// ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// /* -------- STAT CARD -------- */
// const StatCard = ({ title, amount, icon: Icon, bg }) => (
//   <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
//     <div>
//       <p className="text-gray-600 text-sm">{title}</p>
//       <p className="text-2xl font-bold text-black">{amount}</p>
//     </div>
//     <div className={`p-3 rounded-full ${bg}`}>
//       <Icon className="text-white text-xl" />
//     </div>
//     </div>
//  );

//  export default function AdminElectionDashboard() {

//    const data = {
//      labels: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"],
//      datasets: [
//        {
//          label: "Votes",
//          data: [120, 260, 340, 480, 610, 820],
//          backgroundColor: "rgba(99,102,241,0.8)",
//          borderRadius: 8
//        }
//      ]
//    };
  

//    return (
//      <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//        {/* ================= SIDEBAR ================= */}
//        <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//          <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>

//          <nav className="flex-1 space-y-3">
//            <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//              <FiHome /> Tableau de bord
//            </Link>

//            <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//              <FiCalendar /> Mes élections
//            </Link>

//            <Link to="/admin/adminelection/candidats"  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//              <FiUsers /> Candidats
//            </Link>
          
//             <Link to="/admin/adminelection/electeurs/${election.id_election}`" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//              <FiUserCheck /> Électeurs 
//            </Link> 

//            <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//              <FiBarChart2 /> Résultats
//            </Link>
//          </nav>

//          <div className="space-y-3 mt-6">
//            <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//              <FiSettings /> Paramètres
//            </Link>

//            <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600">
//              <FiLogOut /> Déconnexion
//            </Link>
//          </div>
//        </aside>

//        {/* ================= MAIN ================= */}
//        <main className="flex-1 p-8">

//          {/* HEADER */}
//          <div className="bg-white/80 rounded-xl shadow p-4 mb-6">
//            <h2 className="text-lg font-semibold text-indigo-900">Bienvenue, Administrateur d’Élection 👋</h2>
//          </div>

//          {/* STATS */}
//          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
//            <StatCard title="Élections créées" amount="5" icon={FaVoteYea} bg="bg-indigo-500" />
//            <StatCard title="Candidats" amount="42" icon={FiUsers} bg="bg-blue-500" />
//            <StatCard title="Votes exprimés" amount="3 120" icon={FiBarChart2} bg="bg-purple-500" />
//            <StatCard title="Participation" amount="68%" icon={FiUserCheck} bg="bg-green-500" />
//          </div>

//          {/* CONTENT */}
//          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//            {/* GRAPH */}
//            <div className="bg-white/80 p-6 rounded-xl shadow lg:col-span-2">
//              <h3 className="font-semibold mb-4 text-indigo-900">Évolution des votes</h3>
//              <Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
//            </div>

//            {/* RIGHT SIDE */}
//            <div className="space-y-6">

//              {/* LEADER */}
//              <div className="bg-gradient-to-br from-indigo-600 to-indigo-400 p-6 rounded-xl shadow text-white">
//                <h4 className="font-semibold mb-2">Candidat en tête</h4>
//                <p className="text-lg font-bold">Jean Dupont</p>
//                <p>1 540 votes</p>
//              </div>

//              {/* ELECTION STATUS */}
//              <div className="bg-white/80 p-4 rounded-xl shadow">
//                <h4 className="font-semibold mb-3 text-indigo-900">Élection en cours</h4>

//                <div className="flex justify-between items-center">
//                  <div>
//                    <p className="font-medium">Élection universitaire 2026</p>
//                    <p className="text-sm text-green-600">En cours</p>
//                  </div>
//                  <Link className="text-indigo-600 font-semibold">Gérer</Link>
//                </div>
//              </div>

//            </div>
//          </div>
//        </main>
//      </div>
//   );
//  } 

