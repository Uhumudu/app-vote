// src/pages/public/DashboardCandidatPublicPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAward, FiTrendingUp, FiCheckCircle, FiLogOut,
  FiCalendar, FiUser, FiMail, FiPhone, FiClock,
  FiShield, FiChevronRight, FiLock,
} from "react-icons/fi";
import { Users, Vote, BarChart3, Trophy } from "lucide-react";
import api from "../../services/api";

const fmt      = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
const fmtShort = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });

const MEDALS = ["🥇", "🥈", "🥉"];
const getMedal = i => MEDALS[i] ?? `#${i + 1}`;

export default function DashboardCandidatPublicPage() {
  const navigate = useNavigate();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState("classement");

  const utilisateurId = localStorage.getItem("id");
  const prenom        = localStorage.getItem("prenom") || "";
  const nom           = localStorage.getItem("nom")    || "";
  const initiales     = `${prenom?.charAt(0) ?? ""}${nom?.charAt(0) ?? ""}`.toUpperCase();

  useEffect(() => {
    if (!utilisateurId) { navigate("/login"); return; }
    api
      .get(`/public-elections/dashboard/candidat-public/${utilisateurId}`)
      .then(r => setData(r.data))
      .catch(() => setError("Impossible de charger vos données. Vérifiez votre connexion."))
      .finally(() => setLoading(false));
  }, [utilisateurId, navigate]);

  const handleLogout = () => {
    ["token", "id", "role", "nom", "prenom", "email"].forEach(k => localStorage.removeItem(k));
    navigate("/login");
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-indigo-400 text-sm font-medium">Chargement de votre espace…</p>
      </div>
    </div>
  );

  // ── Erreur ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center max-w-sm shadow-lg">
        <p className="text-red-600 font-bold mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 transition-all text-sm"
        >
          Réessayer
        </button>
      </div>
    </div>
  );

  // ── Calculs ────────────────────────────────────────────────────────────────
  const maxVotes = data?.classement?.[0]?.nb_votes ?? 0;
  const myRank   = data ? data.classement.findIndex(c => c.id === data.candidat.id) + 1 : 0;
  const myVotes  = data?.votes?.length ?? 0;
  const total    = data?.classement?.reduce((s, c) => s + Number(c.nb_votes), 0) ?? 0;
  const myPct    = total > 0 ? Math.round((myVotes / total) * 100) : 0;

  const tabs = [
    { id: "classement", label: "Classement",          icon: <Trophy size={14} /> },
    { id: "votes",      label: `Mes votes (${myVotes})`, icon: <FiCheckCircle size={14} /> },
    { id: "profil",     label: "Mon profil",           icon: <FiUser size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ── NAVBAR — identique à DashboardElecteur ──────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-indigo-700 tracking-tight">🗳 eVote</span>
          <span className="text-[11px] bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Espace candidat
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
              {initiales}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-none">{prenom} {nom}</p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <FiShield size={10} className="text-indigo-400" /> Candidat approuvé
              </p>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all font-medium"
          >
            <FiLogOut size={14} /> Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* ── SALUTATION ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .5 }}
          className="mb-8"
        >
          <p className="text-indigo-400 text-sm font-medium mb-1">Bienvenue dans votre espace</p>
          <h1 className="text-3xl font-black text-indigo-900 tracking-tight">
            Bonjour, {prenom} 👋
          </h1>
          {data && (
            <p className="text-indigo-400 mt-1.5 text-sm flex items-center gap-2">
              <FiCalendar size={13} />
              {data.candidat.election_titre}
              <span className="text-indigo-300">·</span>
              {fmtShort(data.candidat.date_debut)} → {fmtShort(data.candidat.date_fin)}
            </p>
          )}
        </motion.div>

        {/* ── KPI CARDS — même style que DashboardElecteur ───────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { value: myVotes,                    label: "Votes reçus",      color: "#059669", border: "border-emerald-100", delay: 0.05 },
            { value: `${myPct}%`,                label: "Part des votes",   color: "#4338ca", border: "border-indigo-100",  delay: 0.10 },
            { value: data?.classement?.length ?? 0, label: "Candidats",    color: "#d97706", border: "border-amber-100",   delay: 0.15 },
            { value: myRank > 0 ? `#${myRank}` : "—", label: "Mon rang",   color: myRank === 1 ? "#d97706" : "#9ca3af", border: myRank === 1 ? "border-amber-100" : "border-gray-100", delay: 0.20 },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: kpi.delay, duration: .45 }}
              className={`bg-white rounded-2xl border ${kpi.border} p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
            >
              <p className="text-3xl font-black mb-1" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── CONTENU PRINCIPAL ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">

          {/* Tabs header — même style que la navbar d'élections */}
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Mon espace candidat
            </h2>
            <div className="flex gap-1 bg-indigo-50 p-1 rounded-xl">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-indigo-400 hover:text-indigo-600 hover:bg-white/60"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: .2 }}
            >

              {/* ════ Tab CLASSEMENT ════════════════════════════════════════ */}
              {activeTab === "classement" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Trophy size={18} className="text-amber-500" />
                      <span className="font-bold text-gray-800 text-sm">Classement en temps réel</span>
                    </div>
                    <span className="text-[11px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-bold">
                      {data?.classement?.length} candidats
                    </span>
                  </div>

                  <ul className="divide-y divide-gray-50">
                    {data?.classement?.map((c, idx) => {
                      const pct  = maxVotes > 0 ? Math.round((Number(c.nb_votes) / maxVotes) * 100) : 0;
                      const isMe = c.id === data.candidat.id;
                      return (
                        <motion.li
                          key={c.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * .04 }}
                          className={`flex items-center gap-4 py-4 px-4 rounded-xl mb-1 transition-all ${
                            isMe
                              ? "bg-indigo-50 border-2 border-indigo-300 shadow-sm"
                              : "hover:bg-gray-50/80"
                          }`}
                        >
                          {/* Position */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0 ${
                            idx === 0 ? "bg-amber-100 text-amber-700" :
                            idx === 1 ? "bg-gray-100 text-gray-500" :
                            idx === 2 ? "bg-orange-100 text-orange-600" :
                            "bg-indigo-50 text-indigo-400 text-sm"
                          }`}>
                            {getMedal(idx)}
                          </div>

                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <p className={`font-bold text-sm truncate ${isMe ? "text-indigo-800" : "text-gray-800"}`}>
                                {c.prenom} {c.nom}
                              </p>
                              {isMe && (
                                <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                  ← vous
                                </span>
                              )}
                            </div>
                            {/* Barre progression */}
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: .9, ease: "easeOut", delay: idx * .04 + .1 }}
                                className={`h-full rounded-full ${isMe ? "bg-indigo-500" : "bg-indigo-200"}`}
                              />
                            </div>
                          </div>

                          {/* Votes */}
                          <div className="text-right flex-shrink-0">
                            <p className={`text-lg font-black ${isMe ? "text-indigo-700" : "text-gray-700"}`}>
                              {c.nb_votes}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">votes</p>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* ════ Tab VOTES ══════════════════════════════════════════════ */}
              {activeTab === "votes" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle size={18} className="text-emerald-500" />
                      <span className="font-bold text-gray-800 text-sm">Votes reçus</span>
                    </div>
                    <span className="text-[11px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
                      {myVotes} vote{myVotes > 1 ? "s" : ""}
                    </span>
                  </div>

                  {myVotes === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                        <Vote size={28} className="text-indigo-300" />
                      </div>
                      <p className="text-gray-700 font-bold">Aucun vote reçu pour l'instant</p>
                      <p className="text-gray-400 text-sm mt-1.5 max-w-xs">
                        Partagez votre profil pour recevoir vos premiers votes !
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                      {data?.votes?.map((v, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * .04 }}
                          className="flex items-center gap-3 py-3.5 px-4 hover:bg-gray-50/60 rounded-xl transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-semibold text-gray-800 text-sm">
                              {v.nom_electeur || "Électeur anonyme"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <FiClock size={11} />
                            {fmt(v.created_at)}
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* ════ Tab PROFIL ══════════════════════════════════════════════ */}
              {activeTab === "profil" && data && (
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <FiUser size={18} className="text-indigo-500" />
                    <span className="font-bold text-gray-800 text-sm">Mon profil candidat</span>
                  </div>

                  {/* Avatar + statut */}
                  <div className="flex items-center gap-5 mb-6 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-200 flex-shrink-0">
                      {data.candidat.prenom[0]?.toUpperCase()}{data.candidat.nom[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-black text-indigo-900">
                        {data.candidat.prenom} {data.candidat.nom}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-100 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full font-bold mt-1">
                        <FiCheckCircle size={11} /> Candidature approuvée
                      </span>
                    </div>
                  </div>

                  {/* Infos détaillées */}
                  <ul className="divide-y divide-gray-50 mb-6">
                    {[
                      { icon: <FiMail size={14} />,    label: "Email",      val: data.candidat.email     || "—" },
                      { icon: <FiPhone size={14} />,   label: "Téléphone",  val: data.candidat.telephone || "—" },
                      { icon: <FiCalendar size={14}/>, label: "Candidature",val: fmtShort(data.candidat.created_at) },
                    ].map((row, i) => (
                      <li key={i} className="flex items-center gap-4 py-3.5 px-4 hover:bg-gray-50/60 rounded-xl transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
                          {row.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{row.label}</p>
                          <p className="text-sm font-semibold text-gray-800">{row.val}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Bio */}
                  {data.candidat.bio && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Bio / Programme</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{data.candidat.bio}</p>
                    </div>
                  )}

                  {/* Élection associée — même style que les badges dans DashboardElecteur */}
                  <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
                      <FiCalendar size={11} /> Élection associée
                    </div>
                    <p className="font-black text-indigo-900 text-base mb-2">{data.candidat.election_titre}</p>
                    <p className="text-xs text-gray-400 mb-3">
                      {fmtShort(data.candidat.date_debut)} → {fmtShort(data.candidat.date_fin)}
                    </p>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      data.candidat.election_statut === "EN_COURS"
                        ? "bg-indigo-100 text-indigo-700 border-indigo-200 animate-pulse"
                        : data.candidat.election_statut === "TERMINEE"
                        ? "bg-gray-100 text-gray-500 border-gray-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"
                    }`}>
                      {data.candidat.election_statut === "EN_COURS"  && <><FiClock size={11}/>        En cours</>}
                      {data.candidat.election_statut === "TERMINEE"  && <><FiLock size={11}/>         Terminée</>}
                      {data.candidat.election_statut === "APPROUVEE" && <><FiCheckCircle size={11}/> Approuvée</>}
                      {!["EN_COURS","TERMINEE","APPROUVEE"].includes(data.candidat.election_statut) && data.candidat.election_statut}
                    </span>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Lien retour page publique ───────────────────────────────────── */}
        {data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: .4 }}
            className="mt-4 text-center"
          >
            <a
              href={`/voter/${data.candidat.election_id}`}
              className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-600 font-medium transition-colors"
            >
              <FiChevronRight size={14} />
              Voir la page publique de l'élection
            </a>
          </motion.div>
        )}

      </main>
    </div>
  );
}



































// // src/pages/public/DashboardCandidatPublicPage.jsx
// // Dashboard pour les candidats approuvés — authentifiés avec rôle CANDIDAT_PUBLIC
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiAward, FiTrendingUp, FiCheckCircle, FiLogOut,
//   FiCalendar, FiUser, FiMail, FiPhone, FiClock,
//   FiShield, FiStar,
// } from "react-icons/fi";
// import { Users, Vote, BarChart3, Trophy } from "lucide-react";
// import api from "../../services/api";

// const fmt      = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
// const fmtShort = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });

// // ─── Médailles ────────────────────────────────────────────────────────────────
// const MEDALS = ["🥇", "🥈", "🥉"];
// const getMedal = i => MEDALS[i] ?? `#${i + 1}`;

// export default function DashboardCandidatPublicPage() {
//   const navigate = useNavigate();
//   const [data,      setData]      = useState(null);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState("");
//   const [activeTab, setActiveTab] = useState("classement"); // "classement" | "votes" | "profil"

//   const utilisateurId = localStorage.getItem("id");
//   const prenom        = localStorage.getItem("prenom") || "";
//   const nom           = localStorage.getItem("nom")    || "";

//   useEffect(() => {
//     if (!utilisateurId) { navigate("/login"); return; }
//     api
//       .get(`/public-elections/dashboard/candidat-public/${utilisateurId}`)
//       .then(r => setData(r.data))
//       .catch(() => setError("Impossible de charger vos données. Vérifiez votre connexion."))
//       .finally(() => setLoading(false));
//   }, [utilisateurId, navigate]);

//   const handleLogout = () => {
//     ["token", "id", "role", "nom", "prenom", "email"].forEach(k =>
//       localStorage.removeItem(k)
//     );
//     navigate("/login");
//   };

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (loading) return (
//     <>
//       <style>{STYLES}</style>
//       <div style={{
//         minHeight: "100vh", display: "flex", alignItems: "center",
//         justifyContent: "center", background: "var(--bg)",
//         fontFamily: "var(--font-body)",
//       }}>
//         <div style={{ textAlign: "center" }}>
//           <div className="dp-loader" />
//           <p style={{ marginTop: 20, color: "var(--muted)", fontSize: 14 }}>
//             Chargement de votre espace…
//           </p>
//         </div>
//       </div>
//     </>
//   );

//   // ── Erreur ─────────────────────────────────────────────────────────────────
//   if (error) return (
//     <>
//       <style>{STYLES}</style>
//       <div style={{
//         minHeight: "100vh", display: "flex", alignItems: "center",
//         justifyContent: "center", background: "var(--bg)",
//         fontFamily: "var(--font-body)", flexDirection: "column", gap: 16,
//       }}>
//         <div style={{
//           background: "#fef2f2", border: "1px solid #fecaca",
//           borderRadius: 16, padding: "24px 32px", textAlign: "center",
//         }}>
//           <p style={{ color: "#dc2626", fontWeight: 700 }}>{error}</p>
//           <button onClick={() => window.location.reload()} className="dp-btn-outline" style={{ marginTop: 16 }}>
//             Réessayer
//           </button>
//         </div>
//       </div>
//     </>
//   );

//   // ── Calculs ────────────────────────────────────────────────────────────────
//   const maxVotes = data?.classement?.[0]?.nb_votes ?? 0;
//   const myRank   = data
//     ? data.classement.findIndex(c => c.id === data.candidat.id) + 1
//     : 0;
//   const myVotes  = data?.votes?.length ?? 0;
//   const total    = data?.classement?.reduce((s, c) => s + Number(c.nb_votes), 0) ?? 0;
//   const myPct    = total > 0 ? Math.round((myVotes / total) * 100) : 0;

//   return (
//     <>
//       <style>{STYLES}</style>
//       <div className="dp-root">

//         {/* Fond décoratif */}
//         <div className="dp-bg-mesh" />
//         <div className="dp-bg-grid" />

//         {/* ── Navbar ─────────────────────────────────────────────────────── */}
//         <nav className="dp-nav">
//           <div className="dp-nav-inner">
//             <a href="/" className="dp-logo">
//               <span className="dp-logo-icon">🗳</span>
//               <strong>EVote</strong>
//             </a>

//             <div className="dp-nav-right">
//               <div className="dp-nav-user">
//                 <div className="dp-avatar">
//                   {prenom[0]?.toUpperCase()}{nom[0]?.toUpperCase()}
//                 </div>
//                 <div>
//                   <p className="dp-nav-name">{prenom} {nom}</p>
//                   <p className="dp-nav-role">
//                     <FiShield size={10} /> Candidat approuvé
//                   </p>
//                 </div>
//               </div>
//               <button onClick={handleLogout} className="dp-logout-btn">
//                 <FiLogOut size={14} />
//                 <span>Déconnexion</span>
//               </button>
//             </div>
//           </div>
//         </nav>

//         <main className="dp-main">

//           {/* ── Hero ─────────────────────────────────────────────────────── */}
//           <motion.div
//             initial={{ opacity: 0, y: 24 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: .6, ease: [0.22, 1, 0.36, 1] }}
//           >
//             <div className="dp-hero">
//               {/* Décoration hero */}
//               <div className="dp-hero-deco dp-hero-deco-1" />
//               <div className="dp-hero-deco dp-hero-deco-2" />
//               <div className="dp-hero-deco dp-hero-deco-3" />

//               <div className="dp-hero-inner">
//                 <div className="dp-hero-left">
//                   <div className="dp-hero-badge">
//                     <FiStar size={12} /> Espace candidat
//                   </div>
//                   <h1 className="dp-hero-title">
//                     Bonjour,<br />
//                     <span className="dp-hero-name">{prenom} {nom}</span>
//                   </h1>
//                   {data && (
//                     <div className="dp-hero-election">
//                       <FiCalendar size={13} />
//                       <span>{data.candidat.election_titre}</span>
//                     </div>
//                   )}
//                   {data && (
//                     <div className="dp-hero-dates">
//                       {fmtShort(data.candidat.date_debut)} → {fmtShort(data.candidat.date_fin)}
//                     </div>
//                   )}
//                 </div>

//                 {/* Rang en grand */}
//                 <div className="dp-hero-rank">
//                   <div className="dp-rank-circle">
//                     <span className="dp-rank-label">Rang</span>
//                     <span className="dp-rank-val">
//                       {myRank <= 3 ? MEDALS[myRank - 1] : `#${myRank}`}
//                     </span>
//                   </div>
//                   <p className="dp-rank-sub">sur {data?.classement?.length} candidats</p>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//           {/* ── Stats rapides ─────────────────────────────────────────────── */}
//           <div className="dp-stats-grid">
//             {[
//               {
//                 icon: <Vote size={22} />,
//                 val: myVotes,
//                 label: "Votes reçus",
//                 color: "teal",
//                 delay: 0.05,
//               },
//               {
//                 icon: <FiTrendingUp size={22} />,
//                 val: `${myPct}%`,
//                 label: "Part des votes",
//                 color: "indigo",
//                 delay: 0.10,
//               },
//               {
//                 icon: <Users size={22} />,
//                 val: data?.classement?.length ?? 0,
//                 label: "Candidats en lice",
//                 color: "amber",
//                 delay: 0.15,
//               },
//               {
//                 icon: <BarChart3 size={22} />,
//                 val: total,
//                 label: "Votes totaux",
//                 color: "rose",
//                 delay: 0.20,
//               },
//             ].map((s, i) => (
//               <motion.div
//                 key={i}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: s.delay, duration: .5 }}
//                 className={`dp-stat-card dp-stat-card--${s.color}`}
//               >
//                 <div className="dp-stat-icon">{s.icon}</div>
//                 <p className="dp-stat-val">{s.val}</p>
//                 <p className="dp-stat-label">{s.label}</p>
//               </motion.div>
//             ))}
//           </div>

//           {/* ── Tabs ─────────────────────────────────────────────────────── */}
//           <motion.div
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.25, duration: .5 }}
//           >
//             <div className="dp-tabs">
//               {[
//                 { id: "classement", label: "Classement",  icon: <Trophy size={15} /> },
//                 { id: "votes",      label: `Mes votes (${myVotes})`, icon: <FiCheckCircle size={15} /> },
//                 { id: "profil",     label: "Mon profil",  icon: <FiUser size={15} /> },
//               ].map(tab => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`dp-tab ${activeTab === tab.id ? "dp-tab--active" : ""}`}
//                 >
//                   {tab.icon} {tab.label}
//                 </button>
//               ))}
//             </div>

//             {/* ── Contenu tab ───────────────────────────────────────────── */}
//             <AnimatePresence mode="wait">
//               <motion.div
//                 key={activeTab}
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: .25 }}
//               >

//                 {/* ═══ Tab CLASSEMENT ════════════════════════════════════ */}
//                 {activeTab === "classement" && (
//                   <div className="dp-card">
//                     <div className="dp-card-header">
//                       <h3 className="dp-card-title">
//                         <Trophy size={18} color="#f59e0b" />
//                         Classement en temps réel
//                       </h3>
//                       <span className="dp-card-badge">
//                         Mis à jour en continu
//                       </span>
//                     </div>

//                     <div className="dp-ranking-list">
//                       {data?.classement?.map((c, idx) => {
//                         const pct  = maxVotes > 0
//                           ? Math.round((Number(c.nb_votes) / maxVotes) * 100)
//                           : 0;
//                         const isMe = c.id === data.candidat.id;
//                         return (
//                           <motion.div
//                             key={c.id}
//                             initial={{ opacity: 0, x: -16 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             transition={{ delay: idx * .04 }}
//                             className={`dp-rank-row ${isMe ? "dp-rank-row--me" : ""}`}
//                           >
//                             {/* Position */}
//                             <div className={`dp-rank-pos ${idx === 0 ? "dp-rank-pos--gold" : idx === 1 ? "dp-rank-pos--silver" : idx === 2 ? "dp-rank-pos--bronze" : ""}`}>
//                               {getMedal(idx)}
//                             </div>

//                             {/* Infos candidat */}
//                             <div className="dp-rank-info">
//                               <p className="dp-rank-name">
//                                 {c.prenom} {c.nom}
//                                 {isMe && <span className="dp-rank-me-tag">← vous</span>}
//                               </p>
//                               {/* Barre progression */}
//                               <div className="dp-progress-track">
//                                 <motion.div
//                                   className={`dp-progress-fill ${isMe ? "dp-progress-fill--me" : ""}`}
//                                   initial={{ width: 0 }}
//                                   animate={{ width: `${pct}%` }}
//                                   transition={{ duration: .9, ease: "easeOut", delay: idx * .04 + .1 }}
//                                 />
//                               </div>
//                             </div>

//                             {/* Votes */}
//                             <div className="dp-rank-votes">
//                               <span className="dp-rank-votes-num">{c.nb_votes}</span>
//                               <span className="dp-rank-votes-label">votes</span>
//                             </div>
//                           </motion.div>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}

//                 {/* ═══ Tab VOTES ════════════════════════════════════════ */}
//                 {activeTab === "votes" && (
//                   <div className="dp-card">
//                     <div className="dp-card-header">
//                       <h3 className="dp-card-title">
//                         <FiCheckCircle size={18} color="#22c55e" />
//                         Votes reçus
//                       </h3>
//                       <span className="dp-card-badge dp-card-badge--green">
//                         {myVotes} vote{myVotes > 1 ? "s" : ""}
//                       </span>
//                     </div>

//                     {myVotes === 0 ? (
//                       <div className="dp-empty">
//                         <Vote size={40} color="#cbd5e1" />
//                         <p>Aucun vote reçu pour l'instant.</p>
//                         <p style={{ fontSize: 13, color: "#94a3b8" }}>
//                           Partagez votre profil pour recevoir vos premiers votes !
//                         </p>
//                       </div>
//                     ) : (
//                       <div className="dp-votes-list">
//                         {data?.votes?.map((v, i) => (
//                           <motion.div
//                             key={i}
//                             initial={{ opacity: 0, x: -12 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             transition={{ delay: i * .04 }}
//                             className="dp-vote-row"
//                           >
//                             <div className="dp-vote-dot" />
//                             <div className="dp-vote-info">
//                               <span className="dp-vote-name">
//                                 {v.nom_electeur || "Électeur anonyme"}
//                               </span>
//                             </div>
//                             <div className="dp-vote-time">
//                               <FiClock size={11} />
//                               {fmt(v.created_at)}
//                             </div>
//                           </motion.div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* ═══ Tab PROFIL ═══════════════════════════════════════ */}
//                 {activeTab === "profil" && data && (
//                   <div className="dp-card">
//                     <div className="dp-card-header">
//                       <h3 className="dp-card-title">
//                         <FiUser size={18} color="#6366f1" />
//                         Mon profil candidat
//                       </h3>
//                     </div>

//                     <div className="dp-profil-grid">
//                       {/* Avatar + infos principales */}
//                       <div className="dp-profil-left">
//                         <div className="dp-profil-avatar">
//                           {data.candidat.prenom[0]?.toUpperCase()}
//                           {data.candidat.nom[0]?.toUpperCase()}
//                         </div>
//                         <p className="dp-profil-fullname">
//                           {data.candidat.prenom} {data.candidat.nom}
//                         </p>
//                         <span className="dp-profil-statut">
//                           <FiCheckCircle size={12} /> Candidature approuvée
//                         </span>
//                       </div>

//                       {/* Détails */}
//                       <div className="dp-profil-right">
//                         {[
//                           { icon: <FiMail size={14} />,    label: "Email",      val: data.candidat.email     || "—" },
//                           { icon: <FiPhone size={14} />,   label: "Téléphone",  val: data.candidat.telephone || "—" },
//                           { icon: <FiCalendar size={14}/>, label: "Candidature",val: fmtShort(data.candidat.created_at) },
//                         ].map((row, i) => (
//                           <div key={i} className="dp-profil-row">
//                             <div className="dp-profil-row-icon">{row.icon}</div>
//                             <div>
//                               <p className="dp-profil-row-label">{row.label}</p>
//                               <p className="dp-profil-row-val">{row.val}</p>
//                             </div>
//                           </div>
//                         ))}

//                         {/* Bio */}
//                         {data.candidat.bio && (
//                           <div className="dp-profil-bio">
//                             <p className="dp-profil-row-label">Bio / Programme</p>
//                             <p className="dp-profil-bio-text">{data.candidat.bio}</p>
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     {/* Infos élection */}
//                     <div className="dp-election-card">
//                       <div className="dp-election-card-header">
//                         <FiCalendar size={14} />
//                         <span>Élection associée</span>
//                       </div>
//                       <p className="dp-election-titre">{data.candidat.election_titre}</p>
//                       <div className="dp-election-dates">
//                         <span>Du {fmtShort(data.candidat.date_debut)}</span>
//                         <span className="dp-election-sep">→</span>
//                         <span>au {fmtShort(data.candidat.date_fin)}</span>
//                       </div>
//                       <span className={`dp-election-statut ${
//                         data.candidat.election_statut === "EN_COURS"
//                           ? "dp-election-statut--green"
//                           : data.candidat.election_statut === "TERMINEE"
//                           ? "dp-election-statut--gray"
//                           : "dp-election-statut--amber"
//                       }`}>
//                         {data.candidat.election_statut === "EN_COURS"  && "● En cours"}
//                         {data.candidat.election_statut === "TERMINEE"  && "✓ Terminée"}
//                         {data.candidat.election_statut === "APPROUVEE" && "✓ Approuvée"}
//                         {!["EN_COURS","TERMINEE","APPROUVEE"].includes(data.candidat.election_statut)
//                           && data.candidat.election_statut}
//                       </span>
//                     </div>
//                   </div>
//                 )}
//               </motion.div>
//             </AnimatePresence>
//           </motion.div>
//         </main>
//       </div>
//     </>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const STYLES = `
// @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

// :root {
//   --font-body:  'Sora', sans-serif;
//   --font-mono:  'JetBrains Mono', monospace;

//   --teal-50:   #f0fdfa; --teal-100: #ccfbf1; --teal-200: #99f6e4;
//   --teal-400:  #2dd4bf; --teal-500: #14b8a6; --teal-600: #0d9488;
//   --teal-700:  #0f766e; --teal-800: #115e59; --teal-900: #134e4a;

//   --indigo-50: #eef2ff; --indigo-100: #e0e7ff; --indigo-500: #6366f1;
//   --indigo-600: #4f46e5;

//   --bg:     #f0fdf9;
//   --surface:#ffffff;
//   --border: #d1fae5;
//   --muted:  #64748b;
//   --text:   #0f2a26;
// }

// *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

// /* ── Root ─────────────────────────────────────────────────────────────────── */
// .dp-root {
//   min-height: 100vh;
//   font-family: var(--font-body);
//   background: var(--bg);
//   position: relative;
//   overflow-x: hidden;
// }

// /* ── Fond décoratif ───────────────────────────────────────────────────────── */
// .dp-bg-mesh {
//   position: fixed; inset: 0; z-index: 0; pointer-events: none;
//   background:
//     radial-gradient(ellipse 700px 500px at 10% 0%,   rgba(13,148,136,.12) 0%, transparent 70%),
//     radial-gradient(ellipse 500px 400px at 90% 100%, rgba(99,102,241,.08) 0%, transparent 70%),
//     radial-gradient(ellipse 400px 300px at 60% 40%,  rgba(245,158,11,.05) 0%, transparent 70%);
// }
// .dp-bg-grid {
//   position: fixed; inset: 0; z-index: 0; pointer-events: none;
//   background-image:
//     linear-gradient(rgba(13,148,136,.05) 1px, transparent 1px),
//     linear-gradient(90deg, rgba(13,148,136,.05) 1px, transparent 1px);
//   background-size: 40px 40px;
// }

// /* ── Loader ───────────────────────────────────────────────────────────────── */
// .dp-loader {
//   width: 40px; height: 40px; border-radius: 50%;
//   border: 3px solid var(--teal-100);
//   border-top-color: var(--teal-600);
//   animation: dp-spin .8s linear infinite;
//   margin: 0 auto;
// }
// @keyframes dp-spin { to { transform: rotate(360deg); } }

// /* ── Navbar ───────────────────────────────────────────────────────────────── */
// .dp-nav {
//   position: sticky; top: 0; z-index: 100;
//   background: rgba(240,253,250,.92);
//   backdrop-filter: blur(16px);
//   border-bottom: 1px solid var(--teal-200);
//   box-shadow: 0 1px 20px rgba(13,148,136,.08);
// }
// .dp-nav-inner {
//   max-width: 900px; margin: 0 auto; padding: 0 24px;
//   height: 64px; display: flex; align-items: center; justify-content: space-between;
// }
// .dp-logo {
//   display: flex; align-items: center; gap: 8px;
//   text-decoration: none; font-size: 18px; font-weight: 800;
//   color: var(--teal-700); letter-spacing: -0.5px;
// }
// .dp-logo-icon { font-size: 22px; }
// .dp-nav-right { display: flex; align-items: center; gap: 16px; }
// .dp-nav-user { display: flex; align-items: center; gap: 10px; }
// .dp-avatar {
//   width: 36px; height: 36px; border-radius: 10px;
//   background: linear-gradient(135deg, var(--teal-500), var(--teal-700));
//   color: white; display: flex; align-items: center; justify-content: center;
//   font-size: 12px; font-weight: 700; letter-spacing: .5px; flex-shrink: 0;
// }
// .dp-nav-name { font-size: 13px; font-weight: 700; color: var(--text); line-height: 1.2; }
// .dp-nav-role {
//   display: flex; align-items: center; gap: 4px;
//   font-size: 11px; color: var(--teal-600); font-weight: 600;
// }
// .dp-logout-btn {
//   display: inline-flex; align-items: center; gap: 6px;
//   padding: 8px 14px; border-radius: 10px;
//   border: 1.5px solid #fecaca; background: white;
//   color: #dc2626; font-size: 13px; font-weight: 600;
//   font-family: var(--font-body); cursor: pointer; transition: all .15s;
// }
// .dp-logout-btn:hover { background: #fef2f2; transform: translateY(-1px); }

// /* ── Main ─────────────────────────────────────────────────────────────────── */
// .dp-main {
//   position: relative; z-index: 1;
//   max-width: 900px; margin: 0 auto;
//   padding: 32px 24px 80px;
//   display: flex; flex-direction: column; gap: 24px;
// }

// /* ── Hero ─────────────────────────────────────────────────────────────────── */
// .dp-hero {
//   background: linear-gradient(135deg, var(--teal-700) 0%, var(--teal-600) 50%, #0d8a80 100%);
//   border-radius: 28px; padding: 40px 40px;
//   position: relative; overflow: hidden;
//   box-shadow: 0 16px 60px rgba(13,148,136,.30);
// }
// .dp-hero-deco {
//   position: absolute; border-radius: 50%; pointer-events: none;
// }
// .dp-hero-deco-1 {
//   width: 320px; height: 320px; top: -120px; right: -80px;
//   background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
// }
// .dp-hero-deco-2 {
//   width: 180px; height: 180px; bottom: -60px; left: 40%;
//   background: rgba(255,255,255,.06);
// }
// .dp-hero-deco-3 {
//   width: 80px; height: 80px; top: 20px; left: 200px;
//   background: rgba(255,255,255,.10);
// }
// .dp-hero-inner {
//   position: relative; z-index: 1;
//   display: flex; align-items: center; justify-content: space-between;
//   gap: 24px; flex-wrap: wrap;
// }
// .dp-hero-badge {
//   display: inline-flex; align-items: center; gap: 6px;
//   background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.28);
//   color: white; padding: 4px 14px; border-radius: 999px;
//   font-size: 11px; font-weight: 700; letter-spacing: .6px;
//   text-transform: uppercase; margin-bottom: 14px;
// }
// .dp-hero-title {
//   font-size: 28px; font-weight: 800; color: rgba(255,255,255,.75);
//   line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 12px;
// }
// .dp-hero-name { color: white; display: block; font-size: 32px; }
// .dp-hero-election {
//   display: inline-flex; align-items: center; gap: 7px;
//   background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22);
//   color: white; padding: 6px 14px; border-radius: 10px;
//   font-size: 13px; font-weight: 600; margin-bottom: 8px;
// }
// .dp-hero-dates {
//   font-size: 12px; color: rgba(255,255,255,.65); margin-top: 4px;
//   font-family: var(--font-mono);
// }

// /* Rang hero */
// .dp-hero-rank { text-align: center; flex-shrink: 0; }
// .dp-rank-circle {
//   width: 100px; height: 100px; border-radius: 50%;
//   background: rgba(255,255,255,.18); border: 2px solid rgba(255,255,255,.35);
//   display: flex; flex-direction: column; align-items: center;
//   justify-content: center; backdrop-filter: blur(8px);
//   box-shadow: 0 8px 32px rgba(0,0,0,.15);
// }
// .dp-rank-label {
//   font-size: 10px; color: rgba(255,255,255,.7); font-weight: 700;
//   text-transform: uppercase; letter-spacing: .8px;
// }
// .dp-rank-val { font-size: 28px; line-height: 1.1; }
// .dp-rank-sub { font-size: 11px; color: rgba(255,255,255,.6); margin-top: 8px; }

// /* ── Stats grid ───────────────────────────────────────────────────────────── */
// .dp-stats-grid {
//   display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
// }
// .dp-stat-card {
//   background: white; border-radius: 18px; padding: 20px;
//   border: 1px solid transparent;
//   box-shadow: 0 2px 12px rgba(0,0,0,.04);
//   text-align: center; transition: transform .2s, box-shadow .2s;
// }
// .dp-stat-card:hover { transform: translateY(-3px); box-shadow: 0 6px 24px rgba(0,0,0,.08); }

// .dp-stat-card--teal   { border-color: var(--teal-200);  }
// .dp-stat-card--indigo { border-color: #c7d2fe; }
// .dp-stat-card--amber  { border-color: #fde68a; }
// .dp-stat-card--rose   { border-color: #fecdd3; }

// .dp-stat-icon {
//   width: 44px; height: 44px; border-radius: 12px;
//   display: flex; align-items: center; justify-content: center;
//   margin: 0 auto 10px;
// }
// .dp-stat-card--teal   .dp-stat-icon { background: var(--teal-50);  color: var(--teal-600);  }
// .dp-stat-card--indigo .dp-stat-icon { background: #eef2ff; color: #4f46e5; }
// .dp-stat-card--amber  .dp-stat-icon { background: #fffbeb; color: #d97706; }
// .dp-stat-card--rose   .dp-stat-icon { background: #fff1f2; color: #e11d48; }

// .dp-stat-val   { font-size: 26px; font-weight: 800; color: var(--text); margin: 0 0 4px; }
// .dp-stat-label { font-size: 11.5px; color: var(--muted); font-weight: 500; }

// /* ── Tabs ─────────────────────────────────────────────────────────────────── */
// .dp-tabs {
//   display: flex; gap: 6px; margin-bottom: 16px;
//   background: white; padding: 6px; border-radius: 16px;
//   border: 1px solid var(--border); width: fit-content;
//   box-shadow: 0 2px 10px rgba(0,0,0,.04);
// }
// .dp-tab {
//   display: inline-flex; align-items: center; gap: 7px;
//   padding: 9px 20px; border-radius: 11px; border: none;
//   background: transparent; color: var(--muted);
//   font-size: 13px; font-weight: 600; font-family: var(--font-body);
//   cursor: pointer; transition: all .18s;
// }
// .dp-tab:hover { background: var(--teal-50); color: var(--teal-700); }
// .dp-tab--active {
//   background: linear-gradient(135deg, var(--teal-600), var(--teal-500));
//   color: white;
//   box-shadow: 0 4px 14px rgba(13,148,136,.30);
// }

// /* ── Card générique ───────────────────────────────────────────────────────── */
// .dp-card {
//   background: white; border-radius: 22px;
//   border: 1px solid #f0f0f0;
//   box-shadow: 0 2px 16px rgba(0,0,0,.04);
//   padding: 28px;
// }
// .dp-card-header {
//   display: flex; align-items: center; justify-content: space-between;
//   margin-bottom: 22px; flex-wrap: wrap; gap: 10px;
// }
// .dp-card-title {
//   display: flex; align-items: center; gap: 9px;
//   font-size: 16px; font-weight: 800; color: var(--text);
// }
// .dp-card-badge {
//   display: inline-flex; align-items: center; gap: 5px;
//   padding: 4px 12px; border-radius: 999px;
//   background: var(--teal-50); border: 1px solid var(--teal-200);
//   color: var(--teal-700); font-size: 11px; font-weight: 700;
// }
// .dp-card-badge--green {
//   background: #f0fdf4; border-color: #bbf7d0; color: #15803d;
// }

// /* ── Classement ───────────────────────────────────────────────────────────── */
// .dp-ranking-list { display: flex; flex-direction: column; gap: 10px; }
// .dp-rank-row {
//   display: flex; align-items: center; gap: 14px;
//   padding: 14px 16px; border-radius: 14px;
//   background: #fafafa; border: 1px solid #f0f0f0;
//   transition: all .18s;
// }
// .dp-rank-row:hover { transform: translateX(4px); }
// .dp-rank-row--me {
//   background: var(--teal-50) !important;
//   border: 2px solid var(--teal-400) !important;
//   box-shadow: 0 4px 20px rgba(13,148,136,.12);
// }
// .dp-rank-pos {
//   width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
//   display: flex; align-items: center; justify-content: center;
//   font-size: 15px; font-weight: 800; background: #f1f5f9;
//   color: #64748b;
// }
// .dp-rank-pos--gold   { background: #fef9c3; }
// .dp-rank-pos--silver { background: #f1f5f9; }
// .dp-rank-pos--bronze { background: #fef3c7; }

// .dp-rank-info { flex: 1; min-width: 0; }
// .dp-rank-name {
//   font-size: 14px; font-weight: 700; color: var(--text);
//   margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
// }
// .dp-rank-row--me .dp-rank-name { color: var(--teal-800); }
// .dp-rank-me-tag {
//   font-size: 11px; color: var(--teal-600); font-weight: 600; margin-left: 8px;
//   font-family: var(--font-mono);
// }
// .dp-progress-track {
//   height: 5px; background: #e2e8f0; border-radius: 999px; overflow: hidden;
// }
// .dp-progress-fill { height: 100%; background: #c7d2fe; border-radius: 999px; }
// .dp-progress-fill--me {
//   background: linear-gradient(90deg, var(--teal-500), var(--teal-400));
// }
// .dp-rank-votes { text-align: right; flex-shrink: 0; }
// .dp-rank-votes-num {
//   display: block; font-size: 18px; font-weight: 900; color: var(--teal-700);
//   font-family: var(--font-mono);
// }
// .dp-rank-row--me .dp-rank-votes-num { color: var(--teal-700); }
// .dp-rank-votes-label { font-size: 11px; color: var(--muted); }

// /* ── Votes list ───────────────────────────────────────────────────────────── */
// .dp-votes-list { display: flex; flex-direction: column; gap: 8px; }
// .dp-vote-row {
//   display: flex; align-items: center; gap: 12px;
//   padding: 12px 14px; background: #fafafa;
//   border: 1px solid #f0f0f0; border-radius: 12px;
//   transition: background .15s;
// }
// .dp-vote-row:hover { background: var(--teal-50); }
// .dp-vote-dot {
//   width: 8px; height: 8px; border-radius: 50%;
//   background: #22c55e; flex-shrink: 0;
// }
// .dp-vote-info { flex: 1; }
// .dp-vote-name { font-size: 14px; font-weight: 600; color: var(--text); }
// .dp-vote-time {
//   display: flex; align-items: center; gap: 4px;
//   font-size: 11.5px; color: var(--muted); white-space: nowrap;
//   font-family: var(--font-mono);
// }

// /* ── Vide ─────────────────────────────────────────────────────────────────── */
// .dp-empty {
//   text-align: center; padding: 48px 24px;
//   display: flex; flex-direction: column; align-items: center; gap: 10px;
//   color: #94a3b8; font-size: 14px;
// }

// /* ── Profil ───────────────────────────────────────────────────────────────── */
// .dp-profil-grid {
//   display: grid; grid-template-columns: 200px 1fr; gap: 28px;
//   margin-bottom: 24px;
// }
// .dp-profil-left { text-align: center; }
// .dp-profil-avatar {
//   width: 80px; height: 80px; border-radius: 20px;
//   background: linear-gradient(135deg, var(--teal-500), var(--teal-700));
//   color: white; display: flex; align-items: center; justify-content: center;
//   font-size: 24px; font-weight: 800; margin: 0 auto 14px;
//   box-shadow: 0 8px 24px rgba(13,148,136,.25);
// }
// .dp-profil-fullname {
//   font-size: 17px; font-weight: 800; color: var(--text); margin-bottom: 8px;
// }
// .dp-profil-statut {
//   display: inline-flex; align-items: center; gap: 5px;
//   padding: 4px 12px; border-radius: 999px;
//   background: #f0fdf4; border: 1px solid #bbf7d0;
//   color: #15803d; font-size: 11px; font-weight: 700;
// }
// .dp-profil-right { display: flex; flex-direction: column; gap: 14px; }
// .dp-profil-row {
//   display: flex; align-items: flex-start; gap: 12px;
//   padding: 12px 16px; background: #fafafa;
//   border: 1px solid #f0f0f0; border-radius: 12px;
// }
// .dp-profil-row-icon {
//   width: 32px; height: 32px; border-radius: 9px;
//   background: var(--teal-50); color: var(--teal-600);
//   display: flex; align-items: center; justify-content: center; flex-shrink: 0;
// }
// .dp-profil-row-label {
//   font-size: 11px; color: var(--muted); font-weight: 600;
//   text-transform: uppercase; letter-spacing: .5px; margin-bottom: 2px;
// }
// .dp-profil-row-val { font-size: 14px; font-weight: 600; color: var(--text); }
// .dp-profil-bio {
//   padding: 14px 16px; background: #fafafa;
//   border: 1px solid #f0f0f0; border-radius: 12px;
// }
// .dp-profil-bio-text {
//   font-size: 14px; color: #475569; line-height: 1.7; margin-top: 6px;
// }

// /* Élection card */
// .dp-election-card {
//   background: linear-gradient(135deg, var(--teal-50), #eef2ff);
//   border: 1px solid var(--teal-200); border-radius: 16px; padding: 20px 22px;
// }
// .dp-election-card-header {
//   display: flex; align-items: center; gap: 6px;
//   font-size: 11px; font-weight: 700; color: var(--teal-600);
//   text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px;
// }
// .dp-election-titre { font-size: 16px; font-weight: 800; color: var(--teal-900); margin-bottom: 8px; }
// .dp-election-dates {
//   display: flex; align-items: center; gap: 8px;
//   font-size: 13px; color: var(--muted); font-family: var(--font-mono); margin-bottom: 10px;
// }
// .dp-election-sep { color: var(--teal-400); }
// .dp-election-statut {
//   display: inline-block; padding: 4px 12px; border-radius: 999px;
//   font-size: 12px; font-weight: 700;
// }
// .dp-election-statut--green { background: #f0fdf4; color: #15803d; }
// .dp-election-statut--gray  { background: #f1f5f9; color: #64748b; }
// .dp-election-statut--amber { background: #fffbeb; color: #92400e; }

// /* ── Responsive ───────────────────────────────────────────────────────────── */
// @media (max-width: 700px) {
//   .dp-stats-grid { grid-template-columns: 1fr 1fr; }
//   .dp-profil-grid { grid-template-columns: 1fr; }
//   .dp-hero { padding: 28px 24px; }
//   .dp-hero-title { font-size: 22px; }
//   .dp-hero-name { font-size: 26px; }
//   .dp-rank-circle { width: 80px; height: 80px; }
//   .dp-rank-val { font-size: 22px; }
//   .dp-tabs { width: 100%; }
//   .dp-tab { flex: 1; justify-content: center; padding: 9px 12px; font-size: 12px; }
//   .dp-nav-user > div:last-child { display: none; }
// }
// @media (max-width: 480px) {
//   .dp-stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
//   .dp-hero-rank { display: none; }
//   .dp-card { padding: 20px 18px; }
// }
// `;
