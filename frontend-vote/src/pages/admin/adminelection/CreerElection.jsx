// src/pages/adminElection/CreerElection.jsx
import React, { useState } from "react";
import { 
  FiSave, FiArrowLeft, FiHome, FiUsers, FiBarChart2, FiSettings, 
  FiLogOut, FiCalendar, FiUserCheck 
} from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Election from './Election.webp';

export default function CreerElection() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    type: "UNINOMINAL",
    nb_sieges: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation : nb_sieges obligatoire si LISTE
    if (form.type === "LISTE" && (!form.nb_sieges || parseInt(form.nb_sieges) < 1)) {
      toast.error("Veuillez indiquer un nombre de sièges valide.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vous devez être connecté !");
        setLoading(false);
        return;
      }

      const res = await api.post("/elections/submit", {
        titre:       form.title,
        description: form.description,
        type:        form.type,
        date_debut:  form.startDate,
        date_fin:    form.endDate,
        // ✅ Envoyé seulement si LISTE, sinon null
        nb_sieges:   form.type === "LISTE" ? parseInt(form.nb_sieges) : null,
      });

      console.log("Réponse création élection:", res.data);

      toast.success(
        `Élection "${form.title}" envoyée ! Elle sera validée par le Super Admin.`,
        { position: "top-right", autoClose: 5000 }
      );

      setForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        type: "UNINOMINAL",
        nb_sieges: "",
      });

    } catch (err) {
      console.error("Erreur création élection :", err.response?.data || err.message);
      if (err.response?.status === 403) {
        toast.error("Accès refusé : vous devez être ADMIN_ELECTION !");
      } else if (err.response?.data?.error) {
        toast.error("Erreur serveur : " + err.response.data.error);
      } else {
        toast.error("Erreur lors de l'envoi de l'élection !");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
        <nav className="flex-1 space-y-3">
          <Link to="/adminElectionDashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
            <FiHome /> Tableau de bord
          </Link>
          <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
            <FiCalendar /> Mes élections
          </Link>
          <Link to="/admin/adminelection/gerercandidats" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
            <FiUsers /> Candidats
          </Link>
          <Link to="/admin/adminelection/resultats" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
            <FiBarChart2 /> Résultats
          </Link>
        </nav>
        <div className="space-y-3 mt-6">
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
            <FiSettings /> Paramètres
          </Link>
          <Link to="/logout" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-indigo-100">
            <FiLogOut /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-indigo-900">Créer une nouvelle élection</h2>
          <Link
            to="/admin/adminelection/ElectionPage"
            className="flex items-center gap-2 px-3 py-1 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 transition"
          >
            <FiArrowLeft /> Retour
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FORM */}
          <form className="bg-white/80 p-6 rounded-xl shadow space-y-4" onSubmit={handleSubmit}>

            <div>
              <label className="block text-sm font-medium text-gray-700">Titre de l'élection</label>
              <input
                type="text" name="title" value={form.title}
                onChange={handleChange} required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Élection universitaire 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description" value={form.description}
                onChange={handleChange} rows="4"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Description de l'élection..."
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Date et heure de début</label>
                <input
                  type="datetime-local" name="startDate" value={form.startDate}
                  onChange={handleChange} required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Date et heure de fin</label>
                <input
                  type="datetime-local" name="endDate" value={form.endDate}
                  onChange={handleChange} required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type de scrutin</label>
              <select
                name="type" value={form.type} onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="UNINOMINAL">Uninominal</option>
                <option value="BINOMINAL">Binominal</option>
                <option value="LISTE">Liste</option>
              </select>
            </div>

            {/* ✅ Champ nombre de sièges — visible uniquement si type = LISTE */}
            {form.type === "LISTE" && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-indigo-800 mb-1">
                  Nombre de sièges à pourvoir
                </label>
                <p className="text-xs text-indigo-500 mb-2">
                  La moitié sera attribuée à la liste arrivée en tête (prime majoritaire),
                  le reste sera réparti proportionnellement.
                </p>
                <input
                  type="number" name="nb_sieges" value={form.nb_sieges}
                  onChange={handleChange}
                  min="1" max="999" required
                  placeholder="Ex : 29"
                  className="block w-full rounded-md border-indigo-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-900 font-semibold"
                />
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FiSave /> {loading ? "Création..." : "Créer l'élection"}
            </button>
          </form>

          {/* IMAGE */}
          <div className="flex items-center justify-center">
            <img src={Election} alt="Élection illustration" className="rounded-xl shadow-lg" />
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}














































// // src/pages/adminElection/CreerElection.jsx
// import React, { useState } from "react";
// import { 
//   FiSave, FiArrowLeft, FiHome, FiUsers, FiBarChart2, FiSettings, 
//   FiLogOut, FiCalendar, FiUserCheck 
// } from "react-icons/fi";
// import { Link } from "react-router-dom";
// import api from "../../../services/api";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import Election from './Election.webp';

// export default function CreerElection() {
//   const [form, setForm] = useState({
//     title: "",
//     description: "",
//     startDate: "",
//     endDate: "",
//     type: "UNINOMINAL",
//   });

//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         toast.error("Vous devez être connecté !");
//         setLoading(false);
//         return;
//       }

//       // Envoi de l'élection (token déjà ajouté par api.jsx)
//       const res = await api.post("/elections/submit", {
//         titre: form.title,
//         description: form.description,
//         type: form.type,
//         date_debut: form.startDate,
//         date_fin: form.endDate,
//       });

//       console.log("Réponse création élection:", res.data);

//       toast.success(
//         `Élection "${form.title}" envoyée ! Elle sera validée par le Super Admin.`,
//         { position: "top-right", autoClose: 5000 }
//       );

//       // Réinitialiser le formulaire
//       setForm({
//         title: "",
//         description: "",
//         startDate: "",
//         endDate: "",
//         type: "UNINOMINAL",
//       });

//     } catch (err) {
//       console.error("Erreur création élection :", err.response?.data || err.message);

//       // Gestion des messages d'erreur précis
//       if (err.response?.status === 403) {
//         toast.error("Accès refusé : vous devez être ADMIN_ELECTION !");
//       } else if (err.response?.data?.error) {
//         toast.error("Erreur serveur : " + err.response.data.error);
//       } else {
//         toast.error("Erreur lors de l'envoi de l'élection !");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       {/* ================= SIDEBAR ================= */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiHome /> Tableau de bord
//           </Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiCalendar /> Mes élections
//           </Link>
//           <Link to="/admin/adminelection/gerercandidats" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiUsers /> Candidats
//           </Link>
//           <Link to="/admin/adminelection/electeurs/${electionId}" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//                       <FiUserCheck /> Électeurs
//                     </Link>
//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiBarChart2 /> Résultats
//           </Link>
//         </nav>

//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings /> Paramètres
//           </Link>
//           <Link to="/logout" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-indigo-100">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main className="flex-1 p-8">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-lg font-semibold text-indigo-900">Créer une nouvelle élection</h2>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-2 px-3 py-1 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 transition">
//             <FiArrowLeft /> Retour
//           </Link>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* FORM */}
//           <form className="bg-white/80 p-6 rounded-xl shadow space-y-4" onSubmit={handleSubmit}>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Titre de l'élection</label>
//               <input type="text" name="title" value={form.title} onChange={handleChange} required
//                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//                      placeholder="Ex: Élection universitaire 2026" />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Description</label>
//               <textarea name="description" value={form.description} onChange={handleChange} rows="4"
//                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//                         placeholder="Description de l'élection..." />
//             </div>

//             <div className="flex gap-4">
//               <div className="flex-1">
//                 <label className="block text-sm font-medium text-gray-700">Date et heure de début</label>
//                 <input type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} required
//                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
//               </div>
//               <div className="flex-1">
//                 <label className="block text-sm font-medium text-gray-700">Date et heure de fin</label>
//                 <input type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} required
//                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Type de scrutin</label>
//               <select name="type" value={form.type} onChange={handleChange}
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
//                 <option value="UNINOMINAL">Uninominal</option>
//                 <option value="BINOMINAL">Binominal</option>
//                 <option value="LISTE">Liste</option>
//               </select>
//             </div>

//             <button type="submit" disabled={loading}
//                     className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition ${
//                       loading ? "opacity-50 cursor-not-allowed" : ""
//                     }`}>
//               <FiSave /> {loading ? "Création..." : "Créer l'élection"}
//             </button>
//           </form>

//           {/* IMAGE */}
//           <div className="flex items-center justify-center">
//             <img src={Election} alt="Élection illustration" className="rounded-xl shadow-lg" />
//           </div>
//         </div>
//       </main>

//       <ToastContainer />
//     </div>
//   );
// }








