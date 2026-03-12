// src/pages/admin/adminelection/Candidats.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { FiEdit, FiPlus, FiUpload, FiHome, FiBarChart2, FiSettings, FiLogOut, FiCalendar, FiUserCheck, FiTrash2, FiUsers } from "react-icons/fi";
import api from "../../../services/api";

export default function Candidats() {
  const { electionId } = useParams();
  const navigate = useNavigate();

  const [election, setElection]         = useState(null);
  const [candidats, setCandidats]       = useState([]);
  const [listes, setListes]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [csvPreview, setCsvPreview]     = useState([]);
  const [csvErrors, setCsvErrors]       = useState([]);
  const [csvError, setCsvError]         = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast]               = useState("");
  const [expandedListe, setExpandedListe] = useState(null);
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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

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
    } catch (err) { showToast(err.response?.data?.message || "Erreur suppression"); }
  };

  const handleDeleteListe = async (listeId) => {
    if (!window.confirm("Supprimer cette liste et tous ses candidats ?")) return;
    try {
      await api.delete(`/listes/${listeId}`);
      showToast("Liste supprimée");
      fetchCandidats();
    } catch (err) { showToast(err.response?.data?.message || "Erreur suppression liste"); }
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true, complete: (result) => {
        const preview = []; const errors = [];
        result.data.forEach((row, i) => {
          const rowErrors = [];
          if (election?.type === "LISTE" && !row.liste?.trim()) rowErrors.push("Liste manquante");
          if (!row.nom?.trim())   rowErrors.push("Nom manquant");
          if (!row.parti?.trim()) rowErrors.push("Parti manquant");
          if (election?.type !== "LISTE" && (!row.age || isNaN(row.age))) rowErrors.push("Âge invalide");
          if (rowErrors.length) errors.push({ ligne: i + 2, erreurs: rowErrors });
          preview.push({ id: Date.now() + i, liste: row.liste, nom: row.nom, parti: row.parti, age: row.age, valide: !rowErrors.length });
        });
        setCsvPreview(preview); setCsvErrors(errors);
        setCsvError(errors.length ? "Certaines lignes sont invalides" : "");
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
      showToast(`${res.data.inserted} candidat(s) importé(s)`);
      setCsvPreview([]); setCsvErrors([]); setCsvError("");
      fetchCandidats();
    } catch (err) { showToast(err.response?.data?.message || "Erreur import"); }
  };

  const downloadCSVModel = () => {
    const content = election?.type === "LISTE"
      ? "liste,nom,parti\nListe A,Jean Dupont,Parti A"
      : "nom,parti,age\nJean Dupont,Parti A,45";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
    a.download = election?.type === "LISTE" ? "modele_candidats_liste.csv" : "modele_candidats.csv";
    a.click();
  };

  if (!activeId) return (
    <div className="flex min-h-screen items-center justify-center bg-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <p className="text-gray-600 mb-4">Veuillez sélectionner une élection.</p>
        <Link to="/admin/adminelection/ElectionPage" className="text-indigo-600 underline">Mes élections</Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
        <nav className="flex-1 space-y-3">
          <Link to="/adminElectionDashboard"           className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiHome /> Tableau de bord</Link>
          <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiCalendar /> Mes élections</Link>
        </nav>
        <div className="space-y-3 mt-6">
          <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiSettings /> Paramètres</Link>
          <Link to="/logout"   className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600"><FiLogOut /> Déconnexion</Link>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-indigo-900">
            Candidats – {election ? `${election.titre} (${election.type})` : "Chargement..."}
          </h2>
          <div className="flex gap-3">
            {/* Bouton CSV */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
                <FiUpload /> CSV
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white border rounded-xl shadow-lg z-10">
                  <label className="block px-4 py-2 cursor-pointer hover:bg-green-100 text-gray-800">
                    Import CSV <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
                  </label>
                  <button className="block w-full text-left px-4 py-2 hover:bg-blue-100 text-gray-800" onClick={downloadCSVModel}>
                    Télécharger modèle
                  </button>
                </div>
              )}
            </div>
            {/* Bouton Ajouter */}
            <Link to="/admin/adminelection/creer-candidat" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
              <FiPlus /> Ajouter
            </Link>
          </div>
        </div>

        {/* Erreur CSV */}
        {csvError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">❌ {csvError}</div>}

        {/* Aperçu CSV */}
        {csvPreview.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-xl border overflow-x-auto">
            <h3 className="font-semibold mb-2">Aperçu CSV :</h3>
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-200">
                <tr>
                  {Object.keys(csvPreview[0]).filter(k => k !== "valide" && k !== "id").map(k => (
                    <th key={k} className="px-2 py-1 border">{k}</th>
                  ))}
                  <th className="px-2 py-1 border">Valide</th>
                  <th className="px-2 py-1 border">Erreurs</th>
                </tr>
              </thead>
              <tbody>
                {csvPreview.map((row, i) => {
                  const err = csvErrors.find(e => e.ligne === i + 2);
                  return (
                    <tr key={row.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                      {Object.keys(row).filter(k => k !== "valide" && k !== "id").map(k => (
                        <td key={k} className="px-2 py-1 border text-black">{row[k]}</td>
                      ))}
                      <td className="px-2 py-1 border text-center">{row.valide ? "✅" : "❌"}</td>
                      <td className="px-2 py-1 border text-red-600 text-xs">{err ? err.erreurs.join(", ") : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button onClick={handleConfirmImport} className="mt-3 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
              Importer ({csvPreview.filter(r => r.valide).length} valides)
            </button>
          </div>
        )}

        {/* ===== TABLEAU ===== */}
        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          {loading ? (
            <p className="text-center text-gray-500 py-6">Chargement...</p>

          ) : election?.type === "LISTE" ? (
            /* ---- Tableau LISTE ---- */
            <table className="min-w-full border border-gray-300">
              <thead className="bg-indigo-700">
                <tr>
                  <th className="px-4 py-3 text-white text-left border-r">Liste</th>
                  <th className="px-4 py-3 text-white text-left border-r">Nb candidats</th>
                  <th className="px-4 py-3 text-white text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listes.length === 0 ? (
                  <tr><td colSpan="3" className="text-center text-gray-500 py-6">Aucune liste</td></tr>
                ) : listes.map((l, i) => (
                  <React.Fragment key={l.id_liste}>

                    {/* Ligne liste */}
                    <tr className={i % 2 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-2 border-r font-medium text-black">
                        <button
                          onClick={() => setExpandedListe(expandedListe === l.id_liste ? null : l.id_liste)}
                          className="flex items-center gap-2 hover:text-indigo-700"
                        >
                          <span>{expandedListe === l.id_liste ? "▼" : "▶"}</span>
                          {l.nom}
                        </button>
                      </td>
                      <td className="px-4 py-2 border-r text-center text-black">{l.nb_candidats} candidat(s)</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDeleteListe(l.id_liste)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>

                    {/* Lignes candidats (expandées) */}
                    {expandedListe === l.id_liste && (
                      candidats.filter(c => c.id_liste === l.id_liste).length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-8 py-2 text-gray-400 italic bg-indigo-50">
                            Aucun candidat dans cette liste
                          </td>
                        </tr>
                      ) : (
                        candidats.filter(c => c.id_liste === l.id_liste).map((c) => (
                          <tr key={c.id_candidat} className="bg-indigo-50 border-l-4 border-indigo-400">
                            <td className="px-8 py-2 border-r text-black">↳ {c.nom}</td>
                            <td className="px-4 py-2 border-r text-black">{c.parti || "—"}</td>
                            <td className="px-4 py-2 text-center flex justify-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/adminelection/modifier-candidat/${c.id_candidat}`)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                              >
                                <FiEdit /> Modifier
                              </button>
                              <button
                                onClick={() => handleDelete(c.id_candidat)}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

          ) : (
            /* ---- Tableau UNINOMINAL ---- */
            <table className="min-w-full border border-gray-300">
              <thead className="bg-indigo-700">
                <tr>
                  <th className="px-4 py-3 text-white text-left border-r">Nom</th>
                  <th className="px-4 py-3 text-white text-left border-r">Parti</th>
                  <th className="px-4 py-3 text-white text-left border-r">Âge</th>
                  <th className="px-4 py-3 text-white text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidats.length === 0 ? (
                  <tr><td colSpan="4" className="text-center text-gray-500 py-6">Aucun candidat</td></tr>
                ) : candidats.map((c, i) => (
                  <tr key={c.id_candidat} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-2 border-r text-black">{c.nom}</td>
                    <td className="px-4 py-2 border-r text-black">{c.parti || "—"}</td>
                    <td className="px-4 py-2 border-r text-black">{c.age || "—"}</td>
                    <td className="px-4 py-2 text-center flex justify-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/adminelection/modifier-candidat/${c.id_candidat}`)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                      >
                        <FiEdit /> Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(c.id_candidat)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
// import { FiEdit, FiPlus, FiUpload, FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiCalendar, FiUserCheck, FiTrash2 } from "react-icons/fi";
// import api from "../../../services/api";

// export default function Candidats() {
//   const { electionId } = useParams();
//   const navigate = useNavigate();

//   const [election, setElection]         = useState(null);
//   const [candidats, setCandidats]       = useState([]);
//   const [listes, setListes]             = useState([]);
//   const [loading, setLoading]           = useState(true);
//   const [csvPreview, setCsvPreview]     = useState([]);
//   const [csvErrors, setCsvErrors]       = useState([]);
//   const [csvError, setCsvError]         = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [toast, setToast]               = useState("");
//   const dropdownRef = useRef();

//   // Résoudre l'ID élection depuis URL ou localStorage
//   const activeId = electionId || localStorage.getItem("activeElectionId");

//   useEffect(() => {
//     const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   useEffect(() => { if (activeId) { fetchElection(); fetchCandidats(); } }, [activeId]);

//   const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

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
//       // Fetch listes si scrutin LISTE
//       const listesRes = await api.get(`/elections/${activeId}/listes`).catch(() => ({ data: [] }));
//       setListes(listesRes.data);
//     } catch (err) { console.error(err.response?.data || err.message); }
//     finally { setLoading(false); }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Supprimer ce candidat ?")) return;
//     try { await api.delete(`/candidats/${id}`); showToast("Candidat supprimé"); fetchCandidats(); }
//     catch (err) { showToast(err.response?.data?.message || "Erreur suppression"); }
//   };

//   const handleCSVImport = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     Papa.parse(file, { header: true, skipEmptyLines: true, complete: (result) => {
//       const preview = []; const errors = [];
//       result.data.forEach((row, i) => {
//         const rowErrors = [];
//         if (election?.type === "LISTE" && !row.liste?.trim()) rowErrors.push("Liste manquante");
//         if (!row.nom?.trim())  rowErrors.push("Nom manquant");
//         if (!row.parti?.trim()) rowErrors.push("Parti manquant");
//         if (election?.type !== "LISTE" && (!row.age || isNaN(row.age))) rowErrors.push("Âge invalide");
//         if (rowErrors.length) errors.push({ ligne: i + 2, erreurs: rowErrors });
//         preview.push({ id: Date.now() + i, liste: row.liste, nom: row.nom, parti: row.parti, age: row.age, valide: !rowErrors.length });
//       });
//       setCsvPreview(preview); setCsvErrors(errors);
//       setCsvError(errors.length ? "Certaines lignes sont invalides" : "");
//     }});
//   };

//   const handleConfirmImport = async () => {
//     const valides = csvPreview.filter(r => r.valide);
//     if (!valides.length) return;
//     try {
//       const res = await api.post(`/elections/${activeId}/candidats/import`, {
//         candidats: valides.map(r => ({ nom: r.nom, parti: r.parti, age: r.age ? Number(r.age) : null, liste: r.liste }))
//       });
//       showToast(`${res.data.inserted} candidat(s) importé(s)`);
//       setCsvPreview([]); setCsvErrors([]); setCsvError(""); fetchCandidats();
//     } catch (err) { showToast(err.response?.data?.message || "Erreur import"); }
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

//   if (!activeId) return (
//     <div className="flex min-h-screen items-center justify-center bg-indigo-100">
//       <div className="bg-white p-8 rounded-xl shadow text-center">
//         <p className="text-gray-600 mb-4">Veuillez sélectionner une élection.</p>
//         <Link to="/admin/adminelection/ElectionPage" className="text-indigo-600 underline">Mes élections</Link>
//       </div>
//     </div>
//   );

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       {toast && <div className="fixed top-5 right-5 z-50 bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg">{toast}</div>}

//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="/adminElectionDashboard"           className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiHome /> Tableau de bord</Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiCalendar /> Mes élections</Link>
//           {/* <Link to="/admin/adminelection/candidats"    className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100 font-semibold"><FiUsers /> Candidats</Link>
//           <Link to="/admin/adminelection/electeurs"    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUserCheck /> Électeurs</Link>
//           <Link to="/admin/adminelection/resultats"    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiBarChart2 /> Résultats</Link> */}
//         </nav>
//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiSettings /> Paramètres</Link>
//           <Link to="/logout"   className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100 text-red-600"><FiLogOut /> Déconnexion</Link>
//         </div>
//       </aside>

//       <main className="flex-1 p-8">
//         <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
//           <h2 className="text-lg font-semibold text-indigo-900">
//             Candidats – {election ? `${election.titre} (${election.type})` : "Chargement..."}
//           </h2>
//           <div className="flex gap-3">
//             <div className="relative" ref={dropdownRef}>
//               <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
//                 <FiUpload /> CSV
//               </button>
//               {showDropdown && (
//                 <div className="absolute right-0 mt-2 w-52 bg-white border rounded-xl shadow-lg z-10">
//                   <label className="block px-4 py-2 cursor-pointer hover:bg-green-100 text-gray-800">
//                     Import CSV <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
//                   </label>
//                   <button className="block w-full text-left px-4 py-2 hover:bg-blue-100 text-gray-800" onClick={downloadCSVModel}>
//                     Télécharger modèle
//                   </button>
//                 </div>
//               )}
//             </div>
//             <Link to="/admin/adminelection/creer-candidat" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
//               <FiPlus /> Ajouter
//             </Link>
//           </div>
//         </div>

//         {csvError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">❌ {csvError}</div>}

//         {csvPreview.length > 0 && (
//           <div className="mb-4 p-4 bg-gray-50 rounded-xl border overflow-x-auto">
//             <h3 className="font-semibold mb-2">Aperçu CSV :</h3>
//             <table className="min-w-full border border-gray-300 text-sm">
//               <thead className="bg-gray-200">
//                 <tr>
//                   {Object.keys(csvPreview[0]).filter(k => k !== "valide" && k !== "id").map(k => <th key={k} className="px-2 py-1 border">{k}</th>)}
//                   <th className="px-2 py-1 border">Valide</th><th className="px-2 py-1 border">Erreurs</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {csvPreview.map((row, i) => {
//                   const err = csvErrors.find(e => e.ligne === i + 2);
//                   return (
//                     <tr key={row.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
//                       {Object.keys(row).filter(k => k !== "valide" && k !== "id").map(k => <td key={k} className="px-2 py-1 border">{row[k]}</td>)}
//                       <td className="px-2 py-1 border text-center">{row.valide ? "✅" : "❌"}</td>
//                       <td className="px-2 py-1 border text-red-600 text-xs">{err ? err.erreurs.join(", ") : ""}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//             <button onClick={handleConfirmImport} className="mt-3 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
//               Importer ({csvPreview.filter(r => r.valide).length} valides)
//             </button>
//           </div>
//         )}

//         <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
//           {loading ? <p className="text-center text-gray-500 py-6">Chargement...</p>
//           : election?.type === "LISTE" ? (
//             <table className="min-w-full border border-gray-300">
//               <thead className="bg-indigo-700">
//                 <tr>
//                   <th className="px-4 py-3 text-white text-left border-r">Liste</th>
//                   <th className="px-4 py-3 text-white text-left border-r">Candidats</th>
//                   <th className="px-4 py-3 text-white text-center border-r">Nb</th>
//                   <th className="px-4 py-3 text-white text-center">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {listes.length === 0
//                   ? <tr><td colSpan="4" className="text-center text-gray-500 py-6">Aucune liste</td></tr>
//                   : listes.map((l, i) => (
//                     <tr key={l.id_liste} className={i % 2 ? "bg-gray-50" : "bg-white"}>
//                       <td className="px-4 py-2 border-r font-medium text-black">{l.nom}</td>
//                       <td className="px-4 py-2 border-r text-sm text-black">{l.candidats}</td>
//                       <td className="px-4 py-2 border-r text-center text-black">{l.nb_candidats}</td>
//                       <td className="px-4 py-2 text-center text-black">—</td>
//                     </tr>
//                   ))}
//               </tbody>
//             </table>
//           ) : (
//             <table className="min-w-full border border-gray-300">
//               <thead className="bg-indigo-700">
//                 <tr>
//                   <th className="px-4 py-3 text-white text-left border-r">Nom</th>
//                   <th className="px-4 py-3 text-white text-left border-r">Parti</th>
//                   <th className="px-4 py-3 text-white text-left border-r">Âge</th>
//                   <th className="px-4 py-3 text-white text-center">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {candidats.length === 0
//                   ? <tr><td colSpan="4" className="text-center text-gray-500 py-6">Aucun candidat</td></tr>
//                   : candidats.map((c, i) => (
//                     <tr key={c.id_candidat} className={i % 2 ? "bg-gray-50" : "bg-white"}>
//                       <td className="px-4 py-2 border-r text-black">{c.nom}</td>
//                       <td className="px-4 py-2 border-r text-black">{c.parti || "—"}</td>
//                       <td className="px-4 py-2 border-r text-black">{c.age || "—"}</td>
//                       <td className="px-4 py-2 text-center flex justify-center gap-2">
//                         <button onClick={() => navigate(`/admin/adminelection/modifier-candidat/${c.id_candidat}`)} className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm">
//                           <FiEdit /> Modifier
//                         </button>
//                         <button onClick={() => handleDelete(c.id_candidat)} className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">
//                           <FiTrash2 />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }






























// import React, { useState, useEffect, useRef } from "react";
// import { Link, useParams } from "react-router-dom";
// import Papa from "papaparse";
// import {
//   FiEdit,
//   FiPlus,
//   FiUpload,
//   FiHome,
//   FiUsers,
//   FiBarChart2,
//   FiSettings,
//   FiLogOut,
//   FiCalendar,
//   FiUserCheck
// } from "react-icons/fi";

// /* ================= MOCK DATA ================= */
// const mockElections = [
//   { id_election: 1, titre: "Élection universitaire 2026", type_scrutin: "UNINOMINAL" },
//   { id_election: 2, titre: "Conseil étudiant", type_scrutin: "BINOMINAL" },
//   { id_election: 3, titre: "Élection départementale", type_scrutin: "LISTE" }
// ];

// /* ================= COMPONENT ================= */
// export default function Candidats() {
//   const { electionId } = useParams();

//   const [election, setElection] = useState(null);
//   const [candidats, setCandidats] = useState([]);
//   const [listes, setListes] = useState([]);
//   const [csvError, setCsvError] = useState("");
//   const [csvPreview, setCsvPreview] = useState([]);
//   const [csvErrors, setCsvErrors] = useState([]);
//   const [showDropdown, setShowDropdown] = useState(false);

//   const dropdownRef = useRef();

//   /* ================= CLOSE DROPDOWN ON CLICK OUTSIDE ================= */
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   /* ================= LOAD ELECTION ================= */
//   useEffect(() => {
//     const found =
//       mockElections.find(e => e.id_election === Number(electionId)) ||
//       mockElections[0];
//     setElection(found);
//   }, [electionId]);

//   /* ================= CSV IMPORT ================= */
//   const handleCSVImport = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       complete: (result) => {
//         try {
//           const preview = [];
//           const errors = [];

//           result.data.forEach((row, index) => {
//             let rowErrors = [];

//             if (election.type_scrutin === "LISTE") {
//               if (!row.liste || row.liste.trim() === "") rowErrors.push("Liste manquante");
//             }
//             if (!row.nom || row.nom.trim() === "") rowErrors.push("Nom manquant");
//             if (!row.parti || row.parti.trim() === "") rowErrors.push("Parti manquant");
//             if (election.type_scrutin !== "LISTE" && (!row.age || isNaN(row.age))) rowErrors.push("Âge invalide");

//             if (rowErrors.length > 0) errors.push({ ligne: index + 2, erreurs: rowErrors });

//             preview.push({
//               id: Date.now() + index,
//               liste: row.liste,
//               nom: row.nom,
//               parti: row.parti,
//               age: row.age,
//               valide: rowErrors.length === 0
//             });
//           });

//           setCsvPreview(preview);
//           setCsvErrors(errors);
//           setCsvError(errors.length > 0 ? "Certaines lignes sont invalides" : "");
//         } catch (err) {
//           setCsvError(err.message || "Erreur dans le fichier CSV");
//         }
//       }
//     });
//   };

//   const handleConfirmImport = () => {
//     if (election.type_scrutin === "LISTE") {
//       const grouped = {};
//       csvPreview.filter(row => row.valide).forEach(row => {
//         if (!grouped[row.liste]) grouped[row.liste] = [];
//         grouped[row.liste].push(row.nom);
//       });

//       const importedListes = Object.keys(grouped).map((liste, i) => ({
//         id: i + 1,
//         nom: liste,
//         candidats: grouped[liste]
//       }));
//       setListes(importedListes);
//     } else {
//       setCandidats(csvPreview.filter(row => row.valide));
//     }

//     setCsvPreview([]);
//     setCsvErrors([]);
//     setCsvError("");
//   };

//   /* ================= DOWNLOAD CSV MODELS ================= */
//   const downloadCSVModel = () => {
//     if (election.type_scrutin === "LISTE") {
//       const csvContent = "liste,nom,parti\nListe A,Jean Dupont,Parti A\nListe A,Marie Curie,Parti B\nListe B,Paul Mbida,Independant";
//       const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = "modele_candidats_liste.csv";
//       link.click();
//     } else {
//       const csvContent = "nom,parti,age\nJean Dupont,Parti A,45\nMarie Ndzi,Parti B,39\nPaul Mbida,Independant,50";
//       const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = "modele_candidats.csv";
//       link.click();
//     }
//   };

//   if (!election) return <div className="p-8">Chargement...</div>;

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* SIDEBAR */}
//       <aside className="w-64 bg-white/80 backdrop-blur border-r p-6 flex flex-col">
//         <h1 className="text-2xl font-bold mb-10 text-indigo-700">🗳 eVote – Admin</h1>
//         <nav className="flex-1 space-y-3">
//           <Link to="adminElectionDashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiHome /> Tableau de bord</Link>
//           <Link to="/admin/adminelection/ElectionPage" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiCalendar /> Mes élections</Link>
//           <Link to="/admin/adminelection/candidats" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-100"><FiUsers /> Candidats</Link>
//           <Link to="/admin/adminelection/electeurs/${electionId}" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiUserCheck /> Électeurs</Link>
//           <Link to="/admin/adminelection/resultats" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiBarChart2 /> Résultats</Link>
//         </nav>
//         <div className="space-y-3 mt-6">
//           <Link to="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiSettings /> Paramètres</Link>
//           <Link to="/logout" className="flex items-center gap-4 
//          text-red-600 px-4 py-3 rounded-xl hover:bg-indigo-100"><FiLogOut /> Déconnexion</Link>
//         </div>
//       </aside>

//       {/* MAIN */}
//       <main className="flex-1 p-8">
//         {/* HEADER */}
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-lg font-semibold text-indigo-900">Candidats – {election.titre} ({election.type_scrutin})</h2>

//           <div className="flex gap-3">
//             {/* DROPDOWN CSV */}
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
//               >
//                 <FiUpload /> CSV
//               </button>
//               {showDropdown && (
//                 <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg z-10">
//                   <label className="block px-4 py-2 text-left w-full cursor-pointer text-gray-800 bg-white hover:bg-green-100">
//                     Import CSV
//                     <input
//                       type="file"
//                       accept=".csv"
//                       hidden
//                       onChange={handleCSVImport}
//                     />
//                   </label>
//                   <button
//                     className="block w-full text-left px-4 py-2 hover:bg-blue-600"
//                     onClick={downloadCSVModel}
//                   >
//                     Télécharger modèle CSV
//                   </button>
//                 </div>
//               )}
//             </div>

//             <Link to="/admin/adminelection/creer-candidat"
//               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
//               <FiPlus /> Ajouter
//             </Link>
//           </div>
//         </div>

//         {/* CSV ERROR */}
//         {csvError && (
//           <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">❌ {csvError}</div>
//         )}

//         {/* CSV PREVIEW */}
//         {csvPreview.length > 0 && (
//           <div className="mb-4 p-4 bg-gray-50 rounded-xl border">
//             <h3 className="font-semibold mb-2">Aperçu CSV :</h3>
//             <table className="min-w-full border border-gray-300">
//               <thead className="bg-gray-200">
//                 <tr>
//                   {Object.keys(csvPreview[0]).filter(k => k !== "valide" && k !== "id").map((key) => (
//                     <th key={key} className="px-2 py-1 border">{key}</th>
//                   ))}
//                   <th className="px-2 py-1 border">Valide</th>
//                   <th className="px-2 py-1 border">Erreurs</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {csvPreview.map((row, i) => {
//                   const rowError = csvErrors.find(e => e.ligne === i + 2);
//                   return (
//                     <tr key={row.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
//                       {Object.keys(row).filter(k => k !== "valide" && k !== "id").map((key) => (
//                         <td key={key} className="px-2 py-1 border">{row[key]}</td>
//                       ))}
//                       <td className="px-2 py-1 border">{row.valide ? "✅" : "❌"}</td>
//                       <td className="px-2 py-1 border">{rowError ? rowError.erreurs.join(", ") : ""}</td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>

//             <button
//               className="mt-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
//               onClick={handleConfirmImport}
//             >
//               Importer candidats valides
//             </button>
//           </div>
//         )}

//         {/* TABLES */}
//         <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
//           {(election.type_scrutin === "UNINOMINAL" || election.type_scrutin === "BINOMINAL") && (
//             <table className="min-w-full border border-gray-300">
//               <thead className="bg-indigo-700">
//                 <tr>
//                   <th className="px-4 py-3 text-white border-r">Nom</th>
//                   <th className="px-4 py-3 text-white border-r">Parti</th>
//                   <th className="px-4 py-3 text-white border-r">Âge</th>
//                   <th className="px-4 py-3 text-white">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {candidats.map((c, i) => (
//                   <tr key={c.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
//                     <td className="px-4 py-2 border-r">{c.nom}</td>
//                     <td className="px-4 py-2 border-r">{c.parti}</td>
//                     <td className="px-4 py-2 border-r">{c.age}</td>
//                     <td className="px-4 py-2 text-center">
//                       <Link className="text-sm px-3 py-1 bg-yellow-500 text-white rounded-lg"><FiEdit /> Modifier</Link>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}

//           {election.type_scrutin === "LISTE" && (
//             <table className="min-w-full border border-gray-300">
//               <thead className="bg-indigo-700">
//                 <tr>
//                   <th className="px-4 py-3 text-white border-r">Liste</th>
//                   <th className="px-4 py-3 text-white border-r">Candidats</th>
//                   <th className="px-4 py-3 text-white">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {listes.map((l, i) => (
//                   <tr key={l.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
//                     <td className="px-4 py-2 border-r">{l.nom}</td>
//                     <td className="px-4 py-2 border-r">{l.candidats.join(", ")}</td>
//                     <td className="px-4 py-2 text-center">
//                       <Link className="text-sm px-3 py-1 bg-yellow-500 text-white rounded-lg"><FiEdit /> Modifier</Link>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}

//         </div>
//       </main>
//     </div>
//   );
// }

