// src/pages/admin/adminelection/resultats.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiCalendar, FiUserCheck, FiChevronDown, FiAward, FiTrendingUp } from "react-icons/fi";
import api from "../../../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Resultats() {
  const [elections, setElections] = useState([]);
  const [selected, setSelected]   = useState(localStorage.getItem("activeElectionId") || "");
  const [resultats, setResultats] = useState(null);
  const [loading, setLoading]     = useState(false);

  useEffect(() => { fetchElections(); }, []);
  useEffect(() => { if (selected) fetchResultats(selected); }, [selected]);

  const fetchElections = async () => {
    try { const r = await api.get("/elections"); setElections(r.data); }
    catch (err) { console.error(err.response?.data || err.message); }
  };

  const fetchResultats = async (id) => {
    try { setLoading(true); setResultats(null); const r = await api.get(`/elections/${id}/resultats`); setResultats(r.data); }
    catch (err) { console.error(err.response?.data || err.message); }
    finally { setLoading(false); }
  };

  const buildChart = () => {
    if (!resultats) return null;
    const isListe = resultats.election.type_scrutin === "LISTE";
    const items   = isListe ? resultats.listes : resultats.candidats;
    return {
      labels: isListe ? items.map(l => l.nom_liste) : items.map(c => c.nom),
      datasets: [{
        label: "Votes",
        data: items.map(i => i.nb_votes),
        backgroundColor: [
          "rgba(99,102,241,0.9)",
          "rgba(16,185,129,0.9)",
          "rgba(245,158,11,0.9)",
          "rgba(239,68,68,0.9)",
          "rgba(59,130,246,0.9)",
          "rgba(168,85,247,0.9)",
        ],
        borderRadius: 10,
        borderSkipped: false,
      }]
    };
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ===== SIDEBAR ORIGINAL ===== */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
        <nav className="flex-1 space-y-3">
          <Link to="/adminElectionDashboard"           className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiHome /> Tableau de bord</Link>
          <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiCalendar /> Mes élections</Link>
          {/* <Link to="/admin/adminelection/candidats"    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUsers /> Candidats</Link>
          <Link to="/admin/adminelection/electeurs"    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUserCheck /> Électeurs</Link>
          <Link to="/admin/adminelection/resultats"    className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 font-semibold"><FiBarChart2 /> Résultats</Link> */}
        </nav>
        <div className="space-y-3 mt-6">
          <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiSettings /> Paramètres</Link>
          <Link to="/logout"   className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600"><FiLogOut /> Déconnexion</Link>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-indigo-900 tracking-tight">Résultats</h2>
          <p className="text-indigo-500 mt-1 text-sm font-medium">Consultez les résultats détaillés de vos élections</p>
        </div>

        {/* Sélecteur élection */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 mb-8">
          <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
            Sélectionner une élection
          </label>
          <div className="relative max-w-md">
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full appearance-none border-2 border-indigo-100 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-indigo-400 bg-indigo-50 text-indigo-900 font-semibold transition-all cursor-pointer"
            >
              <option value="">— Choisir une élection —</option>
              {elections.map(e => (
                <option key={e.id_election} value={e.id_election}>{e.titre}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none text-lg" />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-indigo-500 font-medium">Chargement des résultats...</p>
            </div>
          </div>
        )}

        {/* Placeholder */}
        {!loading && !selected && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <FiBarChart2 className="text-4xl text-indigo-400" />
            </div>
            <p className="text-indigo-900 font-bold text-lg">Aucune élection sélectionnée</p>
            <p className="text-indigo-400 text-sm mt-1">Choisissez une élection dans le menu ci-dessus</p>
          </div>
        )}

        {/* Résultats */}
        {!loading && resultats && (
          <div className="space-y-6">

            {/* Bandeau élection */}
            <div className="bg-indigo-700 rounded-2xl p-5 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Élection</p>
                <h3 className="text-white text-xl font-black">{resultats.election.titre}</h3>
              </div>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">
                {resultats.election.type_scrutin}
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiAward className="text-indigo-600 text-xl" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Votes exprimés</p>
                  <p className="text-3xl font-black text-indigo-700">{resultats.totalVotes.toLocaleString("fr-FR")}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiUsers className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Électeurs inscrits</p>
                  <p className="text-3xl font-black text-blue-600">{resultats.totalElecteurs.toLocaleString("fr-FR")}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiTrendingUp className="text-emerald-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Participation</p>
                    <p className="text-3xl font-black text-emerald-600">{resultats.tauxParticipation}%</p>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(resultats.tauxParticipation, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Graphique */}
            {buildChart() && (
              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-5">Répartition des votes</h4>
                <Bar
                  data={buildChart()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "#4f46e5",
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: { weight: "bold" },
                      }
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { weight: "600" } } },
                      y: { grid: { color: "#f3f4f6" }, ticks: { font: { size: 12 } } }
                    }
                  }}
                />
              </div>
            )}

            {/* Tableau classement */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-indigo-50">
                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Classement</h4>
              </div>

              {resultats.election.type_scrutin === "LISTE" ? (
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-indigo-50">
                      <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider w-16">Rang</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Liste</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Candidats</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider">Votes</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider w-48">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {resultats.listes.map((l, i) => (
                      <tr key={l.id_liste} className={`hover:bg-indigo-50/50 transition-colors ${i === 0 ? "bg-amber-50/50" : ""}`}>
                        <td className="px-6 py-4 text-center text-xl">{medals[i] || <span className="text-gray-400 font-bold text-sm">{i + 1}</span>}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{l.nom_liste}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{l.candidats}</td>
                        <td className="px-6 py-4 text-right font-black text-indigo-700 text-lg">{l.nb_votes}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <div className="flex-1 max-w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${l.pourcentage}%` }} />
                            </div>
                            <span className="text-sm font-bold text-gray-700 w-12 text-right">{l.pourcentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-indigo-50">
                      <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider w-16">Rang</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Candidat</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Parti</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider">Votes</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider w-48">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {resultats.candidats.map((c, i) => (
                      <tr key={c.id_candidat} className={`hover:bg-indigo-50/50 transition-colors ${i === 0 ? "bg-amber-50/50" : ""}`}>
                        <td className="px-6 py-4 text-center text-xl">{medals[i] || <span className="text-gray-400 font-bold text-sm">{i + 1}</span>}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm flex-shrink-0">
                              {c.nom.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-800">{c.nom}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {c.parti
                            ? <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">{c.parti}</span>
                            : <span className="text-gray-400">—</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-right font-black text-indigo-700 text-lg">{c.nb_votes}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <div className="flex-1 max-w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${c.pourcentage}%` }} />
                            </div>
                            <span className="text-sm font-bold text-gray-700 w-12 text-right">{c.pourcentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}




























// // src/pages/admin/adminelection/resultats.jsx
  // import React, { useState, useEffect } from "react";
  // import { Link } from "react-router-dom";
  // import { Bar } from "react-chartjs-2";
  // import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
  // import { FiHome, FiBarChart2, FiSettings, FiLogOut, FiCalendar, FiChevronDown, FiAward, FiUsers, FiTrendingUp } from "react-icons/fi";
  // import api from "../../../services/api";

  // ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

  // export default function Resultats() {
  //   const [elections, setElections] = useState([]);
  //   const [selected, setSelected]   = useState(localStorage.getItem("activeElectionId") || "");
  //   const [resultats, setResultats] = useState(null);
  //   const [loading, setLoading]     = useState(false);

  //   useEffect(() => { fetchElections(); }, []);
  //   useEffect(() => { if (selected) fetchResultats(selected); }, [selected]);

  //   const fetchElections = async () => {
  //     try { const r = await api.get("/elections"); setElections(r.data); }
  //     catch (err) { console.error(err.response?.data || err.message); }
  //   };

  //   const fetchResultats = async (id) => {
  //     try {
  //       setLoading(true); setResultats(null);
  //       const r = await api.get(`/elections/${id}/resultats`);
  //       setResultats(r.data);
  //     } catch (err) { console.error(err.response?.data || err.message); }
  //     finally { setLoading(false); }
  //   };

  //   const buildChart = () => {
  //     if (!resultats) return null;
  //     const isListe = resultats.election.type_scrutin === "LISTE";
  //     const items   = isListe ? resultats.listes : resultats.candidats;
  //     return {
  //       labels: isListe ? items.map(l => l.nom_liste) : items.map(c => c.nom),
  //       datasets: [{
  //         label: "Votes",
  //         data: items.map(i => i.nb_votes),
  //         backgroundColor: [
  //           "rgba(99,102,241,0.9)",
  //           "rgba(16,185,129,0.9)",
  //           "rgba(245,158,11,0.9)",
  //           "rgba(239,68,68,0.9)",
  //           "rgba(59,130,246,0.9)",
  //           "rgba(168,85,247,0.9)",
  //         ],
  //         borderRadius: 10,
  //         borderSkipped: false,
  //       }]
  //     };
  //   };

  //   const medals = ["🥇", "🥈", "🥉"];

  //   return (
  //     <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200">

  //       {/* ===== SIDEBAR ===== */}
  //       <aside className="w-64 bg-white shadow-xl border-r border-indigo-100 p-6 flex flex-col sticky top-0 h-screen">
  //         <div className="mb-10">
  //           <h1 className="text-2xl font-black text-indigo-700 tracking-tight">🗳 eVote</h1>
  //           <p className="text-xs text-indigo-400 mt-1 font-medium">Administration</p>
  //         </div>
  //         <nav className="flex-1 space-y-1">
  //           <Link to="/adminElectionDashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all font-medium text-sm">
  //             <FiHome className="text-base" /> Tableau de bord
  //           </Link>
  //           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all font-medium text-sm">
  //             <FiCalendar className="text-base" /> Mes élections
  //           </Link>
  //           <Link to="/admin/adminelection/resultats" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-md">
  //             <FiBarChart2 className="text-base" /> Résultats
  //           </Link>
  //         </nav>
  //         <div className="space-y-1 pt-4 border-t border-gray-100">
  //           <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 transition-all text-sm">
  //             <FiSettings /> Paramètres
  //           </Link>
  //           <Link to="/logout" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all text-sm">
  //             <FiLogOut /> Déconnexion
  //           </Link>
  //         </div>
  //       </aside>

  //       {/* ===== MAIN ===== */}
  //       <main className="flex-1 p-8 overflow-y-auto">

  //         {/* Header */}
  //         <div className="mb-8">
  //           <h2 className="text-3xl font-black text-indigo-900 tracking-tight">Résultats</h2>
  //           <p className="text-indigo-500 mt-1 text-sm font-medium">Consultez les résultats détaillés de vos élections</p>
  //         </div>

  //         {/* Sélecteur élection */}
  //         <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 mb-8">
  //           <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
  //             Sélectionner une élection
  //           </label>
  //           <div className="relative max-w-md">
  //             <select
  //               value={selected}
  //               onChange={e => setSelected(e.target.value)}
  //               className="w-full appearance-none border-2 border-indigo-100 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-indigo-400 bg-indigo-50 text-indigo-900 font-semibold transition-all cursor-pointer"
  //             >
  //               <option value="">— Choisir une élection —</option>
  //               {elections.map(e => (
  //                 <option key={e.id_election} value={e.id_election}>{e.titre}</option>
  //               ))}
  //             </select>
  //             <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none text-lg" />
  //           </div>
  //         </div>

  //         {/* Loading */}
  //         {loading && (
  //           <div className="flex items-center justify-center py-24">
  //             <div className="flex flex-col items-center gap-4">
  //               <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
  //               <p className="text-indigo-500 font-medium">Chargement des résultats...</p>
  //             </div>
  //           </div>
  //         )}

  //         {/* Placeholder */}
  //         {!loading && !selected && (
  //           <div className="flex flex-col items-center justify-center py-24 text-center">
  //             <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
  //               <FiBarChart2 className="text-4xl text-indigo-400" />
  //             </div>
  //             <p className="text-indigo-900 font-bold text-lg">Aucune élection sélectionnée</p>
  //             <p className="text-indigo-400 text-sm mt-1">Choisissez une élection dans le menu ci-dessus</p>
  //           </div>
  //         )}

  //         {/* Résultats */}
  //         {!loading && resultats && (
  //           <div className="space-y-6">

  //             {/* Titre élection */}
  //             <div className="bg-indigo-700 rounded-2xl p-5 flex items-center justify-between shadow-lg">
  //               <div>
  //                 <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Élection</p>
  //                 <h3 className="text-white text-xl font-black">{resultats.election.titre}</h3>
  //               </div>
  //               <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">
  //                 {resultats.election.type_scrutin}
  //               </span>
  //             </div>

  //             {/* KPI Cards */}
  //             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //               <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 flex items-center gap-4">
  //                 <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
  //                   <FiAward className="text-indigo-600 text-xl" />
  //                 </div>
  //                 <div>
  //                   <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Votes exprimés</p>
  //                   <p className="text-3xl font-black text-indigo-700">{resultats.totalVotes.toLocaleString("fr-FR")}</p>
  //                 </div>
  //               </div>

  //               <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 flex items-center gap-4">
  //                 <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
  //                   <FiUsers className="text-blue-600 text-xl" />
  //                 </div>
  //                 <div>
  //                   <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Électeurs inscrits</p>
  //                   <p className="text-3xl font-black text-blue-600">{resultats.totalElecteurs.toLocaleString("fr-FR")}</p>
  //                 </div>
  //               </div>

  //               <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
  //                 <div className="flex items-center gap-4 mb-3">
  //                   <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
  //                     <FiTrendingUp className="text-emerald-600 text-xl" />
  //                   </div>
  //                   <div>
  //                     <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Participation</p>
  //                     <p className="text-3xl font-black text-emerald-600">{resultats.tauxParticipation}%</p>
  //                   </div>
  //                 </div>
  //                 <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
  //                   <div
  //                     className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2.5 rounded-full transition-all duration-700"
  //                     style={{ width: `${Math.min(resultats.tauxParticipation, 100)}%` }}
  //                   />
  //                 </div>
  //               </div>
  //             </div>

  //             {/* Graphique */}
  //             {buildChart() && (
  //               <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
  //                 <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-5">Répartition des votes</h4>
  //                 <Bar
  //                   data={buildChart()}
  //                   options={{
  //                     responsive: true,
  //                     plugins: {
  //                       legend: { display: false },
  //                       tooltip: {
  //                         backgroundColor: "#4f46e5",
  //                         padding: 12,
  //                         cornerRadius: 8,
  //                         titleFont: { weight: "bold" },
  //                       }
  //                     },
  //                     scales: {
  //                       x: { grid: { display: false }, ticks: { font: { weight: "600" } } },
  //                       y: { grid: { color: "#f3f4f6" }, ticks: { font: { size: 12 } } }
  //                     }
  //                   }}
  //                 />
  //               </div>
  //             )}

  //             {/* Tableau classement */}
  //             <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
  //               <div className="px-6 py-4 border-b border-indigo-50">
  //                 <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Classement</h4>
  //               </div>

  //               {resultats.election.type_scrutin === "LISTE" ? (
  //                 <table className="min-w-full">
  //                   <thead>
  //                     <tr className="bg-indigo-50">
  //                       <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider w-16">Rang</th>
  //                       <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Liste</th>
  //                       <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Candidats</th>
  //                       <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider">Votes</th>
  //                       <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider w-48">Score</th>
  //                     </tr>
  //                   </thead>
  //                   <tbody className="divide-y divide-gray-50">
  //                     {resultats.listes.map((l, i) => (
  //                       <tr key={l.id_liste} className={`hover:bg-indigo-50/50 transition-colors ${i === 0 ? "bg-amber-50/50" : ""}`}>
  //                         <td className="px-6 py-4 text-center text-xl">{medals[i] || <span className="text-gray-400 font-bold text-sm">{i + 1}</span>}</td>
  //                         <td className="px-6 py-4 font-bold text-gray-800">{l.nom_liste}</td>
  //                         <td className="px-6 py-4 text-sm text-gray-500">{l.candidats}</td>
  //                         <td className="px-6 py-4 text-right font-black text-indigo-700 text-lg">{l.nb_votes}</td>
  //                         <td className="px-6 py-4">
  //                           <div className="flex items-center justify-end gap-3">
  //                             <div className="flex-1 max-w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
  //                               <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${l.pourcentage}%` }} />
  //                             </div>
  //                             <span className="text-sm font-bold text-gray-700 w-12 text-right">{l.pourcentage}%</span>
  //                           </div>
  //                         </td>
  //                       </tr>
  //                     ))}
  //                   </tbody>
  //                 </table>
  //               ) : (
  //                 <table className="min-w-full">
  //                   <thead>
  //                     <tr className="bg-indigo-50">
  //                       <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider w-16">Rang</th>
  //                       <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Candidat</th>
  //                       <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Parti</th>
  //                       <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider">Votes</th>
  //                       <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider w-48">Score</th>
  //                     </tr>
  //                   </thead>
  //                   <tbody className="divide-y divide-gray-50">
  //                     {resultats.candidats.map((c, i) => (
  //                       <tr key={c.id_candidat} className={`hover:bg-indigo-50/50 transition-colors ${i === 0 ? "bg-amber-50/50" : ""}`}>
  //                         <td className="px-6 py-4 text-center text-xl">{medals[i] || <span className="text-gray-400 font-bold text-sm">{i + 1}</span>}</td>
  //                         <td className="px-6 py-4">
  //                           <div className="flex items-center gap-3">
  //                             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm flex-shrink-0">
  //                               {c.nom.charAt(0)}
  //                             </div>
  //                             <span className="font-bold text-gray-800">{c.nom}</span>
  //                           </div>
  //                         </td>
  //                         <td className="px-6 py-4">
  //                           {c.parti
  //                             ? <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">{c.parti}</span>
  //                             : <span className="text-gray-400">—</span>
  //                           }
  //                         </td>
  //                         <td className="px-6 py-4 text-right font-black text-indigo-700 text-lg">{c.nb_votes}</td>
  //                         <td className="px-6 py-4">
  //                           <div className="flex items-center justify-end gap-3">
  //                             <div className="flex-1 max-w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
  //                               <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${c.pourcentage}%` }} />
  //                             </div>
  //                             <span className="text-sm font-bold text-gray-700 w-12 text-right">{c.pourcentage}%</span>
  //                           </div>
  //                         </td>
  //                       </tr>
  //                     ))}
  //                   </tbody>
  //                 </table>
  //               )}
  //             </div>

  //           </div>
  //         )}
  //       </main>
  //     </div>
  //   );
  // }



































// // src/pages/admin/adminelection/resultats.jsx
// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { Bar } from "react-chartjs-2";
// import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
// import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiCalendar, FiUserCheck, FiChevronDown } from "react-icons/fi";
// import api from "../../../services/api";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// export default function Resultats() {
//   const [elections, setElections] = useState([]);
//   const [selected, setSelected]   = useState(localStorage.getItem("activeElectionId") || "");
//   const [resultats, setResultats] = useState(null);
//   const [loading, setLoading]     = useState(false);

//   useEffect(() => { fetchElections(); }, []);
//   useEffect(() => { if (selected) fetchResultats(selected); }, [selected]);

//   const fetchElections = async () => {
//     try { const r = await api.get("/elections"); setElections(r.data); }
//     catch (err) { console.error(err.response?.data || err.message); }
//   };

//   const fetchResultats = async (id) => {
//     try { setLoading(true); setResultats(null); const r = await api.get(`/elections/${id}/resultats`); setResultats(r.data); }
//     catch (err) { console.error(err.response?.data || err.message); }
//     finally { setLoading(false); }
//   };

//   const buildChart = () => {
//     if (!resultats) return null;
//     const isListe = resultats.election.type_scrutin === "LISTE";
//     const items   = isListe ? resultats.listes : resultats.candidats;
//     return {
//       labels: isListe ? items.map(l => l.nom_liste) : items.map(c => c.nom),
//       datasets: [{ label: "Votes", data: items.map(i => i.nb_votes),
//         backgroundColor: ["rgba(99,102,241,0.85)","rgba(16,185,129,0.85)","rgba(245,158,11,0.85)","rgba(239,68,68,0.85)","rgba(59,130,246,0.85)"],
//         borderRadius: 8 }]
//     };
//   };

//   const medals = ["🥇","🥈","🥉"];

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard"           className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiHome /> Tableau de bord</Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiCalendar /> Mes élections</Link>
//           {/* <Link to="/admin/adminelection/candidats"    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUsers /> Candidats</Link>
//           <Link to="/admin/adminelection/electeurs"    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUserCheck /> Électeurs</Link>
//           <Link to="/admin/adminelection/resultats"    className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 font-semibold"><FiBarChart2 /> Résultats</Link> */}
//         </nav>
//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiSettings /> Paramètres</Link>
//           <Link to="/logout"   className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600"><FiLogOut /> Déconnexion</Link>
//         </div>
//       </aside>

//       <main className="flex-1 p-8">
//         <h2 className="text-lg font-semibold text-indigo-900 mb-6">Résultats des élections</h2>

//         {/* Sélecteur */}
//         <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center gap-4">
//           <label className="font-medium text-gray-700 whitespace-nowrap">Élection :</label>
//           <div className="relative flex-1 max-w-sm">
//             <select value={selected} onChange={e => setSelected(e.target.value)}
//               className="w-full appearance-none border rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
//               <option value="">— Sélectionner —</option>
//               {elections.map(e => <option key={e.id_election} value={e.id_election}>{e.titre}</option>)}
//             </select>
//             <FiChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
//           </div>
//         </div>

//         {loading && <div className="text-center py-12 text-indigo-700">Chargement...</div>}
//         {!loading && !selected && <div className="text-center py-12 text-gray-500">Sélectionnez une élection.</div>}

//         {!loading && resultats && (
//           <>
//             {/* STATS */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//               <div className="bg-white rounded-xl shadow p-5">
//                 <p className="text-sm text-gray-500">Votes exprimés</p>
//                 <p className="text-3xl font-bold text-indigo-700">{resultats.totalVotes.toLocaleString("fr-FR")}</p>
//               </div>
//               <div className="bg-white rounded-xl shadow p-5">
//                 <p className="text-sm text-gray-500">Électeurs inscrits</p>
//                 <p className="text-3xl font-bold text-blue-600">{resultats.totalElecteurs.toLocaleString("fr-FR")}</p>
//               </div>
//               <div className="bg-white rounded-xl shadow p-5">
//                 <p className="text-sm text-gray-500">Participation</p>
//                 <p className="text-3xl font-bold text-green-600">{resultats.tauxParticipation}%</p>
//                 <div className="mt-2 bg-gray-200 rounded-full h-2">
//                   <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(resultats.tauxParticipation, 100)}%` }} />
//                 </div>
//               </div>
//             </div>

//             {/* GRAPHIQUE */}
//             {buildChart() && (
//               <div className="bg-white rounded-xl shadow p-6 mb-6">
//                 <h3 className="font-semibold text-indigo-900 mb-4">
//                   {resultats.election.titre}
//                   <span className="ml-2 text-sm text-gray-500">({resultats.election.type_scrutin})</span>
//                 </h3>
//                 <Bar data={buildChart()} options={{ responsive: true, plugins: { legend: { display: false } } }} />
//               </div>
//             )}

//             {/* TABLEAU */}
//             <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
//               {resultats.election.type_scrutin === "LISTE" ? (
//                 <table className="min-w-full border border-gray-300">
//                   <thead className="bg-indigo-700">
//                     <tr>
//                       <th className="px-4 py-3 text-white text-left border-r">Rang</th>
//                       <th className="px-4 py-3 text-white text-left border-r">Liste</th>
//                       <th className="px-4 py-3 text-white text-left border-r">Candidats</th>
//                       <th className="px-4 py-3 text-white text-right border-r">Votes</th>
//                       <th className="px-4 py-3 text-white text-right">%</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {resultats.listes.map((l, i) => (
//                       <tr key={l.id_liste} className={i % 2 ? "bg-gray-50" : "bg-white"}>
//                         <td className="px-4 py-2 border-r text-center">{medals[i] || i + 1}</td>
//                         <td className="px-4 py-2 border-r font-medium">{l.nom_liste}</td>
//                         <td className="px-4 py-2 border-r text-sm text-gray-600">{l.candidats}</td>
//                         <td className="px-4 py-2 border-r text-right font-semibold">{l.nb_votes}</td>
//                         <td className="px-4 py-2 text-right">
//                           <div className="flex items-center justify-end gap-2">
//                             <div className="w-20 bg-gray-200 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${l.pourcentage}%` }} /></div>
//                             <span className="text-sm">{l.pourcentage}%</span>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <table className="min-w-full border border-gray-300">
//                   <thead className="bg-indigo-700">
//                     <tr>
//                       <th className="px-4 py-3 text-white text-left border-r">Rang</th>
//                       <th className="px-4 py-3 text-white text-left border-r">Candidat</th>
//                       <th className="px-4 py-3 text-white text-left border-r">Parti</th>
//                       <th className="px-4 py-3 text-white text-right border-r">Votes</th>
//                       <th className="px-4 py-3 text-white text-right">%</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {resultats.candidats.map((c, i) => (
//                       <tr key={c.id_candidat} className={i % 2 ? "bg-gray-50" : "bg-white"}>
//                         <td className="px-4 py-2 border-r text-center text-lg">{medals[i] || <span className="text-sm text-gray-500">{i + 1}</span>}</td>
//                         <td className="px-4 py-2 border-r font-medium">{c.nom}</td>
//                         <td className="px-4 py-2 border-r text-gray-600">{c.parti || "—"}</td>
//                         <td className="px-4 py-2 border-r text-right font-semibold">{c.nb_votes}</td>
//                         <td className="px-4 py-2 text-right">
//                           <div className="flex items-center justify-end gap-2">
//                             <div className="w-20 bg-gray-200 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${c.pourcentage}%` }} /></div>
//                             <span className="text-sm">{c.pourcentage}%</span>
//                           </div>
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


























// import React, { useState, useEffect } from "react";
// import { useParams, Link } from "react-router-dom";
// import {
//   FiHome,
//   FiBarChart2,
//   FiLogOut,
//   FiUserCheck,
//   FiCalendar,
//   FiUsers,
//   FiSettings
// } from "react-icons/fi";

// import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
// import jsPDF from "jspdf";
// import "jspdf-autotable";

// /* ================= MOCK DATA ================= */
// const mockElections = [
//   { id_election: 1, titre: "Élection universitaire 2026" },
//   { id_election: 2, titre: "Conseil étudiant" }
// ];

// const mockCandidats = [
//   { id: 1, nom: "Alice Dupont", votes: 120 },
//   { id: 2, nom: "Jean Martin", votes: 80 },
//   { id: 3, nom: "Marie Ndi", votes: 50 }
// ];

// const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a4de6c"];

// /* ================= COMPONENT ================= */
// export default function Resultats() {
//   const { electionId } = useParams();
//   const [election, setElection] = useState(null);
//   const [candidats, setCandidats] = useState([]);

//   useEffect(() => {
//     const foundElection =
//       mockElections.find(e => e.id_election === Number(electionId)) || mockElections[0];
//     setElection(foundElection);

//     // Ici on pourrait appeler le backend pour récupérer les résultats réels
//     setCandidats(mockCandidats);
//   }, [electionId]);

//   const totalVotes = candidats.reduce((sum, c) => sum + c.votes, 0);

//   /* ================= EXPORT PDF ================= */
//   const exportPDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(18);
//     doc.text(`Résultats – ${election?.titre}`, 14, 22);

//     const tableColumn = ["Candidat", "Votes", "Pourcentage"];
//     const tableRows = candidats.map(c => [
//       c.nom,
//       c.votes,
//       totalVotes ? ((c.votes / totalVotes) * 100).toFixed(1) + "%" : "0%"
//     ]);

//     doc.autoTable({
//       head: [tableColumn],
//       body: tableRows,
//       startY: 30,
//     });

//     doc.save(`resultats_${election?.id_election}.pdf`);
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ================= SIDEBAR ================= */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>

//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiHome /> Tableau de bord
//           </Link>

//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiCalendar /> Mes élections
//           </Link>

//           <Link to="/admin/adminelection/candidats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiUsers /> Candidats
//           </Link>

//           <Link to="/admin/adminelection/electeurs/${election.id_election}" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//                       <FiUserCheck /> Électeurs
//                     </Link>

//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 text-indigo-700 font-semibold">
//             <FiBarChart2 /> Résultats
//           </Link>
//         </nav>

//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings /> Paramètres
//           </Link>

//           <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main className="flex-1 p-8">

//         {election && (
//           <>
//             <h2 className="text-2xl font-bold text-indigo-900 mb-6">
//               Résultats – {election.titre}
//             </h2>

//             {/* ================= TABLEAU ================= */}
//             <div className="bg-white rounded-2xl shadow p-6 mb-8">
//               <table className="min-w-full border">
//                 <thead className="bg-indigo-700 text-white">
//                   <tr>
//                     <th className="px-4 py-2 text-left">Candidat</th>
//                     <th className="px-4 py-2 text-left">Votes</th>
//                     <th className="px-4 py-2 text-left">Pourcentage</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {candidats.map(c => (
//                     <tr key={c.id} className="bg-white border-b hover:bg-gray-100">
//                       <td className="px-4 py-2">{c.nom}</td>
//                       <td className="px-4 py-2">{c.votes}</td>
//                       <td className="px-4 py-2">{totalVotes ? ((c.votes / totalVotes) * 100).toFixed(1) : 0}%</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//               <div className="mt-4 text-right text-gray-700 font-semibold">
//                 Total de votes : {totalVotes}
//               </div>
//               <button
//                 onClick={exportPDF}
//                 className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
//               >
//                 Exporter PDF
//               </button>
//             </div>

//             {/* ================= GRAPHIQUES ================= */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//               {/* Bar Chart */}
//               <div className="bg-white p-6 rounded-2xl shadow">
//                 <h3 className="text-lg font-semibold mb-4">Graphique à barres</h3>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={candidats}>
//                     <XAxis dataKey="nom" />
//                     <YAxis />
//                     <Tooltip />
//                     <Bar dataKey="votes" fill="#4f46e5" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>

//               {/* Pie Chart */}
//               <div className="bg-white p-6 rounded-2xl shadow">
//                 <h3 className="text-lg font-semibold mb-4">Camembert</h3>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <PieChart>
//                     <Pie
//                       data={candidats}
//                       dataKey="votes"
//                       nameKey="nom"
//                       cx="50%"
//                       cy="50%"
//                       outerRadius={100}
//                       label={(entry) => `${entry.nom}: ${((entry.votes/totalVotes)*100).toFixed(1)}%`}
//                     >
//                       {candidats.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                       ))}
//                     </Pie>
//                     <Legend />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>

//             </div>
//           </>
//         )}
//       </main>
//     </div>
//   );
// }
