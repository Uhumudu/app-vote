
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParams, Link } from "react-router-dom";
import { FiHome, FiUsers, FiSettings, FiLogOut, FiArrowLeft } from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";
import api from "../../../services/api";
import illustration from './img2.webp'; // ton image

export default function ModifierUtilisateur() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    motDePasse: "",
    role: "ELECTEUR",
    actif: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/utilisateurs/${id}`);
        setFormData({
          prenom: res.data.prenom || "",
          nom: res.data.nom || "",
          email: res.data.email || "",
          motDePasse: "",
          role: res.data.role || "ELECTEUR",
          actif: res.data.actif || false,
        });
      } catch (err) {
        console.error(err);
        alert("Impossible de récupérer l'utilisateur");
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
      await api.put(`/utilisateurs/${id}`, formData); // backend gère le hash si motDePasse présent
      navigate("/admin/superadmin/utilisateursPage");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      {/* ===== SIDEBAR SUPER ADMIN ===== */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>

        <nav className="flex-1 space-y-3">
          <Link to="/superAdminDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
            <FiHome /> Tableau de bord
          </Link>

          <Link to="/admin/superadmin/utilisateursPage" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold">
            <FiUsers /> Utilisateurs
          </Link>

          <Link to="/admin/superadmin/electionsValider" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
            <FaVoteYea /> Élections à valider
          </Link>

          <Link to="/admin/superadmin/statistiques" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
            <FiUsers /> Statistiques
          </Link>
        </nav>

        <div className="space-y-3 mt-6">
          <Link to="/admin/superadmin/ParametresPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
            <FiSettings /> Paramètres
          </Link>

          <Link to="/logout" className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100">
            <FiLogOut /> Déconnexion
          </Link>
        </div>
      </aside>

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

            <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center md:text-left">✏️ Modifier un utilisateur</h2>

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
                placeholder="Nom complet"
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
                placeholder="Nouveau mot de passe (laisser vide si pas de changement)"
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
                className={`w-full py-3 rounded-lg font-semibold transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
              >
                {loading ? "Modification en cours..." : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

















// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import api from "../../../services/api";

// export default function ModifierUtilisateur() {
//   const navigate = useNavigate();
//   const { id } = useParams();

//   const [formData, setFormData] = useState({
//     prenom: "",
//     nom: "",
//     email: "",
//     motDePasse: "",
//     role: "electeur",
//     actif: true,
//   });

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await api.get(`/utilisateurs/${id}`);
//         setFormData({
//           prenom: res.data.prenom || "",
//           nom: res.data.nom || "",
//           email: res.data.email || "",
//           motDePasse: "",
//           role: res.data.role || "electeur",
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
//     try {
//       await api.put(`/utilisateurs/${id}`, formData); // backend gère hash si motDePasse présent
//       navigate("/admin/superadmin/utilisateursPage");
//     } catch (err) {
//       console.error(err);
//       alert(err.response?.data?.message || "Erreur lors de la modification");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-blue-100 p-6">
//       <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-6">
//         <h2 className="text-2xl font-bold text-blue-900 text-center">✏️ Modifier un utilisateur</h2>

//         <input
//           type="text"
//           name="prenom"
//           placeholder="Prénom"
//           value={formData.prenom}
//           onChange={handleChange}
//           required
//           className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//         />

//         <input
//           type="text"
//           name="nom"
//           placeholder="Nom complet"
//           value={formData.nom}
//           onChange={handleChange}
//           required
//           className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//         />

//         <input
//           type="email"
//           name="email"
//           placeholder="Email"
//           value={formData.email}
//           onChange={handleChange}
//           required
//           className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//         />

//         <input
//           type="password"
//           name="motDePasse"
//           placeholder="Nouveau mot de passe (laisser vide si pas de changement)"
//           value={formData.motDePasse}
//           onChange={handleChange}
//           className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//         />

//         <select
//           name="role"
//           value={formData.role}
//           onChange={handleChange}
//           className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//         >
//           <option value="superadmin">Super Admin</option>
//           <option value="adminElection">Admin Élection</option>
//           <option value="electeur">Électeur</option>
//         </select>

//         <label className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             name="actif"
//             checked={formData.actif}
//             onChange={handleChange}
//             className="h-4 w-4"
//           />
//           Actif
//         </label>

//         <button
//           type="submit"
//           className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition"
//         >
//           Enregistrer
//         </button>
//       </form>
//     </div>
//   );
// }

