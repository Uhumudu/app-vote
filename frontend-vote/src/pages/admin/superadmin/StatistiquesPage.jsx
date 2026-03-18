// src/pages/admin/superadmin/StatistiquesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { FiDownload, FiTrendingUp, FiClock, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import {
  FaVoteYea, FaCrown, FaUser, FaUserCheck, FaUserTimes,
  FaBullseye, FaCheckCircle, FaClock,
} from "react-icons/fa";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Tooltip, Legend,
} from "chart.js";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";
import api from "../../../services/api";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Tooltip, Legend
);

// ── Libellés statut ───────────────────────────────────────────────────────────
const STATUT_LABELS = {
  APPROUVEE:  "Validée",
  EN_ATTENTE: "En attente",
  EN_COURS:   "En cours",
  TERMINEE:   "Terminée",
  SUSPENDUE:  "Suspendue",
};

const STATUS_COLORS = {
  Validée:     { bg: "#d1fae5", color: "#065f46" },
  "En attente":{ bg: "#fef3c7", color: "#92400e" },
  "En cours":  { bg: "#dbeafe", color: "#1e40af" },
  Terminée:    { bg: "#f3f4f6", color: "#374151" },
  Suspendue:   { bg: "#fee2e2", color: "#991b1b" },
};

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 16 }) {
  return (
    <span style={{ display: "inline-flex", animation: "spin 0.8s linear infinite" }}>
      <FiRefreshCw size={size} />
    </span>
  );
}

// ── Squelette carte KPI ───────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="kpi-card kpi-skeleton">
      <div className="kpi-icon-skeleton" />
      <div className="kpi-text-skeleton">
        <div className="kpi-val-skeleton" />
        <div className="kpi-lbl-skeleton" />
      </div>
    </div>
  );
}

export default function StatistiquesPage() {
  const [filter, setFilter]               = useState("Ce mois");
  const [annee]                           = useState(new Date().getFullYear());

  // ── États données ─────────────────────────────────────────────────────────
  const [kpis, setKpis]                   = useState(null);
  const [electionsStatut, setElectionsStatut] = useState(null);
  const [usersRole, setUsersRole]         = useState(null);
  const [inscriptions, setInscriptions]   = useState(null);
  const [elections, setElections]         = useState([]);
  const [alertes, setAlertes]             = useState([]);

  // ── États chargement ──────────────────────────────────────────────────────
  const [loadingKpis, setLoadingKpis]         = useState(true);
  const [loadingCharts, setLoadingCharts]     = useState(true);
  const [loadingTable, setLoadingTable]       = useState(true);
  const [loadingAlertes, setLoadingAlertes]   = useState(true);
  const [exportingCSV, setExportingCSV]       = useState(false);
  const [error, setError]                     = useState(null);

  // ── Chargement données ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setError(null);

    // KPIs
    setLoadingKpis(true);
    try {
      const { data } = await api.get("/super-admin/statistiques/kpis");
      setKpis(data);
    } catch {
      setError("Impossible de charger les KPIs.");
    } finally {
      setLoadingKpis(false);
    }

    // Graphiques (en parallèle)
    setLoadingCharts(true);
    try {
      const [resStatut, resRole, resInscriptions] = await Promise.all([
        api.get("/super-admin/statistiques/elections-par-statut"),
        api.get("/super-admin/statistiques/utilisateurs-par-role"),
        api.get(`/super-admin/statistiques/inscriptions-mensuelles?annee=${annee}`),
      ]);
      setElectionsStatut(resStatut.data);
      setUsersRole(resRole.data);
      setInscriptions(resInscriptions.data);
    } catch {
      setError("Impossible de charger les graphiques.");
    } finally {
      setLoadingCharts(false);
    }

    // Tableau
    setLoadingTable(true);
    try {
      const { data } = await api.get("/super-admin/statistiques/elections-detail?limit=50");
      setElections(data);
    } catch {
      setError("Impossible de charger le tableau.");
    } finally {
      setLoadingTable(false);
    }

    // Alertes
    setLoadingAlertes(true);
    try {
      const { data } = await api.get("/super-admin/statistiques/alertes");
      setAlertes(data);
    } catch {
      // Alertes non bloquantes
    } finally {
      setLoadingAlertes(false);
    }
  }, [annee]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const response = await api.get("/super-admin/statistiques/export-csv", {
        responseType: "blob",
      });
      const url  = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.download = `statistiques_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Échec de l'export CSV.");
    } finally {
      setExportingCSV(false);
    }
  };

  // ── Données graphiques ────────────────────────────────────────────────────
  const barData = electionsStatut ? {
    labels: ["Validée", "En attente", "En cours", "Terminée", "Suspendue"],
    datasets: [{
      data: [
        electionsStatut.APPROUVEE  || 0,
        electionsStatut.EN_ATTENTE || 0,
        electionsStatut.EN_COURS   || 0,
        electionsStatut.TERMINEE   || 0,
        electionsStatut.SUSPENDUE  || 0,
      ],
      backgroundColor: ["#16a34a", "#d97706", "#2563eb", "#6b7280", "#dc2626"],
      borderRadius: 8,
      borderSkipped: false,
    }],
  } : null;

  const pieData = usersRole ? {
    labels: ["Super Admin", "Admin Élections", "Électeurs actifs", "Électeurs inactifs"],
    datasets: [{
      data: [
        usersRole.SUPER_ADMIN || 0,
        (usersRole.ADMIN_ELECTION || 0) + (usersRole.ADMIN_ELECTION_PENDING || 0),
        kpis?.electeursActifs   || 0,
        kpis?.electeursInactifs || 0,
      ],
      backgroundColor: ["#1d4ed8", "#0891b2", "#16a34a", "#dc2626"],
      borderWidth: 0,
    }],
  } : null;

  const lineData = inscriptions ? {
    labels: inscriptions.labels,
    datasets: [{
      label: "Électeurs inscrits",
      data:  inscriptions.data,
      borderColor: "#2563eb",
      backgroundColor: "rgba(37,99,235,0.1)",
      tension: 0.4,
      pointBackgroundColor: "#2563eb",
      pointRadius: 4,
      fill: true,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#1d4ed8", padding: 10, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: "#f3f4f6" }, ticks: { font: { size: 11 } }, beginAtZero: true },
    },
  };

  // ── Icônes alerte ─────────────────────────────────────────────────────────
  const alerteIcon = (type) => {
    if (type === "warning") return <FiClock size={13} />;
    if (type === "danger")  return <FiTrendingUp size={13} />;
    return <FiAlertCircle size={13} />;
  };

  const alerteStyle = (type) => {
    if (type === "warning") return { bg: "#fffbeb", border: "#fcd34d", text: "#92400e" };
    if (type === "danger")  return { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" };
    return { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af" };
  };

  // ── KPI cards config ──────────────────────────────────────────────────────
  const kpiCards = kpis ? [
    { icon: <FaBullseye />,    value: kpis.totalElections,    label: "Élections totales",  color: "#2563eb", bg: "#dbeafe" },
    { icon: <FaCheckCircle />, value: kpis.valides,           label: "Élections validées", color: "#059669", bg: "#d1fae5" },
    { icon: <FaClock />,       value: kpis.enAttente,         label: "En attente",         color: "#d97706", bg: "#fef3c7" },
    { icon: <FaUser />,        value: kpis.totalUsers,        label: "Utilisateurs",       color: "#7c3aed", bg: "#ede9fe" },
    { icon: <FaCrown />,       value: kpis.superAdmins,       label: "Super Admins",       color: "#1d4ed8", bg: "#dbeafe" },
    { icon: <FaVoteYea />,     value: kpis.adminElections,    label: "Admins Élections",   color: "#0891b2", bg: "#cffafe" },
    { icon: <FaUserCheck />,   value: kpis.electeursActifs,   label: "Électeurs actifs",   color: "#059669", bg: "#d1fae5" },
    { icon: <FaUserTimes />,   value: kpis.electeursInactifs, label: "Électeurs inactifs", color: "#dc2626", bg: "#fee2e2" },
  ] : [];

  return (
    <>
      <style>{css}</style>
      <div className="stats-root">
        <SuperAdminSidebar active="stats" />

        <main className="stats-main">

          {/* ── Header ── */}
          <div className="stats-header">
            <div>
              <h2 className="stats-title">Statistiques</h2>
              <p className="stats-subtitle">Vue d'ensemble de la plateforme · {annee}</p>
            </div>
            <div className="stats-header-actions">
              {["Aujourd'hui", "Cette semaine", "Ce mois"].map(f => (
                <button key={f}
                  className={`stats-filter-btn ${filter === f ? "stats-filter-btn--active" : ""}`}
                  onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
              <button
                className="stats-export-btn"
                onClick={handleExportCSV}
                disabled={exportingCSV}>
                {exportingCSV ? <Spinner size={13} /> : <FiDownload size={14} />}
                {exportingCSV ? "Export…" : "Export CSV"}
              </button>
              <button className="stats-refresh-btn" onClick={fetchAll} title="Actualiser">
                <FiRefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* ── Erreur globale ── */}
          {error && (
            <div className="stats-error-bar">
              <FiAlertCircle size={14} /> {error}
            </div>
          )}

          {/* ── Alertes ── */}
          {!loadingAlertes && alertes.length > 0 && (
            <div className="stats-alertes">
              {alertes.map((a, i) => {
                const s = alerteStyle(a.type);
                return (
                  <div key={i} className="stats-alerte"
                    style={{ background: s.bg, borderColor: s.border, color: s.text }}>
                    {alerteIcon(a.type)} {a.msg}
                  </div>
                );
              })}
            </div>
          )}
          {loadingAlertes && (
            <div className="stats-alertes">
              {[1, 2].map(i => <div key={i} className="stats-alerte-skeleton" />)}
            </div>
          )}

          {/* ── KPIs ── */}
          <div className="kpi-grid">
            {loadingKpis
              ? Array(8).fill(0).map((_, i) => <KpiSkeleton key={i} />)
              : kpiCards.map((kpi, i) => (
                <div key={i} className="kpi-card"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="kpi-icon"
                    style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                    {kpi.icon}
                  </div>
                  <div>
                    <p className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</p>
                    <p className="kpi-label">{kpi.label}</p>
                  </div>
                </div>
              ))
            }
          </div>

          {/* ── Graphiques ── */}
          <div className="charts-grid">
            {/* Bar */}
            <div className="chart-card">
              <h3 className="chart-title">Élections par statut</h3>
              {loadingCharts
                ? <div className="chart-skeleton" />
                : barData && <Bar data={barData} options={chartOptions} />
              }
            </div>

            {/* Pie */}
            <div className="chart-card">
              <h3 className="chart-title">Utilisateurs par rôle</h3>
              {loadingCharts
                ? <div className="chart-skeleton" />
                : pieData && (
                  <Pie data={pieData} options={{
                    responsive: true,
                    plugins: {
                      legend: { position: "bottom", labels: { font: { size: 11 }, padding: 16 } },
                      tooltip: { backgroundColor: "#1d4ed8", padding: 10 },
                    },
                  }} />
                )
              }
            </div>

            {/* Line */}
            <div className="chart-card chart-card--full">
              <h3 className="chart-title">
                Électeurs inscrits par mois — {annee}
              </h3>
              {loadingCharts
                ? <div className="chart-skeleton chart-skeleton--tall" />
                : lineData && (
                  <Line data={lineData} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: { display: false },
                    },
                  }} />
                )
              }
            </div>
          </div>

          {/* ── Tableau ── */}
          <div className="table-card">
            <div className="table-card-header">
              <h3 className="chart-title" style={{ margin: 0 }}>Détail des élections</h3>
              {loadingTable && <Spinner size={13} />}
            </div>

            <div className="table-scroll">
              <table className="stats-table">
                <thead>
                  <tr>
                    {["Titre", "Type", "Créateur", "Début", "Fin", "Statut", "Participation"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingTable
                    ? Array(4).fill(0).map((_, i) => (
                      <tr key={i}>
                        {Array(7).fill(0).map((_, j) => (
                          <td key={j}><div className="td-skeleton" /></td>
                        ))}
                      </tr>
                    ))
                    : elections.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} className="table-empty">
                          Aucune élection trouvée.
                        </td>
                      </tr>
                    )
                    : elections.map((e, i) => {
                      const label  = STATUT_LABELS[e.statut] || e.statut;
                      const sc     = STATUS_COLORS[label] || { bg: "#f3f4f6", color: "#6b7280" };
                      const pct    = Number(e.participation) || 0;
                      const barColor = pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626";

                      return (
                        <tr key={i}>
                          <td className="td-titre">{e.titre}</td>
                          <td>
                            <span className="badge-type">{e.type_scrutin || "—"}</span>
                          </td>
                          <td className="td-muted">{e.createur}</td>
                          <td className="td-muted">
                            {e.date_debut ? new Date(e.date_debut).toLocaleDateString("fr-FR") : "—"}
                          </td>
                          <td className="td-muted">
                            {e.date_fin ? new Date(e.date_fin).toLocaleDateString("fr-FR") : "—"}
                          </td>
                          <td>
                            <span className="badge-statut"
                              style={{ background: sc.bg, color: sc.color }}>
                              {label}
                            </span>
                          </td>
                          <td>
                            <div className="participation-cell">
                              <div className="participation-bar-bg">
                                <div className="participation-bar-fill"
                                  style={{ width: `${pct}%`, background: barColor }} />
                              </div>
                              <span className="participation-pct"
                                style={{ color: barColor }}>
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

  @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px) }
    to   { opacity: 1; transform: translateY(0) }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0 }
    100% { background-position: 400px 0 }
  }

  .stats-root {
    display: flex;
    min-height: 100vh;
    background: linear-gradient(to bottom right, #dbeafe, #bfdbfe, #93c5fd);
    font-family: 'Outfit', sans-serif;
  }

  .stats-main {
    flex: 1;
    padding: 32px;
    overflow-y: auto;
  }

  /* ── Header ── */
  .stats-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
  }
  .stats-title {
    font-size: 26px;
    font-weight: 900;
    color: #1e3a8a;
    letter-spacing: -.6px;
    margin: 0;
  }
  .stats-subtitle {
    font-size: 13px;
    color: #60a5fa;
    margin: 3px 0 0;
    font-weight: 500;
  }
  .stats-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .stats-filter-btn {
    padding: 8px 14px;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    background: white;
    color: #64748b;
    font-size: 12.5px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: all .15s;
  }
  .stats-filter-btn:hover { background: #f8fafc; }
  .stats-filter-btn--active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(37,99,235,.3);
  }
  .stats-export-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 12.5px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: all .15s;
    box-shadow: 0 4px 12px rgba(16,185,129,.25);
  }
  .stats-export-btn:hover:not(:disabled) { background: #059669; transform: translateY(-1px); }
  .stats-export-btn:disabled { opacity: .65; cursor: not-allowed; }
  .stats-refresh-btn {
    width: 36px; height: 36px;
    border-radius: 10px;
    border: 1.5px solid #e2e8f0;
    background: white;
    color: #2563eb;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all .15s;
  }
  .stats-refresh-btn:hover { background: #eff6ff; border-color: #93c5fd; }

  /* ── Erreur ── */
  .stats-error-bar {
    display: flex; align-items: center; gap: 8px;
    background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b;
    padding: 10px 16px; border-radius: 12px;
    font-size: 13px; font-weight: 600;
    margin-bottom: 16px;
  }

  /* ── Alertes ── */
  .stats-alertes { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  .stats-alerte {
    display: flex; align-items: center; gap: 8px;
    border-width: 1px; border-style: solid;
    padding: 10px 16px; border-radius: 12px;
    font-size: 13px; font-weight: 600;
  }
  .stats-alerte-skeleton {
    height: 38px; border-radius: 12px;
    background: linear-gradient(90deg, #fef3c7 25%, #fde68a 50%, #fef3c7 75%);
    background-size: 400px 100%;
    animation: shimmer 1.2s infinite;
  }

  /* ── KPI Grid ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }
  .kpi-card {
    background: white;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.8);
    box-shadow: 0 2px 8px rgba(37,99,235,.07);
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all .2s;
    animation: fadeUp .4s ease both;
  }
  .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(37,99,235,.12); }
  .kpi-icon {
    width: 42px; height: 42px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
  }
  .kpi-value { font-size: 22px; font-weight: 900; letter-spacing: -.5px; margin: 0; }
  .kpi-label { font-size: 11.5px; color: #94a3b8; font-weight: 600; margin: 2px 0 0; }

  /* Skeleton KPI */
  .kpi-skeleton { cursor: default; }
  .kpi-icon-skeleton {
    width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
    background-size: 400px 100%; animation: shimmer 1.2s infinite;
  }
  .kpi-text-skeleton { flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .kpi-val-skeleton {
    height: 22px; width: 48px; border-radius: 6px;
    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
    background-size: 400px 100%; animation: shimmer 1.2s infinite;
  }
  .kpi-lbl-skeleton {
    height: 12px; width: 72px; border-radius: 4px;
    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
    background-size: 400px 100%; animation: shimmer 1.2s infinite;
  }

  /* ── Charts ── */
  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }
  .chart-card {
    background: white;
    border-radius: 18px;
    border: 1px solid rgba(219,234,254,.6);
    box-shadow: 0 2px 8px rgba(37,99,235,.06);
    padding: 20px;
  }
  .chart-card--full { grid-column: 1 / -1; }
  .chart-title {
    font-size: 11px;
    font-weight: 800;
    color: #93c5fd;
    text-transform: uppercase;
    letter-spacing: .1em;
    margin: 0 0 16px;
  }
  .chart-skeleton {
    height: 200px; border-radius: 10px;
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 400px 100%; animation: shimmer 1.2s infinite;
  }
  .chart-skeleton--tall { height: 240px; }

  /* ── Table ── */
  .table-card {
    background: white;
    border-radius: 18px;
    border: 1px solid rgba(219,234,254,.6);
    box-shadow: 0 2px 8px rgba(37,99,235,.06);
    overflow: hidden;
  }
  .table-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
  }
  .table-scroll { overflow-x: auto; }
  .stats-table { width: 100%; border-collapse: collapse; }
  .stats-table thead tr { background: #1d4ed8; }
  .stats-table th {
    padding: 11px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,.85);
    text-transform: uppercase;
    letter-spacing: .05em;
    white-space: nowrap;
  }
  .stats-table td {
    padding: 12px 14px;
    border-bottom: 1px solid #f8fafc;
    font-size: 13px;
    vertical-align: middle;
  }
  .stats-table tbody tr:last-child td { border-bottom: none; }
  .stats-table tbody tr:hover td { background: #eff6ff; }
  .stats-table tbody tr:nth-child(even) td { background: #fafafa; }
  .stats-table tbody tr:nth-child(even):hover td { background: #eff6ff; }

  .td-titre { font-weight: 700; color: #1e293b; }
  .td-muted  { color: #64748b; font-size: 12.5px; }
  .table-empty {
    text-align: center; padding: 40px;
    color: #94a3b8; font-size: 14px; font-weight: 500;
  }

  .badge-type {
    font-size: 11px; font-weight: 700;
    background: #eff6ff; color: #1d4ed8;
    padding: 3px 10px; border-radius: 8px;
    white-space: nowrap;
  }
  .badge-statut {
    font-size: 11px; font-weight: 700;
    padding: 3px 10px; border-radius: 999px;
    white-space: nowrap;
  }

  .participation-cell { display: flex; align-items: center; gap: 8px; min-width: 100px; }
  .participation-bar-bg {
    flex: 1; height: 6px; background: #f1f5f9; border-radius: 999px; overflow: hidden;
  }
  .participation-bar-fill { height: 100%; border-radius: 999px; transition: width .3s; }
  .participation-pct { font-size: 11.5px; font-weight: 800; width: 32px; text-align: right; }

  .td-skeleton {
    height: 14px; border-radius: 4px;
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 400px 100%; animation: shimmer 1.2s infinite;
  }

  /* ── Responsive ── */
  @media (max-width: 1200px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 900px) {
    .charts-grid { grid-template-columns: 1fr; }
    .chart-card--full { grid-column: 1; }
    .stats-main { padding: 20px 16px; }
  }
  @media (max-width: 640px) {
    .kpi-grid { grid-template-columns: 1fr 1fr; }
    .stats-header { flex-direction: column; }
    .stats-header-actions { width: 100%; }
  }
`;






























// // src/pages/admin/superadmin/StatistiquesPage.jsx
// import React, { useState } from "react";
// import { FiDownload, FiTrendingUp, FiClock, FiAlertCircle } from "react-icons/fi";
// import {
//   FaVoteYea, FaCrown, FaUser, FaUserCheck, FaUserTimes,
//   FaBullseye, FaCheckCircle, FaClock
// } from "react-icons/fa";
// import { Bar, Line, Pie } from "react-chartjs-2";
// import {
//   Chart as ChartJS, CategoryScale, LinearScale, BarElement,
//   PointElement, LineElement, ArcElement, Tooltip, Legend,
// } from "chart.js";
// import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

// ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

// export default function StatistiquesPage() {
//   const [filter, setFilter] = useState("Ce mois");

//   const kpis = {
//     totalElections: 12, valides: 8, enAttente: 4,
//     totalUsers: 120, superAdmins: 2, adminElections: 10,
//     electeursActifs: 108, electeursInactifs: 12,
//   };

//   const electionsTable = [
//     { titre: "Élection universitaire 2026", type: "Uninominal", createur: "Moussa Ouhoumoud", debut: "2026-03-01", fin: "2026-03-05", statut: "Validée",    participation: 90 },
//     { titre: "Conseil municipal",           type: "Liste",      createur: "Jean Dupont",      debut: "2026-04-10", fin: "2026-04-15", statut: "En attente", participation: 50 },
//     { titre: "Élection club étudiant",      type: "Uninominal", createur: "Amina Bello",      debut: "2026-05-01", fin: "2026-05-03", statut: "Refusée",    participation: 0  },
//   ];

//   const notifications = [
//     { msg: "Élection 'Conseil municipal' approche de sa date de fin.", icon: <FiClock size={13} /> },
//     { msg: "12 électeurs sont inactifs depuis plus de 30 jours.",       icon: <FiAlertCircle size={13} /> },
//     { msg: "Faible participation détectée sur certaines élections.",    icon: <FiTrendingUp size={13} /> },
//   ];

//   const chartOptions = {
//     responsive: true,
//     plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1d4ed8", padding: 10, cornerRadius: 8 } },
//     scales: {
//       x: { grid: { display: false }, ticks: { font: { size: 11 } } },
//       y: { grid: { color: "#f3f4f6" }, ticks: { font: { size: 11 } } },
//     },
//   };

//   const statusColors = {
//     "Validée":    { bg: "#d1fae5", color: "#065f46" },
//     "En attente": { bg: "#fef3c7", color: "#92400e" },
//     "Refusée":    { bg: "#fee2e2", color: "#991b1b" },
//   };

//   const exportCSV = () => {
//     const rows = ["Titre,Type,Créateur,Début,Fin,Statut,Participation",
//       ...electionsTable.map(e => `${e.titre},${e.type},${e.createur},${e.debut},${e.fin},${e.statut},${e.participation}%`)
//     ];
//     const uri = encodeURI("data:text/csv;charset=utf-8," + rows.join("\n"));
//     const a = document.createElement("a"); a.href = uri; a.download = "statistiques.csv";
//     document.body.appendChild(a); a.click(); document.body.removeChild(a);
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

//       <SuperAdminSidebar active="stats" />

//       <main className="flex-1 p-8 overflow-y-auto">

//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h2 className="text-2xl font-black text-blue-900 tracking-tight">Statistiques</h2>
//             <p className="text-sm text-blue-400 mt-1">Vue d'ensemble de la plateforme</p>
//           </div>
//           <div className="flex items-center gap-3">
//             {["Aujourd'hui", "Cette semaine", "Ce mois"].map(f => (
//               <button key={f} onClick={() => setFilter(f)}
//                 className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
//                   filter === f
//                     ? "bg-blue-600 text-white shadow-md shadow-blue-200/60"
//                     : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
//                 }`}>
//                 {f}
//               </button>
//             ))}
//             <button onClick={exportCSV}
//               className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 active:scale-95 transition-all text-sm font-semibold shadow-sm">
//               <FiDownload size={14} /> Export CSV
//             </button>
//           </div>
//         </div>

//         {/* Alertes */}
//         <div className="space-y-2 mb-6">
//           {notifications.map((n, i) => (
//             <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-medium">
//               {n.icon} {n.msg}
//             </div>
//           ))}
//         </div>

//         {/* KPIs */}
//         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
//           {[
//             { icon: <FaBullseye />,    value: kpis.totalElections,    label: "Élections totales",   color: "#2563eb", bg: "#dbeafe" },
//             { icon: <FaCheckCircle />, value: kpis.valides,           label: "Élections validées",  color: "#059669", bg: "#d1fae5" },
//             { icon: <FaClock />,       value: kpis.enAttente,         label: "En attente",          color: "#d97706", bg: "#fef3c7" },
//             { icon: <FaUser />,        value: kpis.totalUsers,        label: "Utilisateurs",        color: "#7c3aed", bg: "#ede9fe" },
//             { icon: <FaCrown />,       value: kpis.superAdmins,       label: "Super Admins",        color: "#1d4ed8", bg: "#dbeafe" },
//             { icon: <FaVoteYea />,     value: kpis.adminElections,    label: "Admins Élections",    color: "#0891b2", bg: "#cffafe" },
//             { icon: <FaUserCheck />,   value: kpis.electeursActifs,   label: "Électeurs actifs",    color: "#059669", bg: "#d1fae5" },
//             { icon: <FaUserTimes />,   value: kpis.electeursInactifs, label: "Électeurs inactifs",  color: "#dc2626", bg: "#fee2e2" },
//           ].map((kpi, i) => (
//             <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
//               <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
//                 style={{ backgroundColor: kpi.bg, color: kpi.color }}>
//                 {kpi.icon}
//               </div>
//               <div>
//                 <p className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
//                 <p className="text-xs text-gray-400 font-medium">{kpi.label}</p>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Graphiques */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
//           <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
//             <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Élections par statut</h3>
//             <Bar
//               data={{
//                 labels: ["Validée", "En attente", "Refusée"],
//                 datasets: [{ data: [kpis.valides, kpis.enAttente, 0], backgroundColor: ["#16a34a", "#d97706", "#dc2626"], borderRadius: 8, borderSkipped: false }]
//               }}
//               options={chartOptions}
//             />
//           </div>

//           <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
//             <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Utilisateurs par rôle</h3>
//             <Pie
//               data={{
//                 labels: ["Super Admin", "Admin Élections", "Électeurs actifs", "Électeurs inactifs"],
//                 datasets: [{ data: [kpis.superAdmins, kpis.adminElections, kpis.electeursActifs, kpis.electeursInactifs], backgroundColor: ["#1d4ed8", "#0891b2", "#16a34a", "#dc2626"], borderWidth: 0 }]
//               }}
//               options={{ responsive: true, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } } }}
//             />
//           </div>

//           <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 md:col-span-2">
//             <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Électeurs inscrits dans le temps</h3>
//             <Line
//               data={{
//                 labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
//                 datasets: [{
//                   label: "Électeurs",
//                   data: [20, 35, 50, 75, 90, 120],
//                   borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,0.1)",
//                   tension: 0.4, pointBackgroundColor: "#2563eb", pointRadius: 4,
//                 }]
//               }}
//               options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }}
//             />
//           </div>
//         </div>

//         {/* Tableau */}
//         <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
//           <div className="px-6 py-4 border-b border-gray-50">
//             <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Détail des élections</h3>
//           </div>
//           <table className="min-w-full border-collapse">
//             <thead>
//               <tr className="bg-blue-700">
//                 {["Titre", "Type", "Créateur", "Début", "Fin", "Statut", "Participation"].map((h, i) => (
//                   <th key={h} className={`px-4 py-3 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${i < 6 ? "border-r border-blue-600/50" : ""}`}>
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {electionsTable.map((e, i) => {
//                 const sc = statusColors[e.statut] || { bg: "#f3f4f6", color: "#6b7280" };
//                 return (
//                   <tr key={i} className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
//                     <td className="px-4 py-3.5 border-r border-gray-100 text-sm font-semibold text-gray-800">{e.titre}</td>
//                     <td className="px-4 py-3.5 border-r border-gray-100">
//                       <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">{e.type}</span>
//                     </td>
//                     <td className="px-4 py-3.5 border-r border-gray-100 text-sm text-gray-600">{e.createur}</td>
//                     <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500">{e.debut}</td>
//                     <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500">{e.fin}</td>
//                     <td className="px-4 py-3.5 border-r border-gray-100">
//                       <span className="text-xs font-bold px-2.5 py-1 rounded-full"
//                         style={{ backgroundColor: sc.bg, color: sc.color }}>
//                         {e.statut}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3.5">
//                       <div className="flex items-center gap-2">
//                         <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
//                           <div className="h-full rounded-full bg-blue-500 transition-all"
//                             style={{ width: `${e.participation}%` }} />
//                         </div>
//                         <span className="text-xs font-bold text-blue-700 w-8 text-right">{e.participation}%</span>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//       </main>
//     </div>
//   );
// }
