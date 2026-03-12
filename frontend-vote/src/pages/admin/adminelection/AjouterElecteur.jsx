// src/pages/admin/adminelection/AjouterElecteur.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiEye, FiEyeOff, FiCopy, FiArrowLeft, FiHome, FiBarChart2,
  FiLogOut, FiUserCheck, FiCalendar, FiUsers, FiSettings, FiRefreshCw
} from "react-icons/fi";
import api from "../../../services/api.jsx";

const generatePassword = () => Math.random().toString(36).slice(-8);

export default function AjouterElecteur() {
  const { electionId } = useParams();
  const navigate       = useNavigate();
  const activeId       = electionId || localStorage.getItem("activeElectionId");

  const [election, setElection]         = useState(null);
  const [nom, setNom]                   = useState("");
  const [prenom, setPrenom]             = useState("");
  const [email, setEmail]               = useState("");
  const [motDePasse, setMotDePasse]     = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [copySuccess, setCopySuccess]   = useState(false);
  const [actif, setActif]               = useState(true);
  const [errorMsg, setErrorMsg]         = useState("");
  const [successMsg, setSuccessMsg]     = useState("");
  const [loading, setLoading]           = useState(false);

  useEffect(() => { if (activeId) fetchElection(); }, [activeId]);

  const fetchElection = async () => {
    try { const res = await api.get(`/elections/${activeId}`); setElection(res.data); }
    catch (err) { console.error(err.response?.data || err.message); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(motDePasse);
    setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg(""); setLoading(true);

    try {
      // POST /api/elections/:electionId/electeurs
      const res = await api.post(`/elections/${activeId}/electeurs`, { nom, prenom, email, actif });

      // Le backend retourne le mot de passe généré — on l'affiche
      const pwd = res.data.mot_de_passe || motDePasse;
      setSuccessMsg(`✅ ${prenom} ${nom} ajouté ! Mot de passe : ${pwd}`);
      setNom(""); setPrenom(""); setEmail("");
      setMotDePasse(generatePassword()); setActif(true); setShowPassword(false);

      setTimeout(() => navigate(`/admin/adminelection/electeurs/${activeId}`), 2500);
    } catch (err) {
      if      (err.response?.status === 409) setErrorMsg("⚠️ Cet électeur est déjà inscrit à cette élection.");
      else if (err.response?.status === 403) setErrorMsg("🚫 Accès refusé ou élection non autorisée.");
      else if (err.response?.status === 401) setErrorMsg("🚫 Session expirée, veuillez vous reconnecter.");
      else setErrorMsg(err.response?.data?.message || "Erreur serveur lors de l'ajout.");
    } finally { setLoading(false); }
  };

  const Sidebar = () => (
    <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
      <nav className="flex-1 space-y-3">
        <Link to="/adminElectionDashboard"                        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiHome /> Tableau de bord</Link>
        <Link to="/admin/adminelection/ElectionPage"              className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiCalendar /> Mes élections</Link>
        {/* <Link to="/admin/adminelection/candidats"                 className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUsers /> Candidats</Link>
        <Link to={`/admin/adminelection/electeurs/${activeId}`}   className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 font-semibold"><FiUserCheck /> Électeurs</Link>
        <Link to="/admin/adminelection/resultats"                 className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiBarChart2 /> Résultats</Link> */}
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

          <h2 className="text-2xl font-bold text-indigo-700 mb-1">Ajouter un électeur</h2>
          {election && <p className="text-sm text-gray-500 mb-6">{election.titre}</p>}

          {errorMsg   && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{errorMsg}</div>}
          {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-sm">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block mb-1 font-semibold text-gray-700">Nom *</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
                placeholder="Dupont"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700">Prénom *</label>
              <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} required
                placeholder="Jean"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="jean.dupont@email.com"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            {/* Mot de passe — affiché côté admin pour communication manuelle */}
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                Mot de passe provisoire
                <span className="ml-2 text-xs text-gray-400 font-normal">(à communiquer à l'électeur)</span>
              </label>
              <div className="flex items-center gap-2">
                <input type={showPassword ? "text" : "password"} value={motDePasse} readOnly
                  className="flex-1 px-4 py-3 border rounded-xl font-mono bg-gray-50 text-gray-700" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="p-3 bg-gray-200 rounded-xl hover:bg-gray-300" title={showPassword ? "Masquer" : "Afficher"}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
                <button type="button" onClick={() => setMotDePasse(generatePassword())}
                  className="p-3 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200" title="Regénérer">
                  <FiRefreshCw />
                </button>
                <button type="button" onClick={handleCopy}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700" title="Copier">
                  <FiCopy />
                </button>
              </div>
              {copySuccess && <p className="text-green-600 text-xs mt-1">✅ Copié !</p>}
              <p className="text-xs text-amber-600 mt-1">⚠️ Le backend génère son propre mot de passe hashé. Notez celui-ci pour le communiquer à l'électeur.</p>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="actif" checked={actif} onChange={() => setActif(!actif)}
                className="w-5 h-5 accent-indigo-600" />
              <label htmlFor="actif" className="font-semibold text-gray-700 cursor-pointer">Compte actif</label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Ajout en cours..." : "Ajouter l'électeur"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
































// import React, { useState } from "react"; 
// import { useNavigate, useParams, Link } from "react-router-dom";
// import {
//   FiEye, FiCopy, FiArrowLeft, FiHome, FiBarChart2,
//   FiLogOut, FiUserCheck, FiCalendar, FiUsers, FiSettings
// } from "react-icons/fi";
// import api from "../../../services/api.jsx";

// /* ================= MOCK DATA ================= */
// const mockElections = [
//   { id_election: 1, titre: "Élection universitaire 2026" },
//   { id_election: 2, titre: "Conseil étudiant" }
// ];

// /* ================= COMPONENT ================= */
// export default function AjouterElecteur() {
//   const { electionId } = useParams();
//   const navigate = useNavigate();

//   const [nom, setNom] = useState("");
//   const [prenom, setPrenom] = useState("");
//   const [email, setEmail] = useState("");
//   const [motDePasse, setMotDePasse] = useState(generatePassword());
//   const [showPassword, setShowPassword] = useState(false);
//   const [copySuccess, setCopySuccess] = useState(false);
//   const [actif, setActif] = useState(true);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [loading, setLoading] = useState(false);

//   /* ================= GENERATE PASSWORD ================= */
//   function generatePassword() {
//     return Math.random().toString(36).slice(-8);
//   }

//   /* ================= COPY PASSWORD ================= */
//   const handleCopy = () => {
//     navigator.clipboard.writeText(motDePasse);
//     setCopySuccess(true);
//     setTimeout(() => setCopySuccess(false), 2000);
//   };

//   /* ================= SUBMIT FORM ================= */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setErrorMsg("");
//     setLoading(true);

//     try {
//       const newUtilisateur = { nom, prenom, email, mot_de_passe: motDePasse, actif };

//       console.log("Token envoyé :", localStorage.getItem("token"));
//       console.log("Données envoyées :", newUtilisateur);

//       const response = await api.post(`/electeurs/${electionId}`, newUtilisateur);

//       console.log("Réponse backend :", response.data);

//       // Succès
//       alert(`Électeur ${prenom} ${nom} ajouté avec succès !`);

//       // Reset formulaire
//       setNom("");
//       setPrenom("");
//       setEmail("");
//       setMotDePasse(generatePassword());
//       setActif(true);
//       setShowPassword(false);

//       navigate(`/admin/adminelection/electeurs/${electionId}`);

//     } catch (error) {
//       console.error("Erreur ajout électeur :", error);

//       if (error.response) {
//         // Backend a renvoyé une réponse
//         if (error.response.status === 403) {
//           setErrorMsg("🚫 Accès refusé : vous n'êtes pas admin de cette élection ou token invalide.");
//         } else if (error.response.status === 401) {
//           setErrorMsg("🚫 Non autorisé : token manquant ou expiré. Veuillez vous reconnecter.");
//         } else {
//           setErrorMsg(error.response.data.message || "Erreur serveur lors de l'ajout de l'électeur");
//         }
//       } else {
//         setErrorMsg("Erreur réseau ou serveur indisponible");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= FIND ELECTION ================= */
//   const election = mockElections.find(e => e.id_election === Number(electionId)) || mockElections[0];

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
//           <Link to="/admin/adminelection/electeurs/${electionId}" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//            <FiUserCheck /> Électeurs
//           </Link>
//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiBarChart2 /> Résultats
//           </Link>
//         </nav>

//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings /> Paramètres
//           </Link>
//           <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main className="flex-1 p-8 flex justify-center items-start">
//         <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-lg">

//           <button
//             type="button"
//             onClick={() => navigate(`/admin/adminelection/electeurs/${electionId}`)}
//             className="mb-4 flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl font-semibold transition"
//           >
//             <FiArrowLeft /> Retour aux électeurs
//           </button>

//           <h2 className="text-2xl font-bold text-indigo-700 mb-6">
//             Ajouter un électeur – {election.titre}
//           </h2>

//           {/* MESSAGE D'ERREUR */}
//           {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl">{errorMsg}</div>}

//           <form onSubmit={handleSubmit} className="space-y-6">

//             {/* NOM */}
//             <div>
//               <label className="block mb-1 font-semibold text-gray-700">Nom</label>
//               <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required
//                 className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
//               />
//             </div>

//             {/* PRENOM */}
//             <div>
//               <label className="block mb-1 font-semibold text-gray-700">Prénom</label>
//               <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} required
//                 className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
//               />
//             </div>

//             {/* EMAIL */}
//             <div>
//               <label className="block mb-1 font-semibold text-gray-700">Email</label>
//               <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
//                 className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
//               />
//             </div>

//             {/* MOT DE PASSE */}
//             <div>
//               <label className="block mb-1 font-semibold text-gray-700">Mot de passe</label>
//               <div className="flex items-center gap-2">
//                 <input type={showPassword ? "text" : "password"} value={motDePasse} readOnly
//                   className="flex-1 px-4 py-3 border rounded-xl font-mono"
//                 />
//                 <button type="button" onClick={() => setShowPassword(!showPassword)}
//                   className="px-3 py-2 bg-gray-200 rounded-xl hover:bg-gray-300"><FiEye /></button>
//                 <button type="button" onClick={handleCopy}
//                   className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"><FiCopy /></button>
//                 {copySuccess && <span className="text-green-600 text-sm">Copié !</span>}
//               </div>
//             </div>

//             {/* ACTIF */}
//             <div className="flex items-center gap-3">
//               <input type="checkbox" checked={actif} onChange={() => setActif(!actif)} className="w-5 h-5" />
//               <label className="font-semibold text-gray-700">Compte actif</label>
//             </div>

//             <button type="submit" disabled={loading}
//               className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-50">
//               {loading ? "Ajout en cours..." : "Ajouter l’électeur"}
//             </button>

//           </form>
//         </div>
//       </main>
//     </div>
//   );
// }




















// import React, { useState } from "react"; 
// import { useNavigate, useParams, Link } from "react-router-dom";
// import {
//   FiEye,
//   FiCopy,
//   FiArrowLeft,
//   FiHome,
//   FiBarChart2,
//   FiLogOut,
//   FiUserCheck,
//   FiCalendar,
//   FiUsers,
//   FiSettings
// } from "react-icons/fi";
// import api from "../../../services/api.jsx"; // <-- import de ton api Axios

// /* ================= MOCK DATA ================= */
// const mockElections = [
//   { id_election: 1, titre: "Élection universitaire 2026" },
//   { id_election: 2, titre: "Conseil étudiant" }
// ];

// /* ================= COMPONENT ================= */
// export default function AjouterElecteur() {
//   const { electionId } = useParams();
//   const navigate = useNavigate();

//   const [nom, setNom] = useState("");
//   const [prenom, setPrenom] = useState("");
//   const [email, setEmail] = useState("");
//   const [motDePasse, setMotDePasse] = useState(generatePassword());
//   const [showPassword, setShowPassword] = useState(false);
//   const [copySuccess, setCopySuccess] = useState(false);
//   const [actif, setActif] = useState(true);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [loading, setLoading] = useState(false);

//   /* ================= GENERATE PASSWORD ================= */
//   function generatePassword() {
//     return Math.random().toString(36).slice(-8);
//   }

//   /* ================= COPY PASSWORD ================= */
//   const handleCopy = () => {
//     navigator.clipboard.writeText(motDePasse);
//     setCopySuccess(true);
//     setTimeout(() => setCopySuccess(false), 2000);
//   };

//   /* ================= SUBMIT FORM ================= */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setErrorMsg("");
//     setLoading(true);

//     try {
//       const newUtilisateur = {
//         nom,
//         prenom,
//         email,
//         mot_de_passe: motDePasse,
//         actif
//       };

//       // Appel POST vers le backend
//       await api.post(`/electeurs/${electionId}`, newUtilisateur);

//       // Succès
//       alert(`Électeur ${prenom} ${nom} ajouté avec succès !`);

//       // Reset formulaire
//       setNom("");
//       setPrenom("");
//       setEmail("");
//       setMotDePasse(generatePassword());
//       setActif(true);
//       setShowPassword(false);

//       navigate(`/admin/adminelection/electeurs/${electionId}`);

//     } catch (error) {
//       console.error(error);
//       setErrorMsg(error.response?.data?.message || "Erreur lors de l'ajout de l'électeur");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= FIND ELECTION ================= */
//   const election = mockElections.find(e => e.id_election === Number(electionId)) || mockElections[0];

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
//           <Link to={`/admin/adminelection/electeurs/${electionId}`} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 text-indigo-700 font-semibold">
//             <FiUserCheck /> Électeurs
//           </Link>
//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiBarChart2 /> Résultats
//           </Link>
//         </nav>

//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings /> Paramètres
//           </Link>
//           <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main className="flex-1 p-8 flex justify-center items-start">
//         <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-lg">

//           {/* BOUTON RETOUR */}
//           <button
//             type="button"
//             onClick={() => navigate(`/admin/adminelection/electeurs/${electionId}`)}
//             className="mb-4 flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl font-semibold transition"
//           >
//             <FiArrowLeft /> Retour aux électeurs
//           </button>

//           <h2 className="text-2xl font-bold text-indigo-700 mb-6">
//             Ajouter un électeur – {election.titre}
//           </h2>

//           {/* MESSAGE D'ERREUR */}
//           {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl">{errorMsg}</div>}

//           <form onSubmit={handleSubmit} className="space-y-6">

//             {/* NOM */}
//             <div>
//               <label className="block mb-1 font-semibold text-gray-700">Nom</label>
//               <input
//                 type="text"
//                 value={nom}
//                 onChange={(e) => setNom(e.target.value)}
//                 required
//                 className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
//               />
//             </div>

//             {/* PRENOM */}
//             <div>
//               <label className="block mb-1 font-semibold text-gray-700">Prénom</label>
//               <input
//                 type="text"
//                 value={prenom}
//                 onChange={(e) => setPrenom(e.target.value)}
//                 required
//                 className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
//               />
//             </div>

//             {/* EMAIL */}
//             <div>
//               <label className="block mb-1 font-semibold text-gray-700">Email</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
//               />
//             </div>

//             {/* MOT DE PASSE */}
//             <div>
//               <label className="block mb-1 font-semibold text-gray-700">Mot de passe</label>
//               <div className="flex items-center gap-2">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   value={motDePasse}
//                   readOnly
//                   className="flex-1 px-4 py-3 border rounded-xl font-mono"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="px-3 py-2 bg-gray-200 rounded-xl hover:bg-gray-300"
//                 >
//                   <FiEye />
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleCopy}
//                   className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
//                 >
//                   <FiCopy />
//                 </button>
//                 {copySuccess && <span className="text-green-600 text-sm">Copié !</span>}
//               </div>
//             </div>

//             {/* ACTIF */}
//             <div className="flex items-center gap-3">
//               <input
//                 type="checkbox"
//                 checked={actif}
//                 onChange={() => setActif(!actif)}
//                 className="w-5 h-5"
//               />
//               <label className="font-semibold text-gray-700">Compte actif</label>
//             </div>

//             {/* BOUTON SUBMIT */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-50"
//             >
//               {loading ? "Ajout en cours..." : "Ajouter l’électeur"}
//             </button>

//           </form>
//         </div>
//       </main>
//     </div>
//   );
// }