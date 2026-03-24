// src/pages/admin/adminelection/ModifierCandidat.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft, FiCamera, FiX, FiUser, FiTag, FiHash, FiList, FiCheck, FiAlertTriangle
} from "react-icons/fi";
import api from "../../../services/api.jsx";
import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

export default function ModifierCandidat() {
  const { candidatId } = useParams();
  const navigate       = useNavigate();
  const activeId       = localStorage.getItem("activeElectionId");
  const fileInputRef   = useRef(null);

  const [election, setElection]     = useState(null);
  const [listes, setListes]         = useState([]);
  const [candidat, setCandidat]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [nom, setNom]       = useState("");
  const [parti, setParti]   = useState("");
  const [age, setAge]       = useState("");
  const [listeId, setListeId] = useState("");

  const [photoExistante, setPhotoExistante] = useState("");
  const [photoFile, setPhotoFile]           = useState(null);
  const [photoPreview, setPhotoPreview]     = useState("");

  useEffect(() => { if (candidatId) fetchCandidatAndElection(); }, [candidatId]);

  const fetchCandidatAndElection = async () => {
    try {
      setLoading(true);
      if (!activeId) { setErrorMsg("Aucune élection sélectionnée."); return; }

      const [elecRes, candidatsRes] = await Promise.all([
        api.get(`/elections/${activeId}`),
        api.get(`/elections/${activeId}/candidats`)
      ]);

      setElection(elecRes.data);

      const found = candidatsRes.data.find(c => String(c.id_candidat) === String(candidatId));
      if (!found) { setErrorMsg("Candidat introuvable."); return; }

      setCandidat(found);
      setNom(found.nom);
      setParti(found.parti || "");
      setAge(found.age || "");
      setListeId(found.id_liste || "");

      if (found.photo) {
        setPhotoExistante(found.photo);
        setPhotoPreview(
          found.photo.startsWith("http") ? found.photo : `http://localhost:5000${found.photo}`
        );
      }

      if (elecRes.data.type === "LISTE") {
        const listesRes = await api.get(`/elections/${activeId}/listes`).catch(() => ({ data: [] }));
        setListes(listesRes.data);
      }
    } catch { setErrorMsg("Impossible de charger les données."); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoExistante("");
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoExistante("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ fetch natif — le browser gère le Content-Type avec le bon boundary automatiquement
  const uploadPhoto = async () => {
    if (!photoFile) return undefined;
    const formData = new FormData();
    formData.append("photo", photoFile);
    const response = await fetch("http://localhost:5000/api/uploads/photo", {
      method: "POST",
      body: formData,
      // NE PAS mettre de headers — le browser calcule le boundary seul
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Échec upload");
    }
    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg(""); setSaving(true);
    try {
      let photoUrl;
      try {
        photoUrl = photoFile ? await uploadPhoto() : photoExistante || null;
      } catch (uploadErr) {
        setErrorMsg(`Erreur upload photo : ${uploadErr.message}`);
        setSaving(false); return;
      }

      await api.put(`/candidats/${candidatId}`, {
        nom:      nom.trim(),
        parti:    parti.trim() || null,
        age:      age ? Number(age) : null,
        photo:    photoUrl,
        liste_id: listeId || null
      });

      setSuccessMsg(`Candidat "${nom}" modifié avec succès !`);
      setTimeout(() => navigate("/admin/adminelection/candidats"), 1200);
    } catch (err) {
      console.error("Erreur:", err.response?.status, err.response?.data);
      if (err.response?.status === 403) setErrorMsg(err.response.data?.message || "Modification impossible : élection en cours ou terminée.");
      else if (err.response?.status === 404) setErrorMsg("Candidat introuvable.");
      else setErrorMsg(err.response?.data?.message || "Erreur serveur.");
    } finally { setSaving(false); }
  };

  const isLocked = election && (election.statut === "EN_COURS" || election.statut === "TERMINEE");

  if (loading) return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <AdminElectionSidebar active="candidats" />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-indigo-500 font-medium text-sm">Chargement...</p>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <AdminElectionSidebar active="candidats" />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center gap-2 text-xs text-indigo-400 mb-6 font-medium">
            <span>Candidats</span><span>/</span>
            <span className="text-indigo-700">Modifier un candidat</span>
          </div>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-indigo-900">Modifier le candidat</h2>
              {election && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{election.titre}</span>
                  <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-semibold">{election.type}</span>
                </div>
              )}
            </div>
            <button type="button" onClick={() => navigate("/admin/adminelection/candidats")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl font-semibold text-sm transition-all shadow-sm">
              <FiArrowLeft /> Retour
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <span className="text-lg leading-none mt-0.5">⚠️</span><span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-5 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
              <FiCheck className="text-lg flex-shrink-0" /><span>{successMsg}</span>
            </div>
          )}

          {isLocked && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm">
              <FiAlertTriangle className="text-lg flex-shrink-0 mt-0.5" />
              <span>Cette élection est <strong>{election.statut === "EN_COURS" ? "en cours" : "terminée"}</strong> — la modification est désactivée.</span>
            </div>
          )}

          {!candidat ? (
            <div className="bg-white rounded-2xl p-10 text-center text-red-500 font-semibold shadow-sm border border-red-100">
              Candidat introuvable.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              <fieldset disabled={isLocked} className={isLocked ? "opacity-60 pointer-events-none" : ""}>

                {/* Identité */}
                <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-5">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Identité</h3>
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0">
                      <input ref={fileInputRef} type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange} className="hidden" id="photo-input" />
                      {photoPreview ? (
                        <div className="relative group">
                          <img src={photoPreview} alt="Aperçu"
                            className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-200 shadow"
                            onError={e => { e.target.style.display = "none"; }} />
                          <label htmlFor="photo-input"
                            className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center">
                            <FiCamera className="text-white text-xl" />
                          </label>
                          <button type="button" onClick={handleRemovePhoto}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-all">
                            <FiX className="text-xs" />
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="photo-input"
                          className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-indigo-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                          <FiCamera className="text-2xl text-indigo-300 group-hover:text-indigo-500 transition-all mb-1" />
                          <span className="text-xs text-gray-400 group-hover:text-indigo-500 text-center leading-tight px-1">Photo</span>
                        </label>
                      )}
                      <p className="text-xs text-gray-400 mt-2 text-center w-24">JPG · PNG</p>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                          <FiUser className="text-indigo-400" /> Nom complet <span className="text-red-400">*</span>
                        </label>
                        <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
                          placeholder="Ex : Jean Dupont"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white" />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                          <FiTag className="text-indigo-400" /> Parti <span className="text-gray-300 font-normal text-xs ml-1">optionnel</span>
                        </label>
                        <input type="text" value={parti} onChange={e => setParti(e.target.value)}
                          placeholder="Ex : Parti Indépendant"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Âge */}
                {election?.type !== "LISTE" && (
                  <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-5">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Informations complémentaires</h3>
                    <div className="max-w-xs">
                      <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <FiHash className="text-indigo-400" /> Âge
                      </label>
                      <input type="number" value={age} onChange={e => setAge(e.target.value)} min="18" max="120"
                        placeholder="Ex : 35"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white" />
                    </div>
                  </div>
                )}

                {/* Liste */}
                {election?.type === "LISTE" && (
                  <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-5">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Affectation à une liste</h3>
                    <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <FiList className="text-indigo-400" /> Liste
                    </label>
                    <select value={listeId} onChange={e => setListeId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white transition-all">
                      <option value="">— Sans liste —</option>
                      {listes.map(l => <option key={l.id_liste} value={l.id_liste}>{l.nom}</option>)}
                    </select>
                  </div>
                )}

              </fieldset>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                {!isLocked && (
                  <button type="submit" disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 text-sm">
                    {saving ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</>
                    ) : (
                      <><FiCheck /> Enregistrer les modifications</>
                    )}
                  </button>
                )}
                <button type="button" onClick={() => navigate("/admin/adminelection/candidats")}
                  className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-all text-sm shadow-sm">
                  {isLocked ? "Retour" : "Annuler"}
                </button>
              </div>

            </form>
          )}
        </div>
      </main>
    </div>
  );
}






































// // src/pages/admin/adminelection/ModifierCandidat.jsx
// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import {
//   FiArrowLeft,
//   FiCamera, FiX, FiUser, FiTag, FiHash, FiList, FiCheck, FiAlertTriangle
// } from "react-icons/fi";
// import api from "../../../services/api.jsx";
// import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

// export default function ModifierCandidat() {
//   const { candidatId } = useParams();
//   const navigate       = useNavigate();
//   const activeId       = localStorage.getItem("activeElectionId");
//   const fileInputRef   = useRef(null);

//   const [election, setElection]     = useState(null);
//   const [listes, setListes]         = useState([]);
//   const [candidat, setCandidat]     = useState(null);
//   const [loading, setLoading]       = useState(true);
//   const [saving, setSaving]         = useState(false);
//   const [errorMsg, setErrorMsg]     = useState("");
//   const [successMsg, setSuccessMsg] = useState("");

//   const [nom, setNom]       = useState("");
//   const [parti, setParti]   = useState("");
//   const [age, setAge]       = useState("");
//   const [listeId, setListeId] = useState("");

//   const [photoExistante, setPhotoExistante] = useState("");
//   const [photoFile, setPhotoFile]           = useState(null);
//   const [photoPreview, setPhotoPreview]     = useState("");

//   useEffect(() => {
//     if (candidatId) fetchCandidatAndElection();
//   }, [candidatId]);

//   const fetchCandidatAndElection = async () => {
//     try {
//       setLoading(true);
//       if (!activeId) { setErrorMsg("Aucune élection sélectionnée."); return; }

//       const [elecRes, candidatsRes] = await Promise.all([
//         api.get(`/elections/${activeId}`),
//         api.get(`/elections/${activeId}/candidats`)
//       ]);

//       setElection(elecRes.data);

//       const found = candidatsRes.data.find(c => String(c.id_candidat) === String(candidatId));
//       if (!found) { setErrorMsg("Candidat introuvable."); return; }

//       setCandidat(found);
//       setNom(found.nom);
//       setParti(found.parti || "");
//       setAge(found.age || "");
//       setListeId(found.id_liste || "");

//       if (found.photo) {
//         setPhotoExistante(found.photo);
//         setPhotoPreview(found.photo);
//       }

//       if (elecRes.data.type === "LISTE") {
//         const listesRes = await api.get(`/elections/${activeId}/listes`).catch(() => ({ data: [] }));
//         setListes(listesRes.data);
//       }
//     } catch {
//       setErrorMsg("Impossible de charger les données.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setPhotoFile(file);
//     setPhotoPreview(URL.createObjectURL(file));
//     setPhotoExistante("");
//   };

//   const handleRemovePhoto = () => {
//     setPhotoFile(null);
//     setPhotoPreview("");
//     setPhotoExistante("");
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   // ✅ CORRIGÉ : pas de Content-Type manuel, Axios gère le boundary multipart
//   const uploadPhoto = async () => {
//     if (!photoFile) return undefined;
//     const formData = new FormData();
//     formData.append("photo", photoFile);
//     const res = await api.post("/uploads/photo", formData);
//     return res.data.url;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setErrorMsg(""); setSuccessMsg(""); setSaving(true);

//     try {
//       // Upload photo avec son propre try/catch
//       let photoUrl;
//       try {
//         photoUrl = photoFile
//           ? await uploadPhoto()
//           : photoExistante || null;
//       } catch (uploadErr) {
//         setErrorMsg("Erreur lors de l'upload de la photo. Vérifiez le format (JPG, PNG).");
//         setSaving(false);
//         return;
//       }

//       await api.put(`/candidats/${candidatId}`, {
//         nom:      nom.trim(),
//         parti:    parti.trim() || null,
//         age:      age ? Number(age) : null,
//         photo:    photoUrl,
//         liste_id: listeId || null
//       });

//       setSuccessMsg(`Candidat "${nom}" modifié avec succès !`);
//       setTimeout(() => navigate("/admin/adminelection/candidats"), 1200);
//     } catch (err) {
//       console.error("Erreur modification candidat:", err.response?.status, err.response?.data);
//       if (err.response?.status === 403) setErrorMsg(err.response.data?.message || "Modification impossible : élection en cours ou terminée.");
//       else if (err.response?.status === 404) setErrorMsg("Candidat introuvable.");
//       else setErrorMsg(err.response?.data?.message || "Erreur serveur.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const isLocked = election && (election.statut === "EN_COURS" || election.statut === "TERMINEE");

//   if (loading) return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <AdminElectionSidebar active="candidats" />
//       <main className="flex-1 flex items-center justify-center">
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
//           <p className="text-indigo-500 font-medium text-sm">Chargement...</p>
//         </div>
//       </main>
//     </div>
//   );

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <AdminElectionSidebar active="candidats" />

//       <main className="flex-1 p-8 overflow-y-auto">
//         <div className="max-w-2xl mx-auto">

//           {/* ── Fil d'Ariane ── */}
//           <div className="flex items-center gap-2 text-xs text-indigo-400 mb-6 font-medium">
//             <span>Candidats</span>
//             <span>/</span>
//             <span className="text-indigo-700">Modifier un candidat</span>
//           </div>

//           {/* ── En-tête ── */}
//           <div className="flex items-start justify-between mb-6">
//             <div>
//               <h2 className="text-2xl font-black text-indigo-900">Modifier le candidat</h2>
//               {election && (
//                 <div className="flex items-center gap-2 mt-1">
//                   <span className="text-sm text-gray-500">{election.titre}</span>
//                   <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-semibold">{election.type}</span>
//                 </div>
//               )}
//             </div>
//             <button type="button" onClick={() => navigate("/admin/adminelection/candidats")}
//               className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl font-semibold text-sm transition-all shadow-sm">
//               <FiArrowLeft /> Retour
//             </button>
//           </div>

//           {/* ── Alertes ── */}
//           {errorMsg && (
//             <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
//               <span className="text-lg leading-none mt-0.5">⚠️</span>
//               <span>{errorMsg}</span>
//             </div>
//           )}
//           {successMsg && (
//             <div className="mb-5 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
//               <FiCheck className="text-lg flex-shrink-0" />
//               <span>{successMsg}</span>
//             </div>
//           )}

//           {/* ── Avertissement élection verrouillée ── */}
//           {isLocked && (
//             <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm">
//               <FiAlertTriangle className="text-lg flex-shrink-0 mt-0.5" />
//               <span>
//                 Cette élection est <strong>{election.statut === "EN_COURS" ? "en cours" : "terminée"}</strong> — la modification est désactivée.
//               </span>
//             </div>
//           )}

//           {!candidat ? (
//             <div className="bg-white rounded-2xl p-10 text-center text-red-500 font-semibold shadow-sm border border-red-100">
//               Candidat introuvable.
//             </div>
//           ) : (
//             <form onSubmit={handleSubmit} className="space-y-5">

//               {/* Désactiver tout le formulaire si verrouillé */}
//               <fieldset disabled={isLocked} className={isLocked ? "opacity-60 pointer-events-none" : ""}>

//                 {/* SECTION : Photo + Identité */}
//                 <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-5">
//                   <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Identité</h3>

//                   <div className="flex gap-6 items-start">

//                     {/* Photo */}
//                     <div className="flex-shrink-0">
//                       <input
//                         ref={fileInputRef}
//                         type="file"
//                         accept="image/*"
//                         onChange={handleFileChange}
//                         className="hidden"
//                         id="photo-input"
//                       />
//                       {photoPreview ? (
//                         <div className="relative group">
//                           <img
//                             src={photoPreview}
//                             alt="Aperçu"
//                             className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-200 shadow"
//                             onError={e => { e.target.style.display = "none"; }}
//                           />
//                           <label htmlFor="photo-input"
//                             className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center">
//                             <FiCamera className="text-white text-xl" />
//                           </label>
//                           <button type="button" onClick={handleRemovePhoto}
//                             className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-all">
//                             <FiX className="text-xs" />
//                           </button>
//                         </div>
//                       ) : (
//                         <label htmlFor="photo-input"
//                           className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-indigo-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
//                           <FiCamera className="text-2xl text-indigo-300 group-hover:text-indigo-500 transition-all mb-1" />
//                           <span className="text-xs text-gray-400 group-hover:text-indigo-500 text-center leading-tight px-1">Photo</span>
//                         </label>
//                       )}
//                       <p className="text-xs text-gray-400 mt-2 text-center w-24">JPG · PNG</p>
//                     </div>

//                     {/* Nom + Parti */}
//                     <div className="flex-1 space-y-4">
//                       <div>
//                         <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
//                           <FiUser className="text-indigo-400" /> Nom complet <span className="text-red-400">*</span>
//                         </label>
//                         <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
//                           placeholder="Ex : Jean Dupont"
//                           className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white" />
//                       </div>
//                       <div>
//                         <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
//                           <FiTag className="text-indigo-400" /> Parti <span className="text-gray-300 font-normal text-xs ml-1">optionnel</span>
//                         </label>
//                         <input type="text" value={parti} onChange={e => setParti(e.target.value)}
//                           placeholder="Ex : Parti Indépendant"
//                           className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white" />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* SECTION : Âge */}
//                 {election?.type !== "LISTE" && (
//                   <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-5">
//                     <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Informations complémentaires</h3>
//                     <div className="max-w-xs">
//                       <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
//                         <FiHash className="text-indigo-400" /> Âge
//                       </label>
//                       <input type="number" value={age} onChange={e => setAge(e.target.value)} min="18" max="120"
//                         placeholder="Ex : 35"
//                         className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white" />
//                     </div>
//                   </div>
//                 )}

//                 {/* SECTION : Liste */}
//                 {election?.type === "LISTE" && (
//                   <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-5">
//                     <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Affectation à une liste</h3>
//                     <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
//                       <FiList className="text-indigo-400" /> Liste
//                     </label>
//                     <select value={listeId} onChange={e => setListeId(e.target.value)}
//                       className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white transition-all">
//                       <option value="">— Sans liste —</option>
//                       {listes.map(l => <option key={l.id_liste} value={l.id_liste}>{l.nom}</option>)}
//                     </select>
//                   </div>
//                 )}

//               </fieldset>

//               {/* ── Actions ── */}
//               <div className="flex items-center gap-3 pt-2">
//                 {!isLocked && (
//                   <button type="submit" disabled={saving}
//                     className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 text-sm">
//                     {saving ? (
//                       <>
//                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                         Enregistrement…
//                       </>
//                     ) : (
//                       <>
//                         <FiCheck /> Enregistrer les modifications
//                       </>
//                     )}
//                   </button>
//                 )}
//                 <button type="button" onClick={() => navigate("/admin/adminelection/candidats")}
//                   className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-all text-sm shadow-sm">
//                   {isLocked ? "Retour" : "Annuler"}
//                 </button>
//               </div>

//             </form>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }



















// // // src/pages/admin/adminelection/ModifierCandidat.jsx
// // import React, { useState, useEffect, useRef } from "react";
// // import { useNavigate, useParams } from "react-router-dom";
// // import {
// //   FiArrowLeft,
// //   FiCamera, FiX, FiUser, FiTag, FiHash, FiList, FiCheck, FiAlertTriangle
// // } from "react-icons/fi";
// // import api from "../../../services/api.jsx";
// // import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

// // export default function ModifierCandidat() {
// //   const { candidatId } = useParams();
// //   const navigate       = useNavigate();
// //   const activeId       = localStorage.getItem("activeElectionId");
// //   const fileInputRef   = useRef(null);

// //   const [election, setElection]     = useState(null);
// //   const [listes, setListes]         = useState([]);
// //   const [candidat, setCandidat]     = useState(null);
// //   const [loading, setLoading]       = useState(true);
// //   const [saving, setSaving]         = useState(false);
// //   const [errorMsg, setErrorMsg]     = useState("");
// //   const [successMsg, setSuccessMsg] = useState("");

// //   const [nom, setNom]       = useState("");
// //   const [parti, setParti]   = useState("");
// //   const [age, setAge]       = useState("");
// //   const [listeId, setListeId] = useState("");

// //   // Photo : peut être une URL existante (string) ou un nouveau fichier
// //   const [photoExistante, setPhotoExistante] = useState(""); // URL actuelle en BDD
// //   const [photoFile, setPhotoFile]           = useState(null);
// //   const [photoPreview, setPhotoPreview]     = useState("");

// //   useEffect(() => {
// //     if (candidatId) fetchCandidatAndElection();
// //   }, [candidatId]);

// //   const fetchCandidatAndElection = async () => {
// //     try {
// //       setLoading(true);
// //       if (!activeId) { setErrorMsg("Aucune élection sélectionnée."); return; }

// //       const [elecRes, candidatsRes] = await Promise.all([
// //         api.get(`/elections/${activeId}`),
// //         api.get(`/elections/${activeId}/candidats`)
// //       ]);

// //       setElection(elecRes.data);

// //       const found = candidatsRes.data.find(c => String(c.id_candidat) === String(candidatId));
// //       if (!found) { setErrorMsg("Candidat introuvable."); return; }

// //       setCandidat(found);
// //       setNom(found.nom);
// //       setParti(found.parti || "");
// //       setAge(found.age || "");
// //       setListeId(found.id_liste || "");

// //       // Photo existante
// //       if (found.photo) {
// //         setPhotoExistante(found.photo);
// //         setPhotoPreview(found.photo);
// //       }

// //       if (elecRes.data.type === "LISTE") {
// //         const listesRes = await api.get(`/elections/${activeId}/listes`).catch(() => ({ data: [] }));
// //         setListes(listesRes.data);
// //       }
// //     } catch {
// //       setErrorMsg("Impossible de charger les données.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleFileChange = (e) => {
// //     const file = e.target.files[0];
// //     if (!file) return;
// //     setPhotoFile(file);
// //     setPhotoPreview(URL.createObjectURL(file));
// //     setPhotoExistante(""); // on remplace l'existante
// //   };

// //   const handleRemovePhoto = () => {
// //     setPhotoFile(null);
// //     setPhotoPreview("");
// //     setPhotoExistante("");
// //     if (fileInputRef.current) fileInputRef.current.value = "";
// //   };

// //   const uploadPhoto = async () => {
// //     if (!photoFile) return undefined;
// //     const formData = new FormData();
// //     formData.append("photo", photoFile);
// //     const res = await api.post("/uploads/photo", formData, {
// //       headers: { "Content-Type": "multipart/form-data" }
// //     });
// //     return res.data.url;
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setErrorMsg(""); setSuccessMsg(""); setSaving(true);

// //     try {
// //       // Upload nouvelle photo si fichier sélectionné, sinon garder l'URL existante
// //       const photoUrl = photoFile
// //         ? await uploadPhoto()
// //         : photoExistante || null;

// //       await api.put(`/candidats/${candidatId}`, {
// //         nom:      nom.trim(),
// //         parti:    parti.trim() || null,
// //         age:      age ? Number(age) : null,
// //         photo:    photoUrl,
// //         liste_id: listeId || null
// //       });

// //       setSuccessMsg(`Candidat "${nom}" modifié avec succès !`);
// //       setTimeout(() => navigate("/admin/adminelection/candidats"), 1200);
// //     } catch (err) {
// //       if      (err.response?.status === 403) setErrorMsg("Modification impossible : élection en cours ou terminée.");
// //       else if (err.response?.status === 404) setErrorMsg("Candidat introuvable.");
// //       else setErrorMsg(err.response?.data?.message || "Erreur serveur.");
// //     } finally { setSaving(false); }
// //   };

// //   const isLocked = election && (election.statut === "EN_COURS" || election.statut === "TERMINEE");

// //   if (loading) return (
// //     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
// //       <AdminElectionSidebar active="candidats" />
// //       <main className="flex-1 flex items-center justify-center">
// //         <div className="flex flex-col items-center gap-3">
// //           <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
// //           <p className="text-indigo-500 font-medium text-sm">Chargement...</p>
// //         </div>
// //       </main>
// //     </div>
// //   );

// //   return (
// //     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
// //       <AdminElectionSidebar active="candidats" />

// //       <main className="flex-1 p-8 overflow-y-auto">
// //         <div className="max-w-2xl mx-auto">

// //           {/* ── Fil d'Ariane ── */}
// //           <div className="flex items-center gap-2 text-xs text-indigo-400 mb-6 font-medium">
// //             <span>Candidats</span>
// //             <span>/</span>
// //             <span className="text-indigo-700">Modifier un candidat</span>
// //           </div>

// //           {/* ── En-tête ── */}
// //           <div className="flex items-start justify-between mb-6">
// //             <div>
// //               <h2 className="text-2xl font-black text-indigo-900">Modifier le candidat</h2>
// //               {election && (
// //                 <div className="flex items-center gap-2 mt-1">
// //                   <span className="text-sm text-gray-500">{election.titre}</span>
// //                   <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-semibold">{election.type}</span>
// //                 </div>
// //               )}
// //             </div>
// //             <button type="button" onClick={() => navigate("/admin/adminelection/candidats")}
// //               className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl font-semibold text-sm transition-all shadow-sm">
// //               <FiArrowLeft /> Retour
// //             </button>
// //           </div>

// //           {/* ── Alertes ── */}
// //           {errorMsg && (
// //             <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
// //               <span className="text-lg leading-none mt-0.5">⚠️</span>
// //               <span>{errorMsg}</span>
// //             </div>
// //           )}
// //           {successMsg && (
// //             <div className="mb-5 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
// //               <FiCheck className="text-lg flex-shrink-0" />
// //               <span>{successMsg}</span>
// //             </div>
// //           )}

// //           {/* ── Avertissement élection verrouillée ── */}
// //           {isLocked && (
// //             <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm">
// //               <FiAlertTriangle className="text-lg flex-shrink-0 mt-0.5" />
// //               <span>
// //                 Cette élection est <strong>{election.statut === "EN_COURS" ? "en cours" : "terminée"}</strong> — la modification sera refusée par le serveur.
// //               </span>
// //             </div>
// //           )}

// //           {!candidat ? (
// //             <div className="bg-white rounded-2xl p-10 text-center text-red-500 font-semibold shadow-sm border border-red-100">
// //               Candidat introuvable.
// //             </div>
// //           ) : (
// //             <form onSubmit={handleSubmit} className="space-y-5">

// //               {/* SECTION : Photo + Identité */}
// //               <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
// //                 <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Identité</h3>

// //                 <div className="flex gap-6 items-start">

// //                   {/* Photo */}
// //                   <div className="flex-shrink-0">
// //                     <input
// //                       ref={fileInputRef}
// //                       type="file"
// //                       accept="image/*"
// //                       onChange={handleFileChange}
// //                       className="hidden"
// //                       id="photo-input"
// //                     />
// //                     {photoPreview ? (
// //                       <div className="relative group">
// //                         <img
// //                           src={photoPreview}
// //                           alt="Aperçu"
// //                           className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-200 shadow"
// //                           onError={e => { e.target.style.display = "none"; }}
// //                         />
// //                         <label htmlFor="photo-input"
// //                           className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center">
// //                           <FiCamera className="text-white text-xl" />
// //                         </label>
// //                         <button type="button" onClick={handleRemovePhoto}
// //                           className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-all">
// //                           <FiX className="text-xs" />
// //                         </button>
// //                       </div>
// //                     ) : (
// //                       <label htmlFor="photo-input"
// //                         className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-indigo-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
// //                         <FiCamera className="text-2xl text-indigo-300 group-hover:text-indigo-500 transition-all mb-1" />
// //                         <span className="text-xs text-gray-400 group-hover:text-indigo-500 text-center leading-tight px-1">Photo</span>
// //                       </label>
// //                     )}
// //                     <p className="text-xs text-gray-400 mt-2 text-center w-24">JPG · PNG</p>
// //                   </div>

// //                   {/* Nom + Parti */}
// //                   <div className="flex-1 space-y-4">
// //                     <div>
// //                       <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
// //                         <FiUser className="text-indigo-400" /> Nom complet <span className="text-red-400">*</span>
// //                       </label>
// //                       <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
// //                         placeholder="Ex : Jean Dupont"
// //                         className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white" />
// //                     </div>
// //                     <div>
// //                       <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
// //                         <FiTag className="text-indigo-400" /> Parti <span className="text-gray-300 font-normal text-xs ml-1">optionnel</span>
// //                       </label>
// //                       <input type="text" value={parti} onChange={e => setParti(e.target.value)}
// //                         placeholder="Ex : Parti Indépendant"
// //                         className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white" />
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>

// //               {/* SECTION : Âge */}
// //               {election?.type !== "LISTE" && (
// //                 <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
// //                   <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Informations complémentaires</h3>
// //                   <div className="max-w-xs">
// //                     <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
// //                       <FiHash className="text-indigo-400" /> Âge
// //                     </label>
// //                     <input type="number" value={age} onChange={e => setAge(e.target.value)} min="18" max="120"
// //                       placeholder="Ex : 35"
// //                       className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white" />
// //                   </div>
// //                 </div>
// //               )}

// //               {/* SECTION : Liste */}
// //               {election?.type === "LISTE" && (
// //                 <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
// //                   <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Affectation à une liste</h3>
// //                   <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
// //                     <FiList className="text-indigo-400" /> Liste
// //                   </label>
// //                   <select value={listeId} onChange={e => setListeId(e.target.value)}
// //                     className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white transition-all">
// //                     <option value="">— Sans liste —</option>
// //                     {listes.map(l => <option key={l.id_liste} value={l.id_liste}>{l.nom}</option>)}
// //                   </select>
// //                 </div>
// //               )}

// //               {/* ── Actions ── */}
// //               <div className="flex items-center gap-3 pt-2">
// //                 <button type="submit" disabled={saving}
// //                   className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 text-sm">
// //                   {saving ? (
// //                     <>
// //                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
// //                       Enregistrement…
// //                     </>
// //                   ) : (
// //                     <>
// //                       <FiCheck /> Enregistrer les modifications
// //                     </>
// //                   )}
// //                 </button>
// //                 <button type="button" onClick={() => navigate("/admin/adminelection/candidats")}
// //                   className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-all text-sm shadow-sm">
// //                   Annuler
// //                 </button>
// //               </div>

// //             </form>
// //           )}
// //         </div>
// //       </main>
// //     </div>
// //   );
// // }


