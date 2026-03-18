// src/components/AdminElectionSidebar.jsx
// Sidebar commune à toutes les pages Admin d'Élection
import { Link } from "react-router-dom";
import { FiHome, FiCalendar, FiSettings, FiLogOut } from "react-icons/fi";

const NAV_ITEMS = [
  { to: "/adminElectionDashboard",           icon: <FiHome size={15} />,     label: "Tableau de bord", key: "dashboard" },
  { to: "/admin/adminelection/ElectionPage", icon: <FiCalendar size={15} />, label: "Mes Élections",   key: "elections" },
];

export default function AdminElectionSidebar({ active }) {
  return (
    <aside className="w-64 min-h-screen bg-white/90 backdrop-blur border-r border-gray-200 p-6 flex flex-col shadow-sm">

      {/* Logo */}
      <div className="mb-10">
        <h1 className="text-xl font-black text-indigo-700 tracking-tight">🗳 eVote</h1>
        <p className="text-xs text-indigo-400 font-medium mt-0.5">Admin d'Élection</p>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.key}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active === item.key
                ? "bg-indigo-100 text-indigo-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </nav>

      {/* Paramètres + Déconnexion collés en bas */}
      <div className="space-y-1 pt-4 border-t border-gray-100 mt-auto">
        <Link
          to="/admin/adminelection/parametres"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            active === "parametres"
              ? "bg-indigo-100 text-indigo-700 font-semibold"
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
