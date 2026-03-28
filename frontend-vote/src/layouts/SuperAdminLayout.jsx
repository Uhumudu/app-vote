// src/layouts/SuperAdminLayout.jsx
// À utiliser comme wrapper sur toutes les pages super admin
import SuperAdminSidebar from "../components/SuperAdminSidebar";

export default function SuperAdminLayout({ active, children }) {
  return (
    <div className="min-h-screen bg-[#07090f]">
      {/* Sidebar fixe */}
      <SuperAdminSidebar active={active} />

      {/* Contenu principal — décalé de la largeur du sidebar (w-60 = 240px) */}
      <main className="ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
