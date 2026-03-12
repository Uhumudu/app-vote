// src/pages/adminElection/Electeurs.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import {
  FiEdit, FiPlus, FiUpload, FiHome, FiLogOut,
  FiCalendar, FiSettings, FiTrash2, FiDownload,
  FiKey, FiCopy, FiEye, FiEyeOff, FiX, FiCheck
} from "react-icons/fi";
import api from "../../../services/api";

export default function Electeurs() {

  const { electionId } = useParams();
  const navigate = useNavigate();

  /* ================= STATE ================= */

  const [election, setElection]     = useState(null);
  const [electeurs, setElecteurs]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");

  const [csvPreview, setCsvPreview]       = useState([]);
  const [csvError, setCsvError]           = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  const [showDropdown, setShowDropdown]           = useState(false);
  const [visiblePasswordId, setVisiblePasswordId] = useState(null);
  const [copySuccessId, setCopySuccessId]         = useState(null);

  // Mots de passe en clair stockés temporairement { email: rawPassword }
  const [plainPasswords, setPlainPasswords] = useState({});

  // Reset en cours par id
  const [resettingId, setResettingId] = useState(null);

  // Modale reset mot de passe { id, nom, prenom, email, newPassword }
  const [resetModal, setResetModal] = useState(null);

  const dropdownRef = useRef();

  /* ================= PAGINATION ================= */

  const [currentPage, setCurrentPage] = useState(1);
  const electeursParPage              = 10;

  /* ================= LOAD ================= */

  useEffect(() => { fetchElectionEtElecteurs(); }, [electionId]);

  const fetchElectionEtElecteurs = async () => {
    try {
      setLoading(true);
      setError("");
      const resElection  = await api.get(`/elections/${electionId}`);
      setElection(resElection.data);
      const resElecteurs = await api.get(`/elections/${electionId}/electeurs`);
      setElecteurs(resElecteurs.data);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CLOSE DROPDOWN ================= */

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= CSV IMPORT ================= */

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvError(""); setImportSuccess("");
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        const preview = []; const errors = [];
        result.data.forEach((row, index) => {
          if (!row.nom || !row.prenom || !row.email) {
            errors.push(`Ligne ${index + 2} invalide`); return;
          }
          preview.push({
            nom:    row.nom.trim(),
            prenom: row.prenom.trim(),
            email:  row.email.trim(),
            actif:  row.actif ? row.actif.toLowerCase() === "true" : true
          });
        });
        if (errors.length > 0) setCsvError(`Lignes ignorées : ${errors.join(", ")}`);
        setCsvPreview(preview);
      },
      error: () => setCsvError("Erreur lors de la lecture du CSV.")
    });
  };

  const confirmImport = async () => {
    if (csvPreview.length === 0) return;
    try {
      const res = await api.post(`/elections/${electionId}/electeurs/import`, { electeurs: csvPreview });
      const { message, electeurs: newElecteurs, errors } = res.data;

      setElecteurs(prev => {
        const existingEmails = new Set(prev.map(e => e.email));
        return [...prev, ...newElecteurs.filter(e => !existingEmails.has(e.email))];
      });

      const newPwds = {};
      newElecteurs.forEach(e => { if (e.mot_de_passe) newPwds[e.email] = e.mot_de_passe; });
      setPlainPasswords(prev => ({ ...prev, ...newPwds }));

      setCsvPreview([]);
      const skipped = errors?.map(e => e.electeur) || [];
      setImportSuccess(`${message}${skipped.length > 0 ? ` (ignorés : ${skipped.join(", ")})` : ""}`);
      setTimeout(() => setImportSuccess(""), 8000);
    } catch (err) {
      setCsvError(err.response?.data?.message || "Erreur lors de l'import");
    }
  };

  /* ================= TÉLÉCHARGER MOTS DE PASSE ================= */

  const downloadPasswords = () => {
    const rows = Object.entries(plainPasswords).map(([email, pwd]) => {
      const el = electeurs.find(e => e.email === email);
      return `${el?.nom || ""},${el?.prenom || ""},${email},${pwd}`;
    });
    const csv  = "Nom,Prénom,Email,Mot de passe\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `electeurs_mots_de_passe_${electionId}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ================= RESET MOT DE PASSE ================= */

  const resetPassword = async (electeur) => {
    if (!window.confirm(`Réinitialiser le mot de passe de ${electeur.prenom} ${electeur.nom} ?`)) return;
    setResettingId(electeur.id);
    try {
      const res = await api.post(`/electeurs/${electeur.id}/reset-password`);
      const newPassword = res.data.mot_de_passe;

      // Stocker dans plainPasswords
      setPlainPasswords(prev => ({ ...prev, [electeur.email]: newPassword }));

      // Ouvrir la modale
      setResetModal({ id: electeur.id, nom: electeur.nom, prenom: electeur.prenom, email: electeur.email, newPassword });
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la réinitialisation");
    } finally {
      setResettingId(null);
    }
  };

  /* ================= SUPPRIMER ================= */

  const deleteElecteur = async (id) => {
    if (!window.confirm("Supprimer cet électeur ?")) return;
    try {
      await api.delete(`/elections/${electionId}/electeurs/${id}`);
      const deleted = electeurs.find(e => e.id === id);
      setElecteurs(prev => prev.filter(e => e.id !== id));
      if (deleted?.email) {
        setPlainPasswords(prev => { const c = { ...prev }; delete c[deleted.email]; return c; });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  /* ================= SEARCH + PAGINATION ================= */

  const filteredElecteurs = electeurs.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.prenom.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );
  const indexLast        = currentPage * electeursParPage;
  const indexFirst       = indexLast - electeursParPage;
  const currentElecteurs = filteredElecteurs.slice(indexFirst, indexLast);
  const totalPages       = Math.ceil(filteredElecteurs.length / electeursParPage);

  /* ================= COPY ================= */

  const handleCopy = (password, id) => {
    navigator.clipboard.writeText(password);
    setCopySuccessId(id);
    setTimeout(() => setCopySuccessId(null), 2000);
  };

  /* ================= RENDER ================= */

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <p className="text-indigo-700 text-lg font-semibold animate-pulse">Chargement...</p>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <div className="bg-white p-8 rounded-2xl shadow text-center">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button onClick={fetchElectionEtElecteurs} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
          Réessayer
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ===== MODALE RESET MOT DE PASSE ===== */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative">

            <button
              onClick={() => setResetModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <FiX size={20} />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                <FiKey size={26} className="text-indigo-600" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-center text-gray-800 mb-1">
              Mot de passe réinitialisé
            </h3>
            <p className="text-center text-gray-500 text-sm mb-6">
              {resetModal.prenom} {resetModal.nom} — {resetModal.email}
            </p>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-2">
                Nouveau mot de passe
              </p>
              <div className="flex items-center gap-3">
                <span className="flex-1 font-mono text-lg font-bold text-indigo-800 tracking-widest">
                  {visiblePasswordId === `modal-${resetModal.id}`
                    ? resetModal.newPassword
                    : "••••••••"}
                </span>
                <button
                  onClick={() =>
                    setVisiblePasswordId(prev =>
                      prev === `modal-${resetModal.id}` ? null : `modal-${resetModal.id}`
                    )
                  }
                  className="p-2 bg-white border rounded-lg hover:bg-gray-50"
                  title="Afficher / Masquer"
                >
                  {visiblePasswordId === `modal-${resetModal.id}` ? <FiEyeOff /> : <FiEye />}
                </button>
                <button
                  onClick={() => handleCopy(resetModal.newPassword, `modal-${resetModal.id}`)}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  title="Copier"
                >
                  {copySuccessId === `modal-${resetModal.id}` ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
              {copySuccessId === `modal-${resetModal.id}` && (
                <p className="text-green-600 text-xs mt-2">✅ Copié dans le presse-papiers !</p>
              )}
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              ⚠️ Communiquez ce mot de passe à l'électeur. Il reste visible dans le tableau tant que la page n'est pas rechargée.
            </p>

            <button
              onClick={() => setResetModal(null)}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
        <nav className="flex-1 space-y-3">
          <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
            <FiHome size={16} /> Tableau de bord
          </Link>
          <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
            <FiCalendar size={16} /> Mes élections
          </Link>
        </nav>
        <div className="space-y-3 mt-6">
          <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
            <FiSettings size={16} /> Paramètres
          </Link>
          <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600">
            <FiLogOut size={16} /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 p-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-indigo-900">Électeurs – {election?.titre}</h2>
            <p className="text-sm text-indigo-500">{filteredElecteurs.length} électeur(s)</p>
          </div>

          <input
            type="text"
            placeholder="Rechercher un électeur..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/admin/adminelection/electeurs/${electionId}/AjouterElecteur`)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              <FiPlus /> Ajouter
            </button>

            {Object.keys(plainPasswords).length > 0 && (
              <button
                onClick={downloadPasswords}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600"
              >
                <FiDownload /> Mots de passe
              </button>
            )}

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
              >
                <FiUpload /> CSV
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-10">
                  <label className="block px-4 py-2 cursor-pointer hover:bg-green-100 rounded-xl">
                    📂 Importer un CSV
                    <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        {importSuccess && (
          <div className="mb-4 px-4 py-3 bg-green-100 text-green-700 rounded-xl border border-green-300">
            ✅ {importSuccess}
          </div>
        )}
        {csvError && (
          <div className="mb-4 px-4 py-3 bg-red-100 text-red-700 rounded-xl border border-red-300">
            ⚠️ {csvError}
          </div>
        )}

        {/* BANNIÈRE MOTS DE PASSE TEMPORAIRES */}
        {Object.keys(plainPasswords).length > 0 && (
          <div className="mb-4 px-4 py-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-300 flex justify-between items-center">
            <span>
              ⚠️ <strong>{Object.keys(plainPasswords).length}</strong> mot(s) de passe en clair disponible(s) — ils disparaîtront au rechargement.
            </span>
            <button
              onClick={downloadPasswords}
              className="ml-4 px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-semibold flex items-center gap-1"
            >
              <FiDownload size={14} /> Télécharger
            </button>
          </div>
        )}

        {/* APERÇU CSV */}
        {csvPreview.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
            <p className="font-semibold text-yellow-800 mb-3">
              📋 Aperçu CSV — {csvPreview.length} électeur(s) à importer
            </p>
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-yellow-100 text-yellow-800">
                    <th className="px-3 py-2 text-left">Nom</th>
                    <th className="px-3 py-2 text-left">Prénom</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Actif</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((e, i) => (
                    <tr key={i} className="border-t text-gray-700">
                      <td className="px-3 py-1">{e.nom}</td>
                      <td className="px-3 py-1">{e.prenom}</td>
                      <td className="px-3 py-1">{e.email}</td>
                      <td className="px-3 py-1">{e.actif ? "✅" : "❌"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 mt-3">
              <button onClick={confirmImport} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
                ✅ Confirmer l'import
              </button>
              <button onClick={() => setCsvPreview([])} className="px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-400">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* TABLE ÉLECTEURS */}
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-indigo-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Prénom</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Mot de passe</th>
                <th className="px-4 py-3 text-left">Actif</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentElecteurs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                    Aucun électeur trouvé
                  </td>
                </tr>
              ) : (
                currentElecteurs.map((e, i) => {
                  const rawPwd = e.mot_de_passe || plainPasswords[e.email] || null;

                  return (
                    <tr key={e.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-3 text-black">{e.id}</td>
                      <td className="px-4 py-3 text-black">{e.nom}</td>
                      <td className="px-4 py-3 text-black">{e.prenom}</td>
                      <td className="px-4 py-3 text-black">{e.email}</td>

                      {/* MOT DE PASSE */}
                      <td className="px-4 py-3 font-mono text-black">
                        {rawPwd ? (
                          <div className="flex gap-2 items-center">
                            <span className="min-w-[80px]">
                              {visiblePasswordId === e.id ? rawPwd : "••••••••"}
                            </span>
                            <button
                              onClick={() => setVisiblePasswordId(prev => prev === e.id ? null : e.id)}
                              className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
                              title={visiblePasswordId === e.id ? "Masquer" : "Afficher"}
                            >
                              {visiblePasswordId === e.id ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                            </button>
                            <button
                              onClick={() => handleCopy(rawPwd, e.id)}
                              className="px-2 py-1 bg-indigo-200 rounded text-xs hover:bg-indigo-300"
                              title="Copier"
                            >
                              {copySuccessId === e.id ? <FiCheck size={13} className="text-green-600" /> : <FiCopy size={13} />}
                            </button>
                          </div>
                        ) : (
                          // Hashé → bouton reset inline
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs italic">hashé en base</span>
                            <button
                              onClick={() => resetPassword(e)}
                              disabled={resettingId === e.id}
                              className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:opacity-50"
                              title="Réinitialiser le mot de passe"
                            >
                              <FiKey size={12} />
                              {resettingId === e.id ? "..." : "Reset"}
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-sm ${e.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {e.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => navigate(`/admin/adminelection/election/${electionId}/ModifierElecteur/${e.id}`)}
                            className="px-3 py-2 bg-yellow-400 rounded-lg hover:bg-yellow-500"
                            title="Modifier"
                          >
                            <FiEdit size={14} />
                          </button>
                          <button
                            onClick={() => resetPassword(e)}
                            disabled={resettingId === e.id}
                            className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                            title="Réinitialiser le mot de passe"
                          >
                            <FiKey size={14} />
                          </button>
                          <button
                            onClick={() => deleteElecteur(e.id)}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            title="Supprimer"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg ${currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-white border"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}






















































// // src/pages/adminElection/Electeurs.jsx

// import React, { useState, useEffect, useRef } from "react";
// import { Link, useParams, useNavigate } from "react-router-dom";
// import Papa from "papaparse";
// import {
//   FiEdit, FiPlus, FiUpload, FiHome, FiLogOut,
//   FiCalendar, FiSettings, FiTrash2, FiDownload,
//   FiKey, FiCopy, FiEye, FiEyeOff, FiX, FiCheck
// } from "react-icons/fi";
// import api from "../../../services/api";

// export default function Electeurs() {

//   const { electionId } = useParams();
//   const navigate = useNavigate();

//   /* ================= STATE ================= */

//   const [election, setElection]     = useState(null);
//   const [electeurs, setElecteurs]   = useState([]);
//   const [loading, setLoading]       = useState(true);
//   const [error, setError]           = useState("");
//   const [search, setSearch]         = useState("");

//   const [csvPreview, setCsvPreview]       = useState([]);
//   const [csvError, setCsvError]           = useState("");
//   const [importSuccess, setImportSuccess] = useState("");

//   const [showDropdown, setShowDropdown]           = useState(false);
//   const [visiblePasswordId, setVisiblePasswordId] = useState(null);
//   const [copySuccessId, setCopySuccessId]         = useState(null);

//   // Mots de passe en clair stockés temporairement { email: rawPassword }
//   const [plainPasswords, setPlainPasswords] = useState({});

//   // Reset en cours par id
//   const [resettingId, setResettingId] = useState(null);

//   // Modale reset mot de passe { id, nom, prenom, email, newPassword }
//   const [resetModal, setResetModal] = useState(null);

//   const dropdownRef = useRef();

//   /* ================= PAGINATION ================= */

//   const [currentPage, setCurrentPage] = useState(1);
//   const electeursParPage              = 10;

//   /* ================= LOAD ================= */

//   useEffect(() => { fetchElectionEtElecteurs(); }, [electionId]);

//   const fetchElectionEtElecteurs = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const resElection  = await api.get(`/elections/${electionId}`);
//       setElection(resElection.data);
//       const resElecteurs = await api.get(`/elections/${electionId}/electeurs`);
//       setElecteurs(resElecteurs.data);
//     } catch (err) {
//       setError(err.response?.data?.message || "Impossible de charger les données");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= CLOSE DROPDOWN ================= */

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target))
//         setShowDropdown(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   /* ================= CSV IMPORT ================= */

//   const handleCSVImport = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setCsvError(""); setImportSuccess("");
//     Papa.parse(file, {
//       header: true, skipEmptyLines: true,
//       complete: (result) => {
//         const preview = []; const errors = [];
//         result.data.forEach((row, index) => {
//           if (!row.nom || !row.prenom || !row.email) {
//             errors.push(`Ligne ${index + 2} invalide`); return;
//           }
//           preview.push({
//             nom:    row.nom.trim(),
//             prenom: row.prenom.trim(),
//             email:  row.email.trim(),
//             actif:  row.actif ? row.actif.toLowerCase() === "true" : true
//           });
//         });
//         if (errors.length > 0) setCsvError(`Lignes ignorées : ${errors.join(", ")}`);
//         setCsvPreview(preview);
//       },
//       error: () => setCsvError("Erreur lors de la lecture du CSV.")
//     });
//   };

//   const confirmImport = async () => {
//     if (csvPreview.length === 0) return;
//     try {
//       const res = await api.post(`/elections/${electionId}/electeurs/import`, { electeurs: csvPreview });
//       const { message, electeurs: newElecteurs, errors } = res.data;

//       setElecteurs(prev => {
//         const existingEmails = new Set(prev.map(e => e.email));
//         return [...prev, ...newElecteurs.filter(e => !existingEmails.has(e.email))];
//       });

//       const newPwds = {};
//       newElecteurs.forEach(e => { if (e.mot_de_passe) newPwds[e.email] = e.mot_de_passe; });
//       setPlainPasswords(prev => ({ ...prev, ...newPwds }));

//       setCsvPreview([]);
//       const skipped = errors?.map(e => e.electeur) || [];
//       setImportSuccess(`${message}${skipped.length > 0 ? ` (ignorés : ${skipped.join(", ")})` : ""}`);
//       setTimeout(() => setImportSuccess(""), 8000);
//     } catch (err) {
//       setCsvError(err.response?.data?.message || "Erreur lors de l'import");
//     }
//   };

//   /* ================= TÉLÉCHARGER MOTS DE PASSE ================= */

//   const downloadPasswords = () => {
//     const rows = Object.entries(plainPasswords).map(([email, pwd]) => {
//       const el = electeurs.find(e => e.email === email);
//       return `${el?.nom || ""},${el?.prenom || ""},${email},${pwd}`;
//     });
//     const csv  = "Nom,Prénom,Email,Mot de passe\n" + rows.join("\n");
//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const url  = URL.createObjectURL(blob);
//     const a    = document.createElement("a");
//     a.href = url; a.download = `electeurs_mots_de_passe_${electionId}.csv`;
//     a.click(); URL.revokeObjectURL(url);
//   };

//   /* ================= RESET MOT DE PASSE ================= */

//   const resetPassword = async (electeur) => {
//     if (!window.confirm(`Réinitialiser le mot de passe de ${electeur.prenom} ${electeur.nom} ?`)) return;
//     setResettingId(electeur.id);
//     try {
//       const res = await api.post(`/electeurs/${electeur.id}/reset-password`);
//       const newPassword = res.data.mot_de_passe;

//       // Stocker dans plainPasswords
//       setPlainPasswords(prev => ({ ...prev, [electeur.email]: newPassword }));

//       // Ouvrir la modale
//       setResetModal({ id: electeur.id, nom: electeur.nom, prenom: electeur.prenom, email: electeur.email, newPassword });
//     } catch (err) {
//       alert(err.response?.data?.message || "Erreur lors de la réinitialisation");
//     } finally {
//       setResettingId(null);
//     }
//   };

//   /* ================= SUPPRIMER ================= */

//   const deleteElecteur = async (id) => {
//     if (!window.confirm("Supprimer cet électeur ?")) return;
//     try {
//       await api.delete(`/elections/${electionId}/electeurs/${id}`);
//       const deleted = electeurs.find(e => e.id === id);
//       setElecteurs(prev => prev.filter(e => e.id !== id));
//       if (deleted?.email) {
//         setPlainPasswords(prev => { const c = { ...prev }; delete c[deleted.email]; return c; });
//       }
//     } catch (err) {
//       alert(err.response?.data?.message || "Erreur lors de la suppression");
//     }
//   };

//   /* ================= SEARCH + PAGINATION ================= */

//   const filteredElecteurs = electeurs.filter(e =>
//     e.nom.toLowerCase().includes(search.toLowerCase()) ||
//     e.prenom.toLowerCase().includes(search.toLowerCase()) ||
//     e.email.toLowerCase().includes(search.toLowerCase())
//   );
//   const indexLast        = currentPage * electeursParPage;
//   const indexFirst       = indexLast - electeursParPage;
//   const currentElecteurs = filteredElecteurs.slice(indexFirst, indexLast);
//   const totalPages       = Math.ceil(filteredElecteurs.length / electeursParPage);

//   /* ================= COPY ================= */

//   const handleCopy = (password, id) => {
//     navigator.clipboard.writeText(password);
//     setCopySuccessId(id);
//     setTimeout(() => setCopySuccessId(null), 2000);
//   };

//   /* ================= RENDER ================= */

//   if (loading) return (
//     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <p className="text-indigo-700 text-lg font-semibold animate-pulse">Chargement...</p>
//     </div>
//   );

//   if (error) return (
//     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <div className="bg-white p-8 rounded-2xl shadow text-center">
//         <p className="text-red-600 font-semibold mb-4">{error}</p>
//         <button onClick={fetchElectionEtElecteurs} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
//           Réessayer
//         </button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ===== MODALE RESET MOT DE PASSE ===== */}
//       {resetModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative">

//             <button
//               onClick={() => setResetModal(null)}
//               className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500"
//             >
//               <FiX size={20} />
//             </button>

//             <div className="flex justify-center mb-4">
//               <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
//                 <FiKey size={26} className="text-indigo-600" />
//               </div>
//             </div>

//             <h3 className="text-xl font-bold text-center text-gray-800 mb-1">
//               Mot de passe réinitialisé
//             </h3>
//             <p className="text-center text-gray-500 text-sm mb-6">
//               {resetModal.prenom} {resetModal.nom} — {resetModal.email}
//             </p>

//             <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
//               <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-2">
//                 Nouveau mot de passe
//               </p>
//               <div className="flex items-center gap-3">
//                 <span className="flex-1 font-mono text-lg font-bold text-indigo-800 tracking-widest">
//                   {visiblePasswordId === `modal-${resetModal.id}`
//                     ? resetModal.newPassword
//                     : "••••••••"}
//                 </span>
//                 <button
//                   onClick={() =>
//                     setVisiblePasswordId(prev =>
//                       prev === `modal-${resetModal.id}` ? null : `modal-${resetModal.id}`
//                     )
//                   }
//                   className="p-2 bg-white border rounded-lg hover:bg-gray-50"
//                   title="Afficher / Masquer"
//                 >
//                   {visiblePasswordId === `modal-${resetModal.id}` ? <FiEyeOff /> : <FiEye />}
//                 </button>
//                 <button
//                   onClick={() => handleCopy(resetModal.newPassword, `modal-${resetModal.id}`)}
//                   className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
//                   title="Copier"
//                 >
//                   {copySuccessId === `modal-${resetModal.id}` ? <FiCheck /> : <FiCopy />}
//                 </button>
//               </div>
//               {copySuccessId === `modal-${resetModal.id}` && (
//                 <p className="text-green-600 text-xs mt-2">✅ Copié dans le presse-papiers !</p>
//               )}
//             </div>

//             <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
//               ⚠️ Communiquez ce mot de passe à l'électeur. Il reste visible dans le tableau tant que la page n'est pas rechargée.
//             </p>

//             <button
//               onClick={() => setResetModal(null)}
//               className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
//             >
//               Fermer
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ===== SIDEBAR ===== */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiHome size={16} /> Tableau de bord
//           </Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiCalendar size={16} /> Mes élections
//           </Link>
//         </nav>
//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings size={16} /> Paramètres
//           </Link>
//           <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600">
//             <FiLogOut size={16} /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ===== MAIN ===== */}
//       <main className="flex-1 p-8">

//         {/* HEADER */}
//         <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
//           <div>
//             <h2 className="text-xl font-bold text-indigo-900">Électeurs – {election?.titre}</h2>
//             <p className="text-sm text-indigo-500">{filteredElecteurs.length} électeur(s)</p>
//           </div>

//           <input
//             type="text"
//             placeholder="Rechercher un électeur..."
//             value={search}
//             onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
//             className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           />

//           <div className="flex gap-3">
//             <button
//               onClick={() => navigate(`/admin/adminelection/election/${electionId}/AjouterElecteur`)}
//               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
//             >
//               <FiPlus /> Ajouter
//             </button>

//             {Object.keys(plainPasswords).length > 0 && (
//               <button
//                 onClick={downloadPasswords}
//                 className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600"
//               >
//                 <FiDownload /> Mots de passe
//               </button>
//             )}

//             <div className="relative" ref={dropdownRef}>
//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
//               >
//                 <FiUpload /> CSV
//               </button>
//               {showDropdown && (
//                 <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-10">
//                   <label className="block px-4 py-2 cursor-pointer hover:bg-green-100 rounded-xl">
//                     📂 Importer un CSV
//                     <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
//                   </label>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* MESSAGES */}
//         {importSuccess && (
//           <div className="mb-4 px-4 py-3 bg-green-100 text-green-700 rounded-xl border border-green-300">
//             ✅ {importSuccess}
//           </div>
//         )}
//         {csvError && (
//           <div className="mb-4 px-4 py-3 bg-red-100 text-red-700 rounded-xl border border-red-300">
//             ⚠️ {csvError}
//           </div>
//         )}

//         {/* BANNIÈRE MOTS DE PASSE TEMPORAIRES */}
//         {Object.keys(plainPasswords).length > 0 && (
//           <div className="mb-4 px-4 py-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-300 flex justify-between items-center">
//             <span>
//               ⚠️ <strong>{Object.keys(plainPasswords).length}</strong> mot(s) de passe en clair disponible(s) — ils disparaîtront au rechargement.
//             </span>
//             <button
//               onClick={downloadPasswords}
//               className="ml-4 px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-semibold flex items-center gap-1"
//             >
//               <FiDownload size={14} /> Télécharger
//             </button>
//           </div>
//         )}

//         {/* APERÇU CSV */}
//         {csvPreview.length > 0 && (
//           <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
//             <p className="font-semibold text-yellow-800 mb-3">
//               📋 Aperçu CSV — {csvPreview.length} électeur(s) à importer
//             </p>
//             <div className="overflow-x-auto max-h-48 overflow-y-auto">
//               <table className="min-w-full text-sm">
//                 <thead>
//                   <tr className="bg-yellow-100 text-yellow-800">
//                     <th className="px-3 py-2 text-left">Nom</th>
//                     <th className="px-3 py-2 text-left">Prénom</th>
//                     <th className="px-3 py-2 text-left">Email</th>
//                     <th className="px-3 py-2 text-left">Actif</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {csvPreview.map((e, i) => (
//                     <tr key={i} className="border-t text-gray-700">
//                       <td className="px-3 py-1">{e.nom}</td>
//                       <td className="px-3 py-1">{e.prenom}</td>
//                       <td className="px-3 py-1">{e.email}</td>
//                       <td className="px-3 py-1">{e.actif ? "✅" : "❌"}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//             <div className="flex gap-3 mt-3">
//               <button onClick={confirmImport} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
//                 ✅ Confirmer l'import
//               </button>
//               <button onClick={() => setCsvPreview([])} className="px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-400">
//                 Annuler
//               </button>
//             </div>
//           </div>
//         )}

//         {/* TABLE ÉLECTEURS */}
//         <div className="bg-white rounded-2xl shadow overflow-x-auto">
//           <table className="min-w-full">
//             <thead className="bg-indigo-700 text-white">
//               <tr>
//                 <th className="px-4 py-3 text-left">ID</th>
//                 <th className="px-4 py-3 text-left">Nom</th>
//                 <th className="px-4 py-3 text-left">Prénom</th>
//                 <th className="px-4 py-3 text-left">Email</th>
//                 <th className="px-4 py-3 text-left">Mot de passe</th>
//                 <th className="px-4 py-3 text-left">Actif</th>
//                 <th className="px-4 py-3 text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentElecteurs.length === 0 ? (
//                 <tr>
//                   <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
//                     Aucun électeur trouvé
//                   </td>
//                 </tr>
//               ) : (
//                 currentElecteurs.map((e, i) => {
//                   const rawPwd = e.mot_de_passe || plainPasswords[e.email] || null;

//                   return (
//                     <tr key={e.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
//                       <td className="px-4 py-3 text-black">{e.id}</td>
//                       <td className="px-4 py-3 text-black">{e.nom}</td>
//                       <td className="px-4 py-3 text-black">{e.prenom}</td>
//                       <td className="px-4 py-3 text-black">{e.email}</td>

//                       {/* MOT DE PASSE */}
//                       <td className="px-4 py-3 font-mono text-black">
//                         {rawPwd ? (
//                           <div className="flex gap-2 items-center">
//                             <span className="min-w-[80px]">
//                               {visiblePasswordId === e.id ? rawPwd : "••••••••"}
//                             </span>
//                             <button
//                               onClick={() => setVisiblePasswordId(prev => prev === e.id ? null : e.id)}
//                               className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
//                               title={visiblePasswordId === e.id ? "Masquer" : "Afficher"}
//                             >
//                               {visiblePasswordId === e.id ? <FiEyeOff size={13} /> : <FiEye size={13} />}
//                             </button>
//                             <button
//                               onClick={() => handleCopy(rawPwd, e.id)}
//                               className="px-2 py-1 bg-indigo-200 rounded text-xs hover:bg-indigo-300"
//                               title="Copier"
//                             >
//                               {copySuccessId === e.id ? <FiCheck size={13} className="text-green-600" /> : <FiCopy size={13} />}
//                             </button>
//                           </div>
//                         ) : (
//                           // Hashé → bouton reset inline
//                           <div className="flex items-center gap-2">
//                             <span className="text-gray-400 text-xs italic">hashé en base</span>
//                             <button
//                               onClick={() => resetPassword(e)}
//                               disabled={resettingId === e.id}
//                               className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:opacity-50"
//                               title="Réinitialiser le mot de passe"
//                             >
//                               <FiKey size={12} />
//                               {resettingId === e.id ? "..." : "Reset"}
//                             </button>
//                           </div>
//                         )}
//                       </td>

//                       <td className="px-4 py-3">
//                         <span className={`px-2 py-1 rounded-full text-sm ${e.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
//                           {e.actif ? "Actif" : "Inactif"}
//                         </span>
//                       </td>

//                       <td className="px-4 py-3">
//                         <div className="flex gap-2 justify-center">
//                           <button
//                             onClick={() => navigate(`/admin/adminelection/election/${electionId}/ModifierElecteur/${e.id}`)}
//                             className="px-3 py-2 bg-yellow-400 rounded-lg hover:bg-yellow-500"
//                             title="Modifier"
//                           >
//                             <FiEdit size={14} />
//                           </button>
//                           <button
//                             onClick={() => resetPassword(e)}
//                             disabled={resettingId === e.id}
//                             className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
//                             title="Réinitialiser le mot de passe"
//                           >
//                             <FiKey size={14} />
//                           </button>
//                           <button
//                             onClick={() => deleteElecteur(e.id)}
//                             className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
//                             title="Supprimer"
//                           >
//                             <FiTrash2 size={14} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* PAGINATION */}
//         {totalPages > 1 && (
//           <div className="flex justify-center gap-2 mt-6">
//             {[...Array(totalPages)].map((_, i) => (
//               <button
//                 key={i}
//                 onClick={() => setCurrentPage(i + 1)}
//                 className={`px-4 py-2 rounded-lg ${currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-white border"}`}
//               >
//                 {i + 1}
//               </button>
//             ))}
//           </div>
//         )}

//       </main>
//     </div>
//   );
// }




























// // src/pages/adminElection/Electeurs.jsx

// import React, { useState, useEffect, useRef } from "react";
// import { Link, useParams, useNavigate } from "react-router-dom";
// import Papa from "papaparse";
// import {
//   FiEdit, FiPlus, FiUpload, FiHome, FiBarChart2, FiLogOut,
//   FiUserCheck, FiUsers, FiCalendar, FiSettings, FiTrash2, FiDownload
// } from "react-icons/fi";
// import api from "../../../services/api";

// export default function Electeurs() {

//   const { electionId } = useParams();
//   const navigate = useNavigate();

//   /* ================= STATE ================= */

//   const [election, setElection]           = useState(null);
//   const [electeurs, setElecteurs]         = useState([]);
//   const [loading, setLoading]             = useState(true);
//   const [error, setError]                 = useState("");

//   const [search, setSearch]               = useState("");

//   const [csvPreview, setCsvPreview]       = useState([]);
//   const [csvError, setCsvError]           = useState("");
//   const [importSuccess, setImportSuccess] = useState("");

//   const [showDropdown, setShowDropdown]   = useState(false);
//   const [visiblePasswordId, setVisiblePasswordId] = useState(null);
//   const [copySuccessId, setCopySuccessId] = useState(null);

//   // ✅ Stockage temporaire des mots de passe en clair après ajout/import
//   const [plainPasswords, setPlainPasswords] = useState({}); // { [userId_or_email]: rawPassword }

//   const dropdownRef = useRef();

//   /* ================= PAGINATION ================= */

//   const [currentPage, setCurrentPage]   = useState(1);
//   const electeursParPage                = 10;

//   /* ================= LOAD ELECTION + ELECTEURS ================= */

//   useEffect(() => {
//     fetchElectionEtElecteurs();
//   }, [electionId]);

//   const fetchElectionEtElecteurs = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const resElection = await api.get(`/elections/${electionId}`);
//       setElection(resElection.data);

//       const resElecteurs = await api.get(`/elections/${electionId}/electeurs`);
//       setElecteurs(resElecteurs.data);

//     } catch (err) {
//       console.error("Erreur chargement :", err);
//       setError(err.response?.data?.message || "Impossible de charger les données");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= CLOSE DROPDOWN ================= */

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   /* ================= CSV IMPORT (parsing côté frontend) ================= */

//   const handleCSVImport = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setCsvError("");
//     setImportSuccess("");

//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       complete: (result) => {
//         const preview = [];
//         const errors  = [];

//         result.data.forEach((row, index) => {
//           if (!row.nom || !row.prenom || !row.email) {
//             errors.push(`Ligne ${index + 2} invalide`);
//             return;
//           }
//           preview.push({
//             nom:    row.nom.trim(),
//             prenom: row.prenom.trim(),
//             email:  row.email.trim(),
//             actif:  row.actif ? row.actif.toLowerCase() === "true" : true
//           });
//         });

//         if (errors.length > 0) setCsvError(`Lignes ignorées : ${errors.join(", ")}`);
//         setCsvPreview(preview);
//       },
//       error: () => setCsvError("Erreur lors de la lecture du CSV.")
//     });
//   };

//   // ✅ Envoyer le CSV parsé au backend — route corrigée : /import (pas /import-csv)
//   const confirmImport = async () => {
//     if (csvPreview.length === 0) return;

//     try {
//       const res = await api.post(
//         `/elections/${electionId}/electeurs/import`,   // ✅ corrigé
//         { electeurs: csvPreview }
//       );

//       // ✅ Le backend retourne { inserted (nombre), electeurs (tableau avec mdp), errors, message }
//       const { message, electeurs: newElecteurs, errors } = res.data;

//       // ✅ Fusionner les nouveaux électeurs dans la liste locale en évitant les doublons
//       setElecteurs(prev => {
//         const existingEmails = new Set(prev.map(e => e.email));
//         const toAdd = newElecteurs.filter(e => !existingEmails.has(e.email));
//         return [...prev, ...toAdd];
//       });

//       // ✅ Stocker les mots de passe en clair par email pour affichage dans le tableau
//       const newPasswords = {};
//       newElecteurs.forEach(e => {
//         if (e.mot_de_passe) newPasswords[e.email] = e.mot_de_passe;
//       });
//       setPlainPasswords(prev => ({ ...prev, ...newPasswords }));

//       setCsvPreview([]);
//       const skippedEmails = errors?.map(e => e.electeur) || [];
//       setImportSuccess(
//         `${message}${skippedEmails.length > 0 ? ` (ignorés : ${skippedEmails.join(", ")})` : ""}`
//       );
//       setTimeout(() => setImportSuccess(""), 8000);

//     } catch (err) {
//       console.error(err);
//       setCsvError(err.response?.data?.message || "Erreur lors de l'import");
//     }
//   };

//   // ✅ Télécharger les mots de passe importés en CSV
//   const downloadPasswords = () => {
//     const rows = Object.entries(plainPasswords).map(([email, pwd]) => {
//       const electeur = electeurs.find(e => e.email === email);
//       return `${electeur?.nom || ""},${electeur?.prenom || ""},${email},${pwd}`;
//     });
//     const csv = "Nom,Prénom,Email,Mot de passe\n" + rows.join("\n");
//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `electeurs_mots_de_passe_${electionId}.csv`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   /* ================= SUPPRIMER UN ELECTEUR ================= */

//   const deleteElecteur = async (id) => {
//     if (!window.confirm("Supprimer cet électeur ?")) return;

//     try {
//       await api.delete(`/elections/${electionId}/electeurs/${id}`);
//       setElecteurs(prev => prev.filter(e => e.id !== id));
//       // ✅ Nettoyer aussi les mots de passe en clair
//       const deleted = electeurs.find(e => e.id === id);
//       if (deleted?.email) {
//         setPlainPasswords(prev => {
//           const copy = { ...prev };
//           delete copy[deleted.email];
//           return copy;
//         });
//       }
//     } catch (err) {
//       console.error(err);
//       alert(err.response?.data?.message || "Erreur lors de la suppression");
//     }
//   };

//   /* ================= SEARCH + PAGINATION ================= */

//   const filteredElecteurs = electeurs.filter(e =>
//     e.nom.toLowerCase().includes(search.toLowerCase()) ||
//     e.prenom.toLowerCase().includes(search.toLowerCase()) ||
//     e.email.toLowerCase().includes(search.toLowerCase())
//   );

//   const indexLast        = currentPage * electeursParPage;
//   const indexFirst       = indexLast - electeursParPage;
//   const currentElecteurs = filteredElecteurs.slice(indexFirst, indexLast);
//   const totalPages       = Math.ceil(filteredElecteurs.length / electeursParPage);

//   /* ================= COPY PASSWORD ================= */

//   const handleCopy = (password, id) => {
//     navigator.clipboard.writeText(password);
//     setCopySuccessId(id);
//     setTimeout(() => setCopySuccessId(null), 2000);
//   };

//   /* ================= RENDER ================= */

//   if (loading) return (
//     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <p className="text-indigo-700 text-lg font-semibold animate-pulse">Chargement...</p>
//     </div>
//   );

//   if (error) return (
//     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <div className="bg-white p-8 rounded-2xl shadow text-center">
//         <p className="text-red-600 font-semibold mb-4">{error}</p>
//         <button onClick={fetchElectionEtElecteurs} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
//           Réessayer
//         </button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ================= SIDEBAR ================= */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiHome /> Tableau de bord
//           </Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiCalendar /> Mes élections
//           </Link>
//         </nav>
//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings /> Paramètres
//           </Link>
//           <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main className="flex-1 p-8">

//         {/* HEADER */}
//         <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
//           <div>
//             <h2 className="text-xl font-bold text-indigo-900">
//               Électeurs – {election?.titre}
//             </h2>
//             <p className="text-sm text-indigo-500">{filteredElecteurs.length} électeur(s)</p>
//           </div>

//           <input
//             type="text"
//             placeholder="Rechercher un électeur..."
//             value={search}
//             onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
//             className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           />

//           <div className="flex gap-3">
//             <button
//               onClick={() => navigate(`/admin/adminelection/election/${electionId}/AjouterElecteur`)}
//               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
//             >
//               <FiPlus /> Ajouter
//             </button>

//             {/* ✅ Bouton télécharger les mots de passe — visible seulement s'il y en a */}
//             {Object.keys(plainPasswords).length > 0 && (
//               <button
//                 onClick={downloadPasswords}
//                 className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600"
//                 title="Télécharger les mots de passe générés"
//               >
//                 <FiDownload /> Mots de passe
//               </button>
//             )}

//             {/* CSV DROPDOWN */}
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
//               >
//                 <FiUpload /> CSV
//               </button>
//               {showDropdown && (
//                 <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-10">
//                   <label className="block px-4 py-2 cursor-pointer hover:bg-green-100 rounded-xl">
//                     📂 Importer un CSV
//                     <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
//                   </label>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* MESSAGES */}
//         {importSuccess && (
//           <div className="mb-4 px-4 py-3 bg-green-100 text-green-700 rounded-xl border border-green-300">
//             ✅ {importSuccess}
//           </div>
//         )}
//         {csvError && (
//           <div className="mb-4 px-4 py-3 bg-red-100 text-red-700 rounded-xl border border-red-300">
//             ⚠️ {csvError}
//           </div>
//         )}

//         {/* ✅ Bannière d'avertissement mots de passe temporaires */}
//         {Object.keys(plainPasswords).length > 0 && (
//           <div className="mb-4 px-4 py-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-300 flex justify-between items-center">
//             <span>
//               ⚠️ <strong>{Object.keys(plainPasswords).length}</strong> mot(s) de passe en clair disponible(s).
//               Téléchargez-les maintenant — ils disparaîtront au rechargement de la page.
//             </span>
//             <button
//               onClick={downloadPasswords}
//               className="ml-4 px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-semibold"
//             >
//               <FiDownload className="inline mr-1" /> Télécharger
//             </button>
//           </div>
//         )}

//         {/* APERÇU CSV AVANT CONFIRMATION */}
//         {csvPreview.length > 0 && (
//           <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
//             <p className="font-semibold text-yellow-800 mb-3">
//               📋 Aperçu CSV — {csvPreview.length} électeur(s) à importer
//             </p>
//             <div className="overflow-x-auto max-h-48 overflow-y-auto">
//               <table className="min-w-full text-sm">
//                 <thead>
//                   <tr className="bg-yellow-100 text-yellow-800">
//                     <th className="px-3 py-2 text-left">Nom</th>
//                     <th className="px-3 py-2 text-left">Prénom</th>
//                     <th className="px-3 py-2 text-left">Email</th>
//                     <th className="px-3 py-2 text-left">Actif</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {csvPreview.map((e, i) => (
//                     <tr key={i} className="border-t text-gray-700">
//                       <td className="px-3 py-1">{e.nom}</td>
//                       <td className="px-3 py-1">{e.prenom}</td>
//                       <td className="px-3 py-1">{e.email}</td>
//                       <td className="px-3 py-1">{e.actif ? "✅" : "❌"}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//             <div className="flex gap-3 mt-3">
//               <button
//                 onClick={confirmImport}
//                 className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
//               >
//                 ✅ Confirmer l'import
//               </button>
//               <button
//                 onClick={() => setCsvPreview([])}
//                 className="px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-400"
//               >
//                 Annuler
//               </button>
//             </div>
//           </div>
//         )}

//         {/* TABLE ÉLECTEURS */}
//         <div className="bg-white rounded-2xl shadow overflow-x-auto">
//           <table className="min-w-full">
//             <thead className="bg-indigo-700 text-white">
//               <tr>
//                 <th className="px-4 py-3">ID</th>
//                 <th className="px-4 py-3">Nom</th>
//                 <th className="px-4 py-3">Prénom</th>
//                 <th className="px-4 py-3">Email</th>
//                 <th className="px-4 py-3">Mot de passe</th>
//                 <th className="px-4 py-3">Actif</th>
//                 <th className="px-4 py-3">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentElecteurs.length === 0 ? (
//                 <tr>
//                   <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
//                     Aucun électeur trouvé
//                   </td>
//                 </tr>
//               ) : (
//                 currentElecteurs.map((e, i) => {
//                   // ✅ Chercher le mot de passe en clair dans plainPasswords par email
//                   const rawPwd = e.mot_de_passe || plainPasswords[e.email] || null;

//                   return (
//                     <tr key={e.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
//                       <td className="px-4 py-3 text-black">{e.id}</td>
//                       <td className="px-4 py-3 text-black">{e.nom}</td>
//                       <td className="px-4 py-3 text-black">{e.prenom}</td>
//                       <td className="px-4 py-3 text-black">{e.email}</td>

//                       {/* ✅ Mot de passe — depuis plainPasswords si disponible */}
//                       <td className="px-4 py-3 font-mono text-black">
//                         {rawPwd ? (
//                           <div className="flex gap-2 items-center">
//                             <span>
//                               {visiblePasswordId === e.id ? rawPwd : "••••••••"}
//                             </span>
//                             <button
//                               onClick={() => {
//                                 setVisiblePasswordId(e.id);
//                                 setTimeout(() => setVisiblePasswordId(null), 10000);
//                               }}
//                               className="px-2 py-1 bg-gray-200 rounded text-xs"
//                               title="Afficher"
//                             >
//                               👁
//                             </button>
//                             <button
//                               onClick={() => handleCopy(rawPwd, e.id)}
//                               className="px-2 py-1 bg-indigo-200 rounded text-xs"
//                               title="Copier"
//                             >
//                               {copySuccessId === e.id ? "✅" : "📋"}
//                             </button>
//                           </div>
//                         ) : (
//                           <span className="text-gray-400 text-xs italic">hashé en base</span>
//                         )}
//                       </td>

//                       <td className="px-4 py-3">
//                         <span className={`px-2 py-1 rounded-full text-sm ${e.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
//                           {e.actif ? "Actif" : "Inactif"}
//                         </span>
//                       </td>

//                       <td className="px-4 py-3 flex gap-2 justify-center">
//                         <button
//                           onClick={() => navigate(`/admin/adminelection/election/${electionId}/ModifierElecteur/${e.id}`)}
//                           className="px-3 py-2 bg-yellow-400 rounded-lg hover:bg-yellow-500"
//                         >
//                           <FiEdit />
//                         </button>
//                         <button
//                           onClick={() => deleteElecteur(e.id)}
//                           className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
//                         >
//                           <FiTrash2 />
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* PAGINATION */}
//         {totalPages > 1 && (
//           <div className="flex justify-center gap-2 mt-6">
//             {[...Array(totalPages)].map((_, i) => (
//               <button
//                 key={i}
//                 onClick={() => setCurrentPage(i + 1)}
//                 className={`px-4 py-2 rounded-lg ${
//                   currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-white border"
//                 }`}
//               >
//                 {i + 1}
//               </button>
//             ))}
//           </div>
//         )}

//       </main>
//     </div>
//   );
// }


































// // src/pages/adminElection/Electeurs.jsx

// import React, { useState, useEffect, useRef } from "react";
// import { Link, useParams, useNavigate } from "react-router-dom";
// import Papa from "papaparse";
// import {
//   FiEdit, FiPlus, FiUpload, FiHome, FiBarChart2, FiLogOut,
//   FiUserCheck, FiUsers, FiCalendar, FiSettings, FiTrash2
// } from "react-icons/fi";
// import api from "../../../services/api";

// export default function Electeurs() {

//   const { electionId } = useParams();
//   const navigate = useNavigate();

//   /* ================= STATE ================= */

//   const [election, setElection]           = useState(null);
//   const [electeurs, setElecteurs]         = useState([]);
//   const [loading, setLoading]             = useState(true);
//   const [error, setError]                 = useState("");

//   const [search, setSearch]               = useState("");

//   const [csvPreview, setCsvPreview]       = useState([]);
//   const [csvError, setCsvError]           = useState("");
//   const [importSuccess, setImportSuccess] = useState("");

//   const [showDropdown, setShowDropdown]   = useState(false);
//   const [visiblePasswordId, setVisiblePasswordId] = useState(null);
//   const [copySuccessId, setCopySuccessId] = useState(null);

//   const dropdownRef = useRef();

//   /* ================= PAGINATION ================= */

//   const [currentPage, setCurrentPage]   = useState(1);
//   const electeursParPage                = 10;

//   /* ================= LOAD ELECTION + ELECTEURS ================= */

//   useEffect(() => {
//     fetchElectionEtElecteurs();
//   }, [electionId]);

//   const fetchElectionEtElecteurs = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       // Récupérer les infos de l'élection
//       const resElection = await api.get(`/elections/${electionId}`);
//       setElection(resElection.data);

//       // Récupérer les électeurs de l'élection
//       const resElecteurs = await api.get(`/elections/${electionId}/electeurs`);
//       setElecteurs(resElecteurs.data);

//     } catch (err) {
//       console.error("Erreur chargement :", err);
//       setError(err.response?.data?.message || "Impossible de charger les données");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= CLOSE DROPDOWN ================= */

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   /* ================= CSV IMPORT (parsing côté frontend) ================= */

//   const handleCSVImport = (e) => {

//     const file = e.target.files[0];
//     if (!file) return;

//     setCsvError("");
//     setImportSuccess("");

//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       complete: (result) => {

//         const preview = [];
//         const errors  = [];

//         result.data.forEach((row, index) => {
//           if (!row.nom || !row.prenom || !row.email) {
//             errors.push(`Ligne ${index + 2} invalide`);
//             return;
//           }
//           preview.push({
//             nom:    row.nom.trim(),
//             prenom: row.prenom.trim(),
//             email:  row.email.trim(),
//             actif:  row.actif ? row.actif.toLowerCase() === "true" : true
//           });
//         });

//         if (errors.length > 0) setCsvError(`Lignes ignorées : ${errors.join(", ")}`);
//         setCsvPreview(preview);
//       },
//       error: () => setCsvError("Erreur lors de la lecture du CSV.")
//     });
//   };

//   // Envoyer le CSV parsé au backend
//   const confirmImport = async () => {

//     if (csvPreview.length === 0) return;

//     try {
//       const res = await api.post(
//         `/elections/${electionId}/electeurs/import`,
//         { electeurs: csvPreview }
//       );

//       // Le backend retourne les électeurs avec leurs mots de passe en clair
//       const { inserted, skipped, message } = res.data;

//       // Ajouter les nouveaux électeurs dans la liste locale
//       setElecteurs(prev => [...prev, ...inserted]);

//       setCsvPreview([]);
//       setImportSuccess(
//         `${message}${skipped.length > 0 ? ` (ignorés : ${skipped.join(", ")})` : ""}`
//       );
//       setTimeout(() => setImportSuccess(""), 5000);

//     } catch (err) {
//       console.error(err);
//       setCsvError(err.response?.data?.message || "Erreur lors de l'import");
//     }
//   };

//   /* ================= SUPPRIMER UN ELECTEUR ================= */

//   const deleteElecteur = async (id) => {

//     if (!window.confirm("Supprimer cet électeur ?")) return;

//     try {
//       await api.delete(`/elections/${electionId}/electeurs/${id}`);
//       setElecteurs(prev => prev.filter(e => e.id !== id));
//     } catch (err) {
//       console.error(err);
//       alert(err.response?.data?.message || "Erreur lors de la suppression");
//     }
//   };

//   /* ================= SEARCH + PAGINATION ================= */

//   const filteredElecteurs = electeurs.filter(e =>
//     e.nom.toLowerCase().includes(search.toLowerCase()) ||
//     e.prenom.toLowerCase().includes(search.toLowerCase()) ||
//     e.email.toLowerCase().includes(search.toLowerCase())
//   );

//   const indexLast        = currentPage * electeursParPage;
//   const indexFirst       = indexLast - electeursParPage;
//   const currentElecteurs = filteredElecteurs.slice(indexFirst, indexLast);
//   const totalPages       = Math.ceil(filteredElecteurs.length / electeursParPage);

//   /* ================= COPY PASSWORD ================= */

//   const handleCopy = (password, id) => {
//     navigator.clipboard.writeText(password);
//     setCopySuccessId(id);
//     setTimeout(() => setCopySuccessId(null), 2000);
//   };

//   /* ================= RENDER ================= */

//   if (loading) return (
//     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <p className="text-indigo-700 text-lg font-semibold animate-pulse">Chargement...</p>
//     </div>
//   );

//   if (error) return (
//     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <div className="bg-white p-8 rounded-2xl shadow text-center">
//         <p className="text-red-600 font-semibold mb-4">{error}</p>
//         <button onClick={fetchElectionEtElecteurs} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
//           Réessayer
//         </button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ================= SIDEBAR ================= */}

//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">

//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>

//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiHome /> Tableau de bord
//           </Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiCalendar /> Mes élections
//           </Link>
//           {/* <Link to="/admin/adminelection/candidats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiUsers /> Candidats
//           </Link>
//           <Link to="/admin/adminelection/electeurs" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 font-semibold">
//             <FiUserCheck /> Électeurs
//           </Link>
//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiBarChart2 /> Résultats
//           </Link> */}
//         </nav>

//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings /> Paramètres
//           </Link>
//           <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>

//       </aside>

//       {/* ================= MAIN ================= */}

//       <main className="flex-1 p-8">

//         {/* HEADER */}
//         <div className="flex justify-between items-center mb-6 flex-wrap gap-4">

//           <div>
//             <h2 className="text-xl font-bold text-indigo-900">
//               Électeurs – {election?.titre}
//             </h2>
//             <p className="text-sm text-indigo-500">{filteredElecteurs.length} électeur(s)</p>
//           </div>

//           <input
//             type="text"
//             placeholder="Rechercher un électeur..."
//             value={search}
//             onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
//             className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           />

//           <div className="flex gap-3">

//             <button
//               onClick={() => navigate(`/admin/adminelection/election/${electionId}/AjouterElecteur`)}
//               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
//             >
//               <FiPlus /> Ajouter
//             </button>

//             {/* CSV DROPDOWN */}
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
//               >
//                 <FiUpload /> CSV
//               </button>

//               {showDropdown && (
//                 <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-10">
//                   <label className="block px-4 py-2 cursor-pointer hover:bg-green-100 rounded-xl">
//                     📂 Importer un CSV
//                     <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
//                   </label>
//                 </div>
//               )}
//             </div>

//           </div>

//         </div>

//         {/* MESSAGES */}
//         {importSuccess && (
//           <div className="mb-4 px-4 py-3 bg-green-100 text-green-700 rounded-xl border border-green-300">
//             ✅ {importSuccess}
//           </div>
//         )}
//         {csvError && (
//           <div className="mb-4 px-4 py-3 bg-red-100 text-red-700 rounded-xl border border-red-300">
//             ⚠️ {csvError}
//           </div>
//         )}

//         {/* APERÇU CSV AVANT CONFIRMATION */}
//         {csvPreview.length > 0 && (
//           <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
//             <p className="font-semibold text-yellow-800 mb-3">
//               📋 Aperçu CSV — {csvPreview.length} électeur(s) à importer
//             </p>
//             <div className="overflow-x-auto max-h-48 overflow-y-auto">
//               <table className="min-w-full text-sm">
//                 <thead>
//                   <tr className="bg-yellow-100 text-yellow-800">
//                     <th className="px-3 py-2 text-left">Nom</th>
//                     <th className="px-3 py-2 text-left">Prénom</th>
//                     <th className="px-3 py-2 text-left">Email</th>
//                     <th className="px-3 py-2 text-left">Actif</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {csvPreview.map((e, i) => (
//                     <tr key={i} className="border-t text-gray-700">
//                       <td className="px-3 py-1">{e.nom}</td>
//                       <td className="px-3 py-1">{e.prenom}</td>
//                       <td className="px-3 py-1">{e.email}</td>
//                       <td className="px-3 py-1">{e.actif ? "✅" : "❌"}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//             <div className="flex gap-3 mt-3">
//               <button
//                 onClick={confirmImport}
//                 className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
//               >
//                 ✅ Confirmer l'import
//               </button>
//               <button
//                 onClick={() => setCsvPreview([])}
//                 className="px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-400"
//               >
//                 Annuler
//               </button>
//             </div>
//           </div>
//         )}

//         {/* TABLE ÉLECTEURS */}
//         <div className="bg-white rounded-2xl shadow overflow-x-auto">
//           <table className="min-w-full">
//             <thead className="bg-indigo-700 text-white">
//               <tr>
//                 <th className="px-4 py-3">ID</th>
//                 <th className="px-4 py-3">Nom</th>
//                 <th className="px-4 py-3">Prénom</th>
//                 <th className="px-4 py-3">Email</th>
//                 <th className="px-4 py-3">Mot de passe</th>
//                 <th className="px-4 py-3">Actif</th>
//                 <th className="px-4 py-3">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentElecteurs.length === 0 ? (
//                 <tr>
//                   <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
//                     Aucun électeur trouvé
//                   </td>
//                 </tr>
//               ) : (
//                 currentElecteurs.map((e, i) => (
//                   <tr key={e.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>

//                     <td className="px-4 py-3 text-black">{e.id}</td>
//                     <td className="px-4 py-3 text-black">{e.nom}</td>
//                     <td className="px-4 py-3 text-black">{e.prenom}</td>
//                     <td className="px-4 py-3 text-black">{e.email}</td>

//                     {/* MOT DE PASSE — visible seulement si retourné en clair (après import/ajout) */}
//                     <td className="px-4 py-3 font-mono text-black">
//                       {e.mot_de_passe ? (
//                         <div className="flex gap-2 items-center">
//                           <span>
//                             {visiblePasswordId === e.id ? e.mot_de_passe : "••••••••"}
//                           </span>
//                           <button
//                             onClick={() => {
//                               setVisiblePasswordId(e.id);
//                               setTimeout(() => setVisiblePasswordId(null), 10000);
//                             }}
//                             className="px-2 py-1 bg-gray-200 rounded text-xs"
//                           >
//                             👁
//                           </button>
//                           <button
//                             onClick={() => handleCopy(e.mot_de_passe, e.id)}
//                             className="px-2 py-1 bg-indigo-200 rounded text-xs"
//                           >
//                             {copySuccessId === e.id ? "✅" : "📋"}
//                           </button>
//                         </div>
//                       ) : (
//                         <span className="text-gray-400 text-xs italic">hashé en base</span>
//                       )}
//                     </td>

//                     <td className="px-4 py-3">
//                       <span className={`px-2 py-1 rounded-full text-sm ${e.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
//                         {e.actif ? "Actif" : "Inactif"}
//                       </span>
//                     </td>

//                     <td className="px-4 py-3 flex gap-2 justify-center">
//                       <button
//                         onClick={() => navigate(`/admin/adminelection/election/${electionId}/ModifierElecteur/${e.id}`)}
//                         className="px-3 py-2 bg-yellow-400 rounded-lg hover:bg-yellow-500"
//                       >
//                         <FiEdit />
//                       </button>
//                       <button
//                         onClick={() => deleteElecteur(e.id)}
//                         className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
//                       >
//                         <FiTrash2 />
//                       </button>
//                     </td>

//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* PAGINATION */}
//         {totalPages > 1 && (
//           <div className="flex justify-center gap-2 mt-6">
//             {[...Array(totalPages)].map((_, i) => (
//               <button
//                 key={i}
//                 onClick={() => setCurrentPage(i + 1)}
//                 className={`px-4 py-2 rounded-lg ${
//                   currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-white border"
//                 }`}
//               >
//                 {i + 1}
//               </button>
//             ))}
//           </div>
//         )}

//       </main>
//     </div>
//   );
// }
































// // src/pages/adminElection/Electeurs.jsx
// import React, { useState, useEffect, useRef } from "react";
// import { Link, useParams, useNavigate } from "react-router-dom";
// import Papa from "papaparse";
// import {
//   FiEdit,
//   FiPlus,
//   FiUpload,
//   FiHome,
//   FiBarChart2,
//   FiLogOut,
//   FiUserCheck,
//   FiUsers,
//   FiCalendar,
//   FiSettings,
//   FiTrash2
// } from "react-icons/fi";
// import api from "../../../services/api";

// export default function Electeurs() {
//   const { electionId } = useParams();
//   const navigate = useNavigate();

//   const [election, setElection] = useState(null);
//   const [electeurs, setElecteurs] = useState([]);

//   const [search, setSearch] = useState("");

//   const [csvPreview, setCsvPreview] = useState([]);
//   const [csvError, setCsvError] = useState("");
//   const [importSuccess, setImportSuccess] = useState(false);

//   const [showDropdown, setShowDropdown] = useState(false);

//   const [visiblePasswordId, setVisiblePasswordId] = useState(null);
//   const [copySuccessId, setCopySuccessId] = useState(null);

//   const dropdownRef = useRef();

//   /* ================= PAGINATION ================= */
//   const [currentPage, setCurrentPage] = useState(1);
//   const electeursParPage = 10;

//   /* ================= LOAD ELECTION & ELECTEURS ================= */
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         // 1️⃣ Récupérer les détails de l'élection
//         const electionRes = await api.get(`/elections/${electionId}`);
//         setElection(electionRes.data);

//         // 2️⃣ Récupérer les électeurs pour cette élection
//         const electeursRes = await api.get(`/electeurs/${electionId}`);
//         setElecteurs(electeursRes.data);
//       } catch (err) {
//         console.error(err);
//         alert("Erreur lors du chargement des données.");
//       }
//     };
//     fetchData();
//   }, [electionId]);

//   /* ================= CLOSE DROPDOWN ================= */
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   /* ================= UTILS ================= */
//   const generatePassword = () => Math.random().toString(36).slice(-8);

//   /* ================= CSV IMPORT ================= */
//   const handleCSVImport = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setCsvError("");
//     setImportSuccess(false);

//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       complete: (result) => {
//         const preview = [];
//         const errors = [];

//         result.data.forEach((row, index) => {
//           if (!row.nom || !row.prenom || !row.email) {
//             errors.push(`Ligne ${index + 2} invalide`);
//             return;
//           }
//           preview.push({
//             nom: row.nom.trim(),
//             prenom: row.prenom.trim(),
//             email: row.email.trim(),
//             mot_de_passe: generatePassword(),
//             actif: row.actif ? row.actif.toLowerCase() === "true" : true
//           });
//         });

//         if (errors.length > 0) setCsvError("Certaines lignes sont invalides.");
//         setCsvPreview(preview);
//       },
//       error: () => setCsvError("Erreur lors de la lecture du CSV.")
//     });
//   };

//   const confirmImport = async () => {
//     if (csvPreview.length === 0) return;

//     try {
//       const res = await api.post(`/electeurs`, {
//         electionId: Number(electionId),
//         electeurs: csvPreview
//       });
//       setElecteurs(res.data);
//       setCsvPreview([]);
//       setImportSuccess(true);
//       setTimeout(() => setImportSuccess(false), 3000);
//     } catch (err) {
//       console.error(err);
//       alert("Erreur lors de l'import CSV");
//     }
//   };

//   /* ================= DELETE ELECTEUR ================= */
//   const deleteElecteur = async (id) => {
//     if (!window.confirm("Supprimer cet électeur ?")) return;

//     try {
//       await api.delete(`/electeurs/${id}`);
//       setElecteurs(prev => prev.filter(e => e.id !== id));
//     } catch (err) {
//       console.error(err);
//       alert("Erreur lors de la suppression");
//     }
//   };

//   /* ================= SEARCH ================= */
//   const filteredElecteurs = electeurs.filter(e =>
//     e.nom.toLowerCase().includes(search.toLowerCase()) ||
//     e.prenom.toLowerCase().includes(search.toLowerCase()) ||
//     e.email.toLowerCase().includes(search.toLowerCase())
//   );

//   /* ================= PAGINATION ================= */
//   const indexLast = currentPage * electeursParPage;
//   const indexFirst = indexLast - electeursParPage;
//   const currentElecteurs = filteredElecteurs.slice(indexFirst, indexLast);
//   const totalPages = Math.ceil(filteredElecteurs.length / electeursParPage);

//   /* ================= COPY PASSWORD ================= */
//   const handleCopy = (password, id) => {
//     navigator.clipboard.writeText(password);
//     setCopySuccessId(id);
//     setTimeout(() => setCopySuccessId(null), 2000);
//   };

//   if (!election) return <p>Chargement...</p>;

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       {/* ================= SIDEBAR ================= */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiHome /> Tableau de bord
//           </Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiCalendar /> Mes élections
//           </Link>
//           <Link to="/admin/adminelection/candidats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiUsers /> Candidats
//           </Link>
//           <Link to={`/admin/adminelection/electeurs/${electionId}`} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiUserCheck /> Électeurs
//           </Link>
//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiBarChart2 /> Résultats
//           </Link>
//         </nav>
//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings /> Paramètres
//           </Link>
//           <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600">
//             <FiLogOut /> Déconnexion
//           </Link>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main className="flex-1 p-8">
//         {/* HEADER */}
//         <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
//           <h2 className="text-xl font-bold text-indigo-900">Électeurs – {election.titre}</h2>
//           <input
//             type="text"
//             placeholder="Rechercher un électeur..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           />
//           <div className="flex gap-3">
//             <button
//               onClick={() => navigate(`/admin/adminelection/AjouterElecteur`)}
//               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
//             >
//               <FiPlus /> Ajouter
//             </button>
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
//               >
//                 <FiUpload /> CSV
//               </button>
//               {showDropdown && (
//                 <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-10">
//                   <label className="block px-4 py-2 cursor-pointer hover:bg-green-100">
//                     Import CSV
//                     <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
//                   </label>
//                   <button
//                     onClick={confirmImport}
//                     className="w-full text-center px-4 py-2 bg-green-500 text-white rounded-b-xl hover:bg-green-600"
//                   >
//                     Confirmer l'import
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* TABLE */}
//         <div className="bg-white rounded-2xl shadow overflow-x-auto">
//           <table className="min-w-full">
//             <thead className="bg-indigo-700 text-white">
//               <tr>
//                 <th className="px-4 py-3">ID</th>
//                 <th className="px-4 py-3">Nom</th>
//                 <th className="px-4 py-3">Prénom</th>
//                 <th className="px-4 py-3">Email</th>
//                 <th className="px-4 py-3">Mot de passe</th>
//                 <th className="px-4 py-3">Actif</th>
//                 <th className="px-4 py-3">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentElecteurs.map((e, i) => (
//                 <tr key={e.id || i} className={i % 2 ? "bg-gray-50" : "bg-white"}>
//                   <td className="px-4 py-3 text-black">{e.id}</td>
//                   <td className="px-4 py-3 text-black">{e.nom}</td>
//                   <td className="px-4 py-3 text-black">{e.prenom}</td>
//                   <td className="px-4 py-3 text-black">{e.email}</td>
//                   <td className="px-4 py-3 font-mono text-black">
//                     <div className="flex gap-2">
//                       <span>{visiblePasswordId === e.id ? e.mot_de_passe : "••••••••"}</span>
//                       <button
//                         onClick={() => {
//                           setVisiblePasswordId(e.id);
//                           setTimeout(() => setVisiblePasswordId(null), 10000);
//                         }}
//                         className="px-2 py-1 bg-gray-200 rounded"
//                       >
//                         👁
//                       </button>
//                       <button onClick={() => handleCopy(e.mot_de_passe, e.id)} className="px-2 py-1 bg-indigo-200 rounded">
//                         📋
//                       </button>
//                     </div>
//                   </td>
//                   <td className="px-4 py-3">
//                     <span className={`px-2 py-1 rounded-full text-sm ${e.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
//                       {e.actif ? "Actif" : "Inactif"}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3 flex gap-2 justify-center">
//                     <button
//                       onClick={() => navigate(`/admin/adminelection/election/${electionId}/ModifierElecteur/${e.id}`)}
//                       className="px-3 py-2 bg-yellow-400 rounded-lg hover:bg-yellow-500"
//                     >
//                       <FiEdit />
//                     </button>
//                     <button
//                       onClick={() => deleteElecteur(e.id)}
//                       className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
//                     >
//                       <FiTrash2 />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* PAGINATION */}
//         <div className="flex justify-center gap-2 mt-6">
//           {[...Array(totalPages)].map((_, i) => (
//             <button
//               key={i}
//               onClick={() => setCurrentPage(i + 1)}
//               className={`px-4 py-2 rounded-lg ${currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-white border"}`}
//             >
//               {i + 1}
//             </button>
//           ))}
//         </div>
//       </main>
//     </div>
//   );
// }
































// import React, { useState, useEffect, useRef } from "react";
// import { Link, useParams, useNavigate } from "react-router-dom";
// import Papa from "papaparse";
// import {
//   FiEdit,
//   FiPlus,
//   FiUpload,
//   FiHome,
//   FiBarChart2,
//   FiLogOut,
//   FiUserCheck,
//   FiUsers,
//   FiCalendar,
//   FiSettings,
//   FiTrash2
// } from "react-icons/fi";

// /* ================= MOCK DATA ================= */

// const mockElections = [
//   { id_election: 1, titre: "Élection universitaire 2026" },
//   { id_election: 2, titre: "Conseil étudiant" }
// ];

// /* ================= UTILS ================= */

// const generatePassword = () => Math.random().toString(36).slice(-8);

// /* ================= COMPONENT ================= */

// export default function Electeurs() {

//   const { electionId } = useParams();
//   const navigate = useNavigate();

//   const [election, setElection] = useState(null);
//   const [electeurs, setElecteurs] = useState([]);

//   const [search, setSearch] = useState("");

//   const [csvPreview, setCsvPreview] = useState([]);
//   const [csvError, setCsvError] = useState("");
//   const [importSuccess, setImportSuccess] = useState(false);

//   const [showDropdown, setShowDropdown] = useState(false);

//   const [visiblePasswordId, setVisiblePasswordId] = useState(null);
//   const [copySuccessId, setCopySuccessId] = useState(null);

//   const dropdownRef = useRef();

//   /* ================= PAGINATION ================= */

//   const [currentPage, setCurrentPage] = useState(1);
//   const electeursParPage = 10;

//   /* ================= LOAD ELECTION ================= */

//   useEffect(() => {
//     const found =
//       mockElections.find(e => e.id_election === Number(electionId)) ||
//       mockElections[0];
//     setElection(found);
//   }, [electionId]);

//   /* ================= CLOSE DROPDOWN ================= */

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setShowDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   /* ================= CSV IMPORT ================= */

//   const handleCSVImport = (e) => {

//     const file = e.target.files[0];
//     if (!file) return;

//     setCsvError("");
//     setImportSuccess(false);

//     Papa.parse(file, {

//       header: true,
//       skipEmptyLines: true,

//       complete: (result) => {

//         const preview = [];
//         const errors = [];

//         result.data.forEach((row, index) => {

//           if (!row.nom || !row.prenom || !row.email) {
//             errors.push(`Ligne ${index + 2} invalide`);
//             return;
//           }

//           preview.push({
//             id: Date.now() + index,
//             nom: row.nom.trim(),
//             prenom: row.prenom.trim(),
//             email: row.email.trim(),
//             mot_de_passe: generatePassword(),
//             actif: row.actif ? (row.actif.toLowerCase() === "true") : true
//           });

//         });

//         if (errors.length > 0) setCsvError("Certaines lignes sont invalides.");

//         setCsvPreview(preview);
//       },

//       error: () => setCsvError("Erreur lors de la lecture du CSV.")
//     });
//   };

//   const confirmImport = () => {

//     if (csvPreview.length === 0) return;

//     setElecteurs(prev => [...prev, ...csvPreview]);

//     setCsvPreview([]);
//     setImportSuccess(true);

//     setTimeout(() => setImportSuccess(false), 3000);
//   };

//   /* ================= DELETE ELECTEUR ================= */

//   const deleteElecteur = (id) => {

//     if (!window.confirm("Supprimer cet électeur ?")) return;

//     setElecteurs(prev => prev.filter(e => e.id !== id));
//   };

//   /* ================= SEARCH ================= */

//   const filteredElecteurs = electeurs.filter(e =>
//     e.nom.toLowerCase().includes(search.toLowerCase()) ||
//     e.prenom.toLowerCase().includes(search.toLowerCase()) ||
//     e.email.toLowerCase().includes(search.toLowerCase())
//   );

//   /* ================= PAGINATION ================= */

//   const indexLast = currentPage * electeursParPage;
//   const indexFirst = indexLast - electeursParPage;

//   const currentElecteurs = filteredElecteurs.slice(indexFirst, indexLast);

//   const totalPages = Math.ceil(filteredElecteurs.length / electeursParPage);

//   /* ================= COPY PASSWORD ================= */

//   const handleCopy = (password, id) => {

//     navigator.clipboard.writeText(password);

//     setCopySuccessId(id);

//     setTimeout(() => setCopySuccessId(null), 2000);
//   };

//   if (!election) return null;

//   return (

//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ================= SIDEBAR ================= */}

//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">

//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">
//           🗳 eVote – Admin
//         </h1>

//         <nav className="flex-1 space-y-3">

//           <Link to="/adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiHome /> Tableau de bord
//           </Link>

//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiCalendar /> Mes élections
//           </Link>

//           <Link to="/admin/adminelection/candidats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiUsers /> Candidats
//           </Link>

//           <Link to="/admin/adminelection/electeurs" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiUserCheck /> Électeurs
//           </Link>

//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiBarChart2 /> Résultats
//           </Link>

//         </nav>

//         <div className="space-y-3 mt-6">

//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100">
//             <FiSettings /> Paramètres
//           </Link>

//           <Link to="/logout" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600">
//             <FiLogOut /> Déconnexion
//           </Link>

//         </div>

//       </aside>

//       {/* ================= MAIN ================= */}

//       <main className="flex-1 p-8">

//         {/* HEADER */}

//         <div className="flex justify-between items-center mb-6 flex-wrap gap-4">

//           <h2 className="text-xl font-bold text-indigo-900">
//             Électeurs – {election.titre}
//           </h2>

//           <input
//             type="text"
//             placeholder="Rechercher un électeur..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           />

//           <div className="flex gap-3">

//             <button
//               onClick={() => navigate(`/admin/adminelection/AjouterElecteur`)}
//               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
//             >
//               <FiPlus /> Ajouter
//             </button>

//             {/* CSV */}

//             <div className="relative" ref={dropdownRef}>

//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
//               >
//                 <FiUpload /> CSV
//               </button>

//               {showDropdown && (

//                 <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-10">

//                   <label className="block px-4 py-2 cursor-pointer hover:bg-green-100">
//                     Import CSV
//                     <input
//                       type="file"
//                       accept=".csv"
//                       hidden
//                       onChange={handleCSVImport}
//                     />
//                   </label>

//                 </div>

//               )}

//             </div>

//           </div>

//         </div>

//         {/* TABLE */}

//         <div className="bg-white rounded-2xl shadow overflow-x-auto">

//           <table className="min-w-full">

//             <thead className="bg-indigo-700 text-white">

//               <tr>

//                 <th className="px-4 py-3">ID</th>
//                 <th className="px-4 py-3">Nom</th>
//                 <th className="px-4 py-3">Prénom</th>
//                 <th className="px-4 py-3">Email</th>
//                 <th className="px-4 py-3">Mot de passe</th>
//                 <th className="px-4 py-3">Actif</th>
//                 <th className="px-4 py-3">Actions</th>

//               </tr>

//             </thead>

//             <tbody>

//               {currentElecteurs.map((e, i) => (

//                 <tr key={e.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>

//                   <td className="px-4 py-3 text-black">{e.id}</td>
//                   <td className="px-4 py-3 text-black">{e.nom}</td>
//                   <td className="px-4 py-3 text-black">{e.prenom}</td>
//                   <td className="px-4 py-3 text-black">{e.email}</td>

//                   <td className="px-4 py-3 font-mono text-black">

//                     <div className="flex gap-2">

//                       <span>
//                         {visiblePasswordId === e.id ? e.mot_de_passe : "••••••••"}
//                       </span>

//                       <button
//                         onClick={() => {
//                           setVisiblePasswordId(e.id);
//                           setTimeout(() => setVisiblePasswordId(null), 10000);
//                         }}
//                         className="px-2 py-1 bg-gray-200 rounded"
//                       >
//                         👁
//                       </button>

//                       <button
//                         onClick={() => handleCopy(e.mot_de_passe, e.id)}
//                         className="px-2 py-1 bg-indigo-200 rounded"
//                       >
//                         📋
//                       </button>

//                     </div>

//                   </td>

//                   <td className="px-4 py-3">

//                     <span className={`px-2 py-1 rounded-full text-sm ${e.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
//                       {e.actif ? "Actif" : "Inactif"}
//                     </span>

//                   </td>

//                   <td className="px-4 py-3 flex gap-2 justify-center">

//                     <button
//                       onClick={() => navigate(`/admin/adminelection/election/${electionId}/ModifierElecteur/${e.id}`)}
//                       className="px-3 py-2 bg-yellow-400 rounded-lg hover:bg-yellow-500"
//                     >
//                       <FiEdit />
//                     </button>

//                     <button
//                       onClick={() => deleteElecteur(e.id)}
//                       className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
//                     >
//                       <FiTrash2 />
//                     </button>

//                   </td>

//                 </tr>

//               ))}

//             </tbody>

//           </table>

//         </div>

//         {/* PAGINATION */}

//         <div className="flex justify-center gap-2 mt-6">

//           {[...Array(totalPages)].map((_, i) => (

//             <button
//               key={i}
//               onClick={() => setCurrentPage(i + 1)}
//               className={`px-4 py-2 rounded-lg ${
//                 currentPage === i + 1
//                   ? "bg-indigo-600 text-white"
//                   : "bg-white border"
//               }`}
//             >
//               {i + 1}
//             </button>

//           ))}

//         </div>

//       </main>

//     </div>
//   );
// }
