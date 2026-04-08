// src/pages/admin/superadmin/ModifierUtilisateur.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut,
  FiArrowLeft, FiUser, FiMail, FiLock, FiEdit3, FiCheckCircle
} from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";
import api from "../../../services/api";
import illustration from './img2.webp';
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";


 <SuperAdminSidebar active="elections" />


export default function ModifierUtilisateur() {
  const navigate  = useNavigate();
  const { id }    = useParams();

  const [formData,    setFormData]    = useState({
    prenom: "", nom: "", email: "",
    motDePasse: "", role: "ELECTEUR", actif: true,
  });
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(true);
  const [error,       setError]       = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/utilisateurs/${id}`);
        setFormData({
          prenom:     res.data.prenom  || "",
          nom:        res.data.nom     || "",
          email:      res.data.email   || "",
          motDePasse: "",
          role:       res.data.role    || "ELECTEUR",
          actif:      res.data.actif   ?? true,
        });
      } catch (err) {
        setError("Impossible de récupérer l'utilisateur");
      } finally {
        setFetching(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put(`/utilisateurs/${id}`, formData);
      setSaveSuccess(true);
      setTimeout(() => navigate("/admin/superadmin/utilisateursPage"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  const ROLES = [
    { value: "SUPER_ADMIN",    label: "Super Admin" },
    { value: "ADMIN_ELECTION", label: "Admin Élection" },
    { value: "ELECTEUR",       label: "Électeur" },
  ];

  if (fetching) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-10 flex flex-col items-center gap-4 shadow-lg">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-blue-600 text-sm font-medium">Chargement…</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <SuperAdminSidebar active="users" />

      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
              <FiEdit3 size={16} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-900 tracking-tight">Modifier l'utilisateur</h2>
              <p className="text-xs text-blue-400 font-mono mt-0.5">ID #{id}</p>
            </div>
          </div>
          <button onClick={() => navigate("/admin/superadmin/utilisateursPage")}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-medium shadow-sm">
            <FiArrowLeft size={14} /> Retour
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl">

          {/* Formulaire */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-7">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Prénom + Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FiUser size={11} className="text-blue-500" /> Prénom *
                  </label>
                  <input type="text" name="prenom" value={formData.prenom}
                    onChange={handleChange} required placeholder="Jean"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FiUser size={11} className="text-blue-500" /> Nom *
                  </label>
                  <input type="text" name="nom" value={formData.nom}
                    onChange={handleChange} required placeholder="Dupont"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FiMail size={11} className="text-blue-500" /> Email *
                </label>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} required placeholder="jean@email.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FiLock size={11} className="text-blue-500" /> Nouveau mot de passe
                </label>
                <input type="password" name="motDePasse" value={formData.motDePasse}
                  onChange={handleChange} placeholder="Laisser vide pour ne pas modifier"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>

              {/* Rôle */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Rôle *</label>
                <select name="role" value={formData.role} onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* Actif */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <input type="checkbox" name="actif" id="actif" checked={formData.actif}
                  onChange={handleChange} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                <label htmlFor="actif" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                  Compte actif
                </label>
              </div>

              {/* Boutons */}
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => navigate("/admin/superadmin/utilisateursPage")}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all">
                  Annuler
                </button>
                <button type="submit" disabled={loading || saveSuccess}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 shadow-md ${
                    saveSuccess ? "bg-emerald-500 shadow-emerald-200/60" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200/60"
                  } disabled:opacity-75 disabled:cursor-not-allowed`}>
                  {saveSuccess
                    ? <><FiCheckCircle size={14} /> Enregistré !</>
                    : loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</>
                    : <><FiEdit3 size={14} /> Enregistrer les modifications</>
                  }
                </button>
              </div>
            </form>
          </div>

          {/* Illustration */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <img src={illustration} alt="Utilisateur" className="w-full object-cover" />
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Note</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Laisser le champ mot de passe vide pour conserver le mot de passe actuel de l'utilisateur.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}





































// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useParams, Link } from "react-router-dom";
// import { FiHome, FiUsers, FiSettings, FiLogOut, FiArrowLeft } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";
// import api from "../../../services/api";
// import illustration from './img2.webp'; // ton image

// export default function ModifierUtilisateur() {
//   const navigate = useNavigate();
//   const { id } = useParams();

//   const [formData, setFormData] = useState({
//     prenom: "",
//     nom: "",
//     email: "",
//     motDePasse: "",
//     role: "ELECTEUR",
//     actif: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await api.get(`/utilisateurs/${id}`);
//         setFormData({
//           prenom: res.data.prenom || "",
//           nom: res.data.nom || "",
//           email: res.data.email || "",
//           motDePasse: "",
//           role: res.data.role || "ELECTEUR",
//           actif: res.data.actif || false,
//         });
//       } catch (err) {
//         console.error(err);
//         alert("Impossible de récupérer l'utilisateur");
//       }
//     };
//     fetchUser();
//   }, [id]);

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     try {
//       await api.put(`/utilisateurs/${id}`, formData); // backend gère le hash si motDePasse présent
//       navigate("/admin/superadmin/utilisateursPage");
//     } catch (err) {
//       console.error(err);
//       setError(err.response?.data?.message || "Erreur lors de la modification");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

//       {/* ===== SIDEBAR SUPER ADMIN ===== */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>

//         <nav className="flex-1 space-y-3">
//           <Link to="/superAdminDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
//             <FiHome /> Tableau de bord
//           </Link>

//           <Link to="/admin/superadmin/utilisateursPage" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold">
//             <FiUsers /> Utilisateurs
//           </Link>

//           <Link to="/admin/superadmin/electionsValider" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
//             <FaVoteYea /> Élections à valider
//           </Link>

//           <Link to="/admin/superadmin/statistiques" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
//             <FiUsers /> Statistiques
//           </Link>
//         </nav>

//         <div className="space-y-3 mt-6">
//           <Link to="/admin/superadmin/ParametresPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
//             <FiSettings /> Paramètres
//           </Link>

//           <Link to="/logout" className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ===== CONTENU PRINCIPAL ===== */}
//       <main className="flex-1 flex items-center justify-center p-8">
//         <div className="flex flex-col md:flex-row bg-white/95 rounded-3xl shadow-2xl max-w-6xl w-full overflow-hidden">

//           {/* Illustration à gauche */}
//           <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center">
//             <img src={illustration} alt="Illustration utilisateur" className="w-4/5 h-auto object-contain" />
//           </div>

//           {/* Formulaire à droite */}
//           <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
//             <button
//               onClick={() => navigate("/admin/superadmin/utilisateursPage")}
//               className="flex items-center gap-2 mb-6 px-4 py-2 rounded-lg bg-blue-400 text-white font-medium hover:bg-blue-500 transition self-start"
//             >
//               <FiArrowLeft /> Retour
//             </button>

//             <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center md:text-left">✏️ Modifier un utilisateur</h2>

//             {error && (
//               <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-6">
//               <input
//                 type="text"
//                 name="prenom"
//                 value={formData.prenom}
//                 onChange={handleChange}
//                 placeholder="Prénom"
//                 required
//                 className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//               />

//               <input
//                 type="text"
//                 name="nom"
//                 value={formData.nom}
//                 onChange={handleChange}
//                 placeholder="Nom complet"
//                 required
//                 className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//               />

//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="Email"
//                 required
//                 className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//               />

//               <input
//                 type="password"
//                 name="motDePasse"
//                 value={formData.motDePasse}
//                 onChange={handleChange}
//                 placeholder="Nouveau mot de passe (laisser vide si pas de changement)"
//                 className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//               />

//               <select
//                 name="role"
//                 value={formData.role}
//                 onChange={handleChange}
//                 className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//               >
//                 <option value="SUPER_ADMIN">Super Admin</option>
//                 <option value="ADMIN_ELECTION">Admin Élection</option>
//                 <option value="ELECTEUR">Électeur</option>
//               </select>

//               <label className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   name="actif"
//                   checked={formData.actif}
//                   onChange={handleChange}
//                   className="h-4 w-4"
//                 />
//                 Actif
//               </label>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className={`w-full py-3 rounded-lg font-semibold transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
//               >
//                 {loading ? "Modification en cours..." : "Enregistrer"}
//               </button>
//             </form>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

















// // import { useState, useEffect } from "react";
// // import { useNavigate, useParams } from "react-router-dom";
// // import api from "../../../services/api";

// // export default function ModifierUtilisateur() {
// //   const navigate = useNavigate();
// //   const { id } = useParams();

// //   const [formData, setFormData] = useState({
// //     prenom: "",
// //     nom: "",
// //     email: "",
// //     motDePasse: "",
// //     role: "electeur",
// //     actif: true,
// //   });

// //   useEffect(() => {
// //     const fetchUser = async () => {
// //       try {
// //         const res = await api.get(`/utilisateurs/${id}`);
// //         setFormData({
// //           prenom: res.data.prenom || "",
// //           nom: res.data.nom || "",
// //           email: res.data.email || "",
// //           motDePasse: "",
// //           role: res.data.role || "electeur",
// //           actif: res.data.actif || false,
// //         });
// //       } catch (err) {
// //         console.error(err);
// //         alert("Impossible de récupérer l'utilisateur");
// //       }
// //     };
// //     fetchUser();
// //   }, [id]);

// //   const handleChange = (e) => {
// //     const { name, value, type, checked } = e.target;
// //     setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     try {
// //       await api.put(`/utilisateurs/${id}`, formData); // backend gère hash si motDePasse présent
// //       navigate("/admin/superadmin/utilisateursPage");
// //     } catch (err) {
// //       console.error(err);
// //       alert(err.response?.data?.message || "Erreur lors de la modification");
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen flex items-center justify-center bg-blue-100 p-6">
// //       <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-6">
// //         <h2 className="text-2xl font-bold text-blue-900 text-center">✏️ Modifier un utilisateur</h2>

// //         <input
// //           type="text"
// //           name="prenom"
// //           placeholder="Prénom"
// //           value={formData.prenom}
// //           onChange={handleChange}
// //           required
// //           className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
// //         />

// //         <input
// //           type="text"
// //           name="nom"
// //           placeholder="Nom complet"
// //           value={formData.nom}
// //           onChange={handleChange}
// //           required
// //           className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
// //         />

// //         <input
// //           type="email"
// //           name="email"
// //           placeholder="Email"
// //           value={formData.email}
// //           onChange={handleChange}
// //           required
// //           className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
// //         />

// //         <input
// //           type="password"
// //           name="motDePasse"
// //           placeholder="Nouveau mot de passe (laisser vide si pas de changement)"
// //           value={formData.motDePasse}
// //           onChange={handleChange}
// //           className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
// //         />

// //         <select
// //           name="role"
// //           value={formData.role}
// //           onChange={handleChange}
// //           className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
// //         >
// //           <option value="superadmin">Super Admin</option>
// //           <option value="adminElection">Admin Élection</option>
// //           <option value="electeur">Électeur</option>
// //         </select>

// //         <label className="flex items-center gap-2">
// //           <input
// //             type="checkbox"
// //             name="actif"
// //             checked={formData.actif}
// //             onChange={handleChange}
// //             className="h-4 w-4"
// //           />
// //           Actif
// //         </label>

// //         <button
// //           type="submit"
// //           className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition"
// //         >
// //           Enregistrer
// //         </button>
// //       </form>
// //     </div>
// //   );
// // }

