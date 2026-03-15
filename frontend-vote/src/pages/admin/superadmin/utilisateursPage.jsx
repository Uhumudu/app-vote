// src/pages/admin/superadmin/utilisateursPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiTrash2, FiEdit, FiUserPlus, FiSearch } from "react-icons/fi";
import api from "../../../services/api";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

const ROLE_CONFIG = {
  SUPER_ADMIN:             { bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd", label: "Super Admin" },
  ADMIN_ELECTION:          { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", label: "Admin Élection" },
  ADMIN_ELECTION_PENDING:  { bg: "#fef3c7", color: "#78350f", border: "#fcd34d", label: "Admin (en attente)" },
  ELECTEUR:                { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", label: "Électeur" },
};

export default function UtilisateursPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [toast,   setToast]   = useState({ msg: "", type: "success" });
  const navigate = useNavigate();

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get("/utilisateurs");
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        notify("Impossible de récupérer les utilisateurs", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    try {
      await api.delete(`/utilisateurs/${id}`);
      setUsers(users.filter(u => u.id !== id));
      notify("Utilisateur supprimé");
    } catch (err) {
      console.error(err);
      notify("Erreur lors de la suppression", "error");
    }
  };

  const filtered = users.filter(u =>
    `${u.prenom} ${u.nom} ${u.email} ${u.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const stats = {
    total:    users.length,
    admins:   users.filter(u => u.role === "ADMIN_ELECTION").length,
    electeurs: users.filter(u => u.role === "ELECTEUR").length,
    pending:  users.filter(u => u.role === "ADMIN_ELECTION_PENDING").length,
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
          toast.type === "error" ? "bg-red-600" : "bg-blue-700"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <SuperAdminSidebar active="users" />

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-blue-900 tracking-tight">Utilisateurs</h2>
            {!loading && (
              <p className="text-sm text-blue-400 mt-1">
                {users.length} utilisateur{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate("/dashboard/utilisateurs/ajouter")}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-semibold text-sm shadow-md shadow-blue-200/60"
          >
            <FiUserPlus size={15} /> Ajouter un utilisateur
          </button>
        </div>

        {/* KPI Cards */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total",        value: stats.total,     color: "#1d4ed8" },
              { label: "Admins",       value: stats.admins,    color: "#7c3aed" },
              { label: "Électeurs",    value: stats.electeurs, color: "#059669" },
              { label: "En attente",   value: stats.pending,   color: "#d97706" },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recherche */}
        <div className="relative mb-4 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Rechercher un utilisateur…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-blue-700">
                {["Prénom", "Nom", "Email", "Rôle", "Statut", "Actions"].map((h, i) => (
                  <th key={h}
                    className={`px-4 py-3.5 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${
                      i < 5 ? "border-r border-blue-600/50" : "text-center"
                    }`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                      <p className="text-gray-400 text-sm">Chargement…</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <FiUsers className="text-blue-300 text-2xl" />
                      </div>
                      <p className="text-gray-500 font-semibold">
                        {search ? "Aucun résultat pour cette recherche" : "Aucun utilisateur"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u, index) => {
                  const roleConf = ROLE_CONFIG[u.role] || { bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db", label: u.role };
                  return (
                    <tr key={u.id}
                      className={`border-b border-gray-100 transition-colors duration-150 hover:bg-blue-50/40 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}>

                      <td className="px-4 py-3.5 border-r border-gray-100 text-sm font-medium text-gray-800">
                        {u.prenom}
                      </td>

                      <td className="px-4 py-3.5 border-r border-gray-100 text-sm text-gray-700">
                        {u.nom}
                      </td>

                      <td className="px-4 py-3.5 border-r border-gray-100 text-sm text-gray-500">
                        {u.email}
                      </td>

                      {/* Rôle — badge inline */}
                      <td className="px-4 py-3.5 border-r border-gray-100">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                          style={{ backgroundColor: roleConf.bg, color: roleConf.color, border: `1px solid ${roleConf.border}` }}
                        >
                          {roleConf.label}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3.5 border-r border-gray-100">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                          style={u.actif
                            ? { backgroundColor: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }
                            : { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }
                          }
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: u.actif ? "#10b981" : "#ef4444" }}
                          />
                          {u.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/utilisateurs/modifier/${u.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:scale-95 transition-all text-xs font-bold shadow-sm"
                            title="Modifier"
                          >
                            <FiEdit size={12} /> Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="inline-flex items-center px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-xs"
                            title="Supprimer"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}


























// // src/pages/admin/superadmin/utilisateursPage.jsx
// import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import {
//   FiTrash2, FiEdit, FiUserPlus, FiHome, FiUsers,
//   FiBarChart2, FiSettings, FiLogOut, FiSearch
// } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";
// import api from "../../../services/api";

// const ROLE_CONFIG = {
//   SUPER_ADMIN:             { bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd", label: "Super Admin" },
//   ADMIN_ELECTION:          { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", label: "Admin Élection" },
//   ADMIN_ELECTION_PENDING:  { bg: "#fef3c7", color: "#78350f", border: "#fcd34d", label: "Admin (en attente)" },
//   ELECTEUR:                { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", label: "Électeur" },
// };

// export default function UtilisateursPage() {
//   const [users,   setUsers]   = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search,  setSearch]  = useState("");
//   const [toast,   setToast]   = useState({ msg: "", type: "success" });
//   const navigate = useNavigate();

//   const notify = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
//   };

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         setLoading(true);
//         const res = await api.get("/utilisateurs");
//         setUsers(res.data);
//       } catch (err) {
//         console.error(err);
//         notify("Impossible de récupérer les utilisateurs", "error");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchUsers();
//   }, []);

//   const handleDelete = async (id) => {
//     if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
//     try {
//       await api.delete(`/utilisateurs/${id}`);
//       setUsers(users.filter(u => u.id !== id));
//       notify("Utilisateur supprimé");
//     } catch (err) {
//       console.error(err);
//       notify("Erreur lors de la suppression", "error");
//     }
//   };

//   const filtered = users.filter(u =>
//     `${u.prenom} ${u.nom} ${u.email} ${u.role}`
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

//   const stats = {
//     total:    users.length,
//     admins:   users.filter(u => u.role === "ADMIN_ELECTION").length,
//     electeurs: users.filter(u => u.role === "ELECTEUR").length,
//     pending:  users.filter(u => u.role === "ADMIN_ELECTION_PENDING").length,
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

//       {/* ── TOAST ─────────────────────────────────────────────────────────── */}
//       {toast.msg && (
//         <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
//           toast.type === "error" ? "bg-red-600" : "bg-blue-700"
//         }`}>
//           {toast.msg}
//         </div>
//       )}

//       {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
//       <aside className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 p-6 flex flex-col shadow-sm">
//         <div className="mb-10">
//           <h1 className="text-xl font-black text-blue-700 tracking-tight">🗳 eVote</h1>
//           <p className="text-xs text-blue-400 font-medium mt-0.5">Super administrateur</p>
//         </div>
//         <nav className="flex-1 space-y-1">
//           {[
//             { to: "/superAdminDashboard",                  icon: <FiHome size={15} />,    label: "Tableau de bord" },
//             { to: "/admin/superadmin/utilisateursPage",    icon: <FiUsers size={15} />,   label: "Utilisateurs",        active: true },
//             { to: "/admin/superadmin/electionsValider",    icon: <FaVoteYea size={15} />, label: "Élections à valider" },
//             { to: "/admin/superadmin/StatistiquesPage",    icon: <FiBarChart2 size={15} />, label: "Statistiques" },
//           ].map(item => (
//             <Link key={item.to} to={item.to}
//               className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
//                 item.active
//                   ? "bg-blue-100 text-blue-700 font-semibold"
//                   : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
//               }`}>
//               {item.icon} {item.label}
//             </Link>
//           ))}
//         </nav>
//         <div className="space-y-1 pt-4 border-t border-gray-100 mt-4">
//           <Link to="/admin/superadmin/ParametresPage"
//             className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
//             <FiSettings size={15} /> Paramètres
//           </Link>
//           <Link to="/logout"
//             className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
//             <FiLogOut size={15} /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ── MAIN ──────────────────────────────────────────────────────────── */}
//       <main className="flex-1 p-8 overflow-y-auto">

//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//           <div>
//             <h2 className="text-2xl font-black text-blue-900 tracking-tight">Utilisateurs</h2>
//             {!loading && (
//               <p className="text-sm text-blue-400 mt-1">
//                 {users.length} utilisateur{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
//               </p>
//             )}
//           </div>
//           <button
//             onClick={() => navigate("/dashboard/utilisateurs/ajouter")}
//             className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-semibold text-sm shadow-md shadow-blue-200/60"
//           >
//             <FiUserPlus size={15} /> Ajouter un utilisateur
//           </button>
//         </div>

//         {/* KPI Cards */}
//         {!loading && (
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
//             {[
//               { label: "Total",        value: stats.total,     color: "#1d4ed8" },
//               { label: "Admins",       value: stats.admins,    color: "#7c3aed" },
//               { label: "Électeurs",    value: stats.electeurs, color: "#059669" },
//               { label: "En attente",   value: stats.pending,   color: "#d97706" },
//             ].map((k, i) => (
//               <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
//                 <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
//                 <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{k.label}</p>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Recherche */}
//         <div className="relative mb-4 max-w-sm">
//           <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
//           <input
//             type="text"
//             placeholder="Rechercher un utilisateur…"
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
//           />
//         </div>

//         {/* TABLE */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//           <table className="min-w-full border-collapse">
//             <thead>
//               <tr className="bg-blue-700">
//                 {["Prénom", "Nom", "Email", "Rôle", "Statut", "Actions"].map((h, i) => (
//                   <th key={h}
//                     className={`px-4 py-3.5 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${
//                       i < 5 ? "border-r border-blue-600/50" : "text-center"
//                     }`}>
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan="6" className="p-12 text-center">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
//                       <p className="text-gray-400 text-sm">Chargement…</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : filtered.length === 0 ? (
//                 <tr>
//                   <td colSpan="6" className="p-16 text-center">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
//                         <FiUsers className="text-blue-300 text-2xl" />
//                       </div>
//                       <p className="text-gray-500 font-semibold">
//                         {search ? "Aucun résultat pour cette recherche" : "Aucun utilisateur"}
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 filtered.map((u, index) => {
//                   const roleConf = ROLE_CONFIG[u.role] || { bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db", label: u.role };
//                   return (
//                     <tr key={u.id}
//                       className={`border-b border-gray-100 transition-colors duration-150 hover:bg-blue-50/40 ${
//                         index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
//                       }`}>

//                       <td className="px-4 py-3.5 border-r border-gray-100 text-sm font-medium text-gray-800">
//                         {u.prenom}
//                       </td>

//                       <td className="px-4 py-3.5 border-r border-gray-100 text-sm text-gray-700">
//                         {u.nom}
//                       </td>

//                       <td className="px-4 py-3.5 border-r border-gray-100 text-sm text-gray-500">
//                         {u.email}
//                       </td>

//                       {/* Rôle — badge inline */}
//                       <td className="px-4 py-3.5 border-r border-gray-100">
//                         <span
//                           className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
//                           style={{ backgroundColor: roleConf.bg, color: roleConf.color, border: `1px solid ${roleConf.border}` }}
//                         >
//                           {roleConf.label}
//                         </span>
//                       </td>

//                       {/* Statut */}
//                       <td className="px-4 py-3.5 border-r border-gray-100">
//                         <span
//                           className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
//                           style={u.actif
//                             ? { backgroundColor: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }
//                             : { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }
//                           }
//                         >
//                           <span
//                             className="w-1.5 h-1.5 rounded-full"
//                             style={{ backgroundColor: u.actif ? "#10b981" : "#ef4444" }}
//                           />
//                           {u.actif ? "Actif" : "Inactif"}
//                         </span>
//                       </td>

//                       {/* Actions */}
//                       <td className="px-4 py-3.5 text-center">
//                         <div className="flex justify-center items-center gap-2">
//                           <button
//                             onClick={() => navigate(`/dashboard/utilisateurs/modifier/${u.id}`)}
//                             className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:scale-95 transition-all text-xs font-bold shadow-sm"
//                             title="Modifier"
//                           >
//                             <FiEdit size={12} /> Modifier
//                           </button>
//                           <button
//                             onClick={() => handleDelete(u.id)}
//                             className="inline-flex items-center px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-xs"
//                             title="Supprimer"
//                           >
//                             <FiTrash2 size={13} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>

//       </main>
//     </div>
//   );
// }






































// import { FiTrash2, FiEdit, FiUserPlus, FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut } from "react-icons/fi";
// import { FaVoteYea } from "react-icons/fa";
// import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import api from "../../../services/api";

// export default function UtilisateursPage() {
//   const [users, setUsers] = useState([]);
//   const navigate = useNavigate();

//   // Charger les utilisateurs depuis l'API
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const res = await api.get("/utilisateurs");
//         setUsers(res.data); // la réponse doit être un tableau d'utilisateurs
//       } catch (err) {
//         console.error(err);
//         alert("Impossible de récupérer les utilisateurs");
//       }
//     };
//     fetchUsers();
//   }, []);

//   const handleDelete = async (id) => {
//     if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
//     try {
//       await api.delete(`/utilisateurs/${id}`);
//       setUsers(users.filter(u => u.id !== id));
//     } catch (err) {
//       console.error(err);
//       alert("Erreur lors de la suppression");
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

//       {/* SIDEBAR SUPER ADMIN */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="/superAdminDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100"><FiHome /> Tableau de bord</Link>
//           <Link to="/admin/superadmin/utilisateursPage" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold"><FiUsers /> Utilisateurs</Link>
//           <Link to="/admin/superadmin/electionsValider" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100"><FaVoteYea /> Élections à valider</Link>
//           <Link to="/admin/superadmin/StatistiquesPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100"><FiBarChart2 /> Statistiques</Link>
//         </nav>
//         <div className="space-y-3 mt-6">
//           <Link to="/admin/superadmin/ParametresPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100"><FiSettings /> Paramètres</Link>
//           <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-600 hover:bg-blue-100"><FiLogOut /> Déconnexion</Link>
//         </div>
//       </aside>

//       {/* CONTENU */}
//       <main className="flex-1 p-8 bg-white">
//         <div className="flex justify-between items-center mb-6 bg-white/80 p-4 rounded-xl shadow">
//           <h2 className="text-xl font-semibold text-blue-900">👥 Gestion des utilisateurs</h2>
//           <button
//             className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
//             onClick={() => navigate("/dashboard/utilisateurs/ajouter")}
//           >
//             <FiUserPlus className="mr-2" /> Ajouter
//           </button>
//         </div>

//         <table className="w-full bg-white/80 rounded-xl shadow overflow-hidden">
//           <thead className="bg-blue-100 text-left text-blue-800">
//             <tr>
//               <th className="p-3">Prénom</th>
//               <th className="p-3">Nom</th>
//               <th className="p-3">Email</th>
//               <th className="p-3">Rôle</th>
//               <th className="p-3">Statut</th>
//               <th className="p-3 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {users.map(u => (
//               <tr key={u.id} className="border-b hover:bg-blue-50 text-black">
//                 <td className="p-3">{u.prenom}</td>
//                 <td className="p-3">{u.nom}</td>
//                 <td className="p-3">{u.email}</td>
//                 <td className="p-3">{u.role}</td>
//                 <td className={`p-3 font-medium ${u.actif ? "text-green-600" : "text-red-600"}`}>{u.actif ? "Actif" : "Inactif"}</td>
//                 <td className="p-3 flex gap-2 justify-center">
//                   <button
//                     className="bg-yellow-400 p-2 rounded text-white hover:bg-yellow-500"
//                     // onClick={() => navigate(`/admin/superadmin/utilisateursPage/modifier/${u.id}`)}
//                     onClick={() => navigate(`/dashboard/utilisateurs/modifier/${u.id}`)}

//                   >
//                     <FiEdit />
//                   </button>
//                   <button
//                     className="bg-red-500 p-2 rounded text-white hover:bg-red-600"
//                     onClick={() => handleDelete(u.id)}
//                   >
//                     <FiTrash2 />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </main>
//     </div>
//   );
// }

















