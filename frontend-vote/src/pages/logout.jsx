// src/pages/Deconnexion.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1️⃣ Supprimer les tokens / session côté client
    localStorage.removeItem("token"); // ou le nom que tu utilises
    localStorage.removeItem("user"); // infos utilisateur

    // 2️⃣ Optionnel : afficher un message de déconnexion pendant 2 sec
    const timer = setTimeout(() => {
      navigate("/login"); // redirection vers page login
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <div className="bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center">
        <FiLogOut className="text-red-500 text-6xl mb-6" />
        <h1 className="text-2xl font-bold text-red-600 mb-2">Déconnexion en cours...</h1>
        <p className="text-gray-600">Vous allez être redirigé vers la page de connexion.</p>
      </div>
    </div>
  );
}
