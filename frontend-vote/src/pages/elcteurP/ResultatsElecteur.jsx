// src/pages/elcteurP/ResultatsElecteur.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiAward, FiUsers, FiBarChart2, FiCheckCircle, FiRepeat } from "react-icons/fi";
import api from "../../services/api";

export default function ResultatsElecteur() {
  const { electionId } = useParams();
  const navigate       = useNavigate();

  const [data,      setData]      = useState(null);
  const [dataTours, setDataTours] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/Login"); return; }

    const fetchAll = async () => {
      try {
        const res = await api.get(`/elections/${electionId}/resultats`);
        setData(res.data);
        if (res.data?.election?.type === "LISTE") {
          try {
            const tourRes = await api.get(`/elections/${electionId}/resultats-tours`);
            setDataTours(tourRes.data);
          } catch { /* non bloquant */ }
        }
      } catch (err) {
        setError("Impossible de charger les résultats.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [electionId]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-10 flex flex-col items-center gap-4 shadow-lg">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-indigo-500 font-medium text-sm">Chargement des résultats…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-100 max-w-sm">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button
          onClick={() => navigate("/DashboardElecteur")}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );

  const { election, totalVotes, totalElecteurs, tauxParticipation, candidats, listes } = data;
  const isListeScrutin = election?.type === "LISTE";
  const resultats      = isListeScrutin ? listes : candidats;
  const nbTours        = dataTours?.tours?.length || 1;

  const podiumColors = [
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-gray-100 text-gray-500 border-gray-200",
    "bg-orange-100 text-orange-600 border-orange-200",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate("/DashboardElecteur")}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
        >
          <FiArrowLeft size={15} /> Retour
        </button>
        <div className="w-px h-5 bg-indigo-200" />
        <span className="text-lg font-black text-indigo-700 tracking-tight">🗳 eVote</span>
        <span className="text-[11px] bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
          Résultats
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* ── TITRE ──────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <FiCheckCircle size={11} /> Élection terminée
          </div>
          <h1 className="text-3xl font-black text-indigo-900 tracking-tight leading-tight">{election.titre}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <p className="text-indigo-400 text-sm">
              {new Date(election.date_debut).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
              {" → "}
              {new Date(election.date_fin).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
            {election.type && (
              <span className="bg-indigo-100 text-indigo-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {election.type}
              </span>
            )}
            {isListeScrutin && nbTours > 1 && (
              <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <FiRepeat size={10} /> {nbTours} tours
              </span>
            )}
          </div>
        </div>

        {/* ── KPI ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <FiUsers />, value: totalElecteurs, label: "Inscrits",        color: "#4338ca", bg: "bg-indigo-50",  border: "border-indigo-100" },
            { icon: <FiBarChart2 />, value: totalVotes,    label: "Votes exprimés", color: "#059669", bg: "bg-emerald-50", border: "border-emerald-100" },
            { icon: <FiAward />, value: `${tauxParticipation}%`, label: "Participation", color: "#d97706", bg: "bg-amber-50",   border: "border-amber-100" },
          ].map((kpi, i) => (
            <div key={i} className={`${kpi.bg} rounded-2xl border ${kpi.border} p-5 text-center`}>
              <div className="flex justify-center mb-2" style={{ color: kpi.color }}>{kpi.icon}</div>
              <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── HISTORIQUE DES TOURS ────────────────────────────────────────── */}
        {isListeScrutin && dataTours?.tours?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiRepeat className="text-indigo-400" size={14} />
                <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Historique des tours</h2>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-600 font-bold px-2.5 py-1 rounded-full">
                {dataTours.tours.length} tour{dataTours.tours.length > 1 ? "s" : ""}
              </span>
            </div>

            {dataTours.tours.map((tour, idx) => (
              <div
                key={tour.numero_tour}
                className={`px-6 py-5 ${idx < dataTours.tours.length - 1 ? "border-b border-gray-50" : ""} ${
                  tour.statut === "GAGNANT_TROUVE" ? "bg-amber-50/40" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                    tour.statut === "GAGNANT_TROUVE" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
                  }`}>
                    {tour.numero_tour}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">Tour {tour.numero_tour}</p>
                      {tour.statut === "GAGNANT_TROUVE" && (
                        <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                          🏆 Décisif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{tour.total_votes} vote{tour.total_votes > 1 ? "s" : ""} exprimé{tour.total_votes > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {tour.votes.map((v, i) => {
                    const isW  = tour.statut === "GAGNANT_TROUVE" && i === 0;
                    const isEl = v.pourcentage < 5;
                    const isF  = v.pourcentage >= 5 && v.pourcentage <= 10;
                    return (
                      <div key={v.liste_id} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-600 w-28 truncate flex-shrink-0">{v.nom_liste}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isW ? "bg-amber-400" : isEl ? "bg-red-300" : isF ? "bg-orange-300" : "bg-indigo-400"
                            }`}
                            style={{ width: `${v.pourcentage}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold w-10 text-right flex-shrink-0 ${
                          isW ? "text-amber-600" : isEl ? "text-red-500" : "text-gray-600"
                        }`}>
                          {v.pourcentage}%
                        </span>
                        {isW  && <span className="text-xs text-amber-600 font-semibold flex-shrink-0">🏆</span>}
                        {isEl && !isW && <span className="text-xs text-red-400 flex-shrink-0">Éliminée</span>}
                        {isF  && !isW && <span className="text-xs text-orange-400 flex-shrink-0">Fusion</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {dataTours.sieges?.length > 0 && (
              <div className="px-6 py-5 bg-amber-50/60 border-t border-amber-100">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <FiAward size={12} /> Répartition des sièges
                </p>
                <div className="flex flex-wrap gap-3">
                  {dataTours.sieges.map((s, i) => (
                    <div key={s.liste_id} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border ${
                      i === 0 ? "bg-amber-100 border-amber-200" : "bg-white border-gray-200"
                    }`}>
                      {i === 0 && <span>🏆</span>}
                      <div>
                        <p className="text-sm font-bold text-gray-800">{s.nom_liste}</p>
                        <p className="text-xs text-gray-400">{i === 0 ? "Bonus + proportion" : "Proportion"}</p>
                      </div>
                      <div className="ml-2 text-center">
                        <p className={`text-xl font-black ${i === 0 ? "text-amber-600" : "text-indigo-600"}`}>{s.nb_sieges}</p>
                        <p className="text-xs text-gray-400">siège{s.nb_sieges > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CLASSEMENT FINAL ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              {isListeScrutin ? "Résultats finaux par liste" : "Résultats par candidat"}
            </h2>
          </div>

          {resultats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <p className="text-gray-700 font-bold">Aucun résultat disponible</p>
              <p className="text-gray-400 text-sm mt-1">Les données ne sont pas encore disponibles.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {resultats.map((item, index) => {
                const nom         = isListeScrutin ? item.nom_liste : item.nom;
                const nbVotes     = item.nb_votes;
                const pourcentage = parseFloat(item.pourcentage) || 0;
                const isWinner    = index === 0;
                const siegeItem   = isListeScrutin && dataTours?.sieges
                  ? dataTours.sieges.find(s => s.liste_id === item.id_liste) : null;

                return (
                  <li
                    key={isListeScrutin ? item.id_liste : item.id_candidat}
                    className={`px-6 py-5 flex items-center gap-4 transition-colors ${isWinner ? "bg-amber-50/40" : "hover:bg-gray-50/60"}`}
                  >
                    {/* Rang */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border ${
                      podiumColors[index] || "bg-indigo-50 text-indigo-400 border-indigo-100"
                    }`}>
                      {index + 1}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="font-bold text-gray-800 truncate">{nom}</p>
                        {isWinner && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                            🏆 Vainqueur
                          </span>
                        )}
                        {siegeItem && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            isWinner ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                          }`}>
                            <FiAward className="inline mr-1" size={9} />{siegeItem.nb_sieges} siège{siegeItem.nb_sieges > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {!isListeScrutin && (item.parti || item.age) && (
                        <p className="text-xs text-gray-400 mb-2">
                          {item.parti}{item.parti && item.age && " · "}{item.age && `${item.age} ans`}
                        </p>
                      )}
                      {isListeScrutin && item.candidats && (
                        <p className="text-xs text-gray-400 mb-2 truncate">{item.candidats}</p>
                      )}

                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isWinner ? "bg-amber-400" : "bg-indigo-400"}`}
                          style={{ width: `${pourcentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-black" style={{ color: isWinner ? "#d97706" : "#4338ca" }}>
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

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/DashboardElecteur")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 active:scale-95 transition-all font-semibold text-sm shadow-sm"
          >
            <FiArrowLeft size={14} /> Retour au tableau de bord
          </button>
        </div>

      </main>
    </div>
  );
}










































// // src/pages/elcteurP/ResultatsElecteur.jsx
// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { FiArrowLeft, FiAward, FiUsers, FiBarChart2, FiCheckCircle, FiRepeat } from "react-icons/fi";
// import api from "../../services/api";

// export default function ResultatsElecteur() {
//   const { electionId } = useParams();
//   const navigate       = useNavigate();

//   const [data,      setData]      = useState(null);
//   const [dataTours, setDataTours] = useState(null);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState(null);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) { navigate("/Login"); return; }

//     const fetchAll = async () => {
//       try {
//         // Résultats généraux (existants)
//         const res = await api.get(`/elections/${electionId}/resultats`);
//         setData(res.data);

//         // Résultats par tour si scrutin LISTE
//         if (res.data?.election?.type === "LISTE") {
//           try {
//             const tourRes = await api.get(`/elections/${electionId}/resultats-tours`);
//             setDataTours(tourRes.data);
//           } catch {
//             // Non bloquant si la route n'existe pas encore
//           }
//         }
//       } catch (err) {
//         console.error("❌ Erreur résultats:", err.response?.data || err.message);
//         setError("Impossible de charger les résultats.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAll();
//   }, [electionId]);

//   // ─── Chargement ───────────────────────────────────────────────────────────
//   if (loading) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
//       <div className="flex flex-col items-center gap-4">
//         <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
//         <p className="text-indigo-500 font-medium">Chargement des résultats…</p>
//       </div>
//     </div>
//   );

//   // ─── Erreur ───────────────────────────────────────────────────────────────
//   if (error) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
//       <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-100 max-w-sm">
//         <p className="text-red-500 font-bold mb-4">{error}</p>
//         <button
//           onClick={() => navigate("/DashboardElecteur")}
//           className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all"
//         >
//           Retour au tableau de bord
//         </button>
//       </div>
//     </div>
//   );

//   const { election, totalVotes, totalElecteurs, tauxParticipation, candidats, listes } = data;

//   const isListeScrutin = election?.type === "LISTE";
//   const resultats      = isListeScrutin ? listes : candidats;

//   const podiumColors = [
//     "bg-amber-100 text-amber-600 border-amber-200",
//     "bg-gray-100 text-gray-500 border-gray-200",
//     "bg-orange-100 text-orange-500 border-orange-200",
//   ];

//   // Nombre de tours joués
//   const nbTours = dataTours?.tours?.length || 1;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ─── Navbar ─────────────────────────────────────────────────────── */}
//       <header className="bg-white/80 backdrop-blur border-b border-indigo-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
//         <button
//           onClick={() => navigate("/DashboardElecteur")}
//           className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-all"
//         >
//           <FiArrowLeft /> Retour
//         </button>
//         <div className="h-5 w-px bg-indigo-200" />
//         <span className="text-2xl font-black text-indigo-700">🗳 eVote</span>
//         <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-semibold">Résultats</span>
//       </header>

//       <main className="max-w-3xl mx-auto px-6 py-10">

//         {/* ─── Titre élection ────────────────────────────────────────────── */}
//         <div className="mb-8">
//           <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full mb-3">
//             <FiCheckCircle /> Élection terminée
//           </div>
//           <h1 className="text-3xl font-black text-indigo-900">{election.titre}</h1>
//           <p className="text-indigo-400 text-sm mt-1">
//             {new Date(election.date_debut).toLocaleDateString("fr-FR")} → {new Date(election.date_fin).toLocaleDateString("fr-FR")}
//             {election.type && (
//               <span className="ml-2 bg-indigo-100 text-indigo-500 px-2 py-0.5 rounded-full">{election.type}</span>
//             )}
//             {isListeScrutin && nbTours > 1 && (
//               <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
//                 <FiRepeat size={11} /> {nbTours} tours
//               </span>
//             )}
//           </p>
//         </div>

//         {/* ─── KPI Participation ────────────────────────────────────────── */}
//         <div className="grid grid-cols-3 gap-4 mb-8">
//           <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
//             <FiUsers className="mx-auto text-indigo-400 text-xl mb-2" />
//             <p className="text-2xl font-black" style={{ color: "#4338ca" }}>{totalElecteurs}</p>
//             <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Inscrits</p>
//           </div>
//           <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
//             <FiBarChart2 className="mx-auto text-emerald-400 text-xl mb-2" />
//             <p className="text-2xl font-black" style={{ color: "#059669" }}>{totalVotes}</p>
//             <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Votes exprimés</p>
//           </div>
//           <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
//             <FiAward className="mx-auto text-amber-400 text-xl mb-2" />
//             <p className="text-2xl font-black" style={{ color: "#f59e0b" }}>{tauxParticipation}%</p>
//             <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Participation</p>
//           </div>
//         </div>

//         {/* ─── HISTORIQUE DES TOURS (scrutin LISTE uniquement) ─────────── */}
//         {isListeScrutin && dataTours?.tours?.length > 0 && (
//           <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden mb-6">
//             <div className="px-6 py-4 border-b border-indigo-50 flex items-center gap-2">
//               <FiRepeat className="text-indigo-400" />
//               <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">
//                 Historique des tours
//               </h2>
//               <span className="ml-auto text-xs bg-indigo-100 text-indigo-600 font-bold px-2 py-0.5 rounded-full">
//                 {dataTours.tours.length} tour{dataTours.tours.length > 1 ? "s" : ""}
//               </span>
//             </div>

//             {dataTours.tours.map((tour, idx) => (
//               <div
//                 key={tour.numero_tour}
//                 className={`px-6 py-5 ${idx < dataTours.tours.length - 1 ? "border-b border-gray-50" : ""} ${
//                   tour.statut === "GAGNANT_TROUVE" ? "bg-amber-50/40" : ""
//                 }`}
//               >
//                 {/* En-tête du tour */}
//                 <div className="flex items-center gap-3 mb-3">
//                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${
//                     tour.statut === "GAGNANT_TROUVE"
//                       ? "bg-amber-100 text-amber-700"
//                       : "bg-indigo-100 text-indigo-700"
//                   }`}>
//                     {tour.numero_tour}
//                   </div>
//                   <div>
//                     <p className="text-sm font-bold text-gray-800">Tour {tour.numero_tour}</p>
//                     <p className="text-xs text-gray-400">{tour.total_votes} vote{tour.total_votes > 1 ? "s" : ""} exprimé{tour.total_votes > 1 ? "s" : ""}</p>
//                   </div>
//                   {tour.statut === "GAGNANT_TROUVE" && (
//                     <span className="ml-auto flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
//                       🏆 Tour décisif
//                     </span>
//                   )}
//                 </div>

//                 {/* Barres de résultats */}
//                 <div className="space-y-2.5">
//                   {tour.votes.map((v, i) => {
//                     const isWinner = tour.statut === "GAGNANT_TROUVE" && i === 0;
//                     const isElim   = v.pourcentage < 5;
//                     const isFusion = v.pourcentage >= 5 && v.pourcentage <= 10;
//                     return (
//                       <div key={v.liste_id} className="flex items-center gap-3">
//                         <span className="text-sm font-medium text-gray-700 w-28 truncate flex-shrink-0">
//                           {v.nom_liste}
//                         </span>
//                         <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
//                           <div
//                             className={`h-full rounded-full transition-all duration-500 ${
//                               isWinner ? "bg-amber-400"
//                               : isElim  ? "bg-red-300"
//                               : isFusion ? "bg-orange-300"
//                               : "bg-indigo-400"
//                             }`}
//                             style={{ width: `${v.pourcentage}%` }}
//                           />
//                         </div>
//                         <span className={`text-sm font-bold w-12 text-right flex-shrink-0 ${
//                           isWinner ? "text-amber-600"
//                           : isElim  ? "text-red-500"
//                           : "text-gray-700"
//                         }`}>
//                           {v.pourcentage}%
//                         </span>
//                         {isElim && !isWinner && (
//                           <span className="text-xs text-red-500 font-semibold flex-shrink-0">Éliminée</span>
//                         )}
//                         {isFusion && !isWinner && (
//                           <span className="text-xs text-orange-500 font-semibold flex-shrink-0">Fusion possible</span>
//                         )}
//                         {isWinner && (
//                           <span className="text-xs text-amber-600 font-semibold flex-shrink-0">🏆 Vainqueur</span>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             ))}

//             {/* Répartition des sièges */}
//             {dataTours.sieges?.length > 0 && (
//               <div className="px-6 py-5 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100">
//                 <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
//                   <FiAward size={13} /> Répartition des sièges
//                 </p>
//                 <div className="flex flex-wrap gap-3">
//                   {dataTours.sieges.map((s, i) => (
//                     <div
//                       key={s.liste_id}
//                       className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
//                         i === 0
//                           ? "bg-amber-100 border-amber-200"
//                           : "bg-white border-gray-200"
//                       }`}
//                     >
//                       {i === 0 && <span className="text-base">🏆</span>}
//                       <div>
//                         <p className="text-sm font-bold text-gray-800">{s.nom_liste}</p>
//                         <p className="text-xs text-gray-400">
//                           {i === 0 ? "Bonus + proportion" : "Proportion"}
//                         </p>
//                       </div>
//                       <div className="ml-2 text-center">
//                         <p className={`text-2xl font-black ${i === 0 ? "text-amber-600" : "text-indigo-600"}`}>
//                           {s.nb_sieges}
//                         </p>
//                         <p className="text-xs text-gray-400">siège{s.nb_sieges > 1 ? "s" : ""}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* ─── Résultats finaux ────────────────────────────────────────────── */}
//         <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
//           <div className="px-6 py-4 border-b border-indigo-50">
//             <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">
//               {isListeScrutin ? "Résultats finaux par liste" : "Résultats par candidat"}
//             </h2>
//           </div>

//           {resultats.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-16 text-center">
//               <p className="text-indigo-900 font-bold">Aucun résultat disponible</p>
//               <p className="text-indigo-400 text-sm mt-1">Les données ne sont pas encore disponibles.</p>
//             </div>
//           ) : (
//             <ul className="divide-y divide-gray-50">
//               {resultats.map((item, index) => {
//                 const nom         = isListeScrutin ? item.nom_liste : item.nom;
//                 const nbVotes     = item.nb_votes;
//                 const pourcentage = parseFloat(item.pourcentage) || 0;
//                 const isWinner    = index === 0;

//                 // Trouver les sièges si scrutin LISTE
//                 const siegeItem = isListeScrutin && dataTours?.sieges
//                   ? dataTours.sieges.find(s => s.liste_id === item.id_liste)
//                   : null;

//                 return (
//                   <li
//                     key={isListeScrutin ? item.id_liste : item.id_candidat}
//                     className={`px-6 py-5 flex items-center gap-4 ${isWinner ? "bg-amber-50/50" : ""}`}
//                   >
//                     {/* Rang */}
//                     <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border
//                       ${podiumColors[index] || "bg-indigo-50 text-indigo-400 border-indigo-100"}`}>
//                       {index + 1}
//                     </div>

//                     {/* Infos */}
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-2 mb-1 flex-wrap">
//                         <p className="font-bold text-gray-800 truncate">{nom}</p>
//                         {isWinner && (
//                           <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full border border-amber-200">
//                             🏆 Vainqueur
//                           </span>
//                         )}
//                         {/* Badge sièges */}
//                         {siegeItem && (
//                           <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
//                             isWinner
//                               ? "bg-amber-50 text-amber-700 border-amber-200"
//                               : "bg-indigo-50 text-indigo-600 border-indigo-100"
//                           }`}>
//                             <FiAward size={10} /> {siegeItem.nb_sieges} siège{siegeItem.nb_sieges > 1 ? "s" : ""}
//                           </span>
//                         )}
//                       </div>

//                       {/* Infos candidat supplémentaires */}
//                       {!isListeScrutin && (item.parti || item.age) && (
//                         <p className="text-xs text-gray-400 mb-2">
//                           {item.parti && <span>{item.parti}</span>}
//                           {item.parti && item.age && <span> · </span>}
//                           {item.age && <span>{item.age} ans</span>}
//                         </p>
//                       )}

//                       {/* Membres de liste */}
//                       {isListeScrutin && item.candidats && (
//                         <p className="text-xs text-gray-400 mb-2 truncate">{item.candidats}</p>
//                       )}

//                       {/* Barre de progression */}
//                       <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//                         <div
//                           className={`h-full rounded-full transition-all duration-700 ${isWinner ? "bg-amber-400" : "bg-indigo-400"}`}
//                           style={{ width: `${pourcentage}%` }}
//                         />
//                       </div>
//                     </div>

//                     {/* Stats */}
//                     <div className="text-right flex-shrink-0">
//                       <p className="text-xl font-black" style={{ color: isWinner ? "#f59e0b" : "#4338ca" }}>
//                         {pourcentage}%
//                       </p>
//                       <p className="text-xs text-gray-400">{nbVotes} vote{nbVotes > 1 ? "s" : ""}</p>
//                     </div>
//                   </li>
//                 );
//               })}
//             </ul>
//           )}
//         </div>

//         {/* ─── Bouton retour bas ───────────────────────────────────────────── */}
//         <div className="mt-8 text-center">
//           <button
//             onClick={() => navigate("/DashboardElecteur")}
//             className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all font-semibold text-sm"
//           >
//             <FiArrowLeft /> Retour au tableau de bord
//           </button>
//         </div>

//       </main>
//     </div>
//   );
// }

