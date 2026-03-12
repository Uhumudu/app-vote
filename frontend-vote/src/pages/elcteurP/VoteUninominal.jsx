import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function VoteUninominal({ election, candidats }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleVote = () => {
    if (!selected) return alert("Veuillez sélectionner un candidat");
    // API => envoyer le vote
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{election.titre}</h1>
      <p className="text-gray-600 mb-6">
        Scrutin uninominal – 1 candidat = 1 vote
      </p>

      {submitted ? (
        <div className="bg-green-100 p-6 rounded-xl text-green-800 flex items-center gap-3">
          <CheckCircle />
          Votre vote a été enregistré avec succès.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {candidats.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`border rounded-xl p-4 cursor-pointer transition
                ${selected === c.id
                  ? "border-blue-600 bg-blue-50"
                  : "hover:border-gray-400"}`}
            >
              <h3 className="font-semibold text-lg">{c.nom}</h3>
              <p className="text-sm text-gray-600">{c.parti}</p>
            </div>
          ))}
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleVote}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
        >
          🗳️ Valider mon vote
        </button>
      )}
    </div>
  );
}
