

// src/pages/adminElection/ElectionDetails.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiEdit } from "react-icons/fi";

const elections = [
  {
    id: 1,
    title: "Élection universitaire 2026",
    description: "Élection des représentants étudiants pour l'année universitaire 2026.",
    startDate: "2026-03-01T08:00",
    endDate: "2026-03-05T18:00",
    type: "Uninominal",
  },
  {
    id: 2,
    title: "Élection du conseil étudiant",
    description: "Élection pour élire le conseil étudiant du département de droit.",
    startDate: "2026-04-10T09:00",
    endDate: "2026-04-12T17:00",
    type: "Binominal",
  },
  {
    id: 3,
    title: "Élection départementale 2026",
    description: "Élection départementale pour les représentants des étudiants.",
    startDate: "2026-05-01T08:30",
    endDate: "2026-05-03T16:00",
    type: "Liste",
  },
];

export default function ElectionDetails() {
  const { id } = useParams();

  const election = elections.find(
    (e) => e.id === parseInt(id)
  );

  if (!election) {
    return (
      <div className="p-10 text-center text-red-600">
        Élection introuvable.
      </div>
    );
  }

  // Calcul automatique du statut
  const now = new Date();
  const start = new Date(election.startDate);
  const end = new Date(election.endDate);

  let status = "Non ouverte";
  if (now >= start && now <= end) status = "En cours";
  if (now > end) status = "Terminée";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 p-8">

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-indigo-800">
            Détails de l’élection
          </h2>

          <Link
            to="/admin/adminelection/ElectionPage"
            className="flex items-center gap-2 px-3 py-1 bg-gray-300 rounded-xl hover:bg-gray-400 transition"
          >
            <FiArrowLeft /> Retour
          </Link>
        </div>

        {/* INFOS */}
        <div className="space-y-4 text-gray-700">

          <div>
            <span className="font-semibold">Titre :</span> {election.title}
          </div>

          <div>
            <span className="font-semibold">Type de scrutin :</span> {election.type}
          </div>

          <div>
            <span className="font-semibold">Date & heure de début :</span>{" "}
            {start.toLocaleString()}
          </div>

          <div>
            <span className="font-semibold">Date & heure de fin :</span>{" "}
            {end.toLocaleString()}
          </div>

          <div>
            <span className="font-semibold">Statut :</span>{" "}
            <span
              className={`${
                status === "En cours"
                  ? "text-green-600"
                  : status === "Terminée"
                  ? "text-gray-500"
                  : "text-yellow-600"
              } font-medium`}
            >
              {status}
            </span>
          </div>

          <div>
            <span className="font-semibold">Description :</span>
            <p className="mt-2 bg-gray-50 p-4 rounded-xl">
              {election.description}
            </p>
          </div>
        </div>

        {/* ACTION */}
        <div className="mt-8 flex justify-end">
          <Link
            to={`/admin/adminelection/modifier-election/${election.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition"
          >
            <FiEdit /> Modifier l'élection
          </Link>
        </div>

      </div>
    </div>
  );
}























// import React, { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import axios from "axios";
// import { motion } from "framer-motion";
// import {
//   FiUsers,
//   FiClock,
//   FiBarChart2,
//   FiArrowLeft,
//   FiCheckCircle
// } from "react-icons/fi";

// export default function ElectionDetails() {
//   const { id } = useParams();

//   const [election, setElection] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [timeLeft, setTimeLeft] = useState("");

//   // 🔄 Charger données depuis backend
//   useEffect(() => {
//     const fetchElection = async () => {
//       try {
//         const res = await axios.get(
//           `http://localhost:5000/api/elections/${id}`
//         );
//         setElection(res.data);
//         setLoading(false);
//       } catch (error) {
//         console.error("Erreur chargement election", error);
//         setLoading(false);
//       }
//     };

//     fetchElection();
//   }, [id]);

//   // ⏳ Compteur live
//   useEffect(() => {
//     if (!election) return;

//     const interval = setInterval(() => {
//       const now = new Date().getTime();
//       const start = new Date(election.dateDebut).getTime();
//       const end = new Date(election.dateFin).getTime();

//       let distance;

//       if (now < start) {
//         distance = start - now;
//       } else {
//         distance = end - now;
//       }

//       if (distance <= 0) {
//         setTimeLeft("Election terminée");
//         clearInterval(interval);
//         return;
//       }

//       const days = Math.floor(distance / (1000 * 60 * 60 * 24));
//       const hours = Math.floor(
//         (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
//       );
//       const minutes = Math.floor(
//         (distance % (1000 * 60 * 60)) / (1000 * 60)
//       );

//       setTimeLeft(`${days}j ${hours}h ${minutes}m`);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [election]);

//   if (loading)
//     return (
//       <div className="text-center mt-20 text-lg font-semibold">
//         Chargement...
//       </div>
//     );

//   if (!election)
//     return (
//       <div className="text-center mt-20 text-red-500">
//         Election introuvable
//       </div>
//     );

//   // 📊 Statistiques
//   const totalElecteurs = election.totalElecteurs || 0;
//   const totalVotants = election.totalVotants || 0;
//   const tauxParticipation =
//     totalElecteurs > 0
//       ? ((totalVotants / totalElecteurs) * 100).toFixed(2)
//       : 0;

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <Link
//         to="/admin/adminelection"
//         className="flex items-center text-blue-600 mb-6"
//       >
//         <FiArrowLeft className="mr-2" />
//         Retour
//       </Link>

//       <motion.div
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="bg-white shadow-xl rounded-2xl p-8"
//       >
//         {/* 🎯 Titre */}
//         <h1 className="text-3xl font-bold mb-4 text-gray-800">
//           {election.titre}
//         </h1>

//         <p className="text-gray-600 mb-6">{election.description}</p>

//         {/* 📅 Dates */}
//         <div className="grid md:grid-cols-3 gap-6 mb-8">
//           <div className="bg-blue-50 p-6 rounded-xl shadow">
//             <FiClock className="text-blue-600 text-2xl mb-2" />
//             <h3 className="font-semibold">Début</h3>
//             <p>{new Date(election.dateDebut).toLocaleString()}</p>
//           </div>

//           <div className="bg-red-50 p-6 rounded-xl shadow">
//             <FiClock className="text-red-600 text-2xl mb-2" />
//             <h3 className="font-semibold">Fin</h3>
//             <p>{new Date(election.dateFin).toLocaleString()}</p>
//           </div>

//           <div className="bg-green-50 p-6 rounded-xl shadow">
//             <FiCheckCircle className="text-green-600 text-2xl mb-2" />
//             <h3 className="font-semibold">Statut</h3>
//             <p className="capitalize">{election.statut}</p>
//           </div>
//         </div>

//         {/* ⏳ Compteur */}
//         <div className="bg-purple-100 p-6 rounded-xl mb-8 text-center shadow">
//           <h3 className="text-lg font-semibold mb-2">
//             Temps restant
//           </h3>
//           <p className="text-2xl font-bold text-purple-700">
//             {timeLeft}
//           </p>
//         </div>

//         {/* 📊 Statistiques */}
//         <div className="grid md:grid-cols-3 gap-6">
//           <div className="bg-gray-100 p-6 rounded-xl shadow text-center">
//             <FiUsers className="text-3xl mx-auto mb-2 text-gray-700" />
//             <h3 className="font-semibold">Electeurs</h3>
//             <p className="text-xl font-bold">
//               {totalElecteurs}
//             </p>
//           </div>

//           <div className="bg-blue-100 p-6 rounded-xl shadow text-center">
//             <FiUsers className="text-3xl mx-auto mb-2 text-blue-700" />
//             <h3 className="font-semibold">Votants</h3>
//             <p className="text-xl font-bold">
//               {totalVotants}
//             </p>
//           </div>

//           <div className="bg-green-100 p-6 rounded-xl shadow text-center">
//             <FiBarChart2 className="text-3xl mx-auto mb-2 text-green-700" />
//             <h3 className="font-semibold">
//               Taux participation
//             </h3>
//             <p className="text-xl font-bold">
//               {tauxParticipation} %
//             </p>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
//}




















