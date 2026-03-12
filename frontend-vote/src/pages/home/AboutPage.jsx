import React from "react";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-blue-100 p-8 flex flex-col items-center">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">🗳 À propos de eVote</h1>
        <p className="text-lg text-blue-800 max-w-2xl mx-auto">
          eVote est une plateforme sécurisée de vote en ligne qui permet aux électeurs de participer facilement à leurs élections et aux administrateurs de gérer les élections efficacement.
        </p>
      </header>

      {/* Features */}
      <section className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-2xl font-bold text-blue-900 mb-2">Sécurité et fiabilité</h3>
          <p className="text-gray-700">
            Chaque vote est enregistré de manière sécurisée et confidentielle. Notre système empêche tout double vote et garantit l’intégrité des résultats.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-2xl font-bold text-blue-900 mb-2">Interface intuitive</h3>
          <p className="text-gray-700">
            Les électeurs et les administrateurs disposent d’un tableau de bord simple et clair pour gérer les élections, voter ou consulter les résultats.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-2xl font-bold text-blue-900 mb-2">Suivi en temps réel</h3>
          <p className="text-gray-700">
            Consultez la participation et les résultats en direct, et obtenez des statistiques détaillées sur chaque élection.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-2xl font-bold text-blue-900 mb-2">Accessibilité</h3>
          <p className="text-gray-700">
            eVote fonctionne sur tous les appareils (ordinateur, tablette, smartphone), permettant aux électeurs de voter facilement où qu’ils soient.
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center mb-12">
        <Link
          to="/login"
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition"
        >
          Se connecter et voter
        </Link>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-600">
        &copy; {new Date().getFullYear()} eVote. Tous droits réservés.
      </footer>
    </div>
  );
}