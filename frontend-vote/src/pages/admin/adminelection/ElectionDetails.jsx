

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











