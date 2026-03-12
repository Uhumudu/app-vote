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
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vous devez être connecté !");
        setLoading(false);
        return;
      }

      // Envoi de l'élection (token déjà ajouté par api.jsx)
      const res = await api.post("/elections/submit", {
        titre: form.title,
        description: form.description,
        type: form.type,
        date_debut: form.startDate,
        date_fin: form.endDate,
      });

      console.log("Réponse création élection:", res.data);

      toast.success(
        `Élection "${form.title}" envoyée ! Elle sera validée par le Super Admin.`,
        { position: "top-right", autoClose: 5000 }
      );

      // Réinitialiser le formulaire
      setForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        type: "UNINOMINAL",
      });

    } catch (err) {
      console.error("Erreur création élection :", err.response?.data || err.message);

      // Gestion des messages d'erreur précis
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
          <Link to="/admin/adminelection/electeurs/${electionId}" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
                      <FiUserCheck /> Électeurs
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
          <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-2 px-3 py-1 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 transition">
            <FiArrowLeft /> Retour
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FORM */}
          <form className="bg-white/80 p-6 rounded-xl shadow space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Titre de l'élection</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                     placeholder="Ex: Élection universitaire 2026" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="4"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Description de l'élection..." />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Date et heure de début</label>
                <input type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} required
                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Date et heure de fin</label>
                <input type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} required
                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type de scrutin</label>
              <select name="type" value={form.type} onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="UNINOMINAL">Uninominal</option>
                <option value="BINOMINAL">Binominal</option>
                <option value="LISTE">Liste</option>
              </select>
            </div>

            <button type="submit" disabled={loading}
                    className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}>
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
// import { FiSave, FiArrowLeft, FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiCalendar, FiUserCheck } from "react-icons/fi";
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

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         toast.error("Vous devez être connecté !");
//         return;
//       }

//       await api.post(
//         "/elections/submit",
//         {
//           titre: form.title,
//           description: form.description,
//           type: form.type,
//           date_debut: form.startDate,
//           date_fin: form.endDate,
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       toast.success(
//         `Élection "${form.title}" envoyée ! Elle sera validée par le Super Admin.`,
//         { position: "top-right", autoClose: 5000 }
//       );

//       setForm({
//         title: "",
//         description: "",
//         startDate: "",
//         endDate: "",
//         type: "UNINOMINAL",
//       });
//     } catch (err) {
//       console.error("Erreur création élection :", err.response?.data || err.message);
//       toast.error("Erreur lors de l'envoi de l'élection !");
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
//           <Link to="/admin/adminelection/electeurs" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiUserCheck /> Électeurs
//           </Link>
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

//             <button type="submit"
//                     className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
//               <FiSave /> Créer l'élection
//             </button>
//           </form>

//           {/* IMAGE */}
//           <div className="flex items-center justify-center">
//             <img src={Election}
//                  alt="Élection illustration"
//                  className="rounded-xl shadow-lg" />
//           </div>
//         </div>
//       </main>

//       {/* Toast Container */}
//       <ToastContainer />
//     </div>
//   );
// }





















// // src/pages/adminElection/CreerElection.jsx
// import React, { useState } from "react";
// import { FiSave, FiArrowLeft } from "react-icons/fi";
// import { Link } from "react-router-dom";
// import api from "../../../services/api";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// export default function CreerElection() {
//   const [form, setForm] = useState({
//     title: "",
//     description: "",
//     startDate: "",
//     endDate: "",
//     type: "UNINOMINAL",
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       await api.post("/elections/submit", {
//         titre: form.title,
//         description: form.description,
//         type: form.type,
//         date_debut: form.startDate,
//         date_fin: form.endDate
//       });

//       toast.success(`Élection "${form.title}" envoyée ! Elle sera validée par le Super Admin.`, { autoClose: 5000 });
//       setForm({ title: "", description: "", startDate: "", endDate: "", type: "UNINOMINAL" });

//     } catch (err) {
//       console.error(err);
//       toast.error("Erreur lors de l'envoi de l'élection !", { autoClose: 5000 });
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       {/* SIDEBAR */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Tableau de bord</Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Mes élections</Link>
//           <Link to="/admin/adminelection/gerercandidats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Candidats</Link>
//           <Link to="/admin/adminelection/electeurs" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Électeurs</Link>
//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Résultats</Link>
//         </nav>
//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Paramètres</Link>
//           <Link to="/logout" className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Déconnexion</Link>
//         </div>
//       </aside>

//       {/* MAIN */}
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

//             <button type="submit"
//                     className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
//               <FiSave /> Créer l'élection
//             </button>
//           </form>

//           {/* IMAGE */}
//           <div className="flex items-center justify-center">
//             <img src="https://images.unsplash.com/photo-1590608897129-79b7b5c4b0e5?auto=format&fit=crop&w=600&q=80"
//                  alt="Élection illustration"
//                  className="rounded-xl shadow-lg" />
//           </div>
//         </div>
//       </main>

//       <ToastContainer />
//     </div>
//   );
// }



















// import React, { useState } from "react";
// import { FiSave, FiArrowLeft } from "react-icons/fi";
// import { Link } from "react-router-dom";
// import api from "../../../services/api";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// export default function CreerElection() {
//   const [form, setForm] = useState({
//     title: "",
//     description: "",
//     startDate: "",
//     endDate: "",
//     type: "UNINOMINAL",
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       // ⚡ Assurez-vous que le token est stocké dans localStorage après login
//       const token = localStorage.getItem("token");

//       await api.post(
//         "/elections/submit",
//         {
//           titre: form.title,
//           description: form.description,
//           type: form.type,
//           date_debut: form.startDate,
//           date_fin: form.endDate,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       toast.success(`Élection "${form.title}" envoyée ! Elle sera validée par le Super Admin.`, {
//         position: "top-right",
//         autoClose: 5000,
//       });

//       setForm({
//         title: "",
//         description: "",
//         startDate: "",
//         endDate: "",
//         type: "UNINOMINAL",
//       });

//     } catch (err) {
//       console.error(err.response?.data || err);
//       toast.error("Erreur lors de l'envoi de l'élection !", {
//         position: "top-right",
//         autoClose: 5000,
//       });
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       {/* ================= SIDEBAR ================= */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Tableau de bord</Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Mes élections</Link>
//           <Link to="/admin/adminelection/gerercandidats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Candidats</Link>
//           <Link to="/admin/adminelection/electeurs" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Électeurs</Link>
//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Résultats</Link>
//         </nav>
//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Paramètres</Link>
//           <Link to="/logout" className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">Déconnexion</Link>
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

//             <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
//               <FiSave /> Créer l'élection
//             </button>
//           </form>

//           {/* IMAGE */}
//           <div className="flex items-center justify-center">
//             <img src="https://images.unsplash.com/photo-1590608897129-79b7b5c4b0e5?auto=format&fit=crop&w=600&q=80"
//                  alt="Élection illustration" className="rounded-xl shadow-lg" />
//           </div>
//         </div>
//       </main>

//       <ToastContainer />
//     </div>
//   );
// }


















// // src/pages/adminElection/CreerElection.jsx
// import React, { useState } from "react";
// import { FiSave, FiArrowLeft } from "react-icons/fi";
// import { Link } from "react-router-dom";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Tooltip,
//   Legend
// } from "chart.js";

// import {
//   FiHome,
//   FiUsers,
//   FiBarChart2,
//   FiSettings,
//   FiLogOut,
//   FiCalendar,
//   FiUserCheck
// } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";

// // Import API
// import api from "../../../services/api";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// export default function CreerElection() {
//   const [form, setForm] = useState({
//     title: "",
//     description: "",
//     startDate: "",
//     endDate: "",
//     type: "UNIMINAL", // Uninominal, Binominale, Liste
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       // Envoi au backend via API
//       await api.post("/elections/submit", {
//         titre: form.title,
//         description: form.description,
//         type: form.type,
//         createur: "Admin Election", // remplacer par le nom connecté si dispo
//         debut: form.startDate,
//         fin: form.endDate
//       });

//       alert(
//         `Élection "${form.title}" envoyée ! Elle sera en attente de validation du Super Admin.`
//       );

//       setForm({
//         title: "",
//         description: "",
//         startDate: "",
//         endDate: "",
//         type: "UNINOMINAL",
//       });

//     } catch (err) {
//       console.error(err);
//       alert("Erreur lors de l'envoi de l'élection !");
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ================= SIDEBAR ================= */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>

//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Tableau de bord
//           </Link>

//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Mes élections
//           </Link>

//           <Link to="/admin/adminelection/gerercandidats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Candidats
//           </Link>

//           <Link to="/admin/adminelection/electeurs" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Électeurs
//           </Link>

//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Résultats
//           </Link>
//         </nav>

//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Paramètres
//           </Link>

//           <Link to="/logout" className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main className="flex-1 p-8">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-lg font-semibold text-indigo-900">Créer une nouvelle élection</h2>
//           <Link
//             to="/admin/adminelection/ElectionPage"
//             className="flex items-center gap-2 px-3 py-1 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 transition"
//           >
//             <FiArrowLeft /> Retour
//           </Link>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* FORM */}
//           <form
//             className="bg-white/80 p-6 rounded-xl shadow space-y-4"
//             onSubmit={handleSubmit}
//           >
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Titre de l'élection</label>
//               <input
//                 type="text"
//                 name="title"
//                 value={form.title}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//                 placeholder="Ex: Élection universitaire 2026"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Description</label>
//               <textarea
//                 name="description"
//                 value={form.description}
//                 onChange={handleChange}
//                 rows="4"
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//                 placeholder="Description de l'élection..."
//               />
//             </div>

//            <div className="flex gap-4">
//   <div className="flex-1">
//     <label className="block text-sm font-medium text-gray-700">
//       Date et heure de début
//     </label>
//     <input
//       type="datetime-local"
//       name="startDate"
//       value={form.startDate}
//       onChange={handleChange}
//       required
//       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//     />
//   </div>

//   <div className="flex-1">
//     <label className="block text-sm font-medium text-gray-700">
//       Date et heure de fin
//     </label>
//     <input
//       type="datetime-local"
//       name="endDate"
//       value={form.endDate}
//       onChange={handleChange}
//       required
//       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//     />
//   </div>
// </div>


//             <div>
//               <label className="block text-sm font-medium text-gray-700">Type de scrutin</label>
//               <select
//                 name="type"
//                 value={form.type}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//               >
//                 <option value="UNINOMINAL">Uninominal</option>
//                 <option value="BINOMIAL">Binominal</option>
//                 <option value="LISTE">Liste</option>
//               </select>
//             </div>

//             <button
//               type="submit"
//               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
//             >
//               <FiSave /> Créer l'élection
//             </button>
//           </form>

//           {/* IMAGE */}
//           <div className="flex items-center justify-center">
//             <img
//               src="https://images.unsplash.com/photo-1590608897129-79b7b5c4b0e5?auto=format&fit=crop&w=600&q=80"
//               alt="Élection illustration"
//               className="rounded-xl shadow-lg"
//             />
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }





















// // src/pages/adminElection/CreerElection.jsx
// import React, { useState } from "react";
// import { FiSave, FiArrowLeft } from "react-icons/fi";
// import { Link } from "react-router-dom";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Tooltip,
//   Legend
// } from "chart.js";

// import {
//   FiHome,
//   FiUsers,
//   FiBarChart2,
//   FiSettings,
//   FiLogOut,
//   FiCalendar,
//   FiUserCheck
// } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// export default function CreerElection() {
//   const [form, setForm] = useState({
//     title: "",
//     description: "",
//     startDate: "",
//     endDate: "",
//     type: "Uninominale", // Uninominale, Binominale, Liste
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     // Ici, tu enverras les données à ton backend pour créer l'élection
//     alert(
//       `Élection "${form.title}" créée ! Elle sera en attente de validation du Super Admin.`
//     );
//     setForm({
//       title: "",
//       description: "",
//       startDate: "",
//       endDate: "",
//       type: "Uninominale",
//     });
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ================= SIDEBAR ================= */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>

//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Tableau de bord
//           </Link>

//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Mes élections
//           </Link>

//           <Link to="/admin/adminelection/gerercandidats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Candidats
//           </Link>

//           <Link to="/admin/adminelection/electeurs" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Électeurs
//           </Link>

//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Résultats
//           </Link>
//         </nav>

//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Paramètres
//           </Link>

//           <Link to="/logout" className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main className="flex-1 p-8">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-lg font-semibold text-indigo-900">Créer une nouvelle élection</h2>
//           <Link
//             to="/admin/adminelection/ElectionPage"
//             className="flex items-center gap-2 px-3 py-1 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 transition"
//           >
//             <FiArrowLeft /> Retour
//           </Link>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* FORM */}
//           <form
//             className="bg-white/80 p-6 rounded-xl shadow space-y-4"
//             onSubmit={handleSubmit}
//           >
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Titre de l'élection</label>
//               <input
//                 type="text"
//                 name="title"
//                 value={form.title}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//                 placeholder="Ex: Élection universitaire 2026"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Description</label>
//               <textarea
//                 name="description"
//                 value={form.description}
//                 onChange={handleChange}
//                 rows="4"
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//                 placeholder="Description de l'élection..."
//               />
//             </div>

//             <div className="flex gap-4">
//               <div className="flex-1">
//                 <label className="block text-sm font-medium text-gray-700">Date de début</label>
//                 <input
//                   type="date"
//                   name="startDate"
//                   value={form.startDate}
//                   onChange={handleChange}
//                   required
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//                 />
//               </div>
//               <div className="flex-1">
//                 <label className="block text-sm font-medium text-gray-700">Date de fin</label>
//                 <input
//                   type="date"
//                   name="endDate"
//                   value={form.endDate}
//                   onChange={handleChange}
//                   required
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Type de scrutin</label>
//               <select
//                 name="type"
//                 value={form.type}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//               >
//                 <option>Uninominale</option>
//                 <option>Binominale</option>
//                 <option>Liste</option>
//               </select>
//             </div>

//             <button
//               type="submit"
//               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
//             >
//               <FiSave /> Créer l'élection
//             </button>
//           </form>

//           {/* IMAGE */}
//           <div className="flex items-center justify-center">
//             <img
//               src="https://images.unsplash.com/photo-1590608897129-79b7b5c4b0e5?auto=format&fit=crop&w=600&q=80"
//               alt="Élection illustration"
//               className="rounded-xl shadow-lg"
//             />
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }
