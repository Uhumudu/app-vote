// src/components/adminelection/AdminElectionLayout.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiMenu, FiX, FiHome, FiCalendar, FiSettings,
  FiLogOut, FiUsers, FiUserCheck, FiBarChart2
} from "react-icons/fi";
import AdminElectionSidebar from "../AdminElectionSidebar";

const MOBILE_NAV = [
  { to: "/adminElectionDashboard",           icon: FiHome,      label: "Tableau de bord" },
  { to: "/admin/adminelection/ElectionPage", icon: FiCalendar,  label: "Mes élections" },
  { to: "/admin/adminelection/candidats",    icon: FiUsers,     label: "Candidats" },
  { to: "/admin/adminelection/electeurs",    icon: FiUserCheck, label: "Électeurs" },
  { to: "/admin/adminelection/resultats",    icon: FiBarChart2, label: "Résultats" },
  { to: "/admin/adminelection/parametres",   icon: FiSettings,  label: "Paramètres" },
];

/**
 * Layout partagé pour toutes les pages Admin Élection.
 *
 * ─── Usage ────────────────────────────────────────────────────────────
 *
 *   import AdminElectionLayout from "@/components/adminelection/AdminElectionLayout";
 *
 *   export default function MaPage() {
 *     return (
 *       <AdminElectionLayout>
 *         <main className="flex-1 p-8 overflow-y-auto">
 *           ...contenu de la page...
 *         </main>
 *       </AdminElectionLayout>
 *     );
 *   }
 *
 * ─── Props ────────────────────────────────────────────────────────────
 *   active    {string}  Clé de l'item actif dans la sidebar (optionnel,
 *                       détecté automatiquement depuis l'URL sinon).
 *             Valeurs possibles : "dashboard" | "elections" | "candidats"
 *                                 | "electeurs" | "resultats"
 *
 *   bgClass   {string}  Classes Tailwind pour le fond de la page.
 *                       Défaut : "bg-gradient-to-br from-indigo-100
 *                                 via-indigo-200 to-indigo-300"
 */
export default function AdminElectionLayout({
  children,
  active,
  bgClass = "bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300",
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <div className={`flex min-h-screen ${bgClass}`}>

      {/* ── Sidebar desktop (≥ lg) ─────────────────────────────────── */}
      <div className="hidden lg:block sticky top-0 h-screen">
        <AdminElectionSidebar active={active} />
      </div>

      {/* ── Drawer mobile ──────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 w-72 bg-white flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xl font-black text-indigo-700">🗳 eVote</p>
                <p className="text-xs text-indigo-400 font-medium mt-0.5">Espace administrateur</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-all"
              >
                <FiX size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {MOBILE_NAV.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.to)
                      ? "bg-indigo-100 text-indigo-700 font-semibold"
                      : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <item.icon size={16} /> {item.label}
                </Link>
              ))}
            </nav>

            <div className="pt-4 border-t border-gray-100 mt-4">
              <Link
                to="/logout"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
              >
                <FiLogOut size={16} /> Déconnexion
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* ── Zone principale ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar mobile uniquement */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-indigo-100 text-indigo-700 transition-all"
          >
            <FiMenu size={20} />
          </button>
          <span className="text-base font-black text-indigo-700">🗳 eVote</span>
        </header>

        {children}
      </div>
    </div>
  );
}
