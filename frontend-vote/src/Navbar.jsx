import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav>
      <Link to="/">Accueil</Link> |{" "}
      <Link to="/login">Connexion</Link> |{" "}
      <Link to="/SuperAdminDashboard">AdminDashboard</Link> |{" "}
      <Link to="/adminElectionDashboard">AdminElectionDashboard</Link>|{" "}
      <Link to="/DashboardVoter">Dash Electeur</Link> |{" "}
      <Link to="/VotePage">page de Vote</Link> |{" "}
      <Link to="/VoteUninominal">Vote Uninominal</Link> |{" "}

      
    </nav>
  );
}