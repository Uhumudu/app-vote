// src/pages/elcteurP/ResultatsElecteur.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiAward, FiUsers, FiBarChart2, FiCheckCircle } from "react-icons/fi";
import api from "../../services/api";

export default function ResultatsElecteur() {
  const { electionId } = useParams();
  const navigate       = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/Login"); return; }

    api.get(`/elections/${electionId}/resultats`)
      .then(res => setData(res.data))
      .catch(err => {
        console.error("❌ Erreur résultats:", err.response?.data || err.message);
        setError("Impossible de charger les résultats.");
      })
      .finally(() => setLoading(false));
  }, [electionId]);

  // ── Chargement ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-indigo-500 font-medium">Chargement des résultats…</p>
      </div>
    </div>
  );

  // ── Erreur ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-100 max-w-sm">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button
          onClick={() => navigate("/DashboardElecteur")}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );

  const { election, totalVotes, totalElecteurs, tauxParticipation, candidats, listes } = data;

  // Utilise les listes si scrutin de liste, sinon les candidats
  const isListeScrutin = listes && listes.length > 0;
  const resultats      = isListeScrutin ? listes : candidats;

  // Couleurs podium
  const podiumColors = [
    "bg-amber-100 text-amber-600 border-amber-200",   // 1er
    "bg-gray-100 text-gray-500 border-gray-200",       // 2ème
    "bg-orange-100 text-orange-500 border-orange-200", // 3ème
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur border-b border-indigo-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate("/DashboardElecteur")}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-all"
        >
          <FiArrowLeft /> Retour
        </button>
        <div className="h-5 w-px bg-indigo-200" />
        <span className="text-2xl font-black text-indigo-700">🗳 eVote</span>
        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-semibold">Résultats</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* ── Titre élection ────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <FiCheckCircle /> Élection terminée
          </div>
          <h1 className="text-3xl font-black text-indigo-900">{election.titre}</h1>
          <p className="text-indigo-400 text-sm mt-1">
            {new Date(election.date_debut).toLocaleDateString("fr-FR")} → {new Date(election.date_fin).toLocaleDateString("fr-FR")}
            {election.type && <span className="ml-2 bg-indigo-100 text-indigo-500 px-2 py-0.5 rounded-full">{election.type}</span>}
          </p>
        </div>

        {/* ── KPI Participation ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
            <FiUsers className="mx-auto text-indigo-400 text-xl mb-2" />
            <p className="text-2xl font-black" style={{color:"#4338ca"}}>{totalElecteurs}</p>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Inscrits</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
            <FiBarChart2 className="mx-auto text-emerald-400 text-xl mb-2" />
            <p className="text-2xl font-black" style={{color:"#059669"}}>{totalVotes}</p>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Votes exprimés</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
            <FiAward className="mx-auto text-amber-400 text-xl mb-2" />
            <p className="text-2xl font-black" style={{color:"#f59e0b"}}>{tauxParticipation}%</p>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Participation</p>
          </div>
        </div>

        {/* ── Résultats ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-50">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">
              {isListeScrutin ? "Résultats par liste" : "Résultats par candidat"}
            </h2>
          </div>

          {resultats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-indigo-900 font-bold">Aucun résultat disponible</p>
              <p className="text-indigo-400 text-sm mt-1">Les données ne sont pas encore disponibles.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {resultats.map((item, index) => {
                const nom        = isListeScrutin ? item.nom_liste : item.nom;
                const nbVotes    = item.nb_votes;
                const pourcentage = parseFloat(item.pourcentage) || 0;
                const isWinner   = index === 0;

                return (
                  <li key={isListeScrutin ? item.id_liste : item.id_candidat}
                      className={`px-6 py-5 flex items-center gap-4 ${isWinner ? "bg-amber-50/50" : ""}`}>

                    {/* Rang */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border
                      ${podiumColors[index] || "bg-indigo-50 text-indigo-400 border-indigo-100"}`}>
                      {index + 1}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-800 truncate">{nom}</p>
                        {isWinner && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full border border-amber-200">
                            🏆 Vainqueur
                          </span>
                        )}
                      </div>

                      {/* Infos candidat supplémentaires */}
                      {!isListeScrutin && (item.parti || item.age) && (
                        <p className="text-xs text-gray-400 mb-2">
                          {item.parti && <span>{item.parti}</span>}
                          {item.parti && item.age && <span> · </span>}
                          {item.age && <span>{item.age} ans</span>}
                        </p>
                      )}

                      {/* Membres de liste */}
                      {isListeScrutin && item.candidats && (
                        <p className="text-xs text-gray-400 mb-2 truncate">{item.candidats}</p>
                      )}

                      {/* Barre de progression */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isWinner ? "bg-amber-400" : "bg-indigo-400"}`}
                          style={{ width: `${pourcentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-black" style={{color: isWinner ? "#f59e0b" : "#4338ca"}}>
                        {pourcentage}%
                      </p>
                      <p className="text-xs text-gray-400">{nbVotes} vote{nbVotes > 1 ? "s" : ""}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Bouton retour bas ─────────────────────────────────────────────── */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/DashboardElecteur")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all font-semibold text-sm"
          >
            <FiArrowLeft /> Retour au tableau de bord
          </button>
        </div>

      </main>
    </div>
  );
}
