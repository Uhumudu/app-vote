// src/pages/elcteurP/DashboardElecteur.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiCalendar, FiCheckCircle, FiClock, FiLock, FiChevronRight } from "react-icons/fi";
import api from "../../services/api";

export default function ElecteurDashboard() {
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [loading, setLoading]     = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/Login");
      return;
    }
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/electeur/elections");
      setElections(res.data);
    } catch (err) {
      console.error("❌ Erreur fetchElections:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/Login");
  };

  const normalizeStatut = (statut) => statut?.toUpperCase().trim();

  const getStatutBadge = (election) => {
    const statut = normalizeStatut(election.statut);
    if (election.a_vote && statut !== "TERMINEE") {
      return { label: "Vote effectué", color: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: <FiCheckCircle /> };
    }
    if (statut === "EN_COURS" && !election.a_vote) {
      return { label: "En cours – Votez !", color: "bg-indigo-100 text-indigo-700 border border-indigo-200 animate-pulse", icon: <FiClock /> };
    }
    if (statut === "TERMINEE") {
      return { label: "Terminée", color: "bg-gray-100 text-gray-500 border border-gray-200", icon: <FiLock /> };
    }
    return { label: "À venir", color: "bg-amber-100 text-amber-700 border border-amber-200", icon: <FiCalendar /> };
  };

  const canVote       = (e) => normalizeStatut(e.statut) === "EN_COURS" && !e.a_vote;
  const canSeeResults = (e) => normalizeStatut(e.statut) === "TERMINEE";

  const stats = {
    total:     elections.length,
    enCours:   elections.filter(e => normalizeStatut(e.statut) === "EN_COURS").length,
    votes:     elections.filter(e => e.a_vote).length,
    terminees: elections.filter(e => normalizeStatut(e.statut) === "TERMINEE").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ===== NAVBAR ===== */}
      <header className="bg-white/80 backdrop-blur border-b border-indigo-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-indigo-700">🗳 eVote</span>
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-semibold">Espace électeur</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
              {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
            </div>
            <span className="font-medium">{user.prenom} {user.nom}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <FiLogOut /> Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Salutation */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-indigo-900">
            Bonjour, {user.prenom} 👋
          </h1>
          <p className="text-indigo-500 mt-1">Voici vos élections auxquelles vous êtes inscrit(e).</p>
        </div>

        {/* KPI Cards — couleurs forcées via style inline */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
            <p className="text-3xl font-black" style={{ color: "#4338ca" }}>{stats.total}</p>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Élections</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
            <p className="text-3xl font-black" style={{ color: "#f59e0b" }}>{stats.enCours}</p>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">En cours</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
            <p className="text-3xl font-black" style={{ color: "#059669" }}>{stats.votes}</p>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Votes effectués</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
            <p className="text-3xl font-black" style={{ color: "#9ca3af" }}>{stats.terminees}</p>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Terminées</p>
          </div>
        </div>

        {/* Liste élections */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-50">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Mes élections</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-indigo-400 font-medium">Chargement...</p>
            </div>
          ) : elections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <FiCalendar className="text-3xl text-indigo-400" />
              </div>
              <p className="text-indigo-900 font-bold">Aucune élection disponible</p>
              <p className="text-indigo-400 text-sm mt-1">Vous n'êtes inscrit(e) à aucune élection pour l'instant.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {elections.map((election) => {
                const badge  = getStatutBadge(election);
                const statut = normalizeStatut(election.statut);

                return (
                  <li key={election.id_election} className="px-6 py-5 flex items-center justify-between hover:bg-indigo-50/40 transition-all">
                    <div className="flex items-center gap-4 flex-1 min-w-0">

                      {/* Icône statut */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg
                        ${statut === "EN_COURS" && !election.a_vote ? "bg-indigo-100 text-indigo-600" :
                          election.a_vote                           ? "bg-emerald-100 text-emerald-600" :
                          statut === "TERMINEE"                     ? "bg-gray-100 text-gray-400" :
                                                                      "bg-amber-100 text-amber-600"}`}>
                        {statut === "EN_COURS" && !election.a_vote ? <FiClock /> :
                         election.a_vote                           ? <FiCheckCircle /> :
                         statut === "TERMINEE"                     ? <FiLock /> : <FiCalendar />}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{election.titre}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
                            {badge.icon} {badge.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(election.date_debut).toLocaleDateString("fr-FR")} →{" "}
                            {new Date(election.date_fin).toLocaleDateString("fr-FR")}
                          </span>
                          {election.type && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                              {election.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex-shrink-0">
                      {canVote(election) && (
                        <button
                          onClick={() => navigate(`/electeur/voter/${election.id_election}`)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm shadow-md shadow-indigo-200"
                        >
                          Voter <FiChevronRight />
                        </button>
                      )}

                      {canSeeResults(election) && (
                        <button
                          onClick={() => navigate(`/electeur/resultats/${election.id_election}`)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all font-semibold text-sm"
                        >
                          Résultats <FiChevronRight />
                        </button>
                      )}

                      {election.a_vote && statut === "EN_COURS" && (
                        <span className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-semibold text-sm border border-emerald-200">
                          <FiCheckCircle /> Voté
                        </span>
                      )}

                      {statut === "PLANIFIEE" && (
                        <span className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-semibold text-sm border border-amber-200">
                          <FiCalendar /> À venir
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































// // src/pages/elcteurP/DashboardElecteur.jsx
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { FiLogOut, FiCalendar, FiCheckCircle, FiClock, FiLock, FiChevronRight } from "react-icons/fi";
// import api from "../../services/api";

// export default function ElecteurDashboard() {
//   const navigate = useNavigate();
//   const [elections, setElections] = useState([]);
//   const [loading, setLoading]     = useState(true);
//   const user = JSON.parse(localStorage.getItem("user") || "{}");

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       navigate("/Login");
//       return;
//     }
//     fetchElections();
//   }, []);

//   const fetchElections = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/electeur/elections");
//       setElections(res.data);
//     } catch (err) {
//       console.error("❌ Erreur fetchElections:", err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.clear();
//     navigate("/Login");
//   };

//   // ✅ Normalise le statut pour éviter les problèmes de casse
//   const normalizeStatut = (statut) => statut?.toUpperCase().trim();

//   const getStatutBadge = (election) => {
//     const statut = normalizeStatut(election.statut);

//     if (election.a_vote && statut !== "TERMINEE") {
//       return { label: "Vote effectué", color: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: <FiCheckCircle /> };
//     }
//     if (statut === "EN_COURS" && !election.a_vote) {
//       return { label: "En cours – Votez !", color: "bg-indigo-100 text-indigo-700 border border-indigo-200 animate-pulse", icon: <FiClock /> };
//     }
//     if (statut === "TERMINEE") {
//       return { label: "Terminée", color: "bg-gray-100 text-gray-500 border border-gray-200", icon: <FiLock /> };
//     }
//     return { label: "À venir", color: "bg-amber-100 text-amber-700 border border-amber-200", icon: <FiCalendar /> };
//   };

//   // ✅ Normalisation dans les conditions aussi
//   const canVote       = (e) => normalizeStatut(e.statut) === "EN_COURS" && !e.a_vote;
//   const canSeeResults = (e) => normalizeStatut(e.statut) === "TERMINEE";

//   const stats = {
//     total:     elections.length,
//     enCours:   elections.filter(e => normalizeStatut(e.statut) === "EN_COURS").length,
//     votes:     elections.filter(e => e.a_vote).length,
//     terminees: elections.filter(e => normalizeStatut(e.statut) === "TERMINEE").length,
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ===== NAVBAR ===== */}
//       <header className="bg-white/80 backdrop-blur border-b border-indigo-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
//         <div className="flex items-center gap-3">
//           <span className="text-2xl font-black text-indigo-700">🗳 eVote</span>
//           <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-semibold">Espace électeur</span>
//         </div>
//         <div className="flex items-center gap-4">
//           <div className="flex items-center gap-2 text-sm text-gray-600">
//             <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
//               {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
//             </div>
//             <span className="font-medium">{user.prenom} {user.nom}</span>
//           </div>
//           <button
//             onClick={handleLogout}
//             className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium"
//           >
//             <FiLogOut /> Déconnexion
//           </button>
//         </div>
//       </header>

//       <main className="max-w-5xl mx-auto px-6 py-10">

//         {/* Salutation */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-black text-indigo-900">
//             Bonjour, {user.prenom} 👋
//           </h1>
//           <p className="text-indigo-500 mt-1">Voici vos élections auxquelles vous êtes inscrit(e).</p>
//         </div>

//         {/* KPI Cards */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
//           <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
//             <p className="text-3xl font-black text-indigo-700">{stats.total}</p>
//             <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Élections</p>
//           </div>
//           <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
//             <p className="text-3xl font-black text-amber-500">{stats.enCours}</p>
//             <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">En cours</p>
//           </div>
//           <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
//             <p className="text-3xl font-black text-emerald-600">{stats.votes}</p>
//             <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Votes effectués</p>
//           </div>
//           <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-center">
//             <p className="text-3xl font-black text-gray-400">{stats.terminees}</p>
//             <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">Terminées</p>
//           </div>
//         </div>

//         {/* Liste élections */}
//         <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
//           <div className="px-6 py-4 border-b border-indigo-50">
//             <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Mes élections</h2>
//           </div>

//           {loading ? (
//             <div className="flex flex-col items-center justify-center py-16 gap-4">
//               <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
//               <p className="text-indigo-400 font-medium">Chargement...</p>
//             </div>
//           ) : elections.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-16 text-center">
//               <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
//                 <FiCalendar className="text-3xl text-indigo-400" />
//               </div>
//               <p className="text-indigo-900 font-bold">Aucune élection disponible</p>
//               <p className="text-indigo-400 text-sm mt-1">Vous n'êtes inscrit(e) à aucune élection pour l'instant.</p>
//             </div>
//           ) : (
//             <ul className="divide-y divide-gray-50">
//               {elections.map((election) => {
//                 const badge  = getStatutBadge(election);
//                 const statut = normalizeStatut(election.statut);

//                 return (
//                   <li key={election.id_election} className="px-6 py-5 flex items-center justify-between hover:bg-indigo-50/40 transition-all">
//                     <div className="flex items-center gap-4 flex-1 min-w-0">

//                       {/* Icône statut */}
//                       <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg
//                         ${statut === "EN_COURS" && !election.a_vote ? "bg-indigo-100 text-indigo-600" :
//                           election.a_vote                           ? "bg-emerald-100 text-emerald-600" :
//                           statut === "TERMINEE"                     ? "bg-gray-100 text-gray-400" :
//                                                                       "bg-amber-100 text-amber-600"}`}>
//                         {statut === "EN_COURS" && !election.a_vote ? <FiClock /> :
//                          election.a_vote                           ? <FiCheckCircle /> :
//                          statut === "TERMINEE"                     ? <FiLock /> : <FiCalendar />}
//                       </div>

//                       {/* Infos */}
//                       <div className="flex-1 min-w-0">
//                         <p className="font-bold text-gray-800 truncate">{election.titre}</p>
//                         <div className="flex items-center gap-3 mt-1 flex-wrap">
//                           <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
//                             {badge.icon} {badge.label}
//                           </span>
//                           <span className="text-xs text-gray-400">
//                             {new Date(election.date_debut).toLocaleDateString("fr-FR")} →{" "}
//                             {new Date(election.date_fin).toLocaleDateString("fr-FR")}
//                           </span>
//                           {election.type && (
//                             <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
//                               {election.type}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </div>

//                     {/* ✅ Actions — routes corrigées */}
//                     <div className="ml-4 flex-shrink-0">
//                       {canVote(election) && (
//                         <button
//                           onClick={() => navigate(`/electeur/voter/${election.id_election}`)}
//                           className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm shadow-md shadow-indigo-200"
//                         >
//                           Voter <FiChevronRight />
//                         </button>
//                       )}

//                       {/* ✅ CORRIGÉ : navigue vers /electeur/resultats/:id (composant électeur dédié) */}
//                       {canSeeResults(election) && (
//                         <button
//                           onClick={() => navigate(`/electeur/resultats/${election.id_election}`)}
//                           className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all font-semibold text-sm"
//                         >
//                           Résultats <FiChevronRight />
//                         </button>
//                       )}

//                       {election.a_vote && statut === "EN_COURS" && (
//                         <span className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-semibold text-sm border border-emerald-200">
//                           <FiCheckCircle /> Voté
//                         </span>
//                       )}

//                       {statut === "PLANIFIEE" && (
//                         <span className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-semibold text-sm border border-amber-200">
//                           <FiCalendar /> À venir
//                         </span>
//                       )}
//                     </div>
//                   </li>
//                 );
//               })}
//             </ul>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }




