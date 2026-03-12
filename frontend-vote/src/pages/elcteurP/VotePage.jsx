// src/pages/elcteurP/VotePage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiArrowLeft, FiUser, FiAlertCircle } from "react-icons/fi";
import api from "../../services/api";

export default function VotePage() {
  const { electionId } = useParams();
  const navigate       = useNavigate();

  const [election,   setElection]   = useState(null);
  const [candidats,  setCandidats]  = useState([]);
  const [listes,     setListes]     = useState([]);
  const [selected,   setSelected]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voted,      setVoted]      = useState(false);
  const [error,      setError]      = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/Login"); return; }
    fetchData();
  }, [electionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [elecRes, candidatsRes] = await Promise.all([
        api.get(`/electeur/elections/${electionId}`),           // ✅ corrigé
        api.get(`/electeur/elections/${electionId}/candidats`), // ✅ corrigé
      ]);
      setElection(elecRes.data);
      setCandidats(candidatsRes.data);

      if (elecRes.data.type === "LISTE") {
        const listesRes = await api.get(`/electeur/elections/${electionId}/listes`); // ✅ corrigé
        setListes(listesRes.data);
      }
    } catch (err) {
      setError("Impossible de charger l'élection.");
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMaxSelections = () => {
    if (!election) return 1;
    if (election.type === "BINOMINAL") return 2;
    return 1;
  };

  const handleSelect = (id) => {
    const max = getMaxSelections();
    if (max === 1) {
      setSelected([id]);
      return;
    }
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else {
      if (selected.length < max) {
        setSelected([...selected, id]);
      }
    }
  };

  const handleVote = async () => {
    if (selected.length === 0) {
      setError("Veuillez sélectionner un candidat.");
      return;
    }
    if (election.type === "BINOMINAL" && selected.length < 2) {
      setError("Veuillez sélectionner exactement 2 candidats.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await api.post(`/elections/${electionId}/voter`, {
        candidat_ids: selected,
      });
      setVoted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du vote.");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== LOADING =====
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-indigo-600 font-semibold">Chargement du bulletin de vote...</p>
      </div>
    </div>
  );

  // ===== CONFIRMATION APRÈS VOTE =====
  if (voted) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiCheckCircle className="text-5xl text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Vote enregistré !</h2>
        <p className="text-gray-500 mb-2">
          Votre vote a été pris en compte pour l'élection :
        </p>
        <p className="text-indigo-700 font-bold text-lg mb-6">{election?.titre}</p>

        {/* Récap du choix */}
        <div className="bg-indigo-50 rounded-2xl p-4 mb-8">
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-3">Votre choix</p>
          {election?.type === "LISTE" ? (
            listes.filter(l => selected.includes(l.id_liste)).map(l => (
              <div key={l.id_liste} className="flex items-center gap-3 justify-center">
                <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
                  {l.nom.charAt(0)}
                </div>
                <span className="font-bold text-indigo-900">{l.nom}</span>
              </div>
            ))
          ) : (
            candidats.filter(c => selected.includes(c.id_candidat)).map(c => (
              <div key={c.id_candidat} className="flex items-center gap-3 justify-center mb-2">
                {c.photo ? (
                  <img src={c.photo} alt={c.nom} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
                    {c.nom.charAt(0)}
                  </div>
                )}
                <span className="font-bold text-indigo-900">{c.nom}</span>
                {c.parti && <span className="text-xs text-gray-400">— {c.parti}</span>}
              </div>
            ))
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
          <p className="text-amber-700 text-xs font-medium">
            🔒 Votre vote est anonyme et ne peut pas être modifié.
          </p>
        </div>

        <button
          onClick={() => navigate("/DashboardElecteur")}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );

  const isListe     = election?.type === "LISTE";
  const isBinominal = election?.type === "BINOMINAL";
  const maxSel      = getMaxSelections();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ===== NAVBAR ===== */}
      <header className="bg-white/80 backdrop-blur border-b border-indigo-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/DashboardElecteur")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-all"
          >
            <FiArrowLeft /> Retour
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-2xl font-black text-indigo-700">🗳 eVote</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
            {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
          </div>
          <span className="font-medium">{user.prenom} {user.nom}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Header élection */}
        <div className="bg-indigo-700 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Bulletin de vote</p>
              <h1 className="text-white text-2xl font-black">{election?.titre}</h1>
              <p className="text-indigo-300 text-sm mt-1">
                {new Date(election?.date_debut).toLocaleDateString("fr-FR")} →{" "}
                {new Date(election?.date_fin).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">
              {election?.type}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-4 mb-6 flex items-start gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <FiAlertCircle className="text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-indigo-900 text-sm">Instructions</p>
            <p className="text-gray-500 text-sm mt-0.5">
              {isBinominal
                ? "Sélectionnez exactement 2 candidats pour valider votre vote."
                : isListe
                ? "Sélectionnez une liste pour valider votre vote."
                : "Sélectionnez un candidat pour valider votre vote."
              }
            </p>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2 text-sm font-medium">
            <FiAlertCircle /> {error}
          </div>
        )}

        {/* ===== SCRUTIN LISTE ===== */}
        {isListe && (
          <div className="space-y-4 mb-8">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Listes candidates</h2>
            {listes.map((liste) => {
              const isSelected = selected.includes(liste.id_liste);
              const listeCandidats = candidats.filter(c => c.id_liste === liste.id_liste);
              return (
                <div
                  key={liste.id_liste}
                  onClick={() => handleSelect(liste.id_liste)}
                  className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md
                    ${isSelected
                      ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
                      : "border-gray-100 hover:border-indigo-200"
                    }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0
                        ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
                        {isSelected && <FiCheckCircle className="text-white text-xs" />}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg">
                        {liste.nom.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-lg">{liste.nom}</p>
                        <p className="text-xs text-gray-400">{liste.nb_candidats} candidat(s)</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        ✓ Sélectionné
                      </span>
                    )}
                  </div>

                  {listeCandidats.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                      {listeCandidats.map(c => (
                        <div key={c.id_candidat} className="flex items-center gap-3">
                          {c.photo ? (
                            <img src={`http://localhost:5000${c.photo}`} alt={c.nom}
                              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                              {c.nom.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{c.nom}</p>
                            {c.parti && <p className="text-xs text-gray-400">{c.parti}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== SCRUTIN UNINOMINAL / BINOMINAL ===== */}
        {!isListe && (
          <div>
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">
              Candidats
              {isBinominal && (
                <span className="ml-2 normal-case text-indigo-300">
                  ({selected.length}/{maxSel} sélectionné{selected.length > 1 ? "s" : ""})
                </span>
              )}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {candidats.map((c) => {
                const isSelected = selected.includes(c.id_candidat);
                const isDisabled = !isSelected && selected.length >= maxSel;
                return (
                  <div
                    key={c.id_candidat}
                    onClick={() => !isDisabled && handleSelect(c.id_candidat)}
                    className={`bg-white rounded-2xl border-2 p-5 transition-all
                      ${isSelected
                        ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
                        : isDisabled
                        ? "border-gray-100 opacity-50 cursor-not-allowed"
                        : "border-gray-100 hover:border-indigo-200 hover:shadow-md cursor-pointer"
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {c.photo ? (
                          <img
                            src={`http://localhost:5000${c.photo}`}
                            alt={c.nom}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-2xl">
                            {c.nom.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-black text-gray-800 text-lg leading-tight">{c.nom}</p>
                            {c.parti && (
                              <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">
                                {c.parti}
                              </span>
                            )}
                            {c.age && (
                              <p className="text-xs text-gray-400 mt-1">{c.age} ans</p>
                            )}
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all mt-1
                            ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
                            {isSelected && <FiCheckCircle className="text-white text-xs" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-indigo-100">
                        <span className="text-xs font-bold text-indigo-600">✓ Sélectionné</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== BOUTON VOTER ===== */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-6 sticky bottom-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-bold text-gray-800">
                {selected.length === 0
                  ? "Aucun choix sélectionné"
                  : isListe
                  ? `Liste sélectionnée : ${listes.find(l => selected.includes(l.id_liste))?.nom}`
                  : `${selected.length} candidat${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`
                }
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                ⚠️ Cette action est irréversible
              </p>
            </div>
            <button
              onClick={handleVote}
              disabled={
                submitting ||
                selected.length === 0 ||
                (isBinominal && selected.length < 2)
              }
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all
                ${submitting || selected.length === 0 || (isBinominal && selected.length < 2)
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <FiCheckCircle /> Confirmer mon vote
                </>
              )}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}











































// // src/pages/elcteurP/VotePage.jsx
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { FiCheckCircle, FiArrowLeft, FiUser, FiAlertCircle } from "react-icons/fi";
// import api from "../../services/api";

// export default function VotePage() {
//   const { electionId } = useParams();
//   const navigate       = useNavigate();

//   const [election,   setElection]   = useState(null);
//   const [candidats,  setCandidats]  = useState([]);
//   const [listes,     setListes]     = useState([]);
//   const [selected,   setSelected]   = useState([]); // tableau pour multi-sélection (binominal)
//   const [loading,    setLoading]    = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [voted,      setVoted]      = useState(false);
//   const [error,      setError]      = useState("");

//   const user = JSON.parse(localStorage.getItem("user") || "{}");

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) { navigate("/Login"); return; }
//     fetchData();
//   }, [electionId]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const [elecRes, candidatsRes] = await Promise.all([
//         api.get(`/elections/${electionId}`),
//         api.get(`/elections/${electionId}/candidats`),
//       ]);
//       setElection(elecRes.data);
//       setCandidats(candidatsRes.data);

//       // Si LISTE, récupère les listes
//       if (elecRes.data.type === "LISTE") {
//         const listesRes = await api.get(`/elections/${electionId}/listes`);
//         setListes(listesRes.data);
//       }
//     } catch (err) {
//       setError("Impossible de charger l'élection.");
//       console.error(err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Nombre max de sélections selon le type
//   const getMaxSelections = () => {
//     if (!election) return 1;
//     if (election.type === "BINOMINAL") return 2;
//     return 1; // UNINOMINAL ou LISTE
//   };

//   const handleSelect = (id) => {
//     const max = getMaxSelections();
//     if (max === 1) {
//       setSelected([id]);
//       return;
//     }
//     // Binominal : toggle avec max 2
//     if (selected.includes(id)) {
//       setSelected(selected.filter(s => s !== id));
//     } else {
//       if (selected.length < max) {
//         setSelected([...selected, id]);
//       }
//     }
//   };

//   const handleVote = async () => {
//     if (selected.length === 0) {
//       setError("Veuillez sélectionner un candidat.");
//       return;
//     }
//     if (election.type === "BINOMINAL" && selected.length < 2) {
//       setError("Veuillez sélectionner exactement 2 candidats.");
//       return;
//     }

//     setError("");
//     setSubmitting(true);

//     try {
//       await api.post(`/elections/${electionId}/voter`, {
//         candidat_ids: selected,
//       });
//       setVoted(true);
//     } catch (err) {
//       setError(err.response?.data?.message || "Erreur lors du vote.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ===== LOADING =====
//   if (loading) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
//       <div className="flex flex-col items-center gap-4">
//         <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
//         <p className="text-indigo-600 font-semibold">Chargement du bulletin de vote...</p>
//       </div>
//     </div>
//   );

//   // ===== CONFIRMATION APRÈS VOTE =====
//   if (voted) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center px-4">
//       <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
//         <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
//           <FiCheckCircle className="text-5xl text-emerald-500" />
//         </div>
//         <h2 className="text-2xl font-black text-gray-800 mb-2">Vote enregistré !</h2>
//         <p className="text-gray-500 mb-2">
//           Votre vote a été pris en compte pour l'élection :
//         </p>
//         <p className="text-indigo-700 font-bold text-lg mb-6">{election?.titre}</p>

//         {/* Récap du choix */}
//         <div className="bg-indigo-50 rounded-2xl p-4 mb-8">
//           <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-3">Votre choix</p>
//           {election?.type === "LISTE" ? (
//             listes.filter(l => selected.includes(l.id_liste)).map(l => (
//               <div key={l.id_liste} className="flex items-center gap-3 justify-center">
//                 <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
//                   {l.nom.charAt(0)}
//                 </div>
//                 <span className="font-bold text-indigo-900">{l.nom}</span>
//               </div>
//             ))
//           ) : (
//             candidats.filter(c => selected.includes(c.id_candidat)).map(c => (
//               <div key={c.id_candidat} className="flex items-center gap-3 justify-center mb-2">
//                 {c.photo ? (
//                   <img src={c.photo} alt={c.nom} className="w-8 h-8 rounded-full object-cover" />
//                 ) : (
//                   <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
//                     {c.nom.charAt(0)}
//                   </div>
//                 )}
//                 <span className="font-bold text-indigo-900">{c.nom}</span>
//                 {c.parti && <span className="text-xs text-gray-400">— {c.parti}</span>}
//               </div>
//             ))
//           )}
//         </div>

//         <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
//           <p className="text-amber-700 text-xs font-medium">
//             🔒 Votre vote est anonyme et ne peut pas être modifié.
//           </p>
//         </div>

//         <button
//           onClick={() => navigate("/DashboardElecteur")}
//           className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
//         >
//           Retour au tableau de bord
//         </button>
//       </div>
//     </div>
//   );

//   const isListe     = election?.type === "LISTE";
//   const isBinominal = election?.type === "BINOMINAL";
//   const maxSel      = getMaxSelections();

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ===== NAVBAR ===== */}
//       <header className="bg-white/80 backdrop-blur border-b border-indigo-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => navigate("/DashboardElecteur")}
//             className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-all"
//           >
//             <FiArrowLeft /> Retour
//           </button>
//           <span className="text-gray-300">|</span>
//           <span className="text-2xl font-black text-indigo-700">🗳 eVote</span>
//         </div>
//         <div className="flex items-center gap-2 text-sm text-gray-600">
//           <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
//             {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
//           </div>
//           <span className="font-medium">{user.prenom} {user.nom}</span>
//         </div>
//       </header>

//       <main className="max-w-4xl mx-auto px-6 py-10">

//         {/* Header élection */}
//         <div className="bg-indigo-700 rounded-2xl p-6 mb-8 shadow-lg">
//           <div className="flex items-start justify-between flex-wrap gap-4">
//             <div>
//               <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Bulletin de vote</p>
//               <h1 className="text-white text-2xl font-black">{election?.titre}</h1>
//               <p className="text-indigo-300 text-sm mt-1">
//                 {new Date(election?.date_debut).toLocaleDateString("fr-FR")} →{" "}
//                 {new Date(election?.date_fin).toLocaleDateString("fr-FR")}
//               </p>
//             </div>
//             <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">
//               {election?.type}
//             </span>
//           </div>
//         </div>

//         {/* Instructions */}
//         <div className="bg-white rounded-2xl border border-indigo-100 p-4 mb-6 flex items-start gap-3">
//           <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
//             <FiAlertCircle className="text-indigo-600" />
//           </div>
//           <div>
//             <p className="font-bold text-indigo-900 text-sm">Instructions</p>
//             <p className="text-gray-500 text-sm mt-0.5">
//               {isBinominal
//                 ? "Sélectionnez exactement 2 candidats pour valider votre vote."
//                 : isListe
//                 ? "Sélectionnez une liste pour valider votre vote."
//                 : "Sélectionnez un candidat pour valider votre vote."
//               }
//             </p>
//           </div>
//         </div>

//         {/* Erreur */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2 text-sm font-medium">
//             <FiAlertCircle /> {error}
//           </div>
//         )}

//         {/* ===== SCRUTIN LISTE ===== */}
//         {isListe && (
//           <div className="space-y-4 mb-8">
//             <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Listes candidates</h2>
//             {listes.map((liste) => {
//               const isSelected = selected.includes(liste.id_liste);
//               const listeCandidats = candidats.filter(c => c.id_liste === liste.id_liste);
//               return (
//                 <div
//                   key={liste.id_liste}
//                   onClick={() => handleSelect(liste.id_liste)}
//                   className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md
//                     ${isSelected
//                       ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
//                       : "border-gray-100 hover:border-indigo-200"
//                     }`}
//                 >
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex items-center gap-3">
//                       {/* Checkbox visuel */}
//                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0
//                         ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
//                         {isSelected && <FiCheckCircle className="text-white text-xs" />}
//                       </div>
//                       <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg">
//                         {liste.nom.charAt(0)}
//                       </div>
//                       <div>
//                         <p className="font-black text-gray-800 text-lg">{liste.nom}</p>
//                         <p className="text-xs text-gray-400">{liste.nb_candidats} candidat(s)</p>
//                       </div>
//                     </div>
//                     {isSelected && (
//                       <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
//                         ✓ Sélectionné
//                       </span>
//                     )}
//                   </div>

//                   {/* Candidats de la liste */}
//                   {listeCandidats.length > 0 && (
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
//                       {listeCandidats.map(c => (
//                         <div key={c.id_candidat} className="flex items-center gap-3">
//                           {c.photo ? (
//                             <img src={`http://localhost:5000${c.photo}`} alt={c.nom}
//                               className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100" />
//                           ) : (
//                             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
//                               {c.nom.charAt(0)}
//                             </div>
//                           )}
//                           <div>
//                             <p className="font-semibold text-gray-800 text-sm">{c.nom}</p>
//                             {c.parti && <p className="text-xs text-gray-400">{c.parti}</p>}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* ===== SCRUTIN UNINOMINAL / BINOMINAL ===== */}
//         {!isListe && (
//           <div>
//             <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">
//               Candidats
//               {isBinominal && (
//                 <span className="ml-2 normal-case text-indigo-300">
//                   ({selected.length}/{maxSel} sélectionné{selected.length > 1 ? "s" : ""})
//                 </span>
//               )}
//             </h2>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
//               {candidats.map((c) => {
//                 const isSelected = selected.includes(c.id_candidat);
//                 const isDisabled = !isSelected && selected.length >= maxSel;
//                 return (
//                   <div
//                     key={c.id_candidat}
//                     onClick={() => !isDisabled && handleSelect(c.id_candidat)}
//                     className={`bg-white rounded-2xl border-2 p-5 transition-all
//                       ${isSelected
//                         ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
//                         : isDisabled
//                         ? "border-gray-100 opacity-50 cursor-not-allowed"
//                         : "border-gray-100 hover:border-indigo-200 hover:shadow-md cursor-pointer"
//                       }`}
//                   >
//                     <div className="flex items-start gap-4">
//                       {/* Photo ou avatar */}
//                       <div className="flex-shrink-0">
//                         {c.photo ? (
//                           <img
//                             src={`http://localhost:5000${c.photo}`}
//                             alt={c.nom}
//                             className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100"
//                           />
//                         ) : (
//                           <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-2xl">
//                             {c.nom.charAt(0)}
//                           </div>
//                         )}
//                       </div>

//                       {/* Infos */}
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-start justify-between gap-2">
//                           <div>
//                             <p className="font-black text-gray-800 text-lg leading-tight">{c.nom}</p>
//                             {c.parti && (
//                               <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">
//                                 {c.parti}
//                               </span>
//                             )}
//                             {c.age && (
//                               <p className="text-xs text-gray-400 mt-1">{c.age} ans</p>
//                             )}
//                           </div>
//                           {/* Checkbox visuel */}
//                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all mt-1
//                             ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
//                             {isSelected && <FiCheckCircle className="text-white text-xs" />}
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Badge sélectionné */}
//                     {isSelected && (
//                       <div className="mt-3 pt-3 border-t border-indigo-100">
//                         <span className="text-xs font-bold text-indigo-600">✓ Sélectionné</span>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         {/* ===== BOUTON VOTER ===== */}
//         <div className="bg-white rounded-2xl border border-indigo-100 p-6 sticky bottom-6 shadow-xl">
//           <div className="flex items-center justify-between flex-wrap gap-4">
//             <div>
//               <p className="font-bold text-gray-800">
//                 {selected.length === 0
//                   ? "Aucun choix sélectionné"
//                   : isListe
//                   ? `Liste sélectionnée : ${listes.find(l => selected.includes(l.id_liste))?.nom}`
//                   : `${selected.length} candidat${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`
//                 }
//               </p>
//               <p className="text-xs text-gray-400 mt-0.5">
//                 ⚠️ Cette action est irréversible
//               </p>
//             </div>
//             <button
//               onClick={handleVote}
//               disabled={
//                 submitting ||
//                 selected.length === 0 ||
//                 (isBinominal && selected.length < 2)
//               }
//               className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all
//                 ${submitting || selected.length === 0 || (isBinominal && selected.length < 2)
//                   ? "bg-gray-300 cursor-not-allowed"
//                   : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
//                 }`}
//             >
//               {submitting ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   Envoi...
//                 </>
//               ) : (
//                 <>
//                   <FiCheckCircle /> Confirmer mon vote
//                 </>
//               )}
//             </button>
//           </div>
//         </div>

//       </main>
//     </div>
//   );
// }




