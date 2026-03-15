// src/pages/admin/superadmin/SuperAdminCreerElection.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiCalendar, FiArrowLeft, FiSave, FiClock, FiInfo, FiUserCheck, FiUsers as FiUsersIcon
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

export default function SuperAdminCreerElection() {
  const navigate = useNavigate();

  const [admins,  setAdmins]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titre:            "",
    description:      "",
    type:             "UNINOMINAL",
    date_debut:       "",
    date_fin:         "",
    dureeTourMinutes: 1440,
    nb_sieges:        29,
    admin_id:         "",
    statut:           "APPROUVEE", // le super admin crée directement approuvée
  });

  useEffect(() => {
    api.get("/utilisateurs")
      .then(res => setAdmins(res.data.filter(u =>
        ["ADMIN_ELECTION", "ADMIN_ELECTION_PENDING"].includes(u.role)
      )))
      .catch(console.error);
  }, []);

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

    if (!form.admin_id) {
      toast.error("Veuillez affecter un administrateur à cette élection.");
      return;
    }
    if (!isListe && !form.date_fin) {
      toast.error("La date de fin est obligatoire.");
      return;
    }
    if (!isListe && new Date(form.date_fin) <= new Date(form.date_debut)) {
      toast.error("La date de fin doit être postérieure à la date de début.");
      return;
    }
    if (isListe && (!form.nb_sieges || form.nb_sieges < 1)) {
      toast.error("Le nombre de sièges doit être supérieur à 0.");
      return;
    }

    const dateFin = isListe
      ? new Date(new Date(form.date_debut).getTime() + form.dureeTourMinutes * 60000)
          .toISOString().slice(0, 16)
      : form.date_fin;

    setLoading(true);
    try {
      await api.post("/superadmin/elections", {
        titre:              form.titre,
        description:        form.description,
        type:               form.type,
        date_debut:         form.date_debut,
        date_fin:           dateFin,
        duree_tour_minutes: isListe ? form.dureeTourMinutes : null,
        nb_sieges:          isListe ? form.nb_sieges        : null,
        admin_id:           parseInt(form.admin_id),
        statut:             form.statut,
      });

      toast.success(`Élection "${form.titre}" créée avec succès !`);
      setTimeout(() => navigate("/admin/superadmin/elections"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  const dateFinTour1 = isListe && form.date_debut
    ? new Date(new Date(form.date_debut).getTime() + form.dureeTourMinutes * 60000)
        .toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  const bonusSieges = isListe && form.nb_sieges ? Math.floor(form.nb_sieges / 2) : 0;
  const resteSieges = isListe && form.nb_sieges ? form.nb_sieges - bonusSieges : 0;

  const adminSelectionne = admins.find(a => a.id === parseInt(form.admin_id));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      {/* ── SIDEBAR */}
      <SuperAdminSidebar active="elections" />

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-blue-900 tracking-tight">Créer une élection</h2>
            <p className="text-sm text-blue-400 mt-1">L'élection sera directement approuvée</p>
          </div>
          <Link to="/admin/superadmin/elections"
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-medium shadow-sm">
            <FiArrowLeft size={14} /> Retour
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl">

          {/* ── FORMULAIRE ─────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">

            {/* Titre */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Titre *</label>
              <input type="text" name="titre" value={form.titre} onChange={handleChange} required
                placeholder="Ex : Élection du conseil municipal 2026"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="3"
                placeholder="Décrivez l'objet de cette élection…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
            </div>

            {/* Admin — champ clé */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FiUserCheck size={11} className="text-blue-500" /> Administrateur de l'élection *
              </label>
              <select name="admin_id" value={form.admin_id} onChange={handleChange} required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
                <option value="">— Sélectionner un administrateur —</option>
                {admins.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.prenom} {a.nom} — {a.email} {a.role === "ADMIN_ELECTION_PENDING" ? "(en attente)" : ""}
                  </option>
                ))}
              </select>
              {adminSelectionne && (
                <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-black text-xs flex-shrink-0">
                    {adminSelectionne.prenom?.charAt(0)}{adminSelectionne.nom?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-800">{adminSelectionne.prenom} {adminSelectionne.nom}</p>
                    <p className="text-xs text-blue-400">{adminSelectionne.email}</p>
                  </div>
                </div>
              )}
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

            {/* Statut initial */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Statut initial *</label>
              <select name="statut" value={form.statut} onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
                <option value="APPROUVEE">Approuvée (s'ouvre automatiquement à date_debut)</option>
                <option value="EN_ATTENTE">En attente (validation requise)</option>
              </select>
            </div>

            {/* Date de début */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date et heure de début *</label>
              <input type="datetime-local" name="date_debut" value={form.date_debut} onChange={handleChange} required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>

            {/* Date de fin — non-LISTE */}
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
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FiUsersIcon size={11} className="text-blue-500" /> Nombre de sièges *
                    </label>
                    <input type="number" name="nb_sieges" value={form.nb_sieges} onChange={handleChange}
                      required min="1" max="999" placeholder="Ex : 29"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>
                </div>

                {/* Aperçu sièges */}
                {form.nb_sieges > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                    <p className="text-xs font-bold text-blue-500 mb-2.5 flex items-center gap-1.5">
                      <FiInfo size={11} /> Répartition des sièges
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white rounded-lg p-2 border border-blue-100">
                        <p className="text-lg font-black text-blue-700">{form.nb_sieges}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Total</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                        <p className="text-lg font-black text-amber-600">{bonusSieges}</p>
                        <p className="text-xs text-amber-500 mt-0.5">Bonus gagnant</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-blue-100">
                        <p className="text-lg font-black text-blue-500">{resteSieges}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Proportionnel</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aperçu calendrier */}
                {dateFinTour1 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                      <FiCalendar size={11} /> Aperçu du calendrier
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Début Tour 1</span>
                        <span className="font-semibold text-blue-700">
                          {new Date(form.date_debut).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fin Tour 1</span>
                        <span className="font-semibold text-blue-600">{dateFinTour1}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bouton */}
            <div className="pt-2">
              <button type="submit" disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all ${
                  loading ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-200/60"
                }`}>
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Création…</>
                  : <><FiSave size={14} /> Créer l'élection</>
                }
              </button>
            </div>
          </form>

          {/* ── PANNEAU DROIT ───────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Info super admin */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Privilèges Super Admin</p>
              <div className="space-y-2.5">
                {[
                  { icon: "✅", text: "Création directe sans validation" },
                  { icon: "👤", text: "Affectation libre de l'administrateur" },
                  { icon: "🔄", text: "Choix du statut initial" },
                  { icon: "🗳", text: "Tous les types de scrutin" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <span className="text-base">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Liste des admins disponibles */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Administrateurs disponibles ({admins.length})
              </p>
              {admins.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun administrateur disponible.</p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {admins.map(a => (
                    <li key={a.id}
                      onClick={() => setForm(prev => ({ ...prev, admin_id: String(a.id) }))}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                        form.admin_id === String(a.id)
                          ? "bg-blue-100 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}>
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs flex-shrink-0">
                        {a.prenom?.charAt(0)}{a.nom?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{a.prenom} {a.nom}</p>
                        <p className="text-xs text-gray-400 truncate">{a.email}</p>
                      </div>
                      {form.admin_id === String(a.id) && (
                        <span className="text-blue-600 text-xs font-bold flex-shrink-0">✓</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
