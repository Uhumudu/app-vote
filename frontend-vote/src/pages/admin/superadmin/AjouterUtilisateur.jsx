import { FiHome, FiUsers, FiSettings, FiLogOut, FiArrowLeft } from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../services/api";
import illustration from './img2.webp';
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

export default function AjouterUtilisateur() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    motDePasse: "",
    role: "ELECTEUR",
    actif: true, // 🔹 doit correspondre à la colonne MySQL
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/utilisateurs", formData);
      navigate("/admin/superadmin/utilisateursPage");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      {/* ===== SIDEBAR SUPER ADMIN ===== */}
      <SuperAdminSidebar active="elections" />

      {/* ===== CONTENU PRINCIPAL ===== */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col md:flex-row bg-white/95 rounded-3xl shadow-2xl max-w-6xl w-full overflow-hidden">

          {/* Illustration à gauche */}
          <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center">
            <img src={illustration} alt="Illustration utilisateur" className="w-4/5 h-auto object-contain" />
          </div>

          {/* Formulaire à droite */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
            <button
              onClick={() => navigate("/admin/superadmin/utilisateursPage")}
              className="flex items-center gap-2 mb-6 px-4 py-2 rounded-lg bg-blue-400 text-white font-medium hover:bg-blue-500 transition self-start"
            >
              <FiArrowLeft /> Retour
            </button>

            <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center md:text-left">➕ Ajouter un utilisateur</h2>

            {error && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Prénom"
                required
                className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
              />

              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Nom"
                required
                className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
              />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
              />

              <input
                type="password"
                name="motDePasse"
                value={formData.motDePasse}
                onChange={handleChange}
                placeholder="Mot de passe"
                required
                className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
              />

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN_ELECTION">Admin Élection</option>
                <option value="ELECTEUR">Électeur</option>
              </select>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="actif"
                  checked={formData.actif}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                Actif
              </label>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white"}`}
              >
                {loading ? "Ajout en cours..." : "Ajouter l'utilisateur"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

