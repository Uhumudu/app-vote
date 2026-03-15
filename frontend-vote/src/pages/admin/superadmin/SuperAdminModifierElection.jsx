// src/pages/admin/superadmin/SuperAdminModifierElection.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiCalendar, FiArrowLeft, FiEdit3, FiCheckCircle,
  FiClock, FiUserCheck, FiAlertCircle
} from "react-icons/fi";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../../services/api";

const DUREE_OPTIONS = [
  { value: 30,    label: "30 minutes" },
  { value: 60,    label: "1 heure" },
  { value: 120,   label: "2 heures" },
  { value: 360,   label: "6 heures" },
  { value: 720,   label: "12 heures" },
  { value: 1440,  label: "24 heures (1 jour)" },
  { value: 2880,  label: "48 heures (2 jours)" },
  { value: 4320,  label: "3 jours" },
  { value: 10080, label: "7 jours" },
];

export default function SuperAdminModifierElection() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [admins,      setAdmins]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState({
    titre: "", description: "", type: "UNINOMINAL",
    date_debut: "", date_fin: "",
    dureeTourMinutes: 1440, nb_sieges: 29,
    admin_id: "", statut: "EN_ATTENTE",
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [elecRes, usersRes] = await Promise.all([
          api.get(`/elections/${id}`),
          api.get("/utilisateurs"),
        ]);
        const e = elecRes.data;
        setForm({
          titre:            e.titre       ?? "",
          description:      e.description ?? "",
          type:             e.type        ?? "UNINOMINAL",
          date_debut:       e.date_debut  ? e.date_debut.slice(0, 16) : "",
          date_fin:         e.date_fin    ? e.date_fin.slice(0, 16)   : "",
          dureeTourMinutes: e.duree_tour_minutes ?? 1440,
          nb_sieges:        e.nb_sieges   ?? 29,
          admin_id:         String(e.admin_id ?? ""),
          statut:           e.statut      ?? "EN_ATTENTE",
        });
        setAdmins(usersRes.data.filter(u =>
          ["ADMIN_ELECTION", "ADMIN_ELECTION_PENDING"].includes(u.role)
        ));
      } catch (err) {
        console.error(err);
        toast.error("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const isListe = form.type === "LISTE";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: (name === "dureeTourMinutes" || name === "nb_sieges")
        ? parseInt(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.admin_id) { toast.error("Veuillez affecter un administrateur."); return; }
    setSaving(true);
    try {
      const dateFin = isListe
        ? new Date(new Date(form.date_debut).getTime() + form.dureeTourMinutes * 60000)
            .toISOString().slice(0, 16)
        : form.date_fin;

      await api.put(`/superadmin/elections/${id}`, {
        titre: form.titre, description: form.description,
        type: form.type, date_debut: form.date_debut, date_fin: dateFin,
        duree_tour_minutes: isListe ? form.dureeTourMinutes : null,
        nb_sieges:          isListe ? form.nb_sieges        : null,
        admin_id:           parseInt(form.admin_id),
        statut:             form.statut,
      });
      setSaveSuccess(true);
      setTimeout(() => navigate("/admin/superadmin/elections"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur modification");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-10 flex flex-col items-center gap-4 shadow-lg">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-blue-600 text-sm font-medium">Chargement…</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      {/* ── SIDEBAR */}
      <SuperAdminSidebar active="elections" />

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
              <FiEdit3 size={16} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-900 tracking-tight">Modifier l'élection</h2>
              <p className="text-xs text-blue-400 font-mono mt-0.5">ID #{id}</p>
            </div>
          </div>
          <Link to="/admin/superadmin/elections"
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-medium shadow-sm">
            <FiArrowLeft size={14} /> Retour
          </Link>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-sm text-amber-700">
          <FiAlertCircle size={15} />
          En tant que Super Admin, vous pouvez modifier tous les champs quelle que soit la phase de l'élection.
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-7 space-y-5">

          {/* Titre */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Titre *</label>
            <input type="text" name="titre" value={form.titre} onChange={handleChange} required
              placeholder="Titre de l'élection"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="3"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
          </div>

          {/* Admin */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FiUserCheck size={11} className="text-blue-500" /> Administrateur *
            </label>
            <select name="admin_id" value={form.admin_id} onChange={handleChange} required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
              <option value="">— Sélectionner —</option>
              {admins.map(a => (
                <option key={a.id} value={a.id}>{a.prenom} {a.nom} — {a.email}</option>
              ))}
            </select>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Statut *</label>
            <select name="statut" value={form.statut} onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
              <option value="EN_ATTENTE">En attente</option>
              <option value="APPROUVEE">Approuvée</option>
              <option value="EN_COURS">En cours</option>
              <option value="SUSPENDUE">Suspendue</option>
              <option value="TERMINEE">Terminée</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type de scrutin *</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
              <option value="UNINOMINAL">Uninominal</option>
              <option value="BINOMINAL">Binominal</option>
              <option value="LISTE">Liste (tours successifs)</option>
            </select>
          </div>

          {/* Date début */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date et heure de début *</label>
            <input type="datetime-local" name="date_debut" value={form.date_debut} onChange={handleChange} required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>

          {/* Date fin — non-LISTE */}
          {!isListe && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date et heure de fin *</label>
              <input type="datetime-local" name="date_fin" value={form.date_fin} onChange={handleChange} required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
          )}

          {/* Champs LISTE */}
          {isListe && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-blue-100" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest px-2">Scrutin de liste</span>
                <div className="flex-1 h-px bg-blue-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FiClock size={11} className="text-blue-500" /> Durée par tour *
                  </label>
                  <select name="dureeTourMinutes" value={form.dureeTourMinutes} onChange={handleChange} required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
                    {DUREE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nombre de sièges *</label>
                  <input type="number" name="nb_sieges" value={form.nb_sieges} onChange={handleChange}
                    required min="1" max="999"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
            <Link to="/admin/superadmin/elections"
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all">
              Annuler
            </Link>
            <button type="submit" disabled={saving || saveSuccess}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 shadow-md ${
                saveSuccess ? "bg-emerald-500 shadow-emerald-200/60" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200/60"
              } disabled:opacity-75 disabled:cursor-not-allowed`}>
              {saveSuccess
                ? <><FiCheckCircle size={14} /> Enregistré !</>
                : saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</>
                : <><FiEdit3 size={14} /> Enregistrer</>
              }
            </button>
          </div>
        </form>

      </main>

      <ToastContainer />
    </div>
  );
}
