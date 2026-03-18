// src/components/SuperAdminSidebar.jsx
// Sidebar commune à toutes les pages Super Admin
import { Link } from "react-router-dom";
import {
  FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiCalendar
} from "react-icons/fi";
import { FaVoteYea } from "react-icons/fa";

const NAV_ITEMS = [
  { to: "/superAdminDashboard",               icon: <FiHome size={15} />,      label: "Tableau de bord",      key: "dashboard" },
  { to: "/admin/superadmin/utilisateursPage", icon: <FiUsers size={15} />,     label: "Utilisateurs",         key: "users" },
  { to: "/admin/superadmin/electionsValider", icon: <FaVoteYea size={14} />,   label: "Élections à valider",  key: "valider" },
  { to: "/admin/superadmin/elections",        icon: <FiCalendar size={15} />,  label: "Toutes les élections", key: "elections" },
  { to: "/admin/superadmin/StatistiquesPage", icon: <FiBarChart2 size={15} />, label: "Statistiques",         key: "stats" },
];

export default function SuperAdminSidebar({ active }) {
  return (
    <aside className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 p-6 flex flex-col shadow-sm">
      <div className="mb-10">
        <h1 className="text-xl font-black text-blue-700 tracking-tight">🗳 eVote</h1>
        <p className="text-xs text-blue-400 font-medium mt-0.5">Super administrateur</p>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.key}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active === item.key
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 pt-4 border-t border-gray-100 mt-4">
        <Link
          to="/admin/superadmin/parametres"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            active === "parametres"
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          }`}
        >
          <FiSettings size={15} /> Paramètres
        </Link>
        <Link
          to="/logout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <FiLogOut size={15} /> Déconnexion
        </Link>
      </div>
    </aside>
  );
}
