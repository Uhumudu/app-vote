import { useState } from "react";

export default function VoteListePreferentiel({ election, listes }) {
  const [selectedList, setSelectedList] = useState(null);
  const [preferences, setPreferences] = useState([]);

  const togglePreference = (id) => {
    setPreferences((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    );
  };

  const submitVote = () => {
    if (!selectedList) {
      return alert("Vous devez choisir une liste");
    }
    alert("Vote préférentiel enregistré avec succès");
  };

  const activeList = listes.find((l) => l.id === selectedList);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{election.titre}</h1>
      <p className="text-gray-600 mb-6">
        Scrutin de liste avec vote préférentiel
      </p>

      {/* Choix de la liste */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {listes.map((liste) => (
          <button
            key={liste.id}
            onClick={() => {
              setSelectedList(liste.id);
              setPreferences([]);
            }}
            className={`p-4 border rounded-xl text-left
              ${selectedList === liste.id
                ? "border-blue-600 bg-blue-50"
                : "hover:border-gray-400"}`}
          >
            <h3 className="font-bold">{liste.nom}</h3>
          </button>
        ))}
      </div>

      {/* Vote préférentiel */}
      {activeList && (
        <>
          <h2 className="text-xl font-semibold mb-3">
            Sélectionnez vos candidats préférés
          </h2>

          <div className="grid md:grid-cols-2 gap-3">
            {activeList.candidats.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 border p-3 rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={preferences.includes(c.id)}
                  onChange={() => togglePreference(c.id)}
                />
                {c.nom}
              </label>
            ))}
          </div>
        </>
      )}

      <button
        onClick={submitVote}
        className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700"
      >
        🗳️ Confirmer mon vote
      </button>
    </div>
  );
}
