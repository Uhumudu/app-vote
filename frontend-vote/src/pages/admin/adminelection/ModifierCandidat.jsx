// src/pages/admin/adminelection/ModifierCandidat.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiArrowLeft, FiHome, FiUsers, FiBarChart2,
  FiSettings, FiLogOut, FiCalendar, FiUserCheck
} from "react-icons/fi";
import api from "../../../services/api.jsx";

export default function ModifierCandidat() {
  const { candidatId } = useParams();
  const navigate       = useNavigate();
  const activeId       = localStorage.getItem("activeElectionId");

  const [election, setElection]   = useState(null);
  const [listes, setListes]       = useState([]);
  const [candidat, setCandidat]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Champs
  const [nom, setNom]       = useState("");
  const [parti, setParti]   = useState("");
  const [age, setAge]       = useState("");
  const [photo, setPhoto]   = useState("");
  const [listeId, setListeId] = useState("");

  useEffect(() => {
    if (candidatId) fetchCandidatAndElection();
  }, [candidatId]);

  const fetchCandidatAndElection = async () => {
    try {
      setLoading(true);

      // Récupérer les candidats de l'élection active
      if (!activeId) { setErrorMsg("Aucune élection sélectionnée."); return; }

      const [elecRes, candidatsRes] = await Promise.all([
        api.get(`/elections/${activeId}`),
        api.get(`/elections/${activeId}/candidats`)
      ]);

      setElection(elecRes.data);

      const found = candidatsRes.data.find(c => String(c.id_candidat) === String(candidatId));
      if (!found) { setErrorMsg("Candidat introuvable."); return; }

      setCandidat(found);
      setNom(found.nom);
      setParti(found.parti || "");
      setAge(found.age || "");
      setPhoto(found.photo || "");
      setListeId(found.id_liste || "");

      // Charger les listes si scrutin LISTE
      if (elecRes.data.type === "LISTE") {
        const listesRes = await api.get(`/elections/${activeId}/listes`).catch(() => ({ data: [] }));
        setListes(listesRes.data);
      }
    } catch (err) {
      setErrorMsg("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg(""); setSaving(true);

    try {
      // PUT /api/candidats/:id
      await api.put(`/candidats/${candidatId}`, {
        nom: nom.trim(),
        parti: parti.trim() || null,
        age: age ? Number(age) : null,
        photo: photo.trim() || null,
        liste_id: listeId || null
      });

      setSuccessMsg("✅ Candidat modifié avec succès !");
      setTimeout(() => navigate("/admin/adminelection/candidats"), 1800);
    } catch (err) {
      if      (err.response?.status === 403) setErrorMsg("🚫 Modification impossible : élection en cours ou terminée.");
      else if (err.response?.status === 404) setErrorMsg("Candidat introuvable.");
      else setErrorMsg(err.response?.data?.message || "Erreur serveur.");
    } finally { setSaving(false); }
  };

  const Sidebar = () => (
    <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
      <nav className="flex-1 space-y-3">
        <Link to="/adminElectionDashboard"           className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiHome /> Tableau de bord</Link>
        <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiCalendar /> Mes élections</Link>
        <Link to="/admin/adminelection/candidats"    className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 font-semibold"><FiUsers /> Candidats</Link>
        <Link to="/admin/adminelection/electeurs"    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUserCheck /> Électeurs</Link>
        <Link to="/admin/adminelection/resultats"    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiBarChart2 /> Résultats</Link>
      </nav>
      <div className="space-y-3 mt-6">
        <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiSettings /> Paramètres</Link>
        <Link to="/logout"   className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600"><FiLogOut /> Déconnexion</Link>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <Sidebar />
      <main className="flex-1 p-8 flex justify-center items-start">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-lg">

          <button type="button" onClick={() => navigate("/admin/adminelection/candidats")}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl font-semibold transition">
            <FiArrowLeft /> Retour aux candidats
          </button>

          <h2 className="text-2xl font-bold text-indigo-700 mb-1">Modifier le candidat</h2>
          {election && <p className="text-sm text-gray-500 mb-6">{election.titre}</p>}

          {errorMsg   && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{errorMsg}</div>}
          {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-sm">{successMsg}</div>}

          {loading ? (
            <div className="text-center py-10 text-indigo-600">Chargement...</div>
          ) : !candidat ? (
            <div className="text-center py-10 text-red-500">Candidat introuvable.</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* NOM */}
              <div>
                <label className="block mb-1 font-semibold text-gray-700">Nom *</label>
                <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              {/* PARTI */}
              <div>
                <label className="block mb-1 font-semibold text-gray-700">Parti</label>
                <input type="text" value={parti} onChange={e => setParti(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              {/* ÂGE */}
              {election?.type !== "LISTE" && (
                <div>
                  <label className="block mb-1 font-semibold text-gray-700">Âge</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)} min="18" max="120"
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              )}

              {/* PHOTO */}
              <div>
                <label className="block mb-1 font-semibold text-gray-700">Photo (URL)</label>
                <input type="text" value={photo} onChange={e => setPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                {photo && (
                  <img src={photo} alt="Aperçu" className="mt-2 w-16 h-16 rounded-full object-cover border" onError={e => e.target.style.display = "none"} />
                )}
              </div>

              {/* LISTE */}
              {election?.type === "LISTE" && (
                <div>
                  <label className="block mb-1 font-semibold text-gray-700">Liste</label>
                  <select value={listeId} onChange={e => setListeId(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">— Sans liste —</option>
                    {listes.map(l => <option key={l.id_liste} value={l.id_liste}>{l.nom}</option>)}
                  </select>
                </div>
              )}

              {/* Info statut */}
              {election && (election.statut === "EN_COURS" || election.statut === "TERMINEE") && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                  ⚠️ Cette élection est {election.statut === "EN_COURS" ? "en cours" : "terminée"} — la modification sera refusée.
                </div>
              )}

              <button type="submit" disabled={saving}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
























// // src/pages/adminElection/ModifierCandidat.jsx
// import React, { useState, useEffect } from "react";
// import { Link, useParams } from "react-router-dom";
// import {
//   FiHome,
//   FiUsers,
//   FiBarChart2,
//   FiSettings,
//   FiLogOut,
//   FiCalendar,
//   FiUserCheck
// } from "react-icons/fi";

// // Mock data candidat
// const mockCandidats = [
//   { id: 1, nom: "Jean Dupont", parti: "Parti A", age: 22, photo: "" },
//   { id: 2, nom: "Marie Curie", parti: "Parti B", age: 24, photo: "" },
// ];

// export default function ModifierCandidat() {
//   const { candidatId } = useParams();
//   const [candidat, setCandidat] = useState(null);
//   const [nom, setNom] = useState("");
//   const [parti, setParti] = useState("");
//   const [age, setAge] = useState("");
//   const [photo, setPhoto] = useState("");

//   useEffect(() => {
//     const found = mockCandidats.find(c => c.id === Number(candidatId));
//     if (found) {
//       setCandidat(found);
//       setNom(found.nom);
//       setParti(found.parti);
//       setAge(found.age);
//       setPhoto(found.photo);
//     }
//   }, [candidatId]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log({ nom, parti, age, photo });
//     // Ici tu peux faire l'appel API pour modifier le candidat
//   };

//   if (!candidat) return <div className="p-8 text-gray-700">Chargement...</div>;

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       {/* ================= SIDEBAR ================= */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>

//         <nav className="flex-1 space-y-3">
//           <Link to="adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiHome /> Tableau de bord
//           </Link>

//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiCalendar /> Mes élections
//           </Link>

//           <Link to="/admin/adminelection/candidats" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100">
//             <FiUsers /> Candidats
//           </Link>

//           <Link to="/admin/adminelection/electeurs/${electionId}" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//                       <FiUserCheck /> Électeurs
//                     </Link>

//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiBarChart2 /> Résultats
//           </Link>
//         </nav>

//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings /> Paramètres
//           </Link>

//           <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main className="flex-1 p-8">
//         <div className="bg-white/80 rounded-xl shadow p-6 max-w-3xl mx-auto">
//           <h2 className="text-2xl font-semibold text-indigo-900 mb-6">Modifier le candidat - {candidat.nom}</h2>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-gray-700 mb-1">Nom</label>
//               <input
//                 type="text"
//                 value={nom}
//                 onChange={(e) => setNom(e.target.value)}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-gray-700 mb-1">Parti</label>
//               <input
//                 type="text"
//                 value={parti}
//                 onChange={(e) => setParti(e.target.value)}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2"
//               />
//             </div>

//             <div>
//               <label className="block text-gray-700 mb-1">Âge</label>
//               <input
//                 type="number"
//                 value={age}
//                 onChange={(e) => setAge(e.target.value)}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2"
//                 min="18"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-gray-700 mb-1">Photo (URL)</label>
//               <input
//                 type="text"
//                 value={photo}
//                 onChange={(e) => setPhoto(e.target.value)}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2"
//               />
//             </div>

//             <button
//               type="submit"
//               className="w-full bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
//             >
//               Enregistrer les modifications
//             </button>
//           </form>
//         </div>
//       </main>
//     </div>
//   );
// }
