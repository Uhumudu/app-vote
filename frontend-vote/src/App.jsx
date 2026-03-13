import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import { AuthProvider } from "./context/AuthContext"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ─── Super Admin ─────────────────────────────────────────────────────────────
import AdminDashboard       from "./pages/admin/superadmin/superAdminDashboard";
import UtilisateursPage     from "./pages/admin/superadmin/utilisateursPage";
import StatistiquesPage     from "./pages/admin/superadmin/StatistiquesPage";
import ParametresPage       from "./pages/admin/superadmin/ParametresPage";
import AjouterUtilisateur   from "./pages/admin/superadmin/AjouterUtilisateur";
import ModifierUtilisateur  from "./pages/admin/superadmin/ModifierUtilisateur";
import ElectionsValider     from "./pages/admin/superadmin/electionsValider";

// ─── Admin Élection ───────────────────────────────────────────────────────────
import AdminElectionDashboard from "./pages/admin/adminelection/adminElectionDashboard";
import RegisterElection       from "./pages/admin/adminelection/RegisterElection";
import ElectionPage           from "./pages/admin/adminelection/ElectionPage";
import CreerElection          from "./pages/admin/adminelection/CreerElection";
import ModifierElection       from "./pages/admin/adminelection/ModifierElection";
import ElectionDetails        from "./pages/admin/adminelection/ElectionDetails";
import Resultats              from "./pages/admin/adminelection/resultats";

// Candidats
import Candidats        from "./pages/admin/adminelection/Candidats";
import CreerCandidat    from "./pages/admin/adminelection/CreerCandidat";
import ModifierCandidat from "./pages/admin/adminelection/ModifierCandidat";

// Électeurs
import Electeurs        from "./pages/admin/adminelection/electeurs";
import AjouterElecteur  from "./pages/admin/adminelection/AjouterElecteur";
import ModifierElecteur from "./pages/admin/adminelection/ModifierElecteur";
import ResultatsElecteur from "./pages/elcteurP/ResultatsElecteur";

// ─── Électeur (votant) ────────────────────────────────────────────────────────
import DashboardElecteur from "./pages/elcteurP/DashboardElecteur";
import VotePage          from "./pages/elcteurP/VotePage";

// ─── Pages générales ──────────────────────────────────────────────────────────
import Logout   from "./pages/logout";
import HomePage from "./pages/home/HomePage";
import Login    from "./pages/auth/Login";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Publiques ─────────────────────────────────────────────────── */}
          <Route path="/"       element={<HomePage />} />
          <Route path="/Login"  element={<Login />} />
          <Route path="/logout" element={<Logout />} />

          {/* ── Super Admin ───────────────────────────────────────────────── */}
          <Route path="/superAdminDashboard"                         element={<AdminDashboard />} />
          <Route path="/admin/superadmin/utilisateursPage"           element={<UtilisateursPage />} />
          <Route path="/admin/superadmin/StatistiquesPage"           element={<StatistiquesPage />} />
          <Route path="/admin/superadmin/ParametresPage"             element={<ParametresPage />} />
          <Route path="/admin/superadmin/electionsValider"           element={<ElectionsValider />} />
          <Route path="/dashboard/utilisateurs/ajouter"              element={<AjouterUtilisateur />} />
          <Route path="/dashboard/utilisateurs/modifier/:id"         element={<ModifierUtilisateur />} />

          {/* ── Admin Élection ────────────────────────────────────────────── */}
          <Route path="/adminElectionDashboard"                      element={<AdminElectionDashboard />} />
          <Route path="/creer-election"                              element={<RegisterElection />} />
          <Route path="/admin/adminelection/ElectionPage"            element={<ElectionPage />} />
          <Route path="/admin/adminelection/Creer-election"          element={<CreerElection />} />
          <Route path="/admin/adminelection/modifier-election/:id"   element={<ModifierElection />} />
          <Route path="/admin/adminelection/detail-election/:id"     element={<ElectionDetails />} />
          <Route path="/admin/adminelection/resultats"               element={<Resultats />} />

          {/* ── Candidats ─────────────────────────────────────────────────── */}
          <Route path="/admin/adminelection/candidats"                       element={<Candidats />} />
          <Route path="/admin/adminelection/creer-candidat"                  element={<CreerCandidat />} />
          <Route path="/admin/adminelection/modifier-candidat/:candidatId"   element={<ModifierCandidat />} />

          {/* ── Électeurs admin ───────────────────────────────────────────── */}
          <Route path="/admin/adminelection/electeurs"                                    element={<Electeurs />} />
          <Route path="/admin/adminelection/electeurs/:electionId"                        element={<Electeurs />} />
          <Route path="/admin/adminelection/AjouterElecteur"                              element={<AjouterElecteur />} />
          <Route path="/admin/adminelection/electeurs/:electionId/AjouterElecteur"        element={<AjouterElecteur />} />
          <Route path="/admin/adminelection/election/:electionId/ModifierElecteur/:id"    element={<ModifierElecteur />} />

          {/* ── Électeur (votant) ─────────────────────────────────────────── */}
          <Route path="/DashboardElecteur"                element={<DashboardElecteur />} />
          <Route path="/electeur/voter/:electionId"       element={<VotePage />} />          
          {/* <Route path="/electeur/resultats/:electionId"   element={<Resultats />} />  */}
          <Route path="/electeur/resultats/:electionId" element={<ResultatsElecteur />} />       

        </Routes>

        <ToastContainer position="top-right" autoClose={5000} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;






























// import { useState, useEffect } from 'react'
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import './App.css'
// import { AuthProvider } from "./context/AuthContext"
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// // ─── Super Admin ─────────────────────────────────────────────────────────────
// import AdminDashboard       from "./pages/admin/superadmin/superAdminDashboard";
// import UtilisateursPage     from "./pages/admin/superadmin/utilisateursPage";
// import StatistiquesPage     from "./pages/admin/superadmin/StatistiquesPage";
// import ParametresPage       from "./pages/admin/superadmin/ParametresPage";
// import AjouterUtilisateur   from "./pages/admin/superadmin/AjouterUtilisateur";
// import ModifierUtilisateur  from "./pages/admin/superadmin/ModifierUtilisateur";
// import ElectionsValider     from "./pages/admin/superadmin/electionsValider";

// // ─── Admin Élection ───────────────────────────────────────────────────────────
// import AdminElectionDashboard from "./pages/admin/adminelection/adminElectionDashboard";
// import RegisterElection       from "./pages/admin/adminelection/RegisterElection";
// import ElectionPage           from "./pages/admin/adminelection/ElectionPage";
// import CreerElection          from "./pages/admin/adminelection/CreerElection";
// import ModifierElection       from "./pages/admin/adminelection/ModifierElection";
// import ElectionDetails        from "./pages/admin/adminelection/ElectionDetails";
// import Resultats              from "./pages/admin/adminelection/resultats";

// // Candidats
// import Candidats        from "./pages/admin/adminelection/Candidats";
// import CreerCandidat    from "./pages/admin/adminelection/CreerCandidat";
// import ModifierCandidat from "./pages/admin/adminelection/ModifierCandidat";

// // Électeurs
// import Electeurs       from "./pages/admin/adminelection/electeurs";
// import AjouterElecteur from "./pages/admin/adminelection/AjouterElecteur";
// import ModifierElecteur from "./pages/admin/adminelection/ModifierElecteur";

// // ─── Électeur (votant) ────────────────────────────────────────────────────────
// import DashboardElecteur from "./pages/elcteurP/DashboardElecteur";
// import VotePage          from "./pages/elcteurP/VotePage";

// // ─── Pages générales ──────────────────────────────────────────────────────────
// import Logout   from "./pages/logout";
// import HomePage from "./pages/home/HomePage";
// import Login    from "./pages/auth/Login";

// function App() {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");
//     if (storedUser) setUser(JSON.parse(storedUser));
//   }, []);

//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Routes>

//           {/* ── Publiques ─────────────────────────────────────────────────── */}
//           <Route path="/"      element={<HomePage />} />
//           <Route path="/Login" element={<Login />} />
//           <Route path="/logout" element={<Logout />} />

//           {/* ── Super Admin ───────────────────────────────────────────────── */}
//           <Route path="/superAdminDashboard"                      element={<AdminDashboard />} />
//           <Route path="/admin/superadmin/utilisateursPage"        element={<UtilisateursPage />} />
//           <Route path="/admin/superadmin/StatistiquesPage"        element={<StatistiquesPage />} />
//           <Route path="/admin/superadmin/ParametresPage"          element={<ParametresPage />} />
//           <Route path="/admin/superadmin/electionsValider"        element={<ElectionsValider />} />
//           <Route path="/dashboard/utilisateurs/ajouter"           element={<AjouterUtilisateur />} />
//           <Route path="/dashboard/utilisateurs/modifier/:id"      element={<ModifierUtilisateur />} />

//           {/* ── Admin Élection : tableau de bord ──────────────────────────── */}
//           <Route path="/adminElectionDashboard"                   element={<AdminElectionDashboard />} />

//           {/* ── Admin Élection : élections ────────────────────────────────── */}
//           <Route path="/creer-election"                           element={<RegisterElection />} />
//           <Route path="/admin/adminelection/ElectionPage"         element={<ElectionPage />} />
//           <Route path="/admin/adminelection/Creer-election"       element={<CreerElection />} />
//           <Route path="/admin/adminelection/modifier-election/:id" element={<ModifierElection />} />
//           <Route path="/admin/adminelection/detail-election/:id"  element={<ElectionDetails />} />
//           <Route path="/admin/adminelection/resultats"            element={<Resultats />} />

//           {/* ── Admin Élection : candidats ────────────────────────────────── */}
//           <Route path="/admin/adminelection/candidats"                    element={<Candidats />} />
//           <Route path="/admin/adminelection/creer-candidat"               element={<CreerCandidat />} />
//           <Route path="/admin/adminelection/modifier-candidat/:candidatId" element={<ModifierCandidat />} />

//           {/* ── Admin Élection : électeurs ────────────────────────────────── */}
//           {/* Route sans ID  → utilise localStorage("activeElectionId") */}
//           <Route path="/admin/adminelection/electeurs"                              element={<Electeurs />} />
//           {/* Route avec ID → prioritaire, passe l'ID via URL */}
//           <Route path="/admin/adminelection/electeurs/:electionId"                  element={<Electeurs />} />
//           {/* Ajouter un électeur */}
//           <Route path="/admin/adminelection/AjouterElecteur"                        element={<AjouterElecteur />} />
//           <Route path="/admin/adminelection/electeurs/:electionId/AjouterElecteur"  element={<AjouterElecteur />} />
//           {/* Modifier un électeur */}
//           <Route path="/admin/adminelection/election/:electionId/ModifierElecteur/:id" element={<ModifierElecteur />} />

//           {/* ── Électeur (votant) ─────────────────────────────────────────── */}
//           <Route path="/DashboardElecteur" element={<DashboardElecteur />} />
//           <Route path="/VotePage"          element={<VotePage />} />

//         </Routes>

//         {/* Notifications globales */}
//         <ToastContainer position="top-right" autoClose={5000} />

//       </BrowserRouter>
//     </AuthProvider>
//   );
// }

// export default App;

