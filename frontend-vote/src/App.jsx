import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import { AuthProvider } from "./context/AuthContext"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ─── Super Admin ──────────────────────────────────────────────────────────────
import AdminDashboard             from "./pages/admin/superadmin/superAdminDashboard";
import UtilisateursPage           from "./pages/admin/superadmin/utilisateursPage";
import StatistiquesPage           from "./pages/admin/superadmin/StatistiquesPage";
import AjouterUtilisateur         from "./pages/admin/superadmin/AjouterUtilisateur";
import ModifierUtilisateur        from "./pages/admin/superadmin/ModifierUtilisateur";
import ElectionsValider           from "./pages/admin/superadmin/electionsValider";
import SuperAdminElections        from "./pages/admin/superadmin/SuperAdminElections";
import SuperAdminCreerElection    from "./pages/admin/superadmin/SuperAdminCreerElection";
import SuperAdminModifierElection from "./pages/admin/superadmin/SuperAdminModifierElection";
import SuperAdminSettings         from "./pages/admin/superadmin/SuperAdminSettings";
import TransactionsCamPay from "./pages/admin/superadmin/TransactionsCamPay";

// ─── Admin Élection ───────────────────────────────────────────────────────────
import AdminElectionDashboard from "./pages/admin/adminelection/adminElectionDashboard";
import RegisterElection       from "./pages/admin/adminelection/RegisterElection";
import ElectionPage           from "./pages/admin/adminelection/ElectionPage";
import CreerElection          from "./pages/admin/adminelection/CreerElection";
import ModifierElection       from "./pages/admin/adminelection/ModifierElection";
import ElectionDetails        from "./pages/admin/adminelection/ElectionDetails";
import Resultats              from "./pages/admin/adminelection/resultats";
import DepouillementTour      from "./pages/admin/adminelection/DepouillementTour";
import AdminElectionSettings  from "./pages/admin/adminelection/AdminElectionSettings";

// ─── Candidats ────────────────────────────────────────────────────────────────
import Candidats        from "./pages/admin/adminelection/Candidats";
import CreerCandidat    from "./pages/admin/adminelection/CreerCandidat";
import ModifierCandidat from "./pages/admin/adminelection/ModifierCandidat";

// ─── Électeurs ────────────────────────────────────────────────────────────────
import Electeurs        from "./pages/admin/adminelection/electeurs";
import AjouterElecteur  from "./pages/admin/adminelection/AjouterElecteur";
import ModifierElecteur from "./pages/admin/adminelection/ModifierElecteur";

// ─── Électeur (votant) ────────────────────────────────────────────────────────
import DashboardElecteur from "./pages/elcteurP/DashboardElecteur";
import VotePage          from "./pages/elcteurP/VotePage";
import ResultatsElecteur from "./pages/elcteurP/ResultatsElecteur";

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

          {/* ── Publiques ──────────────────────────────────────────────────── */}
          <Route path="/"       element={<HomePage />} />
          <Route path="/Login"  element={<Login />} />
          <Route path="/logout" element={<Logout />} />

          {/* ── Super Admin ────────────────────────────────────────────────── */}
          <Route path="/superAdminDashboard"                             element={<AdminDashboard />} />
          <Route path="/admin/superadmin/utilisateursPage"               element={<UtilisateursPage />} />
          <Route path="/admin/superadmin/StatistiquesPage"               element={<StatistiquesPage />} />
          <Route path="/admin/superadmin/electionsValider"               element={<ElectionsValider />} />
          <Route path="/dashboard/utilisateurs/ajouter"                  element={<AjouterUtilisateur />} />
          <Route path="/dashboard/utilisateurs/modifier/:id"             element={<ModifierUtilisateur />} />
          <Route path="/admin/superadmin/elections"                      element={<SuperAdminElections />} />
          <Route path="/admin/superadmin/elections/creer"                element={<SuperAdminCreerElection />} />
          <Route path="/admin/superadmin/elections/modifier/:id"         element={<SuperAdminModifierElection />} />
          <Route path="/admin/superadmin/parametres"                     element={<SuperAdminSettings />} />
          <Route path="/admin/superadmin/transactions-campay" element={<TransactionsCamPay />} />

          {/* ── Admin Élection ─────────────────────────────────────────────── */}
          <Route path="/adminElectionDashboard"                          element={<AdminElectionDashboard />} />
          <Route path="/creer-election"                                  element={<RegisterElection />} />
          <Route path="/admin/adminelection/ElectionPage"                element={<ElectionPage />} />
          <Route path="/admin/adminelection/Creer-election"              element={<CreerElection />} />
          <Route path="/admin/adminelection/modifier-election/:id"       element={<ModifierElection />} />
          <Route path="/admin/adminelection/detail-election/:id"         element={<ElectionDetails />} />
          <Route path="/admin/adminelection/resultats"                   element={<Resultats />} />
          <Route path="/admin/adminelection/depouillement/:electionId"   element={<DepouillementTour />} />
          <Route path="/admin/adminelection/parametres"                  element={<AdminElectionSettings />} />

          {/* ── Candidats ──────────────────────────────────────────────────── */}
          <Route path="/admin/adminelection/candidats"                        element={<Candidats />} />
          <Route path="/admin/adminelection/creer-candidat"                   element={<CreerCandidat />} />
          <Route path="/admin/adminelection/modifier-candidat/:candidatId"    element={<ModifierCandidat />} />

          {/* ── Électeurs admin ────────────────────────────────────────────── */}
          <Route path="/admin/adminelection/electeurs"                                  element={<Electeurs />} />
          <Route path="/admin/adminelection/electeurs/:electionId"                      element={<Electeurs />} />
          <Route path="/admin/adminelection/AjouterElecteur"                            element={<AjouterElecteur />} />
          <Route path="/admin/adminelection/electeurs/:electionId/AjouterElecteur"      element={<AjouterElecteur />} />
          <Route path="/admin/adminelection/election/:electionId/ModifierElecteur/:id"  element={<ModifierElecteur />} />

          {/* ── Électeur (votant) ──────────────────────────────────────────── */}
          <Route path="/DashboardElecteur"              element={<DashboardElecteur />} />
          <Route path="/electeur/voter/:electionId"     element={<VotePage />} />
          <Route path="/electeur/resultats/:electionId" element={<ResultatsElecteur />} />

        </Routes>

        <ToastContainer position="top-right" autoClose={5000} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
