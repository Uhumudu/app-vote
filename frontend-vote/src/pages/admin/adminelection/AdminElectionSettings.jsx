// src/pages/adminElection/AdminElectionSettings.jsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiMail, FiLock, FiBell, FiSave, FiChevronRight,
  FiArrowLeft, FiSettings, FiCheckCircle, FiAlertCircle,
  FiEye, FiEyeOff, FiSmartphone, FiToggleLeft, FiToggleRight,
  FiRefreshCw
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

// ─── Config API ───────────────────────────────────────────────────────────────
const BASE = "http://localhost:5000/api/admin-election/settings";

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
  { id: "profil",        label: "Profil personnel",  icon: FiUser  },
  { id: "notifications", label: "Notifications",      icon: FiBell  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminElectionSettings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("profil");
  const [toast, setToast] = useState(null);

  // Profil
  const [profil,     setProfil]     = useState({ prenom: "", nom: "", email: "" });
  const [profilInit, setProfilInit] = useState(true);
  const [profilBusy, setProfilBusy] = useState(false);
  const [focused,    setFocused]    = useState(null);

  // Mot de passe
  const [pw,         setPw]         = useState({ ancien: "", nouveau: "", confirm: "" });
  const [showOldPw,  setShowOldPw]  = useState(false);
  const [showNewPw,  setShowNewPw]  = useState(false);
  const [showConfPw, setShowConfPw] = useState(false);
  const [pwError,    setPwError]    = useState("");
  const [pwBusy,     setPwBusy]     = useState(false);

  // Notifications
  const [notifs,      setNotifs]      = useState({
    email_vote: true, email_resultats: true, email_rappel: false,
    email_securite: true, push_vote: false, push_resultats: true,
  });
  const [notifsInit,  setNotifsInit]  = useState(true);
  const [notifsBusy,  setNotifsBusy]  = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Chargement profil ──────────────────────────────────
  useEffect(() => {
    setProfilInit(true);
    apiFetch("/profil")
      .then(d => setProfil({ prenom: d.prenom || "", nom: d.nom || "", email: d.email || "" }))
      .catch(e => showToast(e.message, "danger"))
      .finally(() => setProfilInit(false));
  }, [showToast]);

  // ── Chargement notifications ───────────────────────────
  useEffect(() => {
    if (activeSection !== "notifications") return;
    setNotifsInit(true);
    apiFetch("/notifications")
      .then(d => setNotifs(d))
      .catch(e => showToast(e.message, "danger"))
      .finally(() => setNotifsInit(false));
  }, [activeSection, showToast]);

  // ── Actions ────────────────────────────────────────────
  const saveProfil = async () => {
    if (!profil.prenom.trim() || !profil.nom.trim() || !profil.email.trim()) {
      showToast("Prénom, nom et email sont obligatoires.", "danger"); return;
    }
    setProfilBusy(true);
    try {
      await apiFetch("/profil", { method: "PUT", body: JSON.stringify(profil) });
      showToast("Profil mis à jour avec succès !");
    } catch (e) { showToast(e.message, "danger"); }
    finally { setProfilBusy(false); }
  };

  const changePassword = async () => {
    setPwError("");
    if (!pw.ancien)              { setPwError("Saisissez votre mot de passe actuel."); return; }
    if (pw.nouveau.length < 8)   { setPwError("Au moins 8 caractères requis."); return; }
    if (pw.nouveau !== pw.confirm){ setPwError("Les mots de passe ne correspondent pas."); return; }
    setPwBusy(true);
    try {
      await apiFetch("/password", { method: "PUT", body: JSON.stringify(pw) });
      setPw({ ancien: "", nouveau: "", confirm: "" });
      showToast("Mot de passe modifié avec succès !");
    } catch (e) { setPwError(e.message); }
    finally { setPwBusy(false); }
  };

  const saveNotifs = async () => {
    setNotifsBusy(true);
    try {
      await apiFetch("/notifications", { method: "PUT", body: JSON.stringify(notifs) });
      showToast("Préférences de notification sauvegardées !");
    } catch (e) { showToast(e.message, "danger"); }
    finally { setNotifsBusy(false); }
  };

  const initiales = `${profil.prenom?.[0] || ""}${profil.nom?.[0] || ""}`.toUpperCase() || "?";
  const pwColor   = pw.nouveau.length < 6 ? "#ef4444" : pw.nouveau.length < 10 ? "#f59e0b" : "#22c55e";
  const pwLabel   = pw.nouveau.length < 6 ? "Faible"  : pw.nouveau.length < 10 ? "Moyen"   : "Fort";

  return (
    <>
      <style>{css}</style>
      <div className="ae-root">

        {/* SIDEBAR */}
        <aside className="ae-sidebar">
          <div className="ae-sidebar-top">
            <button className="ae-back" onClick={() => navigate("/adminElectionDashboard")}>
              <FiArrowLeft size={15} /> Tableau de bord
            </button>
            <div className="ae-sidebar-title">
              <div className="ae-sidebar-icon"><FiSettings size={18} /></div>
              <div>
                <div className="ae-sidebar-heading">Paramètres</div>
                <div className="ae-sidebar-sub">Admin d'Élection</div>
              </div>
            </div>
          </div>
          <nav className="ae-nav">
            {SECTIONS.map(s => (
              <button key={s.id}
                className={`ae-nav-item${activeSection === s.id ? " ae-nav-item--active" : ""}`}
                onClick={() => setActiveSection(s.id)}>
                <s.icon size={17} /><span>{s.label}</span>
                <FiChevronRight size={13} className="ae-nav-arrow" />
              </button>
            ))}
          </nav>
          <div className="ae-sidebar-footer">
            <div className="ae-profile">
              <div className="ae-av-sm">{initiales}</div>
              <div>
                <div className="ae-profile-name">{profil.prenom} {profil.nom}</div>
                <div className="ae-profile-role">Admin Élection</div>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENU */}
        <main className="ae-main">
          <AnimatePresence>
            {toast && (
              <motion.div key="toast"
                initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                className={`ae-toast ae-toast--${toast.type}`}>
                {toast.type === "danger" ? <FiAlertCircle size={15}/> : <FiCheckCircle size={15}/>}
                {toast.msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── PROFIL ── */}
          {activeSection === "profil" && (
            <motion.div key="profil" {...fade}>
              <div className="ae-sh">
                <h1 className="ae-sh-title">Profil personnel</h1>
                <p className="ae-sh-desc">Gérez vos informations personnelles et votre mot de passe.</p>
              </div>

              {/* Carte identité */}
              <div className="ae-card">
                <div className="ae-card-head"><FiUser size={15} className="ae-card-ico"/> Informations personnelles</div>
                {profilInit ? <Skeleton /> : (
                  <>
                    <div className="ae-av-row">
                      <div className="ae-av-lg">{initiales}</div>
                      <div>
                        <div className="ae-av-name">{profil.prenom} {profil.nom}</div>
                        <div className="ae-av-role">Admin d'Élection</div>
                        <button className="ae-av-change">Changer la photo</button>
                      </div>
                    </div>
                    <div className="ae-grid">
                      {[
                        { id: "prenom", label: "Prénom", key: "prenom" },
                        { id: "nom",    label: "Nom",    key: "nom"    },
                      ].map(f => (
                        <div key={f.id} className={`ae-field${focused === f.id ? " ae-field--on" : ""}`}>
                          <label>{f.label}</label>
                          <input value={profil[f.key]}
                            onChange={e => setProfil({ ...profil, [f.key]: e.target.value })}
                            onFocus={() => setFocused(f.id)} onBlur={() => setFocused(null)} />
                        </div>
                      ))}
                      <div className={`ae-field ae-field--full${focused === "email" ? " ae-field--on" : ""}`}>
                        <label>Adresse e-mail</label>
                        <div className="ae-inw">
                          <FiMail size={15} className="ae-inw-ico"/>
                          <input type="email" value={profil.email}
                            onChange={e => setProfil({ ...profil, email: e.target.value })}
                            onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                            className="ae-inw-pad" />
                        </div>
                      </div>
                    </div>
                    <div className="ae-card-foot">
                      <PrimaryBtn loading={profilBusy} onClick={saveProfil} icon={<FiSave size={14}/>}>
                        Sauvegarder le profil
                      </PrimaryBtn>
                    </div>
                  </>
                )}
              </div>

              {/* Carte mot de passe */}
              <div className="ae-card" style={{ marginTop: 20 }}>
                <div className="ae-card-head"><FiLock size={15} className="ae-card-ico"/> Modifier le mot de passe</div>
                <AnimatePresence>
                  {pwError && (
                    <motion.div key="pwe"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="ae-err">
                      <FiAlertCircle size={14}/> {pwError}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="ae-grid ae-grid--1">
                  {[
                    { id: "ancien",  label: "Mot de passe actuel",      show: showOldPw,  set: setShowOldPw  },
                    { id: "nouveau", label: "Nouveau mot de passe",      show: showNewPw,  set: setShowNewPw  },
                    { id: "confirm", label: "Confirmer le mot de passe", show: showConfPw, set: setShowConfPw },
                  ].map(f => (
                    <div key={f.id} className={`ae-field ae-field--full${focused === f.id ? " ae-field--on" : ""}`}>
                      <label>{f.label}</label>
                      <div className="ae-inw">
                        <FiLock size={15} className="ae-inw-ico"/>
                        <input type={f.show ? "text" : "password"} placeholder="••••••••"
                          value={pw[f.id]}
                          onChange={e => setPw({ ...pw, [f.id]: e.target.value })}
                          onFocus={() => setFocused(f.id)} onBlur={() => setFocused(null)}
                          className="ae-inw-pad ae-inw-pw" />
                        <button type="button" className="ae-eye" onClick={() => f.set(v => !v)}>
                          {f.show ? <FiEyeOff size={14}/> : <FiEye size={14}/>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {pw.nouveau && (
                  <div className="ae-strength">
                    <div className="ae-bars">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="ae-bar" style={{ background: pw.nouveau.length >= i*3 ? pwColor : "#e5e7eb" }}/>
                      ))}
                    </div>
                    <span className="ae-bar-lbl" style={{ color: pwColor }}>{pwLabel}</span>
                  </div>
                )}
                <div className="ae-card-foot">
                  <PrimaryBtn loading={pwBusy} onClick={changePassword} icon={<FiLock size={14}/>}>
                    Modifier le mot de passe
                  </PrimaryBtn>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeSection === "notifications" && (
            <motion.div key="notifs" {...fade}>
              <div className="ae-sh">
                <h1 className="ae-sh-title">Notifications</h1>
                <p className="ae-sh-desc">Choisissez comment et quand vous souhaitez être notifié.</p>
              </div>
              {notifsInit ? (
                <div className="ae-card">{[...Array(4)].map((_, i) => <div key={i} className="ae-nskel"/>)}</div>
              ) : (
                <>
                  <div className="ae-card">
                    <div className="ae-card-head"><FiMail size={15} className="ae-card-ico"/> Notifications par e-mail</div>
                    {[
                      { key: "email_vote",      label: "Nouveau vote enregistré",  desc: "Recevoir un e-mail à chaque vote sur vos élections" },
                      { key: "email_resultats", label: "Résultats disponibles",    desc: "Être informé lorsque les résultats sont publiés" },
                      { key: "email_rappel",    label: "Rappels d'élection",       desc: "Rappels 24h avant la clôture d'une élection" },
                      { key: "email_securite",  label: "Alertes de sécurité",      desc: "Connexion depuis un nouvel appareil ou lieu inhabituel" },
                    ].map(n => (
                      <NotifRow key={n.key} {...n} on={notifs[n.key]}
                        toggle={() => setNotifs(s => ({ ...s, [n.key]: !s[n.key] }))} />
                    ))}
                  </div>
                  <div className="ae-card" style={{ marginTop: 20 }}>
                    <div className="ae-card-head"><FiSmartphone size={15} className="ae-card-ico"/> Notifications push</div>
                    {[
                      { key: "push_vote",      label: "Vote en temps réel",        desc: "Notification instantanée à chaque vote" },
                      { key: "push_resultats", label: "Publication des résultats", desc: "Notification lors de la publication des résultats" },
                    ].map(n => (
                      <NotifRow key={n.key} {...n} on={notifs[n.key]}
                        toggle={() => setNotifs(s => ({ ...s, [n.key]: !s[n.key] }))} />
                    ))}
                  </div>
                  <div className="ae-badge">
                    <FiBell size={14}/>
                    {Object.values(notifs).filter(Boolean).length} / {Object.keys(notifs).length} activée(s)
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <PrimaryBtn loading={notifsBusy} onClick={saveNotifs} icon={<FiSave size={14}/>}>
                      Sauvegarder les préférences
                    </PrimaryBtn>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────
function NotifRow({ label, desc, on, toggle }) {
  return (
    <div className="ae-nrow">
      <div className="ae-ninfo"><div className="ae-nlbl">{label}</div><div className="ae-ndesc">{desc}</div></div>
      <button className="ae-toggle" onClick={toggle}>
        {on ? <FiToggleRight size={26} className="ae-ton"/> : <FiToggleLeft size={26} className="ae-toff"/>}
      </button>
    </div>
  );
}

function PrimaryBtn({ children, loading, onClick, icon }) {
  return (
    <button className="ae-btn" onClick={onClick} disabled={loading}>
      {loading ? <FiRefreshCw size={14} className="ae-spin"/> : icon}
      {loading ? "Chargement…" : children}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="ae-skelwrap">
      <div className="ae-skel ae-skel--av"/>
      <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1 }}>
        <div className="ae-skel ae-skel--line"/>
        <div className="ae-skel ae-skel--line" style={{ width:"55%" }}/>
      </div>
    </div>
  );
}

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

// ─── CSS ───────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
:root{
  --i50:#eef2ff;--i100:#e0e7ff;--i200:#c7d2fe;--i400:#818cf8;
  --i500:#6366f1;--i600:#4f46e5;--i700:#4338ca;--i900:#1e1b4b;
  --g50:#f9fafb;--g100:#f3f4f6;--g400:#9ca3af;--g500:#6b7280;
  --g700:#374151;--g800:#1f2937;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.ae-root{display:flex;min-height:100vh;font-family:'Outfit',sans-serif;background:var(--g50)}
.ae-sidebar{width:260px;min-height:100vh;background:#fff;border-right:1px solid var(--i100);
  display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh}
.ae-sidebar-top{padding:24px 20px 20px;border-bottom:1px solid var(--g100)}
.ae-back{display:flex;align-items:center;gap:6px;background:none;border:none;color:var(--g500);
  font-size:12.5px;font-weight:500;font-family:'Outfit',sans-serif;cursor:pointer;
  padding:0;margin-bottom:18px;transition:color .15s}
.ae-back:hover{color:var(--i600)}
.ae-sidebar-title{display:flex;align-items:center;gap:12px}
.ae-sidebar-icon{width:40px;height:40px;background:var(--i600);border-radius:11px;
  display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.ae-sidebar-heading{font-size:15px;font-weight:700;color:var(--i900)}
.ae-sidebar-sub{font-size:11.5px;color:var(--g400);margin-top:1px}
.ae-nav{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:4px}
.ae-nav-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;
  border:none;background:transparent;color:var(--g500);font-size:13.5px;font-weight:500;
  font-family:'Outfit',sans-serif;cursor:pointer;transition:all .15s;text-align:left;width:100%}
.ae-nav-item:hover{background:var(--i50);color:var(--i600)}
.ae-nav-item--active{background:var(--i50);color:var(--i600);font-weight:600}
.ae-nav-arrow{margin-left:auto;opacity:.4}
.ae-nav-item--active .ae-nav-arrow{opacity:.8}
.ae-sidebar-footer{padding:16px 20px;border-top:1px solid var(--g100)}
.ae-profile{display:flex;align-items:center;gap:10px}
.ae-av-sm{width:36px;height:36px;border-radius:10px;background:var(--i600);color:#fff;
  font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
.ae-profile-name{font-size:13px;font-weight:600;color:var(--g800)}
.ae-profile-role{font-size:11px;color:var(--g400)}
.ae-main{flex:1;padding:32px 36px;overflow-y:auto;position:relative}
.ae-toast{position:fixed;top:24px;right:24px;z-index:200;display:flex;align-items:center;gap:8px;
  padding:12px 18px;border-radius:10px;font-size:13.5px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.12)}
.ae-toast--success{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
.ae-toast--danger{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}
.ae-sh{margin-bottom:24px}
.ae-sh-title{font-size:22px;font-weight:800;color:var(--i900);letter-spacing:-.5px}
.ae-sh-desc{font-size:13.5px;color:var(--g500);margin-top:4px}
.ae-card{background:#fff;border:1px solid var(--g100);border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.ae-card-head{display:flex;align-items:center;gap:8px;padding:18px 24px;
  border-bottom:1px solid var(--g100);font-size:14px;font-weight:700;color:var(--i900)}
.ae-card-ico{color:var(--i500)}
.ae-card-foot{padding:18px 24px;border-top:1px solid var(--g100);background:var(--g50);display:flex;justify-content:flex-end}
.ae-skelwrap{display:flex;align-items:center;gap:18px;padding:20px 24px}
.ae-skel{border-radius:8px;animation:shimmer 1.4s infinite;
  background:linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%);background-size:200% 100%}
.ae-skel--av{width:64px;height:64px;border-radius:16px;flex-shrink:0}
.ae-skel--line{height:16px;width:100%}
.ae-nskel{height:66px;margin:8px 16px;border-radius:10px;animation:shimmer 1.4s infinite;
  background:linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%);background-size:200% 100%}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.ae-av-row{display:flex;align-items:center;gap:18px;padding:20px 24px;border-bottom:1px solid var(--g100)}
.ae-av-lg{width:64px;height:64px;border-radius:16px;background:var(--i600);color:#fff;
  font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ae-av-name{font-size:16px;font-weight:700;color:var(--g800)}
.ae-av-role{font-size:12.5px;color:var(--g500);margin-top:2px}
.ae-av-change{margin-top:8px;background:none;border:1px solid var(--i200);color:var(--i600);
  font-size:12px;font-weight:600;font-family:'Outfit',sans-serif;padding:4px 12px;
  border-radius:6px;cursor:pointer;transition:all .15s}
.ae-av-change:hover{background:var(--i50)}
.ae-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px 24px}
.ae-grid--1{grid-template-columns:1fr}
.ae-field{display:flex;flex-direction:column;gap:5px}
.ae-field--full{grid-column:1/-1}
.ae-field label{font-size:12px;font-weight:600;color:var(--g700);letter-spacing:.2px}
.ae-field input{padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:9px;
  font-size:13.5px;font-family:'Outfit',sans-serif;color:var(--g700);
  background:#fafafa;outline:none;transition:all .2s}
.ae-field--on input,.ae-field input:focus{border-color:var(--i400);
  box-shadow:0 0 0 3px rgba(99,102,241,.1);background:#fff}
.ae-inw{position:relative;display:flex;align-items:center}
.ae-inw-ico{position:absolute;left:12px;color:var(--g400);pointer-events:none}
.ae-field--on .ae-inw-ico{color:var(--i500)}
.ae-inw-pad{padding-left:38px !important;width:100%}
.ae-inw-pw{padding-right:38px !important}
.ae-eye{position:absolute;right:11px;background:none;border:none;color:var(--g400);cursor:pointer;
  padding:3px;border-radius:5px;display:flex;align-items:center;transition:color .15s}
.ae-eye:hover{color:var(--i500)}
.ae-strength{display:flex;align-items:center;gap:10px;padding:0 24px 16px}
.ae-bars{display:flex;gap:4px}
.ae-bar{width:36px;height:4px;border-radius:2px;transition:background .3s}
.ae-bar-lbl{font-size:12px;font-weight:700}
.ae-err{display:flex;align-items:center;gap:8px;background:#fef2f2;border:1px solid #fecaca;
  color:#b91c1c;border-radius:9px;padding:10px 14px;font-size:13px;font-weight:500;
  margin:0 24px 4px;overflow:hidden}
.ae-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 22px;background:var(--i600);
  color:#fff;border:none;border-radius:10px;font-size:13.5px;font-weight:600;
  font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(79,70,229,.25);transition:all .15s}
.ae-btn:hover:not(:disabled){background:var(--i700);transform:translateY(-1px)}
.ae-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
.ae-nrow{display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:16px 24px;border-bottom:1px solid var(--g100)}
.ae-nrow:last-child{border-bottom:none}
.ae-ninfo{flex:1}
.ae-nlbl{font-size:13.5px;font-weight:600;color:var(--g800)}
.ae-ndesc{font-size:12px;color:var(--g400);margin-top:2px;line-height:1.4}
.ae-toggle{background:none;border:none;cursor:pointer;padding:2px;
  display:flex;align-items:center;transition:transform .1s}
.ae-toggle:hover{transform:scale(1.1)}
.ae-ton{color:#22c55e}.ae-toff{color:#d1d5db}
.ae-badge{display:inline-flex;align-items:center;gap:7px;margin-top:16px;
  padding:8px 16px;background:var(--i50);border:1px solid var(--i100);
  border-radius:999px;font-size:12.5px;font-weight:600;color:var(--i600)}
.ae-spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:768px){
  .ae-sidebar{display:none}.ae-main{padding:20px 16px}
  .ae-grid{grid-template-columns:1fr}.ae-field--full{grid-column:1}
}
`;


















































// // src/pages/adminElection/AdminElectionSettings.jsx
// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiUser, FiMail, FiLock, FiBell, FiSave, FiChevronRight,
//   FiArrowLeft, FiSettings, FiCheckCircle, FiAlertCircle,
//   FiEye, FiEyeOff, FiSmartphone, FiMonitor, FiToggleLeft, FiToggleRight
// } from "react-icons/fi";
// import { useNavigate } from "react-router-dom";

// const SECTIONS = [
//   { id: "profil",        label: "Profil personnel",    icon: FiUser },
//   { id: "notifications", label: "Notifications",        icon: FiBell },
// ];

// export default function AdminElectionSettings() {
//   const navigate = useNavigate();
//   const [activeSection, setActiveSection] = useState("profil");
//   const [toast, setToast]   = useState(null);
//   const [showOldPw, setShowOldPw] = useState(false);
//   const [showNewPw, setShowNewPw] = useState(false);
//   const [showConfPw, setShowConfPw] = useState(false);
//   const [focused, setFocused] = useState(null);
//   const [pwError, setPwError] = useState("");

//   /* Profil */
//   const [profil, setProfil] = useState({
//     prenom: "Marie",
//     nom:    "Dupont",
//     email:  "marie.dupont@votesecure.cm",
//     telephone: "+237 6XX XXX XXX",
//     organisation: "Université de Yaoundé I",
//   });

//   /* Mot de passe */
//   const [pw, setPw] = useState({ ancien: "", nouveau: "", confirm: "" });

//   /* Notifications */
//   const [notifs, setNotifs] = useState({
//     email_vote:      true,
//     email_resultats: true,
//     email_rappel:    false,
//     email_securite:  true,
//     push_vote:       false,
//     push_resultats:  true,
//   });

//   const showToast = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast(null), 3000);
//   };

//   const handleSaveProfil = () => showToast("Profil mis à jour avec succès !");

//   const handleChangePw = () => {
//     setPwError("");
//     if (!pw.ancien) { setPwError("Saisissez votre mot de passe actuel."); return; }
//     if (pw.nouveau.length < 8) { setPwError("Le nouveau mot de passe doit faire au moins 8 caractères."); return; }
//     if (pw.nouveau !== pw.confirm) { setPwError("Les mots de passe ne correspondent pas."); return; }
//     setPw({ ancien: "", nouveau: "", confirm: "" });
//     showToast("Mot de passe modifié !");
//   };

//   const toggleNotif = (key) => setNotifs(n => ({ ...n, [key]: !n[key] }));

//   return (
//     <>
//       <style>{styles}</style>
//       <div className="ae-root">

//         {/* ── SIDEBAR ── */}
//         <aside className="ae-sidebar">
//           <div className="ae-sidebar-top">
//             <button className="ae-back" onClick={() => navigate("/adminElectionDashboard")}>
//               <FiArrowLeft size={15} /> Tableau de bord
//             </button>
//             <div className="ae-sidebar-title">
//               <div className="ae-sidebar-icon"><FiSettings size={18} /></div>
//               <div>
//                 <div className="ae-sidebar-heading">Paramètres</div>
//                 <div className="ae-sidebar-sub">Admin d'Élection</div>
//               </div>
//             </div>
//           </div>

//           <nav className="ae-nav">
//             {SECTIONS.map(s => (
//               <button
//                 key={s.id}
//                 className={`ae-nav-item ${activeSection === s.id ? "ae-nav-item--active" : ""}`}
//                 onClick={() => setActiveSection(s.id)}
//               >
//                 <s.icon size={17} />
//                 <span>{s.label}</span>
//                 <FiChevronRight size={13} className="ae-nav-arrow" />
//               </button>
//             ))}
//           </nav>

//           <div className="ae-sidebar-footer">
//             <div className="ae-profile">
//               <div className="ae-avatar">MD</div>
//               <div>
//                 <div className="ae-profile-name">Marie Dupont</div>
//                 <div className="ae-profile-role">Admin Élection</div>
//               </div>
//             </div>
//           </div>
//         </aside>

//         {/* ── CONTENU ── */}
//         <main className="ae-main">

//           {/* Toast */}
//           <AnimatePresence>
//             {toast && (
//               <motion.div key="toast"
//                 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
//                 className={`ae-toast ae-toast--${toast.type}`}>
//                 {toast.type === "danger" ? <FiAlertCircle size={15} /> : <FiCheckCircle size={15} />}
//                 {toast.msg}
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* ════ PROFIL ════ */}
//           {activeSection === "profil" && (
//             <motion.div key="profil" {...fadeIn}>
//               <div className="ae-section-header">
//                 <div>
//                   <h1 className="ae-section-title">Profil personnel</h1>
//                   <p className="ae-section-desc">Gérez vos informations personnelles et votre mot de passe.</p>
//                 </div>
//               </div>

//               {/* Carte identité */}
//               <div className="ae-card">
//                 <div className="ae-card-header">
//                   <FiUser size={15} className="ae-card-icon" />
//                   <span>Informations personnelles</span>
//                 </div>

//                 {/* Avatar */}
//                 <div className="ae-avatar-section">
//                   <div className="ae-avatar-lg">MD</div>
//                   <div>
//                     <div className="ae-avatar-name">{profil.prenom} {profil.nom}</div>
//                     <div className="ae-avatar-role">Admin d'Élection · {profil.organisation}</div>
//                     <button className="ae-avatar-change">Changer la photo</button>
//                   </div>
//                 </div>

//                 <div className="ae-form-grid">
//                   <div className={`ae-field ${focused === "prenom" ? "ae-field--focused" : ""}`}>
//                     <label htmlFor="prenom">Prénom</label>
//                     <input id="prenom" value={profil.prenom}
//                       onChange={e => setProfil({...profil, prenom: e.target.value})}
//                       onFocus={() => setFocused("prenom")}
//                       onBlur={() => setFocused(null)} />
//                   </div>
//                   <div className={`ae-field ${focused === "nom" ? "ae-field--focused" : ""}`}>
//                     <label htmlFor="nom">Nom</label>
//                     <input id="nom" value={profil.nom}
//                       onChange={e => setProfil({...profil, nom: e.target.value})}
//                       onFocus={() => setFocused("nom")}
//                       onBlur={() => setFocused(null)} />
//                   </div>
//                   <div className={`ae-field ae-field--full ${focused === "email" ? "ae-field--focused" : ""}`}>
//                     <label htmlFor="email">Adresse e-mail</label>
//                     <div className="ae-input-wrap">
//                       <FiMail size={15} className="ae-input-icon" />
//                       <input id="email" type="email" value={profil.email}
//                         onChange={e => setProfil({...profil, email: e.target.value})}
//                         onFocus={() => setFocused("email")}
//                         onBlur={() => setFocused(null)}
//                         className="ae-input-with-icon" />
//                     </div>
//                   </div>
//                   <div className={`ae-field ${focused === "tel" ? "ae-field--focused" : ""}`}>
//                     <label htmlFor="tel">Téléphone</label>
//                     <input id="tel" value={profil.telephone}
//                       onChange={e => setProfil({...profil, telephone: e.target.value})}
//                       onFocus={() => setFocused("tel")}
//                       onBlur={() => setFocused(null)} />
//                   </div>
//                   <div className={`ae-field ${focused === "org" ? "ae-field--focused" : ""}`}>
//                     <label htmlFor="org">Organisation</label>
//                     <input id="org" value={profil.organisation}
//                       onChange={e => setProfil({...profil, organisation: e.target.value})}
//                       onFocus={() => setFocused("org")}
//                       onBlur={() => setFocused(null)} />
//                   </div>
//                 </div>

//                 <div className="ae-card-footer">
//                   <button className="ae-btn-primary" onClick={handleSaveProfil}>
//                     <FiSave size={14} /> Sauvegarder le profil
//                   </button>
//                 </div>
//               </div>

//               {/* Carte mot de passe */}
//               <div className="ae-card" style={{ marginTop: 20 }}>
//                 <div className="ae-card-header">
//                   <FiLock size={15} className="ae-card-icon" />
//                   <span>Modifier le mot de passe</span>
//                 </div>

//                 <AnimatePresence>
//                   {pwError && (
//                     <motion.div key="pwerr"
//                       initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
//                       className="ae-error-box">
//                       <FiAlertCircle size={14} /> {pwError}
//                     </motion.div>
//                   )}
//                 </AnimatePresence>

//                 <div className="ae-form-grid ae-form-grid--single">
//                   {[
//                     { id: "ancien", label: "Mot de passe actuel",    val: pw.ancien,  show: showOldPw, setShow: setShowOldPw },
//                     { id: "nouveau", label: "Nouveau mot de passe",   val: pw.nouveau, show: showNewPw, setShow: setShowNewPw },
//                     { id: "confirm", label: "Confirmer le mot de passe", val: pw.confirm, show: showConfPw, setShow: setShowConfPw },
//                   ].map(f => (
//                     <div key={f.id} className={`ae-field ae-field--full ${focused === f.id ? "ae-field--focused" : ""}`}>
//                       <label htmlFor={f.id}>{f.label}</label>
//                       <div className="ae-input-wrap">
//                         <FiLock size={15} className="ae-input-icon" />
//                         <input id={f.id} type={f.show ? "text" : "password"}
//                           placeholder="••••••••"
//                           value={f.val}
//                           onChange={e => setPw({ ...pw, [f.id]: e.target.value })}
//                           onFocus={() => setFocused(f.id)}
//                           onBlur={() => setFocused(null)}
//                           className="ae-input-with-icon ae-input-pw" />
//                         <button type="button" className="ae-pw-toggle"
//                           onClick={() => f.setShow(v => !v)}>
//                           {f.show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Indicateur force */}
//                 {pw.nouveau && (
//                   <div className="ae-pw-strength">
//                     <div className="ae-pw-bars">
//                       {[1,2,3,4].map(i => (
//                         <div key={i} className={`ae-pw-bar ${pw.nouveau.length >= i * 3 ? "ae-pw-bar--active" : ""}`}
//                           style={{ background: pw.nouveau.length >= i * 3
//                             ? (pw.nouveau.length < 6 ? "#ef4444" : pw.nouveau.length < 10 ? "#f59e0b" : "#22c55e")
//                             : undefined }} />
//                       ))}
//                     </div>
//                     <span className="ae-pw-label">
//                       {pw.nouveau.length < 6 ? "Faible" : pw.nouveau.length < 10 ? "Moyen" : "Fort"}
//                     </span>
//                   </div>
//                 )}

//                 <div className="ae-card-footer">
//                   <button className="ae-btn-primary" onClick={handleChangePw}>
//                     <FiLock size={14} /> Modifier le mot de passe
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {/* ════ NOTIFICATIONS ════ */}
//           {activeSection === "notifications" && (
//             <motion.div key="notifs" {...fadeIn}>
//               <div className="ae-section-header">
//                 <div>
//                   <h1 className="ae-section-title">Notifications</h1>
//                   <p className="ae-section-desc">Choisissez comment et quand vous souhaitez être notifié.</p>
//                 </div>
//               </div>

//               {/* Email */}
//               <div className="ae-card">
//                 <div className="ae-card-header">
//                   <FiMail size={15} className="ae-card-icon" />
//                   <span>Notifications par e-mail</span>
//                 </div>

//                 <div className="ae-notif-list">
//                   {[
//                     { key: "email_vote",      label: "Nouveau vote enregistré",    desc: "Recevoir un e-mail à chaque vote sur vos élections" },
//                     { key: "email_resultats",  label: "Résultats disponibles",      desc: "Être informé lorsque les résultats sont publiés" },
//                     { key: "email_rappel",     label: "Rappels d'élection",         desc: "Rappels 24h avant la clôture d'une élection" },
//                     { key: "email_securite",   label: "Alertes de sécurité",        desc: "Connexion depuis un nouvel appareil ou lieu inhabituel" },
//                   ].map(n => (
//                     <div key={n.key} className="ae-notif-row">
//                       <div className="ae-notif-info">
//                         <div className="ae-notif-label">{n.label}</div>
//                         <div className="ae-notif-desc">{n.desc}</div>
//                       </div>
//                       <button className="ae-toggle" onClick={() => toggleNotif(n.key)}>
//                         {notifs[n.key]
//                           ? <FiToggleRight size={26} className="ae-toggle-on" />
//                           : <FiToggleLeft  size={26} className="ae-toggle-off" />}
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Push */}
//               <div className="ae-card" style={{ marginTop: 20 }}>
//                 <div className="ae-card-header">
//                   <FiSmartphone size={15} className="ae-card-icon" />
//                   <span>Notifications push</span>
//                 </div>

//                 <div className="ae-notif-list">
//                   {[
//                     { key: "push_vote",      label: "Vote en temps réel",       desc: "Notification instantanée à chaque vote" },
//                     { key: "push_resultats",  label: "Publication des résultats", desc: "Notification lors de la publication des résultats" },
//                   ].map(n => (
//                     <div key={n.key} className="ae-notif-row">
//                       <div className="ae-notif-info">
//                         <div className="ae-notif-label">{n.label}</div>
//                         <div className="ae-notif-desc">{n.desc}</div>
//                       </div>
//                       <button className="ae-toggle" onClick={() => toggleNotif(n.key)}>
//                         {notifs[n.key]
//                           ? <FiToggleRight size={26} className="ae-toggle-on" />
//                           : <FiToggleLeft  size={26} className="ae-toggle-off" />}
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Résumé */}
//               <div className="ae-notif-summary">
//                 <FiBell size={14} />
//                 {Object.values(notifs).filter(Boolean).length} notification(s) activée(s) sur {Object.keys(notifs).length}
//               </div>

//               <div style={{ marginTop: 20 }}>
//                 <button className="ae-btn-primary" onClick={() => showToast("Préférences de notification sauvegardées !")}>
//                   <FiSave size={14} /> Sauvegarder les préférences
//                 </button>
//               </div>
//             </motion.div>
//           )}
//         </main>
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
//     --indigo-400:#818cf8;--indigo-500:#6366f1;--indigo-600:#4f46e5;
//     --indigo-700:#4338ca;--indigo-900:#1e1b4b;
//     --gray-50:#f9fafb;--gray-100:#f3f4f6;--gray-400:#9ca3af;
//     --gray-500:#6b7280;--gray-700:#374151;--gray-800:#1f2937;--white:#fff;
//   }
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
//   .ae-root{display:flex;min-height:100vh;font-family:'Outfit',sans-serif;background:var(--gray-50)}

//   /* SIDEBAR */
//   .ae-sidebar{width:260px;min-height:100vh;background:var(--white);border-right:1px solid var(--indigo-100);
//     display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh}
//   .ae-sidebar-top{padding:24px 20px 20px;border-bottom:1px solid var(--gray-100)}
//   .ae-back{display:flex;align-items:center;gap:6px;background:none;border:none;
//     color:var(--gray-500);font-size:12.5px;font-weight:500;font-family:'Outfit',sans-serif;
//     cursor:pointer;padding:0;margin-bottom:18px;transition:color .15s}
//   .ae-back:hover{color:var(--indigo-600)}
//   .ae-sidebar-title{display:flex;align-items:center;gap:12px}
//   .ae-sidebar-icon{width:40px;height:40px;background:var(--indigo-600);border-radius:11px;
//     display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0}
//   .ae-sidebar-heading{font-size:15px;font-weight:700;color:var(--indigo-900)}
//   .ae-sidebar-sub{font-size:11.5px;color:var(--gray-400);margin-top:1px}
//   .ae-nav{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:4px}
//   .ae-nav-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;
//     border:none;background:transparent;color:var(--gray-500);font-size:13.5px;font-weight:500;
//     font-family:'Outfit',sans-serif;cursor:pointer;transition:all .15s;text-align:left;width:100%}
//   .ae-nav-item:hover{background:var(--indigo-50);color:var(--indigo-600)}
//   .ae-nav-item--active{background:var(--indigo-50);color:var(--indigo-600);font-weight:600}
//   .ae-nav-arrow{margin-left:auto;opacity:.4}
//   .ae-nav-item--active .ae-nav-arrow{opacity:.8}
//   .ae-sidebar-footer{padding:16px 20px;border-top:1px solid var(--gray-100)}
//   .ae-profile{display:flex;align-items:center;gap:10px}
//   .ae-avatar{width:36px;height:36px;border-radius:10px;background:var(--indigo-600);
//     color:white;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
//   .ae-profile-name{font-size:13px;font-weight:600;color:var(--gray-800)}
//   .ae-profile-role{font-size:11px;color:var(--gray-400)}

//   /* MAIN */
//   .ae-main{flex:1;padding:32px 36px;overflow-y:auto;position:relative}

//   /* Toast */
//   .ae-toast{position:fixed;top:24px;right:24px;z-index:200;display:flex;align-items:center;gap:8px;
//     padding:12px 18px;border-radius:10px;font-size:13.5px;font-weight:600;
//     box-shadow:0 8px 24px rgba(0,0,0,0.12)}
//   .ae-toast--success{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
//   .ae-toast--danger{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}

//   /* Section header */
//   .ae-section-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:16px}
//   .ae-section-title{font-size:22px;font-weight:800;color:var(--indigo-900);letter-spacing:-.5px}
//   .ae-section-desc{font-size:13.5px;color:var(--gray-500);margin-top:4px}

//   /* Card */
//   .ae-card{background:white;border:1px solid var(--gray-100);border-radius:16px;
//     overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
//   .ae-card-header{display:flex;align-items:center;gap:8px;padding:18px 24px;
//     border-bottom:1px solid var(--gray-100);font-size:14px;font-weight:700;color:var(--indigo-900)}
//   .ae-card-icon{color:var(--indigo-500)}
//   .ae-card-footer{padding:18px 24px;border-top:1px solid var(--gray-100);background:var(--gray-50);
//     display:flex;justify-content:flex-end}

//   /* Avatar section */
//   .ae-avatar-section{display:flex;align-items:center;gap:18px;padding:20px 24px;border-bottom:1px solid var(--gray-100)}
//   .ae-avatar-lg{width:64px;height:64px;border-radius:16px;background:var(--indigo-600);
//     color:white;font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
//   .ae-avatar-name{font-size:16px;font-weight:700;color:var(--gray-800)}
//   .ae-avatar-role{font-size:12.5px;color:var(--gray-500);margin-top:2px}
//   .ae-avatar-change{margin-top:8px;background:none;border:1px solid var(--indigo-200);
//     color:var(--indigo-600);font-size:12px;font-weight:600;font-family:'Outfit',sans-serif;
//     padding:4px 12px;border-radius:6px;cursor:pointer;transition:all .15s}
//   .ae-avatar-change:hover{background:var(--indigo-50)}

//   /* Formulaire */
//   .ae-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px 24px}
//   .ae-form-grid--single{grid-template-columns:1fr}
//   .ae-field{display:flex;flex-direction:column;gap:5px}
//   .ae-field--full{grid-column:1/-1}
//   .ae-field label{font-size:12px;font-weight:600;color:var(--gray-700);letter-spacing:.2px}
//   .ae-field input{padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:9px;
//     font-size:13.5px;font-family:'Outfit',sans-serif;color:var(--gray-700);
//     background:#fafafa;outline:none;transition:all .2s}
//   .ae-field--focused input{border-color:var(--indigo-400);
//     box-shadow:0 0 0 3px rgba(99,102,241,0.10);background:white}
//   .ae-field input:focus{border-color:var(--indigo-400);
//     box-shadow:0 0 0 3px rgba(99,102,241,0.10);background:white}
//   .ae-input-wrap{position:relative;display:flex;align-items:center}
//   .ae-input-icon{position:absolute;left:12px;color:var(--gray-400);pointer-events:none}
//   .ae-field--focused .ae-input-icon{color:var(--indigo-500)}
//   .ae-input-with-icon{padding-left:38px !important;width:100%}
//   .ae-input-pw{padding-right:38px !important}
//   .ae-pw-toggle{position:absolute;right:11px;background:none;border:none;
//     color:var(--gray-400);cursor:pointer;padding:3px;border-radius:5px;
//     display:flex;align-items:center;transition:color .15s}
//   .ae-pw-toggle:hover{color:var(--indigo-500)}

//   /* Indicateur force */
//   .ae-pw-strength{display:flex;align-items:center;gap:10px;padding:0 24px 16px}
//   .ae-pw-bars{display:flex;gap:4px}
//   .ae-pw-bar{width:36px;height:4px;border-radius:2px;background:#e5e7eb;transition:background .2s}
//   .ae-pw-bar--active{}
//   .ae-pw-label{font-size:12px;font-weight:600;color:var(--gray-500)}

//   /* Erreur */
//   .ae-error-box{display:flex;align-items:center;gap:8px;background:#fef2f2;border:1px solid #fecaca;
//     color:#b91c1c;border-radius:9px;padding:10px 14px;font-size:13px;font-weight:500;
//     margin:0 24px 4px;overflow:hidden}

//   /* Boutons */
//   .ae-btn-primary{display:inline-flex;align-items:center;gap:7px;padding:10px 22px;
//     background:var(--indigo-600);color:white;border:none;border-radius:10px;
//     font-size:13.5px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;
//     box-shadow:0 4px 12px rgba(79,70,229,0.25);transition:all .15s}
//   .ae-btn-primary:hover{background:var(--indigo-700);transform:translateY(-1px)}

//   /* Notifications */
//   .ae-notif-list{padding:8px 0}
//   .ae-notif-row{display:flex;align-items:center;justify-content:space-between;gap:16px;
//     padding:16px 24px;border-bottom:1px solid var(--gray-100)}
//   .ae-notif-row:last-child{border-bottom:none}
//   .ae-notif-info{flex:1}
//   .ae-notif-label{font-size:13.5px;font-weight:600;color:var(--gray-800)}
//   .ae-notif-desc{font-size:12px;color:var(--gray-400);margin-top:2px;line-height:1.4}
//   .ae-toggle{background:none;border:none;cursor:pointer;padding:2px;display:flex;align-items:center}
//   .ae-toggle-on{color:#22c55e}.ae-toggle-off{color:#d1d5db}
//   .ae-notif-summary{display:inline-flex;align-items:center;gap:7px;margin-top:16px;
//     padding:8px 16px;background:var(--indigo-50);border:1px solid var(--indigo-100);
//     border-radius:999px;font-size:12.5px;font-weight:600;color:var(--indigo-600)}

//   /* Responsive */
//   @media(max-width:768px){
//     .ae-sidebar{display:none}
//     .ae-main{padding:20px 16px}
//     .ae-form-grid{grid-template-columns:1fr}
//     .ae-field--full{grid-column:1}
//     .ae-section-header{flex-direction:column}
//   }
// `;
