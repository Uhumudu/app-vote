// src/pages/admin/adminelection/ElectionDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiEdit, FiCalendar, FiType, FiAlignLeft, FiCheckCircle, FiClock, FiXCircle, FiLoader } from "react-icons/fi";
import api from "../../../services/api";
import AdminElectionLayout from "../../../components/adminelection/AdminElectionLayout";

// ── Même statusConfig que ElectionPage ──────────────────────────────────────
const statusConfig = (status) => {
  const map = {
    "En cours":    { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", dotColor: "#10b981", dot: true  },
    "Terminée":    { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db", dotColor: "#9ca3af", dot: false },
    "Approuvée":   { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", dotColor: "#3b82f6", dot: false },
    "Suspendue":   { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", dotColor: "#ef4444", dot: false },
    "Non ouverte": { bg: "#fef3c7", color: "#78350f", border: "#fcd34d", dotColor: "#f59e0b", dot: false },
    "EN_COURS":    { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", dotColor: "#10b981", dot: true  },
    "TERMINEE":    { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db", dotColor: "#9ca3af", dot: false },
    "APPROUVEE":   { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", dotColor: "#3b82f6", dot: false },
    "SUSPENDUE":   { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", dotColor: "#ef4444", dot: false },
    "EN_ATTENTE":  { bg: "#1e1b11", color: "#78350f", border: "#fcd34d", dotColor: "#f59e0b", dot: false },
  };
  return map[status] || { bg: "#e0e7ff", color: "#3730a3", border: "#a5b4fc", dotColor: "#6366f1", dot: false };
};

// ── Étapes de la timeline dans le même ordre logique ────────────────────────
const TIMELINE_STEPS = [
  { key: "EN_ATTENTE",  label: "En attente",  Icon: FiClock       },
  { key: "APPROUVEE",   label: "Approuvée",   Icon: FiCheckCircle },
  { key: "EN_COURS",    label: "En cours",    Icon: FiLoader      },
  { key: "TERMINEE",    label: "Terminée",    Icon: FiCheckCircle },
];

const STEP_ORDER = ["EN_ATTENTE", "APPROUVEE", "EN_COURS", "TERMINEE"];

const fmtDate = (d) =>
  new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const fmtDateLong = (d) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function ElectionDetails() {
  const { id } = useParams();
  const [election, setElection] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { fetchElection(); }, [id]);

  const fetchElection = async () => {
    try {
      const res = await api.get(`/elections/${id}`);
      setElection(res.data);
    } catch (err) {
      console.error("Erreur chargement élection:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Calcul du statut affiché ────────────────────────────────────────────
  const getStatusLabel = (e) => {
    if (!e) return "Non ouverte";
    if (e.statut === "EN_ATTENTE") return "Non ouverte";
    if (e.statut === "APPROUVEE")  return "Approuvée";
    if (e.statut === "EN_COURS")   return "En cours";
    if (e.statut === "TERMINEE")   return "Terminée";
    if (e.statut === "SUSPENDUE")  return "Suspendue";
    const now = new Date(), s = new Date(e.date_debut), f = new Date(e.date_fin);
    if (now >= s && now <= f) return "En cours";
    if (now > f) return "Terminée";
    return "Non ouverte";
  };

  const canEdit = (statut) => !["EN_COURS", "TERMINEE"].includes(statut);

  // ── États de chargement / erreur ─────────────────────────────────────────
  if (loading) return (
    <AdminElectionLayout active="elections">
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement…</p>
        </div>
      </main>
    </AdminElectionLayout>
  );

  if (!election) return (
    <AdminElectionLayout active="elections">
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <FiXCircle className="text-red-400 text-4xl mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">Élection introuvable</p>
          <Link to="/admin/adminelection/ElectionPage"
            className="text-indigo-600 text-sm font-medium hover:underline mt-2 inline-block">
            ← Retour à mes élections
          </Link>
        </div>
      </main>
    </AdminElectionLayout>
  );

  const statusLabel = getStatusLabel(election);
  const sc          = statusConfig(election.statut || statusLabel);
  const stepIndex   = STEP_ORDER.indexOf(election.statut ?? "EN_ATTENTE");

  return (
    <AdminElectionLayout active="elections">
      <main className="flex-1 p-8 overflow-y-auto">

        {/* ── En-tête ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/adminelection/ElectionPage"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-medium shadow-sm"
            >
              <FiArrowLeft size={14} /> Retour
            </Link>
            <div>
              <h2 className="text-2xl font-black text-indigo-900 tracking-tight leading-tight">
                {election.titre}
              </h2>
              <p className="text-sm text-indigo-400 mt-0.5">
                ID #{election.id_election} · {election.type}
              </p>
            </div>
          </div>

          {canEdit(election.statut) && (
            <Link
              to={`/admin/adminelection/modifier-election/${election.id_election}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 active:scale-95 transition-all font-semibold text-sm shadow-md shadow-amber-200/60"
            >
              <FiEdit size={14} /> Modifier l'élection
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Colonne principale (2/3) ──────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Carte — infos générales */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-indigo-700 px-5 py-3.5">
                <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">
                  Informations générales
                </h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiType className="text-indigo-500" size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Titre</p>
                    <p className="text-sm font-semibold text-gray-800">{election.titre}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiCheckCircle className="text-indigo-500" size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Type de scrutin</p>
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                      {election.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiCalendar className="text-green-500" size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Début</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDateLong(election.date_debut)}</p>
                    <p className="text-xs text-gray-400">{fmtTime(election.date_debut)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiCalendar className="text-red-400" size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fin</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDateLong(election.date_fin)}</p>
                    <p className="text-xs text-gray-400">{fmtTime(election.date_fin)}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Carte — description */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-indigo-700 px-5 py-3.5">
                <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">
                  Description
                </h3>
              </div>
              <div className="p-5 flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiAlignLeft className="text-indigo-500" size={14} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {election.description?.trim() || (
                    <span className="italic text-gray-400">Aucune description fournie.</span>
                  )}
                </p>
              </div>
            </div>

          </div>

          {/* ── Colonne droite (1/3) ─────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Carte — statut */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-indigo-700 px-5 py-3.5">
                <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Statut</h3>
              </div>
              <div className="p-5 flex flex-col items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border"
                  style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.border }}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot ? "animate-pulse" : ""}`}
                    style={{ backgroundColor: sc.dotColor }}
                  />
                  {statusLabel}
                </span>
                <p className="text-xs text-gray-400 text-center">
                  {election.statut === "EN_COURS"   && "L'élection est actuellement ouverte aux votes."}
                  {election.statut === "TERMINEE"   && "L'élection est clôturée."}
                  {election.statut === "APPROUVEE"  && "En attente de la date de début."}
                  {election.statut === "EN_ATTENTE" && "En attente de validation par le super admin."}
                  {election.statut === "SUSPENDUE"  && "Cette élection a été suspendue."}
                </p>
              </div>
            </div>

            {/* Carte — timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-indigo-700 px-5 py-3.5">
                <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Progression</h3>
              </div>
              <div className="p-5">
                <div className="flex flex-col gap-0">
                  {TIMELINE_STEPS.map((step, i) => {
                    const done    = i < stepIndex;
                    const current = i === stepIndex;
                    const pending = i > stepIndex;
                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        {/* Colonne gauche : dot + ligne */}
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                            done    ? "bg-green-500 border-green-500"
                            : current ? "bg-indigo-600 border-indigo-600"
                            : "bg-white border-gray-200"
                          }`}>
                            {done && (
                              <FiCheckCircle size={13} className="text-white" />
                            )}
                            {current && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                            )}
                            {pending && (
                              <div className="w-2 h-2 rounded-full bg-gray-200" />
                            )}
                          </div>
                          {i < TIMELINE_STEPS.length - 1 && (
                            <div className={`w-0.5 h-8 mt-0.5 ${
                              done ? "bg-green-300" : "bg-gray-100"
                            }`} />
                          )}
                        </div>
                        {/* Texte */}
                        <div className="pb-2 pt-0.5">
                          <p className={`text-sm font-semibold ${
                            done    ? "text-green-600"
                            : current ? "text-indigo-700"
                            : "text-gray-300"
                          }`}>
                            {step.label}
                          </p>
                          {current && (
                            <p className="text-xs text-indigo-400 mt-0.5">Étape actuelle</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Carte — accès rapide */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-indigo-700 px-5 py-3.5">
                <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Accès rapide</h3>
              </div>
              <div className="p-4 flex flex-col gap-2.5">
                <Link
                  to="/admin/adminelection/ElectionPage"
                  className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 active:scale-95 transition-all text-xs font-semibold"
                >
                  <FiArrowLeft size={12} /> Retour à la liste
                </Link>
                {canEdit(election.statut) && (
                  <Link
                    to={`/admin/adminelection/modifier-election/${election.id_election}`}
                    className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-100 active:scale-95 transition-all text-xs font-semibold"
                  >
                    <FiEdit size={12} /> Modifier cette élection
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </AdminElectionLayout>
  );
}






















// import React, { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import { FiArrowLeft, FiEdit } from "react-icons/fi";
// import api from "../../../services/api";

// export default function ElectionDetails() {
//   const { id } = useParams();
//   const [election, setElection] = useState(null);

//   useEffect(() => {
//     fetchElection();
//   }, [id]);

//   const fetchElection = async () => {
//     try {
//       const res = await api.get(`/elections/${id}`);
//       setElection(res.data);
//     } catch (error) {
//       console.error("Erreur chargement élection:", error);
//     }
//   };

//   if (!election) {
//     return (
//       <div className="p-10 text-center text-red-600">
//         Élection introuvable.
//       </div>
//     );
//   }

//   const now = new Date();
//   const start = new Date(election.date_debut);
//   const end = new Date(election.date_fin);

//   let status = "Non ouverte";
//   if (now >= start && now <= end) status = "En cours";
//   if (now > end) status = "Terminée";

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 p-8">
//       <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">

//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-indigo-800">
//             Détails de l’élection
//           </h2>

//           <Link
//             to="/admin/adminelection/ElectionPage"
//             className="flex items-center gap-2 px-3 py-1 bg-gray-300 rounded-xl hover:bg-gray-400 transition"
//           >
//             <FiArrowLeft /> Retour
//           </Link>
//         </div>

//         <div className="space-y-4 text-gray-700">
//           <div><span className="font-semibold">Titre :</span> {election.titre}</div>
//           <div><span className="font-semibold">Type :</span> {election.type}</div>
//           <div><span className="font-semibold">Début :</span> {start.toLocaleString()}</div>
//           <div><span className="font-semibold">Fin :</span> {end.toLocaleString()}</div>
//           <div><span className="font-semibold">Statut :</span> {status}</div>
//           <div>
//             <span className="font-semibold">Description :</span>
//             <p className="mt-2 bg-gray-50 p-4 rounded-xl">
//               {election.description}
//             </p>
//           </div>
//         </div>

//         <div className="mt-8 flex justify-end">
//           <Link
//             to={`/admin/adminelection/modifier-election/${election.id_election}`}
//             className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition"
//           >
//             <FiEdit /> Modifier
//           </Link>
//         </div>

//       </div>
//     </div>
//   );
// }




















// // src/pages/adminElection/ElectionDetails.jsx
// import React from "react";
// import { useParams, Link } from "react-router-dom";
// import { FiArrowLeft, FiEdit } from "react-icons/fi";

// const elections = [
//   {
//     id: 1,
//     title: "Élection universitaire 2026",
//     description: "Élection des représentants étudiants pour l'année universitaire 2026.",
//     startDate: "2026-03-01T08:00",
//     endDate: "2026-03-05T18:00",
//     type: "Uninominal",
//   },
//   {
//     id: 2,
//     title: "Élection du conseil étudiant",
//     description: "Élection pour élire le conseil étudiant du département de droit.",
//     startDate: "2026-04-10T09:00",
//     endDate: "2026-04-12T17:00",
//     type: "Binominal",
//   },
//   {
//     id: 3,
//     title: "Élection départementale 2026",
//     description: "Élection départementale pour les représentants des étudiants.",
//     startDate: "2026-05-01T08:30",
//     endDate: "2026-05-03T16:00",
//     type: "Liste",
//   },
// ];

// export default function ElectionDetails() {
//   const { id } = useParams();

//   const election = elections.find(
//     (e) => e.id === parseInt(id)
//   );

//   if (!election) {
//     return (
//       <div className="p-10 text-center text-red-600">
//         Élection introuvable.
//       </div>
//     );
//   }

//   // Calcul automatique du statut
//   const now = new Date();
//   const start = new Date(election.startDate);
//   const end = new Date(election.endDate);

//   let status = "Non ouverte";
//   if (now >= start && now <= end) status = "En cours";
//   if (now > end) status = "Terminée";

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 p-8">

//       <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">

//         {/* HEADER */}
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-indigo-800">
//             Détails de l’élection
//           </h2>

//           <Link
//             to="/admin/adminelection/ElectionPage"
//             className="flex items-center gap-2 px-3 py-1 bg-gray-300 rounded-xl hover:bg-gray-400 transition"
//           >
//             <FiArrowLeft /> Retour
//           </Link>
//         </div>

//         {/* INFOS */}
//         <div className="space-y-4 text-gray-700">

//           <div>
//             <span className="font-semibold">Titre :</span> {election.title}
//           </div>

//           <div>
//             <span className="font-semibold">Type de scrutin :</span> {election.type}
//           </div>

//           <div>
//             <span className="font-semibold">Date & heure de début :</span>{" "}
//             {start.toLocaleString()}
//           </div>

//           <div>
//             <span className="font-semibold">Date & heure de fin :</span>{" "}
//             {end.toLocaleString()}
//           </div>

//           <div>
//             <span className="font-semibold">Statut :</span>{" "}
//             <span
//               className={`${
//                 status === "En cours"
//                   ? "text-green-600"
//                   : status === "Terminée"
//                   ? "text-gray-500"
//                   : "text-yellow-600"
//               } font-medium`}
//             >
//               {status}
//             </span>
//           </div>

//           <div>
//             <span className="font-semibold">Description :</span>
//             <p className="mt-2 bg-gray-50 p-4 rounded-xl">
//               {election.description}
//             </p>
//           </div>
//         </div>

//         {/* ACTION */}
//         <div className="mt-8 flex justify-end">
//           <Link
//             to={`/admin/adminelection/modifier-election/${election.id}`}
//             className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition"
//           >
//             <FiEdit /> Modifier l'élection
//           </Link>
//         </div>

//       </div>
//     </div>
//   );
// }











