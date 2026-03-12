// src/pages/adminSuper/ParametresPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut } from "react-icons/fi";
import { FaVoteYea, FaCrown, FaUser } from "react-icons/fa";

export default function ParametresPage() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    appName: "Système de Vote Électronique",
    maintenanceMode: false,
    allowRegistration: true,
    maxElections: 10,
    twoFactorAuth: false,
  });

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-blue-700">🗳 eVote – SuperAdmin</h1>

        <nav className="flex-1 space-y-3">
          <a onClick={() => navigate("/superAdminDashboard")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
            <FiHome /> Tableau de bord
          </a>

          <a onClick={() => navigate("/admin/superadmin/utilisateursPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
            <FiUsers /> Utilisateurs
          </a>

          <a onClick={() => navigate("/admin/superadmin/electionsValider")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
            <FaVoteYea /> Élections à valider
          </a>

          <a onClick={() => navigate("/admin/superadmin/StatistiquesPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 cursor-pointer">
            <FiBarChart2 /> Statistiques
          </a>

          <a onClick={() => navigate("/admin/superadmin/ParametresPage")} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-blue-100 font-semibold cursor-pointer">
            <FiSettings /> Paramètres
          </a>
        </nav>

        <div className="space-y-3 mt-6">
          <a onClick={() => navigate("/logout")} className="flex text-red-600 items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-100 text-red-600 cursor-pointer">
            <FiLogOut /> Déconnexion
          </a>
        </div>
      </aside>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-800">
          ⚙️ Paramètres du système
        </h1>

        {/* Paramètres généraux */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Paramètres généraux</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nom de l’application</label>
            <input
              type="text"
              name="appName"
              value={settings.appName}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nombre maximum d’élections</label>
            <input
              type="number"
              name="maxElections"
              value={settings.maxElections}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Sécurité */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">🔐 Sécurité</h2>

          <div className="flex items-center justify-between mb-4">
            <span>Authentification à deux facteurs (2FA)</span>
            <input
              type="checkbox"
              name="twoFactorAuth"
              checked={settings.twoFactorAuth}
              onChange={handleChange}
              className="w-5 h-5 accent-blue-500"
            />
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">🧩 Fonctionnalités</h2>

          <div className="flex items-center justify-between mb-4">
            <span>Autoriser l’inscription des utilisateurs</span>
            <input
              type="checkbox"
              name="allowRegistration"
              checked={settings.allowRegistration}
              onChange={handleChange}
              className="w-5 h-5 accent-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Mode maintenance</span>
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={handleChange}
              className="w-5 h-5 accent-red-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button className="px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400">
            Annuler
          </button>
          <button className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            Enregistrer les paramètres
          </button>
        </div>
      </main>
    </div>
  );
}
