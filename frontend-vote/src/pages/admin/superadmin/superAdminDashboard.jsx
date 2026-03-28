// src/pages/admin/superadmin/superAdminDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp,
  FiTrendingDown, FiUsers, FiBarChart2, FiActivity,
} from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Tooltip, Legend, Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import api from "../../../services/api";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Tooltip, Legend, Filler
);

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const getLast6Months = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: MONTH_LABELS[d.getMonth()], month: d.getMonth() + 1, year: d.getFullYear(), value: 0 };
  });
};

const mergeEvolution = (apiData = []) => {
  const skeleton = getLast6Months();
  apiData.forEach((item) => {
    const slot = skeleton.find(s => s.month === Number(item.num_mois ?? item.mois));
    if (slot) slot.value = Number(item.nb_votes);
  });
  return skeleton;
};

/* ─────────────────────────────────────────────
   KpiCard
───────────────────────────────────────────── */
function KpiCard({ label, value, icon, color, bg, border }) {
  return (
    <div
      className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      style={{ borderColor: border }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ backgroundColor: bg, color }}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VoteEvolutionChart
───────────────────────────────────────────── */
function VoteEvolutionChart({ evolutionData = [] }) {
  const chartRef = useRef(null);
  const [mode, setMode] = useState("bar");
  const [tooltip, setTooltip] = useState(null);
  const tooltipRef = useRef(null);

  const merged   = mergeEvolution(evolutionData);
  const labels   = merged.map(m => m.label);
  const valid    = merged.map(m => m.value);

  // votes nuls : ~5-12% des votes validés (données simulées)
  // Remplace par les vraies données API si disponibles : stats?.evolutionVotesNuls
  const nullVotes = valid.map(v => Math.round(v * 0.08));
  const maxVal    = Math.max(...valid, 1);
  const target    = Array(6).fill(Math.round(maxVal * 0.75));

  const total   = valid.reduce((a, b) => a + b, 0);
  const peakIdx = valid.indexOf(Math.max(...valid));
  const lastV   = valid[valid.length - 1] || 0;
  const prevV   = valid[valid.length - 2] || 1;
  const delta   = lastV - prevV;
  const pct     = Math.round((delta / (prevV || 1)) * 100);

  const buildDatasets = () => {
    const isLine = mode === "line";
    return [
      {
        type: isLine ? "line" : "bar",
        label: "Votes validés",
        data: valid,
        backgroundColor: isLine
          ? "rgba(37,99,235,.08)"
          : labels.map((_, i) => i === labels.length - 1 ? "#2563eb" : "rgba(37,99,235,.7)"),
        borderColor: "#2563eb",
        borderWidth: isLine ? 2.5 : 0,
        borderRadius: isLine ? 0 : 7,
        borderSkipped: false,
        fill: isLine,
        tension: 0.38,
        pointRadius: isLine ? 4 : 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        hoverBackgroundColor: "#1d4ed8",
        order: 1,
      },
      {
        type: isLine ? "line" : "bar",
        label: "Votes nuls",
        data: nullVotes,
        backgroundColor: isLine ? "transparent" : "rgba(147,197,253,.7)",
        borderColor: "#93c5fd",
        borderWidth: isLine ? 2 : 0,
        borderRadius: isLine ? 0 : 7,
        borderSkipped: false,
        fill: false,
        tension: 0.38,
        pointRadius: isLine ? 3 : 0,
        pointHoverRadius: 5,
        pointBackgroundColor: "#93c5fd",
        pointBorderColor: "#fff",
        pointBorderWidth: 1.5,
        hoverBackgroundColor: "#60a5fa",
        order: 2,
      },
      {
        type: "line",
        label: "Objectif",
        data: target,
        borderColor: "#f59e0b",
        borderWidth: 1.5,
        borderDash: [5, 4],
        pointRadius: 0,
        fill: false,
        tension: 0,
        order: 0,
      },
    ];
  };

  const chartData = { labels, datasets: buildDatasets() };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: ({ tooltip: tip }) => setTooltip({ ...tip }),
      },
    },
    scales: {
      x: {
        stacked: mode === "bar",
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#9ca3af", font: { size: 12 }, maxRotation: 0, autoSkip: false },
      },
      y: {
        stacked: mode === "bar",
        beginAtZero: true,
        suggestedMax: Math.ceil(maxVal * 1.25),
        grid: { color: "rgba(0,0,0,.05)" },
        border: { display: false },
        ticks: {
          color: "#9ca3af",
          font: { size: 11 },
          callback: v => Number.isInteger(v) ? v.toLocaleString("fr-FR") : null,
        },
      },
    },
    animation: { duration: 450, easing: "easeInOutQuart" },
  };

  // Positionnement du tooltip HTML
  const getTooltipStyle = () => {
    if (!tooltip || !tooltip.opacity || !chartRef.current) return { display: "none" };
    const canvas = chartRef.current.canvas;
    if (!canvas) return { display: "none" };
    const { caretX, caretY } = tooltip;
    const tw = tooltipRef.current?.offsetWidth || 160;
    const overflows = caretX + tw + 20 > canvas.offsetWidth;
    return {
      display: "block",
      position: "absolute",
      left: overflows ? caretX - tw - 12 : caretX + 12,
      top: caretY - 20,
      pointerEvents: "none",
      background: "#fff",
      border: "0.5px solid #e5e7eb",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12,
      boxShadow: "0 4px 16px rgba(0,0,0,.08)",
      zIndex: 50,
      minWidth: 155,
      transition: "left .1s, top .1s",
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Évolution des votes</h3>
          <p className="text-xs text-gray-400 mt-0.5">6 derniers mois · Toutes élections confondues</p>
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "bar",  label: "Barres",  Icon: FiBarChart2 },
            { key: "line", label: "Courbe",  Icon: FiActivity  },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI inline */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-1">Total votes</p>
          <p className="text-xl font-black text-blue-700">{total.toLocaleString("fr-FR")}</p>
          <p className="text-xs text-blue-400 mt-0.5">période sélectionnée</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide mb-1">Mois record</p>
          <p className="text-xl font-black text-purple-700">{labels[peakIdx] || "—"}</p>
          <p className="text-xs text-purple-400 mt-0.5">{(valid[peakIdx] || 0).toLocaleString("fr-FR")} votes</p>
        </div>

        <div
          className="rounded-xl p-3"
          style={{ background: delta >= 0 ? "#f0fdf4" : "#fef2f2" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: delta >= 0 ? "#16a34a" : "#dc2626" }}
          >
            Tendance
          </p>
          <p
            className="text-xl font-black flex items-center gap-1"
            style={{ color: delta >= 0 ? "#15803d" : "#b91c1c" }}
          >
            {delta >= 0 ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
            {delta >= 0 ? "+" : ""}{pct}%
          </p>
          <p className="text-xs mt-0.5" style={{ color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
            vs mois précédent
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: "relative", height: 220 }}>
        <Chart
          ref={chartRef}
          type={mode === "line" ? "line" : "bar"}
          data={chartData}
          options={chartOptions}
        />
        {/* Tooltip HTML personnalisé */}
        <div ref={tooltipRef} style={getTooltipStyle()}>
          <p style={{ fontWeight: 600, marginBottom: 6, color: "#111827", fontSize: 12 }}>
            {tooltip?.title?.[0]}
          </p>
          {(tooltip?.dataPoints || []).map((p, i) => {
            const colors = ["#2563eb", "#93c5fd", "#f59e0b"];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[p.datasetIndex] || "#888", flexShrink: 0 }} />
                <span style={{ color: "#6b7280", flex: 1, fontSize: 11 }}>{p.dataset.label}</span>
                <span style={{ fontWeight: 600, color: "#111827", fontSize: 12 }}>
                  {Number(p.parsed.y).toLocaleString("fr-FR")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        {[
          { color: "#2563eb", label: "Votes validés" },
          { color: "#93c5fd", label: "Votes nuls / contestés" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span style={{ width: 20, height: 2, background: "#f59e0b", display: "inline-block", borderRadius: 1 }} />
          <span className="text-xs text-gray-400">Objectif participation</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page principale
───────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const prenom = localStorage.getItem("prenom") || "";
  const nom    = localStorage.getItem("nom")    || "";
  const displayName = [prenom, nom].filter(Boolean).join(" ") || "Super Administrateur";

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

  const kpis = [
    {
      label: "Utilisateurs",
      value: stats?.totalUtilisateurs?.toLocaleString("fr-FR") ?? "—",
      icon: <FiUsers />,
      color: "#2563eb", bg: "#dbeafe", border: "#bfdbfe",
    },
    {
      label: "Élections",
      value: stats?.totalElections ?? "—",
      icon: <FaVoteYea />,
      color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe",
    },
    {
      label: "En attente",
      value: stats?.enAttente ?? "—",
      icon: <FiAlertCircle />,
      color: "#d97706", bg: "#fef3c7", border: "#fde68a",
    },
    {
      label: "Participation globale",
      value: `${stats?.tauxParticipation ?? 0}%`,
      icon: <FiTrendingUp />,
      color: "#059669", bg: "#d1fae5", border: "#6ee7b7",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      <SuperAdminSidebar active="dashboard" />

      <main className="flex-1 p-8 overflow-y-auto">

        {/* En-tête */}
        <div className="mb-8">
          <h2 className="text-2xl font-black text-blue-900 tracking-tight">Tableau de bord</h2>
          <p className="text-sm text-blue-400 mt-1">Bienvenue, {displayName} 👑</p>
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
              {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
            </div>

            {/* Graphique + colonne droite */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Graphique amélioré */}
              <div className="lg:col-span-2">
                <VoteEvolutionChart evolutionData={stats?.evolutionVotes} />
              </div>

              {/* Colonne droite */}
              <div className="space-y-4">

                {/* Alertes système */}
                <div
                  className="rounded-2xl p-5 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                >
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
                    <Link
                      to="/admin/superadmin/electionsValider"
                      className="text-xs text-blue-600 font-semibold hover:underline"
                    >
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
                            <span
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
                              style={{ background: "#fef3c7", color: "#92400e" }}
                            >
                              <FiClock size={10} /> En attente
                            </span>
                          </div>
                          <Link
                            to="/admin/superadmin/electionsValider"
                            className="flex-shrink-0 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                          >
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
                    <Link
                      to="/admin/superadmin/elections"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
                    >
                      <FaVoteYea size={14} className="text-blue-500" /> Toutes les élections
                    </Link>
                    <Link
                      to="/admin/superadmin/utilisateursPage"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
                    >
                      <FiUsers size={14} className="text-blue-500" /> Gérer les utilisateurs
                    </Link>
                    <Link
                      to="/admin/superadmin/elections/creer"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
                    >
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



