import { useState } from "react";

export default function VoteListeBloquee({ election, listes }) {
  const [selectedList, setSelectedList] = useState(null);

  const submitVote = () => {
    if (!selectedList) return alert("Choisissez une liste");
    alert("Vote enregistré avec succès");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{election.titre}</h1>
      <p className="mb-6 text-gray-600">
        Scrutin de liste bloquée – vote pour une liste complète
      </p>

      <div className="space-y-4">
        {listes.map((liste) => (
          <div
            key={liste.id}
            onClick={() => setSelectedList(liste.id)}
            className={`border rounded-xl p-4 cursor-pointer
              ${selectedList === liste.id
                ? "border-green-600 bg-green-50"
                : "hover:border-gray-400"}`}
          >
            <h3 className="font-bold text-lg">{liste.nom}</h3>

            <ul className="mt-2 text-sm text-gray-700 list-disc pl-6">
              {liste.candidats.map((c) => (
                <li key={c.id}>{c.nom}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={submitVote}
        className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700"
      >
        🗳️ Voter pour cette liste
      </button>
    </div>
  );
}
