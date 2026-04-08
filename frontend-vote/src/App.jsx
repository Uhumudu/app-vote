import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import { AuthProvider } from "./context/AuthContext"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import CandidaterPublicPage        from "./pages/publics/CandidaterPublicPage";
import VoterPublicPage             from "./pages/publics/VoterPublicPage";
import DashboardPublicPage         from "./pages/publics/DashboardPublicPage";
import CandidaturesPubliquesPage   from "./pages/admin/adminelection/CandidaturesPubliquesPage";
import DashboardCandidatPublicPage from "./pages/publics/DashboardCandidatPublicPage";

// ⚠️ MaintenanceGuard doit être DANS BrowserRouter car il utilise useLocation
import MaintenanceGuard from "./components/MaintenanceGuard";

// Super Admin
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
import RetraitCamPay              from "./pages/admin/superadmin/RetraitCampay";
import TransactionsCamPay         from "./pages/admin/superadmin/TransactionsCamPay";

// Admin Election
import AdminElectionDashboard from "./pages/admin/adminelection/adminElectionDashboard";
import RegisterElection       from "./pages/admin/adminelection/RegisterElection";
import ElectionPage           from "./pages/admin/adminelection/ElectionPage";
import CreerElection          from "./pages/admin/adminelection/CreerElection";
import ModifierElection       from "./pages/admin/adminelection/ModifierElection";
import ElectionDetails        from "./pages/admin/adminelection/ElectionDetails";
import Resultats              from "./pages/admin/adminelection/resultats";
import DepouillementTour      from "./pages/admin/adminelection/DepouillementTour";
import AdminElectionSettings  from "./pages/admin/adminelection/AdminElectionSettings";

// Candidats
import Candidats        from "./pages/admin/adminelection/Candidats";
import CreerCandidat    from "./pages/admin/adminelection/CreerCandidat";
import ModifierCandidat from "./pages/admin/adminelection/ModifierCandidat";

// Electeurs
import Electeurs        from "./pages/admin/adminelection/electeurs";
import AjouterElecteur  from "./pages/admin/adminelection/AjouterElecteur";
import ModifierElecteur from "./pages/admin/adminelection/ModifierElecteur";

// Electeur (votant)
import DashboardElecteur from "./pages/elcteurP/DashboardElecteur";
import VotePage          from "./pages/elcteurP/VotePage";
import ResultatsElecteur from "./pages/elcteurP/ResultatsElecteur";

// Pages générales
import Logout          from "./pages/logout";
import HomePage        from "./pages/home/HomePage";
import Login           from "./pages/auth/Login";
import MaintenancePage from "./pages/publics/MaintenancePage";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <AuthProvider>
      {/* BrowserRouter doit englober MaintenanceGuard car il utilise useLocation() */}
      <BrowserRouter>
        {/* MaintenanceGuard ici, DANS BrowserRouter — c'est la correction clé */}
        <MaintenanceGuard>
          <Routes>

            {/* Pages générales */}
            <Route path="/"                element={<HomePage />} />
            <Route path="/Login"           element={<Login />} />
            <Route path="/logout"          element={<Logout />} />
            <Route path="/MaintenancePage" element={<MaintenancePage />} />

            {/* Pages publiques */}
            <Route path="/candidater/:id"        element={<CandidaterPublicPage />} />
            <Route path="/voter/:id"             element={<VoterPublicPage />} />
            <Route path="/election-publique/:id" element={<VoterPublicPage />} />
            <Route path="/dashboard-electeur"    element={<DashboardPublicPage />} />
            <Route path="/dashboard-candidat"    element={<DashboardPublicPage />} />
            <Route path="/dashboard-candidat-public" element={<DashboardCandidatPublicPage />} />

            {/* Super Admin */}
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
            <Route path="/admin/superadmin/transactions-campay"            element={<TransactionsCamPay />} />
            <Route path="/admin/superadmin/retraits"                       element={<RetraitCamPay />} />

            {/* Admin Election */}
            <Route path="/adminElectionDashboard"                          element={<AdminElectionDashboard />} />
            <Route path="/creer-election"                                  element={<RegisterElection />} />
            <Route path="/admin/adminelection/ElectionPage"                element={<ElectionPage />} />
            <Route path="/admin/adminelection/Creer-election"              element={<CreerElection />} />
            <Route path="/admin/adminelection/modifier-election/:id"       element={<ModifierElection />} />
            <Route path="/admin/adminelection/detail-election/:id"         element={<ElectionDetails />} />
            <Route path="/admin/adminelection/resultats"                   element={<Resultats />} />
            <Route path="/admin/adminelection/depouillement/:electionId"   element={<DepouillementTour />} />
            <Route path="/admin/adminelection/parametres"                  element={<AdminElectionSettings />} />
            <Route path="/admin/adminelection/candidatures/:id"            element={<CandidaturesPubliquesPage />} />

            {/* Candidats */}
            <Route path="/admin/adminelection/candidats"                     element={<Candidats />} />
            <Route path="/admin/adminelection/creer-candidat"               element={<CreerCandidat />} />
            <Route path="/admin/adminelection/modifier-candidat/:candidatId" element={<ModifierCandidat />} />

            {/* Electeurs admin */}
            <Route path="/admin/adminelection/electeurs"                                 element={<Electeurs />} />
            <Route path="/admin/adminelection/electeurs/:electionId"                     element={<Electeurs />} />
            <Route path="/admin/adminelection/AjouterElecteur"                           element={<AjouterElecteur />} />
            <Route path="/admin/adminelection/electeurs/:electionId/AjouterElecteur"     element={<AjouterElecteur />} />
            <Route path="/admin/adminelection/election/:electionId/ModifierElecteur/:id" element={<ModifierElecteur />} />

            {/* Electeur (votant) */}
            <Route path="/DashboardElecteur"              element={<DashboardElecteur />} />
            <Route path="/electeur/voter/:electionId"     element={<VotePage />} />
            <Route path="/electeur/resultats/:electionId" element={<ResultatsElecteur />} />

          </Routes>
        </MaintenanceGuard>

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

// import CandidaterPublicPage      from "./pages/publics/CandidaterPublicPage";
// import VoterPublicPage           from "./pages/publics/VoterPublicPage";
// import DashboardPublicPage       from "./pages/publics/DashboardPublicPage";
// import CandidaturesPubliquesPage from "./pages/admin/adminelection/CandidaturesPubliquesPage";
// import DashboardCandidatPublicPage from "./pages/publics/DashboardCandidatPublicPage";
// import MaintenanceGuard from "./components/MaintenanceGuard";


// // Super Admin
// import AdminDashboard             from "./pages/admin/superadmin/superAdminDashboard";
// import UtilisateursPage           from "./pages/admin/superadmin/utilisateursPage";
// import StatistiquesPage           from "./pages/admin/superadmin/StatistiquesPage";
// import AjouterUtilisateur         from "./pages/admin/superadmin/AjouterUtilisateur";
// import ModifierUtilisateur        from "./pages/admin/superadmin/ModifierUtilisateur";
// import ElectionsValider           from "./pages/admin/superadmin/electionsValider";
// import SuperAdminElections        from "./pages/admin/superadmin/SuperAdminElections";
// import SuperAdminCreerElection    from "./pages/admin/superadmin/SuperAdminCreerElection";
// import SuperAdminModifierElection from "./pages/admin/superadmin/SuperAdminModifierElection";
// import SuperAdminSettings         from "./pages/admin/superadmin/SuperAdminSettings";
// import RetraitCamPay              from "./pages/admin/superadmin/RetraitCampay";
// import TransactionsCamPay         from "./pages/admin/superadmin/TransactionsCamPay";

// // Admin Election
// import AdminElectionDashboard from "./pages/admin/adminelection/adminElectionDashboard";
// import RegisterElection       from "./pages/admin/adminelection/RegisterElection";
// import ElectionPage           from "./pages/admin/adminelection/ElectionPage";
// import CreerElection          from "./pages/admin/adminelection/CreerElection";
// import ModifierElection       from "./pages/admin/adminelection/ModifierElection";
// import ElectionDetails        from "./pages/admin/adminelection/ElectionDetails";
// import Resultats              from "./pages/admin/adminelection/resultats";
// import DepouillementTour      from "./pages/admin/adminelection/DepouillementTour";
// import AdminElectionSettings  from "./pages/admin/adminelection/AdminElectionSettings";

// // Candidats
// import Candidats        from "./pages/admin/adminelection/Candidats";
// import CreerCandidat    from "./pages/admin/adminelection/CreerCandidat";
// import ModifierCandidat from "./pages/admin/adminelection/ModifierCandidat";

// // Electeurs
// import Electeurs        from "./pages/admin/adminelection/electeurs";
// import AjouterElecteur  from "./pages/admin/adminelection/AjouterElecteur";
// import ModifierElecteur from "./pages/admin/adminelection/ModifierElecteur";

// // Electeur (votant)
// import DashboardElecteur from "./pages/elcteurP/DashboardElecteur";
// import VotePage          from "./pages/elcteurP/VotePage";
// import ResultatsElecteur from "./pages/elcteurP/ResultatsElecteur";

// // Pages generales
// import Logout   from "./pages/logout";
// import HomePage from "./pages/home/HomePage";
// import Login    from "./pages/auth/Login";
// import MaintenancePage from "./pages/MaintenancePage";

// function App() {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");
//     if (storedUser) setUser(JSON.parse(storedUser));
//   }, []);

//   return (
    
//     <AuthProvider>
//       <BrowserRouter>
//       <MaintenanceGuard>
//         <Routes>

//           {/* Pages generales */}
//           <Route path="/"       element={<HomePage />} />
//           <Route path="/Login"  element={<Login />} />
//           <Route path="/logout" element={<Logout />} />
//           <Route path="/MaintenancePage" element={<MaintenancePage />} />

//           {/* Pages publiques */}
//           <Route path="/candidater/:id"     element={<CandidaterPublicPage />} />
//           <Route path="/voter/:id"          element={<VoterPublicPage />} />
//           <Route path="/election-publique/:id" element={<VoterPublicPage />} />
//           <Route path="/dashboard-electeur" element={<DashboardPublicPage />} />
//           <Route path="/dashboard-candidat" element={<DashboardPublicPage />} />
//           {/* <Route path="/dashboard-candidat-public" element={<ProtectedRoute roles={["CANDIDAT_PUBLIC"]}> <DashboardCandidatPublicPage /> </ProtectedRoute> } />
//           */}
//           <Route path="/dashboard-candidat-public" element={<DashboardCandidatPublicPage /> } />
         
//           {/* Super Admin */}
//           <Route path="/superAdminDashboard"                             element={<AdminDashboard />} />
//           <Route path="/admin/superadmin/utilisateursPage"               element={<UtilisateursPage />} />
//           <Route path="/admin/superadmin/StatistiquesPage"               element={<StatistiquesPage />} />
//           <Route path="/admin/superadmin/electionsValider"               element={<ElectionsValider />} />
//           <Route path="/dashboard/utilisateurs/ajouter"                  element={<AjouterUtilisateur />} />
//           <Route path="/dashboard/utilisateurs/modifier/:id"             element={<ModifierUtilisateur />} />
//           <Route path="/admin/superadmin/elections"                      element={<SuperAdminElections />} />
//           <Route path="/admin/superadmin/elections/creer"                element={<SuperAdminCreerElection />} />
//           <Route path="/admin/superadmin/elections/modifier/:id"         element={<SuperAdminModifierElection />} />
//           <Route path="/admin/superadmin/parametres"                     element={<SuperAdminSettings />} />
//           <Route path="/admin/superadmin/transactions-campay"            element={<TransactionsCamPay />} />
//           <Route path="/admin/superadmin/retraits"                       element={<RetraitCamPay />} />

//           {/* Admin Election */}
//           <Route path="/adminElectionDashboard"                          element={<AdminElectionDashboard />} />
//           <Route path="/creer-election"                                  element={<RegisterElection />} />
//           <Route path="/admin/adminelection/ElectionPage"                element={<ElectionPage />} />
//           <Route path="/admin/adminelection/Creer-election"              element={<CreerElection />} />
//           <Route path="/admin/adminelection/modifier-election/:id"       element={<ModifierElection />} />
//           <Route path="/admin/adminelection/detail-election/:id"         element={<ElectionDetails />} />
//           <Route path="/admin/adminelection/resultats"                   element={<Resultats />} />
//           <Route path="/admin/adminelection/depouillement/:electionId"   element={<DepouillementTour />} />
//           <Route path="/admin/adminelection/parametres"                  element={<AdminElectionSettings />} />

//           {/* Candidatures publiques — route corrigee pour correspondre au sidebar */}
//           <Route path="/admin/adminelection/candidatures/:id"            element={<CandidaturesPubliquesPage />} />

//           {/* Candidats */}
//           <Route path="/admin/adminelection/candidats"                       element={<Candidats />} />
//           <Route path="/admin/adminelection/creer-candidat"                  element={<CreerCandidat />} />
//           <Route path="/admin/adminelection/modifier-candidat/:candidatId"   element={<ModifierCandidat />} />

//           {/* Electeurs admin */}
//           <Route path="/admin/adminelection/electeurs"                                 element={<Electeurs />} />
//           <Route path="/admin/adminelection/electeurs/:electionId"                     element={<Electeurs />} />
//           <Route path="/admin/adminelection/AjouterElecteur"                           element={<AjouterElecteur />} />
//           <Route path="/admin/adminelection/electeurs/:electionId/AjouterElecteur"     element={<AjouterElecteur />} />
//           <Route path="/admin/adminelection/election/:electionId/ModifierElecteur/:id" element={<ModifierElecteur />} />

//           {/* Electeur (votant) */}
//           <Route path="/DashboardElecteur"              element={<DashboardElecteur />} />
//           <Route path="/electeur/voter/:electionId"     element={<VotePage />} />
//           <Route path="/electeur/resultats/:electionId" element={<ResultatsElecteur />} />

//         </Routes>

//         <ToastContainer position="top-right" autoClose={5000} />
//          </MaintenanceGuard>
//       </BrowserRouter>
//     </AuthProvider>
   
//   );
// }

// export default App;

