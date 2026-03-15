// src/pages/admin/superadmin/StatistiquesPage.jsx
import React, { useState } from "react";
import { FiDownload, FiTrendingUp, FiClock, FiAlertCircle } from "react-icons/fi";
import {
  FaVoteYea, FaCrown, FaUser, FaUserCheck, FaUserTimes,
  FaBullseye, FaCheckCircle, FaClock
} from "react-icons/fa";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Tooltip, Legend,
} from "chart.js";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function StatistiquesPage() {
  const [filter, setFilter] = useState("Ce mois");

  const kpis = {
    totalElections: 12, valides: 8, enAttente: 4,
    totalUsers: 120, superAdmins: 2, adminElections: 10,
    electeursActifs: 108, electeursInactifs: 12,
  };

  const electionsTable = [
    { titre: "Élection universitaire 2026", type: "Uninominal", createur: "Moussa Ouhoumoud", debut: "2026-03-01", fin: "2026-03-05", statut: "Validée",    participation: 90 },
    { titre: "Conseil municipal",           type: "Liste",      createur: "Jean Dupont",      debut: "2026-04-10", fin: "2026-04-15", statut: "En attente", participation: 50 },
    { titre: "Élection club étudiant",      type: "Uninominal", createur: "Amina Bello",      debut: "2026-05-01", fin: "2026-05-03", statut: "Refusée",    participation: 0  },
  ];

  const notifications = [
    { msg: "Élection 'Conseil municipal' approche de sa date de fin.", icon: <FiClock size={13} /> },
    { msg: "12 électeurs sont inactifs depuis plus de 30 jours.",       icon: <FiAlertCircle size={13} /> },
    { msg: "Faible participation détectée sur certaines élections.",    icon: <FiTrendingUp size={13} /> },
  ];

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1d4ed8", padding: 10, cornerRadius: 8 } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: "#f3f4f6" }, ticks: { font: { size: 11 } } },
    },
  };

  const statusColors = {
    "Validée":    { bg: "#d1fae5", color: "#065f46" },
    "En attente": { bg: "#fef3c7", color: "#92400e" },
    "Refusée":    { bg: "#fee2e2", color: "#991b1b" },
  };

  const exportCSV = () => {
    const rows = ["Titre,Type,Créateur,Début,Fin,Statut,Participation",
      ...electionsTable.map(e => `${e.titre},${e.type},${e.createur},${e.debut},${e.fin},${e.statut},${e.participation}%`)
    ];
    const uri = encodeURI("data:text/csv;charset=utf-8," + rows.join("\n"));
    const a = document.createElement("a"); a.href = uri; a.download = "statistiques.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      <SuperAdminSidebar active="stats" />

      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-blue-900 tracking-tight">Statistiques</h2>
            <p className="text-sm text-blue-400 mt-1">Vue d'ensemble de la plateforme</p>
          </div>
          <div className="flex items-center gap-3">
            {["Aujourd'hui", "Cette semaine", "Ce mois"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === f
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200/60"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}>
                {f}
              </button>
            ))}
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 active:scale-95 transition-all text-sm font-semibold shadow-sm">
              <FiDownload size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Alertes */}
        <div className="space-y-2 mb-6">
          {notifications.map((n, i) => (
            <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-medium">
              {n.icon} {n.msg}
            </div>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <FaBullseye />,    value: kpis.totalElections,    label: "Élections totales",   color: "#2563eb", bg: "#dbeafe" },
            { icon: <FaCheckCircle />, value: kpis.valides,           label: "Élections validées",  color: "#059669", bg: "#d1fae5" },
            { icon: <FaClock />,       value: kpis.enAttente,         label: "En attente",          color: "#d97706", bg: "#fef3c7" },
            { icon: <FaUser />,        value: kpis.totalUsers,        label: "Utilisateurs",        color: "#7c3aed", bg: "#ede9fe" },
            { icon: <FaCrown />,       value: kpis.superAdmins,       label: "Super Admins",        color: "#1d4ed8", bg: "#dbeafe" },
            { icon: <FaVoteYea />,     value: kpis.adminElections,    label: "Admins Élections",    color: "#0891b2", bg: "#cffafe" },
            { icon: <FaUserCheck />,   value: kpis.electeursActifs,   label: "Électeurs actifs",    color: "#059669", bg: "#d1fae5" },
            { icon: <FaUserTimes />,   value: kpis.electeursInactifs, label: "Électeurs inactifs",  color: "#dc2626", bg: "#fee2e2" },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-xs text-gray-400 font-medium">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Élections par statut</h3>
            <Bar
              data={{
                labels: ["Validée", "En attente", "Refusée"],
                datasets: [{ data: [kpis.valides, kpis.enAttente, 0], backgroundColor: ["#16a34a", "#d97706", "#dc2626"], borderRadius: 8, borderSkipped: false }]
              }}
              options={chartOptions}
            />
          </div>

          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Utilisateurs par rôle</h3>
            <Pie
              data={{
                labels: ["Super Admin", "Admin Élections", "Électeurs actifs", "Électeurs inactifs"],
                datasets: [{ data: [kpis.superAdmins, kpis.adminElections, kpis.electeursActifs, kpis.electeursInactifs], backgroundColor: ["#1d4ed8", "#0891b2", "#16a34a", "#dc2626"], borderWidth: 0 }]
              }}
              options={{ responsive: true, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } } }}
            />
          </div>

          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 md:col-span-2">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Électeurs inscrits dans le temps</h3>
            <Line
              data={{
                labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
                datasets: [{
                  label: "Électeurs",
                  data: [20, 35, 50, 75, 90, 120],
                  borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,0.1)",
                  tension: 0.4, pointBackgroundColor: "#2563eb", pointRadius: 4,
                }]
              }}
              options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }}
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Détail des élections</h3>
          </div>
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-blue-700">
                {["Titre", "Type", "Créateur", "Début", "Fin", "Statut", "Participation"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${i < 6 ? "border-r border-blue-600/50" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {electionsTable.map((e, i) => {
                const sc = statusColors[e.statut] || { bg: "#f3f4f6", color: "#6b7280" };
                return (
                  <tr key={i} className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                    <td className="px-4 py-3.5 border-r border-gray-100 text-sm font-semibold text-gray-800">{e.titre}</td>
                    <td className="px-4 py-3.5 border-r border-gray-100">
                      <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">{e.type}</span>
                    </td>
                    <td className="px-4 py-3.5 border-r border-gray-100 text-sm text-gray-600">{e.createur}</td>
                    <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500">{e.debut}</td>
                    <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500">{e.fin}</td>
                    <td className="px-4 py-3.5 border-r border-gray-100">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: sc.bg, color: sc.color }}>
                        {e.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${e.participation}%` }} />
                        </div>
                        <span className="text-xs font-bold text-blue-700 w-8 text-right">{e.participation}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
