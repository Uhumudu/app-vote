import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiTrash2, FiEdit, FiUserPlus, FiSearch, FiChevronLeft, FiChevronRight, FiUsers } from "react-icons/fi"; // Ajout de FiChevron et FiUsers
import api from "../../../services/api";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

const ROLE_CONFIG = {
  SUPER_ADMIN: { bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd", label: "Super Admin" },
  ADMIN_ELECTION: { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", label: "Admin Élection" },
  ADMIN_ELECTION_PENDING: { bg: "#fef3c7", color: "#78350f", border: "#fcd34d", label: "Admin (en attente)" },
  ELECTEUR: { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", label: "Électeur" },
};

export default function UtilisateursPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "success" });
  
  // --- ÉTATS POUR LA PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
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

  // 1. Filtrage
  const filtered = users.filter(u =>
    `${u.prenom} ${u.nom} ${u.email} ${u.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // --- LOGIQUE DE PAGINATION ---
  const totalPages = Math.ceil(filtered.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filtered.slice(indexOfFirstUser, indexOfLastUser);

  // Revenir à la page 1 si on fait une recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "ADMIN_ELECTION").length,
    electeurs: users.filter(u => u.role === "ELECTEUR").length,
    pending: users.filter(u => u.role === "ADMIN_ELECTION_PENDING").length,
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      {/* TOAST */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
          toast.type === "error" ? "bg-red-600" : "bg-blue-700"
        }`}>
          {toast.msg}
        </div>
      )}

      <SuperAdminSidebar active="users" />

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
              { label: "Total", value: stats.total, color: "#1d4ed8" },
              { label: "Admins", value: stats.admins, color: "#7c3aed" },
              { label: "Électeurs", value: stats.electeurs, color: "#059669" },
              { label: "En attente", value: stats.pending, color: "#d97706" },
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
              ) : currentUsers.length === 0 ? (
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
                currentUsers.map((u, index) => {
                  const roleConf = ROLE_CONFIG[u.role] || { bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db", label: u.role };
                  return (
                    <tr key={u.id}
                      className={`border-b border-gray-100 transition-colors duration-150 hover:bg-blue-50/40 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}>
                      <td className="px-4 py-3.5 border-r border-gray-100 text-sm font-medium text-gray-800">{u.prenom}</td>
                      <td className="px-4 py-3.5 border-r border-gray-100 text-sm text-gray-700">{u.nom}</td>
                      <td className="px-4 py-3.5 border-r border-gray-100 text-sm text-gray-500">{u.email}</td>
                      <td className="px-4 py-3.5 border-r border-gray-100">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                          style={{ backgroundColor: roleConf.bg, color: roleConf.color, border: `1px solid ${roleConf.border}` }}>
                          {roleConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 border-r border-gray-100">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                          style={u.actif ? { backgroundColor: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" } : { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: u.actif ? "#10b981" : "#ef4444" }} />
                          {u.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={() => navigate(`/dashboard/utilisateurs/modifier/${u.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:scale-95 transition-all text-xs font-bold shadow-sm">
                            <FiEdit size={12} /> Modifier
                          </button>
                          <button onClick={() => handleDelete(u.id)}
                            className="inline-flex items-center px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-xs">
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

          {/* --- BARRE DE PAGINATION --- */}
          {!loading && filtered.length > usersPerPage && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium">
                Affichage de <span className="font-bold">{indexOfFirstUser + 1}</span> à <span className="font-bold">{Math.min(indexOfLastUser, filtered.length)}</span> sur <span className="font-bold">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronLeft size={18} />
                </button>
                
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                          : "bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
