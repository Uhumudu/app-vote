// src/pages/admin/adminelection/adminElectionDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { FiUsers, FiBarChart2, FiUserCheck } from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";
import api from "../../../services/api";
import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

// ── Calcule la ligne de tendance (régression linéaire) ───────────────────────
const buildTrendLine = (data) => {
  const n = data.length;
  if (n === 0) return [];
  const mx = data.reduce((a, b) => a + b, 0) / n;
  const xi = Array.from({ length: n }, (_, i) => i);
  const mxi = xi.reduce((a, b) => a + b, 0) / n;
  const num = xi.reduce((s, x, i) => s + (x - mxi) * (data[i] - mx), 0);
  const den = xi.reduce((s, x) => s + (x - mxi) ** 2, 0);
  const slope = den !== 0 ? num / den : 0;
  const intercept = mx - slope * mxi;
  return xi.map((x) => Math.round(Math.max(0, intercept + slope * x)));
};

// ── Génère les 24 dernières heures (labels heure par heure) ──────────────────
const getLast24Hours = () => {
  const now = new Date();
  const result = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(now.getHours() - i, 0, 0, 0);
    result.push({
      label: `${String(d.getHours()).padStart(2, "0")}h`,
      hour:  d.getHours(),
      day:   d.getDate(),
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
      value: 0,
    });
  }
  return result;
};

// ── Génère les 7 derniers jours (labels jour) ────────────────────────────────
const getLast7Days = () => {
  const jours = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const now = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    result.push({
      label: jours[d.getDay()],
      day:   d.getDate(),
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
      value: 0,
    });
  }
  return result;
};

// ── Génère les N derniers mois ────────────────────────────────────────────────
const getLastNMonths = (n = 12) => {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const now = new Date();
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      label: months[d.getMonth()],
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
      value: 0,
    });
  }
  return result;
};

// ── Fusion données API selon la période ──────────────────────────────────────
const mergeData = (apiData = [], period) => {
  if (period === "day") {
    const skeleton = getLast24Hours();
    apiData.forEach(({ heure, jour, mois, annee, nb_votes }) => {
      const slot = skeleton.find(
        (s) =>
          s.hour  === Number(heure) &&
          s.day   === Number(jour)  &&
          s.month === Number(mois)  &&
          s.year  === Number(annee)
      );
      if (slot) slot.value = Number(nb_votes);
    });
    return skeleton;
  }

  if (period === "week") {
    const skeleton = getLast7Days();
    apiData.forEach(({ jour, mois, annee, nb_votes }) => {
      const slot = skeleton.find(
        (s) =>
          s.day   === Number(jour) &&
          s.month === Number(mois) &&
          s.year  === Number(annee)
      );
      if (slot) slot.value = Number(nb_votes);
    });
    return skeleton;
  }

  // 6 ou 12 mois
  const n = period === "6months" ? 6 : 12;
  const skeleton = getLastNMonths(n);
  apiData.forEach(({ num_mois, annee, nb_votes }) => {
    const slot = skeleton.find(
      (s) => s.month === Number(num_mois) && s.year === Number(annee)
    );
    if (slot) slot.value = Number(nb_votes);
  });
  return skeleton;
};

// ── Carte statistique ─────────────────────────────────────────────────────────
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

// ── Composant principal ───────────────────────────────────────────────────────
export default function AdminElectionDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  // "day" | "week" | "6months" | "12months"
  const [period,  setPeriod]  = useState("12months");

  const prenom = localStorage.getItem("prenom") || "";
  const nom    = localStorage.getItem("nom")    || "";
  const displayName = [prenom, nom].filter(Boolean).join(" ") || "Administrateur";

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

  // Sélectionne la bonne source de données selon la période
  const rawData =
    period === "day"      ? stats?.evolutionJour   :
    period === "week"     ? stats?.evolutionSemaine :
    period === "6months"  ? stats?.evolutionVotes   :
                            stats?.evolutionVotes;

  const merged      = mergeData(rawData ?? [], period);
  const chartLabels = merged.map((m) => m.label);
  const chartData   = merged.map((m) => m.value);
  const trendData   = buildTrendLine(chartData);
  const maxVote     = Math.max(...chartData, 5);
  const maxIndex    = chartData.indexOf(Math.max(...chartData));

  const PERIODS = [
    { key: "day",      label: "Jour"    },
    { key: "week",     label: "Semaine" },
    { key: "6months",  label: "6 mois"  },
    { key: "12months", label: "12 mois" },
  ];

  const periodLabel =
    period === "day"      ? "24 dernières heures"  :
    period === "week"     ? "7 derniers jours"      :
    period === "6months"  ? "6 derniers mois"       :
                            "12 derniers mois";

  const data = {
    labels: chartLabels,
    datasets: [
      {
        type: "bar",
        label: "Votes",
        data: chartData,
        backgroundColor: chartData.map((_, i) =>
          i === maxIndex ? "rgba(99,102,241,1)" : "rgba(99,102,241,0.75)"
        ),
        hoverBackgroundColor: "rgba(99,102,241,1)",
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.85,
        categoryPercentage: 0.9,
        order: 2,
      },
      {
        type: "line",
        label: "Tendance",
        data: trendData,
        borderColor: "rgba(249,115,22,0.85)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "rgba(249,115,22,1)",
        tension: 0.45,
        fill: false,
        order: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ctx.dataset.label === "Votes"
              ? ` ${ctx.parsed.y} vote${ctx.parsed.y > 1 ? "s" : ""}`
              : ` Tendance : ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#6b7280",
          font: { size: 12 },
          autoSkip: period === "day",   // auto-skip seulement pour les heures
          maxRotation: period === "day" ? 45 : 0,
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: maxVote + Math.ceil(maxVote * 0.15),
        ticks: {
          stepSize: 1,
          color: "#6b7280",
          font: { size: 12 },
          callback: (v) => (Number.isInteger(v) ? v : null),
        },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <AdminElectionSidebar active="dashboard" />

      <main className="flex-1 p-8">
        <div className="bg-white/80 rounded-xl shadow p-4 mb-6">
          <h2 className="text-lg font-semibold text-indigo-900">
            Bienvenue, {displayName} 👋
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48 text-indigo-700 font-medium">
            Chargement…
          </div>
        ) : (
          <>
            {/* Cartes stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <StatCard title="Élections créées" amount={stats?.stats?.nb_elections ?? 0}                             icon={FaVoteYea}   bg="bg-indigo-500" />
              <StatCard title="Candidats"         amount={stats?.stats?.nb_candidats ?? 0}                             icon={FiUsers}     bg="bg-blue-500"   />
              <StatCard title="Votes exprimés"    amount={(stats?.stats?.nb_votes ?? 0).toLocaleString("fr-FR")}       icon={FiBarChart2} bg="bg-purple-500" />
              <StatCard title="Participation"     amount={`${stats?.stats?.taux_participation ?? 0}%`}                 icon={FiUserCheck} bg="bg-green-500"  />
            </div>

            {/* Graphique + widgets droite */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white/80 p-6 rounded-xl shadow lg:col-span-2">

                {/* En-tête avec toggle période */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-indigo-900">
                      Évolution des votes
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Légende tendance */}
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="inline-block w-5 h-0.5 bg-orange-400 rounded" />
                      Tendance
                    </span>
                    {/* Toggle période */}
                    <div className="flex rounded-lg border border-indigo-200 overflow-hidden text-xs">
                      {PERIODS.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setPeriod(key)}
                          className={`px-3 py-1 font-medium transition-colors ${
                            period === key
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-indigo-600 hover:bg-indigo-50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Chart type="bar" data={data} options={chartOptions} />
              </div>

              <div className="space-y-6">
                {/* Candidat en tête */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-400 p-6 rounded-xl shadow text-white">
                  <h4 className="font-semibold mb-2">Candidat en tête</h4>
                  {stats?.candidatEnTete ? (
                    <>
                      <p className="text-lg font-bold">{stats.candidatEnTete.nom}</p>
                      <p className="text-sm opacity-90">{stats.candidatEnTete.parti || "Indépendant"}</p>
                      <p className="mt-1 font-semibold">
                        {Number(stats.candidatEnTete.nb_votes).toLocaleString("fr-FR")} votes
                      </p>
                    </>
                  ) : (
                    <p className="text-sm opacity-80">Aucune élection en cours</p>
                  )}
                </div>

                {/* Élection en cours */}
                <div className="bg-white/80 p-4 rounded-xl shadow">
                  <h4 className="font-semibold mb-3 text-indigo-900">Élection en cours</h4>
                  {stats?.electionEnCours ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{stats.electionEnCours.titre}</p>
                        <p className="text-sm text-green-600 font-medium">En cours</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {stats.electionEnCours.nb_votes} / {stats.electionEnCours.nb_electeurs} votes
                        </p>
                      </div>
                      <Link
                        to={`/admin/adminelection/detail-election/${stats.electionEnCours.id_election}`}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        Gérer
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune élection en cours</p>
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

























// // src/pages/admin/adminelection/adminElectionDashboard.jsx
// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { Chart } from "react-chartjs-2";
// import { FiUsers, FiBarChart2, FiUserCheck } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";
// import api from "../../../services/api";
// import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   Tooltip,
//   Legend
// );

// // ── Génère les N derniers mois (labels + valeurs à 0 par défaut) ──────────────
// const getLastNMonths = (n = 12) => {
//   const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
//   const now = new Date();
//   const result = [];
//   for (let i = n - 1; i >= 0; i--) {
//     const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
//     result.push({
//       label: months[d.getMonth()],
//       month: d.getMonth() + 1,
//       year:  d.getFullYear(),
//       value: 0,
//     });
//   }
//   return result;
// };

// // ── Fusionne les données API avec le squelette des N mois ────────────────────
// const mergeEvolution = (apiData = [], n = 12) => {
//   const skeleton = getLastNMonths(n);
//   apiData.forEach(({ num_mois, annee, nb_votes }) => {
//     const slot = skeleton.find(
//       (s) => s.month === Number(num_mois) && s.year === Number(annee)
//     );
//     if (slot) slot.value = Number(nb_votes);
//   });
//   return skeleton;
// };

// // ── Calcule la ligne de tendance (régression linéaire) ───────────────────────
// const buildTrendLine = (data) => {
//   const n = data.length;
//   if (n === 0) return [];
//   const mx = data.reduce((a, b) => a + b, 0) / n;
//   const xi = Array.from({ length: n }, (_, i) => i);
//   const mxi = xi.reduce((a, b) => a + b, 0) / n;
//   const num = xi.reduce((s, x, i) => s + (x - mxi) * (data[i] - mx), 0);
//   const den = xi.reduce((s, x) => s + (x - mxi) ** 2, 0);
//   const slope = den !== 0 ? num / den : 0;
//   const intercept = mx - slope * mxi;
//   return xi.map((x) => Math.round(Math.max(0, intercept + slope * x)));
// };

// // ── Carte statistique ─────────────────────────────────────────────────────────
// const StatCard = ({ title, amount, icon: Icon, bg }) => (
//   <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
//     <div>
//       <p className="text-gray-600 text-sm">{title}</p>
//       <p className="text-2xl font-bold text-black">{amount}</p>
//     </div>
//     <div className={`p-3 rounded-full ${bg}`}>
//       <Icon className="text-white text-xl" />
//     </div>
//   </div>
// );

// // ── Composant principal ───────────────────────────────────────────────────────
// export default function AdminElectionDashboard() {
//   const [stats,   setStats]   = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [period,  setPeriod]  = useState(12);

//   const prenom = localStorage.getItem("prenom") || "";
//   const nom    = localStorage.getItem("nom")    || "";
//   const displayName = [prenom, nom].filter(Boolean).join(" ") || "Administrateur";

//   useEffect(() => { fetchStats(); }, []);

//   const fetchStats = async () => {
//     try {
//       const res = await api.get("/dashboard/stats");
//       setStats(res.data);
//     } catch (err) {
//       console.error("Erreur dashboard:", err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const merged      = mergeEvolution(stats?.evolutionVotes, period);
//   const chartLabels = merged.map((m) => m.label);
//   const chartData   = merged.map((m) => m.value);
//   const trendData   = buildTrendLine(chartData);
//   const maxVote     = Math.max(...chartData, 5);
//   const maxIndex    = chartData.indexOf(Math.max(...chartData));

//   const data = {
//     labels: chartLabels,
//     datasets: [
//       {
//         type: "bar",
//         label: "Votes",
//         data: chartData,
//         backgroundColor: chartData.map((_, i) =>
//           i === maxIndex ? "rgba(99,102,241,1)" : "rgba(99,102,241,0.75)"
//         ),
//         hoverBackgroundColor: "rgba(99,102,241,1)",
//         borderRadius: 8,
//         borderSkipped: false,
//         barPercentage: 0.85,
//         categoryPercentage: 0.9,
//         order: 2,
//       },
//       {
//         type: "line",
//         label: "Tendance",
//         data: trendData,
//         borderColor: "rgba(249,115,22,0.85)",
//         borderWidth: 2,
//         pointRadius: 0,
//         pointHoverRadius: 4,
//         pointHoverBackgroundColor: "rgba(249,115,22,1)",
//         tension: 0.45,
//         fill: false,
//         order: 1,
//       },
//     ],
//   };

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: true,
//     interaction: { mode: "index", intersect: false },
//     plugins: {
//       legend: { display: false },
//       tooltip: {
//         callbacks: {
//           label: (ctx) =>
//             ctx.dataset.label === "Votes"
//               ? ` ${ctx.parsed.y} vote${ctx.parsed.y > 1 ? "s" : ""}`
//               : ` Tendance : ${ctx.parsed.y}`,
//         },
//       },
//     },
//     scales: {
//       x: {
//         grid: { display: false },
//         ticks: {
//           color: "#6b7280",
//           font: { size: 12 },
//           autoSkip: false,
//           maxRotation: period === 12 ? 45 : 0,
//         },
//       },
//       y: {
//         beginAtZero: true,
//         suggestedMax: maxVote + Math.ceil(maxVote * 0.15),
//         ticks: {
//           stepSize: 1,
//           color: "#6b7280",
//           font: { size: 12 },
//           callback: (v) => (Number.isInteger(v) ? v : null),
//         },
//         grid: { color: "rgba(0,0,0,0.05)" },
//       },
//     },
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <AdminElectionSidebar active="dashboard" />

//       <main className="flex-1 p-8">
//         <div className="bg-white/80 rounded-xl shadow p-4 mb-6">
//           <h2 className="text-lg font-semibold text-indigo-900">
//             Bienvenue, {displayName} 👋
//           </h2>
//         </div>

//         {loading ? (
//           <div className="flex justify-center items-center h-48 text-indigo-700 font-medium">
//             Chargement…
//           </div>
//         ) : (
//           <>
//             {/* Cartes stats */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
//               <StatCard title="Élections créées" amount={stats?.stats?.nb_elections ?? 0}                             icon={FaVoteYea}   bg="bg-indigo-500" />
//               <StatCard title="Candidats"         amount={stats?.stats?.nb_candidats ?? 0}                             icon={FiUsers}     bg="bg-blue-500"   />
//               <StatCard title="Votes exprimés"    amount={(stats?.stats?.nb_votes ?? 0).toLocaleString("fr-FR")}       icon={FiBarChart2} bg="bg-purple-500" />
//               <StatCard title="Participation"     amount={`${stats?.stats?.taux_participation ?? 0}%`}                 icon={FiUserCheck} bg="bg-green-500"  />
//             </div>

//             {/* Graphique + widgets droite */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//               <div className="bg-white/80 p-6 rounded-xl shadow lg:col-span-2">

//                 {/* En-tête avec toggle période */}
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-semibold text-indigo-900">
//                     Évolution des votes
//                   </h3>
//                   <div className="flex items-center gap-3">
//                     {/* Légende tendance */}
//                     <span className="flex items-center gap-1.5 text-xs text-gray-500">
//                       <span className="inline-block w-5 h-0.5 bg-orange-400 rounded" />
//                       Tendance
//                     </span>
//                     {/* Toggle période */}
//                     <div className="flex rounded-lg border border-indigo-200 overflow-hidden text-xs">
//                       <button
//                         onClick={() => setPeriod(6)}
//                         className={`px-3 py-1 font-medium transition-colors ${
//                           period === 6
//                             ? "bg-indigo-600 text-white"
//                             : "bg-white text-indigo-600 hover:bg-indigo-50"
//                         }`}
//                       >
//                         6 mois
//                       </button>
//                       <button
//                         onClick={() => setPeriod(12)}
//                         className={`px-3 py-1 font-medium transition-colors ${
//                           period === 12
//                             ? "bg-indigo-600 text-white"
//                             : "bg-white text-indigo-600 hover:bg-indigo-50"
//                         }`}
//                       >
//                         12 mois
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 <Chart type="bar" data={data} options={chartOptions} />
//               </div>

//               <div className="space-y-6">
//                 {/* Candidat en tête */}
//                 <div className="bg-gradient-to-br from-indigo-600 to-indigo-400 p-6 rounded-xl shadow text-white">
//                   <h4 className="font-semibold mb-2">Candidat en tête</h4>
//                   {stats?.candidatEnTete ? (
//                     <>
//                       <p className="text-lg font-bold">{stats.candidatEnTete.nom}</p>
//                       <p className="text-sm opacity-90">{stats.candidatEnTete.parti || "Indépendant"}</p>
//                       <p className="mt-1 font-semibold">
//                         {Number(stats.candidatEnTete.nb_votes).toLocaleString("fr-FR")} votes
//                       </p>
//                     </>
//                   ) : (
//                     <p className="text-sm opacity-80">Aucune élection en cours</p>
//                   )}
//                 </div>

//                 {/* Élection en cours */}
//                 <div className="bg-white/80 p-4 rounded-xl shadow">
//                   <h4 className="font-semibold mb-3 text-indigo-900">Élection en cours</h4>
//                   {stats?.electionEnCours ? (
//                     <div className="flex justify-between items-center">
//                       <div>
//                         <p className="font-medium text-gray-800">{stats.electionEnCours.titre}</p>
//                         <p className="text-sm text-green-600 font-medium">En cours</p>
//                         <p className="text-xs text-gray-500 mt-1">
//                           {stats.electionEnCours.nb_votes} / {stats.electionEnCours.nb_electeurs} votes
//                         </p>
//                       </div>
//                       <Link
//                         to={`/admin/adminelection/detail-election/${stats.electionEnCours.id_election}`}
//                         className="text-indigo-600 font-semibold hover:underline"
//                       >
//                         Gérer
//                       </Link>
//                     </div>
//                   ) : (
//                     <p className="text-sm text-gray-500">Aucune élection en cours</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </main>
//     </div>
//   );
// }






































// // src/pages/admin/adminelection/adminElectionDashboard.jsx
// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { FiUsers, FiBarChart2, FiUserCheck } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";
// import api from "../../../services/api";
// import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// // ── Génère les 6 derniers mois (labels + valeurs à 0 par défaut) ──────────────
// const getLast6Months = () => {
//   const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
//   const now = new Date();
//   const result = [];
//   for (let i = 5; i >= 0; i--) {
//     const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
//     result.push({
//       label: months[d.getMonth()],
//       month: d.getMonth() + 1,
//       year:  d.getFullYear(),
//       value: 0,
//     });
//   }
//   return result;
// };

// // ── Fusionne les données API avec le squelette des 6 mois ────────────────────
// const mergeEvolution = (apiData = []) => {
//   const skeleton = getLast6Months();
//   apiData.forEach(({ num_mois, nb_votes }) => {
//     const slot = skeleton.find(s => s.month === Number(num_mois));
//     if (slot) slot.value = Number(nb_votes);
//   });
//   return skeleton;
// };

// // ── Carte statistique ─────────────────────────────────────────────────────────
// const StatCard = ({ title, amount, icon: Icon, bg }) => (
//   <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
//     <div>
//       <p className="text-gray-600 text-sm">{title}</p>
//       <p className="text-2xl font-bold text-black">{amount}</p>
//     </div>
//     <div className={`p-3 rounded-full ${bg}`}>
//       <Icon className="text-white text-xl" />
//     </div>
//   </div>
// );

// // ── Composant principal ───────────────────────────────────────────────────────
// export default function AdminElectionDashboard() {
//   const [stats,   setStats]   = useState(null);
//   const [loading, setLoading] = useState(true);

//   const prenom = localStorage.getItem("prenom") || "";
//   const nom    = localStorage.getItem("nom")    || "";
//   const displayName = [prenom, nom].filter(Boolean).join(" ") || "Administrateur";

//   useEffect(() => { fetchStats(); }, []);

//   const fetchStats = async () => {
//     try {
//       const res = await api.get("/dashboard/stats");
//       setStats(res.data);
//     } catch (err) {
//       console.error("Erreur dashboard:", err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const merged      = mergeEvolution(stats?.evolutionVotes);
//   const chartLabels = merged.map(m => m.label);
//   const chartData   = merged.map(m => m.value);

//   const data = {
//     labels: chartLabels,
//     datasets: [
//       {
//         label: "Votes",
//         data: chartData,
//         backgroundColor: "rgba(99,102,241,0.75)",
//         hoverBackgroundColor: "rgba(99,102,241,1)",
//         borderRadius: 8,
//         borderSkipped: false,
//         // ✅ Barres plus épaisses
//         barPercentage: 0.85,
//         categoryPercentage: 0.9,
//       },
//     ],
//   };

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: true,
//     plugins: {
//       legend: { display: false },
//       tooltip: {
//         callbacks: {
//           label: ctx => ` ${ctx.parsed.y} vote${ctx.parsed.y > 1 ? "s" : ""}`,
//         },
//       },
//     },
//     scales: {
//       x: {
//         grid: { display: false },
//         ticks: { color: "#6b7280", font: { size: 12 } },
//       },
//       y: {
//         beginAtZero: true,
//         suggestedMax: Math.max(...chartData, 5),
//         ticks: {
//           stepSize: 1,
//           color: "#6b7280",
//           font: { size: 12 },
//           callback: v => (Number.isInteger(v) ? v : null),
//         },
//         grid: { color: "rgba(0,0,0,0.05)" },
//       },
//     },
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <AdminElectionSidebar active="dashboard" />

//       <main className="flex-1 p-8">
//         <div className="bg-white/80 rounded-xl shadow p-4 mb-6">
//           <h2 className="text-lg font-semibold text-indigo-900">
//             Bienvenue, {displayName} 👋
//           </h2>
//         </div>

//         {loading ? (
//           <div className="flex justify-center items-center h-48 text-indigo-700 font-medium">
//             Chargement…
//           </div>
//         ) : (
//           <>
//             {/* Cartes stats */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
//               <StatCard title="Élections créées" amount={stats?.stats?.nb_elections ?? 0}                             icon={FaVoteYea}   bg="bg-indigo-500" />
//               <StatCard title="Candidats"         amount={stats?.stats?.nb_candidats ?? 0}                             icon={FiUsers}     bg="bg-blue-500"   />
//               <StatCard title="Votes exprimés"    amount={(stats?.stats?.nb_votes ?? 0).toLocaleString("fr-FR")}       icon={FiBarChart2} bg="bg-purple-500" />
//               <StatCard title="Participation"     amount={`${stats?.stats?.taux_participation ?? 0}%`}                 icon={FiUserCheck} bg="bg-green-500"  />
//             </div>

//             {/* Graphique + widgets droite */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//               <div className="bg-white/80 p-6 rounded-xl shadow lg:col-span-2">
//                 <h3 className="font-semibold mb-4 text-indigo-900">Évolution des votes (6 derniers mois)</h3>
//                 <Bar data={data} options={chartOptions} />
//               </div>

//               <div className="space-y-6">
//                 {/* Candidat en tête */}
//                 <div className="bg-gradient-to-br from-indigo-600 to-indigo-400 p-6 rounded-xl shadow text-white">
//                   <h4 className="font-semibold mb-2">Candidat en tête</h4>
//                   {stats?.candidatEnTete ? (
//                     <>
//                       <p className="text-lg font-bold">{stats.candidatEnTete.nom}</p>
//                       <p className="text-sm opacity-90">{stats.candidatEnTete.parti || "Indépendant"}</p>
//                       <p className="mt-1 font-semibold">
//                         {stats.candidatEnTete.nb_votes.toLocaleString("fr-FR")} votes
//                       </p>
//                     </>
//                   ) : (
//                     <p className="text-sm opacity-80">Aucune élection en cours</p>
//                   )}
//                 </div>

//                 {/* Élection en cours */}
//                 <div className="bg-white/80 p-4 rounded-xl shadow">
//                   <h4 className="font-semibold mb-3 text-indigo-900">Élection en cours</h4>
//                   {stats?.electionEnCours ? (
//                     <div className="flex justify-between items-center">
//                       <div>
//                         <p className="font-medium text-gray-800">{stats.electionEnCours.titre}</p>
//                         <p className="text-sm text-green-600 font-medium">En cours</p>
//                         <p className="text-xs text-gray-500 mt-1">
//                           {stats.electionEnCours.nb_votes} / {stats.electionEnCours.nb_electeurs} votes
//                         </p>
//                       </div>
//                       <Link
//                         to={`/admin/adminelection/detail-election/${stats.electionEnCours.id_election}`}
//                         className="text-indigo-600 font-semibold hover:underline"
//                       >
//                         Gérer
//                       </Link>
//                     </div>
//                   ) : (
//                     <p className="text-sm text-gray-500">Aucune élection en cours</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </main>
//     </div>
//   );
// }
