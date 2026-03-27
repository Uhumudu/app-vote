// src/pages/admin/adminelection/resultats.jsx
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from "chart.js";
import {
  FiUsers, FiBarChart2, FiChevronDown,
  FiAward, FiTrendingUp, FiList, FiUser, FiUserCheck,
} from "react-icons/fi";
import api from "../../../services/api";
import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ── Palette ─────────────────────────────────────────────── */
const PALETTE = [
  "#6366f1","#10b981","#f59e0b","#ef4444",
  "#3b82f6","#a855f7","#ec4899","#14b8a6",
];

const medals = ["🥇","🥈","🥉"];

/* ── Meta par type de scrutin ────────────────────────────── */
const TYPE_META = {
  UNINOMINAL: { label: "Uninominal",       icon: <FiUser />,      cls: "bg-blue-100 text-blue-700"     },
  BINOMINAL:  { label: "Binominal",        icon: <FiUserCheck />, cls: "bg-violet-100 text-violet-700" },
  LISTE:      { label: "Scrutin de liste", icon: <FiList />,      cls: "bg-indigo-100 text-indigo-700" },
};

/* ── Barre de score ──────────────────────────────────────── */
const ScoreBar = ({ pct, color }) => (
  <div className="flex items-center justify-end gap-3">
    <div className="flex-1 max-w-28 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full transition-all duration-700"
           style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
    </div>
    <span className="text-sm font-bold text-gray-700 w-12 text-right tabular-nums">{pct}%</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   TABLEAU : UNINOMINAL  — 1 candidat par ligne, 1 gagnant
═══════════════════════════════════════════════════════════ */
const TableUninominal = ({ candidats }) => (
  <table className="min-w-full">
    <thead>
      <tr className="bg-indigo-50">
        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider w-16">Rang</th>
        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Candidat</th>
        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Parti</th>
        <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider">Votes</th>
        <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider w-52">Score</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-50">
      {candidats.map((c, i) => (
        <tr key={c.id_candidat}
            className={`hover:bg-indigo-50/50 transition-colors ${i === 0 ? "bg-amber-50/50" : ""}`}>
          <td className="px-6 py-4 text-center text-xl">
            {medals[i] ?? <span className="text-gray-400 font-bold text-sm">{i + 1}</span>}
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm flex-shrink-0">
                {c.nom?.charAt(0) ?? "?"}
              </div>
              <span className="font-bold text-gray-800">{c.nom}</span>
            </div>
          </td>
          <td className="px-6 py-4">
            {c.parti
              ? <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">{c.parti}</span>
              : <span className="text-gray-300">—</span>}
          </td>
          <td className="px-6 py-4 text-right font-black text-indigo-700 text-lg tabular-nums">{c.nb_votes}</td>
          <td className="px-6 py-4">
            <ScoreBar pct={c.pourcentage ?? 0} color={PALETTE[i % PALETTE.length]} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

/* ═══════════════════════════════════════════════════════════
   TABLEAU : BINOMINAL  — paire titulaire + suppléant
═══════════════════════════════════════════════════════════ */
const TableBinominal = ({ candidats }) => (
  <table className="min-w-full">
    <thead>
      <tr className="bg-indigo-50">
        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider w-16">Rang</th>
        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Titulaire</th>
        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Suppléant</th>
        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Parti</th>
        <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider">Votes</th>
        <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider w-52">Score</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-50">
      {candidats.map((c, i) => (
        <tr key={c.id_candidat ?? i}
            className={`hover:bg-indigo-50/50 transition-colors ${i === 0 ? "bg-amber-50/50" : ""}`}>
          <td className="px-6 py-4 text-center text-xl">
            {medals[i] ?? <span className="text-gray-400 font-bold text-sm">{i + 1}</span>}
          </td>

          {/* Titulaire */}
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-black text-sm flex-shrink-0">
                {(c.titulaire ?? c.nom)?.charAt(0) ?? "?"}
              </div>
              <div>
                <p className="font-bold text-gray-800 leading-tight">{c.titulaire ?? c.nom}</p>
                <p className="text-xs text-violet-400 font-semibold">Titulaire</p>
              </div>
            </div>
          </td>

          {/* Suppléant */}
          <td className="px-6 py-4">
            {c.suppleant ? (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm flex-shrink-0">
                  {c.suppleant?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p className="font-bold text-gray-700 leading-tight">{c.suppleant}</p>
                  <p className="text-xs text-indigo-400 font-semibold">Suppléant</p>
                </div>
              </div>
            ) : (
              <span className="text-gray-300">—</span>
            )}
          </td>

          {/* Parti */}
          <td className="px-6 py-4">
            {c.parti
              ? <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full">{c.parti}</span>
              : <span className="text-gray-300">—</span>}
          </td>

          <td className="px-6 py-4 text-right font-black text-indigo-700 text-lg tabular-nums">{c.nb_votes}</td>
          <td className="px-6 py-4">
            <ScoreBar pct={c.pourcentage ?? 0} color={PALETTE[i % PALETTE.length]} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

/* ═══════════════════════════════════════════════════════════
   TABLEAU : LISTE  — listes de candidats
═══════════════════════════════════════════════════════════ */
const TableListe = ({ listes }) => (
  <table className="min-w-full">
    <thead>
      <tr className="bg-indigo-50">
        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider w-16">Rang</th>
        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Liste</th>
        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Candidats</th>
        <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider">Votes</th>
        <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider w-52">Score</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-50">
      {listes.map((l, i) => (
        <tr key={l.id_liste ?? i}
            className={`hover:bg-indigo-50/50 transition-colors ${i === 0 ? "bg-amber-50/50" : ""}`}>
          <td className="px-6 py-4 text-center text-xl">
            {medals[i] ?? <span className="text-gray-400 font-bold text-sm">{i + 1}</span>}
          </td>
          <td className="px-6 py-4 font-bold text-gray-800">{l.nom_liste}</td>
          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{l.candidats ?? "—"}</td>
          <td className="px-6 py-4 text-right font-black text-indigo-700 text-lg tabular-nums">{l.nb_votes}</td>
          <td className="px-6 py-4">
            <ScoreBar pct={l.pourcentage ?? 0} color={PALETTE[i % PALETTE.length]} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

/* ═══════════════════════════════════════════════════════════
   BAR CHART — labels et données selon le type
═══════════════════════════════════════════════════════════ */
const buildChartData = (resultats) => {
  const type = resultats.election.type_scrutin;

  if (type === "LISTE") {
    return {
      labels: resultats.listes.map(l => l.nom_liste),
      datasets: [{
        label: "Votes",
        data: resultats.listes.map(l => l.nb_votes),
        backgroundColor: PALETTE.slice(0, resultats.listes.length),
        borderRadius: 10,
        borderSkipped: false,
      }],
    };
  }

  // UNINOMINAL : nom simple  |  BINOMINAL : titulaire
  return {
    labels: resultats.candidats.map(c => c.titulaire ?? c.nom),
    datasets: [{
      label: "Votes",
      data: resultats.candidats.map(c => c.nb_votes),
      backgroundColor: PALETTE.slice(0, resultats.candidats.length),
      borderRadius: 10,
      borderSkipped: false,
    }],
  };
};

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function Resultats() {
  const [elections, setElections] = useState([]);
  const [selected,  setSelected]  = useState(localStorage.getItem("activeElectionId") || "");
  const [resultats, setResultats] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  useEffect(() => { fetchElections(); }, []);
  useEffect(() => {
    if (selected) fetchResultats(selected);
    else setResultats(null);
  }, [selected]);

  const fetchElections = async () => {
    try {
      const r = await api.get("/elections");
      setElections(r.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  const fetchResultats = async (id) => {
    try {
      setLoading(true);
      setError(null);
      setResultats(null);
      const r = await api.get(`/elections/${id}/resultats`);
      setResultats(r.data);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de charger les résultats.");
    } finally {
      setLoading(false);
    }
  };

  const type     = resultats?.election?.type_scrutin ?? "";
  const typeMeta = TYPE_META[type] ?? { label: type, icon: <FiBarChart2 />, cls: "bg-gray-100 text-gray-700" };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      <AdminElectionSidebar active="elections" />

      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-indigo-900 tracking-tight">Résultats</h2>
          <p className="text-indigo-500 mt-1 text-sm font-medium">Consultez les résultats détaillés de vos élections</p>
        </div>

        {/* Sélecteur */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 mb-8">
          <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
            Sélectionner une élection
          </label>
          <div className="relative max-w-md">
            <select
              value={selected}
              onChange={e => {
                setSelected(e.target.value);
                localStorage.setItem("activeElectionId", e.target.value);
              }}
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
              <p className="text-indigo-500 font-medium">Chargement des résultats…</p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Placeholder */}
        {!loading && !selected && !error && (
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
              <span className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">
                {typeMeta.icon}
                {typeMeta.label}
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
                    <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide">Participation</p>
                    <p className="text-3xl font-black text-blue-600">{resultats.tauxParticipation}%</p>
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

            {/* Bar chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
              <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-5">Répartition des votes</h4>
              <Bar
                data={buildChartData(resultats)}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: "#4f46e5",
                      padding: 12,
                      cornerRadius: 8,
                      titleFont: { weight: "bold" },
                    },
                  },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { weight: "600" } } },
                    y: { grid: { color: "#f3f4f6" }, ticks: { font: { size: 12 } } },
                  },
                }}
              />
            </div>

            {/* Tableau classement */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-indigo-50">
                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Classement</h4>
              </div>

              {type === "UNINOMINAL" && <TableUninominal candidats={resultats.candidats} />}
              {type === "BINOMINAL"  && <TableBinominal  candidats={resultats.candidats} />}
              {type === "LISTE"      && <TableListe       listes={resultats.listes}       />}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}


