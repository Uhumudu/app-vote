// src/pages/elcteurP/DashboardElecteur.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiCalendar, FiCheckCircle, FiClock, FiLock, FiChevronRight, FiAward } from "react-icons/fi";
import api from "../../services/api";

export default function ElecteurDashboard() {
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const initiales = `${user.prenom?.charAt(0) ?? ""}${user.nom?.charAt(0) ?? ""}`.toUpperCase();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/Login"); return; }
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/electeur/elections");
      setElections(res.data);
    } catch (err) {
      console.error("❌ Erreur fetchElections:", err.response?.data || err.message);
    } finally { setLoading(false); }
  };

  const handleLogout    = () => { localStorage.clear(); navigate("/Login"); };
  const normalizeStatut = (s) => s?.toUpperCase().trim();

  // MySQL renvoie a_vote = 1 (int) et non true (bool) — on gère les deux
  const aVote = (e) => e.a_vote === 1 || e.a_vote === true;

  const getStatutBadge = (election) => {
    const statut = normalizeStatut(election.statut);
    if (aVote(election) && statut !== "TERMINEE")
      return { label: "Vote effectué", color: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: <FiCheckCircle size={11} /> };
    if (statut === "EN_COURS" && !aVote(election))
      return { label: "En cours — Votez !", color: "bg-indigo-100 text-indigo-700 border border-indigo-200", icon: <FiClock size={11} />, pulse: true };
    if (statut === "TERMINEE")
      return { label: "Terminée", color: "bg-gray-100 text-gray-500 border border-gray-200", icon: <FiLock size={11} /> };
    return { label: "À venir", color: "bg-amber-100 text-amber-700 border border-amber-200", icon: <FiCalendar size={11} /> };
  };

  const canVote       = (e) => normalizeStatut(e.statut) === "EN_COURS" && !aVote(e);
  const canSeeResults = (e) => normalizeStatut(e.statut) === "TERMINEE";

  const stats = {
    total:     elections.length,
    enCours:   elections.filter(e => normalizeStatut(e.statut) === "EN_COURS").length,
    votes:     elections.filter(e => aVote(e)).length,
    terminees: elections.filter(e => normalizeStatut(e.statut) === "TERMINEE").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-indigo-700 tracking-tight">🗳 eVote</span>
          <span className="text-[11px] bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Espace électeur
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
              {initiales}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-none">{user.prenom} {user.nom}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all font-medium"
          >
            <FiLogOut size={14} /> Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* ── SALUTATION ─────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-indigo-400 text-sm font-medium mb-1">Bienvenue de retour</p>
          <h1 className="text-3xl font-black text-indigo-900 tracking-tight">
            Bonjour, {user.prenom} 👋
          </h1>
          <p className="text-indigo-400 mt-1.5 text-sm">
            Voici toutes les élections auxquelles vous êtes inscrit·e.
          </p>
        </div>

        {/* ── KPI CARDS ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { value: stats.total,     label: "Élections",       color: "#4338ca", border: "border-indigo-100" },
            { value: stats.enCours,   label: "En cours",        color: "#d97706", border: "border-amber-100"  },
            { value: stats.votes,     label: "Votes effectués", color: "#059669", border: "border-emerald-100" },
            { value: stats.terminees, label: "Terminées",       color: "#9ca3af", border: "border-gray-100"   },
          ].map((kpi, i) => (
            <div key={i} className={`bg-white rounded-2xl border ${kpi.border} p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
              <p className="text-3xl font-black mb-1" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── LISTE DES ÉLECTIONS ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Mes élections</h2>
            <span className="text-xs text-gray-400">{elections.length} au total</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-indigo-400 text-sm font-medium">Chargement…</p>
            </div>
          ) : elections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                <FiCalendar className="text-2xl text-indigo-300" />
              </div>
              <p className="text-gray-700 font-bold">Aucune élection disponible</p>
              <p className="text-gray-400 text-sm mt-1.5 max-w-xs">
                Vous n'êtes inscrit·e à aucune élection pour l'instant.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {elections.map((election) => {
                const badge  = getStatutBadge(election);
                const statut = normalizeStatut(election.statut);
                const voted  = aVote(election); // ← variable locale claire

                return (
                  <li
                    key={election.id_election}
                    className="px-6 py-5 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors duration-150"
                  >
                    {/* Icône statut */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      statut === "EN_COURS" && !voted ? "bg-indigo-100 text-indigo-600"  :
                      voted                          ? "bg-emerald-100 text-emerald-600" :
                      statut === "TERMINEE"           ? "bg-gray-100 text-gray-400"      :
                                                       "bg-amber-100 text-amber-600"
                    }`}>
                      {statut === "EN_COURS" && !voted ? <FiClock size={17} />       :
                       voted                          ? <FiCheckCircle size={17} />  :
                       statut === "TERMINEE"           ? <FiLock size={17} />        :
                                                        <FiCalendar size={17} />}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate mb-1.5">
                        {election.titre}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color} ${badge.pulse ? "animate-pulse" : ""}`}>
                          {badge.icon} {badge.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(election.date_debut).toLocaleDateString("fr-FR")}
                          {" → "}
                          {new Date(election.date_fin).toLocaleDateString("fr-FR")}
                        </span>
                        {election.type && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                            {election.type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      {canVote(election) && (
                        <button
                          onClick={() => navigate(`/electeur/voter/${election.id_election}`)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all font-semibold text-sm shadow-md shadow-indigo-200/60"
                        >
                          Voter <FiChevronRight size={14} />
                        </button>
                      )}

                      {canSeeResults(election) && (
                        <button
                          onClick={() => navigate(`/electeur/resultats/${election.id_election}`)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 active:scale-95 transition-all font-semibold text-sm"
                        >
                          <FiAward size={14} /> Résultats
                        </button>
                      )}

                      {/* Badge "Voté" — affiché quand voté ET élection encore en cours */}
                      {voted && statut === "EN_COURS" && (
                        <span className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-semibold text-sm border border-emerald-200">
                          <FiCheckCircle size={14} /> Voté
                        </span>
                      )}

                      {statut === "PLANIFIEE" && !voted && (
                        <span className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-semibold text-sm border border-amber-200">
                          <FiCalendar size={14} /> À venir
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}



