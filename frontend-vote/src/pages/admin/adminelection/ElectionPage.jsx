// src/pages/admin/adminelection/ElectionPage.jsx  — VERSION REFACTORISÉE
// Seul changement : suppression du <aside> inline, ajout de AdminElectionLayout
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEdit, FiPlus, FiCalendar, FiUserCheck,
  FiTrash2, FiChevronDown, FiChevronUp, FiRepeat,
  FiUsers, FiBarChart2
} from "react-icons/fi";
import api from "../../../services/api";
import AdminElectionLayout from "../../../components/adminelection/AdminElectionLayout";

export default function ElectionPage() {
  const [elections,  setElections]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState({ msg: "", type: "success" });
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchElections(); }, []);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const fetchElections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/elections");
      setElections(res.data.map(e => ({
        id:          e.id_election,
        title:       e.titre,
        type:        e.type,
        startDate:   e.date_debut,
        endDate:     e.date_fin,
        status:
          e.statut === "EN_COURS"   ? "En cours"    :
          e.statut === "TERMINEE"   ? "Terminée"    :
          e.statut === "EN_ATTENTE" ? "Non ouverte" :
          e.statut === "APPROUVEE"  ? "Approuvée"   :
          e.statut === "SUSPENDUE"  ? "Suspendue"   : e.statut,
        statut:      e.statut,
        tourCourant: e.tour_courant || 1,
      })));
    } catch (err) {
      console.error("Erreur fetch élections:", err.response?.data || err.message);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette élection définitivement ?")) return;
    try {
      await api.delete(`/elections/${id}`);
      notify("Élection supprimée");
      fetchElections();
    } catch (err) {
      notify(err.response?.data?.message || "Erreur suppression", "error");
    }
  };

  const selectElection        = (id) => localStorage.setItem("activeElectionId", id);
  const handleGererCandidats  = (id) => { selectElection(id); navigate("/admin/adminelection/candidats"); };
  const handleGererElecteurs  = (id) => { selectElection(id); navigate(`/admin/adminelection/electeurs/${id}`); };
  const handleDepouillement   = (id) => { selectElection(id); navigate(`/admin/adminelection/depouillement/${id}`); };

  const formatDate = (d) =>
    new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const statusConfig = (status) => {
    const map = {
      "En cours":    { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", dot: true,  dotColor: "#10b981" },
      "Terminée":    { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db", dot: false, dotColor: "#9ca3af" },
      "Approuvée":   { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", dot: false, dotColor: "#3b82f6" },
      "Suspendue":   { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", dot: false, dotColor: "#ef4444" },
      "Non ouverte": { bg: "#fef3c7", color: "#78350f", border: "#fcd34d", dot: false, dotColor: "#f59e0b" },
      "EN_COURS":    { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", dot: true,  dotColor: "#10b981" },
      "TERMINEE":    { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db", dot: false, dotColor: "#9ca3af" },
      "APPROUVEE":   { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", dot: false, dotColor: "#3b82f6" },
      "SUSPENDUE":   { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", dot: false, dotColor: "#ef4444" },
      "EN_ATTENTE":  { bg: "#fef3c7", color: "#78350f", border: "#fcd34d", dot: false, dotColor: "#f59e0b" },
    };
    return map[status] || { bg: "#e0e7ff", color: "#3730a3", border: "#a5b4fc", dot: false, dotColor: "#6366f1" };
  };

  const canEdit = (statut) => !["EN_COURS", "TERMINEE"].includes(statut);

  return (
    // ✅ AdminElectionLayout remplace le <div> + <aside> d'origine
    <AdminElectionLayout active="elections">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
          toast.type === "error" ? "bg-red-600" : "bg-indigo-700"
        }`}>
          {toast.msg}
        </div>
      )}

      <main className="flex-1 p-8 overflow-y-auto">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Mes élections</h2>
            {!loading && (
              <p className="text-sm text-indigo-400 mt-1">
                {elections.length} élection{elections.length > 1 ? "s" : ""} enregistrée{elections.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Link
            to="/admin/adminelection/Creer-election"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all font-semibold text-sm shadow-md shadow-indigo-200/60"
          >
            <FiPlus size={15} /> Nouvelle élection
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-indigo-700">
                {["Titre", "Type", "Début", "Fin", "Statut", "Actions"].map((h, i) => (
                  <th key={h}
                    className={`px-4 py-3.5 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${
                      h === "Actions" ? "w-48 text-center" : ""
                    } ${i < 5 ? "border-r border-indigo-600/50" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                      <p className="text-gray-400 text-sm">Chargement…</p>
                    </div>
                  </td>
                </tr>
              ) : elections.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <FiCalendar className="text-indigo-300 text-2xl" />
                      </div>
                      <p className="text-gray-500 font-semibold">Aucune élection</p>
                      <Link to="/admin/adminelection/Creer-election" className="text-indigo-600 text-sm font-medium hover:underline">
                        Créer votre première élection →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : elections.map((election, index) => {
                const sc = statusConfig(election.status) || statusConfig(election.statut);
                return (
                  <React.Fragment key={election.id}>
                    <tr className={`border-b border-gray-100 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-indigo-50/40`}>

                      <td className="px-4 py-3.5 border-r border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{election.title}</span>
                          {election.type === "LISTE" && election.statut === "EN_COURS" && election.tourCourant > 1 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">
                              <FiRepeat size={9} /> T{election.tourCourant}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 border-r border-gray-100">
                        <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                          {election.type}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">{formatDate(election.startDate)}</td>
                      <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">{formatDate(election.endDate)}</td>

                      <td className="px-4 py-3.5 border-r border-gray-100">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap"
                          style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.border }}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot ? "animate-pulse" : ""}`}
                            style={{ backgroundColor: sc.dotColor }} />
                          {election.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex justify-center items-center gap-1.5 flex-wrap">
                          {canEdit(election.statut) && (
                            <Link to={`/admin/adminelection/modifier-election/${election.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:scale-95 transition-all text-xs font-bold">
                              <FiEdit size={11} /> Modifier
                            </Link>
                          )}
                          <Link to={`/admin/adminelection/detail-election/${election.id}`}
                            onClick={() => selectElection(election.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all text-xs font-medium">
                            Détails
                          </Link>
                          <button
                            onClick={() => setExpandedId(expandedId === election.id ? null : election.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold border ${
                              expandedId === election.id
                                ? "bg-violet-700 text-white border-violet-700"
                                : "bg-violet-600 text-white border-violet-600 hover:bg-violet-700"
                            }`}
                          >
                            Gérer {expandedId === election.id ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
                          </button>
                          {canEdit(election.statut) && (
                            <button onClick={() => handleDelete(election.id)}
                              className="inline-flex items-center px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-xs">
                              <FiTrash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedId === election.id && (
                      <tr className="bg-violet-50/60 border-b border-violet-100">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-bold text-violet-600 uppercase tracking-wider mr-1">{election.title}</span>

                            <button onClick={() => handleGererCandidats(election.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-xs font-semibold shadow-sm">
                              <FiUsers size={13} /> Candidats
                            </button>
                            <button onClick={() => handleGererElecteurs(election.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:scale-95 transition-all text-xs font-semibold shadow-sm">
                              <FiUserCheck size={13} /> Électeurs
                            </button>
                            {election.type === "LISTE" && election.statut === "EN_COURS" && (
                              <button onClick={() => handleDepouillement(election.id)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:scale-95 transition-all text-xs font-semibold shadow-sm">
                                <FiRepeat size={13} /> Dépouillement
                                {election.tourCourant > 1 && (
                                  <span className="bg-orange-600/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    T{election.tourCourant}
                                  </span>
                                )}
                              </button>
                            )}
                            {!["EN_ATTENTE", "SUSPENDUE"].includes(election.statut) && (
                              <Link to="/admin/adminelection/resultats"
                                onClick={() => selectElection(election.id)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:scale-95 transition-all text-xs font-semibold shadow-sm">
                                <FiBarChart2 size={13} /> Résultats
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </AdminElectionLayout>
  );
}

