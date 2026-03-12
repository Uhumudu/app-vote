// src/pages/admin/adminelection/ModifierElecteur.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiArrowLeft, FiHome, FiBarChart2, FiLogOut,
  FiUserCheck, FiCalendar, FiUsers, FiSettings
} from "react-icons/fi";
import api from "../../../services/api.jsx";

export default function ModifierElecteur() {
  const { electionId, id } = useParams();
  const navigate           = useNavigate();
  const activeId           = electionId || localStorage.getItem("activeElectionId");

  const [election, setElection]   = useState(null);
  const [nom, setNom]             = useState("");
  const [prenom, setPrenom]       = useState("");
  const [email, setEmail]         = useState("");
  const [actif, setActif]         = useState(true);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (activeId && id) { fetchElection(); fetchElecteur(); }
  }, [activeId, id]);

  const fetchElection = async () => {
    try { const res = await api.get(`/elections/${activeId}`); setElection(res.data); }
    catch (err) { console.error(err.response?.data || err.message); }
  };

  const fetchElecteur = async () => {
    try {
      setLoading(true);
      // Récupérer la liste des électeurs et trouver le bon
      const res = await api.get(`/elections/${activeId}/electeurs`);
      const found = res.data.find(e => String(e.id) === String(id));
      if (found) {
        setNom(found.nom);
        setPrenom(found.prenom);
        setEmail(found.email);
        setActif(found.actif);
      } else {
        setErrorMsg("Électeur introuvable dans cette élection.");
      }
    } catch (err) {
      setErrorMsg("Impossible de charger les données de l'électeur.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg(""); setSaving(true);

    try {
      // PUT /api/elections/:electionId/electeurs/:electeurId
      await api.put(`/elections/${activeId}/electeurs/${id}`, { nom, prenom, email, actif });
      setSuccessMsg("✅ Électeur modifié avec succès !");
      setTimeout(() => navigate(`/admin/adminelection/electeurs/${activeId}`), 1800);
    } catch (err) {
      if      (err.response?.status === 404) setErrorMsg("Électeur introuvable.");
      else if (err.response?.status === 403) setErrorMsg("🚫 Accès refusé.");
      else setErrorMsg(err.response?.data?.message || "Erreur serveur.");
    } finally { setSaving(false); }
  };

  const Sidebar = () => (
    <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
      <nav className="flex-1 space-y-3">
        <Link to="/adminElectionDashboard"                      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiHome /> Tableau de bord</Link>
        <Link to="/admin/adminelection/ElectionPage"            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiCalendar /> Mes élections</Link>
        <Link to="/admin/adminelection/candidats"               className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUsers /> Candidats</Link>
        <Link to={`/admin/adminelection/electeurs/${activeId}`} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 font-semibold"><FiUserCheck /> Électeurs</Link>
        <Link to="/admin/adminelection/resultats"               className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiBarChart2 /> Résultats</Link>
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

          <button type="button" onClick={() => navigate(`/admin/adminelection/electeurs/${activeId}`)}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl font-semibold transition">
            <FiArrowLeft /> Retour aux électeurs
          </button>

          <h2 className="text-2xl font-bold text-indigo-700 mb-1">Modifier l'électeur</h2>
          {election && <p className="text-sm text-gray-500 mb-6">{election.titre}</p>}

          {errorMsg   && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{errorMsg}</div>}
          {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-sm">{successMsg}</div>}

          {loading ? (
            <div className="text-center py-10 text-indigo-600">Chargement...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block mb-1 font-semibold text-gray-700">Nom *</label>
                <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700">Prénom *</label>
                <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="actif" checked={actif} onChange={() => setActif(!actif)}
                  className="w-5 h-5 accent-indigo-600" />
                <label htmlFor="actif" className="font-semibold text-gray-700 cursor-pointer">Compte actif</label>
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-50">
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}















































// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";

// /* ================= UTILS ================= */
// const generatePassword = () => Math.random().toString(36).slice(-8);

// /* ================= MOCK DATA ================= */
// // Dans une vraie app, tu chargerais depuis API / backend
// const mockElecteurs = [
//   { id: 1, nom: "Jean Dupont", email: "jean@mail.com", mot_de_passe: "abc12345", statut: "ACTIF", a_vote: false },
//   { id: 2, nom: "Marie Ndzi", email: "marie@mail.com", mot_de_passe: "xyz98765", statut: "ACTIF", a_vote: false },
// ];

// export default function ModifierElecteur() {
//   const { electeurId } = useParams();
//   const navigate = useNavigate();

//   const [electeur, setElecteur] = useState(null);
//   const [visiblePassword, setVisiblePassword] = useState(false);

//   /* ================= LOAD ELECTEUR ================= */
//   useEffect(() => {
//     const found = mockElecteurs.find(e => e.id === Number(electeurId));
//     if (found) setElecteur(found);
//   }, [electeurId]);

//   if (!electeur) return <div className="p-8">Chargement...</div>;

//   /* ================= HANDLE CHANGE ================= */
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setElecteur({ ...electeur, [name]: value });
//   };

//   /* ================= HANDLE SAVE ================= */
//   const handleSave = (e) => {
//     e.preventDefault();
//     // Ici tu ferais un PUT / PATCH vers ton backend
//     alert(`Électeur ${electeur.nom} modifié avec succès !`);
//     navigate(`/admin/adminelection/electeurs`); // retour vers la liste
//   };

//   /* ================= HANDLE PASSWORD REGEN ================= */
//   const handleRegenPassword = () => {
//     const newPassword = generatePassword();
//     setElecteur({ ...electeur, mot_de_passe: newPassword });
//     setVisiblePassword(true);
//     setTimeout(() => setVisiblePassword(false), 10000); // masquer après 10s
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 p-8 justify-center">
//       <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
//         <h2 className="text-2xl font-semibold text-indigo-900 mb-6">Modifier Électeur</h2>

//         <form onSubmit={handleSave} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
//             <input
//               type="text"
//               name="nom"
//               value={electeur.nom}
//               onChange={handleChange}
//               className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//             <input
//               type="email"
//               name="email"
//               value={electeur.email}
//               onChange={handleChange}
//               className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
//             <div className="flex items-center gap-2">
//               <input
//                 type={visiblePassword ? "text" : "password"}
//                 name="mot_de_passe"
//                 value={electeur.mot_de_passe}
//                 onChange={handleChange}
//                 className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
//               />
//               <button
//                 type="button"
//                 onClick={() => setVisiblePassword(!visiblePassword)}
//                 className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
//               >
//                 👁
//               </button>
//               <button
//                 type="button"
//                 onClick={handleRegenPassword}
//                 className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
//               >
//                 🔄
//               </button>
//             </div>
//             <p className="text-xs text-gray-500 mt-1">Le mot de passe sera masqué après 10 secondes.</p>
//           </div>

//           <div className="flex justify-end gap-3 mt-4">
//             <button
//               type="button"
//               onClick={() => navigate(`/admin/adminelection/electeurs`)}
//               className="px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-400"
//             >
//               Annuler
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
//             >
//               Enregistrer
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
