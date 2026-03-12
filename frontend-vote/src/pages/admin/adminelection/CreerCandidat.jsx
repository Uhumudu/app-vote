// src/pages/admin/adminelection/CreerCandidat.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiArrowLeft, FiHome, FiUsers, FiBarChart2,
  FiSettings, FiLogOut, FiCalendar, FiUserCheck
} from "react-icons/fi";
import api from "../../../services/api.jsx";

export default function CreerCandidat() {
  const { electionId } = useParams();
  const navigate       = useNavigate();
  const activeId       = electionId || localStorage.getItem("activeElectionId");

  const [election, setElection] = useState(null);
  const [listes, setListes]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Champs du formulaire
  const [nom, setNom]       = useState("");
  const [parti, setParti]   = useState("");
  const [age, setAge]       = useState("");
  const [photo, setPhoto]   = useState("");
  const [listeId, setListeId] = useState("");
  const [nouvelleListe, setNouvelleListe] = useState("");
  const [creerNouvelleListeMode, setCreerNouvelleListeMode] = useState(false);

  useEffect(() => {
    if (activeId) { fetchElection(); }
  }, [activeId]);

  const fetchElection = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/elections/${activeId}`);
      setElection(res.data);

      // Si scrutin LISTE → charger les listes existantes
      if (res.data.type === "LISTE") {
        const listesRes = await api.get(`/elections/${activeId}/listes`).catch(() => ({ data: [] }));
        setListes(listesRes.data);
      }
    } catch (err) {
      setErrorMsg("Impossible de charger les données de l'élection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSaving(true);

    try {
      const payload = {
        nom: nom.trim(),
        parti: parti.trim() || undefined,
        age: age ? Number(age) : undefined,
        photo: photo.trim() || undefined,
        // Gestion liste
        liste_id: (election?.type === "LISTE" && !creerNouvelleListeMode) ? listeId || undefined : undefined
      };

      // Si nouvelle liste : on passe le nom dans un champ spécial
      // Le backend créera la liste automatiquement si on utilise l'import,
      // mais pour l'ajout unitaire on peut créer la liste d'abord
      if (election?.type === "LISTE" && creerNouvelleListeMode && nouvelleListe.trim()) {
        // Créer la liste via import avec un seul candidat
        await api.post(`/elections/${activeId}/candidats/import`, {
          candidats: [{ nom: payload.nom, parti: payload.parti, age: payload.age, liste: nouvelleListe.trim() }]
        });
      } else {
        // POST /api/elections/:electionId/candidats
        await api.post(`/elections/${activeId}/candidats`, payload);
      }

      alert(`✅ Candidat ${nom} créé avec succès !`);
      navigate(`/admin/adminelection/candidats`);
    } catch (err) {
      if      (err.response?.status === 403) setErrorMsg("🚫 Accès refusé ou élection non modifiable.");
      else if (err.response?.status === 400) setErrorMsg(err.response.data?.message || "Données invalides.");
      else setErrorMsg(err.response?.data?.message || "Erreur serveur.");
    } finally { setSaving(false); }
  };

  const Sidebar = () => (
    <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
      <nav className="flex-1 space-y-3">
        <Link to="/adminElectionDashboard"           className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiHome /> Tableau de bord</Link>
        <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiCalendar /> Mes élections</Link>
        {/* <Link to="/admin/adminelection/candidats"    className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 font-semibold"><FiUsers /> Candidats</Link>
        <Link to="/admin/adminelection/electeurs"    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUserCheck /> Électeurs</Link>
        <Link to="/admin/adminelection/resultats"    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiBarChart2 /> Résultats</Link> */}
      </nav>
      <div className="space-y-3 mt-6">
        <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiSettings /> Paramètres</Link>
        <Link to="/logout"   className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600"><FiLogOut /> Déconnexion</Link>
      </div>
    </aside>
  );

  if (loading) return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center text-indigo-700 font-medium">Chargement...</main>
    </div>
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

          <h2 className="text-2xl font-bold text-indigo-700 mb-1">Ajouter un candidat</h2>
          {election && (
            <p className="text-sm text-gray-500 mb-6">
              {election.titre} <span className="ml-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-medium">{election.type}</span>
            </p>
          )}

          {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* NOM */}
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Nom complet *</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
                placeholder="Ex: Jean Dupont"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            {/* PARTI */}
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Parti</label>
              <input type="text" value={parti} onChange={e => setParti(e.target.value)}
                placeholder="Ex: Parti A"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            {/* ÂGE — masqué pour scrutin LISTE */}
            {election?.type !== "LISTE" && (
              <div>
                <label className="block mb-1 font-semibold text-gray-700">Âge *</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} required min="18" max="120"
                  placeholder="Ex: 35"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            )}

            {/* PHOTO URL */}
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Photo (URL)</label>
              <input type="text" value={photo} onChange={e => setPhoto(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            {/* LISTE — uniquement pour scrutin LISTE */}
            {election?.type === "LISTE" && (
              <div>
                <label className="block mb-1 font-semibold text-gray-700">Liste *</label>

                {/* Toggle : choisir liste existante OU en créer une */}
                <div className="flex gap-3 mb-3">
                  <button type="button"
                    onClick={() => setCreerNouvelleListeMode(false)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${!creerNouvelleListeMode ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    Liste existante
                  </button>
                  <button type="button"
                    onClick={() => setCreerNouvelleListeMode(true)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${creerNouvelleListeMode ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    + Nouvelle liste
                  </button>
                </div>

                {!creerNouvelleListeMode ? (
                  <select value={listeId} onChange={e => setListeId(e.target.value)} required
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">— Sélectionner une liste —</option>
                    {listes.map(l => <option key={l.id_liste} value={l.id_liste}>{l.nom}</option>)}
                  </select>
                ) : (
                  <input type="text" value={nouvelleListe} onChange={e => setNouvelleListe(e.target.value)} required
                    placeholder="Nom de la nouvelle liste"
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                )}
              </div>
            )}

            <button type="submit" disabled={saving}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Création en cours..." : "Créer le candidat"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}















































// // src/pages/adminElection/CreerCandidat.jsx
// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams, Link } from "react-router-dom";
// import {
//   FiEdit,
//   FiPlus,
//   FiUpload,
//   FiHome,
//   FiUsers,
//   FiBarChart2,
//   FiSettings,
//   FiLogOut,
//   FiCalendar,
//   FiUserCheck,
// } from "react-icons/fi";

// const mockElections = [
//   { id_election: 1, titre: "Élection universitaire 2026", type_scrutin: "UNINOMINAL" },
//   { id_election: 2, titre: "Conseil étudiant", type_scrutin: "BINOMINAL" },
//   { id_election: 3, titre: "Élection départementale", type_scrutin: "LISTE" },
// ];

// const mockListes = [
//   { id: 1, nom: "Liste Étudiants A" },
//   { id: 2, nom: "Liste Étudiants B" },
// ];

// export default function CreerCandidat() {
//   const { electionId } = useParams();
//   const navigate = useNavigate();
//   const [election, setElection] = useState(null);

//   // Form state
//   const [nom, setNom] = useState("");
//   const [parti, setParti] = useState("");
//   const [age, setAge] = useState("");
//   const [photo, setPhoto] = useState(null);
//   const [listeId, setListeId] = useState("");

//   useEffect(() => {
//     const foundElection = mockElections.find((e) => e.id_election === Number(electionId)) || mockElections[0];
//     setElection(foundElection);
//   }, [electionId]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!nom || !parti || !age) {
//       alert("Veuillez remplir tous les champs requis.");
//       return;
//     }

//     const newCandidat = {
//       nom,
//       parti,
//       age,
//       photo,
//       electionId: election.id_election,
//       listeId: election.type_scrutin === "LISTE" ? listeId : null,
//     };

//     console.log("Nouveau candidat :", newCandidat);
//     alert("Candidat créé avec succès !");
//     navigate(`/admin/adminelection/candidats`);
//   };

//   if (!election) return <div className="p-8 text-gray-700">Chargement...</div>;

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ================= SIDEBAR ================= */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>

//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiHome /> Tableau de bord
//           </Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiCalendar /> Mes élections
//           </Link>
//           <Link to="/admin/adminelection/candidats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiUsers /> Candidats
//           </Link>
//         <Link to="/admin/adminelection/electeurs/${electionId}" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//                     <FiUserCheck /> Électeurs
//                   </Link>
//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiBarChart2 /> Résultats
//           </Link>
//         </nav>

//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings /> Paramètres
//           </Link>
//           <Link to="/logout" className="flex items-center text-red-600 gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main className="flex-1 p-8">
        
//         {/* BOUTON RETOUR */}
//         <button
//           onClick={() => navigate("/admin/adminelection/candidats")}
//           className="mb-4 flex items-center gap-2 text-indigo-700 font-semibold hover:text-indigo-900"
//         >
//           ← Retour aux candidats
//         </button>

//         <h2 className="text-xl font-semibold text-indigo-900 mb-6">
//           Ajouter un candidat - {election.titre} ({election.type_scrutin})
//         </h2>

//         <form
//           onSubmit={handleSubmit}
//           className="bg-white/90 rounded-xl shadow p-6 max-w-xl mx-auto space-y-4"
//         >
//           <div>
//             <label className="block text-gray-700 mb-1">Nom complet</label>
//             <input
//               type="text"
//               className="w-full border border-gray-300 rounded-lg px-3 py-2"
//               value={nom}
//               onChange={(e) => setNom(e.target.value)}
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-gray-700 mb-1">Parti</label>
//             <input
//               type="text"
//               className="w-full border border-gray-300 rounded-lg px-3 py-2"
//               value={parti}
//               onChange={(e) => setParti(e.target.value)}
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-gray-700 mb-1">Âge</label>
//             <input
//               type="number"
//               className="w-full border border-gray-300 rounded-lg px-3 py-2"
//               value={age}
//               onChange={(e) => setAge(e.target.value)}
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-gray-700 mb-1">Photo</label>
//             <input
//               type="file"
//               className="w-full"
//               onChange={(e) => setPhoto(e.target.files[0])}
//             />
//           </div>

//           {election.type_scrutin === "LISTE" && (
//             <div>
//               <label className="block text-gray-700 mb-1">Liste</label>
//               <select
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2"
//                 value={listeId}
//                 onChange={(e) => setListeId(e.target.value)}
//                 required
//               >
//                 <option value="">-- Sélectionnez une liste --</option>
//                 {mockListes.map((l) => (
//                   <option key={l.id} value={l.id}>
//                     {l.nom}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}

//           <button
//             type="submit"
//             className="w-full bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition font-semibold"
//           >
//             Créer le candidat
//           </button>
//         </form>
//       </main>
//     </div>
//   );
// }
