// src/pages/admin/adminelection/DepouillementTour.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft, FiRefreshCw, FiAward, FiLink,
  FiHome, FiCalendar, FiSettings, FiLogOut, FiBarChart2
} from "react-icons/fi";
import api from "../../../services/api";

export default function DepouillementTour() {
  const { electionId } = useParams();
  const navigate       = useNavigate();

  const [resultats,  setResultats]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState({ msg: "", type: "success" });
  const [fusion,     setFusion]     = useState({ source: "", cible: "" });

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const fetchResultats = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/elections/${electionId}/resultats-tours`);
      setResultats(res.data);
    } catch (err) {
      notify(err.response?.data?.message || "Erreur de chargement", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/Login"); return; }
    fetchResultats();
  }, [electionId]);

  const handleDepouiller = async () => {
    if (!window.confirm(`Clore le vote du tour ${election?.tour_courant} et calculer les résultats ?`)) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/elections/${electionId}/depouiller`);
      notify(res.data.message || "Tour dépouillé avec succès");
      fetchResultats();
    } catch (err) {
      notify(err.response?.data?.message || "Erreur lors du dépouillement", "error");
    } finally { setSubmitting(false); }
  };

  const handleFusion = async () => {
    if (!fusion.source || !fusion.cible) { notify("Sélectionnez les deux listes", "error"); return; }
    if (fusion.source === fusion.cible)  { notify("Les deux listes doivent être différentes", "error"); return; }
    try {
      setSubmitting(true);
      await api.post(`/elections/${electionId}/fusionner-listes`, {
        liste_source: parseInt(fusion.source),
        liste_cible:  parseInt(fusion.cible),
      });
      notify("Fusion enregistrée avec succès");
      setFusion({ source: "", cible: "" });
      fetchResultats();
    } catch (err) {
      notify(err.response?.data?.message || "Erreur lors de la fusion", "error");
    } finally { setSubmitting(false); }
  };

  const election     = resultats?.election;
  const dernierTour  = resultats?.tours?.[resultats.tours.length - 1];
  const listesSource = dernierTour?.votes?.filter(v => v.pourcentage >= 5 && v.pourcentage <= 10) || [];
  const listesCible  = dernierTour?.votes?.filter(v => v.pourcentage > 10) || [];
  const isTerminee   = election?.statut === "TERMINEE";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
          toast.type === "error" ? "bg-red-600" : "bg-indigo-700"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 p-6 flex flex-col shadow-sm">
        <div className="mb-10">
          <h1 className="text-xl font-black text-indigo-700 tracking-tight">🗳 eVote</h1>
          <p className="text-xs text-indigo-400 font-medium mt-0.5">Espace administrateur</p>
        </div>
        <nav className="flex-1 space-y-1">
          {[
            { to: "/adminElectionDashboard",           icon: <FiHome size={15} />,      label: "Tableau de bord" },
            { to: "/admin/adminelection/ElectionPage", icon: <FiCalendar size={15} />,  label: "Mes élections" },
            { to: "/admin/adminelection/resultats",    icon: <FiBarChart2 size={15} />, label: "Résultats" },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all">
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 pt-4 border-t border-gray-100 mt-4">
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
            <FiSettings size={15} /> Paramètres
          </Link>
          <Link to="/logout" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
            <FiLogOut size={15} /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto">

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/adminelection/ElectionPage")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
          >
            <FiArrowLeft size={14} /> Retour
          </button>
          <div>
            <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Dépouillement</h2>
            <p className="text-sm text-indigo-400 mt-0.5">Scrutin de liste à tours successifs</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-indigo-400 text-sm font-medium">Chargement…</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl space-y-5">

            {/* Bandeau élection */}
            <div className="bg-indigo-700 rounded-2xl p-5 shadow-lg flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-1">Élection</p>
                <h3 className="text-white text-lg font-black tracking-tight">{election?.titre}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">LISTE</span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                  isTerminee ? "bg-white/10 text-white/60 border-white/20" : "bg-emerald-400/20 text-emerald-200 border-emerald-300/30"
                }`}>
                  {isTerminee ? "Terminée" : `Tour ${election?.tour_courant} en cours`}
                </span>
              </div>
            </div>

            {/* Règles */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Règles du scrutin</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: "< 5%",  label: "Éliminée",      bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
                  { val: "5–10%", label: "Peut fusionner", bg: "#fff7ed", border: "#fed7aa", color: "#ea580c" },
                  { val: "> 50%", label: "Vainqueur",      bg: "#fffbeb", border: "#fde68a", color: "#d97706" },
                ].map(r => (
                  <div
                    key={r.val}
                    className="rounded-xl p-3 text-center"
                    style={{ backgroundColor: r.bg, border: `1px solid ${r.border}` }}
                  >
                    <p className="text-base font-black" style={{ color: r.color }}>{r.val}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: r.color, opacity: 0.8 }}>{r.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Résultats par tour */}
            {resultats?.tours?.map((tour) => (
              <div key={tour.numero_tour} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div
                  className="px-5 py-3.5 flex items-center justify-between border-b"
                  style={{
                    backgroundColor: tour.statut === "GAGNANT_TROUVE" ? "#fffbeb" : "#f9fafb",
                    borderBottomColor: tour.statut === "GAGNANT_TROUVE" ? "#fde68a" : "#f3f4f6",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
                      style={
                        tour.statut === "GAGNANT_TROUVE"
                          ? { backgroundColor: "#fef3c7", color: "#b45309" }
                          : { backgroundColor: "#e0e7ff", color: "#4338ca" }
                      }
                    >
                      {tour.numero_tour}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Tour {tour.numero_tour}</p>
                      <p className="text-xs text-gray-400">{tour.total_votes} vote{tour.total_votes > 1 ? "s" : ""} exprimé{tour.total_votes > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {tour.statut === "GAGNANT_TROUVE" && (
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                      <FiAward size={11} /> Tour décisif
                    </span>
                  )}
                  {tour.statut === "TERMINE" && (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
                      Sans majorité
                    </span>
                  )}
                  {tour.statut === "EN_COURS" && (
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#10b981" }} />
                      En cours
                    </span>
                  )}
                </div>

                <div className="px-5 py-4 space-y-3">
                  {tour.votes.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-3">Aucun vote enregistré.</p>
                  ) : (
                    tour.votes.map((v, i) => {
                      const isW = tour.statut === "GAGNANT_TROUVE" && i === 0;
                      const isEl = v.pourcentage < 5;
                      const isF  = v.pourcentage >= 5 && v.pourcentage <= 10;
                      return (
                        <div key={v.liste_id} className="flex items-center gap-3">
                          <span className={`text-xs font-black px-2.5 py-1.5 rounded-lg flex-shrink-0 min-w-[52px] text-center ${
                            isW ? "bg-amber-500 text-white" : isEl ? "bg-red-500 text-white" : isF ? "bg-orange-500 text-white" : "bg-indigo-600 text-white"
                          }`}>
                            {v.pourcentage}%
                          </span>
                          <span className="text-sm font-semibold text-gray-700 w-36 truncate flex-shrink-0">{v.nom_liste}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isW ? "bg-amber-400" : isEl ? "bg-red-300" : isF ? "bg-orange-300" : "bg-indigo-400"
                              }`}
                              style={{ width: `${v.pourcentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0 w-16 text-right">{v.nb_votes} vote{v.nb_votes > 1 ? "s" : ""}</span>
                          {isW  && <span className="text-xs font-bold text-amber-600 flex-shrink-0">🏆</span>}
                          {isEl && !isW && <span className="text-xs text-red-400 font-medium flex-shrink-0">Éliminée</span>}
                          {isF  && !isW && <span className="text-xs text-orange-400 font-medium flex-shrink-0">Fusion</span>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}

            {/* Sièges finaux */}
            {resultats?.sieges?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-amber-100 flex items-center gap-2">
                  <FiAward className="text-amber-600" size={14} />
                  <p className="text-sm font-bold text-amber-700">Répartition finale des sièges</p>
                </div>
                <div className="px-5 py-4 flex flex-wrap gap-3">
                  {resultats.sieges.map((s, i) => (
                    <div key={s.liste_id} className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                      i === 0 ? "bg-amber-100 border-amber-300" : "bg-white border-gray-200"
                    }`}>
                      {i === 0 && <span>🏆</span>}
                      <div>
                        <p className="text-sm font-bold text-gray-800">{s.nom_liste}</p>
                        <p className="text-xs text-gray-400">{i === 0 ? "Bonus + proportion" : "Proportionnel"}</p>
                      </div>
                      <div className="text-center ml-2">
                        <p className={`text-2xl font-black ${i === 0 ? "text-amber-600" : "text-indigo-600"}`}>{s.nb_sieges}</p>
                        <p className="text-xs text-gray-400">siège{s.nb_sieges > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ACTIONS ─────────────────────────────────────────────────── */}
            {!isTerminee && (
              <>
                {listesSource.length > 0 && (
                  <div className="bg-white rounded-2xl border border-orange-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <FiLink className="text-orange-500" size={14} />
                      <p className="text-sm font-bold text-orange-700">Fusionner des listes</p>
                    </div>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      Les listes entre 5% et 10% peuvent rejoindre une liste mieux placée avant le prochain tour.
                    </p>
                    <div className="flex gap-3 flex-wrap items-end">
                      <div className="flex-1 min-w-36">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Liste à fusionner (5–10%)</label>
                        <select value={fusion.source} onChange={e => setFusion({ ...fusion, source: e.target.value })}
                          className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-orange-50 text-gray-700">
                          <option value="">Choisir…</option>
                          {listesSource.map(v => (
                            <option key={v.liste_id} value={v.liste_id}>{v.nom_liste} ({v.pourcentage}%)</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-gray-400 font-bold pb-1">→</span>
                      <div className="flex-1 min-w-36">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Liste cible (&gt; 10%)</label>
                        <select value={fusion.cible} onChange={e => setFusion({ ...fusion, cible: e.target.value })}
                          className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-orange-50 text-gray-700">
                          <option value="">Choisir…</option>
                          {listesCible.map(v => (
                            <option key={v.liste_id} value={v.liste_id}>{v.nom_liste} ({v.pourcentage}%)</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={handleFusion} disabled={submitting || !fusion.source || !fusion.cible}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 ${
                          submitting || !fusion.source || !fusion.cible
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-sm"
                        }`}>
                        <FiLink size={13} /> Fusionner
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-sm">
                  <p className="font-bold text-gray-800 text-sm mb-1">Clore le tour {election?.tour_courant} et dépouiller</p>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Action irréversible. Si aucune liste n'atteint 50%, un nouveau tour s'ouvre automatiquement.
                  </p>
                  <button onClick={handleDepouiller} disabled={submitting}
                    className={`w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2.5 ${
                      submitting ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99] shadow-lg shadow-indigo-200/60"
                    }`}>
                    {submitting
                      ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" /> Dépouillement…</>
                      : <><FiRefreshCw size={16} /> Dépouiller le tour {election?.tour_courant}</>
                    }
                  </button>
                </div>
              </>
            )}

            {isTerminee && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center shadow-sm">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FiAward className="text-2xl text-emerald-500" />
                </div>
                <p className="font-black text-emerald-800 text-lg mb-1">Élection terminée</p>
                <p className="text-emerald-600 text-sm mb-5">Un vainqueur a été désigné. Les résultats sont disponibles.</p>
                <Link
                  to="/admin/adminelection/resultats"
                  onClick={() => localStorage.setItem("activeElectionId", electionId)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200/60"
                >
                  <FiBarChart2 size={14} /> Voir les résultats complets
                </Link>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

















































// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { FiArrowLeft, FiRefreshCw, FiAward, FiLink } from "react-icons/fi";
// import api from "../../../services/api";

// export default function DepouillementTour() {
//   const { electionId } = useParams();
//   const navigate       = useNavigate();
//   const [resultats, setResultats]   = useState(null);
//   const [loading, setLoading]       = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [toast, setToast]           = useState("");
//   const [fusion, setFusion]         = useState({ source: "", cible: "" });

//   const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

//   const fetchResultats = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get(`/elections/${electionId}/resultats-tours`);
//       setResultats(res.data);
//     } catch (err) {
//       notify("Erreur de chargement");
//     } finally { setLoading(false); }
//   };

//   useEffect(() => { fetchResultats(); }, [electionId]);

//   const handleDepouiller = async () => {
//     if (!window.confirm("Clore le vote de ce tour et calculer les résultats ?")) return;
//     try {
//       setSubmitting(true);
//       const res = await api.post(`/elections/${electionId}/depouiller`);
//       notify(res.data.message);
//       fetchResultats();
//     } catch (err) {
//       notify(err.response?.data?.message || "Erreur dépouillement");
//     } finally { setSubmitting(false); }
//   };

//   const handleFusion = async () => {
//     if (!fusion.source || !fusion.cible)
//       return notify("Sélectionnez les deux listes");
//     if (fusion.source === fusion.cible)
//       return notify("Les listes doivent être différentes");
//     try {
//       setSubmitting(true);
//       await api.post(`/elections/${electionId}/fusionner-listes`, {
//         liste_source: parseInt(fusion.source),
//         liste_cible:  parseInt(fusion.cible),
//       });
//       notify("Fusion enregistrée");
//       setFusion({ source: "", cible: "" });
//       fetchResultats();
//     } catch (err) {
//       notify(err.response?.data?.message || "Erreur fusion");
//     } finally { setSubmitting(false); }
//   };

//   const election = resultats?.election;
//   const listes   = resultats?.tours?.[0]?.votes || [];
//   const dernierTour = resultats?.tours?.[resultats.tours.length - 1];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       {toast && (
//         <div className="fixed top-5 right-5 z-50 px-6 py-3 rounded-xl shadow-lg bg-indigo-700 text-white font-medium">
//           {toast}
//         </div>
//       )}

//       <header className="bg-white/80 backdrop-blur border-b border-indigo-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
//         <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
//           <FiArrowLeft /> Retour
//         </button>
//         <span className="text-2xl font-black text-indigo-700">🗳 eVote</span>
//         <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-semibold">Dépouillement</span>
//       </header>

//       <main className="max-w-3xl mx-auto px-6 py-10">
//         {loading ? (
//           <div className="flex justify-center py-20">
//             <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
//           </div>
//         ) : (
//           <>
//             {/* Titre */}
//             <div className="bg-indigo-700 rounded-2xl p-5 mb-6 shadow-lg">
//               <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Élection</p>
//               <h1 className="text-white text-xl font-black">{election?.titre}</h1>
//               <p className="text-indigo-300 text-sm mt-1">
//                 Tour courant : <span className="text-white font-bold">{election?.tour_courant}</span>
//               </p>
//             </div>

//             {/* Résultats par tour */}
//             {resultats?.tours?.map((tour) => (
//               <div key={tour.numero_tour} className="bg-white rounded-2xl border border-indigo-100 overflow-hidden mb-4">
//                 <div className="px-6 py-3 bg-indigo-50 flex items-center justify-between">
//                   <span className="text-sm font-bold text-indigo-700">Tour {tour.numero_tour}</span>
//                   {tour.statut === "GAGNANT_TROUVE" && (
//                     <span className="flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
//                       <FiAward /> Vainqueur trouvé
//                     </span>
//                   )}
//                 </div>
//                 <div className="px-6 py-4 space-y-3">
//                   {tour.votes.map((v) => (
//                     <div key={v.liste_id} className="flex items-center gap-3">
//                       <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
//                         v.pourcentage > 50 ? "bg-amber-100 text-amber-700" :
//                         v.pourcentage < 5  ? "bg-red-100 text-red-600" :
//                         v.pourcentage <= 10 ? "bg-orange-100 text-orange-600" :
//                         "bg-indigo-100 text-indigo-700"
//                       }`}>
//                         {v.pourcentage}%
//                       </span>
//                       <span className="text-sm font-medium text-gray-700 flex-1">{v.nom_liste}</span>
//                       <span className="text-xs text-gray-400">{v.nb_votes} vote{v.nb_votes > 1 ? "s" : ""}</span>
//                       {v.pourcentage < 5 && <span className="text-xs text-red-500 font-semibold">Éliminée</span>}
//                       {v.pourcentage >= 5 && v.pourcentage <= 10 && (
//                         <span className="text-xs text-orange-500 font-semibold">Peut fusionner</span>
//                       )}
//                     </div>
//                   ))}
//                   <p className="text-xs text-gray-400">Total : {tour.total_votes} vote{tour.total_votes > 1 ? "s" : ""}</p>
//                 </div>
//               </div>
//             ))}

//             {/* Sièges */}
//             {resultats?.sieges?.length > 0 && (
//               <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
//                 <p className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
//                   <FiAward /> Répartition finale des sièges
//                 </p>
//                 <div className="flex flex-wrap gap-3">
//                   {resultats.sieges.map((s) => (
//                     <div key={s.liste_id} className="bg-white border border-amber-200 rounded-xl px-4 py-2 text-center">
//                       <p className="text-sm font-bold text-gray-800">{s.nom_liste}</p>
//                       <p className="text-2xl font-black text-amber-600">{s.nb_sieges}</p>
//                       <p className="text-xs text-gray-400">sièges</p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Actions (uniquement si élection EN_COURS) */}
//             {election?.statut === "EN_COURS" && (
//               <>
//                 {/* Fusion */}
//                 <div className="bg-white rounded-2xl border border-indigo-100 p-5 mb-4">
//                   <p className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-2">
//                     <FiLink /> Fusionner des listes (avant le prochain tour)
//                   </p>
//                   <div className="flex gap-3 flex-wrap">
//                     <select
//                       value={fusion.source}
//                       onChange={e => setFusion({ ...fusion, source: e.target.value })}
//                       className="flex-1 border-2 border-indigo-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-indigo-50"
//                     >
//                       <option value="">Liste à fusionner…</option>
//                       {dernierTour?.votes?.filter(v => v.pourcentage >= 5 && v.pourcentage <= 10)
//                         .map(v => (
//                           <option key={v.liste_id} value={v.liste_id}>{v.nom_liste} ({v.pourcentage}%)</option>
//                         ))}
//                     </select>
//                     <span className="flex items-center text-gray-400 font-bold">→</span>
//                     <select
//                       value={fusion.cible}
//                       onChange={e => setFusion({ ...fusion, cible: e.target.value })}
//                       className="flex-1 border-2 border-indigo-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-indigo-50"
//                     >
//                       <option value="">Liste cible…</option>
//                       {dernierTour?.votes?.filter(v => v.pourcentage > 10)
//                         .map(v => (
//                           <option key={v.liste_id} value={v.liste_id}>{v.nom_liste} ({v.pourcentage}%)</option>
//                         ))}
//                     </select>
//                     <button
//                       onClick={handleFusion}
//                       disabled={submitting}
//                       className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition"
//                     >
//                       Fusionner
//                     </button>
//                   </div>
//                 </div>

//                 {/* Dépouiller */}
//                 <button
//                   onClick={handleDepouiller}
//                   disabled={submitting}
//                   className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-base hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
//                 >
//                   {submitting ? (
//                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   ) : (
//                     <FiRefreshCw />
//                   )}
//                   Clore le tour {election?.tour_courant} et dépouiller
//                 </button>
//               </>
//             )}
//           </>
//         )}
//       </main>
//     </div>
//   );
// }