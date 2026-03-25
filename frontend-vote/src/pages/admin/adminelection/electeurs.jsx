// src/pages/adminElection/Electeurs.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import {
  FiEdit, FiPlus, FiUpload,
  FiTrash2, FiDownload,
  FiKey, FiCopy, FiEye, FiEyeOff, FiX, FiCheck,
  FiSearch, FiUsers, FiAlertCircle, FiChevronLeft, FiChevronRight
} from "react-icons/fi";
import api from "../../../services/api";
import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

// ─── Helper : génère et télécharge un fichier CSV correctement formaté pour Excel ───
// Utilise le séparateur ";" + BOM UTF-8 pour éviter les problèmes d'encodage et de colonnes
const downloadCSV = (filename, headers, rows) => {
  // BOM UTF-8 : force Excel à ouvrir en UTF-8 (évite les caractères spéciaux cassés)
  const BOM = "\uFEFF";
  const sep = ";"; // point-virgule = séparateur standard Excel FR

  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    // Entoure de guillemets si la valeur contient le séparateur, des guillemets ou un saut de ligne
    if (str.includes(sep) || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent =
    BOM +
    headers.map(escape).join(sep) + "\n" +
    rows.map(row => row.map(escape).join(sep)).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

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
  const [plainPasswords, setPlainPasswords]       = useState({});
  const [resettingId, setResettingId]             = useState(null);
  const [resetModal, setResetModal]               = useState(null);

  const dropdownRef = useRef();

  /* ================= PAGINATION ================= */

  const [currentPage, setCurrentPage] = useState(1);
  const electeursParPage              = 10;

  /* ================= LOAD ================= */

  useEffect(() => { fetchElectionEtElecteurs(); }, [electionId]);

  const fetchElectionEtElecteurs = async () => {
    try {
      setLoading(true); setError("");
      const resElection  = await api.get(`/elections/${electionId}`);
      setElection(resElection.data);
      const resElecteurs = await api.get(`/elections/${electionId}/electeurs`);
      setElecteurs(resElecteurs.data);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de charger les données");
    } finally { setLoading(false); }
  };

  /* ================= CLOSE DROPDOWN ================= */

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ================= CSV IMPORT ================= */

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvError(""); setImportSuccess("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      // ✅ Détecte automatiquement le séparateur (virgule ou point-virgule)
      delimiter: "",
      complete: (result) => {
        const preview = []; const errors = [];
        result.data.forEach((row, index) => {
          if (!row.nom || !row.prenom || !row.email) { errors.push(`Ligne ${index + 2}`); return; }
          preview.push({
            nom:    row.nom.trim(),
            prenom: row.prenom.trim(),
            email:  row.email.trim(),
            actif:  row.actif ? row.actif.toLowerCase() === "true" : true,
          });
        });
        if (errors.length > 0) setCsvError(`Lignes ignorées (champs manquants) : ${errors.join(", ")}`);
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
    } catch (err) { setCsvError(err.response?.data?.message || "Erreur lors de l'import"); }
  };

  /* ================= TÉLÉCHARGER MOTS DE PASSE ================= */

  // ✅ CORRIGÉ : chaque colonne dans sa propre cellule Excel (BOM + séparateur ;)
  const downloadPasswords = () => {
    const headers = ["Nom", "Prénom", "Email", "Mot de passe"];
    const rows = Object.entries(plainPasswords).map(([email, pwd]) => {
      const el = electeurs.find(e => e.email === email);
      return [el?.nom || "", el?.prenom || "", email, pwd];
    });
    downloadCSV(`electeurs_mots_de_passe_${electionId}.csv`, headers, rows);
  };

  /* ================= TÉLÉCHARGER MODÈLE CSV ================= */

  // ✅ CORRIGÉ : modèle avec colonnes bien séparées, lisible dans Excel
  const downloadModeleCSV = () => {
    const headers = ["nom", "prenom", "email", "actif"];
    const rows = [
      ["Dupont", "Jean", "jean.dupont@email.com", "true"],
      ["Martin", "Sophie", "sophie.martin@email.com", "true"],
    ];
    downloadCSV("modele_electeurs.csv", headers, rows);
  };

  /* ================= RESET MOT DE PASSE ================= */

  const resetPassword = async (electeur) => {
    if (!window.confirm(`Réinitialiser le mot de passe de ${electeur.prenom} ${electeur.nom} ?`)) return;
    setResettingId(electeur.id);
    try {
      const res = await api.post(`/electeurs/${electeur.id}/reset-password`);
      const newPassword = res.data.mot_de_passe;
      setPlainPasswords(prev => ({ ...prev, [electeur.email]: newPassword }));
      setResetModal({ id: electeur.id, nom: electeur.nom, prenom: electeur.prenom, email: electeur.email, newPassword });
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la réinitialisation");
    } finally { setResettingId(null); }
  };

  /* ================= SUPPRIMER ================= */

  const deleteElecteur = async (id) => {
    if (!window.confirm("Supprimer cet électeur ?")) return;
    try {
      await api.delete(`/elections/${electionId}/electeurs/${id}`);
      const deleted = electeurs.find(e => e.id === id);
      setElecteurs(prev => prev.filter(e => e.id !== id));
      if (deleted?.email) setPlainPasswords(prev => { const c = { ...prev }; delete c[deleted.email]; return c; });
    } catch (err) { alert(err.response?.data?.message || "Erreur lors de la suppression"); }
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

  /* ================= INITIALES ================= */

  const initiales = (nom, prenom) =>
    `${prenom?.charAt(0) || ""}${nom?.charAt(0) || ""}`.toUpperCase();

  /* ================= RENDER ================= */

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-indigo-600 font-semibold text-sm">Chargement...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-sm">
        <FiAlertCircle className="text-red-400 text-4xl mx-auto mb-3" />
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button onClick={fetchElectionEtElecteurs}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all">
          Réessayer
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ===== MODALE RESET MOT DE PASSE ===== */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative">
            <button onClick={() => setResetModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
              <FiX size={18} />
            </button>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <FiKey size={24} className="text-indigo-600" />
              </div>
            </div>
            <h3 className="text-xl font-black text-center text-gray-800 mb-1">Mot de passe réinitialisé</h3>
            <p className="text-center text-gray-400 text-sm mb-6">
              {resetModal.prenom} {resetModal.nom} —{" "}
              <span className="text-indigo-500">{resetModal.email}</span>
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-2">Nouveau mot de passe</p>
              <div className="flex items-center gap-2">
                <span className="flex-1 font-mono text-lg font-black text-indigo-800 tracking-widest">
                  {visiblePasswordId === `modal-${resetModal.id}` ? resetModal.newPassword : "••••••••"}
                </span>
                <button
                  onClick={() => setVisiblePasswordId(prev => prev === `modal-${resetModal.id}` ? null : `modal-${resetModal.id}`)}
                  className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-all">
                  {visiblePasswordId === `modal-${resetModal.id}` ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
                <button onClick={() => handleCopy(resetModal.newPassword, `modal-${resetModal.id}`)}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
                  {copySuccessId === `modal-${resetModal.id}` ? <FiCheck size={15} /> : <FiCopy size={15} />}
                </button>
              </div>
              {copySuccessId === `modal-${resetModal.id}` && (
                <p className="text-green-600 text-xs mt-2 font-medium">✓ Copié dans le presse-papiers</p>
              )}
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs mb-6">
              <FiAlertCircle className="flex-shrink-0 mt-0.5" />
              <span>Communiquez ce mot de passe à l'électeur. Il reste visible dans le tableau tant que la page n'est pas rechargée.</span>
            </div>
            <button onClick={() => setResetModal(null)}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
              Fermer
            </button>
          </div>
        </div>
      )}

      <AdminElectionSidebar active="elections" />

      {/* ===== MAIN ===== */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* ── Fil d'Ariane ── */}
        <div className="flex items-center gap-2 text-xs text-indigo-400 mb-6 font-medium">
          <span>Élections</span>
          <span>/</span>
          <span className="text-indigo-700 font-semibold">{election?.titre || "..."}</span>
          <span>/</span>
          <span className="text-indigo-700 font-semibold">Électeurs</span>
        </div>

        {/* ── En-tête ── */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black text-indigo-900">Électeurs</h2>
            {election && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{election.titre}</span>
                <span className="bg-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  {filteredElecteurs.length} électeur{filteredElecteurs.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {Object.keys(plainPasswords).length > 0 && (
              <button onClick={downloadPasswords}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold text-sm transition-all shadow-sm">
                <FiDownload size={14} /> Mots de passe
              </button>
            )}

            {/* CSV dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm transition-all shadow-sm">
                <FiUpload size={14} /> CSV
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden">
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-green-50 text-gray-700 text-sm font-medium transition-all border-b border-gray-50">
                    <FiUpload size={14} className="text-green-600" /> Importer un CSV
                    <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
                  </label>
                  {/* ✅ CORRIGÉ : utilise downloadModeleCSV */}
                  <button
                    onClick={() => { downloadModeleCSV(); setShowDropdown(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-indigo-50 text-gray-700 text-sm font-medium transition-all">
                    <FiDownload size={14} className="text-indigo-500" /> Télécharger modèle CSV
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => navigate(`/admin/adminelection/electeurs/${electionId}/AjouterElecteur`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm transition-all shadow-md shadow-indigo-200">
              <FiPlus size={14} /> Ajouter un électeur
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        {importSuccess && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
            <FiCheck className="flex-shrink-0" /> {importSuccess}
          </div>
        )}
        {csvError && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            <FiAlertCircle className="flex-shrink-0" /> {csvError}
          </div>
        )}

        {/* ── Bannière mots de passe temporaires ── */}
        {Object.keys(plainPasswords).length > 0 && (
          <div className="mb-5 flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-sm">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="flex-shrink-0 text-amber-500" />
              <span><strong>{Object.keys(plainPasswords).length}</strong> mot(s) de passe en clair disponible(s) — ils disparaîtront au rechargement.</span>
            </div>
            <button onClick={downloadPasswords}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-xs font-semibold transition-all flex-shrink-0">
              <FiDownload size={12} /> Télécharger
            </button>
          </div>
        )}

        {/* ── Aperçu CSV ── */}
        {csvPreview.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-yellow-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-yellow-800 text-sm">Aperçu de l'import CSV</h3>
                <p className="text-xs text-yellow-600 mt-0.5">{csvPreview.length} électeur(s) à importer</p>
              </div>
              <div className="flex gap-2">
                <button onClick={confirmImport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm transition-all">
                  <FiCheck size={13} /> Confirmer l'import
                </button>
                <button onClick={() => setCsvPreview([])}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold text-sm transition-all">
                  <FiX size={13} /> Annuler
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-52 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-yellow-100 sticky top-0">
                  <tr>
                    {["Nom","Prénom","Email","Actif"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-yellow-800 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-100">
                  {csvPreview.map((e, i) => (
                    <tr key={i} className="hover:bg-yellow-50/60">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{e.nom}</td>
                      <td className="px-4 py-2.5 text-gray-700">{e.prenom}</td>
                      <td className="px-4 py-2.5 text-gray-500">{e.email}</td>
                      <td className="px-4 py-2.5">
                        {e.actif
                          ? <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Actif</span>
                          : <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Inactif</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Barre de recherche ── */}
        <div className="relative mb-5">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all shadow-sm"
          />
        </div>

        {/* ── Tableau électeurs ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-indigo-700">
                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">Électeur</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider">Mot de passe</th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentElecteurs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <FiUsers className="text-3xl" />
                      <p className="font-medium">Aucun électeur trouvé</p>
                    </div>
                  </td>
                </tr>
              ) : currentElecteurs.map((e) => {
                const rawPwd = e.mot_de_passe || plainPasswords[e.email] || null;
                return (
                  <tr key={e.id} className="hover:bg-indigo-50/40 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 font-black text-sm">{initiales(e.nom, e.prenom)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{e.prenom} {e.nom}</p>
                          <p className="text-xs text-gray-400 font-mono">#{e.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{e.email}</td>
                    <td className="px-6 py-4 text-center">
                      {rawPwd ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono text-sm font-semibold text-gray-800 min-w-[80px]">
                            {visiblePasswordId === e.id ? rawPwd : "••••••••"}
                          </span>
                          <button onClick={() => setVisiblePasswordId(prev => prev === e.id ? null : e.id)}
                            className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-500 transition-all">
                            {visiblePasswordId === e.id ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                          </button>
                          <button onClick={() => handleCopy(rawPwd, e.id)}
                            className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all">
                            {copySuccessId === e.id ? <FiCheck size={13} className="text-green-600" /> : <FiCopy size={13} />}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-gray-400 italic">hashé en base</span>
                          <button onClick={() => resetPassword(e)} disabled={resettingId === e.id}
                            className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-all disabled:opacity-50">
                            <FiKey size={11} />
                            {resettingId === e.id ? "…" : "Reset"}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                        ${e.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {e.actif ? "✓ Actif" : "✗ Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/adminelection/election/${electionId}/ModifierElecteur/${e.id}`)}
                          className="p-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-all"
                          title="Modifier">
                          <FiEdit size={14} />
                        </button>
                        <button onClick={() => resetPassword(e)} disabled={resettingId === e.id}
                          className="p-2 bg-purple-500 text-white hover:bg-purple-600 rounded-lg transition-all disabled:opacity-50"
                          title="Réinitialiser le mot de passe">
                          <FiKey size={14} />
                        </button>
                        <button onClick={() => deleteElecteur(e.id)}
                          className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-all"
                          title="Supprimer">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
            <p className="text-xs text-gray-400 font-medium">
              {filteredElecteurs.length} électeur{filteredElecteurs.length > 1 ? "s" : ""}
              {totalPages > 1 && ` · page ${currentPage} / ${totalPages}`}
            </p>
          </div>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-indigo-50 disabled:opacity-40 transition-all">
              <FiChevronLeft className="text-indigo-600" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 rounded-xl text-sm font-bold transition-all
                  ${currentPage === i + 1
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50"}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-indigo-50 disabled:opacity-40 transition-all">
              <FiChevronRight className="text-indigo-600" />
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
