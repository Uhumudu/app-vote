// src/pages/admin/adminelection/CreerCandidat.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft, FiCamera, FiX, FiUser, FiTag, FiHash, FiList, FiPlus, FiCheck
} from "react-icons/fi";
import api from "../../../services/api.jsx";
import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

export default function CreerCandidat() {
  const { electionId } = useParams();
  const navigate       = useNavigate();
  const activeId       = electionId || localStorage.getItem("activeElectionId");
  const fileInputRef   = useRef(null);

  const [election, setElection] = useState(null);
  const [listes, setListes]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [nom, setNom]     = useState("");
  const [parti, setParti] = useState("");
  const [age, setAge]     = useState("");
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [listeId, setListeId]           = useState("");
  const [nouvelleListe, setNouvelleListe]                   = useState("");
  const [creerNouvelleListeMode, setCreerNouvelleListeMode] = useState(false);

  useEffect(() => { if (activeId) fetchElection(); }, [activeId]);

  const fetchElection = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/elections/${activeId}`);
      setElection(res.data);
      if (res.data.statut === "EN_COURS" || res.data.statut === "TERMINEE") {
        navigate("/admin/adminelection/candidats", { replace: true });
        return;
      }
      if (res.data.type === "LISTE") {
        const listesRes = await api.get(`/elections/${activeId}/listes`).catch(() => ({ data: [] }));
        setListes(listesRes.data);
      }
    } catch { setErrorMsg("Impossible de charger les données de l'élection."); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
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
      try { photoUrl = await uploadPhoto(); }
      catch (uploadErr) {
        setErrorMsg(`Erreur upload photo : ${uploadErr.message}`);
        setSaving(false); return;
      }
      const payload = {
        nom:      nom.trim(),
        parti:    parti.trim() || undefined,
        age:      age ? Number(age) : undefined,
        photo:    photoUrl,
        liste_id: (election?.type === "LISTE" && !creerNouvelleListeMode) ? listeId || undefined : undefined
      };
      if (election?.type === "LISTE" && creerNouvelleListeMode && nouvelleListe.trim()) {
        await api.post(`/elections/${activeId}/candidats/import`, {
          candidats: [{ nom: payload.nom, parti: payload.parti, age: payload.age, photo: payload.photo, liste: nouvelleListe.trim() }]
        });
      } else {
        await api.post(`/elections/${activeId}/candidats`, payload);
      }
      setSuccessMsg(`Candidat "${nom}" créé avec succès !`);
      setTimeout(() => navigate(`/admin/adminelection/candidats`), 1200);
    } catch (err) {
      console.error("Erreur:", err.response?.status, err.response?.data);
      if (err.response?.status === 403) setErrorMsg(err.response.data?.message || "Accès refusé.");
      else if (err.response?.status === 400) setErrorMsg(err.response.data?.message || "Données invalides.");
      else setErrorMsg(err.response?.data?.message || "Erreur lors de la création.");
    } finally { setSaving(false); }
  };

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
            <span className="text-indigo-700">Nouveau candidat</span>
          </div>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-indigo-900">Ajouter un candidat</h2>
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

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Identité */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Identité</h3>
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <input ref={fileInputRef} type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange} className="hidden" id="photo-input" />
                  {photoPreview ? (
                    <div className="relative group">
                      <img src={photoPreview} alt="Aperçu"
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-200 shadow" />
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
              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Informations complémentaires</h3>
                <div className="max-w-xs">
                  <label className="block mb-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <FiHash className="text-indigo-400" /> Âge <span className="text-red-400">*</span>
                  </label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)} required min="18" max="120"
                    placeholder="Ex : 35"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 transition-all bg-gray-50 focus:bg-white" />
                </div>
              </div>
            )}

            {/* Liste */}
            {election?.type === "LISTE" && (
              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5">Affectation à une liste</h3>
                <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl w-fit">
                  <button type="button" onClick={() => setCreerNouvelleListeMode(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!creerNouvelleListeMode ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    <FiList className="text-sm" /> Liste existante
                  </button>
                  <button type="button" onClick={() => setCreerNouvelleListeMode(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${creerNouvelleListeMode ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    <FiPlus className="text-sm" /> Nouvelle liste
                  </button>
                </div>
                {!creerNouvelleListeMode ? (
                  <select value={listeId} onChange={e => setListeId(e.target.value)} required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white transition-all">
                    <option value="">— Sélectionner une liste —</option>
                    {listes.map(l => <option key={l.id_liste} value={l.id_liste}>{l.nom}</option>)}
                  </select>
                ) : (
                  <input type="text" value={nouvelleListe} onChange={e => setNouvelleListe(e.target.value)} required
                    placeholder="Nom de la nouvelle liste"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white transition-all" />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 text-sm">
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Création en cours…</>
                ) : (
                  <><FiCheck /> Créer le candidat</>
                )}
              </button>
              <button type="button" onClick={() => navigate("/admin/adminelection/candidats")}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-all text-sm shadow-sm">
                Annuler
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
