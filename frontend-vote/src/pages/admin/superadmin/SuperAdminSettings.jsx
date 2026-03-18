// src/pages/superAdmin/SuperAdminSettings.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers, FiSettings, FiActivity, FiShield, FiSave,
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiToggleLeft, FiToggleRight,
  FiAlertCircle, FiCheckCircle, FiChevronRight, FiLock, FiGlobe,
  FiDatabase, FiUser, FiArrowLeft, FiRefreshCw, FiDownload
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

// ─── Config API ───────────────────────────────────────────────────────────────
const BASE = "http://localhost:5000/api/super-admin/settings";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
  return data;
}

const SECTIONS = [
  { id: "users",    label: "Utilisateurs",       icon: FiUsers    },
  { id: "roles",    label: "Rôles & Permissions", icon: FiShield   },
  { id: "platform", label: "Plateforme",          icon: FiSettings },
  { id: "logs",     label: "Logs & Activité",     icon: FiActivity },
];

const ROLE_COLORS = {
  SUPER_ADMIN:    { bg: "#eef2ff", color: "#4f46e5", label: "Super Admin"    },
  ADMIN_ELECTION: { bg: "#f0f9ff", color: "#0ea5e9", label: "Admin Élection" },
  ELECTEUR:       { bg: "#f0fdf4", color: "#16a34a", label: "Électeur"       },
  ADMIN_ELECTION_PENDING: { bg: "#fffbeb", color: "#b45309", label: "Admin (Pending)" },
};

const LOG_COLORS = {
  info:    { bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
  success: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  warning: { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b" },
  danger:  { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
};

const DEFAULT_CONFIG = {
  nomPlateforme: "VoteSecure", urlFrontend: "https://votesecure.cm",
  emailSupport: "support@votesecure.cm", votesMultiples: false,
  inscriptionOuverte: true, maintenance: false, dureeSession: "24",
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SuperAdminSettings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("users");
  const [toast, setToast] = useState(null);

  // ── Utilisateurs ──────────────────────────────────────
  const [users,       setUsers]       = useState([]);
  const [usersInit,   setUsersInit]   = useState(true);
  const [search,      setSearch]      = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [editUser,    setEditUser]    = useState(null);
  const [modalBusy,   setModalBusy]   = useState(false);

  // Form modal refs
  const refPrenom = useRef(); const refNom    = useRef();
  const refEmail  = useRef(); const refPw     = useRef();
  const refRole   = useRef();

  // ── Rôles ─────────────────────────────────────────────
  const [roles, setRoles] = useState([]);

  // ── Config plateforme ─────────────────────────────────
  const [config,     setConfig]     = useState(DEFAULT_CONFIG);
  const [configInit, setConfigInit] = useState(true);
  const [configBusy, setConfigBusy] = useState(false);

  // ── Logs ──────────────────────────────────────────────
  const [logs,      setLogs]      = useState([]);
  const [logsInit,  setLogsInit]  = useState(true);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage,  setLogsPage]  = useState(1);
  const [logFilter, setLogFilter] = useState("");
  const [exportBusy,setExportBusy]= useState(false);

  // ── Toast ─────────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Chargement utilisateurs ───────────────────────────
  const loadUsers = useCallback(async (q = "") => {
    setUsersInit(true);
    try {
      const data = await apiFetch(`/users?search=${encodeURIComponent(q)}`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) { showToast(e.message, "danger"); }
    finally { setUsersInit(false); }
  }, [showToast]);

  useEffect(() => {
    if (activeSection === "users") loadUsers(search);
  }, [activeSection]); // eslint-disable-line

  // debounce search
  useEffect(() => {
    if (activeSection !== "users") return;
    const t = setTimeout(() => loadUsers(search), 350);
    return () => clearTimeout(t);
  }, [search, activeSection, loadUsers]);

  // ── Chargement rôles ──────────────────────────────────
  useEffect(() => {
    if (activeSection !== "roles") return;
    apiFetch("/roles")
      .then(d => setRoles(d))
      .catch(e => showToast(e.message, "danger"));
  }, [activeSection, showToast]);

  // ── Chargement config plateforme ──────────────────────
  useEffect(() => {
    if (activeSection !== "platform") return;
    setConfigInit(true);
    apiFetch("/platform")
      .then(d => setConfig(d))
      .catch(e => showToast(e.message, "danger"))
      .finally(() => setConfigInit(false));
  }, [activeSection, showToast]);

  // ── Chargement logs ───────────────────────────────────
  useEffect(() => {
    if (activeSection !== "logs") return;
    loadLogs(1, logFilter);
  }, [activeSection]); // eslint-disable-line

  const loadLogs = async (page = 1, type = "") => {
    setLogsInit(true);
    try {
      const q = new URLSearchParams({ page, limit: 20, ...(type ? { type } : {}) });
      const d = await apiFetch(`/logs?${q}`);
      setLogs(d.logs || []);
      setLogsTotal(d.total || 0);
      setLogsPage(page);
    } catch (e) { showToast(e.message, "danger"); }
    finally { setLogsInit(false); }
  };

  // ── Actions utilisateurs ──────────────────────────────
  const toggleUser = async (id) => {
    try {
      const d = await apiFetch(`/users/${id}/toggle`, { method: "PATCH" });
      setUsers(u => u.map(x => x.id === id ? { ...x, actif: d.actif } : x));
      showToast(d.message);
    } catch (e) { showToast(e.message, "danger"); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      setUsers(u => u.filter(x => x.id !== id));
      showToast("Utilisateur supprimé.", "danger");
    } catch (e) { showToast(e.message, "danger"); }
  };

  const submitModal = async () => {
    const body = {
      prenom: refPrenom.current?.value?.trim() || "",
      nom:    refNom.current?.value?.trim()    || "",
      email:  refEmail.current?.value?.trim()  || "",
      role:   refRole.current?.value           || "ELECTEUR",
    };
    if (!editUser) body.mot_de_passe = refPw.current?.value || "";

    setModalBusy(true);
    try {
      if (editUser) {
        await apiFetch(`/users/${editUser.id}`, { method: "PUT", body: JSON.stringify(body) });
        showToast("Utilisateur modifié.");
      } else {
        await apiFetch("/users", { method: "POST", body: JSON.stringify(body) });
        showToast("Utilisateur créé.");
      }
      setShowModal(false);
      loadUsers(search);
    } catch (e) { showToast(e.message, "danger"); }
    finally { setModalBusy(false); }
  };

  // ── Sauvegarder config ────────────────────────────────
  const saveConfig = async () => {
    setConfigBusy(true);
    try {
      await apiFetch("/platform", { method: "PUT", body: JSON.stringify(config) });
      showToast("Configuration sauvegardée !");
    } catch (e) { showToast(e.message, "danger"); }
    finally { setConfigBusy(false); }
  };

  // ── Export CSV ────────────────────────────────────────
  const exportCSV = async () => {
    setExportBusy(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE}/logs/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Échec de l'export.");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `logs_${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
      showToast("Export CSV téléchargé !");
    } catch (e) { showToast(e.message, "danger"); }
    finally { setExportBusy(false); }
  };

  // ── Stats utilisateurs ────────────────────────────────
  const stats = [
    { label: "Total",    val: users.length,                               color: "#4f46e5" },
    { label: "Actifs",   val: users.filter(u => u.actif).length,          color: "#16a34a" },
    { label: "Inactifs", val: users.filter(u => !u.actif).length,         color: "#ef4444" },
    { label: "Admins",   val: users.filter(u => u.role === "ADMIN_ELECTION").length, color: "#0ea5e9" },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="sp-root">

        {/* SIDEBAR */}
        <aside className="sp-sidebar">
          <div className="sp-sidebar-top">
            <button className="sp-back" onClick={() => navigate("/superAdminDashboard")}>
              <FiArrowLeft size={15}/> Tableau de bord
            </button>
            <div className="sp-sidebar-title">
              <div className="sp-sidebar-icon"><FiSettings size={18}/></div>
              <div>
                <div className="sp-sidebar-heading">Paramètres</div>
                <div className="sp-sidebar-sub">Super Administrateur</div>
              </div>
            </div>
          </div>
          <nav className="sp-nav">
            {SECTIONS.map(s => (
              <button key={s.id}
                className={`sp-nav-item${activeSection === s.id ? " sp-nav-item--active" : ""}`}
                onClick={() => setActiveSection(s.id)}>
                <s.icon size={17}/><span>{s.label}</span>
                <FiChevronRight size={13} className="sp-nav-arrow"/>
              </button>
            ))}
          </nav>
          <div className="sp-sidebar-footer">
            <div className="sp-profile">
              <div className="sp-avatar">SA</div>
              <div>
                <div className="sp-profile-name">Super Admin</div>
                <div className="sp-profile-role">Accès total</div>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENU */}
        <main className="sp-main">
          <AnimatePresence>
            {toast && (
              <motion.div key="toast"
                initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                className={`sp-toast sp-toast--${toast.type}`}>
                {toast.type === "danger" ? <FiAlertCircle size={15}/> : <FiCheckCircle size={15}/>}
                {toast.msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══ UTILISATEURS ══ */}
          {activeSection === "users" && (
            <motion.div key="users" {...fade}>
              <div className="sp-sh">
                <div>
                  <h1 className="sp-sh-title">Gestion des utilisateurs</h1>
                  <p className="sp-sh-desc">Créez, modifiez et gérez tous les comptes de la plateforme.</p>
                </div>
                <PrimaryBtn icon={<FiPlus size={15}/>} onClick={() => { setEditUser(null); setShowModal(true); }}>
                  Nouvel utilisateur
                </PrimaryBtn>
              </div>

              {/* Recherche */}
              <div className="sp-search-wrap">
                <FiSearch size={15} className="sp-search-ico"/>
                <input className="sp-search" placeholder="Rechercher un utilisateur…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              {/* Stats */}
              <div className="sp-stats">
                {stats.map((s, i) => (
                  <div key={i} className="sp-stat">
                    <span className="sp-stat-val" style={{ color: s.color }}>{s.val}</span>
                    <span className="sp-stat-lbl">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="sp-table-wrap">
                {usersInit ? (
                  <div className="sp-loading"><FiRefreshCw size={20} className="sp-spin"/> Chargement…</div>
                ) : (
                  <table className="sp-table">
                    <thead>
                      <tr>
                        <th>Utilisateur</th><th>Rôle</th><th>Statut</th><th>Créé le</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="sp-ucell">
                              <div className="sp-uav">{(u.prenom?.[0] || "") + (u.nom?.[0] || "")}</div>
                              <div>
                                <div className="sp-uname">{u.prenom} {u.nom}</div>
                                <div className="sp-uemail">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="sp-rbadge" style={{
                              background: (ROLE_COLORS[u.role] || ROLE_COLORS.ELECTEUR).bg,
                              color:      (ROLE_COLORS[u.role] || ROLE_COLORS.ELECTEUR).color,
                            }}>
                              {(ROLE_COLORS[u.role] || ROLE_COLORS.ELECTEUR).label}
                            </span>
                          </td>
                          <td>
                            <button className="sp-toggle" onClick={() => toggleUser(u.id)}>
                              {u.actif
                                ? <><FiToggleRight size={20} className="sp-ton"/> <span className="sp-tlbl sp-tlbl--on">Actif</span></>
                                : <><FiToggleLeft  size={20} className="sp-toff"/> <span className="sp-tlbl sp-tlbl--off">Inactif</span></>}
                            </button>
                          </td>
                          <td className="sp-muted">{u.created}</td>
                          <td>
                            <div className="sp-actions">
                              <button className="sp-abtn sp-abtn--edit"
                                onClick={() => { setEditUser(u); setShowModal(true); }}>
                                <FiEdit2 size={14}/>
                              </button>
                              <button className="sp-abtn sp-abtn--del" onClick={() => deleteUser(u.id)}>
                                <FiTrash2 size={14}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!usersInit && users.length === 0 && (
                  <div className="sp-empty">Aucun utilisateur trouvé.</div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══ RÔLES & PERMISSIONS ══ */}
          {activeSection === "roles" && (
            <motion.div key="roles" {...fade}>
              <div className="sp-sh">
                <div>
                  <h1 className="sp-sh-title">Rôles & Permissions</h1>
                  <p className="sp-sh-desc">Définissez les droits de chaque rôle sur la plateforme.</p>
                </div>
              </div>
              {roles.length === 0 ? (
                <div className="sp-loading"><FiRefreshCw size={20} className="sp-spin"/> Chargement…</div>
              ) : (
                <>
                  <div className="sp-roles-grid">
                    {roles.map(r => (
                      <div key={r.role} className="sp-role-card">
                        <div className="sp-role-head">
                          <span className="sp-rbadge-lg" style={{
                            background: (ROLE_COLORS[r.role] || {}).bg    || "#f3f4f6",
                            color:      (ROLE_COLORS[r.role] || {}).color || "#374151",
                          }}>{r.label}</span>
                          <p className="sp-role-desc">{r.description}</p>
                        </div>
                        <div className="sp-role-perms">
                          {(r.permissions || []).map((p, i) => (
                            <div key={i} className="sp-perm-row">
                              <span className={`sp-pdot ${p.granted ? "sp-pdot--on" : "sp-pdot--off"}`}/>
                              <span className={`sp-plbl ${p.granted ? "" : "sp-plbl--off"}`}>{p.label}</span>
                              <span className={`sp-pstatus ${p.granted ? "sp-pstatus--on" : "sp-pstatus--off"}`}>
                                {p.granted ? "Autorisé" : "Refusé"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="sp-roles-note">* La modification des permissions nécessite un redéploiement.</p>
                </>
              )}
            </motion.div>
          )}

          {/* ══ CONFIGURATION PLATEFORME ══ */}
          {activeSection === "platform" && (
            <motion.div key="platform" {...fade}>
              <div className="sp-sh">
                <div>
                  <h1 className="sp-sh-title">Configuration de la plateforme</h1>
                  <p className="sp-sh-desc">Paramètres généraux et comportement global de VoteSecure.</p>
                </div>
                <PrimaryBtn icon={<FiSave size={15}/>} loading={configBusy} onClick={saveConfig}>
                  Sauvegarder
                </PrimaryBtn>
              </div>

              {configInit ? (
                <div className="sp-loading"><FiRefreshCw size={20} className="sp-spin"/> Chargement…</div>
              ) : (
                <div className="sp-cfg-grid">
                  {/* Identité */}
                  <div className="sp-cfg-card">
                    <div className="sp-cfg-title"><FiGlobe size={16}/> Identité de la plateforme</div>
                    {[
                      { label: "Nom de la plateforme", key: "nomPlateforme" },
                      { label: "URL frontend",          key: "urlFrontend"   },
                      { label: "Email de support",      key: "emailSupport"  },
                    ].map(f => (
                      <div key={f.key} className="sp-field">
                        <label>{f.label}</label>
                        <input value={config[f.key] || ""}
                          onChange={e => setConfig({ ...config, [f.key]: e.target.value })} />
                      </div>
                    ))}
                  </div>

                  {/* Sécurité */}
                  <div className="sp-cfg-card">
                    <div className="sp-cfg-title"><FiLock size={16}/> Sécurité & Sessions</div>
                    <div className="sp-field">
                      <label>Durée de session (heures)</label>
                      <input type="number" min="1" max="72" value={config.dureeSession}
                        onChange={e => setConfig({ ...config, dureeSession: e.target.value })} />
                    </div>
                    <ToggleRow
                      label="Inscription ouverte"
                      desc="Permettre l'auto-inscription des électeurs"
                      value={config.inscriptionOuverte}
                      onChange={() => setConfig(c => ({ ...c, inscriptionOuverte: !c.inscriptionOuverte }))} />
                    <ToggleRow
                      label="Votes multiples"
                      desc="Autoriser plusieurs votes par électeur"
                      value={config.votesMultiples}
                      onChange={() => setConfig(c => ({ ...c, votesMultiples: !c.votesMultiples }))} />
                  </div>

                  {/* Maintenance */}
                  <div className={`sp-cfg-card sp-cfg-card--full${config.maintenance ? " sp-cfg-card--danger" : ""}`}>
                    <div className="sp-cfg-title"><FiDatabase size={16}/> Mode maintenance</div>
                    <ToggleRow
                      label="Activer le mode maintenance"
                      desc={config.maintenance
                        ? "⚠️ La plateforme est actuellement inaccessible aux utilisateurs."
                        : "La plateforme est accessible normalement."}
                      value={config.maintenance}
                      onChange={() => setConfig(c => ({ ...c, maintenance: !c.maintenance }))}
                      dangerColor={config.maintenance} />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══ LOGS ══ */}
          {activeSection === "logs" && (
            <motion.div key="logs" {...fade}>
              <div className="sp-sh">
                <div>
                  <h1 className="sp-sh-title">Logs & Activité système</h1>
                  <p className="sp-sh-desc">Historique des actions effectuées sur la plateforme.</p>
                </div>
                <GhostBtn icon={<FiDownload size={15}/>} loading={exportBusy} onClick={exportCSV}>
                  Exporter CSV
                </GhostBtn>
              </div>

              {/* Filtres */}
              <div className="sp-log-filters">
                {["", "info", "success", "warning", "danger"].map(t => (
                  <button key={t}
                    className={`sp-log-filter${logFilter === t ? " sp-log-filter--active" : ""}`}
                    onClick={() => { setLogFilter(t); loadLogs(1, t); }}>
                    {t === "" ? "Tous" : { info: "Info", success: "Succès", warning: "Alerte", danger: "Critique" }[t]}
                    {t && <span className="sp-log-dot" style={{ background: LOG_COLORS[t].dot }}/>}
                  </button>
                ))}
              </div>

              {logsInit ? (
                <div className="sp-loading"><FiRefreshCw size={20} className="sp-spin"/> Chargement…</div>
              ) : (
                <>
                  <div className="sp-logs-list">
                    {logs.map(l => {
                      const lc = LOG_COLORS[l.type] || LOG_COLORS.info;
                      return (
                        <div key={l.id} className="sp-log-row" style={{ borderLeftColor: lc.dot }}>
                          <span className="sp-log-dot2" style={{ background: lc.dot }}/>
                          <div className="sp-log-info">
                            <span className="sp-log-action">{l.action}</span>
                            <span className="sp-log-user"><FiUser size={11}/> {l.user_email}</span>
                          </div>
                          <span className="sp-log-date">{l.date}</span>
                          <span className="sp-log-badge" style={{ background: lc.bg, color: lc.color }}>
                            {{ info:"Info", success:"Succès", warning:"Alerte", danger:"Critique" }[l.type] || l.type}
                          </span>
                        </div>
                      );
                    })}
                    {logs.length === 0 && <div className="sp-empty">Aucun log trouvé.</div>}
                  </div>

                  {/* Pagination */}
                  {logsTotal > 20 && (
                    <div className="sp-pagination">
                      <button className="sp-pag-btn" disabled={logsPage <= 1}
                        onClick={() => loadLogs(logsPage - 1, logFilter)}>← Préc.</button>
                      <span className="sp-pag-info">
                        Page {logsPage} / {Math.ceil(logsTotal / 20)}
                      </span>
                      <button className="sp-pag-btn" disabled={logsPage >= Math.ceil(logsTotal / 20)}
                        onClick={() => loadLogs(logsPage + 1, logFilter)}>Suiv. →</button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </main>

        {/* ══ MODAL UTILISATEUR ══ */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="sp-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}>
              <motion.div className="sp-modal"
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
                <h3 className="sp-modal-title">{editUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h3>
                <div className="sp-modal-form">
                  <div className="sp-modal-row">
                    <div className="sp-field">
                      <label>Prénom</label>
                      <input ref={refPrenom} defaultValue={editUser?.prenom} placeholder="Prénom"/>
                    </div>
                    <div className="sp-field">
                      <label>Nom</label>
                      <input ref={refNom} defaultValue={editUser?.nom} placeholder="Nom"/>
                    </div>
                  </div>
                  <div className="sp-field">
                    <label>Adresse e-mail</label>
                    <input ref={refEmail} type="email" defaultValue={editUser?.email} placeholder="email@exemple.com"/>
                  </div>
                  {!editUser && (
                    <div className="sp-field">
                      <label>Mot de passe</label>
                      <input ref={refPw} type="password" placeholder="••••••••"/>
                    </div>
                  )}
                  <div className="sp-field">
                    <label>Rôle</label>
                    <select ref={refRole} defaultValue={editUser?.role || "ELECTEUR"}>
                      {["SUPER_ADMIN", "ADMIN_ELECTION", "ELECTEUR"].map(r => (
                        <option key={r} value={r}>{ROLE_COLORS[r]?.label || r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="sp-modal-actions">
                  <GhostBtn onClick={() => setShowModal(false)}>Annuler</GhostBtn>
                  <PrimaryBtn icon={<FiSave size={14}/>} loading={modalBusy} onClick={submitModal}>
                    {editUser ? "Enregistrer" : "Créer"}
                  </PrimaryBtn>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ─── Mini-composants ──────────────────────────────────────────────────────────
function PrimaryBtn({ children, loading, onClick, icon }) {
  return (
    <button className="sp-btn-primary" onClick={onClick} disabled={loading}>
      {loading ? <FiRefreshCw size={15} className="sp-spin"/> : icon}
      {loading ? "Chargement…" : children}
    </button>
  );
}

function GhostBtn({ children, loading, onClick, icon }) {
  return (
    <button className="sp-btn-ghost" onClick={onClick} disabled={loading}>
      {loading ? <FiRefreshCw size={15} className="sp-spin"/> : icon}
      {loading ? "Chargement…" : children}
    </button>
  );
}

function ToggleRow({ label, desc, value, onChange, dangerColor }) {
  return (
    <div className="sp-trow">
      <div>
        <div className="sp-trow-lbl">{label}</div>
        <div className="sp-trow-desc">{desc}</div>
      </div>
      <button className="sp-toggle" onClick={onChange}>
        {value
          ? <FiToggleRight size={26} style={{ color: dangerColor ? "#ef4444" : "#22c55e" }}/>
          : <FiToggleLeft  size={26} className="sp-toff"/>}
      </button>
    </div>
  );
}

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
:root{
  --i50:#eef2ff;--i100:#e0e7ff;--i200:#c7d2fe;
  --i500:#6366f1;--i600:#4f46e5;--i700:#4338ca;--i900:#1e1b4b;
  --g50:#f9fafb;--g100:#f3f4f6;--g400:#9ca3af;--g500:#6b7280;
  --g700:#374151;--g800:#1f2937;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.sp-root{display:flex;min-height:100vh;font-family:'Outfit',sans-serif;background:var(--g50)}

/* Sidebar */
.sp-sidebar{width:260px;min-height:100vh;background:#fff;border-right:1px solid var(--i100);
  display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh}
.sp-sidebar-top{padding:24px 20px 20px;border-bottom:1px solid var(--g100)}
.sp-back{display:flex;align-items:center;gap:6px;background:none;border:none;color:var(--g500);
  font-size:12.5px;font-weight:500;font-family:'Outfit',sans-serif;cursor:pointer;
  padding:0;margin-bottom:18px;transition:color .15s}
.sp-back:hover{color:var(--i600)}
.sp-sidebar-title{display:flex;align-items:center;gap:12px}
.sp-sidebar-icon{width:40px;height:40px;background:var(--i600);border-radius:11px;
  display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.sp-sidebar-heading{font-size:15px;font-weight:700;color:var(--i900)}
.sp-sidebar-sub{font-size:11.5px;color:var(--g400);margin-top:1px}
.sp-nav{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:4px}
.sp-nav-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;
  border:none;background:transparent;color:var(--g500);font-size:13.5px;font-weight:500;
  font-family:'Outfit',sans-serif;cursor:pointer;transition:all .15s;text-align:left;width:100%}
.sp-nav-item:hover{background:var(--i50);color:var(--i600)}
.sp-nav-item--active{background:var(--i50);color:var(--i600);font-weight:600}
.sp-nav-arrow{margin-left:auto;opacity:.4}
.sp-nav-item--active .sp-nav-arrow{opacity:.8}
.sp-sidebar-footer{padding:16px 20px;border-top:1px solid var(--g100)}
.sp-profile{display:flex;align-items:center;gap:10px}
.sp-avatar{width:36px;height:36px;border-radius:10px;background:var(--i600);color:#fff;
  font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
.sp-profile-name{font-size:13px;font-weight:600;color:var(--g800)}
.sp-profile-role{font-size:11px;color:var(--g400)}

/* Main */
.sp-main{flex:1;padding:32px 36px;overflow-y:auto;position:relative}

/* Toast */
.sp-toast{position:fixed;top:24px;right:24px;z-index:200;display:flex;align-items:center;gap:8px;
  padding:12px 18px;border-radius:10px;font-size:13.5px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.12)}
.sp-toast--success{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
.sp-toast--danger{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}
.sp-toast--info{background:var(--i50);color:var(--i700);border:1px solid var(--i200)}

/* Section header */
.sp-sh{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:16px}
.sp-sh-title{font-size:22px;font-weight:800;color:var(--i900);letter-spacing:-.5px}
.sp-sh-desc{font-size:13.5px;color:var(--g500);margin-top:4px}

/* Boutons */
.sp-btn-primary{display:inline-flex;align-items:center;gap:7px;padding:10px 20px;
  background:var(--i600);color:#fff;border:none;border-radius:10px;font-size:13.5px;
  font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;
  box-shadow:0 4px 12px rgba(79,70,229,.25);transition:all .15s;white-space:nowrap}
.sp-btn-primary:hover:not(:disabled){background:var(--i700);transform:translateY(-1px)}
.sp-btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
.sp-btn-ghost{display:inline-flex;align-items:center;gap:7px;padding:10px 20px;
  background:transparent;color:var(--i600);border:1.5px solid var(--i200);border-radius:10px;
  font-size:13.5px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;
  transition:all .15s;white-space:nowrap}
.sp-btn-ghost:hover:not(:disabled){background:var(--i50)}
.sp-btn-ghost:disabled{opacity:.6;cursor:not-allowed}

/* Recherche */
.sp-search-wrap{position:relative;margin-bottom:20px}
.sp-search-ico{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--g400)}
.sp-search{width:100%;padding:10px 14px 10px 38px;border:1.5px solid #e5e7eb;border-radius:10px;
  font-size:13.5px;font-family:'Outfit',sans-serif;color:var(--g700);background:#fafafa;
  outline:none;transition:all .2s}
.sp-search:focus{border-color:var(--i400);box-shadow:0 0 0 3px rgba(99,102,241,.1);background:#fff}

/* Stats */
.sp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.sp-stat{background:#fff;border:1px solid var(--g100);border-radius:12px;
  padding:14px 16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.sp-stat-val{display:block;font-size:24px;font-weight:800;letter-spacing:-.5px}
.sp-stat-lbl{font-size:11.5px;color:var(--g500);font-weight:500}

/* Table */
.sp-table-wrap{background:#fff;border:1px solid var(--g100);border-radius:14px;overflow:hidden;
  box-shadow:0 1px 4px rgba(0,0,0,.04)}
.sp-table{width:100%;border-collapse:collapse}
.sp-table thead tr{background:var(--g50);border-bottom:1px solid var(--g100)}
.sp-table th{padding:12px 16px;font-size:11.5px;font-weight:600;color:var(--g500);
  text-align:left;letter-spacing:.4px;text-transform:uppercase}
.sp-table td{padding:13px 16px;font-size:13.5px;border-bottom:1px solid #f9fafb}
.sp-table tbody tr:last-child td{border-bottom:none}
.sp-table tbody tr:hover td{background:#fafbff}
.sp-ucell{display:flex;align-items:center;gap:10px}
.sp-uav{width:34px;height:34px;border-radius:9px;background:var(--i50);color:var(--i600);
  font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-transform:uppercase}
.sp-uname{font-size:13.5px;font-weight:600;color:var(--g800)}
.sp-uemail{font-size:11.5px;color:var(--g400)}
.sp-rbadge{padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:600}
.sp-muted{color:var(--g400);font-size:12.5px}
.sp-actions{display:flex;gap:6px}
.sp-abtn{width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;transition:all .15s}
.sp-abtn--edit{background:#f0f9ff;color:#0ea5e9}.sp-abtn--edit:hover{background:#e0f2fe}
.sp-abtn--del{background:#fef2f2;color:#ef4444}.sp-abtn--del:hover{background:#fee2e2}
.sp-toggle{background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;padding:2px}
.sp-ton{color:#22c55e}.sp-toff{color:#d1d5db}
.sp-tlbl{font-size:12px;font-weight:500}
.sp-tlbl--on{color:#16a34a}.sp-tlbl--off{color:var(--g400)}
.sp-loading{padding:40px;text-align:center;color:var(--g500);display:flex;
  align-items:center;justify-content:center;gap:10px;font-size:14px}
.sp-empty{padding:32px;text-align:center;color:var(--g400);font-size:14px}

/* Rôles */
.sp-roles-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:16px}
.sp-role-card{background:#fff;border:1px solid var(--g100);border-radius:14px;overflow:hidden;
  box-shadow:0 1px 4px rgba(0,0,0,.04)}
.sp-role-head{padding:20px;border-bottom:1px solid var(--g100)}
.sp-rbadge-lg{display:inline-block;padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:8px}
.sp-role-desc{font-size:12.5px;color:var(--g500);line-height:1.5}
.sp-role-perms{padding:16px 20px;display:flex;flex-direction:column;gap:10px}
.sp-perm-row{display:flex;align-items:center;gap:9px}
.sp-pdot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.sp-pdot--on{background:#22c55e}.sp-pdot--off{background:#e5e7eb}
.sp-plbl{font-size:12.5px;color:var(--g700);flex:1}
.sp-plbl--off{color:var(--g400)}
.sp-pstatus{font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}
.sp-pstatus--on{background:#f0fdf4;color:#16a34a}
.sp-pstatus--off{background:var(--g100);color:var(--g400)}
.sp-roles-note{font-size:12px;color:var(--g400);font-style:italic}

/* Config */
.sp-cfg-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.sp-cfg-card{background:#fff;border:1px solid var(--g100);border-radius:14px;padding:24px;
  box-shadow:0 1px 4px rgba(0,0,0,.04);display:flex;flex-direction:column;gap:16px}
.sp-cfg-card--full{grid-column:1/-1}
.sp-cfg-card--danger{border-color:#fecaca;background:#fff5f5}
.sp-cfg-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;
  color:var(--i900);padding-bottom:8px;border-bottom:1px solid var(--g100)}
.sp-field{display:flex;flex-direction:column;gap:5px}
.sp-field label{font-size:12px;font-weight:600;color:var(--g700);letter-spacing:.2px}
.sp-field input,.sp-field select{padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:9px;
  font-size:13.5px;font-family:'Outfit',sans-serif;color:var(--g700);
  background:#fafafa;outline:none;transition:all .2s}
.sp-field input:focus,.sp-field select:focus{border-color:var(--i400);
  box-shadow:0 0 0 3px rgba(99,102,241,.1);background:#fff}
.sp-trow{display:flex;align-items:center;justify-content:space-between;gap:12px}
.sp-trow-lbl{font-size:13.5px;font-weight:600;color:var(--g800)}
.sp-trow-desc{font-size:12px;color:var(--g500);margin-top:2px}

/* Logs */
.sp-log-filters{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}
.sp-log-filter{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;
  border:1.5px solid #e5e7eb;border-radius:999px;font-size:12.5px;font-weight:600;
  font-family:'Outfit',sans-serif;cursor:pointer;background:#fff;color:var(--g500);
  transition:all .15s}
.sp-log-filter:hover{border-color:var(--i400);color:var(--i600)}
.sp-log-filter--active{border-color:var(--i400);background:var(--i50);color:var(--i600)}
.sp-log-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.sp-logs-list{display:flex;flex-direction:column;gap:8px}
.sp-log-row{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--g100);
  border-radius:10px;padding:13px 16px;border-left-width:3px;box-shadow:0 1px 3px rgba(0,0,0,.03)}
.sp-log-dot2{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.sp-log-info{flex:1;display:flex;flex-direction:column;gap:2px}
.sp-log-action{font-size:13.5px;font-weight:600;color:var(--g800)}
.sp-log-user{font-size:11.5px;color:var(--g400);display:flex;align-items:center;gap:4px}
.sp-log-date{font-size:11.5px;color:var(--g400);white-space:nowrap}
.sp-log-badge{padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;white-space:nowrap}

/* Pagination */
.sp-pagination{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:20px}
.sp-pag-btn{padding:8px 18px;border:1.5px solid var(--i200);border-radius:8px;background:#fff;
  color:var(--i600);font-size:13px;font-weight:600;font-family:'Outfit',sans-serif;
  cursor:pointer;transition:all .15s}
.sp-pag-btn:hover:not(:disabled){background:var(--i50)}
.sp-pag-btn:disabled{opacity:.4;cursor:not-allowed}
.sp-pag-info{font-size:13px;font-weight:600;color:var(--g500)}

/* Modal */
.sp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:100;
  display:flex;align-items:center;justify-content:center;padding:16px}
.sp-modal{background:#fff;border-radius:18px;padding:32px;width:100%;max-width:460px;
  box-shadow:0 24px 64px rgba(0,0,0,.15)}
.sp-modal-title{font-size:18px;font-weight:800;color:var(--i900);margin-bottom:22px;letter-spacing:-.3px}
.sp-modal-form{display:flex;flex-direction:column;gap:14px}
.sp-modal-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sp-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;
  padding-top:18px;border-top:1px solid var(--g100)}

/* Spinner */
.sp-spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* Responsive */
@media(max-width:1024px){
  .sp-roles-grid{grid-template-columns:1fr}
  .sp-cfg-grid{grid-template-columns:1fr}.sp-cfg-card--full{grid-column:1}
  .sp-stats{grid-template-columns:1fr 1fr}
}
@media(max-width:768px){
  .sp-sidebar{display:none}.sp-main{padding:20px 16px}
  .sp-sh{flex-direction:column}
  .sp-table th:nth-child(4),.sp-table td:nth-child(4){display:none}
}
`;












































// // src/pages/superAdmin/SuperAdminSettings.jsx
// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiUsers, FiSettings, FiActivity, FiShield, FiSave,
//   FiPlus, FiEdit2, FiTrash2, FiSearch, FiToggleLeft,
//   FiToggleRight, FiAlertCircle, FiCheckCircle, FiChevronRight,
//   FiLock, FiGlobe, FiBell, FiDatabase, FiUser, FiMail,
//   FiMoreVertical, FiArrowLeft
// } from "react-icons/fi";
// import { useNavigate } from "react-router-dom";

// /* ── données mock ── */
// const MOCK_USERS = [
//   { id: 1, nom: "Dupont", prenom: "Marie",   email: "marie@vote.cm",   role: "ADMIN_ELECTION", actif: true,  created: "12 jan. 2025" },
//   { id: 2, nom: "Kamga",  prenom: "Paul",    email: "paul@vote.cm",    role: "ELECTEUR",       actif: true,  created: "15 jan. 2025" },
//   { id: 3, nom: "Bello",  prenom: "Aïcha",   email: "aicha@vote.cm",   role: "ADMIN_ELECTION", actif: false, created: "20 jan. 2025" },
//   { id: 4, nom: "Ngo",    prenom: "Simon",   email: "simon@vote.cm",   role: "ELECTEUR",       actif: true,  created: "22 jan. 2025" },
//   { id: 5, nom: "Fouda",  prenom: "Carine",  email: "carine@vote.cm",  role: "ELECTEUR",       actif: true,  created: "28 jan. 2025" },
// ];

// const MOCK_LOGS = [
//   { id: 1, action: "Connexion réussie",        user: "marie@vote.cm",   date: "16 mars 2025, 09:14", type: "info" },
//   { id: 2, action: "Élection créée",           user: "paul@vote.cm",    date: "16 mars 2025, 10:02", type: "success" },
//   { id: 3, action: "Tentative de connexion",   user: "inconnu@x.com",   date: "16 mars 2025, 11:30", type: "warning" },
//   { id: 4, action: "Utilisateur désactivé",    user: "aicha@vote.cm",   date: "15 mars 2025, 14:55", type: "danger" },
//   { id: 5, action: "Résultats publiés",        user: "marie@vote.cm",   date: "15 mars 2025, 17:20", type: "success" },
//   { id: 6, action: "Connexion réussie",        user: "simon@vote.cm",   date: "14 mars 2025, 08:45", type: "info" },
// ];

// const ROLES = ["SUPER_ADMIN", "ADMIN_ELECTION", "ELECTEUR"];

// const ROLE_COLORS = {
//   SUPER_ADMIN:    { bg: "#eef2ff", color: "#4f46e5", label: "Super Admin" },
//   ADMIN_ELECTION: { bg: "#f0f9ff", color: "#0ea5e9", label: "Admin Élection" },
//   ELECTEUR:       { bg: "#f0fdf4", color: "#16a34a", label: "Électeur" },
// };

// const LOG_COLORS = {
//   info:    { bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
//   success: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
//   warning: { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b" },
//   danger:  { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
// };

// const SECTIONS = [
//   { id: "users",    label: "Utilisateurs",   icon: FiUsers },
//   { id: "roles",    label: "Rôles & Permissions", icon: FiShield },
//   { id: "platform", label: "Plateforme",     icon: FiSettings },
//   { id: "logs",     label: "Logs & Activité", icon: FiActivity },
// ];

// export default function SuperAdminSettings() {
//   const navigate = useNavigate();
//   const [activeSection, setActiveSection] = useState("users");
//   const [users, setUsers]       = useState(MOCK_USERS);
//   const [search, setSearch]     = useState("");
//   const [toast, setToast]       = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [editUser, setEditUser]  = useState(null);

//   /* config plateforme */
//   const [config, setConfig] = useState({
//     nomPlateforme: "VoteSecure",
//     urlFrontend:   "https://votesecure.cm",
//     emailSupport:  "support@votesecure.cm",
//     votesMultiples: false,
//     inscriptionOuverte: true,
//     maintenance: false,
//     dureeSession: "24",
//   });

//   const showToast = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast(null), 3000);
//   };

//   const toggleUser = (id) => {
//     setUsers(u => u.map(x => x.id === id ? { ...x, actif: !x.actif } : x));
//     showToast("Statut mis à jour.");
//   };

//   const deleteUser = (id) => {
//     setUsers(u => u.filter(x => x.id !== id));
//     showToast("Utilisateur supprimé.", "danger");
//   };

//   const handleSaveConfig = () => showToast("Configuration sauvegardée !");

//   const filteredUsers = users.filter(u =>
//     `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <>
//       <style>{styles}</style>
//       <div className="sp-root">

//         {/* ── SIDEBAR ── */}
//         <aside className="sp-sidebar">
//           <div className="sp-sidebar-top">
//             <button className="sp-back" onClick={() => navigate("/superAdminDashboard")}>
//               <FiArrowLeft size={15} /> Tableau de bord
//             </button>
//             <div className="sp-sidebar-title">
//               <div className="sp-sidebar-icon"><FiSettings size={18} /></div>
//               <div>
//                 <div className="sp-sidebar-heading">Paramètres</div>
//                 <div className="sp-sidebar-sub">Super Administrateur</div>
//               </div>
//             </div>
//           </div>

//           <nav className="sp-nav">
//             {SECTIONS.map(s => (
//               <button
//                 key={s.id}
//                 className={`sp-nav-item ${activeSection === s.id ? "sp-nav-item--active" : ""}`}
//                 onClick={() => setActiveSection(s.id)}
//               >
//                 <s.icon size={17} />
//                 <span>{s.label}</span>
//                 <FiChevronRight size={13} className="sp-nav-arrow" />
//               </button>
//             ))}
//           </nav>

//           <div className="sp-sidebar-footer">
//             <div className="sp-profile">
//               <div className="sp-avatar">SA</div>
//               <div>
//                 <div className="sp-profile-name">Super Admin</div>
//                 <div className="sp-profile-role">Accès total</div>
//               </div>
//             </div>
//           </div>
//         </aside>

//         {/* ── CONTENU ── */}
//         <main className="sp-main">

//           {/* Toast */}
//           <AnimatePresence>
//             {toast && (
//               <motion.div
//                 key="toast"
//                 initial={{ opacity: 0, y: -16 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -16 }}
//                 className={`sp-toast sp-toast--${toast.type}`}
//               >
//                 {toast.type === "danger" ? <FiAlertCircle size={15} /> : <FiCheckCircle size={15} />}
//                 {toast.msg}
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* ════ UTILISATEURS ════ */}
//           {activeSection === "users" && (
//             <motion.div key="users" {...fadeIn}>
//               <div className="sp-section-header">
//                 <div>
//                   <h1 className="sp-section-title">Gestion des utilisateurs</h1>
//                   <p className="sp-section-desc">Créez, modifiez et gérez tous les comptes de la plateforme.</p>
//                 </div>
//                 <button className="sp-btn-primary" onClick={() => { setEditUser(null); setShowModal(true); }}>
//                   <FiPlus size={15} /> Nouvel utilisateur
//                 </button>
//               </div>

//               {/* Barre recherche */}
//               <div className="sp-search-wrap">
//                 <FiSearch size={15} className="sp-search-icon" />
//                 <input
//                   className="sp-search"
//                   placeholder="Rechercher un utilisateur…"
//                   value={search}
//                   onChange={e => setSearch(e.target.value)}
//                 />
//               </div>

//               {/* Stats rapides */}
//               <div className="sp-stats-row">
//                 {[
//                   { label: "Total",    val: users.length,                color: "#4f46e5" },
//                   { label: "Actifs",   val: users.filter(u => u.actif).length,  color: "#16a34a" },
//                   { label: "Inactifs", val: users.filter(u => !u.actif).length, color: "#ef4444" },
//                   { label: "Admins",   val: users.filter(u => u.role === "ADMIN_ELECTION").length, color: "#0ea5e9" },
//                 ].map((s, i) => (
//                   <div key={i} className="sp-stat-card">
//                     <span className="sp-stat-val" style={{ color: s.color }}>{s.val}</span>
//                     <span className="sp-stat-lbl">{s.label}</span>
//                   </div>
//                 ))}
//               </div>

//               {/* Table */}
//               <div className="sp-table-wrap">
//                 <table className="sp-table">
//                   <thead>
//                     <tr>
//                       <th>Utilisateur</th>
//                       <th>Rôle</th>
//                       <th>Statut</th>
//                       <th>Créé le</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredUsers.map(u => (
//                       <tr key={u.id}>
//                         <td>
//                           <div className="sp-user-cell">
//                             <div className="sp-user-avatar">{u.prenom[0]}{u.nom[0]}</div>
//                             <div>
//                               <div className="sp-user-name">{u.prenom} {u.nom}</div>
//                               <div className="sp-user-email">{u.email}</div>
//                             </div>
//                           </div>
//                         </td>
//                         <td>
//                           <span className="sp-role-badge" style={{
//                             background: ROLE_COLORS[u.role].bg,
//                             color:      ROLE_COLORS[u.role].color,
//                           }}>
//                             {ROLE_COLORS[u.role].label}
//                           </span>
//                         </td>
//                         <td>
//                           <button className="sp-toggle" onClick={() => toggleUser(u.id)}>
//                             {u.actif
//                               ? <><FiToggleRight size={20} className="sp-toggle-on"  /> <span className="sp-toggle-label sp-toggle-label--on">Actif</span></>
//                               : <><FiToggleLeft  size={20} className="sp-toggle-off" /> <span className="sp-toggle-label sp-toggle-label--off">Inactif</span></>
//                             }
//                           </button>
//                         </td>
//                         <td className="sp-td-muted">{u.created}</td>
//                         <td>
//                           <div className="sp-actions">
//                             <button className="sp-action-btn sp-action-btn--edit" onClick={() => { setEditUser(u); setShowModal(true); }}>
//                               <FiEdit2 size={14} />
//                             </button>
//                             <button className="sp-action-btn sp-action-btn--delete" onClick={() => deleteUser(u.id)}>
//                               <FiTrash2 size={14} />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//                 {filteredUsers.length === 0 && (
//                   <div className="sp-empty">Aucun utilisateur trouvé.</div>
//                 )}
//               </div>
//             </motion.div>
//           )}

//           {/* ════ RÔLES & PERMISSIONS ════ */}
//           {activeSection === "roles" && (
//             <motion.div key="roles" {...fadeIn}>
//               <div className="sp-section-header">
//                 <div>
//                   <h1 className="sp-section-title">Rôles & Permissions</h1>
//                   <p className="sp-section-desc">Définissez les droits de chaque rôle sur la plateforme.</p>
//                 </div>
//               </div>

//               <div className="sp-roles-grid">
//                 {[
//                   {
//                     role: "SUPER_ADMIN", label: "Super Administrateur",
//                     desc: "Accès complet à toutes les fonctionnalités.",
//                     perms: [
//                       { label: "Gérer les utilisateurs",    on: true },
//                       { label: "Gérer les élections",       on: true },
//                       { label: "Voir les logs système",     on: true },
//                       { label: "Modifier la configuration", on: true },
//                       { label: "Exporter les données",      on: true },
//                     ],
//                   },
//                   {
//                     role: "ADMIN_ELECTION", label: "Admin d'Élection",
//                     desc: "Crée et gère ses propres élections.",
//                     perms: [
//                       { label: "Créer une élection",        on: true },
//                       { label: "Gérer ses électeurs",       on: true },
//                       { label: "Voir les résultats",        on: true },
//                       { label: "Gérer les utilisateurs",    on: false },
//                       { label: "Accès aux logs système",    on: false },
//                     ],
//                   },
//                   {
//                     role: "ELECTEUR", label: "Électeur",
//                     desc: "Participe aux élections auxquelles il est inscrit.",
//                     perms: [
//                       { label: "Voter",                     on: true },
//                       { label: "Voir les résultats",        on: true },
//                       { label: "Modifier son profil",       on: true },
//                       { label: "Créer une élection",        on: false },
//                       { label: "Accès aux logs système",    on: false },
//                     ],
//                   },
//                 ].map(r => (
//                   <div key={r.role} className="sp-role-card">
//                     <div className="sp-role-card-header">
//                       <span className="sp-role-badge-lg" style={{
//                         background: ROLE_COLORS[r.role].bg,
//                         color:      ROLE_COLORS[r.role].color,
//                       }}>
//                         {r.label}
//                       </span>
//                       <p className="sp-role-desc">{r.desc}</p>
//                     </div>
//                     <div className="sp-role-perms">
//                       {r.perms.map((p, i) => (
//                         <div key={i} className="sp-perm-row">
//                           <span className={`sp-perm-dot ${p.on ? "sp-perm-dot--on" : "sp-perm-dot--off"}`} />
//                           <span className={`sp-perm-label ${p.on ? "" : "sp-perm-label--off"}`}>{p.label}</span>
//                           <span className={`sp-perm-status ${p.on ? "sp-perm-status--on" : "sp-perm-status--off"}`}>
//                             {p.on ? "Autorisé" : "Refusé"}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <p className="sp-roles-note">
//                 * La modification des permissions nécessite un redéploiement. Contactez le développeur.
//               </p>
//             </motion.div>
//           )}

//           {/* ════ CONFIGURATION PLATEFORME ════ */}
//           {activeSection === "platform" && (
//             <motion.div key="platform" {...fadeIn}>
//               <div className="sp-section-header">
//                 <div>
//                   <h1 className="sp-section-title">Configuration de la plateforme</h1>
//                   <p className="sp-section-desc">Paramètres généraux et comportement global de VoteSecure.</p>
//                 </div>
//                 <button className="sp-btn-primary" onClick={handleSaveConfig}>
//                   <FiSave size={15} /> Sauvegarder
//                 </button>
//               </div>

//               <div className="sp-config-grid">

//                 {/* Identité */}
//                 <div className="sp-config-card">
//                   <div className="sp-config-card-title"><FiGlobe size={16} /> Identité de la plateforme</div>
//                   <div className="sp-field">
//                     <label>Nom de la plateforme</label>
//                     <input value={config.nomPlateforme} onChange={e => setConfig({...config, nomPlateforme: e.target.value})} />
//                   </div>
//                   <div className="sp-field">
//                     <label>URL frontend</label>
//                     <input value={config.urlFrontend} onChange={e => setConfig({...config, urlFrontend: e.target.value})} />
//                   </div>
//                   <div className="sp-field">
//                     <label>Email de support</label>
//                     <input value={config.emailSupport} onChange={e => setConfig({...config, emailSupport: e.target.value})} />
//                   </div>
//                 </div>

//                 {/* Sécurité */}
//                 <div className="sp-config-card">
//                   <div className="sp-config-card-title"><FiLock size={16} /> Sécurité & Sessions</div>
//                   <div className="sp-field">
//                     <label>Durée de session (heures)</label>
//                     <input type="number" min="1" max="72" value={config.dureeSession}
//                       onChange={e => setConfig({...config, dureeSession: e.target.value})} />
//                   </div>
//                   <div className="sp-toggle-row">
//                     <div>
//                       <div className="sp-toggle-row-label">Inscription ouverte</div>
//                       <div className="sp-toggle-row-desc">Permettre l'auto-inscription des électeurs</div>
//                     </div>
//                     <button className="sp-toggle" onClick={() => setConfig({...config, inscriptionOuverte: !config.inscriptionOuverte})}>
//                       {config.inscriptionOuverte
//                         ? <FiToggleRight size={26} className="sp-toggle-on" />
//                         : <FiToggleLeft  size={26} className="sp-toggle-off" />}
//                     </button>
//                   </div>
//                   <div className="sp-toggle-row">
//                     <div>
//                       <div className="sp-toggle-row-label">Votes multiples</div>
//                       <div className="sp-toggle-row-desc">Autoriser plusieurs votes par électeur</div>
//                     </div>
//                     <button className="sp-toggle" onClick={() => setConfig({...config, votesMultiples: !config.votesMultiples})}>
//                       {config.votesMultiples
//                         ? <FiToggleRight size={26} className="sp-toggle-on" />
//                         : <FiToggleLeft  size={26} className="sp-toggle-off" />}
//                     </button>
//                   </div>
//                 </div>

//                 {/* Mode maintenance */}
//                 <div className={`sp-config-card sp-config-card--full ${config.maintenance ? "sp-config-card--danger" : ""}`}>
//                   <div className="sp-config-card-title"><FiDatabase size={16} /> Mode maintenance</div>
//                   <div className="sp-maintenance-row">
//                     <div>
//                       <div className="sp-toggle-row-label">Activer le mode maintenance</div>
//                       <div className="sp-toggle-row-desc">
//                         {config.maintenance
//                           ? "⚠️ La plateforme est actuellement inaccessible aux utilisateurs."
//                           : "La plateforme est accessible normalement."}
//                       </div>
//                     </div>
//                     <button className="sp-toggle" onClick={() => setConfig({...config, maintenance: !config.maintenance})}>
//                       {config.maintenance
//                         ? <FiToggleRight size={26} className="sp-toggle-on" style={{ color: "#ef4444" }} />
//                         : <FiToggleLeft  size={26} className="sp-toggle-off" />}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {/* ════ LOGS ════ */}
//           {activeSection === "logs" && (
//             <motion.div key="logs" {...fadeIn}>
//               <div className="sp-section-header">
//                 <div>
//                   <h1 className="sp-section-title">Logs & Activité système</h1>
//                   <p className="sp-section-desc">Historique des actions effectuées sur la plateforme.</p>
//                 </div>
//                 <button className="sp-btn-ghost" onClick={() => showToast("Export CSV lancé.")}>
//                   Exporter CSV
//                 </button>
//               </div>

//               {/* Légende */}
//               <div className="sp-logs-legend">
//                 {Object.entries(LOG_COLORS).map(([k, v]) => (
//                   <span key={k} className="sp-legend-item">
//                     <span className="sp-legend-dot" style={{ background: v.dot }} />
//                     {{ info: "Info", success: "Succès", warning: "Alerte", danger: "Critique" }[k]}
//                   </span>
//                 ))}
//               </div>

//               <div className="sp-logs-list">
//                 {MOCK_LOGS.map(l => (
//                   <div key={l.id} className="sp-log-row" style={{ borderLeftColor: LOG_COLORS[l.type].dot }}>
//                     <span className="sp-log-dot" style={{ background: LOG_COLORS[l.type].dot }} />
//                     <div className="sp-log-info">
//                       <span className="sp-log-action">{l.action}</span>
//                       <span className="sp-log-user"><FiUser size={11} /> {l.user}</span>
//                     </div>
//                     <span className="sp-log-date">{l.date}</span>
//                     <span className="sp-log-badge" style={{
//                       background: LOG_COLORS[l.type].bg,
//                       color:      LOG_COLORS[l.type].color,
//                     }}>
//                       {{ info: "Info", success: "Succès", warning: "Alerte", danger: "Critique" }[l.type]}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>
//           )}
//         </main>

//         {/* ── MODAL UTILISATEUR ── */}
//         <AnimatePresence>
//           {showModal && (
//             <motion.div className="sp-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//               onClick={() => setShowModal(false)}>
//               <motion.div className="sp-modal" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
//                 exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
//                 <h3 className="sp-modal-title">{editUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h3>
//                 <div className="sp-modal-form">
//                   <div className="sp-modal-row">
//                     <div className="sp-field">
//                       <label>Prénom</label>
//                       <input defaultValue={editUser?.prenom} placeholder="Prénom" />
//                     </div>
//                     <div className="sp-field">
//                       <label>Nom</label>
//                       <input defaultValue={editUser?.nom} placeholder="Nom" />
//                     </div>
//                   </div>
//                   <div className="sp-field">
//                     <label>Adresse e-mail</label>
//                     <input type="email" defaultValue={editUser?.email} placeholder="email@exemple.com" />
//                   </div>
//                   {!editUser && (
//                     <div className="sp-field">
//                       <label>Mot de passe</label>
//                       <input type="password" placeholder="••••••••" />
//                     </div>
//                   )}
//                   <div className="sp-field">
//                     <label>Rôle</label>
//                     <select defaultValue={editUser?.role || "ELECTEUR"}>
//                       {ROLES.map(r => <option key={r} value={r}>{ROLE_COLORS[r].label}</option>)}
//                     </select>
//                   </div>
//                 </div>
//                 <div className="sp-modal-actions">
//                   <button className="sp-btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
//                   <button className="sp-btn-primary" onClick={() => { setShowModal(false); showToast(editUser ? "Utilisateur modifié." : "Utilisateur créé."); }}>
//                     <FiSave size={14} /> {editUser ? "Enregistrer" : "Créer"}
//                   </button>
//                 </div>
//               </motion.div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </>
//   );
// }

// const fadeIn = {
//   initial: { opacity: 0, y: 16 },
//   animate: { opacity: 1, y: 0 },
//   transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
// };

// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
//   :root {
//     --indigo-50:#eef2ff;--indigo-100:#e0e7ff;--indigo-200:#c7d2fe;
//     --indigo-500:#6366f1;--indigo-600:#4f46e5;--indigo-700:#4338ca;--indigo-900:#1e1b4b;
//     --gray-50:#f9fafb;--gray-100:#f3f4f6;--gray-400:#9ca3af;--gray-500:#6b7280;
//     --gray-700:#374151;--gray-800:#1f2937;--white:#fff;
//   }
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
//   .sp-root{display:flex;min-height:100vh;font-family:'Outfit',sans-serif;background:var(--gray-50)}

//   /* SIDEBAR */
//   .sp-sidebar{width:260px;min-height:100vh;background:var(--white);border-right:1px solid var(--indigo-100);
//     display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh}
//   .sp-sidebar-top{padding:24px 20px 20px;border-bottom:1px solid var(--gray-100)}
//   .sp-back{display:flex;align-items:center;gap:6px;background:none;border:none;
//     color:var(--gray-500);font-size:12.5px;font-weight:500;font-family:'Outfit',sans-serif;
//     cursor:pointer;padding:0;margin-bottom:18px;transition:color .15s}
//   .sp-back:hover{color:var(--indigo-600)}
//   .sp-sidebar-title{display:flex;align-items:center;gap:12px}
//   .sp-sidebar-icon{width:40px;height:40px;background:var(--indigo-600);border-radius:11px;
//     display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0}
//   .sp-sidebar-heading{font-size:15px;font-weight:700;color:var(--indigo-900)}
//   .sp-sidebar-sub{font-size:11.5px;color:var(--gray-400);margin-top:1px}
//   .sp-nav{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:4px}
//   .sp-nav-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;
//     border:none;background:transparent;color:var(--gray-500);font-size:13.5px;font-weight:500;
//     font-family:'Outfit',sans-serif;cursor:pointer;transition:all .15s;text-align:left;width:100%}
//   .sp-nav-item:hover{background:var(--indigo-50);color:var(--indigo-600)}
//   .sp-nav-item--active{background:var(--indigo-50);color:var(--indigo-600);font-weight:600}
//   .sp-nav-arrow{margin-left:auto;opacity:.4}
//   .sp-nav-item--active .sp-nav-arrow{opacity:.8}
//   .sp-sidebar-footer{padding:16px 20px;border-top:1px solid var(--gray-100)}
//   .sp-profile{display:flex;align-items:center;gap:10px}
//   .sp-avatar{width:36px;height:36px;border-radius:10px;background:var(--indigo-600);
//     color:white;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
//   .sp-profile-name{font-size:13px;font-weight:600;color:var(--gray-800)}
//   .sp-profile-role{font-size:11px;color:var(--gray-400)}

//   /* MAIN */
//   .sp-main{flex:1;padding:32px 36px;overflow-y:auto;position:relative}

//   /* Toast */
//   .sp-toast{position:fixed;top:24px;right:24px;z-index:200;display:flex;align-items:center;gap:8px;
//     padding:12px 18px;border-radius:10px;font-size:13.5px;font-weight:600;
//     box-shadow:0 8px 24px rgba(0,0,0,0.12)}
//   .sp-toast--success{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
//   .sp-toast--danger{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}
//   .sp-toast--info{background:var(--indigo-50);color:var(--indigo-700);border:1px solid var(--indigo-200)}

//   /* Section header */
//   .sp-section-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:16px}
//   .sp-section-title{font-size:22px;font-weight:800;color:var(--indigo-900);letter-spacing:-.5px}
//   .sp-section-desc{font-size:13.5px;color:var(--gray-500);margin-top:4px}

//   /* Boutons */
//   .sp-btn-primary{display:inline-flex;align-items:center;gap:7px;padding:10px 20px;
//     background:var(--indigo-600);color:white;border:none;border-radius:10px;
//     font-size:13.5px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;
//     box-shadow:0 4px 12px rgba(79,70,229,0.25);transition:all .15s;white-space:nowrap}
//   .sp-btn-primary:hover{background:var(--indigo-700);transform:translateY(-1px)}
//   .sp-btn-ghost{display:inline-flex;align-items:center;gap:7px;padding:10px 20px;
//     background:transparent;color:var(--indigo-600);border:1.5px solid var(--indigo-200);
//     border-radius:10px;font-size:13.5px;font-weight:600;font-family:'Outfit',sans-serif;
//     cursor:pointer;transition:all .15s;white-space:nowrap}
//   .sp-btn-ghost:hover{background:var(--indigo-50)}

//   /* Recherche */
//   .sp-search-wrap{position:relative;margin-bottom:20px}
//   .sp-search-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--gray-400)}
//   .sp-search{width:100%;padding:10px 14px 10px 38px;border:1.5px solid #e5e7eb;border-radius:10px;
//     font-size:13.5px;font-family:'Outfit',sans-serif;color:var(--gray-700);background:#fafafa;
//     outline:none;transition:all .2s}
//   .sp-search:focus{border-color:var(--indigo-400);box-shadow:0 0 0 3px rgba(99,102,241,0.10);background:white}

//   /* Stats rapides */
//   .sp-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
//   .sp-stat-card{background:white;border:1px solid var(--gray-100);border-radius:12px;
//     padding:14px 16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
//   .sp-stat-val{display:block;font-size:24px;font-weight:800;letter-spacing:-.5px}
//   .sp-stat-lbl{font-size:11.5px;color:var(--gray-500);font-weight:500}

//   /* Table */
//   .sp-table-wrap{background:white;border:1px solid var(--gray-100);border-radius:14px;overflow:hidden;
//     box-shadow:0 1px 4px rgba(0,0,0,0.04)}
//   .sp-table{width:100%;border-collapse:collapse}
//   .sp-table thead tr{background:var(--gray-50);border-bottom:1px solid var(--gray-100)}
//   .sp-table th{padding:12px 16px;font-size:11.5px;font-weight:600;color:var(--gray-500);
//     text-align:left;letter-spacing:.4px;text-transform:uppercase}
//   .sp-table td{padding:13px 16px;font-size:13.5px;border-bottom:1px solid #f9fafb}
//   .sp-table tbody tr:last-child td{border-bottom:none}
//   .sp-table tbody tr:hover td{background:#fafbff}
//   .sp-user-cell{display:flex;align-items:center;gap:10px}
//   .sp-user-avatar{width:34px;height:34px;border-radius:9px;background:var(--indigo-50);
//     color:var(--indigo-600);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
//   .sp-user-name{font-size:13.5px;font-weight:600;color:var(--gray-800)}
//   .sp-user-email{font-size:11.5px;color:var(--gray-400)}
//   .sp-role-badge{padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:600}
//   .sp-td-muted{color:var(--gray-400);font-size:12.5px}
//   .sp-actions{display:flex;gap:6px}
//   .sp-action-btn{width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;
//     display:flex;align-items:center;justify-content:center;transition:all .15s}
//   .sp-action-btn--edit{background:#f0f9ff;color:#0ea5e9}.sp-action-btn--edit:hover{background:#e0f2fe}
//   .sp-action-btn--delete{background:#fef2f2;color:#ef4444}.sp-action-btn--delete:hover{background:#fee2e2}
//   .sp-toggle{background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;padding:2px}
//   .sp-toggle-on{color:#22c55e}.sp-toggle-off{color:var(--gray-300)}
//   .sp-toggle-label{font-size:12px;font-weight:500}
//   .sp-toggle-label--on{color:#16a34a}.sp-toggle-label--off{color:var(--gray-400)}
//   .sp-empty{padding:32px;text-align:center;color:var(--gray-400);font-size:14px}

//   /* Rôles */
//   .sp-roles-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:16px}
//   .sp-role-card{background:white;border:1px solid var(--gray-100);border-radius:14px;
//     overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
//   .sp-role-card-header{padding:20px;border-bottom:1px solid var(--gray-100)}
//   .sp-role-badge-lg{display:inline-block;padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:8px}
//   .sp-role-desc{font-size:12.5px;color:var(--gray-500);line-height:1.5}
//   .sp-role-perms{padding:16px 20px;display:flex;flex-direction:column;gap:10px}
//   .sp-perm-row{display:flex;align-items:center;gap:9px}
//   .sp-perm-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
//   .sp-perm-dot--on{background:#22c55e}.sp-perm-dot--off{background:#e5e7eb}
//   .sp-perm-label{font-size:12.5px;color:var(--gray-700);flex:1}
//   .sp-perm-label--off{color:var(--gray-400)}
//   .sp-perm-status{font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}
//   .sp-perm-status--on{background:#f0fdf4;color:#16a34a}
//   .sp-perm-status--off{background:var(--gray-100);color:var(--gray-400)}
//   .sp-roles-note{font-size:12px;color:var(--gray-400);font-style:italic}

//   /* Config */
//   .sp-config-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
//   .sp-config-card{background:white;border:1px solid var(--gray-100);border-radius:14px;
//     padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.04);display:flex;flex-direction:column;gap:16px}
//   .sp-config-card--full{grid-column:1/-1}
//   .sp-config-card--danger{border-color:#fecaca;background:#fff5f5}
//   .sp-config-card-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;
//     color:var(--indigo-900);padding-bottom:8px;border-bottom:1px solid var(--gray-100)}
//   .sp-field{display:flex;flex-direction:column;gap:5px}
//   .sp-field label{font-size:12px;font-weight:600;color:var(--gray-700);letter-spacing:.2px}
//   .sp-field input,.sp-field select{padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:9px;
//     font-size:13.5px;font-family:'Outfit',sans-serif;color:var(--gray-700);
//     background:#fafafa;outline:none;transition:all .2s}
//   .sp-field input:focus,.sp-field select:focus{border-color:var(--indigo-400);
//     box-shadow:0 0 0 3px rgba(99,102,241,0.10);background:white}
//   .sp-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
//   .sp-maintenance-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
//   .sp-toggle-row-label{font-size:13.5px;font-weight:600;color:var(--gray-800)}
//   .sp-toggle-row-desc{font-size:12px;color:var(--gray-500);margin-top:2px}

//   /* Logs */
//   .sp-logs-legend{display:flex;gap:16px;margin-bottom:18px;flex-wrap:wrap}
//   .sp-legend-item{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--gray-600);font-weight:500}
//   .sp-legend-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
//   .sp-logs-list{display:flex;flex-direction:column;gap:8px}
//   .sp-log-row{display:flex;align-items:center;gap:12px;background:white;border:1px solid var(--gray-100);
//     border-radius:10px;padding:13px 16px;border-left-width:3px;
//     box-shadow:0 1px 3px rgba(0,0,0,0.03)}
//   .sp-log-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
//   .sp-log-info{flex:1;display:flex;flex-direction:column;gap:2px}
//   .sp-log-action{font-size:13.5px;font-weight:600;color:var(--gray-800)}
//   .sp-log-user{font-size:11.5px;color:var(--gray-400);display:flex;align-items:center;gap:4px}
//   .sp-log-date{font-size:11.5px;color:var(--gray-400);white-space:nowrap}
//   .sp-log-badge{padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;white-space:nowrap}

//   /* Modal */
//   .sp-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:100;
//     display:flex;align-items:center;justify-content:center;padding:16px}
//   .sp-modal{background:white;border-radius:18px;padding:32px;width:100%;max-width:460px;
//     box-shadow:0 24px 64px rgba(0,0,0,0.15)}
//   .sp-modal-title{font-size:18px;font-weight:800;color:var(--indigo-900);margin-bottom:22px;letter-spacing:-.3px}
//   .sp-modal-form{display:flex;flex-direction:column;gap:14px}
//   .sp-modal-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
//   .sp-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;padding-top:18px;border-top:1px solid var(--gray-100)}

//   /* Responsive */
//   @media(max-width:1024px){
//     .sp-roles-grid{grid-template-columns:1fr}
//     .sp-config-grid{grid-template-columns:1fr}
//     .sp-config-card--full{grid-column:1}
//     .sp-stats-row{grid-template-columns:1fr 1fr}
//   }
//   @media(max-width:768px){
//     .sp-sidebar{display:none}
//     .sp-main{padding:20px 16px}
//     .sp-section-header{flex-direction:column}
//     .sp-table th:nth-child(4),.sp-table td:nth-child(4){display:none}
//   }
// `;
