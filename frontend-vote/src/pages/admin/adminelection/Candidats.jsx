// src/pages/admin/adminelection/Candidats.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import {
  FiEdit, FiPlus, FiUpload,
  FiBarChart2, FiUserCheck, FiTrash2, FiUsers, FiDownload, FiChevronDown,
  FiChevronRight, FiCheck, FiAlertCircle, FiSearch
} from "react-icons/fi";
import api from "../../../services/api";
import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

// Préfixe l'URL du serveur si la photo est un chemin relatif
const BASE_URL = "http://localhost:5000";
const photoUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  return `${BASE_URL}${photo}`;
};

// ─── Helper : génère et télécharge un CSV bien formaté pour Excel ─────────────
// BOM UTF-8 + séparateur ";" → chaque colonne dans sa propre cellule, accents OK
const downloadCSV = (filename, headers, rows) => {
  const BOM = "\uFEFF";
  const sep = ";";

  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
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

export default function Candidats() {
  const { electionId } = useParams();
  const navigate = useNavigate();

  const [election, setElection]           = useState(null);
  const [candidats, setCandidats]         = useState([]);
  const [listes, setListes]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [csvPreview, setCsvPreview]       = useState([]);
  const [csvErrors, setCsvErrors]         = useState([]);
  const [csvError, setCsvError]           = useState("");
  const [showDropdown, setShowDropdown]   = useState(false);
  const [toast, setToast]                 = useState({ msg: "", type: "success" });
  const [expandedListe, setExpandedListe] = useState(null);
  const [search, setSearch]               = useState("");
  const dropdownRef = useRef();

  const activeId = electionId || localStorage.getItem("activeElectionId");

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (activeId) { fetchElection(); fetchCandidats(); }
  }, [activeId]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const fetchElection = async () => {
    try {
      const res = await api.get(`/elections/${activeId}`);
      setElection(res.data);
    } catch (err) { console.error(err.response?.data || err.message); }
  };

  const fetchCandidats = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/elections/${activeId}/candidats`);
      setCandidats(res.data);
      const listesRes = await api.get(`/elections/${activeId}/listes`).catch(() => ({ data: [] }));
      setListes(listesRes.data);
    } catch (err) { console.error(err.response?.data || err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce candidat ?")) return;
    try {
      await api.delete(`/candidats/${id}`);
      showToast("Candidat supprimé");
      fetchCandidats();
    } catch (err) { showToast(err.response?.data?.message || "Erreur suppression", "error"); }
  };

  const handleDeleteListe = async (listeId) => {
    if (!window.confirm("Supprimer cette liste et tous ses candidats ?")) return;
    try {
      await api.delete(`/listes/${listeId}`);
      showToast("Liste supprimée");
      fetchCandidats();
    } catch (err) { showToast(err.response?.data?.message || "Erreur suppression liste", "error"); }
  };

  // ✅ CORRIGÉ : détection automatique du séparateur (virgule ou point-virgule)
  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: "", // détection automatique
      complete: (result) => {
        const preview = []; const errors = [];
        result.data.forEach((row, i) => {
          const rowErrors = [];
          if (election?.type === "LISTE" && !row.liste?.trim()) rowErrors.push("Liste manquante");
          if (!row.nom?.trim())   rowErrors.push("Nom manquant");
          if (!row.parti?.trim()) rowErrors.push("Parti manquant");
          if (election?.type !== "LISTE" && (!row.age || isNaN(row.age))) rowErrors.push("Âge invalide");
          if (rowErrors.length) errors.push({ ligne: i + 2, erreurs: rowErrors });
          preview.push({
            id:     Date.now() + i,
            liste:  row.liste,
            nom:    row.nom,
            parti:  row.parti,
            age:    row.age,
            valide: !rowErrors.length,
          });
        });
        setCsvPreview(preview); setCsvErrors(errors);
        setCsvError(errors.length ? "Certaines lignes contiennent des erreurs" : "");
      }
    });
  };

  const handleConfirmImport = async () => {
    const valides = csvPreview.filter(r => r.valide);
    if (!valides.length) return;
    try {
      const res = await api.post(`/elections/${activeId}/candidats/import`, {
        candidats: valides.map(r => ({ nom: r.nom, parti: r.parti, age: r.age ? Number(r.age) : null, liste: r.liste }))
      });
      showToast(`${res.data.inserted} candidat(s) importé(s) avec succès`);
      setCsvPreview([]); setCsvErrors([]); setCsvError("");
      fetchCandidats();
    } catch (err) { showToast(err.response?.data?.message || "Erreur import", "error"); }
  };

  // ✅ CORRIGÉ : BOM UTF-8 + séparateur ";" → colonnes séparées dans Excel
  const downloadCSVModel = () => {
    if (election?.type === "LISTE") {
      downloadCSV("modele_candidats_liste.csv",
        ["liste", "nom", "parti"],
        [
          ["Liste A", "Jean Dupont", "Parti A"],
          ["Liste A", "Marie Martin", "Parti A"],
          ["Liste B", "Paul Durand", "Parti B"],
        ]
      );
    } else {
      downloadCSV("modele_candidats.csv",
        ["nom", "parti", "age"],
        [
          ["Jean Dupont", "Parti A", "45"],
          ["Marie Martin", "Parti B", "38"],
        ]
      );
    }
  };

  // Filtrage recherche
  const filteredCandidats = candidats.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.parti?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredListes = listes.filter(l =>
    l.nom?.toLowerCase().includes(search.toLowerCase()) ||
    candidats.some(c => c.id_liste === l.id_liste && (
      c.nom?.toLowerCase().includes(search.toLowerCase()) ||
      c.parti?.toLowerCase().includes(search.toLowerCase())
    ))
  );

  if (!activeId) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-100 text-center">
        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiUsers className="text-indigo-400 text-2xl" />
        </div>
        <p className="text-gray-600 mb-4 font-medium">Veuillez sélectionner une élection.</p>
        <Link to="/admin/adminelection/ElectionPage"
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all">
          Mes élections
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ── Toast ── */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition-all
          ${toast.type === "error" ? "bg-red-500" : "bg-indigo-700"}`}>
          {toast.type === "error" ? <FiAlertCircle /> : <FiCheck />}
          {toast.msg}
        </div>
      )}

      <AdminElectionSidebar active="candidats" />

      {/* ===== MAIN ===== */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* ── Fil d'Ariane ── */}
        <div className="flex items-center gap-2 text-xs text-indigo-400 mb-6 font-medium">
          <span>Élections</span>
          <span>/</span>
          <span className="text-indigo-700">Candidats</span>
        </div>

        {/* ── En-tête ── */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black text-indigo-900">Candidats</h2>
            {election && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{election.titre}</span>
                <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-semibold">{election.type}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* CSV dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold text-sm transition-all shadow-sm">
                <FiUpload className="text-emerald-500" /> CSV
                <FiChevronDown className={`text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden">
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-emerald-50 text-gray-700 text-sm font-medium transition-all">
                    <FiUpload className="text-emerald-500" /> Importer CSV
                    <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
                  </label>
                  <div className="h-px bg-gray-100 mx-3" />
                  {/* ✅ CORRIGÉ : utilise downloadCSVModel corrigé */}
                  <button
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-blue-50 text-gray-700 text-sm font-medium transition-all"
                    onClick={() => { downloadCSVModel(); setShowDropdown(false); }}>
                    <FiDownload className="text-blue-500" /> Télécharger modèle
                  </button>
                </div>
              )}
            </div>

            {/* Ajouter */}
            <Link to="/admin/adminelection/creer-candidat"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm transition-all shadow-md shadow-indigo-200">
              <FiPlus /> Ajouter un candidat
            </Link>
          </div>
        </div>

        {/* ── Barre de recherche ── */}
        <div className="relative mb-5">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un candidat ou un parti…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all shadow-sm"
          />
        </div>

        {/* ── Erreur CSV ── */}
        {csvError && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            <FiAlertCircle className="flex-shrink-0" /> {csvError}
          </div>
        )}

        {/* ── Aperçu CSV ── */}
        {csvPreview.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Aperçu de l'import CSV</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {csvPreview.filter(r => r.valide).length} ligne(s) valide(s) sur {csvPreview.length}
                </p>
              </div>
              <button onClick={handleConfirmImport}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold text-sm transition-all shadow-sm">
                <FiCheck /> Importer ({csvPreview.filter(r => r.valide).length} valides)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {Object.keys(csvPreview[0]).filter(k => k !== "valide" && k !== "id").map(k => (
                      <th key={k} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{k}</th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Erreurs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {csvPreview.map((row, i) => {
                    const err = csvErrors.find(e => e.ligne === i + 2);
                    return (
                      <tr key={row.id} className={`${!row.valide ? "bg-red-50/50" : ""} hover:bg-indigo-50/30 transition-all`}>
                        {Object.keys(row).filter(k => k !== "valide" && k !== "id").map(k => (
                          <td key={k} className="px-4 py-2.5 text-gray-800 font-medium">{row[k]}</td>
                        ))}
                        <td className="px-4 py-2.5 text-center">
                          {row.valide
                            ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Valide</span>
                            : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">✗ Erreur</span>
                          }
                        </td>
                        <td className="px-4 py-2.5 text-red-500 text-xs">{err ? err.erreurs.join(", ") : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tableau principal ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-indigo-400 font-medium text-sm">Chargement...</p>
            </div>

          ) : election?.type === "LISTE" ? (
            /* ─── Vue LISTE ─── */
            <table className="min-w-full">
              <thead>
                <tr className="bg-indigo-700">
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">Liste</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider">Candidats</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredListes.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-16">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <FiUsers className="text-3xl" />
                        <p className="font-medium">Aucune liste trouvée</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredListes.map((l) => (
                  <React.Fragment key={l.id_liste}>
                    <tr className="hover:bg-indigo-50/40 transition-all">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpandedListe(expandedListe === l.id_liste ? null : l.id_liste)}
                          className="flex items-center gap-2 font-semibold text-gray-800 hover:text-indigo-700 transition-all">
                          {expandedListe === l.id_liste
                            ? <FiChevronDown className="text-indigo-500" />
                            : <FiChevronRight className="text-gray-400" />}
                          {l.nom}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full">
                          <FiUsers className="text-xs" /> {l.nb_candidats} candidat{l.nb_candidats > 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleDeleteListe(l.id_liste)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-semibold transition-all">
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>

                    {expandedListe === l.id_liste && (
                      candidats.filter(c => c.id_liste === l.id_liste).length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-10 py-3 bg-indigo-50/60 text-gray-400 italic text-sm">
                            Aucun candidat dans cette liste
                          </td>
                        </tr>
                      ) : candidats.filter(c => c.id_liste === l.id_liste).map((c) => (
                        <tr key={c.id_candidat} className="bg-indigo-50/60 border-l-4 border-indigo-300 hover:bg-indigo-50 transition-all">
                          <td className="px-10 py-3">
                            <div className="flex items-center gap-3">
                              {photoUrl(c.photo) ? (
                                <img src={photoUrl(c.photo)} alt={c.nom}
                                  className="w-10 h-10 rounded-xl object-cover border-2 border-indigo-200 shadow-sm flex-shrink-0"
                                  onError={e => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }} />
                              ) : null}
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 items-center justify-center flex-shrink-0 ${photoUrl(c.photo) ? "hidden" : "flex"}`}>
                                <span className="text-indigo-600 font-black">{c.nom?.charAt(0)?.toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 text-sm">↳ {c.nom}</p>
                                {c.parti && <p className="text-xs text-indigo-400 mt-0.5">{c.parti}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => navigate(`/admin/adminelection/modifier-candidat/${c.id_candidat}`)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 rounded-lg text-sm font-semibold transition-all">
                                <FiEdit className="text-xs" /> Modifier
                              </button>
                              <button onClick={() => handleDelete(c.id_candidat)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-semibold transition-all">
                                <FiTrash2 className="text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

          ) : (
            /* ─── Vue UNINOMINAL ─── */
            <table className="min-w-full">
              <thead>
                <tr className="bg-indigo-700">
                  <th className="px-4 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-20">Photo</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">Parti</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider">Âge</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCandidats.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <FiUsers className="text-3xl" />
                        <p className="font-medium">Aucun candidat trouvé</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCandidats.map((c) => (
                  <tr key={c.id_candidat} className="hover:bg-indigo-50/40 transition-all">
                    <td className="px-4 py-3 text-center">
                      {photoUrl(c.photo) ? (
                        <img src={photoUrl(c.photo)} alt={c.nom}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-200 shadow-sm mx-auto"
                          onError={e => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }} />
                      ) : null}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 items-center justify-center mx-auto ${photoUrl(c.photo) ? "hidden" : "flex"}`}>
                        <span className="text-indigo-600 font-black text-lg">{c.nom?.charAt(0)?.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-semibold text-gray-800">{c.nom}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 font-medium">{c.parti || "—"}</td>
                    <td className="px-6 py-3 text-center">
                      {c.age
                        ? <span className="inline-flex items-center text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{c.age} ans</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => navigate(`/admin/adminelection/modifier-candidat/${c.id_candidat}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 rounded-lg text-sm font-semibold transition-all">
                          <FiEdit className="text-xs" /> Modifier
                        </button>
                        <button onClick={() => handleDelete(c.id_candidat)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-semibold transition-all">
                          <FiTrash2 className="text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Footer compteur */}
          {!loading && (
            <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
              <p className="text-xs text-gray-400 font-medium">
                {election?.type === "LISTE"
                  ? `${filteredListes.length} liste(s) · ${candidats.length} candidat(s) au total`
                  : `${filteredCandidats.length} candidat(s) affiché(s) sur ${candidats.length}`
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


































// // src/pages/admin/adminelection/Candidats.jsx
// import React, { useState, useEffect, useRef } from "react";
// import { Link, useParams, useNavigate } from "react-router-dom";
// import Papa from "papaparse";
// import {
//   FiEdit, FiPlus, FiUpload,
//   FiBarChart2, FiUserCheck, FiTrash2, FiUsers, FiDownload, FiChevronDown,
//   FiChevronRight, FiCheck, FiAlertCircle, FiSearch
// } from "react-icons/fi";
// import api from "../../../services/api";
// import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

// // Préfixe l'URL du serveur si la photo est un chemin relatif
// const BASE_URL = "http://localhost:5000";
// const photoUrl = (photo) => {
//   if (!photo) return null;
//   if (photo.startsWith("http")) return photo;
//   return `${BASE_URL}${photo}`;
// };

// export default function Candidats() {
//   const { electionId } = useParams();
//   const navigate = useNavigate();

//   const [election, setElection]           = useState(null);
//   const [candidats, setCandidats]         = useState([]);
//   const [listes, setListes]               = useState([]);
//   const [loading, setLoading]             = useState(true);
//   const [csvPreview, setCsvPreview]       = useState([]);
//   const [csvErrors, setCsvErrors]         = useState([]);
//   const [csvError, setCsvError]           = useState("");
//   const [showDropdown, setShowDropdown]   = useState(false);
//   const [toast, setToast]                 = useState({ msg: "", type: "success" });
//   const [expandedListe, setExpandedListe] = useState(null);
//   const [search, setSearch]               = useState("");
//   const dropdownRef = useRef();

//   const activeId = electionId || localStorage.getItem("activeElectionId");

//   useEffect(() => {
//     const handler = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   useEffect(() => {
//     if (activeId) { fetchElection(); fetchCandidats(); }
//   }, [activeId]);

//   const showToast = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
//   };

//   const fetchElection = async () => {
//     try {
//       const res = await api.get(`/elections/${activeId}`);
//       setElection(res.data);
//     } catch (err) { console.error(err.response?.data || err.message); }
//   };

//   const fetchCandidats = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get(`/elections/${activeId}/candidats`);
//       setCandidats(res.data);
//       const listesRes = await api.get(`/elections/${activeId}/listes`).catch(() => ({ data: [] }));
//       setListes(listesRes.data);
//     } catch (err) { console.error(err.response?.data || err.message); }
//     finally { setLoading(false); }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Supprimer ce candidat ?")) return;
//     try {
//       await api.delete(`/candidats/${id}`);
//       showToast("Candidat supprimé");
//       fetchCandidats();
//     } catch (err) { showToast(err.response?.data?.message || "Erreur suppression", "error"); }
//   };

//   const handleDeleteListe = async (listeId) => {
//     if (!window.confirm("Supprimer cette liste et tous ses candidats ?")) return;
//     try {
//       await api.delete(`/listes/${listeId}`);
//       showToast("Liste supprimée");
//       fetchCandidats();
//     } catch (err) { showToast(err.response?.data?.message || "Erreur suppression liste", "error"); }
//   };

//   const handleCSVImport = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     Papa.parse(file, {
//       header: true, skipEmptyLines: true, complete: (result) => {
//         const preview = []; const errors = [];
//         result.data.forEach((row, i) => {
//           const rowErrors = [];
//           if (election?.type === "LISTE" && !row.liste?.trim()) rowErrors.push("Liste manquante");
//           if (!row.nom?.trim())   rowErrors.push("Nom manquant");
//           if (!row.parti?.trim()) rowErrors.push("Parti manquant");
//           if (election?.type !== "LISTE" && (!row.age || isNaN(row.age))) rowErrors.push("Âge invalide");
//           if (rowErrors.length) errors.push({ ligne: i + 2, erreurs: rowErrors });
//           preview.push({ id: Date.now() + i, liste: row.liste, nom: row.nom, parti: row.parti, age: row.age, valide: !rowErrors.length });
//         });
//         setCsvPreview(preview); setCsvErrors(errors);
//         setCsvError(errors.length ? "Certaines lignes contiennent des erreurs" : "");
//       }
//     });
//   };

//   const handleConfirmImport = async () => {
//     const valides = csvPreview.filter(r => r.valide);
//     if (!valides.length) return;
//     try {
//       const res = await api.post(`/elections/${activeId}/candidats/import`, {
//         candidats: valides.map(r => ({ nom: r.nom, parti: r.parti, age: r.age ? Number(r.age) : null, liste: r.liste }))
//       });
//       showToast(`${res.data.inserted} candidat(s) importé(s) avec succès`);
//       setCsvPreview([]); setCsvErrors([]); setCsvError("");
//       fetchCandidats();
//     } catch (err) { showToast(err.response?.data?.message || "Erreur import", "error"); }
//   };

//   const downloadCSVModel = () => {
//     const content = election?.type === "LISTE"
//       ? "liste,nom,parti\nListe A,Jean Dupont,Parti A"
//       : "nom,parti,age\nJean Dupont,Parti A,45";
//     const a = document.createElement("a");
//     a.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
//     a.download = election?.type === "LISTE" ? "modele_candidats_liste.csv" : "modele_candidats.csv";
//     a.click();
//   };

//   // Filtrage recherche
//   const filteredCandidats = candidats.filter(c =>
//     c.nom?.toLowerCase().includes(search.toLowerCase()) ||
//     c.parti?.toLowerCase().includes(search.toLowerCase())
//   );
//   const filteredListes = listes.filter(l =>
//     l.nom?.toLowerCase().includes(search.toLowerCase()) ||
//     candidats.some(c => c.id_liste === l.id_liste && (
//       c.nom?.toLowerCase().includes(search.toLowerCase()) ||
//       c.parti?.toLowerCase().includes(search.toLowerCase())
//     ))
//   );

//   if (!activeId) return (
//     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <div className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-100 text-center">
//         <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
//           <FiUsers className="text-indigo-400 text-2xl" />
//         </div>
//         <p className="text-gray-600 mb-4 font-medium">Veuillez sélectionner une élection.</p>
//         <Link to="/admin/adminelection/ElectionPage"
//           className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all">
//           Mes élections
//         </Link>
//       </div>
//     </div>
//   );

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ── Toast ── */}
//       {toast.msg && (
//         <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition-all
//           ${toast.type === "error" ? "bg-red-500" : "bg-indigo-700"}`}>
//           {toast.type === "error" ? <FiAlertCircle /> : <FiCheck />}
//           {toast.msg}
//         </div>
//       )}

//       <AdminElectionSidebar active="candidats" />

//       {/* ===== MAIN ===== */}
//       <main className="flex-1 p-8 overflow-y-auto">

//         {/* ── Fil d'Ariane ── */}
//         <div className="flex items-center gap-2 text-xs text-indigo-400 mb-6 font-medium">
//           <span>Élections</span>
//           <span>/</span>
//           <span className="text-indigo-700">Candidats</span>
//         </div>

//         {/* ── En-tête ── */}
//         <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
//           <div>
//             <h2 className="text-2xl font-black text-indigo-900">Candidats</h2>
//             {election && (
//               <div className="flex items-center gap-2 mt-1">
//                 <span className="text-sm text-gray-500">{election.titre}</span>
//                 <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-semibold">{election.type}</span>
//               </div>
//             )}
//           </div>

//           {/* Actions */}
//           <div className="flex items-center gap-3">
//             {/* CSV dropdown */}
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold text-sm transition-all shadow-sm">
//                 <FiUpload className="text-emerald-500" /> CSV
//                 <FiChevronDown className={`text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
//               </button>
//               {showDropdown && (
//                 <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden">
//                   <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-emerald-50 text-gray-700 text-sm font-medium transition-all">
//                     <FiUpload className="text-emerald-500" /> Importer CSV
//                     <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
//                   </label>
//                   <div className="h-px bg-gray-100 mx-3" />
//                   <button
//                     className="flex items-center gap-3 w-full px-4 py-3 hover:bg-blue-50 text-gray-700 text-sm font-medium transition-all"
//                     onClick={downloadCSVModel}>
//                     <FiDownload className="text-blue-500" /> Télécharger modèle
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Ajouter */}
//             <Link to="/admin/adminelection/creer-candidat"
//               className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm transition-all shadow-md shadow-indigo-200">
//               <FiPlus /> Ajouter un candidat
//             </Link>
//           </div>
//         </div>

//         {/* ── Barre de recherche ── */}
//         <div className="relative mb-5">
//           <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
//           <input
//             type="text"
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             placeholder="Rechercher un candidat ou un parti…"
//             className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all shadow-sm"
//           />
//         </div>

//         {/* ── Erreur CSV ── */}
//         {csvError && (
//           <div className="mb-4 flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
//             <FiAlertCircle className="flex-shrink-0" /> {csvError}
//           </div>
//         )}

//         {/* ── Aperçu CSV ── */}
//         {csvPreview.length > 0 && (
//           <div className="mb-6 bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
//             <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
//               <div>
//                 <h3 className="font-bold text-gray-800 text-sm">Aperçu de l'import CSV</h3>
//                 <p className="text-xs text-gray-400 mt-0.5">
//                   {csvPreview.filter(r => r.valide).length} ligne(s) valide(s) sur {csvPreview.length}
//                 </p>
//               </div>
//               <button onClick={handleConfirmImport}
//                 className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold text-sm transition-all shadow-sm">
//                 <FiCheck /> Importer ({csvPreview.filter(r => r.valide).length} valides)
//               </button>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="min-w-full text-sm">
//                 <thead className="bg-gray-50 border-b border-gray-100">
//                   <tr>
//                     {Object.keys(csvPreview[0]).filter(k => k !== "valide" && k !== "id").map(k => (
//                       <th key={k} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{k}</th>
//                     ))}
//                     <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
//                     <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Erreurs</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-50">
//                   {csvPreview.map((row, i) => {
//                     const err = csvErrors.find(e => e.ligne === i + 2);
//                     return (
//                       <tr key={row.id} className={`${!row.valide ? "bg-red-50/50" : ""} hover:bg-indigo-50/30 transition-all`}>
//                         {Object.keys(row).filter(k => k !== "valide" && k !== "id").map(k => (
//                           <td key={k} className="px-4 py-2.5 text-gray-800 font-medium">{row[k]}</td>
//                         ))}
//                         <td className="px-4 py-2.5 text-center">
//                           {row.valide
//                             ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Valide</span>
//                             : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">✗ Erreur</span>
//                           }
//                         </td>
//                         <td className="px-4 py-2.5 text-red-500 text-xs">{err ? err.erreurs.join(", ") : "—"}</td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* ── Tableau principal ── */}
//         <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">

//           {loading ? (
//             <div className="flex flex-col items-center justify-center py-16 gap-3">
//               <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
//               <p className="text-indigo-400 font-medium text-sm">Chargement...</p>
//             </div>

//           ) : election?.type === "LISTE" ? (
//             /* ─── Vue LISTE ─── */
//             <table className="min-w-full">
//               <thead>
//                 <tr className="bg-indigo-700">
//                   <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">Liste</th>
//                   <th className="px-6 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider">Candidats</th>
//                   <th className="px-6 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-24">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-50">
//                 {filteredListes.length === 0 ? (
//                   <tr>
//                     <td colSpan="3" className="text-center py-16">
//                       <div className="flex flex-col items-center gap-2 text-gray-400">
//                         <FiUsers className="text-3xl" />
//                         <p className="font-medium">Aucune liste trouvée</p>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : filteredListes.map((l) => (
//                   <React.Fragment key={l.id_liste}>
//                     {/* Ligne liste */}
//                     <tr className="hover:bg-indigo-50/40 transition-all">
//                       <td className="px-6 py-4">
//                         <button
//                           onClick={() => setExpandedListe(expandedListe === l.id_liste ? null : l.id_liste)}
//                           className="flex items-center gap-2 font-semibold text-gray-800 hover:text-indigo-700 transition-all">
//                           {expandedListe === l.id_liste
//                             ? <FiChevronDown className="text-indigo-500" />
//                             : <FiChevronRight className="text-gray-400" />}
//                           {l.nom}
//                         </button>
//                       </td>
//                       <td className="px-6 py-4 text-center">
//                         <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full">
//                           <FiUsers className="text-xs" /> {l.nb_candidats} candidat{l.nb_candidats > 1 ? "s" : ""}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-center">
//                         <button onClick={() => handleDeleteListe(l.id_liste)}
//                           className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-semibold transition-all">
//                           <FiTrash2 />
//                         </button>
//                       </td>
//                     </tr>

//                     {/* Candidats expandés */}
//                     {expandedListe === l.id_liste && (
//                       candidats.filter(c => c.id_liste === l.id_liste).length === 0 ? (
//                         <tr>
//                           <td colSpan="3" className="px-10 py-3 bg-indigo-50/60 text-gray-400 italic text-sm">
//                             Aucun candidat dans cette liste
//                           </td>
//                         </tr>
//                       ) : candidats.filter(c => c.id_liste === l.id_liste).map((c) => (
//                         <tr key={c.id_candidat} className="bg-indigo-50/60 border-l-4 border-indigo-300 hover:bg-indigo-50 transition-all">
//                           <td className="px-10 py-3">
//                             <div className="flex items-center gap-3">
//                               {photoUrl(c.photo) ? (
//                                 <img src={photoUrl(c.photo)} alt={c.nom}
//                                   className="w-10 h-10 rounded-xl object-cover border-2 border-indigo-200 shadow-sm flex-shrink-0"
//                                   onError={e => {
//                                     e.target.style.display = "none";
//                                     e.target.nextSibling.style.display = "flex";
//                                   }} />
//                               ) : null}
//                               <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 items-center justify-center flex-shrink-0 ${photoUrl(c.photo) ? "hidden" : "flex"}`}>
//                                 <span className="text-indigo-600 font-black">{c.nom?.charAt(0)?.toUpperCase()}</span>
//                               </div>
//                               <div>
//                                 <p className="font-medium text-gray-800 text-sm">↳ {c.nom}</p>
//                                 {c.parti && <p className="text-xs text-indigo-400 mt-0.5">{c.parti}</p>}
//                               </div>
//                             </div>
//                           </td>
//                           <td className="px-6 py-3 text-center">
//                             <div className="flex justify-center gap-2">
//                               <button onClick={() => navigate(`/admin/adminelection/modifier-candidat/${c.id_candidat}`)}
//                                 className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 rounded-lg text-sm font-semibold transition-all">
//                                 <FiEdit className="text-xs" /> Modifier
//                               </button>
//                               <button onClick={() => handleDelete(c.id_candidat)}
//                                 className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-semibold transition-all">
//                                 <FiTrash2 className="text-xs" />
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </React.Fragment>
//                 ))}
//               </tbody>
//             </table>

//           ) : (
//             /* ─── Vue UNINOMINAL ─── */
//             <table className="min-w-full">
//               <thead>
//                 <tr className="bg-indigo-700">
//                   <th className="px-4 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-20">Photo</th>
//                   <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">Nom</th>
//                   <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">Parti</th>
//                   <th className="px-6 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider">Âge</th>
//                   <th className="px-6 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-32">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-50">
//                 {filteredCandidats.length === 0 ? (
//                   <tr>
//                     <td colSpan="5" className="text-center py-16">
//                       <div className="flex flex-col items-center gap-2 text-gray-400">
//                         <FiUsers className="text-3xl" />
//                         <p className="font-medium">Aucun candidat trouvé</p>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : filteredCandidats.map((c) => (
//                   <tr key={c.id_candidat} className="hover:bg-indigo-50/40 transition-all">

//                     {/* ── Colonne Photo ── */}
//                     <td className="px-4 py-3 text-center">
//                       {photoUrl(c.photo) ? (
//                         <img src={photoUrl(c.photo)} alt={c.nom}
//                           className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-200 shadow-sm mx-auto"
//                           onError={e => {
//                             e.target.style.display = "none";
//                             e.target.nextSibling.style.display = "flex";
//                           }} />
//                       ) : null}
//                       <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 items-center justify-center mx-auto ${photoUrl(c.photo) ? "hidden" : "flex"}`}>
//                         <span className="text-indigo-600 font-black text-lg">{c.nom?.charAt(0)?.toUpperCase()}</span>
//                       </div>
//                     </td>

//                     {/* ── Colonne Nom ── */}
//                     <td className="px-6 py-3">
//                       <p className="font-semibold text-gray-800">{c.nom}</p>
//                     </td>

//                     {/* ── Colonne Parti ── */}
//                     <td className="px-6 py-3 text-sm text-gray-600 font-medium">{c.parti || "—"}</td>

//                     <td className="px-6 py-3 text-center">
//                       {c.age
//                         ? <span className="inline-flex items-center text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{c.age} ans</span>
//                         : <span className="text-gray-300">—</span>
//                       }
//                     </td>
//                     <td className="px-6 py-4 text-center">
//                       <div className="flex justify-center gap-2">
//                         <button onClick={() => navigate(`/admin/adminelection/modifier-candidat/${c.id_candidat}`)}
//                           className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 rounded-lg text-sm font-semibold transition-all">
//                           <FiEdit className="text-xs" /> Modifier
//                         </button>
//                         <button onClick={() => handleDelete(c.id_candidat)}
//                           className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-semibold transition-all">
//                           <FiTrash2 className="text-xs" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}

//           {/* Footer compteur */}
//           {!loading && (
//             <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
//               <p className="text-xs text-gray-400 font-medium">
//                 {election?.type === "LISTE"
//                   ? `${filteredListes.length} liste(s) · ${candidats.length} candidat(s) au total`
//                   : `${filteredCandidats.length} candidat(s) affiché(s) sur ${candidats.length}`
//                 }
//               </p>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }

