// src/pages/admin/superadmin/superAdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp, FiUsers
} from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend
} from "chart.js";
import api from "../../../services/api";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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

  const chartData = {
    labels: stats?.evolutionVotes?.map(e => e.mois) || [],
    datasets: [{
      label: "Votes",
      data:   stats?.evolutionVotes?.map(e => e.nb_votes) || [],
      backgroundColor: "rgba(37,99,235,0.85)",
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const kpis = [
    { label: "Utilisateurs",          value: stats?.totalUtilisateurs?.toLocaleString("fr-FR") ?? "—", icon: <FiUsers />,       color: "#2563eb", bg: "#dbeafe", border: "#bfdbfe" },
    { label: "Élections",             value: stats?.totalElections    ?? "—",                          icon: <FaVoteYea />,     color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
    { label: "En attente",            value: stats?.enAttente         ?? "—",                          icon: <FiAlertCircle />, color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
    { label: "Participation globale", value: `${stats?.tauxParticipation ?? 0}%`,                      icon: <FiTrendingUp />,  color: "#059669", bg: "#d1fae5", border: "#6ee7b7" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      <SuperAdminSidebar active="dashboard" />

      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-black text-blue-900 tracking-tight">Tableau de bord</h2>
          <p className="text-sm text-blue-400 mt-1">Bienvenue, Super Administrateur 👑</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-blue-400 text-sm font-medium">Chargement…</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {kpis.map((kpi, i) => (
                <div key={i}
                  className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  style={{ borderColor: kpi.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{kpi.label}</p>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                      {kpi.icon}
                    </div>
                  </div>
                  <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Graphiques + alertes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Graphique */}
              <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 lg:col-span-2">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-5">
                  Évolution globale des votes
                </h3>
                <Bar data={chartData} options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: "#1d4ed8", padding: 10, cornerRadius: 8 }
                  },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 12 } } },
                    y: { grid: { color: "#f3f4f6" }, ticks: { font: { size: 12 } } }
                  }
                }} />
              </div>

              {/* Colonne droite */}
              <div className="space-y-4">

                {/* Alertes */}
                <div className="rounded-2xl p-5 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                  <p className="text-white text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FiAlertCircle size={13} /> Alertes système
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white/20 rounded-xl px-3 py-2 text-white text-sm">
                      <span className="font-bold">{stats?.enAttente ?? 0}</span> élection(s) en attente
                    </div>
                    <div className="bg-white/20 rounded-xl px-3 py-2 text-white text-sm">
                      <span className="font-bold">{stats?.enCours ?? 0}</span> élection(s) en cours
                    </div>
                  </div>
                </div>

                {/* Élections à valider */}
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">À valider</h4>
                    <Link to="/admin/superadmin/electionsValider"
                      className="text-xs text-blue-600 font-semibold hover:underline">
                      Voir tout →
                    </Link>
                  </div>
                  {!stats?.electionsEnAttente?.length ? (
                    <div className="flex flex-col items-center py-4 text-center">
                      <FiCheckCircle className="text-emerald-400 text-2xl mb-2" />
                      <p className="text-gray-400 text-sm">Aucune élection en attente</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {stats.electionsEnAttente.slice(0, 3).map(e => (
                        <li key={e.id_election} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{e.titre}</p>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
                              style={{ background: "#fef3c7", color: "#92400e" }}>
                              <FiClock size={10} /> En attente
                            </span>
                          </div>
                          <Link to="/admin/superadmin/electionsValider"
                            className="flex-shrink-0 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium">
                            Voir
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Raccourcis */}
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Raccourcis</h4>
                  <div className="space-y-2">
                    <Link to="/admin/superadmin/elections"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all">
                      <FaVoteYea size={14} className="text-blue-500" /> Toutes les élections
                    </Link>
                    <Link to="/admin/superadmin/utilisateursPage"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all">
                      <FiUsers size={14} className="text-blue-500" /> Gérer les utilisateurs
                    </Link>
                    <Link to="/admin/superadmin/elections/creer"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all">
                      + Créer une élection
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
