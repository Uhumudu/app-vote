import { FiTrash2, FiEdit, FiUserPlus, FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut } from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../services/api";

export default function UtilisateursPage() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Charger les utilisateurs depuis l'API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/utilisateurs");
        setUsers(res.data); // la réponse doit être un tableau d'utilisateurs
      } catch (err) {
        console.error(err);
        alert("Impossible de récupérer les utilisateurs");
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    try {
      await api.delete(`/utilisateurs/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      {/* SIDEBAR SUPER ADMIN */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>
        <nav className="flex-1 space-y-3">
          <Link to="/superAdminDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100"><FiHome /> Tableau de bord</Link>
          <Link to="/admin/superadmin/utilisateursPage" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold"><FiUsers /> Utilisateurs</Link>
          <Link to="/admin/superadmin/electionsValider" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100"><FaVoteYea /> Élections à valider</Link>
          <Link to="/admin/superadmin/StatistiquesPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100"><FiBarChart2 /> Statistiques</Link>
        </nav>
        <div className="space-y-3 mt-6">
          <Link to="/admin/superadmin/ParametresPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100"><FiSettings /> Paramètres</Link>
          <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-600 hover:bg-blue-100"><FiLogOut /> Déconnexion</Link>
        </div>
      </aside>

      {/* CONTENU */}
      <main className="flex-1 p-8 bg-white">
        <div className="flex justify-between items-center mb-6 bg-white/80 p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-blue-900">👥 Gestion des utilisateurs</h2>
          <button
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            onClick={() => navigate("/dashboard/utilisateurs/ajouter")}
          >
            <FiUserPlus className="mr-2" /> Ajouter
          </button>
        </div>

        <table className="w-full bg-white/80 rounded-xl shadow overflow-hidden">
          <thead className="bg-blue-100 text-left text-blue-800">
            <tr>
              <th className="p-3">Prénom</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Email</th>
              <th className="p-3">Rôle</th>
              <th className="p-3">Statut</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-blue-50 text-black">
                <td className="p-3">{u.prenom}</td>
                <td className="p-3">{u.nom}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className={`p-3 font-medium ${u.actif ? "text-green-600" : "text-red-600"}`}>{u.actif ? "Actif" : "Inactif"}</td>
                <td className="p-3 flex gap-2 justify-center">
                  <button
                    className="bg-yellow-400 p-2 rounded text-white hover:bg-yellow-500"
                    // onClick={() => navigate(`/admin/superadmin/utilisateursPage/modifier/${u.id}`)}
                    onClick={() => navigate(`/dashboard/utilisateurs/modifier/${u.id}`)}

                  >
                    <FiEdit />
                  </button>
                  <button
                    className="bg-red-500 p-2 rounded text-white hover:bg-red-600"
                    onClick={() => handleDelete(u.id)}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

















