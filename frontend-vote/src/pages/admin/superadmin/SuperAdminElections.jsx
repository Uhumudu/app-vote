// src/pages/admin/superadmin/SuperAdminElections.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut,
  FiPlus, FiEdit, FiTrash2, FiPause, FiPlay,
  FiSearch, FiCalendar, FiChevronDown, FiChevronUp,
  FiUser
} from "react-icons/fi";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";
import api from "../../../services/api";

const STATUS_CONFIG = {
  EN_COURS:   { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", dot: true,  label: "En cours" },
  TERMINEE:   { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db", dot: false, label: "Terminée" },
  APPROUVEE:  { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", dot: false, label: "Approuvée" },
  SUSPENDUE:  { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", dot: false, label: "Suspendue" },
  EN_ATTENTE: { bg: "#fef3c7", color: "#78350f", border: "#fcd34d", dot: false, label: "En attente" },
};

const TYPE_CONFIG = {
  UNINOMINAL: { bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd" },
  BINOMINAL:  { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
  LISTE:      { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
};

export default function SuperAdminElections() {
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [admins,    setAdmins]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filterStatus, setFilterStatus] = useState("TOUS");
  const [expandedId, setExpandedId] = useState(null);
  const [toast,     setToast]     = useState({ msg: "", type: "success" });

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [elecRes, usersRes] = await Promise.all([
        api.get("/superadmin/elections"),
        api.get("/utilisateurs"),
      ]);
      setElections(elecRes.data);
      setAdmins(usersRes.data.filter(u =>
        ["ADMIN_ELECTION", "ADMIN_ELECTION_PENDING"].includes(u.role)
      ));
    } catch (err) {
      console.error(err);
      notify("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id, currentStatut) => {
    const isSuspended = currentStatut === "SUSPENDUE";
    const msg = isSuspended
      ? "Réactiver cette élection ?"
      : "Suspendre cette élection ?";
    if (!window.confirm(msg)) return;
    try {
      if (isSuspended) {
        await api.put(`/elections/approve/${id}`);
        notify("Élection réactivée (approuvée)");
      } else {
        await api.put(`/elections/reject/${id}`);
        notify("Élection suspendue");
      }
      fetchAll();
    } catch (err) {
      notify(err.response?.data?.message || "Erreur", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette élection définitivement ?")) return;
    try {
      await api.delete(`/superadmin/elections/${id}`);
      notify("Élection supprimée");
      fetchAll();
    } catch (err) {
      notify(err.response?.data?.message || "Erreur suppression", "error");
    }
  };

  const handleChangeAdmin = async (electionId, newAdminId) => {
    try {
      await api.put(`/superadmin/elections/${electionId}/admin`, { admin_id: newAdminId });
      notify("Admin mis à jour");
      fetchAll();
    } catch (err) {
      notify(err.response?.data?.message || "Erreur", "error");
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

  const filtered = elections.filter(e => {
    const matchSearch = `${e.titre} ${e.nom_admin} ${e.prenom_admin}`
      .toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "TOUS" || e.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     elections.length,
    enCours:   elections.filter(e => e.statut === "EN_COURS").length,
    attente:   elections.filter(e => e.statut === "EN_ATTENTE").length,
    suspendues: elections.filter(e => e.statut === "SUSPENDUE").length,
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
          toast.type === "error" ? "bg-red-600" : "bg-blue-700"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <SuperAdminSidebar active="elections" />

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-blue-900 tracking-tight">Toutes les élections</h2>
            {!loading && (
              <p className="text-sm text-blue-400 mt-1">
                {elections.length} élection{elections.length > 1 ? "s" : ""} dans le système
              </p>
            )}
          </div>
          <Link
            to="/admin/superadmin/elections/creer"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-semibold text-sm shadow-md shadow-blue-200/60"
          >
            <FiPlus size={15} /> Créer une élection
          </Link>
        </div>

        {/* KPI */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total",      value: stats.total,      color: "#1d4ed8" },
              { label: "En cours",   value: stats.enCours,    color: "#059669" },
              { label: "En attente", value: stats.attente,    color: "#d97706" },
              { label: "Suspendues", value: stats.suspendues, color: "#dc2626" },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Recherche */}
          <div className="relative flex-1 min-w-48">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text" placeholder="Rechercher par titre ou admin…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          {/* Filtre statut */}
          <div className="flex gap-1.5 flex-wrap">
            {["TOUS", "EN_COURS", "EN_ATTENTE", "APPROUVEE", "SUSPENDUE", "TERMINEE"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === s
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s === "TOUS" ? "Tous" : STATUS_CONFIG[s]?.label ?? s}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-blue-700">
                {["Titre", "Type", "Admin", "Début", "Fin", "Statut", "Actions"].map((h, i) => (
                  <th key={h}
                    className={`px-4 py-3.5 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${
                      h === "Actions" ? "text-center w-48" :
                      h === "Type"   ? "w-28 border-r border-blue-600/50" :
                      h === "Début" || h === "Fin" ? "w-36 border-r border-blue-600/50" :
                      h === "Statut" ? "w-32 border-r border-blue-600/50" :
                      "border-r border-blue-600/50"
                    }`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                      <p className="text-gray-400 text-sm">Chargement…</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <FiCalendar className="text-blue-300 text-2xl" />
                      </div>
                      <p className="text-gray-500 font-semibold">Aucune élection trouvée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((election, index) => {
                  const sc  = STATUS_CONFIG[election.statut] || STATUS_CONFIG.EN_ATTENTE;
                  const tc  = TYPE_CONFIG[election.type]    || TYPE_CONFIG.UNINOMINAL;
                  const isSuspended = election.statut === "SUSPENDUE";
                  const canEdit     = !["EN_COURS", "TERMINEE"].includes(election.statut);

                  return (
                    <>
                      <tr key={election.id_election}
                        className={`border-b border-gray-100 transition-colors duration-150 hover:bg-blue-50/30 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                        }`}>

                        {/* Titre */}
                        <td className="px-4 py-3.5 border-r border-gray-100">
                          <p className="text-sm font-semibold text-gray-800">{election.titre}</p>
                          {election.nb_sieges && election.type === "LISTE" && (
                            <p className="text-xs text-gray-400 mt-0.5">{election.nb_sieges} sièges</p>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3.5 border-r border-gray-100">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                            {election.type}
                          </span>
                        </td>

                        {/* Admin */}
                        <td className="px-4 py-3.5 border-r border-gray-100">
                          {election.nom_admin ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs flex-shrink-0">
                                {election.prenom_admin?.charAt(0)}{election.nom_admin?.charAt(0)}
                              </div>
                              <span className="text-xs text-gray-700 font-medium">
                                {election.prenom_admin} {election.nom_admin}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Dates */}
                        <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(election.date_debut)}
                        </td>
                        <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(election.date_fin)}
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3.5 border-r border-gray-100">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                            style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot ? "animate-pulse" : ""}`}
                              style={{ backgroundColor: sc.color }} />
                            {sc.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex justify-center items-center gap-1.5 flex-wrap">

                            {/* Modifier */}
                            {canEdit && (
                              <Link
                                to={`/admin/superadmin/elections/modifier/${election.id_election}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:scale-95 transition-all text-xs font-bold"
                              >
                                <FiEdit size={11} /> Modifier
                              </Link>
                            )}

                            {/* Suspendre / Réactiver */}
                            {!["TERMINEE"].includes(election.statut) && (
                              <button
                                onClick={() => handleSuspend(election.id_election, election.statut)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all text-xs font-bold ${
                                  isSuspended
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                    : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                }`}
                              >
                                {isSuspended ? <><FiPlay size={11} /> Réactiver</> : <><FiPause size={11} /> Suspendre</>}
                              </button>
                            )}

                            {/* Gérer (expand) */}
                            <button
                              onClick={() => setExpandedId(expandedId === election.id_election ? null : election.id_election)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold ${
                                expandedId === election.id_election
                                  ? "bg-blue-700 text-white"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              Admin {expandedId === election.id_election ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
                            </button>

                            {/* Supprimer */}
                            {canEdit && (
                              <button
                                onClick={() => handleDelete(election.id_election)}
                                className="inline-flex items-center px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-xs"
                                title="Supprimer"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Ligne expandée — changer l'admin */}
                      {expandedId === election.id_election && (
                        <tr className="bg-blue-50/60 border-b border-blue-100">
                          <td colSpan="7" className="px-6 py-4">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                                <FiUser size={14} /> Affecter un administrateur :
                              </div>
                              <select
                                defaultValue={election.admin_id}
                                onChange={e => handleChangeAdmin(election.id_election, e.target.value)}
                                className="border border-blue-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 min-w-52"
                              >
                                <option value="">— Choisir un admin —</option>
                                {admins.map(a => (
                                  <option key={a.id} value={a.id}>
                                    {a.prenom} {a.nom} ({a.role === "ADMIN_ELECTION" ? "Admin" : "En attente"})
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-blue-400">
                                Admin actuel : <strong className="text-blue-600">{election.prenom_admin} {election.nom_admin}</strong>
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
